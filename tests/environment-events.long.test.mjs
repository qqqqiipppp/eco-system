import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {organisms} from '../data/organisms.js';
import {activityById} from '../data/activities.js';
import {managementActions} from '../data/management-actions.js';
import {foodResourceConfig} from '../data/ecology-config.js';
import {environmentEventConfig as config,environmentEventDefinitions as definitions,environmentEventSequence} from '../data/environment-events.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {completeActivity} from '../js/systems/activities.js';
import {evaluateStability} from '../js/systems/stability.js';
import {updateForestGoal,evaluateForestGoal} from '../js/systems/forest-progress.js';
import {populationCounts} from '../js/systems/lifecycle.js';
import {developmentStage} from '../js/systems/development.js';
import {placeOrganism} from '../js/systems/placement.js';
import {availableManagement,availableEnvironmentalRecovery,executeManagement,validateManagement} from '../js/systems/management.js';
import {startEnvironmentEvent,currentEnvironmentEvent,chooseEnvironmentObservation} from '../js/systems/environment-events.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {world,make,layout,emptyMemory} from './ecology-fixtures.mjs';

const core=()=>world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7]],'long');
const representative=()=>world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7],['rabbit',2,.32]],'representative');
function mixed(){const s=world(organisms.filter(o=>o.id!=='earthworm').map((o,i)=>[o.id,1,.22+(i%5)*.035]),'long');s.organisms.push(...Array.from({length:3},(_,i)=>make('grass','extra-grass'+i,.45+i*.03)),...Array.from({length:3},(_,i)=>make('grasshopper','extra-gh'+i,.48+i*.03)),make('aphid','extra-aphid',.35));return s;}
// Established-forest comparison fixture: existing core discoveries and completed
// activities carry their once-only keys. The requested initial remaining budget
// is explicitly 30, not a claim that this setup was a fresh student session.
function prepared(s,budget=30){
 s.observations=['v2_grass_to_grasshopper','v2_grasshopper_to_frog'].map(relationId=>({relationId,eventId:'fixture-prior',discoveredAt:0}));
 s.rewardHistory=s.observations.map(o=>({rewardId:'observation:'+o.relationId,grantedAt:0,sourceId:'fixture-prior',amount:12}));
 s.metrics.stability=evaluateStability(s).score;
 for(const p of s.activities.filter(a=>!a.activityId.startsWith('explore_'))){const d=activityById[p.activityId],r=completeActivity(s,p.activityId,d.correctAnswer);assert(r.ok,p.activityId);}
 s.metrics.points=budget;return s;
}
function youngForest(){
 const s=prepared(world([['oak',2,.65],['grass',5,.2],['grasshopper',2,.4],['rabbit',1,.32],['mushroom',1,.7]],'impact'));
 s.decomposition.organicMatter.wood=10;
 s.organisms=s.organisms.map(o=>{
  if(!['grass','grasshopper','rabbit'].includes(o.speciesId))return o;
  const child=createOrganismInstance(o.speciesId,o.instanceId,o.position,{newborn:true});
  if(o.speciesId==='rabbit'){child.development.progressSeconds=90;child.development.stage='juvenile';}
  return child;
 });return s;
}
const costs=s=>s.managementHistory.reduce((sum,r)=>sum+r.cost,0);
function manage(s,events){
 const episode=currentEnvironmentEvent(s);if(!episode)return;
 if(episode.kind==='rain'){chooseEnvironmentObservation(s,episode.eventId,'wait');return;}
 const actionId={drought:'water-care',cloudy:'habitat-care','air-pollution':'habitat-care','soil-damage':'soil-care'}[episode.kind];
 if(episode.responses.some(r=>r.actionId===actionId))return;
 for(const event of s.events.filter(e=>e.status==='active'&&e.kind==='alert'&&e.sourceType==='environment'&&e.payload.factor===episode.factor)){
  const option=availableManagement(s,event.eventId).find(a=>a.actionId===actionId);if(!option?.available)continue;
  assert(validateManagement(s,actionId,event.eventId).ok);const before=s.metrics.points,answer=executeManagement(s,actionId,event.eventId);
  assert(answer.ok);assert.equal(s.metrics.points,before-managementActions.find(a=>a.actionId===actionId).cost);
  chooseEnvironmentObservation(s,episode.eventId,'observe');events.refresh(s);return;
 }
 // Air alone may not cross the weighted producer alert threshold. The existing
 // read-only environment panel still offers the separately validated paid
 // habitat recovery for a genuinely bad sunlight/air value.
 if(actionId==='habitat-care'&&availableEnvironmentalRecovery(s).some(o=>o.factor===episode.factor&&o.available)){
  const context={sourceType:'environment',sourceId:episode.factor},before=s.metrics.points;
  assert(validateManagement(s,actionId,context).ok);assert(executeManagement(s,actionId,context).ok);assert.equal(s.metrics.points,before-8);
  chooseEnvironmentObservation(s,episode.eventId,'observe');events.refresh(s);return;
 }
 if(episode.phase==='recovering')chooseEnvironmentObservation(s,episode.eventId,'wait');
}
function introduceOnce(s,actions){
 if(actions.length||s.organisms.some(o=>o.speciesId==='grasshopper'))return;
 for(const grass of s.organisms.filter(o=>o.speciesId==='grass')){
  const points=s.metrics.points,r=placeOrganism(s,'grasshopper',{position:{x:grass.position.x+.03,y:grass.position.y},isPlayArea:true,isUI:false},layout);
  if(!r.ok)continue;const loss=s.population.history.findLast(p=>p.speciesId==='grasshopper'&&p.countAfter===0);
  assert(loss);assert(s.simulationTime-loss.simulationTime>=60);assert.equal(s.metrics.points,points);
  actions.push({at:s.simulationTime,afterLossSeconds:s.simulationTime-loss.simulationTime,instanceId:r.instance.instanceId});return;
 }
}
function simulate(s,minutes,{enabled=true,management=false,reintroduction=false,memory,checkpoint,onTick}={}){
 const f=createFeedingSystem(s.simulationTime,{environmentEventsEnabled:enabled}),events=createEventSystem(s.simulationTime,memory),initial=populationCounts(s),initialPoints=s.metrics.points,initialLifetimeSpent=costs(s),initialLifetimeManagementCount=s.managementActionCount;
 const meals={},retainedResourceSupply={},seenGrowth=new Set(),growth={completed:0,transitions:0,bySpecies:{}},manual=[],minEnvironment=Object.fromEntries(Object.entries(s.environment).map(([k,v])=>[k,v.value]));let peak=s.organisms.length,checkpointReport;
 const report=()=>{const saved=createSaveSnapshot(s,events.exportMemory(),'2000-01-01T00:00:00Z');return {
  minutes:(s.simulationTime-start)/60,activeSeconds:s.simulationTime,initial,final:populationCounts(s),total:s.organisms.length,speciesCount:Object.keys(populationCounts(s)).length,
  stability:evaluateStability(s).score,environment:Object.fromEntries(Object.entries(s.environment).map(([k,v])=>[k,v.value])),minEnvironment:{...minEnvironment},
  actualMeals:{...meals},retainedResourceSupply:{...retainedResourceSupply},coreMeals:{grassToGrasshopper:meals.v2_grass_to_grasshopper||0,grasshopperToFrog:meals.v2_grasshopper_to_frog||0},changes:{...s.population.totals},
  growth:{...growth,bySpecies:{...growth.bySpecies}},grasshopperAdults:s.organisms.filter(o=>o.speciesId==='grasshopper'&&developmentStage(o)==='adult').length,
  remainingGrowth:s.organisms.filter(o=>o.development).map(o=>({instanceId:o.instanceId,speciesId:o.speciesId,stage:developmentStage(o),progress:o.development.progressSeconds,...('foodStock'in o?{foodStock:o.foodStock}:{})})),
  fungi:s.organisms.filter(o=>o.speciesId==='mushroom').map(o=>({stage:developmentStage(o),vigor:o.life.vigor})),
  episodes:structuredClone(s.environmentEvents.history),episodeCount:s.environmentEvents.sequence,managementCount:s.managementActionCount,spent:costs(s),
  lifetimeManagementCount:s.managementActionCount,lifetimeSpent:costs(s),initialLifetimeSpent,initialLifetimeManagementCount,
  duringRunSpent:costs(s)-initialLifetimeSpent,duringRunManagementCount:s.managementActionCount-initialLifetimeManagementCount,
  initialPoints,remainingPoints:s.metrics.points,earnedDuringRun:s.metrics.points-initialPoints+costs(s)-initialLifetimeSpent,
  managementHistory:structuredClone(s.managementHistory),manualReintroductions:[...manual],cleared:s.forestProgress.cleared,clearedAt:s.forestProgress.clearedAt,currentlyGoalReady:evaluateForestGoal(s).ready,
  lastGrasshopperLoss:s.population.history.findLast(r=>r.speciesId==='grasshopper'&&r.countAfter===0)||null,grasshopperIntroduction:structuredClone(s.population.introductions.grasshopper||null),eggReserve:s.population.replenishment.grasshopper?.reserve||0,pending:structuredClone(s.population.breeding),
  decomposition:structuredClone(s.decomposition),peak,diagnostics:f.getDiagnostics(),eventDiagnostics:events.getDiagnostics(),saveBytes:Buffer.byteLength(JSON.stringify(saved)),
  environmentEventsEnabled:enabled,visualWander:false,nutritionOrFoodOverrides:0,errors:0};};
 const start=s.simulationTime;
 for(let tick=0;tick<minutes*120;tick++){
  let ticked=false;
  for(let step=0;step<5;step++){
   const beforeStock=step===4?new Map(s.organisms.filter(o=>'foodStock'in o).map(o=>[o.instanceId,o.foodStock])):null;
   const r=f.update(s,.1,layout);peak=Math.max(peak,s.organisms.length);if(!r.ticked)continue;ticked=true;
   for(const e of r.feedingEvents)meals[e.relationId]=(meals[e.relationId]||0)+1;
   for(const o of s.organisms.filter(o=>beforeStock?.has(o.instanceId))){
    const consumed=r.feedingEvents.filter(e=>e.foodInstanceId===o.instanceId).length*foodResourceConfig[o.speciesId].portion;
    const retained=Math.max(0,o.foodStock+consumed-beforeStock.get(o.instanceId));retainedResourceSupply[o.speciesId]=(retainedResourceSupply[o.speciesId]||0)+retained;
   }
   events.update(s,.5,r.feedingEvents);
   // Existing discoveries/activities were completed in this established fixture.
   // A growth acknowledgement is free; environmental choices never food credit.
   for(const e of s.events.filter(e=>e.status==='active'&&e.payload.developmentSequence))assert(events.acknowledge(s,e.eventId).ok);
   if(management)manage(s,events);
   if(reintroduction)introduceOnce(s,manual);
   s.metrics.stability=evaluateStability(s).score;updateForestGoal(s,.5);
  }
  assert(ticked);for(const [k,v]of Object.entries(s.environment)){assert(v.value>=0&&v.value<=1);minEnvironment[k]=Math.min(minEnvironment[k],v.value);}
  for(const r of s.development.history){if(seenGrowth.has(r.sequence))continue;seenGrowth.add(r.sequence);growth.transitions++;if(['seeding','adult','spore-ready'].includes(r.stage)){growth.completed++;growth.bySpecies[r.speciesId]=(growth.bySpecies[r.speciesId]||0)+1;}}
  assert(s.organisms.length<=30);assert.equal(new Set(s.organisms.map(o=>o.instanceId)).size,s.organisms.length);assert(s.environmentEvents.history.length<=config.historyLimit);
  assert(s.environmentEvents.history.filter(r=>r.phase!=='ended').length<=1);for(const r of s.environmentEvents.history){assert(r.evidence.length<=config.evidenceLimit);assert(r.responses.length<=config.responseLimit);}
  if(onTick)onTick(s);
  if(checkpoint&&tick+1===checkpoint*120)checkpointReport=report();
 }
 assert.equal(f.getDiagnostics().ticks,minutes*120);const saved=createSaveSnapshot(s,events.exportMemory(),'2000-01-01T00:00:00Z'),loaded=decodeSave(JSON.stringify(saved));assert.equal(loaded.status,'loaded');
 return {state:s,report:report(),snapshot:saved,memory:events.exportMemory(),checkpointReport};
}
const emit=(number,value)=>console.log('ENVIRONMENT_LONG_'+number,JSON.stringify(value));
const grassProgress=s=>s.organisms.filter(o=>o.speciesId==='grass').reduce((sum,o)=>sum+o.development.progressSeconds,0);
const grassStock=s=>s.organisms.filter(o=>o.speciesId==='grass').reduce((sum,o)=>sum+o.foodStock,0);
function forced(kind,minutes=3,{management=false,water}={}){
 const s=youngForest();if(water!==undefined)s.environment.water.value=water;startEnvironmentEvent(s,kind);
 return simulate(s,minutes,{management});
}
function abc(factory,{checkpoint,reintroduction=false}={}){
 return {A:simulate(prepared(factory()),40,{enabled:false,checkpoint}),B:simulate(prepared(factory()),40,{checkpoint}),C:simulate(prepared(factory()),40,{management:true,reintroduction,checkpoint})};
}
function nearlyEqual(a,b,path=''){
 if(typeof a==='number'&&typeof b==='number'){assert(Math.abs(a-b)<=1e-9,path+': '+a+' vs '+b);return;}
 if(Array.isArray(a)){assert(Array.isArray(b));assert.equal(a.length,b.length,path);for(let i=0;i<a.length;i++)nearlyEqual(a[i],b[i],path+'['+i+']');return;}
 if(a&&typeof a==='object'){assert(b&&typeof b==='object');assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);for(const k of Object.keys(a))nearlyEqual(a[k],b[k],path+'.'+k);return;}
 assert.equal(a,b,path);
}

test('12 long 1: forced drought changes real water, slows young grass and reduces available plant resources against identical no-event control',()=>{
 const a=simulate(youngForest(),3,{enabled:false}),b=forced('drought');assert(b.state.environment.water.value<a.state.environment.water.value);
 assert(grassProgress(b.state)<grassProgress(a.state));assert(b.report.retainedResourceSupply.grass<a.report.retainedResourceSupply.grass);assert(b.report.coreMeals.grassToGrasshopper<a.report.coreMeals.grassToGrasshopper);assert(b.report.episodes[0].appliedDelta<0);
 assert(b.report.episodes[0].evidence.some(e=>e.type==='growth-delay'||e.type==='producer-decline'));emit(1,{noEvent:a.report,drought:b.report});
});
test('12 long 2: same drought fixture uses an available paid water action once and improves real water/growth/resources',()=>{
 const a=forced('drought',4),b=forced('drought',4,{management:true});assert.equal(b.report.managementCount,1);assert.equal(b.report.spent,6);
 assert(b.state.environment.water.value>a.state.environment.water.value);assert(grassProgress(b.state)>=grassProgress(a.state));assert(grassStock(b.state)>grassStock(a.state));
 assert.equal(b.report.episodes[0].responses[0].actionId,'water-care');emit(2,{unassisted:a.report,managed:b.report});
});
test('12 long 3: positive rain improves an initially ordinary water environment while waiting costs no points',()=>{
 const a=youngForest();a.environment.water.value=.6;const noRain=simulate(a,2,{enabled:false}),r=forced('rain',2,{water:.6,management:true});
 assert(r.state.environment.water.value>noRain.state.environment.water.value);assert(grassProgress(r.state)>grassProgress(noRain.state));assert.equal(r.report.managementCount,0);assert.equal(r.report.spent,0);
 assert.equal(r.report.episodes[0].choice,'wait');assert.equal(r.report.episodes[0].phase,'ended');emit(3,{noRain:noRain.report,waiting:r.report});
});
test('12 long 4: cloudy teaching episode lowers sunlight only and slows real young grass without treating clouds as air pollution',()=>{
 const a=simulate(youngForest(),2,{enabled:false}),b=forced('cloudy',2);assert(b.state.environment.sunlight.value<a.state.environment.sunlight.value);assert.equal(b.state.environment.air.value,1);
 assert(grassProgress(b.state)<grassProgress(a.state));assert.equal(b.report.episodes[0].factor,'sunlight');emit(4,{noEvent:a.report,cloudy:b.report});
});
test('12 long 5: air pollution affects existing development/colony conditions and paid habitat recovery remains a distinct action',()=>{
 const a=forced('air-pollution',3),b=forced('air-pollution',3,{management:true});assert(a.report.episodes[0].appliedDelta<0);assert.equal(a.report.episodes[0].factor,'air');
 assert.equal(b.report.managementCount,1);assert.equal(b.report.spent,8);assert(b.state.environment.air.value>=a.state.environment.air.value);
 assert(a.report.episodes[0].evidence.some(e=>['growth-delay','colony-decline','producer-decline'].includes(e.type)));emit(5,{unassisted:a.report,managed:b.report});
});
test('12 long 6: human soil damage lowers actual soil and a paid soil action protects existing growth/feeding/decomposition models',()=>{
 const a=forced('soil-damage',4),b=forced('soil-damage',4,{management:true});assert.equal(a.report.episodes[0].factor,'soil');assert.equal(b.report.managementCount,1);assert.equal(b.report.spent,6);
 assert(b.state.environment.soil.value>a.state.environment.soil.value);assert(grassProgress(b.state)>=grassProgress(a.state));assert(b.state.decomposition.processed>=a.state.decomposition.processed);
 emit(6,{unassisted:a.report,managed:b.report});
});
test('12 long 7: automatic forty-minute core ABC has two-to-four spaced deterministic episodes and no overlapping damaging episode',()=>{
 const r=abc(core);assert.equal(r.A.report.total,9);assert.equal(r.A.report.speciesCount,5);assert.equal(r.A.report.stability,100);
 for(const mode of ['B','C']){assert(r[mode].report.episodeCount>=2&&r[mode].report.episodeCount<=4);assert.deepEqual(r[mode].report.episodes.map(e=>e.kind),['drought','rain','cloudy']);}
 assert.equal(r.A.report.episodeCount,0);assert.equal(r.A.report.managementCount,0);assert(r.C.report.managementCount>0);emit(7,Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v.report])));
});
test('12 long 8: continuous40 and20-save20 preserve event phases/effects, environment, actual population, growth, pending, points and management',()=>{
 const a=prepared(core()),b=prepared(core());const continuous=simulate(a,40,{management:true}),first=simulate(b,20,{management:true}),loaded=decodeSave(JSON.stringify(first.snapshot));assert.equal(loaded.status,'loaded');
 const second=simulate(loaded.state,20,{management:true,memory:loaded.eventMemory});
 nearlyEqual(a.environmentEvents,second.state.environmentEvents,'episodes');nearlyEqual(a.environment,second.state.environment,'environment');
 nearlyEqual(a.organisms.map(o=>({instanceId:o.instanceId,speciesId:o.speciesId,life:o.life,development:o.development,growth:o.growth,foodStock:o.foodStock,hunger:o.hunger})),second.state.organisms.map(o=>({instanceId:o.instanceId,speciesId:o.speciesId,life:o.life,development:o.development,growth:o.growth,foodStock:o.foodStock,hunger:o.hunger})),'organisms');
 nearlyEqual(a.population.breeding,second.state.population.breeding,'pending');nearlyEqual(a.development,second.state.development,'growthHistory');
 assert.equal(a.metrics.points,second.state.metrics.points);assert.equal(a.managementActionCount,second.state.managementActionCount);assert.equal(costs(a),costs(second.state));assert.equal(a.forestProgress.cleared,second.state.forestProgress.cleared);
 const wholeMeals=Object.fromEntries([...new Set([...Object.keys(first.report.actualMeals),...Object.keys(second.report.actualMeals)])].map(key=>[key,(first.report.actualMeals[key]||0)+(second.report.actualMeals[key]||0)]));
 const resumedWhole40={minutes:40,actualMeals:wholeMeals,coreMeals:{grassToGrasshopper:wholeMeals.v2_grass_to_grasshopper||0,grasshopperToFrog:wholeMeals.v2_grasshopper_to_frog||0},
  duringRunSpent:first.report.duringRunSpent+second.report.duringRunSpent,duringRunManagementCount:first.report.duringRunManagementCount+second.report.duringRunManagementCount,
  earnedDuringRun:first.report.earnedDuringRun+second.report.earnedDuringRun,initialPoints:first.report.initialPoints,remainingPoints:second.report.remainingPoints};
 assert.deepEqual(resumedWhole40.actualMeals,continuous.report.actualMeals);assert.equal(resumedWhole40.duringRunSpent,continuous.report.duringRunSpent);assert.equal(resumedWhole40.earnedDuringRun,continuous.report.earnedDuringRun);
 emit(8,{continuous:continuous.report,first20:first.report,resumedLast20:second.report,resumedWhole40,eventsEnvironmentGrowthLifePendingAndPointsEqual:true});
});
test('12 long 9: exact 23-type/30-instance mixed ABC compares genuine existing eleven-six baseline against sequential new events',()=>{
 const r=abc(mixed);assert.equal(r.A.report.total,11);assert.equal(r.A.report.speciesCount,9);assert.equal(r.A.report.stability,70);for(const v of Object.values(r))assert.equal(v.report.peak,30);
 emit(9,Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v.report])));
});
test('12 long 10: representative same-seed ABC reports unassisted and legitimate paid/card management at35 and40 minutes',()=>{
 const r=abc(representative,{checkpoint:35,reintroduction:true});assert.equal(r.A.report.total,10);assert.equal(r.A.report.speciesCount,5);assert.equal(r.A.report.stability,86);
 for(const v of Object.values(r))assert(v.state.forestProgress.cleared);assert(r.C.report.managementCount>0);assert(r.C.report.spent<=r.C.report.initialPoints);
 // Report the unaltered forty-minute result. If a legitimate cooldown still
 // blocks a just-lost consumer, measure an additional two active minutes rather
 // than bypassing that wait or claiming the earlier forest had every species.
 const followup=!r.C.state.organisms.some(o=>o.speciesId==='grasshopper')?simulate(r.C.state,2,{management:true,reintroduction:true,memory:r.C.memory}):null;
 if(followup){assert.equal(followup.report.manualReintroductions.length,1);assert(followup.state.organisms.some(o=>o.speciesId==='grasshopper'));assert.equal(followup.report.spent,r.C.report.spent);assert.equal(followup.report.duringRunSpent,0);assert.equal(followup.report.duringRunManagementCount,0);assert.equal(followup.report.earnedDuringRun,0);assert(evaluateForestGoal(followup.state).ready);}
 emit(10,{...Object.fromEntries(Object.entries(r).map(([k,v])=>[k,{at35:v.checkpointReport,at40:v.report}])),...(followup?{C_after40_recoveryCheck:followup.report}:{})});
});
test('12 long 11: zero finite budget cannot execute paid care, uses limited episodes and recovers without injected points/food',()=>{
 const s=prepared(core(),0),r=simulate(s,40,{management:true});assert.equal(r.report.initialPoints,0);assert.equal(r.report.remainingPoints,0);assert.equal(r.report.managementCount,0);assert.equal(r.report.spent,0);
 assert(r.report.episodeCount>=2&&r.report.episodeCount<=4);assert(r.report.episodes.every(e=>e.intensity===config.limitedIntensity));
 assert(Object.values(r.report.environment).every(v=>v>=.4));assert(r.report.episodes.filter(e=>definitions[e.kind].magnitude<0).every(e=>e.recoveredDelta>0));assert(r.state.forestProgress.cleared);assert(evaluateForestGoal(r.state).ready);
 emit(11,r.report);
});
test('12 long 12: fresh student ordinary introduction, real first meal, explicit discovery/activity/frog unlock and second meal happen before any incident',()=>{
 const s=createGameState(),f=createFeedingSystem(),events=createEventSystem();assert.equal(s.metrics.points,0);assert.equal(s.inventory.filter(c=>c.acquired).length,5);
 assert(placeOrganism(s,'grasshopper',{position:{x:.44,y:.7},isPlayArea:true,isUI:false},layout).ok);let first=null,second=null;
 for(let step=0;step<1200&&!second;step++){
  const r=f.update(s,.1,layout);if(r.ticked)events.update(s,.5,r.feedingEvents);
  const insight=s.events.find(e=>e.kind==='insight'&&e.status==='active'&&e.payload.relationId);if(!insight)continue;
  assert(events.acknowledge(s,insight.eventId).ok);
  if(insight.payload.relationId==='v2_grass_to_grasshopper'&&!first){first=s.simulationTime;assert(completeActivity(s,'grass_observation').ok);assert(s.inventory.find(c=>c.speciesId==='frog').acquired);assert(placeOrganism(s,'frog',{position:{x:.44,y:.7},isPlayArea:true,isUI:false},layout).ok);}
  if(insight.payload.relationId==='v2_grasshopper_to_frog')second=s.simulationTime;
 }
 assert(first!==null&&second>first);assert(second<config.initialDelay);assert.equal(s.environmentEvents.sequence,0);assert.equal(s.observations.length,2);assert.equal(s.metrics.points,28);
 assert(!s.organisms.find(o=>o.speciesId==='frog').development);emit(12,{firstMealAt:first,secondMealAt:second,observations:s.observations,points:s.metrics.points,episodes:s.environmentEvents.sequence,nutritionOrFoodOverrides:0,errors:0});
});
