import { foodResourceConfig } from '../../data/ecology-config.js';

/** Future abiotic connection point: supply a reviewed growth modifier here.
 * This stage deliberately does not read sunlight, water, soil or air.
 */
export function recoverFoodStock(instance, seconds) {
  const rule = foodResourceConfig[instance.speciesId];
  if (!rule) return;
  instance.foodStock = Math.min(rule.maximum, instance.foodStock + rule.recoveryPerSecond * seconds);
}

export function hasFoodStock(instance) {
  const rule = foodResourceConfig[instance.speciesId];
  return !rule || instance.foodStock >= rule.portion;
}

export function consumeFoodStock(instance) {
  const rule = foodResourceConfig[instance.speciesId];
  if (!rule || !hasFoodStock(instance)) return false;
  instance.foodStock = Math.max(0, instance.foodStock - rule.portion);
  return true;
}
