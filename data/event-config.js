import {evidenceText} from './food-evidence.js';
import {foodRelations,foodPartLabels,foodRelationById} from './food-relations.js';
import {organismById} from './organisms.js';
import {feedingConfig} from './ecology-config.js';
import {mealSentence} from './student-text.js';

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
    title:`${consumer.name}의 먹이 발견: ${meal}${relation.evidenceLevel==='B'?' (단순화)':''}`,message:mealSentence(relation),
    explanation:`${evidenceText(relation.evidenceLevel)} 먹이 → 먹는 생물: ${food.name} → ${consumer.name}. ${relation.feedingMode==='resource'?'식물은 그대로 있고 '+foodPartLabels[relation.foodPart]+' 먹이가 줄었어요.':'동물 한 마리가 먹혀 숲의 개체 수가 줄었어요.'}`};
}
for(const speciesId of Object.keys(feedingConfig)){
  if(shortageEvents[speciesId])continue;
  const species=organismById[speciesId];
  const foods=foodRelations.filter(edge=>edge.targetSpeciesId===speciesId).map(edge=>organismById[edge.sourceSpeciesId].name);
  shortageEvents[speciesId]={title:`${species.name}가 먹이를 찾기 어려워해요`,message:'한동안 이용할 수 있는 먹이를 찾지 못했어요.',explanation:`${foods.length?'먹이는 '+foods.join('·')+'예요.':'먹이그물에서 먹는 것을 확인해요.'} 숲에 먹이가 있는지, 먹을 만큼 남았는지 살펴봐요. 먹이와의 거리도 중요해요.`};
}
// Core learning discoveries stay ahead of optional web discoveries, within the same cap.
export const eventPriority=event=>event.payload?.urgent?4:event.payload?.organicOriginSequence?0.5:event.payload?.environmentEventId?0.75:event.payload?.developmentSequence?1:eventConfig.priority[event.kind]+(event.kind==='insight'&&foodRelationById[event.payload.relationId]?.core ? 0.25 : 0);
export const growthInvestigation = {
  title: '왜 식물이 천천히 자랄까요?',
  message: '환경과 식물의 회복 사이에는 어떤 관계가 있을까요?',
  choices: [
    { id: 'environment', label: '비생물 환경이 나빠져서', correct: true },
    { id: 'cards', label: '카드를 많이 모아서', correct: false },
  ],
  retry: '카드 수보다 지금 햇빛·물·공기·토양 상태를 다시 살펴봐요.',
};
