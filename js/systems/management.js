import { managementActions } from '../../data/management-actions.js';
import { feedingConfig } from '../../data/ecology-config.js';
import { producerGrowth } from '../../data/environment-config.js';
import { factorValue, growthSuitability, setEnvironmentLevel } from './environment.js';
import { eventConfig } from '../../data/event-config.js';

const findAction = id => managementActions.find(item => item.actionId === id);
function relevant(action, event) {
  if (event?.kind !== 'alert') return false;
  if (action.applicableTo === 'consumer-shortage') return event.sourceType === 'organism' && Boolean(feedingConfig[event.payload.speciesId]);
  if (action.applicableTo === 'producer-environment') return event.sourceType === 'environment' && Boolean(event.payload.factor);
  return event.sourceType === 'environment' && event.payload.factor === action.applicableTo;
}
const cooldownKey = (action,event) => action.effectType === 'hunger-relief' ? `${action.actionId}:${event.sourceId}` : action.actionId;

export function validateManagement(state, actionId, eventId) {
  const action = findAction(actionId);
  const recovery = actionId === 'habitat-care' && eventId?.sourceType === 'environment';
  const factor = recovery ? eventId.sourceId : null;
  const event = recovery ? {eventId:null,kind:'alert',sourceType:'environment',sourceId:factor,payload:{factor}} : state.events.find(item => item.eventId === eventId);
  const fail = message => ({ok:false,message});
  if (!action) return fail('알 수 없는 관리 행동이에요.');
  if (recovery && (!action.effect.recoveryFactors.includes(factor) || factorValue(state.environment,factor) >= action.effect.minimumRecoveryValue)) return fail('지금은 이 행동이 필요하지 않습니다.');
  if (!event || (!recovery && event.status !== 'active') || !relevant(action,event)) return fail('지금은 이 행동이 필요하지 않습니다.');
  const target = state.organisms.find(item => item.instanceId === event.sourceId);
  if (event.sourceType === 'organism' && !target) return fail('이 생물은 이미 숲에서 사라졌어요.');
  if (event.sourceType === 'environment' && (!state.environment[event.sourceId] || event.sourceId !== event.payload.factor)) return fail('환경 상태를 다시 살펴봐요.');
  const key = cooldownKey(action,event);
  if ((state.managementCooldowns[key] || 0) > state.simulationTime) return fail('조금 뒤 다시 사용할 수 있어요.');
  if (action.effectType === 'hunger-relief' && (target.speciesId !== event.payload.speciesId || target.hunger < .6 || target.foodShortageDuration < eventConfig.shortageSeconds)) return fail('지금은 이 행동이 필요하지 않습니다.');
  if (!recovery && event.sourceType === 'environment' && !state.organisms.some(item => producerGrowth[item.speciesId] && growthSuitability(item.speciesId,state.environment) < eventConfig.growthThreshold)) return fail('지금은 이 행동이 필요하지 않습니다.');
  if (action.effectType === 'environment-step' && factorValue(state.environment,action.effect.factor) >= .8) return fail('이미 좋은 상태예요. 지금은 이 행동이 필요하지 않습니다.');
  if (state.metrics.points < action.cost) return fail('생태계 포인트가 부족합니다. 💡 발견 기록이나 ? 조사를 해 보세요.');
  const recoveryFactor = action.effectType === 'producer-recovery' && action.effect.recoveryFactors.includes(event.payload.factor) && factorValue(state.environment,event.payload.factor) < action.effect.minimumRecoveryValue ? event.payload.factor : null;
  return {ok:true,action,event,target,key,recoveryFactor};
}

export function availableManagement(state,eventId) {
  const event = state.events.find(item => item.eventId === eventId);
  return managementActions.filter(action => relevant(action,event)).map(action => {
    const check = validateManagement(state,action.actionId,eventId);
    return {...action,available:check.ok,reason:check.ok?'':check.message};
  });
}

export function executeManagement(state,actionId,eventId) {
  const check = validateManagement(state,actionId,eventId);
  if (!check.ok) return check;
  const {action,event,target,key,recoveryFactor} = check;
  const record = {actionId,sourceEventId:event.eventId,sourceId:event.sourceId,executedAt:state.simulationTime,cost:action.cost,result:'applied'};
  // All validation precedes this transaction. Never writes event.status.
  if (action.effectType === 'environment-step') {
    const factor = action.effect.factor;
    setEnvironmentLevel(state,factor,factorValue(state.environment,factor) < .4 ? 'normal' : 'good');
    record.factor = factor; record.valueAfter = state.environment[factor].value;
  } else if (action.effectType === 'hunger-relief') {
    target.hunger = Math.max(0,target.hunger-action.effect.relief);
    target.foodShortageDuration = 0;
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
  // Bounded session log; cooldowns and reward history are independent.
  if (state.managementHistory.length > 100) state.managementHistory.shift();
  const message = recoveryFactor ? '서식지 회복으로 나쁜 환경을 한 단계 개선했어요. 식물의 회복도 한동안 도와요.' : actionId === 'food-support' ? '임시 먹이 지원을 했어요. 원래 먹이가 부족하면 다시 배고파져요.' : actionId === 'habitat-care' ? '서식지 회복을 시작했어요. 식물의 변화를 천천히 살펴봐요.' : actionId === 'water-care' ? '물 환경을 한 단계 개선했습니다.' : '토양을 한 단계 돌보았습니다.';
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
