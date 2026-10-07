import { rewardConfig } from '../../data/management-actions.js';
import { producerGrowth } from '../../data/environment-config.js';
import { growthSuitability } from './environment.js';
import { eventConfig } from '../../data/event-config.js';

// Called only after a domain system has verified the achievement.
export function grantReward(state, category, semanticId, sourceId) {
  const amount = rewardConfig[category];
  const rewardId = `${category}:${semanticId}`;
  if (!amount || state.rewardHistory.some(item => item.rewardId === rewardId)) return 0;
  state.metrics.points += amount;
  state.rewardHistory.push({ rewardId, grantedAt:state.simulationTime, sourceId, amount });
  return amount;
}

export function rewardResolvedManagement(state) {
  for (const record of state.managementHistory) {
    if (record.result !== 'applied' || !record.factor) continue;
    const event = state.events.find(item => item.eventId === record.sourceEventId);
    if (event?.status !== 'resolved') continue;
    // A later free environment comparison must not be credited as this action.
    const producers = state.organisms.filter(item => producerGrowth[item.speciesId]);
    const recovered = producers.length > 0 && producers.every(item => growthSuitability(item.speciesId,state.environment) >= eventConfig.growthThreshold);
    record.result = state.environment[record.factor].value === record.valueAfter && recovered ? 'resolved' : 'changed-elsewhere';
    if (record.result === 'resolved') grantReward(state,'management',`${record.factor}_shortage_resolved`,record.sourceEventId);
  }
}
