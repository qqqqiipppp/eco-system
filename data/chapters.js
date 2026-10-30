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
  // The shop: a caught 💡 earns points, cards cost points. Lower in the food
  // chain is cheaper. Offers are paced, so more animals never earn more.
  observationReward: 1,
  // Crises are announced before they start, like the original's alien warning.
  warningSeconds: 5,
  // Litter or smog from a human-made crisis: each piece left in the forest keeps
  // harming its factor until a student taps it away.
  trashInterval: 4,
  trashMax: 5,
  trashDamage: .006,
  trashFloor: .15,
  trashReward: 1,
  // Every crisis starts and ends inside the stage (about 1 minute), and is
  // judged by how long the stars stalled while it lasted.
  // Decomposers work this much faster in chapter mode, so their effect on the
  // litter pile is visible within a stage (the regular forest is unchanged).
  decompositionBoost: 3,
  crisisSeconds: 30,
  crisisRecoverySeconds: 20,
  // Cloud or drought: food plants grow back this much slower (less light or
  // water for photosynthesis), so an unprepared forest runs out of food.
  crisisFoodRecovery: .1,
  crisisStrongMaxStall: 5,
  crisisStrongReward: 5,
  // The prepare window pauses the forest: without a choice it goes on with "wait".
  prepareAutoSeconds: 20,
  crisisTiredMinStall: 20,
  prices: {grass: 3, raspberry: 3, oak: 6, hazel: 6, grasshopper: 4, earthworm: 4, aphid: 5, rabbit: 6, chipmunk: 6, mushroom: 5, 'litter-mold': 5, frog: 8, bulbul: 8, snake: 10, weasel: 10, goshawk: 12},
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
      goal: '강아지풀을 먹는 방아깨비를 놓고, 먹이와 먹는 동물이 균형을 이루게 해 숲 별 3개를 모아요.',
      inventory: ['grass', 'grasshopper'], requiredSpecies: {grasshopper: 1},
      organisms: [['grass', .38], ['grass', .52]]},
    {stageId: '1-2', title: '북적이는 풀밭', points: 12,
      goal: '방아깨비가 너무 많아 강아지풀이 모자라요. 균형을 되찾아 숲 별 3개를 모아요.',
      inventory: ['grass', 'grasshopper'], requiredSpecies: {grasshopper: 1},
      organisms: [['grass', .46], ['grasshopper', .3], ['grasshopper', .38], ['grasshopper', .5], ['grasshopper', .58], ['grasshopper', .64]]},
    {stageId: '1-3', title: '풀을 나눠 먹는 이웃', points: 12,
      goal: '멧토끼도 강아지풀을 먹어요. 방아깨비가 두 마리가 되어 번식하고, 멧토끼와 함께 먹고 살 수 있게 해요.',
      inventory: ['grass', 'grasshopper', 'rabbit'], requiredSpecies: {grasshopper: 1, rabbit: 1}, birthRequired: 'grasshopper',
      organisms: [['grass', .34], ['grass', .52], ['grasshopper', .44]]},
  ]},
  {chapterId: 'pond', number: 2, title: '물가', events: ['drought', 'cloudy'], seedSeconds: 60, newSpecies: ['frog', 'hazel', 'aphid'],
    intro: '방아깨비를 먹는 참개구리가 와서 먹이사슬이 한 단계 길어지고, 물가의 팽나무에는 청동풍뎅이가 살아요.', stages: [
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
    {stageId: '2-4', title: '팽나무의 청동풍뎅이', points: 15,
      goal: '청동풍뎅이는 팽나무 잎을 먹어요. 두 마리가 건강하게 지내 흙 속에 알을 낳고, 새 어른벌레가 나오게 해요.',
      inventory: ['grass', 'grasshopper', 'hazel', 'aphid'], requiredSpecies: {grasshopper: 1, aphid: 1}, birthRequired: 'aphid',
      organisms: [['hazel', .3], ['hazel', .62], ['grass', .44], ['grass', .76], ['grasshopper', .5], ['aphid', .34]]},
  ]},
  {chapterId: 'understory', number: 3, title: '나무 아래', events: ['soil-damage', 'drought'], seedSeconds: 70, newSpecies: ['oak', 'mushroom', 'litter-mold', 'earthworm', 'chipmunk', 'raspberry', 'bulbul'],
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
      goal: '다람쥐는 상수리나무의 도토리를 먹어요. 이번 숲에는 분해자가 없어요. 분해자를 놓고, 다람쥐 두 마리가 둥지에서 새끼를 낳게 해요.',
      inventory: ['oak', 'grass', 'grasshopper', 'chipmunk', 'mushroom', 'litter-mold', 'earthworm'], requiredSpecies: {grasshopper: 1, chipmunk: 2}, needsDecomposition: true, birthRequired: 'chipmunk',
      organisms: [['oak', .2], ['grass', .36], ['grass', .5], ['grasshopper', .44]]},
    {stageId: '3-4', title: '직박구리 둥지', points: 15,
      goal: '직박구리는 산딸기와 팽나무 열매를 먹어요. 두 마리가 둥지에 알을 낳아 새끼 새가 깨어나게 해요.',
      inventory: ['raspberry', 'hazel', 'grass', 'grasshopper', 'bulbul', 'mushroom', 'litter-mold'], requiredSpecies: {grasshopper: 1, bulbul: 1}, needsDecomposition: true, birthRequired: 'bulbul',
      organisms: [['oak', .2], ['raspberry', .36], ['raspberry', .5], ['hazel', .7], ['grass', .44], ['grasshopper', .4], ['bulbul', .56], ['litter-mold', .82]]},
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
      goal: '참매는 멧토끼와 다람쥐를 먹어요. 참매에게 먹혀도 멧토끼가 번식으로 이어지게 해서 먹이그물을 지켜요.',
      inventory: ['oak', 'grass', 'grasshopper', 'rabbit', 'chipmunk', 'frog', 'mushroom', 'litter-mold', 'goshawk'], requiredSpecies: {grasshopper: 2, rabbit: 1, goshawk: 1}, needsDecomposition: true, birthRequired: 'rabbit',
      organisms: [['oak', .2], ['oak', .72], ['grass', .3], ['grass', .42], ['grass', .54], ['grass', .64], ['grasshopper', .36], ['grasshopper', .5], ['rabbit', .46], ['litter-mold', .6]]},
  ]},
];

// Natural crises cannot be fixed, only prepared for: the student chooses how
// before it comes and sees the outcome. Human-made ones are where people can act: tap away what they leave and
// use a conservation action ([4과14-03]).
export const crises = {
  cloudy: {human: false, factor: 'sunlight', notice: '곧 흐린 날씨가 와요!',
    effect: '햇빛이 줄면 식물이 광합성을 거의 못 해서, 먹힌 잎과 열매가 다시 자라지 않아요. 먹이가 모자라면 숲 별이 멈춰요.'},
  drought: {human: false, factor: 'water', notice: '곧 가뭄이 와요!',
    effect: '물이 줄면 식물이 거의 자라지 못해서, 먹힌 잎과 열매가 다시 자라지 않아요. 먹이가 모자라면 숲 별이 멈춰요.'},
  'soil-damage': {human: true, factor: 'soil', notice: '사람들이 숲에 쓰레기를 버리고 있어요!', item: '쓰레기', icon: '🥤',
    status: '사람이 버린 쓰레기와 발길로 흙이 망가지고 있어요. 쓰레기를 눌러 치워요.',
    care: '숲 바닥 되살리기'},
  'air-pollution': {human: true, factor: 'air', notice: '자동차와 공장의 매연이 숲으로 날아와요!', item: '매연', icon: '💨',
    status: '자동차와 공장의 매연으로 공기가 나빠졌어요. 매연을 눌러 걷어 내요.',
    care: '매연 줄이기 캠페인'},
};
// Breeding in chapter stages: two of the same species, both fed and well for
// healthySeconds, then a young one after waitSeconds. Same-species pairs, no
// sexes (a simplification). Game times are far shorter than real life cycles.
export const breeding = {
  youngSeconds: 30,
  maximum: 6,
  species: {
    grasshopper: {healthySeconds: 40, waitSeconds: 20, sign: '알', young: '약충', cycle: '알 → 약충 → 어른벌레 (번데기가 없는 불완전탈바꿈)'},
    aphid: {healthySeconds: 45, waitSeconds: 25, sign: '흙 속 알', young: '갓 나온 어른벌레', cycle: '알 → 애벌레 → 번데기 → 어른벌레 (완전탈바꿈). 애벌레와 번데기는 흙 속에서 자라요.'},
    chipmunk: {healthySeconds: 50, waitSeconds: 25, sign: '둥지', young: '새끼', cycle: '둥지에서 새끼가 태어나 젖을 먹고 자라요.'},
    bulbul: {healthySeconds: 50, waitSeconds: 25, sign: '둥지 속 알', young: '새끼 새', cycle: '둥지에 알을 낳고 품으면 새끼 새가 깨어나요.'},
    rabbit: {healthySeconds: 50, waitSeconds: 25, sign: '곧 태어나요', soon: true, young: '새끼', cycle: '털이 나고 눈을 뜬 새끼가 태어나 금방 풀을 먹어요.'},
  },
};

export const crisisForFactor = factor => Object.values(crises).find(c => c.factor === factor);

export const stages = chapters.flatMap(chapter => chapter.stages.map(stage => ({...stage, chapter, events: chapter.events, seedSeconds: chapter.seedSeconds})));
export const stageById = Object.fromEntries(stages.map(stage => [stage.stageId, stage]));
