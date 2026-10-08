import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {goalPresentation,nextAction} from '../js/systems/goal-guidance.js';
import {evaluateForestGoal,updateForestGoal} from '../js/systems/forest-progress.js';
import {forestGoal} from '../data/forest-goal.js';
import {createStabilitySystem} from '../js/systems/stability.js';
import {setEnvironmentLevel,growthSuitability} from '../js/systems/environment.js';
import {executeManagement,availableEnvironmentalRecovery} from '../js/systems/management.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {createGuideAdapter} from '../js/adapters/guide-preference.js';
import {completeActivity} from '../js/systems/activities.js';

const organism=(id,i)=>createOrganismInstance(id,'test-'+i,{x:.4,y:.74});
test('six goal groups match live clear checks, expose exact counts and 30-second hold',()=>{
 const s=createGameState(),stability=createStabilitySystem();stability.update(s);
 const p=goalPresentation(s),goal=evaluateForestGoal(s);assert.equal(p.total,6);assert.equal(p.groups.filter(g=>g.id!=='hold').every(g=>g.ok===goal.checks.find(c=>c.id===g.id).ok),true);
 assert.match(p.groups.find(g=>g.id==='activities').title,/0\/3/);assert.match(p.groups.find(g=>g.id==='observations').title,/0\/2/);assert.match(p.groups.find(g=>g.id==='hold').title,/30초/);
 s.observations.push({relationId:'grass_to_grasshopper'});assert.match(goalPresentation(s).groups[0].title,/1\/2/);completeActivity(s,'producer_quiz','grass');assert.match(goalPresentation(s).groups[1].title,/1\/3/);
 s.observations.push({relationId:'grasshopper_to_frog'});completeActivity(s,'decomposer_classify','decomposer');completeActivity(s,'grass_observation');
 s.organisms.push(organism('grasshopper',1),organism('frog',2));s.metrics.stability=80;
 assert(goalPresentation(s).ready);updateForestGoal(s,29);assert.equal(goalPresentation(s).achieved,5);s.simulationTime=30;updateForestGoal(s,1);assert.equal(goalPresentation(s).achieved,6);
 setEnvironmentLevel(s,'air','bad');updateForestGoal(s,0);assert(s.forestProgress.cleared);assert.equal(goalPresentation(s).groups.find(g=>g.id==='environment').ok,false);
 assert.equal(forestGoal.stableSeconds,30);assert.equal(forestGoal.minimumStability,70);
});
test('next action follows real placement, discovery and unlock prerequisites without repeating completed learning',()=>{
 const s=createGameState();assert.match(nextAction(s),/메뚜기.*풀 가까이/);s.organisms.push(organism('grasshopper',1));assert.match(nextAction(s),/먹는 모습을 관찰/);
 s.events.push({kind:'insight',status:'active',payload:{relationId:'grass_to_grasshopper'}});assert.match(nextAction(s),/💡/);
 s.observations.push({relationId:'grass_to_grasshopper'});assert.match(nextAction(s),/잠긴 개구리/);completeActivity(s,'grass_observation');assert.match(nextAction(s),/개구리 카드를/);
 s.organisms.push(organism('frog',2));assert.match(nextAction(s),/개구리가 메뚜기/);s.observations.push({relationId:'grasshopper_to_frog'});assert.match(nextAction(s),/양분을 만드는 생물/);
 completeActivity(s,'producer_quiz','grass');assert.match(nextAction(s),/버섯의 역할/);completeActivity(s,'decomposer_classify','decomposer');s.metrics.stability=80;assert.match(nextAction(s),/30초/);
});
test('minimal paid habitat recovery fixes legacy sunlight/air, never grants free control or forces event status',()=>{
 for(const factor of ['sunlight','air']){
  const s=createGameState();setEnvironmentLevel(s,factor,'bad');s.metrics.points=8;const old=growthSuitability('grass',s.environment);
  const before=structuredClone(s);assert.equal(executeManagement(s,'water-care',{sourceType:'environment',sourceId:factor}).ok,false);assert.deepEqual(s,before);
  assert(availableEnvironmentalRecovery(s).some(o=>o.factor===factor));assert(executeManagement(s,'habitat-care',{sourceType:'environment',sourceId:factor}).ok);
  assert.equal(s.environment[factor].value,.6);assert.equal(s.metrics.points,0);assert(growthSuitability('grass',s.environment)>old);assert.equal(s.events.length,0);assert.equal(s.managementEffects.length,1);assert.equal(s.managementHistory[0].sourceId,factor);
  const snapshot=createSaveSnapshot(s,{},'2026-10-08T00:00:00Z');const loaded=decodeSave(JSON.stringify(snapshot)).state;assert.equal(loaded.environment[factor].value,.6);assert.equal(loaded.managementHistory[0].factor,factor);
 }
});
test('recovery validates funds, bad state, target and shared cooldown before mutations',()=>{
 const s=createGameState();setEnvironmentLevel(s,'sunlight','bad');const context={sourceType:'environment',sourceId:'sunlight'};
 let before=structuredClone(s);assert.equal(executeManagement(s,'habitat-care',context).ok,false);assert.deepEqual(s,before);
 s.metrics.points=30;executeManagement(s,'habitat-care',context);setEnvironmentLevel(s,'air','bad');before=structuredClone(s);assert.match(executeManagement(s,'habitat-care',{sourceType:'environment',sourceId:'air'}).message,/조금 뒤/);assert.deepEqual(s,before);
 s.managementCooldowns={};before=structuredClone(s);for(const sourceId of ['water','soil','unknown','sunlight'])assert.equal(executeManagement(s,'habitat-care',{sourceType:'environment',sourceId}).ok,false);assert.deepEqual(s,before);
});
test('schema 7 save keeps legacy bad environments and learned progress; guide preference never edits game save',()=>{
 const s=createGameState();setEnvironmentLevel(s,'sunlight','bad');setEnvironmentLevel(s,'air','bad');completeActivity(s,'producer_quiz','grass');s.metrics.bestStability=85;
 const raw=JSON.stringify(createSaveSnapshot(s,{},'2026-10-08T00:00:00Z')),loaded=decodeSave(raw).state;assert.equal(loaded.schemaVersion,7);assert.equal(loaded.environment.sunlight.value,.15);assert.equal(loaded.environment.air.value,.15);assert.equal(loaded.metrics.bestStability,85);assert.equal(loaded.activities[0].completed,true);
 const storage=new Map([['eco-system:forest-save',raw]]);const adapter=createGuideAdapter(()=>({getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}));assert(!adapter.read());adapter.markSeen();assert(adapter.read());assert.equal(storage.get('eco-system:forest-save'),raw);
});
test('points exhausted remains a documented progression limit rather than silent environmental repair',()=>{
 const s=createGameState();setEnvironmentLevel(s,'air','bad');s.metrics.points=0;s.activities.forEach(a=>a.completed=true);s.observations=[{relationId:'grass_to_grasshopper'},{relationId:'grasshopper_to_frog'}];
 const before=structuredClone(s);assert.equal(executeManagement(s,'habitat-care',{sourceType:'environment',sourceId:'air'}).ok,false);assert.deepEqual(s,before);assert(!evaluateForestGoal(s).ready);
});
