// Chapter mode (Insaniquarium-style stages). Teaching-game values, not measurements.
// A stage is cleared by keeping a balanced forest long enough to grow 3 seeds.
// Active game seconds, like the rest of the ecology. No timer or forced duration.
export const stageConfig = {
  seedsToClear: 3,
  seedSeconds: 50,
  recentMealSeconds: 20,
  minimumFoodRatio: .3,
  minimumEnvironment: .4,
  eventAfterSeeds: 1,
  // At most one observation every 6 s however many animals eat, so more
  // animals never means more seeds (the original's "more fish, more coins").
  observationInterval: 6,
  observationLifetime: 8,
  observationBonusSeconds: 2,
};

export const chapters = [
  {chapterId: 'meadow', number: 1, title: '풀밭', stages: [
    {stageId: '1-1', title: '풀밭의 시작', event: 'cloudy', points: 12,
      goal: '강아지풀을 먹는 방아깨비를 놓고, 먹이와 먹는 동물이 균형을 이루게 해 씨앗 3개를 모아요.',
      inventory: ['grass', 'grasshopper'],
      organisms: [['grass', .38], ['grass', .52]]},
    {stageId: '1-2', title: '북적이는 풀밭', event: 'cloudy', points: 12,
      goal: '방아깨비가 너무 많아 강아지풀이 모자라요. 균형을 되찾아 씨앗 3개를 모아요.',
      inventory: ['grass', 'grasshopper'],
      organisms: [['grass', .46], ['grasshopper', .3], ['grasshopper', .38], ['grasshopper', .5], ['grasshopper', .58], ['grasshopper', .64]]},
  ]},
];

export const stages = chapters.flatMap(chapter => chapter.stages.map(stage => ({...stage, chapter})));
export const stageById = Object.fromEntries(stages.map(stage => [stage.stageId, stage]));
