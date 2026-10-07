import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {completeActivity} from '../js/systems/activities.js';
import {activityCondition} from '../js/systems/activity-rules.js';
import {unlockSpecies} from '../js/systems/unlocks.js';
import {grantReward} from '../js/systems/rewards.js';
import {createEventSystem} from '../js/systems/events.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createStabilitySystem} from '../js/systems/stability.js';
import {setEnvironmentLevel} from '../js/systems/environment.js';
import {placeOrganism} from '../js/systems/placement.js';
import {speciesProfiles} from '../data/interaction-config.js';
const layout={footprints:Object.fromEntries(Object.keys(speciesProfiles).map(id=>[id,{halfWidth:.02,above:.1,below:.03}])),blockedRects:[]};
const input={position:{x:.4,y:.74},isPlayArea:true,isUI:false};
const acquired=(s,id)=>s.inventory.find(c=>c.speciesId===id).acquired;
test('A/J: real starter inventory and locked placement fail without mutation',()=>{
 const s=createGameState();assert.deepEqual(s.inventory.filter(c=>c.acquired).map(c=>c.speciesId),['oak','grass','grasshopper']);
 for(const id of ['frog','rabbit','mushroom']){const before=structuredClone(s);assert.equal(placeOrganism(s,id,input,layout).reason,'inventory');assert.deepEqual(s,before)}
});
test('B/C/D: actual feeding -> recorded observation -> frog unlock -> actual predation discovery',()=>{
 const s=createGameState();s.organisms=['grass','grasshopper','grasshopper'].map((id,i)=>createOrganismInstance(id,`test-${i}`,input.position));
 const feeding=createFeedingSystem(),events=createEventSystem();function run(seconds){for(let i=0;i<seconds*10;i++){const r=feeding.update(s,.1,layout);if(r.ticked)events.update(s,.5,r.feedingEvents)}}
 run(20);const insight=s.events.find(e=>e.kind==='insight');assert(insight);assert.equal(completeActivity(s,'grass_observation').ok,false);assert.equal(s.metrics.points,0);
 events.acknowledge(s,insight.eventId);assert.equal(s.metrics.points,12);assert(activityCondition(s,'grass_observation').ok);
 assert(completeActivity(s,'grass_observation').unlocked);assert.equal(s.metrics.points,16);assert(acquired(s,'frog'));
 assert(placeOrganism(s,'frog',input,layout).ok);run(25);assert(s.events.some(e=>e.payload.relationId==='grasshopper_to_frog'));assert(feeding.getDiagnostics().predations>0);
});
test('E/F/I: classify feedback, retry, one reward, no soil effect or auto placement',()=>{
 const s=createGameState(),before=structuredClone(s.environment),count=s.organisms.length;
 assert.equal(completeActivity(s,'decomposer_classify','producer').ok,false);assert.equal(s.metrics.points,0);assert(!acquired(s,'mushroom'));
 assert(completeActivity(s,'decomposer_classify','decomposer').unlocked);assert.equal(s.metrics.points,4);
 const inventory=structuredClone(s.inventory);completeActivity(s,'decomposer_classify','decomposer');unlockSpecies(s,'mushroom','decomposer_classify');
 assert.deepEqual(s.inventory,inventory);assert.equal(s.metrics.points,4);assert.equal(s.organisms.length,count);assert.deepEqual(s.environment,before);
 assert.equal(s.activities.find(a=>a.activityId==='decomposer_classify').attempts,3);
});
test('quiz retry and once-only reward independent of card ownership',()=>{
 const s=createGameState(),cards=structuredClone(s.inventory);assert.equal(completeActivity(s,'producer_quiz','frog').ok,false);
 assert(completeActivity(s,'producer_quiz','grass').ok);completeActivity(s,'producer_quiz','grass');assert.equal(s.metrics.points,3);assert.deepEqual(s.inventory,cards);
});
test('G/H: habitat uses live producers, all factors and stability; confirmation required and no auto animal',()=>{
 const s=createGameState(),stability=createStabilitySystem();stability.update(s);assert(!activityCondition(s,'rabbit_habitat').ok);
 s.organisms.push(createOrganismInstance('grasshopper','test-animal',input.position));stability.update(s);assert(activityCondition(s,'rabbit_habitat').ok);assert(!acquired(s,'rabbit'));
 setEnvironmentLevel(s,'water','bad');assert(!completeActivity(s,'rabbit_habitat').ok);assert(!acquired(s,'rabbit'));
 setEnvironmentLevel(s,'water','good');stability.update(s);const count=s.organisms.length;assert(completeActivity(s,'rabbit_habitat').unlocked);assert.equal(s.organisms.length,count);
});
test('unlock rejects missing species/inventory, wrong activity and incomplete evidence',()=>{
 const s=createGameState(),before=structuredClone(s);
 for(const [id,activity]of [['missing','decomposer_classify'],['frog','decomposer_classify'],['frog','grass_observation']])assert.equal(unlockSpecies(s,id,activity).ok,false);
 assert.deepEqual(s,before);s.inventory=s.inventory.filter(c=>c.speciesId!=='mushroom');const next=structuredClone(s);assert.equal(completeActivity(s,'decomposer_classify','decomposer').ok,false);assert.deepEqual(s,next);
});
test('activity reward cannot be granted before completion; fresh new-game state resets progress',()=>{
 const s=createGameState();assert.equal(grantReward(s,'activity','producer_quiz','producer_quiz'),0);s.simulationTime=9;completeActivity(s,'producer_quiz','grass');
 assert.equal(s.rewardHistory[0].rewardId,'activity:producer_quiz');assert.equal(s.activities[0].completedAt,9);assert.equal(createGameState().activities[0].completed,false);
});
