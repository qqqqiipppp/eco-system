import test from 'node:test';import assert from 'node:assert/strict';
import {foodRelations} from '../data/food-relations.js';
import {mealSentence,particle} from '../data/student-text.js';
import {studentStatus,studentChange} from '../js/ui/student-status.js';
import {forestAction,readyActivity} from '../js/ui/forest-flow.js';
import {createGameState} from '../js/state/game-state.js';
import {activities} from '../data/activities.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {populationConfig} from '../data/population-config.js';
import {survivalConfig} from '../data/survival-config.js';
test('Korean particles and actual fruit, acorn, leaf and animal meal sentences',()=>{
 assert.equal(particle('멧토끼','이','가'),'멧토끼가');assert.equal(particle('직박구리','을','를'),'직박구리를');
 const sentence=(a,b)=>mealSentence(foodRelations.find(r=>r.sourceSpeciesId===a&&r.targetSpeciesId===b));
 assert.equal(sentence('grass','grasshopper'),'방아깨비가 강아지풀 잎을 먹었어요.');
 assert.equal(sentence('raspberry','bulbul'),'직박구리가 산딸기 열매를 먹었어요.');
 assert.equal(sentence('oak','chipmunk'),'다람쥐가 상수리나무의 도토리를 먹었어요.');
 assert.equal(sentence('rabbit','goshawk'),'참매가 멧토끼를 먹었어요.');
});
for(const r of foodRelations)test('all27 actual meal copy '+r.relationId,()=>{assert.match(mealSentence(r),/먹었어요\.$/);assert(!mealSentence(r).includes('에게서'));});
test('search, approach, shortage, severe, weak and actual eating read distinct domain states',()=>{
 const o=createOrganismInstance('grasshopper','ux-test',{x:.4,y:.7});o.hunger=1;o.deprivationSeconds=0;o.foodShortageDuration=0;
 o.behaviorState='searchFood';assert.equal(studentStatus(o,0),'먹이를 찾고 있어요.');o.behaviorState='moveToFood';assert.equal(studentStatus(o,0),'먹이를 향해 가고 있어요.');o.behaviorState='eat';assert.equal(studentStatus(o,0),'먹이를 먹고 있어요.');o.behaviorState='searchFood';o.foodShortageDuration=1;assert.equal(studentStatus(o,0),'먹을 것이 부족해요.');o.deprivationSeconds=populationConfig.weakAfter;assert.equal(studentStatus(o,0),'먹이를 구하지 못해 힘이 없어요.');
});
test('earthworm cover is derived from saved life, never CSS/ecological position',()=>{
 const o=createOrganismInstance('earthworm','ux-worm',{x:.4,y:.7});o.life.initialAge=0;o.life.startedAt=0;
 assert.equal(studentStatus(o,0),'흙과 낙엽 아래에서 활동하고 있어요.');o.position={x:.1,y:.1};assert.equal(studentStatus(o,0),'흙과 낙엽 아래에서 활동하고 있어요.');assert.notEqual(studentStatus(o,survivalConfig.earthwormCycleSeconds-1),'흙과 낙엽 아래에서 활동하고 있어요.');
});
test('flow is read-only and no locked card/discovery becomes acquired automatically',()=>{
 const s=createGameState(),before=structuredClone(s),action=forestAction(s);assert.equal(action.kind,'place');assert.equal(action.id,'grasshopper');assert.deepEqual(s,before);
 for(const a of activities.filter(a=>a.collection))assert.equal(readyActivity(s,a),false);
 assert.equal(s.inventory.filter(c=>c.acquired).length,5);assert.equal(s.metrics.points,0);
});
test('actual pending insight and urgent alert outrank optional learning',()=>{
 const s=createGameState();s.events.push({eventId:'real-signal',kind:'insight',status:'active',createdAt:1,payload:{relationId:'v2_grass_to_grasshopper'},message:'실제 식사'});assert.equal(forestAction(s).id,'real-signal');s.events.push({eventId:'urgent',kind:'alert',status:'active',createdAt:2,payload:{urgent:true},message:'실제 굶주림'});assert.equal(forestAction(s).id,'urgent');assert.equal(s.observations.length,0);
});
test('a true shortage keeps priority above a lower growth notice and optional quiz',()=>{
 const s=createGameState();s.organisms.push(createOrganismInstance('grasshopper','ux-priority',{x:.4,y:.7}),createOrganismInstance('mushroom','ux-mushroom',{x:.3,y:.7}));
 s.events.push({eventId:'growth',kind:'insight',status:'active',createdAt:1,payload:{developmentSequence:1},message:'성장'}, {eventId:'shortage',kind:'alert',status:'active',createdAt:2,payload:{speciesId:'grasshopper'},message:'실제 먹이 부족'});
 assert.equal(forestAction(s).id,'shortage');
});
test('a full forest guides space recovery instead of impossible placement',()=>{
 const s=createGameState();while(s.organisms.length<30)s.organisms.push(createOrganismInstance('grass','ux-full-'+s.organisms.length,{x:.4,y:.7}));
 assert.equal(forestAction(s).kind,'population');assert.equal(s.organisms.length,30);
});
test('completed legacy learning is never offered as required repeat activity',()=>{
 const s=createGameState();const a=activities[0];s.activities.find(p=>p.activityId===a.activityId).completed=true;assert.equal(readyActivity(s,a),false);
 const collection=activities.find(a=>a.collection);s.inventory.find(c=>c.speciesId===collection.unlockSpeciesId).acquired=true;assert.equal(readyActivity(s,collection),false);
});
test('natural end, hunger, larval transition and student release stay distinct',()=>{
 const messages=['natural_lifespan','starvation','life_stage_exit','release'].map(cause=>studentChange({speciesId:'grasshopper',cause}));
 assert.equal(new Set(messages).size,4);assert.match(messages[0],/수명을 다해 자연/);assert.match(messages[1],/먹이를 오래/);assert.match(messages[2],/애벌레 시기/);assert.match(messages[3],/돌려보냈어요/);
});
