import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {createGameState} from '../js/state/game-state.js';
import {createSaveSnapshot,decodeSave,SAVE_VERSION} from '../js/services/save-format.js';
import {createSaveService} from '../js/services/save-service.js';
import {createNextForest,replayTopics} from '../js/systems/replay.js';
import {evaluateForestGoal,updateForestGoal} from '../js/systems/forest-progress.js';
import {evaluateLearningGoals,connectedFoodChain,confirmDecomposerRole,beginInquiry,advanceGoalInquiry,confirmInquiry,inquiryChoices} from '../js/systems/learning-goals.js';
import {recordDecomposerWork} from '../js/state/learning-goal-state.js';
import {forestAction} from '../js/ui/forest-flow.js';
import {goalPresentation} from '../js/systems/goal-guidance.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {completeActivity} from '../js/systems/activities.js';
import {learningProfile,goalStudent} from './learning-goal-fixtures.mjs';
import {introduce,runEconomy,layout,emptyMemory,learn} from './point-economy-fixtures.mjs';
import {legacySave,world} from './ecology-fixtures.mjs';
import {recordSpeciesObservation} from '../js/state/collection-state.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {executeManagement} from '../js/systems/management.js';
import {claimRecoverySupport,supportQuote,claimEnvironmentStudy,studyCandidates,studyRecovery} from '../js/systems/point-economy.js';
import {organisms} from '../data/organisms.js';
import {foodRelations} from '../data/food-relations.js';
import {survivalConfig} from '../data/survival-config.js';
import {exhaustedForest} from './point-economy-fixtures.mjs';
const clone=v=>structuredClone(v),snapshot=s=>createSaveSnapshot(s,emptyMemory,'2026-10-19T00:00:00Z'),load=s=>decodeSave(JSON.stringify(snapshot(s)));
const results={stage:'15.10',actualStudents:false,profiles:[],rounds:[],migrations:[]};
const finishRoles=s=>{completeActivity(s,'producer_quiz','grass');completeActivity(s,'decomposer_classify','decomposer');};
// Deliberate evidence fixtures exercise individual rejection boundaries. Full
// profiles below only acquire evidence from the actual ecology/events pipeline.
function evidenceForest(){const s=world([['grass',2,.4],['grasshopper',2,.42],['frog',1,.45],['mushroom',1,.32]]);s.simulationTime=10;finishRoles(s);s.observations=[{relationId:'v2_grass_to_grasshopper',discoveredAt:5,eventId:'fixture'}];return s;}
test('new0/5 uses goal2/schema17, unchanged24/27/30, hunger/satiety/refuge and no new reward',()=>{
 const s=createGameState();assert.equal(SAVE_VERSION,17);assert.equal(s.schemaVersion,17);assert.equal(s.goalRevision,2);assert.equal(s.ecologyRevision,2);assert.equal(s.pacingRevision,1);assert.equal(s.inventory.filter(c=>c.acquired).length,5);assert.equal(s.metrics.points,0);assert.equal(organisms.length,24);assert.equal(foodRelations.length,27);assert.equal(survivalConfig.hungerScale,1.6);assert.equal(survivalConfig.satietyScale,1);assert.equal(survivalConfig.earthwormCycleSeconds,120);assert.equal(survivalConfig.earthwormSurfaceSeconds,3);assert.equal(load(s).status,'loaded');
});
test('quiz/card clicks/time alone cannot complete new goals and rendering writes nothing',()=>{
 const s=createGameState();finishRoles(s);introduce(s,'grasshopper');introduce(s,'mushroom');const before=clone(s);
 for(let i=0;i<20;i++){forestAction(s);goalPresentation(s);evaluateLearningGoals(s);}assert.deepEqual(s,before);s.simulationTime=900;assert(!evaluateLearningGoals(s).some(g=>g.ok));assert(!confirmInquiry(s).ok);assert(!confirmDecomposerRole(s,'mushroom').ok);assert(!beginInquiry(s,s.organisms[2].instanceId,'watch').ok);assert(!updateForestGoal(s,1000));
});
test('A requires actual connected records, not two unrelated relations or cumulative guide',()=>{
 const s=evidenceForest();s.profile.relations=foodRelations.map(r=>({relationId:r.relationId,firstRound:1,discoveredAt:0}));assert(!connectedFoodChain(s));s.observations.push({relationId:'v2_oak_to_chipmunk',discoveredAt:8});assert(!connectedFoodChain(s));s.observations.push({relationId:'v2_grasshopper_to_frog',discoveredAt:9});assert(connectedFoodChain(s));s.observations.push(clone(s.observations[0]));assert.equal(evaluateLearningGoals(s)[0].ok,true);
});
test('B excludes background, earthworm consumer, mere notice and unclassified/absent worker',()=>{
 const s=createGameState();updateDecomposition(s,.5);assert(s.decomposition.processed>0);assert.equal(Object.values(s.learningGoalProgress.work).reduce((a,b)=>a+b,0),0);recordDecomposerWork(s,'earthworm',1);assert(!confirmDecomposerRole(s,'earthworm').ok);introduce(s,'mushroom');updateDecomposition(s,.5);assert(s.learningGoalProgress.work.mushroom>0);assert(!confirmDecomposerRole(s,'mushroom').ok);finishRoles(s);const points=s.metrics.points,receipts=clone(s.rewardHistory);assert(confirmDecomposerRole(s,'mushroom').ok);const proof=clone(s.learningGoalProgress.decomposer);for(let i=0;i<5;i++)assert(confirmDecomposerRole(s,'mushroom').ok);assert.deepEqual(proof,s.learningGoalProgress.decomposer);assert.equal(s.metrics.points,points);assert.deepEqual(s.rewardHistory,receipts);assert(s.learningGoalProgress.work.mushroom<=s.decomposition.processed);
});
test('delayed true decomposition gives no false completion and initial wood permits life-without-death path',()=>{
 const s=createGameState();finishRoles(s);introduce(s,'mushroom');s.decomposition.organicMatter.wood=0;s.organisms=s.organisms.filter(o=>o.speciesId!=='oak');updateDecomposition(s,.5);assert.equal(s.learningGoalProgress.work.mushroom,0);assert(!confirmDecomposerRole(s,'mushroom').ok);introduce(s,'oak',.2);updateDecomposition(s,.5);assert(s.learningGoalProgress.work.mushroom>0);assert(confirmDecomposerRole(s,'mushroom').ok);assert(!s.population.history.some(r=>['natural_lifespan','starvation'].includes(r.cause)));
});
test('C watch requires a post-choice real meal, later recovery and separate explicit confirmation',()=>{
 const s=evidenceForest(),plant=s.organisms[0];assert(beginInquiry(s,plant.instanceId,'watch').ok);const cash=s.metrics.points;
 s.simulationTime=20;advanceGoalInquiry(s,[]);assert.equal(s.learningGoalProgress.inquiry.phase,'watching');assert(!confirmInquiry(s).ok);
 plant.foodStock=1;advanceGoalInquiry(s,[{relationId:'v2_grass_to_grasshopper',foodInstanceId:plant.instanceId}]);assert(!confirmInquiry(s).ok);plant.foodStock=2;advanceGoalInquiry(s,[]);assert.equal(s.learningGoalProgress.inquiry.phase,'watching');s.simulationTime=20.5;advanceGoalInquiry(s,[]);assert.equal(s.learningGoalProgress.inquiry.phase,'result');assert(!evaluateLearningGoals(s)[2].ok);assert(confirmInquiry(s).ok);assert(evaluateLearningGoals(s)[2].ok);assert.equal(s.metrics.points,cash);
});
test('C plant cannot count preexisting/reproduced/unrelated plant or placement alone',()=>{
 const s=evidenceForest(),plant=s.organisms[0];assert(beginInquiry(s,plant.instanceId,'plant').ok);s.simulationTime=11;advanceGoalInquiry(s,[{relationId:'v2_grass_to_grasshopper',foodInstanceId:plant.instanceId}]);assert.equal(s.learningGoalProgress.inquiry.meal,null);const r=introduce(s,'grass',.66);assert(r.ok);assert.deepEqual(s.learningGoalProgress.inquiry.introducedIds,[r.instance.instanceId]);assert(!confirmInquiry(s).ok);
});
test('C bad environment disallows passive choice, money/irrelevant care alone cannot count',()=>{
 const s=evidenceForest(),plant=s.organisms[0];s.environment.sunlight.value=.15;assert(!inquiryChoices(s,plant.instanceId).find(c=>c.id==='watch').available);assert(beginInquiry(s,plant.instanceId,'care').ok);s.metrics.points=100;s.simulationTime=11;advanceGoalInquiry(s,[{relationId:'v2_grass_to_grasshopper',foodInstanceId:plant.instanceId}]);assert.equal(s.learningGoalProgress.inquiry.meal,null);assert(!confirmInquiry(s).ok);assert(executeManagement(s,'habitat-care',{sourceType:'environment',sourceId:'sunlight'}).ok);assert(!confirmInquiry(s).ok);s.simulationTime=11.5;plant.foodStock=1;advanceGoalInquiry(s,[{relationId:'v2_grass_to_grasshopper',foodInstanceId:plant.instanceId}]);s.simulationTime=12;plant.foodStock=2;advanceGoalInquiry(s,[]);assert.equal(s.learningGoalProgress.inquiry.phase,'result');assert(confirmInquiry(s).ok);
});
test('lost observation plant interrupts, can retry on current plant; saved result survives later loss',()=>{
 const s=evidenceForest(),plant=s.organisms[0];assert(beginInquiry(s,plant.instanceId,'watch').ok);s.organisms.splice(0,1);s.simulationTime=11;advanceGoalInquiry(s,[]);assert.equal(s.learningGoalProgress.inquiry.phase,'interrupted');assert(!confirmInquiry(s).ok);assert(beginInquiry(s,s.organisms.find(o=>o.speciesId==='grass').instanceId,'watch').ok);
});
test('no current specific predator required once its genuine connected records exist',()=>{
 const r=learningProfile('instant'),s=r.state;assert(s.forestProgress.cleared);s.forestProgress={cleared:false,clearedAt:null,stableSeconds:0};s.organisms=s.organisms.filter(o=>o.speciesId!=='frog');s.metrics.stability=90;assert(evaluateForestGoal(s).ready);assert(updateForestGoal(s,30));
});
for(const kind of ['instant','fast','normal','wrong','manager','minimal'])test('paired20 goal1/goal2 actual ecology '+kind,()=>{
 const a=learningProfile(kind,1),b=learningProfile(kind,2);assert(a.state.forestProgress.cleared);assert(b.state.forestProgress.cleared);assert(b.metrics.proof.decomposer.processed>0);assert(b.metrics.proof.inquiry.meal.at>b.metrics.proof.inquiry.at);assert(b.metrics.proof.inquiry.outcome.at>b.metrics.proof.inquiry.meal.at);assert(b.metrics.proof.inquiry.confirmedAt>=b.metrics.proof.inquiry.outcome.at);assert.equal(b.state.pointEconomy.studyCount<=5,true);assert(b.state.pointEconomy.totals.study<=20);assert(b.state.pointEconomy.totals.support<=28);assert.equal(b.state.rewardHistory.length,new Set(b.state.rewardHistory.map(r=>r.rewardId)).size);assert(b.result.report.peak<=30);assert.equal(load(b.state).status,'loaded');results.profiles.push({kind,before:a.metrics,after:b.metrics});if(kind==='wrong')assert(b.metrics.wrongAnswers>0);if(kind==='minimal')assert.equal(b.state.managementActionCount,0);
});
for(const version of [7,8,9,10,11,12,13,14,15,16])for(const cleared of [false,true])test('old'+version+' '+(cleared?'completed':'ongoing')+' retains goal1 and all vested rights through17',()=>{
 let raw=version<10?legacySave(version):JSON.parse(readFileSync(new URL('./biodiversity.saved16-before.json',import.meta.url)));raw.schemaVersion=raw.domain.schemaVersion=version;delete raw.domain.goalRevision;delete raw.domain.learningGoalProgress;if(!cleared)raw.domain.forestProgress={cleared:false,clearedAt:null,stableSeconds:version>=15?10:0};else raw.domain.forestProgress={cleared:true,clearedAt:0,stableSeconds:30};const r=decodeSave(JSON.stringify(raw));assert(!r.blocked);assert.equal(r.state.goalRevision,1);assert.equal(r.state.forestProgress.cleared,cleared);const again=load(r.state);assert.equal(again.state.goalRevision,1);for(const k of ['inventory','rewardHistory','metrics','pointEconomy','forestProgress'])assert.deepEqual(again.state[k],r.state[k]);results.migrations.push({version,cleared,status:r.status,goalRevision:r.state.goalRevision});
});
test('new17 progress roundtrip, partial corruption resets incomplete proof safely, future policy blocks writes',()=>{
 const s=learningProfile('instant').state,raw=snapshot(s),r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');assert.deepEqual(r.state.learningGoalProgress,s.learningGoalProgress);
 for(const patch of [p=>p.work.mushroom=-1,p=>p.inquiry.outcome.at=0,p=>p.inquiry.choice='free',p=>p.inquiry.meal.foodId='fake',p=>p.decomposer.processed=1e9]){const x=clone(raw);patch(x.domain.learningGoalProgress);const bad=decodeSave(JSON.stringify(x));assert.equal(bad.status,'recovered');assert(bad.state.forestProgress.cleared);assert.deepEqual(bad.state.rewardHistory,s.rewardHistory);}
 raw.domain.goalRevision=9;let stored=JSON.stringify(raw);const service=createSaveService({adapter:{read:()=>stored,write:v=>stored=v},getState:()=>s,getEventMemory:()=>emptyMemory});assert.equal(service.load().status,'unknown-goal');assert(!service.flush(true));assert.equal(stored,JSON.stringify(raw));service.dispose();
 const future=snapshot(s);future.schemaVersion=future.domain.schemaVersion=18;assert(decodeSave(JSON.stringify(future)).blocked);
});
test('600 active save +600 active current goals, life/rights exact at boundary and max30',()=>{
 const s=createGameState(),goal=goalStudent();introduce(s,'grasshopper');const options={student:true,mode:'normal',checkpointEvery:0,onTick:goal.tick};const first=runEconomy(s,10,options),loaded=decodeSave(JSON.stringify(first.snapshot));assert.equal(loaded.status,'loaded');for(const k of ['inventory','rewardHistory','pointEconomy','learningGoalProgress','forestProgress'])assert.deepEqual(loaded.state[k],s[k]);const rest=runEconomy(loaded.state,10,{...options,memory:loaded.eventMemory});assert.equal(rest.state.simulationTime,1200);assert(rest.state.forestProgress.cleared);assert(rest.report.peak<=30);assert.equal(rest.state.rewardHistory.length,new Set(rest.state.rewardHistory.map(r=>r.rewardId)).size);
});
test('new policy repeated50 reload/role/result/study/support confirms never repay any receipt',()=>{
 let s=learningProfile('instant').state;const cash=s.metrics.points,ledger=clone(s.pointEconomy),receipts=clone(s.rewardHistory);
 for(let i=0;i<50;i++){s=load(s).state;confirmDecomposerRole(s,'mushroom');confirmInquiry(s);for(const episode of s.environmentEvents.history)claimEnvironmentStudy(s,episode.eventId,{factor:episode.factor,recovery:'wait'});assert.equal(s.metrics.points,cash);assert.deepEqual(s.pointEconomy,ledger);assert.deepEqual(s.rewardHistory,receipts);}
 s=exhaustedForest();assert.equal(s.goalRevision,2);assert(supportQuote(s).available);assert(claimRecoverySupport(s).ok);const support=clone(s.pointEconomy),balance=s.metrics.points;
 for(let i=0;i<20;i++){s=load(s).state;assert(!claimRecoverySupport(s).ok);assert.equal(s.metrics.points,balance);assert.deepEqual(s.pointEconomy,support);assert(s.pointEconomy.totals.support<=28);}
});
test('same watch input keeps all ecological values/economy exactly equal across goal revisions',()=>{
 for(const kind of ['instant','fast','normal','wrong','minimal']){const a=learningProfile(kind,1).state,b=learningProfile(kind,2).state;for(const key of ['organisms','environment','decomposition','development','population','rewardHistory','managementHistory','pointEconomy'])assert.deepEqual(b[key],a[key],kind+':'+key);}
});
test('frog unlock deliberately delayed until600: earned card and real predation still reach new goals',()=>{
 const s=createGameState(),goal=goalStudent({cadence:15});introduce(s,'grasshopper',.43);introduce(s,'mushroom',.32);finishRoles(s);
 runEconomy(s,20,{checkpointEvery:0,onTick:(s,e)=>{
  for(const ev of s.events.filter(ev=>ev.status==='active'&&ev.kind==='insight'&&ev.payload.relationId))e.acknowledge(s,ev.eventId);
  if(s.simulationTime>=600)completeActivity(s,'grass_observation','confirm');
  if(s.inventory.find(c=>c.speciesId==='frog').acquired&&!s.organisms.some(o=>o.speciesId==='frog'))introduce(s,'frog',.43);
  if(!s.organisms.some(o=>o.speciesId==='grasshopper'))introduce(s,'grasshopper',.43);
  goal.tick(s);
 }});assert(s.forestProgress.cleared);assert(s.forestProgress.clearedAt>=600);assert(s.forestProgress.clearedAt<1200);assert(s.observations.some(o=>o.relationId==='v2_grasshopper_to_frog'));assert.equal(s.inventory.filter(c=>c.acquired).length,6);
});
test('repeat forest with only the vested5 cards/zero cash can finish without frog or paid care',()=>{
 const prior=createGameState({goalRevision:1});prior.forestProgress={cleared:true,clearedAt:0,stableSeconds:30};const s=createNextForest(prior,'food:v2_grass_to_grasshopper').state,goal=goalStudent({cadence:15});assert.equal(s.inventory.filter(c=>c.acquired).length,5);assert.equal(s.metrics.points,0);introduce(s,'grasshopper',.43);introduce(s,'mushroom',.32);finishRoles(s);
 runEconomy(s,4,{checkpointEvery:0,onTick:(s,e)=>{for(const ev of s.events.filter(ev=>ev.status==='active'&&ev.kind==='insight'&&ev.payload.relationId))e.acknowledge(s,ev.eventId);if(!s.organisms.some(o=>o.speciesId==='grasshopper'))introduce(s,'grasshopper',.43);goal.tick(s);}});
 assert(s.forestProgress.cleared);assert.equal(s.inventory.filter(c=>c.acquired).length,5);assert.equal(s.managementActionCount,0);assert.equal(s.round.care.spent,0);assert(!s.organisms.some(o=>o.speciesId==='frog'));results.rounds.push({initialCards:5,topic:s.round.topic,clearAt:s.forestProgress.clearedAt,care:0,goalRevision:s.goalRevision});
});
test('new17 unknown/missing policy blocked, missing unfinished proof recovered and valid legacy hold retained',()=>{
 const s=learningProfile('instant').state,raw=snapshot(s);raw.domain.forestProgress={cleared:false,clearedAt:null,stableSeconds:12};delete raw.domain.learningGoalProgress;const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.goalRevision,2);assert.equal(r.state.forestProgress.stableSeconds,0);assert.equal(r.state.learningGoalProgress.inquiry,null);
 delete raw.domain.goalRevision;assert(decodeSave(JSON.stringify(raw)).blocked);
 const old=createGameState({goalRevision:1});old.simulationTime=20;old.forestProgress.stableSeconds=12;const restored=load(old);assert.equal(restored.state.goalRevision,1);assert.equal(restored.state.forestProgress.stableSeconds,12);
});
test('first/repeat minimal/all-owned topic forests reset evidence but preserve cards,points,care28',()=>{
 const old=learningProfile('instant',1).state;for(const all of [false,true]){const original=clone(old);if(all)original.inventory.forEach(c=>c.acquired=true);for(const topic of replayTopics(original).filter(t=>all?['soil','producers','food:v2_earthworm_to_ladybird'].includes(t.id):t.id==='food:v2_grass_to_grasshopper')){
  const next=createNextForest(original,topic.id);assert(next.ok);const s=next.state,goal=goalStudent();assert.equal(s.goalRevision,2);assert.deepEqual(s.learningGoalProgress,createGameState().learningGoalProgress);assert.equal(s.observations.length,0);assert.equal(s.round.inspected.length,0);assert.equal(s.round.care.limit,28);assert.equal(s.metrics.points,original.metrics.points);assert.deepEqual(s.inventory,original.inventory);const model=(s,e)=>{learn(s,e);for(const o of s.organisms)recordSpeciesObservation(s,o.instanceId);if(topic.id==='soil')for(const id of ['earthworm','mushroom','soil-bacteria'])if(!s.organisms.some(o=>o.speciesId===id))introduce(s,id,.44);if(topic.id==='food:v2_earthworm_to_ladybird')for(const id of ['earthworm','ladybird'])if(!s.organisms.some(o=>o.speciesId===id))introduce(s,id,.44);goal.tick(s);};const r=runEconomy(s,20,{onTick:model,mode:'normal'});assert(s.forestProgress.cleared,topic.id);assert.equal(s.rewardHistory.length,new Set(s.rewardHistory.map(r=>r.rewardId)).size);assert(s.round.care.spent<=28);results.rounds.push({all,topic:topic.id,clearAt:s.forestProgress.clearedAt,cards:s.inventory.filter(c=>c.acquired).length,care:s.round.care.spent,peak:r.report.peak});}
 }
});
test.after(()=>{if(process.env.WRITE_LEARNING_GOALS)writeFileSync(new URL('./learning-goal.models-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');});
