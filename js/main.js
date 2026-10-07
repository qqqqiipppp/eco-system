import { createGameState, createUIState } from './state/game-state.js';
import { renderDashboard, renderCards, renderSelection, feedingFeedback } from './ui/render.js';
import { createOrganismLayer } from './ui/organism-layer.js';
import { placeOrganism, placementMessage } from './systems/placement.js';
import { createWanderSystem } from './systems/wander.js';
import { createUpdateLoop } from './systems/update-loop.js';
import { speciesProfiles } from '../data/interaction-config.js';
import { createFeedingSystem } from './systems/feeding.js';
import { foodResourceConfig } from '../data/ecology-config.js';
import { growthSuitability, animalActivity, setEnvironmentLevel } from './systems/environment.js';
import { createStabilitySystem } from './systems/stability.js';
import { bindEnvironmentPanel } from './ui/environment-panel.js';
import { ecologyConfig } from '../data/ecology-config.js';
import { growthConfig } from '../data/environment-config.js';
import { createEventSystem } from './systems/events.js';
import { createEventView } from './ui/event-view.js';
import { executeManagement, availableManagement } from './systems/management.js';

// Readable export for module-level checks; no global debug API or persistence.
export const gameState = createGameState();
export const feedingSystem = createFeedingSystem();
export const eventSystem = createEventSystem();
const uiState = createUIState();
const stabilitySystem = createStabilitySystem();

try {
  const forest = document.querySelector('.forest');
  const scene = createOrganismLayer(forest, () => gameState.organisms);
  const wander = createWanderSystem();
  const eventView = createEventView(gameState, scene, (eventId, answer) => {
    const response = eventSystem.acknowledge(gameState,eventId,answer);
    renderDashboard(gameState);
    return response;
  }, {
    options: eventId => availableManagement(gameState,eventId),
    execute: (actionId,eventId) => {
      const response = executeManagement(gameState,actionId,eventId);
      if (response.ok) {
        eventSystem.refresh(gameState);
        stabilitySystem.update(gameState);
        renderDashboard(gameState);
        loop.refresh();
      }
      return response;
    },
  });
  const loop = createUpdateLoop({
    hasWork: () => gameState.managementEffects.length > 0 || Object.keys(gameState.managementCooldowns).length > 0 || eventSystem.needsTick() || gameState.organisms.some(instance => speciesProfiles[instance.speciesId]?.wanders || instance.foodStock < foodResourceConfig[instance.speciesId]?.maximum * (instance.growth ?? 1) || (instance.growth !== undefined && Math.abs(instance.growth - Math.max(growthConfig.minimumGrowth, growthSuitability(instance.speciesId, gameState.environment))) > 0.001)),
    update: dt => {
      const result = feedingSystem.update(gameState, dt, scene.getLayout());
      wander.forget(result.removedIds);
      result.moved.push(...wander.update(gameState.organisms, dt, scene.getLayout(), animalActivity(gameState.environment)));
      if (result.ticked) stabilitySystem.update(gameState, ecologyConfig.tickSeconds);
      result.eventTicked = result.ticked && eventSystem.update(gameState, ecologyConfig.tickSeconds, result.feedingEvents);
      return result;
    },
    render: result => {
      scene.remove(result.removedIds);
      scene.paintChanges(result.moved);
      if (result.ticked) scene.showStates(result.updated);
      if (result.ticked) renderDashboard(gameState);
      if (result.eventTicked || result.removedIds.length) eventView.render();
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
    if (event.target.closest('[data-event-marker]')) return;
    const result = placeOrganism(gameState, uiState.selectedSpeciesId, scene.readInput(event), scene.getLayout());
    scene.showFeedback(placementMessage(result), result.ok);
    if (!result.ok) return;
    scene.add(result.instance, true);
    eventSystem.refresh(gameState);
    eventView.render();
    stabilitySystem.update(gameState);
    renderDashboard(gameState);
    loop.refresh();
  });
  stabilitySystem.update(gameState);
  bindEnvironmentPanel(gameState, (factor, level) => {
    if (!setEnvironmentLevel(gameState, factor, level)) return;
    stabilitySystem.update(gameState);
    renderDashboard(gameState);
    eventSystem.refresh(gameState);
    eventView.render();
    loop.refresh();
  });
  renderDashboard(gameState);
  renderCards(gameState, selectSpecies);
  renderSelection(uiState, clearSelection);
  gameState.organisms.forEach(instance => scene.add(instance));
  eventView.render();
  loop.refresh();
} catch (error) {
  document.querySelector('#load-error').hidden = false;
  console.error('Forest screen initialization failed.', error);
}
