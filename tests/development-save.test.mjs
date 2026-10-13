import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {createDevelopmentState,stageAt} from '../js/state/development-state.js';
import {createSaveSnapshot,decodeSave,SAVE_VERSION} from '../js/services/save-format.js';
import {foodStockCapacity} from '../js/systems/food-resources.js';
import {developmentRules,developmentConfig} from '../data/development-config.js';
import {naturalEndAt} from '../js/state/life-state.js';
import {grantReward} from '../js/systems/rewards.js';
import {updateReproduction,updateReplenishment} from '../js/systems/population.js';
import {removeOrganism} from '../js/systems/lifecycle.js';
import {organisms} from '../data/organisms.js';
import {legacySave,emptyMemory,layout} from './ecology-fixtures.mjs';

const encode=state=>JSON.stringify(createSaveSnapshot(state,emptyMemory,'2000-01-01T00:00:00Z'));
const instance=(id,n=id,origin='introduced')=>{
 const o=createOrganismInstance(id,n,{x:.4,y:.72},{time:1000,newborn:!['introduced','legacy'].includes(origin)});
 o.development=createDevelopmentState(id,origin);
 if(!o.development)delete o.development;
 if('foodStock'in o)o.foodStock=foodStockCapacity(o);
 return o;
};
function stateWith(items){
 const s=createGameState();s.simulationTime=1000;s.organisms=items;
 s.inventory.forEach(c=>c.acquired=true);
 s.population.introductions=Object.fromEntries(items.map(o=>[o.speciesId,{count:3,nextAt:1040}]));
 return s;
}

// Exact pre-development contract: v10 has current v2 ecology and complete life,
// physiology, learning and population state, but no development/pending fields.
// Build its whitelist explicitly, rather than relabeling a new young v11 save.
function version10Save(){
 const s=stateWith(organisms.map((o,i)=>instance(o.id,'prior-'+i)));
 s.observations=[{relationId:'v2_grass_to_grasshopper',eventId:'event-old',discoveredAt:900}];
 s.legacyEcology={revision:1,migratedFromVersion:9,observations:[{relationId:'grass_to_grasshopper',eventId:'historic',discoveredAt:300}],pendingDiscoveries:[['hazel_to_aphid',{consumerInstanceId:'gone-aphid'}]],instances:[],breeding:{aphid:{healthySeconds:100,nextAt:1200}},replenishment:{},populationTotals:{predation:4}};
 s.metrics.points=43;s.metrics.bestStability=95;s.forestProgress={cleared:true,clearedAt:800,stableSeconds:30};
 s.activities[0]={activityId:'producer_quiz',completed:true,attempts:2,completedAt:700,lastAnswer:'grass'};
 s.rewardHistory=[{rewardId:'observation:v2_grass_to_grasshopper',grantedAt:900,sourceId:'event-old',amount:12},{rewardId:'observation:grasshopper_to_frog',grantedAt:300,sourceId:'historic',amount:12},{rewardId:'activity:producer_quiz',grantedAt:700,sourceId:'producer_quiz',amount:3}];
 s.population.breeding={grass:{healthySeconds:100,nextAt:1100},grasshopper:{healthySeconds:120,nextAt:1200},rabbit:{healthySeconds:100,nextAt:1300}};
 s.population.replenishment={grasshopper:{healthySeconds:200,nextAt:1100,reserve:6},caterpillar:{healthySeconds:100,nextAt:1300}};
 s.decomposition={organicMatter:{wood:5,litter:6,remains:7},soilNutrients:.6,processed:8};
 const d={schemaVersion:10,ecologyRevision:2,legacyEcology:structuredClone(s.legacyEcology),ecosystemId:'forest',simulationTime:s.simulationTime,nextInstanceSequence:100,
  inventory:structuredClone(s.inventory),organisms:s.organisms.map(o=>{const r={instanceId:o.instanceId,speciesId:o.speciesId,position:{...o.position},life:{...o.life}};for(const key of ['growth','foodStock','hunger','foodShortageDuration','lastSuccessfulFeedingAt','deprivationSeconds','bornAt','satietyUntil'])if(key in o)r[key]=o[key];return r;}),
  environment:Object.fromEntries(Object.entries(s.environment).map(([id,v])=>[id,{value:v.value}])),metrics:{points:s.metrics.points,bestStability:s.metrics.bestStability},
  observations:structuredClone(s.observations),activities:structuredClone(s.activities),rewardHistory:structuredClone(s.rewardHistory),managementHistory:[],managementActionCount:0,managementCooldowns:{},managementEffects:[],forestProgress:{...s.forestProgress},population:structuredClone(s.population),decomposition:structuredClone(s.decomposition)};
 return {schemaVersion:10,savedAt:'2000-01-01T00:00:00Z',domain:d,eventMemory:{sequence:3,cooldowns:[],questionDone:[],pendingDiscoveries:[['v2_grasshopper_to_frog',{consumerInstanceId:'prior-3'}]]}};
}

test('development save: genuine v10 preserves current ecology, life, earned permissions and all prior operational state',()=>{
 const raw=version10Save(),r=decodeSave(JSON.stringify(raw)),s=r.state;
 assert.equal(r.status,'loaded');assert.equal(SAVE_VERSION,12);assert.equal(s.schemaVersion,12);
 assert.deepEqual(s.observations,raw.domain.observations);assert.deepEqual(s.legacyEcology,raw.domain.legacyEcology);
 assert.deepEqual(s.inventory,raw.domain.inventory);assert.deepEqual(s.activities,raw.domain.activities);
 assert.equal(s.metrics.points,43);assert.equal(s.metrics.bestStability,95);assert(s.forestProgress.cleared);
 assert.deepEqual(s.decomposition,raw.domain.decomposition);assert.deepEqual(s.population.breeding,raw.domain.population.breeding);
 assert.deepEqual(s.population.replenishment,raw.domain.population.replenishment);assert.deepEqual(s.population.introductions,raw.domain.population.introductions);
 assert.deepEqual(r.eventMemory.pendingDiscoveries,raw.eventMemory.pendingDiscoveries);
 for(const o of s.organisms){assert.deepEqual(o.life,raw.domain.organisms.find(p=>p.instanceId===o.instanceId).life);if(o.development){assert.equal(o.development.origin,'legacy');assert.equal(o.development.progressSeconds,o.speciesId==='mushroom'?0:developmentRules[o.speciesId].maxSeconds);}}
 assert.deepEqual(s.development,{sequence:0,history:[]});assert.equal(grantReward(s,'observation','v2_grass_to_grasshopper','new'),0);assert.equal(grantReward(s,'observation','v2_grasshopper_to_frog','new'),0);
});

test('development save: v7/8/9 preserve their ecological migration while old instances become established adults',()=>{
 for(const version of [7,8,9]){
  const raw=legacySave(version),r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'loaded');
  assert.equal(r.state.organisms.length,raw.domain.organisms.length);assert.equal(r.state.metrics.points,77);
  assert.equal(r.state.observations.length,0);assert.equal(r.state.legacyEcology.observations.length,raw.domain.observations.length);
  for(const o of r.state.organisms)if(o.development){assert.equal(o.development.origin,'legacy');assert.equal(o.development.progressSeconds,o.speciesId==='mushroom'?0:developmentRules[o.speciesId].maxSeconds);}
  assert.deepEqual(r.state.development,{sequence:0,history:[]});
 }
});

test('development save: young v11 progresses are explicit, stage caches are excluded, and individual life endpoints stay fixed',()=>{
 const grass=instance('grass','young-grass','seed-spread'),gh=instance('grasshopper','young-gh','egg-hatch'),rabbit=instance('rabbit','young-rabbit','birth'),fungus=instance('mushroom','new-colony');
 for(const [o,p]of [[grass,70],[gh,50],[rabbit,120],[fungus,190]]){o.development.progressSeconds=p;o.development.stage=stageAt(o.speciesId,p);}
 grass.foodStock=foodStockCapacity(grass)*.7;
 const s=stateWith([grass,gh,rabbit,fungus]),snapshot=createSaveSnapshot(s,emptyMemory,'2000-01-01T00:00:00Z');
 assert(snapshot.domain.organisms.every(o=>!('stage'in o.development)));
 const r=decodeSave(JSON.stringify(snapshot));assert.equal(r.status,'loaded');assert.deepEqual(r.state.organisms.map(o=>o.development),s.organisms.map(o=>o.development));
 for(const o of r.state.organisms.filter(o=>o.life.duration)){const before=s.organisms.find(p=>p.instanceId===o.instanceId);assert.equal(naturalEndAt(o),naturalEndAt(before));assert.equal(o.life.initialAge,0);}
 assert.equal(r.state.organisms[0].foodStock,grass.foodStock);assert.deepEqual(r.state.development,s.development);
});

test('development save: seed and funded egg pending remain separate from real organisms, reserve and cooldown persist',()=>{
 const s=stateWith([instance('grass','source')]);s.population.breeding={grass:{healthySeconds:0,nextAt:1100,pending:{remainingSeconds:20,position:{x:.3,y:.72}}},grasshopper:{healthySeconds:0,nextAt:1200,pending:{remainingSeconds:0,position:{x:.35,y:.72}}}};
 s.population.replenishment.grasshopper={healthySeconds:120,nextAt:1180,reserve:3};
 const r=decodeSave(encode(s));assert.equal(r.status,'loaded');assert.equal(r.state.organisms.length,1);
 assert.deepEqual(r.state.population.breeding,s.population.breeding);assert.deepEqual(r.state.population.replenishment,s.population.replenishment);
 assert.equal(r.state.decomposition.organicMatter.remains,0);assert(Object.values(r.state.population.totals).every(value=>value===0));
});

test('development save: restored primary egg hatches once and cannot hatch again through replenishment in the same tick',()=>{
 const s=stateWith([instance('grass','food')]);
 s.population.introductions.grasshopper={count:3,nextAt:0};
 s.population.breeding.grasshopper={healthySeconds:0,nextAt:1200,pending:{remainingSeconds:0,position:{x:.35,y:.72}}};
 s.population.replenishment.grasshopper={healthySeconds:300,nextAt:1000,reserve:2};
 const loaded=decodeSave(encode(s));assert.equal(loaded.status,'loaded');
 const born=updateReproduction(loaded.state,.5,layout),extra=updateReplenishment(loaded.state,.5,layout);
 assert.equal(born.filter(o=>o.speciesId==='grasshopper').length,1);assert.equal(extra.filter(o=>o.speciesId==='grasshopper').length,0);
 assert.equal(loaded.state.population.replenishment.grasshopper.reserve,1);assert(!loaded.state.population.breeding.grasshopper.pending);
 const child=born.find(o=>o.speciesId==='grasshopper'),endpoint=naturalEndAt(child),life={...child.life};
 const again=decodeSave(encode(loaded.state));assert.equal(again.status,'loaded');assert(!again.state.population.breeding.grasshopper.pending);
 assert.equal(updateReproduction(again.state,.5,layout).filter(o=>o.speciesId==='grasshopper').length,0);
 assert.equal(again.state.organisms.filter(o=>o.speciesId==='grasshopper').length,1);
 assert.deepEqual(again.state.organisms.find(o=>o.instanceId===child.instanceId).life,life);assert.equal(naturalEndAt(again.state.organisms.find(o=>o.instanceId===child.instanceId)),endpoint);
});

test('development save: full-capacity pending survives reload without consumption and hatches after exactly one space opens',()=>{
 const s=stateWith([instance('grass','food'),...Array.from({length:29},(_,i)=>instance('oak','tree-'+i))]);
 for(const tree of s.organisms.filter(o=>o.speciesId==='oak'))tree.position={x:.6,y:.72};
 s.population.breeding.grasshopper={healthySeconds:0,nextAt:1200,pending:{remainingSeconds:0,position:{x:.3,y:.72}}};
 s.population.replenishment.grasshopper={healthySeconds:0,nextAt:1180,reserve:2};
 const loaded=decodeSave(encode(s));assert.equal(loaded.status,'loaded');const sequence=loaded.state.nextInstanceSequence;
 assert.equal(updateReproduction(loaded.state,.5,layout).length,0);assert.equal(loaded.state.organisms.length,30);
 assert.equal(loaded.state.population.replenishment.grasshopper.reserve,2);assert.equal(loaded.state.nextInstanceSequence,sequence);assert(loaded.state.population.breeding.grasshopper.pending);
 const again=decodeSave(encode(loaded.state));assert.equal(again.status,'loaded');
 removeOrganism(again.state,'tree-28','release');const added=updateReproduction(again.state,.5,layout);
 assert.equal(added.filter(o=>o.speciesId==='grasshopper').length,1);assert.equal(again.state.organisms.length,30);assert.equal(again.state.population.replenishment.grasshopper.reserve,1);assert(!again.state.population.breeding.grasshopper.pending);
});

test('development save: 100 reloads preserve pending/progress/life/history and cannot advance offline clocks or multiply eggs',()=>{
 const s=stateWith([instance('grass','young','seed-spread'),instance('grasshopper','nymph','egg-hatch')]);
 s.organisms[0].development.progressSeconds=179;s.organisms[0].development.stage=stageAt('grass',179);
 s.organisms[1].development.progressSeconds=179;s.organisms[1].development.stage=stageAt('grasshopper',179);
 s.population.breeding.grasshopper={healthySeconds:0,nextAt:1200,pending:{remainingSeconds:10,position:{x:.35,y:.72}}};
 s.population.replenishment.grasshopper={healthySeconds:100,nextAt:1180,reserve:2};
 s.development={sequence:2,history:[{sequence:1,instanceId:'gone-rabbit',speciesId:'rabbit',stage:'juvenile',simulationTime:900,noted:true},{sequence:2,instanceId:'gone-rabbit',speciesId:'rabbit',stage:'adult',simulationTime:950,noted:false}]};
 const lives=s.organisms.map(o=>({...o.life})),development=structuredClone(s.development),origins=structuredClone(s.organisms.map(o=>o.development));let restored=s;
 for(let i=0;i<100;i++){const r=decodeSave(encode(restored));assert.equal(r.status,'loaded');restored=r.state;assert.equal(restored.simulationTime,1000);assert.equal(restored.organisms.length,2);assert.deepEqual(restored.organisms.map(o=>o.life),lives);assert.deepEqual(restored.organisms.map(o=>o.development),origins);assert.deepEqual(restored.development,development);assert.deepEqual(restored.population.breeding,s.population.breeding);assert.deepEqual(restored.population.replenishment,s.population.replenishment);assert.equal(restored.metrics.points,s.metrics.points);}
});

test('development save: stage records stay bounded and unique without losing acknowledged notices for removed organisms',()=>{
 const s=stateWith([]),raw=JSON.parse(encode(s));
 raw.domain.development={sequence:100,history:Array.from({length:61},(_,i)=>({sequence:i+1,instanceId:'gone-'+i,speciesId:'grass',stage:'grown',simulationTime:900,noted:i%2===0}))};
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.development.history.length,developmentConfig.historyLimit);assert.equal(r.state.development.sequence,100);
 const saved=JSON.parse(encode(r.state));saved.domain.development.history.push({...saved.domain.development.history[1],sequence:101});saved.domain.development.history.shift();
 const duplicate=decodeSave(JSON.stringify(saved));assert.equal(duplicate.status,'recovered');assert.equal(duplicate.state.development.history.length,59);assert(duplicate.state.development.history.every(record=>record.instanceId.startsWith('gone-')));
 assert.equal(duplicate.state.observations.length,0);assert.equal(duplicate.state.rewardHistory.length,0);
});

test('development save: malformed growth values repair only development and respect the shared young food capacity',()=>{
 const s=stateWith([instance('grass','young','seed-spread'),instance('rabbit','adult')]),raw=JSON.parse(encode(s));
 const endpoint=naturalEndAt(s.organisms[0]);raw.domain.organisms[0].development={origin:'seed-spread',progressSeconds:-20,stage:'seeding'};raw.domain.organisms[0].foodStock=3;
 raw.domain.organisms[1].development={origin:'egg-hatch',progressSeconds:0};
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.organisms.length,2);
 const young=r.state.organisms[0];assert.equal(young.development.stage,'sprout');assert.equal(young.foodStock,foodStockCapacity(young));assert.equal(naturalEndAt(young),endpoint);
 assert.equal(r.state.organisms[1].development.stage,'adult');assert.equal(r.state.organisms[1].development.origin,'introduced');
});

test('development save: invalid waiting records or unfunded eggs are removed without consuming reserves or producing animals',()=>{
 const s=stateWith([instance('grass','source')]);s.population.breeding={grass:{healthySeconds:0,nextAt:1100},grasshopper:{healthySeconds:0,nextAt:1200}};
 s.population.replenishment.grasshopper={healthySeconds:0,nextAt:1100,reserve:0};
 for(const pending of [{remainingSeconds:20,position:{x:.4,y:.72}},{remainingSeconds:61,position:{x:.4,y:.72}},{remainingSeconds:0,position:{x:NaN,y:.72}}]){
  const raw=JSON.parse(encode(s));raw.domain.population.breeding.grasshopper.pending=pending;
  const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert(!r.state.population.breeding.grasshopper.pending);assert.equal(r.state.population.replenishment.grasshopper.reserve,0);assert.equal(r.state.organisms.length,1);
 }
 const raw=JSON.parse(encode(s));raw.domain.population.breeding.grass.pending={remainingSeconds:1,position:null};assert.equal(decodeSave(JSON.stringify(raw)).status,'recovered');
});

test('development save: learning-only frogs have no developmental runtime data or artificial growth events',()=>{
 const s=stateWith([instance('frog','adult-frog')]),raw=JSON.parse(encode(s));
 assert(!('development'in raw.domain.organisms[0]));raw.domain.organisms[0].development={origin:'birth',progressSeconds:0};
 raw.domain.development={sequence:1,history:[{sequence:1,instanceId:'adult-frog',speciesId:'frog',stage:'adult',simulationTime:1000,noted:false}]};
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert(!r.state.organisms[0].development);assert.equal(r.state.development.history.length,0);assert.equal(r.state.metrics.points,0);
});

test('development save: inherited dictionary names are rejected as stage-history species rather than crashing restoration',()=>{
 const raw=JSON.parse(encode(stateWith([])));
 raw.domain.development={sequence:3,history:['constructor','__proto__','toString'].map((speciesId,i)=>({sequence:i+1,instanceId:'invalid-'+i,speciesId,stage:'adult',simulationTime:1000,noted:false}))};
 const r=decodeSave(JSON.stringify(raw));assert.equal(r.status,'recovered');assert.equal(r.state.development.history.length,0);assert.equal(r.state.organisms.length,0);
});

test('development save: unknown current ecology and future schemas remain blocked, including pre-growth v10',()=>{
 for(const raw of [version10Save(),JSON.parse(encode(createGameState()))]){raw.domain.ecologyRevision=999;const r=decodeSave(JSON.stringify(raw));assert(r.blocked);assert.equal(r.status,'unknown-ecology');}
 const raw=JSON.parse(encode(createGameState()));raw.schemaVersion=raw.domain.schemaVersion=13;assert.equal(decodeSave(JSON.stringify(raw)).status,'future-version');assert(decodeSave(JSON.stringify(raw)).blocked);
});
