import {activityById} from '../../data/activities.js';
import {organismById} from '../../data/organisms.js';
import {environmentFactors} from '../../data/environment-config.js';
import {factorValue} from './environment.js';
import {evaluateStability} from './stability.js';

// Shared live checks for completion and unlocking. Does not change state.
export function activityCondition(state,activityId,answer) {
 const activity=activityById[activityId];
 if(!Object.hasOwn(activityById,activityId))return {ok:false,message:'알 수 없는 활동이에요.'};
 if(activity.choices)return {ok:activity.choices.some(c=>c.id===answer)&&answer===activity.correctAnswer,message:activity.hint};
 if(activity.type==='observation')return {ok:state.observations.some(o=>o.relationId===activity.requirements.relationId),message:activity.hint};
 const r=activity.requirements;
 const producers=new Set(state.organisms.filter(o=>organismById[o.speciesId]?.role==='producer').map(o=>o.speciesId));
 const checks=[
  {label:'서로 다른 생산자 두 종류',ok:producers.size>=r.producerSpecies},
  {label:'풀을 숲에 배치하기',ok:state.organisms.some(o=>o.speciesId==='grass')},
  {label:'햇빛·물·공기·토양 모두 보통 이상',ok:Object.keys(environmentFactors).every(k=>factorValue(state.environment,k)>=r.minEnvironment)},
  {label:'먹이와 생물 역할의 균형 갖추기',ok:Number.isFinite(state.metrics.stability)&&state.metrics.stability>=r.minStability&&evaluateStability(state).score>=r.minStability},
 ];
 return {ok:checks.every(c=>c.ok),checks,message:activity.hint};
}
