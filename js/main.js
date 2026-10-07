import { updateForestGoal } from './systems/forest-progress.js';
import { createSaveService } from './services/save-service.js';
import { createLocalAdapter } from './adapters/local-storage.js';
import { createForestView, showSaveStatus } from './ui/forest-view.js';
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
import { completeActivity } from './systems/activities.js';
import { createActivityView } from './ui/activity-view.js';
import { executeManagement, availableManagement } from './systems/management.js';

// Module exports support integration checks; there is no global debug API.
export const gameState = createGameState();
export const saveService = createSaveService({adapter:createLocalAdapter(),getState:()=>gameState,getEventMemory:()=>eventSystem.exportMemory(),onStatus:showSaveStatus});
const restored = saveService.load();
Object.assign(gameState,restored.state);
export let feedingSystem = createFeedingSystem(gameState.simulationTime);
export let eventSystem = createEventSystem(gameState.simulationTime,restored.eventMemory);
const uiState = createUIState();
let stabilitySystem = createStabilitySystem();

try {
  const forest = document.querySelector('.forest');
  const scene = createOrganismLayer(forest, () => gameState.organisms);
  let wander = createWanderSystem();
  let lastCheckpoint = gameState.simulationTime;
  const forestView = createForestView(gameState,restartGame);
  function refreshProgress(seconds=0) {
    const cleared=updateForestGoal(gameState,seconds);
    forestView.render();
    if(cleared)saveService.schedule();
  }
  const activityView = createActivityView(gameState,(activityId,answer) => {
    stabilitySystem.update(gameState);
    const response = completeActivity(gameState,activityId,answer);
    refreshProgress();
    saveService.schedule();
    if(response.unlocked) {
      renderCards(gameState,selectSpecies,openLockedActivity);
      renderSelection(uiState,clearSelection);
    }
    renderDashboard(gameState);
    return response;
  });
  function openLockedActivity(activityId) {
    clearSelection();
    activityView.open(activityId);
  }
  const eventView = createEventView(gameState, scene, (eventId, answer) => {
    const response = eventSystem.acknowledge(gameState,eventId,answer);
    refreshProgress();
    if(response.ok)saveService.schedule();
    renderDashboard(gameState);
    return response;
  }, {
    options: eventId => availableManagement(gameState,eventId),
    execute: (actionId,eventId) => {
      const response = executeManagement(gameState,actionId,eventId);
      if (response.ok) {
        eventSystem.refresh(gameState);
        stabilitySystem.update(gameState);
        refreshProgress();
        saveService.schedule();
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
      if(result.ticked) {
        refreshProgress(ecologyConfig.tickSeconds);
        if(result.feedingEvents.length)saveService.schedule();
        if(gameState.simulationTime-lastCheckpoint>=15) { lastCheckpoint=gameState.simulationTime;saveService.schedule(); }
      }
      return result;
    },
    render: result => {
      scene.remove(result.removedIds);
      scene.paintChanges(result.moved);
      if (result.ticked) scene.showStates(result.updated);
      if (result.ticked) { renderDashboard(gameState); activityView.render(); }
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
    refreshProgress();
    saveService.schedule();
    renderDashboard(gameState);
    loop.refresh();
  });
  stabilitySystem.update(gameState);
  bindEnvironmentPanel(gameState, (factor, level) => {
    if (!setEnvironmentLevel(gameState, factor, level)) return;
    saveService.schedule();
    stabilitySystem.update(gameState);
    refreshProgress();
    renderDashboard(gameState);
    eventSystem.refresh(gameState);
    eventView.render();
    loop.refresh();
  });
  renderDashboard(gameState);
  renderCards(gameState, selectSpecies, openLockedActivity);
  renderSelection(uiState, clearSelection);
  gameState.organisms.forEach(instance => scene.add(instance));
  eventSystem.refresh(gameState);
  refreshProgress();
  eventView.render();
  window.addEventListener('pagehide',()=>saveService.flush(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveService.flush(true)});
  function restartGame() {
    if(!saveService.reset())return false;
    loop.stop();
    for(const key of Object.keys(gameState))delete gameState[key];
    Object.assign(gameState,createGameState());
    feedingSystem=createFeedingSystem();eventSystem=createEventSystem();stabilitySystem=createStabilitySystem();wander=createWanderSystem();
    lastCheckpoint=0;uiState.selectedSpeciesId=null;
    document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    scene.reset();activityView.reset();eventView.reset();
    stabilitySystem.update(gameState);refreshProgress();
    renderCards(gameState,selectSpecies,openLockedActivity);renderSelection(uiState,clearSelection);renderDashboard(gameState);
    gameState.organisms.forEach(instance=>scene.add(instance));eventSystem.refresh(gameState);eventView.render();loop.refresh();
    return true;
  }
  loop.refresh();
} catch (error) {
  document.querySelector('#load-error').hidden = false;
  console.error('Forest screen initialization failed.', error);
}
