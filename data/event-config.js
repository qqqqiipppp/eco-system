import {evidenceText} from './food-evidence.js';
import {foodRelations,foodPartLabels,foodRelationById} from './food-relations.js';
import {organismById} from './organisms.js';
import {feedingConfig} from './ecology-config.js';

export const eventConfig = {
  tickSeconds: 1, shortageSeconds: 8, slowGrowthSeconds: 3,
  growthThreshold: 0.8, cooldownSeconds: 30,
  maxVisible: 4, maxActive: 36, maxHistory: 60,
  priority: { insight: 3, alert: 2, question: 1 },
};
export const shortageEvents = {};
export const discoveryEvents = {};
for(const relation of foodRelations){

  const food=organismById[relation.sourceSpeciesId],consumer=organismById[relation.targetSpeciesId];
  const meal=relation.feedingMode==='resource'?`${food.name}의 ${foodPartLabels[relation.foodPart]}`:food.name;
  discoveryEvents[relation.relationId]={foodSpeciesId:food.id,consumerSpeciesId:consumer.id,
    title:`${consumer.name}의 먹이 발견: ${meal}${relation.evidenceLevel==='B'?' (단순화)':''}`,message:`방금 ${consumer.name}가 ${meal}에서 먹이를 얻었어요.`,
    explanation:`${evidenceText(relation.evidenceLevel)} 먹히는 쪽 → 먹는 쪽: ${food.name} → ${consumer.name}. ${relation.feedingMode==='resource'?'식물은 그대로 있고 '+foodPartLabels[relation.foodPart]+' 먹이 자원이 줄었어요.':'포식으로 먹힌 동물 한 마리가 자연으로 돌아갔어요. 실제 개체 수가 줄었어요.'}`};
}
for(const speciesId of Object.keys(feedingConfig)){
  if(shortageEvents[speciesId])continue;
  const species=organismById[speciesId];
  const foods=foodRelations.filter(edge=>edge.targetSpeciesId===speciesId).map(edge=>organismById[edge.sourceSpeciesId].name);
  shortageEvents[speciesId]={title:`${species.name}가 먹이를 찾기 어려워해요`,message:'한동안 이용할 수 있는 먹이를 찾지 못했어요.',explanation:`${foods.length?'먹이 후보는 '+foods.join('·')+'예요.':'이번 23종 안에서 먹이 관계를 더 확인하고 있어요. 정식 해금 전에는 개발 검사에서만 사용해요.'} 실제 존재, 남은 자원과 거리도 살펴봐요. 다른 먹이가 있어도 먹이 관계와 접근 조건을 갖춰야 해요.`};
}
// Core learning discoveries stay ahead of optional web discoveries, within the same cap.
export const eventPriority=event=>event.payload?.urgent?4:eventConfig.priority[event.kind]+(event.kind==='insight'&&foodRelationById[event.payload.relationId]?.core ? 0.25 : 0);
export const growthInvestigation = {
  title: '왜 식물이 천천히 자랄까요?',
  message: '환경과 식물의 회복 사이에는 어떤 관계가 있을까요?',
  choices: [
    { id: 'environment', label: '비생물 환경이 나빠져서', correct: true },
    { id: 'cards', label: '카드를 많이 모아서', correct: false },
  ],
  retry: '카드 수보다 지금 햇빛·물·공기·토양 상태를 다시 살펴봐요.',
};
