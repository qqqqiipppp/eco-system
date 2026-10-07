import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../js/state/game-state.js';
import { createOrganismInstance } from '../js/state/organism-instance.js';
import { createEventSystem } from '../js/systems/events.js';
import { setEnvironmentLevel } from '../js/systems/environment.js';
import { eventConfig } from '../data/event-config.js';
import { placeOrganism } from '../js/systems/placement.js';
import { speciesProfiles } from '../data/interaction-config.js';

function scenario(ids) {
 const state=createGameState();state.organisms=ids.map((id,i)=>createOrganismInstance(id,`test-${i}`,{x:.4,y:.72}));
 return {state,system:createEventSystem()};
}
const active=state=>state.events.filter(e=>e.status==='active');
const run=(system,state,seconds)=>{for(let i=0;i<seconds*2;i++)system.update(state,.5);};
for(const species of ['grasshopper','frog'])test(`${species}: shortage creates one event, resolves after feeding, and respects cooldown`,()=>{
 const {state,system}=scenario([species]);const animal=state.organisms[0];
 animal.foodShortageDuration=10;animal.hunger=1;
 run(system,state,15);assert.equal(active(state).length,1);assert.equal(state.events.length,1);
 animal.foodShortageDuration=0;animal.hunger=.1;run(system,state,1);
 assert.equal(state.events[0].status,'resolved');
 animal.foodShortageDuration=10;animal.hunger=1;run(system,state,2);assert.equal(active(state).length,0);
 run(system,state,eventConfig.cooldownSeconds);assert.equal(active(state).length,1);assert.equal(state.events.length,2);
});
test('water-limited production creates environment alert and investigation; recovery resolves both',()=>{
 const {state,system}=scenario(['grass']);setEnvironmentLevel(state,'water','bad');run(system,state,5);
 assert.equal(active(state).length,2);
 const alert=active(state).find(e=>e.kind==='alert');assert.equal(alert.sourceId,'water');
 assert(active(state).some(e=>e.kind==='question'));
 setEnvironmentLevel(state,'water','good');system.refresh(state);assert.equal(active(state).length,0);
});
test('investigation requires a valid judgment and stays completed for the same situation',()=>{
 const {state,system}=scenario(['grass']);setEnvironmentLevel(state,'water','bad');run(system,state,5);
 const question=active(state).find(e=>e.kind==='question');
 assert.equal(system.acknowledge(state,question.eventId,'cards').ok,false);assert.equal(question.status,'active');
 assert.equal(system.acknowledge(state,question.eventId,'environment').ok,true);
 run(system,state,100);assert.equal(state.events.filter(e=>e.kind==='question').length,1);
});
test('real feeding signal becomes pending insight; only acknowledgment records discovery once',()=>{
 const {state,system}=scenario(['grass','grasshopper']);
 const signal={foodSpeciesId:'grass',consumerSpeciesId:'grasshopper',consumerInstanceId:'test-1'};
 system.update(state,1,[signal]);const insight=active(state)[0];assert.equal(insight.kind,'insight');
 assert.equal(state.observations.length,0);
 for(let i=0;i<50;i++)system.update(state,1,[signal]);assert.equal(state.events.length,1);
 assert.equal(system.acknowledge(state,insight.eventId).ok,true);
 assert.equal(state.observations[0].relationId,'grass_to_grasshopper');
 for(let i=0;i<50;i++)system.update(state,1,[signal]);assert.equal(state.events.length,1);assert.equal(state.observations.length,1);
 assert.equal(system.acknowledge(state,insight.eventId).ok,false);
});
test('removed sources resolve alerts and keep unacknowledged discovery reachable',()=>{
 const {state,system}=scenario(['grasshopper']);state.organisms[0].foodShortageDuration=10;state.organisms[0].hunger=1;
 system.update(state,1,[{foodSpeciesId:'grass',consumerSpeciesId:'grasshopper',consumerInstanceId:'test-0'}]);
 state.organisms=[];system.update(state,1);
 assert.equal(active(state).length,1);assert.equal(active(state)[0].sourceType,'environment');assert.equal(active(state)[0].sourceId,'forest');
});

test('frog feeding records the second relationship independently',()=>{
 const {state,system}=scenario(['frog']);
 system.update(state,1,[{foodSpeciesId:'grasshopper',consumerSpeciesId:'frog',consumerInstanceId:'test-0'}]);
 const insight=active(state).find(event=>event.kind==='insight');
 assert.equal(insight.payload.relationId,'grasshopper_to_frog');
 assert.equal(state.observations.length,0);
 assert.equal(system.acknowledge(state,insight.eventId).ok,true);
 assert.equal(state.observations[0].relationId,'grasshopper_to_frog');
});
test('30 shortages: bounded history, stable active identity and one-second scans',()=>{
 const {state,system}=scenario(Array(30).fill('frog'));
 for(const animal of state.organisms){animal.foodShortageDuration=10;animal.hunger=1;}
 for(let i=0;i<120;i++)system.update(state,.5);
 assert.equal(system.getDiagnostics().checks,60);assert.equal(state.events.length,30);
 assert.equal(new Set(active(state).map(e=>e.key)).size,30);
 assert(state.events.length<=eventConfig.maxHistory);
 const id=active(state)[0].eventId;system.acknowledge(state,id);run(system,state,10);
 assert.equal(state.events.find(e=>e.eventId===id).status,'dismissed');
});
test('placement does not reuse a consumed instance ID that may remain in event history',()=>{
 const {state}=scenario([]);state.inventory.find(item=>item.speciesId==='frog').acquired=true; // already-unlocked fixture for ID reuse
 const layout={footprints:Object.fromEntries(Object.keys(speciesProfiles).map(id=>[id,{halfWidth:.02,above:.1,below:.03}])),blockedRects:[]};
 const input={position:{x:.4,y:.72},isPlayArea:true,isUI:false};
 const first=placeOrganism(state,'frog',input,layout).instance;state.organisms=[];
 const second=placeOrganism(state,'frog',input,layout).instance;assert.notEqual(first.instanceId,second.instanceId);
});
