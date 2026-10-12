import {lifespanRules,colonyConfig as config} from '../../data/lifespan-config.js';
import {effectiveAge} from '../state/life-state.js';
import {removeOrganism,recordPopulationChange,countSpecies} from './lifecycle.js';
import {factorValue} from './environment.js';

export function colonyActivity(instance,environment){
 if(lifespanRules[instance.speciesId].model!=='colony')return 1;
 const suitability=Math.min(factorValue(environment,'water'),factorValue(environment,'soil'),factorValue(environment,'air'));
 return (.25+.75*instance.life.vigor)*suitability;
}
// Ecology tick: predation, starvation, lifespan/colony, then birth/replenishment.
// Earlier removals are absent from the live array, ensuring one cause per animal.
export function updateLifespans(state,seconds){
 const removed=[];
 for(const instance of [...state.organisms]){
  const rule=lifespanRules[instance.speciesId],life=instance.life;
  if(rule.model==='individual'){
   if(effectiveAge(instance,state.simulationTime)>=life.duration){removeOrganism(state,instance.instanceId,rule.endCause||'natural_lifespan');removed.push(instance.instanceId);}
   continue;
  }
  const suitable=['water','soil','air'].every(f=>factorValue(state.environment,f)>=config.minimumEnvironment);
  const resource=state.decomposition.organicMatter[rule.resource]>=config.resourceThreshold;
  if(suitable){life.stressSeconds=0;life.vigor=resource?Math.min(1,life.vigor+seconds/config.recoverySeconds):Math.max(config.dormantVigor,life.vigor-seconds/rule.stressSeconds);}
  else{life.stressSeconds=Math.min(rule.stressSeconds,life.stressSeconds+seconds);life.vigor=Math.max(0,life.vigor-seconds/rule.stressSeconds);}
  if(life.stressSeconds>=rule.stressSeconds){removeOrganism(state,instance.instanceId,'colony_decline');removed.push(instance.instanceId);continue;}
  if(state.simulationTime>=life.nextRenewalAt&&suitable&&resource){
   life.generation=Math.min(1e9,life.generation+1);life.nextRenewalAt=state.simulationTime+life.renewalSeconds;
   const count=countSpecies(state,instance.speciesId);recordPopulationChange(state,instance.speciesId,'colony_renewal',count,count,{noted:true});
  }
 }
 return removed;
}
