import { foodResourceConfig } from '../../data/ecology-config.js';
import { growthSuitability } from './environment.js';
import {developmentalCapacity} from './development.js';

export const foodStockCapacity=instance=>(foodResourceConfig[instance.speciesId]?.maximum??0)*(instance.growth??1)*developmentalCapacity(instance);

/** Abiotic suitability controls recovery; current growth controls capacity.
 * Plants persist even when stock falls below one edible portion.
 */
export function recoverFoodStock(instance, seconds, environment, recoveryMultiplier = 1) {
  const rule = foodResourceConfig[instance.speciesId];
  if (!rule) return;
  const growth = instance.growth ?? 1;
  const capacity = foodStockCapacity(instance);
  instance.foodStock = Math.min(capacity, instance.foodStock + rule.recoveryPerSecond * growth * developmentalCapacity(instance) * growthSuitability(instance.speciesId, environment) * seconds * recoveryMultiplier);
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
