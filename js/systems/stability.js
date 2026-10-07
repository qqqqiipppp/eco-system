import { stabilityConfig as config } from '../../data/stability-config.js';
import { organismById } from '../../data/organisms.js';
import { foodRelations } from '../../data/food-relations.js';
import { foodResourceConfig } from '../../data/ecology-config.js';
import { environmentQuality } from './environment.js';

const clamp = value => Math.max(0, Math.min(1, value));
export function speciesCounts(state) {
  const counts = {};
  for (const item of state.organisms) counts[item.speciesId] = (counts[item.speciesId] || 0) + 1;
  return counts;
}
export function evaluateStability(state, previousCounts = {}) {
  const counts = speciesCounts(state);
  const total = state.organisms.length;
  const roles = {};
  for (const item of state.organisms) {
    const role = organismById[item.speciesId].role;
    roles[role] = (roles[role] || 0) + 1;
  }
  const diversity = clamp(Object.keys(counts).length / config.diversityGoal);
  const share = (roles.consumer || 0) / Math.max(1, total);
  const shareScore = share < config.consumerShare.low ? share / config.consumerShare.low : share > config.consumerShare.high ? (1 - share) / (1 - config.consumerShare.high) : 1;
  const composition = config.roles.filter(role => roles[role]).length / config.roles.length * (0.5 + 0.5 * shareScore);
  const applicable = foodRelations.filter(edge => counts[edge.targetSpeciesId]);
  const food = applicable.length ? applicable.reduce((sum, edge) => {
    const consumers = state.organisms.filter(item => item.speciesId === edge.targetSpeciesId);
    const suppliers = state.organisms.filter(item => item.speciesId === edge.sourceSpeciesId);
    const supply = suppliers.reduce((amount, item) => amount + (foodResourceConfig[item.speciesId] ? item.foodStock / foodResourceConfig[item.speciesId].maximum : 1), 0);
    const adequacy = clamp(supply / (consumers.length * config.minimumFoodPerConsumer));
    const nutrition = consumers.reduce((value, item) => value + 1 - (item.hunger ?? 0), 0) / consumers.length;
    return sum + adequacy * (0.5 + 0.5 * nutrition);
  }, 0) / applicable.length : 0;
  const dominance = total ? Math.max(...Object.values(counts)) / total : 1;
  const crowding = clamp((dominance - config.dominanceThreshold) / (1 - config.dominanceThreshold));
  const priorTotal = Object.values(previousCounts).reduce((a, b) => a + b, 0);
  const losses = Object.entries(previousCounts).reduce((sum, [id, count]) => sum + Math.max(0, count - (counts[id] || 0)), 0);
  const decline = priorTotal ? losses / priorTotal : 0;
  const balance = clamp(1 - crowding - decline * config.declinePenalty);
  const breakdown = { diversity, composition, food, environment: environmentQuality(state.environment), balance };
  const weightSum = Object.values(config.weights).reduce((a, b) => a + b, 0);
  const score = total ? Math.round(100 * Object.entries(config.weights).reduce((sum, [key, weight]) => sum + breakdown[key] * weight, 0) / weightSum) : 0;
  const hints = { diversity: '서로 다른 생물의 역할을 살펴봐요.', composition: '생산자·소비자·분해자가 함께 있는지 살펴봐요.', food: '먹이를 얻기 어려운 생물이 있는지 살펴봐요.', environment: '햇빛·물·공기·토양 상태를 살펴봐요.', balance: '한 종류가 너무 많거나 빠르게 줄었는지 살펴봐요.' };
  const weakest = Object.keys(breakdown).sort((a, b) => breakdown[a] - breakdown[b])[0];
  return { score, label: config.labels.find(item => score >= item.minimum).label, hint: total ? hints[weakest] : '먼저 숲에 생물을 놓아 주세요.', breakdown };
}
export function createStabilitySystem() {
  let elapsed = 0;
  let nextSample = 0;
  const history = [];
  return {
    update(state, seconds = 0) {
      elapsed += seconds;
      while (history.length && history[0].time < elapsed - config.historySeconds) history.shift();
      if (elapsed >= nextSample) { history.push({ time: elapsed, counts: speciesCounts(state) }); nextSample = elapsed + config.sampleSeconds; }
      const result = evaluateStability(state, history[0]?.counts);
      state.metrics.stability = result.score;
      state.metrics.stabilitySummary = result;
      return result;
    },
  };
}
