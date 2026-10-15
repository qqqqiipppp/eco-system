import {collectionSnapshot,restoreCollection} from './collection-migration.js';
import {ecologyConfig,feedingConfig} from '../../data/ecology-config.js';
import {PACING_REVISION} from '../../data/pacing-config.js';
import {migratePacingInput,compressLife} from './pacing-migration.js';
import {createGameState} from '../state/game-state.js';
import {createOrganismInstance} from '../state/organism-instance.js';
import {organismById} from '../../data/organisms.js';
import {activityById} from '../../data/activities.js';
import {discoveryEvents,eventConfig} from '../../data/event-config.js';
import {environmentFactors,growthConfig} from '../../data/environment-config.js';
import {managementActions,rewardConfig} from '../../data/management-actions.js';
import {forestGoal} from '../../data/forest-goal.js';
import {populationConfig,reproductionRules,decompositionConfig,satietySeconds} from '../../data/population-config.js';
import {relationFor} from '../../data/food-relations.js';
import {lifespanRules,replenishmentRules} from '../../data/lifespan-config.js';
import {ECOLOGY_REVISION,changedDietIds} from '../../data/species-taxonomy.js';
import {legacyEcology,legacyRelationIds} from '../../data/legacy-ecology.js';
import {restoreEcologyHistory,migrateLife} from './ecology-migration.js';
import {restoreInstanceDevelopment,restoreDevelopmentHistory,restoreBreedingPending} from './development-migration.js';
import {foodStockCapacity} from '../systems/food-resources.js';
import {snapshotEnvironmentEvents,restoreEnvironmentEvents} from './environment-event-migration.js';
import {snapshotPointEconomy,restorePointEconomy} from './point-economy-migration.js';
import {snapshotDecomposition,restoreDecompositionDetails} from './decomposition-migration.js';

export const SAVE_VERSION=16;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
const text=value=>typeof value==='string'?value.slice(0,100):'';
const own=(value,key)=>Object.hasOwn(value,key);

// Explicit whitelist. v15 preserves a validated feeding decision for continuity;
// event objects, DOM, layout and UI selection never enter the save.
export function createSaveSnapshot(state,eventMemory,savedAt) {
 return {schemaVersion:SAVE_VERSION,savedAt,domain:{
  ...collectionSnapshot(state),schemaVersion:SAVE_VERSION,pacingRevision:PACING_REVISION,ecologyRevision:ECOLOGY_REVISION,legacyEcology:structuredClone(state.legacyEcology),ecosystemId:'forest',simulationTime:state.simulationTime,nextInstanceSequence:state.nextInstanceSequence,
  inventory:state.inventory.map(({speciesId,acquired})=>({speciesId,acquired})),
  organisms:state.organisms.map(item=>{
   const saved={instanceId:item.instanceId,speciesId:item.speciesId,position:{...item.position}};
   for(const key of ['growth','foodStock','hunger','foodShortageDuration','lastSuccessfulFeedingAt','deprivationSeconds','bornAt','satietyUntil','acclimationUntil'])if(key in item)saved[key]=item[key];
   const keys=lifespanRules[item.speciesId].model==='colony'?['renewalSeconds','nextRenewalAt','vigor','stressSeconds','generation']:['startedAt','initialAge','duration'];
   saved.life=Object.fromEntries(keys.map(key=>[key,item.life[key]]));
   if('hunger'in item&&item.feedingClock)saved.feeding={behavior:item.behaviorState,target:item.targetInstanceId,...item.feedingClock};
   if(item.development)saved.development={origin:item.development.origin,progressSeconds:item.development.progressSeconds};
   if(item.speciesId==='earthworm'){saved.litterConsumed=item.litterConsumed;saved.lastLitterFeedingAt=item.lastLitterFeedingAt;}
   return saved;
  }),
  environment:Object.fromEntries(Object.entries(state.environment).map(([key,item])=>[key,{value:item.value}])),
  metrics:{points:state.metrics.points,bestStability:state.metrics.bestStability},
  pointEconomy:snapshotPointEconomy(state),
  recoverySupportUsed:state.recoverySupportUsed,
  observations:state.observations.map(({relationId,eventId,discoveredAt})=>({relationId,eventId,discoveredAt})),
  activities:state.activities.map(({activityId,completed,attempts,completedAt,lastAnswer,ecologyRevision})=>({activityId,completed,attempts,completedAt,lastAnswer,...(ecologyRevision===1?{ecologyRevision:1}:{})})),
  rewardHistory:state.rewardHistory.map(({rewardId,grantedAt,sourceId,amount})=>({rewardId,grantedAt,sourceId,amount})),
  managementHistory:state.managementHistory.map(({actionId,sourceEventId,sourceId,executedAt,cost,result,factor,valueAfter,targetFactor,beforeValue,afterValue,supportUsed,roundSupportUsed,directEnvironment})=>({actionId,sourceEventId,sourceId,executedAt,cost,result,factor,valueAfter,targetFactor,beforeValue,afterValue,supportUsed,roundSupportUsed,directEnvironment})),
  managementActionCount:state.managementActionCount,
  managementCooldowns:{...state.managementCooldowns},
  managementEffects:state.managementEffects.map(({actionId,startedAt,expiresAt,multiplier})=>({actionId,startedAt,expiresAt,multiplier})),
  forestProgress:{...state.forestProgress},
  population:{sequence:state.population.sequence,totals:{...state.population.totals},
    history:state.population.history.map(({sequence,speciesId,changeType,cause,simulationTime,countBefore,countAfter,consumerSpeciesId,mode,noted,ecologyRevision})=>({sequence,speciesId,changeType,cause,simulationTime,countBefore,countAfter,consumerSpeciesId,mode,noted,...(ecologyRevision===1?{ecologyRevision:1}:{})})),
    breeding:Object.fromEntries(Object.entries(state.population.breeding).map(([id,v])=>[id,{healthySeconds:v.healthySeconds,nextAt:v.nextAt,...(v.pending?{pending:{remainingSeconds:v.pending.remainingSeconds,position:{x:v.pending.position.x,y:v.pending.position.y}}}:{})}])),
    replenishment:Object.fromEntries(Object.entries(state.population.replenishment).map(([id,v])=>[id,{healthySeconds:v.healthySeconds,nextAt:v.nextAt,...(replenishmentRules[id]?.seedBank?{reserve:v.reserve||0}:{})}])),
    introductions:Object.fromEntries(Object.entries(state.population.introductions).map(([id,v])=>[id,{count:v.count,nextAt:v.nextAt}]))},
  decomposition:snapshotDecomposition(state.decomposition),
  development:{sequence:state.development?.sequence||0,history:(state.development?.history||[]).map(({sequence,instanceId,speciesId,stage,simulationTime,noted})=>({sequence,instanceId,speciesId,stage,simulationTime,noted}))},
  environmentEvents:snapshotEnvironmentEvents(state.environmentEvents,state.simulationTime),
 },eventMemory};
}

export function decodeSave(raw) {
 const fresh=(status,blocked=false)=>({state:createGameState(),eventMemory:null,savedAt:null,status,blocked});
 if(raw===null||raw===undefined)return fresh('new');
 let input;
 try {if(typeof raw!=='string'||raw.length>1000000)return fresh('damaged');input=JSON.parse(raw);}catch{return fresh('damaged');}
 if(!object(input)||!Number.isInteger(input.schemaVersion))return fresh('missing-version');
 if(![7,8,9,10,11,12,13,14,15,SAVE_VERSION].includes(input.schemaVersion))return fresh(input.schemaVersion>SAVE_VERSION?'future-version':'old-version',true);
 const d=input.domain;
 let roundRepaired=false;
 if(input.schemaVersion>=16&&object(d)){const initial=createGameState();for(const [k,test]of [['organisms',Array.isArray],['environment',object]])if(!test(d[k])){d[k]=initial[k];roundRepaired=true;}}
 if(!object(d)||d.schemaVersion!==input.schemaVersion||d.ecosystemId!=='forest'||!Array.isArray(d.organisms)||!Array.isArray(d.inventory)||!object(d.environment)||!object(d.metrics))return fresh('damaged');
 if(input.schemaVersion>=10&&d.ecologyRevision!==ECOLOGY_REVISION)return fresh('unknown-ecology',true);
 if(input.schemaVersion>=15&&d.pacingRevision!==PACING_REVISION)return fresh('unknown-pacing',true);
 migratePacingInput(input);
 const previous=input.schemaVersion<10;
 let repaired=roundRepaired;
 const number=(value,min,max,fallback=0)=>{if(!Number.isFinite(value)){repaired=true;return fallback;}const v=Math.max(min,Math.min(max,value));if(v!==value)repaired=true;return v;};
 const array=(value,max)=>{if(!Array.isArray(value)){repaired=true;return [];}if(value.length>max)repaired=true;return value.slice(0,max);};
 const state=createGameState();
 state.simulationTime=number(d.simulationTime,0,1e9);
 const time=value=>number(value,0,state.simulationTime);
 const permanentTime=value=>number(value,0,Math.min(1e9,state.simulationTime+(Number.isFinite(d.profile?.elapsedBeforeRound)?Math.max(0,d.profile.elapsedBeforeRound):0)));
 state.legacyEcology=restoreEcologyHistory(d,input.schemaVersion,{array,number,time},input.eventMemory);
 state.metrics.points=Math.floor(number(d.metrics.points,0,1e6));
 state.metrics.bestStability=number(d.metrics.bestStability,0,100);
 for(const key of Object.keys(environmentFactors))state.environment[key]={value:number(d.environment[key]?.value,0,1,1)};
 const cards=array(d.inventory,100);
 const seenCards=new Set();
 for(const card of cards){if(!card||!own(organismById,card.speciesId)||typeof card.acquired!=='boolean'||seenCards.has(card.speciesId))repaired=true;else seenCards.add(card.speciesId);}
 state.inventory.forEach(card=>{const saved=cards.find(item=>item?.speciesId===card.speciesId);card.acquired=card.acquired||saved?.acquired===true;});
 const ids=new Set();
 state.organisms=[];
 for(const item of array(d.organisms,30)){
  if(!object(item)||!own(organismById,item.speciesId)||input.schemaVersion<14&&item.speciesId==='earthworm'||!validId(item.instanceId)||ids.has(item.instanceId)||!object(item.position)||!Number.isFinite(item.position.x)||!Number.isFinite(item.position.y)){repaired=true;continue;}
  // v7/v8 get a safe relative adult age starting at RESTORED active time.
  // bornAt continues to mean introduction/adaptation time, not biological birth.
  const organism=createOrganismInstance(item.speciesId,item.instanceId,{x:number(item.position.x,0,1),y:number(item.position.y,0,1)},{time:state.simulationTime});
  if(input.schemaVersion>=9){
   const l=item.life,rule=(previous?legacyEcology.lifespan:lifespanRules)[item.speciesId],bounded=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
   const valid=object(l)&&(rule.model==='individual'?
    bounded(l.duration,rule.min,rule.max)&&bounded(l.startedAt,0,state.simulationTime)&&bounded(l.initialAge,0,l.duration):
    bounded(l.renewalSeconds,rule.min,rule.max)&&bounded(l.nextRenewalAt,0,state.simulationTime+rule.max)&&bounded(l.vigor,0,1)&&bounded(l.stressSeconds,0,rule.stressSeconds)&&Number.isInteger(l.generation)&&bounded(l.generation,0,1e9));
   if(valid){const keys=rule.model==='individual'?['duration','startedAt','initialAge']:['renewalSeconds','nextRenewalAt','vigor','stressSeconds','generation'];const life=Object.fromEntries(keys.map(key=>[key,l[key]]));organism.life=previous?(rule.model==='individual'?migrateLife(organism,life,state.simulationTime):compressLife(life,state.simulationTime)):life;}
   else repaired=true;
  }
  organism.development=restoreInstanceDevelopment(organism,item.development,input.schemaVersion,{number,repair:()=>{repaired=true;}});
  if(!organism.development)delete organism.development;
  if('growth' in organism)organism.growth=number(item.growth,growthConfig.minimumGrowth,1,1);
  // Older oak/rabbit instances predate their resource/feeding fields. Initialize
  // only absent newly supported fields; do not treat definition expansion as damage.
  if('foodStock' in organism){const capacity=foodStockCapacity(organism);organism.foodStock=item.foodStock===undefined?capacity:number(item.foodStock,0,capacity);}
  if('hunger' in organism){organism.hunger=item.hunger===undefined?organism.hunger:number(item.hunger,0,1,organism.hunger);organism.foodShortageDuration=item.foodShortageDuration===undefined?0:number(item.foodShortageDuration,0,1e6);organism.lastSuccessfulFeedingAt=item.lastSuccessfulFeedingAt==null?null:time(item.lastSuccessfulFeedingAt);}
  if('hunger'in organism){organism.bornAt=input.schemaVersion===7?state.simulationTime:time(item.bornAt);organism.deprivationSeconds=input.schemaVersion===7?0:number(item.deprivationSeconds,0,1000);organism.satietyUntil=input.schemaVersion===7?0:number(item.satietyUntil,0,state.simulationTime+(satietySeconds[item.speciesId]||0));organism.acclimationUntil=input.schemaVersion>=15?number(item.acclimationUntil,0,state.simulationTime+populationConfig.graceSeconds,state.simulationTime):state.simulationTime+(input.schemaVersion===7?populationConfig.graceSeconds:populationConfig.restoreGraceSeconds);}
  if(previous&&changedDietIds.has(item.speciesId)){organism.lastSuccessfulFeedingAt=null;organism.deprivationSeconds=0;organism.foodShortageDuration=0;organism.satietyUntil=0;organism.acclimationUntil=state.simulationTime+populationConfig.graceSeconds;}
  if(item.speciesId==='earthworm'){organism.litterConsumed=number(item.litterConsumed,0,1e6);organism.lastLitterFeedingAt=item.lastLitterFeedingAt===null?null:time(item.lastLitterFeedingAt);}
  ids.add(item.instanceId);state.organisms.push(organism);
 }
 // v15 preserves an actual feeding decision, never inventing a target or meal.
 if(input.schemaVersion>=15)for(const organism of state.organisms){
  if(!('hunger'in organism))continue;
  const f=d.organisms.find(o=>o.instanceId===organism.instanceId)?.feeding;
  if(f===undefined)continue;
  const target=state.organisms.find(o=>o.instanceId===f?.target);
  const active=['moveToFood','eat'].includes(f?.behavior);
  if(!object(f)||!['wander','searchFood','moveToFood','eat'].includes(f.behavior)||typeof f.shortage!=='boolean'||!Number.isFinite(f.retryAt)||f.retryAt<0||f.retryAt>state.simulationTime+ecologyConfig.searchRetrySeconds||!Number.isFinite(f.eatRemaining)||f.eatRemaining<0||f.eatRemaining>ecologyConfig.eatSeconds||!Number.isFinite(f.pursuitSeconds)||f.pursuitSeconds<0||f.pursuitSeconds>(feedingConfig[organism.speciesId].maxPursuitSeconds??ecologyConfig.maxPursuitSeconds)+ecologyConfig.tickSeconds||(active?(!target||!relationFor(target.speciesId,organism.speciesId)):f.target!==null)){repaired=true;continue;}
  organism.behaviorState=f.behavior;organism.targetInstanceId=f.target;
  organism.feedingClock={retryAt:f.retryAt,eatRemaining:f.eatRemaining,pursuitSeconds:f.pursuitSeconds,shortage:f.shortage};
 }
 const suffixes=state.organisms.map(item=>Math.min(1e9,Number(item.instanceId.match(/(\d+)$/)?.[1]||0)));
 state.nextInstanceSequence=Math.max(1,...suffixes.map(n=>n+1),Math.floor(number(d.nextInstanceSequence,1,1e9,1)));
 const causes=['placement','reintroduction','reproduction','predation','starvation','release','natural_lifespan','life_stage_exit','colony_renewal','colony_decline','replenishment'];
 if(input.schemaVersion>=8){
  const p=object(d.population)?d.population:{};
  const seen=new Set();
  state.population.history=array(p.history,populationConfig.historyLimit).flatMap(r=>{
   if(!object(r)||!own(organismById,r.speciesId)||input.schemaVersion<14&&r.speciesId==='earthworm'||!causes.includes(r.cause)||r.changeType!==r.cause||!Number.isInteger(r.sequence)||r.sequence<1||r.sequence>1e9||seen.has(r.sequence)||!Number.isInteger(r.countBefore)||!Number.isInteger(r.countAfter)||r.countBefore<0||r.countAfter<0||r.countBefore>30||r.countAfter>30||r.countAfter-r.countBefore!==(r.cause==='colony_renewal'?0:['predation','starvation','release','natural_lifespan','life_stage_exit','colony_decline'].includes(r.cause)?-1:1)){repaired=true;return [];}
   const historic=previous||r.ecologyRevision===1;
   if(r.cause==='predation'&&!(historic?legacyEcology.relations.some(e=>e.sourceSpeciesId===r.speciesId&&e.targetSpeciesId===r.consumerSpeciesId):relationFor(r.speciesId,r.consumerSpeciesId))){repaired=true;return [];}
   const rule=(historic?legacyEcology.lifespan:lifespanRules)[r.speciesId];
   if((r.cause==='natural_lifespan'&&(rule.model!=='individual'||rule.endCause))||(r.cause==='life_stage_exit'&&rule.endCause!=='life_stage_exit')||(['colony_renewal','colony_decline'].includes(r.cause)&&rule.model!=='colony')||(r.cause==='replenishment'&&r.mode!==(historic?legacyEcology.replenishment:replenishmentRules)[r.speciesId]?.mode)){repaired=true;return [];}
   seen.add(r.sequence);const record={sequence:r.sequence,speciesId:r.speciesId,changeType:r.cause,cause:r.cause,simulationTime:time(r.simulationTime),countBefore:r.countBefore,countAfter:r.countAfter,noted:historic||r.noted===true,...(historic?{ecologyRevision:1}:{})};
   if(r.cause==='predation')record.consumerSpeciesId=r.consumerSpeciesId;
   if(r.cause==='reproduction')record.mode=r.mode==='seed-spread'?'seed-spread':'animal';
   if(r.cause==='replenishment')record.mode=r.mode;
   if(r.cause==='colony_renewal')record.noted=true;
   return [record];
  });
  state.population.sequence=Math.max(...state.population.history.map(r=>r.sequence),0,Math.floor(number(p.sequence,0,1e9)));
  for(const cause of causes)state.population.totals[cause]=Math.max(state.population.history.filter(r=>r.cause===cause).length,Math.floor(number(p.totals?.[cause]??0,0,1e9)));
  state.population.introductions={};
  for(const id of Object.keys(organismById))if(object(p.introductions?.[id]))state.population.introductions[id]={count:Math.floor(number(p.introductions[id].count,0,1e6)),nextAt:number(p.introductions[id].nextAt,0,state.simulationTime+populationConfig.introductionCooldown)};
  for(const [id,rule]of Object.entries(reproductionRules))if(object(p.breeding?.[id]))state.population.breeding[id]={healthySeconds:number(p.breeding[id].healthySeconds,0,rule.healthySeconds),nextAt:number(p.breeding[id].nextAt,0,state.simulationTime+rule.cooldown)};
  if(input.schemaVersion>=9)for(const [id,rule]of Object.entries(replenishmentRules))if(object(p.replenishment?.[id]))state.population.replenishment[id]={healthySeconds:number(p.replenishment[id].healthySeconds,0,rule.healthySeconds),nextAt:number(p.replenishment[id].nextAt,0,state.simulationTime+Math.max(rule.cooldown,rule.healthySeconds)),...(rule.seedBank?{reserve:Math.floor(number(p.replenishment[id].reserve??0,0,rule.reserveMaximum))}:{})};
  if(input.schemaVersion>=11)for(const id of ['grass','grasshopper'])if(state.population.breeding[id]&&p.breeding[id]?.pending!==undefined){
   const pending=restoreBreedingPending(id,p.breeding[id].pending,{repair:()=>{repaired=true;}},state.population.replenishment.grasshopper?.reserve||0);
   if(pending)state.population.breeding[id].pending=pending;
  }
  const organic=d.decomposition?.organicMatter;
  for(const part of ['wood','litter','remains'])state.decomposition.organicMatter[part]=number(organic?.[part],0,decompositionConfig.maximum);
  state.decomposition.soilNutrients=number(d.decomposition?.soilNutrients,0,1);state.decomposition.processed=number(d.decomposition?.processed,0,1e6);
  restoreDecompositionDetails(d.decomposition,input.schemaVersion,state,{number,repair:()=>{repaired=true;}});
 }
 state.development=restoreDevelopmentHistory(d.development,input.schemaVersion,state,{array,number,time,repair:()=>{repaired=true;}});
 state.environmentEvents=restoreEnvironmentEvents(d.environmentEvents,input.schemaVersion,state,{number,array,time,repair:()=>{repaired=true;}});
 for(const card of state.inventory)if(!state.population.introductions[card.speciesId]&&(card.acquired||state.organisms.some(o=>o.speciesId===card.speciesId)))state.population.introductions[card.speciesId]={count:state.organisms.filter(o=>o.speciesId===card.speciesId).length,nextAt:0};
 const seenObservations=new Set();
 state.observations=(previous?[]:array(d.observations,Object.keys(discoveryEvents).length)).flatMap(item=>{
  if(!item||!own(discoveryEvents,item.relationId)||seenObservations.has(item.relationId)){repaired=true;return [];}
  seenObservations.add(item.relationId);return [{relationId:item.relationId,eventId:text(item.eventId),discoveredAt:time(item.discoveredAt)}];
 });
 const activities=array(d.activities,30);
 state.activities.forEach(progress=>{
  const saved=activities.find(item=>item?.activityId===progress.activityId);if(!saved)return;
  const definition=activityById[progress.activityId];
  progress.attempts=Math.floor(number(saved.attempts,0,1e6));
  const historic=previous||saved.ecologyRevision===1;
  const evidence=definition.choices?saved.lastAnswer===definition.correctAnswer:definition.type==='observation'?(historic?state.legacyEcology.observations.some(o=>o.relationId===definition.requirements.relationId.replace(/^v2_/,'')):seenObservations.has(definition.requirements.relationId)):true;
  progress.completed=saved.completed===true&&evidence;
  progress.completedAt=progress.completed?permanentTime(saved.completedAt):null;
  if(progress.completed&&historic)progress.ecologyRevision=1;
  if(progress.completed&&definition.choices)progress.lastAnswer=definition.correctAnswer;
 });
 // Recover a missing card flag from a validated historical completion.
 for(const progress of state.activities){
  const speciesId=activityById[progress.activityId].unlockSpeciesId;
  const card=state.inventory.find(item=>item.speciesId===speciesId);
  if(progress.completed&&card&&!card.acquired){card.acquired=true;repaired=true;}
 }
 const rewards=new Map([
  ...Object.keys(discoveryEvents).map(id=>[`observation:${id}`,rewardConfig.observation]),
  ...[...legacyRelationIds].map(id=>[`observation:${id}`,rewardConfig.observation]),
  ...Object.keys(environmentFactors).map(id=>[`question:producer_${id}_limit`,rewardConfig.question]),
  ...['water','soil'].map(id=>[`management:${id}_shortage_resolved`,rewardConfig.management]),
  ...Object.values(activityById).map(item=>[`activity:${item.activityId}`,item.pointReward]),
 ]);
 const seenRewards=new Set();
 state.rewardHistory=array(d.rewardHistory,100).flatMap(item=>{
  if(!item||!rewards.has(item.rewardId)||seenRewards.has(item.rewardId)){repaired=true;return [];}
  seenRewards.add(item.rewardId);return [{rewardId:item.rewardId,grantedAt:permanentTime(item.grantedAt),sourceId:text(item.sourceId),amount:rewards.get(item.rewardId)}];
 });
 state.managementHistory=array(d.managementHistory,100).flatMap(item=>{
  const rule=managementActions.find(rule=>rule.actionId===item?.actionId);if(!rule){repaired=true;return [];}
  const record={actionId:rule.actionId,sourceEventId:text(item.sourceEventId),sourceId:text(item.sourceId),executedAt:time(item.executedAt),cost:rule.cost,result:['resolved','changed-elsewhere','interrupted'].includes(item.result)?item.result:item.result==='applied'&&!Object.hasOwn(environmentFactors,item.factor)?'applied':'interrupted'};
  if(Object.hasOwn(environmentFactors,item.factor)){record.factor=item.factor;record.valueAfter=number(item.valueAfter,0,1);}
  if(input.schemaVersion>=13){
   if(item.targetFactor===null||Object.hasOwn(environmentFactors,item.targetFactor))record.targetFactor=item.targetFactor;
   if(Number.isFinite(item.beforeValue)&&item.beforeValue>=0&&item.beforeValue<=1)record.beforeValue=item.beforeValue;
   if(Number.isFinite(item.afterValue)&&item.afterValue>=0&&item.afterValue<=1)record.afterValue=item.afterValue;
   if(Number.isFinite(item.supportUsed))record.supportUsed=number(item.supportUsed,0,rule.cost);
   if(input.schemaVersion>=16&&Number.isInteger(item.roundSupportUsed))record.roundSupportUsed=number(item.roundSupportUsed,0,rule.cost);
   if(item.directEnvironment===true)record.directEnvironment=true;
  }
  return [record];
 });
 state.managementActionCount=Math.max(state.managementHistory.length,Math.floor(number(d.managementActionCount,0,1e9,state.managementHistory.length)));
 const deadline=(value,maximum)=>number(value,state.simulationTime,state.simulationTime+maximum,state.simulationTime);
 if(object(d.managementCooldowns))for(const [key,value] of Object.entries(d.managementCooldowns).slice(0,40)){
  const rule=managementActions.find(rule=>key===rule.actionId||(rule.actionId==='food-support'&&key.startsWith('food-support:')&&ids.has(key.slice(13))));
  if(!rule)continue;const until=deadline(value,rule.cooldown);if(until>state.simulationTime)state.managementCooldowns[key]=until;
 }
 const habitat=managementActions.find(item=>item.actionId==='habitat-care');
 state.managementEffects=array(d.managementEffects,1).flatMap(item=>{
  if(item?.actionId!==habitat.actionId)return [];const until=deadline(item.expiresAt,habitat.duration);
  return until>state.simulationTime?[{actionId:habitat.actionId,startedAt:time(item.startedAt),expiresAt:until,multiplier:habitat.effect.multiplier}]:[];
 });
 const cleared=d.forestProgress?.cleared===true&&Number.isFinite(d.forestProgress.clearedAt)&&d.forestProgress.clearedAt>=0&&d.forestProgress.clearedAt<=state.simulationTime;
 // Legacy holds restart safely. v15 keeps foreground progress; offline time never counts.
 state.forestProgress={cleared,clearedAt:cleared?d.forestProgress.clearedAt:null,stableSeconds:cleared?forestGoal.stableSeconds:input.schemaVersion>=15?number(d.forestProgress?.stableSeconds,0,forestGoal.stableSeconds):0};
 const memory=object(input.eventMemory)?input.eventMemory:{};
 const eventMemory={sequence:Math.floor(number(memory.sequence,0,1e9)),cooldowns:[],questionDone:[],pendingDiscoveries:[]};
 const validKey=key=>typeof key==='string'&&((key.startsWith('shortage:')&&ids.has(key.slice(9)))||(key.startsWith('competition:')&&own(organismById,key.slice(12)))||Object.keys(environmentFactors).some(f=>key===`growth:${f}`||key===`investigate:${f}`));
 for(const entry of array(memory.cooldowns,40))if(Array.isArray(entry)&&validKey(entry[0])){
  // The event system may retain an elapsed cooldown while its candidate still
  // exists. That is normal session memory, not damaged save data.
  if(Number.isFinite(entry[1])&&entry[1]>=0&&entry[1]<=state.simulationTime)continue;
  const until=deadline(entry[1],eventConfig.cooldownSeconds);if(until>state.simulationTime)eventMemory.cooldowns.push([entry[0],until]);
 }
 eventMemory.questionDone=array(memory.questionDone,4).filter(key=>Object.keys(environmentFactors).some(f=>key===`investigate:${f}`));
 const pendingSeen=new Set();
 for(const entry of (previous?[]:array(memory.pendingDiscoveries,Object.keys(discoveryEvents).length)))if(Array.isArray(entry)&&own(discoveryEvents,entry[0])&&!seenObservations.has(entry[0])&&!pendingSeen.has(entry[0])){pendingSeen.add(entry[0]);eventMemory.pendingDiscoveries.push([entry[0],{consumerInstanceId:validId(entry[1]?.consumerInstanceId)?entry[1].consumerInstanceId:null}]);}
 restoreCollection(d,input.schemaVersion,state,()=>{repaired=true;});
 state.recoverySupportUsed=input.schemaVersion<13?false:typeof d.recoverySupportUsed==='boolean'?d.recoverySupportUsed:typeof d.pointEconomy?.support?.used==='boolean'?d.pointEconomy.support.used:true;
 state.pointEconomy=restorePointEconomy(d.pointEconomy,input.schemaVersion,state,{number,repair:()=>{repaired=true;}});
 state.recoverySupportUsed=state.recoverySupportUsed||state.pointEconomy.support.used||state.pointEconomy.totals.support>0;
 return {state,eventMemory,savedAt:typeof input.savedAt==='string'&&Number.isFinite(Date.parse(input.savedAt))?input.savedAt:null,status:repaired?'recovered':'loaded',blocked:false};
}
