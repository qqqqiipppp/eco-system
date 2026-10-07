export const environmentFactors = {
  sunlight: { name: '햇빛' }, water: { name: '물' },
  air: { name: '공기' }, soil: { name: '토양' },
};
export const environmentLevels = {
  good: { value: 1, label: '좋음' }, normal: { value: 0.6, label: '보통' }, bad: { value: 0.15, label: '나쁨' },
};
// Game tuning, not biological measurements. Add future factors only with rules.
export const producerGrowth = {
  oak: { weights: { sunlight: 0.3, water: 0.2, air: 0.05, soil: 0.45 } },
  grass: { weights: { sunlight: 0.35, water: 0.35, air: 0.1, soil: 0.2 } },
};
export const growthConfig = { recoveryPerSecond: 0.015, declinePerSecond: 0.025, minimumGrowth: 0.15 };
export const activityConfig = { minimum: 0.4, airWeight: 0.6 };
