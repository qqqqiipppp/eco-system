import test from 'node:test';
import assert from 'node:assert/strict';
import {organisms,organismById} from '../data/organisms.js';
import {foodRelations} from '../data/food-relations.js';
import {earthwormConfig,organicNoticeConfig} from '../data/detritus-config.js';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {removeOrganism} from '../js/systems/lifecycle.js';
import {createEventSystem} from '../js/systems/events.js';
import {availableManagement,executeManagement} from '../js/systems/management.js';
import {nearestOrganicWorker} from '../js/systems/organic-notices.js';
import {completeActivity} from '../js/systems/activities.js';
import {placeOrganism} from '../js/systems/placement.js';
import {createWanderSystem} from '../js/systems/wander.js';
import {evaluateStability} from '../js/systems/stability.js';
import {eventPriority} from '../data/event-config.js';
import {updateSurvival} from '../js/systems/population.js';
import {updateLifespans} from '../js/systems/lifespan.js';
import {world,make,layout} from './ecology-fixtures.mjs';
import {exhaustedForest} from './point-economy-fixtures.mjs';
import {claimRecoverySupport} from '../js/systems/point-economy.js';
const empty=s=>{s.decomposition.organicMatter={wood:0,litter:0,remains:0};return s;};
const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const reactions=s=>s.events.filter(e=>e.status==='active'&&e.payload.organicOriginSequence);
const money=s=>structuredClone([s.metrics.points,s.pointEconomy,s.recoverySupportUsed,s.rewardHistory,s.managementHistory,s.managementActionCount,s.managementEffects]);

test('13.5 A/B/C:24 cards,original22 relationships,5 starters and17 future locks; earthworm is a consumer',()=>{
 const s=createGameState();assert.equal(organisms.length,24);assert.equal(foodRelations.length,22);assert.equal(organismById.earthworm.scientificName,'Amynthas koreanus');assert.equal(organismById.earthworm.role,'consumer');
 assert.deepEqual(s.inventory.filter(c=>c.acquired).map(c=>c.speciesId),['oak','grass','grasshopper','mushroom','soil-bacteria']);assert.equal(organisms.filter(o=>o.unlockStage===14).length,17);assert.equal(s.metrics.points,0);
 assert.equal(placeOrganism(s,'earthworm',{position:{x:.4,y:.72},isPlayArea:true,isUI:false},layout).reason,'inventory');
});
test('13.5 D: alreadyowned mushroom learning retains fourpoint first reward and never duplicates or changes soil',()=>{
 const s=createGameState(),env=structuredClone(s.environment);assert(completeActivity(s,'decomposer_classify','decomposer').ok);assert.equal(s.metrics.points,4);
 for(let i=0;i<100;i++)assert(completeActivity(s,'decomposer_classify','decomposer').ok);assert.equal(s.metrics.points,4);assert.deepEqual(s.environment,env);assert.equal(s.organisms.length,3);
});
test('13.5 E/F: fungus,worm and background share one finite litter debit and one nutrient yield',()=>{
 const s=empty(world([['earthworm',1,.4],['litter-mold',1,.45]]));s.decomposition.organicMatter.litter=.0005;const before=money(s),oldSoil=s.environment.soil.value;
 const processed=updateDecomposition(s,.5);near(processed,.0005);near(s.decomposition.organicMatter.litter,0);near(s.decomposition.soilNutrients,.0005*.03);
 near(s.organisms[0].litterConsumed,.0005*.003/(.001+.006+.003));near(s.decomposition.earthwormProcessed,s.organisms[0].litterConsumed);assert.equal(s.environment.soil.value,oldSoil);assert.deepEqual(money(s),before);
});
test('13.5 G/H: no litter/no water gives no worm meal or soil credit; soil help is bounded and preserves better paid values',()=>{
 const s=empty(world([['earthworm',3,.4]])),before=money(s);s.environment.soil.value=.35;
 updateDecomposition(s,.5);assert.equal(s.decomposition.soilContribution,0);assert(s.organisms.every(o=>o.litterConsumed===0));
 s.decomposition.organicMatter.litter=30;s.environment.water.value=0;updateDecomposition(s,.5);assert.equal(s.decomposition.earthwormProcessed,0);
 s.environment.water.value=1;for(let i=0;i<20000;i++){s.simulationTime+=.5;s.decomposition.organicMatter.litter=30;updateDecomposition(s,.5);}
 near(s.decomposition.soilContribution,earthwormConfig.soilMaximum);assert(s.environment.soil.value<=.6);const contribution=s.decomposition.soilContribution;s.environment.soil.value=1;updateDecomposition(s,.5);assert.equal(s.environment.soil.value,1);assert.equal(s.decomposition.soilContribution,contribution);assert.deepEqual(money(s),before);
});
test('13.5 I: existing wander moves the soil animal slowly within the ground zone without a separate timer',()=>{
 const s=world([['earthworm',1,.4]]),o=s.organisms[0],before=o.position.x,w=createWanderSystem(()=>.5);
 for(let i=0;i<60;i++)w.update(s.organisms,.1,layout);assert(o.position.x>before);assert(o.position.x-before<.04);assert(o.position.y>=.68&&o.position.y<=.78);
});
test('13.5 J/K/L: actual wood/litter/remains birth targets one nearest compatible existing instance',()=>{
 for(const [source,part,workers]of [['oak','wood',['mushroom','soil-bacteria']],['grass','litter',['litter-mold','earthworm']],['grasshopper','remains',['soil-bacteria','mushroom']]]){
  const s=empty(world([[source,1,.4],[workers[0],1,.3],[workers[0],1,.43],[workers[1],1,.405]]));removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');const origin=s.decomposition.notices.history[0];assert.equal(origin.part,part);assert(origin.amount>0);
  const nearest=nearestOrganicWorker(s,origin.position,part);assert.equal(origin.targetInstanceId,nearest.instanceId);if(part==='litter')assert.equal(nearest.speciesId,'earthworm');else assert.equal(nearest.position.x,.43);
  const e=createEventSystem();e.refresh(s);assert.equal(reactions(s).length,1);assert.equal(reactions(s)[0].sourceId,nearest.instanceId);assert.match(reactions(s)[0].explanation,/既|이미.*확인한 것은 아니/);assert(!s.events.some(e=>e.status==='active'&&e.payload.populationSequence===origin.populationSequence));
 }
});
test('13.5 M/N: touching a reaction only notes the birth; no paid options,cash,soil or processing',()=>{
 const s=empty(world([['grasshopper',1,.4],['soil-bacteria',1,.42]]));removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');const e=createEventSystem();e.refresh(s);const event=reactions(s)[0],before=money(s),d=structuredClone(s.decomposition),env=structuredClone(s.environment);
 assert.deepEqual(availableManagement(s,event.eventId),[]);assert(!executeManagement(s,'food-support',event.eventId).ok);assert(e.acknowledge(s,event.eventId).ok);assert.deepEqual(money(s),before);assert.deepEqual(s.environment,env);assert.equal(s.decomposition.processed,d.processed);assert.deepEqual(s.decomposition.organicMatter,d.organicMatter);assert(s.decomposition.notices.history[0].noted);assert(s.population.history[0].noted);
 for(let i=0;i<100;i++)e.refresh(s);assert.equal(reactions(s).length,0);assert.deepEqual(money(s),before);
});
test('13.5 O/P: predation,larval exit,student release and full resource cap never fabricate an organic reaction',()=>{
 for(const [id,cause]of [['grasshopper','predation'],['caterpillar','life_stage_exit'],['grass','release'],['mushroom','colony_decline']]){
  const s=world([[id,1,.4],['soil-bacteria',1,.42],['mushroom',1,.43],['litter-mold',1,.44]]);const pools=structuredClone(s.decomposition.organicMatter);removeOrganism(s,s.organisms[0].instanceId,cause);assert.deepEqual(s.decomposition.organicMatter,pools);assert.equal(s.decomposition.notices.history.length,0);const e=createEventSystem();e.refresh(s);assert.equal(reactions(s).length,0);
 }
 const s=world([['grass',1,.4],['litter-mold',1,.42]]);s.decomposition.organicMatter.litter=30;removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');assert.equal(s.decomposition.notices.history.length,0);
});
test('13.5 Q/R: no suitable worker creates no fake marker; expired or consumed shared resources close the signal',()=>{
 const s=empty(world([['grass',1,.4],['mushroom',1,.42]]));removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');const e=createEventSystem();e.refresh(s);assert.equal(reactions(s).length,0);s.organisms.push(make('earthworm','later',.42));e.refresh(s);assert.equal(reactions(s).length,0);
 const t=empty(world([['grass',1,.4],['earthworm',1,.42]]));removeOrganism(t,t.organisms[0].instanceId,'natural_lifespan');const f=createEventSystem();f.refresh(t);assert.equal(reactions(t).length,1);t.decomposition.organicMatter.litter=0;f.refresh(t);assert.equal(reactions(t).length,0);t.decomposition.organicMatter.litter=1;t.simulationTime=organicNoticeConfig.lifetimeSeconds+1;f.refresh(t);assert.equal(reactions(t).length,0);
});
test('13.5 S/T: one reaction perworker/type,20 bounded origins,6 pending groups; urgent/core/growth priority stays ahead',()=>{
 const s=empty(world([['soil-bacteria',1,.4]])),e=createEventSystem();
 for(let i=0;i<100;i++){const o=make('grasshopper','loss-'+i,.42);s.organisms.push(o);s.decomposition.organicMatter.remains=0;removeOrganism(s,o.instanceId,'natural_lifespan');e.refresh(s);}
 assert.equal(s.decomposition.notices.history.length,20);assert.equal(reactions(s).length,1);assert(s.events.filter(e=>e.status==='active').length<=36);assert.equal(s.metrics.points,0);
 const notice=reactions(s)[0];assert(eventPriority(notice)<eventPriority({kind:'insight',payload:{developmentSequence:1}}));assert(eventPriority(notice)<eventPriority({kind:'insight',payload:{relationId:'v2_grass_to_grasshopper'}}));assert.equal(eventPriority({kind:'alert',payload:{organicOriginSequence:1,urgent:true}}),4);
});
test('13.5 U: recipient removal safely retargets the same origin without granting or counting another birth',()=>{
 const s=empty(world([['grass',1,.4],['earthworm',1,.42],['litter-mold',1,.5]]));removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');const e=createEventSystem();e.refresh(s);const origin=s.decomposition.notices.history[0],sequence=s.decomposition.notices.sequence;removeOrganism(s,origin.targetInstanceId,'release');e.refresh(s);assert.equal(reactions(s).length,1);assert.equal(s.organisms.find(o=>o.instanceId===reactions(s)[0].sourceId).speciesId,'litter-mold');assert.equal(s.decomposition.notices.sequence,sequence);assert.equal(s.metrics.points,0);
});
test('13.5 V: worm shared litter contributes to existing food score while original graph stays22',()=>{
 const s=empty(world([['earthworm',1,.4]]));const emptyFood=evaluateStability(s).breakdown.food;s.decomposition.organicMatter.litter=1;s.simulationTime=.5;updateDecomposition(s,.5);assert(evaluateStability(s).breakdown.food>emptyFood);assert.equal(foodRelations.length,22);
});
test('13.5 J/M: dry habitat can show a material-compatible learning partner without pretending actual feeding or soil repair',()=>{
 const s=empty(world([['grass',1,.4],['earthworm',1,.42]]));s.environment.water.value=0;removeOrganism(s,s.organisms[0].instanceId,'natural_lifespan');updateDecomposition(s,.5);const e=createEventSystem();e.refresh(s);assert.equal(reactions(s).length,1);assert.equal(s.decomposition.earthwormProcessed,0);assert.equal(s.decomposition.soilContribution,0);assert.match(reactions(s)[0].explanation,/실제 활동은 달라/);assert(e.acknowledge(s,reactions(s)[0].eventId).ok);assert.equal(s.metrics.points,0);
});
test('13.5 T: grouping a newer natural ending with a real starvation loss preserves the original urgent priority',()=>{
 const s=empty(world([['grasshopper',2,.4],['soil-bacteria',1,.42]]));s.simulationTime=500;Object.assign(s.organisms[0],{hunger:1,deprivationSeconds:360,acclimationUntil:0});assert.equal(updateSurvival(s,.5).length,1);const survivor=s.organisms.find(o=>o.speciesId==='grasshopper');survivor.life.initialAge=survivor.life.duration-500;updateLifespans(s,.5);
 const e=createEventSystem(500);e.refresh(s);assert.equal(reactions(s).length,1);assert.equal(eventPriority(reactions(s)[0]),4);assert.match(reactions(s)[0].explanation,/먹이 부족/);assert(e.acknowledge(s,reactions(s)[0].eventId).ok);assert(s.population.history.every(r=>r.noted));assert.equal(s.metrics.points,0);
});
test('13.5 M/N: organic confirmation cannot settle an unrelated pending paid management bonus; normal refresh still pays it once',()=>{
 const s=exhaustedForest({factors:['water','air']}),key='management:water_shortage_resolved';s.rewardHistory=s.rewardHistory.filter(r=>r.rewardId!==key);s.pointEconomy.legacyClaimed=s.pointEconomy.legacyClaimed.filter(id=>id!==key);
 assert(claimRecoverySupport(s).ok);assert(executeManagement(s,'water-care',{sourceType:'environment',sourceId:'water'}).ok);const e=createEventSystem();e.refresh(s);assert.equal(s.managementHistory[0].result,'applied');
 s.organisms.push(make('soil-bacteria','notice-worker',.42));const victim=s.organisms.find(o=>o.speciesId==='grasshopper');removeOrganism(s,victim.instanceId,'natural_lifespan');e.refresh(s);const event=reactions(s)[0];assert(event);assert(executeManagement(s,'habitat-care',{sourceType:'environment',sourceId:'air'}).ok);
 // The remaining oaks now meet the original suitability rule, making a paid
 // bonus due independently of the organic confirmation being tested.
 for(const grass of s.organisms.filter(o=>o.speciesId==='grass'))removeOrganism(s,grass.instanceId,'natural_lifespan');const balance=s.metrics.points,book=structuredClone(s.pointEconomy);
 assert(e.acknowledge(s,event.eventId).ok);assert.equal(s.metrics.points,balance);assert.deepEqual(s.pointEconomy,book);assert.equal(s.managementHistory[0].result,'applied');e.update(s,1);assert.equal(s.metrics.points,balance+3);assert.equal(s.managementHistory[0].result,'resolved');e.refresh(s);assert.equal(s.metrics.points,balance+3);
});
