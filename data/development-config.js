// Active GAME seconds. Biological evidence and omissions: FOREST_GROWTH_STAGES.md.
export const developmentConfig = { historyLimit:60, noticeLimit:6, minimumEnvironment:.4, woodThreshold:.05 };
export const developmentRules = {
  grass: {model:'individual',cycle:'씨앗 → 새싹 → 자란 강아지풀 → 씨앗 형성',description:'새싹은 햇빛·물·공기·흙을 이용해 자라요. 한해살이풀이 새로운 씨앗 세대를 남겨요.',maxSeconds:300,maturitySeconds:180,breedingSeconds:300,pendingSeconds:60,
    stages:[{id:'sprout',label:'새싹',at:0,capacity:.4},{id:'grown',label:'자란 강아지풀',at:180,capacity:1},{id:'seeding',label:'씨앗 형성',at:300,capacity:1}]},
  grasshopper: {model:'individual',cycle:'알 → 약충 → 성체',description:'번데기 없이 약충에서 성체로 자라요. 약충은 잎을 먹고 자라지만 아직 번식하지 않아요.',maxSeconds:180,maturitySeconds:180,breedingSeconds:180,pendingSeconds:60,
    stages:[{id:'nymph',label:'약충',at:0,activity:.65},{id:'adult',label:'성체',at:180,activity:1}]},
  rabbit: {model:'individual',cycle:'새끼 → 어린 멧토끼 → 성체',description:'산토끼류의 새끼는 털과 열린 눈을 가진 채 태어나요. 초기 젖먹는 생활은 짧은 적응 기간으로 생략하고, 어린 개체는 풀을 먹으며 자라요.',maxSeconds:360,maturitySeconds:360,breedingSeconds:360,
    stages:[{id:'baby',label:'새끼',at:0,activity:.35},{id:'juvenile',label:'어린 멧토끼',at:90,activity:.7},{id:'adult',label:'성체',at:360,activity:1}]},
  frog: {model:'learning',cycle:'알 → 올챙이 → 어린 개구리 → 성체',description:'알과 올챙이는 물속 서식지가 필요해요. 숲의 물 상태는 연못이 아니에요. 현재 게임에서는 성체의 생활을 실제로 관찰해요.',stages:[{id:'adult',label:'성체',at:0}]},
  mushroom: {model:'colony',cycle:'포자 발아 → 균사체 성장 → 자실체 형성 → 포자 생성·방출',description:'균사체가 죽은 나무를 분해하고 자실체는 포자를 만드는 구조예요. 한 군집의 변화이며 새로운 군집이 자동으로 늘어나지 않아요.',maxSeconds:300,
    stages:[{id:'mycelium',label:'균사체 활동',at:0},{id:'fruiting',label:'자실체 형성',at:180},{id:'spore-ready',label:'포자 형성 상태',at:300}]},
};
