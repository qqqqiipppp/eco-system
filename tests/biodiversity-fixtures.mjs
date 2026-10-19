// Developer diagnostics only: no student flags, timers, telemetry, or grants.
import assert from 'node:assert/strict';
import {organisms,organismById} from '../data/organisms.js';
import {foodRelations,foodRelationById} from '../data/food-relations.js';
import {feedingConfig} from '../data/ecology-config.js';
import {satietySeconds} from '../data/population-config.js';
import {survivalConfig} from '../data/survival-config.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createWanderSystem} from '../js/systems/wander.js';
import {createEventSystem} from '../js/systems/events.js';
import {evaluateStability} from '../js/systems/stability.js';
import {updateForestGoal} from '../js/systems/forest-progress.js';
import {removeOrganism,populationCounts} from '../js/systems/lifecycle.js';
import {survivalStage} from '../js/systems/population.js';
import {currentEnvironmentEvent,chooseEnvironmentObservation} from '../js/systems/environment-events.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {make,world,layout} from './ecology-fixtures.mjs';
import {mixed24,study} from './pacing-fixtures.mjs';
import {freshStudent,learn,manage,introduce} from './point-economy-fixtures.mjs';

export const biodiversitySeeds=[12345,51,777];
export const biodiversityScenarios=['unmanaged24','managed24','food-poor','predator-heavy','fresh-student'];
export const wormScenarios=['worm-only','worm-beetle','worm-hedgehog','worm-weasel','worm-three-predators','worms-three-predators','worm-rich-litter','worm-managed'];
export function biodiversityWorld(kind){
 if(kind==='fresh-student')return freshStudent();
 if(kind.startsWith('worm')){
  const predators=kind==='worm-beetle'?['ladybird']:kind==='worm-hedgehog'?['field-mouse']:kind==='worm-weasel'?['weasel']:['worm-three-predators','worms-three-predators','worm-managed'].includes(kind)?['ladybird','field-mouse','weasel']:[];
  const s=world([['earthworm',kind==='worms-three-predators'?3:1,.42],...predators.map((id,i)=>[id,1,.45+i*.03])],'bio-'+kind);
  // An explicit imperfect soil fixture lets the real, capped contribution be measured.
  s.environment.soil.value=.45;
  if(kind==='worm-rich-litter')s.decomposition.organicMatter.litter=12;
  return s;
 }
 const s=mixed24();
 if(kind==='food-poor')s.organisms=s.organisms.filter(o=>organismById[o.speciesId].role!=='producer'||o.instanceId==='fixture-1-0');
 if(kind==='predator-heavy'){
  s.organisms=s.organisms.filter(o=>!o.instanceId.startsWith('pacing-extra-'));
  for(const [n,id]of ['ladybird','field-mouse','weasel'].entries())for(let i=0;i<2;i++)s.organisms.push(make(id,`bio-extra-${id}-${i}`,.25+n*.1+i*.035));
 }
 return s;
}

// Synchronous comparison boundary. Values are restored even when assertions fail.
// hungerScale is relative to the uncompressed historical rate (15.7 = 2).
// satietyScale is relative to the uncompressed historical duration (15.7 = .5).
const originalRates=Object.fromEntries(Object.entries(feedingConfig).map(([id,c])=>[id,c.hungerPerSecond/survivalConfig.hungerScale]));
const originalSatiety=Object.fromEntries(Object.entries(satietySeconds).map(([id,s])=>[id,s/survivalConfig.satietyScale]));
export function withSurvivalCandidate({hungerScale=survivalConfig.hungerScale,satietyScale=survivalConfig.satietyScale,configure,...policy}={},run){
 const rates=Object.fromEntries(Object.entries(feedingConfig).map(([id,c])=>[id,c.hungerPerSecond])),satiety={...satietySeconds};
 let restore;const previous={...survivalConfig};
 try{Object.assign(survivalConfig,policy,{hungerScale,satietyScale});for(const [id,c]of Object.entries(feedingConfig))c.hungerPerSecond=originalRates[id]*hungerScale;for(const id of Object.keys(satietySeconds))satietySeconds[id]=originalSatiety[id]*satietyScale;restore=configure?.();return run();}
 finally{for(const [id,value]of Object.entries(rates))feedingConfig[id].hungerPerSecond=value;Object.assign(satietySeconds,satiety);Object.assign(survivalConfig,previous);restore?.();}
}

function legalManagement(s,events,kind,actions){
 if(kind==='fresh-student'&&s.simulationTime%30===0)learn(s,events,{maintain:true});
 if(!['managed24','worm-managed','fresh-student'].includes(kind))return;
 const episode=currentEnvironmentEvent(s)||s.environmentEvents.history.at(-1);
 if(episode)chooseEnvironmentObservation(s,episode.eventId,episode.kind==='rain'?'wait':'observe');
 if(s.simulationTime%30===0){const before=s.managementHistory.length;manage(s,events,{mode:'normal',oncePerEpisode:true});if(s.managementHistory.length>before)actions.push({at:s.simulationTime,type:'paid-management',record:structuredClone(s.managementHistory.at(-1))});study(s);}
 if(kind==='worm-managed'&&s.simulationTime===30){const result=introduce(s,'grass',.3);actions.push({at:30,type:'introduction-attempt',speciesId:'grass',ok:result.ok,reason:result.reason||null});}
 if(!['managed24','worm-managed'].includes(kind)||!(kind==='worm-managed'?[120,300,600,900]:[300,600,900]).includes(s.simulationTime))return;
 // A deliberate choice: reduce simultaneous pressure before trying a legal return.
 for(const o of [...s.organisms])if(['field-mouse','weasel','ladybird'].includes(o.speciesId)){
  removeOrganism(s,o.instanceId,'release');actions.push({at:s.simulationTime,type:'release',instanceId:o.instanceId,speciesId:o.speciesId});
 }
 const wanted=kind==='worm-managed'?['earthworm']:['grass','oak','pine','raspberry','hazel','mushroom','litter-mold','soil-bacteria','earthworm','grasshopper','rabbit','caterpillar','aphid','snail','chipmunk','tit','bulbul','frog','snake','goshawk'];
 for(const [index,id]of wanted.entries())if(!s.organisms.some(o=>o.speciesId===id)){
  let result;
  for(const x of [.15+(index%6)*.1,.3,.45,.6,.75]){result=introduce(s,id,x);if(result.ok)break;}
  actions.push({at:s.simulationTime,type:'introduction-attempt',speciesId:id,ok:result.ok,reason:result.reason||null});
 }
}

export function runBiodiversity({kind='unmanaged24',seed=12345,seconds=1200,state=biodiversityWorld(kind),memory,environmentEventsEnabled=true,onTick,actionsEnabled=true,splitAt=null}={}){
 let s=state,f=createFeedingSystem(s.simulationTime,{environmentEventsEnabled}),events=createEventSystem(s.simulationTime,memory),random=seed;
 const newWander=()=>createWanderSystem(()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;});
 let wander=newWander();
 const records=new Map(),meals=[],samples=[],changes=[],speciesTransitions=[],actions=[],consumerSpecies=new Set(),participatingSpecies=new Set(),relations=new Set(),predated=new Set(),saveChecks=[];
 const start=s.simulationTime,end=start+seconds;let peak=s.organisms.length,sequence=s.population.sequence,priorCounts=populationCounts(s),lastSample=start;
 const register=(o,at,cause='initial')=>records.set(o.instanceId,{instanceId:o.instanceId,speciesId:o.speciesId,createdAt:at,creationCause:cause,naturalLifetime:o.life.duration??null,initialAge:o.life.initialAge??null,removedAt:null,removalCause:null,consumerSpeciesId:null,lifetime:null,meals:0,mealTimes:[],firstHungryAt:null,firstSevereAt:null,shortageSeconds:0,litterConsumed:o.litterConsumed??null});
 for(const o of s.organisms)register(o,start);
 const sample=()=>{const counts=populationCounts(s),alive=new Set(Object.keys(counts)),graphSpecies=new Set(foodRelations.filter(r=>alive.has(r.sourceSpeciesId)&&alive.has(r.targetSpeciesId)).flatMap(r=>[r.sourceSpeciesId,r.targetSpeciesId]));return{at:s.simulationTime,total:s.organisms.length,species:alive.size,counts,roleSpecies:Object.fromEntries(['producer','consumer','decomposer'].map(role=>[role,[...alive].filter(id=>organismById[id].role===role).length])),roleIndividuals:Object.fromEntries(['producer','consumer','decomposer'].map(role=>[role,s.organisms.filter(o=>organismById[o.speciesId].role===role).length])),liveGraphSpecies:graphSpecies.size,everFeedingConsumerSpecies:consumerSpecies.size,everFoodParticipants:participatingSpecies.size,actualRelations:relations.size,meals:meals.length,predations:predated.size,processed:s.decomposition.processed,wormProcessed:s.decomposition.earthwormProcessed,soilContribution:s.decomposition.soilContribution,soilNutrients:s.decomposition.soilNutrients,organicMatter:{...s.decomposition.organicMatter},environment:Object.fromEntries(Object.entries(s.environment).map(([id,e])=>[id,e.value])),stability:evaluateStability(s).score,points:s.metrics.points,cleared:s.forestProgress.cleared,clearedAt:s.forestProgress.clearedAt,populationTotals:{...s.population.totals}};};
 samples.push(sample());
 for(let frame=0;frame<Math.round(seconds*30);frame++){
  const before=new Map(s.organisms.map(o=>[o.instanceId,o])),r=f.update(s,1/30,layout);
  wander.forget(r.removedIds);wander.update(s.organisms,1/30,layout);
  for(const meal of r.feedingEvents){assert(before.has(meal.foodInstanceId));const entry={at:s.simulationTime,...meal};meals.push(entry);relations.add(meal.relationId);consumerSpecies.add(meal.consumerSpeciesId);participatingSpecies.add(meal.foodSpeciesId);participatingSpecies.add(meal.consumerSpeciesId);const record=records.get(meal.consumerInstanceId);record.meals++;record.mealTimes.push(s.simulationTime);if(foodRelationById[meal.relationId].feedingMode==='predation'){assert(r.removedIds.includes(meal.foodInstanceId));assert(!predated.has(meal.foodInstanceId));predated.add(meal.foodInstanceId);}}
  if(!r.ticked)continue;
  events.update(s,.5,r.feedingEvents);
  for(const notice of s.events.filter(n=>n.status==='active'&&n.payload.relationId))events.acknowledge(s,notice.eventId);
  if(actionsEnabled)legalManagement(s,events,kind,actions);
  onTick?.(s,events,{actions});
  s.metrics.stability=evaluateStability(s).score;updateForestGoal(s,.5);
  const newChanges=s.population.history.filter(c=>c.sequence>sequence);sequence=s.population.sequence;changes.push(...structuredClone(newChanges));
  const current=new Map(s.organisms.map(o=>[o.instanceId,o]));
  const used=new Set();
  for(const [id,o]of before){
   const record=records.get(id);if(!record)continue;
   if(current.has(id)){record.litterConsumed=o.litterConsumed??null;if(o.feedingClock?.shortage)record.shortageSeconds+=.5;if('hunger'in o&&o.hunger>=feedingConfig[o.speciesId].hungryAt&&record.firstHungryAt===null)record.firstHungryAt=s.simulationTime;if(['severe','weak'].includes(survivalStage(o))&&record.firstSevereAt===null)record.firstSevereAt=s.simulationTime;continue;}
   const meal=r.feedingEvents.find(m=>m.foodInstanceId===id&&predated.has(id));
   const change=newChanges.find(c=>!used.has(c.sequence)&&c.speciesId===o.speciesId&&c.countAfter<c.countBefore&&(!meal||c.cause==='predation'&&c.consumerSpeciesId===meal.consumerSpeciesId));
   assert(change,`Missing removal cause ${id} at ${s.simulationTime}: ${JSON.stringify({newChanges,used:[...used],meal})}`);used.add(change.sequence);
   Object.assign(record,{removedAt:s.simulationTime,removalCause:change.cause,consumerSpeciesId:change.consumerSpeciesId??null,lifetime:s.simulationTime-record.createdAt,litterConsumed:o.litterConsumed??null});
  }
  for(const [id,o]of current)if(!records.has(id)){const change=newChanges.find(c=>!used.has(c.sequence)&&c.speciesId===o.speciesId&&c.countAfter>c.countBefore);assert(change,`Missing birth cause ${id}`);used.add(change.sequence);register(o,s.simulationTime,change.cause);}
  const counts=populationCounts(s);
  for(const id of organisms.map(o=>o.id)){if((priorCounts[id]||0)>0&&!counts[id])speciesTransitions.push({at:s.simulationTime,speciesId:id,type:'extinct-in-current-forest'});else if(!priorCounts[id]&&counts[id])speciesTransitions.push({at:s.simulationTime,speciesId:id,type:'returned-or-first-appeared'});}
  priorCounts=counts;peak=Math.max(peak,s.organisms.length);assert(s.organisms.length<=30);assert(s.metrics.points>=0);assert.equal(s.rewardHistory.length,new Set(s.rewardHistory.map(x=>x.rewardId)).size);
  if(s.simulationTime-lastSample>=300||s.simulationTime>=end){samples.push(sample());lastSample=s.simulationTime;}
  if(splitAt!==null&&s.simulationTime===start+splitAt){const snapshot=createSaveSnapshot(s,events.exportMemory(),'2026-10-19T00:00:00Z'),loaded=decodeSave(JSON.stringify(snapshot));assert.equal(loaded.status,'loaded');assert.deepEqual(loaded.state.inventory,s.inventory);assert.deepEqual(loaded.state.observations,s.observations);assert.deepEqual(loaded.state.rewardHistory,s.rewardHistory);assert.deepEqual(loaded.state.pointEconomy,s.pointEconomy);saveChecks.push({at:s.simulationTime,status:loaded.status,points:s.metrics.points,inventory:true,observations:true,rewards:true,pointEconomy:true,transientWanderRestarted:true});s=loaded.state;events=createEventSystem(s.simulationTime,loaded.eventMemory);f=createFeedingSystem(s.simulationTime,{environmentEventsEnabled});random=seed;wander=newWander();}
 }
 const individuals=[...records.values()].map(record=>({...record,observedLifetime:record.lifetime??s.simulationTime-record.createdAt,alive:record.removedAt===null,meanMealInterval:record.mealTimes.length>1?(record.mealTimes.at(-1)-record.mealTimes[0])/(record.mealTimes.length-1):null}));
 return {state:s,memory:events.exportMemory(),snapshot:createSaveSnapshot(s,events.exportMemory(),'2026-10-16T00:00:00Z'),data:{kind,seed,start,end:s.simulationTime,environmentEventsEnabled,actualMovementHz:30,ecologyTickSeconds:.5,peak,samples,final:sample(),individuals,changes,speciesTransitions,meals,actions,saveChecks,diagnostics:f.getDiagnostics(),wormIndividuals:individuals.filter(o=>o.speciesId==='earthworm'),causeCounts:Object.fromEntries([...new Set(individuals.filter(o=>o.removalCause).map(o=>o.removalCause))].map(c=>[c,individuals.filter(o=>o.removalCause===c).length])),environmentEvents:structuredClone(s.environmentEvents.history),development:structuredClone(s.development),breeding:structuredClone(s.population.breeding),replenishment:structuredClone(s.population.replenishment),pointsLedger:structuredClone(s.pointEconomy),rewardHistory:structuredClone(s.rewardHistory),managementHistory:structuredClone(s.managementHistory),inventory:structuredClone(s.inventory),isStudentObservation:false,managementPolicy:'Every30s existing affordable care and learning; every300s release worm predators then legal card return attempts. No grants or hidden placement bypass.'}};
}
