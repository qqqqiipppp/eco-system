import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {organisms} from '../data/organisms.js';
import {visualStates,visualAsset,createVisualTracker,stillSpecies} from '../js/ui/species-visuals.js';
import {world,emptyMemory} from './ecology-fixtures.mjs';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {consumerMotion,movingSpecies} from './visual-fixtures.mjs';
for(const species of organisms)test(species.id+': two authored local SVG views per declared state',()=>{
 const raw=readFileSync(new URL('../assets/images/species/'+species.id+'.svg',import.meta.url),'utf8');
 assert(!/https?:|<script|<filter|<animate|<image|foreignObject/.test(raw.replace('http://www.w3.org/2000/svg','')));assert(raw.length<45000);
 const crops=[];for(const state of visualStates[species.id])for(let f=0;f<2;f++){const match=raw.match(new RegExp('<view id="'+state+'-'+f+'" viewBox="([^"]+)"'));assert(match,visualAsset(species.id,state,f));crops.push(match[1]);}assert.equal(new Set(crops).size,crops.length);
});
for(const species of movingSpecies)test(species.id+': real FSM yields both frames of idle/move/eat',()=>{
 const r=consumerMotion(species.id);assert(r.meals>0,r.id+' actual meal');for(const state of ['idle','move','eat'])for(let frame=0;frame<2;frame++)assert(r.seen.has(state+'-'+frame),r.id+' '+state+'-'+frame+' saw '+[...r.seen.keys()]);
});
for(const revision of [1,2])for(const id of ['mushroom','litter-mold','soil-bacteria'])test(id+': real allocated work; goal'+revision+'; no resource no active',()=>{
 const s=world([[id,1,.8]]);s.goalRevision=revision;s.decomposition.organicMatter.remains=1;const before=structuredClone(s),t=createVisualTracker();assert.equal(t.sample(s)[0].motion,'idle');
 const work={};updateDecomposition(s,.5,work);assert(work[id]>0);assert.equal(t.sample(s,.1,work)[0].motion,'active');const without=structuredClone(before);updateDecomposition(without,.5);assert.deepEqual(s,without,'observer changes no domain');
 Object.keys(s.decomposition.organicMatter).forEach(k=>s.decomposition.organicMatter[k]=0);s.simulationTime=3;const none={};updateDecomposition(s,.5,none);assert.equal(none[id],undefined);assert.equal(t.sample(s,.1,none)[0].motion,'idle');
});
test('worm120/3 and real litter allocation distinguish all four views',()=>{
 const s=world([['earthworm',1,.9]]),worm=s.organisms[0];worm.life.initialAge=0;worm.life.startedAt=0;const t=createVisualTracker();assert.equal(t.sample(s)[0].motion,'covered');
 for(const time of [1,118]){s.simulationTime=time;updateDecomposition(s,.5);assert.equal(t.sample(s)[0].motion,time===1?'covered-eat':'eat');}
 s.simulationTime=119.5;assert.equal(t.sample(s)[0].motion,'surface');s.simulationTime=120;assert.equal(t.sample(s)[0].motion,'covered');
});
for(const id of organisms.filter(o=>o.role==='producer').map(o=>o.id))test(id+': mature leaf variation and actual growth, read only',()=>{
 const s=world([[id,1,.8]]),t=createVisualTracker();s.organisms[0].growth=.6;t.sample(s);const f=createFeedingSystem(0,{environmentEventsEnabled:false});for(let n=0;n<5;n++)f.update(s,.1);assert(s.organisms[0].growth>.6);const before=structuredClone(s);assert.equal(t.sample(s)[0].motion,'growth');assert.deepEqual(s,before);s.simulationTime=9;assert.equal(t.sample(s)[0].motion,stillSpecies.has(id)?'idle':'leaf-turn');
});
test('visuals preserve saved schema/rights and restored cumulative work starts idle',()=>{
 // Canonicalize the explicit all-card QA fixture's cumulative collection once.
 const s=decodeSave(JSON.stringify(createSaveSnapshot(world([['mushroom',1,.8],['earthworm',1,.9]]),emptyMemory))).state;updateDecomposition(s,.5);assert(s.learningGoalProgress.work.mushroom>0);const before=createSaveSnapshot(s,emptyMemory,'2026-10-22T00:00:00Z'),t=createVisualTracker();t.sample(s);for(let i=0;i<100;i++)t.sample(s,.1);assert.deepEqual(createSaveSnapshot(s,emptyMemory,'2026-10-22T00:00:00Z'),before);const r=decodeSave(JSON.stringify(before));assert.equal(r.status,'loaded');assert.equal(createVisualTracker().sample(r.state)[0].motion,'idle');
});
test('restored eating faces its actual target without changing saved direction',()=>{
 const s=world([['grasshopper',1,.8],['grass',1,.7]]),e=s.organisms[0];e.behaviorState='eat';e.targetInstanceId=s.organisms[1].instanceId;e.direction=1;const before=structuredClone(s);const row=createVisualTracker().sample(s)[0];assert.equal(row.motion,'eat');assert.equal(row.facing,-1);assert.deepEqual(s,before);
});
for(const id of stillSpecies)test(id+': stands still, one frame per state, while time passes',()=>{
 const s=world([[id,1,.8]]),t=createVisualTracker(),seen=new Set();
 for(let i=0;i<200;i++){s.simulationTime=i*.1;const row=t.sample(s,.1)[0];seen.add(row.motion+'-'+row.frame);}
 assert.deepEqual([...seen],['idle-0']);
});
