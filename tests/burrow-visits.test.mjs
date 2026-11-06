// The otter's picture now and then leaves the water: onto the bank, or into its
// burrow where its head peeks out. View only: the model point stays in the water.
import test from 'node:test';
import assert from 'node:assert/strict';
import {useRiverTheme} from '../data/river.js';
import {stageById} from '../data/chapters.js';
import {placementConfig} from '../data/interaction-config.js';
import {createVisitPlanner} from '../js/ui/burrow-visits.js';
useRiverTheme();
const seeded=(n=11)=>()=>(n=(n*16807)%2147483647)/2147483647;
const otter=()=>({instanceId:'o1',speciesId:'otter',position:{x:.3,y:.7},behaviorState:'wander',hunger:.1});
const inside=(z,p)=>p.x>=z.left-.001&&p.x<=z.right+.001&&p.y>=z.top-.001&&p.y<=z.bottom+.001;

function run(shore,seconds,o=otter()){
 const plan=createVisitPlanner(seeded()),frames=[];
 for(let t=0;t<seconds*10;t++)for(const c of plan.update([o],shore,.1))frames.push({t,...c});
 return frames;
}

test('a midstream otter visits the bank and peeks out of its burrow, then swims back',()=>{
 const shore=stageById['3-4'].chapter.art.shore,o=otter(),frames=run(shore,600,o);
 const bank=placementConfig.zones.bank,water=placementConfig.zones.water;
 assert.ok(frames.some(f=>f.visit?.peek),'its head peeks out of the burrow');
 assert.ok(frames.some(f=>f.visit&&!f.visit.hidden&&inside(bank,f.visit)),'it walks on the bank');
 for(const f of frames.filter(f=>f.visit?.peek))assert.ok(f.visit.hidden,'its body is hidden while the head peeks');
 // Every trip ends where the otter really is, in the water.
 const ends=frames.filter((f,i)=>f.visit===null&&frames[i-1]?.visit);assert.ok(ends.length>=2,'several trips');
 for(const e of ends){const last=frames[frames.indexOf(e)-1].visit;assert.ok(Math.hypot(last.x-o.position.x,last.y-o.position.y)<.02&&inside(water,last),'back home');}
 assert.deepEqual(o.position,{x:.3,y:.7},'the model point never moves');
});

test('no burrow in the picture, no peeking; a hunt or hunger ends a visit at once',()=>{
 const shore=stageById['4-4'].chapter.art.shore;
 assert.ok(!shore.burrow);
 assert.ok(!run(shore,600).some(f=>f.visit?.peek));
 const o=otter(),plan=createVisitPlanner(seeded());let on=false;
 for(let t=0;t<6000&&!on;t++)on=plan.update([o],stageById['3-4'].chapter.art.shore,.1).some(c=>c.visit);
 assert.ok(on,'a visit started');
 o.behaviorState='moveToFood';
 assert.deepEqual(plan.update([o],stageById['3-4'].chapter.art.shore,.1),[{instanceId:'o1',visit:null}],'the hunt brings the picture back');
 const hungry={...otter(),hunger:.9};assert.ok(!run(stageById['3-4'].chapter.art.shore,300,hungry).some(f=>f.visit),'a hungry otter stays to hunt');
});
