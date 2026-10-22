import test from 'node:test';
import assert from 'node:assert/strict';
import {organisms} from '../data/organisms.js';
import {foodRelations} from '../data/food-relations.js';
import {createGameState} from '../js/state/game-state.js';
import {speciesStatus,relationStatus,visibleRelations,speciesRelations,guideSpecies,foodPartName,decompositionParts} from '../js/ui/collection-model.js';
import {focusLayout,followChain} from '../js/ui/food-web-layout.js';
const s=createGameState();
test('24 stable species5/16/3,27 unique source-to-consumer edges and unchanged17/2/1/2',()=>{
 assert.equal(organisms.length,24);assert.deepEqual(['producer','consumer','decomposer'].map(role=>guideSpecies(s,role).length),[5,16,3]);assert.equal(foodRelations.length,27);assert.equal(new Set(foodRelations.map(r=>r.relationId)).size,27);assert.equal(foodRelations.filter(r=>r.evidenceLevel==='A').length,5);assert.equal(s.schemaVersion,17);assert.equal(s.ecologyRevision,2);assert.equal(s.pacingRevision,1);assert.equal(s.goalRevision,2);
});
for(const o of organisms)test('guide '+o.id+': exact incoming/outgoing, independent card/current/prior/live states, read only',()=>{
 const before=structuredClone(s),r=speciesRelations(o.id),status=speciesStatus(s,o.id);
 assert.deepEqual(r.foods.map(r=>r.relationId),foodRelations.filter(r=>r.targetSpeciesId===o.id).map(r=>r.relationId));assert.deepEqual(r.predators.map(r=>r.relationId),foodRelations.filter(r=>r.sourceSpeciesId===o.id).map(r=>r.relationId));assert.equal(status.living,s.organisms.filter(n=>n.speciesId===o.id).length);assert.equal(status.current,false);assert.equal(status.observed,false);assert.deepEqual(s,before);
});
for(const r of foodRelations)test('arrow '+r.relationId+': follows data direction, ends before consumer name and no node overlap',()=>{
 const layout=focusLayout(foodRelations,r.targetSpeciesId),edge=layout.edges.find(e=>e.id===r.relationId),source=layout.nodes.find(n=>n.id===r.sourceSpeciesId),target=layout.nodes.find(n=>n.id===r.targetSpeciesId);
 assert.equal(edge.source,r.sourceSpeciesId);assert.equal(edge.target,r.targetSpeciesId);assert(source.x<target.x);assert(edge.path.startsWith('M '));assert.equal(new Set(layout.edges.map(e=>e.id)).size,layout.edges.length);assert.deepEqual(focusLayout(foodRelations,r.targetSpeciesId),layout);
 const incoming=layout.edges.filter(e=>e.target===r.targetSpeciesId).map(e=>e.path.split(', ').at(-1));assert.equal(new Set(incoming).size,incoming.length,'incoming arrowheads have separate attachment points');
 for(const a of layout.nodes){assert(a.x-a.width/2>=0&&a.x+a.width/2<=layout.width);assert(a.y-a.height/2>=0&&a.y+a.height/2<=layout.height);for(const b of layout.nodes)if(a!==b)assert(Math.abs(a.x-b.x)>=a.width||Math.abs(a.y-b.y)>=a.height);}
});
test('chipmunk has exactly oak acorn,pine seeds and weasel/goshawk; habitat does not invent hazel food',()=>{
 const {foods,predators}=speciesRelations('chipmunk');assert.deepEqual(foods.map(r=>[r.sourceSpeciesId,foodPartName(r)]),[['oak','도토리'],['pine','씨앗']]);assert.deepEqual(predators.map(r=>r.targetSpeciesId),['weasel','goshawk']);assert.equal(focusLayout(foodRelations,'chipmunk').edges.length,4);
});
test('grass chain grows only through true directed edges; unrelated or reversed steps rejected',()=>{
 let path=['grass'];path=followChain(path,'grass','grasshopper',foodRelations);path=followChain(path,'grasshopper','frog',foodRelations);assert.deepEqual(path,['grass','grasshopper','frog']);assert.deepEqual(followChain(path,'frog','grasshopper',foodRelations),path);assert.deepEqual(followChain(['chipmunk'],'oak','chipmunk',foodRelations),['oak','chipmunk']);
});
test('every27 edge is reachable in species focus, no fabricated web edges for3 decomposers or litter',()=>{
 const ids=new Set(organisms.flatMap(o=>focusLayout(foodRelations,o.id).edges.map(e=>e.id)));assert.equal(ids.size,27);assert(!organisms.some(o=>['litter','wood','remains'].includes(o.id)));
 for(const id of ['mushroom','litter-mold','soil-bacteria'])assert.equal(focusLayout(foodRelations,id).edges.length,0);
 assert.deepEqual(decompositionParts('mushroom'),['wood']);assert.deepEqual(decompositionParts('litter-mold'),['litter']);assert.deepEqual(decompositionParts('soil-bacteria'),['remains']);assert.equal(organisms.find(o=>o.id==='earthworm').role,'consumer');assert.equal(speciesRelations('earthworm').foods.length,0);assert.equal(speciesRelations('earthworm').predators.length,3);
});
test('current/prior/unseen and live/card availability remain orthogonal after predation or natural loss',()=>{
 const state=createGameState(),r=foodRelations[0];state.profile.relations=[{relationId:r.relationId,round:1}];state.round.number=2;
 assert.equal(relationStatus(state,r).kind,'previous');assert.equal(relationStatus(state,r).live,false);assert.equal(relationStatus(state,r).available,true);
 state.observations.push({relationId:r.relationId,discoveredAt:0});assert.equal(relationStatus(state,r).kind,'current');assert.equal(visibleRelations(state,'current').length,1);assert.equal(visibleRelations(state,'found').length,1);assert.equal(visibleRelations(state,'live').length,0);
 state.organisms=[];assert.equal(relationStatus(state,r).kind,'current');assert.equal(speciesStatus(state,'grass').current,true);assert.equal(speciesStatus(state,'grass').living,0);
 const blank=createGameState();assert.equal(visibleRelations(blank,'found').length,0);assert.equal(visibleRelations(blank,'all').length,27);
});
test('current inspection is computed from current round, not first cumulative observation round',()=>{
 const state=createGameState();state.profile.speciesObservations.grass={round:1,source:'inspection'};state.round.number=3;
 assert.equal(speciesStatus(state,'grass').current,false);state.round.inspected.push('grass');assert.equal(speciesStatus(state,'grass').current,true);assert.equal(speciesStatus(state,'grass').observed,true);
});
test('name search and role filters do not unlock, acknowledge or change saved goal evidence/economy',()=>{
 const state=createGameState(),before=structuredClone(state);assert.deepEqual(guideSpecies(state,'all',' 다람쥐 ').map(o=>o.id),['chipmunk']);assert.equal(guideSpecies(state,'locked').length,19);assert.equal(guideSpecies(state,'unobserved').length,5);assert.equal(guideSpecies(state,'all','존재하지 않는 생물').length,0);
 for(const o of organisms){speciesStatus(state,o.id);speciesRelations(o.id);focusLayout(visibleRelations(state,'all'),o.id);}assert.deepEqual(state,before);
});
