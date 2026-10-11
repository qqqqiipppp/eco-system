import { foodResourceConfig } from '../../data/ecology-config.js';
import { growthSuitability } from './environment.js';

/** Abiotic suitability controls recovery; current growth controls capacity.
 * Plants persist even when stock falls below one edible portion.
 */
export function recoverFoodStock(instance, seconds, environment, recoveryMultiplier = 1) {
  const rule = foodResourceConfig[instance.speciesId];
  if (!rule) return;
  const growth = instance.growth ?? 1;
  const capacity = rule.maximum * growth;
  instance.foodStock = Math.min(capacity, instance.foodStock + rule.recoveryPerSecond * growth * growthSuitability(instance.speciesId, environment) * seconds * recoveryMultiplier);
}

export function hasFoodStock(instance,relation) {
  const rule = foodResourceConfig[instance.speciesId];
  if(relation && (relation.sourceSpeciesId!==instance.speciesId || (relation.feedingMode==='resource' ? !rule?.parts.includes(relation.foodPart) : Boolean(rule))))return false;
  return !rule || instance.foodStock >= rule.portion;
}

export function consumeFoodStock(instance,relation) {
  const rule = foodResourceConfig[instance.speciesId];
  if (!rule || !hasFoodStock(instance,relation)) return false;
  instance.foodStock = Math.max(0, instance.foodStock - rule.portion);
  return true;
}
