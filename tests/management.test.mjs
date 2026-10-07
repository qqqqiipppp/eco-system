import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {createEventSystem} from '../js/systems/events.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {setEnvironmentLevel,growthSuitability} from '../js/systems/environment.js';
import {executeManagement,availableManagement} from '../js/systems/management.js';
import {speciesProfiles} from '../data/interaction-config.js';
const layout={footprints:Object.fromEntries(Object.keys(speciesProfiles).map(id=>[id,{halfWidth:.02,above:.1,below:.03}])),blockedRects:[]};
function setup(ids=['grass']){
 const state=createGameState();state.organisms=ids.map((id,i)=>createOrganismInstance(id,`test-${i}`,{x:.4,y:.74}));
 const events=createEventSystem(),feeding=createFeedingSystem();
 function run(seconds){for(let i=0;i<seconds*10;i++){const r=feeding.update(state,.1,layout);if(r.ticked)events.update(state,.5,r.feedingEvents)}}
 function bad(factor='water'){setEnvironmentLevel(state,factor,'bad');run(5);return state.events.find(e=>e.kind==='alert'&&e.status==='active'&&e.payload.factor===factor)}
 return {state,events,feeding,run,bad};
}
test('A/H: one step water improvement, cost then genuine resolution reward once; resources not directly filled',()=>{
 const s=setup(),event=s.bad();s.state.metrics.points=20;
 const stock=s.state.organisms[0].foodStock,old=growthSuitability('grass',s.state.environment);
 assert(executeManagement(s.state,'water-care',event.eventId).ok);
 assert.equal(s.state.metrics.points,14);assert.equal(s.state.environment.water.value,.6);assert.equal(event.status,'active');
 assert.equal(s.state.organisms[0].foodStock,stock);assert(growthSuitability('grass',s.state.environment)>old);
 s.events.refresh(s.state);assert.equal(event.status,'resolved');assert.equal(s.state.metrics.points,17);
 s.run(45);const next=s.bad();assert(executeManagement(s.state,'water-care',next.eventId).ok);s.events.refresh(s.state);
 assert.equal(s.state.rewardHistory.filter(r=>r.rewardId==='management:water_shortage_resolved').length,1);
});
test('B/C: good state, insufficient points, invalid action/source and removed animal are atomic failures',()=>{
 const s=setup(),event=s.bad();
 function unchanged(action,id=event.eventId){const before=structuredClone(s.state);assert.equal(executeManagement(s.state,action,id).ok,false);assert.deepEqual(s.state,before)}
 unchanged('water-care');unchanged('missing');unchanged('soil-care');unchanged('water-care','removed');
 s.state.metrics.points=50;setEnvironmentLevel(s.state,'water','good');unchanged('water-care');
 const f=setup(['frog']);f.run(25);const alert=f.state.events.find(e=>e.kind==='alert');f.state.organisms=[];f.state.metrics.points=20;
 const before=structuredClone(f.state);assert.equal(executeManagement(f.state,'food-support',alert.eventId).ok,false);assert.deepEqual(f.state,before);
});
test('D: temporary relief and cooldown, no prey creation, original shortage returns',()=>{
 const s=setup(['frog']);s.run(25);s.state.metrics.points=20;const event=s.state.events.find(e=>e.kind==='alert');
 const hunger=s.state.organisms[0].hunger;assert(executeManagement(s.state,'food-support',event.eventId).ok);assert(s.state.organisms[0].hunger<hunger);
 const before=structuredClone(s.state);assert.match(executeManagement(s.state,'food-support',event.eventId).message,/조금 뒤/);assert.deepEqual(s.state,before);
 s.events.refresh(s.state);assert.equal(event.status,'resolved');assert.equal(s.state.rewardHistory.length,0);
 s.run(60);assert(s.state.events.some(e=>e.kind==='alert'&&e.status==='active'));assert.equal(s.state.organisms.length,1);
});
test('E: habitat effect improves recovery only over ecology ticks, expires and does not stack',()=>{
 const s=setup(['grass','frog']),event=s.bad();s.state.metrics.points=50;s.state.organisms[0].foodStock=0;s.state.organisms[0].growth=.2;
 const control=structuredClone(s.state),controlFeeding=createFeedingSystem();const hunger=s.state.organisms[1].hunger;
 assert(executeManagement(s.state,'habitat-care',event.eventId).ok);assert.equal(s.state.organisms[0].foodStock,0);assert.equal(s.state.organisms[1].hunger,hunger);
 assert.equal(executeManagement(s.state,'habitat-care',event.eventId).ok,false);
 s.run(5);for(let i=0;i<50;i++)controlFeeding.update(control,.1,layout);
 assert(s.state.organisms[0].foodStock>control.organisms[0].foodStock);assert(s.state.organisms[0].growth>control.organisms[0].growth);
 assert.equal(event.status,'active');s.run(60);assert.equal(s.state.managementEffects.length,0);
});
test('F/G: observation and correct question rewards require acknowledgment and are semantic once-only',()=>{
 const s=setup(['grass','grasshopper']);s.events.update(s.state,1,[{foodSpeciesId:'grass',consumerSpeciesId:'grasshopper',consumerInstanceId:'test-1'}]);
 const insight=s.state.events.find(e=>e.kind==='insight');assert.equal(s.state.metrics.points,0);
 s.events.acknowledge(s.state,insight.eventId);assert.equal(s.state.metrics.points,12);s.events.acknowledge(s.state,insight.eventId);assert.equal(s.state.metrics.points,12);
 s.bad();let question=s.state.events.find(e=>e.kind==='question'&&e.status==='active');
 s.events.acknowledge(s.state,question.eventId,'cards');assert.equal(s.state.metrics.points,12);
 s.events.acknowledge(s.state,question.eventId,'environment');assert.equal(s.state.metrics.points,22);
 setEnvironmentLevel(s.state,'water','good');s.events.refresh(s.state);s.run(35);s.bad();question=s.state.events.find(e=>e.kind==='question'&&e.status==='active');
 s.events.acknowledge(s.state,question.eventId,'environment');assert.equal(s.state.metrics.points,22);
});
test('soil uses two steps where oak remains limited at normal; unrelated actions omitted',()=>{
 const s=setup(['oak']),event=s.bad('soil');s.state.metrics.points=30;
 assert.deepEqual(availableManagement(s.state,event.eventId).map(a=>a.actionId),['soil-care','habitat-care']);
 assert(executeManagement(s.state,'soil-care',event.eventId).ok);s.events.refresh(s.state);assert.equal(event.status,'active');
 s.run(8);assert(executeManagement(s.state,'soil-care',event.eventId).ok);s.events.refresh(s.state);assert.equal(s.state.environment.soil.value,1);assert.equal(event.status,'resolved');
});
test('a free condition change is not rewarded as a past unresolved management action',()=>{
 const s=setup(['oak']),event=s.bad('soil');s.state.metrics.points=20;executeManagement(s.state,'soil-care',event.eventId);s.events.refresh(s.state);
 setEnvironmentLevel(s.state,'soil','good');s.events.refresh(s.state);assert.equal(s.state.rewardHistory.length,0);
});
test('I: 30 organisms and event history stay bounded through management and long ecology updates',()=>{
 const s=setup(Array(30).fill('frog'));s.run(25);s.state.metrics.points=20;
 const refs=[...s.state.organisms];const event=s.state.events.find(e=>e.kind==='alert');executeManagement(s.state,'food-support',event.eventId);s.events.refresh(s.state);s.run(90);
 assert(s.state.organisms.every((item,i)=>item===refs[i]));assert.equal(s.state.organisms.length,30);assert(s.state.events.length<=60);assert.equal(s.state.managementHistory.length,1);
 assert.equal(s.state.simulationTime,115);assert.equal(Object.keys(s.state.managementCooldowns).length,0);
});
test('removing every producer does not count as solving its environment through management',()=>{
 const s=setup(['oak']),event=s.bad('soil');s.state.metrics.points=20;executeManagement(s.state,'soil-care',event.eventId);
 s.state.organisms=[];s.events.refresh(s.state);assert.equal(event.status,'resolved');assert.equal(s.state.rewardHistory.length,0);
});
