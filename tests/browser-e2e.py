#!/usr/bin/env python3
"""ARQPIXEL: browser integration checks without navigations blocked by sandbox.

Executes the real compiled ES modules in Chromium with a controlled, local-only
fetch/localStorage harness, without mocking the application logic. This is NOT
an HTTP/browser deployment E2E; hosting, CSP response headers, and URLs still
require independent validation. Requires Python Playwright and Chromium.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
ENTRY = [
    "engine.js",
    "mini-games.js",
    "c4-studio.js",
    "ddd-workshop.js",
    "lesson-senior.js",
    "senior-simulations.js",
    "senior-reviews.js",
    "senior-impact.js",
    "senior-devsecops.js",
    "senior-threats.js",
    "features/shared/constants/app.constants.js",
    "features/shared/schemas/schema-validator.js",
    "features/shared/schemas/assets-manifest.schema.js",
    "features/shared/ui/visual-clarity.js",
    "features/shared/ui/resilience-and-onboarding.js",
    "features/senior/constants/senior-decisions.constants.js",
    "features/senior/constants/senior-evolution.constants.js",
    "features/senior/schemas/senior.schema.js",
    "features/senior/schemas/senior-dossier.schema.js",
    "features/senior/senior-evolution-engine.js",
    "features/senior/senior-ux-views.js",
    "senior-suite.js",
    "features/curriculum/constants/curriculum.constants.js",
    "features/curriculum/schemas/curriculum.schema.js",
    "features/curriculum/schemas/lesson-enrichment.schema.js",
    "features/curriculum/constants/lesson-enrichments.constants.js",
    "features/curriculum/lesson-visuals.js",
    "features/curriculum/constants/lesson-workbench.constants.js",
    "features/curriculum/lesson-workbench.js",
    "features/cinema/constants/cinema.constants.js",
    "features/cinema/schemas/cinema.schema.js",
    "features/cinema/arquibot-storyboards.js",
    "features/cinema/arquibot-player.js",
    "features/labs/constants/labs.constants.js",
    "features/labs/constants/lab-fixtures.constants.js",
    "features/labs/lab-visual-diagnostics.js",
    "features/labs/advanced-labs.js",
    "features/labs/openapi-cdc-engine.js",
    "features/labs/cross-fault-saga-engine.js",
    "features/labs/capacity-stress-engine.js",
    "features/labs/p2-lab-panels.js",
    "features/minigames/three-arcade-stage.js",
    "features/projects/constants/projects.constants.js",
    "features/projects/schemas/projects.schema.js",
    "features/resources/constants/resources.constants.js",
    "features/profile/constants/profile.constants.js",
    "features/profile/schemas/settings.schema.js",
    "features/shared/backup-migrator.js",
    "features/shared/ui/interactive-components.js",
    "features/shared/ui/navigation-and-404.js",
    "features/curriculum/learning-path-map.js",
    "features/curriculum/specialization-detail.js",
    "features/curriculum/lesson-classroom.js",
    "features/projects/projects-workspace.js",
    "features/resources/resources-hub.js",
    "features/profile/profile-views.js",
    "app.js",
]


def bootstrap(browser, width=1440, height=900):
    page = browser.new_page(viewport={"width": width, "height": height}, accept_downloads=True)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.set_content('<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body><div id="app"></div></body></html>')
    page.add_style_tag(content=(DIST / "styles.css").read_text(encoding="utf-8"))
    catalogs = {path.name: path.read_text(encoding="utf-8") for path in (DIST / "data").glob("*.json")}
    page.evaluate("""data => {
        const values = new Map();
        Object.defineProperty(window, 'localStorage', { configurable: true, value: {
            get length() { return values.size; },
            key(i) { return [...values.keys()][i] ?? null; },
            getItem(k) { return values.get(k) ?? null; },
            setItem(k,v) { values.set(k, String(v)); },
            removeItem(k) { values.delete(k); },
            clear() { values.clear(); }
        }});
        window.__testStorage = () => Object.fromEntries(values);
        window.fetch = async input => {
            const name = String(input).split('/').at(-1);
            return { ok: Object.prototype.hasOwnProperty.call(data, name), json: async () => JSON.parse(data[name]) };
        };
        window.scrollTo = () => {};
    }""", catalogs)
    modules = {name: (DIST / name).read_text(encoding="utf-8") for name in ENTRY}
    page.evaluate("""async payload => {
        const { mods, order } = payload;
        const resolveRel = (base, rel) => {
            const parts = base.split('/').slice(0, -1);
            for (const seg of rel.split('/')) {
                if (!seg || seg === '.') continue;
                if (seg === '..') parts.pop();
                else parts.push(seg);
            }
            return parts.join('/');
        };
        const urls = {};
        for (const name of order) {
            const content = mods[name].replace(/from\\s+['"](\\.\\.?(?:\\/[^'"]+\\.js))['"]/g, (_full, rel) => {
                const key = resolveRel(name, rel);
                if (!urls[key]) throw Error(`Module not included: ${key} (from ${name})`);
                return `from '${urls[key]}'`;
            });
            urls[name] = URL.createObjectURL(new Blob([content], {type:'text/javascript'}));
        }
        window.__moduleUrls = urls;
        await import(urls['app.js']);
    }""", {"mods": modules, "order": ENTRY})
    page.locator(".app-shell").wait_for(timeout=6000)
    return page, errors


def go(page, path, selector):
    page.evaluate("path => { location.hash = '#/' + path; }", path)
    page.locator(selector).first.wait_for(timeout=4000)
    assert "No se pudo iniciar" not in page.locator("#app").inner_text(), path


def is_accessible_input(input_element):
    return input_element.evaluate("""el => Boolean(el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && document.querySelector(`label[for="${el.id}"]`)))""")


def check_full_senior(browser):
    page, errors = bootstrap(browser)
    try:
        assert "ARQPIXEL" in page.title()
        assert page.locator(".hero").count() == 1
        assert page.locator('a[href="#/rutas"]').count() > 0
        go(page, 'mapa', '.page-title')
        assert 'Mapa curricular' in page.locator('h1').inner_text()
        go(page, 'rutas', '.page-title')
        assert 'Rutas de aprendizaje' in page.locator('h1').inner_text()
        go(page, 'especializaciones', '.page-title')
        assert 'Especializaciones' in page.locator('h1').inner_text()
        for path in ['laboratorios', 'minijuegos', 'senior', 'recursos', 'recursos/adr', 'recursos/patrones/strategy', 'proyectos', 'proyectos/CAP-R06', 'rutas/R01', 'logros', 'ajustes', 'sobre', 'perfil']:
            go(page, path, '.page-title')
        for module in json.loads((DIST / 'data/modules.json').read_text()):
            go(page, f"modulo/{module['id']}", '.lesson-card')
            assert module['title'] in page.locator('body').inner_text(), module['id']
        for mission in json.loads((DIST / 'data/senior.json').read_text()):
            go(page, f"taller-senior/{mission['id']}", '#senior-suite')
            content = page.locator('#senior-suite').inner_text()
            for title in ['Architecture Builder','Incident Response','Contract / Code Review','Evaluar las 6 actividades', mission['id']]:
                assert title in content, (mission['id'], title)
            assert 'undefined' not in content and 'NaN' not in content, mission['id']
            assert 'THREAT MODELING / STRIDE' in content
        for lab in ['dependencias','c4','ddd','patterns','api','distributed','adr','incident']:
            go(page, f'laboratorio/{lab}', '.studio-card')
            assert 'No se pudo iniciar' not in page.locator('#app').inner_text(), lab
        for path in ['inicio','mapa','rutas','rutas/R03','aprender/I06','especializaciones','proyectos','proyectos/CAP-R06','laboratorios','minijuegos','senior','recursos','recursos/adr','recursos/patrones/strategy','logros','ajustes','sobre','perfil','taller-senior/S09','taller-senior/S11']:
            go(page, path, '.workspace')
            issues = page.evaluate('''() => ({
              inputs:[...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(el=>!el.closest('label')&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')&&!(el.id&&document.querySelector(`label[for="${el.id}"]`))).length,
              blankButtons:[...document.querySelectorAll('button')].filter(el=>!el.innerText.trim()&&!el.getAttribute('aria-label')).length,
              missingAlt:[...document.querySelectorAll('img')].filter(el=>!el.hasAttribute('alt')).length
            })''')
            assert not any(issues.values()), (path,issues)
        assert not errors, errors
        print('PASS: navegación Chromium: 36 lecciones, 18 talleres, 8 laboratorios y etiquetado básico')
    finally:
        page.close()


def check_senior_completion(browser):
    page, errors = bootstrap(browser)
    try:
        go(page, 'taller-senior/S09', '#senior-suite')
        page.locator('#suite-evaluate').click()
        assert 'Corrige' in page.locator('#suite-report').inner_text()
        assert 'arqpixel-progress-v1' not in page.evaluate('window.__testStorage()') or not json.loads(page.evaluate('window.__testStorage()["arqpixel-progress-v1"]')).get('missions')
        info = page.evaluate("""async () => {
            const s=await import(window.__moduleUrls['senior-suite.js']);
            const r=await import(window.__moduleUrls['senior-reviews.js']);
            const m={id:'S09',title:'',brief:'',decision:'',evidence:''};
            const p=s.missionPolicy(m,0);
            return {dx:p.diagnosisCorrect, incident:p.incidentCorrect, capacity:p.targetCapacity, required:p.required,
                review:r.codeReviewPolicy('S09',0).correct, traffic:p.scenario.traffic, slo:p.scenario.availability};
        }""")
        page.locator(f'input[name="suite-diagnosis"][value="{info["dx"]}"]').check()
        page.locator(f'input[name="suite-incident"][value="{info["incident"]}"]').check()
        page.locator(f'input[name="suite-review"][value="{info["review"]}"]').check()
        for part in info['required']:
            page.locator('[data-suite-arch]').evaluate_all("(elements, part) => {const el=elements.find(x=>x.dataset.suiteArch===part);if(!el)throw Error('Missing '+part);el.click()}", part)
        page.locator('#suite-edge-from').select_option(label=info['required'][0])
        page.locator('#suite-edge-to').select_option(label=info['required'][1])
        page.locator('#suite-add-edge').click()
        assert info['required'][0] in page.locator('#suite-graph').inner_text()
        page.locator('#suite-capacity').fill(str(info['capacity']))
        adr = (f"Contexto: tráfico {info['traffic']}; SLO {info['slo']}. "
               "La alternativa propuesta es aplicar idempotencia persistida y outbox transaccional. "
               "Riesgo principal: doble cobro y eventos perdidos ante fallos. "
               "Para verificar mediremos el número de cargos por pedido y ejecutaremos pruebas de reintentos. "
               "Se documenta plan de rollback, observabilidad de incidencias y límites del presupuesto.")
        page.locator('#suite-adr').fill(adr)
        page.locator('#suite-evaluate').click()
        feedback = page.locator('#suite-report').inner_text()
        assert '100' in feedback and 'REQUIRES_REVIEW' in feedback, feedback[:1000]
        storage = page.evaluate('window.__testStorage()')
        progress = json.loads(storage['arqpixel-progress-v1'])
        assert progress['missions']['S09']['awarded'] is True
        assert progress['xp'] == 80, progress['xp']
        page.locator('#suite-evaluate').click()
        assert json.loads(page.evaluate('window.__testStorage()["arqpixel-progress-v1"]'))['xp'] == 80, 'XP duplicados'
        # El gate de amenazas es un bonus; conserva las 6 actividades originales.
        threat = page.evaluate("""async()=>{let mod=await import(window.__moduleUrls['senior-threats.js']);return mod.threatExercise('S09',0).correct;}""")
        page.locator(f'input[name="suite-threat"][value="{threat}"]').check()
        page.locator('#evaluate-threat').click()
        assert 'PASS' in page.locator('#threat-report').inner_text()
        controls=page.evaluate('''async()=>{let mod=await import(window.__moduleUrls['senior-devsecops.js']);return mod.devsecopsPolicy('S09').must;}''')
        for part in controls:
            page.locator(f'[data-devsecops="{part}"]').check()
        page.locator('#evaluate-devsecops').click()
        assert 'PASS' in page.locator('#devsecops-report').inner_text()
        page.locator('#run-payment-simulation').click()
        assert 'Cobros duplicados' in page.locator('#payment-simulation-result').inner_text()
        page.locator('#run-impact-simulation').click()
        assert page.locator('#impact-result').inner_text().strip(), 'Debe indicar falta de selección'
        page.locator('input[name="suite-impact"][value="0"]').check()
        page.locator('#run-impact-simulation').click()
        assert 'Métrica' not in page.locator('#impact-result').inner_text() or '→' in page.locator('#impact-result').inner_text()
        with page.expect_download(timeout=4000) as download:
            page.locator('#suite-export').click()
        assert 'S09-evidencias' in download.value.suggested_filename
        evidence = json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
        assert evidence['threatModel']['status'] == 'PASS'
        with page.expect_download(timeout=4000) as download:
            page.locator('#suite-export-md').click()
        assert 'S09-dossier' in download.value.suggested_filename
        go(page, 'perfil', '#export-progress')
        assert '80 XP' in page.locator('.profile-banner').inner_text()
        with page.expect_download(timeout=4000) as download:
            page.locator('#export-progress').click()
        assert download.value.suggested_filename == 'arqpixel-progreso.json'
        backup = json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
        assert backup['progress']['xp']==80
        assert backup['seniorSuites']['S09-0']['threatChoice']==threat
        page.once('dialog', lambda dialog: dialog.accept())
        page.locator('#reset-progress').click()
        assert '0 XP' in page.locator('.profile-banner').inner_text()
        page.locator('#import-progress').set_input_files({
          'name':'arqpixel-backup.json','mimeType':'application/json',
          'buffer':json.dumps(backup,ensure_ascii=False).encode('utf-8')
        })
        page.locator('.profile-banner').get_by_text('80 XP',exact=False).wait_for(timeout=4000)
        assert page.locator('.profile-banner').count()==1
        assert not errors, errors
        print('PASS: S09 fallo inicial, 6 actividades, Threat/DevSecOps, XP, exportaciones y backup/restauración')
    finally:
        page.close()


def check_minigames(browser):
    page,errors=bootstrap(browser)
    try:
        go(page,'minijuegos','.lab-grid')
        assert page.locator('.lab-item').count()==5
        for game in json.loads((DIST/'data/mini-games.json').read_text(encoding='utf-8')):
            go(page, f"minijuego/{game['id']}", '.mini-game')
            assert game['title'] in page.locator('h1').inner_text()
            for q in game['questions']:
                page.locator(f'[data-mini-answer="{q["correct"]}"]').click()
                assert 'Decisión defendible' in page.locator('[role="status"]').inner_text()
                page.locator('#mini-next').click()
            assert page.locator('.mini-game-complete').count()==1
            assert '6' in page.locator('.mini-score').inner_text()
        stored=page.evaluate('window.__testStorage()')
        mini=json.loads(stored['arqpixel-minigames-v1'])
        assert len(mini['best'])==5 and all(score==6 for score in mini['best'].values())
        go(page,'perfil','#export-progress')
        with page.expect_download(timeout=4000) as download:
            page.locator('#export-progress').click()
        backup=json.loads(Path(download.value.path()).read_text(encoding='utf-8'))
        assert len(backup['miniGames']['best'])==5
        page.once('dialog',lambda dialog:dialog.accept())
        page.locator('#reset-progress').click()
        assert 'arqpixel-minigames-v1' not in page.evaluate('window.__testStorage()')
        page.locator('#import-progress').set_input_files({'name':'arqpixel-backup.json','mimeType':'application/json','buffer':json.dumps(backup).encode('utf-8')})
        go(page,'minijuegos','.lab-grid')
        assert '30/30' in page.locator('.lesson-card').inner_text()
        assert not errors, errors
        print('PASS: cinco minijuegos, 30 decisiones, estrellas, respaldo, reset y restauración')
    finally:
        page.close()


def check_c4_export(browser):
    page,errors=bootstrap(browser)
    try:
        go(page,'laboratorio/c4','#c4-diagram')
        assert page.locator('#c4-rel-list [data-c4-unlink]').count()==3
        page.locator('#c4-label').fill('Search <Catalog>')
        page.locator('#c4-type').select_option(label='API')
        page.locator('#c4-add').click()
        assert page.locator('.c4-node').count()==5
        page.locator('#c4-from').select_option(label='Web NexoShop')
        page.locator('#c4-to').select_option(label='Search <Catalog>')
        page.locator('#c4-rel-label').fill('Consulta búsqueda')
        page.locator('#c4-link').click()
        assert page.locator('#c4-rel-list [data-c4-unlink]').count()==4
        # Reject a duplicate; it must not silently appear twice.
        page.locator('#c4-from').select_option(label='Web NexoShop')
        page.locator('#c4-to').select_option(label='Search <Catalog>')
        page.locator('#c4-rel-label').fill('Consulta duplicada')
        page.locator('#c4-link').click()
        assert 'duplicada' in page.locator('#c4-feedback').inner_text()
        for button,extension in [('c4-export','.json'),('c4-mermaid','.mmd'),('c4-svg','.svg'),('c4-png','.png')]:
            with page.expect_download(timeout=4500) as downloaded:
                page.locator('#'+button).click()
            file=downloaded.value
            assert file.suggested_filename.endswith(extension)
            payload=Path(file.path()).read_bytes()
            assert len(payload)>50
            if extension=='.json':
                data=json.loads(payload)
                assert len(data['containers'])==5 and len(data['relations'])==4
            if extension=='.svg':
                assert b'&lt;Catalog&gt;' in payload and b'<script>' not in payload
            if extension=='.png':
                assert payload.startswith(b'\x89PNG\r\n\x1a\n')
        assert not errors,errors
        print('PASS: C4 editor, relaciones, duplicados, JSON/Mermaid/SVG/PNG con Chromium')
    finally:
        page.close()


def check_contextual_senior_lessons(browser):
    page,errors=bootstrap(browser)
    try:
        go(page,'modulo/B01','.lesson-card')
        page.locator('#senior-toggle').check()
        assert page.locator('#check-senior-lesson').count()==0
        assert 'Solo preparación' in page.locator('.senior-inline').first.inner_text()
        go(page,'modulo/I01','.lesson-card')
        assert page.locator('#check-senior-lesson').count()==1
        assert 'Variante reproducible' in page.locator('.senior-inline').first.inner_text()
        page.locator('#check-senior-lesson').click()
        assert 'FAIL' in page.locator('#senior-lesson-report').inner_text()
        details=page.evaluate("""async()=>{const mod=await import(window.__moduleUrls['lesson-senior.js']);return mod.lessonSeniorScenario({id:'I01',title:'',level:'Intermedio'}).scenario}""")
        draft=(f"Contexto: {details['traffic']} y disponibilidad {details['availability']}. "
               "Decisión: prefiero reducir acoplamiento y aplicar responsabilidades verificables. "
               "La alternativa descartada presenta riesgo de cambios simultáneos de módulos, mayor coste y dependencia de proveedores. "
               "Para verificar usaré pruebas de integración, un SLO medible y plan de rollback si las métricas empeoran.")
        page.locator('#lesson-notes').fill(draft)
        page.locator('#check-senior-lesson').click()
        assert 'Revisión mecánica superada' in page.locator('#senior-lesson-report').inner_text()
        assert 'REQUIRES_REVIEW' in page.locator('#senior-lesson-report').inner_text()
        assert not errors, errors
        print('PASS: toggle Senior contextual para 24 módulos y no aplicable en 12 básicos')
    finally:
        page.close()


def check_mobile(browser):
    page, errors = bootstrap(browser, 375, 812)
    try:
        go(page, 'taller-senior/S11', '#senior-suite')
        assert page.locator('#suite-evaluate').count() == 1
        assert page.locator('#run-capacity-simulation').count() == 1
        page.locator('#run-capacity-simulation').click()
        assert 'Capacidad:' in page.locator('#capacity-simulation-result').inner_text()
        overflow = page.evaluate('({content: document.documentElement.scrollWidth, viewport: window.innerWidth})')
        assert overflow['content'] <= overflow['viewport'] + 2, f"Desbordamiento móvil: {overflow}"
        assert not errors, errors
        print('PASS: Senior S11 simulador + viewport móvil 375 px sin desbordamiento de página')
    finally:
        page.close()


def check_responsive_new_features(browser):
    for width in [375,768,1440]:
        page,errors=bootstrap(browser,width,820)
        try:
            for path,selector in [('minijuegos','.lab-grid'),('minijuego/tetris','.mini-game'),('laboratorio/c4','#c4-diagram'),('modulo/I02','.lesson-card')]:
                go(page,path,selector)
                dimensions=page.evaluate('''() => ({viewport:window.innerWidth,page:document.documentElement.scrollWidth})''')
                assert dimensions['page']<=dimensions['viewport']+2,(width,path,dimensions)
            assert not errors,errors
        finally:page.close()
    print('PASS: layouts minijuegos, C4 y lecciones a 375, 768 y 1440 px')


def main():
    for name in ENTRY:
        assert (DIST / name).is_file(), f"Missing dist/{name}; run npm run build"
    with sync_playwright() as p:
        path = os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else p.chromium.executable_path)
        browser = p.chromium.launch(headless=True, executable_path=path, args=['--no-sandbox','--disable-dev-shm-usage'])
        try:
            check_full_senior(browser)
            check_senior_completion(browser)
            check_mobile(browser)
            check_minigames(browser)
            check_c4_export(browser)
            check_contextual_senior_lessons(browser)
            check_responsive_new_features(browser)
        finally:
            browser.close()
    print('BROWSER CHECKS PASS: real Chromium DOM/modules, local fixture transport only')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'BROWSER CHECK FAIL: {exc}', file=sys.stderr)
        raise
