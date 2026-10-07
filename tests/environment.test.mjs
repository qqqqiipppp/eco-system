import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../js/state/game-state.js';
import { createOrganismInstance } from '../js/state/organism-instance.js';
import { setEnvironmentLevel, growthSuitability, updateProducerGrowth, animalActivity } from '../js/systems/environment.js';
import { recoverFoodStock } from '../js/systems/food-resources.js';
import { evaluateStability } from '../js/systems/stability.js';
import { createFeedingSystem } from '../js/systems/feeding.js';
import { speciesProfiles } from '../data/interaction-config.js';

function scene(species) {
  const state = createGameState();
  state.organisms = species.map((id, index) => createOrganismInstance(id, `test-${index}`, { x: 0.4, y: 0.72 }));
  return state;
}
test('each factor independently reduces plant suitability; soil sensitivity differs', () => {
  for (const key of ['sunlight','water','air','soil']) {
    const state = createGameState();
    setEnvironmentLevel(state, key, 'bad');
    assert(growthSuitability('grass', state.environment) < 1);
  }
  const state = createGameState(); setEnvironmentLevel(state, 'soil', 'bad');
  assert(growthSuitability('oak', state.environment) < growthSuitability('grass', state.environment));
  assert.equal(setEnvironmentLevel(state, 'temperature', 'bad'), false);
  assert.equal(setEnvironmentLevel(state, 'water', 'unknown'), false);
});
test('bad environment gradually reduces biomass/capacity, then good conditions restore it', () => {
  const state = scene(['grass']); const grass = state.organisms[0];
  for (const key of Object.keys(state.environment)) setEnvironmentLevel(state, key, 'bad');
  updateProducerGrowth(grass, 0.5, state.environment);
  assert(grass.growth < 1 && grass.growth > 0.9);
  for (let i=0;i<160;i++) { updateProducerGrowth(grass, 0.5, state.environment); recoverFoodStock(grass, 0.5, state.environment); }
  assert(grass.growth <= 0.16 && grass.foodStock < 1);
  for (const key of Object.keys(state.environment)) setEnvironmentLevel(state, key, 'good');
  for (let i=0;i<240;i++) { updateProducerGrowth(grass, 0.5, state.environment); recoverFoodStock(grass, 0.5, state.environment); }
  assert.equal(grass.growth, 1); assert.equal(grass.foodStock, 3);
  assert.equal(state.organisms.length, 1);
});
test('poor air lowers animal activity and good air restores default speed', () => {
  const state = createGameState(); assert.equal(animalActivity(state.environment), 1);
  setEnvironmentLevel(state, 'air', 'bad'); assert(animalActivity(state.environment) < 0.5);
  setEnvironmentLevel(state, 'air', 'good'); assert.equal(animalActivity(state.environment), 1);
});
test('same population under poor environment has less feeding and more shortage', () => {
  const layout = { footprints: Object.fromEntries(Object.keys(speciesProfiles).map(id=>[id,{halfWidth:0.02,above:0.1,below:0.03}])), blockedRects: [] };
  function run(bad) {
    const state=scene(['grass','grasshopper']); const system=createFeedingSystem();
    if(bad) for(const key of Object.keys(state.environment)) setEnvironmentLevel(state,key,'bad');
    for(let i=0;i<3600;i++) system.update(state,1/30,layout);
    return {state, stats:system.getDiagnostics()};
  }
  const good=run(false), bad=run(true);
  assert(bad.stats.plantMeals < good.stats.plantMeals);
  assert(bad.state.organisms[1].foodShortageDuration > good.state.organisms[1].foodShortageDuration);
});
test('stability rewards functional variety over more copies and penalizes losses and missing food', () => {
  const diverse=scene(['grass','grass','grasshopper','frog','mushroom','oak']);
  const copies=scene(Array(30).fill('frog'));
  const good=evaluateStability(diverse);
  assert(good.score > evaluateStability(copies).score);
  assert(good.breakdown.composition > evaluateStability(copies).breakdown.composition);
  const missing=scene(['grasshopper','frog','mushroom','oak']);
  assert(evaluateStability(missing).breakdown.food < good.breakdown.food);
  const loss=evaluateStability(diverse, {grass:2,grasshopper:10,frog:1,mushroom:1,oak:1});
  assert(loss.breakdown.balance < good.breakdown.balance);
  for(const key of Object.keys(diverse.environment)) setEnvironmentLevel(diverse,key,'bad');
  assert(evaluateStability(diverse).score < good.score);
  assert.equal(evaluateStability(scene([])).score,0);
});
