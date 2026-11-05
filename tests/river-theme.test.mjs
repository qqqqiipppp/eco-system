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
import {crisisQuestions} from '../data/crisis-reflection.js';
import {isPositionAllowed} from '../js/systems/placement-rules.js';
import {placeOrganism} from '../js/systems/placement.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {evaluateStability} from '../js/systems/stability.js';
import {createStageGameState,updateStage,stageBlockers,catchObservation,buyCheck,payFor,prepareOptions,prepareFor,taskDone,hitBoss,activeBoss,crisisChoice,chooseCrisisAction,collectTrash} from '../js/systems/chapter-stage.js';
useRiverTheme();
const layout={footprints:Object.fromEntries(Object.keys(organismById).map(id=>[id,{halfWidth:.01,above:.1,below:.02}])),blockedRects:[]};
const zoneOf=id=>placementConfig.zones[speciesProfiles[id].zone];

test('the river replaces the chapters and cards, and keeps the forest species known',()=>{
 assert.deepEqual(chapters.map(c=>c.chapterId).slice(0,2),['river-pond','river-upstream']);
 assert.deepEqual(stages.map(s=>s.stageId).slice(0,3),['1-1','1-2','1-3']);assert.equal(stageById['1-1'].title,'연못의 시작');
 assert.deepEqual(organisms.map(o=>o.id),riverSpecies.filter(s=>!s.invader).map(s=>s.id),'invaders are no card');
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
 while(activeBoss(s.chapter))hitBoss(s);
 for(const t of stageById[s.chapter.stageId].tasks)if(t.decomposed&&!s.organisms.some(o=>o.speciesId==='water-decomposer'))place(s,'water-decomposer');
 const ch=crisisChoice(s);if(ch)chooseCrisisAction(s,ch.crisis.choices.findIndex(c=>c.right));
 for(const t of [...s.chapter.trash])collectTrash(s,t.trashId);
};

test('a careful student clears the pond stages; waiting alone does not',()=>{
 for(const id of ['1-1','1-2','1-3','1-4','2-1','2-2','2-3','2-4','3-1','3-2','3-3','3-4']){
  const s=play(id,careful);
  assert.ok(s.chapter.cleared,`${id} cleared`);
  assert.ok(stageById[id].tasks.every(t=>taskDone(s,t)),`${id} tasks`);
 }
 assert.equal(play('1-1',()=>{}).chapter.cleared,false,'no medaka, no chain');
});

test('a fed tadpole grows into a frog on the bank, which eats water striders',()=>{
 const s=createStageGameState(stageById['1-3']),f=createFeedingSystem(0);let grown=null,removed=[];
 for(let t=0;t<3000&&!grown;t++){const r=f.update(s,.1,layout);if(!r.ticked)continue;const out=updateStage(s,.5,r.feedingEvents);if(out.removed?.length){removed.push(...out.removed);f.forget(out.removed);}grown=out.grown.find(o=>o.speciesId==='frog')||grown;}
 assert.ok(grown,'a frog');assert.ok(removed.length>=1,'its tadpole is gone');
 assert.ok(isPositionAllowed('frog',grown.position,layout),'on the bank');
 assert.ok(taskDone(s,{grow:'frog'}));
 assert.ok(foodRelations.some(r=>r.sourceSpeciesId==='water-strider'&&r.targetSpeciesId==='frog'));
});

test('the question after a river crisis is about the river, not the forest',()=>{
 const forest=Object.values(organismById).filter(o=>!riverSpecies.some(s=>s.id===o.id)).map(o=>o.name);
 for(const kind of new Set(chapters.flatMap(c=>c.events))){
  assert.ok(crisisQuestions[kind]?.length,kind);
  for(const q of crisisQuestions[kind]){
   const text=[q.question,...q.choices,q.explanation].join(' ');
   assert.ok(!forest.some(name=>text.includes(name)),`${kind}: ${text}`);
   assert.ok(!text.includes('숲'),`${kind}: ${text}`);
  }
 }
});

test('every invader has its own question for after it is tapped out',()=>{
 for(const stage of stages)for(const id of stage.boss?.species||[]){
  const set=crisisQuestions['invader:'+id];assert.ok(set?.length,id);
  for(const q of set){assert.ok(q.answer>=0&&q.answer<q.choices.length);assert.ok(!(q.question+q.explanation).includes('숲'),id);}
 }
});

test('an invader comes after a star, eats natives until tapped out, and stalls the stars',()=>{
 const s=createStageGameState(stageById['1-4']);let c=s.chapter;assert.ok(place(s,'catfish'));
 // Let a star grow without tapping: the invader comes and eats.
 const f=createFeedingSystem(0);let ate=0,seen=null;
 for(let t=0;t<4000&&ate<2;t++){const r=f.update(s,.1,layout);if(!r.ticked)continue;const out=updateStage(s,.5,r.feedingEvents);if(out.removed?.length)f.forget(out.removed);ate+=out.bossAte?.length||0;seen=activeBoss(c)||seen;}
 assert.ok(seen&&seen.speciesId==='bullfrog','the bullfrog came after the first star');
 assert.ok(ate>=2&&seen.eaten>=2,'it ate natives while it stayed');
 assert.ok(stageBlockers(s).some(b=>b.id==='invader'),'stars stall');
 let r;for(let i=0;i<15;i++)r=hitBoss(s);
 assert.ok(r.done&&!activeBoss(c)&&!s.organisms.some(o=>o.speciesId==='bullfrog'),'15 taps send it away');
 assert.ok(!stageBlockers(s).some(b=>b.id==='invader'));
});

for(const [stageId,kind] of [['2-4','valley-trash'],['3-3','sewage']])test(`${kind}: a people-made river crisis asks how to stop it before it can be cleaned up`,()=>{
 const s=createStageGameState(stageById[stageId]),f=createFeedingSystem(0),events=createEventSystem(0);
 let open=null,next=0;
 for(let t=0;t<9000&&!open;t++){
  if(s.simulationTime>=next){next=s.simulationTime+5;for(const o of [...s.chapter.offers])catchObservation(s,o.offerId);for(const b of stageBlockers(s))if(b.id==='missing')for(const m of b.species)place(s,m.id);}
  const r=f.update(s,.1,layout);if(!r.ticked)continue;events.update(s,.5,r.feedingEvents);s.metrics.stability=evaluateStability(s).score;updateStage(s,.5,r.feedingEvents);open=crisisChoice(s);}
 assert.ok(open&&open.record.kind===kind,'the crisis asks first');
 for(let t=0;t<200&&!s.chapter.trash.length;t++){const r=f.update(s,.1,layout);if(r.ticked)updateStage(s,.5,r.feedingEvents);}
 assert.equal(collectTrash(s,s.chapter.trash[0].trashId).reason,'choose','no cleaning before choosing');
 const wrong=open.crisis.choices.findIndex(c=>!c.right),right=open.crisis.choices.findIndex(c=>c.right);
 const w=chooseCrisisAction(s,wrong);assert.ok(!w.ok&&w.why,'a wrong choice says why');
 assert.ok(chooseCrisisAction(s,right).ok);assert.equal(crisisChoice(s),null);
 assert.ok(collectTrash(s,s.chapter.trash[0].trashId).ok,'now it can be cleaned up');
});
