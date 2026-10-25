import test from 'node:test';
import assert from 'node:assert/strict';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {placeOrganism} from '../js/systems/placement.js';
import {evaluateStability} from '../js/systems/stability.js';
import {createStageGameState,updateStage,stageBlockers,catchObservation} from '../js/systems/chapter-stage.js';
import {stageById,stageConfig} from '../data/chapters.js';
import {layout} from './ecology-fixtures.mjs';

const place=(s,id,x)=>placeOrganism(s,id,{position:{x,y:.72},isPlayArea:true,isUI:false},layout);
const count=(s,id)=>s.organisms.filter(o=>o.speciesId===id).length;

// Headless stage run with the production ecology. onTick plays the student.
function run(stageId,seconds,{onTick=()=>{},catchAll=false,setup=()=>{}}={}){
 const s=createStageGameState(stageById[stageId]);setup(s);
 const f=createFeedingSystem(0),blocked={};let eventAt=null;
 for(let t=0;t<seconds*10&&!s.chapter.cleared;t++){
  const r=f.update(s,.1,layout);if(!r.ticked)continue;
  s.metrics.stability=evaluateStability(s).score;
  const out=updateStage(s,.5,r.feedingEvents);
  if(out.eventStarted)eventAt=s.simulationTime;
  if(catchAll)for(const o of [...s.chapter.offers]){const c=catchObservation(s,o.offerId);if(c.eventStarted)eventAt=s.simulationTime;}
  for(const b of stageBlockers(s))blocked[b.id]=(blocked[b.id]||0)+.5;
  onTick(s);
 }
 return {s,blocked,eventAt};
}

test('stage 1-1 starts with only its cards, its points and no scheduled event',()=>{
 const s=createStageGameState(stageById['1-1']);
 assert.deepEqual(s.organisms.map(o=>o.speciesId),['grass','grass']);
 assert.deepEqual(s.inventory.filter(c=>c.acquired).map(c=>c.speciesId).sort(),['grass','grasshopper']);
 assert.equal(s.metrics.points,12);
 assert(s.environmentEvents.nextAt>1e9);
 assert.deepEqual(stageBlockers(s).map(b=>b.id),['noConsumer']);
});

test('a forest with no animals grows no seeds',()=>{
 const {s}=run('1-1',300);
 assert.equal(s.chapter.seeds,0);
});

test('balanced 1-1 clears, and the cloudy day always comes before the clear',()=>{
 const {s,blocked,eventAt}=run('1-1',600,{setup:s=>{assert(place(s,'grasshopper',.42).ok);assert(place(s,'grasshopper',.48).ok);}});
 assert(s.chapter.cleared,'balanced forest should clear');
 assert(eventAt!==null&&eventAt<s.chapter.clearedAt,'event before clear');
 assert(blocked.environment>0,'the cloudy day really pauses seeds');
 assert(s.chapter.clearedAt>=stageConfig.seedsToClear*stageConfig.seedSeconds);
 assert(s.chapter.clearedAt<=360,`cleared at ${s.chapter.clearedAt}`);
});

test('catching every observation cannot skip the cloudy day or finish within two minutes',()=>{
 const {s,eventAt}=run('1-1',600,{catchAll:true,setup:s=>{place(s,'grasshopper',.42);place(s,'grasshopper',.48);}});
 assert(s.chapter.cleared);
 assert(s.chapter.observations>0);
 assert(eventAt<s.chapter.clearedAt);
 assert(s.chapter.clearedAt>=120,`cleared at ${s.chapter.clearedAt}`);
});

test('crowded 1-2 left alone stalls: food runs out and animals starve',()=>{
 const {s,blocked}=run('1-2',360);
 assert(!s.chapter.cleared);
 assert(s.chapter.seeds<=1,`seeds ${s.chapter.seeds}`);
 assert(blocked.depleted>120,`depleted ${blocked.depleted}`);
});

test('crowded 1-2 clears when the student plants more grass',()=>{
 const {s}=run('1-2',600,{onTick:s=>{if(count(s,'grass')<4)place(s,'grass',.2+count(s,'grass')*.12);}});
 assert(s.chapter.cleared,`seeds ${s.chapter.seeds}`);
 assert(s.chapter.clearedAt<=480,`cleared at ${s.chapter.clearedAt}`);
});

test('an observation helps seeds only in a balanced forest',()=>{
 const s=createStageGameState(stageById['1-2']);
 s.organisms.filter(o=>o.speciesId==='grass').forEach(o=>o.foodStock=0);
 s.chapter.offers.push({offerId:'test',expiresAt:99});
 const r=catchObservation(s,'test');
 assert(r.ok&&!r.bonus);
 assert.equal(s.chapter.seedProgress,0);
 assert.equal(s.chapter.observations,1);
 assert(!catchObservation(s,'test').ok,'one offer is caught once');
});

test('observations appear at a fixed pace, so more animals never mean more seeds',()=>{
 const s=createStageGameState(stageById['1-1']);
 const meals=[{relationId:'v2_grass_to_grasshopper',consumerInstanceId:'a'},{relationId:'v2_grass_to_grasshopper',consumerInstanceId:'b'}];
 for(let t=0;t<60;t+=.5){s.simulationTime=t;updateStage(s,.5,meals);}
 assert(s.chapter.offerSequence<=Math.ceil(60/stageConfig.observationInterval),`offers ${s.chapter.offerSequence}`);
 const few=run('1-2',600,{catchAll:true,onTick:s=>{if(count(s,'grass')<4)place(s,'grass',.2+count(s,'grass')*.12);}});
 const pair=run('1-1',600,{catchAll:true,setup:s=>{place(s,'grasshopper',.42);place(s,'grasshopper',.48);}});
 assert(few.s.chapter.cleared&&pair.s.chapter.cleared);
 assert(few.s.chapter.clearedAt>=pair.s.chapter.clearedAt-30,`crowded ${few.s.chapter.clearedAt} vs pair ${pair.s.chapter.clearedAt}`);
});

test('an uncaught observation disappears after its lifetime',()=>{
 const s=createStageGameState(stageById['1-1']);
 updateStage(s,.5,[{relationId:'v2_grass_to_grasshopper',consumerInstanceId:'a'}]);
 assert.equal(s.chapter.offers.length,1);
 s.simulationTime=stageConfig.observationLifetime+.5;updateStage(s,.5,[]);
 assert.equal(s.chapter.offers.length,0);
});
