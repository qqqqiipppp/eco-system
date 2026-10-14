import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {createEnvironmentEventState} from '../js/state/environment-event-state.js';
import {stageAt} from '../js/state/development-state.js';
import {createSaveSnapshot,decodeSave,SAVE_VERSION} from '../js/services/save-format.js';
import {createSaveService} from '../js/services/save-service.js';
import {environmentEventConfig as config,environmentEventDefinitions as definitions,environmentEventSequence} from '../data/environment-events.js';
import {startEnvironmentEvent,updateEnvironmentEvents,chooseEnvironmentObservation} from '../js/systems/environment-events.js';
import {naturalEndAt} from '../js/state/life-state.js';
import {foodStockCapacity} from '../js/systems/food-resources.js';
import {grantReward} from '../js/systems/rewards.js';
import {advanceManagement} from '../js/systems/management.js';
import {forestGoal} from '../data/forest-goal.js';
import {legacySave,emptyMemory} from './ecology-fixtures.mjs';

const snapshot=(s,date='2000-01-01T00:00:00Z')=>createSaveSnapshot(s,emptyMemory,date);
const reload=s=>decodeSave(JSON.stringify(snapshot(s)));
const advance=(s,seconds)=>{advanceManagement(s,seconds);return updateEnvironmentEvents(s);};
function operationalState(){
 const s=createGameState();s.simulationTime=1000;s.environmentEvents=createEnvironmentEventState(s.simulationTime);
 s.organisms=[['grass','seed-spread',100],['grasshopper','egg-hatch',50],['rabbit','birth',120],['mushroom','introduced',190]].map(([id,origin,progress])=>{
  const o=createOrganismInstance(id,'preserved-'+id,{x:.4,y:.72},{time:900,newborn:origin!=='introduced',origin});
  o.development.progressSeconds=progress;o.development.stage=stageAt(id,progress);if('foodStock'in o)o.foodStock=foodStockCapacity(o)*.7;
  if('hunger'in o){o.hunger=.3;o.lastSuccessfulFeedingAt=990;o.deprivationSeconds=7;o.foodShortageDuration=2;}
  return o;
 });
 s.inventory.forEach(c=>c.acquired=true);s.metrics.points=49;s.metrics.bestStability=97;
 s.observations=[{relationId:'v2_grass_to_grasshopper',eventId:'meal-prior',discoveredAt:800}];
 s.legacyEcology.observations=[{relationId:'grasshopper_to_frog',eventId:'historic',discoveredAt:400}];
 s.legacyEcology.pendingDiscoveries=[['hazel_to_aphid',{consumerInstanceId:'gone-aphid'}]];
 s.rewardHistory=[{rewardId:'observation:v2_grass_to_grasshopper',grantedAt:800,sourceId:'meal-prior',amount:12},{rewardId:'observation:grasshopper_to_frog',grantedAt:400,sourceId:'historic',amount:12}];
 s.population.breeding={grass:{healthySeconds:0,nextAt:1100,pending:{remainingSeconds:0,position:{x:.3,y:.72}}},grasshopper:{healthySeconds:0,nextAt:1200,pending:{remainingSeconds:30,position:{x:.35,y:.72}}}};
 s.population.replenishment.grasshopper={healthySeconds:100,nextAt:1180,reserve:2};
 s.population.introductions=Object.fromEntries(s.organisms.map(o=>[o.speciesId,{count:3,nextAt:1040}]));
 s.development={sequence:2,history:[{sequence:1,instanceId:'gone-hare',speciesId:'rabbit',stage:'juvenile',simulationTime:800,noted:true},{sequence:2,instanceId:'gone-hare',speciesId:'rabbit',stage:'adult',simulationTime:850,noted:false}]};
 s.decomposition={organicMatter:{wood:5,litter:6,remains:7},soilNutrients:.6,processed:8};
 s.environment={sunlight:{value:.9},water:{value:.73},air:{value:.8},soil:{value:.67}};
 s.forestProgress={cleared:true,clearedAt:950,stableSeconds:forestGoal.stableSeconds};
 s.managementHistory=[{actionId:'water-care',sourceEventId:'event-prior',sourceId:'water',executedAt:998,cost:6,result:'applied',factor:'water',valueAfter:.73}];
 s.managementActionCount=1;s.managementCooldowns={'water-care':1006};s.managementEffects=[{actionId:'habitat-care',startedAt:990,expiresAt:1050,multiplier:1.35}];
 return s;
}
// Exact pre-episode contract: all retained v11 fields are valid, and the new
// environmentEvents field is absent. v10 additionally predates development.
function priorSave(version){
 if(version<10){const raw=legacySave(version);delete raw.domain.environmentEvents;return raw;}
 const raw=snapshot(operationalState());raw.schemaVersion=raw.domain.schemaVersion=version;delete raw.domain.environmentEvents;
 if(version===10){delete raw.domain.development;for(const o of raw.domain.organisms)delete o.development;for(const m of Object.values(raw.domain.population.breeding))delete m.pending;}
 return raw;
}
function episode(kind='drought',elapsed=45){
 const s=operationalState();for(const v of Object.values(s.environment))v.value=1;
 startEnvironmentEvent(s,kind);advance(s,elapsed);return s;
}
function protectedData(s){
 return {environment:s.environment,life:s.organisms.map(o=>o.life),development:s.organisms.map(o=>o.development),growthHistory:s.development,
  breeding:s.population.breeding,replenishment:s.population.replenishment,inventory:s.inventory,points:s.metrics.points,observations:s.observations,
  legacyEcology:s.legacyEcology,rewardHistory:s.rewardHistory,decomposition:s.decomposition,activities:s.activities,cleared:s.forestProgress.cleared};
}

test('environment save: schema13 snapshots whitelist episode fields and detach nested records from runtime data',()=>{
 const s=episode(),record=s.environmentEvents.history[0];record.runtimeNode={html:'not save data'};s.environmentEvents.debugOverride=true;
 record.evidence.push({instanceId:'gone-grass',speciesId:'grass',type:'growth-delay',at:s.simulationTime});
 const raw=snapshot(s);assert.equal(SAVE_VERSION,13);assert.equal(raw.schemaVersion,13);assert.equal(raw.domain.schemaVersion,13);assert.equal(s.schemaVersion,13);
 assert(!('debugOverride'in raw.domain.environmentEvents));assert(!('runtimeNode'in raw.domain.environmentEvents.history[0]));
 raw.domain.environmentEvents.history[0].evidence[0].type='producer-decline';assert.equal(record.evidence[0].type,'growth-delay');
 assert.equal(raw.domain.ecologyRevision,2);assert.equal(raw.domain.inventory.length,23);
});

test('environment save: genuine v11 keeps growth/life/pending/current+historic observations and schedules after restored active time',()=>{
 const raw=priorSave(11),r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');assert.equal(r.state.schemaVersion,13);
 assert.deepEqual(r.state.environmentEvents,createEnvironmentEventState(raw.domain.simulationTime));
 assert.deepEqual(r.state.environment,raw.domain.environment);assert.deepEqual(r.state.organisms.map(o=>o.life),raw.domain.organisms.map(o=>o.life));
 assert.deepEqual(r.state.organisms.map(o=>({origin:o.development.origin,progressSeconds:o.development.progressSeconds})),raw.domain.organisms.map(o=>o.development));
 assert.deepEqual(r.state.development,raw.domain.development);assert.deepEqual(r.state.population.breeding,raw.domain.population.breeding);assert.deepEqual(r.state.population.replenishment,raw.domain.population.replenishment);
 assert.deepEqual(r.state.inventory,raw.domain.inventory);assert.deepEqual(r.state.observations,raw.domain.observations);assert.deepEqual(r.state.legacyEcology,raw.domain.legacyEcology);
 assert.equal(r.state.metrics.points,49);assert.deepEqual(r.state.decomposition,raw.domain.decomposition);assert(r.state.forestProgress.cleared);
 assert.deepEqual(r.state.managementCooldowns,raw.domain.managementCooldowns);assert.deepEqual(r.state.managementEffects,raw.domain.managementEffects);
 assert.equal(r.state.managementHistory[0].result,'interrupted');assert.equal(r.state.managementActionCount,1);
 assert.equal(grantReward(r.state,'observation','v2_grass_to_grasshopper','new'),0);assert.equal(grantReward(r.state,'observation','v2_grasshopper_to_frog','new'),0);
});

test('environment save: versions7/8/9/10 preserve independent ecology/development migrations and receive no retroactive incident',()=>{
 for(const version of [7,8,9,10]){
  const raw=priorSave(version),r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded',String(version));
  assert.equal(r.state.simulationTime,raw.domain.simulationTime);assert.deepEqual(r.state.environment,raw.domain.environment);
  assert.deepEqual(r.state.environmentEvents,createEnvironmentEventState(raw.domain.simulationTime));assert.equal(r.state.metrics.points,raw.domain.metrics.points);
  assert.equal(r.state.organisms.length,raw.domain.organisms.length);assert.equal(r.state.environmentEvents.nextAt,raw.domain.simulationTime+config.initialDelay);
  if(version<10){assert.equal(r.state.observations.length,0);assert.equal(r.state.legacyEcology.observations.length,raw.domain.observations.length);}
  else{assert.deepEqual(r.state.observations,raw.domain.observations);assert.deepEqual(r.state.legacyEcology,raw.domain.legacyEcology);assert.deepEqual(r.state.organisms.map(o=>o.life),raw.domain.organisms.map(o=>o.life));}
 }
});

test('environment save: each of five actual active episode kinds restores time/effect progress without changing its environmental value',()=>{
 for(const kind of environmentEventSequence){
  const s=episode(kind),before=structuredClone(s.environment),r=reload(s);assert.equal(r.status,'loaded',kind);
  assert.deepEqual(r.state.environmentEvents,s.environmentEvents);assert.deepEqual(r.state.environment,before);
  assert.equal(updateEnvironmentEvents(r.state),false);assert.deepEqual(r.state.environment,before);assert.deepEqual(r.state.environmentEvents,s.environmentEvents);
 }
});

test('environment save: actual recovering and ended phases never restart an ended effect or roll back paid improvement',()=>{
 const s=episode('drought',definitions.drought.duration+60),r=reload(s);assert.equal(r.status,'loaded');assert.equal(r.state.environmentEvents.history[0].phase,'recovering');
 assert.deepEqual(r.state.environmentEvents,s.environmentEvents);assert.deepEqual(r.state.environment,s.environment);
 r.state.environment.water.value=.95;advance(r.state,definitions.drought.recoverySeconds);assert.equal(r.state.environment.water.value,.95);
 const ended=reload(r.state);assert.equal(ended.status,'loaded');assert.equal(ended.state.environmentEvents.activeId,null);assert.equal(ended.state.environmentEvents.history[0].phase,'ended');
 const before=structuredClone(ended.state.environment);updateEnvironmentEvents(ended.state);assert.deepEqual(ended.state.environment,before);assert.equal(ended.state.environmentEvents.activeId,null);
 const rain=episode('rain',definitions.rain.duration),rainReload=reload(rain);assert.equal(rainReload.status,'loaded');assert.equal(rainReload.state.environmentEvents.history[0].phase,'ended');assert.equal(rainReload.state.environmentEvents.activeId,null);
});

test('environment save: 100 round trips preserve active episode, observations, endpoints, funded egg and points without offline advance',()=>{
 const original=episode(),record=original.environmentEvents.history[0];assert(chooseEnvironmentObservation(original,record.eventId,'wait').ok);
 const before=structuredClone(protectedData(original)),memory=structuredClone(original.environmentEvents),clock=original.simulationTime;
 const endpoints=original.organisms.filter(o=>o.life.duration).map(naturalEndAt);let state=original;
 for(let i=0;i<100;i++){
  const r=reload(state);assert.equal(r.status,'loaded');state=r.state;
  assert.equal(state.simulationTime,clock);assert.deepEqual(state.environmentEvents,memory);assert.deepEqual(protectedData(state),before);
  assert.deepEqual(state.organisms.filter(o=>o.life.duration).map(naturalEndAt),endpoints);assert.equal(state.population.replenishment.grasshopper.reserve,2);
  assert.equal(updateEnvironmentEvents(state),false);assert.equal(state.metrics.points,before.points);
 }
});

test('environment save: one next ecology-time step after reload matches uninterrupted episode and repeated same tick is harmless',()=>{
 const continuous=episode('cloudy',63.5),r=reload(continuous);assert.equal(r.status,'loaded');
 advance(continuous,.5);advance(r.state,.5);assert.deepEqual(r.state.environment,continuous.environment);assert.deepEqual(r.state.environmentEvents,continuous.environmentEvents);
 const before=structuredClone(r.state.environmentEvents),environment=structuredClone(r.state.environment);
 for(let i=0;i<5;i++)assert.equal(updateEnvironmentEvents(r.state),false);
 assert.deepEqual(r.state.environmentEvents,before);assert.deepEqual(r.state.environment,environment);
});

test('environment save: exact start, half-second phase boundaries and early recovery completion are valid active-clock records',()=>{
 for(const [kind,times]of [['drought',[0,.5,45,179.5,180,180.5,240,419.5,420]],['rain',[0,.5,119.5,120,120.5]]])for(const elapsed of times){
  const s=episode(kind,elapsed),r=reload(s);assert.equal(r.status,'loaded',`${kind}:${elapsed}`);
  assert.deepEqual(r.state.environmentEvents,s.environmentEvents);assert.deepEqual(r.state.environment,s.environment);
  assert.equal(updateEnvironmentEvents(r.state),false);assert.deepEqual(r.state.environment,s.environment);
 }
 const s=episode('drought',definitions.drought.duration+30);s.environment.water.value=.95;
 updateEnvironmentEvents(s);assert.equal(s.environmentEvents.history[0].phase,'ended');
 advance(s,100);const r=reload(s);assert.equal(r.status,'loaded');assert.equal(r.state.environment.water.value,.95);
 assert.deepEqual(r.state.environmentEvents,s.environmentEvents);assert.equal(updateEnvironmentEvents(r.state),false);
});

test('environment save: contradictory applied clocks are dropped without replaying environmental damage or recovery',()=>{
 for(const [elapsed,patch]of [[45,{effectSeconds:0}],[45,{effectSeconds:44.5}],[240,{recoveryElapsed:0}],[240,{recoveryElapsed:59.5}],[240,{effectEndedAt:1180.5}],[420,{recoveryElapsed:0}]]){
  const s=episode('drought',elapsed),raw=snapshot(s);Object.assign(raw.domain.environmentEvents.history[0],patch);
  const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered',JSON.stringify(patch));
  assert.equal(r.state.environmentEvents.activeId,null);assert.equal(r.state.environmentEvents.history.length,0);
  assert.deepEqual(protectedData(r.state),protectedData(s));
  const before=structuredClone(r.state.environment);assert.equal(updateEnvironmentEvents(r.state),false);
  assert.deepEqual(r.state.environment,before);advance(r.state,.5);assert.deepEqual(r.state.environment,before);
 }
});

test('environment save: wall-clock savedAt dates do not advance incidents, environmental values or biological life',()=>{
 const s=episode(),a=decodeSave(JSON.stringify(snapshot(s,'1900-01-01T00:00:00Z'))),b=decodeSave(JSON.stringify(snapshot(s,'2099-01-01T00:00:00Z')));
 assert.equal(a.status,'loaded');assert.equal(b.status,'loaded');assert.equal(a.state.simulationTime,s.simulationTime);
 assert.deepEqual(a.state.environmentEvents,b.state.environmentEvents);assert.deepEqual(protectedData(a.state),protectedData(b.state));assert.deepEqual(a.state.environment,s.environment);
});

test('environment save: completed history remains bounded and unique while one active record survives overflow recovery',()=>{
 const s=createGameState();s.organisms=[];s.metrics.points=20;
 for(let i=0;i<25;i++){const kind=environmentEventSequence[i%5],d=definitions[kind];assert(startEnvironmentEvent(s,kind));advance(s,d.duration+d.recoverySeconds);assert.equal(s.environmentEvents.activeId,null);}
 assert.equal(s.environmentEvents.history.length,config.historyLimit);assert.equal(reload(s).status,'loaded');
 const active=startEnvironmentEvent(s,'drought');advance(s,10);const raw=snapshot(s);
 raw.domain.environmentEvents.history.unshift({...raw.domain.environmentEvents.history[0],eventId:'environment-999'});
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.environmentEvents.history.length,config.historyLimit);
 assert.equal(r.state.environmentEvents.activeId,active.eventId);assert.equal(new Set(r.state.environmentEvents.history.map(o=>o.eventId)).size,config.historyLimit);
 assert.deepEqual(r.state.environment,s.environment);assert.equal(r.state.metrics.points,20);
});

test('environment save: malformed episode contract repairs only episodes and rejects dictionary names, wrong factors and invalid progress',()=>{
 for(const patch of [{kind:'constructor'},{kind:'__proto__'},{factor:'air'},{phase:'unknown'},{duration:999},{intensity:.2},{floor:.1},{effectSeconds:NaN},{effectSeconds:181},{appliedDelta:1},{recoveryTarget:1},{startedAt:2000}]){
  const s=episode(),raw=snapshot(s);Object.assign(raw.domain.environmentEvents.history[0],patch);
  const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered',JSON.stringify(patch));assert.equal(r.state.environmentEvents.history.length,0);assert.equal(r.state.environmentEvents.activeId,null);
  assert.deepEqual(protectedData(r.state),protectedData(s));
 }
 const s=episode(),raw=snapshot(s);delete raw.domain.environmentEvents;const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.deepEqual(r.state.environmentEvents,createEnvironmentEventState(s.simulationTime));assert.deepEqual(r.state.environment,s.environment);
});

test('environment save: invalid nested evidence/responses are removed without fabricating observation, changing cost or replaying management',()=>{
 const s=episode(),record=s.environmentEvents.history[0],raw=snapshot(s),saved=raw.domain.environmentEvents.history[0];
 const evidence={instanceId:'gone-grass',speciesId:'grass',type:'growth-delay',at:s.simulationTime};
 saved.evidence=[evidence,{...evidence,speciesId:'constructor'},{...evidence,type:'invented'},evidence];
 const response={actionId:'water-care',at:s.simulationTime,cost:6,factor:'water',beforeValue:.35,afterValue:.6};
 saved.responses=[response,{...response,cost:0},{...response,actionId:'free-water'},{...response,factor:'temperature'},response];
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');const loaded=r.state.environmentEvents.history[0];
 assert.deepEqual(loaded.evidence,[evidence]);assert.deepEqual(loaded.responses,[response]);assert.equal(loaded.observed,record.observed);assert.equal(r.state.metrics.points,s.metrics.points);
 assert.deepEqual(r.state.environment,s.environment);assert.deepEqual(r.state.observations,s.observations);assert.deepEqual(r.state.rewardHistory,s.rewardHistory);
 assert.equal(reload(r.state).status,'loaded');
});

test('environment save: activeId recovers one continuing record, never reactivates ended history and bounds schedule/cursor',()=>{
 const s=episode(),raw=snapshot(s);raw.domain.environmentEvents.history.push({...raw.domain.environmentEvents.history[0],eventId:'environment-2'});
 raw.domain.environmentEvents.sequence=2;raw.domain.environmentEvents.cursor=999;raw.domain.environmentEvents.nextAt=1e20;
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.environmentEvents.activeId,'environment-1');assert.equal(r.state.environmentEvents.history.length,1);
 assert(r.state.environmentEvents.cursor<environmentEventSequence.length);assert(r.state.environmentEvents.nextAt<=s.simulationTime+config.interval);
 const ended=episode('rain',definitions.rain.duration),endedRaw=snapshot(ended);endedRaw.domain.environmentEvents.activeId=endedRaw.domain.environmentEvents.history[0].eventId;
 const restored=decodeSave(JSON.stringify(endedRaw));assert.equal(restored.status,'recovered');assert.equal(restored.state.environmentEvents.activeId,null);assert.equal(restored.state.environmentEvents.history[0].phase,'ended');
});

test('environment save: observation choices and paid-response factor variants persist without any new point rewards',()=>{
 const s=episode(),record=s.environmentEvents.history[0],points=s.metrics.points;
 record.evidence=[{instanceId:'gone-colony',speciesId:'mushroom',type:'colony-recovery',at:s.simulationTime}];
 record.responses=[{actionId:'food-support',at:s.simulationTime,cost:5,factor:null,beforeValue:.8,afterValue:.15},{actionId:'soil-care',at:s.simulationTime,cost:6,factor:'soil',beforeValue:.35,afterValue:.6}];
 for(const choice of ['observe','wait','observe'])assert(chooseEnvironmentObservation(s,record.eventId,choice).ok);
 const r=reload(s);assert.equal(r.status,'loaded');assert.deepEqual(r.state.environmentEvents,s.environmentEvents);assert.equal(r.state.metrics.points,points);assert.deepEqual(r.state.rewardHistory,s.rewardHistory);
 assert(chooseEnvironmentObservation(r.state,record.eventId,'wait').ok);assert.equal(r.state.metrics.points,points);assert.deepEqual(r.state.observations,s.observations);
});

test('environment save: future14 and unknown ecology revisions remain blocked and cannot overwrite the original local save',()=>{
 for(const version of [10,11,12]){const raw=version<12?priorSave(version):snapshot(createGameState());raw.domain.ecologyRevision=999;const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'unknown-ecology');assert(r.blocked);}
 const raw=snapshot(createGameState());raw.schemaVersion=raw.domain.schemaVersion=14;const source=JSON.stringify(raw);let writes=0;
 const service=createSaveService({adapter:{read:()=>source,write:()=>writes++,remove(){}},getState:createGameState,getEventMemory:()=>emptyMemory});
 const r=service.load();assert.equal(r.status,'future-version');assert(r.blocked);service.schedule();assert.equal(service.flush(true),false);assert.equal(writes,0);service.dispose();
});

test('environment save: legitimately elapsed event cooldowns are discarded as normal memory rather than damaging an active saved episode',()=>{
 const s=episode('cloudy'),raw=snapshot(s);raw.eventMemory.cooldowns=[['growth:sunlight',s.simulationTime-20],['investigate:sunlight',s.simulationTime-3],['growth:water',s.simulationTime+10]];
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');assert.deepEqual(r.eventMemory.cooldowns,[['growth:water',s.simulationTime+10]]);assert.deepEqual(r.state.environmentEvents,s.environmentEvents);assert.deepEqual(r.state.environment,s.environment);
});
