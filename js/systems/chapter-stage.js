import {createGameState} from '../state/game-state.js';
import {createOrganismInstance} from '../state/organism-instance.js';
import {createPointEconomyState} from '../state/point-economy-state.js';
import {survivalStage} from './population.js';
import {startEnvironmentEvent} from './environment-events.js';
import {foodResourceConfig} from '../../data/ecology-config.js';
import {stageConfig as config} from '../../data/chapters.js';

// A fresh stage forest. Chapter mode never writes the regular forest save.
export function createStageGameState(stage) {
  const s = createGameState();
  s.organisms = stage.organisms.map(([id, x], i) => createOrganismInstance(id, `${stage.stageId}-${id}-${i + 1}`, {x, y: .72}));
  s.nextInstanceSequence = s.organisms.length + 1;
  s.inventory.forEach(card => card.acquired = stage.inventory.includes(card.speciesId));
  const ids = [...new Set(s.organisms.map(o => o.speciesId))];
  s.population.introductions = Object.fromEntries(ids.map(id => [id, {count: s.organisms.filter(o => o.speciesId === id).length, nextAt: 0}]));
  s.metrics.points = stage.points;
  s.pointEconomy = createPointEconomyState(stage.points);
  // The stage starts its own event when the first seed grows.
  s.environmentEvents.nextAt = Number.MAX_SAFE_INTEGER;
  s.chapter = {stageId: stage.stageId, event: stage.event, seeds: 0, seedProgress: 0, lastMealAt: null,
    observations: 0, offers: [], offerSequence: 0, lastOfferAt: null, eventStarted: false, cleared: false, clearedAt: null};
  return s;
}

const consumers = s => s.organisms.filter(o => 'hunger' in o);
const foodPlants = s => s.organisms.filter(o => 'foodStock' in o && foodResourceConfig[o.speciesId]);
export function foodRatio(s) {
  const plants = foodPlants(s);
  return plants.length ? plants.reduce((sum, o) => sum + o.foodStock / foodResourceConfig[o.speciesId].maximum, 0) / plants.length : 0;
}

// Why seeds are not growing right now, most actionable first. Empty = balanced.
export function stageBlockers(s) {
  const c = s.chapter, list = [];
  if (!consumers(s).length) list.push({id: 'noConsumer'});
  const bad = Object.keys(s.environment).filter(k => s.environment[k].value < config.minimumEnvironment);
  if (bad.length) list.push({id: 'environment', factors: bad});
  if (consumers(s).some(o => ['severe', 'weak'].includes(survivalStage(o)))) list.push({id: 'starving'});
  if (foodRatio(s) < config.minimumFoodRatio) list.push({id: 'depleted'});
  if (consumers(s).length && (c.lastMealAt === null || s.simulationTime - c.lastMealAt > config.recentMealSeconds)) list.push({id: 'noMeal'});
  return list;
}

function growSeeds(s) {
  const c = s.chapter, result = {seedGained: false, eventStarted: null, cleared: false};
  while (!c.cleared && c.seedProgress >= config.seedSeconds) {
    c.seedProgress -= config.seedSeconds;
    c.seeds++;
    result.seedGained = true;
    if (c.seeds >= config.eventAfterSeeds && !c.eventStarted) {
      c.eventStarted = true;
      result.eventStarted = startEnvironmentEvent(s, c.event);
    }
    if (c.seeds >= config.seedsToClear) {
      c.cleared = true;
      c.clearedAt = s.simulationTime;
      c.seedProgress = 0;
      result.cleared = true;
    }
  }
  return result;
}

// Called once per ecology tick, after feeding. Offers expire on the game clock,
// so they also wait while a reading dialog pauses the forest.
export function updateStage(s, seconds, feedingEvents = []) {
  const c = s.chapter;
  if (!c || c.cleared) return {seedGained: false, eventStarted: null, cleared: false};
  const time = s.simulationTime;
  if (feedingEvents.length) c.lastMealAt = time;
  c.offers = c.offers.filter(o => o.expiresAt > time);
  const meal = feedingEvents.at(-1);
  if (meal && (c.lastOfferAt === null || time - c.lastOfferAt >= config.observationInterval)) {
    c.lastOfferAt = time;
    c.offers.push({offerId: `offer-${++c.offerSequence}`, relationId: meal.relationId, consumerInstanceId: meal.consumerInstanceId, expiresAt: time + config.observationLifetime});
  }
  if (!stageBlockers(s).length) c.seedProgress += seconds;
  return growSeeds(s);
}

// A caught observation always counts; it helps seeds only in a balanced forest,
// so crowding a forest with hungry animals cannot farm seeds.
export function catchObservation(s, offerId) {
  const c = s.chapter, offer = c?.offers.find(o => o.offerId === offerId);
  if (!offer || c.cleared) return {ok: false, bonus: false, seedGained: false, eventStarted: null, cleared: false};
  c.offers = c.offers.filter(o => o !== offer);
  c.observations++;
  const bonus = !stageBlockers(s).length;
  if (bonus) c.seedProgress += config.observationBonusSeconds;
  return {ok: true, bonus, offer, ...growSeeds(s)};
}
