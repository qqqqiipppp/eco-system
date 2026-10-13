import {environmentEventConfig as config,environmentEventDefinitions as definitions,environmentEventSequence} from '../../data/environment-events.js';
import {environmentFactors} from '../../data/environment-config.js';
import {organismById} from '../../data/organisms.js';
import {managementActions} from '../../data/management-actions.js';
import {createEnvironmentEventState} from '../state/environment-event-state.js';

const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
const eventNumber=id=>typeof id==='string'&&/^environment-[1-9]\d{0,9}$/.test(id)?Number(id.slice(12)):0;
const inRange=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
const same=(a,b)=>Math.abs(a-b)<=config.epsilon;
const evidenceTypes=new Set(['growth-delay','growth-recovery','producer-decline','producer-recovery','colony-decline','colony-recovery']);
const recordKeys=['eventId','kind','factor','phase','startedAt','duration','recoverySeconds','intensity','floor','beforeValue','valueAfter','appliedDelta','effectSeconds','recoveryElapsed','recoveredDelta','recoveryTarget','valueAtEffectEnd','effectEndedAt','endedAt','observed','choice'];

// Every saved episode has already processed the saved active clock. A stale
// progress field would replay an effect on the first tick after loading. Ended
// history uses its own end time, since the forest clock can keep advancing.
function consistentProgress(record,rule,time){
 if(!object(record)||!rule)return false;
 const at=record.phase==='ended'?record.endedAt:time;
 if(!Number.isFinite(at)||!Number.isFinite(record.startedAt))return false;
 const elapsed=Math.max(0,at-record.startedAt);
 if(record.phase==='active')return elapsed<rule.duration&&same(record.effectSeconds,elapsed);
 const effectEnd=record.startedAt+rule.duration;
 return same(record.effectEndedAt,effectEnd)&&same(record.effectSeconds,rule.duration)&&
  same(record.recoveryElapsed,Math.min(rule.recoverySeconds,Math.max(0,at-effectEnd)));
}

// The episode owns only its progress/observations. The actual environment value
// is saved separately and is never reconstructed by applying these deltas.
export function snapshotEnvironmentEvents(source,time=0){
 const state=source||createEnvironmentEventState(time);
 return {sequence:state.sequence,cursor:state.cursor,nextAt:state.nextAt,activeId:state.activeId,
  history:state.history.map(record=>({...Object.fromEntries(recordKeys.map(key=>[key,record[key]])),
   evidence:record.evidence.map(({instanceId,speciesId,type,at})=>({instanceId,speciesId,type,at})),
   responses:record.responses.map(({actionId,at,cost,factor,beforeValue,afterValue})=>({actionId,at,cost,factor,beforeValue,afterValue}))}))};
}

export function restoreEnvironmentEvents(saved,version,state,{number,repair}){
 const fresh=createEnvironmentEventState(state.simulationTime);
 // Old games keep all their operational state, and first receive a full
 // observation period AFTER their restored active clock, without catch-up.
 if(version<12)return fresh;
 if(!object(saved)){repair();return fresh;}
 const bounded=(input,limit)=>{
  if(!Array.isArray(input)){repair();return [];}
  if(input.length>limit)repair();
  return input.slice(-limit);
 };
 const timeline=value=>inRange(value,0,state.simulationTime);
 const restored={sequence:0,cursor:0,nextAt:fresh.nextAt,activeId:null,history:[]},seen=new Set();
 for(const input of bounded(saved.history,config.historyLimit)){
  const sequence=eventNumber(input?.eventId),rule=input&&Object.hasOwn(definitions,input.kind)?definitions[input.kind]:null;
  const strength=rule&&[1,config.limitedIntensity].some(value=>same(value,input.intensity));
  const floor=input?.intensity===config.limitedIntensity?config.limitedFloor:config.minimumFloor;
  const phase=['active','recovering','ended'].includes(input?.phase);
  const maximum=rule?Math.abs(rule.magnitude)*input.intensity:0;
  const direction=rule?.magnitude<0?input?.appliedDelta<=config.epsilon:input?.appliedDelta>=-config.epsilon;
  const completed=input?.phase==='active'?
   input.effectEndedAt===null&&input.valueAtEffectEnd===null&&input.endedAt===null&&input.recoveryElapsed===0&&input.recoveredDelta===0:
   input?.effectSeconds>=rule?.duration-config.epsilon&&timeline(input?.effectEndedAt)&&input.effectEndedAt>=input.startedAt&&inRange(input.valueAtEffectEnd,0,1)&&
    (input.phase==='recovering'?rule.recoverySeconds>0&&input.endedAt===null:timeline(input.endedAt)&&input.endedAt>=input.effectEndedAt);
  if(!object(input)||!rule||sequence<1||sequence>1e9||seen.has(input.eventId)||input.factor!==rule.factor||!phase||!strength||!same(input.floor,floor)||
   input.duration!==rule.duration||input.recoverySeconds!==rule.recoverySeconds||!timeline(input.startedAt)||!inRange(input.beforeValue,0,1)||!inRange(input.valueAfter,0,1)||
   !inRange(input.appliedDelta,-maximum-config.epsilon,maximum+config.epsilon)||!direction||!inRange(input.effectSeconds,0,rule.duration)||
   !inRange(input.recoveryElapsed,0,rule.recoverySeconds)||!inRange(input.recoveredDelta,0,1)||!same(input.recoveryTarget,Math.min(config.recoveryCeiling,input.beforeValue))||!completed||!consistentProgress(input,rule,state.simulationTime)){
   repair();continue;
  }
  seen.add(input.eventId);
  const record=Object.fromEntries(recordKeys.map(key=>[key,input[key]]));
  if(typeof input.observed!=='boolean')repair();record.observed=input.observed===true;
  if(![null,'observe','wait'].includes(input.choice))repair();record.choice=['observe','wait'].includes(input.choice)?input.choice:null;
  record.evidence=[];const evidenceSeen=new Set();
  for(const evidence of bounded(input.evidence,config.evidenceLimit)){
   const key=evidence&&`${evidence.instanceId}:${evidence.type}:${evidence.at}`,instance=evidence&&state.organisms.find(o=>o.instanceId===evidence.instanceId);
   if(!object(evidence)||!validId(evidence.instanceId)||!Object.hasOwn(organismById,evidence.speciesId)||!evidenceTypes.has(evidence.type)||!timeline(evidence.at)||evidence.at<input.startedAt||evidenceSeen.has(key)||(instance&&instance.speciesId!==evidence.speciesId)){
    repair();continue;
   }
   evidenceSeen.add(key);record.evidence.push({instanceId:evidence.instanceId,speciesId:evidence.speciesId,type:evidence.type,at:evidence.at});
  }
  record.responses=[];const responseSeen=new Set();
  for(const response of bounded(input.responses,config.responseLimit)){
   const action=managementActions.find(a=>a.actionId===response?.actionId),key=response&&`${response.actionId}:${response.at}:${response.factor}`;
   if(!object(response)||!action||response.cost!==action.cost||!timeline(response.at)||response.at<input.startedAt||
    !(response.factor===null||Object.hasOwn(environmentFactors,response.factor))||!inRange(response.beforeValue,0,1)||!inRange(response.afterValue,0,1)||responseSeen.has(key)){
    repair();continue;
   }
   responseSeen.add(key);record.responses.push({actionId:action.actionId,at:response.at,cost:action.cost,factor:response.factor,beforeValue:response.beforeValue,afterValue:response.afterValue});
  }
  restored.history.push(record);
 }
 const integer=(value,min,max,fallback=0)=>{
  const boundedValue=number(value,min,max,fallback);if(!Number.isInteger(boundedValue))repair();return Math.floor(boundedValue);
 };
 restored.sequence=Math.max(integer(saved.sequence,0,1e9),0,...restored.history.map(record=>eventNumber(record.eventId)));
 restored.cursor=integer(saved.cursor,0,environmentEventSequence.length-1);
 restored.nextAt=number(saved.nextAt,0,state.simulationTime+Math.max(config.initialDelay,config.interval,config.postpone),fresh.nextAt);
 const pending=restored.history.filter(record=>record.phase!=='ended');
 const active=pending.find(record=>record.eventId===saved.activeId)||pending.at(-1);
 if(saved.activeId!==(active?.eventId||null))repair();
 if(pending.length>1){repair();restored.history=restored.history.filter(record=>record.phase==='ended'||record===active);}
 restored.activeId=active?.eventId||null;
 return restored;
}
