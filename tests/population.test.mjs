import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {survivalStage,updateSurvival,supportSurvival,updateReproduction} from '../js/systems/population.js';
import {populationConfig} from '../data/population-config.js';
import {placeOrganism} from '../js/systems/placement.js';
import {removeOrganism} from '../js/systems/lifecycle.js';
import {updateDecomposition,decompositionMultiplier} from '../js/systems/decomposition.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {createEventSystem} from '../js/systems/events.js';
import {populationMessage} from '../js/systems/population.js';
import {evaluateStability} from '../js/systems/stability.js';
import {organisms} from '../data/organisms.js';
import {starvationLimits} from '../data/population-config.js';
const make=(id,name=id,x=.4)=>createOrganismInstance(id,name,{x,y:.72});
const layout={footprints:Object.fromEntries(organisms.map(o=>[o.id,{halfWidth:.01,above:.1,below:.02}])),blockedRects:[]};
function world(...o){const s=createGameState();s.organisms=o;return s;}
function run(s,seconds){const f=createFeedingSystem(s.simulationTime);for(let i=0;i<seconds*10;i++)f.update(s,.1,layout);return f;}
test('A/B/C/D: grace, hunger, severe and weakness precede actual starvation loss',()=>{
 const frog=make('frog');frog.hunger=1;const s=world(frog);run(s,119);assert.equal(frog.deprivationSeconds,0);assert.equal(s.organisms.length,1);
 run(s,65);assert.equal(survivalStage(frog),'severe');run(s,125);assert.equal(survivalStage(frog),'weak');run(s,240);assert.equal(s.organisms.length,0);
 assert.equal(s.population.history.at(-1).cause,'starvation');assert.equal(s.population.history.at(-1).countBefore,1);assert(s.decomposition.organicMatter.remains>.98&&s.decomposition.organicMatter.remains<=1);
});
test('E/F: successful food restores weakness; support buys time without fabricating a meal',()=>{
 const gh=make('grasshopper'),grass=make('grass','grass',.4);gh.hunger=1;gh.deprivationSeconds=220;const s=world(gh,grass);s.simulationTime=200;run(s,4);assert.equal(gh.deprivationSeconds,0);assert.equal(survivalStage(gh),'normal');
 gh.deprivationSeconds=200;supportSurvival(gh);assert.equal(gh.deprivationSeconds,140);const meal=gh.lastSuccessfulFeedingAt;assert(meal!==null);assert.equal(gh.lastSuccessfulFeedingAt,meal);
});
test('K/L: predation is distinct, clears targets and never double counts dead organic matter',()=>{
 const prey=make('grasshopper'),frog=make('frog');prey.hunger=0;frog.hunger=1;const s=world(prey,frog);run(s,4);assert.equal(s.organisms.length,1);assert.equal(s.population.history[0].cause,'predation');assert.equal(s.decomposition.organicMatter.remains,0);assert.equal(frog.targetInstanceId,null);
});
test('G/H/T: reproduction requires resources, recent meals, two animals, good environment and safe capacity',()=>{
 const a=make('grasshopper','a',.4),b=make('grasshopper','b',.42),grass=make('grass','plant',.2),s=world(a,b,grass);s.simulationTime=300;
 a.hunger=b.hunger=.1;a.lastSuccessfulFeedingAt=b.lastSuccessfulFeedingAt=300;
 s.population.breeding.grasshopper={healthySeconds:239.5,nextAt:300};assert.equal(updateReproduction(s,.5,layout).length,0);assert(s.population.breeding.grasshopper.pending);assert.equal(updateReproduction(s,60,layout).length,1);assert.equal(s.organisms.filter(o=>o.speciesId==='grasshopper').length,3);assert.equal(s.population.history.at(-1).cause,'reproduction');
 assert.equal(updateReproduction(s,240,layout).filter(o=>o.speciesId==='grasshopper').length,0);
 const single=world(a,grass);single.simulationTime=300;single.population.breeding.grasshopper={healthySeconds:240,nextAt:0};assert.equal(updateReproduction(single,.5,layout).filter(o=>o.speciesId==='grasshopper').length,0);
 const bad=world(a,b,grass);bad.simulationTime=300;for(const e of Object.values(bad.environment))e.value=.15;assert.equal(updateReproduction(bad,300,layout).length,0);
 const full=world(...Array.from({length:30},(_,i)=>make('grass','p'+i,.2)));full.simulationTime=300;full.population.breeding.grass={healthySeconds:180,nextAt:0};assert.equal(updateReproduction(full,1,layout).length,0);assert.equal(full.organisms.length,30);
});
test('M/N: bootstrap is accessible, repeated introductions wait, zero species keeps card and can recover without points',()=>{
 const s=world(make('grass'));s.inventory.find(c=>c.speciesId==='frog').acquired=true;
 const input={position:{x:.4,y:.72},isPlayArea:true,isUI:false};
 for(let i=0;i<3;i++)assert(placeOrganism(s,'grasshopper',input,layout).ok);
 assert.equal(placeOrganism(s,'grasshopper',input,layout).reason,'cooldown');
 for(const o of [...s.organisms].filter(o=>o.speciesId==='grasshopper'))removeOrganism(s,o.instanceId,'starvation');
 assert(s.inventory.find(c=>c.speciesId==='grasshopper').acquired);assert.equal(placeOrganism(s,'grasshopper',input,layout).reason,'cooldown');
 s.simulationTime+=60;for(const e of Object.values(s.environment))e.value=.15;assert.equal(s.metrics.points,0);assert(placeOrganism(s,'grasshopper',input,layout).ok);
 s.organisms=s.organisms.filter(o=>o.speciesId!=='grasshopper');s.population.introductions.grasshopper.nextAt=0;s.organisms=[];assert.equal(placeOrganism(s,'grasshopper',input,layout).reason,'food');
 assert(placeOrganism(s,'grass',input,layout).ok);assert(placeOrganism(s,'grasshopper',input,layout).ok);
});
test('O/P: separate organic pools, baseline decay, type-specific decomposers, bounded soil nutrient growth help',()=>{
 const s=world(make('mushroom'),make('litter-mold'),make('soil-bacteria')),base=world();
 for(const t of [s,base])t.decomposition.organicMatter={wood:10,litter:10,remains:10};
 updateDecomposition(s,60);updateDecomposition(base,60);
 assert(s.decomposition.processed>base.decomposition.processed);assert(base.decomposition.processed>0);assert(s.decomposition.soilNutrients>0);assert(decompositionMultiplier(s)>1);
 updateDecomposition(s,1e7);assert(s.decomposition.soilNutrients<=1);assert(decompositionMultiplier(s)<=1.12);assert(Object.values(s.decomposition.organicMatter).every(v=>v>=0&&v<=30));
 const low=world(make('grass')),high=world(make('grass'));for(const w of [low,high]){w.organisms[0].growth=.5;w.organisms[0].foodStock=0;}high.decomposition.soilNutrients=1;run(low,10);run(high,10);assert(high.organisms[0].growth>low.organisms[0].growth);assert(high.organisms[0].foodStock>low.organisms[0].foodStock);
});
test('R/S: v8 survival, clocks, organic resources and bounded history persist; v7 migrates progress without offline losses',()=>{
 const s=world(make('grasshopper'));s.simulationTime=600;s.organisms[0].deprivationSeconds=220;s.metrics.points=23;s.metrics.bestStability=85;s.inventory[3].acquired=true;s.forestProgress={cleared:true,clearedAt:100,stableSeconds:30};
 s.observations=[{relationId:'v2_grass_to_grasshopper',eventId:'event-1',discoveredAt:100}];s.rewardHistory=[{rewardId:'observation:v2_grass_to_grasshopper',sourceId:'event-1',grantedAt:100,amount:12}];Object.assign(s.activities[0],{completed:true,attempts:1,completedAt:100,lastAnswer:'grass'});
 s.managementHistory=[{actionId:'food-support',sourceId:'grasshopper',sourceEventId:'event-2',executedAt:100,cost:5,result:'applied'}];s.managementActionCount=1;
 s.population.breeding.grasshopper={healthySeconds:200,nextAt:900};s.population.introductions.grasshopper={count:4,nextAt:640};s.decomposition.organicMatter.remains=8;
 const raw=createSaveSnapshot(s,{sequence:1,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-12T00:00:00Z');raw.schemaVersion=raw.domain.schemaVersion=8;raw.domain.observations.forEach(o=>o.relationId=o.relationId.replace(/^v2_/,''));raw.domain.rewardHistory.forEach(r=>r.rewardId=r.rewardId.replace('observation:v2_','observation:'));for(const o of raw.domain.organisms)delete o.life;delete raw.domain.population.replenishment;let loaded=decodeSave(JSON.stringify(raw));assert.equal(loaded.state.schemaVersion,11);assert.equal(loaded.state.organisms[0].deprivationSeconds,220);assert.equal(loaded.state.population.breeding.grasshopper.nextAt,900);assert.equal(loaded.state.decomposition.organicMatter.remains,8);
 run(loaded.state,20);assert.equal(loaded.state.organisms[0].deprivationSeconds,220); // restore response window; no catch-up
 raw.schemaVersion=raw.domain.schemaVersion=7;delete raw.domain.population;delete raw.domain.decomposition;loaded=decodeSave(JSON.stringify(raw));assert.equal(loaded.status,'loaded');assert.equal(loaded.state.schemaVersion,11);assert.equal(loaded.state.organisms[0].deprivationSeconds,0);assert.equal(loaded.state.metrics.points,23);assert.equal(loaded.state.metrics.bestStability,85);assert(loaded.state.forestProgress.cleared);assert(loaded.state.inventory[3].acquired);assert(loaded.state.activities[0].completed);assert.equal(loaded.state.observations.length,0);assert.equal(loaded.state.legacyEcology.observations[0].relationId,'grass_to_grasshopper');assert.equal(loaded.state.rewardHistory[0].rewardId,s.rewardHistory[0].rewardId.replace('observation:v2_','observation:'));assert.equal(loaded.state.managementActionCount,1);assert.equal(loaded.state.managementHistory[0].actionId,'food-support');
 raw.schemaVersion=raw.domain.schemaVersion=99;assert(decodeSave(JSON.stringify(raw)).blocked);
});
test('X/Y/K: actual causes create bounded, explicit student notices with correct counts and no extra reward',()=>{
 const s=world(make('frog'));s.simulationTime=600;removeOrganism(s,'frog','starvation');const events=createEventSystem(600);events.refresh(s);const notice=s.events.find(e=>e.payload.populationSequence);assert.match(notice.message,/먹이.*자연으로 돌아갔어요.*1마리 → 0마리/);assert(!notice.message.includes('사라졌어요'));assert(events.acknowledge(s,notice.eventId).ok);assert.equal(s.metrics.points,0);assert(s.population.history[0].noted);events.refresh(s);assert.equal(s.events.filter(e=>e.status==='active').length,0);
 const prey=make('grasshopper'),predator=make('frog');prey.hunger=0;predator.hunger=1;const p=world(prey,predator);run(p,4);assert.match(populationMessage(p.population.history[0]),/참개구리.*먹이.*자연으로 돌아갔어요.*1마리 → 0마리/);
});
test('Q/I/U: 20 active minutes of feeding-driven balanced and crowded worlds stay bounded; shortages affect stability',()=>{
 function experiment(plants,animals,withFrog=false){const s=world(...Array.from({length:plants},(_,i)=>make('grass','p'+i,.2+i*.04)),...Array.from({length:animals},(_,i)=>make('grasshopper','a'+i,.4+i*.015)));if(withFrog)s.organisms.push(make('frog'));let peak=s.organisms.length,weak=false;const f=createFeedingSystem();for(let i=0;i<12000;i++){f.update(s,.1,layout);peak=Math.max(peak,s.organisms.length);weak||=s.organisms.some(o=>survivalStage(o)==='weak');}return {s,peak,weak,stats:f.getDiagnostics()};}
 const balanced=experiment(4,2),crowded=experiment(1,8),core=experiment(4,3,true);
 console.log('20 minute population worlds:',JSON.stringify([balanced,crowded,core].map(v=>({counts:Object.fromEntries(organisms.map(o=>[o.id,v.s.organisms.filter(i=>i.speciesId===o.id).length]).filter(([,n])=>n)),totals:v.s.population.totals,peak:v.peak,weak:v.weak,stats:v.stats}))));
 assert(balanced.s.population.totals.reproduction>0);assert(balanced.s.organisms.some(o=>o.speciesId==='grasshopper'));assert(crowded.weak);assert(crowded.s.population.totals.starvation>0);assert(balanced.peak<=30&&crowded.peak<=30&&core.peak<=30);assert(balanced.s.population.history.length<=80);for(const id of ['grass','grasshopper','frog'])assert(core.s.organisms.some(o=>o.speciesId===id));
 const poor=world(make('grasshopper'));poor.organisms[0].hunger=1;assert(evaluateStability(balanced.s).score>evaluateStability(poor).score);
});
test('H/L: absent meals or blocked/dense space prohibit birth; all 15 consumers can starve and clean references',()=>{
 const a=make('grasshopper','a'),b=make('grasshopper','b'),grass=make('grass');const s=world(a,b,grass);s.simulationTime=300;s.population.breeding.grasshopper={healthySeconds:240,nextAt:0};assert.equal(updateReproduction(s,.5,layout).filter(o=>o.speciesId==='grasshopper').length,0);
 a.lastSuccessfulFeedingAt=b.lastSuccessfulFeedingAt=300;a.hunger=b.hunger=.1;s.population.breeding.grasshopper.healthySeconds=240;
 assert.equal(updateReproduction(s,1,{...layout,blockedRects:[{left:0,right:1,top:0,bottom:1}]}).length,0);
 for(const def of organisms.filter(o=>o.role==='consumer')){
  const animal=make(def.id,'loss'),watcher=make('weasel','watcher');animal.hunger=1;animal.deprivationSeconds=(starvationLimits[def.id]||populationConfig.deathAfter)-.5;animal.acclimationUntil=0;watcher.hunger=0;watcher.targetInstanceId='loss';watcher.behaviorState='moveToFood';const w=world(animal,watcher);w.simulationTime=1000;updateSurvival(w,.5);assert.equal(w.organisms.length,1);assert.equal(watcher.targetInstanceId,null);assert.equal(w.population.history[0].cause,'starvation');
 }
});
test('U/O: 23 types / 30 individuals over 20 minutes maintain bounded history, resources and species-index searches',()=>{
 const s=world(...organisms.map((o,i)=>make(o.id,'mix-'+i,.22+(i%5)*.035)),...Array.from({length:7},(_,i)=>make('grass','extra-'+i,.45+i*.01)));const f=run(s,1200);assert(s.organisms.length<=30);assert(s.organisms.some(o=>o.speciesId==='grass'));assert(s.population.history.length<=80);assert(Object.values(s.decomposition.organicMatter).every(v=>v<=30&&v>=0));assert(new Set(s.organisms.map(o=>o.instanceId)).size===s.organisms.length);console.log('23 type / 30 initial / 20 minute:',JSON.stringify({remaining:s.organisms.length,changes:s.population.totals,history:s.population.history.length,feeding:f.getDiagnostics()}));
});
test('I: competing consumers with low shared supply receive one bounded, non-rewarded ecological warning',()=>{
 const grass=make('grass'),gh=make('grasshopper'),rabbit=make('rabbit');grass.foodStock=.2;const s=world(grass,gh,rabbit),e=createEventSystem();e.refresh(s);e.refresh(s);assert.equal(s.events.filter(v=>v.key==='competition:grass').length,1);assert.match(s.events.find(v=>v.key==='competition:grass').title,/같은 먹이/);assert.equal(s.metrics.points,0);
});
test('C: a weak animal approaches the same real prey more slowly than a healthy animal',()=>{
 function movement(weak){const frog=make('frog'),prey=make('grasshopper','food',.6);frog.behaviorState='moveToFood';frog.targetInstanceId='food';frog.hunger=1;frog.acclimationUntil=0;frog.deprivationSeconds=weak?200:0;prey.hunger=0;const s=world(frog,prey);s.simulationTime=200;run(s,1.4);return frog.position.x-.4;}
 const normal=movement(false),weak=movement(true);assert(normal>0&&weak>0&&weak<normal);
});
