import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {foodRelations,relationsByConsumer} from '../data/food-relations.js';
import {organisms,organismById} from '../data/organisms.js';
import {feedingConfig,foodResourceConfig} from '../data/ecology-config.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {recoverFoodStock,hasFoodStock} from '../js/systems/food-resources.js';
import {createHabitatPresentation} from '../js/systems/habitat-presentation.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {world,make,layout} from './ecology-fixtures.mjs';
import {geometry} from './spatial-fixtures.mjs';

const results={stage:'15.6',relations:[],multiple:[],limits:[]};
function setup(consumer,foods=[]){
 const s=world([[consumer,1,.4]]),e=s.organisms[0];e.hunger=1;
 for(const [id,x=.41]of foods){const o=make(id,'food-'+s.organisms.length,x);if('hunger'in o)o.hunger=0;s.organisms.push(o);}
 const f=createFeedingSystem(0,{environmentEventsEnabled:false}),meals=[];
 const run=(seconds=4,g=layout)=>{for(let i=0;i<Math.round(seconds*10);i++){const r=f.update(s,.1,g);meals.push(...r.feedingEvents);}return meals;};
 return {s,e,f,run,meals};
}
const permutations=a=>a.length<2?[a]:a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(t=>[v,...t]));
for(const r of foodRelations)test('15.6 relation '+r.relationId+': real meal, absence, distance, blocked destination, stale target, discovery once',()=>{
 const a=setup(r.targetSpeciesId,[[r.sourceSpeciesId]]),food=a.s.organisms[1],stock=food.foodStock;
 a.run(2.5);assert.equal(a.meals.length,1);assert.equal(a.meals[0].relationId,r.relationId);assert.equal(a.meals[0].foodPart,r.foodPart);
 assert.equal(a.s.organisms.includes(food),r.feedingMode==='resource');
 if(r.feedingMode==='resource')assert(food.foodStock<stock);else assert.equal(a.s.population.totals.predation,1);
 const ev=createEventSystem();ev.update(a.s,1,a.meals);const notice=a.s.events.find(e=>e.payload.relationId===r.relationId);assert(notice);
 assert.equal(a.s.observations.length,0);assert.equal(a.s.metrics.points,0);assert(ev.acknowledge(a.s,notice.eventId).ok);assert.equal(a.s.metrics.points,12);
 ev.update(a.s,1,a.meals);assert(!ev.acknowledge(a.s,notice.eventId).ok);assert.equal(a.s.observations.length,1);assert.equal(a.s.metrics.points,12);
 const loaded=decodeSave(JSON.stringify(createSaveSnapshot(a.s,ev.exportMemory(),'2026-10-15T00:00:00Z')));assert.equal(loaded.status,'loaded');assert.equal(loaded.state.metrics.points,12);assert.equal(loaded.state.observations.length,1);
 const absent=setup(r.targetSpeciesId);absent.run();assert.equal(absent.meals.length,0);assert(absent.e.feedingClock.shortage);
 const distant=setup(r.targetSpeciesId,[[r.sourceSpeciesId,.95]]);distant.run();assert.equal(distant.meals.length,0);
 const blocked=setup(r.targetSpeciesId,[[r.sourceSpeciesId,.42]]);blocked.run(4,{...layout,blockedRects:[{left:.415,right:.43,top:0,bottom:1}]});assert.equal(blocked.meals.length,0);
 const stale=setup(r.targetSpeciesId,[[r.sourceSpeciesId]]);stale.run(1.5);assert.equal(stale.e.behaviorState,'eat');stale.s.organisms.splice(1,1);stale.run(3);assert.equal(stale.meals.length,0);assert.equal(stale.e.targetInstanceId,null);
 let depleted='not applicable';
 if(r.feedingMode==='resource'){
  const b=setup(r.targetSpeciesId,[[r.sourceSpeciesId]]);b.s.organisms[1].foodStock=0;b.run(2.5);assert.equal(b.meals.length,0);
  const p=b.s.organisms[1];recoverFoodStock(p,60,b.s.environment);assert(hasFoodStock(p,r));b.run(6);assert(b.meals.length>0);
  const c=setup(r.targetSpeciesId,[[r.sourceSpeciesId]]);c.run(1.5);c.s.organisms[1].foodStock=0;c.run(1);assert.equal(c.meals.length,0);depleted='zero before search / zero during bite rejected; recovery feeds';
 }
 results.relations.push({relationId:r.relationId,source:r.sourceSpeciesId,sourceName:organismById[r.sourceSpeciesId].name,consumer:r.targetSpeciesId,consumerName:organismById[r.targetSpeciesId].name,mode:r.feedingMode,part:r.foodPart,evidence:r.evidenceLevel,evidenceId:r.evidenceId,success:true,absent:true,outOfRange:true,blocked:true,removedDuringBite:true,discoveryOnce:true,save:true,depleted});
});
for(const id of ['goshawk','weasel','tit','bulbul','chipmunk']){
 const edges=relationsByConsumer.get(id),foods=edges.map(r=>r.sourceSpeciesId);
 test('15.6 '+id+': each sole alternative and all candidates; nearest independent of relation and instance order',()=>{
  const winners=[];
  for(const food of foods){const a=setup(id,[[food]]);a.run(3);assert(a.meals.some(m=>m.foodSpeciesId===food));}
  // Every species wins when nearest, under every relation order and both creation orders.
  const original=[...edges];try{for(const nearest of foods)for(const order of permutations(original))for(const reverse of [false,true]){
   edges.splice(0,edges.length,...order);const entries=foods.map((f,i)=>[f,f===nearest?.41:.47+i*.04]);if(reverse)entries.reverse();
   const a=setup(id,entries);a.run(1);assert.equal(a.s.organisms.find(o=>o.instanceId===a.e.targetInstanceId).speciesId,nearest);
   a.run(2);assert.equal(a.meals[0]?.foodSpeciesId,nearest);winners.push(nearest);
  }}finally{edges.splice(0,edges.length,...original);}
  results.multiple.push({consumer:id,soleFoods:foods,nearestCases:winners.length,nearestPassed:true});
 });
 test('15.6 '+id+': removing first choice finds actual alternative; no premature successful feeding',()=>{
  const a=setup(id,foods.map((f,i)=>[f,.41+i*.04]));a.run(1);const selected=a.e.targetInstanceId;
  assert.equal(a.s.organisms.find(o=>o.instanceId===selected).speciesId,foods[0]);a.s.organisms=a.s.organisms.filter(o=>o.instanceId!==selected);a.run(6);
  assert(a.meals.some(m=>m.consumerSpeciesId===id&&m.foodSpeciesId===foods[1]));assert(!a.meals.some(m=>m.foodInstanceId===selected));
 });
 test('15.6 '+id+': visible out-of-range and blocked nearby candidates do not hide accessible alternative',()=>{
  const a=setup(id,[[foods[0],.95],[foods[1],.41]]);a.run(3);assert.equal(a.meals[0]?.foodSpeciesId,foods[1]);
  const b=setup(id,[[foods[0],.37],[foods[1],.42]]);b.run(4,{...layout,blockedRects:[{left:.36,right:.38,top:0,bottom:1}]});assert.equal(b.meals[0]?.foodSpeciesId,foods[1]);
 });
 test('15.6 '+id+': active target retained when a different food becomes closer',()=>{
  const a=setup(id,[[foods[0],.41],[foods[1],.48]]);a.run(1.5);const target=a.e.targetInstanceId;a.s.organisms[2].position.x=a.e.position.x;
  a.run(1);assert.equal(a.meals[0]?.foodInstanceId,target);
 });
}
test('15.6 equal-distance tie is last candidate, not a species preference; keep documented deterministic policy',()=>{
 const list=relationsByConsumer.get('goshawk'),original=[...list],chosen=[];
 try{for(const order of [original,[...original].reverse()]){list.splice(0,list.length,...order);const a=setup('goshawk',original.map(r=>[r.sourceSpeciesId,.41]));a.run(1);chosen.push(a.s.organisms.find(o=>o.instanceId===a.e.targetInstanceId).speciesId);assert.equal(chosen.at(-1),order.at(-1).sourceSpeciesId);}}finally{list.splice(0,list.length,...original);}
 assert.deepEqual(chosen,['bulbul','rabbit']);results.limits.push({equalDistance:chosen,note:'<= replaces exactly equal candidate; nearest unequal distances unaffected; no random or new preference'});
});
test('15.6 ambush prey escaping during bite must survive outside capture radius',()=>{
 const a=setup('spider',[['aphid']]);a.run(1.5);assert.equal(a.e.behaviorState,'eat');const fixed={...a.e.position};a.s.organisms[1].position.x=.43;a.run(4);
 assert.equal(a.meals.length,0);assert.equal(a.s.organisms.length,2);assert.deepEqual(a.e.position,fixed);assert.equal(a.e.targetInstanceId,null);
 const b=setup('spider',[['aphid',.42]]);b.run(3);assert.equal(b.meals.length,1);
 const c=setup('spider',[['aphid',.45]]);c.run(5);assert.equal(c.meals.length,0);assert.equal(c.e.position.x,.4);
});
test('15.6 competing predators remove one live prey and emit one event',()=>{
 const a=setup('goshawk',[['rabbit']]),other=make('goshawk','other',.4);other.hunger=1;a.s.organisms.push(other);a.run(4);assert.equal(a.meals.length,1);assert.equal(a.s.population.totals.predation,1);assert(a.s.organisms.every(o=>!o.targetInstanceId));
});
test('15.6 juvenile nursing rabbit cannot feed; wrong plant part cannot feed',()=>{
 const a=setup('rabbit',[['grass']]);a.e.development={...a.e.development,stage:'baby',progressSeconds:0};a.run(2);assert.equal(a.meals.length,0);
 assert(!hasFoodStock(make('pine','pine'),{sourceSpeciesId:'pine',feedingMode:'resource',foodPart:'fruit'}));
});
test('15.6 stock is shared by plant instance, foodPart validated but not independent seed/needle counters',()=>{
 const a=setup('chipmunk',[['pine']]);a.run(2.5);assert(a.meals[0].foodPart==='seeds');assert(a.s.organisms[1].foodStock<foodResourceConfig.pine.maximum);
 assert(!('seeds'in a.s.organisms[1]));assert(!('needles'in a.s.organisms[1]));
});
test('15.6 display distance does not decide real food radius; canopy ground contact uses target projection',()=>{
 const a=setup('goshawk',[['rabbit',.43]]),p=createHabitatPresentation();p.rebuild(a.s.organisms,geometry());const physical=structuredClone(a.s.organisms.map(o=>o.position));
 const resting=p.position(a.e),prey=p.position(a.s.organisms[1]);assert(Math.hypot(resting.x-prey.x,resting.y-prey.y)>50);assert.deepEqual(a.s.organisms.map(o=>o.position),physical);
 a.run(2);assert.equal(a.e.behaviorState,'eat');const contact=p.position(a.e),target=p.position(a.s.organisms[1]);assert(Math.hypot(contact.x-target.x,contact.y-target.y)<50);a.run(1);assert.equal(a.meals.length,1);
});
process.on('exit',code=>{if(process.env.WRITE_FEEDING_AUDIT)writeFileSync(new URL('./feeding-audit.results.json',import.meta.url),JSON.stringify({...results,exitCode:code},null,2)+'\n');});


test('15.6 stationary ambush display holds spider and only connects live in-range prey; escape restores prey',()=>{
 const a=setup('spider',[['aphid']]),p=createHabitatPresentation();p.rebuild(a.s.organisms,geometry());const resting=p.position(a.e),prey=a.s.organisms[1],old=structuredClone(a.s);
 a.e.behaviorState='eat';a.e.targetInstanceId=prey.instanceId;const contact=p.position(prey);assert.deepEqual(p.position(a.e),resting);assert(Math.hypot(contact.x-resting.x,contact.y-resting.y)<50);
 assert.deepEqual(a.s.organisms.map(o=>o.position),old.organisms.map(o=>o.position));prey.position.x=.5;const escaped=p.position(prey);assert(Math.hypot(escaped.x-resting.x,escaped.y-resting.y)>50);assert.deepEqual(p.position(a.e),resting);
 a.s.organisms.splice(1,1);p.rebuild(a.s.organisms,geometry());assert(Number.isFinite(p.position(a.e).x));
});

test('15.6 blocked straight approach cannot monopolize search while farther accessible prey exists',()=>{
 const a=setup('goshawk',[['rabbit',.2],['chipmunk',.65]]),g={...layout,blockedRects:[{left:.29,right:.31,top:0,bottom:1}]};a.run(12,g);assert.equal(a.meals[0]?.foodSpeciesId,'chipmunk');assert(!a.meals.some(m=>m.foodSpeciesId==='rabbit'));
 // A wall outside the path must not change nearest choice (both axis directions).
 for(const [foodX,rect]of [[.2,{left:.29,right:.31,top:.1,bottom:.4}],[.6,{left:.49,right:.51,top:.1,bottom:.4}]]){const b=setup('goshawk',[['rabbit',foodX]]);b.run(12,{...layout,blockedRects:[rect]});assert.equal(b.meals[0]?.foodSpeciesId,'rabbit');}
});

