import test from 'node:test';
import assert from 'node:assert/strict';
import {createStageGameState,updateStage,stageBlockers,catchObservation,careOptions,careFor,needStates,neededCards,buyCheck,payFor,collectTrash,priceOf,prepareOptions,prepareFor,crisisReport} from '../js/systems/chapter-stage.js';
import {currentEnvironmentEvent} from '../js/systems/environment-events.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {layout} from './ecology-fixtures.mjs';
import {stages,stageById,stageConfig,chapters} from '../data/chapters.js';
import {organismById} from '../data/organisms.js';
import {foodRelations} from '../data/food-relations.js';
import {runStage,idleStudent,place as placeFixture} from './chapter-fixtures.mjs';

// Stages that start unbalanced or missing a role: waiting alone must not clear them.
const demanding=['1-2','2-2','2-3','3-1','3-2','3-3','4-1','4-2','4-3'];

test('chapters add one event each and hold balance longer as they go',()=>{
 assert.equal(chapters.length,4);assert.equal(stages.length,12);
 assert.deepEqual(chapters.map(c=>c.events[0]),['cloudy','drought','soil-damage','air-pollution']);
 for(let i=1;i<chapters.length;i++){
  assert.equal(chapters[i].events[1],chapters[i-1].events[0],'the previous crisis returns');
  assert(chapters[i].seedSeconds>chapters[i-1].seedSeconds);
 }
});

test('every stage starts with only its cards and species that can eat what is offered',()=>{
 for(const stage of stages){
  const s=createStageGameState(stage);
  assert.deepEqual(s.inventory.filter(c=>c.acquired).map(c=>c.speciesId).sort(),[...stage.inventory].sort(),stage.stageId);
  assert.equal(s.metrics.points,stage.points);
  assert(s.environmentEvents.nextAt>1e9,'only the stage starts events');
  for(const id of Object.keys(stage.requiredSpecies)){
   assert(stage.inventory.includes(id),`${stage.stageId} can place ${id}`);
   // Earthworms eat fallen leaves, which the game models as dead matter, not a relation.
   if(id!=='earthworm')assert(foodRelations.some(r=>r.targetSpeciesId===id&&stage.inventory.includes(r.sourceSpeciesId)),`${stage.stageId} has food for ${id}`);
  }
  for(const [id] of stage.organisms)assert(organismById[id]);
 }
});

for(const stage of stages)test(`${stage.stageId} ${stage.title}: a careful student clears it, and the crisis comes first`,()=>{
 const r=runStage(stage.stageId);
 assert(r.cleared,`${stage.stageId} seeds ${r.seeds} blocked ${JSON.stringify(r.blocked)}`);
 assert(r.eventAt!==null&&r.eventAt<r.clearedAt);
 assert(r.clearedAt>=.8*stageConfig.seedsToClear*stage.seedSeconds,`${stage.stageId} too fast: ${r.clearedAt}`);
 assert(r.clearedAt<=600,`${stage.stageId} cleared at ${r.clearedAt}`);
});

test('demanding stages stall when the student only places the required animals and waits',()=>{
 for(const id of demanding){const r=runStage(id,{student:idleStudent,seconds:600});assert(!r.cleared,`${id} cleared idle at ${r.clearedAt}`);}
});

test('a predator that eats its prey below the stage minimum stalls the seeds',()=>{
 const r=runStage('4-1',{student:idleStudent,seconds:600});
 assert(r.blocked.missing>300,JSON.stringify(r.blocked));
 assert(!r.final.frog||r.final.frog<2);
});

test('without decomposers, dead matter is not broken down and seeds stop',()=>{
 const r=runStage('3-1',{student:idleStudent,seconds:300});
 assert.equal(r.seeds,0);assert(r.blocked.noDecomposition>290);
});

test('weather cannot be fixed: natural crises offer no care button, human-made ones offer a conservation action',()=>{
 const s=createStageGameState(stageById['2-3']);s.environment.water.value=.2;s.environment.sunlight.value=.2;
 assert.deepEqual(careOptions(s),[]);
 const r=runStage('2-3');assert(r.cleared);assert(!r.actions.some(a=>a.includes('water-care')||a.includes('habitat-care sunlight')));
 assert(r.actions.some(a=>a.includes('place grass')),'endured by planting food plants');
 const h=createStageGameState(stageById['3-1']);h.environment.soil.value=.2;
 assert.deepEqual(careOptions(h).map(o=>o.label),['숲 바닥 되살리기']);
});

test('every crisis is announced before it starts',()=>{
 const s=createStageGameState(stageById['1-1']);s.chapter.seeds=1;
 updateStage(s,.5,[]);
 assert.equal(s.chapter.warning.kind,'cloudy');assert(!currentEnvironmentEvent(s));
 s.simulationTime=s.chapter.warning.startsAt;assert.equal(updateStage(s,.5,[]).eventStarted.kind,'cloudy');
 assert.equal(s.chapter.warning,null);
});

test('litter from a human-made crisis keeps harming the soil until it is tapped away',()=>{
 const left=runStage('3-2',{student:idleStudent,seconds:600}),cared=runStage('3-2');
 assert(left.s.chapter.trash.length>0,'litter stays when nobody collects it');
 assert(!left.cleared&&cared.cleared);assert(cared.trash>10);
 const s=createStageGameState(stageById['3-1']);s.chapter.trash.push({trashId:'t',kind:'soil-damage'});
 const before=s.metrics.points,soil=s.environment.soil.value;
 for(let t=1;t<=20;t++){s.simulationTime=t;updateStage(s,1,[]);}
 assert(s.environment.soil.value<soil,'one piece of litter lowers the soil');
 assert(collectTrash(s,'t').ok);assert.equal(s.metrics.points,before+stageConfig.trashReward);assert(!collectTrash(s,'t').ok);
});

test('the shop: cards cost points, 💡 earn them, lower in the chain is cheaper',()=>{
 assert(priceOf('grass')<priceOf('grasshopper')&&priceOf('grasshopper')<priceOf('frog')&&priceOf('frog')<priceOf('goshawk'));
 const s=createStageGameState(stageById['1-1']);s.metrics.points=3;
 assert(!buyCheck(s,'grasshopper').ok);assert.match(buyCheck(s,'grasshopper').message,/💡/);
 s.chapter.offers.push({offerId:'o',expiresAt:99});catchObservation(s,'o');
 assert(buyCheck(s,'grasshopper').ok);payFor(s,'grasshopper');assert.equal(s.metrics.points,0);
 for(const stage of stages){const r=runStage(stage.stageId);assert(r.points>=0);assert(r.spent>0,`${stage.stageId} buys something`);}
});

test('catching every observation helps a little but cannot replace care',()=>{
 for(const id of ['1-1','2-2']){
  const plain=runStage(id,{catchAll:false}),caught=runStage(id,{catchAll:true});
  assert(caught.cleared&&caught.s.chapter.observations>0);
  assert(caught.clearedAt>=plain.clearedAt*.75,`${id}: ${caught.clearedAt} vs ${plain.clearedAt}`);
 }
});

test('observations appear at a fixed pace and expire, so more animals never mean more seeds',()=>{
 const s=createStageGameState(stageById['1-1']);
 const meals=[{relationId:'v2_grass_to_grasshopper',consumerInstanceId:'a'},{relationId:'v2_grass_to_grasshopper',consumerInstanceId:'b'}];
 for(let t=0;t<60;t+=.5){s.simulationTime=t;updateStage(s,.5,meals);}
 assert(s.chapter.offerSequence<=Math.ceil(60/stageConfig.observationInterval));
 s.simulationTime=60+stageConfig.observationLifetime+1;updateStage(s,.5,[]);
 assert.equal(s.chapter.offers.length,0,'uncaught offers disappear');
});

test('an observation helps seeds only in a balanced forest, and only once',()=>{
 const s=createStageGameState(stageById['1-2']);
 s.organisms.filter(o=>o.speciesId==='grass').forEach(o=>o.foodStock=0);
 s.chapter.offers.push({offerId:'test',expiresAt:99});
 const r=catchObservation(s,'test');
 assert(r.ok&&!r.bonus);assert.equal(s.chapter.seedProgress,0);assert.equal(s.chapter.observations,1);
 assert(!catchObservation(s,'test').ok);
 assert(stageBlockers(s).some(b=>b.id==='depleted'));
});

test('a hungry animal shows it before it stalls seeds, and an eaten plant shows it too',()=>{
 const s=createStageGameState(stageById['1-2']),f=createFeedingSystem(0),firstSeen={};
 for(let t=0;t<3000;t++){const r=f.update(s,.1,layout);if(!r.ticked)continue;
  for(const [id,state] of needStates(s)){firstSeen[id+':'+state]??=s.simulationTime;}
  if([...needStates(s).values()].includes('starving'))assert(stageBlockers(s).some(b=>b.id==='starving'),'badge and seeds agree');}
 const animals=Object.keys(firstSeen).filter(k=>k.endsWith(':starving')).map(k=>k.split(':')[0]);
 assert(animals.length,'some grasshopper starves in the crowded meadow');
 for(const id of animals)assert(firstSeen[id+':hungry']<firstSeen[id+':starving'],`${id} warned first`);
 assert(Object.keys(firstSeen).some(k=>k.endsWith(':eaten')),'the grass shows it was eaten');
});

test('the card that would fix the stall is the one highlighted',()=>{
 const crowded=createStageGameState(stageById['1-2']);crowded.organisms.filter(o=>o.speciesId==='grass').forEach(o=>o.foodStock=0);
 assert.deepEqual([...neededCards(crowded)],['grass']);
 const noDecomposer=runStage('3-1',{student:idleStudent,seconds:60}).s;
 assert.deepEqual([...neededCards(noDecomposer)].sort(),['litter-mold','mushroom']);
 const snake=runStage('4-1',{student:idleStudent,seconds:600}).s;
 assert(neededCards(snake).has('frog'),'frogs eaten below the minimum');
});

test('weather works through the ecology; soil and air damaged by people stall seeds directly',()=>{
 const s=createStageGameState(stageById['3-1']);
 s.environment.sunlight.value=.2;s.environment.water.value=.2;
 assert(!stageBlockers(s).some(b=>b.id==='environment'));
 s.environment.soil.value=.2;
 assert.deepEqual(stageBlockers(s).find(b=>b.id==='environment').factors,['soil']);
});

test('before weather the student chooses how to prepare, and sees how it went',()=>{
 const s=createStageGameState(stageById['1-3']);s.chapter.seeds=1;updateStage(s,.5,[]);
 assert.deepEqual(prepareOptions(s).map(o=>o.id),['plant','reduce','wait']);
 assert.equal(prepareOptions(s)[0].speciesId,'grass');
 const before=s.organisms.filter(o=>o.speciesId==='grasshopper').length,r=prepareFor(s,'reduce');
 assert(r.ok&&r.speciesId==='grasshopper');
 assert.equal(s.organisms.filter(o=>o.speciesId==='grasshopper').length,before-1,'one plant eater released');
 assert(!prepareFor(s,'wait').ok,'one choice per crisis');
 const human=createStageGameState(stageById['3-1']);human.chapter.seeds=1;updateStage(human,.5,[]);
 assert.equal(human.chapter.warning.kind,'soil-damage');assert.deepEqual(prepareOptions(human),[],'people-made crises are tackled, not prepared for');
});

test('planting before the weather keeps the seeds growing; waiting does not',()=>{
 const answer=choice=>s=>{const acts=idleStudent(s);if(prepareOptions(s).length){const r=prepareFor(s,choice);if(r.choice==='plant'){for(let i=0;i<2;i++)placeFixture(s,r.speciesId);}}return acts;};
 const stalled=choice=>{const r=runStage('1-3',{student:answer(choice),seconds:600,catchAll:true});const log=r.s.chapter.crisisLog[0];assert(log.endedAt!==null);assert(crisisReport(r.s)===log);return log.stalled;};
 const plant=stalled('plant'),wait=stalled('wait');
 assert(plant<wait,`plant ${plant}s vs wait ${wait}s`);assert(wait-plant>=20);
});
