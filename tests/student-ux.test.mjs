import test from 'node:test';
import assert from 'node:assert/strict';
import {organisms} from '../data/organisms.js';
import {foodRelations} from '../data/food-relations.js';
import {activities} from '../data/activities.js';
import {particle,mealName} from '../data/student-text.js';
import {createGameState} from '../js/state/game-state.js';
import {forestMissions,studentNextAction,discoveryCopy,studentDescription,activityAction,studentPlacementMessage,studentSentence} from '../js/ui/student-guidance.js';
const forbidden=/단순화|미획득|미관찰|실제 숲 관찰 기록 없음|누적 원장|목표 증거|보상 상태 유지|활동 동기화|데이터 복원 상태 정상|생물를|다음 카드 활동|배움/;
for(const species of organisms)test('student name, four particles and description: '+species.id,()=>{
 const lastHangul=species.name.match(/[가-힣](?=[^가-힣]*$)/)[0],consonant=(lastHangul.charCodeAt(0)-0xac00)%28!==0;
 for(const [a,b]of [['은','는'],['이','가'],['을','를'],['과','와']])assert.equal(particle(species.name,a,b),species.name+(consonant?a:b));
 assert(!forbidden.test(studentDescription(species)));assert(studentDescription(species).length>10);
 assert.equal(studentSentence(species.name+'가 살아요.'),particle(species.name,'이','가')+' 살아요.');
});
for(const relation of foodRelations)test('actual discovery language, part and direction: '+relation.relationId,()=>{
 const before=structuredClone(relation),copy=discoveryCopy(relation);
 const source=organisms.find(o=>o.id===relation.sourceSpeciesId),target=organisms.find(o=>o.id===relation.targetSpeciesId);
 assert(copy.title.startsWith(particle(target.name,'이','가')+' '));assert(copy.title.includes(particle(mealName(relation),'을','를')+' 먹었어요!'));
 assert(copy.message.includes(particle(source.name,'을','를')));assert(copy.message.includes('소비자'));
 assert(!forbidden.test(Object.values(copy).join(' ')));if(relation.evidenceLevel==='B')assert(copy.detail.includes('지역과 상황에 따라 달라요'));
 assert.deepEqual(relation,before);
});
for(const activity of activities)test('specific activity CTA respects actual card permission: '+activity.activityId,()=>{
 const s=createGameState(),before=structuredClone(s),id=activity.unlockSpeciesId,label=activityAction(s,activity);
 if(id&&!s.inventory.find(c=>c.speciesId===id).acquired)assert(label.includes(organisms.find(o=>o.id===id).name));else assert.equal(label,'미션 시작하기');
 assert.deepEqual(s,before);if(id){s.inventory.find(c=>c.speciesId===id).acquired=true;assert(!activityAction(s,activity).includes('카드 얻기'));}
});
test('three mission names read real current goals, not card count or profile history',()=>{
 const s=createGameState(),before=structuredClone(s);assert.deepEqual(forestMissions(s).map(g=>[g.id,g.title,g.ok]),[['food','먹이사슬 발견하기',false],['roles','생물의 역할 알아보기',false],['inquiry','숲의 변화 살펴보기',false]]);
 for(const c of s.inventory)c.acquired=true;s.profile.relations=foodRelations.map(r=>({relationId:r.relationId,round:0}));assert(forestMissions(s).every(g=>!g.ok));
 s.goalRevision=1;assert.deepEqual(forestMissions(s),[]);assert.equal(before.schemaVersion,17);
});
test('onboarding advances from real placement to watching and honors blocked introductions',()=>{
 const s=createGameState(),before=structuredClone(s);assert.equal(studentNextAction(s).id,'grasshopper');assert.deepEqual(s,before);
 s.population.introductions.grasshopper={nextAt:100};assert.equal(studentNextAction(s).kind,'watch');assert.match(studentNextAction(s).text,/기다려/);
});
test('replay keeps the existing chosen-topic meaning instead of promising a new food-chain rule',()=>{
 const s=createGameState();s.round.number=2;s.round.topic='soil';s.inventory.forEach(c=>c.acquired=true);const before=structuredClone(s),goal=forestMissions(s)[0];assert.equal(goal.id,'food');assert.equal(goal.title,'이번 숲의 주제 살펴보기');assert.match(goal.note,/낙엽/);assert.deepEqual(s,before);
});
test('failure messages distinguish space, food, cooldown and capacity without mutating results',()=>{
 const cases=[['space',/자리/],['food',/먹이/],['cooldown',/기다려/],['limit',/30개체/]];
 for(const [reason,pattern]of cases){const result={ok:false,reason,message:'잠시 기다려요.'},before=structuredClone(result);assert.match(studentPlacementMessage(result),pattern);assert.deepEqual(result,before);}
});
