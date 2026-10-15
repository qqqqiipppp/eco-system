import {evaluateReplayEvidence} from './replay.js';
import {syncCollection} from '../state/collection-state.js';
import {organismById} from '../../data/organisms.js';
import {forestGoal,progressWeights} from '../../data/forest-goal.js';
import {environmentFactors} from '../../data/environment-config.js';
import {factorValue} from './environment.js';

export function evaluateForestGoal(state) {
 if(state.round?.number>1){
  const checks=[
   {id:'stability',label:'안정도 70 이상',ok:Number.isFinite(state.metrics.stability)&&state.metrics.stability>=forestGoal.minimumStability},
   {id:'environment',label:'네 가지 환경이 모두 보통 이상',ok:Object.keys(environmentFactors).every(k=>factorValue(state.environment,k)>=forestGoal.minimumEnvironment)},
   evaluateReplayEvidence(state),
   {id:'structure',label:'생산자·소비자·분해자가 지금 함께 있어요',ok:['producer','consumer','decomposer'].every(role=>state.organisms.some(o=>organismById[o.speciesId].role===role))},
  ];return {checks,ready:checks.every(c=>c.ok)};
 }
 const checks=[
  {id:'stability',label:'숲의 안정도가 충분해요',ok:Number.isFinite(state.metrics.stability)&&state.metrics.stability>=forestGoal.minimumStability},
  {id:'environment',label:'햇빛·물·공기·토양이 모두 보통 이상이에요',ok:Object.keys(environmentFactors).every(key=>factorValue(state.environment,key)>=forestGoal.minimumEnvironment)},
  {id:'observations',label:'강아지풀 → 방아깨비, 방아깨비 → 참개구리를 발견 기록에 남겼어요',ok:forestGoal.requiredObservations.every(id=>state.observations.some(item=>item.relationId===id))},
  {id:'activities',label:'생산자·분해자·관찰 활동을 완료했어요',ok:forestGoal.requiredActivities.every(id=>state.activities.some(item=>item.activityId===id&&item.completed))},
  {id:'structure',label:'강아지풀·방아깨비·참개구리가 지금 숲에 함께 있어요',ok:forestGoal.requiredSpecies.every(id=>state.organisms.some(item=>item.speciesId===id))},
 ];
 return {ready:checks.every(item=>item.ok),checks};
}
export function updateForestGoal(state,seconds=0) {
 const goal=evaluateForestGoal(state),progress=state.forestProgress;
 state.metrics.bestStability=Math.max(state.metrics.bestStability,Number.isFinite(state.metrics.stability)?state.metrics.stability:0);
 if(progress.cleared)return false;
 progress.stableSeconds=goal.ready?Math.min(forestGoal.stableSeconds,progress.stableSeconds+Math.max(0,seconds)):0;
 if(progress.stableSeconds<forestGoal.stableSeconds)return false;
 progress.cleared=true;progress.clearedAt=state.simulationTime;syncCollection(state);
 return true;
}
export function calculateProgress(state) {
 if(state.forestProgress.cleared)return 100;
 if(state.round?.number>1){const e=evaluateForestGoal(state);return Math.round(e.checks.filter(c=>c.ok).length/e.checks.length*80+state.forestProgress.stableSeconds/forestGoal.stableSeconds*20);}
 const parts={
  observations:forestGoal.requiredObservations.filter(id=>state.observations.some(item=>item.relationId===id)).length/forestGoal.requiredObservations.length,
  activities:forestGoal.requiredActivities.filter(id=>state.activities.some(item=>item.activityId===id&&item.completed)).length/forestGoal.requiredActivities.length,
  unlocks:state.inventory.filter(item=>['frog','rabbit','mushroom'].includes(item.speciesId)&&item.acquired).length/3,
  management:Math.min(1,state.managementActionCount),
  stability:state.forestProgress.cleared?1:Math.min(1,state.forestProgress.stableSeconds/forestGoal.stableSeconds),
  clear:state.forestProgress.cleared?1:0,
 };
 const sum=Object.values(progressWeights).reduce((a,b)=>a+b,0);
 return Math.round(Object.entries(progressWeights).reduce((total,[key,weight])=>total+parts[key]*weight,0)/sum*100);
}
