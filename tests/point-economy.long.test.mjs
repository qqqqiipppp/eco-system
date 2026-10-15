import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {freshStudent,runEconomy,comparisonForest,exhaustedForest,introduce,layout,blockedPriorSave} from './point-economy-fixtures.mjs';
import {claimEnvironmentStudy,studyRecovery,studyCandidates,claimRecoverySupport,supportQuote} from '../js/systems/point-economy.js';
import {startEnvironmentEvent,updateEnvironmentEvents} from '../js/systems/environment-events.js';
import {executeManagement} from '../js/systems/management.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {ledgerBalance} from '../js/state/point-economy-state.js';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {createEventSystem} from '../js/systems/events.js';
import {make} from './ecology-fixtures.mjs';
const results={baselineCommit:'c2b609b8ba338f79f63b3ae7e1f79c378c136812',stage:13,tickSeconds:.5,visualWander:false,nutritionOrFoodOverrides:0,scenarios:{}};
const study=(s)=>{for(const r of studyCandidates(s))assert(claimEnvironmentStudy(s,r.eventId,{factor:r.factor,recovery:studyRecovery(r)}).ok);};
function account(r){assert.equal(r.report.points,r.report.pointsStart+r.report.legacyEarned+r.report.newEarned+r.report.supportGranted-r.report.spent);assert.equal(ledgerBalance(r.state.pointEconomy),r.state.metrics.points);assert(r.state.pointEconomy.studyCount<=5);assert(r.state.pointEconomy.totals.study<=20);assert(r.state.pointEconomy.totals.support<=28);return r;}
function emit(id,data){results.scenarios[id]=data;console.log('ECONOMY_LONG_'+id,JSON.stringify(data));}
function repair(s,events){
 if(supportQuote(s).available)assert(claimRecoverySupport(s).ok);
 if(!s.pointEconomy.support.remaining)return;
 for(const f of s.pointEconomy.support.factors.filter(f=>s.environment[f].value<.4)){
  const action=['water','soil'].includes(f)?f==='water'?'water-care':'soil-care':'habitat-care';
  const r=executeManagement(s,action,{sourceType:'environment',sourceId:f});if(r.ok)events.refresh(s);
 }
}
test('13 long1: fresh0 student fortyminutes earns through actual food/activity/incident learning and pays normal care',()=>{
 const r=account(runEconomy(freshStudent(),40,{student:true,mode:'normal',study}));assert.equal(r.report.pointsStart,0);assert(r.report.legacyEarned>=35);assert.equal(r.report.newEarned,12);assert.equal(r.report.supportGranted,0);assert(r.report.currentlyGoalReady);emit(1,{...r.report,checkpoints:r.checkpoints});
});
test('13 long2: observation and natural recovery are real zero-management choices with meaningful capped learning',()=>{
 const r=account(runEconomy(freshStudent(),40,{student:true,mode:'observe',study}));assert.equal(r.report.spent,0);assert.equal(r.report.actions,0);assert.equal(r.report.newEarned,12);assert(r.report.currentlyGoalReady);emit(2,{...r.report,checkpoints:r.checkpoints});
});
test('13 long3: active care only uses validated transactions and does not require equal final biological counts',()=>{
 const r=account(runEconomy(freshStudent(),40,{student:true,mode:'active',study}));assert(r.report.spent>14);assert(r.report.actions>2);assert.equal(r.report.supportGranted,0);assert(r.report.currentlyGoalReady);emit(3,{...r.report,checkpoints:r.checkpoints});
});
test('13 long4: genuine early waste on hungry remote animals precedes actual food provision and later normal progress',()=>{
 const r=account(runEconomy(freshStudent({earlySpending:true}),40,{student:true,earlySpending:true,mode:'active',study}));assert(r.report.management.some(m=>m.actionId==='food-support'&&m.executedAt<300));assert(r.report.spent>=40);assert.equal(r.report.pointsStart,0);assert.equal(r.report.supportGranted,0);assert(r.report.currentlyGoalReady);emit(4,{...r.report,checkpoints:r.checkpoints});
});
test('13 long5: zero points with ordinary incident recovery waits without an unnecessary emergency grant',()=>{
 const s=exhaustedForest({factors:[]});startEnvironmentEvent(s,'drought');const r=account(runEconomy(s,40,{student:true,mode:'observe',study,onTick:(s)=>assert(!supportQuote(s).available)}));assert.equal(r.report.supportGranted,0);assert(r.report.newEarned>0);assert(Object.values(r.report.environment).every(v=>v>=.4));emit(5,r.report);
});
test('13 long6: legacy bonuses exhausted, new verified environmental results can fund continued actual operation',()=>{
 const r=account(runEconomy(exhaustedForest({factors:[]}),40,{student:true,mode:'observe',study}));assert.equal(r.report.legacyEarned,0);assert.equal(r.report.newEarned,12);assert.equal(r.report.points,12);assert.equal(r.report.supportGranted,0);assert(r.report.currentlyGoalReady);emit(6,r.report);
});
test('13 long7: genuinely blocked old7/old12 saves restart with exact once-only repair and actual current learning',()=>{
 const reports={};for(const version of [7,12]){const restored=decodeSave(JSON.stringify(blockedPriorSave(version)));assert.equal(restored.status,'loaded');const r=account(runEconomy(restored.state,40,{student:true,mode:'observe',study,onTick:repair}));assert.equal(r.report.supportGranted,version===7?8:28);assert(Object.values(r.report.environment).every(v=>v>=.4));assert(r.report.currentlyGoalReady);assert(r.report.cleared);reports[version]=r.report;}emit(7,reports);
});
test('13 long8: scheduled480/1200/1920 incidents give at most three earned opportunities against actual14 care cost',()=>{
 const r=account(runEconomy(comparisonForest('representative'),40,{mode:'normal',study}));assert.deepEqual(r.report.episodes.map(e=>e.startedAt),[480,1200,1920]);assert.equal(r.report.newEarned,12);assert.equal(r.report.spent,14);assert.equal(r.report.actions,2);assert.equal(r.report.points,31);emit(8,r.report);
});
test('13 long9: unchanged economic-only comparison reproduces all six stage12 biological endpoints with same actions',()=>{
 const baseline=JSON.parse(readFileSync(new URL('./point-economy-baseline-results.json',import.meta.url),'utf8')),reports={};
 for(const forest of ['representative','mixed'])for(const mode of ['none','observe','normal']){
  const r=account(runEconomy(comparisonForest(forest),40,{mode:mode==='none'?'observe':mode,enabled:mode!=='none',study})),b=baseline.comparisons[forest+'-'+mode];
  assert.deepEqual(r.report.final,b.final);assert.equal(r.report.stability,b.stability);assert.deepEqual(r.report.environment,b.environment);assert.deepEqual(r.report.meals,b.meals);assert.deepEqual(r.report.changes,b.changes);assert.equal(r.report.spent,b.spent);reports[forest+'-'+mode]=r.report;
 }emit(9,reports);
});
test('13 long10: eightyminute repeat attempts, ordinary care and100 save reloads cannot turn confirmation into money',()=>{
 const s=exhaustedForest({factors:[]}),r=account(runEconomy(s,80,{mode:'normal',study:(s)=>{for(const r of studyCandidates(s)){assert(claimEnvironmentStudy(s,r.eventId,{factor:r.factor,recovery:studyRecovery(r)}).ok);for(let i=0;i<20;i++)assert(!claimEnvironmentStudy(s,r.eventId,{factor:r.factor,recovery:studyRecovery(r)}).ok);}}}));
 assert(r.report.newEarned<=20);let loaded=r.state;for(let i=0;i<100;i++){const d=decodeSave(JSON.stringify(createSaveSnapshot(loaded,r.memory,'2099-01-01T00:00:00Z')));assert.equal(d.status,'loaded');loaded=d.state;assert.equal(loaded.metrics.points,r.report.points);for(const c of loaded.pointEconomy.studyClaims)assert(!claimEnvironmentStudy(loaded,c.eventId,{factor:c.factor,recovery:c.recovery}).ok);}emit(10,r.report);
});
test('13 long11:23 types30 instances retain capacity and same ecology with new economic bookkeeping',()=>{
 const r=account(runEconomy(comparisonForest('mixed'),40,{mode:'normal',study}));assert.equal(r.report.peak,30);assert.equal(r.report.types,9);assert.equal(r.report.total,10);assert.equal(r.report.stability,69);emit(11,r.report);
});
test('13 long12: fresh core-required learning/real relations succeed without buying points or forcing optional rabbit play',()=>{
 const r=account(runEconomy(freshStudent(),40,{student:true,includeRabbit:false,mode:'normal',study}));assert.equal(r.report.pointsStart,0);assert(r.report.meals.v2_grass_to_grasshopper>0);assert(r.report.meals.v2_grasshopper_to_frog>0);assert(r.state.activities.filter(a=>a.activityId!=='rabbit_habitat'&&!a.activityId.startsWith('explore_')).every(a=>a.completed));assert(!r.state.activities.find(a=>a.activityId==='rabbit_habitat').completed);assert(r.report.currentlyGoalReady);emit(12,r.report);
});
test('13 long13: continuous40 vs20-save20 has identical receipts, reserved budget, environment/growth/life and points',()=>{
 const full=account(runEconomy(comparisonForest('core'),40,{mode:'normal',study})),first=account(runEconomy(comparisonForest('core'),20,{mode:'normal',study}));
 const loaded=decodeSave(JSON.stringify(first.snapshot));assert.equal(loaded.status,'loaded');const second=account(runEconomy(loaded.state,20,{mode:'normal',study,memory:loaded.eventMemory}));
 assert.deepEqual(second.state.pointEconomy,full.state.pointEconomy);assert.deepEqual(second.report.final,full.report.final);assert.deepEqual(second.state.environmentEvents,full.state.environmentEvents);assert.deepEqual(second.report.environment,full.report.environment);assert.deepEqual(second.report.life,full.report.life);assert.deepEqual(second.state.development,full.state.development);assert.deepEqual(second.report.pending,full.report.pending);assert.equal(second.report.points,full.report.points);
 // Save validation fills absent zero counters; compare actual cumulative values.
 for(const cause of new Set([...Object.keys(second.state.population.totals),...Object.keys(full.state.population.totals)]))assert.equal(second.state.population.totals[cause]||0,full.state.population.totals[cause]||0);
 for(const id of new Set([...Object.keys(first.report.meals),...Object.keys(second.report.meals),...Object.keys(full.report.meals)]))assert.equal((first.report.meals[id]||0)+(second.report.meals[id]||0),full.report.meals[id]||0);
 emit(13,{continuous:full.report,first20:first.report,last20:second.report});
});
test('13 long14: saturated36 queue keeps actual survival/core-food/growth ahead of economic information and never pays on refresh',()=>{
 const s=createGameState();Object.assign(s,{organisms:[],simulationTime:400,events:[]});let n=0;const add=(id,shortage=false)=>{const o=make(id,`priority-${++n}`);if(shortage)Object.assign(o,{hunger:1,foodShortageDuration:20,deprivationSeconds:180});s.organisms.push(o);return o;};
 const grass=add('grass'),pine=add('pine');Object.assign(grass,{growth:.2,foodStock:.3});Object.assign(pine,{growth:.2,foodStock:.3});for(const id of ['snail','caterpillar','chipmunk'])for(let i=0;i<8;i++)add(id,true);add('rabbit',true);const gh=add('grasshopper');
 const hunters={grasshopper:'frog',rabbit:'goshawk',caterpillar:'tit',snail:'ladybird',spider:'tit'};s.population.history=Object.entries(hunters).map(([speciesId,consumerSpeciesId],i)=>({sequence:i+1,speciesId,consumerSpeciesId,cause:'predation',changeType:'predation',simulationTime:350,countBefore:2,countAfter:1,noted:false}));s.population.sequence=5;
 s.development={sequence:1,history:[{sequence:1,instanceId:grass.instanceId,speciesId:'grass',stage:'grown',simulationTime:181,noted:false}]};startEnvironmentEvent(s,'cloudy');s.environment.sunlight.value=0;
 const e=createEventSystem(400),active=()=>s.events.filter(e=>e.status==='active');for(let i=0;i<4;i++)e.update(s,1);assert.equal(active().length,36);e.update(s,1,[{foodSpeciesId:'grass',consumerSpeciesId:'grasshopper',consumerInstanceId:gh.instanceId}]);assert.equal(active().length,36);assert(active().some(e=>e.payload.relationId==='v2_grass_to_grasshopper'));assert(active().some(e=>e.payload.developmentSequence));assert(!active().some(e=>e.payload.environmentEventId));assert.equal(s.metrics.points,0);emit(14,{explicitQueueBoundaryFixture:true,queue:36,coreAndGrowthRetained:true,points:0,biologyClaims:false});
});
process.on('exit',code=>{if(process.env.WRITE_ECONOMY_RESULTS)writeFileSync(new URL('./point-economy.long-results.json',import.meta.url),JSON.stringify({...results,exitCode:code},null,2)+'\n');});
