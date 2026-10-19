import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {environmentEventConfig as config,environmentEventDefinitions as definitions} from '../data/environment-events.js';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {startEnvironmentEvent,updateEnvironmentEvents,currentEnvironmentEvent,environmentEventPresentation,chooseEnvironmentObservation,hasEnvironmentEventWork} from '../js/systems/environment-events.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {executeManagement,availableManagement} from '../js/systems/management.js';
import {factorValue,growthSuitability,animalActivity} from '../js/systems/environment.js';
import {developmentStage} from '../js/systems/development.js';
import {naturalEndAt} from '../js/state/life-state.js';
import {foodRelations} from '../data/food-relations.js';
import {eventPriority,eventConfig} from '../data/event-config.js';
import {world,make,layout} from './ecology-fixtures.mjs';
const run=(s,seconds,options)=>{const f=createFeedingSystem(s.simulationTime,options);for(let i=0;i<seconds*10;i++)f.update(s,.1,layout);return f;};
const advance=(s,time)=>{s.simulationTime=time;updateEnvironmentEvents(s);};
test('A/B: four original factors and exactly five configured causes preserve all23/22 definitions',()=>{
 const s=createGameState();assert.deepEqual(Object.keys(s.environment),['sunlight','water','air','soil']);assert.equal(Object.keys(definitions).length,5);
 assert.equal(foodRelations.length,22);assert.equal(foodRelations.filter(r=>r.evidenceLevel==='A').length,5);assert.equal(foodRelations.filter(r=>r.evidenceLevel==='B').length,17);
 assert.equal(s.schemaVersion,17);assert.equal(s.ecologyRevision,2);
});
for(const [kind,d] of Object.entries(definitions))test(`${kind}: C/D/E/F/G/S/T gradual actual factor, once-only delta, independent other factors and non-resetting recovery`,()=>{
 const s=createGameState();s.metrics.points=30;if(kind==='rain')s.environment.water.value=.2;
 const before=structuredClone(s.environment),r=startEnvironmentEvent(s,kind);assert(r);assert.equal(factorValue(s.environment,d.factor),before[d.factor].value);
 advance(s,d.duration/2);const middle=factorValue(s.environment,d.factor);
 assert(d.magnitude<0?middle<before[d.factor].value:middle>before[d.factor].value);
 const applied=r.appliedDelta;updateEnvironmentEvents(s);assert.equal(r.appliedDelta,applied);assert.equal(factorValue(s.environment,d.factor),middle);
 for(const factor of Object.keys(s.environment))if(factor!==d.factor)assert.equal(s.environment[factor].value,before[factor].value);
 advance(s,d.duration);const end=factorValue(s.environment,d.factor);
 if(d.magnitude<0){assert.equal(r.phase,'recovering');assert(Math.abs(end-.35)<config.epsilon);assert(hasEnvironmentEventWork(s));advance(s,d.duration+120);assert(factorValue(s.environment,d.factor)>end&&factorValue(s.environment,d.factor)<.8);
  // A paid management improvement is not erased at the recovery endpoint.
  s.environment[d.factor].value=1;advance(s,d.duration+240);assert.equal(factorValue(s.environment,d.factor),1);
 }else {assert.equal(r.phase,'ended');assert(end>.2&&end<1);}
 assert.equal(r.phase,'ended');assert.equal(currentEnvironmentEvent(s),undefined);const value=factorValue(s.environment,d.factor);updateEnvironmentEvents(s);assert.equal(factorValue(s.environment,d.factor),value);
 assert.equal(s.organisms.length,3);assert.equal(s.metrics.points,30);
});
test('H/I/J/K/L/M: measured growth delays use the shared environment and do not reset life, eggs or frog learning',()=>{
 for(const id of ['grass','grasshopper','rabbit','mushroom']){
  const o=createOrganismInstance(id,'young-'+id,{x:.4,y:.72},{newborn:id!=='mushroom'}),s=world([]);s.organisms=[o];s.metrics.points=30;s.decomposition.organicMatter.wood=10;
  if('hunger'in o){o.hunger=.1;o.lastSuccessfulFeedingAt=0;}if(id==='rabbit'){o.development.progressSeconds=90;o.development.stage='juvenile';}
  const life=structuredClone(o.life),end=id==='mushroom'?null:naturalEndAt(o);s.population.breeding.grass={healthySeconds:0,nextAt:999,pending:{remainingSeconds:60,position:{x:.8,y:.72}}};
  const r=startEnvironmentEvent(s,'drought');advance(s,160);if('hunger'in o)o.lastSuccessfulFeedingAt=160;
  // Set progress safely away from a stage boundary to isolate actual delay.
  const progress=o.development.progressSeconds;run(s,10);assert(o.development.progressSeconds-progress<10);const paused=o.development.progressSeconds;run(s,.5);assert.equal(o.development.progressSeconds,paused);assert.deepEqual(o.life.duration,life.duration);if(end)assert.equal(naturalEndAt(o),end);
  assert(s.population.breeding.grass.pending.remainingSeconds>0);assert.equal(o.development.stage,id==='mushroom'?'mycelium':id==='grass'?'sprout':id==='grasshopper'?'nymph':'juvenile');
  assert(r.evidence.some(e=>e.speciesId===id&&['growth-delay','producer-decline','colony-decline'].includes(e.type)));
 }
 const s=world([['frog',1,.4]]);s.metrics.points=30;startEnvironmentEvent(s,'rain');run(s,60);assert.equal(s.organisms.length,1);assert(!s.organisms[0].development);assert(!s.population.breeding.frog);assert.equal(developmentStage(s.organisms[0]),'adult');
});
test('N/O/P: existing paid water6/cooldown8, actual results and zero-point natural recovery have no double charge or free action',()=>{
 const s=world([['grass',1,.4]]);s.metrics.points=30;const r=startEnvironmentEvent(s,'drought');advance(s,160);run(s,4);
 const e=createEventSystem(s.simulationTime);for(let i=0;i<4;i++)e.update(s,1);
 const notice=s.events.find(v=>v.status==='active'&&v.payload.factor==='water');assert(notice);
 assert(availableManagement(s,notice.eventId).some(a=>a.actionId==='water-care'&&a.available));
 const before=factorValue(s.environment,'water'),points=s.metrics.points;assert(executeManagement(s,'water-care',notice.eventId).ok);
 assert.equal(s.metrics.points,points-6);assert(factorValue(s.environment,'water')>before);assert.equal(r.responses.length,1);assert(r.responses[0].afterValue>r.responses[0].beforeValue);
 assert(!executeManagement(s,'water-care',notice.eventId).ok);assert.equal(s.metrics.points,points-6);
 const poor=world([['grass',1,.4]]),p=startEnvironmentEvent(poor,'drought');advance(poor,180);const es=createEventSystem(poor.simulationTime);es.refresh(poor);
 const event=poor.events.find(v=>v.payload.factor==='water');assert(!executeManagement(poor,'water-care',event.eventId).ok);assert.equal(poor.metrics.points,0);assert(factorValue(poor.environment,'water')>=.45);
 poor.organisms=[];assert(hasEnvironmentEventWork(poor));advance(poor,420);assert(poor.environment.water.value>=.8-config.epsilon);assert.equal(p.phase,'ended');assert.equal(poor.metrics.points,0);
});
test('Q/R: deterministic slow schedule, initial learning grace and adverse postponement do not stack or switch to bonus rain',()=>{
 const a=createGameState(),b=createGameState();a.metrics.points=b.metrics.points=30;
 advance(a,479.5);assert.equal(a.environmentEvents.history.length,0);
 advance(a,480);assert.equal(a.environmentEvents.history.length,1);assert.equal(a.environmentEvents.history[0].kind,'drought');
 assert.equal(startEnvironmentEvent(a,'cloudy'),null);advance(a,900);assert.equal(a.environmentEvents.history.length,1);
 advance(b,480);assert.deepEqual(a.environmentEvents.history[0].startedAt,b.environmentEvents.history[0].startedAt);
 const bad=createGameState();bad.metrics.stability=0;advance(bad,480);assert.equal(bad.environmentEvents.history.length,0);assert.equal(bad.environmentEvents.cursor,0);assert.equal(bad.environmentEvents.nextAt,600);
 assert.equal(config.initialDelay,480);assert.equal(config.interval,720);
});
test('U/V/W: real evidence and explicit environment records are separate and lower priority than survival, food and growth',()=>{
 const s=createGameState();s.metrics.points=30;const r=startEnvironmentEvent(s,'rain');run(s,10);
 assert.equal(r.appliedDelta,0);assert.equal(r.evidence.length,0);assert.equal(environmentEventPresentation(s).current.actual.length,0);
 const es=createEventSystem(s.simulationTime);es.refresh(s);const event=s.events.find(e=>e.payload.environmentEventId===r.eventId);assert(event);
 assert(eventPriority(event)<eventPriority({kind:'insight',payload:{developmentSequence:1}}));assert.equal(eventConfig.maxVisible,4);
 const before=structuredClone({points:s.metrics.points,food:s.observations,growth:s.development,history:s.rewardHistory});
 assert(chooseEnvironmentObservation(s,r.eventId,'wait').ok);es.refresh(s);assert.equal(r.choice,'wait');assert(r.observed);
 assert.deepEqual({points:s.metrics.points,food:s.observations,growth:s.development,history:s.rewardHistory},before);
 assert(chooseEnvironmentObservation(s,r.eventId,'observe').ok);assert.equal(s.metrics.points,30);
});
test('Z: no independent clocks, per-frame calculation, direct organism deletion or developer student toggle',()=>{
 const source=readFileSync(new URL('../js/systems/environment-events.js',import.meta.url),'utf8');assert(!/Date\.now|setTimeout|setInterval|requestAnimationFrame|removeOrganism|Math\.random/.test(source));
 const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');assert(!main.includes('environmentEventsEnabled:false'));assert(main.includes('hasEnvironmentEventWork'));
});
test('W: a full queue removes optional weather before growth to make room for a core food discovery',()=>{
 const s=createGameState();Object.assign(s,{organisms:[],simulationTime:400,events:[]});let n=0;
 const add=(id,shortage=false)=>{const o=make(id,`priority-${++n}`);if(shortage)Object.assign(o,{hunger:1,foodShortageDuration:20,deprivationSeconds:180});s.organisms.push(o);return o;};
 const grass=add('grass'),pine=add('pine');Object.assign(grass,{growth:.2,foodStock:.3});Object.assign(pine,{growth:.2,foodStock:.3});
 for(const id of ['snail','caterpillar','chipmunk'])for(let i=0;i<8;i++)add(id,true);add('rabbit',true);const gh=add('grasshopper');
 const hunters={grasshopper:'frog',rabbit:'goshawk',caterpillar:'tit',snail:'ladybird',spider:'tit'};
 s.population.history=Object.entries(hunters).map(([id,consumerSpeciesId],i)=>({sequence:i+1,speciesId:id,cause:'predation',changeType:'predation',simulationTime:350,countBefore:2,countAfter:1,noted:false,consumerSpeciesId}));s.population.sequence=5;
 s.development={sequence:1,history:[{sequence:1,instanceId:grass.instanceId,speciesId:'grass',stage:'grown',simulationTime:181,noted:false}]};
 const weather=startEnvironmentEvent(s,'cloudy');s.environment.sunlight.value=0;
 const es=createEventSystem(400),active=()=>s.events.filter(e=>e.status==='active');for(let i=0;i<4;i++)es.update(s,1);
 assert.equal(active().length,36);assert(active().some(e=>e.payload.environmentEventId));assert(active().some(e=>e.payload.developmentSequence));
 es.update(s,1,[{foodSpeciesId:'grass',consumerSpeciesId:'grasshopper',consumerInstanceId:gh.instanceId}]);
 assert.equal(active().length,36);assert(active().some(e=>e.payload.relationId==='v2_grass_to_grasshopper'));assert(active().some(e=>e.payload.developmentSequence));assert(!active().some(e=>e.payload.environmentEventId));
 assert(!weather.observed);assert.equal(s.observations.length,0);assert.equal(s.metrics.points,0);
});
test('O: incident observation stays zero-point while paid water resolution keeps the original once-only reward',()=>{
 const s=world([['grass',1,.4]]);s.metrics.points=30;const r=startEnvironmentEvent(s,'drought');advance(s,160);
 const es=createEventSystem(160);es.refresh(s);const event=s.events.find(e=>e.payload.environmentEventId===r.eventId);assert(event);
 assert(executeManagement(s,'water-care',event.eventId).ok);assert.equal(s.metrics.points,24);es.refresh(s);
 assert.equal(s.metrics.points,27);assert.equal(s.managementHistory[0].result,'resolved');assert.equal(event.status,'active');
 assert(es.acknowledge(s,event.eventId).ok);assert.equal(s.metrics.points,27);es.refresh(s);assert.equal(s.rewardHistory.filter(r=>r.rewardId==='management:water_shortage_resolved').length,1);
});
test('V: cloud cover cannot claim a colony response caused solely by missing wood',()=>{
 const s=world([]),o=make('mushroom','quiet-colony');s.organisms=[o];s.metrics.points=30;s.decomposition.organicMatter.wood=0;o.life.vigor=.8;
 const r=startEnvironmentEvent(s,'cloudy');run(s,.5);assert(o.life.vigor<.8);assert.equal(r.evidence.length,0);
 assert(r.appliedDelta<0);assert(!environmentEventPresentation(s).current.actual.some(t=>t.includes('군집')));
});
test('bounded history: only20 episodes survive; no free reset of previously bad values or repeat event rewards',()=>{
 const s=createGameState();s.metrics.points=0;s.environment.water.value=.15;
 const bad=startEnvironmentEvent(s,'drought');advance(s,420);assert.equal(s.environment.water.value,.15);assert.equal(bad.appliedDelta,0);assert.equal(bad.recoveredDelta,0);
 for(let i=0;i<25;i++){const r=startEnvironmentEvent(s,'rain');assert(r);advance(s,s.simulationTime+120);chooseEnvironmentObservation(s,r.eventId,'wait');}
 assert.equal(s.environmentEvents.history.length,20);assert.equal(s.environmentEvents.sequence,26);assert.equal(new Set(s.environmentEvents.history.map(r=>r.eventId)).size,20);
 assert.equal(s.metrics.points,0);assert.equal(s.observations.length,0);assert.equal(s.development.history.length,0);
});
