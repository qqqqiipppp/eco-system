import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {createStabilitySystem} from '../js/systems/stability.js';
import {evaluateForestGoal,updateForestGoal,calculateProgress} from '../js/systems/forest-progress.js';
import {createProgressSummary} from '../js/services/progress-summary.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {createSaveService} from '../js/services/save-service.js';
import {forestGoal} from '../data/forest-goal.js';
import {speciesProfiles} from '../data/interaction-config.js';
import {completeActivity} from '../js/systems/activities.js';
import {setEnvironmentLevel} from '../js/systems/environment.js';
const layout={footprints:Object.fromEntries(Object.keys(speciesProfiles).map(id=>[id,{halfWidth:.02,above:.1,below:.03}])),blockedRects:[]};
const serialize=(s,memory={sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]})=>JSON.stringify(createSaveSnapshot(s,memory,'2026-10-08T00:00:00.000Z'));
function ready(){
 const s=createGameState();s.inventory.forEach(item=>item.acquired=true);
 s.organisms=['oak',...Array(6).fill('grass'),...Array(4).fill('grasshopper'),'frog'].map((id,i)=>createOrganismInstance(id,`test-${i}`,{x:.3+(i%4)*.035,y:.74}));
 s.observations=forestGoal.requiredObservations.map(id=>({relationId:id,eventId:'event-old',discoveredAt:0}));
 completeActivity(s,'producer_quiz','grass');completeActivity(s,'decomposer_classify','decomposer');completeActivity(s,'grass_observation');
 const stability=createStabilitySystem();stability.update(s);return {s,stability};
}
test('A/B/C: all five live conditions required; interruption resets hold; no time from UI refresh',()=>{
 const {s,stability}=ready();assert(evaluateForestGoal(s).ready);updateForestGoal(s,10);assert.equal(s.forestProgress.stableSeconds,10);
 updateForestGoal(s);assert.equal(s.forestProgress.stableSeconds,10);setEnvironmentLevel(s,'water','bad');stability.update(s);updateForestGoal(s,.5);assert.equal(s.forestProgress.stableSeconds,0);
 setEnvironmentLevel(s,'water','good');stability.update(s);
 for(const field of ['observations','activities','organisms']){const saved=s[field];s[field]=[];assert(!evaluateForestGoal(s).ready);s[field]=saved;}
 s.metrics.stability=69;assert(!evaluateForestGoal(s).ready);
});
test('D/E: live ecology sustains 30 seconds and clears once; decline preserves clear/best record',()=>{
 const {s,stability}=ready(),feeding=createFeedingSystem();let clears=0;
 for(let i=0;i<310;i++){const r=feeding.update(s,.1,layout);if(r.ticked){stability.update(s,.5);if(updateForestGoal(s,.5))clears++;}}
 assert.equal(clears,1);assert(s.forestProgress.cleared);assert.equal(s.forestProgress.clearedAt,30);const best=s.metrics.bestStability;
 setEnvironmentLevel(s,'water','bad');setEnvironmentLevel(s,'soil','bad');stability.update(s);updateForestGoal(s,10);assert(s.forestProgress.cleared);assert.equal(s.metrics.bestStability,best);assert(s.metrics.stability<best);
});
test('F/G/N: explicit 30-organism snapshot restores domain and safe fresh behavior; no target/UI fields',()=>{
 const {s}=ready();while(s.organisms.length<30)s.organisms.push(createOrganismInstance('frog',`test-${s.organisms.length}`,{x:.4,y:.7}));
 s.simulationTime=80;s.managementCooldowns={'food-support:test-29':110};s.managementEffects=[{actionId:'habitat-care',startedAt:60,expiresAt:120,multiplier:1.35}];
 s.organisms[29].behaviorState='moveToFood';s.organisms[29].targetInstanceId='missing';s.organisms[29].hunger=.8;s.selectedSpeciesId='frog';s.metrics.bestStability=88;
 const raw=serialize(s);assert(!raw.includes('targetInstanceId'));assert(!raw.includes('behaviorState'));assert(!raw.includes('selectedSpeciesId'));
 const loaded=decodeSave(raw);assert.equal(loaded.state.organisms.length,30);assert.deepEqual(loaded.state.organisms[29].position,s.organisms[29].position);
 assert.equal(loaded.state.organisms[29].behaviorState,'wander');assert.equal(loaded.state.organisms[29].targetInstanceId,null);assert.equal(loaded.state.organisms[29].hunger,.8);
 assert.equal(loaded.state.simulationTime,80);assert.equal(loaded.state.managementEffects[0].expiresAt,120);assert.equal(loaded.state.managementCooldowns['food-support:test-29'],110);assert.equal(loaded.state.metrics.bestStability,88);
 assert.equal(loaded.state.rewardHistory.length,s.rewardHistory.length);assert.equal(loaded.state.activities.filter(a=>a.completed).length,3);
});
test('H: problem events rebuild from live state; pending discovery and dismissal cooldown survive',()=>{
 const {s}=ready();s.simulationTime=50;const frog=s.organisms.find(o=>o.speciesId==='frog');frog.foodShortageDuration=10;frog.hunger=1;
 const events=createEventSystem(50);events.refresh(s);const alert=s.events.find(e=>e.kind==='alert');assert(alert);events.acknowledge(s,alert.eventId);
 const loaded=decodeSave(serialize(s,events.exportMemory()));const next=createEventSystem(loaded.state.simulationTime,loaded.eventMemory);next.refresh(loaded.state);assert.equal(loaded.state.events.filter(e=>e.kind==='alert').length,0);
 next.update(loaded.state,31);assert(loaded.state.events.some(e=>e.kind==='alert'));
 const virgin=createGameState(),source=createEventSystem();source.update(virgin,1,[{foodSpeciesId:'grass',consumerSpeciesId:'grasshopper',consumerInstanceId:'gone'}]);
 const pending=decodeSave(serialize(virgin,source.exportMemory()));const recovered=createEventSystem(0,pending.eventMemory);recovered.refresh(pending.state);
 assert.equal(pending.state.events[0].kind,'insight');assert.equal(pending.state.events[0].sourceId,'forest');assert.equal(pending.state.observations.length,0);
});
test('I/J: malformed JSON, versions, essential fields and partial corruption fail safely',()=>{
 for(const raw of ['{',JSON.stringify({}),JSON.stringify({schemaVersion:7,domain:{}})])assert.equal(decodeSave(raw).state.organisms.length,3);
 assert.equal(decodeSave('{"schemaVersion":6}').status,'old-version');assert(decodeSave('{"schemaVersion":99}').blocked);
 const {s}=ready(),snapshot=JSON.parse(serialize(s));snapshot.domain.metrics.points=-20;snapshot.domain.environment.water.value=null;
 snapshot.domain.organisms.push({...snapshot.domain.organisms[0]});snapshot.domain.organisms[1].speciesId='unknown';snapshot.domain.organisms[2].position={x:5,y:-2};snapshot.domain.organisms[3].position.x=null;
 snapshot.domain.inventory=snapshot.domain.inventory.filter(c=>c.speciesId!=='frog');
 snapshot.domain.observations.push({relationId:'forged'});snapshot.domain.rewardHistory.push({rewardId:'forged',amount:999});snapshot.domain.activities.push({activityId:'forged',completed:true});
 const result=decodeSave(JSON.stringify(snapshot));assert.equal(result.status,'recovered');assert.equal(result.state.metrics.points,0);assert(result.state.inventory.find(c=>c.speciesId==='frog').acquired);assert.equal(result.state.environment.water.value,1);
 assert.equal(new Set(result.state.organisms.map(o=>o.instanceId)).size,result.state.organisms.length);assert(result.state.organisms.every(o=>Number.isFinite(o.position.x)&&o.position.x>=0&&o.position.x<=1));assert(!result.state.rewardHistory.some(r=>r.rewardId==='forged'));
});
test('clear record persists, unfinished hold restarts and summary is a pure identity-free boundary',()=>{
 const {s}=ready();updateForestGoal(s,20);const before=structuredClone(s);const summary=createProgressSummary(s,'2026-10-08T00:00:00.000Z');assert.deepEqual(s,before);assert.equal(summary.studentId,null);assert(summary.progress>0&&summary.progress<100);
 const loaded=decodeSave(serialize(s)).state;assert.equal(loaded.forestProgress.stableSeconds,0);
 s.simulationTime=30;updateForestGoal(s,10);const cleared=decodeSave(serialize(s)).state;assert(cleared.forestProgress.cleared);assert.equal(cleared.forestProgress.clearedAt,30);
 const points=createGameState();points.metrics.points=99999;points.inventory.forEach(c=>c.acquired=true);assert(calculateProgress(points)<calculateProgress(s));
});
test('K/M: coalesced writes, pagehide flush equivalent, reset cancels queued stale writes',async()=>{
 const {s}=ready();let value=null,writes=0;const statuses=[];
 const service=createSaveService({adapter:{read:()=>value,write:v=>{value=v;writes++},remove:()=>{value=null}},getState:()=>s,getEventMemory:()=>({}),onStatus:s=>statuses.push(s),delayMs:15});
 for(let i=0;i<50;i++)service.schedule();assert.equal(writes,0);await new Promise(r=>setTimeout(r,35));assert.equal(writes,1);
 service.schedule();assert(service.reset());await new Promise(r=>setTimeout(r,35));assert.equal(value,null);assert.equal(writes,1);
 assert(service.flush(true));assert.equal(writes,2);service.dispose();
});
test('storage exceptions do not escape; future saves cannot be overwritten without successful reset',()=>{
 const state=createGameState();let value='{"schemaVersion":99}',writes=0;
 const adapter={read:()=>value,write:v=>{writes++;value=v},remove:()=>{value=null}};
 const service=createSaveService({adapter,getState:()=>state,getEventMemory:()=>({})});assert(service.load().blocked);service.schedule();assert(!service.flush(true));assert.equal(writes,0);service.reset();assert(service.flush(true));
 const failed=createSaveService({adapter:{read:()=>{throw Error('denied')},write:()=>{throw Error('quota')},remove:()=>{throw Error('denied')}},getState:()=>state,getEventMemory:()=>({})});assert.doesNotThrow(()=>failed.load());assert.equal(failed.flush(true),false);assert.equal(failed.reset(),false);
});
test('restored completion/reward history cannot pay twice; summary keeps lifetime management count',()=>{
 const {s}=ready();s.managementActionCount=150;
 s.managementHistory=Array.from({length:100},()=>({actionId:'food-support',sourceEventId:'event-old',sourceId:'test-11',executedAt:0,cost:5,result:'applied'}));
 const loaded=decodeSave(serialize(s)).state,points=loaded.metrics.points;
 completeActivity(loaded,'producer_quiz','grass');completeActivity(loaded,'decomposer_classify','decomposer');completeActivity(loaded,'grass_observation');
 assert.equal(loaded.metrics.points,points);assert.equal(loaded.rewardHistory.length,s.rewardHistory.length);assert.equal(createProgressSummary(loaded).managementActionCount,150);
});
