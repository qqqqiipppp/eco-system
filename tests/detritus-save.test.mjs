import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createSaveSnapshot,decodeSave,SAVE_VERSION} from '../js/services/save-format.js';
import {createEnvironmentEventState} from '../js/state/environment-event-state.js';
import {startEnvironmentEvent,updateEnvironmentEvents} from '../js/systems/environment-events.js';
import {advanceManagement,executeManagement} from '../js/systems/management.js';
import {claimEnvironmentStudy,studyRecovery,claimRecoverySupport} from '../js/systems/point-economy.js';
import {removeOrganism} from '../js/systems/lifecycle.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {createEventSystem} from '../js/systems/events.js';
import {legacySave,world,emptyMemory} from './ecology-fixtures.mjs';
import {exhaustedForest} from './point-economy-fixtures.mjs';
const snap=s=>createSaveSnapshot(s,emptyMemory,'2026-10-14T00:00:00Z');
function prior13(s){const raw=snap(s);raw.schemaVersion=raw.domain.schemaVersion=13;raw.domain.inventory=raw.domain.inventory.filter(c=>c.speciesId!=='earthworm');raw.domain.organisms=raw.domain.organisms.filter(o=>o.speciesId!=='earthworm');delete raw.domain.decomposition.notices;delete raw.domain.decomposition.earthwormProcessed;delete raw.domain.decomposition.soilContribution;return raw;}
for(const version of [7,8,9,10,11,12,13])test(`13.5 W/X: genuine prior${version} retains earned progress and does not invent corpse arrivals`,()=>{
 let raw;
 if(version<10)raw=legacySave(version);else{const s=createGameState();s.metrics.points=37;s.inventory.find(c=>c.speciesId==='frog').acquired=true;raw=prior13(s);raw.schemaVersion=raw.domain.schemaVersion=version;if(version<13){delete raw.domain.pointEconomy;delete raw.domain.recoverySupportUsed;}if(version<12)delete raw.domain.environmentEvents;if(version<11){delete raw.domain.development;for(const o of raw.domain.organisms)delete o.development;}}
 const result=decodeSave(JSON.stringify(raw));assert.equal(result.status,'loaded');const s=result.state;assert.equal(SAVE_VERSION,14);assert.equal(s.schemaVersion,14);assert.equal(s.ecologyRevision,2);assert.equal(s.metrics.points,raw.domain.metrics.points);assert.equal(s.organisms.length,raw.domain.organisms.length);assert(s.inventory.find(c=>c.speciesId==='frog').acquired);assert(s.inventory.find(c=>c.speciesId==='mushroom').acquired);assert(s.inventory.find(c=>c.speciesId==='soil-bacteria').acquired);assert(!s.inventory.find(c=>c.speciesId==='earthworm').acquired);assert.equal(s.decomposition.notices.history.length,0);
 for(const c of raw.domain.inventory.filter(c=>c.acquired))assert(s.inventory.find(r=>r.speciesId===c.speciesId).acquired);
 if(version>7){assert.equal(s.decomposition.processed,raw.domain.decomposition.processed);assert.deepEqual(s.decomposition.organicMatter,raw.domain.decomposition.organicMatter);}
 assert.deepEqual(s.activities.map(a=>a.completed),raw.domain.activities.map(a=>a.completed));
});
test('13.5 Y: paid schema13 environmental study remains paid across migration and100 reloads',()=>{
 const s=createGameState();s.simulationTime=1000;s.environmentEvents=createEnvironmentEventState(1000);const r=startEnvironmentEvent(s,'drought');advanceManagement(s,420);updateEnvironmentEvents(s);assert.equal(r.phase,'ended');assert(claimEnvironmentStudy(s,r.eventId,{factor:r.factor,recovery:studyRecovery(r)}).ok);
 const raw=prior13(s),p=structuredClone(s.pointEconomy),receipts=structuredClone(s.rewardHistory);let loaded=decodeSave(JSON.stringify(raw)).state;
 for(let i=0;i<100;i++){assert.equal(loaded.metrics.points,4);assert.deepEqual(loaded.pointEconomy,p);assert.deepEqual(loaded.rewardHistory,receipts);assert(!claimEnvironmentStudy(loaded,r.eventId,{factor:r.factor,recovery:studyRecovery(r)}).ok);const result=decodeSave(JSON.stringify(snap(loaded)));assert.equal(result.status,'loaded');loaded=result.state;}
});
test('13.5 Y: alreadyused schema13 support keeps22 reserved points, cost history and once-only ownership',()=>{
 const s=exhaustedForest();assert(claimRecoverySupport(s).ok);assert(executeManagement(s,'water-care',{sourceType:'environment',sourceId:'water'}).ok);const raw=prior13(s),before=structuredClone(s.pointEconomy);let loaded=decodeSave(JSON.stringify(raw)).state;
 for(let i=0;i<100;i++){assert.deepEqual(loaded.pointEconomy,before);assert.equal(loaded.metrics.points,22);assert(loaded.recoverySupportUsed);assert(!claimRecoverySupport(loaded).ok);assert.equal(loaded.managementHistory[0].cost,6);loaded=decodeSave(JSON.stringify(snap(loaded))).state;}
});
test('13.5 X/Z: current14 preserves worm consumption, soil cap, birth confirmation, position and lifetime without replay',()=>{
 const s=world([['grass',1,.4],['earthworm',1,.42],['litter-mold',1,.45]]);s.environment.soil.value=.35;s.simulationTime=100;removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');updateDecomposition(s,.5);const e=createEventSystem(100);e.refresh(s);assert(e.acknowledge(s,s.events.find(e=>e.payload.organicOriginSequence).eventId).ok);
 const before=structuredClone(s.decomposition),members=structuredClone(s.organisms);let loaded=s;
 for(let i=0;i<100;i++){const r=decodeSave(JSON.stringify(snap(loaded)));assert.equal(r.status,'loaded');loaded=r.state;assert.deepEqual(loaded.decomposition,before);assert.deepEqual(loaded.organisms.map(o=>[o.life,o.position,o.litterConsumed,o.lastLitterFeedingAt]),members.map(o=>[o.life,o.position,o.litterConsumed,o.lastLitterFeedingAt]));const system=createEventSystem(100);system.refresh(loaded);assert(!loaded.events.some(e=>e.status==='active'&&e.payload.organicOriginSequence));assert.equal(loaded.metrics.points,0);}
});
test('13.5 X/Z: partial organic metadata repairs only metadata, protects actual resources/cash and never creates false arrivals',()=>{
 const s=world([['grass',1,.4],['earthworm',1,.42]]);removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');s.metrics.points=19;const raw=snap(s);raw.domain.decomposition.notices.history.push({...raw.domain.decomposition.notices.history[0],sequence:2,part:'wood',cause:'predation',amount:999},{...raw.domain.decomposition.notices.history[0],sequence:3,sourceSpeciesId:'constructor',part:'remains',cause:'starvation',amount:1,targetInstanceId:null});raw.domain.decomposition.notices.sequence=3;delete raw.domain.decomposition.soilContribution;
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.decomposition.notices.history.length,1);assert.equal(r.state.metrics.points,19);assert.deepEqual(r.state.decomposition.organicMatter,s.decomposition.organicMatter);assert.equal(r.state.decomposition.soilContribution,.12);assert.equal(decodeSave(JSON.stringify(snap(r.state))).status,'loaded');
});
test('13.5 Z: future15/unknown ecology are blocked; offline dates cause no worm activity, cash or replay',()=>{
 const s=world([['earthworm',1,.4]]),raw=snap(s),other=structuredClone(raw);other.savedAt='2099-01-01T00:00:00Z';raw.savedAt='1900-01-01T00:00:00Z';assert.deepEqual(decodeSave(JSON.stringify(raw)).state,decodeSave(JSON.stringify(other)).state);
 raw.schemaVersion=raw.domain.schemaVersion=15;assert(decodeSave(JSON.stringify(raw)).blocked);other.domain.ecologyRevision=999;assert(decodeSave(JSON.stringify(other)).blocked);
});
