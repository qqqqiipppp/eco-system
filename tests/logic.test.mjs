import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../js/state/game-state.js';
import { placeOrganism, validatePlacement, isPositionAllowed } from '../js/systems/placement.js';
import { createWanderSystem } from '../js/systems/wander.js';
import { placementConfig, speciesProfiles } from '../data/interaction-config.js';

const layout = {
  footprints: Object.fromEntries(Object.keys(speciesProfiles).map(id => [id, { halfWidth: 0.025, above: 0.12, below: 0.04 }])),
  blockedRects: [{ left: 0.73, right: 1, top: 0.2, bottom: 0.8 }],
};
const input = (x = 0.4, y = 0.72) => ({ position: { x, y }, isPlayArea: true, isUI: false });

test('rejects absent selection, unacquired species, invalid coordinates and UI without mutations', () => {
  const state = createGameState();
  // These geometry/motion scenarios explicitly use already unlocked cards.
  state.inventory.forEach(item => { item.acquired = true; });
  const initial = structuredClone(state);
  assert.equal(validatePlacement(state, null, input(), layout).reason, 'selection');
  assert.equal(validatePlacement(state, 'unknown', input(), layout).ok, false);
  for (const bad of [input(-1), input(1.1), input(NaN), input(Infinity), input(0.4, 0.2), { ...input(), isUI: true }, { ...input(), isPlayArea: false }]) {
    assert.equal(placeOrganism(state, 'rabbit', bad, layout).ok, false);
  }
  assert.deepEqual(state, initial);
  state.inventory.find(item => item.speciesId === 'rabbit').acquired = false;
  assert.equal(placeOrganism(state, 'rabbit', input(), layout).reason, 'inventory');
});

test('ground rules, sprite/UI intersection, and large-plant spacing', () => {
  const state = createGameState();
  // These geometry/motion scenarios explicitly use already unlocked cards.
  state.inventory.forEach(item => { item.acquired = true; });
  assert.equal(validatePlacement(state, 'oak', input(0.4, 0.60), layout).ok, false);
  assert.equal(validatePlacement(state, 'rabbit', input(0.4, 0.60), layout).ok, true);
  assert.equal(validatePlacement(state, 'mushroom', input(0.4, 0.72), layout).ok, true);
  assert.equal(validatePlacement(state, 'oak', input(0.25, 0.73), layout).reason, 'overlap');
  const covered = { ...layout, blockedRects: [{ left: 0.41, right: 0.6, top: 0.5, bottom: 0.8 }] };
  assert.equal(isPositionAllowed('rabbit', { x: 0.4, y: 0.72 }, covered), false);
});

test('duplicate species receive unique minimal instances; permissions survive; cap is enforced', () => {
  const state = createGameState();
  // These geometry/motion scenarios explicitly use already unlocked cards.
  state.inventory.forEach(item => { item.acquired = true; });
  const inventory = structuredClone(state.inventory);
  while (state.organisms.length < placementConfig.maxOrganisms) {
    const result = placeOrganism(state, 'rabbit', input(), layout);
    assert.equal(result.ok, true);
    assert.deepEqual(Object.keys(result.instance).sort(), ['instanceId', 'position', 'speciesId']);
    assert.deepEqual(result.instance.position, { x: 0.4, y: 0.72 });
  }
  assert.equal(placeOrganism(state, 'rabbit', input(), layout).reason, 'limit');
  assert.equal(new Set(state.organisms.map(item => item.instanceId)).size, 30);
  assert.deepEqual(state.inventory, inventory);
  assert.deepEqual(state.metrics, { stability: null, points: 0 });
});

test('wander walks, pauses, reverses and stays inside screen rules; plants never move', () => {
  const state = createGameState();
  // These geometry/motion scenarios explicitly use already unlocked cards.
  state.inventory.forEach(item => { item.acquired = true; });
  const plantSnapshot = structuredClone(state.organisms);
  const animal = placeOrganism(state, 'rabbit', input(0.685, 0.72), layout).instance;
  const wander = createWanderSystem(() => 0.75);
  let moving = 0, paused = 0;
  const directions = new Set();
  // Ten minutes of deterministic updates, including repeated boundary contacts.
  for (let i = 0; i < 18000; i += 1) {
    const changed = wander.update(state.organisms, 1 / 30, layout);
    if (changed.length) { moving += 1; directions.add(changed[0].direction); } else paused += 1;
    assert.equal(isPositionAllowed('rabbit', animal.position, layout), true);
  }
  assert(moving > 0 && paused > 0);
  assert.equal(directions.size, 2);
  assert.deepEqual(state.organisms.slice(0, 3), plantSnapshot);
  assert.deepEqual(Object.keys(animal).sort(), ['instanceId', 'position', 'speciesId']);
});
