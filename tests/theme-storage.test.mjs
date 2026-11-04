import test from 'node:test';
import assert from 'node:assert/strict';
import {createChapterProgressAdapter,createChapterStageAdapter,createThemeAdapter,themeKey,CHAPTER_KEY,STAGE_KEY} from '../js/adapters/local-storage.js';
import {themes,themeById} from '../data/themes.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};

// 생태계 연구소: each theme (숲, 강) keeps its own cleared stages and stage save.
// The forest keeps the keys students already have, so nothing is lost.
test('each theme keeps its own progress; the forest keeps the existing keys',()=>{
 const s=memory(),get=()=>s;
 assert.equal(themeKey(CHAPTER_KEY,'forest'),CHAPTER_KEY);assert.equal(themeKey(STAGE_KEY,'forest'),STAGE_KEY);
 assert.equal(themeKey(CHAPTER_KEY,'river'),'eco-system:river:chapter-progress');
 s.setItem(CHAPTER_KEY,JSON.stringify({cleared:['1-1','1-2']}));
 const forest=createChapterProgressAdapter(get,'forest'),river=createChapterProgressAdapter(get,'river');
 assert.deepEqual(forest.cleared(),['1-1','1-2'],'a student’s forest progress is still there');
 assert.deepEqual(river.cleared(),[]);
 river.markCleared('1-1');
 assert.deepEqual(river.cleared(),['1-1']);assert.deepEqual(forest.cleared(),['1-1','1-2']);
 const stage=createChapterStageAdapter(get,'river');stage.write({chapter:{stageId:'1-1'},organisms:[],simulationTime:3},{},5);
 assert.ok(s.m.has('eco-system:river:chapter-stage'));assert.equal(createChapterStageAdapter(get,'forest').read(),null);
});

test('the chosen theme is remembered; anything else reads as not chosen',()=>{
 const s=memory(),theme=createThemeAdapter(()=>s);
 assert.equal(theme.read(),null);
 theme.set('river');assert.equal(theme.read(),'river');
 s.setItem('eco-system:theme','desert');assert.equal(theme.read(),null);
 assert.deepEqual(themes.map(t=>t.id),['forest','river']);assert.ok(themeById.forest.ready);
});
