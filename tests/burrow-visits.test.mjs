// The otter's picture now and then leaves the water: onto the bank, or into its
// burrow where its head peeks out. View only: the model point stays in the water.
import test from 'node:test';
import assert from 'node:assert/strict';
import {useRiverTheme} from '../data/river.js';
import {stageById} from '../data/chapters.js';
import {placementConfig} from '../data/interaction-config.js';
import {createVisitPlanner,landPlacement} from '../js/ui/burrow-visits.js';
import {speciesProfiles} from '../data/interaction-config.js';
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
 assert.ok(frames.some(f=>f.visit?.walk&&f.visit.y<.25),'and up the bank, far from the water');
 for(const f of frames.filter(f=>f.visit?.walk))assert.ok(f.visit.x>=.7&&f.visit.y<=.47,'on land it stays on the bank');
 for(const f of frames.filter(f=>f.visit?.peek))assert.ok(f.visit.hidden,'its body is hidden while the head peeks');
 // On the bank it walks (its walk frames); in the water it swims as always.
 for(const f of frames.filter(f=>f.visit&&!f.visit.hidden)){if(inside(bank,f.visit))assert.ok(f.visit.walk&&f.visit.frame>=0,'walks on the bank');if(f.visit.y>=water.top)assert.ok(!f.visit.walk,'swims in the water');}
 assert.ok(new Set(frames.filter(f=>f.visit?.walk).map(f=>f.visit.frame)).size>=4,'all four walk frames');
 // Every trip ends where the otter really is, in the water.
 const ends=frames.filter((f,i)=>f.visit===null&&frames[i-1]?.visit);assert.ok(ends.length>=2,'several trips');
 for(const e of ends){const last=frames[frames.indexOf(e)-1].visit;assert.ok(Math.hypot(last.x-o.position.x,last.y-o.position.y)<.02&&inside(water,last),'back home');}
 assert.deepEqual(o.position,{x:.3,y:.7},'the model point never moves');
});

test('no burrow in the picture, no peeking; a hunt or hunger hurries the picture back to the water',()=>{
 const shore=stageById['4-4'].chapter.art.shore;
 assert.ok(!shore.burrow);
 assert.ok(!run(shore,600).some(f=>f.visit?.peek));
 const o=otter(),plan=createVisitPlanner(seeded());let on=false;
 for(let t=0;t<6000&&!on;t++)on=plan.update([o],stageById['3-4'].chapter.art.shore,.1).some(c=>c.visit);
 assert.ok(on,'a visit started');
 o.behaviorState='moveToFood';
 let back=null;for(let t=1;t<=35&&back===null;t++)if(plan.update([o],stageById['3-4'].chapter.art.shore,.1).some(c=>c.visit===null))back=t/10;
 assert.ok(back!==null&&back<=3.5,`the hunt brings the picture back within seconds: ${back}`);
 const hungry={...otter(),hunger:.9};assert.ok(!run(stageById['3-4'].chapter.art.shore,300,hungry).some(f=>f.visit),'a hungry otter stays to hunt');
});

test('a fed otter spends a good part of its time out of the water',()=>{
 const shore=stageById['3-4'].chapter.art.shore,frames=run(shore,600);
 const out=frames.filter(f=>f.visit&&(f.visit.walk||f.visit.hidden)).length;
 assert.ok(out/6000>=.4,`on land or in its burrow ${(100*out/6000).toFixed(0)}% of the time`);
});

test('a Reeves\' turtle climbs onto the bank to bask, but never into the otter\'s burrow',()=>{
 const shore=stageById['3-4'].chapter.art.shore,bank=placementConfig.zones.bank;
 const turtle={instanceId:'t1',speciesId:'reeves-turtle',position:{x:.4,y:.6},behaviorState:'wander',hunger:.1};
 const frames=run(shore,600,turtle);
 assert.ok(frames.some(f=>f.visit&&!f.visit.hidden&&inside(bank,f.visit)),'on the bank');
 assert.ok(!frames.some(f=>f.visit?.peek||f.visit?.hidden),'not in the burrow');
});

test('an otter or a turtle put on the bank lives at the water\'s edge and starts with a walk on land',()=>{
 const shore=stageById['3-4'].chapter.art.shore,{land}=shore;
 for(const id of ['otter','reeves-turtle']){
  const on=landPlacement(id,{x:.9,y:.2},shore),zone=placementConfig.zones[speciesProfiles[id].zone];
  assert.ok(on&&inside(zone,on.water),`${id} lives in its own space: ${JSON.stringify(on)}`);
  assert.ok(inside(land,on.land),`${id} starts on the bank`);
  const o={instanceId:'x',speciesId:id,position:on.water,behaviorState:'wander',hunger:.1},plan=createVisitPlanner(seeded());
  plan.startOnLand(o,on.land,shore);const frames=[];
  for(let t=0;t<600;t++)for(const c of plan.update([o],shore,.1))frames.push(c.visit);
  assert.ok(frames[0].walk&&Math.hypot(frames[0].x-on.land.x,frames[0].y-on.land.y)<.03,'first seen where it was put');
  assert.ok(frames.includes(null),'then back in the water');
 }
 assert.equal(landPlacement('pale-chub',{x:.9,y:.2},shore),null,'a fish stays in the water');
 assert.equal(landPlacement('otter',{x:.3,y:.7},shore),null,'a tap in the water is an ordinary placement');
 assert.equal(landPlacement('otter',{x:.9,y:.2},stageById['2-1'].chapter.art.shore),null,'no bank drawn, no land');
});
