// Chapter mode (Insaniquarium-style stages). Teaching-game values, not measurements.
// A stage is cleared by keeping a balanced forest long enough to grow 3 seeds.
// Active game seconds, like the rest of the ecology. No timer or forced duration.
export const stageConfig = {
  seedsToClear: 3,
  recentMealSeconds: 20,
  hungrySeconds: 20,
  // Shown on the animal before it stalls seeds, like a fish changing colour.
  hungryNoticeSeconds: 8,
  minimumFoodRatio: .3,
  minimumEnvironment: .4,
  // At most one observation every 6 s however many animals eat, so more
  // animals never means more seeds (the original's "more fish, more coins").
  observationInterval: 6,
  observationLifetime: 8,
  observationBonusSeconds: 2,
};

// Each chapter adds one food-chain step and one environment event, like a new
// tank in the original. events[i] starts when seed i+1 grows: from chapter 2 the
// previous chapter's crisis returns, and later chapters hold balance longer
// (seedSeconds), which is what top predators need. Stages: [species, x] start the forest; requiredSpecies
// gives the fewest of each animal the forest needs, more lower in the chain, so
// a predator that eats its prey down stalls the seeds; needsDecomposition stalls seeds while no
// decomposer (or earthworm) is actually breaking down dead matter.
export const chapters = [
  {chapterId: 'meadow', number: 1, title: '풀밭', events: ['cloudy'], seedSeconds: 50, newSpecies: ['grass', 'grasshopper', 'rabbit'],
    intro: '생산자인 강아지풀과 그것을 먹는 동물을 만나요.', stages: [
    {stageId: '1-1', title: '풀밭의 시작', points: 12,
      goal: '강아지풀을 먹는 방아깨비를 놓고, 먹이와 먹는 동물이 균형을 이루게 해 씨앗 3개를 모아요.',
      inventory: ['grass', 'grasshopper'], requiredSpecies: {grasshopper: 1},
      organisms: [['grass', .38], ['grass', .52]]},
    {stageId: '1-2', title: '북적이는 풀밭', points: 12,
      goal: '방아깨비가 너무 많아 강아지풀이 모자라요. 균형을 되찾아 씨앗 3개를 모아요.',
      inventory: ['grass', 'grasshopper'], requiredSpecies: {grasshopper: 1},
      organisms: [['grass', .46], ['grasshopper', .3], ['grasshopper', .38], ['grasshopper', .5], ['grasshopper', .58], ['grasshopper', .64]]},
    {stageId: '1-3', title: '풀을 나눠 먹는 이웃', points: 12,
      goal: '멧토끼도 강아지풀을 먹어요. 방아깨비와 멧토끼가 함께 먹고 살 수 있게 해요.',
      inventory: ['grass', 'grasshopper', 'rabbit'], requiredSpecies: {grasshopper: 1, rabbit: 1},
      organisms: [['grass', .34], ['grass', .52], ['grasshopper', .38], ['grasshopper', .5]]},
  ]},
  {chapterId: 'pond', number: 2, title: '물가', events: ['drought', 'cloudy'], seedSeconds: 60, newSpecies: ['frog'],
    intro: '방아깨비를 먹는 참개구리가 와서 먹이사슬이 한 단계 길어져요.', stages: [
    {stageId: '2-1', title: '개구리가 왔어요', points: 15,
      goal: '참개구리를 놓아 강아지풀 → 방아깨비 → 참개구리로 이어지는 숲을 만들어요.',
      inventory: ['grass', 'grasshopper', 'frog'], requiredSpecies: {grasshopper: 2, frog: 1},
      organisms: [['grass', .28], ['grass', .4], ['grass', .54], ['grasshopper', .34], ['grasshopper', .46], ['grasshopper', .6]]},
    {stageId: '2-2', title: '배고픈 개구리들', points: 15,
      goal: '참개구리가 많아 방아깨비가 금방 줄어요. 먹이사슬 전체의 균형을 맞춰요.',
      inventory: ['grass', 'grasshopper', 'frog'], requiredSpecies: {grasshopper: 2, frog: 1},
      organisms: [['grass', .3], ['grass', .44], ['grass', .58], ['grasshopper', .36], ['grasshopper', .48], ['grasshopper', .6], ['frog', .3], ['frog', .46], ['frog', .62]]},
    {stageId: '2-3', title: '마른 물가', points: 18,
      goal: '물이 부족한 물가예요. 가뭄이 와도 먹이사슬이 끊기지 않게 돌봐요.',
      inventory: ['grass', 'grasshopper', 'frog'], requiredSpecies: {grasshopper: 2, frog: 1},
      environment: {water: .6},
      organisms: [['grass', .3], ['grass', .44], ['grass', .58], ['grasshopper', .38], ['grasshopper', .54], ['frog', .46]]},
  ]},
  {chapterId: 'understory', number: 3, title: '나무 아래', events: ['soil-damage', 'drought'], seedSeconds: 70, newSpecies: ['oak', 'mushroom', 'litter-mold', 'earthworm', 'chipmunk'],
    intro: '낙엽과 쓰러진 나무를 분해하는 생물이 흙으로 양분을 돌려보내요.', stages: [
    {stageId: '3-1', title: '쌓이는 낙엽', points: 15,
      goal: '낙엽과 죽은 나무가 쌓이고 있어요. 분해자를 놓아 숲 바닥을 순환시켜요.',
      inventory: ['grass', 'grasshopper', 'mushroom', 'litter-mold'], requiredSpecies: {grasshopper: 1}, needsDecomposition: true,
      organisms: [['oak', .2], ['oak', .7], ['grass', .36], ['grass', .5], ['grasshopper', .42], ['grasshopper', .56]]},
    {stageId: '3-2', title: '흙을 만드는 지렁이', points: 15,
      goal: '참지렁이는 낙엽을 먹고 흙을 기름지게 해요. 지렁이와 분해자가 함께 사는 숲을 만들어요.',
      inventory: ['grass', 'grasshopper', 'mushroom', 'litter-mold', 'earthworm'], requiredSpecies: {grasshopper: 1, earthworm: 1}, needsDecomposition: true,
      environment: {soil: .5},
      organisms: [['oak', .2], ['oak', .7], ['grass', .36], ['grass', .5], ['grasshopper', .44], ['mushroom', .26]]},
    {stageId: '3-3', title: '도토리를 모으는 다람쥐', points: 15,
      goal: '다람쥐는 상수리나무의 도토리를 먹어요. 이번 숲에는 분해자가 없어요. 생산자, 소비자, 분해자가 모두 제 역할을 하게 해요.',
      inventory: ['oak', 'grass', 'grasshopper', 'chipmunk', 'mushroom', 'litter-mold', 'earthworm'], requiredSpecies: {grasshopper: 1, chipmunk: 2}, needsDecomposition: true,
      organisms: [['oak', .2], ['grass', .36], ['grass', .5], ['grasshopper', .44]]},
  ]},
  {chapterId: 'deep-forest', number: 4, title: '큰 숲', events: ['air-pollution', 'soil-damage'], seedSeconds: 80, newSpecies: ['snake', 'weasel', 'goshawk'],
    intro: '먹이사슬의 꼭대기에 있는 동물은 아래 단계가 모두 건강해야 살 수 있어요.', stages: [
    {stageId: '4-1', title: '개구리를 먹는 뱀', points: 18,
      goal: '유혈목이는 참개구리를 먹어요. 네 단계로 이어지는 먹이사슬을 지켜요.',
      inventory: ['grass', 'grasshopper', 'frog', 'snake'], requiredSpecies: {grasshopper: 2, frog: 2, snake: 1},
      organisms: [['grass', .26], ['grass', .38], ['grass', .5], ['grass', .62], ['grasshopper', .32], ['grasshopper', .46], ['grasshopper', .58], ['frog', .4], ['frog', .54]]},
    {stageId: '4-2', title: '여러 먹이를 먹는 족제비', points: 18,
      goal: '족제비는 방아깨비, 참개구리, 다람쥐, 지렁이를 먹어요. 여러 먹이가 있는 숲을 만들어요.',
      inventory: ['oak', 'grass', 'grasshopper', 'frog', 'chipmunk', 'earthworm', 'mushroom', 'litter-mold', 'weasel'], requiredSpecies: {grasshopper: 2, frog: 1, weasel: 1}, needsDecomposition: true,
      organisms: [['oak', .2], ['oak', .72], ['grass', .32], ['grass', .44], ['grass', .58], ['grasshopper', .38], ['grasshopper', .52], ['frog', .46], ['litter-mold', .64]]},
    {stageId: '4-3', title: '숲의 꼭대기, 참매', points: 20,
      goal: '참매는 멧토끼와 다람쥐를 먹어요. 먹이그물 전체가 건강해야 참매도 살 수 있어요.',
      inventory: ['oak', 'grass', 'grasshopper', 'rabbit', 'chipmunk', 'frog', 'mushroom', 'litter-mold', 'goshawk'], requiredSpecies: {grasshopper: 2, rabbit: 1, goshawk: 1}, needsDecomposition: true,
      organisms: [['oak', .2], ['oak', .72], ['grass', .3], ['grass', .42], ['grass', .54], ['grass', .64], ['grasshopper', .36], ['grasshopper', .5], ['rabbit', .46], ['litter-mold', .6]]},
  ]},
];

export const stages = chapters.flatMap(chapter => chapter.stages.map(stage => ({...stage, chapter, events: chapter.events, seedSeconds: chapter.seedSeconds})));
export const stageById = Object.fromEntries(stages.map(stage => [stage.stageId, stage]));
