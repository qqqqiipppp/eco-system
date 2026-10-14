import { managementActions } from '../../data/management-actions.js';
import {supportSurvival} from './population.js';
import { feedingConfig } from '../../data/ecology-config.js';
import { producerGrowth } from '../../data/environment-config.js';
import { factorValue, growthSuitability, setEnvironmentLevel } from './environment.js';
import { eventConfig } from '../../data/event-config.js';
import {recordEnvironmentResponse,currentEnvironmentEvent} from './environment-events.js';
import {pointGuidance,managementBudgetAllowed,reservedSupportUse,managementResultMessage} from './point-economy.js';
import {recordPointChange} from '../state/point-economy-state.js';

const findAction = id => managementActions.find(item => item.actionId === id);
function relevant(action, event) {
  if(event?.payload.organicOriginSequence)return false;
  if (event?.kind !== 'alert') return false;
  if (action.applicableTo === 'consumer-shortage') return event.sourceType === 'organism' && Boolean(feedingConfig[event.payload.speciesId]);
  if (action.applicableTo === 'producer-environment') return event.sourceType === 'environment' && Boolean(event.payload.factor);
  return event.sourceType === 'environment' && event.payload.factor === action.applicableTo;
}
const cooldownKey = (action,event) => action.effectType === 'hunger-relief' ? `${action.actionId}:${event.sourceId}` : action.actionId;

export function validateManagement(state, actionId, eventId) {
  const action = findAction(actionId);
  const recovery=eventId?.sourceType==='environment';
  const factor = recovery ? eventId.sourceId : null;
  const event = recovery ? {eventId:null,kind:'alert',sourceType:'environment',sourceId:factor,payload:{factor}} : state.events.find(item => item.eventId === eventId);
  const fail = message => ({ok:false,message});
  if (!action) return fail('알 수 없는 관리 행동이에요.');
  const supportRecovery=recovery&&action.effectType==='environment-step'&&reservedSupportUse(state,action,factor)>0;
  if(recovery&&!(supportRecovery||actionId==='habitat-care'&&action.effect.recoveryFactors.includes(factor)&&factorValue(state.environment,factor)<action.effect.minimumRecoveryValue))return fail('지금은 이 행동이 필요하지 않습니다.');
  if(supportRecovery&&!state.organisms.some(o=>producerGrowth[o.speciesId]))return fail('획득한 강아지풀을 먼저 숲에 놓아 주세요. 그 뒤 나쁜 환경을 돌봐요.');
  if (!event || (!recovery && event.status !== 'active') || !relevant(action,event)) return fail('지금은 이 행동이 필요하지 않습니다.');
  const target = state.organisms.find(item => item.instanceId === event.sourceId);
  if (event.sourceType === 'organism' && !target) return fail('이 생물은 이미 자연으로 돌아갔어요.');
  if (event.sourceType === 'environment' && (!state.environment[event.sourceId] || event.sourceId !== event.payload.factor)) return fail('환경 상태를 다시 살펴봐요.');
  const key = cooldownKey(action,event);
  if ((state.managementCooldowns[key] || 0) > state.simulationTime) return fail('조금 뒤 다시 사용할 수 있어요.');
  if (action.effectType === 'hunger-relief' && (target.speciesId !== event.payload.speciesId || target.hunger < .6 || target.foodShortageDuration < eventConfig.shortageSeconds)) return fail('지금은 이 행동이 필요하지 않습니다.');
  if (!recovery && event.sourceType === 'environment' && !state.organisms.some(item => producerGrowth[item.speciesId] && growthSuitability(item.speciesId,state.environment) < eventConfig.growthThreshold)) return fail('지금은 이 행동이 필요하지 않습니다.');
  if (action.effectType === 'environment-step' && factorValue(state.environment,action.effect.factor) >= .8) return fail('이미 좋은 상태예요. 지금은 이 행동이 필요하지 않습니다.');
  if (state.metrics.points < action.cost) return fail(`생태계 포인트가 부족해요. ${pointGuidance(state)}`);
  if(!managementBudgetAllowed(state,action,event.payload.factor))return fail('이 포인트는 지정된 나쁜 환경의 복구 예산이에요. 그 환경을 보통으로 돌보는 데 먼저 써요.');
  const recoveryFactor = action.effectType === 'producer-recovery' && action.effect.recoveryFactors.includes(event.payload.factor) && factorValue(state.environment,event.payload.factor) < action.effect.minimumRecoveryValue ? event.payload.factor : null;
  return {ok:true,action,event,target,key,recoveryFactor};
}

export function availableManagement(state,eventId) {
  const event = state.events.find(item => item.eventId === eventId);
  return managementActions.filter(action => relevant(action,event)).map(action => {
    const check = validateManagement(state,action.actionId,eventId);
    const rain=currentEnvironmentEvent(state);
    const description=action.actionId==='water-care'&&rain?.kind==='rain'&&rain.appliedDelta>0?'비가 물을 실제로 보충하고 있어요. 기다리면 포인트를 아낄 수도 있어요. 물 관리로 지금 상태를 빨리 개선하는 선택도 가능해요.':action.description;
    return {...action,description,available:check.ok,reason:check.ok?'':check.message};
  });
}

export function executeManagement(state,actionId,eventId) {
  const check = validateManagement(state,actionId,eventId);
  if (!check.ok) return check;
  const {action,event,target,key,recoveryFactor} = check;
  const before={environment:Object.fromEntries(Object.keys(state.environment).map(f=>[f,factorValue(state.environment,f)])),hunger:target?.hunger};
  const supportUsed=reservedSupportUse(state,action,event.payload.factor);
  const record = {actionId,sourceEventId:event.eventId,sourceId:event.sourceId,executedAt:state.simulationTime,cost:action.cost,result:'applied'};
  // All validation precedes this transaction. Never writes event.status.
  if (action.effectType === 'environment-step') {
    const factor = action.effect.factor;
    setEnvironmentLevel(state,factor,factorValue(state.environment,factor) < .4 ? 'normal' : 'good');
    record.factor = factor; record.valueAfter = state.environment[factor].value;
  } else if (action.effectType === 'hunger-relief') {
    target.hunger = Math.max(0,target.hunger-action.effect.relief);
    target.foodShortageDuration = 0;
    supportSurvival(target);
  } else {
    state.managementEffects.push({actionId,startedAt:state.simulationTime,expiresAt:state.simulationTime+action.duration,multiplier:action.effect.multiplier});
  }
  if (recoveryFactor) {
    setEnvironmentLevel(state,recoveryFactor,'normal');
    record.factor=recoveryFactor;record.valueAfter=state.environment[recoveryFactor].value;
  }
  state.metrics.points -= action.cost;
  state.managementCooldowns[key] = state.simulationTime+action.cooldown;
  state.managementHistory.push(record);
  state.managementActionCount += 1;
  record.targetFactor=event.payload.factor||null;
  if(event.eventId===null)record.directEnvironment=true;
  record.beforeValue=record.factor?before.environment[record.factor]:target?.hunger!==undefined?before.hunger:null;
  record.afterValue=record.factor?factorValue(state.environment,record.factor):target?.hunger??null;
  record.supportUsed=supportUsed;state.pointEconomy.support.remaining=Math.max(0,state.pointEconomy.support.remaining-supportUsed);
  recordPointChange(state,'management',-action.cost,`management:${state.managementActionCount}`,action.actionId);
  recordEnvironmentResponse(state,record,before);
  // Bounded session log; cooldowns and reward history are independent.
  if (state.managementHistory.length > 100) state.managementHistory.shift();
  const message=managementResultMessage(action,record);
  return {ok:true,message,record};
}

export function availableEnvironmentalRecovery(state) {
  const action=findAction('habitat-care');
  return action.effect.recoveryFactors.filter(factor=>factorValue(state.environment,factor)<action.effect.minimumRecoveryValue).map(factor=>{
    const check=validateManagement(state,action.actionId,{sourceType:'environment',sourceId:factor});
    return {factor,name:action.name,cost:action.cost,available:check.ok,reason:check.ok?'':check.message};
  });
}

export function advanceManagement(state,seconds) {
  state.simulationTime += seconds;
  state.managementEffects = state.managementEffects.filter(effect => effect.expiresAt > state.simulationTime);
  for (const [key,deadline] of Object.entries(state.managementCooldowns)) if (deadline <= state.simulationTime) delete state.managementCooldowns[key];
}
export function producerRecoveryMultiplier(state) {
  return state.managementEffects.reduce((value,effect) => Math.max(value,effect.multiplier),1);
}
