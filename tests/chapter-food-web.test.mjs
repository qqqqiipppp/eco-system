import test from 'node:test';
import assert from 'node:assert/strict';
import {webNodes,webRelations,webLevels,checkRole,checkArrow,foodChains,spreadOfChange,webStatus,chapterFactor} from '../js/systems/food-web-builder.js';

test('the web grows chapter by chapter: one chain first, a tangled web at the end',()=>{
 const counts=[1,2,3,4].map(n=>({nodes:webNodes(n).length,relations:webRelations(webNodes(n)).length,chains:foodChains(webNodes(n)).length}));
 for(let i=1;i<4;i++){assert(counts[i].nodes>counts[i-1].nodes);assert(counts[i].relations>counts[i-1].relations);}
 assert(counts[3].chains>=6,JSON.stringify(counts));
 assert.deepEqual(foodChains(webNodes(2)).map(c=>c.join('>')).sort(),['grass>grasshopper>frog','grass>rabbit','hazel>aphid']);
});

test('rows put producers at the bottom and each consumer above its food',()=>{
 const n=webNodes(4),l=webLevels(n);
 assert.equal(l.grass,0);assert.equal(l.grasshopper,1);assert.equal(l.frog,2);assert.equal(l.snake,3);
 for(const r of webRelations(n))assert(l[r.targetSpeciesId]>l[r.sourceSpeciesId],r.relationId);
});

test('roles are checked with the reason, and the earthworm accepts both answers',()=>{
 assert(checkRole('grass','producer').ok);assert(checkRole('mushroom','decomposer').ok);
 const wrong=checkRole('grass','consumer');assert(!wrong.ok);assert.match(wrong.message,/햇빛/);
 assert(checkRole('earthworm','consumer').ok&&checkRole('earthworm','decomposer').ok);
 assert(!checkRole('earthworm','producer').ok);
});

test('arrows go from the eaten to the eater, with feedback for the common mistakes',()=>{
 const ok=checkArrow('grass','grasshopper',['v2_grass_to_grasshopper']);assert(ok.ok&&ok.observed);
 assert(checkArrow('grass','grasshopper',[]).ok&&!checkArrow('grass','grasshopper',[]).observed,'real but not yet observed');
 const reversed=checkArrow('grasshopper','grass');assert(!reversed.ok&&reversed.reversed);assert.match(reversed.message,/거꾸로/);
 assert.match(checkArrow('frog','grass').message,/거꾸로|생산자/);
 assert.match(checkArrow('grass','mushroom').message,/분해자/);
 assert.match(checkArrow('rabbit','frog').message,/먹지 않아요/);
});

test('a bad abiotic factor reaches every creature, plants first then along the web',()=>{
 const n=webNodes(3),f=chapterFactor(2),steps=spreadOfChange(n,'물');
 assert.equal(f.name,'가뭄');assert.equal(steps.size,n.length);
 const order=[...steps.keys()];assert(order.indexOf('grass')<order.indexOf('grasshopper'));assert(order.indexOf('grasshopper')<order.indexOf('frog'));
 assert.match(steps.get('frog'),/방아깨비/);assert.match(steps.get('mushroom'),/낙엽/);
});

test('a chapter web is complete only with every role, every arrow and the system question',()=>{
 const n=webNodes(1),rels=webRelations(n).map(r=>r.relationId);
 assert(!webStatus({},1).complete);
 const roles=Object.fromEntries(n.map(id=>[id,'x']));
 assert(!webStatus({roles,drawn:rels},1).complete);
 assert(webStatus({roles,drawn:rels,system:[1]},1).complete);
 assert.deepEqual(webStatus({roles,drawn:rels,system:[1]},2).missingRoles,['frog','hazel','aphid'],'chapter 2 adds the frog, the hackberry and the beetle');
});

test('the web is stored with stage progress, and old or broken saves still load',async()=>{
 const {createChapterProgressAdapter}=await import('../js/adapters/local-storage.js');
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 store.set('eco-system:chapter-progress',JSON.stringify({cleared:['1-1']}));
 const p=createChapterProgressAdapter(()=>storage);
 assert.deepEqual(p.read(),{cleared:['1-1'],observed:[],drawn:[],roles:{},system:[],webStats:{},reflections:[]});
 p.markObserved('v2_grass_to_grasshopper');p.markObserved('v2_grass_to_grasshopper');p.markDrawn('v2_grass_to_rabbit');p.setRole('grass','producer');p.markSystem(1);p.markCleared('1-2');
 assert.deepEqual(p.read(),{cleared:['1-1','1-2'],observed:['v2_grass_to_grasshopper'],drawn:['v2_grass_to_rabbit'],roles:{grass:'producer'},system:[1],webStats:{},reflections:[]});
 // 나의 기록: rethinks per step, the day the web was finished (kept from the first time), crisis answers.
 p.addMistake(1,'role');p.addMistake(1,'arrow');p.addMistake(1,'arrow');p.markWebDone(1,'2026-10-31T01:00:00.000Z');p.markWebDone(1,'2026-11-02T01:00:00.000Z');
 p.addReflection({stageId:'1-3',kind:'cloudy',question:0,correct:false,at:'2026-10-31T01:00:00.000Z'});
 assert.deepEqual(p.read().webStats,{1:{role:1,arrow:2,system:0,completedAt:'2026-10-31T01:00:00.000Z'}});
 assert.equal(p.read().reflections.length,1);
 store.set('eco-system:chapter-progress',JSON.stringify({webStats:{1:{role:-3,arrow:'x'},x:{role:1}},reflections:[{kind:'cloudy'},null]}));
 assert.deepEqual(p.read().webStats,{1:{role:0,arrow:0,system:0,completedAt:null}},'odd numbers are dropped');assert.deepEqual(p.read().reflections,[]);
 store.set('eco-system:chapter-progress','{broken');assert.deepEqual(p.cleared(),[]);
});
