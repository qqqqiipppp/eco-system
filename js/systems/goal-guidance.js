import {replayNextAction,nextCardExploration} from './learning-guidance.js';
import {forestGoal} from '../../data/forest-goal.js';
import {evaluateForestGoal} from './forest-progress.js';
import {environmentFactors} from '../../data/environment-config.js';
import {factorValue} from './environment.js';
import {organismById} from '../../data/organisms.js';
import {activityById,activityForSpecies} from '../../data/activities.js';
import {managementActions} from '../../data/management-actions.js';
import {discoveryEvents,eventConfig} from '../../data/event-config.js';
import {survivalStage,validateIntroduction} from './population.js';
import {placementConfig} from '../../data/interaction-config.js';
import {pointGuidance} from './point-economy.js';

const relationNames={v2_grass_to_grasshopper:'강아지풀 → 방아깨비',v2_grasshopper_to_frog:'방아깨비 → 참개구리'};
export function goalPresentation(state) {
 const evaluation=evaluateForestGoal(state);
 if(state.round?.number>1){const groups=evaluation.checks.map(c=>({id:c.id,ok:c.ok,title:c.label,detail:c.ok?'이 숲에서 확인했어요.':'지금 숲을 관찰하고 환경과 생물 구성을 살펴봐요.'}));groups.push({id:'hold',ok:state.forestProgress.cleared,title:'안정 상태 30초 유지',detail:Math.floor(state.forestProgress.stableSeconds)+'/30초'});return {ready:evaluation.ready,groups,achieved:groups.filter(g=>g.ok).length,total:groups.length};}
 const check=id=>evaluation.checks.find(item=>item.id===id).ok;
 const missingRelations=forestGoal.requiredObservations.filter(id=>!state.observations.some(item=>item.relationId===id));
 const missingActivities=forestGoal.requiredActivities.filter(id=>!state.activities.some(item=>item.activityId===id&&item.completed));
 const missingSpecies=forestGoal.requiredSpecies.filter(id=>!state.organisms.some(item=>item.speciesId===id));
 const poorFactors=Object.keys(environmentFactors).filter(key=>factorValue(state.environment,key)<forestGoal.minimumEnvironment);
 const score=Number.isFinite(state.metrics.stability)?state.metrics.stability:'계산 중';
 const hold=state.forestProgress;
 const groups=[
  {id:'observations',ok:check('observations'),title:`먹이 관계 ${forestGoal.requiredObservations.length}개 발견하기 — ${forestGoal.requiredObservations.length-missingRelations.length}/${forestGoal.requiredObservations.length}`,detail:missingRelations.length?`${missingRelations.map(id=>relationNames[id]||discoveryEvents[id].title).join(', ')} 발견 기록이 아직 없어요.`:'두 먹이 관계를 발견 기록에 남겼어요.'},
  {id:'activities',ok:check('activities'),title:`필수 생태 학습 완료하기 — ${forestGoal.requiredActivities.length-missingActivities.length}/${forestGoal.requiredActivities.length}`,detail:missingActivities.length?`${missingActivities.map(id=>activityById[id].title).join(', ')} 활동이 남아 있어요.`:'핵심 학습 활동을 모두 완료했어요.'},
  {id:'structure',ok:check('structure'),title:'강아지풀·방아깨비·참개구리가 함께 살게 하기',detail:missingSpecies.length?missingSpecies.map(id=>`${organismById[id].name}가 없어요.${state.inventory.some(card=>card.speciesId===id&&!card.acquired)?' 잠긴 카드를 눌러 '+activityForSpecies[id].unlockHint+'.':''}`).join(' '):'세 생물이 지금 숲에 함께 있어요.'},
  {id:'environment',ok:check('environment'),title:'환경을 보통 이상으로 유지하기',detail:poorFactors.length?`${poorFactors.map(key=>environmentFactors[key].name).join('·')} 상태가 나빠요. 환경을 살펴보고 관리 방법을 확인해요.`:'햇빛·물·공기·토양이 모두 보통 이상이에요.'},
  {id:'stability',ok:check('stability'),title:`생태계 안정도 ${forestGoal.minimumStability} 이상 만들기 — 현재 ${score}`,detail:check('stability')?'현재 안정도 기준을 갖췄어요.':state.metrics.stabilitySummary?.hint||'숲의 실제 상태를 살펴봐요.'},
  {id:'hold',ok:hold.cleared,title:`최종 안정 상태 ${forestGoal.stableSeconds}초 유지하기`,detail:hold.cleared?'숲 목표를 달성한 기록이 있어요.':evaluation.ready?`진행 중 — ${Math.floor(hold.stableSeconds)}/${forestGoal.stableSeconds}초. 생물과 환경을 계속 살펴봐요.`:'다른 조건을 모두 갖추면 시작돼요. 조건이 깨지면 처음부터 다시 유지해요.'},
 ];
 return {ready:evaluation.ready,groups,achieved:groups.filter(item=>item.ok).length,total:groups.length};
}

export function nextAction(state) {
 if(state.round?.number>1)return replayNextAction(state);
 const has=id=>state.organisms.some(item=>item.speciesId===id);
 const observed=id=>state.observations.some(item=>item.relationId===id);
 const acquired=id=>state.inventory.some(item=>item.speciesId===id&&item.acquired);
 const completed=id=>state.activities.some(item=>item.activityId===id&&item.completed);
 const poor=Object.keys(environmentFactors).filter(key=>factorValue(state.environment,key)<forestGoal.minimumEnvironment);
 const weak=state.organisms.find(o=>survivalStage(o)==='weak');
 if(weak)return `${organismById[weak.speciesId].name}가 쇠약해졌어요. !에서 먹이와 회복 방법을 살펴보세요.`;
 const pending=state.events.find(item=>item.kind==='insight'&&item.status==='active'&&item.payload.relationId&&!observed(item.payload.relationId));
 if(pending)return '💡를 눌러 실제로 본 먹이 관계를 발견 기록에 남겨 주세요.';
 const missingCore=forestGoal.requiredSpecies.find(id=>!has(id)&&acquired(id));
 if(missingCore){
  if(state.organisms.length>=placementConfig.maxOrganisms)return '생물 상태에서 서식 공간을 마련한 뒤 필요한 생물을 다시 들여요.';
  const introduction=validateIntroduction(state,missingCore);if(!introduction.ok)return introduction.message;
 }
 if(state.forestProgress.cleared&&!poor.length)return '숲 목표를 달성했어요! '+(state.environmentEvents.history.length?'도감과 먹이그물에서 다음 탐구를 골라 봐요.':'아직 환경 변화를 만나지 않았다면 지금 숲을 계속 살펴봐도 좋아요.');
 if(!has('grass'))return '강아지풀 카드를 고르고 숲에 놓아 주세요. 풀은 방아깨비의 먹이가 돼요.';
 if(!has('grasshopper'))return '방아깨비 카드를 고르고 강아지풀 가까이에 놓아 주세요.';
 if(poor.length){
  const cost=Math.min(...poor.map(key=>managementActions.find(action=>action.applicableTo===key)?.cost||managementActions.find(action=>action.actionId==='habitat-care').cost));
  if(state.metrics.points<cost)return pointGuidance(state);
  if(poor.some(key=>key==='sunlight'||key==='air'))return `${poor.map(key=>environmentFactors[key].name).join('·')} 상태를 환경 패널에서 살펴봐요. 서식지 회복은 포인트가 필요한 관리 행동이에요.`;
  return `${poor.map(key=>environmentFactors[key].name).join('·')} 상태가 나빠요. !에서 원인을 보고 포인트로 환경을 돌봐요.`;
 }
 if(!observed('v2_grass_to_grasshopper'))return '방아깨비가 강아지풀을 먹는 모습을 관찰해요. 💡가 나타나면 발견 기록하기를 눌러요.';
 if(!acquired('frog'))return '잠긴 참개구리 카드를 눌러 관찰 활동을 완료해요. 참개구리를 배치할 수 있게 돼요.';
 if(!has('frog'))return '참개구리 카드를 고르고 방아깨비 가까이에 놓아 주세요.';
 if(!observed('v2_grasshopper_to_frog'))return '참개구리가 방아깨비를 먹는 모습을 관찰하고 💡에서 기록해요.';
 const activity=forestGoal.requiredActivities.find(id=>!completed(id));
 if(activity)return `배움에서 ${activityById[activity].title} 활동을 완료해 주세요.`;
 const hungry=state.organisms.find(item=>item.hunger>=.6&&item.foodShortageDuration>=eventConfig.shortageSeconds);
 if(hungry)return `${organismById[hungry.speciesId].name}가 먹이를 찾기 어려워해요. !를 눌러 먹이량과 거리를 살펴봐요.`;
 if(evaluateForestGoal(state).ready)return `필수 조건을 갖췄어요! ${forestGoal.stableSeconds}초 동안 안정 상태를 유지해 봐요.`+(nextCardExploration(state)?' '+nextCardExploration(state).text:'');
 return state.metrics.stabilitySummary?.hint||'목표 자세히 보기에서 지금 부족한 조건을 살펴봐요.';
}
