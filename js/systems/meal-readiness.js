import {feedingConfig,ecologyConfig} from '../../data/ecology-config.js';
import {populationConfig} from '../../data/population-config.js';
import {survivalConfig} from '../../data/survival-config.js';

// A real prior meal is mandatory. A slower normal demand cycle must not reset
// growth/breeding preparation before the animal could reasonably eat again.
// Hunger, food, maturity, environment and space retain their own separate gates.
export function hasRecentMeal(instance, time) {
  if (instance.lastSuccessfulFeedingAt === null) return false;
  if (!survivalConfig.demandAwareRecentMeal) return time - instance.lastSuccessfulFeedingAt <= populationConfig.recentMealSeconds;
  const rule = feedingConfig[instance.speciesId];
  if (!rule) return false;
  const approach = (rule.maxPursuitSeconds ?? ecologyConfig.maxPursuitSeconds) + ecologyConfig.searchRetrySeconds + ecologyConfig.eatSeconds + 2 * ecologyConfig.tickSeconds;
  const window = Math.max(populationConfig.recentMealSeconds, rule.hungryAt / rule.hungerPerSecond + approach);
  return time <= Math.max(instance.lastSuccessfulFeedingAt, instance.satietyUntil || 0) + window;
}
