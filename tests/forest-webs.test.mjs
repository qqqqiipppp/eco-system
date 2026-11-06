// The forest's "나의 먹이그물" follows the river's rule: each chapter its own web
// of the creatures met there; all done, they join into the whole forest's web.
import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../data/chapters.js';
import {organismById} from '../data/organisms.js';
import {webNodes,webRelations,wholeWeb} from '../js/systems/food-web-builder.js';

test('each forest chapter has its own web; together they make the whole forest',()=>{
 const met=c=>new Set([...c.newSpecies,...c.stages.flatMap(s=>[...s.inventory,...s.organisms.map(o=>o[0])])].filter(id=>!organismById[id].invader));
 for(const c of chapters){assert.ok(c.ownWeb,c.chapterId);assert.deepEqual(new Set(webNodes(c.number)),met(c),c.chapterId);assert.ok(webRelations(webNodes(c.number)).length>=2,c.chapterId);}
 const home=wholeWeb();
 assert.deepEqual(new Set(Object.keys(home)),new Set(chapters.flatMap(c=>[...met(c)])));
 assert.equal(home.grass,1);assert.equal(home.frog,2);assert.equal(home.goshawk,4);
 assert.ok(webRelations(Object.keys(home)).some(r=>home[r.sourceSpeciesId]!==home[r.targetSpeciesId]),'arrows cross from one chapter to another');
});
