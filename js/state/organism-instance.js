import { organismById } from '../../data/organisms.js';
import { foodResourceConfig, feedingConfig } from '../../data/ecology-config.js';
import { producerGrowth } from '../../data/environment-config.js';
import {populationConfig} from '../../data/population-config.js';
import {createLifeState} from './life-state.js';
import {createDevelopmentState} from './development-state.js';
import {developmentalCapacity} from '../systems/development.js';

/** Shared constructor for initial organisms and placements. Definitions stay static.
 * Only species taking part in feeding receive feeding runtime state.
 */
export function createOrganismInstance(speciesId, instanceId, position, {time=0,newborn=false,origin}={}) {
  if (!organismById[speciesId]) throw new Error(`Unknown species: ${speciesId}`);
  const instance = { instanceId, speciesId, position: { ...position },life:createLifeState(speciesId,instanceId,time,newborn) };
  const naturalOrigin={grass:'seed-spread',grasshopper:'egg-hatch',rabbit:'birth'};
  const development=createDevelopmentState(speciesId,origin||(newborn?naturalOrigin[speciesId]:'introduced'));
  if(development)instance.development=development;
  if (producerGrowth[speciesId]) instance.growth = 1;
  if (foodResourceConfig[speciesId]) instance.foodStock = foodResourceConfig[speciesId].maximum*developmentalCapacity(instance);
  if (feedingConfig[speciesId]) Object.assign(instance, {
    direction: 1,
    behaviorState: 'wander',
    targetInstanceId: null,
    hunger: feedingConfig[speciesId].initialHunger,
    foodShortageDuration: 0,
    lastSuccessfulFeedingAt: null,
    deprivationSeconds:0,
    bornAt:time,
    satietyUntil:0,
    acclimationUntil:time+populationConfig.graceSeconds,
  });
  return instance;
}
