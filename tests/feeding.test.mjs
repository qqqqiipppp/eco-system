import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../js/state/game-state.js';
import { createOrganismInstance } from '../js/state/organism-instance.js';
import { createFeedingSystem } from '../js/systems/feeding.js';
import { createWanderSystem } from '../js/systems/wander.js';
import { recoverFoodStock, consumeFoodStock } from '../js/systems/food-resources.js';
import { foodRelations } from '../data/food-relations.js';
import { speciesProfiles } from '../data/interaction-config.js';

const layout = { footprints: Object.fromEntries(Object.keys(speciesProfiles).map(id => [id, { halfWidth: 0.025, above: 0.12, below: 0.04 }])), blockedRects: [] };
function scenario(counts) {
  const state = createGameState();
  state.organisms = [];
  let index = 0;
  for (const [species, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) state.organisms.push(createOrganismInstance(species, `test-${index++}`, { x: 0.2 + (i % 7) * 0.065, y: species === 'grass' ? 0.74 : 0.70 }));
  }
  const feeding = createFeedingSystem();
  let seed = 31;
  const wander = createWanderSystem(() => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; });
  const history = [];
  function run(seconds) {
    for (let i = 0; i < seconds * 30; i++) {
      const result = feeding.update(state, 1 / 30, layout);
      wander.forget(result.removedIds);
      wander.update(state.organisms, 1 / 30, layout);
      history.push(...result.feedingEvents);
      const liveIds = new Set(state.organisms.map(item => item.instanceId));
      assert(state.organisms.every(item => !item.targetInstanceId || liveIds.has(item.targetInstanceId)));
      assert(state.organisms.every(item => Number.isFinite(item.position.x) && item.position.x >= 0 && item.position.x <= 1));
    }
  }
  return { state, feeding, run, history };
}

test('relation arrows identify food -> consumer and omit rabbit/decomposer links', () => {
  assert.deepEqual(foodRelations.map(edge => [edge.sourceSpeciesId, edge.targetSpeciesId]), [['grass', 'grasshopper'], ['grasshopper', 'frog']]);
});
test('A: 3 grass + 2 grasshoppers consume renewable stock, leaving plants alive', () => {
  const sim = scenario({ grass: 3, grasshopper: 2 });
  sim.run(40);
  assert(sim.feeding.getDiagnostics().plantMeals > 0);
  assert.equal(sim.state.organisms.filter(item => item.speciesId === 'grass').length, 3);
  assert(sim.state.organisms.some(item => item.speciesId === 'grass' && item.foodStock < 3));
  assert(sim.state.organisms.some(item => item.lastSuccessfulFeedingAt > 0));
});
test('B: 3 grass + 3 grasshoppers + 1 frog remove prey and relieve frog hunger', () => {
  const sim = scenario({ grass: 3, grasshopper: 3, frog: 1 });
  sim.run(55);
  assert(sim.feeding.getDiagnostics().predations > 0);
  assert(sim.state.organisms.filter(item => item.speciesId === 'grasshopper').length < 3);
  assert(sim.state.organisms.find(item => item.speciesId === 'frog').lastSuccessfulFeedingAt > 0);
});
for (const [name, counts] of [['C', { grasshopper: 2 }], ['D', { frog: 2 }]]) {
  test(`${name}: missing food retries search without death or invalid references`, () => {
    const sim = scenario(counts);
    sim.run(90);
    assert.equal(sim.state.organisms.length, 2);
    assert(sim.feeding.getDiagnostics().searches > 10);
    assert(sim.state.organisms.every(item => item.foodShortageDuration > 30 && item.hunger <= 1 && item.lastSuccessfulFeedingAt === null));
  });
}
test('E: 30 mixed organisms; low-frequency species-only searches and no natural growth', () => {
  const sim = scenario({ grass: 10, grasshopper: 14, frog: 6 });
  sim.run(90);
  const stats = sim.feeding.getDiagnostics();
  assert.equal(stats.ticks, 180);
  assert(stats.plantMeals > 0 && stats.predations > 0);
  assert(stats.searches < stats.ticks * 20);
  assert(stats.candidateChecks < stats.searches * 30);
  assert(sim.state.organisms.length <= 30);
  assert.deepEqual(sim.state.metrics, { stability: null, points: 0 });
  console.log('E diagnostics:', stats, 'remaining:', sim.state.organisms.length);
});
test('depleted plant cannot be consumed, then recovers and is usable again', () => {
  const grass = createOrganismInstance('grass', 'plant', { x: 0.4, y: 0.72 });
  for (let i = 0; i < 3; i++) assert(consumeFoodStock(grass));
  assert.equal(consumeFoodStock(grass), false);
  assert.equal(grass.foodStock, 0);
  recoverFoodStock(grass, 10);
  assert.equal(consumeFoodStock(grass), false);
  recoverFoodStock(grass, 10);
  assert(consumeFoodStock(grass));
  recoverFoodStock(grass, 10000);
  assert.equal(grass.foodStock, 3);
});
test('competing frogs consume one prey once and clear each others stale targets', () => {
  const sim = scenario({ grasshopper: 1, frog: 2 });
  const prey = sim.state.organisms[0];
  for (const frog of sim.state.organisms.filter(item => item.speciesId === 'frog')) {
    frog.position = { ...prey.position }; frog.hunger = 1;
  }
  sim.run(30);
  assert.equal(sim.feeding.getDiagnostics().predations, 1);
  assert.equal(sim.state.organisms.length, 2);
  assert(sim.state.organisms.every(item => item.targetInstanceId === null));
});
test('pursuit times out safely when screen obstacles block all movement', () => {
  const sim = scenario({ grass: 1, grasshopper: 1 });
  const insect = sim.state.organisms[1];
  insect.hunger = 1;
  insect.position.x = 0.52;
  for (let i = 0; i < 900; i++) {
    sim.feeding.update(sim.state, 1 / 30, { ...layout, blockedRects: [{ left: 0.45, right: 0.5, top: 0, bottom: 1 }] });
  }
  assert.equal(insect.lastSuccessfulFeedingAt, null);
  assert(sim.feeding.getDiagnostics().searches >= 2);
  assert(Number.isFinite(insect.hunger));
});
test('hungry insects skip depleted grass, then feed after recovery without deleting it', () => {
  const sim = scenario({ grass: 1, grasshopper: 2 });
  sim.state.organisms[0].foodStock = 0;
  for (const insect of sim.state.organisms.slice(1)) insect.hunger = 1;
  sim.run(8);
  assert.equal(sim.feeding.getDiagnostics().plantMeals, 0);
  sim.run(30);
  assert(sim.feeding.getDiagnostics().plantMeals > 0);
  assert.equal(sim.state.organisms.filter(item => item.speciesId === 'grass').length, 1);
  assert(sim.state.organisms[0].foodStock >= 0);
});
