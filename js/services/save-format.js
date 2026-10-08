import {createGameState} from '../state/game-state.js';
import {createOrganismInstance} from '../state/organism-instance.js';
import {organismById} from '../../data/organisms.js';
import {activityById} from '../../data/activities.js';
import {discoveryEvents,eventConfig} from '../../data/event-config.js';
import {environmentFactors,growthConfig} from '../../data/environment-config.js';
import {foodResourceConfig} from '../../data/ecology-config.js';
import {managementActions,rewardConfig} from '../../data/management-actions.js';
import {forestGoal} from '../../data/forest-goal.js';

export const SAVE_VERSION=7;
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
   for(const key of ['growth','foodStock','hunger','foodShortageDuration','lastSuccessfulFeedingAt'])if(key in item)saved[key]=item[key];
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
 },eventMemory};
}

export function decodeSave(raw) {
 const fresh=(status,blocked=false)=>({state:createGameState(),eventMemory:null,savedAt:null,status,blocked});
 if(raw===null||raw===undefined)return fresh('new');
 let input;
 try {if(typeof raw!=='string'||raw.length>1000000)return fresh('damaged');input=JSON.parse(raw);}catch{return fresh('damaged');}
 if(!object(input)||!Number.isInteger(input.schemaVersion))return fresh('missing-version');
 if(input.schemaVersion!==SAVE_VERSION)return fresh(input.schemaVersion>SAVE_VERSION?'future-version':'old-version',true);
 const d=input.domain;
 if(!object(d)||d.schemaVersion!==SAVE_VERSION||d.ecosystemId!=='forest'||!Array.isArray(d.organisms)||!Array.isArray(d.inventory)||!object(d.environment)||!object(d.metrics))return fresh('damaged');
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
  const organism=createOrganismInstance(item.speciesId,item.instanceId,{x:number(item.position.x,0,1),y:number(item.position.y,0,1)});
  if('growth' in organism)organism.growth=number(item.growth,growthConfig.minimumGrowth,1,1);
  if('foodStock' in organism)organism.foodStock=number(item.foodStock,0,foodResourceConfig[item.speciesId].maximum*organism.growth);
  if('hunger' in organism){organism.hunger=number(item.hunger,0,1,organism.hunger);organism.foodShortageDuration=number(item.foodShortageDuration,0,1e6);organism.lastSuccessfulFeedingAt=item.lastSuccessfulFeedingAt===null?null:time(item.lastSuccessfulFeedingAt);}
  ids.add(item.instanceId);state.organisms.push(organism);
 }
 const suffixes=state.organisms.map(item=>Math.min(1e9,Number(item.instanceId.match(/(\d+)$/)?.[1]||0)));
 state.nextInstanceSequence=Math.max(1,...suffixes.map(n=>n+1),Math.floor(number(d.nextInstanceSequence,1,1e9,1)));
 const seenObservations=new Set();
 state.observations=array(d.observations,20).flatMap(item=>{
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
 const validKey=key=>typeof key==='string'&&((key.startsWith('shortage:')&&ids.has(key.slice(9)))||Object.keys(environmentFactors).some(f=>key===`growth:${f}`||key===`investigate:${f}`));
 for(const entry of array(memory.cooldowns,40))if(Array.isArray(entry)&&validKey(entry[0])){const until=deadline(entry[1],eventConfig.cooldownSeconds);if(until>state.simulationTime)eventMemory.cooldowns.push([entry[0],until]);}
 eventMemory.questionDone=array(memory.questionDone,4).filter(key=>Object.keys(environmentFactors).some(f=>key===`investigate:${f}`));
 for(const entry of array(memory.pendingDiscoveries,2))if(Array.isArray(entry)&&own(discoveryEvents,entry[0])&&!seenObservations.has(entry[0]))eventMemory.pendingDiscoveries.push([entry[0],{consumerInstanceId:validId(entry[1]?.consumerInstanceId)?entry[1].consumerInstanceId:null}]);
 return {state,eventMemory,savedAt:typeof input.savedAt==='string'&&Number.isFinite(Date.parse(input.savedAt))?input.savedAt:null,status:repaired?'recovered':'loaded',blocked:false};
}
