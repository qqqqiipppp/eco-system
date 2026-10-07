// Costs, effects and cooldowns use active simulation seconds, never wall time.
export const managementActions = [
  { actionId:'water-care', name:'물 환경 개선', description:'물을 한 단계 개선해요. 식물의 회복은 시간이 지나 나타나요.', cost:6, applicableTo:'water', effectType:'environment-step', effect:{factor:'water'}, duration:0, cooldown:8 },
  { actionId:'soil-care', name:'토양 돌보기', description:'토양을 한 단계 개선해요. 뿌리와 식물의 회복을 지켜봐요.', cost:6, applicableTo:'soil', effectType:'environment-step', effect:{factor:'soil'}, duration:0, cooldown:8 },
  { actionId:'food-support', name:'임시 먹이 지원', description:'이 생물의 배고픔을 잠시 덜어줘요. 원래 먹이가 없으면 다시 배고파져요.', cost:5, applicableTo:'consumer-shortage', effectType:'hunger-relief', effect:{relief:0.65}, duration:0, cooldown:45 },
  { actionId:'habitat-care', name:'서식지 회복', description:'한동안 식물의 성장·먹이 회복을 조금 도와요. 동물의 배고픔을 바로 해결하지는 않아요.', cost:8, applicableTo:'producer-environment', effectType:'producer-recovery', effect:{multiplier:1.35}, duration:60, cooldown:75 },
];
export const rewardConfig = { observation:12, question:10, management:3 };
