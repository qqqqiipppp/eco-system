import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {audit,measure,mixed24,freshStudent,world,make} from './pacing-fixtures.mjs';
import {organisms} from '../data/organisms.js';
import {foodRelations} from '../data/food-relations.js';
import {PACING_REVISION,pacingConfig} from '../data/pacing-config.js';
import {createGameState} from '../js/state/game-state.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {effectiveAge,naturalEndAt} from '../js/state/life-state.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {removeOrganism} from '../js/systems/lifecycle.js';
import {organicNoticeCandidates} from '../js/systems/organic-notices.js';
import {createEventSystem} from '../js/systems/events.js';
import {updateDevelopment,canReproduce} from '../js/systems/development.js';
import {advanceManagement,executeManagement} from '../js/systems/management.js';
import {startEnvironmentEvent,updateEnvironmentEvents} from '../js/systems/environment-events.js';
import {studyCandidates,claimEnvironmentStudy,studyRecovery,claimRecoverySupport} from '../js/systems/point-economy.js';
import {legacySave,emptyMemory,layout} from './ecology-fixtures.mjs';
const old=JSON.parse(readFileSync(new URL('./pacing.baseline-results.json',import.meta.url))),prior=JSON.parse(readFileSync(new URL('./pacing.legacy-fixtures.json',import.meta.url)));
const current=audit(),near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`),snapshot=s=>createSaveSnapshot(s,emptyMemory,'2000-01-01T00:00:00Z');
test('13.6 A-D/Y: 24 IDs,5/16/3 roles,22 edges,revision2,actual .5 ecology/1 event tick unchanged',()=>{
 assert.equal(pacingConfig.ecologySpeed,2);assert.equal(organisms.length,24);assert.deepEqual(['producer','consumer','decomposer'].map(r=>organisms.filter(o=>o.role===r).length),[5,16,3]);assert.equal(foodRelations.length,22);assert.equal(current.ecologyConfig.tickSeconds,.5);assert.equal(createGameState().ecologyRevision,2);assert.equal(PACING_REVISION,1);
});
for(const o of organisms)test(`13.6 E: ${o.id} keeps species ratio and lifetime percentile at half duration`,()=>{
 const r=current.lifespanRules[o.id],b=old.settings.lifespanRules[o.id];near(r.min,b.min/2);near(r.max,b.max/2);const n=make(o.id);if(r.model==='individual'){assert(n.life.duration>=r.min&&n.life.duration<=r.max);near(n.life.initialAge/n.life.duration,b.initialAge);}else near(r.stressSeconds,b.stressSeconds/2);
});
for(const [id,r]of Object.entries(current.developmentRules))test(`13.6 F-H: ${id} keeps exact stages and only ecological growth duration is halved`,()=>{
 const b=old.settings.developmentRules[id];assert.equal(r.model,b.model);for(const k of ['maxSeconds','maturitySeconds','breedingSeconds','pendingSeconds'])if(k in r)near(r[k],b[k]/2);assert.deepEqual(r.stages.map(s=>[s.id,s.at]),b.stages.map(s=>[s.id,s.at/2]));
});
test('13.6 I-K: recovery,hunger,satiety,survival and finite egg/seed policies are scaled once,quantities fixed',()=>{
 for(const id of Object.keys(current.foodResourceConfig)){near(current.foodResourceConfig[id].recoveryPerSecond,old.settings.foodResourceConfig[id].recoveryPerSecond*2);assert.equal(current.foodResourceConfig[id].maximum,old.settings.foodResourceConfig[id].maximum);}
 for(const id of Object.keys(current.feedingConfig)){near(current.feedingConfig[id].hungerPerSecond,old.settings.feedingConfig[id].hungerPerSecond*2);assert.equal(current.feedingConfig[id].speed,old.settings.feedingConfig[id].speed);}
 for(const id of Object.keys(current.reproductionRules)){near(current.reproductionRules[id].healthySeconds,old.settings.reproductionRules[id].healthySeconds/2);near(current.reproductionRules[id].cooldown,old.settings.reproductionRules[id].cooldown/2);}
 assert.equal(current.replenishmentRules.grasshopper.reserveMaximum,6);assert.equal(current.populationConfig.introductionCooldown,60);
});
test('13.6 N-P: finite shared litter is processed once with one yield and bounded actual worm soil contribution',()=>{
 const s=world([['earthworm',3,.4],['litter-mold',1,.5]]);s.environment.soil.value=.5;s.decomposition.organicMatter={wood:0,litter:.01,remains:0};updateDecomposition(s,100);near(s.decomposition.processed,.01);near(s.decomposition.soilNutrients,.0003);assert(s.decomposition.earthwormProcessed>0&&s.decomposition.earthwormProcessed<.01);near(s.decomposition.soilContribution,s.decomposition.earthwormProcessed*.02);const before=structuredClone(s.decomposition);updateDecomposition(s,100);assert.deepEqual(s.decomposition,before);assert.equal(s.metrics.points,0);
 const dry=world([['earthworm',1,.4]]);dry.environment.water.value=0;updateDecomposition(dry,100);assert.equal(dry.decomposition.earthwormProcessed,0);assert.equal(dry.decomposition.soilContribution,0);
});
test('13.6 M/Q: only actual organic arrivals choose nearest,120 actual seconds interest retained and click is economically inert',()=>{
 const s=world([['grass',1,.4],['earthworm',1,.42],['litter-mold',1,.7]]);removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');assert.equal(organicNoticeCandidates(s)[0].worker.speciesId,'earthworm');s.simulationTime=90;assert.equal(organicNoticeCandidates(s).length,1);const e=createEventSystem(90);e.refresh(s);const event=s.events.find(e=>e.payload.organicOriginSequence),p=structuredClone(s.pointEconomy),d=s.decomposition.processed;e.acknowledge(s,event.eventId);assert.deepEqual(s.pointEconomy,p);assert.equal(s.decomposition.processed,d);assert.equal(s.metrics.points,0);assert.equal(organicNoticeCandidates(s).length,0);
 const other=world([['grasshopper',1,.4],['soil-bacteria',1,.42]]);removeOrganism(other,other.organisms[0].instanceId,'predation',{consumerSpeciesId:'frog'});assert.equal(other.decomposition.notices.sequence,0);
});
test('13.6 R/S: actual environmental episodes start 240,600,960; duration and recovery half without overlap',()=>{
 const m=measure(freshStudent(),20,{student:true,mode:'normal'});assert.deepEqual(m.data.episodes.map(e=>e.at),[240,600,960]);assert(m.data.episodes.every(e=>e.phase==='ended'));assert(m.data.cleared);assert.equal(m.data.starvation,0);assert(m.data.points>=0);for(const k of Object.keys(current.environmentEventDefinitions)){near(current.environmentEventDefinitions[k].duration,old.settings.environmentEventDefinitions[k].duration/2);near(current.environmentEventDefinitions[k].recoverySeconds,old.settings.environmentEventDefinitions[k].recoverySeconds/2);}
});
test('13.6 T/U/V: starting0,study4 capped5/20,aidonce28,costs/input cooldowns unchanged; booster is30sec',()=>{
 const s=createGameState();assert.equal(s.metrics.points,0);assert.deepEqual(current.managementActions.map(a=>[a.cost,a.cooldown]),[[6,8],[6,8],[5,45],[8,75]]);assert.equal(current.managementActions.at(-1).duration,30);
 for(let i=0;i<7;i++){const r=startEnvironmentEvent(s,'drought');advanceManagement(s,210);updateEnvironmentEvents(s);r.observed=true;r.choice='observe';claimEnvironmentStudy(s,r.eventId,{factor:r.factor,recovery:studyRecovery(r)});}
 assert.equal(s.pointEconomy.studyCount,5);assert.equal(s.pointEconomy.totals.study,20);assert.equal(s.metrics.points,20);
 let raw=structuredClone(prior.support13);for(let i=0;i<100;i++){const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');assert(r.state.recoverySupportUsed);assert.equal(r.state.pointEconomy.totals.support,28);assert(!claimRecoverySupport(r.state).ok);raw=snapshot(r.state);}
});
for(const version of [7,8,9,10,11,12,13,14])test(`13.6 X: genuine prior-time version${version} loads once,keeps living count,cash,cards and ignores calendar time`,()=>{
 let raw=version<10?legacySave(version):structuredClone(old.saved14);raw.schemaVersion=raw.domain.schemaVersion=version;delete raw.domain.pacingRevision;
 if(version<14&&raw.domain.decomposition){delete raw.domain.decomposition.notices;delete raw.domain.decomposition.soilContribution;delete raw.domain.decomposition.earthwormProcessed;}
 if(version<13){delete raw.domain.pointEconomy;delete raw.domain.recoverySupportUsed;}if(version<12)delete raw.domain.environmentEvents;if(version<11){delete raw.domain.development;for(const o of raw.domain.organisms)delete o.development;}
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');assert.equal(r.state.schemaVersion,15);assert.equal(r.state.organisms.length,raw.domain.organisms.length);assert.equal(r.state.metrics.points,raw.domain.metrics.points);assert.equal(r.state.simulationTime,raw.domain.simulationTime);for(const c of raw.domain.inventory.filter(c=>c.acquired))assert(r.state.inventory.find(n=>n.speciesId===c.speciesId).acquired);
 if(version>=10)for(const o of r.state.organisms){const b=raw.domain.organisms.find(b=>b.instanceId===o.instanceId);if('duration'in o.life){near(o.life.duration,b.life.duration/2);near(effectiveAge(o,r.state.simulationTime)/o.life.duration,(b.life.initialAge+r.state.simulationTime-b.life.startedAt)/b.life.duration);}}
 const again=decodeSave(JSON.stringify(snapshot(r.state)));assert.equal(again.status,'loaded');assert.deepEqual(again.state.organisms.map(o=>o.life),r.state.organisms.map(o=>o.life));assert.deepEqual(again.state.pointEconomy,r.state.pointEconomy);assert.equal(again.state.simulationTime,r.state.simulationTime);
});
test('13.6 X/Q/N: real prior14 worm records,organic pool,used soil budget and 120sec interest do not replay',()=>{
 const r=decodeSave(JSON.stringify(prior.worm14));assert.equal(r.status,'loaded');assert.deepEqual(r.state.decomposition,prior.worm14.domain.decomposition);assert.equal(r.state.organisms.find(o=>o.speciesId==='earthworm').litterConsumed,1);assert.equal(r.state.metrics.points,0);assert.equal(r.state.decomposition.notices.sequence,1);assert.equal(r.state.simulationTime,100);
});
test('13.6 X: future16 and unknown ecology/pacing are blocked; malformed current feeding cannot create a target or meal',()=>{
 for(const patch of [{schemaVersion:16},{ecologyRevision:9},{pacingRevision:9}]){const raw=snapshot(createGameState());if(patch.schemaVersion)raw.schemaVersion=raw.domain.schemaVersion=16;else Object.assign(raw.domain,patch);assert(decodeSave(JSON.stringify(raw)).blocked);}
 const s=world([['grass',1,.4],['grasshopper',1,.42]]),raw=snapshot(s);raw.domain.organisms[1].feeding={behavior:'eat',target:'missing',retryAt:0,eatRemaining:.5,pursuitSeconds:0,shortage:false};const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.organisms[1].behaviorState,'wander');assert.equal(r.state.metrics.points,0);
});
test('13.6 X: legacy young progress,pending egg/reproduction and active episode preserve relative elapsed/remaining time',()=>{
 const raw=structuredClone(old.saved14),t=raw.domain.simulationTime,o=raw.domain.organisms.find(o=>o.speciesId==='grass');o.development={origin:'seed-spread',progressSeconds:120};
 raw.domain.population.breeding.grass={healthySeconds:90,nextAt:t+120,pending:{remainingSeconds:40,position:{x:.4,y:.72}}};
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');assert.equal(r.state.organisms.find(n=>n.instanceId===o.instanceId).development.progressSeconds,60);assert.equal(r.state.population.breeding.grass.pending.remainingSeconds,20);assert.equal(r.state.population.breeding.grass.nextAt,t+60);assert.deepEqual(r.state.environment,raw.domain.environment);
});
for(const id of ['grass','grasshopper','rabbit'])test(`13.6 F/H actual ${id}: young to mature stage keeps identity,requires real food and cannot breed early`,()=>{
 const s=world([[id,1,.4]]),o=s.organisms[0],rule=current.developmentRules[id];for(const e of Object.values(s.environment))e.value=1;
 o.development={origin:({grass:'seed-spread',grasshopper:'egg-hatch',rabbit:'birth'})[id],progressSeconds:rule.breedingSeconds-.5,stage:rule.stages.findLast(r=>r.at<rule.breedingSeconds).id};
 if('hunger'in o){o.hunger=0;o.lastSuccessfulFeedingAt=0;}
 assert(!canReproduce(o,0));const before=o.instanceId,end=naturalEndAt(o);updateDevelopment(s,.5);assert(canReproduce(o,0));assert.equal(s.organisms.length,1);assert.equal(o.instanceId,before);assert.equal(naturalEndAt(o),end);assert.equal(s.metrics.points,0);
});
test('13.6 F/O: fungal fruiting90/spores150 are actual onecolony stages,not new individuals or extra nutrient receipts',()=>{
 const s=world([['mushroom',1,.4]]),o=s.organisms[0];for(const e of Object.values(s.environment))e.value=1;s.decomposition.organicMatter.wood=5;o.development.progressSeconds=89.5;updateDevelopment(s,.5);assert.equal(o.development.stage,'fruiting');o.development.progressSeconds=149.5;updateDevelopment(s,.5);assert.equal(o.development.stage,'spore-ready');assert.equal(s.organisms.length,1);assert.equal(s.metrics.points,0);assert.equal(s.decomposition.processed,0);
});
