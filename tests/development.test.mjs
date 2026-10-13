import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {organisms} from '../data/organisms.js';
import {developmentRules} from '../data/development-config.js';
import {developmentStage,updateDevelopment,canReproduce,canFeed,fungalCondition,hasDevelopmentWork} from '../js/systems/development.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {createEventSystem} from '../js/systems/events.js';
import {eventPriority,eventConfig} from '../data/event-config.js';
import {foodRelations} from '../data/food-relations.js';
import {updateReproduction,updateReplenishment} from '../js/systems/population.js';
import {foodStockCapacity,recoverFoodStock} from '../js/systems/food-resources.js';
import {naturalEndAt} from '../js/state/life-state.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createWanderSystem} from '../js/systems/wander.js';
const layout={footprints:Object.fromEntries(organisms.map(o=>[o.id,{halfWidth:.01,above:.1,below:.02}])),blockedRects:[]};
const make=(id,n=id,newborn=false,x=.4)=>createOrganismInstance(id,n,{x,y:.72},{newborn});
const world=(...o)=>{const s=createGameState();s.organisms=o;return s;};
test('A/B: only five teaching models, three individual growth models; other18 gain no development state',()=>{
 assert.equal(Object.keys(developmentRules).length,5);
 for(const species of organisms){const o=make(species.id);assert.equal(Boolean(o.development),['grass','grasshopper','rabbit','mushroom'].includes(species.id));}
 assert.equal(developmentRules.frog.model,'learning');
});
test('G/H/I/J: egg wait consumes the same finite reserve once, hatches a feeding nymph, then grows without pupation',()=>{
 const a=make('grasshopper','parent-a'),b=make('grasshopper','parent-b',false,.42),s=world(make('grass','host',false,.2),a,b);
 s.simulationTime=300;for(const o of [a,b]){o.hunger=.1;o.lastSuccessfulFeedingAt=300;}
 s.inventory.find(c=>c.speciesId==='grasshopper').acquired=true;s.population.introductions.grasshopper={count:2,nextAt:0};
 s.population.breeding.grasshopper={healthySeconds:240,nextAt:0};
 assert.equal(updateReproduction(s,.5,layout).filter(o=>o.speciesId==='grasshopper').length,0);
 assert.equal(s.organisms.length,3);assert.equal(s.population.replenishment.grasshopper.reserve,6);
 assert(s.population.breeding.grasshopper.pending);assert.equal(updateReplenishment(s,500,layout).length,0);
 const children=updateReproduction(s,60,layout),nymph=children.find(o=>o.speciesId==='grasshopper');
 assert(nymph);assert.equal(developmentStage(nymph),'nymph');assert.equal(s.population.replenishment.grasshopper.reserve,5);
 assert(!canReproduce(nymph,s.simulationTime));assert(canFeed(nymph));assert(!developmentRules.grasshopper.stages.some(stage=>stage.id==='pupa'));
 s.organisms=[s.organisms[0],nymph];nymph.hunger=1;
 const f=createFeedingSystem(s.simulationTime),events=[];for(let i=0;i<20;i++)events.push(...f.update(s,.1,layout).feedingEvents);
 // Move closer using the real pursuit path, then observe the same v2 relation.
 for(let i=0;i<300&&!events.length;i++)events.push(...f.update(s,.1,layout).feedingEvents);
 assert(events.some(e=>e.relationId==='v2_grass_to_grasshopper'));
 nymph.hunger=.1;nymph.lastSuccessfulFeedingAt=s.simulationTime;const life=structuredClone(nymph.life);
 updateDevelopment(s,180);assert.equal(developmentStage(nymph),'adult');assert(canReproduce(nymph,s.simulationTime));
 assert.deepEqual(nymph.life,life);assert.equal(s.organisms.length,2);
});
test('K/L/U: newborn hare moves at a limited rate, feeds after the short nursery phase, and only adults breed',()=>{
 const child=make('rabbit','child',true),adult=make('rabbit','adult'),s=world(child,adult,make('grass'));
 assert.equal(developmentStage(child),'baby');assert(!canFeed(child));assert(!canReproduce(child,0));
 const w=createWanderSystem(()=>.9),before={...child.position};for(let i=0;i<40;i++)w.update(s.organisms,.1,layout);
 assert.notDeepEqual(child.position,before);
 updateDevelopment(s,90);assert.equal(developmentStage(child),'juvenile');assert(canFeed(child));
 updateDevelopment(s,400);assert.equal(developmentStage(child),'juvenile');
 s.simulationTime=400;child.lastSuccessfulFeedingAt=400;child.hunger=.1;updateDevelopment(s,270);
 assert.equal(developmentStage(child),'adult');
 const baby=make('rabbit','second-child',true);s.organisms=[adult,baby,s.organisms[2]];adult.lastSuccessfulFeedingAt=400;adult.hunger=.1;
 s.population.breeding.rabbit={healthySeconds:360,nextAt:0};
 assert.equal(updateReproduction(s,.5,layout).filter(o=>o.speciesId==='rabbit').length,0);
 assert.equal(s.organisms.filter(o=>o.speciesId==='rabbit').length,2);
});
test('C: seed waiting creates one real sprout only after germination, with no premature population count',()=>{
 const s=world(make('grass'));s.simulationTime=200;
 s.population.breeding.grass={healthySeconds:180,nextAt:0};
 assert.equal(updateReproduction(s,.5,layout).length,0);
 assert.equal(s.organisms.length,1);assert(s.population.breeding.grass.pending);assert.equal(s.population.history.length,0);
 const born=updateReproduction(s,60,layout);
 assert.equal(born.length,1);assert.equal(developmentStage(born[0]),'sprout');assert.equal(s.organisms.length,2);
 assert.equal(s.population.totals.reproduction,1);assert(!s.population.breeding.grass.pending);
 assert.equal(updateReproduction(s,60,layout).length,0);
});
test('D/E/F: sprout grows with four abiotic factors, finite stock, same identity and original life',()=>{
 const sprout=make('grass','new',true),s=world(sprout),life=structuredClone(sprout.life);
 const startingStock=sprout.foodStock;
 assert(Math.abs(foodStockCapacity(sprout)-1.2)<1e-9);assert.equal(sprout.foodStock,foodStockCapacity(sprout));
 assert(!canReproduce(sprout,0));s.environment.water.value=.15;
 assert.equal(updateDevelopment(s,240).length,0);assert.equal(sprout.development.progressSeconds,0);
 s.environment.water.value=1;s.simulationTime=180;
 const changes=updateDevelopment(s,180);assert.equal(changes.length,1);assert.equal(developmentStage(sprout),'grown');
 assert.equal(s.organisms.length,1);assert.equal(sprout.foodStock,startingStock);assert.equal(foodStockCapacity(sprout),3);
 recoverFoodStock(sprout,1,s.environment);assert(sprout.foodStock>1.2&&sprout.foodStock<3);
 updateDevelopment(s,120);assert.equal(developmentStage(sprout),'seeding');assert(canReproduce(sprout,s.simulationTime));
 assert.deepEqual(sprout.life,life);assert.equal(s.population.history.length,0);assert.equal(s.development.history.length,2);
 s.simulationTime=naturalEndAt(sprout);assert(!canReproduce(sprout,s.simulationTime));
});
test('M/N/O/V: hare and frog lessons distinguish real forest stages, with the same 22 ecological relations',()=>{
 assert.match(developmentRules.rabbit.description,/털|눈/);
 assert.match(developmentRules.rabbit.description,/산토끼/);
 assert.match(developmentRules.frog.cycle,/알.*올챙이.*어린.*성체/);
 assert.match(developmentRules.frog.description,/학습|연못/);
 const frog=make('frog'),s=world(frog);updateDevelopment(s,2000);
 assert.equal(s.organisms.length,1);assert(!frog.development);
 assert(!s.population.breeding.frog);assert.equal(s.development.history.length,0);
 assert.equal(foodRelations.length,22);assert(foodRelations.every(r=>r.relationId.startsWith('v2_')));
 assert.deepEqual(Object.fromEntries(['A','B','C'].map(level=>[level,foodRelations.filter(r=>r.evidenceLevel===level).length])),{A:5,B:17,C:0});
});
test('P/Q/R/T: mycelium, fruiting and spores are one wood-fed colony, with no duplicate nutrient or population bonus',()=>{
 const fungus=make('mushroom'),s=world(fungus);s.decomposition.organicMatter.wood=10;
 const original=structuredClone(fungus.life),before=structuredClone(s.decomposition);
 assert.equal(fungalCondition(s,fungus).id,'mycelium');
 updateDevelopment(s,180);assert.equal(developmentStage(fungus),'fruiting');
 updateDevelopment(s,120);assert.equal(developmentStage(fungus),'spore-ready');
 assert.equal(s.organisms.length,1);assert.equal(s.population.sequence,0);assert.equal(s.metrics.points,0);
 assert.deepEqual(s.decomposition,before);assert.deepEqual(fungus.life,original);
 const control=world(make('mushroom','control'));control.decomposition=structuredClone(before);
 assert.equal(updateDecomposition(s,.5),updateDecomposition(control,.5));assert.deepEqual(s.decomposition,control.decomposition);
 s.decomposition.organicMatter.wood=0;assert.equal(fungalCondition(s,fungus).id,'resting');
 s.environment.water.value=.15;assert.equal(fungalCondition(s,fungus).id,'stressed');assert.equal(s.organisms.length,1);
 const young=world(make('mushroom'));young.decomposition.organicMatter.wood=0;updateDevelopment(young,300);assert.equal(young.organisms[0].development.progressSeconds,0);
 young.decomposition.organicMatter.wood=10;young.organisms[0].life.vigor=.2;updateDevelopment(young,300);assert.equal(young.organisms[0].development.progressSeconds,0);
});
test('X: only real growth transitions produce separate, bounded, once-only observations without food credit or points',()=>{
 const sprout=make('grass','sprout',true),s=world(sprout),events=createEventSystem();
 events.refresh(s);assert(!s.events.some(e=>e.payload.developmentSequence));
 updateDevelopment(s,180);events.refresh(s);
 const event=s.events.find(e=>e.status==='active'&&e.payload.developmentSequence);
 assert(event);assert.equal(s.development.history.length,1);
 const pointCount=s.metrics.points,foodCount=s.observations.length;
 assert.match(events.acknowledge(s,event.eventId).message,/성장 기록/);
 assert(s.development.history[0].noted);assert.equal(s.metrics.points,pointCount);assert.equal(s.observations.length,foodCount);
 assert(!events.acknowledge(s,event.eventId).ok);updateDevelopment(s,0);events.refresh(s);assert.equal(s.development.history.length,1);
 for(let i=0;i<100;i++){const another=make('grass','new-'+i,true);s.organisms=[another];updateDevelopment(s,180);}
 assert.equal(s.development.history.length,60);events.refresh(s);
 assert(s.events.filter(e=>e.status==='active'&&e.payload.developmentSequence).length<=6);
 const recent=s.events.findLast(e=>e.status==='active'&&e.payload.developmentSequence);events.acknowledge(s,recent.eventId);events.refresh(s);
 assert(!s.events.some(e=>e.status==='active'&&e.payload.developmentSequence));
 assert(eventPriority({kind:'alert',payload:{urgent:true}})>eventPriority(event));
 assert(eventPriority({kind:'insight',payload:{relationId:'v2_grass_to_grasshopper'}})>eventPriority(event));assert.equal(eventConfig.maxVisible,4);
});
test('S/U: deferred births stay atomic at capacity and bad habitat cannot protect an infant hare forever',()=>{
 const s=world(make('grass'),...Array.from({length:29},(_,i)=>make('oak','full-'+i,false,.2+(i%7)*.09)));
 s.population.breeding.grass={healthySeconds:0,nextAt:0,pending:{remainingSeconds:0,position:{x:.45,y:.72}}};
 const sequence=s.population.sequence,idSequence=s.nextInstanceSequence;
 assert(hasDevelopmentWork(s));assert.equal(updateReproduction(s,.5,layout).length,0);
 assert.equal(s.organisms.length,30);assert.equal(s.population.sequence,sequence);assert.equal(s.nextInstanceSequence,idSequence);assert(s.population.breeding.grass.pending);
 const baby=make('rabbit','protected',true),nursery=world(baby);nursery.environment.water.value=.15;
 const initialHunger=baby.hunger,feeding=createFeedingSystem();for(let i=0;i<1000;i++)feeding.update(nursery,.1,layout);
 assert.equal(baby.hunger,initialHunger);assert.equal(developmentStage(baby),'baby');
 for(let i=0;i<1400;i++)feeding.update(nursery,.1,layout);
 const warning=createEventSystem(nursery.simulationTime);warning.refresh(nursery);
 assert(nursery.events.some(e=>e.sourceId===baby.instanceId&&e.payload.urgent));
 for(let i=0;i<5600;i++)feeding.update(nursery,.1,layout);
 assert(baby.hunger>0);assert.equal(nursery.organisms.length,0);assert.equal(nursery.population.history.at(-1).cause,'starvation');
});
test('X: a full event queue yields optional growth space to core feeding and later restores the unrecorded growth notice',()=>{
 const s=createGameState();Object.assign(s,{organisms:[],simulationTime:400,observations:[],events:[]});
 let n=1;const add=(id,shortage=false)=>{const o=make(id,`queue-${n++}`);if(shortage)Object.assign(o,{hunger:1,foodShortageDuration:20,deprivationSeconds:180});s.organisms.push(o);return o;};
 const grass=add('grass'),pine=add('pine');
 // A real transition supplies the growth notice; initial adults never do.
 grass.development={origin:'seed-spread',progressSeconds:0,stage:'sprout'};updateDevelopment(s,180);
 Object.assign(grass,{growth:.2,foodStock:.3});Object.assign(pine,{growth:.2,foodStock:.3});s.environment.sunlight.value=0;
 for(const id of ['snail','caterpillar','chipmunk'])for(let i=0;i<8;i++)add(id,true);add('rabbit',true);const gh=add('grasshopper');
 const hunters={grasshopper:'frog',rabbit:'goshawk',caterpillar:'tit',snail:'ladybird',spider:'tit',frog:'weasel'};
 s.population.history=Object.keys(hunters).map((id,i)=>({sequence:i+1,speciesId:id,cause:'predation',changeType:'predation',simulationTime:350,countBefore:2,countAfter:1,noted:false,consumerSpeciesId:hunters[id]}));s.population.sequence=6;
 const record=s.development.history[0],es=createEventSystem(400),active=()=>s.events.filter(e=>e.status==='active');
 for(let i=0;i<4;i++)es.update(s,1);assert.equal(s.organisms.length,28);assert.equal(active().length,36);assert(active().some(e=>e.payload.developmentSequence===record.sequence));
 const points=s.metrics.points;Object.assign(gh,{hunger:0,lastSuccessfulFeedingAt:405,deprivationSeconds:0});
 es.update(s,1,[{foodSpeciesId:'grass',consumerSpeciesId:'grasshopper',consumerInstanceId:gh.instanceId}]);
 assert.equal(active().length,36);assert(active().some(e=>e.payload.relationId==='v2_grass_to_grasshopper'));assert(!active().some(e=>e.payload.developmentSequence));assert(!record.noted);
 const consumer=s.organisms.find(o=>o.foodShortageDuration>=8);Object.assign(consumer,{hunger:0,foodShortageDuration:0,deprivationSeconds:0});es.refresh(s);
 assert(active().some(e=>e.payload.developmentSequence===record.sequence));assert(!record.noted);assert.equal(s.metrics.points,points);assert.equal(s.observations.length,0);
});
