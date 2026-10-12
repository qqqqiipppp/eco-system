import { activityById } from '../../data/activities.js';
import { rewardConfig } from '../../data/management-actions.js';
import { producerGrowth } from '../../data/environment-config.js';
import { growthSuitability } from './environment.js';
import { eventConfig } from '../../data/event-config.js';

// Called only after a domain system has verified the achievement.
export function hasReceivedReward(state, category, semanticId) {
  const rewardId = `${category}:${semanticId}`;
  const previousId = category === 'observation' ? `observation:${semanticId.replace(/^v2_/, '')}` : rewardId;
  return state.rewardHistory.some(item => item.rewardId === rewardId || item.rewardId === previousId);
}

export function grantReward(state, category, semanticId, sourceId) {
  const amount = category === 'activity' ? (state.activities.some(item => item.activityId===semanticId && item.completed) ? activityById[semanticId]?.pointReward : 0) : (Object.hasOwn(rewardConfig,category) ? rewardConfig[category] : 0);
  const rewardId = `${category}:${semanticId}`;
  // An archived reward for the same card-slot relation remains a once-only credit.
  if (!amount || hasReceivedReward(state, category, semanticId)) return 0;
  state.metrics.points += amount;
  state.rewardHistory.push({ rewardId, grantedAt:state.simulationTime, sourceId, amount });
  return amount;
}

export function rewardResolvedManagement(state) {
  for (const record of state.managementHistory) {
    if (record.result !== 'applied' || !['water','soil'].includes(record.factor)) continue;
    const event = state.events.find(item => item.eventId === record.sourceEventId);
    if (event?.status !== 'resolved') continue;
    // A later free environment comparison must not be credited as this action.
    const producers = state.organisms.filter(item => producerGrowth[item.speciesId]);
    const recovered = producers.length > 0 && producers.every(item => growthSuitability(item.speciesId,state.environment) >= eventConfig.growthThreshold);
    record.result = state.environment[record.factor].value === record.valueAfter && recovered ? 'resolved' : 'changed-elsewhere';
    if (record.result === 'resolved') grantReward(state,'management',`${record.factor}_shortage_resolved`,record.sourceEventId);
  }
}
