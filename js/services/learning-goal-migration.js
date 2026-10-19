import {createLearningGoalProgress} from '../state/learning-goal-state.js';
import {decomposerIds,learningGoalConfig} from '../../data/learning-goals.js';
import {organismById} from '../../data/organisms.js';
import {foodRelationById} from '../../data/food-relations.js';
import {forestGoal} from '../../data/forest-goal.js';

const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
const bounded=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
export function snapshotLearningGoals(s){return {goalRevision:s.goalRevision,learningGoalProgress:structuredClone(s.learningGoalProgress)};}
// Earlier forests retain their original goals, including unfinished holds. Only
// a newly started forest adopts revision2. No old observation is synthesized.
export function restoreLearningGoals(d,version,s,repair){
 s.goalRevision=version<17?1:d.goalRevision;s.learningGoalProgress=createLearningGoalProgress();
 if(s.goalRevision!==2)return;
 const saved=d.learningGoalProgress,p=s.learningGoalProgress,t=s.simulationTime;
 const time=v=>bounded(v,0,t);
 if(!object(saved)||!object(saved.work)){repair();s.forestProgress.stableSeconds=s.forestProgress.cleared?forestGoal.stableSeconds:0;return;}
 let validWork=true;
 for(const key of decomposerIds){const value=saved.work[key];if(bounded(value,0,Math.min(learningGoalConfig.maximumWork,s.decomposition.processed)))p.work[key]=value;else{validWork=false;repair();}}
 if(Object.values(p.work).reduce((a,b)=>a+b,0)>s.decomposition.processed+1e-8){p.work=createLearningGoalProgress().work;validWork=false;repair();}
 const role=saved.decomposer;
 if(role!==null){if(validWork&&object(role)&&decomposerIds.includes(role.speciesId)&&time(role.at)&&bounded(role.processed,Number.MIN_VALUE,p.work[role.speciesId])&&s.activities.some(a=>a.activityId==='decomposer_classify'&&a.completed))p.decomposer={speciesId:role.speciesId,at:role.at,processed:role.processed};else repair();}
 const q=saved.inquiry;
 if(q!==null){
  const plant=organismById[q?.speciesId],env=q?.environmentBefore;
  let valid=object(q)&&['watching','interrupted','result','confirmed'].includes(q.phase)&&['watch','plant','care'].includes(q.choice)&&id(q.plantId)&&plant?.role==='producer'&&time(q.at)&&bounded(q.stockBefore,0,100)&&object(env)&&['sunlight','water','air','soil'].every(k=>bounded(env[k],0,1))&&Number.isInteger(q.managementBefore)&&bounded(q.managementBefore,0,s.managementActionCount)&&Array.isArray(q.introducedIds)&&q.introducedIds.length<=30&&q.introducedIds.every(id)&&new Set(q.introducedIds).size===q.introducedIds.length;
  if(valid&&q.choice==='watch')valid=Object.values(env).every(v=>v>=.4);
  if(valid&&q.choice==='care')valid=Object.values(env).some(v=>v<.4);
  if(valid)valid=s.observations.some(o=>{const r=foodRelationById[o.relationId];return r?.feedingMode==='resource'&&r.sourceSpeciesId===q.speciesId&&o.discoveredAt<=q.at;});
  const targets=q?.choice==='plant'?q.introducedIds:[q?.plantId];
  if(valid&&q.meal!==null)valid=object(q.meal)&&time(q.meal.at)&&q.meal.at>q.at&&targets.includes(q.meal.foodId)&&bounded(q.meal.stockAfter,0,100);
  if(valid&&q.outcome!==null)valid=object(q.outcome)&&q.meal&&time(q.outcome.at)&&q.outcome.at>q.meal.at&&q.outcome.foodId===q.meal.foodId&&bounded(q.outcome.stock,q.meal.stockAfter+learningGoalConfig.recoveryDifference,100);
  if(valid&&['result','confirmed'].includes(q.phase))valid=!!q.outcome;
  if(valid&&['watching','interrupted'].includes(q.phase))valid=q.outcome===null;
  if(valid&&q.choice==='care'&&q.meal)valid=s.managementActionCount>q.managementBefore;
  if(valid)valid=q.phase==='confirmed'?time(q.confirmedAt)&&q.confirmedAt>=q.outcome.at:q.confirmedAt===null;
  if(valid)p.inquiry={phase:q.phase,choice:q.choice,plantId:q.plantId,speciesId:q.speciesId,at:q.at,stockBefore:q.stockBefore,environmentBefore:Object.fromEntries(['sunlight','water','air','soil'].map(k=>[k,env[k]])),managementBefore:q.managementBefore,introducedIds:[...q.introducedIds],meal:q.meal?{at:q.meal.at,foodId:q.meal.foodId,stockAfter:q.meal.stockAfter}:null,outcome:q.outcome?{at:q.outcome.at,foodId:q.outcome.foodId,stock:q.outcome.stock}:null,confirmedAt:q.confirmedAt};
  else repair();
 }
 if(!s.forestProgress.cleared&&(!p.decomposer||p.inquiry?.phase!=='confirmed'))s.forestProgress.stableSeconds=0;
}
