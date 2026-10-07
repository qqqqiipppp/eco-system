export const stabilityConfig = {
  weights: { diversity: 0.2, composition: 0.2, food: 0.25, environment: 0.2, balance: 0.15 },
  diversityGoal: 4,
  roles: ['producer', 'consumer', 'decomposer'],
  consumerShare: { low: 0.2, high: 0.7 },
  dominanceThreshold: 0.65,
  minimumFoodPerConsumer: 0.5,
  declinePenalty: 0.5,
  historySeconds: 30,
  sampleSeconds: 5,
  labels: [{ minimum: 75, label: '안정적이에요' }, { minimum: 45, label: '살펴봐요' }, { minimum: 0, label: '돌봄이 필요해요' }],
};
