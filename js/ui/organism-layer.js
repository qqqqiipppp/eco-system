import { organismById } from '../../data/organisms.js';
import { speciesProfiles, placementConfig } from '../../data/interaction-config.js';
import { DEBUG_MODE, foodResourceConfig } from '../../data/ecology-config.js';

/** DOM adapter: creates each organism once and paints positions using transforms.
 * Geometry reads happen only on resize or input, never in the update loop.
 */
export function createOrganismLayer(forest, getOrganisms) {
  const layer = forest.querySelector('#organism-layer');
  const surface = forest.querySelector('#placement-surface');
  const guide = forest.querySelector('#placement-guide');
  const cursor = forest.querySelector('#placement-cursor');
  const feedback = forest.querySelector('#placement-feedback');
  const nodes = new Map();
  let layout;
  let feedbackTimer;
  let keyboardPosition = { x: 0.4, y: 0.72 };

  function paint(instance, direction) {
    const entry = nodes.get(instance.instanceId);
    if (!entry || !layout) return;
    entry.anchor.style.transform = `translate(${instance.position.x * layout.width}px, ${instance.position.y * layout.height}px)`;
    if (direction) entry.image.style.transform = `scaleX(${direction})`;
  }
  function measure() {
    const rect = surface.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const footprints = {};
    const sizes = {};
    // Preserve normalized anchors on rotation; shrink only placeholder artwork
    // on narrow screens so even a left-edge tree remains within the scene.
    const scale = Math.min(1, rect.width / 560);
    for (const [id, profile] of Object.entries(speciesProfiles)) {
      sizes[id] = { width: profile.width * scale, height: profile.height * scale };
      footprints[id] = { halfWidth: sizes[id].width / 2 / rect.width, above: sizes[id].height / rect.height, below: profile.labelHeight / rect.height };
    }
    const blockedRects = [...forest.querySelectorAll('[data-scene-ui]')].filter(element => element.getClientRects().length).map(element => {
      const box = element.getBoundingClientRect();
      return { left: (box.left - rect.left) / rect.width, right: (box.right - rect.left) / rect.width, top: (box.top - rect.top) / rect.height, bottom: (box.bottom - rect.top) / rect.height };
    });
    layout = { width: rect.width, height: rect.height, sizes, footprints, blockedRects };
    for (const instance of getOrganisms()) {
      const entry = nodes.get(instance.instanceId);
      if (entry) sizeObject(entry.anchor, instance.speciesId);
      paint(instance);
    }
  }
  function sizeObject(anchor, speciesId) {
    const size = layout.sizes[speciesId];
    anchor.style.setProperty('--sprite-width', `${size.width}px`);
    anchor.style.setProperty('--sprite-height', `${size.height}px`);
  }
  function add(instance, animate = false) {
    if (nodes.has(instance.instanceId)) return;
    const definition = organismById[instance.speciesId];
    const anchor = document.createElement('div');
    anchor.className = 'organism-object';
    anchor.dataset.instanceId = instance.instanceId;
    anchor.dataset.speciesId = instance.speciesId;
    sizeObject(anchor, instance.speciesId);
    const visual = document.createElement('div');
    visual.className = `organism-visual${animate ? ' organism-enter' : ''}`;
    const image = document.createElement(definition.image ? 'img' : 'span');
    if (definition.image) {
      image.src = definition.image;
      image.alt = '';
      image.draggable = false;
    } else {
      image.className = 'organism-placeholder';
      image.textContent = definition.placeholder;
      image.setAttribute('aria-hidden', 'true');
    }
    const name = document.createElement('span');
    name.className = 'organism-name';
    name.textContent = definition.name;
    visual.append(image, name);
    anchor.append(visual);
    layer.append(anchor);
    let debug;
    if (DEBUG_MODE) {
      debug = document.createElement('span');
      debug.className = 'organism-debug';
      debug.append(document.createTextNode(''));
      visual.append(debug);
    }
    nodes.set(instance.instanceId, { anchor, image, debug });
    paint(instance);
    showState(instance);
  }
  function showState(instance) {
    const entry = nodes.get(instance.instanceId);
    if (!entry) return;
    if (instance.growth !== undefined && entry.growth !== instance.growth) {
      entry.image.style.transform = `scale(${0.65 + instance.growth * 0.35})`;
      entry.image.style.transformOrigin = '50% 100%';
      entry.growth = instance.growth;
    }
    const eating = instance.behaviorState === 'eat';
    const depleted = foodResourceConfig[instance.speciesId] && instance.foodStock < foodResourceConfig[instance.speciesId].portion;
    if (entry.eating !== eating) { entry.anchor.classList.toggle('is-eating', eating); entry.eating = eating; }
    if (entry.depleted !== Boolean(depleted)) { entry.anchor.classList.toggle('is-depleted', Boolean(depleted)); entry.depleted = Boolean(depleted); }
    if (DEBUG_MODE) {
      const text = `${instance.instanceId} / ${instance.speciesId}\n${instance.behaviorState || 'static'} → ${instance.targetInstanceId || '-'}\nhunger:${instance.hunger?.toFixed(2) ?? '-'} stock:${instance.foodStock?.toFixed(2) ?? '-'}`;
      if (entry.debug.firstChild.data !== text) entry.debug.firstChild.data = text;
    }
  }
  function remove(instanceIds) {
    for (const id of instanceIds) { nodes.get(id)?.anchor.remove(); nodes.delete(id); }
  }
  function showSelection(speciesId) {
    const profile = speciesProfiles[speciesId];
    guide.hidden = !profile;
    forest.classList.toggle('is-placing', Boolean(profile));
    if (!profile) {
      cursor.hidden = true;
      surface.setAttribute('aria-label', '숲 배치 영역. 먼저 아래에서 생물 카드를 선택하세요.');
      return;
    }
    const zone = placementConfig.zones[profile.zone];
    guide.style.left = `${zone.left * 100}%`;
    guide.style.top = `${zone.top * 100}%`;
    guide.style.width = `${(zone.right - zone.left) * 100}%`;
    guide.style.height = `${(zone.bottom - zone.top) * 100}%`;
    surface.setAttribute('aria-label', `${organismById[speciesId].name} 배치 영역. 방향키로 위치를 정하고 Enter 키로 배치하세요.`);
  }
  function showFeedback(message, ok) {
    clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.dataset.result = ok ? 'success' : 'error';
    feedback.hidden = false;
    feedbackTimer = setTimeout(() => { feedback.hidden = true; }, 2800);
  }
  function readInput(event) {
    const rect = surface.getBoundingClientRect();
    const position = event.detail === 0 ? { ...keyboardPosition } : { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    return { position, isPlayArea: forest.contains(event.target), isUI: Boolean(event.target.closest('[data-scene-ui]')) };
  }
  function moveCursor(event) {
    const steps = { ArrowLeft: [-0.025, 0], ArrowRight: [0.025, 0], ArrowUp: [0, -0.025], ArrowDown: [0, 0.025] };
    if (!steps[event.key]) return;
    event.preventDefault();
    const [dx, dy] = steps[event.key];
    keyboardPosition = { x: Math.max(0, Math.min(1, keyboardPosition.x + dx)), y: Math.max(0, Math.min(1, keyboardPosition.y + dy)) };
    cursor.hidden = false;
    cursor.style.left = `${keyboardPosition.x * 100}%`;
    cursor.style.top = `${keyboardPosition.y * 100}%`;
  }
  surface.addEventListener('keydown', moveCursor);
  surface.addEventListener('pointerdown', () => { cursor.hidden = true; });
  const observer = new ResizeObserver(measure);
  observer.observe(forest);
  window.addEventListener('resize', measure);
  measure();
  return {
    add, remove, showSelection, showFeedback, readInput,
    reset() { remove([...nodes.keys()]); clearTimeout(feedbackTimer); feedback.hidden=true; keyboardPosition={x:0.4,y:0.72}; showSelection(null); },
    showStates: instances => { for (const instance of instances) showState(instance); },
    getLayout: () => layout,
    getEventAnchor: instanceId => nodes.get(instanceId)?.anchor,
    paintChanges: changed => { for (const { instance, direction } of changed) paint(instance, direction); },
    dispose() { observer.disconnect(); window.removeEventListener('resize', measure); clearTimeout(feedbackTimer); },
  };
}
