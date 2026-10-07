import { advanceManagement, producerRecoveryMultiplier } from './management.js';
import { foodRelations } from '../../data/food-relations.js';
import { ecologyConfig, feedingConfig, foodResourceConfig } from '../../data/ecology-config.js';
import { isPositionAllowed } from './placement.js';
import { hasFoodStock, consumeFoodStock, recoverFoodStock } from './food-resources.js';
import { updateProducerGrowth, animalActivity } from './environment.js';

const distance = (a, b) => Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
const edibleSpecies = new Map();
for (const relation of foodRelations) {
  const list = edibleSpecies.get(relation.targetSpeciesId) || [];
  list.push(relation.sourceSpeciesId);
  edibleSpecies.set(relation.targetSpeciesId, list);
}

/** Low-frequency decisions plus lightweight pursuit movement. No DOM or timers.
 * All time is active simulation time; hidden tabs cannot accumulate hunger.
 */
export function createFeedingSystem() {
  let accumulator = 0;
  let simulationTime = 0;
  let byId = new Map();
  let bySpecies = new Map();
  const timing = new Map();
  const diagnostics = { ticks: 0, searches: 0, candidateChecks: 0, plantMeals: 0, predations: 0 };

  function rebuildIndex(state) {
    byId = new Map();
    bySpecies = new Map();
    for (const instance of state.organisms) {
      byId.set(instance.instanceId, instance);
      if (!bySpecies.has(instance.speciesId)) bySpecies.set(instance.speciesId, []);
      bySpecies.get(instance.speciesId).push(instance);
    }
    for (const id of timing.keys()) if (!byId.has(id)) timing.delete(id);
  }
  function clockFor(instance) {
    if (!timing.has(instance.instanceId)) timing.set(instance.instanceId, { retryAt: 0, eatRemaining: 0, pursuitSeconds: 0, shortage: false });
    return timing.get(instance.instanceId);
  }
  function availableTarget(instance) {
    const target = byId.get(instance.targetInstanceId);
    return target && edibleSpecies.get(instance.speciesId)?.includes(target.speciesId) && hasFoodStock(target) ? target : null;
  }
  function returnToWander(instance, clock, shortage = false) {
    instance.behaviorState = 'wander';
    instance.targetInstanceId = null;
    clock.retryAt = simulationTime + ecologyConfig.searchRetrySeconds;
    clock.shortage = shortage;
    clock.pursuitSeconds = 0;
  }
  function findFood(instance, layout) {
    diagnostics.searches += 1;
    let nearest = null;
    let nearestDistance = feedingConfig[instance.speciesId].searchRadius;
    for (const speciesId of edibleSpecies.get(instance.speciesId) || []) {
      for (const candidate of bySpecies.get(speciesId) || []) {
        diagnostics.candidateChecks += 1;
        if (!byId.has(candidate.instanceId) || !hasFoodStock(candidate)) continue;
        // Screen constraints only: skip goals this animal cannot stand at.
        if (!isPositionAllowed(instance.speciesId, candidate.position, layout)) continue;
        const separation = distance(instance, candidate);
        if (separation <= nearestDistance) { nearest = candidate; nearestDistance = separation; }
      }
    }
    return nearest;
  }

  // Explicit small state machine. No feeding decision is made in rendering code.
  const handlers = {
    wander(instance, clock) {
      if (instance.hunger >= feedingConfig[instance.speciesId].hungryAt && simulationTime >= clock.retryAt) instance.behaviorState = 'searchFood';
    },
    searchFood(instance, clock, context) {
      const target = findFood(instance, context.layout);
      if (!target) { returnToWander(instance, clock, true); return; }
      instance.targetInstanceId = target.instanceId;
      instance.behaviorState = 'moveToFood';
      clock.pursuitSeconds = 0;
      clock.shortage = false;
    },
    moveToFood(instance, clock) {
      const target = availableTarget(instance);
      clock.pursuitSeconds += ecologyConfig.tickSeconds;
      if (!target || clock.pursuitSeconds > ecologyConfig.maxPursuitSeconds) {
        returnToWander(instance, clock, true);
      } else if (distance(instance, target) <= ecologyConfig.arrivalDistance) {
        instance.behaviorState = 'eat';
        clock.eatRemaining = ecologyConfig.eatSeconds;
      }
    },
    eat(instance, clock, context) {
      const target = availableTarget(instance);
      if (!target) { returnToWander(instance, clock, true); return; }
      // Live prey can move away while eating. Re-approach instead of remote eating.
      if (distance(instance, target) > ecologyConfig.arrivalDistance * 1.3) {
        instance.behaviorState = 'moveToFood';
        return;
      }
      clock.eatRemaining -= ecologyConfig.tickSeconds;
      if (clock.eatRemaining > 0) return;
      if (foodResourceConfig[target.speciesId]) {
        if (!consumeFoodStock(target)) { returnToWander(instance, clock, true); return; }
        diagnostics.plantMeals += 1;
      } else {
        // Synchronous deletion from both state and index prevents double predation.
        const index = context.state.organisms.findIndex(item => item.instanceId === target.instanceId);
        if (index < 0) { returnToWander(instance, clock, true); return; }
        context.state.organisms.splice(index, 1);
        byId.delete(target.instanceId);
        timing.delete(target.instanceId);
        context.result.removedIds.push(target.instanceId);
        diagnostics.predations += 1;
      }
      context.result.feedingEvents.push({ consumerSpeciesId: instance.speciesId, foodSpeciesId: target.speciesId, consumerInstanceId: instance.instanceId, foodInstanceId: target.instanceId });
      instance.hunger = Math.max(0, instance.hunger - feedingConfig[instance.speciesId].mealRelief);
      instance.lastSuccessfulFeedingAt = simulationTime;
      instance.foodShortageDuration = 0;
      returnToWander(instance, clock);
    },
  };

  function tick(state, layout, result) {
    diagnostics.ticks += 1;
    simulationTime += ecologyConfig.tickSeconds;
    advanceManagement(state, ecologyConfig.tickSeconds);
    const recoveryMultiplier = producerRecoveryMultiplier(state);
    rebuildIndex(state);
    for (const instance of state.organisms) {
      updateProducerGrowth(instance, ecologyConfig.tickSeconds, state.environment, recoveryMultiplier);
      recoverFoodStock(instance, ecologyConfig.tickSeconds, state.environment, recoveryMultiplier);
    }
    // Snapshot iteration: predation may splice the live state during this tick.
    for (const instance of [...byId.values()]) {
      const config = feedingConfig[instance.speciesId];
      if (!config || !byId.has(instance.instanceId)) continue;
      const clock = clockFor(instance);
      instance.hunger = Math.min(1, instance.hunger + config.hungerPerSecond * ecologyConfig.tickSeconds);
      if (clock.shortage) instance.foodShortageDuration += ecologyConfig.tickSeconds;
      handlers[instance.behaviorState](instance, clock, { state, layout, result });
    }
    // Other predators may have targeted the same prey. Clear stale IDs now.
    for (const instance of state.organisms) {
      if (instance.targetInstanceId && !byId.has(instance.targetInstanceId)) returnToWander(instance, clockFor(instance), true);
    }
    result.updated = state.organisms;
    result.ticked = true;
  }

  function move(instance, dt, layout) {
    const target = availableTarget(instance);
    if (!target) return false;
    const separation = distance(instance, target);
    if (separation <= ecologyConfig.arrivalDistance * 0.7) return false;
    const step = Math.min(feedingConfig[instance.speciesId].speed * dt, separation);
    const dx = (target.position.x - instance.position.x) / separation * step;
    const dy = (target.position.y - instance.position.y) / separation * step;
    const position = { x: instance.position.x + dx, y: instance.position.y + dy };
    if (!isPositionAllowed(instance.speciesId, position, layout)) return false;
    instance.position = position;
    if (Math.abs(dx) > 0.00001) instance.direction = dx < 0 ? -1 : 1;
    return true;
  }

  return {
    update(state, deltaSeconds, layout) {
      const dt = Math.min(Math.max(deltaSeconds, 0), 0.1);
      const result = { moved: [], updated: [], removedIds: [], feedingEvents: [], ticked: false };
      accumulator += dt;
      if (accumulator + 1e-9 >= ecologyConfig.tickSeconds) {
        accumulator -= ecologyConfig.tickSeconds;
        tick(state, layout, result);
      }
      const activity = animalActivity(state.environment);
      for (const instance of state.organisms) {
        if (instance.behaviorState === 'moveToFood' && move(instance, dt * activity, layout)) result.moved.push({ instance, direction: instance.direction });
      }
      return result;
    },
    getDiagnostics: () => ({ ...diagnostics }),
  };
}
