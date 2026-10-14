import test from 'node:test';
import assert from 'node:assert/strict';
import {organisms} from '../data/organisms.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {completeActivity} from '../js/systems/activities.js';
import {evaluateStability} from '../js/systems/stability.js';
import {updateForestGoal} from '../js/systems/forest-progress.js';
import {populationCounts} from '../js/systems/lifecycle.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {make,world,layout} from './ecology-fixtures.mjs';
function simulate(state,minutes,{learning=false,memory}={}){
 const initial=populationCounts(state),f=createFeedingSystem(state.simulationTime),events=createEventSystem(state.simulationTime,memory),meals={};let peak=state.organisms.length;
 for(let i=0;i<minutes*600;i++){
  const result=f.update(state,.1,layout);peak=Math.max(peak,state.organisms.length);
  for(const signal of result.feedingEvents)meals[signal.relationId]=(meals[signal.relationId]||0)+1;
  if(learning){events.update(state,.1,result.feedingEvents);for(const e of state.events.filter(e=>e.kind==='insight'&&e.status==='active'))events.acknowledge(state,e.eventId);if(state.observations.some(o=>o.relationId==='v2_grass_to_grasshopper')&&!state.activities.find(a=>a.activityId==='grass_observation').completed)completeActivity(state,'grass_observation');if(result.ticked){state.metrics.stability=evaluateStability(state).score;updateForestGoal(state,.5);}}
 }
 assert(peak<=30);assert(state.population.history.length<=80);assert.equal(new Set(state.organisms.map(o=>o.instanceId)).size,state.organisms.length);assert(Object.values(state.decomposition.organicMatter).every(v=>v>=0&&v<=30));
 const snapshot=createSaveSnapshot(state,events.exportMemory(),'2026-10-12T00:00:00Z'),raw=JSON.stringify(snapshot);
 assert.equal(decodeSave(raw).status,'loaded');
 const report={minutes,initial,final:populationCounts(state),changes:state.population.totals,stability:evaluateStability(state).score,organicMatter:state.decomposition.organicMatter,soilNutrients:state.decomposition.soilNutrients,processed:state.decomposition.processed,peak,meals,diagnostics:f.getDiagnostics(),saveBytes:Buffer.byteLength(raw),errors:0};
 return {state,report,snapshot};
}
const core=()=>world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7]],'long');
test('11.55 long 1: initial core web, actual meals and natural turnover over 40 active minutes',()=>{const r=simulate(core(),40);assert(r.report.meals.v2_grass_to_grasshopper>0);assert(r.report.meals.v2_grasshopper_to_frog>0);for(const id of ['oak','grass','grasshopper','frog'])assert(r.state.organisms.some(o=>o.speciesId===id));console.log('ECOLOGY_LONG_1',JSON.stringify(r.report));});
test('11.55 long 2: pine needles support larvae and limited stage replacement',()=>{const r=simulate(world([['pine',2,.3],['caterpillar',3,.35]]),40);assert(r.report.meals.v2_pine_to_caterpillar>0);assert(r.report.changes.life_stage_exit>0);assert(!r.state.population.history.some(r=>r.speciesId==='caterpillar'&&r.cause==='natural_lifespan'));console.log('ECOLOGY_LONG_2',JSON.stringify(r.report));});
test('11.55 long 3: hackberry fruit feeds bulbul without hazelnut stock',()=>{const r=simulate(world([['hazel',2,.3],['bulbul',2,.35]]),40);assert(r.report.meals.v2_hazel_to_bulbul>0);assert.equal(r.report.final.hazel,2);console.log('ECOLOGY_LONG_3',JSON.stringify(r.report));});
test('11.55 long 4: mollusc guild supports adopted snail/carabid feeding',()=>{const r=simulate(world([['grass',2,.3],['snail',3,.35],['ladybird',1,.4]]),40);assert(r.report.meals.v2_snail_to_ladybird>0);assert(!r.report.meals.v2_aphid_to_ladybird);console.log('ECOLOGY_LONG_4',JSON.stringify(r.report));});
test('11.55 long 5: changed insects and predators use adult host leaves without old sap or aphid birth',()=>{const r=simulate(world([['grass',3,.2],['pine',2,.4],['grasshopper',3,.25],['caterpillar',2,.45],['hazel',1,.6],['aphid',2,.5],['spider',1,.5],['snail',2,.3],['ladybird',1,.32],['field-mouse',1,.26]]),40);assert(r.report.meals.v2_pine_to_caterpillar>0);assert(r.report.meals.v2_aphid_to_spider>0);assert(r.report.meals.v2_hazel_to_aphid>0);assert(!r.state.population.history.some(r=>r.speciesId==='aphid'&&r.cause==='reproduction'));console.log('ECOLOGY_LONG_5',JSON.stringify(r.report));});
test('11.55 long 6: all three decomposer colonies keep their existing bounded cycle',()=>{const s=world([['oak',1,.6],['grass',2,.3],['mushroom',1,.4],['litter-mold',1,.5],['soil-bacteria',1,.55]]);s.decomposition.organicMatter={wood:10,litter:10,remains:10};const r=simulate(s,40);assert(r.report.processed>10);for(const id of ['mushroom','litter-mold','soil-bacteria'])assert(r.state.organisms.find(o=>o.speciesId===id).life.generation>0);console.log('ECOLOGY_LONG_6',JSON.stringify(r.report));});
test('11.55 long 7: same 11.5 23-type/30-instance seed, positions and active duration for comparison',()=>{const s=world(organisms.filter(o=>o.id!=='earthworm').map((o,i)=>[o.id,1,.22+(i%5)*.035]),'long');s.organisms.push(...Array.from({length:3},(_,i)=>make('grass','extra-grass'+i,.45+i*.03)),...Array.from({length:3},(_,i)=>make('grasshopper','extra-gh'+i,.48+i*.03)),make('aphid','extra-aphid',.35));const r=simulate(s,40);assert.equal(r.report.peak,30);assert(r.report.changes.predation>0);assert(r.report.changes.starvation>0);assert(r.report.changes.natural_lifespan>0);assert(r.report.diagnostics.candidateChecks<=r.report.diagnostics.searches*30);console.log('ECOLOGY_LONG_7',JSON.stringify(r.report));});
test('11.55 long 8: uninterrupted and saved/reloaded core keep food/life/learning/clear outcomes',()=>{
 const a=core(),b=core();for(const s of [a,b]){completeActivity(s,'producer_quiz','grass');completeActivity(s,'decomposer_classify','decomposer');}
 const continuous=simulate(a,40,{learning:true}),half=simulate(b,20,{learning:true}),loaded=decodeSave(JSON.stringify(half.snapshot));assert.equal(loaded.status,'loaded');const resumed=simulate(loaded.state,20,{learning:true,memory:loaded.eventMemory});
 assert.deepEqual(populationCounts(a),populationCounts(resumed.state));assert.deepEqual(a.activities,resumed.state.activities);assert.deepEqual(a.observations,resumed.state.observations);assert.equal(a.forestProgress.cleared,resumed.state.forestProgress.cleared);assert(a.forestProgress.cleared);assert.equal(a.metrics.points,resumed.state.metrics.points);assert.equal(a.decomposition.processed,resumed.state.decomposition.processed);assert.deepEqual(a.organisms.map(o=>o.life),resumed.state.organisms.map(o=>o.life));
 console.log('ECOLOGY_LONG_8',JSON.stringify({minutes:40,continuous:continuous.report,resumed:resumed.report,activities:a.activities,observations:a.observations,cleared:a.forestProgress.cleared,errors:0}));
});
