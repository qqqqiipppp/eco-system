import {pointEconomyConfig as config,recoveryChoices} from '../../data/point-economy.js';
import {activities} from '../../data/activities.js';
import {environmentFactors,producerGrowth} from '../../data/environment-config.js';
import {environmentEventDefinitions} from '../../data/environment-events.js';
import {managementActions} from '../../data/management-actions.js';
import {foodRelations} from '../../data/food-relations.js';
import {organismById} from '../../data/organisms.js';
import {hasReceivedReward} from './rewards.js';
import {activityCondition} from './activity-rules.js';
import {factorValue,qualityLabel,growthSuitability} from './environment.js';
import {currentEnvironmentEvent,chooseEnvironmentObservation} from './environment-events.js';
import {recordPointChange} from '../state/point-economy-state.js';

const eventSequence=id=>/^environment-[1-9]\d*$/.test(id)?Number(id.slice(12)):0;
const costFor=factor=>managementActions.find(a=>a.effect.factor===factor)?.cost||managementActions.find(a=>a.actionId==='habitat-care').cost;
export function studyRecovery(record){
 const natural=record.recoveredDelta>config.epsilon,care=record.responses.some(r=>r.factor===record.factor&&r.afterValue>r.beforeValue+config.epsilon);
 if(record.kind==='rain'&&record.appliedDelta>config.epsilon)return care?'mixed':'rain';
 return natural&&care?'mixed':natural?'natural':care?'care':'none';
}
export function studyEligible(state,record){
 const p=state.pointEconomy;
 return Boolean(record&&record.phase==='ended'&&eventSequence(record.eventId)>p.studyStartSequence&&Math.abs(record.appliedDelta)+config.epsilon>=config.minimumChange&&
  p.studyCount<config.studyLimit&&p.totals.study+config.studyReward<=config.studyMaximum&&!p.studyClaimedIds.includes(record.eventId)&&!p.studyClaims.some(c=>c.eventId===record.eventId)&&!p.ledger.some(r=>r.id===`environment-study:${record.eventId}`));
}
export const studyCandidates=state=>state.environmentEvents.history.filter(r=>studyEligible(state,r)).slice().reverse();
export function claimEnvironmentStudy(state,eventId,answer){
 const record=state.environmentEvents.history.find(r=>r.eventId===eventId);
 if(!studyEligible(state,record))return {ok:false,message:'이 변화는 아직 학습 보상 조건을 갖추지 않았거나 이미 기록했어요.'};
 const recovery=studyRecovery(record);
 if(answer?.factor!==record.factor||answer?.recovery!==recovery)return {ok:false,message:'원인과 게임에서 확인한 변화를 다시 살펴봐요. 관리와 자연 회복을 구분해요.'};
 const p=state.pointEconomy,id=`environment-study:${eventId}`;
 p.studyClaims.push({rewardId:id,eventId,kind:record.kind,grantedAt:state.simulationTime,amount:config.studyReward,factor:record.factor,recovery});p.studyClaimedIds.push(eventId);p.studyCount++;
 state.metrics.points+=config.studyReward;recordPointChange(state,'study',config.studyReward,id,eventId);chooseEnvironmentObservation(state,eventId,'observe');
 return {ok:true,amount:config.studyReward,message:`${environmentEventDefinitions[record.kind].name}의 실제 원인과 회복 결과를 확인했어요. 생태계 포인트 ${config.studyReward}점을 받았어요. 지금 모두 쓸 필요는 없어요.`};
}
export function availableLearning(state){
 const options=[];
 for(const a of activities){const p=state.activities.find(p=>p.activityId===a.activityId);
  if(!p.completed&&!hasReceivedReward(state,'activity',a.activityId)&&activityCondition(state,a.activityId,a.correctAnswer).ok)options.push({type:'activity',id:a.activityId,amount:a.pointReward,message:`배움에서 아직 완료하지 않은 ‘${a.title}’ 활동을 확인해 보세요.`});
 }
 for(const e of state.events.filter(e=>e.status==='active')){
  if(e.kind==='question'&&!hasReceivedReward(state,'question',`producer_${e.payload.factor}_limit`))options.push({type:'question',id:e.payload.factor,amount:10,message:'지금 보이는 ?에서 식물 회복이 느린 원인을 생각해 보세요.'});
  if(e.payload.relationId&&!state.observations.some(o=>o.relationId===e.payload.relationId)&&!hasReceivedReward(state,'observation',e.payload.relationId))options.push({type:'food',id:e.payload.relationId,amount:12,message:'지금 보이는 💡에서 실제로 본 먹이 관계를 처음 기록해 보세요.'});
 }
 const slow=state.organisms.some(o=>producerGrowth[o.speciesId]&&growthSuitability(o.speciesId,state.environment)<.8);
 if(slow){const worst=Object.keys(environmentFactors).sort((a,b)=>factorValue(state.environment,a)-factorValue(state.environment,b))[0];
  if(!hasReceivedReward(state,'question',`producer_${worst}_limit`)&&!options.some(o=>o.type==='question'&&o.id===worst))options.push({type:'question',id:worst,amount:10,message:'식물의 회복이 느려요. 잠시 뒤 나타나는 ?에서 원인을 조사해 보세요.'});
 }
 const acquired=id=>state.inventory.some(c=>c.speciesId===id&&c.acquired);
 const canProvide=(id,visited=new Set())=>{
  if(state.organisms.some(o=>o.speciesId===id&&(!('foodStock'in o)||o.foodStock>0)))return true;
  if(!acquired(id)||visited.has(id))return false;
  if(organismById[id].role==='producer')return true;
  const next=new Set(visited);next.add(id);return foodRelations.filter(r=>r.targetSpeciesId===id).some(r=>canProvide(r.sourceSpeciesId,next));
 };
 for(const r of foodRelations){
  if(hasReceivedReward(state,'observation',r.relationId)||state.observations.some(o=>o.relationId===r.relationId)||options.some(o=>o.id===r.relationId))continue;
  const food=canProvide(r.sourceSpeciesId);
  if(food&&acquired(r.sourceSpeciesId)&&acquired(r.targetSpeciesId))options.push({type:'food',id:r.relationId,amount:12,message:`${organismById[r.sourceSpeciesId].name} → ${organismById[r.targetSpeciesId].name} 먹이 관계를 살펴봐요. 실제로 먹은 뒤 💡에서 첫 발견을 기록해요.`});
 }
 const study=studyCandidates(state)[0];if(study)options.push({type:'study',id:study.eventId,amount:config.studyReward,message:'환경 상태에서 완료된 변화의 원인과 실제 회복 결과를 확인할 수 있어요.'});
 const pending=currentEnvironmentEvent(state),p=state.pointEconomy;
 if(!study&&pending&&eventSequence(pending.eventId)>p.studyStartSequence&&p.studyCount<config.studyLimit&&Math.abs(pending.appliedDelta)+config.epsilon>=config.minimumChange&&!p.studyClaimedIds.includes(pending.eventId))options.push({type:'pending-study',id:pending.eventId,amount:config.studyReward,message:'이 사건에서 환경이 실제로 변했어요. 사건과 회복이 끝난 뒤 환경 상태에서 원인·결과 학습을 확인할 수 있어요.'});
 return options;
}
export function willRecoverNaturally(state,factor){
 const r=currentEnvironmentEvent(state);if(!r||r.factor!==factor)return false;
 const rule=environmentEventDefinitions[r.kind],value=factorValue(state.environment,factor);
 if(rule.magnitude>0)return value+rule.magnitude*r.intensity*(r.duration-r.effectSeconds)/r.duration>=config.minimumEnvironment;
 return r.recoveryTarget>=config.minimumEnvironment&&r.recoverySeconds>0;
}
export function supportQuote(state){
 const factors=Object.keys(environmentFactors).filter(f=>factorValue(state.environment,f)<config.minimumEnvironment&&!willRecoverNaturally(state,f));
 const need=factors.reduce((sum,f)=>sum+costFor(f),0),amount=Math.max(0,need-state.metrics.points);
 if(!factors.length)return {available:false,reason:'환경은 보통 이상이거나 자연 회복을 기다릴 수 있어요.',factors,amount:0};
 if(!amount)return {available:false,reason:'지금 가진 포인트로 나쁜 환경을 보통으로 돌볼 수 있어요.',factors,amount:0};
 const learning=availableLearning(state);if(learning.length)return {available:false,reason:learning[0].message,factors,amount:0};
 if(state.recoverySupportUsed||state.pointEconomy.support.used||state.pointEconomy.totals.support>0||state.pointEconomy.ledger.some(r=>r.type==='support'))return {available:false,reason:'이 숲의 한 번 지원은 이미 사용했어요. 남은 복구 지원은 지정된 나쁜 환경을 돌보는 데 먼저 써요.',factors,amount:0};
 return {available:amount<=config.supportMaximum,factors,amount,budget:need,reason:'환경 때문에 진행이 막혔고 지금 가능한 학습이나 자연 회복도 없어요. 이 숲에서 한 번만 복구에 필요한 부족액을 지원해요.'};
}
export function claimRecoverySupport(state){
 const quote=supportQuote(state);if(!quote.available)return {ok:false,message:quote.reason};
 state.pointEconomy.support={used:true,grantedAt:state.simulationTime,amount:quote.amount,budget:quote.budget,remaining:quote.budget,factors:[...quote.factors]};
 state.recoverySupportUsed=true;
 state.metrics.points+=quote.amount;recordPointChange(state,'support',quote.amount,'support:environment-recovery','blocked-environment');
 return {ok:true,amount:quote.amount,message:`진행을 다시 시작하도록 생태계 포인트 ${quote.amount}점을 한 번 지원했어요. ${quote.factors.map(f=>environmentFactors[f].name).join('·')}의 나쁜 상태를 보통으로 돌보는 데 먼저 사용해요. 생물이 없으면 획득한 강아지풀을 먼저 배치해요.`};
}
export function reservedSupportUse(state,action,factor){
 const s=state.pointEconomy.support;
 const allowed=s.remaining>0&&s.factors.includes(factor)&&factorValue(state.environment,factor)<config.minimumEnvironment&&
  (action.effectType==='environment-step'&&action.effect.factor===factor||action.actionId==='habitat-care'&&action.effect.recoveryFactors.includes(factor));
 return allowed?Math.min(supportReserved(state),action.cost):0;
}
export const supportReserved=state=>Math.min(state.pointEconomy.support.remaining,state.pointEconomy.support.factors.filter(f=>factorValue(state.environment,f)<config.minimumEnvironment).reduce((sum,f)=>sum+costFor(f),0));
export function managementBudgetAllowed(state,action,factor){
 const reserved=supportReserved(state),use=reservedSupportUse(state,action,factor);
 return state.metrics.points-reserved+use>=action.cost;
}
export function pointGuidance(state){
 const bad=Object.keys(environmentFactors).filter(f=>factorValue(state.environment,f)<config.minimumEnvironment),current=currentEnvironmentEvent(state);
 const recovery=bad.length?bad.every(f=>willRecoverNaturally(state,f)):current&&(current.phase==='recovering'||current.kind==='rain'&&current.appliedDelta>config.epsilon)&&willRecoverNaturally(state,current.factor);
 if(recovery)return '지금은 환경이 자연적으로 회복되는지 지켜볼 수 있어요. 포인트를 아껴도 괜찮아요.';
 const learning=availableLearning(state);if(learning.length)return learning[0].message;
 const quote=supportQuote(state);if(quote.available)return '환경 상태의 한 번 복구 지원을 확인해요. 나쁜 환경 때문에 진행이 막힌 숲에만 제공해요.';
 if(supportReserved(state)>0)return '남은 복구 예산은 지정된 나쁜 환경을 보통으로 돌보는 데 먼저 써요.';
 return '현재 받을 수 있는 일회성 보상은 모두 받았거나 지금 조건이 없어요. 새로운 환경 변화는 실제 결과를 확인하고, 필요한 관리에 포인트를 아껴 써요.';
}
export function managementResultMessage(action,record){
 const intended=record.targetFactor&&environmentFactors[record.targetFactor].name;
 const direct=record.factor&&record.afterValue>record.beforeValue+config.epsilon?`${environmentFactors[record.factor].name}이 ${qualityLabel(record.beforeValue)}에서 ${qualityLabel(record.afterValue)}으로 실제 한 단계 개선됐어요.`:
  action.actionId==='food-support'?'배고픔과 쇠약을 잠시 덜어줬어요. 실제 먹이를 먹은 것은 아니에요.':`환경 값을 바로 올린 행동은 아니에요. 식물의 성장·먹이 회복을 ${action.duration}초 동안 조금 도와요.`;
 return `${action.name}에 생태계 포인트 ${action.cost}점을 사용했어요.${intended?' 살펴볼 환경: '+intended+'.':''} ${direct} ${action.actionId==='food-support'?'원래 먹이와 거리를 살펴봐요. 먹이가 없으면 다시 배고파져요.':'이제 강아지풀의 성장과 방아깨비의 먹이 상태를 살펴봐요. 최종 개체 수가 반드시 늘어나는 것은 아니에요.'}`;
}
export function studyPresentation(state,record){
 if(!record)return null;
 const name=environmentFactors[record.factor].name,care=record.responses.filter(r=>r.factor===record.factor&&r.afterValue>r.beforeValue+config.epsilon);
 const details=[environmentEventDefinitions[record.kind].cause,`실제로 ${name}이 ${record.appliedDelta<0?'낮아지는':'나아지는'} 변화가 있었어요.`];
 if(record.kind==='rain'&&record.appliedDelta>config.epsilon)details.push('비가 실제로 물을 공급했어요.');
 if(record.recoveredDelta>config.epsilon)details.push(`사건 뒤 ${name}이 자연적으로 서서히 회복됐어요.`);
 for(const row of care)details.push(`${managementActions.find(a=>a.actionId===row.actionId).name}에 ${row.cost}포인트를 써서 ${name}이 ${qualityLabel(row.beforeValue)}에서 ${qualityLabel(row.afterValue)}으로 실제 좋아졌어요.`);
 if(!care.length&&record.responses.length)details.push('선택한 관리는 이 환경 값을 즉시 올린 행동은 아니었어요.');
 return {eventId:record.eventId,name:environmentEventDefinitions[record.kind].name,factor:record.factor,recovery:studyRecovery(record),choices:recoveryChoices,description:details.join(' ')};
}
