import {survivalConfig} from '../../data/survival-config.js';
import {effectiveAge} from '../state/life-state.js';

// A shallow soil / litter cover abstraction, not an inaccessible deep burrow.
// Phase is derived from already saved life and active simulation time. No new
// clock, random roll, last-individual immunity, population rule or saved field.
export function earthwormAtSurface(instance, time) {
  const cycle = survivalConfig.earthwormCycleSeconds;
  const phase = effectiveAge(instance, time) % cycle;
  return phase >= cycle - survivalConfig.earthwormSurfaceSeconds;
}

export function preyAccessible(instance, time) {
  return instance.speciesId !== 'earthworm' || !survivalConfig.earthwormRefuge || earthwormAtSurface(instance, time);
}
