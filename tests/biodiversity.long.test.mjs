import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {biodiversityScenarios,biodiversitySeeds,wormScenarios,runBiodiversity,withSurvivalCandidate} from './biodiversity-fixtures.mjs';
import {capture} from './balance-fixtures.mjs';
import {nextForest,replayStudent,runEconomy,adaptiveExplorer,freshStudent} from './replay-fixtures.mjs';
import {study} from './pacing-fixtures.mjs';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {world,layout} from './ecology-fixtures.mjs';
import {createFeedingSystem} from '../js/systems/feeding.js';
const baseline=JSON.parse(readFileSync(new URL('./biodiversity.baseline-results.json',import.meta.url)));
const prior={hungerScale:2,satietyScale:.5,demandAwareRecentMeal:false,earthwormRefuge:false};
const results={stage:'15.8',controls:[],runs:[],worms:[],splits:[],play:{},rounds:[]},runs={};

for(const seed of biodiversitySeeds)test('15.8 A control seed'+seed+': original survival still reproduces the frozen15.7 moving forest',()=>{
 const r=withSurvivalCandidate(prior,()=>runBiodiversity({seed})),b=baseline.runs.find(r=>r.kind==='unmanaged24'&&r.seed===seed);
 assert.deepEqual(r.data.samples,b.samples);assert.deepEqual(r.data.causeCounts,b.causeCounts);assert.deepEqual(r.data.wormIndividuals,b.wormIndividuals);results.controls.push({seed,exactSamples:true,exactCauses:true,wormLoss:r.data.wormIndividuals[0].removedAt});
});
for(const kind of biodiversityScenarios)for(const seed of biodiversitySeeds)test('15.8 D moving20 '+kind+' seed'+seed+': actual diversity,meals,removal causes,max30 and real function',()=>{
 const r=runBiodiversity({kind,seed}),d=r.data,b=baseline.runs.find(r=>r.kind===kind&&r.seed===seed);runs[kind+':'+seed]=r;results.runs.push(d);
 assert.deepEqual(d.samples.map(s=>s.at),[0,300,600,900,1200]);assert(d.peak<=30);assert(d.final.processed>0);assert(d.final.wormProcessed<=d.final.processed+1e-8);assert(d.individuals.filter(o=>o.removedAt!==null).every(o=>o.removalCause&&o.lifetime>=0));
 if(kind==='unmanaged24'){assert(d.final.species>b.final.species);assert(d.final.wormProcessed>b.final.wormProcessed*10);assert(d.final.meals>=30);assert(d.final.actualRelations>=15);assert(d.causeCounts.starvation<b.causeCounts.starvation);}
 if(kind==='managed24'){assert(d.final.species>=15);assert(d.final.meals>=150);assert(d.final.actualRelations>=17);assert.equal(d.causeCounts.starvation||0,0);assert(d.actions.some(a=>a.type==='release'));assert(d.actions.some(a=>a.type==='introduction-attempt'&&a.ok));}
 if(kind==='food-poor')assert(d.causeCounts.starvation>=4);
 if(kind==='predator-heavy'){assert(d.causeCounts.starvation>=9);assert(d.final.predations>0);assert(d.final.total<d.samples[0].total);}
 if(kind==='fresh-student'){assert(d.final.cleared);assert.equal(d.final.actualRelations,3);assert.equal(d.causeCounts.starvation||0,0);assert(d.final.meals>=90);}
});
for(const kind of wormScenarios)for(const seed of biodiversitySeeds)test('15.8 worm20 '+kind+' seed'+seed+': survival,litter,soil and genuine predation independently recorded',()=>{
 const {data:d}=runBiodiversity({kind,seed});results.worms.push(d);assert(d.wormIndividuals.length>=1);assert(d.final.wormProcessed>0);assert(d.final.soilContribution>0);assert(d.final.soilContribution<=.12);assert(d.wormIndividuals.every(o=>o.litterConsumed>=0));assert(d.final.wormProcessed<=d.final.processed+1e-8);
 if(kind==='worm-only'||kind==='worm-rich-litter')assert(d.wormIndividuals.every(w=>w.alive));
});
test('15.8 management maintains more species in all three paired seeds; refuge never promises universal survival',()=>{
 for(const seed of biodiversitySeeds){const a=runs['unmanaged24:'+seed].data,b=runs['managed24:'+seed].data;assert(b.final.species>a.final.species);assert(b.samples[3].species>a.samples[3].species);}
 assert(results.worms.some(r=>r.final.predations>0));assert(results.worms.some(r=>r.wormIndividuals.some(w=>w.alive)));assert(results.worms.some(r=>r.wormIndividuals.every(w=>!w.alive)));
});
for(const kind of ['unmanaged24','managed24','fresh-student'])test('15.8 '+kind+' moving10-save10: exact rights at load and restarted transient movement',()=>{
 const d=runBiodiversity({kind,splitAt:600}).data;assert.equal(d.end,1200);assert.equal(d.saveChecks.length,1);assert(d.saveChecks[0].transientWanderRestarted);assert(d.peak<=30);assert.equal(d.rewardHistory.length,new Set(d.rewardHistory.map(r=>r.rewardId)).size);results.splits.push(d);
});
test('15.8 genuine saved16 from before implementation keeps life,satiety,cards,receipts and accumulated relations',()=>{
 const snap=JSON.parse(readFileSync(new URL('./biodiversity.saved16-before.json',import.meta.url))),r=decodeSave(JSON.stringify(snap));assert.equal(r.status,'loaded');const next=createSaveSnapshot(r.state,r.eventMemory,snap.savedAt);
 for(const key of ['inventory','rewardHistory','pointEconomy','profile','forestProgress'])assert.deepEqual(next.domain[key],snap.domain[key]);
 assert.deepEqual(next.domain.organisms.map(o=>[o.life,o.hunger,o.satietyUntil,o.deprivationSeconds]),snap.domain.organisms.map(o=>[o.life,o.hunger,o.satietyUntil,o.deprivationSeconds]));results.old16={count:r.state.organisms.length,points:r.state.metrics.points,exactLifeAndSatiety:true,exactPermanentRights:true};
});
let collector;
for(const kind of ['instant','normal','collector'])test('15.8 actual '+kind+' full20 progression compared with identical15.7 actions',()=>{
 const a=withSurvivalCandidate(prior,()=>capture(kind)),b=capture(kind);results.play[kind]={before:a.metrics,after:b.metrics};assert(b.result.state.forestProgress.cleared);assert(b.result.state.metrics.points>=0);assert(b.metrics.peak<=30);assert(b.result.state.pointEconomy.studyCount<=5);assert(b.result.state.pointEconomy.totals.study<=20);assert(b.result.state.pointEconomy.totals.support<=28);if(kind==='collector'){assert(b.metrics.acquired>=22);results.play[kind].stillLocked=b.result.state.inventory.filter(c=>!c.acquired).map(c=>c.speciesId);}
});
test('15.8 existing oak relation and all24 unlocks remain achievable with one legal placement response',()=>{const s=freshStudent(),model=adaptiveExplorer(),r=runEconomy(s,20,{student:true,checkpointEvery:0,onTick:model.onTick});assert.equal(s.inventory.filter(c=>c.acquired).length,24);assert(s.observations.some(o=>o.relationId==='v2_oak_to_chipmunk'));assert.equal(model.actions.length,1);collector=s;results.adaptiveCollector={actions:model.actions,acquired:24,points:s.metrics.points,clearAt:s.forestProgress.clearedAt,observations:s.observations,meals:r.report.meals};});
function generation(id){
 const s=world(id==='grass'?[['grass',1,.2]]:[[id,1,.2],[id,1,.6],['grass',1,.2],['grass',1,.6]]),f=createFeedingSystem(0,{environmentEventsEnabled:false}),parents=s.organisms.filter(o=>o.speciesId===id).map(o=>({id:o.instanceId,naturalEnd:o.life.duration-o.life.initialAge}));
 const nextGenerationMeals=[];for(let i=0;i<12000;i++){const r=f.update(s,.1,layout);for(const m of r.feedingEvents)if(m.consumerSpeciesId===id&&m.consumerInstanceId.startsWith('organism-'))nextGenerationMeals.push({at:s.simulationTime,...m});}
 return {id,parents,final:s.organisms.filter(o=>o.speciesId===id).length,births:s.population.history.filter(c=>c.speciesId===id&&['reproduction','replenishment'].includes(c.cause)),losses:s.population.history.filter(c=>c.speciesId===id&&c.countAfter<c.countBefore),breeding:s.population.breeding[id],replenishment:s.population.replenishment[id],nextGenerationMeals,maximum30:s.organisms.length<=30};
}
for(const id of ['grass','grasshopper','rabbit'])test('15.8 '+id+' full20 generation: real resources and existing conditional birth before natural parent endpoint',()=>{const a=withSurvivalCandidate(prior,()=>generation(id)),b=generation(id);assert(b.births.some(c=>c.cause==='reproduction'));assert(b.births[0].simulationTime<Math.min(...b.parents.map(p=>p.naturalEnd)));assert(b.maximum30);if(id!=='grass')assert(b.nextGenerationMeals.length>0);results.generations||={};results.generations[id]={before:a,after:b};});
test('15.8 repeated forest resets biology and keeps24 cards,once rewards,limited28 care and original goals',()=>{
 for(const topic of ['food:v2_earthworm_to_ladybird','food:v2_caterpillar_to_bulbul']){const s=nextForest(collector,topic);assert.equal(s.organisms.length,3);assert.equal(s.simulationTime,0);assert.equal(s.round.care.limit,28);const r=runEconomy(s,20,{onTick:replayStudent,mode:'normal',study});assert(s.forestProgress.cleared);assert.equal(s.inventory.filter(c=>c.acquired).length,24);assert.equal(s.rewardHistory.length,new Set(s.rewardHistory.map(r=>r.rewardId)).size);results.rounds.push({round:s.round.number,topic,clearAt:s.forestProgress.clearedAt,points:s.metrics.points,legacyEarned:r.report.legacyEarned,newEarned:r.report.newEarned,observations:s.observations.map(o=>o.relationId)});collector=s;}
});
process.on('exit',code=>{if(process.env.WRITE_BIODIVERSITY)writeFileSync(new URL('./biodiversity.long-results.json',import.meta.url),JSON.stringify({...results,exitCode:code},null,2)+'\n');});
