import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {survivalConfig} from '../data/survival-config.js';
import {feedingConfig,ecologyConfig} from '../data/ecology-config.js';
import {populationConfig,satietySeconds} from '../data/population-config.js';
import {organisms} from '../data/organisms.js';
import {foodRelations,relationsByConsumer} from '../data/food-relations.js';
import {earthwormAtSurface} from '../js/systems/prey-access.js';
import {hasRecentMeal} from '../js/systems/meal-readiness.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {updateSurvival,updateReproduction} from '../js/systems/population.js';
import {updateLifespans} from '../js/systems/lifespan.js';
import {removeOrganism} from '../js/systems/lifecycle.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {createSaveSnapshot,decodeSave,SAVE_VERSION} from '../js/services/save-format.js';
import {world,make,layout,emptyMemory,legacySave} from './ecology-fixtures.mjs';
import {auditSurvival} from './biodiversity-audit.mjs';

const before=JSON.parse(readFileSync(new URL('./biodiversity.audit-before-results.json',import.meta.url)));
const results={stage:'15.8',relations:[],survival:null};
const run=(s,seconds,feeding=createFeedingSystem(s.simulationTime,{environmentEventsEnabled:false}),g=layout)=>{const meals=[];for(let i=0;i<Math.round(seconds*10);i++)meals.push(...feeding.update(s,.1,g).feedingEvents);return meals;};
const surface=o=>{o.life.initialAge=survivalConfig.earthwormCycleSeconds-survivalConfig.earthwormSurfaceSeconds;};
const covered=o=>{o.life.initialAge=0;};

test('15.8 contracts:24 species,27 unchanged relations,save16/eco2/pacing1 and no new initial money',()=>{
 const s=world([]);assert.equal(organisms.length,24);assert.equal(foodRelations.length,27);assert.equal(SAVE_VERSION,17);assert.equal(s.ecologyRevision,2);assert.equal(s.pacingRevision,1);assert.equal(s.metrics.points,0);assert.equal(ecologyConfig.tickSeconds,.5);assert.equal(ecologyConfig.searchRetrySeconds,2);assert.equal(ecologyConfig.eatSeconds,1);
 const baseline=JSON.parse(readFileSync(new URL('./food-expansion.baseline-results.json',import.meta.url)));
 assert.deepEqual(foodRelations.slice(0,22),baseline.relations);
 assert.equal(organisms.filter(o=>o.role==='producer').length,5);assert.equal(organisms.filter(o=>o.role==='consumer').length,16);assert.equal(organisms.filter(o=>o.role==='decomposer').length,3);
});
for(const prior of before.species.filter(o=>o.feeding))test('15.8 '+prior.name+': actual species hunger rises more slowly; saved satiation pauses hunger',()=>{
 const s=world([[prior.id,1,.4]]),o=s.organisms[0];o.hunger=0;
 run(s,5);assert(o.hunger>0&&o.hunger<prior.feeding.hungerPerSecond*5);assert(Math.abs(o.hunger-feedingConfig[prior.id].hungerPerSecond*5)<1e-9);
 o.satietyUntil=s.simulationTime+5;const h=o.hunger;run(s,4);assert.equal(o.hunger,h);
 if(satietySeconds[prior.id])assert(satietySeconds[prior.id]>prior.satiety);
});

for(const edge of foodRelations)test('15.8 '+edge.relationId+': real accessible food,once reward,stock/removal and save',()=>{
 const s=world([[edge.targetSpeciesId,1,.4],[edge.sourceSpeciesId,1,.41]]),eater=s.organisms[0],prey=s.organisms[1];eater.hunger=1;if('hunger'in prey)prey.hunger=0;if(prey.speciesId==='earthworm')surface(prey);
 const stock=prey.foodStock,meals=run(s,2.5);assert.equal(meals.length,1);assert.equal(meals[0].relationId,edge.relationId);assert.equal(s.organisms.includes(prey),edge.feedingMode==='resource');if(edge.feedingMode==='resource')assert(prey.foodStock<stock);
 const events=createEventSystem();events.update(s,1,meals);const n=s.events.find(n=>n.payload.relationId===edge.relationId);assert(n);assert.equal(s.metrics.points,0);assert(events.acknowledge(s,n.eventId).ok);assert.equal(s.metrics.points,12);assert(!events.acknowledge(s,n.eventId).ok);assert.equal(s.metrics.points,12);
 const loaded=decodeSave(JSON.stringify(createSaveSnapshot(s,events.exportMemory(),'2026-10-19T00:00:00Z')));assert.equal(loaded.status,'loaded');assert.equal(loaded.state.metrics.points,12);assert.equal(loaded.state.observations.length,1);results.relations.push({relationId:edge.relationId,success:true,onceReward:true,save:true});
});
for(const consumer of ['ladybird','field-mouse','weasel']){
 test('15.8 '+consumer+': covered worm cannot be targeted; surface worm is genuinely eaten',()=>{
  const s=world([[consumer,1,.4],['earthworm',1,.41]]),p=s.organisms[0],worm=s.organisms[1];p.hunger=1;covered(worm);assert(!earthwormAtSurface(worm,0));assert.equal(run(s,5).length,0);assert(s.organisms.includes(worm));assert.equal(p.targetInstanceId,null);
  worm.life.initialAge=survivalConfig.earthwormCycleSeconds-survivalConfig.earthwormSurfaceSeconds-s.simulationTime;assert(earthwormAtSurface(worm,s.simulationTime));assert.equal(run(s,3).filter(m=>m.foodSpeciesId==='earthworm').length,1);assert(!s.organisms.includes(worm));assert.equal(s.population.totals.predation,1);
 });
 test('15.8 '+consumer+': retreat during bite cancels meal and chooses actual alternate prey',()=>{
  const alternate=relationsByConsumer.get(consumer).find(r=>r.sourceSpeciesId!=='earthworm').sourceSpeciesId;
  const s=world([[consumer,1,.4],['earthworm',1,.41],[alternate,1,.47]]),worm=s.organisms[1],p=s.organisms[0];p.hunger=1;surface(worm);if('hunger'in s.organisms[2])s.organisms[2].hunger=0;
  const f=createFeedingSystem(0,{environmentEventsEnabled:false});run(s,1.5,f);assert.equal(p.behaviorState,'eat');covered(worm);const meals=run(s,8,f);assert(s.organisms.includes(worm));assert(!meals.some(m=>m.foodSpeciesId==='earthworm'));assert(meals.some(m=>m.foodSpeciesId===alternate));
 });
}
test('15.8 last worm is not immune: two consumers share exactly one accessible prey',()=>{
 const s=world([['ladybird',1,.4],['field-mouse',1,.4],['earthworm',1,.41]]);for(const o of s.organisms.slice(0,2))o.hunger=1;surface(s.organisms[2]);const meals=run(s,4);assert.equal(meals.filter(m=>m.foodSpeciesId==='earthworm').length,1);assert.equal(s.population.totals.predation,1);assert(!s.organisms.some(o=>o.speciesId==='earthworm'));
});
test('15.8 exposure survives saved active clock; physical position or last count does not override cover',()=>{
 const s=world([['earthworm',1,.4]]),o=s.organisms[0];s.simulationTime=55;const life=structuredClone(o.life),state=earthwormAtSurface(o,s.simulationTime),snap=createSaveSnapshot(s,emptyMemory,'2026-10-19T00:00:00Z'),r=decodeSave(JSON.stringify(snap));assert.equal(r.status,'loaded');assert.deepEqual(r.state.organisms[0].life,life);assert.equal(earthwormAtSurface(r.state.organisms[0],55),state);
 const o2=structuredClone(o);o2.position={x:.9,y:.6};assert.equal(earthwormAtSurface(o2,55),state);assert.equal(Object.keys(snap.domain.organisms[0]).some(k=>/surface|exposure|cover/i.test(k)),false);
});
test('15.8 cover does not create litter/soil/points; real finite work still scales with living worms and environment',()=>{
 const s=world([['earthworm',1,.4],['litter-mold',1,.45]]);covered(s.organisms[0]);s.environment.soil.value=.45;s.decomposition.organicMatter={wood:0,litter:.001,remains:0};updateDecomposition(s,.5);
 assert(s.decomposition.earthwormProcessed>0&&s.decomposition.earthwormProcessed<.001);assert(Math.abs(s.decomposition.processed-.001)<1e-12);assert.equal(s.metrics.points,0);assert(s.decomposition.soilContribution>0);
 const prior=s.decomposition.earthwormProcessed;updateDecomposition(s,100);assert.equal(s.decomposition.earthwormProcessed,prior);s.decomposition.organicMatter.litter=1;s.environment.water.value=0;updateDecomposition(s,1);assert.equal(s.decomposition.earthwormProcessed,prior);
 s.environment.water.value=1;removeOrganism(s,s.organisms.find(o=>o.speciesId==='earthworm').instanceId,'release');updateDecomposition(s,100);assert.equal(s.decomposition.earthwormProcessed,prior);
});
test('15.8 real meal readiness spans a normal demand interval, but does not invent meals or reproduce without food',()=>{
 const s=world([['rabbit',2,.4],['grass',2,.405]]),rabbit=s.organisms[0];s.simulationTime=100;assert(!hasRecentMeal(rabbit,100));rabbit.lastSuccessfulFeedingAt=70;assert(hasRecentMeal(rabbit,100));rabbit.hunger=1;assert.equal(updateReproduction(s,.5,layout).length,0);
 s.organisms=s.organisms.filter(o=>o.speciesId!=='grass');s.population.breeding.rabbit={healthySeconds:180,nextAt:100};rabbit.hunger=.1;assert.equal(updateReproduction(s,.5,layout).length,0);
});
for(const id of ['grasshopper','rabbit'])test('15.8 '+id+': real eating leads to next generation before parent expiry; no reproduction at30 cap',()=>{
 const s=world([[id,1,.2],[id,1,.6],['grass',1,.2],['grass',1,.6]]);run(s,600);assert(s.population.totals.reproduction>0);assert(s.organisms.some(o=>o.speciesId===id&&o.instanceId.startsWith('organism-')));
 const bad=world([[id,1,.2],[id,1,.6],['grass',1,.2],['grass',1,.6]]);for(const e of Object.values(bad.environment))e.value=.15;run(bad,600);assert.equal(bad.population.history.filter(r=>r.speciesId===id&&r.cause==='reproduction').length,0);
 const full=world(Array.from({length:30},(_,i)=>['grass',1,.1+i*.01]));assert.equal(updateReproduction(full,600,layout).length,0);assert.equal(full.organisms.length,30);
});
test('15.8 natural life,larval stage exit,environment colony decline and student release remain distinct',()=>{
 for(const [id,cause]of [['grasshopper','natural_lifespan'],['caterpillar','life_stage_exit']]){const s=world([[id,1,.4]]),o=s.organisms[0];s.simulationTime=o.life.duration-o.life.initialAge+.5;updateLifespans(s,.5);assert.equal(s.population.history.at(-1).cause,cause);}
 const s=world([['litter-mold',1,.4]]);for(const e of Object.values(s.environment))e.value=0;updateLifespans(s,1000);assert.equal(s.population.history.at(-1).cause,'colony_decline');
 const a=world([['rabbit',1,.4]]);removeOrganism(a,a.organisms[0].instanceId,'release');assert.equal(a.population.history.at(-1).cause,'release');assert.equal(a.decomposition.organicMatter.remains,0);
});
test('15.8 existing16 save keeps remaining life,remaining satiety,hunger,breeding and points exactly',()=>{
 const s=world([['frog',1,.4],['earthworm',1,.5]]),o=s.organisms[0];s.simulationTime=100;o.hunger=.25;o.satietyUntil=220;o.lastSuccessfulFeedingAt=90;o.deprivationSeconds=12;s.population.breeding.rabbit={healthySeconds:17,nextAt:200};const snapshot=createSaveSnapshot(s,emptyMemory,'2026-10-19T00:00:00Z'),r=decodeSave(JSON.stringify(snapshot));assert.equal(r.status,'loaded');assert.equal(r.state.organisms[0].satietyUntil,220);assert.equal(r.state.organisms[0].hunger,.25);assert.deepEqual(r.state.organisms.map(o=>o.life),s.organisms.map(o=>o.life));assert.deepEqual(r.state.population.breeding,s.population.breeding);assert.deepEqual(r.state.pointEconomy,s.pointEconomy);assert.deepEqual(r.state.inventory,s.inventory);
});
test('15.8 a saved bite on a now-covered worm resumes safely without a fabricated meal or death',()=>{const s=world([['ladybird',1,.4],['earthworm',1,.41]]);s.simulationTime=100;const p=s.organisms[0];p.hunger=1;p.behaviorState='eat';p.targetInstanceId=s.organisms[1].instanceId;p.feedingClock={retryAt:100,eatRemaining:.5,pursuitSeconds:.5,shortage:false};covered(s.organisms[1]);const r=decodeSave(JSON.stringify(createSaveSnapshot(s,emptyMemory,'2026-10-19T00:00:00Z')));assert.equal(r.status,'loaded');assert.equal(run(r.state,.5).length,0);assert(r.state.organisms.some(o=>o.speciesId==='earthworm'));assert.equal(r.state.organisms[0].targetInstanceId,null);assert.equal(r.state.population.totals.predation||0,0);});
for(const version of [7,8,9])test('15.8 older save'+version+' restores actual prior achievements without offline deaths',()=>{const r=decodeSave(JSON.stringify(legacySave(version)));assert(['loaded','migrated','recovered'].includes(r.status),r.status);assert.equal(r.state.metrics.points,77);assert(r.state.organisms.length>0);assert(r.state.inventory.some(c=>c.acquired));});
test('15.8 measured survival audit covers all24 and fifteen real hunger systems',()=>{results.survival=auditSurvival('15.8-final');assert.equal(results.survival.species.length,24);assert.equal(results.survival.species.filter(s=>s.feeding).length,15);for(const s of results.survival.species.filter(s=>s.feeding)){assert.equal(s.noFood.cause,'starvation');assert(s.noFood.removedAt>=239);assert(s.actualFeeding.mealCount>0,s.id);assert(s.actualFeeding.searchTimes.length>0);assert.equal(s.noFood.meanFailedRetryInterval,2.5);}});
process.on('exit',code=>{if(process.env.WRITE_BIODIVERSITY)writeFileSync(new URL('./biodiversity.results.json',import.meta.url),JSON.stringify({...results,exitCode:code},null,2)+'\n');});
