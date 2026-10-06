import { createGameState, createUIState } from './state/game-state.js';
import { renderDashboard, renderCards, renderSelection, feedingFeedback } from './ui/render.js';
import { createOrganismLayer } from './ui/organism-layer.js';
import { placeOrganism, placementMessage } from './systems/placement.js';
import { createWanderSystem } from './systems/wander.js';
import { createUpdateLoop } from './systems/update-loop.js';
import { speciesProfiles } from '../data/interaction-config.js';
import { createFeedingSystem } from './systems/feeding.js';
import { foodResourceConfig } from '../data/ecology-config.js';

// Readable export for module-level checks; no global debug API or persistence.
export const gameState = createGameState();
export const feedingSystem = createFeedingSystem();
const uiState = createUIState();

try {
  const forest = document.querySelector('.forest');
  const scene = createOrganismLayer(forest, () => gameState.organisms);
  const wander = createWanderSystem();
  const loop = createUpdateLoop({
    hasWork: () => gameState.organisms.some(instance => speciesProfiles[instance.speciesId]?.wanders || instance.foodStock < foodResourceConfig[instance.speciesId]?.maximum),
    update: dt => {
      const result = feedingSystem.update(gameState, dt, scene.getLayout());
      wander.forget(result.removedIds);
      result.moved.push(...wander.update(gameState.organisms, dt, scene.getLayout()));
      return result;
    },
    render: result => {
      scene.remove(result.removedIds);
      scene.paintChanges(result.moved);
      if (result.ticked) scene.showStates(result.updated);
      if (result.removedIds.length) renderDashboard(gameState);
      if (result.feedingEvents.length) scene.showFeedback(feedingFeedback(result.feedingEvents), true);
    },
  });
  function clearSelection() {
    const previousId = uiState.selectedSpeciesId;
    uiState.selectedSpeciesId = null;
    renderSelection(uiState, clearSelection);
    scene.showSelection(null);
    document.querySelector(`[data-species-id="${previousId}"]`)?.focus();
  }
  function selectSpecies(speciesId) {
    uiState.selectedSpeciesId = speciesId;
    renderSelection(uiState, clearSelection);
    scene.showSelection(speciesId);
  }
  forest.addEventListener('click', event => {
    const result = placeOrganism(gameState, uiState.selectedSpeciesId, scene.readInput(event), scene.getLayout());
    scene.showFeedback(placementMessage(result), result.ok);
    if (!result.ok) return;
    scene.add(result.instance, true);
    renderDashboard(gameState);
    loop.refresh();
  });
  renderDashboard(gameState);
  renderCards(gameState, selectSpecies);
  renderSelection(uiState, clearSelection);
  gameState.organisms.forEach(instance => scene.add(instance));
  loop.refresh();
} catch (error) {
  document.querySelector('#load-error').hidden = false;
  console.error('Forest screen initialization failed.', error);
}
