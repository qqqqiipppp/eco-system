import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {organisms} from '../data/organisms.js';
import {foodRelations} from '../data/food-relations.js';
import {placementConfig} from '../data/interaction-config.js';
import {feedingConfig} from '../data/ecology-config.js';
import {createGameState} from '../js/state/game-state.js';
import {findNearestPlacement,placeNearestOrganism} from '../js/systems/placement-target.js';
import {isPositionAllowed} from '../js/systems/placement-rules.js';
import {createHabitatPresentation} from '../js/systems/habitat-presentation.js';
import {provideHabitatAnchors} from '../js/systems/habitat-anchors.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createWanderSystem} from '../js/systems/wander.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {geometry} from './spatial-fixtures.mjs';
import {world,emptyMemory} from './ecology-fixtures.mjs';
const input=(x=.9,y=.72)=>({position:{x,y},isPlayArea:true,isUI:false});
const support={caterpillar:'pine',aphid:'hazel',grasshopper:'grass',chipmunk:'oak'};
const rows=[],meals=[];
for(const o of organisms)for(const [side,x]of [['left',.16],['middle',.5],['right',.9]])test('nearest '+o.id+' '+side+': actual model, matching view, pure preview, unchanged rights',()=>{
 const state=world(support[o.id]?[[support[o.id],1,x-.035]]:[]),g=geometry(),before=structuredClone(state),start=performance.now();
 const prediction=findNearestPlacement(state,o.id,input(x,.4),g);assert(prediction.ok,o.id+' '+side+' '+prediction.message);assert.deepEqual(state,before);
 const result=placeNearestOrganism(state,o.id,input(x,.4),g);assert(result.ok);assert(isPositionAllowed(o.id,result.instance.position,g));
 const p=createHabitatPresentation();p.rebuild(state.organisms,g);const actual=p.position(result.instance);
 assert.deepEqual(actual,result.placement.screenPosition);assert.deepEqual(result.instance.position,prediction.position);
 assert(Math.abs(actual.x/g.width-x)<=.221);if(side==='right'){assert(result.instance.position.x>.69,o.id+' model stays on the right');assert(actual.x/g.width>.69,o.id+' view stays on the right');}
 assert.deepEqual(state.inventory,before.inventory);assert.equal(state.metrics.points,before.metrics.points);assert.deepEqual(state.rewardHistory,before.rewardHistory);
 rows.push({speciesId:o.id,side,requested:input(x,.4).position,model:result.instance.position,screen:actual,distancePixels:result.placement.distance,anchor:result.placement.anchorId,checked:result.placement.checked,elapsedMs:performance.now()-start});
});
test('same raw touch respects actual CSS pixel aspect, deterministic nearest of evaluated candidates',()=>{
 const s=world([['pine',1,.87]]),before=structuredClone(s);
 for(const [w,h]of [[1200,340],[1080,296],[922,215],[1308,320],[382,380]]){const g=geometry(w,h),a=findNearestPlacement(s,'caterpillar',input(.9,.5),g),b=findNearestPlacement(s,'caterpillar',input(.9,.5),g);assert.deepEqual(a,b);assert(a.ok);assert.equal(a.distance,Math.hypot(a.screenPosition.x-.9*w,a.screenPosition.y-.5*h));}
 assert.deepEqual(s,before);
});
test('UI/outside/invalid/locked/cap/cooldown/food failures have no domain mutation',()=>{
 const s=world([]),g=geometry(),before=structuredClone(s);
 for(const i of [{...input(),isUI:true},{...input(),isPlayArea:false},input(NaN),input(-.1),input(1.1)])assert(!placeNearestOrganism(s,'frog',i,g).ok);
 assert.deepEqual(s,before);s.inventory.find(c=>c.speciesId==='frog').acquired=false;assert.equal(placeNearestOrganism(s,'frog',input(),g).reason,'inventory');
 s.inventory.find(c=>c.speciesId==='frog').acquired=true;s.population.introductions.frog={count:3,nextAt:10};assert.equal(placeNearestOrganism(s,'frog',input(),g).reason,'cooldown');
 s.population.introductions.frog.nextAt=0;assert.equal(placeNearestOrganism(s,'frog',input(),g).reason,'food');
 const full=world([['grass',30,.1]]);assert.equal(placeNearestOrganism(full,'frog',input(),g).reason,'limit');
});
test('far living plant is not secretly projected from left to right; nonexistent background food is not used',()=>{
 const s=world([['pine',1,.16]]),before=structuredClone(s),g=geometry();assert(!placeNearestOrganism(s,'caterpillar',input(.95,.4),g).ok);assert.deepEqual(s,before);
 s.population.introductions.caterpillar={count:3,nextAt:0};s.organisms=[];assert.equal(placeNearestOrganism(s,'caterpillar',input(),g).reason,'food');
});
test('large plant spacing and physical/visual UI obstacles remain enforced; no hidden far fallback',()=>{
 const s=world([['oak',1,.9]]),g=geometry(),r=placeNearestOrganism(s,'pine',input(),g);assert(r.ok);assert(Math.abs(r.instance.position.x-.9)>=placementConfig.largePlantSpacing.x);
 const sealed={...g,blockedRects:[{left:0,right:1,top:0,bottom:1}],visualBlockedRects:[{left:0,right:1,top:0,bottom:1}]},before=structuredClone(s);assert(!placeNearestOrganism(s,'frog',input(),sealed).ok);assert.deepEqual(s,before);
});
test('new right placements and old left coordinates survive17 reload and remain read-only across sizes',()=>{
 const s=createGameState();s.inventory.forEach(c=>c.acquired=true);const old=s.organisms.map(o=>[o.instanceId,{...o.position}]),g=geometry(),r=placeNearestOrganism(s,'grass',input(.94,.9),g);assert(r.ok);
 const raw=createSaveSnapshot(s,emptyMemory,'2026-10-22T00:00:00Z'),restored=decodeSave(JSON.stringify(raw));assert.equal(restored.status,'loaded');assert.equal(raw.schemaVersion,17);assert.equal(raw.domain.goalRevision,2);
 for(const [id,pos]of old)assert.deepEqual(restored.state.organisms.find(o=>o.instanceId===id).position,pos);assert.deepEqual(restored.state.organisms.find(o=>o.instanceId===r.instance.instanceId).position,r.instance.position);
 for(const [w,h]of [[1200,340],[922,215],[382,380]]){const p=createHabitatPresentation();p.rebuild(restored.state.organisms,geometry(w,h));assert(p.position(restored.state.organisms.find(o=>o.instanceId===r.instance.instanceId)).x/w>.69);}
});
for(const relation of foodRelations)test('right actual food FSM '+relation.relationId+' retains direction, search, contact and worm protection',()=>{
 const s=world([[relation.sourceSpeciesId,1,.88],[relation.targetSpeciesId,1,.89]]),g=geometry(),engine=createFeedingSystem(0,{environmentEventsEnabled:false});let count=0,at=null;
 if(relation.sourceSpeciesId==='earthworm')s.organisms[0].life.initialAge=0;
 for(let i=0;i<1320&&!count;i++){
  const e=engine.update(s,.1,g);const found=e.feedingEvents.filter(m=>m.relationId===relation.relationId);count+=found.length;if(found.length)at=s.simulationTime;
  if(relation.sourceSpeciesId==='earthworm'&&s.simulationTime<117)assert.equal(count,0);
 }
 assert(count>0,relation.relationId);assert.equal(s.metrics.points,0);assert.equal(s.observations.length,0);meals.push({relationId:relation.relationId,at,count});
});
test('right wander bounces inside the expanded physical area without new speeds or through UI',()=>{
 const s=world([['rabbit',1,.91]]),g=geometry(),system=createWanderSystem(()=>.75);let moves=0;
 for(let i=0;i<1800;i++){moves+=system.update(s.organisms,1/30,g).length;assert(isPositionAllowed('rabbit',s.organisms[0].position,g));}assert(moves>0);assert(s.organisms[0].position.x>.69);
 s.organisms[0].position={x:.9,y:.72};const blocked={...g,blockedRects:[{left:.94,right:1,top:0,bottom:1}]};for(let i=0;i<600;i++){system.update(s.organisms,1/30,blocked);assert(isPositionAllowed('rabbit',s.organisms[0].position,blocked));}assert(s.organisms[0].position.x<.94);
});
test('three mapped tree crowns are visual support only; all used anchors retain their capacities',()=>{
 const s=world([['tit',2,.88],['bulbul',2,.9],['goshawk',2,.92]]),g=geometry(),p=createHabitatPresentation();p.rebuild(s.organisms,g);const anchors=provideHabitatAnchors(s.organisms,g),usage=new Map();
 for(const o of s.organisms){const id=p.descriptor(o.instanceId).anchorId;usage.set(id,(usage.get(id)||0)+1);}for(const [id,n]of usage)assert(n<=anchors.find(a=>a.id===id).capacity);
 assert.equal(anchors.filter(a=>a.zone==='canopy').length,3);assert(!s.organisms.some(o=>o.speciesId==='oak'));
});
test('a full nearby crown cannot silently use a distant left crown or bypass capacity on the ground',()=>{
 const s=world([['tit',2,.92],['rabbit',1,.9],['grass',1,.88]]),g=geometry(),before=structuredClone(s);assert(!placeNearestOrganism(s,'goshawk',input(.97,.3),g).ok);assert.deepEqual(s,before);
});
test('right litter/soil and three decomposer placements never fabricate work; actual shared processing remains finite',()=>{
 const s=world([]),g=geometry();s.decomposition.organicMatter={wood:.001,litter:.001,remains:.001};s.environment.soil.value=.45;
 for(const id of ['earthworm','mushroom','litter-mold','soil-bacteria']){const before=structuredClone(s.decomposition),r=placeNearestOrganism(s,id,input(),g);assert(r.ok);assert.deepEqual(s.decomposition,before);}
 const p=createHabitatPresentation();p.rebuild(s.organisms,g);assert.equal(p.descriptor(s.organisms.find(o=>o.speciesId==='earthworm').instanceId).anchorId,'background:low-ground');
 updateDecomposition(s,10);assert(Math.abs(s.decomposition.processed-.003)<1e-12);assert(s.decomposition.earthwormProcessed>0);assert(s.decomposition.soilContribution>0);assert.equal(s.metrics.points,0);
});
test('bounded candidate search at29 organisms reaches the real30 limit without a new render loop',()=>{
 const s=world([...organisms.map((o,i)=>[o.id,1,.12+(i%6)*.1]),['grass',5,.2]]),g=geometry(),t=performance.now(),r=placeNearestOrganism(s,'grass',input(.94,.4),g);assert(r.ok);assert.equal(s.organisms.length,30);assert(r.placement.checked<180);const ms=performance.now()-t;rows.push({profile:'29to30',checked:r.placement.checked,elapsedMs:ms});assert.equal(placeNearestOrganism(s,'grass',input(),g).reason,'limit');
});
process.on('exit',code=>writeFileSync(new URL('./full-forest.unit-results.json',import.meta.url),JSON.stringify({stage:'15.11.5',exitCode:code,actualS5e:false,rows,meals,searchRadii:feedingConfig},null,2)+'\n'));
