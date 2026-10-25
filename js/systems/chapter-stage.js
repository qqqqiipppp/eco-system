import {createGameState} from '../state/game-state.js';
import {createOrganismInstance} from '../state/organism-instance.js';
import {createPointEconomyState,recordPointChange} from '../state/point-economy-state.js';
import {survivalStage} from './population.js';
import {startEnvironmentEvent,currentEnvironmentEvent} from './environment-events.js';
import {executeManagement,validateManagement} from './management.js';
import {removeOrganism,addOrganism} from './lifecycle.js';
import {foodResourceConfig} from '../../data/ecology-config.js';
import {managementActions} from '../../data/management-actions.js';
import {foodRelations} from '../../data/food-relations.js';
import {stageConfig as config,stageById,crises,crisisForFactor,breeding} from '../../data/chapters.js';

// A fresh stage forest. Chapter mode never writes the regular forest save.
export function createStageGameState(stage) {
  const s = createGameState();
  s.organisms = stage.organisms.map(([id, x], i) => createOrganismInstance(id, `${stage.stageId}-${id}-${i + 1}`, {x, y: .72}));
  s.nextInstanceSequence = s.organisms.length + 1;
  s.inventory.forEach(card => card.acquired = stage.inventory.includes(card.speciesId));
  const ids = [...new Set(s.organisms.map(o => o.speciesId))];
  s.population.introductions = Object.fromEntries(ids.map(id => [id, {count: s.organisms.filter(o => o.speciesId === id).length, nextAt: 0}]));
  for (const [factor, value] of Object.entries(stage.environment || {})) s.environment[factor].value = value;
  s.metrics.points = stage.points;
  s.pointEconomy = createPointEconomyState(stage.points);
  // The stage starts its own event when the first seed grows.
  s.environmentEvents.nextAt = Number.MAX_SAFE_INTEGER;
  s.chapter = {stageId: stage.stageId, seeds: 0, seedProgress: 0, lastMealAt: null,
    observations: 0, offers: [], offerSequence: 0, lastOfferAt: null, lastWork: 0, lastDecomposedAt: null,
    warning: null, trash: [], trashSequence: 0, lastTrashAt: null, trashCollected: 0, crisisLog: [], breeding: {}, births: [],
    eventsStarted: 0, cleared: false, clearedAt: null};
  return s;
}

const consumers = s => s.organisms.filter(o => 'hunger' in o);
const foodPlants = s => s.organisms.filter(o => 'foodStock' in o && foodResourceConfig[o.speciesId]);
export function foodRatio(s) {
  const plants = foodPlants(s);
  return plants.length ? plants.reduce((sum, o) => sum + o.foodStock / foodResourceConfig[o.speciesId].maximum, 0) / plants.length : 0;
}

// What each organism shows in the forest: the same rules that stall seeds.
export function needStates(s) {
  const states = new Map();
  for (const o of consumers(s)) {
    const searching = o.hunger >= .6 ? o.foodShortageDuration || 0 : 0;
    if (['severe', 'weak'].includes(survivalStage(o)) || searching >= config.hungrySeconds) states.set(o.instanceId, 'starving');
    else if (searching >= config.hungryNoticeSeconds) states.set(o.instanceId, 'hungry');
  }
  for (const o of foodPlants(s)) if (o.foodStock / foodResourceConfig[o.speciesId].maximum < config.minimumFoodRatio) states.set(o.instanceId, 'eaten');
  return states;
}

// Cards that would fix what is stalling the seeds right now.
export function neededCards(s, blockers = stageBlockers(s)) {
  const owned = id => s.inventory.some(c => c.speciesId === id && c.acquired), cards = new Set();
  const foodsOf = ids => foodRelations.filter(r => ids.has(r.targetSpeciesId) && owned(r.sourceSpeciesId)).map(r => r.sourceSpeciesId);
  for (const b of blockers) {
    if (b.id === 'missing') b.species.forEach(m => owned(m.id) && cards.add(m.id));
    if (b.id === 'depleted') foodsOf(new Set(consumers(s).map(o => o.speciesId))).filter(id => foodResourceConfig[id]).forEach(id => cards.add(id));
    if (b.id === 'starving') { const needs = needStates(s); foodsOf(new Set(consumers(s).filter(o => needs.get(o.instanceId) === 'starving').map(o => o.speciesId))).forEach(id => cards.add(id)); }
    if (b.id === 'noDecomposition') ['mushroom', 'litter-mold', 'earthworm'].filter(owned).forEach(id => cards.add(id));
    if (b.id === 'needBirth' && owned(b.speciesId) && s.organisms.filter(o => o.speciesId === b.speciesId).length < 2) cards.add(b.speciesId);
  }
  return cards;
}

// Work done by decomposers and earthworms, not the always-on background decay.
const decomposerWork = s => Object.values(s.learningGoalProgress?.work || {}).reduce((sum, v) => sum + v, 0) + (s.decomposition.earthwormProcessed || 0);

// Why seeds are not growing right now, most actionable first. Empty = balanced.
export function stageBlockers(s) {
  const c = s.chapter, stage = stageById[c.stageId], list = [];
  if (!consumers(s).length) list.push({id: 'noConsumer'});
  const missing = Object.entries(stage.requiredSpecies || {}).filter(([id, n]) => s.organisms.filter(o => o.speciesId === id).length < n).map(([id, n]) => ({id, need: n}));
  if (missing.length && consumers(s).length) list.push({id: 'missing', species: missing});
  // Weather (sunlight, water) works through the ecology: plants grow slower and
  // food runs short. A prepared forest can ride it out, so it does not stall
  // seeds by itself. Soil and air damaged by people do, until it is cleaned up.
  const bad = Object.keys(s.environment).filter(k => s.environment[k].value < config.minimumEnvironment && crisisForFactor(k)?.human !== false);
  if (bad.length) list.push({id: 'environment', factors: bad});
  // Hungry and unable to find food for a while: visible long before starvation.
  const needs = needStates(s);
  if ([...needs.values()].includes('starving')) list.push({id: 'starving'});
  if (foodRatio(s) < config.minimumFoodRatio) list.push({id: 'depleted'});
  if (stage.needsDecomposition && (c.lastDecomposedAt === null || s.simulationTime - c.lastDecomposedAt > config.recentMealSeconds)) list.push({id: 'noDecomposition'});
  if (consumers(s).length && (c.lastMealAt === null || s.simulationTime - c.lastMealAt > config.recentMealSeconds)) list.push({id: 'noMeal'});
  // The third star needs a young one born here from two parents.
  if (stage.birthRequired && c.seeds >= config.seedsToClear - 1 && !c.births.some(b => b.speciesId === stage.birthRequired)) list.push({id: 'needBirth', speciesId: stage.birthRequired});
  return list;
}

// Event i waits for seed i+1 and for the previous event to end, then is
// announced warningSeconds before it starts.
function startDueEvent(s) {
  const c = s.chapter, events = stageById[c.stageId].events;
  if (c.warning) {
    if (s.simulationTime < c.warning.startsAt) return null;
    const kind = c.warning.kind;
    c.warning = null; c.eventsStarted++;
    const record = openCrisis(c);
    if (record) record.startedAt = s.simulationTime;
    return startEnvironmentEvent(s, kind);
  }
  if (c.eventsStarted >= events.length || c.seeds <= c.eventsStarted || currentEnvironmentEvent(s)) return null;
  c.warning = {kind: events[c.eventsStarted], startsAt: s.simulationTime + config.warningSeconds};
  // A natural crisis cannot be stopped, only prepared for: record the choice and its outcome.
  if (!crises[c.warning.kind].human) c.crisisLog.push({kind: c.warning.kind, choice: null, stalled: 0, startedAt: null, endedAt: null});
  return null;
}

// Litter or smog appears while a human-made crisis is active and harms its
// factor for as long as it lies in the forest.
function updateTrash(s, seconds) {
  const c = s.chapter, time = s.simulationTime, event = currentEnvironmentEvent(s), crisis = event && crises[event.kind];
  if (crisis?.human && event.phase === 'active' && c.trash.length < config.trashMax && (c.lastTrashAt === null || time - c.lastTrashAt >= config.trashInterval)) {
    c.lastTrashAt = time;
    const n = ++c.trashSequence;
    c.trash.push({trashId: `trash-${n}`, kind: event.kind, x: .12 + .74 * ((n * .618) % 1), y: .74});
  }
  for (const item of c.trash) {
    const factor = s.environment[crises[item.kind].factor];
    factor.value = Math.max(Math.min(factor.value, config.trashFloor), factor.value - config.trashDamage * seconds);
  }
}
export function collectTrash(s, trashId) {
  const c = s.chapter, item = c?.trash.find(t => t.trashId === trashId);
  if (!item) return {ok: false};
  c.trash = c.trash.filter(t => t !== item);
  c.trashCollected++;
  s.metrics.points += config.trashReward;
  recordPointChange(s, 'study', config.trashReward, `chapter-trash:${trashId}`, trashId);
  return {ok: true, item, message: `${crises[item.kind].item}를 치웠어요. 치우지 않으면 숲이 계속 망가져요.`};
}
function growSeeds(s) {
  const c = s.chapter, seedSeconds = stageById[c.stageId].seedSeconds, result = {seedGained: false, eventStarted: null, cleared: false};
  while (!c.cleared && c.seedProgress >= seedSeconds) {
    c.seedProgress -= seedSeconds;
    c.seeds++;
    result.seedGained = true;
    result.eventStarted = startDueEvent(s) || result.eventStarted;
    if (c.seeds >= config.seedsToClear) {
      c.cleared = true;
      c.clearedAt = s.simulationTime;
      // A crisis still under way ends with the stage; its outcome joins the clear.
      for (const record of c.crisisLog) if (record.endedAt === null) record.endedAt = s.simulationTime;
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
  const work = decomposerWork(s);
  if (work > c.lastWork + 1e-9) c.lastDecomposedAt = time;
  c.lastWork = work;
  c.offers = c.offers.filter(o => o.expiresAt > time);
  const meal = feedingEvents.at(-1);
  if (meal && (c.lastOfferAt === null || time - c.lastOfferAt >= config.observationInterval)) {
    c.lastOfferAt = time;
    c.offers.push({offerId: `offer-${++c.offerSequence}`, relationId: meal.relationId, consumerInstanceId: meal.consumerInstanceId, expiresAt: time + config.observationLifetime});
  }
  updateTrash(s, seconds);
  const born = updateBreeding(s, seconds);
  // In a shop the price limits how fast animals come back, so the regular
  // forest's wait before reintroducing an eaten species is lifted here.
  for (const intro of Object.values(s.population.introductions)) if (intro.nextAt > time) intro.nextAt = time;
  const stalled = stageBlockers(s).length > 0;
  if (!stalled) c.seedProgress += seconds;
  const crisis = openCrisis(c);
  if (crisis?.startedAt !== null && crisis) {
    if (stalled) crisis.stalled += seconds;
    if (!currentEnvironmentEvent(s)) crisis.endedAt = time;
  }
  const result = growSeeds(s);
  if (!c.cleared) result.eventStarted = startDueEvent(s) || result.eventStarted;
  result.born = born;
  return result;
}

// A caught observation always counts; it helps seeds only in a balanced forest,
// so crowding a forest with hungry animals cannot farm seeds.
export function catchObservation(s, offerId) {
  const c = s.chapter, offer = c?.offers.find(o => o.offerId === offerId);
  if (!offer || c.cleared) return {ok: false, bonus: false, seedGained: false, eventStarted: null, cleared: false};
  c.offers = c.offers.filter(o => o !== offer);
  c.observations++;
  s.metrics.points += config.observationReward;
  recordPointChange(s, 'study', config.observationReward, `chapter-observation:${offer.offerId}`, offer.offerId);
  const bonus = !stageBlockers(s).length;
  if (bonus) c.seedProgress += config.observationBonusSeconds;
  return {ok: true, bonus, offer, ...growSeeds(s)};
}

// One-tap care for each bad environment factor, using the game's own actions
// and costs. Water and soil care need the forest's active environment alert.
const careAction = {water: 'water-care', soil: 'soil-care', sunlight: 'habitat-care', air: 'habitat-care'};
function careTarget(s, factor) {
  if (careAction[factor] === 'habitat-care') return {sourceType: 'environment', sourceId: factor};
  return s.events.find(e => e.status === 'active' && e.sourceType === 'environment' && e.payload?.factor === factor)?.eventId ?? null;
}
export function careOptions(s) {
  return Object.keys(s.environment).filter(f => s.environment[f].value < config.minimumEnvironment && crisisForFactor(f)?.care).map(factor => {
    const actionId = careAction[factor], target = careTarget(s, factor);
    const check = target ? validateManagement(s, actionId, target) : {ok: false, message: '환경의 변화가 생물에게 나타날 때까지 조금 기다려요.'};
    const cost = managementActions.find(action => action.actionId === actionId).cost;
    return {factor, actionId, cost, label: crisisForFactor(factor).care, ok: check.ok, message: check.ok ? '' : check.message};
  });
}
export function careFor(s, factor) {
  const target = careTarget(s, factor);
  return target ? executeManagement(s, careAction[factor], target) : {ok: false, message: '환경의 변화가 생물에게 나타날 때까지 조금 기다려요.'};
}

// The shop. Placement itself stays the game's own rule; the stage only charges.
export const priceOf = id => config.prices[id] ?? 5;
export function buyCheck(s, id) {
  const price = priceOf(id);
  return s.metrics.points >= price ? {ok: true, price} : {ok: false, price, message: `포인트가 ${price - s.metrics.points}점 부족해요. 숲에서 💡를 잡아 포인트를 모아요.`};
}
export function payFor(s, id) {
  const price = priceOf(id);
  s.metrics.points -= price;
  recordPointChange(s, 'management', -price, `chapter-buy:${id}:${s.nextInstanceSequence}`, id);
  return price;
}

// Preparing for weather: it cannot be changed, but the forest can be made
// sturdier before it comes. The outcome shows in the real ecology.
const openCrisis = c => c.crisisLog.find(r => r.endedAt === null) || null;
const plantEaters = s => s.organisms.filter(o => 'hunger' in o && foodRelations.some(r => r.targetSpeciesId === o.speciesId && r.feedingMode === 'resource'));
function reducible(s) {
  const required = stageById[s.chapter.stageId].requiredSpecies || {}, groups = {};
  for (const o of plantEaters(s)) (groups[o.speciesId] ??= []).push(o);
  return Object.entries(groups).filter(([id, list]) => list.length > Math.max(1, required[id] || 0)).sort((a, b) => b[1].length - a[1].length)[0] || null;
}
export function prepareOptions(s) {
  const c = s.chapter, record = openCrisis(c);
  if (!record || record.choice) return [];
  const plant = stageById[c.stageId].inventory.find(id => foodResourceConfig[id]), extra = reducible(s);
  return [
    {id: 'plant', speciesId: plant, ok: Boolean(plant)},
    {id: 'reduce', speciesId: extra?.[0] ?? null, ok: Boolean(extra)},
    {id: 'wait', ok: true},
  ];
}
export function prepareFor(s, choice) {
  const c = s.chapter, record = openCrisis(c);
  if (!record || record.choice) return {ok: false};
  const option = prepareOptions(s).find(o => o.id === choice);
  if (!option?.ok) return {ok: false};
  record.choice = choice;
  if (choice === 'reduce') {
    const [, list] = reducible(s), target = list.at(-1);
    removeOrganism(s, target.instanceId, 'release');
    return {ok: true, choice, removedId: target.instanceId, speciesId: target.speciesId};
  }
  return {ok: true, choice, speciesId: option.speciesId};
}
// The finished crisis not yet shown to the student, if any.
export const crisisReport = s => s.chapter.crisisLog.find(r => r.endedAt !== null && !r.reported) || null;
export const markReported = record => { record.reported = true; };

// Breeding: two grown animals of one species, both fed and well, become a pair;
// after healthySeconds a young one is on its way (egg or nest) and is born
// waitSeconds later. Only parents in the forest make young.
export const isYoung = (s, o) => o.chapterBornAt !== undefined && s.simulationTime - o.chapterBornAt < breeding.youngSeconds;
function wellParent(s, o) {
  return !isYoung(s, o) && o.hunger <= .8 && !['severe', 'weak'].includes(survivalStage(o));
}
export function breedingState(s) {
  const out = {};
  for (const [id, rule] of Object.entries(breeding.species)) {
    const all = s.organisms.filter(o => o.speciesId === id), well = all.filter(o => wellParent(s, o)), memory = s.chapter.breeding[id];
    if (!all.length && !memory?.pending) continue;
    out[id] = {count: all.length, pair: well.length >= 2 ? well.slice(0, 2).map(o => o.instanceId) : [], healthy: memory?.healthy || 0, pending: memory?.pending || null, rule};
  }
  return out;
}
function updateBreeding(s, seconds) {
  const c = s.chapter, time = s.simulationTime, born = [];
  for (const [id, rule] of Object.entries(breeding.species)) {
    const memory = c.breeding[id] ??= {healthy: 0, pending: null};
    const all = s.organisms.filter(o => o.speciesId === id), well = all.filter(o => wellParent(s, o));
    if (memory.pending) {
      memory.pending.remaining -= seconds;
      if (memory.pending.remaining > 0) continue;
      const child = all.length < breeding.maximum ? addOrganism(s, id, {...memory.pending.position}, 'reproduction', {mode: 'chapter-pair'}) : null;
      if (child) { child.chapterBornAt = time; c.births.push({speciesId: id, instanceId: child.instanceId, at: time}); born.push(child); }
      memory.pending = null; memory.healthy = 0;
      continue;
    }
    memory.healthy = well.length >= 2 && all.length < breeding.maximum ? memory.healthy + seconds : 0;
    if (memory.healthy >= rule.healthySeconds) {
      const parent = well[0];
      memory.pending = {remaining: rule.waitSeconds, total: rule.waitSeconds, parentId: parent.instanceId,
        position: {x: Math.min(.92, Math.max(.08, parent.position.x + (parent.position.x > .5 ? -.05 : .05))), y: parent.position.y}};
    }
  }
  return born;
}
