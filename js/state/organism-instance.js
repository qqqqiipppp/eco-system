import { organismById } from '../../data/organisms.js';
import { foodResourceConfig, feedingConfig } from '../../data/ecology-config.js';
import { producerGrowth } from '../../data/environment-config.js';

/** Shared constructor for initial organisms and placements. Definitions stay static.
 * Only species taking part in feeding receive feeding runtime state.
 */
export function createOrganismInstance(speciesId, instanceId, position) {
  if (!organismById[speciesId]) throw new Error(`Unknown species: ${speciesId}`);
  const instance = { instanceId, speciesId, position: { ...position } };
  if (producerGrowth[speciesId]) instance.growth = 1;
  if (foodResourceConfig[speciesId]) instance.foodStock = foodResourceConfig[speciesId].maximum;
  if (feedingConfig[speciesId]) Object.assign(instance, {
    direction: 1,
    behaviorState: 'wander',
    targetInstanceId: null,
    hunger: feedingConfig[speciesId].initialHunger,
    foodShortageDuration: 0,
    lastSuccessfulFeedingAt: null,
  });
  return instance;
}
