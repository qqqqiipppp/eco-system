import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {organisms} from '../data/organisms.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {completeActivity} from '../js/systems/activities.js';
import {evaluateStability} from '../js/systems/stability.js';
import {updateForestGoal} from '../js/systems/forest-progress.js';
import {populationCounts} from '../js/systems/lifecycle.js';
import {placeOrganism} from '../js/systems/placement.js';
import {validateIntroduction} from '../js/systems/population.js';
import {developmentStage,canReproduce} from '../js/systems/development.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {world,make,layout,emptyMemory} from './ecology-fixtures.mjs';

const core=()=>world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7]],'long');
function mixed(){const s=world(organisms.map((o,i)=>[o.id,1,.22+(i%5)*.035]),'long');s.organisms.push(...Array.from({length:3},(_,i)=>make('grass','extra-grass'+i,.45+i*.03)),...Array.from({length:3},(_,i)=>make('grasshopper','extra-gh'+i,.48+i*.03)),make('aphid','extra-aphid',.35));return s;}
const counts=s=>populationCounts(s);
const completedStages=new Set(['seeding','adult','spore-ready']);
function summary(s,f,initial,minutes,peak,meals,growth,eventMemory=emptyMemory){
 const snapshot=createSaveSnapshot(s,eventMemory,'2000-01-01T00:00:00Z');
 return {minutes,activeSeconds:s.simulationTime,initial,final:counts(s),total:s.organisms.length,speciesCount:Object.keys(counts(s)).length,
  grasshopperAdults:s.organisms.filter(o=>o.speciesId==='grasshopper'&&developmentStage(o)==='adult').length,
  changes:{...s.population.totals},growthCompleted:growth.completed,growthTransitions:growth.transitions,stageCompletions:{...growth.bySpecies},
  stability:evaluateStability(s).score,coreMeals:{grassToGrasshopper:meals.v2_grass_to_grasshopper||0,grasshopperToFrog:meals.v2_grasshopper_to_frog||0},
  meals:{...meals},organicMatter:{...s.decomposition.organicMatter},soilNutrients:s.decomposition.soilNutrients,processed:s.decomposition.processed,
  pending:Object.fromEntries(Object.entries(s.population.breeding).filter(([,m])=>m.pending).map(([id,m])=>[id,structuredClone(m.pending)])),eggReserve:s.population.replenishment.grasshopper?.reserve||0,
  peak,diagnostics:f.getDiagnostics(),saveBytes:Buffer.byteLength(JSON.stringify(snapshot)),visualWander:false,errors:0};
}
// Use the production .5s ecology tick via five .1s updates. We do not accelerate
// the state clock directly. Visual random wandering is omitted in BOTH before
// and after measurements, matching the existing 11.55 long-time fixtures.
function simulate(s,minutes,{learning=false,memory,isolatedNutrition=false,check,checkpoint}={}){
 const f=createFeedingSystem(s.simulationTime,{environmentEventsEnabled:false}),events=createEventSystem(s.simulationTime,memory),initial=counts(s),meals={},seen=new Set();
 const growth={completed:0,transitions:0,bySpecies:{}},stages=new Set(),pendingSeen=new Set();let peak=s.organisms.length,checkpointReport;
 function scan(){for(const r of s.development.history){if(seen.has(r.sequence))continue;seen.add(r.sequence);growth.transitions++;if(completedStages.has(r.stage)){growth.completed++;growth.bySpecies[r.speciesId]=(growth.bySpecies[r.speciesId]||0)+1;}}for(const o of s.organisms)if(o.development)stages.add(o.speciesId+':'+developmentStage(o));for(const[id,m]of Object.entries(s.population.breeding))if(m.pending)pendingSeen.add(id);}
 scan();
 for(let tick=0;tick<minutes*120;tick++){
  if(isolatedNutrition)for(const o of s.organisms)if('hunger'in o){o.hunger=.1;o.lastSuccessfulFeedingAt=s.simulationTime;}
  let ticked=false;
  for(let step=0;step<5;step++){
   const result=f.update(s,.1,layout);ticked||=result.ticked;peak=Math.max(peak,s.organisms.length);
   for(const signal of result.feedingEvents)meals[signal.relationId]=(meals[signal.relationId]||0)+1;
   if(learning){events.update(s,.1,result.feedingEvents);for(const e of s.events.filter(e=>e.kind==='insight'&&e.status==='active'))events.acknowledge(s,e.eventId);if(s.observations.some(o=>o.relationId==='v2_grass_to_grasshopper')&&!s.activities.find(a=>a.activityId==='grass_observation').completed)completeActivity(s,'grass_observation');}
   if(result.ticked){s.metrics.stability=evaluateStability(s).score;if(learning)updateForestGoal(s,.5);}
  }
  assert(ticked);scan();if(check)check(s,tick*.5+.5);
  assert(s.organisms.length<=30);assert(new Set(s.organisms.map(o=>o.instanceId)).size===s.organisms.length);
  if(checkpoint&&tick+1===checkpoint*120)checkpointReport=summary(s,f,initial,checkpoint,peak,meals,growth,events.exportMemory());
 }
 assert.equal(f.getDiagnostics().ticks,minutes*120);assert(s.population.history.length<=80);assert(s.development.history.length<=60);
 assert(Object.values(s.decomposition.organicMatter).every(v=>v>=0&&v<=30));assert(s.decomposition.soilNutrients>=0&&s.decomposition.soilNutrients<=1);
 const snapshot=createSaveSnapshot(s,events.exportMemory(),'2000-01-01T00:00:00Z');assert.equal(decodeSave(JSON.stringify(snapshot)).status,'loaded');
 const report={...summary(s,f,initial,minutes,peak,meals,growth,events.exportMemory()),isolatedNutrition};
 return {state:s,report,snapshot,memory:events.exportMemory(),stages,pendingSeen,checkpointReport};
}

// Optional authoritative before/after mode: COMPARE_HEAD=1. The worker reads
// the fixed 11.55 commit straight from Git into vm.SourceTextModule memory.
// No checkout, implementation copy or baseline source file is created.
let beforeCache;
function baseline(){
 if(beforeCache)return beforeCache;
 if(process.env.COMPARE_HEAD!=='1')return null;
 const worker=String.raw`
import vm from 'node:vm';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const git=args=>execFileSync('git',['-C',process.cwd(),'-c','safe.directory='+process.cwd(),'--no-optional-locks',...args],{encoding:'utf8'});
const sha='0eb9a18d68657d8046d6eda15dff96e007d1c1b3',cache=new Map(),context=vm.createContext({structuredClone,console:{log(){},warn(){},error(){}}});
const exportsSource="export {createGameState} from './js/state/game-state.js';export {createOrganismInstance} from './js/state/organism-instance.js';export {organisms} from './data/organisms.js';export {createFeedingSystem} from './js/systems/feeding.js';export {evaluateStability} from './js/systems/stability.js';export {createSaveSnapshot} from './js/services/save-format.js';export {populationCounts} from './js/systems/lifecycle.js';";
function load(id){if(cache.has(id))return cache.get(id);const source=id==='entry.mjs'?exportsSource:git(['show',sha+':'+id]);const m=new vm.SourceTextModule(source,{context,identifier:id});cache.set(id,m);return m;}
const entry=load('entry.mjs');await entry.link((specifier,parent)=>load(path.posix.normalize(path.posix.join(path.posix.dirname(parent.identifier),specifier))));await entry.evaluate();const api=entry.namespace;
const layout={footprints:Object.fromEntries(api.organisms.map(o=>[o.id,{halfWidth:.01,above:.1,below:.02}])),blockedRects:[]};
const make=(id,n,x=.4)=>api.createOrganismInstance(id,n,{x,y:.72});
function world(groups){const s=api.createGameState();s.organisms=groups.flatMap(([id,count,x],g)=>Array.from({length:count},(_,i)=>make(id,'long-'+g+'-'+i,x+i*.035)));s.inventory.forEach(c=>c.acquired=true);s.population.introductions=Object.fromEntries([...new Set(s.organisms.map(o=>o.speciesId))].map(id=>[id,{count:s.organisms.filter(o=>o.speciesId===id).length,nextAt:0}]));return s;}
function run(s){const f=api.createFeedingSystem(s.simulationTime),meals={};let peak=s.organisms.length;for(let i=0;i<24000;i++){const r=f.update(s,.1,layout);peak=Math.max(peak,s.organisms.length);for(const e of r.feedingEvents)meals[e.relationId]=(meals[e.relationId]||0)+1;}const final=api.populationCounts(s),snapshot=api.createSaveSnapshot(s,{sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2000-01-01T00:00:00Z');return {minutes:40,total:s.organisms.length,speciesCount:Object.keys(final).length,final,grasshopperAdults:s.organisms.filter(o=>o.speciesId==='grasshopper').length,changes:s.population.totals,growthCompleted:0,stability:api.evaluateStability(s).score,coreMeals:{grassToGrasshopper:meals.v2_grass_to_grasshopper||0,grasshopperToFrog:meals.v2_grasshopper_to_frog||0},organicMatter:s.decomposition.organicMatter,soilNutrients:s.decomposition.soilNutrients,processed:s.decomposition.processed,peak,diagnostics:f.getDiagnostics(),saveBytes:Buffer.byteLength(JSON.stringify(snapshot)),visualWander:false,errors:0};}
const c=world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7]]),m=world(api.organisms.map((o,i)=>[o.id,1,.22+(i%5)*.035]));m.organisms.push(...Array.from({length:3},(_,i)=>make('grass','extra-grass'+i,.45+i*.03)),...Array.from({length:3},(_,i)=>make('grasshopper','extra-gh'+i,.48+i*.03)),make('aphid','extra-aphid',.35));
console.log(JSON.stringify({baselineSha:sha,core:run(c),mixed:run(m)}));`;
 const result=spawnSync(process.execPath,['--experimental-vm-modules','--input-type=module','-e',worker],{cwd:new URL('..',import.meta.url),encoding:'utf8',maxBuffer:1024*1024});
 assert.equal(result.status,0,result.stderr);beforeCache=JSON.parse(result.stdout.trim());return beforeCache;
}

test('11.6 long 1: annual grass leaves seed waiting, sprout, grown and a distinct new seed generation',()=>{
 const r=simulate(world([['grass',1,.3]],'seed-long'),40);
 assert(r.pendingSeen.has('grass'));assert(r.stages.has('grass:sprout'));assert(r.stages.has('grass:grown'));assert(r.stages.has('grass:seeding'));
 assert(r.report.changes.reproduction>0&&r.report.changes.natural_lifespan>0);assert(r.report.growthCompleted>0);
 assert(r.state.organisms.some(o=>o.speciesId==='grass'));console.log('DEVELOPMENT_LONG_1',JSON.stringify(r.report));
});
test('11.6 long 2: isolated nourished grasshopper eggs hatch nymphs, mature and leave bounded future eggs',()=>{
 const r=simulate(world([['grass',4,.2],['grasshopper',2,.4]],'egg-long'),40,{isolatedNutrition:true,check:s=>{assert((s.population.replenishment.grasshopper?.reserve||0)<=6);for(const o of s.organisms.filter(o=>o.speciesId==='grasshopper'&&developmentStage(o)==='nymph'))assert(!canReproduce(o,s.simulationTime));}});
 assert(r.pendingSeen.has('grasshopper'));assert(r.stages.has('grasshopper:nymph'));assert(r.stages.has('grasshopper:adult'));assert(r.report.stageCompletions.grasshopper>0);assert(r.report.changes.reproduction>0);
 console.log('DEVELOPMENT_LONG_2',JSON.stringify(r.report));
});
test('11.6 long 3: isolated nourished hare baby and juvenile mature before two adults can reproduce',()=>{
 const s=world([['grass',4,.2],['rabbit',1,.4]],'hare-long');s.organisms.push(createOrganismInstance('rabbit','starting-baby',{x:.45,y:.72},{newborn:true}));let firstBirth=null;
 const r=simulate(s,40,{isolatedNutrition:true,check:(s,time)=>{if(s.population.history.some(h=>h.speciesId==='rabbit'&&h.cause==='reproduction')&&!firstBirth)firstBirth=time;for(const o of s.organisms.filter(o=>o.speciesId==='rabbit'&&developmentStage(o)!=='adult'))assert(!canReproduce(o,s.simulationTime));}});
 assert(r.stages.has('rabbit:baby'));assert(r.stages.has('rabbit:juvenile'));assert(r.stages.has('rabbit:adult'));assert(r.report.stageCompletions.rabbit>0);
 assert(r.state.population.history.some(h=>h.speciesId==='rabbit'&&h.cause==='reproduction'));assert(firstBirth>=360);
 console.log('DEVELOPMENT_LONG_3',JSON.stringify({...r.report,firstObservedBirthSeconds:firstBirth}));
});
test('11.6 long 4: real wood supports fungal fruiting/spore states without a new colony or duplicated nutrient yield',()=>{
 const s=world([['mushroom',1,.4]],'fungal-long');s.decomposition.organicMatter.wood=10;const control=structuredClone(s);control.organisms[0].development.progressSeconds=300;control.organisms[0].development.stage='spore-ready';
 const r=simulate(s,10),c=simulate(control,10);
 assert(r.stages.has('mushroom:fruiting'));assert(r.stages.has('mushroom:spore-ready'));assert.equal(r.state.organisms.length,1);assert.equal(r.state.metrics.points,0);
 assert.equal(s.development.history.find(h=>h.stage==='fruiting').simulationTime,180);assert.equal(s.development.history.find(h=>h.stage==='spore-ready').simulationTime,300);
 assert.equal(r.report.processed,c.report.processed);assert.equal(r.report.soilNutrients,c.report.soilNutrients);assert.deepEqual(r.report.organicMatter,c.report.organicMatter);assert(!r.report.changes.reproduction);
 console.log('DEVELOPMENT_LONG_4',JSON.stringify({...r.report,fruitingAt:180,sporeReadyAt:300,nutrientControlEqual:true}));
});
test('11.6 long 5: actual healthy core remains observable through 40 minutes of feeding, growth and natural turnover',()=>{
 const r=simulate(core(),40);for(const id of ['oak','grass','grasshopper','frog','mushroom'])assert(r.state.organisms.some(o=>o.speciesId===id),id);
 assert(r.report.coreMeals.grassToGrasshopper>0&&r.report.coreMeals.grasshopperToFrog>0);assert(r.report.growthCompleted>0);
 const before=baseline();console.log('DEVELOPMENT_LONG_5',JSON.stringify({...r.report,...(before?{baselineSha:before.baselineSha,before:before.core}:{})}));
});
test('11.6 long 6: exact prior 23-type/30-instance mixed fixture has bounded after/before measurements at 40 minutes',()=>{
 const r=simulate(mixed(),40);assert.equal(r.report.peak,30);assert(r.report.changes.predation>0);assert(r.report.changes.starvation>0);assert(r.report.changes.natural_lifespan>0);
 const before=baseline();if(before){assert.equal(before.mixed.speciesCount,9);assert.equal(before.mixed.total,12);assert.equal(before.mixed.stability,69);}
 console.log('DEVELOPMENT_LONG_6',JSON.stringify({...r.report,priorReported:{speciesCount:9,total:12,stability:69},...(before?{baselineSha:before.baselineSha,before:before.mixed}:{})}));
});
test('11.6 long 7: continuous40 and saved20+resumed20 preserve population, growth, life, pending and learning outcomes',()=>{
 const a=core(),b=core();for(const s of [a,b]){completeActivity(s,'producer_quiz','grass');completeActivity(s,'decomposer_classify','decomposer');}
 const continuous=simulate(a,40,{learning:true}),half=simulate(b,20,{learning:true}),loaded=decodeSave(JSON.stringify(half.snapshot));assert.equal(loaded.status,'loaded');
 assert.deepEqual(loaded.state.organisms.map(o=>o.development),b.organisms.map(o=>o.development));assert.deepEqual(loaded.state.organisms.map(o=>o.life),b.organisms.map(o=>o.life));assert.deepEqual(loaded.state.population.breeding,b.population.breeding);
 const resumed=simulate(loaded.state,20,{learning:true,memory:loaded.eventMemory});
 assert.deepEqual(counts(a),counts(resumed.state));assert.deepEqual(a.organisms.map(o=>o.life),resumed.state.organisms.map(o=>o.life));assert.deepEqual(a.organisms.map(o=>o.development),resumed.state.organisms.map(o=>o.development));assert.deepEqual(a.population.breeding,resumed.state.population.breeding);
 assert.deepEqual(a.activities,resumed.state.activities);assert.deepEqual(a.observations,resumed.state.observations);assert.equal(a.forestProgress.cleared,resumed.state.forestProgress.cleared);assert(a.forestProgress.cleared);assert.equal(a.metrics.points,resumed.state.metrics.points);
 console.log('DEVELOPMENT_LONG_7',JSON.stringify({minutes:40,continuous:continuous.report,resumed:resumed.report,immediateReloadExact:true,finalGrowthLifePendingExact:true,cleared:a.forestProgress.cleared,errors:0}));
});
test('11.6 long 8: ordinary starter placement and two real meals still unlock the adult frog through explicit observations',()=>{
 const s=createGameState(),f=createFeedingSystem(),events=createEventSystem();assert.equal(s.inventory.filter(c=>c.acquired).length,3);
 assert(placeOrganism(s,'grasshopper',{position:{x:.44,y:.7},isPlayArea:true,isUI:false},layout).ok);let first=null,second=null;
 for(let step=0;step<1200&&!second;step++){
  const r=f.update(s,.1,layout);events.update(s,.1,r.feedingEvents);
  const insight=s.events.find(e=>e.kind==='insight'&&e.status==='active'&&e.payload.relationId);
  if(insight){assert(events.acknowledge(s,insight.eventId).ok);if(insight.payload.relationId==='v2_grass_to_grasshopper'&&!first){first=s.simulationTime;assert(completeActivity(s,'grass_observation').ok);assert(s.inventory.find(c=>c.speciesId==='frog').acquired);assert(placeOrganism(s,'frog',{position:{x:.44,y:.7},isPlayArea:true,isUI:false},layout).ok);}if(insight.payload.relationId==='v2_grasshopper_to_frog')second=s.simulationTime;}
 }
 assert(first!==null&&second>first);assert.equal(s.observations.length,2);assert.equal(developmentStage(s.organisms.find(o=>o.speciesId==='frog')),'adult');assert(s.activities.find(a=>a.activityId==='grass_observation').completed);
 console.log('DEVELOPMENT_LONG_8',JSON.stringify({firstMealAt:first,secondMealAt:second,points:s.metrics.points,observations:s.observations,acquired:s.inventory.filter(c=>c.acquired).map(c=>c.speciesId),errors:0}));
});
test('11.6 long 9: real ecology at30 never spends a blocked seed/egg or removes another organism to make room',()=>{
 const s=world([['grass',1,.4],['oak',29,.6]],'capacity-long');
 for(const o of s.organisms.filter(o=>o.speciesId==='oak'))o.position={x:.6,y:.72};
 s.population.breeding.grass={healthySeconds:0,nextAt:240,pending:{remainingSeconds:60,position:{x:.2,y:.72}}};s.population.breeding.grasshopper={healthySeconds:0,nextAt:360,pending:{remainingSeconds:60,position:{x:.3,y:.72}}};s.population.replenishment.grasshopper={healthySeconds:0,nextAt:300,reserve:2};
 const ids=s.organisms.map(o=>o.instanceId),sequence=s.nextInstanceSequence,r=simulate(s,10);
 assert.deepEqual(s.organisms.map(o=>o.instanceId),ids);assert.equal(s.nextInstanceSequence,sequence);assert.equal(r.report.total,30);assert.equal(r.report.eggReserve,2);assert.equal(s.population.breeding.grass.pending.remainingSeconds,0);assert.equal(s.population.breeding.grasshopper.pending.remainingSeconds,0);assert(!s.population.history.length);
 console.log('DEVELOPMENT_LONG_9',JSON.stringify(r.report));
});
test('11.6 long 10: representative35–40-minute forest uses real food and supports required observations without input inflation',()=>{
 const representative=()=>{const s=world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7],['rabbit',2,.32]],'representative');for(const id of ['producer_quiz','decomposer_classify'])completeActivity(s,id,id==='producer_quiz'?'grass':'decomposer');return s;};
 const s=representative(),initial=structuredClone(s);
 const r=simulate(s,40,{learning:true,checkpoint:35});assert(r.checkpointReport);
 // The unassisted result is reported as observed: finite eggs and real
 // predation may leave a consumer absent. No species receives immortality.
 assert(s.forestProgress.cleared);assert(r.report.coreMeals.grassToGrasshopper>0&&r.report.coreMeals.grasshopperToFrog>0);assert(r.report.growthCompleted>0);
 const managed=representative(),actions=[],blocked=new Set();let firstAbsenceAt=null;
 // This is the same deterministic ecosystem fixture, with one ordinary card
 // action after absence. Its existing card/introduction history is retained;
 // there is no development placement bypass, food injection or point grant.
 assert.deepEqual(managed,initial);
 assert(managed.inventory.find(c=>c.speciesId==='grasshopper').acquired);assert.equal(managed.population.introductions.grasshopper.count,6);
 const m=simulate(managed,40,{learning:true,checkpoint:35,check:(state)=>{
  if(actions.length||state.organisms.some(o=>o.speciesId==='grasshopper'))return;
  firstAbsenceAt??=state.simulationTime;
  const loss=state.population.history.findLast(h=>h.speciesId==='grasshopper'&&h.countAfter===0);
  assert(loss);assert(state.population.introductions.grasshopper.nextAt>=loss.simulationTime+60);
  for(const grass of state.organisms.filter(o=>o.speciesId==='grass')){
   const position={x:grass.position.x+.03,y:grass.position.y},allowed=validateIntroduction(state,'grasshopper',position,layout);
   if(!allowed.ok){blocked.add(allowed.reason);continue;}
   const points=state.metrics.points,result=placeOrganism(state,'grasshopper',{position,isPlayArea:true,isUI:false},layout);
   if(!result.ok){blocked.add(result.reason);continue;}
   assert(state.simulationTime-loss.simulationTime>=60);assert.equal(state.metrics.points,points);assert.equal(developmentStage(result.instance),'adult');
   actions.push({speciesId:'grasshopper',at:state.simulationTime,afterLossSeconds:state.simulationTime-loss.simulationTime,firstAbsenceAt,position,pointsUnchanged:true});break;
  }
 }});
 assert.equal(actions.length,1);assert(blocked.has('cooldown'));assert(m.state.forestProgress.cleared);
 console.log('DEVELOPMENT_LONG_10',JSON.stringify({unassisted:{at35:r.checkpointReport,at40:r.report,manualPlacements:0,cleared:s.forestProgress.cleared},managed:{at35:m.checkpointReport,at40:m.report,manualPlacements:actions.length,actions,blockedReasons:[...blocked],cleared:m.state.forestProgress.cleared},sameInitialFixture:true,foodOrHungerOverrides:0,errors:0}));
});
