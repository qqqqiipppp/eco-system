import test from 'node:test';
import assert from 'node:assert/strict';
import {organisms,organismById} from '../data/organisms.js';
import {foodRelations,relationsByConsumer,relationFor} from '../data/food-relations.js';
import {feedingConfig,foodResourceConfig} from '../data/ecology-config.js';
import {speciesProfiles,placementConfig} from '../data/interaction-config.js';
import {producerGrowth} from '../data/environment-config.js';
import {discoveryEvents,eventConfig,eventPriority} from '../data/event-config.js';
import {forestGoal} from '../data/forest-goal.js';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createWanderSystem} from '../js/systems/wander.js';
import {consumeFoodStock,recoverFoodStock,hasFoodStock} from '../js/systems/food-resources.js';
import {createEventSystem} from '../js/systems/events.js';
import {placeOrganism} from '../js/systems/placement.js';
import {setEnvironmentLevel} from '../js/systems/environment.js';
import {evaluateStability} from '../js/systems/stability.js';
import {goalPresentation} from '../js/systems/goal-guidance.js';
import {grantDevelopmentCards} from '../js/dev/species-tools.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {completeActivity} from '../js/systems/activities.js';

const layout={footprints:Object.fromEntries(organisms.map(s=>[s.id,{halfWidth:.015,above:.1,below:.025}])),blockedRects:[]};
const make=(speciesId,id,x=.4)=>createOrganismInstance(speciesId,id,{x,y:.72});
function world(...instances){const s=createGameState();s.organisms=instances;return s;}
function run(s,system,seconds){const signals=[];for(let i=0;i<seconds*30;i++)signals.push(...system.update(s,1/30,layout).feedingEvents);return signals;}

test('A/B/C: exactly 23 distinct definitions, 5/15/3 roles, valid directed/resource relations and unchanged legacy IDs',()=>{
 assert.equal(organisms.length,23);assert.equal(new Set(organisms.map(s=>s.id)).size,23);
 for(const [role,count]of [['producer',5],['consumer',15],['decomposer',3]])assert.equal(organisms.filter(s=>s.role===role).length,count);
 for(const id of ['oak','grass','rabbit','mushroom','grasshopper','frog'])assert(organismById[id]);
 assert.equal(foodRelations.length,27);assert.equal(new Set(foodRelations.map(r=>r.relationId)).size,27);
 for(const r of foodRelations){assert(organismById[r.sourceSpeciesId]);assert.equal(organismById[r.targetSpeciesId].role,'consumer');assert(r.evidenceId);assert(discoveryEvents[r.relationId]);if(r.feedingMode==='resource')assert(foodResourceConfig[r.sourceSpeciesId].parts.includes(r.foodPart));else assert.equal(organismById[r.sourceSpeciesId].role,'consumer');}
 for(const s of organisms){assert(s.habitat);assert(speciesProfiles[s.id]);if(s.role==='consumer'){assert(feedingConfig[s.id]);assert(relationsByConsumer.get(s.id)?.length);}if(s.role==='producer'){assert(producerGrowth[s.id]);assert(foodResourceConfig[s.id]);}if(s.role==='decomposer')assert(!feedingConfig[s.id]);}
});
test('C/E: one connected producer-consumer web, alternative food and shared food, only decomposers isolated',()=>{
 const links=new Map(organisms.map(s=>[s.id,new Set()]));for(const r of foodRelations){links.get(r.sourceSpeciesId).add(r.targetSpeciesId);links.get(r.targetSpeciesId).add(r.sourceSpeciesId);}
 const visited=new Set(),queue=['grass'];while(queue.length){const id=queue.pop();if(visited.has(id))continue;visited.add(id);queue.push(...links.get(id));}
 assert.equal(visited.size,20);for(const s of organisms)assert.equal(visited.has(s.id),s.role!=='decomposer');
 assert([...relationsByConsumer.values()].some(r=>r.length>1));assert(foodRelations.filter(r=>r.sourceSpeciesId==='grass').length>1);
});
test('D: nearest usable alternative is selected; depleted food switches to another permitted species',()=>{
 const eater=make('chipmunk','eater'),oak=make('oak','oak',.44),pine=make('pine','pine',.41),hazel=make('hazel','hazel',.48);eater.hunger=1;
 const s=world(eater,oak,pine,hazel),f=createFeedingSystem();run(s,f,1);assert.equal(eater.targetInstanceId,'pine');
 pine.foodStock=0;oak.foodStock=0;const meals=run(s,f,8);assert(meals.some(e=>e.relationId==='hazel_to_chipmunk'));assert(!meals.some(e=>e.foodSpeciesId==='pine'));assert(!s.organisms.some(o=>o.speciesId==='mushroom'));
});
test('D/E: omnivore can choose renewable seeds or an animal without deleting the seed supplier',()=>{
 const eater=make('field-mouse','eater'),oak=make('oak','oak',.43),prey=make('caterpillar','prey',.401);eater.hunger=1;prey.hunger=0;
 const s=world(eater,oak,prey),f=createFeedingSystem();let meals=run(s,f,4);assert(meals.some(e=>e.foodSpeciesId==='caterpillar'));assert(!s.organisms.includes(prey));
 eater.hunger=1;meals=run(s,f,6);assert(meals.some(e=>e.foodPart==='acorn'));assert(s.organisms.includes(oak));assert(oak.foodStock<foodResourceConfig.oak.maximum);
});
test('E/F: a shared live prey is removed once, stale targets clear, undefined food never feeds',()=>{
 const prey=make('aphid','prey'),a=make('ladybird','ladybird'),b=make('spider','spider');prey.hunger=0;a.hunger=b.hunger=1;
 const s=world(prey,a,b),f=createFeedingSystem(),meals=run(s,f,8);assert.equal(meals.filter(e=>e.foodInstanceId==='prey').length,1);assert.equal(s.organisms.length,2);assert(s.organisms.every(o=>o.targetInstanceId!=='prey'));
 const illegal=world(make('oak','oak'),make('ladybird','ladybird'));illegal.organisms[1].hunger=1;assert.equal(run(illegal,createFeedingSystem(),12).length,0);assert.equal(illegal.organisms.length,2);
 assert(!hasFoodStock(make('pine','bad-part'),{sourceSpeciesId:'pine',feedingMode:'resource',foodPart:'sap'}));
});
test('G: each producer resource is consumed without deleting plant, recovers, and suffers bad abiotic conditions',()=>{
 for(const id of Object.keys(foodResourceConfig)){
  const plant=make(id,'plant'),rule=foodResourceConfig[id],s=createGameState();assert(consumeFoodStock(plant));assert(plant.foodStock<rule.maximum);plant.foodStock=0;recoverFoodStock(plant,5,s.environment);const good=plant.foodStock;
  plant.foodStock=0;for(const factor of ['sunlight','water','air','soil'])setEnvironmentLevel(s,factor,'bad');recoverFoodStock(plant,5,s.environment);assert(plant.foodStock<good);assert(plant.foodStock>=0);
 }
});
test('H/J: every one of the 27 configured relations produces actual feeding and correct resource/predation mutation',()=>{
 for(const r of foodRelations){
  const food=make(r.sourceSpeciesId,'food'),eater=make(r.targetSpeciesId,'eater');if('hunger'in food)food.hunger=0;eater.hunger=1;
  const s=world(food,eater),meals=run(s,createFeedingSystem(),4);assert(meals.some(e=>e.relationId===r.relationId),r.relationId);
  assert.equal(s.organisms.includes(food),r.feedingMode==='resource',r.relationId);assert(eater.hunger<.6);
 }
});
test('I/J: starter locks preserved, planned cards cannot place, developer permission does not grant rewards',()=>{
 const s=createGameState(),before=structuredClone(s);assert.equal(s.inventory.filter(c=>c.acquired).length,3);assert.equal(organisms.filter(o=>o.unlockStage===14).length,17);
 assert.equal(placeOrganism(s,'chipmunk',{position:{x:.4,y:.72},isPlayArea:true,isUI:false},layout).reason,'inventory');assert.deepEqual(s,before);
 grantDevelopmentCards(s);assert.equal(s.inventory.filter(c=>c.acquired).length,23);assert.equal(s.metrics.points,0);assert.equal(s.activities.filter(a=>a.completed).length,0);
 assert(placeOrganism(s,'chipmunk',{position:{x:.4,y:.72},isPlayArea:true,isUI:false},layout).ok);
});
test('K: new actual feeding gives a pending discovery, explicit once-only record, bounded active events and priority',()=>{
 const food=make('aphid','prey'),eater=make('ladybird','eater');food.hunger=0;eater.hunger=1;
 const s=world(food,eater),signals=run(s,createFeedingSystem(),4),events=createEventSystem(s.simulationTime);events.update(s,1,signals);assert.equal(s.observations.length,0);
 const event=s.events.find(e=>e.payload.relationId==='aphid_to_ladybird');assert(event);assert(events.acknowledge(s,event.eventId).ok);assert.equal(s.observations.length,1);assert.equal(s.metrics.points,12);assert(!events.acknowledge(s,event.eventId).ok);assert.equal(s.metrics.points,12);
 const busy=createGameState(),system=createEventSystem();system.update(busy,1,foodRelations.map(r=>({foodSpeciesId:r.sourceSpeciesId,consumerSpeciesId:r.targetSpeciesId,consumerInstanceId:'gone'})));assert.equal(system.exportMemory().pendingDiscoveries.length,27);assert(busy.events.filter(e=>e.status==='active').length<=eventConfig.maxActive);
 const sorted=busy.events.filter(e=>e.kind==='insight').sort((a,b)=>eventPriority(b)-eventPriority(a));assert(sorted.slice(0,2).every(e=>['grass_to_grasshopper','grasshopper_to_frog'].includes(e.payload.relationId)));
});
test('L: genuine six-card schema 7 saves load without reset/damage and append 17 locked cards',()=>{
 const s=createGameState();s.simulationTime=100;s.metrics.points=31;s.metrics.bestStability=86;s.forestProgress={cleared:true,clearedAt:70,stableSeconds:30};
 s.observations=[{relationId:'grass_to_grasshopper',eventId:'old',discoveredAt:40}];completeActivity(s,'producer_quiz','grass');completeActivity(s,'grass_observation');
 s.organisms.push(make('rabbit','old-rabbit'));s.inventory.find(c=>c.speciesId==='rabbit').acquired=true;
 const snapshot=createSaveSnapshot(s,{sequence:1,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-08T00:00:00Z');const legacy=['oak','grass','rabbit','mushroom','grasshopper','frog'];snapshot.domain.inventory=snapshot.domain.inventory.filter(c=>legacy.includes(c.speciesId));
 for(const o of snapshot.domain.organisms){if(o.speciesId==='oak')delete o.foodStock;if(o.speciesId==='rabbit')for(const key of ['hunger','foodShortageDuration','lastSuccessfulFeedingAt'])delete o[key];}
 const loaded=decodeSave(JSON.stringify(snapshot));assert.equal(loaded.status,'loaded');assert.equal(loaded.state.schemaVersion,7);assert.equal(loaded.state.metrics.points,s.metrics.points);assert(loaded.state.forestProgress.cleared);assert.equal(loaded.state.observations.length,1);assert.equal(loaded.state.inventory.filter(c=>!legacy.includes(c.speciesId)&&!c.acquired).length,17);assert(loaded.state.inventory.find(c=>c.speciesId==='frog').acquired);assert(loaded.state.inventory.find(c=>c.speciesId==='rabbit').acquired);
});
test('M: all new species, 27 observations/rewards and unrecorded discoveries survive save validation',()=>{
 const s=createGameState();grantDevelopmentCards(s);s.organisms=organisms.map((o,i)=>make(o.id,'save-'+i));s.simulationTime=100;
 s.observations=foodRelations.map(r=>({relationId:r.relationId,eventId:'source',discoveredAt:30}));s.rewardHistory=foodRelations.map(r=>({rewardId:'observation:'+r.relationId,sourceId:'source',grantedAt:30,amount:12}));
 let loaded=decodeSave(JSON.stringify(createSaveSnapshot(s,{sequence:1,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-08T00:00:00Z')));assert.equal(loaded.state.organisms.length,23);assert.equal(loaded.state.observations.length,27);assert.equal(loaded.state.rewardHistory.length,27);assert.deepEqual(loaded.state.organisms.map(o=>o.speciesId),s.organisms.map(o=>o.speciesId));
 s.observations=[];loaded=decodeSave(JSON.stringify(createSaveSnapshot(s,{sequence:1,cooldowns:[],questionDone:[],pendingDiscoveries:foodRelations.map(r=>[r.relationId,{consumerInstanceId:'gone'}])},'2026-10-08T00:00:00Z')));assert.equal(loaded.eventMemory.pendingDiscoveries.length,27);
});
test('N: old core goal is unchanged; absent optional foods do not dilute existing feeding adequacy',()=>{
 assert.deepEqual(forestGoal.requiredSpecies,['grass','grasshopper','frog']);assert.equal(forestGoal.stableSeconds,30);assert.equal(forestGoal.minimumStability,70);
 const s=world(make('grass','grass'),make('grasshopper','grasshopper'),make('frog','frog'));s.organisms[1].hunger=s.organisms[2].hunger=0;assert.equal(evaluateStability(s).breakdown.food,1);assert.equal(goalPresentation(s).total,6);
});
test('O: 23 types / 30 mixed individuals keep species-indexed search bounded, no natural increase',()=>{
 const s=createGameState();s.organisms=organisms.map((o,i)=>make(o.id,'mixed-'+i,.15+(i%7)*.07));for(let i=0;i<7;i++)s.organisms.push(make('grass','extra-'+i,.2+i*.06));
 const f=createFeedingSystem();run(s,f,45);const d=f.getDiagnostics();assert.equal(d.ticks,90);assert(d.plantMeals>0&&d.predations>0);assert(d.candidateChecks<=d.searches*30);assert(s.organisms.length<=placementConfig.maxOrganisms);assert(s.organisms.every(o=>!o.targetInstanceId||s.organisms.some(t=>t.instanceId===o.targetInstanceId)));console.log('web 30 diagnostics:',d,'remaining',s.organisms.length);
});
test('movement profiles vary, remain in allowed area; producers and decomposers stay fixed',()=>{
 const insects=[make('snail','slow'),make('tit','fast')],wander=createWanderSystem(()=>.7);const start=insects.map(o=>({...o.position}));for(let i=0;i<60;i++)wander.update(insects,1/30,layout);assert(Math.abs(insects[1].position.x-start[1].x)>Math.abs(insects[0].position.x-start[0].x));
 const fixed=organisms.filter(o=>o.role!=='consumer').map((o,i)=>make(o.id,'fixed-'+i)),before=structuredClone(fixed);for(let i=0;i<300;i++)wander.update(fixed,1/30,layout);assert.deepEqual(fixed,before);
});
