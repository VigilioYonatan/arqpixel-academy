import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMiniCatalog,gradeMiniQuestion,recordMiniRun,sanitizeMiniProgress,emptyMiniProgress,miniStars,MINI_STORAGE_KEY} from '../dist/mini-games.js';
const games=validateMiniCatalog(JSON.parse(readFileSync('data/mini-games.json','utf8')));
test('los cinco minijuegos contienen 30 retos diferentes con feedback y pistas',()=>{
  assert.equal(games.length,5);assert.equal(new Set(games.map(g=>g.id)).size,5);
  assert.equal(games.reduce((n,g)=>n+g.questions.length,0),30);
  for(const game of games){assert.equal(game.questions.length,6);assert.ok(game.title.length>6);assert.ok(game.subtitle.length>25);
    assert.equal(new Set(game.questions.map(q=>q.id)).size,6);
    for(const q of game.questions){assert.ok(q.why.length>35);assert.ok(q.hint.length>10);assert.equal(q.options.length,4);
      assert.equal(gradeMiniQuestion(q,q.correct).correct,true);
      for(let i=0;i<q.options.length;i++)if(i!==q.correct)assert.equal(gradeMiniQuestion(q,i).correct,false);
    }
  }
});
test('cada minijuego contiene variantes correctas y no presupone respuesta A',()=>{
  for(const game of games){const positions=new Set(game.questions.map(q=>q.correct));assert.ok(positions.size>=2,game.id)}
});
test('rechaza respuestas y catálogos malformados',()=>{
  assert.throws(()=>gradeMiniQuestion(games[0].questions[0],-1));
  assert.throws(()=>gradeMiniQuestion(games[0].questions[0],4));
  assert.throws(()=>gradeMiniQuestion(games[0].questions[0],1.25));
  const invalid=structuredClone(games);invalid[0].questions[1].correct=90;
  assert.throws(()=>validateMiniCatalog(invalid));
  const repeated=structuredClone(games);repeated[1].id=repeated[0].id;
  assert.throws(()=>validateMiniCatalog(repeated));
});
test('mejores resultados son monotónicos y no recompensan infinitos reintentos',()=>{
  let p=emptyMiniProgress();p=recordMiniRun(p,games[0],5);p=recordMiniRun(p,games[0],3);p=recordMiniRun(p,games[0],6);
  assert.equal(p.best[games[0].id],6);assert.equal(p.plays[games[0].id],3);assert.equal(miniStars(6),3);
  assert.equal(miniStars(4),2);assert.equal(miniStars(2),1);assert.equal(miniStars(1),0);
  assert.throws(()=>recordMiniRun(p,games[0],7));
  assert.match(MINI_STORAGE_KEY,/arqpixel/);
});
test('importación de minijuegos valida y descarta identificadores desconocidos',()=>{
  const ids=games.map(g=>g.id);
  const clean=sanitizeMiniProgress({best:{[ids[0]]:5,'__desconocido':6},plays:{[ids[0]]:2,'__desconocido':8}},ids);
  assert.deepEqual(clean,{best:{[ids[0]]:5},plays:{[ids[0]]:2}});
  assert.equal(sanitizeMiniProgress({best:{[ids[0]]:900},plays:{}},ids),null);
  assert.equal(sanitizeMiniProgress({best:{},plays:{[ids[0]]:-3}},ids),null);
  assert.equal(sanitizeMiniProgress({best:[],plays:{}},ids),null);
});
