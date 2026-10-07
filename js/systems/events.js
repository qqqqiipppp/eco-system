import { eventConfig, shortageEvents, discoveryEvents, growthInvestigation } from '../../data/event-config.js';
import { growthSuitability, factorValue } from './environment.js';
import { grantReward, rewardResolvedManagement } from './rewards.js';
import { producerGrowth, environmentFactors } from '../../data/environment-config.js';

/** Actual ecology signals only. No DOM, wall-clock timers, random generation or
 * automatic discovery credit. A discovery is recorded by acknowledge().
 */
export function createEventSystem(initialTime = 0, memory = {}) {
  let time = initialTime, accumulated = 0, sequence = memory?.sequence || 0, checks = 0;
  const slowSince = new Map();
  const cooldowns = new Map(memory?.cooldowns || []);
  const questionDone = new Set(memory?.questionDone || []);
  const pendingDiscoveries = new Map(memory?.pendingDiscoveries || []);
  let hasConditions = false;

  function close(event, status) { event.status = status; event.closedAt = time; }
  function evaluate(state) {
    checks++;
    const live = new Map(state.organisms.map(instance => [instance.instanceId, instance]));
    const candidates = new Map();
    for (const instance of state.organisms) {
      if (shortageEvents[instance.speciesId] && instance.foodShortageDuration >= eventConfig.shortageSeconds && instance.hunger >= 0.6) {
        const key = `shortage:${instance.instanceId}`;
        candidates.set(key, { key, kind: 'alert', sourceType: 'organism', sourceId: instance.instanceId, ...shortageEvents[instance.speciesId], payload: { speciesId: instance.speciesId } });
      }
    }
    const slow = state.organisms.filter(instance => producerGrowth[instance.speciesId] && growthSuitability(instance.speciesId, state.environment) < eventConfig.growthThreshold);
    const worst = slow.length ? Object.keys(environmentFactors).sort((a,b) => factorValue(state.environment,a)-factorValue(state.environment,b))[0] : null;
    if (worst) {
      if (!slowSince.has(worst)) slowSince.set(worst, time);
      if (time - slowSince.get(worst) >= eventConfig.slowGrowthSeconds) {
        const name = environmentFactors[worst].name;
        const explanation = `${name} 상태가 나쁘면 식물의 성장과 먹이 회복이 느려져요. 식물이 공급하는 먹이가 줄면 소비자도 먹이를 얻기 어려워져요.`;
        const key = `growth:${worst}`;
        candidates.set(key, { key, kind: 'alert', sourceType: 'environment', sourceId: worst, title: `${name} 상태 때문에 식물의 회복이 느려요`, message: '지금 식물이 먹이를 회복하는 속도가 낮아졌어요.', explanation, payload: { factor: worst } });
        const questionKey = `investigate:${worst}`;
        if (!questionDone.has(questionKey)) candidates.set(questionKey, { key: questionKey, kind: 'question', sourceType: 'organism', sourceId: slow[0].instanceId, title: growthInvestigation.title, message: growthInvestigation.message, explanation, payload: { factor: worst, choices: growthInvestigation.choices } });
      }
    }
    for (const key of slowSince.keys()) if (key !== worst) slowSince.delete(key);
    for (const key of questionDone) if (key !== `investigate:${worst}`) questionDone.delete(key);

    for (const [relationId, signal] of pendingDiscoveries) {
      if (state.observations.some(item => item.relationId === relationId)) { pendingDiscoveries.delete(relationId); continue; }
      const definition = discoveryEvents[relationId];
      const sourceExists = live.has(signal.consumerInstanceId);
      const key = `discovery:${relationId}`;
      candidates.set(key, { key, kind: 'insight', sourceType: sourceExists ? 'organism' : 'environment', sourceId: sourceExists ? signal.consumerInstanceId : 'forest', title: definition.title, message: definition.message, explanation: definition.explanation, payload: { relationId } });
    }
    hasConditions = candidates.size > 0 || slowSince.size > 0;
    const active = new Map(state.events.filter(event => event.status === 'active').map(event => [event.key,event]));
    for (const event of active.values()) {
      const candidate = candidates.get(event.key);
      if (!candidate) { close(event, 'resolved'); cooldowns.set(event.key,time+eventConfig.cooldownSeconds); active.delete(event.key); }
      else if (event.sourceId !== candidate.sourceId || event.sourceType !== candidate.sourceType) {
        event.sourceId = candidate.sourceId; event.sourceType = candidate.sourceType;
      }
    }
    const ordered = [...candidates.values()].sort((a,b)=>eventConfig.priority[b.kind]-eventConfig.priority[a.kind]);
    for (const candidate of ordered) {
      if (active.has(candidate.key) || time < (cooldowns.get(candidate.key) || 0) || active.size >= eventConfig.maxActive) continue;
      const event = { ...candidate, eventId: `event-${++sequence}`, status: 'active', createdAt: time };
      state.events.push(event); active.set(event.key,event);
    }
    while (state.events.length > eventConfig.maxHistory) {
      const index = state.events.findIndex(event => event.status !== 'active');
      if (index < 0) break;
      state.events.splice(index,1);
    }
    for (const [key, deadline] of cooldowns) if (deadline <= time && !candidates.has(key)) cooldowns.delete(key);
    rewardResolvedManagement(state);
  }
  return {
    update(state, seconds, feedingEvents = []) {
      time += seconds; accumulated += seconds;
      for (const signal of feedingEvents) {
        const entry = Object.entries(discoveryEvents).find(([,definition]) => definition.foodSpeciesId === signal.foodSpeciesId && definition.consumerSpeciesId === signal.consumerSpeciesId);
        if (entry && !pendingDiscoveries.has(entry[0]) && !state.observations.some(item=>item.relationId===entry[0])) pendingDiscoveries.set(entry[0], signal);
      }
      if (accumulated + 1e-9 < eventConfig.tickSeconds) return false;
      accumulated %= eventConfig.tickSeconds; evaluate(state); return true;
    },
    refresh: evaluate,
    needsTick: () => hasConditions || pendingDiscoveries.size > 0,
    acknowledge(state, eventId, answerId) {
      evaluate(state);
      const event = state.events.find(item => item.eventId === eventId && item.status === 'active');
      if (!event) return { ok:false, message:'상황이 달라졌어요. 다시 숲을 살펴봐요.' };
      if (event.kind === 'question') {
        const choice = event.payload.choices.find(item=>item.id===answerId);
        if (!choice?.correct) return { ok:false, message:growthInvestigation.retry };
        questionDone.add(event.key);
      }
      if (event.kind === 'insight' && !state.observations.some(item=>item.relationId===event.payload.relationId)) {
        state.observations.push({ relationId: event.payload.relationId, eventId, discoveredAt: time });
        pendingDiscoveries.delete(event.payload.relationId);
      }
      close(event, event.kind === 'insight' ? 'resolved' : 'dismissed');
      cooldowns.set(event.key,time+eventConfig.cooldownSeconds);
      const reward = event.kind === 'insight' ? grantReward(state,'observation',event.payload.relationId,eventId) : event.kind === 'question' ? grantReward(state,'question',`producer_${event.payload.factor}_limit`,eventId) : 0;
      return { ok:true, message:(event.kind==='insight' ? '발견 기록에 남겼어요!' : '확인했어요. 숲의 변화를 계속 살펴봐요.') + (reward ? ` 생태계 포인트 ${reward}를 받았어요.` : '') };
    },
    exportMemory: () => ({sequence,cooldowns:[...cooldowns],questionDone:[...questionDone],pendingDiscoveries:[...pendingDiscoveries]}),
    getDiagnostics: () => ({ checks, time }),
  };
}
