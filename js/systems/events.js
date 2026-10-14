import { eventConfig, shortageEvents, discoveryEvents, growthInvestigation, eventPriority } from '../../data/event-config.js';
import {relationFor,foodRelations} from '../../data/food-relations.js';
import {foodResourceConfig,feedingConfig} from '../../data/ecology-config.js';
import { growthSuitability, factorValue } from './environment.js';
import { grantReward, rewardResolvedManagement } from './rewards.js';
import { producerGrowth, environmentFactors } from '../../data/environment-config.js';
import {survivalStage,populationMessage} from './population.js';
import {organismById} from '../../data/organisms.js';
import {developmentNotice} from './development.js';
import {developmentConfig} from '../../data/development-config.js';
import {currentEnvironmentEvent,environmentEventPresentation,chooseEnvironmentObservation} from './environment-events.js';
import {organicNoticeCandidates,organicNoticeText,acknowledgeOrganicOrigin} from './organic-notices.js';

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
  function evaluate(state,settleRewards=true) {
    checks++;
    const live = new Map(state.organisms.map(instance => [instance.instanceId, instance]));
    const candidates = new Map();
    for (const instance of state.organisms) {
      if (shortageEvents[instance.speciesId] && instance.foodShortageDuration >= eventConfig.shortageSeconds && instance.hunger >= 0.6) {
        const key = `shortage:${instance.instanceId}`;
        const stage=survivalStage(instance),weak=stage==='weak'||stage==='severe';
        candidates.set(key, { key, kind: 'alert', sourceType: 'organism', sourceId: instance.instanceId, ...shortageEvents[instance.speciesId], ...(weak?{title:`${organismById[instance.speciesId].name}가 오랫동안 먹이를 먹지 못했어요`,message:'먹이를 살펴보고 회복할 시간을 마련해 주세요.'}:{}), payload: { speciesId: instance.speciesId, urgent:weak } });
      }
    }
    for(const sourceId of new Set(foodRelations.map(r=>r.sourceSpeciesId))){
      const foods=state.organisms.filter(o=>o.speciesId===sourceId);if(!foods.length)continue;
      const targets=new Set(foodRelations.filter(r=>r.sourceSpeciesId===sourceId).map(r=>r.targetSpeciesId));
      const consumers=state.organisms.filter(o=>targets.has(o.speciesId)&&foods.some(f=>Math.hypot(f.position.x-o.position.x,f.position.y-o.position.y)<=feedingConfig[o.speciesId].searchRadius));
      const shared=consumers.length>=3||consumers.length>=2&&new Set(consumers.map(o=>o.speciesId)).size>1;
      const supply=foods.reduce((sum,o)=>sum+(foodResourceConfig[sourceId]?o.foodStock/foodResourceConfig[sourceId].maximum:1),0);
      if(shared&&supply<consumers.length*.6){const key=`competition:${sourceId}`;candidates.set(key,{key,kind:'alert',sourceType:'environment',sourceId:'forest',title:'여러 생물이 같은 먹이를 이용하고 있어요',message:`${organismById[sourceId].name}를 이용하는 생물들이 먹이를 얻기 어려울 수 있어요.`,explanation:'개체 수가 늘면 먹이 소비도 늘어요. 먹이 자원과 다른 먹이 관계를 함께 살펴보세요.',payload:{competitionSpeciesId:sourceId}});}
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
    const growthNotices=new Map();
    const organicCandidates=organicNoticeCandidates(state),organicPopulation=new Set(organicCandidates.flatMap(c=>c.populationSequences));
    for(const {record,worker,urgent} of organicCandidates){
      const key=`organic:${record.sequence}`;
      const text=organicNoticeText(record,worker);
      if(urgent)text.explanation+=' 같은 최근 발생 기록에는 먹이 부족으로 줄어든 생물도 있어요. 원래 먹이 공급을 함께 살펴봐요.';
      candidates.set(key,{key,kind:'alert',sourceType:'organism',sourceId:worker.instanceId,...text,payload:{organicOriginSequence:record.sequence,urgent}});
    }
    const environmentRecord=currentEnvironmentEvent(state)||state.environmentEvents.history.at(-1);
    if(environmentRecord&&!environmentRecord.observed){
      const summary=environmentEventPresentation(state).current,key=`environment-event:${environmentRecord.eventId}`;
      candidates.set(key,{key,kind:'alert',sourceType:'environment',sourceId:environmentRecord.factor,
        title:`숲 환경 변화: ${summary.name}`,message:summary.cause,explanation:`${summary.expected} ${summary.actual.join(' ')} 자세한 결과는 환경 상태에서 살펴봐요.`,
        payload:{factor:environmentRecord.factor,environmentEventId:environmentRecord.eventId}});
    }
    for(const record of state.development.history)if(!record.noted)growthNotices.set(`${record.speciesId}:${record.stage}`,record);
    for(const record of [...growthNotices.values()].slice(-developmentConfig.noticeLimit)){
      const sourceExists=live.has(record.instanceId),key=`development:${record.sequence}`;
      candidates.set(key,{key,kind:'insight',sourceType:sourceExists?'organism':'environment',sourceId:sourceExists?record.instanceId:'forest',title:'생물의 성장 모습을 발견했어요',message:developmentNotice(record),explanation:'같은 개체의 생활 모습이 달라졌어요. 성장과 새로운 개체가 태어나는 번식은 구분해요. 버섯은 같은 군집의 활동 상태를 나타내요.',payload:{developmentSequence:record.sequence}});
    }
    const notices=new Map();
    for(const record of state.population.history)if(!record.noted&&!organicPopulation.has(record.sequence)&&!['placement','reintroduction'].includes(record.cause))notices.set(`${record.cause}:${record.speciesId}`,record);
    for(const record of [...notices.values()].slice(-6)){
      const key=`population:${record.sequence}`;
      const natural=record.cause==='natural_lifespan'||record.cause==='life_stage_exit';
      candidates.set(key,{key,kind:'alert',sourceType:'environment',sourceId:'forest',title:natural?'숲의 세대가 이어져요':'숲의 개체 수가 달라졌어요',message:populationMessage(record),explanation:natural?'생물은 서로 다른 생애주기를 가져요. 세대교체는 안정적인 숲에서도 일어날 수 있어요. 먹이를 주어도 수명이 무한히 늘어나지는 않아요.':record.cause==='predation'?'포식으로 먹이를 얻은 소비자와 줄어든 먹이 생물을 함께 살펴보세요.':'먹이·환경·개체 수의 관계를 살펴보세요.',payload:{populationSequence:record.sequence,urgent:record.cause==='starvation'}});
    }
    hasConditions = candidates.size > 0 || slowSince.size > 0;
    const active = new Map(state.events.filter(event => event.status === 'active').map(event => [event.key,event]));
    for (const event of active.values()) {
      const candidate = candidates.get(event.key);
      if (!candidate) { close(event, 'resolved'); cooldowns.set(event.key,time+eventConfig.cooldownSeconds); active.delete(event.key); }
      else if (event.sourceId !== candidate.sourceId || event.sourceType !== candidate.sourceType) {
        event.sourceId = candidate.sourceId; event.sourceType = candidate.sourceType;
      }
      if(candidate){event.title=candidate.title;event.message=candidate.message;event.payload=candidate.payload;}
    }
    const ordered = [...candidates.values()].sort((a,b)=>eventPriority(b)-eventPriority(a));
    for (const candidate of ordered) {
      if (active.has(candidate.key) || time < (cooldowns.get(candidate.key) || 0)) continue;
      if(active.size>=eventConfig.maxActive){
        // Growth records remain pending; a full queue cannot hide a new meal or
        // urgent survival warning behind an optional growth notice.
        const optional=[...active.values()].filter(event=>(event.payload.developmentSequence||event.payload.environmentEventId||event.payload.organicOriginSequence)&&eventPriority(event)<eventPriority(candidate)).sort((a,b)=>eventPriority(a)-eventPriority(b))[0];
        if(!optional)continue;
        close(optional,'resolved');active.delete(optional.key);
      }
      const event = { ...candidate, eventId: `event-${++sequence}`, status: 'active', createdAt: time };
      state.events.push(event); active.set(event.key,event);
    }
    while (state.events.length > eventConfig.maxHistory) {
      const index = state.events.findIndex(event => event.status !== 'active');
      if (index < 0) break;
      state.events.splice(index,1);
    }
    for (const [key, deadline] of cooldowns) if (deadline <= time && !candidates.has(key)) cooldowns.delete(key);
    if(settleRewards)rewardResolvedManagement(state);
  }
  return {
    update(state, seconds, feedingEvents = []) {
      time += seconds; accumulated += seconds;
      for (const signal of feedingEvents) {
        const relation=relationFor(signal.foodSpeciesId,signal.consumerSpeciesId);
        if (relation && !pendingDiscoveries.has(relation.relationId) && !state.observations.some(item=>item.relationId===relation.relationId)) pendingDiscoveries.set(relation.relationId, signal);
      }
      if (accumulated + 1e-9 < eventConfig.tickSeconds) return false;
      accumulated %= eventConfig.tickSeconds; evaluate(state); return true;
    },
    refresh: evaluate,
    needsTick: () => hasConditions || pendingDiscoveries.size > 0,
    acknowledge(state, eventId, answerId) {
      const passiveOrganic=state.events.some(e=>e.eventId===eventId&&e.payload?.organicOriginSequence);
      evaluate(state,!passiveOrganic);
      const event = state.events.find(item => item.eventId === eventId && item.status === 'active');
      if (!event) return { ok:false, message:'상황이 달라졌어요. 다시 숲을 살펴봐요.' };
      if (event.kind === 'question') {
        const choice = event.payload.choices.find(item=>item.id===answerId);
        if (!choice?.correct) return { ok:false, message:growthInvestigation.retry };
        questionDone.add(event.key);
      }
      if (event.kind === 'insight' && event.payload.relationId && !state.observations.some(item=>item.relationId===event.payload.relationId)) {
        state.observations.push({ relationId: event.payload.relationId, eventId, discoveredAt: time });
        pendingDiscoveries.delete(event.payload.relationId);
      }
      if(event.payload.developmentSequence){
        const record=state.development.history.find(r=>r.sequence===event.payload.developmentSequence);
        if(record)for(const earlier of state.development.history)if(earlier.speciesId===record.speciesId&&earlier.stage===record.stage&&earlier.sequence<=record.sequence)earlier.noted=true;
      }
      if(event.payload.environmentEventId)chooseEnvironmentObservation(state,event.payload.environmentEventId);
      if(event.payload.populationSequence){const record=state.population.history.find(r=>r.sequence===event.payload.populationSequence);if(record)record.noted=true;}
      if(event.payload.organicOriginSequence)acknowledgeOrganicOrigin(state,event.payload.organicOriginSequence);
      close(event, event.kind === 'insight' ? 'resolved' : 'dismissed');
      cooldowns.set(event.key,time+eventConfig.cooldownSeconds);
      const reward = event.kind === 'insight' && event.payload.relationId ? grantReward(state,'observation',event.payload.relationId,eventId) : event.kind === 'question' ? grantReward(state,'question',`producer_${event.payload.factor}_limit`,eventId) : 0;
      return { ok:true, message:(event.payload.environmentEventId?'환경 변화 기록에 남겼어요!':event.payload.developmentSequence?'성장 기록에 남겼어요!':event.kind==='insight' ? '발견 기록에 남겼어요!' : '확인했어요. 숲의 변화를 계속 살펴봐요.') + (reward ? ` 생태계 포인트 ${reward}를 받았어요.` : '') };
    },
    exportMemory: () => ({sequence,cooldowns:[...cooldowns],questionDone:[...questionDone],pendingDiscoveries:[...pendingDiscoveries]}),
    getDiagnostics: () => ({ checks, time }),
  };
}
