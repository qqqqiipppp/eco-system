// The river theme (data/river.js): its organisms live in the water's spaces,
// meet their food there, and its pond stages clear with the forest's engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import {useRiverTheme,riverSpecies,riverFoodRelations} from '../data/river.js';
import {stages,stageById,chapters} from '../data/chapters.js';
import {organisms,organismById} from '../data/organisms.js';
import {placementConfig,speciesProfiles} from '../data/interaction-config.js';
import {foodRelations} from '../data/food-relations.js';
import {discoveryEvents} from '../data/event-config.js';
import {mealSentence} from '../data/student-text.js';
import {isPositionAllowed} from '../js/systems/placement-rules.js';
import {placeOrganism} from '../js/systems/placement.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {evaluateStability} from '../js/systems/stability.js';
import {createStageGameState,updateStage,stageBlockers,catchObservation,buyCheck,payFor,prepareOptions,prepareFor,taskDone} from '../js/systems/chapter-stage.js';
useRiverTheme();
const layout={footprints:Object.fromEntries(Object.keys(organismById).map(id=>[id,{halfWidth:.01,above:.1,below:.02}])),blockedRects:[]};
const zoneOf=id=>placementConfig.zones[speciesProfiles[id].zone];

test('the river replaces the chapters and cards, and keeps the forest species known',()=>{
 assert.deepEqual(chapters.map(c=>c.chapterId),['river-pond']);
 assert.deepEqual(stages.map(s=>s.stageId).slice(0,3),['1-1','1-2','1-3']);assert.equal(stageById['1-1'].title,'연못의 시작');
 assert.deepEqual(organisms.map(o=>o.id),riverSpecies.map(s=>s.id));
 assert.equal(organismById.grass.name,'강아지풀');
});

test('every pond organism starts inside its own living space',()=>{
 for(const stage of stages)for(const [id,x,y] of stage.organisms)assert.ok(isPositionAllowed(id,{x,y},layout),`${stage.stageId} ${id} ${x},${y}`);
});

test('every eater can reach where its food lives',()=>{
 for(const r of riverFoodRelations){
  const food=zoneOf(r.sourceSpeciesId),eater=zoneOf(r.targetSpeciesId);
  assert.ok(Math.max(food.top,eater.top)<=Math.min(food.bottom,eater.bottom)&&Math.max(food.left,eater.left)<=Math.min(food.right,eater.right),r.relationId);
  assert.ok(foodRelations.includes(r)&&discoveryEvents[r.relationId],r.relationId);
 }
 assert.equal(mealSentence(riverFoodRelations[0]),'물벼룩이 작은 조류를 먹었어요.');
});

// A student who places what the stage asks for (the card's own space) and catches every 💡.
function place(s,id){
 if(!buyCheck(s,id).ok)return false;
 const z=zoneOf(id);
 for(const x of [.2,.3,.4,.5,.6])if(placeOrganism(s,id,{position:{x:z.left+(z.right-z.left)*x,y:(z.top+z.bottom)/2},isPlayArea:true,isUI:false},layout).ok){payFor(s,id);return true;}
 return false;
}
function play(stageId,student,seconds=400){
 const s=createStageGameState(stageById[stageId]),f=createFeedingSystem(0),events=createEventSystem(0);let next=0;
 for(let t=0;t<seconds*10&&!s.chapter.cleared;t++){
  if(s.simulationTime>=next){next=s.simulationTime+5;student(s);}
  const r=f.update(s,.1,layout);if(!r.ticked)continue;
  events.update(s,.5,r.feedingEvents);s.metrics.stability=evaluateStability(s).score;updateStage(s,.5,r.feedingEvents);
 }
 return s;
}
const careful=s=>{
 for(const o of [...s.chapter.offers])catchObservation(s,o.offerId);
 for(const b of stageBlockers(s))if(b.id==='missing')for(const m of b.species)place(s,m.id);
 for(const t of stageById[s.chapter.stageId].tasks)if(t.have&&!taskDone(s,t))place(s,t.have);
 if(prepareOptions(s).length)prepareFor(s,'wait');
};

test('a careful student clears the pond stages; waiting alone does not',()=>{
 for(const id of ['1-1','1-2','1-3']){
  const s=play(id,careful);
  assert.ok(s.chapter.cleared,`${id} cleared`);
  assert.ok(stageById[id].tasks.every(t=>taskDone(s,t)),`${id} tasks`);
 }
 assert.equal(play('1-1',()=>{}).chapter.cleared,false,'no medaka, no chain');
});

test('a fed tadpole grows into a frog on the bank, which eats water striders',()=>{
 const s=createStageGameState(stageById['1-3']),f=createFeedingSystem(0);let grown=null,removed=[];
 for(let t=0;t<3000&&!grown;t++){const r=f.update(s,.1,layout);if(!r.ticked)continue;const out=updateStage(s,.5,r.feedingEvents);if(out.removed?.length){removed.push(...out.removed);f.forget(out.removed);}grown=out.born.find(o=>o.speciesId==='frog')||grown;}
 assert.ok(grown,'a frog');assert.ok(removed.length>=1,'its tadpole is gone');
 assert.ok(isPositionAllowed('frog',grown.position,layout),'on the bank');
 assert.ok(taskDone(s,{grow:'frog'}));
 assert.ok(foodRelations.some(r=>r.sourceSpeciesId==='water-strider'&&r.targetSpeciesId==='frog'));
});
