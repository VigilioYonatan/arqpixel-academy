/** Pure deterministic educational rules. Not a professional architecture validator. */
export type ProgressRecord = {
  done:string[]; answers:Record<string,number>;
  missions:Record<string,{score:number;seed:number;completedAt:string;choice:number;adr:string;awarded?:boolean}>;
  notes:Record<string,string>; xp:number; theme:'dark'|'light';seniorMode:boolean;lastVisit:string;
};
const own=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const int=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
export function sanitizeProgress(value:unknown,moduleIds:string[],missionIds:string[]):ProgressRecord|null{
  if(!own(value)||!Array.isArray(value.done)||!own(value.answers)||!own(value.missions)||!own(value.notes))return null;
  const allowedModules=new Set(moduleIds),allowedMissions=new Set(missionIds);
  const done=[...new Set(value.done.filter((x:unknown):x is string=>typeof x==='string'&&allowedModules.has(x)))];
  const answers:Record<string,number>={};
  for(const [id,v] of Object.entries(value.answers)){if(allowedModules.has(id)&&int(v,0,2))answers[id]=v as number}
  const missions:ProgressRecord['missions']={};
  for(const [id,v] of Object.entries(value.missions)){
    if(!allowedMissions.has(id)||!own(v)||('awarded' in v && typeof v.awarded!=='boolean')||!int(v.score,0,100)||!int(v.seed,0,1000000)||!int(v.choice,0,2)||typeof v.adr!=='string'||v.adr.length>15000||typeof v.completedAt!=='string'||!Number.isFinite(Date.parse(v.completedAt)))continue;
    missions[id]={score:v.score as number,seed:v.seed as number,choice:v.choice as number,adr:v.adr,completedAt:v.completedAt,awarded:v.awarded!==false};
  }
  const notes:Record<string,string>={};
  for(const [id,note] of Object.entries(value.notes))if(allowedModules.has(id)&&typeof note==='string'&&note.length<=15000)notes[id]=note;
  const theme=value.theme==='light'?'light':'dark';
  return {done,answers,missions,notes,xp:done.length*50+Object.values(missions).filter(x=>x.awarded).length*80,theme,seniorMode:value.seniorMode===true,lastVisit:typeof value.lastVisit==='string'&&Number.isFinite(Date.parse(value.lastVisit))?value.lastVisit:new Date(0).toISOString()};
}
export function detectGraphProblems(edges:[string,string][]) {
  const nodes=['Presentación','Aplicación','Dominio','Infraestructura'];
  const invalid=edges.filter(([a,b])=>!nodes.includes(a)||!nodes.includes(b)||a===b||(a==='Dominio'&&b!=='Dominio')||(a==='Aplicación'&&b==='Presentación')||(a==='Infraestructura'&&b==='Presentación'));
  const adj=new Map<string,string[]>();for(const [a,b] of edges){adj.set(a,[...(adj.get(a)||[]),b])}
  const visited=new Set<string>(),active=new Set<string>();let cycle=false;
  const walk=(node:string)=>{if(active.has(node)){cycle=true;return}if(visited.has(node))return;visited.add(node);active.add(node);for(const next of adj.get(node)||[])walk(next);active.delete(node)};
  for(const node of nodes)walk(node);
  return {invalid,cycle,valid:invalid.length===0&&!cycle};
}
export function scenarioFromSeed(id:string,seed:number){
  let k=2166136261;const key=id+':'+seed;for(let i=0;i<key.length;i++)k=Math.imul(k^key.charCodeAt(i),16777619);k>>>=0;
  const pick=<T>(a:T[],shift:number)=>a[(k>>>shift)%a.length];
  return {traffic:pick(['600 req/min','8.000 req/min','65.000 req/min'],2),availability:pick(['99,5 %','99,9 %','99,95 %'],5),team:pick(['3 ingenieros','9 ingenieros','30 ingenieros'],9),budget:pick(['limitado','moderado','amplio'],12),failure:pick(['la base de datos presenta latencia','la pasarela externa duplica respuestas','la cola acumula mensajes'],17)};
}
/** Ordering differs by scenario; correct choice is never assumed to be at index zero. */
export function missionChoices(id:string,seed:number,options:string[]){
  const shift=(seed+id.charCodeAt(id.length-1))%options.length;
  const rotated=[...options.slice(shift),...options.slice(0,shift)];
  return {options:rotated,correct:rotated.indexOf(options[0])};
}
export function evaluateMission(choice:number,correct:number,adr:string,scenario:ReturnType<typeof scenarioFromSeed>){
  const hasAlt=/alternativ|trade.off|coste|costo|riesgo|contra|desventaja/i.test(adr);
  const hasVerify=/medir|verific|test|prueba|slo|métrica|monitor|validar|p95/i.test(adr);
  const normalized=adr.toLocaleLowerCase('es');
  const scenarioSignals=[scenario.traffic,scenario.availability,scenario.team,scenario.budget].filter(s=>normalized.includes(s.toLocaleLowerCase('es')));
  const checks=[
    {name:'Alternativa de referencia seleccionada',status:choice===correct?'PASS':'FAIL',points:choice===correct?30:0,max:30},
    {name:'ADR con extensión mínima',status:adr.trim().length>=160?'PASS':'FAIL',points:adr.trim().length>=160?20:0,max:20},
    {name:'Alternativas o riesgos documentados',status:hasAlt?'PASS':'FAIL',points:hasAlt?15:0,max:15},
    {name:'Estrategia de verificación documentada',status:hasVerify?'PASS':'FAIL',points:hasVerify?15:0,max:15},
    {name:'Restricciones del escenario citadas',status:scenarioSignals.length>=2?'PASS':'FAIL',points:scenarioSignals.length>=2?20:0,max:20},
    {name:'Calidad técnica profesional del ADR',status:'REQUIRES_REVIEW',points:0,max:0},
  ] as const;
  return {score:checks.reduce((total,item)=>total+item.points,0),checks,scenarioSignals};
}
