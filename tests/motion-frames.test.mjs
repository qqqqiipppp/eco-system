// The painted motion art, frame by frame, from the visual tracker alone
// (js/ui/species-frames.js as it is in the repository).
import test from 'node:test';
import assert from 'node:assert/strict';
import {createVisualTracker,moveStyle,restingMotions,loopTiming,slowerLoops} from '../js/ui/species-visuals.js';
import {paintedFrames} from '../js/ui/species-frames.js';
import {survivalConfig} from '../data/survival-config.js';

// An earthworm eats litter (it shows by litterConsumed going up) and is kept on the surface here.
const surface=survivalConfig.earthwormCycleSeconds-survivalConfig.earthwormSurfaceSeconds+.5;
const animal=(speciesId,x,behaviorState,stage='adult',t=0)=>({instanceId:'a1',speciesId,position:{x,y:.6},growth:1,litterConsumed:behaviorState==='eat'?t:0,behaviorState,development:{stage},direction:1,life:{startedAt:t,initialAge:surface,duration:1e6}});
// steps: [{dt, move, state}] -> what the tracker paints at each step.
function run(speciesId,steps,stage){const tracker=createVisualTracker(),out=[];let t=0,x=.3;
 for(const step of steps){t+=step.dt;if(step.move)x+=.002;out.push({...tracker.sample({simulationTime:t,organisms:[animal(speciesId,x,step.state||'wander',stage,t)],environment:{}},step.dt)[0],t});}
 return out;}
const frames=(n,o={})=>Array.from({length:n},()=>({dt:1/30,...o}));
const eaters=Object.entries(paintedFrames).filter(([k,f])=>!k.includes(':')&&f.eat).map(([k])=>k);

test('every painted eater shows its own eat frames while eating, in turn', () => {
 assert.ok(eaters.length>=14,'eat frames are in: '+eaters);
 for(const id of eaters){
  const out=run(id,frames(60,{state:'eat'})).filter(f=>f.motion==='eat'),seen=new Set(out.map(f=>f.src.split('/').pop()));
  assert.ok(out.length>=59,id+' stays in eat (the earthworm from its second frame, once it has eaten)');
  assert.deepEqual([...seen].sort(),Array.from({length:paintedFrames[id].eat},(_,n)=>`${id}-eat-${n}.webp`),id+': its eat frames, all of them');
  const switches=out.filter((f,i)=>i&&f.frame!==out[i-1].frame).length,expected=60/30/(loopTiming.eat*(slowerLoops[id]||1)/paintedFrames[id].eat);
  assert.ok(Math.abs(switches-expected)<=1,`${id}: one eat cycle every ${loopTiming.eat*(slowerLoops[id]||1)}s (${switches} switches)`);
  assert.ok(run(id,frames(30,{state:'wander'})).every(f=>!/-eat-/.test(f.src)),id+': no eat frames when not eating');
 }
});

test('the snake flicks its tongue only while resting, never while eating', () => {
 const rest=restingMotions.snake;assert.equal(paintedFrames.snake?.sense,2);assert.equal(paintedFrames.snake?.eat,undefined,'no tongue flick as eating');
 const resting=run('snake',frames(Math.round(rest.every*2*30),{state:'wander'}));
 const flicks=resting.filter(f=>f.motion==='sense');
 assert.ok(flicks.length>=Math.round(rest.length*2*30)-2&&flicks.length<=Math.round(rest.length*2*30)+2,'two short flicks in two rests: '+flicks.length);
 assert.ok(flicks.every(f=>/snake-sense-[01]\.webp$/.test(f.src)));assert.deepEqual([...new Set(flicks.map(f=>f.frame))].sort(),[0,1]);
 assert.ok(resting.filter(f=>f.motion!=='sense').every(f=>/snake\.webp$/.test(f.src)),'otherwise its usual picture');
 const eating=run('snake',frames(200,{state:'eat'}));assert.ok(eating.every(f=>f.motion==='eat'&&!/-sense-/.test(f.src)),'eating: no flick');
});

const moving=(id,n=90)=>run(id,frames(n,{move:true}));
test('frog, rabbit and weasel leap on their two frames: on the ground 0, in the air 1', () => {
 for(const id of ['frog','rabbit','weasel']){
  assert.equal(paintedFrames[id].move,2);assert.equal(moveStyle(id),'hop',id);
  const out=moving(id),air=out.filter(f=>f.hop?.phase==='air'),ground=out.filter(f=>f.hop&&f.hop.phase!=='air');
  assert.ok(air.length&&ground.length,id+' leaves and lands');
  assert.ok(air.every(f=>f.frame===1&&f.src.endsWith(`${id}-move-1.webp`)&&f.hop.lift>=0),id+': in the air on frame 1');
  assert.ok(ground.every(f=>f.frame===0&&f.src.endsWith(`${id}-move-0.webp`)&&f.hop.lift===0),id+': on the ground on frame 0');
 }
 const top=id=>Math.max(...moving(id).map(f=>f.hop?.lift||0));
 assert.ok(top('frog')>top('rabbit')&&top('rabbit')>top('weasel'),'frog highest, then rabbit, weasel lowest');
});
test('birds fly on their wing frames; walkers and the chipmunk walk on the ground', () => {
 for(const id of ['tit','bulbul','goshawk']){const out=moving(id,60);assert.equal(moveStyle(id),'fly');
  assert.ok(out.some(f=>f.hop?.fly&&f.hop.lift>.3),id+' up in the air');assert.deepEqual([...new Set(out.filter(f=>f.hop).map(f=>f.frame))].sort(),[0,1],id+' flaps');}
 for(const id of ['chipmunk','field-mouse','caterpillar','aphid','snail','spider','ladybird','snake']){
  assert.equal(moveStyle(id),'loop',id);const out=moving(id,60).filter(f=>f.motion==='move');
  assert.ok(out.every(f=>f.hop===null),id+' stays on the ground');
  assert.deepEqual([...new Set(out.map(f=>f.src.split('/').pop()))].sort(),[`${id}-move-0.webp`,`${id}-move-1.webp`],id+' walks on its frames');
 }
 const switches=id=>{const out=moving(id,90);return out.filter((f,i)=>i&&f.frame!==out[i-1].frame).length;};
 assert.ok(switches('snail')<switches('aphid')/2,'the snail glides slowly');
});

test('a grass sprout and a fungus mycelium show their own painted pictures', async () => {
 const {visualAsset}=await import('../js/ui/species-visuals.js');
 assert.equal(visualAsset('grass','idle',0,'sprout'),'./assets/images/species-raster/grass-sprout.webp');
 assert.equal(visualAsset('grass','leaf-turn',1,'sprout'),'./assets/images/species-raster/grass-sprout.webp','no leaf-turn frame for the sprout');
 assert.equal(visualAsset('grass','idle',0,'grown'),'./assets/images/species-raster/grass.webp');
 assert.equal(visualAsset('mushroom','active',0,'mycelium'),'./assets/images/species-raster/mushroom-mycelium.webp');
 assert.equal(visualAsset('mushroom','idle',0,'fruiting'),'./assets/images/species-raster/mushroom.webp');
});
