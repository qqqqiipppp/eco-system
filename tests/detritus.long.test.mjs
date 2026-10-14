import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {organisms} from '../data/organisms.js';
import {createGameState} from '../js/state/game-state.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {removeOrganism} from '../js/systems/lifecycle.js';
import {claimEnvironmentStudy,studyCandidates,studyRecovery,claimRecoverySupport} from '../js/systems/point-economy.js';
import {executeManagement} from '../js/systems/management.js';
import {world,make,emptyMemory} from './ecology-fixtures.mjs';
import {runEconomy,freshStudent,introduce,comparisonForest,exhaustedForest} from './point-economy-fixtures.mjs';
const results={stage:'13.5',schemaVersion:14,ecologyRevision:2,baselineCommit:'8b7f817',tickSeconds:.5,visualWander:false,scenarios:{}};
const study=s=>{for(const r of studyCandidates(s))assert(claimEnvironmentStudy(s,r.eventId,{factor:r.factor,recovery:studyRecovery(r)}).ok);};
const run=(s,minutes=40,options={})=>runEconomy(s,minutes,{checkpointEvery:0,...options});
const organic=s=>s.events.filter(e=>e.status==='active'&&e.payload.organicOriginSequence);
const closeTo=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function output(id,r,details={}){const p=r.report,s=r.state;const data={minutes:p.minutes,initialPoints:p.pointsStart,points:p.points,newEarned:p.newEarned,support:p.supportGranted,spent:p.spent,total:p.total,types:p.types,stability:p.stability,peak:p.peak,currentlyGoalReady:p.currentlyGoalReady,cleared:p.cleared,processed:s.decomposition.processed,wormProcessed:s.decomposition.earthwormProcessed,soilContribution:s.decomposition.soilContribution,soil:s.environment.soil.value,originSequence:s.decomposition.notices.sequence,originHistory:s.decomposition.notices.history.length,activeReactions:organic(s).length,...details};assert(s.organisms.length<=30);assert(s.decomposition.soilContribution<=.12);assert(s.decomposition.earthwormProcessed<=s.decomposition.processed+1e-8);assert(s.pointEconomy.studyCount<=5);assert(s.pointEconomy.totals.study<=20);results.scenarios[id]=data;console.log('DETRITUS_LONG_'+id,JSON.stringify(data));}
function all24(){const s=world(organisms.map((o,i)=>[o.id,1,.12+(i%6)*.10]));for(let i=0;i<6;i++)s.organisms.push(make('grass','capacity-grass-'+i,.3+i*.035));return s;}
function ending(id,worker){const s=world([[id,1,.4],...worker.map((id,i)=>[id,1,.42+i*.12])]);const o=s.organisms[0];o.life.initialAge=o.life.duration-.5;return s;}
test('13.5 long1: new0 student with five starter cards,actual learning/two core meals and two decomposers operates40minutes',()=>{
 const s=freshStudent();assert.equal(s.inventory.filter(c=>c.acquired).length,5);let bacteria=false;
 const r=run(s,40,{student:true,mode:'normal',study,onTick:s=>{if(!bacteria){assert(introduce(s,'soil-bacteria',.60).ok);bacteria=true;}}});assert(r.report.currentlyGoalReady);assert.equal(s.inventory.filter(c=>c.acquired).length,7);assert.equal(r.report.supportGranted,0);output(1,r,{acquired:7,studentCashInjection:0});
});
test('13.5 long2: both initial decomposers can be freely introduced before classifying, without autoachievement or cash',()=>{
 const s=createGameState();assert(introduce(s,'mushroom',.4).ok);assert(introduce(s,'soil-bacteria',.6).ok);const r=run(s,40);assert.equal(s.metrics.points,0);assert(s.activities.every(a=>!a.completed));assert(s.decomposition.processed>0);output(2,r,{activitiesCompleted:0});
});
test('13.5 long3: real shared litter feeds the soil animal and gradually contributes soil without any paid action or reward',()=>{
 const s=world([['grass',4,.4],['earthworm',1,.5]]);s.environment.soil.value=.35;const r=run(s);assert(s.decomposition.earthwormProcessed>0);assert(s.decomposition.soilContribution>0);assert.equal(s.metrics.points,0);assert.equal(s.managementActionCount,0);output(3,r);
});
test('13.5 long4: finite stock used by worm/fungus/background only once and yields nutrients only once over40minutes',()=>{
 const s=world([['earthworm',1,.4],['litter-mold',1,.45]]);s.decomposition.organicMatter={wood:0,litter:.01,remains:0};const r=run(s);closeTo(s.decomposition.processed,.01);closeTo(s.decomposition.soilNutrients,.01*.03);assert(s.decomposition.earthwormProcessed<.01);output(4,r,{finiteStock:.01});
});
test('13.5 long5: dry habitat prevents worm meals and soil help, and never makes a false feeding payout',()=>{
 const s=world([['grass',2,.4],['earthworm',1,.5]]);s.environment.water.value=0;s.environment.soil.value=.35;const r=run(s);assert.equal(s.decomposition.earthwormProcessed,0);assert.equal(s.decomposition.soilContribution,0);assert.equal(s.environment.soil.value,.35);assert.equal(s.metrics.points,0);output(5,r);
});
test('13.5 long6: better existingsoil is preserved; consuming litter cannot turn passive activity into paid care',()=>{
 const s=world([['grass',3,.4],['earthworm',3,.5]]);s.environment.soil.value=.9;const r=run(s);assert.equal(s.environment.soil.value,.9);assert.equal(s.decomposition.soilContribution,0);assert.equal(s.managementActionCount,0);assert.equal(s.metrics.points,0);output(6,r);
});
for(const [id,species,workers,part]of [[7,'oak',['mushroom','mushroom'],'wood'],[8,'grass',['earthworm','litter-mold'],'litter'],[9,'grasshopper',['soil-bacteria','soil-bacteria'],'remains']])test(`13.5 long${id}: actual lifespan ending emits${part} reaction at one nearest worker and actual processing remains separate`,()=>{
 const s=ending(species,workers);let first=null,confirmed=0;
 const r=run(s,40,{onTick:(s,e)=>{if(first)return;const event=organic(s)[0];if(event){first=structuredClone(s.decomposition.notices.history[0]);assert.equal(event.sourceId,first.targetInstanceId);assert(e.acknowledge(s,event.eventId).ok);confirmed++;}}});assert(first);assert.equal(first.part,part);assert.equal(confirmed,1);assert.equal(s.metrics.points,0);assert.equal(organic(s).length,0);output(id,r,{source:species,part,confirmed});
});
test('13.5 long10:24types/30individuals use real existing biology,one cap and bounded receipts over40minutes',()=>{
 const s=all24();assert.equal(new Set(s.organisms.map(o=>o.speciesId)).size,24);assert.equal(s.organisms.length,30);const r=run(s);assert.equal(r.report.peak,30);assert(s.decomposition.earthwormProcessed>0);assert.equal(s.metrics.points,0);assert(s.decomposition.notices.history.length<=20);output(10,r,{initialTypes:24,developmentFixture:true});
});
test('13.5 long11: unacknowledged one-time birth interest expires byactive120seconds and cannot reappear during fortyminutes',()=>{
 const s=ending('oak',['mushroom']);let seen=0;const r=run(s,40,{onTick:s=>{if(organic(s).length)seen++;if(s.simulationTime>121)assert.equal(organic(s).length,0);}});assert(seen>0);assert.equal(s.decomposition.notices.sequence,1);assert.equal(s.metrics.points,0);output(11,r,{seenTicks:seen});
});
test('13.5 long12: synchronized real lifespan boundary of a full30 fixture cannot overflow history or signal caps',()=>{
 const s=all24();for(const o of s.organisms)if('initialAge'in o.life)o.life.initialAge=o.life.duration-.5;let max=0;const r=run(s,40,{onTick:s=>{max=Math.max(max,organic(s).length);assert(organic(s).length<=6);assert(s.events.filter(e=>e.status==='active').length<=36);}});assert(s.decomposition.notices.sequence>20);assert(s.decomposition.notices.history.length<=20);assert.equal(s.metrics.points,0);output(12,r,{synchronizedBoundaryFixture:true,maxReactions:max});
});
test('13.5 long13: continuous40 vs20-save20 preserves real worm meals,soil budget,origins,lives,growth and currency',()=>{
 const build=()=>{const s=world([['grass',5,.4],['earthworm',1,.5],['litter-mold',1,.52],['soil-bacteria',1,.6]]);s.environment.soil.value=.35;return s;};
 const full=run(build()),first=run(build(),20),loaded=decodeSave(JSON.stringify(first.snapshot));assert.equal(loaded.status,'loaded');const second=run(loaded.state,20,{memory:loaded.eventMemory});assert.deepEqual(second.state.decomposition,full.state.decomposition);assert.deepEqual(second.state.pointEconomy,full.state.pointEconomy);assert.deepEqual(second.report.life,full.report.life);assert.deepEqual(second.state.development,full.state.development);assert.deepEqual(second.report.final,full.report.final);assert.deepEqual(second.state.environment,full.state.environment);output(13,second,{totalMinutes:40,continuousEquals:true});
});
test('13.5 long14: blocked prior13 continues after one real28 support,existing6/6/8/8 transactions and capped new studies',()=>{
 const s=exhaustedForest(),raw=createSaveSnapshot(s,emptyMemory,'2000-01-01T00:00:00Z');raw.schemaVersion=raw.domain.schemaVersion=13;raw.domain.inventory=raw.domain.inventory.filter(c=>c.speciesId!=='earthworm');delete raw.domain.decomposition.notices;delete raw.domain.decomposition.earthwormProcessed;delete raw.domain.decomposition.soilContribution;const loaded=decodeSave(JSON.stringify(raw));assert.equal(loaded.status,'loaded');assert(claimRecoverySupport(loaded.state).ok);
 const r=run(loaded.state,40,{student:true,mode:'observe',study,onTick:(s,e)=>{if(!s.pointEconomy.support.remaining)return;for(const factor of s.pointEconomy.support.factors.filter(f=>s.environment[f].value<.4)){const action=factor==='water'?'water-care':factor==='soil'?'soil-care':'habitat-care';const response=executeManagement(s,action,{sourceType:'environment',sourceId:factor});if(response.ok)e.refresh(s);}}});assert.equal(s.metrics.points,0);assert.equal(r.state.pointEconomy.totals.support,28);assert.equal(r.state.pointEconomy.totals.spent,28);assert(r.report.currentlyGoalReady);assert(!claimRecoverySupport(r.state).ok);output(14,r,{supportAlreadyGrantedBeforeRun:28,original13PointContractPreserved:true});
});
test('13.5 long15: all six exact original13 representative/mixed economics and biological endpoints still reproduce',()=>{
 const baseline=JSON.parse(readFileSync(new URL('./point-economy.long-results.json',import.meta.url),'utf8')).scenarios['9'],comparison={};
 for(const forest of ['representative','mixed'])for(const mode of ['none','observe','normal']){const r=run(comparisonForest(forest),40,{mode:mode==='none'?'observe':mode,enabled:mode!=='none',study}),old=baseline[forest+'-'+mode];assert.deepEqual(r.report.final,old.final);assert.deepEqual(r.report.meals,old.meals);assert.deepEqual(r.report.environment,old.environment);assert.deepEqual(r.report.changes,old.changes);assert.equal(r.report.stability,old.stability);assert.equal(r.report.points,old.points);comparison[forest+'-'+mode]={total:r.report.total,types:r.report.types,stability:r.report.stability,points:r.report.points};}
 results.scenarios[15]={minutes:40,exactOriginal13Endpoints:6,comparison};console.log('DETRITUS_LONG_15',JSON.stringify(results.scenarios[15]));
});
process.on('exit',code=>{if(process.env.WRITE_DETRITUS_RESULTS)writeFileSync(new URL('./detritus.long-results.json',import.meta.url),JSON.stringify({...results,exitCode:code},null,2)+'\n');});
