import {readFileSync,statSync,existsSync} from 'node:fs';

const json=p=>JSON.parse(readFileSync(p,'utf8'));
const doc=readFileSync('TODO_LO_QUE_DEBE_TENER_ESTA_APP.md','utf8');
if(doc.length<130000||!doc.includes('## 9. LAS 18 MISIONES SENIOR')||!doc.includes('## 16. ANEXO COMPLETO')||!doc.includes('## 11. DEVSECOPS'))throw Error('Especificación integral obligatoria ausente o incompleta');

const games=json('data/mini-games.json');
const modules=json('data/modules.json'),deep=json('data/deep-dives.json'),missions=json('data/senior.json'),lab=json('data/lab-cases.json'),paths=json('data/paths.json');
const assetsManifest=json('data/assets-manifest.json');

const missing=[];for(const m of modules)if(!deep.find(x=>x.id===m.id))missing.push(m.id);

for(const f of ['dist/index.html','dist/app.js','dist/engine.js','dist/senior-suite.js','dist/senior-simulations.js','dist/senior-reviews.js','dist/senior-impact.js','dist/senior-devsecops.js','dist/senior-threats.js','dist/mini-games.js','dist/c4-studio.js','dist/ddd-workshop.js','dist/styles.css','dist/data/modules.json','dist/data/senior.json','dist/data/deep-dives.json','dist/data/lab-cases.json','dist/data/paths.json','dist/data/mini-games.json','dist/data/assets-manifest.json','dist/assets/arquibot.png','dist/assets/arquibot-lab.png','dist/assets/hero-reference.png','dist/_headers'])if(!existsSync(f)||statSync(f).size<10)throw Error('Falta recurso crítico: '+f);

if(games.length!==5||games.some(g=>g.questions?.length!==6)||modules.length!==36||missions.length!==18||paths.length!==8||deep.length!==36||missing.length||Object.values(lab).some(a=>a.length!==4))throw Error('Catálogo incorrecto');

for(const f of ['modules.json','senior.json','deep-dives.json','lab-cases.json','paths.json','mini-games.json','assets-manifest.json'])if(readFileSync(`data/${f}`,'utf8')!==readFileSync(`dist/data/${f}`,'utf8'))throw Error('Dist desincronizado: '+f);

// Verify all 16 official ArquiBot RGBA PNG sprites in dist/assets/arquibot/
const arquibotSprites=assetsManifest.filter(item=>item.src.startsWith('./assets/arquibot/'));
if(arquibotSprites.length<16)throw Error('Faltan sprites oficiales de ArquiBot en assets-manifest.json');
for(const sprite of arquibotSprites){
  const distPath='dist/'+sprite.src.replace(/^\.\//,'');
  if(!existsSync(distPath))throw Error('Sprite ausente en dist: '+distPath);
  const buf=readFileSync(distPath);
  if(buf.length<256||buf[0]!==0x89||buf[1]!==0x50||buf[2]!==0x4e||buf[3]!==0x47)throw Error('Firma PNG inválida en: '+distPath);
  const width=buf.readUInt32BE(16),height=buf.readUInt32BE(20),colorType=buf[25];
  if(width!==sprite.width||height!==sprite.height||width<512||height<512)throw Error(`Dimensiones inesperadas en ${distPath}: ${width}x${height}`);
  if(colorType!==6)throw Error(`El sprite ${distPath} debe ser PNG RGBA transparente (colorType=6), recibido: ${colorType}`);
}

const html=readFileSync('dist/index.html','utf8');if(!html.includes('app.js')||!html.includes('styles.css'))throw Error('Entrada web rota');
const suite=readFileSync('dist/senior-suite.js','utf8');if(!suite.includes('SENIOR_PLAYBOOKS')||!suite.includes('payment-experiment')||!suite.includes('capacity-experiment')||!suite.includes('suite-export-md')||!suite.includes('run-impact-simulation')||!suite.includes('suite-add-edge')||!suite.includes('suite-review'))throw Error('Senior Mode 1.4 incompleto');
const review=readFileSync('dist/senior-reviews.js','utf8');const impact=readFileSync('dist/senior-impact.js','utf8');if(!review.includes('SENIOR_REVIEWS')||!impact.includes('IMPACT_MODELS'))throw Error('Faltan módulos educativos por misión');
const app=readFileSync('dist/app.js','utf8');if(!app.includes('taller-senior')||!app.includes('deep-dives.json')||!app.includes('lab-cases.json')||!app.includes('especializaciones')||!app.includes('minijuegos')||!app.includes('c4-mermaid')||!app.includes('c4-png'))throw Error('UI sin integrar módulos');

if(!readFileSync('dist/senior-suite.js','utf8').includes('evaluate-devsecops'))throw Error('Falta gate DevSecOps en Senior Mode');
if(!readFileSync('dist/senior-suite.js','utf8').includes('evaluate-threat')||!readFileSync('dist/senior-threats.js','utf8').includes('SENIOR_THREATS'))throw Error('Falta gate Threat Modeling / STRIDE');
console.log(`RELEASE CHECK PASS: ${modules.length} lecciones, ${missions.length} misiones, ${missions.length*6} actividades Senior, ${paths.length} especializaciones, ${games.length} minijuegos / ${games.reduce((n,g)=>n+g.questions.length,0)} decisiones, C4 C1/C2/C3 + DDD, ${arquibotSprites.length} sprites RGBA ArquiBot, assets y dist sincronizados.`);
