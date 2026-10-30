// The adult grasshopper's hop, frame by frame, from the visual tracker alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createVisualTracker,hopPose,hopTiming} from '../js/ui/species-visuals.js';

const hopper=(x,behaviorState='wander',stage='adult')=>({instanceId:'g1',speciesId:'grasshopper',position:{x,y:.7},growth:1,litterConsumed:0,behaviorState,development:{stage},direction:1});
function run(steps){const tracker=createVisualTracker(),out=[];let t=0,x=.3;
 for(const step of steps){t+=step.dt;if(step.move)x+=.002;const s={simulationTime:t,organisms:[hopper(x,step.state,step.stage)],environment:{}};out.push({...tracker.sample(s,step.dt)[0],t});}
 return out;}
const frames=(n,o)=>Array.from({length:n},()=>({dt:1/30,move:true,...o}));

test('one hop shows crouch, push, tuck, reach, then crouch, in that order',()=>{
 const seq=run(frames(24)).map(f=>f.frame).filter((f,i,a)=>f!==a[i-1]);
 assert.deepEqual(seq.slice(0,5),[0,1,2,3,0]);
});
test('the timing table is the one asked for',()=>{
 assert.deepEqual([0,.15,.17,.25,.27,.47,.49,.55,.57,.79].map(t=>hopPose(t).frame),[0,0,1,1,2,2,3,3,0,0]);
 assert.equal(hopTiming.cycle,.8);assert.ok(hopPose(.36).lift>.37,'the top of the hop');
 assert.ok([0,.1,.56,.7].every(t=>hopPose(t).lift===0),'crouch and rest sit on the ground');
});
test('a hop in the air lands even if the model stops or starts eating',()=>{
 for(const state of ['wander','eat']){
  const out=run([...frames(9),...frames(12,{move:false,state})]);
  const after=out.slice(9,15);assert.ok(after.every(f=>f.motion==='move'&&f.hop?.phase==='air'),state+': keeps flying');
  assert.ok(out.at(-1).hop===null&&out.at(-1).motion!=='move'||out.at(-1).hop?.phase!=='air','then stops on the ground');
 }
});
test('on the ground a stop ends the hop at once, and eating never hops',()=>{
 const out=run([...frames(3),...frames(10,{move:false,state:'eat'})]);
 assert.equal(out.at(-1).motion,'eat');assert.equal(out.at(-1).hop,null);
});
test('after landing it hops again while still moving',()=>{
 const starts=run(frames(60)).filter((f,i,a)=>f.hop?.phase==='crouch'&&a[i-1]?.hop?.phase!=='crouch').length;
 assert.ok(starts>=2,'two hops in two seconds');
});
test('the nymph keeps its old look (no hop frames)',()=>{
 const out=run(frames(20,{stage:'nymph'}));assert.ok(out.every(f=>f.hop===null&&/grasshopper\.webp$/.test(f.src)));
});
