import {createCollectionView} from './ui/collection-view.js';
import {createForestFlow} from './ui/forest-flow.js';
import {createLearningGoalView} from './ui/learning-goal-view.js';
import {bindDialogPause} from './ui/dialog-pause.js';
import {recordError,watchErrors} from './ui/error-log.js';
import {watchForUpdates} from './ui/update-check.js';
import {studentChange} from './ui/student-status.js';
import {recordSpeciesObservation,syncCollection} from './state/collection-state.js';
import {createNextForest} from './systems/replay.js';
import { createHelpView } from './ui/help-view.js';
import { createGuideAdapter } from './adapters/guide-preference.js';
import { updateForestGoal } from './systems/forest-progress.js';
import { createSaveService } from './services/save-service.js';
import { createLocalAdapter,createNoSaveAdapter,createChapterProgressAdapter,createChapterStageAdapter } from './adapters/local-storage.js';
import {createStageGameState,updateStage,catchObservation,careFor,buyCheck,payFor,collectTrash,prepareFor} from './systems/chapter-stage.js';
import {organismById as speciesById} from '../data/organisms.js';
import {particle} from '../data/student-text.js';
import {createChapterView} from './ui/chapter-view.js';
import {createChapterWebView} from './ui/chapter-web-view.js';
import {stages,stageById,breeding} from '../data/chapters.js';
import {sceneSpaces} from '../data/forest-spaces.js';
import {environmentEventDefinitions} from '../data/environment-events.js';
import { createForestView, showSaveStatus } from './ui/forest-view.js';
import { createGameState, createUIState } from './state/game-state.js';
import { renderDashboard, renderCards, renderSelection, feedingFeedback } from './ui/render.js';
import { createOrganismLayer } from './ui/organism-layer.js';
import {studentPlacementMessage} from './ui/student-guidance.js';
import {placeNearestOrganism} from './systems/placement-target.js';
import { createWanderSystem } from './systems/wander.js';
import { createUpdateLoop } from './systems/update-loop.js';
import { speciesProfiles } from '../data/interaction-config.js';
import { createFeedingSystem } from './systems/feeding.js';
import { foodResourceConfig } from '../data/ecology-config.js';
import { growthSuitability, animalActivity } from './systems/environment.js';
import { createStabilitySystem } from './systems/stability.js';
import { bindEnvironmentPanel } from './ui/environment-panel.js';
import { ecologyConfig } from '../data/ecology-config.js';
import { growthConfig } from '../data/environment-config.js';
import { createEventSystem } from './systems/events.js';
import { createEventView } from './ui/event-view.js';
import { completeActivity } from './systems/activities.js';
import { createActivityView } from './ui/activity-view.js';
import { executeManagement, validateManagement, availableManagement, availableEnvironmentalRecovery } from './systems/management.js';
import {createPopulationView} from './ui/population-view.js';
import {removeOrganism} from './systems/lifecycle.js';
import {populationMessage} from './systems/population.js';
import {hasDevelopmentWork} from './systems/development.js';
import {hasEnvironmentEventWork,chooseEnvironmentObservation} from './systems/environment-events.js';
import {claimEnvironmentStudy,claimRecoverySupport} from './systems/point-economy.js';
import {capForestAspect} from './ui/forest-aspect.js';

// Module exports support integration checks; there is no global debug API.
// Chapter mode is what opens first; ?mode=forest is the regular forest. Chapter
// mode plays short stages and leaves the regular forest save untouched.
const chapterMode=new URLSearchParams(location.search).get('mode')!=='forest';
const chapterProgress=chapterMode?createChapterProgressAdapter():null;
export const gameState = createGameState();
export const saveService = createSaveService({adapter:chapterMode?createNoSaveAdapter():createLocalAdapter(),getState:()=>gameState,getEventMemory:()=>eventSystem.exportMemory(),onStatus:showSaveStatus});
const restored = saveService.load();
Object.assign(gameState,restored.state);
// A stage left half-played (reload, closed tab, sleeping tablet) comes back as
// it was; the student is then asked whether to go on or start it again.
const stageSave=chapterMode?createChapterStageAdapter():null;
const resumable=stageSave?.read(id=>Boolean(stageById[id])&&!chapterProgress.cleared().includes(id))||null;
if(chapterMode)Object.assign(gameState,resumable?resumable.state:createStageGameState(stages.find(s=>!chapterProgress.cleared().includes(s.stageId))||stages[0]));
// The fallen log is part of the scene from chapter 3 on; set before organisms are placed.
const setScene=s=>{sceneSpaces.log=Boolean(s.chapter&&stageById[s.chapter.stageId].chapter.number>=3);};
setScene(gameState);
export let feedingSystem = createFeedingSystem(gameState.simulationTime);
export let eventSystem = createEventSystem(gameState.simulationTime,resumable?.eventMemory??restored.eventMemory);
const uiState = createUIState();
let selectionPlaced=false;
let stabilitySystem = createStabilitySystem();

watchErrors();
watchForUpdates();
try {
  let flowView=null,learningGoalView=null;
  const forest = document.querySelector('.forest');
  if(chapterMode)capForestAspect(forest);
  const scene = createOrganismLayer(forest, () => gameState.organisms);
  let wander = createWanderSystem();
  let lastCheckpoint = gameState.simulationTime,lastStageSave=gameState.simulationTime;
  // Chapter mode keeps the stage being played: every few seconds of play and
  // whenever the page is hidden or closed. A cleared stage is not kept.
  function saveStage(){
    if(!chapterMode)return;
    if(gameState.chapter.cleared){stageSave.remove();return;}
    if(gameState.simulationTime<=0)return;
    lastStageSave=gameState.simulationTime;stageSave.write(gameState,eventSystem.exportMemory());
  }
  if(chapterMode){addEventListener('pagehide',saveStage);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveStage();});}
  let lastPopulationSequence=gameState.population.sequence;
  const populationButton=document.createElement('button');populationButton.id='population-open';populationButton.type='button';populationButton.textContent='생물 살펴보기';document.querySelector('.header-actions').append(populationButton);
  let chapterView=null;
  if(chapterMode){
    document.body.classList.add('chapter-mode');
    const webView=createChapterWebView(chapterProgress,{onComplete:()=>chapterView.webDone(),onGuide:id=>collectionView.openGuide(id,null)});
    chapterView=createChapterView(()=>gameState,{forest,notify:(text,ok)=>important(text,ok),cleared:()=>chapterProgress.cleared(),openWeb:n=>webView.open(n),webComplete:n=>webView.isComplete(n),onCatch:catchStageObservation,onCollect:collectStageTrash,onPrepare:prepareStage,onStage:id=>{stageSave.remove();installForest(createStageGameState(stageById[id]));},onRestart:()=>{stageSave.remove();installForest(createStageGameState(stageById[gameState.chapter.stageId]));},onCare:careStageEnvironment,onExit:()=>{location.search='?mode=forest';}});
  }else{
    const chapterButton=document.createElement('button');chapterButton.id='chapter-open';chapterButton.type='button';chapterButton.textContent='챕터 모드';
    chapterButton.addEventListener('click',()=>{location.href=location.pathname;});document.querySelector('.header-actions').append(chapterButton);
  }
  const populationView=createPopulationView(gameState,id=>{
    const record=removeOrganism(gameState,id,'release');if(!record)return;
    feedingSystem.forget([id]);wander.forget([id]);scene.remove([id]);scene.showFeedback(studentChange(record)||populationMessage(record),true);
    eventSystem.refresh(gameState);eventView.render();stabilitySystem.update(gameState);refreshProgress();renderDashboard(gameState);saveService.schedule();loop.refresh();
  },id=>{scene.setFocused(id);if(id&&recordSpeciesObservation(gameState,id))saveService.schedule();flowView?.render();},(id,instance)=>learningGoalView?.render(id,instance));
  learningGoalView=createLearningGoalView(gameState,{onChange:response=>{scene.showFeedback(response.message,response.ok);refreshProgress();saveService.schedule();flowView?.render();},onPlace:selectSpecies,onCare:()=>{const event=gameState.events.find(e=>e.status==='active'&&e.sourceType==='environment'&&gameState.environment[e.payload.factor]?.value<.4);if(event)eventView.open(event.eventId);else document.querySelector('#environment-open').click();}});
  scene.setInspectHandler(ids=>populationView.inspect(ids));
  const forestView = createForestView(gameState,restartGame);
  const helpView = createHelpView(createGuideAdapter());
  const collectionView=createCollectionView(gameState,{onActivity:openLockedActivity,onReplay:startNextForest,onPlace:selectSpecies,onReturn:source=>{const id=source.instanceId,live=id&&gameState.organisms.some(o=>o.instanceId===id);scene.setFocused(live?id:null);if(live)document.querySelector('[data-inspect-instance="'+id+'"]')?.focus({preventScroll:true});}});
  for(const [id,open]of [['population-guide','openGuide'],['population-web','openWeb']])document.querySelector('#'+id).addEventListener('click',()=>{const dialog=document.querySelector('#population-dialog'),source={instanceId:dialog.dataset.selectedInstanceId||null},speciesId=document.querySelector('#population-species').value;dialog.close();collectionView[open](speciesId,source);});
  function refreshProgress(seconds=0) {
    const cleared=!chapterMode&&updateForestGoal(gameState,seconds);
    forestView.render();collectionView.renderClear();flowView?.render();
    if(cleared&&!document.querySelector('dialog[open]'))document.querySelector('#goal-dialog').showModal();
    if(cleared)saveService.schedule();
  }
  const activityView = createActivityView(gameState,(activityId,answer) => {
    stabilitySystem.update(gameState);
    const response = completeActivity(gameState,activityId,answer);
    refreshProgress();
    saveService.schedule();
    if(response.unlocked) {
      renderCards(gameState,selectSpecies,openLockedActivity,putCardBack);
      renderSelection(uiState,clearSelection);
      flowView?.render();
    }
    renderDashboard(gameState);
    return response;
  },{onPlace:selectSpecies});
  function openLockedActivity(activityId) {
    clearSelection();
    if(!activityId){scene.showFeedback('이 카드는 추후 해금 예정이에요. 지금은 획득한 생물로 숲 목표를 진행해요.',false);return;}
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
  }, {onActivity:openLockedActivity,onWeb:id=>collectionView.openWeb(id)});
  const reading=bindDialogPause(()=>loop.refresh());
  const loop = createUpdateLoop({
    onError:recordError,
    isPaused:reading.isPaused,
    pauseForReducedMotion:!chapterMode,
    hasWork: () => gameState.organisms.length>0 || hasDevelopmentWork(gameState) || hasEnvironmentEventWork(gameState) || Object.values(gameState.decomposition.organicMatter).some(v=>v>0) || Object.values(gameState.population.introductions).some(v=>v.nextAt>gameState.simulationTime) || eventSystem.needsTick(),
    update: dt => {
      const result = feedingSystem.update(gameState, dt, scene.getLayout());
      wander.forget(result.removedIds);
      result.moved.push(...wander.update(gameState.organisms, dt, scene.getLayout(), animalActivity(gameState.environment)));
      if (result.ticked) stabilitySystem.update(gameState, ecologyConfig.tickSeconds);
      result.eventTicked = result.ticked && eventSystem.update(gameState, ecologyConfig.tickSeconds, result.feedingEvents);
      if(chapterMode&&result.ticked){const stage=updateStage(gameState,ecologyConfig.tickSeconds,result.feedingEvents);result.added.push(...stage.born);afterStageChange(stage);if(gameState.simulationTime-lastStageSave>=5)saveStage();}
      if(result.removedIds.length||result.added.length||result.developmentChanges.length){eventSystem.refresh(gameState);result.eventTicked=true;}
      if(result.ticked) {
        refreshProgress(ecologyConfig.tickSeconds);
        if(result.feedingEvents.length||result.added.length||result.removedIds.length||result.developmentChanges.length)saveService.schedule();
        if(gameState.simulationTime-lastCheckpoint>=15) { lastCheckpoint=gameState.simulationTime;saveService.schedule(); }
      }
      result.visualDelta=dt;
      return result;
    },
    render: result => {
      scene.remove(result.removedIds);
      for(const instance of result.added)scene.add(instance);
      scene.paintChanges(result.moved);
      if (result.ticked) scene.showStates(result.updated);
      scene.paintVisuals(gameState,result.visualDelta,result.visualWork);
      chapterView?.render();
      if (result.ticked) { renderDashboard(gameState); activityView.render(); environmentPanel.render();populationView.render(); }
      if (result.eventTicked || result.removedIds.length) eventView.render();
      let notice;
      if(gameState.population.sequence>lastPopulationSequence)for(const record of gameState.population.history)if(record.sequence>lastPopulationSequence&&record.mode!=='chapter-pair'&&['starvation','reproduction','natural_lifespan','life_stage_exit','colony_decline','replenishment'].includes(record.cause))notice=record;
      if(notice)scene.showFeedback(studentChange(notice)||populationMessage(notice),!['starvation','colony_decline'].includes(notice.cause));
      else if (result.feedingEvents.length&&!chapterMode&&performance.now()>=holdFeedbackUntil) scene.showFeedback(feedingFeedback(result.feedingEvents), true);
      lastPopulationSequence=gameState.population.sequence;
    },
  });
  // Births and pair news stay readable for a few seconds instead of being
  // replaced by the next "…을 먹었어요".
  let holdFeedbackUntil=0;
  function important(text,ok){scene.showFeedback(text,ok);holdFeedbackUntil=performance.now()+5000;}
  function catchStageObservation(offerId){
    const response=catchObservation(gameState,offerId);if(!response.ok)return response;
    chapterProgress.markObserved(response.offer.relationId);
    scene.showFeedback(chapterView.caughtMessage(response),response.bonus);
    afterStageChange(response);renderDashboard(gameState);chapterView.render();
    return response;
  }
  function prepareStage(choice){
    const response=prepareFor(gameState,choice);if(!response.ok)return;
    const name=response.speciesId&&speciesById[response.speciesId].name;
    if(response.removedId){
      feedingSystem.forget([response.removedId]);wander.forget([response.removedId]);scene.remove([response.removedId]);
      eventSystem.refresh(gameState);stabilitySystem.update(gameState);
      scene.showFeedback(`${particle(name,'을','를')} 한 마리 돌려보냈어요. 먹이 식물을 먹는 동물이 줄었어요.`,true);
    }else if(choice==='plant'){selectSpecies(response.speciesId);scene.showFeedback(`숲을 눌러 ${particle(name,'을','를')} 심어요.`,true);}
    else scene.showFeedback('날씨가 어떻게 숲을 바꾸는지 지켜봐요.',true);
    renderDashboard(gameState);chapterView.render();loop.refresh();
  }
  function collectStageTrash(trashId){
    const response=collectTrash(gameState,trashId);if(!response.ok)return response;
    scene.showFeedback(response.message,true);renderDashboard(gameState);chapterView.render();
    return response;
  }
  function careStageEnvironment(factor){
    const response=careFor(gameState,factor);scene.showFeedback(response.message,response.ok);
    if(response.ok){eventSystem.refresh(gameState);stabilitySystem.update(gameState);refreshProgress();renderDashboard(gameState);eventView.render();environmentPanel.render();loop.refresh();}
    chapterView.render();
  }
  function afterStageChange(response){
    if(response.eventStarted){
      const d=environmentEventDefinitions[response.eventStarted.kind];
      eventSystem.refresh(gameState);environmentPanel.render();renderDashboard(gameState);
      scene.showFeedback(`${d.name}: ${d.cause}`,false);
    }
    for(const child of response.born||[]){
      const rule=breeding.species[child.speciesId];
      important(`${speciesById[child.speciesId].name} ${particle(rule.young,'이','가')} 태어났어요! ${rule.cycle} (게임에서는 실제보다 시간을 짧게 줄였어요.)`,true);
    }
    if(response.cleared){chapterProgress.markCleared(gameState.chapter.stageId);stageSave.remove();}
  }
  function clearSelection() {
    const previousId = uiState.selectedSpeciesId;
    uiState.selectedSpeciesId = null;
    selectionPlaced=false;
    renderSelection(uiState, clearSelection);
    scene.showSelection(null);
    flowView?.render();
    document.querySelector(`[data-species-id="${previousId}"]`)?.focus();
  }
  // Tapping the chosen card again puts it back, but only before anything was
  // placed with it: after a placement the tap means "one more".
  function putCardBack(){if(!selectionPlaced)clearSelection();}
  // Esc puts a chosen card back, unless a dialog is open (it closes first).
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&uiState.selectedSpeciesId&&!document.querySelector('dialog[open]'))clearSelection();});
  function selectSpecies(speciesId) {
    uiState.selectedSpeciesId = speciesId;
    selectionPlaced=false;
    renderSelection(uiState, clearSelection);
    scene.showSelection(speciesId);
    flowView?.render();
    populationView.select(speciesId);
  }
  document.querySelector('#population-place').addEventListener('click',()=>{const id=document.querySelector('#population-species').value;document.querySelector('#population-dialog').close();selectSpecies(id);});
  forest.addEventListener('click', event => {
    if (event.target.closest('[data-event-marker]')) return;
    const input=scene.readInput(event);if(input.isUI||!input.isPlayArea)return;
    // Chapter mode is a shop: a card costs points, charged only once it is placed.
    const price=chapterMode&&uiState.selectedSpeciesId?buyCheck(gameState,uiState.selectedSpeciesId):null;
    if(price&&!price.ok){scene.showFeedback(price.message,false);return;}
    const result = placeNearestOrganism(gameState, uiState.selectedSpeciesId, input, scene.getLayout());
    scene.showFeedback(studentPlacementMessage(result), result.ok);
    if (!result.ok) return;
    if(price){payFor(gameState,uiState.selectedSpeciesId);chapterView.spent(price.price,result.instance);}
    selectionPlaced=true;
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
  const environmentPanel = bindEnvironmentPanel(gameState, {
    onStudy:(id,answer)=>{
      const response=claimEnvironmentStudy(gameState,id,answer);
      if(response.ok){eventSystem.refresh(gameState);renderDashboard(gameState);eventView.render();refreshProgress();saveService.schedule();loop.refresh();}
      return response;
    },
    onSupport:()=>{
      const response=claimRecoverySupport(gameState);
      if(response.ok){renderDashboard(gameState);eventView.render();refreshProgress();saveService.schedule();loop.refresh();}
      return response;
    },
    supportCareOption:factor=>validateManagement(gameState,['water','soil'].includes(factor)?factor==='water'?'water-care':'soil-care':'habitat-care',{sourceType:'environment',sourceId:factor}),
    onSupportCare:factor=>{
      const response=executeManagement(gameState,['water','soil'].includes(factor)?factor==='water'?'water-care':'soil-care':'habitat-care',{sourceType:'environment',sourceId:factor});
      if(response.ok){eventSystem.refresh(gameState);stabilitySystem.update(gameState);refreshProgress();renderDashboard(gameState);eventView.render();saveService.schedule();loop.refresh();}
      return response;
    },
    onEventChoice:(id,choice)=>{
      const response=chooseEnvironmentObservation(gameState,id,choice);
      if(response.ok){eventSystem.refresh(gameState);eventView.render();saveService.schedule();loop.refresh();}
      return response;
    },
    options:()=>availableEnvironmentalRecovery(gameState),
    execute:factor=>{
      const response=executeManagement(gameState,'habitat-care',{sourceType:'environment',sourceId:factor});
      if(response.ok){eventSystem.refresh(gameState);stabilitySystem.update(gameState);refreshProgress();renderDashboard(gameState);eventView.render();saveService.schedule();loop.refresh();}
      return response;
    },
  });
  // Development harness installs its environment controls at this explicit boundary.
  flowView=createForestFlow(gameState,{getSelection:()=>uiState.selectedSpeciesId,getPlacementConfirmed:()=>selectionPlaced,onActivity:openLockedActivity,onEvent:id=>eventView.open(id),onPlace:selectSpecies,onPopulation:()=>document.querySelector('#population-open').click(),onGoalInspect:action=>{clearSelection();if(action.id&&gameState.organisms.some(o=>o.instanceId===action.id))populationView.inspect([action.id]);else{document.querySelector('#population-open').click();populationView.select(action.speciesId||'grass');}}});
  renderDashboard(gameState);
  renderCards(gameState, selectSpecies, openLockedActivity, putCardBack);
  renderSelection(uiState, clearSelection);
  gameState.organisms.forEach(instance => scene.add(instance));
  scene.paintVisuals(gameState,0);
  eventSystem.refresh(gameState);
  refreshProgress();
  eventView.render();
  window.addEventListener('pagehide',()=>saveService.flush(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveService.flush(true)});
  function startNextForest(topic){
    const next=createNextForest(gameState,topic);if(!next.ok)return next;
    if(!saveService.replace(next.state))return {ok:false,message:'저장하지 못했어요. 지금 숲과 획득 기록은 그대로 유지했어요. 저장 공간을 확인한 뒤 다시 시도해 주세요.'};
    installForest(next.state);return {ok:true};
  }
  function restartGame() {
    if(!saveService.reset())return false;
    installForest(createGameState());return true;
  }
  function installForest(nextState,eventMemory) {
    loop.stop();
    for(const key of Object.keys(gameState))delete gameState[key];
    Object.assign(gameState,nextState);
    setScene(gameState);
    feedingSystem=createFeedingSystem();eventSystem=eventMemory?createEventSystem(gameState.simulationTime,eventMemory):createEventSystem();stabilitySystem=createStabilitySystem();wander=createWanderSystem();
    lastCheckpoint=0;lastStageSave=gameState.simulationTime;lastPopulationSequence=0;selectionPlaced=false;uiState.selectedSpeciesId=null;populationView.reset();
    document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    scene.reset();activityView.reset();eventView.reset();collectionView.reset();chapterView?.reset();
    stabilitySystem.update(gameState);refreshProgress();
    syncCollection(gameState);renderCards(gameState,selectSpecies,openLockedActivity,putCardBack);renderSelection(uiState,clearSelection);renderDashboard(gameState);
    gameState.organisms.forEach(instance=>scene.add(instance));eventSystem.refresh(gameState);eventView.render();loop.refresh();
    return true;
  }
  if(resumable)chapterView.resume(resumable);
  chapterView?.render();
  loop.refresh();
  helpView.showForNewGame(!chapterMode&&restored.status === 'new');
} catch (error) {
  document.querySelector('#load-error').hidden = false;
  console.error('Forest screen initialization failed.', error);recordError(error,'start');
}
