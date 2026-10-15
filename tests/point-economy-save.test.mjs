import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createSaveSnapshot,decodeSave,SAVE_VERSION} from '../js/services/save-format.js';
import {legacySave,emptyMemory} from './ecology-fixtures.mjs';
import {exhaustedForest,blockedPriorSave} from './point-economy-fixtures.mjs';
import {startEnvironmentEvent,updateEnvironmentEvents} from '../js/systems/environment-events.js';
import {claimEnvironmentStudy,studyRecovery,claimRecoverySupport,supportQuote,supportReserved} from '../js/systems/point-economy.js';
import {grantReward} from '../js/systems/rewards.js';
import {executeManagement,advanceManagement} from '../js/systems/management.js';
import {ledgerBalance} from '../js/state/point-economy-state.js';
const snapshot=s=>createSaveSnapshot(s,emptyMemory,'2000-01-01T00:00:00Z');
const load=s=>decodeSave(JSON.stringify(snapshot(s)));
const protect=s=>({points:s.metrics.points,organisms:s.organisms.map(o=>({id:o.instanceId,position:o.position,life:o.life,development:o.development,growth:o.growth,hunger:o.hunger,foodStock:o.foodStock})),environment:s.environment,events:s.environmentEvents,legacy:s.legacyEcology,observations:s.observations,activities:s.activities,pending:s.population.breeding,decomposition:s.decomposition});
test('X/Y: schema13 whitelist detaches receipts and keeps opening balance separate from old achievements',()=>{
 const s=createGameState();s.metrics.points=77;const raw=snapshot(s);assert.equal(SAVE_VERSION,16);assert.equal(raw.domain.pointEconomy.openingBalance,77);
 assert.notStrictEqual(raw.domain.pointEconomy,s.pointEconomy);assert.equal(raw.domain.pointEconomy.totals.legacy,0);assert.equal(raw.schemaVersion,16);assert.equal(raw.domain.ecologyRevision,2);
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');assert.equal(r.state.metrics.points,77);assert.equal(ledgerBalance(r.state.pointEconomy),77);
});
for(const version of [7,8,9,10,11,12])test(`X/R/S: genuine pre13 version${version} preserves state and offers needed one-time support rather than retroactive incidents`,()=>{
 const raw=blockedPriorSave(version),r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');const s=r.state;
 assert.equal(s.metrics.points,0);assert.equal(s.schemaVersion,16);assert.equal(s.pointEconomy.studyStartSequence,s.environmentEvents.sequence);assert(supportQuote(s).available,JSON.stringify(supportQuote(s)));
 const before=structuredClone(protect(s)),response=claimRecoverySupport(s);assert(response.ok);const amount=version<10?8:28;assert.equal(response.amount,amount);
 assert.deepEqual({...protect(s),points:0},before);const loaded=load(s);assert.equal(loaded.status,'loaded');assert.equal(loaded.state.metrics.points,amount);assert(!claimRecoverySupport(loaded.state).ok);
 assert.equal(loaded.state.pointEconomy.totals.support,amount);assert.equal(supportReserved(loaded.state),amount);assert.deepEqual(loaded.state.legacyEcology,s.legacyEcology);
});
test('F/X: current paid study and reserved support survive100 roundtrips with no credit/debit replay or biological reset',()=>{
 const s=exhaustedForest({factors:['air']});claimRecoverySupport(s);executeManagement(s,'habitat-care',{sourceType:'environment',sourceId:'air'});
 const record=startEnvironmentEvent(s,'drought');advanceManagement(s,420);updateEnvironmentEvents(s);assert(claimEnvironmentStudy(s,record.eventId,{factor:'water',recovery:studyRecovery(record)}).ok);
 let current=s;const before=structuredClone(protect(s)),economy=structuredClone(s.pointEconomy);
 for(let i=0;i<100;i++){const r=load(current);assert.equal(r.status,'loaded');current=r.state;assert(!claimRecoverySupport(current).ok);assert(!claimEnvironmentStudy(current,record.eventId,{factor:'water',recovery:studyRecovery(record)}).ok);}
 assert.deepEqual(protect(current),before);assert.deepEqual(current.pointEconomy,economy);assert.equal(current.metrics.points,4);assert.equal(ledgerBalance(current.pointEconomy),4);
});
test('B/T: deleting a reward row cannot revive an already paid legacy key; existing points are never reset',()=>{
 const s=createGameState();grantReward(s,'question','producer_air_limit','actual');const raw=snapshot(s);raw.domain.rewardHistory=[];
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.state.metrics.points,10);assert.equal(grantReward(r.state,'question','producer_air_limit','replay'),0);assert.equal(r.state.metrics.points,10);
});
test('F/G/S: damaged claim and support flags preserve spent keys via counters/journal and cannot pay again',()=>{
 const s=exhaustedForest();claimRecoverySupport(s);const record=startEnvironmentEvent(s,'drought');s.simulationTime+=420;updateEnvironmentEvents(s);
 // A forced drought on an alreadybad water has no actualchange, so use a real new rain.
 const rain=startEnvironmentEvent(s,'rain');s.simulationTime+=120;updateEnvironmentEvents(s);assert(claimEnvironmentStudy(s,rain.eventId,{factor:'water',recovery:'rain'}).ok);
 const raw=snapshot(s);raw.domain.pointEconomy.studyClaims=[{eventId:rain.eventId,kind:'constructor'}];raw.domain.pointEconomy.support.used=false;
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.metrics.points,s.metrics.points);assert(!claimEnvironmentStudy(r.state,rain.eventId,{factor:'water',recovery:'rain'}).ok);assert(!claimRecoverySupport(r.state).ok);
 const stable=load(r.state);assert.equal(stable.status,'loaded');assert.equal(stable.state.metrics.points,s.metrics.points);assert(stable.state.pointEconomy.support.used);
});
test('X: old12 completed/active incidents stay intact but cannot become retroactive new points',()=>{
 const s=createGameState(),r=startEnvironmentEvent(s,'drought');s.simulationTime=420;updateEnvironmentEvents(s);const raw=snapshot(s);raw.schemaVersion=raw.domain.schemaVersion=12;delete raw.domain.pointEconomy;
 const loaded=decodeSave(JSON.stringify(raw));assert.equal(loaded.status,'loaded');assert.deepEqual(loaded.state.environmentEvents,s.environmentEvents);assert(!claimEnvironmentStudy(loaded.state,r.eventId,{factor:'water',recovery:studyRecovery(r)}).ok);assert.equal(loaded.state.metrics.points,0);
});
test('Y: bounded ledger keeps cumulative totals and the actual current balance; unknown metadata never grants points',()=>{
 const s=createGameState();s.metrics.points=321;const raw=snapshot(s);raw.domain.pointEconomy.ledger=[{id:'free-money',type:'support',amount:999999,sequence:1,at:0,balance:321}];raw.domain.pointEconomy.studyCount=900;
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.metrics.points,321);assert.equal(r.state.pointEconomy.ledger.length,0);assert.equal(r.state.pointEconomy.studyCount,5);assert.equal(ledgerBalance(r.state.pointEconomy),321);
});
test('Y: missing amount on an unknown legacy row never creates NaN totals or changes authoritative balance',()=>{
 const s=createGameState();s.metrics.points=77;const raw=snapshot(s);raw.domain.pointEconomy.ledger=[{type:'legacy',id:'unknown',sequence:1,at:0,balance:77}];
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.metrics.points,77);assert.equal(r.state.pointEconomy.ledger.length,0);assert.equal(ledgerBalance(r.state.pointEconomy),77);assert.equal(load(r.state).status,'loaded');
});
test('R/S/X: losing the new economy object preserves independent support ownership and a genuinely blocked save can still restart',()=>{
 const fresh=exhaustedForest(),raw=snapshot(fresh);delete raw.domain.pointEconomy;const restored=decodeSave(JSON.stringify(raw));assert.equal(restored.status,'recovered');assert.equal(restored.state.metrics.points,0);assert(!restored.state.recoverySupportUsed);assert(claimRecoverySupport(restored.state).ok);
 const used=snapshot(restored.state);delete used.domain.pointEconomy;const carried=decodeSave(JSON.stringify(used));assert.equal(carried.state.metrics.points,28);assert(carried.state.recoverySupportUsed);assert.equal(supportReserved(carried.state),28);assert(!claimRecoverySupport(carried.state).ok);
 assert(executeManagement(carried.state,'water-care',{sourceType:'environment',sourceId:'water'}).ok);assert.equal(carried.state.metrics.points,22);assert.equal(supportReserved(carried.state),22);assert.equal(load(carried.state).status,'loaded');
});
test('X/Z: future14/unknown ecology stay blocked; savedAt dates never generate money or elapsed biology',()=>{
 const s=createGameState(),raw=snapshot(s);raw.schemaVersion=raw.domain.schemaVersion=17;assert(decodeSave(JSON.stringify(raw)).blocked);
 raw.schemaVersion=raw.domain.schemaVersion=13;raw.domain.ecologyRevision=999;assert(decodeSave(JSON.stringify(raw)).blocked);
 const a=snapshot(s),b=snapshot(s);a.savedAt='1900-01-01T00:00:00Z';b.savedAt='2099-01-01T00:00:00Z';assert.deepEqual(decodeSave(JSON.stringify(a)).state,decodeSave(JSON.stringify(b)).state);
});
