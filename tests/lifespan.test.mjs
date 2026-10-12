import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {organisms} from '../data/organisms.js';
import {lifespanRules,replenishmentRules} from '../data/lifespan-config.js';
import {reproductionRules} from '../data/population-config.js';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {naturalEndAt,effectiveAge} from '../js/state/life-state.js';
import {updateLifespans,colonyActivity} from '../js/systems/lifespan.js';
import {addOrganism,removeOrganism,countSpecies} from '../js/systems/lifecycle.js';
import {populationMessage,updateSurvival,updateReproduction,updateReplenishment,validateIntroduction,supportSurvival} from '../js/systems/population.js';
import {updateDecomposition} from '../js/systems/decomposition.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {evaluateStability} from '../js/systems/stability.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
const make=(id,n=id,x=.4)=>createOrganismInstance(id,n,{x,y:.72});
const layout={footprints:Object.fromEntries(organisms.map(o=>[o.id,{halfWidth:.01,above:.1,below:.02}])),blockedRects:[]};
const world=(...items)=>{const s=createGameState();s.organisms=items;s.population.introductions=Object.fromEntries([...new Set(items.map(o=>o.speciesId))].map(id=>[id,{count:countSpecies(s,id),nextAt:0}]));return s;};
const encode=s=>JSON.stringify(createSaveSnapshot(s,{sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-12T00:00:00Z'));
const run=(s,seconds,system=createFeedingSystem(s.simulationTime))=>{for(let i=0;i<seconds*10;i++)system.update(s,.1,layout);return system;};

test('A/C/D/L: all 23 rules, distinct lifetimes, tree floors and stable individual variation',()=>{
 assert.deepEqual(Object.keys(lifespanRules).sort(),organisms.map(o=>o.id).sort());
 assert.equal(Object.values(lifespanRules).filter(r=>r.model==='colony').length,3);
 assert(lifespanRules.oak.min>lifespanRules.grass.max*4);assert(lifespanRules.pine.min>120*60);
 const group=Array.from({length:20},(_,i)=>make('grasshopper','g'+i));
 assert.equal(new Set(group.map(naturalEndAt)).size,20);assert(Math.max(...group.map(naturalEndAt))-Math.min(...group.map(naturalEndAt))>60);
 for(const o of group){assert(o.life.duration>=840&&o.life.duration<=1200);assert.deepEqual(o.life,make('grasshopper',o.instanceId).life);}
});
test('initial adults and true new births have separate age and adaptation clocks',()=>{
 const s=world();s.simulationTime=400;
 const adult=addOrganism(s,'frog',{x:.4,y:.72}),child=addOrganism(s,'rabbit',{x:.5,y:.72},'reproduction');
 assert(adult.life.initialAge>0);assert.equal(child.life.initialAge,0);assert.equal(adult.bornAt,400);assert.equal(child.bornAt,400);assert.equal(effectiveAge(child,420),20);
});
test('E/F/N/O/Q: one natural end removes state/target exactly once and adds the right bounded matter',()=>{
 for(const [id,part,amount]of [['oak','wood',3],['grass','litter',1],['frog','remains',1]]){
  const dying=make(id),watcher=make('weasel','watcher'),s=world(dying,watcher);watcher.targetInstanceId=dying.instanceId;watcher.behaviorState='moveToFood';s.decomposition.organicMatter={wood:0,litter:0,remains:0};
  s.simulationTime=naturalEndAt(dying);watcher.life.startedAt=s.simulationTime;assert.deepEqual(updateLifespans(s,.5),[dying.instanceId]);assert.equal(watcher.targetInstanceId,null);assert.equal(s.organisms.length,1);assert.equal(s.population.history[0].cause,'natural_lifespan');assert.equal(s.decomposition.organicMatter[part],amount);assert.match(populationMessage(s.population.history[0]),/수명을 다해.*자연으로 돌아갔어요.*1.* → 0/);
  updateLifespans(s,.5);assert.equal(s.population.history.length,1);assert.equal(s.decomposition.organicMatter[part],amount);updateDecomposition(s,1);assert(s.decomposition.organicMatter[part]<amount);
 }
 const s=world(make('oak'));s.decomposition.organicMatter.wood=29;s.simulationTime=naturalEndAt(s.organisms[0]);updateLifespans(s,.5);assert.equal(s.decomposition.organicMatter.wood,30);
});
test('G/H/O: cause priority is predation, starvation, natural end; no duplicate matter/deletion',()=>{
 const a=make('grasshopper'),s=world(a);s.simulationTime=naturalEndAt(a);a.hunger=1;a.deprivationSeconds=400;a.acclimationUntil=0;
 updateSurvival(s,.5);updateLifespans(s,.5);assert.equal(s.population.history.length,1);assert.equal(s.population.history[0].cause,'starvation');assert.equal(s.decomposition.organicMatter.remains,1);
 const prey=make('grasshopper'),frog=make('frog'),p=world(prey,frog);frog.hunger=1;prey.hunger=0;prey.life.initialAge=prey.life.duration-4;
 run(p,4);assert.equal(p.population.history.filter(r=>r.speciesId==='grasshopper').length,1);assert.equal(p.population.history[0].cause,'predation');assert.equal(p.decomposition.organicMatter.remains,0);
 const release=world(make('frog'));removeOrganism(release,'frog','release');assert.equal(release.decomposition.organicMatter.remains,0);
});
test('caterpillar stage exit is not death, and produces no remains',()=>{
 const s=world(make('caterpillar'));s.simulationTime=naturalEndAt(s.organisms[0]);updateLifespans(s,.5);
 assert.equal(s.organisms.length,0);assert.equal(s.population.history[0].cause,'life_stage_exit');assert.equal(s.decomposition.organicMatter.remains,0);assert.match(populationMessage(s.population.history[0]),/번데기.*수명을 다한 것이 아니/);
});
test('I/J: the three retained reproduction rules still create young and open space after natural end',()=>{
 const sources={grass:null,grasshopper:'grass',rabbit:'grass',aphid:'hazel'};
 for(const [id,rule]of Object.entries(reproductionRules)){
  const parents=Array.from({length:Math.max(2,rule.minimum)},(_,i)=>make(id,'parent'+i,.25+i*.09)),s=world(...parents,...(sources[id]?[make(sources[id],'food',.4)]:[]));s.simulationTime=100;
  for(const o of parents)if('hunger'in o){o.hunger=.1;o.lastSuccessfulFeedingAt=100;}
  s.population.breeding[id]={healthySeconds:rule.healthySeconds,nextAt:0};const added=updateReproduction(s,.5,layout);assert(added.some(o=>o.speciesId===id));assert.equal(added.find(o=>o.speciesId===id).life.initialAge,0);
 }
 const s=world(make('grass','old',.3),make('grass','young',.5));s.simulationTime=naturalEndAt(s.organisms[0]);s.organisms[1].life.startedAt=s.simulationTime;s.population.breeding.grass={healthySeconds:180,nextAt:0};updateLifespans(s,.5);assert.equal(s.organisms.length,1);assert.equal(updateReproduction(s,.5,layout).length,1);assert.equal(s.population.totals.natural_lifespan,1);assert.equal(s.population.totals.reproduction,1);
});
test('J/K/X: limited replenishment needs acquired/previously used card, real food, cooldown, habitat and room',()=>{
 for(const [id,rule]of Object.entries(replenishmentRules)){
  const source=id==='grasshopper'?'grass':'pine',s=world(make(source));s.simulationTime=1000;s.population.introductions[id]={count:1,nextAt:0};s.population.replenishment[id]={healthySeconds:rule.healthySeconds,nextAt:0,...(rule.seedBank?{reserve:2}:{})};
  if(id==='grasshopper')s.inventory.find(c=>c.speciesId===id).acquired=false;
  assert.equal(updateReplenishment(s,.5,layout).length,0);s.inventory.find(c=>c.speciesId===id).acquired=true;s.population.replenishment[id].healthySeconds=rule.healthySeconds;
  const arrived=updateReplenishment(s,.5,layout);assert.equal(arrived.length,1);assert.equal(arrived[0].speciesId,id);assert.equal(s.population.history[0].cause,'replenishment');
  s.population.replenishment[id].healthySeconds=rule.healthySeconds;assert.equal(updateReplenishment(s,.5,layout).length,0);
  assert.equal(decodeSave(encode(s)).state.population.replenishment[id].nextAt,s.population.replenishment[id].nextAt);
 }
 const initial=createGameState();assert.equal(initial.inventory.filter(c=>!c.acquired&&organisms.find(o=>o.id===c.speciesId).unlockStage===14).length,17);
});
test('K: every remaining individual can be reintroduced after loss; locks, food checks and no-cost recovery remain',()=>{
 for(const def of organisms.filter(o=>!reproductionRules[o.id]&&lifespanRules[o.id].model==='individual')){
  const o=make(def.id),s=world(o,...['oak','pine','grass','grasshopper','frog','raspberry','caterpillar','aphid','snail','rabbit'].filter(id=>id!==def.id).map((id,i)=>make(id,'f'+i)));
  s.inventory.find(c=>c.speciesId===def.id).acquired=true;s.metrics.points=0;removeOrganism(s,o.instanceId,'natural_lifespan');assert.equal(validateIntroduction(s,def.id).reason,'cooldown');s.simulationTime=61;if(def.id==='aphid')assert.equal(validateIntroduction(s,def.id).reason,'food');else assert(validateIntroduction(s,def.id).ok,def.id);assert(s.inventory.find(c=>c.speciesId===def.id).acquired);
 }
});
test('M/N: colonies renew inside the same instance, dormancy is reversible, prolonged bad habitat causes decline',()=>{
 for(const id of ['mushroom','litter-mold','soil-bacteria']){
  const o=make(id),s=world(o),rule=lifespanRules[id];s.decomposition.organicMatter[rule.resource]=5;s.simulationTime=o.life.nextRenewalAt;const before=structuredClone(s.decomposition);updateLifespans(s,.5);
  assert.equal(s.organisms[0],o);assert.equal(o.life.generation,1);assert.equal(s.population.history[0].countBefore,s.population.history[0].countAfter);assert.deepEqual(s.decomposition,before);assert(s.population.history[0].noted);
  s.decomposition.organicMatter[rule.resource]=0;updateLifespans(s,rule.stressSeconds*2);assert.equal(s.organisms.length,1);assert.equal(o.life.vigor,.2);const quiet=colonyActivity(o,s.environment);s.decomposition.organicMatter[rule.resource]=2;updateLifespans(s,240);assert(colonyActivity(o,s.environment)>quiet);
  s.environment.water.value=.15;updateLifespans(s,rule.stressSeconds);assert.equal(s.organisms.length,0);assert.equal(s.population.history.at(-1).cause,'colony_decline');assert(s.decomposition.organicMatter[rule.resource]>0);
 }
});
test('P: stability uses live composition, supply and count changes; life history never adds a fixed penalty',()=>{
 const s=world(make('grass'),make('grasshopper'),make('frog'),make('mushroom'));const score=evaluateStability(s).score;
 s.population.history=[{speciesId:'grasshopper',cause:'natural_lifespan',countBefore:5,countAfter:4}];s.population.totals.natural_lifespan=20;assert.equal(evaluateStability(s).score,score);
});
test('F: natural end is a non-urgent notice, coalesced and acknowledged without reward; colonies do not flood events',()=>{
 const s=world(make('grasshopper'));s.simulationTime=naturalEndAt(s.organisms[0]);updateLifespans(s,.5);const e=createEventSystem(s.simulationTime);e.refresh(s);const event=s.events.find(v=>v.payload.populationSequence);assert.match(event.title,/세대/);assert.equal(event.payload.urgent,false);e.acknowledge(s,event.eventId);assert.equal(s.metrics.points,0);
 const c=world(make('mushroom'));c.decomposition.organicMatter.wood=5;c.simulationTime=c.organisms[0].life.nextRenewalAt;updateLifespans(c,.5);createEventSystem(c.simulationTime).refresh(c);assert(!c.events.some(v=>v.payload.populationSequence));
});
test('R: at 30 one exact natural loss opens one birth space; density and blocked regions still prevent arrivals',()=>{
 const s=world(...Array.from({length:30},(_,i)=>make(i<2?'grass':'oak','n'+i,.2+(i%7)*.09)));const dying=s.organisms[29];s.simulationTime=naturalEndAt(dying);for(const o of s.organisms)if(o!==dying)o.life.startedAt=s.simulationTime;
 updateLifespans(s,.5);assert.equal(s.organisms.length,29);s.population.breeding.grass={healthySeconds:180,nextAt:0};assert.equal(updateReproduction(s,.5,layout).length,1);assert.equal(s.organisms.length,30);assert.equal(updateReproduction(s,180,layout).length,0);
});
test('S/U: v10 repeated save/reload preserves exact end, ages, colonies, histories and replenishment',()=>{
 const s=world(make('grasshopper'),make('mushroom'));s.simulationTime=300;s.population.replenishment.caterpillar={healthySeconds:123,nextAt:800};s.organisms[1].life.vigor=.5;s.organisms[1].life.generation=3;
 let loaded=s;for(let i=0;i<10;i++){const result=decodeSave(encode(loaded));assert.equal(result.status,'loaded');loaded=result.state;assert.deepEqual(loaded.organisms.map(o=>o.life),s.organisms.map(o=>o.life));}
 assert.equal(naturalEndAt(loaded.organisms[0]),naturalEndAt(s.organisms[0]));assert.equal(effectiveAge(loaded.organisms[0],300),effectiveAge(s.organisms[0],300));assert.deepEqual(loaded.population.replenishment,s.population.replenishment);
});
test('T/V: genuine v8 and v7 migration protects old populations at large clocks and preserves prior progress',()=>{
 const s=createGameState();s.simulationTime=1e6;s.metrics.points=22;s.metrics.bestStability=88;s.organisms.push(make('frog'));s.inventory.find(c=>c.speciesId==='frog').acquired=true;s.population.breeding.grass={healthySeconds:120,nextAt:1e6+20};s.population.introductions.frog={count:3,nextAt:1e6+30};s.decomposition.soilNutrients=.7;
 for(const version of [8,7]){
  const snapshot=JSON.parse(encode(s));snapshot.schemaVersion=snapshot.domain.schemaVersion=version;for(const o of snapshot.domain.organisms)delete o.life;delete snapshot.domain.population.replenishment;
  if(version===7){delete snapshot.domain.population;delete snapshot.domain.decomposition;}
  const result=decodeSave(JSON.stringify(snapshot));assert.equal(result.status,'loaded');const loaded=result.state;assert.equal(loaded.schemaVersion,10);assert.equal(loaded.metrics.points,22);assert.equal(loaded.metrics.bestStability,88);assert(loaded.inventory.find(c=>c.speciesId==='frog').acquired);
  for(const o of loaded.organisms)assert(naturalEndAt(o)>loaded.simulationTime+600);updateLifespans(loaded,.5);assert.equal(loaded.organisms.length,4);
  if(version===8){assert.equal(loaded.population.breeding.grass.healthySeconds,120);assert.equal(loaded.population.introductions.frog.nextAt,1e6+30);assert.equal(loaded.decomposition.soilNutrients,.7);}
 }
});
test('damaged life values recover only the invalid instance; future versions remain protected',()=>{
 const s=world(make('grass'),make('frog'),make('mushroom')),raw=JSON.parse(encode(s));raw.domain.organisms[0].life.duration=-1;raw.domain.organisms[2].life.vigor='evil';const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.deepEqual(r.state.organisms[1].life,s.organisms[1].life);assert(r.state.organisms[0].life.duration>0);raw.schemaVersion=raw.domain.schemaVersion=11;assert(decodeSave(JSON.stringify(raw)).blocked);
});
test('W: wall date and food support cannot change natural end; no per-organism timers or frame ageing',()=>{
 const s=world(make('frog'));const end=naturalEndAt(s.organisms[0]);supportSurvival(s.organisms[0]);assert.equal(naturalEndAt(s.organisms[0]),end);const raw=JSON.parse(encode(s));raw.savedAt='2000-01-01T00:00:00Z';const loaded=decodeSave(JSON.stringify(raw)).state;assert.equal(naturalEndAt(loaded.organisms[0]),end);assert.equal(loaded.simulationTime,0);
 const source=readFileSync(new URL('../js/systems/lifespan.js',import.meta.url),'utf8');assert(!/setInterval|setTimeout|Date\.now|requestAnimationFrame/.test(source));
});
test('B: all 23 species have cited evidence, uncertainty and individual policy documentation',()=>{
 const doc=readFileSync(new URL('../FOREST_LIFESPANS.md',import.meta.url),'utf8');
 for(const species of organisms){assert(doc.includes(`${species.id} · ${species.name}`));assert(doc.includes(` ${species.id}|`));}
 for(const topic of ['불확실성','압축 기준','후속 조정','life_stage_exit','자실체','군집','평균','사육','성숙'])assert(doc.includes(topic));assert((doc.match(/https:\/\//g)||[]).length>=23);
});
test('S: early egg clocks, zero-delta colony history and new causes round-trip without damage',()=>{
 const s=world(make('grass','g'),make('grasshopper','h'),make('mushroom','m'));run(s,1);const early=decodeSave(encode(s));assert.equal(early.status,'loaded');assert.deepEqual(early.state.population.replenishment,s.population.replenishment);
 s.simulationTime=s.organisms[2].life.nextRenewalAt;s.decomposition.organicMatter.wood=5;updateLifespans(s,.5);const l=decodeSave(encode(s));assert.equal(l.status,'loaded');assert.deepEqual(l.state.population.history,s.population.history);assert(l.state.population.totals.colony_renewal>0);
});
test('J/X/U: reload never turns an unused acquired card into permission for automatic arrival',()=>{
 const s=world(make('oak'));s.inventory.forEach(c=>c.acquired=true);const l=decodeSave(encode(s)).state;l.simulationTime+=2000;
 for(const [id,rule]of Object.entries(replenishmentRules))l.population.replenishment[id]={healthySeconds:rule.healthySeconds,nextAt:0,reserve:0};
 assert.equal(updateReplenishment(l,.5,layout).length,0);assert.equal(l.organisms.length,1);
});
test('J/R: no food, bad habitat, full forest and blocked positions prevent replenishment',()=>{
 const rule=replenishmentRules.caterpillar;
 for(const blocked of ['food','habitat','capacity','position']){
  const s=world(make('oak'));s.inventory.find(c=>c.speciesId==='caterpillar').acquired=true;s.population.introductions.caterpillar={count:1,nextAt:0};s.population.replenishment.caterpillar={healthySeconds:rule.healthySeconds,nextAt:0};
  if(blocked==='food')s.organisms[0].foodStock=0;if(blocked==='habitat')s.environment.water.value=.15;if(blocked==='capacity')s.organisms.push(...Array.from({length:29},(_,i)=>make('grass','full'+i)));
  assert.equal(updateReplenishment(s,.5,blocked==='position'?{...layout,blockedRects:[{left:0,right:1,top:0,bottom:1}]}:layout).length,0);
 }
});
test('J: egg reserves require a genuine prior reproduction and cannot be restored without limits',()=>{
 const s=world(make('grass'));s.population.introductions.grasshopper={count:3,nextAt:0};s.population.replenishment.grasshopper={healthySeconds:300,nextAt:0,reserve:0};assert.equal(updateReplenishment(s,.5,layout).length,0);
 const raw=JSON.parse(encode(s));raw.domain.population.replenishment.grasshopper.reserve=999;const restored=decodeSave(JSON.stringify(raw));assert.equal(restored.status,'recovered');assert.equal(restored.state.population.replenishment.grasshopper.reserve,6);
});
