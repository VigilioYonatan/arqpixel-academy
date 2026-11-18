import asyncio
import json
import math
import re
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import edge_tts

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
AUDIO_OUT_DIR = ROOT / "public" / "audio"
MANIFEST_PATH = ROOT / "data" / "audio-manifest.json"


def find_ffmpeg() -> str:
    """Finds full-featured ffmpeg binary (prefers imageio_ffmpeg static v9.0+ with libmp3lame)."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


FFMPEG = find_ffmpeg()

# Natural neural voices (2-speaker NotebookLM / Tech Architecture Studio dynamic)
VOICE_HOST = "es-CO-SalomeNeural"      # Sofía: warm, clear, curious Tech Lead / Product Engineer
VOICE_MENTOR = "es-ES-AlvaroNeural"    # ArquiBot Mentor: deep, confident Principal Software Architect


_SPOKEN_DIGITS = {
    "1": "uno",
    "2": "dos",
    "3": "tres",
    "4": "cuatro",
    "5": "cinco",
    "6": "seis",
    "7": "siete",
    "8": "ocho",
    "9": "nueve",
}

_SPOKEN_TEENS = {
    "10": "diez",
    "11": "once",
    "12": "doce",
    "13": "trece",
    "14": "catorce",
    "15": "quince",
    "16": "dieciséis",
    "17": "diecisiete",
    "18": "dieciocho",
}

_SPOKEN_LETTERS = {"B": "be", "I": "i", "A": "a", "S": "ese"}


def clean_for_speech(text: str) -> str:
    """Translates software architecture acronyms & technical tokens into natural spoken Spanish."""
    out = re.sub(
        r"\b([BIAS])0([1-9])\b",
        lambda m: f"{_SPOKEN_LETTERS[m.group(1)]} cero {_SPOKEN_DIGITS[m.group(2)]}",
        text,
    )
    out = re.sub(
        r"\b([BIAS])(1[0-8])\b",
        lambda m: f"{_SPOKEN_LETTERS[m.group(1)]} {_SPOKEN_TEENS[m.group(2)]}",
        out,
    )
    replacements = [
        ("ARQPIXEL Academy", "Arc Píxel Academy"),
        ("ARQPIXEL", "Arc Píxel"),
        ("NexoShop", "Nexo Shop"),
        ("PostgreSQL", "Póstgres"),
        ("Clean Architecture", "Arquitectura Clean"),
        ("REQUIRES_REVIEW", "revisión humana obligatoria"),
        ("FNV-1a", "efe ene uve uno a"),
        ("C1/C2/C3", "ce uno, ce dos y ce tres"),
        ("C1", "ce uno"),
        ("C2", "ce dos"),
        ("C3", "ce tres"),
        ("C4", "ce cuatro"),
        ("DDD", "de de de"),
        ("SOLID", "sólid"),
        ("GoF", "Gang of Four"),
        ("MVC", "eme uve ce"),
        ("POO", "programación orientada a objetos"),
        ("SRP", "ese erre pe"),
        ("OCP", "o ce pe"),
        ("LSP", "ele ese pe"),
        ("ISP", "i ese pe"),
        ("DIP", "de i pe"),
        ("YAGNI", "yagni"),
        ("SDKs", "ese de kas"),
        ("SDK", "ese de ka"),
        ("API Gateway", "a pe i Guéitwei"),
        ("Factory Method", "Fáctori Mézod"),
        ("Abstract Factory", "Ábstract Fáctori"),
        ("Unit of Work", "Yúnit of Uork"),
        ("Aggregate Root", "Ágregueit Rut"),
        ("Bounded Contexts", "Báunded Cóntexts"),
        ("Bounded Context", "Báunded Cóntext"),
        ("Context Map", "Cóntext Map"),
        ("Anti-Corruption Layer", "capa anticorrupción"),
        ("NotImplemented", "no implementado"),
        ("IoC", "inversión de control"),
        ("Express", "Exprés"),
        ("Outbox", "Áutbox"),
        ("Facade", "Fasád"),
        ("Composite", "Cómposit"),
        ("Command", "Cómand"),
        ("patrón State", "patrón Estéit"),
        ("Repository", "Repósitori"),
        ("Strategy", "Estráteyi"),
        ("Adapter", "Adápter"),
        ("Factory", "Fáctori"),
        ("Builder", "Bílder"),
        ("Observer", "Obsérver"),
        ("Decorator", "Decoréitor"),
        ("Singleton", "Síngleton"),
        ("CQRS", "ce cu erre ese"),
        ("ACID", "ácid"),
        ("SLOs", "ese ele os"),
        ("SLO", "ese ele o"),
        ("SLI", "ese ele i"),
        ("RPO/RTO", "erre pe o y erre te o"),
        ("HTTPS", "ache te te pe ese"),
        ("HTTP", "ache te te pe"),
        ("DNS", "de ene ese"),
        ("TLS", "te ele ese"),
        ("POST", "post"),
        ("p95", "percentil noventa y cinco"),
        ("p99", "percentil noventa y nueve"),
        ("STRIDE", "estraid"),
        ("IDOR", "ídor"),
        ("DLQ", "cola de mensajes fallidos"),
        ("ADRs", "documentos a de erre"),
        ("ADR", "a de erre"),
        ("API", "a pe i"),
        ("SQL", "ese cu ele"),
        ("ORM", "o erre eme"),
        ("3D", "tres de"),
        ("trade-offs", "treid ofs"),
        ("trade-off", "treid of"),
        ("rollback", "rólbak"),
        ("fallback", "fólbak"),
        ("timeouts", "taim auts"),
        ("timeout", "taim aut"),
        ("setters", "séters"),
        ("mappers", "mápers"),
        ("checkout", "chekaut"),
        ("Frontend", "Fróntend"),
        ("Strangler", "Estrángler"),
    ]
    for old, new in replacements:
        out = out.replace(old, new)
    return out


def synthesize_ambient_bed(wav_path: Path, duration_sec: float, cue_times: list[float]) -> None:
    """
    Generates a warm studio-grade ambient underscore (24kHz stereo WAV):
    - Warm detuned D-minor9 / F-maj7 chord pad with gentle breathing LFO
    - Intro swell (first 1.0s), ducked warm bed under dialogue, subtle crystal chime on scene cues,
      and gentle outro resolution.
    """
    sample_rate = 24000
    total_samples = int((duration_sec + 0.6) * sample_rate)
    chord_freqs = [73.42, 110.00, 174.61, 220.00, 261.63, 329.63]
    cue_set = [t for t in cue_times if t > 0.2]

    buf = bytearray()
    two_pi = 2.0 * math.pi

    for n in range(total_samples):
        t = n / sample_rate
        if t < 0.35:
            env = (t / 0.35) * 0.11
        elif t < 1.1:
            env = 0.11 - ((t - 0.35) / 0.75) * 0.065
        elif t > duration_sec - 0.8:
            rem = max(0.0, (duration_sec + 0.55) - t) / 1.35
            env = 0.055 * (rem ** 1.4)
        else:
            env = 0.042 + 0.006 * math.sin(two_pi * 0.18 * t)

        pad_l = 0.0
        pad_r = 0.0
        for idx, f in enumerate(chord_freqs):
            detune = 1.0 + (0.0018 if idx % 2 == 0 else -0.0018)
            weight = 0.34 / (1.0 + idx * 0.35)
            s1 = math.sin(two_pi * f * t)
            s2 = math.sin(two_pi * f * detune * t + idx * 0.7)
            pad_l += weight * (0.65 * s1 + 0.35 * s2)
            pad_r += weight * (0.35 * s1 + 0.65 * s2)

        chime = 0.0
        if t < 0.9:
            chime += 0.05 * math.exp(-t * 4.2) * math.sin(two_pi * 587.33 * t)
            chime += 0.035 * math.exp(-t * 3.4) * math.sin(two_pi * 880.0 * t)
        for ct in cue_set:
            dt = t - ct
            if 0.0 <= dt < 0.55:
                chime += 0.032 * math.exp(-dt * 7.5) * math.sin(two_pi * 659.25 * dt)
                chime += 0.022 * math.exp(-dt * 6.0) * math.sin(two_pi * 987.77 * dt)

        left = max(-0.95, min(0.95, pad_l * env + chime))
        right = max(-0.95, min(0.95, pad_r * env + chime))
        buf += struct.pack("<hh", int(left * 32767), int(right * 32767))

    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(bytes(buf))


def probe_duration(media_path: Path) -> float:
    """Reads exact audio duration in seconds using ffmpeg stderr output."""
    proc = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", str(media_path)],
        capture_output=True,
        text=True,
    )
    out = proc.stderr or proc.stdout
    for line in out.splitlines():
        if "Duration:" in line:
            raw = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = raw.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 6.0


async def synth_turn(text: str, voice: str, rate: str, out_mp3: Path) -> float:
    comm = edge_tts.Communicate(clean_for_speech(text), voice=voice, rate=rate)
    await comm.save(str(out_mp3))
    return probe_duration(out_mp3)


async def build_deck_audio(
    deck_id: str,
    filename: str,
    scenes: list[dict],
    sem: asyncio.Semaphore,
) -> dict:
    """
    Synthesizes each scene's spoken turn, trims dead silence with natural breath pauses,
    mixes the warm ambient underscore underneath, applies studio EQ/compression/limiting,
    and returns exact measured cue timestamps.
    """
    async with sem:
        out_file = AUDIO_OUT_DIR / filename
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            scene_wavs: list[Path] = []
            cues: list[float] = []
            cursor = 0.45  # 450ms warm intro swell before first word

            for idx, sc in enumerate(scenes):
                cues.append(round(cursor, 2))
                raw_mp3 = tmp / f"s_{idx}.mp3"
                voice = VOICE_HOST if sc["speaker"] == "host" else VOICE_MENTOR
                rate = sc.get("rate", "+4%")
                await synth_turn(sc["spoken"], voice, rate, raw_mp3)

                turn_wav = tmp / f"s_{idx}.wav"
                subprocess.run(
                    [
                        FFMPEG,
                        "-y",
                        "-hide_banner",
                        "-loglevel",
                        "error",
                        "-i",
                        str(raw_mp3),
                        "-af",
                        "silenceremove=start_periods=1:start_threshold=-48dB:stop_periods=-1:stop_duration=0.22:stop_threshold=-48dB,apad=pad_dur=0.28",
                        "-ar",
                        "24000",
                        "-ac",
                        "2",
                        str(turn_wav),
                    ],
                    check=True,
                )
                dur = probe_duration(turn_wav)
                scene_wavs.append(turn_wav)
                cursor += dur

            total_voice_dur = round(cursor + 0.35, 2)

            lead_wav = tmp / "lead.wav"
            subprocess.run(
                [
                    FFMPEG,
                    "-y",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-f",
                    "lavfi",
                    "-i",
                    "anullsrc=r=24000:cl=stereo:d=0.45",
                    str(lead_wav),
                ],
                check=True,
            )

            concat_list = tmp / "concat.txt"
            lines = [f"file '{lead_wav.as_posix()}'"] + [
                f"file '{w.as_posix()}'" for w in scene_wavs
            ]
            concat_list.write_text("\n".join(lines), encoding="utf-8")

            voice_track = tmp / "voice_full.wav"
            subprocess.run(
                [
                    FFMPEG,
                    "-y",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-f",
                    "concat",
                    "-safe",
                    "0",
                    "-i",
                    str(concat_list),
                    "-c",
                    "copy",
                    str(voice_track),
                ],
                check=True,
            )

            bed_wav = tmp / "bed.wav"
            synthesize_ambient_bed(bed_wav, total_voice_dur, cues)

            subprocess.run(
                [
                    FFMPEG,
                    "-y",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-i",
                    str(voice_track),
                    "-i",
                    str(bed_wav),
                    "-filter_complex",
                    "[0:a]highpass=f=85,acompressor=threshold=-18dB:ratio=2.6:attack=10:release=140:makeup=3dB[v];"
                    "[v][1:a]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0:weights='1.0 0.65',alimiter=limit=0.95[out]",
                    "-map",
                    "[out]",
                    "-codec:a",
                    "libmp3lame",
                    "-b:a",
                    "80k",
                    "-ar",
                    "24000",
                    "-ac",
                    "2",
                    str(out_file),
                ],
                check=True,
            )

            final_dur = round(probe_duration(out_file), 2)
            size_kb = round(out_file.stat().st_size / 1024, 1)
            speakers = [sc["speaker"] for sc in scenes]
            print(f"  ✓ [{deck_id}] {filename} ({final_dur}s, {size_kb} KB)")
            return {
                "src": f"./audio/{filename}",
                "totalSec": final_dur,
                "cues": cues,
                "speakers": speakers,
            }


def build_batch_1_scripts() -> dict[str, tuple[str, list[dict]]]:
    """First 5 studio-mastered 2-voice HD capsules covering Home, Senior Overview, B01, B02 & Senior S01."""
    decks: dict[str, tuple[str, list[dict]]] = {}

    # 1. HOME-INTRO — Flagship 2-voice trailer on #/inicio
    decks["HOME-INTRO"] = (
        "home-intro.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "¿Alguna vez viste un sistema que empezó rápido, pero al tercer mes nadie se atreve a tocar una línea sin romper pagos o inventario en producción?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Bienvenido a ARQPIXEL Academy. Aquí no memorizas definiciones sueltas: visualizas límites C4, DDD y arquitectura Hexagonal para diseñar software que evoluciona sin colapsar.",
            },
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "¿Y cómo pasamos del diagrama bonito a defender decisiones reales frente a picos de tráfico, fallos de red y equipos bajo presión?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Practicarás en ocho laboratorios locales, cinco mundos 3D y dieciocho misiones de Senior Mode con semillas reproducibles y revisión humana honesta. Pulsa empezar y entrenemos criterio arquitectónico real.",
            },
        ],
    )

    # 2. SENIOR-OVERVIEW — Master briefing on #/senior
    decks["SENIOR-OVERVIEW"] = (
        "senior-overview.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Entramos a Senior Mode. Aquí ninguna respuesta es una receta mágica: cada decisión está atada a tráfico real, presupuesto, tamaño de equipo y objetivos SLO.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "En cada una de las dieciocho misiones resolverás seis retos conectados: diagnosticas la restricción dominante, modelas el grafo de componentes sin sobreingeniería y respondes a una crisis encadenada en Fase dos.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Nuestro motor verifica invariantes deterministas con total transparencia, mientras tu ADR conserva el estado REQUIRES_REVIEW para revisión humana experta, sin falsas aprobaciones automáticas.",
            },
        ],
    )

    # 3. CLASS-B01 — Module B01: ¿Qué es arquitectura de software?
    decks["CLASS-B01"] = (
        "class-b01.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "En nuestro primer módulo surge la duda clásica en NexoShop: ¿qué diferencia una decisión de arquitectura de cualquier cambio cotidiano en el código?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Cambiar el color de un botón es local y reversible en minutos. En cambio, definir las fronteras entre Frontend, API y Dominio condiciona cómo despliegas, cómo pruebas y cuánto cuesta evolucionar todo el sistema.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Una buena arquitectura no busca complejidad: protege los atributos de calidad clave y documenta cada trade-off antes de que revertirlo sea costoso. Ahora ponlo a prueba en el taller práctico.",
            },
        ],
    )

    # 4. CLASS-B02 — Module B02: Requisitos funcionales y no funcionales
    decks["CLASS-B02"] = (
        "class-b02.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Cuando negocio nos pide que el checkout de NexoShop sea rápido y seguro, ¿por qué no podemos diseñar arquitectura directamente con esa frase?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Porque un deseo ambiguo no se puede verificar. Como arquitecto traduces rápido en un escenario medible: el percentil noventa y cinco del checkout debe responder en menos de trescientos cincuenta milisegundos con quinientos usuarios concurrentes.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Los requisitos funcionales definen qué hace el producto, pero los atributos de calidad medibles son los que dictan la forma real de tu arquitectura.",
            },
        ],
    )

    # 5. SENIOR-S01 — Production Incident S01: Auditoría de monolito legado
    decks["SENIOR-S01"] = (
        "senior-s01.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Incidente de producción S01: Auditoría de monolito legado. La aplicación de ventas sufre regresiones cruzadas en cada despliegue y negocio exige seguir entregando valor sin detener la operación.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Evita la trampa de reescribir todo desde cero. Primero instrumentamos observabilidad para medir puntos calientes y aislamos el dominio crítico con fronteras explícitas y migración incremental Strangler.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Tu misión en el taller es modelar un grafo limpio con Dominio aislado y Observabilidad, dimensionar capacidad con margen seguro y defender tu plan de reversión en el ADR.",
            },
        ],
    )

    return decks


def build_batch_2_scripts() -> dict[str, tuple[str, list[dict]]]:
    """Next 5 studio-mastered 2-voice HD capsules (Videos 6–10): CLASS-B03, CLASS-B04, CLASS-B05, CLASS-B06 & SENIOR-S02."""
    decks: dict[str, tuple[str, list[dict]]] = {}

    # 6. CLASS-B03 — Module B03: Componentes, módulos y responsabilidades
    decks["CLASS-B03"] = (
        "class-b03.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "En NexoShop metimos catálogo, cálculo de impuestos y envío de correos dentro de un mismo gestor de pedidos, y ahora cualquier ajuste fiscal rompe el carrito. ¿Qué falló?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Falló la cohesión. La alta cohesión agrupa lo que cambia por el mismo motivo de negocio, mientras el bajo acoplamiento comunica Catálogo, Pedidos y Facturación mediante contratos mínimos sin dependencias circulares.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Tampoco caigas en el extremo opuesto de partir una regla simple en quince microarchivos vacíos. Mide tu diseño preguntando cuántos módulos debes tocar cuando cambia una sola regla de negocio.",
            },
        ],
    )

    # 7. CLASS-B04 — Module B04: Diagramas de arquitectura (Modelo C4)
    decks["CLASS-B04"] = (
        "class-b04.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Dibujamos un diagrama gigante donde aparece el cliente humano conectado con una flecha que dice usa hacia un índice de PostgreSQL, y ningún equipo entiende nada. ¿Cómo lo ordenamos?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "El modelo C4 funciona como un mapa con niveles de zoom según la audiencia. En Contexto C1 muestras personas y sistemas externos; al acercarte a Contenedores C2 revelas la web, la API, la base de datos y sus protocolos reales.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Prohíbe las flechas mudas que solo dicen usa. Etiqueta siempre la intención y el protocolo concreto, y evita dibujar a mano el nivel de código que cambia en cada entrega.",
            },
        ],
    )

    # 8. CLASS-B05 — Module B05: Cliente-servidor y web moderna
    decks["CLASS-B05"] = (
        "class-b05.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "En una compra web el navegador ya validó el stock y calculó el precio final con descuento. ¿Por qué no guardamos directamente ese total cuando llega el POST a pedidos?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Porque el navegador vive en un entorno controlado por terceros. Entre el clic del usuario y la base de datos cruzas DNS, TLS y red móvil inestable; la interfaz mejora la experiencia, pero solo el servidor y el dominio poseen autoridad.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Recibe únicamente identificadores y cantidades, recalcula importes en el backend y diseña pensando qué ocurre si la conexión se corta justo después de confirmar el pedido.",
            },
        ],
    )

    # 9. CLASS-B06 — Module B06: Arquitectura en capas e inversión de dependencias
    decks["CLASS-B06"] = (
        "class-b06.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Creamos cuatro carpetas llamadas Presentación, Aplicación, Dominio e Infraestructura, pero nuestras entidades de Dominio importan el ORM y leen cabeceras HTTP. ¿Eso sigue siendo arquitectura en capas?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Solo tienes cuatro carpetas, no fronteras reales. En Clean Architecture y Hexagonal las dependencias apuntan hacia adentro: el Dominio define puertos puros con acoplamiento saliente cero, y la Infraestructura se adapta a ellos.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Así ejecutas cientos de pruebas de negocio en milisegundos sin levantar bases de datos. Eso sí: aplica capas donde existan invariantes reales que proteger, no por burocracia en un script trivial.",
            },
        ],
    )

    # 10. SENIOR-S02 — Production Incident S02: SOLID bajo presión
    decks["SENIOR-S02"] = (
        "senior-s02.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Misión Senior S02: SOLID bajo presión. Comercial lanza campañas nuevas cada semana y cada cambio en la función de descuentos rompe planes antiguos en producción. ¿Congelamos campañas o creamos veinte clases abstractas?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Ni condicionales frágiles ni sobreingeniería especulativa. Aísla únicamente el eje real de variación detrás de una política de descuento componible, cubierta por pruebas de regresión y protegida con plan de rollback.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "En el taller conecta Dominio aislado y Plan de rollback sin añadir complejidad innecesaria, valida tus límites de capacidad y justifica en el ADR por qué descartaste abstracciones prematuras, sujeto a REQUIRES_REVIEW.",
            },
        ],
    )

    return decks


def build_batch_3_scripts() -> dict[str, tuple[str, list[dict]]]:
    """Next 5 studio-mastered 2-voice HD capsules (Videos 11–15): CLASS-B07, CLASS-B08, CLASS-B09, CLASS-B10 & SENIOR-S03."""
    decks: dict[str, tuple[str, list[dict]]] = {}

    # 11. CLASS-B07 — Module B07: MVC y separación de concerns
    decks["CLASS-B07"] = (
        "class-b07.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Adoptamos MVC en NexoShop, pero ahora el controlador de reservas valida cabeceras HTTP, calcula penalizaciones horarias y ejecuta consultas SQL directas. ¿Por qué nos cuesta tanto reutilizar esa lógica?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Porque cayó en el antipatrón del controlador obeso. MVC solo separa la entrega visual y la entrada HTTP, pero las reglas de negocio deben vivir en casos de uso y entidades reutilizables desde web, trabajos programados o línea de comandos.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Mantén el controlador delgado: traduce la petición, delega la decisión al dominio y devuelve la respuesta sin mezclar infraestructura ni trasladar todo el desorden a una clase utilitaria gigante.",
            },
        ],
    )

    # 12. CLASS-B08 — Module B08: POO para arquitectos
    decks["CLASS-B08"] = (
        "class-b08.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Para modelar pedidos VIP, envíos exprés y promociones internacionales creamos una jerarquía de herencia de doce niveles, y cada nueva combinación rompe las subclases vecinas. ¿Qué alternativa tenemos en POO?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Sustituye la herencia profunda por composición e interfaces pequeñas. En lugar de multiplicar subclases rígidas, inyecta políticas intercambiables de precios, impuestos y envío dentro de un servicio coordinador.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Además, evita objetos anémicos llenos de setters públicos que permiten estados inválidos. Encapsula las transiciones dentro de métodos del dominio que protejan siempre sus precondiciones.",
            },
        ],
    )

    # 13. CLASS-B09 — Module B09: Cohesión, acoplamiento y modularidad
    decks["CLASS-B09"] = (
        "class-b09.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Nuestro módulo contable importa colores de campañas promocionales de la interfaz, y cada vez que marketing cambia un banner tenemos que volver a probar y desplegar contabilidad. ¿Cómo evitamos ese arrastre?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Aplicando el principio de dependencias estables. Los módulos centrales que muchos consumen deben tener acoplamiento saliente mínimo y contratos estables, nunca depender de módulos volátiles de presentación.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Los bordes visuales cambian rápido y el núcleo monetario cambia lento. Publica únicamente contratos pequeños y explícitos entre módulos para contener el radio de impacto de cada entrega.",
            },
        ],
    )

    # 14. CLASS-B10 — Module B10: Introducción a SOLID
    decks["CLASS-B10"] = (
        "class-b10.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Al empezar a aplicar SOLID en el equipo surgió el debate: ¿debemos crear una interfaz por cada clase del proyecto, incluso para funciones internas que solo suman dos importes?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Nunca por dogma. SRP separa actores con distintos motivos de cambio, y DIP invierte dependencias justo en las fronteras de entrada y salida, como repositorios o pasarelas externas, para probar el negocio en aislamiento.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Crear interfaces vacías donde no existe variación ni infraestructura solo duplica archivos y oscurece la lectura. Usa SOLID como bisturí frente al cambio real, no como burocracia preventiva.",
            },
        ],
    )

    # 15. SENIOR-S03 — Production Incident S03: Selección de patrones GoF
    decks["SENIOR-S03"] = (
        "senior-s03.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Misión Senior S03: Integración multi-proveedor. NexoShop opera con pasarelas externas de notificaciones y pagos cuyos SDKs devuelven formatos y errores incompatibles, contaminando todos los casos de uso.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Aquí brillan Adapter y Strategy combinados con criterio: defines un único puerto del dominio, traduces cada SDK externo en su propio adaptador aislado e instrumentas observabilidad, timeouts y fallback controlado.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "En el taller modela Dominio aislado y Observabilidad, verifica contratos de error y latencia por proveedor y justifica en tu ADR por qué evitaste condicionales dispersos, quedando listo para REQUIRES_REVIEW.",
            },
        ],
    )

    return decks


def build_batch_4_scripts() -> dict[str, tuple[str, list[dict]]]:
    """Next 5 studio-mastered 2-voice HD capsules (Videos 16–20): CLASS-B11, CLASS-B12, CLASS-I01, CLASS-I02 & SENIOR-S04."""
    decks: dict[str, tuple[str, list[dict]]] = {}

    # 16. CLASS-B11 — Module B11: Introducción a patrones
    decks["CLASS-B11"] = (
        "class-b11.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Un compañero leyó un libro de patrones GoF y metió un Singleton global mutable para el carrito de compras, y ahora las pruebas fallan al azar y se cruzan datos entre usuarios. ¿Qué salió mal?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Aplicó un patrón sin diagnosticar las fuerzas del problema. Un patrón nunca es un adorno obligatorio: Strategy intercambia algoritmos, Adapter traduce contratos incompatibles y Observer desacopla notificaciones, siempre pagando una capa extra.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Antes de introducir cualquier patrón nombra qué dolor real resuelve, qué coste operativo añade y qué alternativa directa descartaste. Si una función simple basta, elige siempre la claridad.",
            },
        ],
    )

    # 17. CLASS-B12 — Module B12: Proyecto básico: App de reservas
    decks["CLASS-B12"] = (
        "class-b12.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Llegamos al proyecto integrador básico: una aplicación de reservas médicas. Si solo deshabilitamos el botón en el navegador, dos pacientes que pulsan al mismo segundo reservan el mismo consultorio. ¿Cómo lo blindamos?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Integrando todo lo aprendido en el nivel Básico: modelas contenedores C2 claros, validas la regla pura de solapamiento horario en el Dominio y respaldas la escritura con una restricción atómica en PostgreSQL.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Un diseño básico completo cierra con un ADR honesto donde declaras tus requisitos medibles, límites de módulos, riesgos de concurrencia y cómo verificarás que nunca ocurran reservas duplicadas.",
            },
        ],
    )

    # 18. CLASS-I01 — Module I01: SOLID aplicado
    decks["CLASS-I01"] = (
        "class-i01.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Abrimos el nivel Intermedio con un fallo real en producción: creamos un único repositorio gigante de pedidos, y cuando la réplica de solo lectura intenta implementarlo lanza errores de método NotImplemented. ¿Qué principio rompimos?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Rompiste ISP y LSP a la vez. Segrega contratos pequeños enfocados en cada consumidor, separando puertos de consulta y puertos de escritura para que cualquier implementación cumpla su promesa sin lanzar sorpresas en ejecución.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Recuerda además que invertir dependencias con DIP es diseñar contratos propiedad del dominio, no simplemente registrar veinte clases concretas en un contenedor IoC manteniendo acoplado el ORM.",
            },
        ],
    )

    # 19. CLASS-I02 — Module I02: Patrones creacionales
    decks["CLASS-I02"] = (
        "class-i02.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "En NexoShop creamos cupones y pedidos con constructores vacíos seguidos de ocho setters opcionales, y a mitad del flujo circulan pedidos con importe negativo y sin líneas. ¿Cómo garantizamos que nazcan válidos?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Encapsulando su nacimiento. Usa una fábrica de dominio o Factory Method cuando debas elegir e inicializar variantes válidas, y aplica Builder cuando ensambles configuraciones complejas paso a paso validando todo al construir.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Si un objeto solo tiene tres datos obligatorios, un constructor tipado o función factoría pura supera a un Builder ceremonioso de cien líneas. Ninguna entidad del dominio debe existir jamás en estado corrupto.",
            },
        ],
    )

    # 20. SENIOR-S04 — Production Incident S04: Clean vs Hexagonal
    decks["SENIOR-S04"] = (
        "senior-s04.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Misión Senior S04: Clean versus Hexagonal. El núcleo de clientes importa directamente objetos Request de Express e instancia el cliente de Prisma dentro del dominio, haciendo imposible probar reglas sin levantar servidor y base de datos.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Limpia la dirección de dependencias: extrae un caso de uso que reciba un comando validado, define un puerto de repositorio en el dominio e implementa Prisma y Express afuera como adaptadores reemplazables.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "En el taller conecta Dominio aislado y Base de datos respetando fronteras limpias, demuestra pruebas unitarias sin infraestructura y documenta tus trade-offs en el ADR bajo revisión humana REQUIRES_REVIEW.",
            },
        ],
    )

    return decks


def build_batch_5_scripts() -> dict[str, tuple[str, list[dict]]]:
    """Next 5 studio-mastered 2-voice HD capsules (Videos 21–25): CLASS-I03, CLASS-I04, CLASS-I05, CLASS-I06 & SENIOR-S05."""
    decks: dict[str, tuple[str, list[dict]]] = {}

    # 21. CLASS-I03 — Module I03: Patrones estructurales
    decks["CLASS-I03"] = (
        "class-i03.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Integramos un servicio legado de facturación y ahora treinta archivos de NexoShop importan cabeceras y códigos crudos de ese SDK externo. Si el proveedor actualiza su versión, ¿cómo evitamos editar medio sistema?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Aislando fronteras con patrones estructurales. Adapter traduce un contrato externo incompatible al puerto limpio de tu dominio, Facade ofrece una entrada simple sobre un subsistema complejo y Decorator envuelve métricas o tiempos sin tocar la regla central.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Úsalos con mesura: evita apilar siete Decorators anidados que oculten reintentos o mutaciones de estado y vuelvan imposible depurar una traza en producción.",
            },
        ],
    )

    # 22. CLASS-I04 — Module I04: Patrones de comportamiento
    decks["CLASS-I04"] = (
        "class-i04.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "En la tabla de pedidos tenemos tres booleanos sueltos: pagado, cancelado y enviado, y ayer apareció en producción un pedido marcado como pagado y cancelado al mismo tiempo. ¿Cómo cerramos esa brecha?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Reemplaza booleanos sueltos por una máquina de estados explícita o patrón State donde cada transición valida sus precondiciones. Combínalo con Strategy para métodos de pago intercambiables y Observer para notificar sin acoplar al emisor.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Distingue siempre comando de evento: Strategy ejecuta el algoritmo elegido hoy, mientras un evento notifica algo que ya ocurrió sin esconder cobros críticos en efectos secundarios invisibles.",
            },
        ],
    )

    # 23. CLASS-I05 — Module I05: Repository, Unit of Work y transacciones
    decks["CLASS-I05"] = (
        "class-i05.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Creamos un repositorio genérico por cada tabla de base de datos, y alguien insertó líneas de pedido directamente saltándose el recálculo del total y el límite máximo de unidades. ¿Por qué falló esa abstracción?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Porque un Repository se define por Aggregate Root, nunca por tabla hija suelta. El repositorio guarda la raíz completa y Unit of Work coordina una única transacción atómica entre el pedido, sus líneas y el registro Outbox.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Reserva la hidratación completa del agregado para comandos que mutan invariantes; para listados y paneles paginados usa proyecciones ligeras de solo lectura.",
            },
        ],
    )

    # 24. CLASS-I06 — Module I06: Clean Architecture
    decks["CLASS-I06"] = (
        "class-i06.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Renombramos nuestras carpetas a entidades, casos de uso y adaptadores, pero el caso de uso de aprobación devuelve códigos HTTP cuatrocientos veintidós y cabeceras de sesión. ¿Por qué no podemos reutilizarlo desde una cola?",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Porque renombrar carpetas no invierte dependencias. En Clean Architecture el caso de uso expresa verbos semánticos del negocio y devuelve resultados tipados del dominio, dejando que el controlador web o el consumidor de cola traduzcan su transporte.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "Verifica que el dominio tenga cero importaciones hacia infraestructura, pero evita duplicar cuatro mappers manuales idénticos en consultas simples donde una proyección tipada es suficiente.",
            },
        ],
    )

    # 25. SENIOR-S05 — Production Incident S05: DDD estratégico
    decks["SENIOR-S05"] = (
        "senior-s05.mp3",
        [
            {
                "speaker": "host",
                "rate": "+5%",
                "spoken": "Misión Senior S05: Conflicto en el marketplace. Catálogo, Inventario y Facturación comparten y mutan una misma entidad global llamada Producto, provocando bloqueos entre equipos y cálculos fiscales corruptos.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "La palabra producto significa cosas distintas en cada subdominio. Separa Bounded Contexts con propietario claro, expón contratos explícitos tras API Gateway y protege la integración mediante una Anti-Corruption Layer.",
            },
            {
                "speaker": "mentor",
                "rate": "+4%",
                "spoken": "En el taller modela Dominio aislado y API Gateway sin tablas globales compartidas, valida contratos entre contextos y documenta tu Context Map en el ADR para revisión humana REQUIRES_REVIEW.",
            },
        ],
    )

    return decks


async def main() -> None:
    force_regen = "--force" in sys.argv
    AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)

    existing_manifest: dict[str, dict] = {}
    if MANIFEST_PATH.exists() and not force_regen:
        try:
            existing_manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        except Exception:
            existing_manifest = {}

    decks = {
        **build_batch_1_scripts(),
        **build_batch_2_scripts(),
        **build_batch_3_scripts(),
        **build_batch_4_scripts(),
        **build_batch_5_scripts(),
    }
    print(f"🎙️ Verificando/generando {len(decks)} pistas de audio neuronal HD + mastering DSP con {FFMPEG}...")
    sem = asyncio.Semaphore(3)

    tasks: dict[str, asyncio.Task] = {}
    manifest: dict[str, dict] = {}

    for deck_id, (fname, scenes) in decks.items():
        cached = existing_manifest.get(deck_id)
        mp3_file = AUDIO_OUT_DIR / fname
        if (
            not force_regen
            and cached
            and mp3_file.exists()
            and mp3_file.stat().st_size > 20_000
            and len(cached.get("cues", [])) == len(scenes)
        ):
            print(f"  ↺ [{deck_id}] {fname} en caché ({cached['totalSec']}s)")
            manifest[deck_id] = cached
        else:
            tasks[deck_id] = asyncio.create_task(build_deck_audio(deck_id, fname, scenes, sem))

    for deck_id, task in tasks.items():
        manifest[deck_id] = await task

    ordered_manifest = {deck_id: manifest[deck_id] for deck_id in decks}
    MANIFEST_PATH.write_text(
        json.dumps(ordered_manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"\n✅ Audio manifest guardado en {MANIFEST_PATH} ({len(ordered_manifest)} videos listos)")


if __name__ == "__main__":
    asyncio.run(main())
