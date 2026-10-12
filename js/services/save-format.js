import {createGameState} from '../state/game-state.js';
import {createOrganismInstance} from '../state/organism-instance.js';
import {organismById} from '../../data/organisms.js';
import {activityById} from '../../data/activities.js';
import {discoveryEvents,eventConfig} from '../../data/event-config.js';
import {environmentFactors,growthConfig} from '../../data/environment-config.js';
import {foodResourceConfig} from '../../data/ecology-config.js';
import {managementActions,rewardConfig} from '../../data/management-actions.js';
import {forestGoal} from '../../data/forest-goal.js';
import {populationConfig,reproductionRules,decompositionConfig,satietySeconds} from '../../data/population-config.js';
import {relationFor} from '../../data/food-relations.js';
import {lifespanRules,replenishmentRules} from '../../data/lifespan-config.js';

export const SAVE_VERSION=9;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
const text=value=>typeof value==='string'?value.slice(0,100):'';
const own=(value,key)=>Object.hasOwn(value,key);

// Explicit whitelist. Runtime target, behavior, event objects and UI never enter the save.
export function createSaveSnapshot(state,eventMemory,savedAt) {
 return {schemaVersion:SAVE_VERSION,savedAt,domain:{
  schemaVersion:SAVE_VERSION,ecosystemId:'forest',simulationTime:state.simulationTime,nextInstanceSequence:state.nextInstanceSequence,
  inventory:state.inventory.map(({speciesId,acquired})=>({speciesId,acquired})),
  organisms:state.organisms.map(item=>{
   const saved={instanceId:item.instanceId,speciesId:item.speciesId,position:{...item.position}};
   for(const key of ['growth','foodStock','hunger','foodShortageDuration','lastSuccessfulFeedingAt','deprivationSeconds','bornAt','satietyUntil'])if(key in item)saved[key]=item[key];
   const keys=lifespanRules[item.speciesId].model==='colony'?['renewalSeconds','nextRenewalAt','vigor','stressSeconds','generation']:['startedAt','initialAge','duration'];
   saved.life=Object.fromEntries(keys.map(key=>[key,item.life[key]]));
   return saved;
  }),
  environment:Object.fromEntries(Object.entries(state.environment).map(([key,item])=>[key,{value:item.value}])),
  metrics:{points:state.metrics.points,bestStability:state.metrics.bestStability},
  observations:state.observations.map(({relationId,eventId,discoveredAt})=>({relationId,eventId,discoveredAt})),
  activities:state.activities.map(({activityId,completed,attempts,completedAt,lastAnswer})=>({activityId,completed,attempts,completedAt,lastAnswer})),
  rewardHistory:state.rewardHistory.map(({rewardId,grantedAt,sourceId,amount})=>({rewardId,grantedAt,sourceId,amount})),
  managementHistory:state.managementHistory.map(({actionId,sourceEventId,sourceId,executedAt,cost,result,factor,valueAfter})=>({actionId,sourceEventId,sourceId,executedAt,cost,result,factor,valueAfter})),
  managementActionCount:state.managementActionCount,
  managementCooldowns:{...state.managementCooldowns},
  managementEffects:state.managementEffects.map(({actionId,startedAt,expiresAt,multiplier})=>({actionId,startedAt,expiresAt,multiplier})),
  forestProgress:{...state.forestProgress},
  population:{sequence:state.population.sequence,totals:{...state.population.totals},
    history:state.population.history.map(({sequence,speciesId,changeType,cause,simulationTime,countBefore,countAfter,consumerSpeciesId,mode,noted})=>({sequence,speciesId,changeType,cause,simulationTime,countBefore,countAfter,consumerSpeciesId,mode,noted})),
    breeding:Object.fromEntries(Object.entries(state.population.breeding).map(([id,v])=>[id,{healthySeconds:v.healthySeconds,nextAt:v.nextAt}])),
    replenishment:Object.fromEntries(Object.entries(state.population.replenishment).map(([id,v])=>[id,{healthySeconds:v.healthySeconds,nextAt:v.nextAt,...(replenishmentRules[id]?.seedBank?{reserve:v.reserve||0}:{})}])),
    introductions:Object.fromEntries(Object.entries(state.population.introductions).map(([id,v])=>[id,{count:v.count,nextAt:v.nextAt}]))},
  decomposition:{organicMatter:{...state.decomposition.organicMatter},soilNutrients:state.decomposition.soilNutrients,processed:state.decomposition.processed},
 },eventMemory};
}

export function decodeSave(raw) {
 const fresh=(status,blocked=false)=>({state:createGameState(),eventMemory:null,savedAt:null,status,blocked});
 if(raw===null||raw===undefined)return fresh('new');
 let input;
 try {if(typeof raw!=='string'||raw.length>1000000)return fresh('damaged');input=JSON.parse(raw);}catch{return fresh('damaged');}
 if(!object(input)||!Number.isInteger(input.schemaVersion))return fresh('missing-version');
 if(![7,8,SAVE_VERSION].includes(input.schemaVersion))return fresh(input.schemaVersion>SAVE_VERSION?'future-version':'old-version',true);
 const d=input.domain;
 if(!object(d)||d.schemaVersion!==input.schemaVersion||d.ecosystemId!=='forest'||!Array.isArray(d.organisms)||!Array.isArray(d.inventory)||!object(d.environment)||!object(d.metrics))return fresh('damaged');
 let repaired=false;
 const number=(value,min,max,fallback=0)=>{if(!Number.isFinite(value)){repaired=true;return fallback;}const v=Math.max(min,Math.min(max,value));if(v!==value)repaired=true;return v;};
 const array=(value,max)=>{if(!Array.isArray(value)){repaired=true;return [];}if(value.length>max)repaired=true;return value.slice(0,max);};
 const state=createGameState();
 state.simulationTime=number(d.simulationTime,0,1e9);
 const time=value=>number(value,0,state.simulationTime);
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
  if(!object(item)||!own(organismById,item.speciesId)||!validId(item.instanceId)||ids.has(item.instanceId)||!object(item.position)||!Number.isFinite(item.position.x)||!Number.isFinite(item.position.y)){repaired=true;continue;}
  // v7/v8 get a safe relative adult age starting at RESTORED active time.
  // bornAt continues to mean introduction/adaptation time, not biological birth.
  const organism=createOrganismInstance(item.speciesId,item.instanceId,{x:number(item.position.x,0,1),y:number(item.position.y,0,1)},{time:state.simulationTime});
  if(input.schemaVersion===9){
   const l=item.life,rule=lifespanRules[item.speciesId],bounded=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
   const valid=object(l)&&(rule.model==='individual'?
    bounded(l.duration,rule.min,rule.max)&&bounded(l.startedAt,0,state.simulationTime)&&bounded(l.initialAge,0,l.duration):
    bounded(l.renewalSeconds,rule.min,rule.max)&&bounded(l.nextRenewalAt,0,state.simulationTime+rule.max)&&bounded(l.vigor,0,1)&&bounded(l.stressSeconds,0,rule.stressSeconds)&&Number.isInteger(l.generation)&&bounded(l.generation,0,1e9));
   if(valid){const keys=rule.model==='individual'?['duration','startedAt','initialAge']:['renewalSeconds','nextRenewalAt','vigor','stressSeconds','generation'];organism.life=Object.fromEntries(keys.map(key=>[key,l[key]]));}
   else repaired=true;
  }
  if('growth' in organism)organism.growth=number(item.growth,growthConfig.minimumGrowth,1,1);
  // Older oak/rabbit instances predate their resource/feeding fields. Initialize
  // only absent newly supported fields; do not treat definition expansion as damage.
  if('foodStock' in organism)organism.foodStock=item.foodStock===undefined?foodResourceConfig[item.speciesId].maximum*organism.growth:number(item.foodStock,0,foodResourceConfig[item.speciesId].maximum*organism.growth);
  if('hunger' in organism){organism.hunger=item.hunger===undefined?organism.hunger:number(item.hunger,0,1,organism.hunger);organism.foodShortageDuration=item.foodShortageDuration===undefined?0:number(item.foodShortageDuration,0,1e6);organism.lastSuccessfulFeedingAt=item.lastSuccessfulFeedingAt==null?null:time(item.lastSuccessfulFeedingAt);}
  if('hunger'in organism){organism.bornAt=input.schemaVersion===7?state.simulationTime:time(item.bornAt);organism.deprivationSeconds=input.schemaVersion===7?0:number(item.deprivationSeconds,0,1000);organism.satietyUntil=input.schemaVersion===7?0:number(item.satietyUntil,0,state.simulationTime+(satietySeconds[item.speciesId]||0));organism.acclimationUntil=state.simulationTime+(input.schemaVersion===7?populationConfig.graceSeconds:populationConfig.restoreGraceSeconds);}
  ids.add(item.instanceId);state.organisms.push(organism);
 }
 const suffixes=state.organisms.map(item=>Math.min(1e9,Number(item.instanceId.match(/(\d+)$/)?.[1]||0)));
 state.nextInstanceSequence=Math.max(1,...suffixes.map(n=>n+1),Math.floor(number(d.nextInstanceSequence,1,1e9,1)));
 const causes=['placement','reintroduction','reproduction','predation','starvation','release','natural_lifespan','life_stage_exit','colony_renewal','colony_decline','replenishment'];
 if(input.schemaVersion>=8){
  const p=object(d.population)?d.population:{};
  const seen=new Set();
  state.population.history=array(p.history,populationConfig.historyLimit).flatMap(r=>{
   if(!object(r)||!own(organismById,r.speciesId)||!causes.includes(r.cause)||r.changeType!==r.cause||!Number.isInteger(r.sequence)||r.sequence<1||r.sequence>1e9||seen.has(r.sequence)||!Number.isInteger(r.countBefore)||!Number.isInteger(r.countAfter)||r.countBefore<0||r.countAfter<0||r.countBefore>30||r.countAfter>30||r.countAfter-r.countBefore!==(r.cause==='colony_renewal'?0:['predation','starvation','release','natural_lifespan','life_stage_exit','colony_decline'].includes(r.cause)?-1:1)){repaired=true;return [];}
   if(r.cause==='predation'&&!relationFor(r.speciesId,r.consumerSpeciesId)){repaired=true;return [];}
   const rule=lifespanRules[r.speciesId];
   if((r.cause==='natural_lifespan'&&(rule.model!=='individual'||rule.endCause))||(r.cause==='life_stage_exit'&&rule.endCause!=='life_stage_exit')||(['colony_renewal','colony_decline'].includes(r.cause)&&rule.model!=='colony')||(r.cause==='replenishment'&&r.mode!==replenishmentRules[r.speciesId]?.mode)){repaired=true;return [];}
   seen.add(r.sequence);const record={sequence:r.sequence,speciesId:r.speciesId,changeType:r.cause,cause:r.cause,simulationTime:time(r.simulationTime),countBefore:r.countBefore,countAfter:r.countAfter,noted:r.noted===true};
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
  if(input.schemaVersion===9)for(const [id,rule]of Object.entries(replenishmentRules))if(object(p.replenishment?.[id]))state.population.replenishment[id]={healthySeconds:number(p.replenishment[id].healthySeconds,0,rule.healthySeconds),nextAt:number(p.replenishment[id].nextAt,0,state.simulationTime+Math.max(rule.cooldown,rule.healthySeconds)),...(rule.seedBank?{reserve:Math.floor(number(p.replenishment[id].reserve??0,0,rule.reserveMaximum))}:{})};
  const organic=d.decomposition?.organicMatter;
  for(const part of ['wood','litter','remains'])state.decomposition.organicMatter[part]=number(organic?.[part],0,decompositionConfig.maximum);
  state.decomposition.soilNutrients=number(d.decomposition?.soilNutrients,0,1);state.decomposition.processed=number(d.decomposition?.processed,0,1e6);
 }
 for(const card of state.inventory)if(!state.population.introductions[card.speciesId]&&(card.acquired||state.organisms.some(o=>o.speciesId===card.speciesId)))state.population.introductions[card.speciesId]={count:state.organisms.filter(o=>o.speciesId===card.speciesId).length,nextAt:0};
 const seenObservations=new Set();
 state.observations=array(d.observations,Object.keys(discoveryEvents).length).flatMap(item=>{
  if(!item||!own(discoveryEvents,item.relationId)||seenObservations.has(item.relationId)){repaired=true;return [];}
  seenObservations.add(item.relationId);return [{relationId:item.relationId,eventId:text(item.eventId),discoveredAt:time(item.discoveredAt)}];
 });
 const activities=array(d.activities,30);
 state.activities.forEach(progress=>{
  const saved=activities.find(item=>item?.activityId===progress.activityId);if(!saved)return;
  const definition=activityById[progress.activityId];
  progress.attempts=Math.floor(number(saved.attempts,0,1e6));
  const evidence=definition.choices?saved.lastAnswer===definition.correctAnswer:definition.type==='observation'?seenObservations.has(definition.requirements.relationId):true;
  progress.completed=saved.completed===true&&evidence;
  progress.completedAt=progress.completed?time(saved.completedAt):null;
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
  ...Object.keys(environmentFactors).map(id=>[`question:producer_${id}_limit`,rewardConfig.question]),
  ...['water','soil'].map(id=>[`management:${id}_shortage_resolved`,rewardConfig.management]),
  ...Object.values(activityById).map(item=>[`activity:${item.activityId}`,item.pointReward]),
 ]);
 const seenRewards=new Set();
 state.rewardHistory=array(d.rewardHistory,100).flatMap(item=>{
  if(!item||!rewards.has(item.rewardId)||seenRewards.has(item.rewardId)){repaired=true;return [];}
  seenRewards.add(item.rewardId);return [{rewardId:item.rewardId,grantedAt:time(item.grantedAt),sourceId:text(item.sourceId),amount:rewards.get(item.rewardId)}];
 });
 state.managementHistory=array(d.managementHistory,100).flatMap(item=>{
  const rule=managementActions.find(rule=>rule.actionId===item?.actionId);if(!rule){repaired=true;return [];}
  const record={actionId:rule.actionId,sourceEventId:text(item.sourceEventId),sourceId:text(item.sourceId),executedAt:time(item.executedAt),cost:rule.cost,result:['resolved','changed-elsewhere','interrupted'].includes(item.result)?item.result:item.result==='applied'&&!Object.hasOwn(environmentFactors,item.factor)?'applied':'interrupted'};
  if(Object.hasOwn(environmentFactors,item.factor)){record.factor=item.factor;record.valueAfter=number(item.valueAfter,0,1);}
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
 // A fresh runtime must establish a new uninterrupted hold; offline time never counts.
 state.forestProgress={cleared,clearedAt:cleared?d.forestProgress.clearedAt:null,stableSeconds:cleared?forestGoal.stableSeconds:0};
 const memory=object(input.eventMemory)?input.eventMemory:{};
 const eventMemory={sequence:Math.floor(number(memory.sequence,0,1e9)),cooldowns:[],questionDone:[],pendingDiscoveries:[]};
 const validKey=key=>typeof key==='string'&&((key.startsWith('shortage:')&&ids.has(key.slice(9)))||(key.startsWith('competition:')&&own(organismById,key.slice(12)))||Object.keys(environmentFactors).some(f=>key===`growth:${f}`||key===`investigate:${f}`));
 for(const entry of array(memory.cooldowns,40))if(Array.isArray(entry)&&validKey(entry[0])){const until=deadline(entry[1],eventConfig.cooldownSeconds);if(until>state.simulationTime)eventMemory.cooldowns.push([entry[0],until]);}
 eventMemory.questionDone=array(memory.questionDone,4).filter(key=>Object.keys(environmentFactors).some(f=>key===`investigate:${f}`));
 const pendingSeen=new Set();
 for(const entry of array(memory.pendingDiscoveries,Object.keys(discoveryEvents).length))if(Array.isArray(entry)&&own(discoveryEvents,entry[0])&&!seenObservations.has(entry[0])&&!pendingSeen.has(entry[0])){pendingSeen.add(entry[0]);eventMemory.pendingDiscoveries.push([entry[0],{consumerInstanceId:validId(entry[1]?.consumerInstanceId)?entry[1].consumerInstanceId:null}]);}
 return {state,eventMemory,savedAt:typeof input.savedAt==='string'&&Number.isFinite(Date.parse(input.savedAt))?input.savedAt:null,status:repaired?'recovered':'loaded',blocked:false};
}
