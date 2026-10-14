import { activityById } from '../../data/activities.js';
import { rewardConfig } from '../../data/management-actions.js';
import { producerGrowth } from '../../data/environment-config.js';
import { growthSuitability } from './environment.js';
import { eventConfig } from '../../data/event-config.js';
import {recordPointChange} from '../state/point-economy-state.js';

// Called only after a domain system has verified the achievement.
export function hasReceivedReward(state, category, semanticId) {
  const rewardId = `${category}:${semanticId}`;
  const previousId = category === 'observation' ? `observation:${semanticId.replace(/^v2_/, '')}` : rewardId;
  return state.rewardHistory.some(item => item.rewardId === rewardId || item.rewardId === previousId)||state.pointEconomy.legacyClaimed.some(id=>id===rewardId||id===previousId);
}

export function grantReward(state, category, semanticId, sourceId) {
  const amount = category === 'activity' ? (state.activities.some(item => item.activityId===semanticId && item.completed) ? activityById[semanticId]?.pointReward : 0) : (Object.hasOwn(rewardConfig,category) ? rewardConfig[category] : 0);
  const rewardId = `${category}:${semanticId}`;
  // An archived reward for the same card-slot relation remains a once-only credit.
  if (!amount || hasReceivedReward(state, category, semanticId)) return 0;
  state.metrics.points += amount;
  state.rewardHistory.push({ rewardId, grantedAt:state.simulationTime, sourceId, amount });
  recordPointChange(state,'legacy',amount,rewardId,sourceId);
  return amount;
}

export function rewardResolvedManagement(state) {
  for (const record of state.managementHistory) {
    if (record.result !== 'applied' || !['water','soil'].includes(record.factor)) continue;
    const event = state.events.find(item => item.eventId === record.sourceEventId);
    // A later free environment comparison must not be credited as this action.
    const producers = state.organisms.filter(item => producerGrowth[item.speciesId]);
    const recovered = producers.length > 0 && producers.every(item => growthSuitability(item.speciesId,state.environment) >= eventConfig.growthThreshold);
    // An episode notice stays available for observation after an actual recovery.
    // Its acknowledgement earns nothing; paid care keeps the same once-only
    // resolution check as the older shortage alert, independent of that notice.
    if (event?.payload.environmentEventId||record.directEnvironment ? !recovered : event?.status !== 'resolved') continue;
    record.result = state.environment[record.factor].value === record.valueAfter && recovered ? 'resolved' : 'changed-elsewhere';
    if (record.result === 'resolved') grantReward(state,'management',`${record.factor}_shortage_resolved`,record.sourceEventId);
  }
}
