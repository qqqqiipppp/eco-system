import test from 'node:test';
import assert from 'node:assert/strict';
import {organisms} from '../data/organisms.js';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {naturalEndAt} from '../js/state/life-state.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {updateLifespans} from '../js/systems/lifespan.js';
import {evaluateStability} from '../js/systems/stability.js';
import {populationCounts,addOrganism} from '../js/systems/lifecycle.js';
import {validateIntroduction} from '../js/systems/population.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
const layout={footprints:Object.fromEntries(organisms.map(o=>[o.id,{halfWidth:.01,above:.1,below:.02}])),blockedRects:[]};
const make=(id,n,x=.4)=>createOrganismInstance(id,n,{x,y:.72});
function world(groups){const s=createGameState();s.organisms=groups.flatMap(([id,count,x],g)=>Array.from({length:count},(_,i)=>make(id,`long-${g}-${i}`,x+i*.035)));s.inventory.forEach(c=>c.acquired=true);s.population.introductions=Object.fromEntries([...new Set(s.organisms.map(o=>o.speciesId))].map(id=>[id,{count:s.organisms.filter(o=>o.speciesId===id).length,nextAt:0}]));return s;}
function simulate(s,minutes){const initial=populationCounts(s),f=createFeedingSystem(s.simulationTime);let peak=s.organisms.length;const start=performance.now();for(let i=0;i<minutes*600;i++){f.update(s,.1,layout);peak=Math.max(peak,s.organisms.length);}const ms=performance.now()-start;assert(peak<=30);assert(s.population.history.length<=80);assert(Object.values(s.decomposition.organicMatter).every(v=>v>=0&&v<=30));assert.equal(new Set(s.organisms.map(o=>o.instanceId)).size,s.organisms.length);return {minutes,initial,final:populationCounts(s),changes:{...s.population.totals},stability:evaluateStability(s).score,peak,history:s.population.history.length,soil:s.decomposition.soilNutrients,diagnostics:f.getDiagnostics(),desktopComputeMs:Math.round(ms),errors:0};}
const snapshot=s=>JSON.stringify(createSaveSnapshot(s,{sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-12T00:00:00Z'));
test('scenario 1: grass, grasshopper and aphid turnover over 40 active minutes',()=>{
 const s=world([['grass',5,.2],['grasshopper',4,.4],['hazel',3,.48],['aphid',4,.49]]),r=simulate(s,40);assert(r.changes.natural_lifespan>0);assert(r.changes.reproduction>0);assert(s.organisms.some(o=>o.speciesId==='grass'));assert(s.organisms.some(o=>o.speciesId==='grasshopper'));assert(s.organisms.some(o=>o.speciesId==='aphid'));console.log('LIFESPAN_LONG_1',JSON.stringify(r));
});
test('scenario 2: mature trees persist for 40 minutes and end at their individual boundary',()=>{
 const s=world([['oak',2,.3],['pine',1,.6]]),r=simulate(s,40);assert.equal(s.organisms.length,3);assert(!r.changes.natural_lifespan);const oak=s.organisms[0],end=naturalEndAt(oak);s.simulationTime=end-.01;assert(!updateLifespans(s,.5).includes(oak.instanceId));s.simulationTime=end;assert(updateLifespans(s,.5).includes(oak.instanceId));assert(s.decomposition.organicMatter.wood>=3);console.log('LIFESPAN_LONG_2',JSON.stringify({...r,oakEndMinutes:end/60,boundaryCause:s.population.history.at(-1).cause}));
});
test('scenario 3: shortages reduce real population; acquired cards retain a path to restoration',()=>{
 const s=world([['grass',1,.3],['grasshopper',6,.4],['frog',1,.45]]);s.environment.water.value=.15;const r=simulate(s,40);assert(r.changes.starvation>0);assert(!r.changes.reproduction);s.environment.water.value=1;s.simulationTime+=61;
 if(!s.organisms.some(o=>o.speciesId==='grass'))addOrganism(s,'grass',{x:.3,y:.72},'reintroduction');assert(validateIntroduction(s,'grasshopper').ok);assert(addOrganism(s,'grasshopper',{x:.4,y:.72},'reintroduction'));assert(s.inventory.find(c=>c.speciesId==='grasshopper').acquired);console.log('LIFESPAN_LONG_3',JSON.stringify({...r,recovery:'환경 회복 → 기존 풀 → 무료 재도입'}));
});
test('scenario 4: healthy core web continues through natural turnover for 40 minutes without manual placement',()=>{
 const s=world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7]]),r=simulate(s,40);assert(r.changes.natural_lifespan>0&&r.changes.reproduction>0);for(const id of ['oak','grass','grasshopper','frog','mushroom'])assert(s.organisms.some(o=>o.speciesId===id),id);console.log('LIFESPAN_LONG_4',JSON.stringify({...r,manualPlacements:0}));
});
test('scenario 5/Z: all 23 types and 30 initial instances over 40 minutes, bounded state and saves',()=>{
 const s=world(organisms.map((o,i)=>[o.id,1,.22+(i%5)*.035]));s.organisms.push(...Array.from({length:3},(_,i)=>make('grass','extra-grass'+i,.45+i*.03)),...Array.from({length:3},(_,i)=>make('grasshopper','extra-gh'+i,.48+i*.03)),make('aphid','extra-aphid',.35));const r=simulate(s,40);assert(r.changes.natural_lifespan>0);assert(r.changes.predation>0);assert(r.changes.starvation>0);assert(r.soil>0);const saved=snapshot(s),restored=decodeSave(saved);assert.equal(restored.status,'loaded');assert.deepEqual(populationCounts(restored.state),populationCounts(s));assert.deepEqual(restored.state.organisms.map(o=>o.life),s.organisms.map(o=>o.life));console.log('LIFESPAN_LONG_5',JSON.stringify({...r,saveBytes:Buffer.byteLength(saved)}));
});
test('scenario 6: 120-minute continuation has bounded turnover and valid manual recovery paths',()=>{
 const s=world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7]]),a=simulate(s,60),b=simulate(s,60);assert(s.organisms.some(o=>o.speciesId==='oak'));assert(s.organisms.some(o=>o.speciesId==='grass'));assert(s.organisms.some(o=>o.speciesId==='mushroom'));
 s.simulationTime+=61;const gh=validateIntroduction(s,'grasshopper');assert(gh.ok);if(!s.organisms.some(o=>o.speciesId==='grasshopper'))addOrganism(s,'grasshopper',{x:.45,y:.72},'reintroduction');assert(validateIntroduction(s,'frog').ok);console.log('LIFESPAN_LONG_6',JSON.stringify({at60:a,at120:b,recovery:'풀 유지 → 필요하면 메뚜기 → 개구리 재도입',permanentBlock:false}));
});
test('scenario 7: saved continuation preserves original life endpoints and reasonable population outcomes',()=>{
 const a=world([['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7]]),b=structuredClone(a),endpoints=Object.fromEntries(a.organisms.filter(o=>o.life.duration).map(o=>[o.instanceId,naturalEndAt(o)]));simulate(a,40);simulate(b,20);const restored=decodeSave(snapshot(b)).state;for(const o of restored.organisms)if(endpoints[o.instanceId])assert.equal(naturalEndAt(o),endpoints[o.instanceId]);simulate(restored,20);
 const ca=populationCounts(a),cb=populationCounts(restored);for(const id of ['oak','grass','grasshopper','frog','mushroom'])assert(Math.abs((ca[id]||0)-(cb[id]||0))<=1);assert(Math.abs((a.population.totals.natural_lifespan||0)-(restored.population.totals.natural_lifespan||0))<=1);console.log('LIFESPAN_LONG_7',JSON.stringify({minutes:40,continuous:ca,reloaded:cb,continuousChanges:a.population.totals,reloadedChanges:restored.population.totals,stabilityA:evaluateStability(a).score,stabilityB:evaluateStability(restored).score,errors:0}));
});
