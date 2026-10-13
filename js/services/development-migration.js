import {developmentRules,developmentConfig} from '../../data/development-config.js';
import {createDevelopmentState,stageAt} from '../state/development-state.js';

const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
const youngOrigins={grass:'seed-spread',grasshopper:'egg-hatch',rabbit:'birth'};

// Development is independent of life.initialAge and introduction/adaptation time.
// Existing v7–10 organisms stay established; old colonies start with no claim
// that the student already observed a fruiting-body transition.
export function restoreInstanceDevelopment(instance,saved,version,{number,repair}){
 const rule=Object.hasOwn(developmentRules,instance.speciesId)?developmentRules[instance.speciesId]:undefined;
 if(!rule||rule.model==='learning'){
  if(version>=11&&saved!==undefined)repair();
  return undefined;
 }
 if(version<11)return createDevelopmentState(instance.speciesId,'legacy');
 if(!object(saved)||!['introduced','legacy',youngOrigins[instance.speciesId]].filter(Boolean).includes(saved.origin)){
  repair();return createDevelopmentState(instance.speciesId,'introduced');
 }
 const fallback=createDevelopmentState(instance.speciesId,saved.origin);
 let progressSeconds=number(saved.progressSeconds,0,rule.maxSeconds,fallback.progressSeconds);
 if(rule.model==='individual'&&['introduced','legacy'].includes(saved.origin)&&progressSeconds<rule.maxSeconds){
  repair();progressSeconds=rule.maxSeconds;
 }
 return {origin:saved.origin,progressSeconds,stage:stageAt(instance.speciesId,progressSeconds)};
}

// A pending seed/egg is not an organism. Failed validation cannot create one.
// Grasshopper primary hatching consumes the same finite reserve as replenishment.
export function restoreBreedingPending(speciesId,saved,{repair},availableReserve=0){
 const rule=developmentRules[speciesId];
 const valid=['grass','grasshopper'].includes(speciesId)&&object(saved)&&
  Number.isFinite(saved.remainingSeconds)&&saved.remainingSeconds>=0&&saved.remainingSeconds<=rule.pendingSeconds&&
  object(saved.position)&&['x','y'].every(key=>Number.isFinite(saved.position[key])&&saved.position[key]>=0&&saved.position[key]<=1)&&
  (speciesId!=='grasshopper'||availableReserve>=1);
 if(!valid){repair();return undefined;}
 return {remainingSeconds:saved.remainingSeconds,position:{x:saved.position.x,y:saved.position.y}};
}

// Historical stage notices may outlive their organism. They never grant points
// or enter the 22 current food-relation observations.
export function restoreDevelopmentHistory(saved,version,state,{array,number,time,repair}){
 const restored={sequence:0,history:[]};
 if(version<11)return restored;
 if(!object(saved)){repair();return restored;}
 const sequences=new Set(),stages=new Set();
 for(const record of array(saved.history,developmentConfig.historyLimit)){
  const rule=record&&Object.hasOwn(developmentRules,record.speciesId)?developmentRules[record.speciesId]:undefined,key=record&&`${record.instanceId}:${record.stage}`;
  const instance=record&&state.organisms.find(o=>o.instanceId===record.instanceId);
  if(!object(record)||!rule||rule.model==='learning'||!validId(record.instanceId)||
   !rule.stages.some(stage=>stage.id===record.stage)||!Number.isInteger(record.sequence)||record.sequence<1||record.sequence>1e9||
   sequences.has(record.sequence)||stages.has(key)||(instance&&instance.speciesId!==record.speciesId)){
   repair();continue;
  }
  sequences.add(record.sequence);stages.add(key);
  restored.history.push({sequence:record.sequence,instanceId:record.instanceId,speciesId:record.speciesId,stage:record.stage,simulationTime:time(record.simulationTime),noted:record.noted===true});
 }
 const sequence=number(saved.sequence,0,1e9);
 if(!Number.isInteger(sequence))repair();
 restored.sequence=Math.max(Math.floor(sequence),0,...restored.history.map(record=>record.sequence));
 return restored;
}
