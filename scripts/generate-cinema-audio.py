import asyncio
import json
import math
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


def clean_for_speech(text: str) -> str:
    """Translates software architecture acronyms & technical tokens into natural spoken Spanish."""
    replacements = [
        ("ARQPIXEL Academy", "Arc Píxel Academy"),
        ("ARQPIXEL", "Arc Píxel"),
        ("NexoShop", "Nexo Shop"),
        ("REQUIRES_REVIEW", "requiere revisión humana"),
        ("FNV-1a", "efe ene uve uno a"),
        ("C1/C2/C3", "ce uno, ce dos y ce tres"),
        ("C4", "ce cuatro"),
        ("DDD", "de de de"),
        ("SOLID", "sólid"),
        ("GoF", "Gang of Four"),
        ("CQRS", "ce cu erre ese"),
        ("ACID", "ácid"),
        ("SLOs", "ese ele os"),
        ("SLO", "ese ele o"),
        ("SLI", "ese ele i"),
        ("RPO/RTO", "erre pe o y erre te o"),
        ("p95", "pe noventa y cinco"),
        ("p99", "pe noventa y nueve"),
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
        ("checkout", "chekaut"),
        ("Frontend", "Fróntend"),
        ("Strangler", "Estrángler"),
        ("B01", "be cero uno"),
        ("B02", "be cero dos"),
        ("B03", "be cero tres"),
        ("I01", "i cero uno"),
        ("A01", "a cero uno"),
        ("A05", "a cero cinco"),
        ("S01", "ese cero uno"),
        ("S09", "ese cero nueve"),
        ("S18", "ese dieciocho"),
    ]
    out = text
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


async def main() -> None:
    AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
    decks = build_batch_1_scripts()
    print(f"🎙️ Generando {len(decks)} pistas de audio neuronal HD + mastering DSP con {FFMPEG}...")
    sem = asyncio.Semaphore(3)

    tasks = {
        deck_id: asyncio.create_task(build_deck_audio(deck_id, fname, scenes, sem))
        for deck_id, (fname, scenes) in decks.items()
    }

    manifest = {}
    for deck_id, task in tasks.items():
        manifest[deck_id] = await task

    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"\n✅ Audio manifest guardado en {MANIFEST_PATH} ({len(manifest)} videos listos)")


if __name__ == "__main__":
    asyncio.run(main())
