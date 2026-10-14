import {createGameState} from '../js/state/game-state.js';
import {createSaveSnapshot} from '../js/services/save-format.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {organisms} from '../data/organisms.js';
import {legacyEcology} from '../data/legacy-ecology.js';
export const emptyMemory={sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]};
export const encode=state=>JSON.stringify(createSaveSnapshot(state,emptyMemory,'2026-10-12T00:00:00Z'));
export const make=(id,n=id,x=.4)=>createOrganismInstance(id,n,{x,y:.72});
export const layout={footprints:Object.fromEntries(organisms.map(o=>[o.id,{halfWidth:.01,above:.1,below:.02}])),blockedRects:[]};
export function world(groups,prefix='fixture'){
 const state=createGameState();state.organisms=groups.flatMap(([id,count,x],g)=>Array.from({length:count},(_,i)=>make(id,`${prefix}-${g}-${i}`,x+i*.035)));
 state.inventory.forEach(c=>c.acquired=true);
 state.population.introductions=Object.fromEntries([...new Set(state.organisms.map(o=>o.speciesId))].map(id=>[id,{count:state.organisms.filter(o=>o.speciesId===id).length,nextAt:0}]));return state;
}
// The genuine pre-change meaning: unprefixed relation IDs, old lifespans/rules,
// no ecologyRevision/archive fields. Avoid creating a v10 save relabeled v9.
export function legacySave(version=9){
 const state=world(organisms.filter(o=>o.id!=='earthworm').map((o,i)=>[o.id,1,.22+(i%5)*.035]));state.inventory=state.inventory.filter(c=>c.speciesId!=='earthworm');state.simulationTime=1000;
 const save=createSaveSnapshot(state,emptyMemory,'2020-01-01T00:00:00Z'),d=save.domain;
 save.schemaVersion=d.schemaVersion=version;delete d.ecologyRevision;delete d.legacyEcology;delete d.development;delete d.environmentEvents;delete d.pointEconomy;
 d.metrics={points:77,bestStability:93};d.forestProgress={cleared:true,clearedAt:800,stableSeconds:30};
 d.observations=legacyEcology.relations.map(r=>({relationId:r.relationId,eventId:'old-event',discoveredAt:500}));
 d.rewardHistory=d.observations.map(r=>({rewardId:`observation:${r.relationId}`,sourceId:'old-event',grantedAt:500,amount:12}));
 for(const activity of d.activities){activity.completed=true;activity.completedAt=600;activity.attempts=1;if(activity.activityId==='producer_quiz')activity.lastAnswer='grass';if(activity.activityId==='decomposer_classify')activity.lastAnswer='decomposer';d.rewardHistory.push({rewardId:`activity:${activity.activityId}`,sourceId:activity.activityId,grantedAt:600,amount:activity.activityId==='producer_quiz'?3:4});}
 for(const o of d.organisms){delete o.development;const rule=legacyEcology.lifespan[o.speciesId],duration=(rule.min+rule.max)/2;
  if(rule.model==='individual')o.life={duration,startedAt:0,initialAge:duration*.12};else o.life={renewalSeconds:duration,nextRenewalAt:1400,vigor:.7,stressSeconds:0,generation:2};
  if('hunger'in o)Object.assign(o,{hunger:.9,deprivationSeconds:220,foodShortageDuration:22,lastSuccessfulFeedingAt:980,bornAt:900,satietyUntil:1000});
 }
 // Old hazel very near its own endpoint, still must get a safe new tree life.
 const tree=d.organisms.find(o=>o.speciesId==='hazel');tree.life.initialAge=tree.life.duration-1020;
 d.population.history=[{sequence:1,speciesId:'aphid',consumerSpeciesId:'ladybird',cause:'predation',changeType:'predation',simulationTime:500,countBefore:2,countAfter:1,noted:false},{sequence:2,speciesId:'field-mouse',cause:'replenishment',changeType:'replenishment',mode:'immigration',simulationTime:700,countBefore:0,countAfter:1,noted:false}];
 d.population.sequence=2;d.population.totals={predation:10,replenishment:4,reproduction:7};
 d.population.breeding={aphid:{healthySeconds:200,nextAt:1200},grasshopper:{healthySeconds:200,nextAt:1200},grass:{healthySeconds:100,nextAt:1100}};
 d.population.replenishment={spider:{healthySeconds:123,nextAt:1700},ladybird:{healthySeconds:123,nextAt:1700},'field-mouse':{healthySeconds:123,nextAt:1700},grasshopper:{healthySeconds:100,nextAt:1100,reserve:3}};
 d.population.introductions.aphid={count:4,nextAt:1040};d.decomposition={organicMatter:{wood:8,litter:9,remains:10},soilNutrients:.7,processed:12};
 d.managementHistory=[{actionId:'water-care',executedAt:400,cost:8,result:'resolved',sourceEventId:'old',sourceId:'water',factor:'water',valueAfter:1}];d.managementActionCount=5;
 save.eventMemory={sequence:7,cooldowns:[],questionDone:[],pendingDiscoveries:[['grass_to_grasshopper',{consumerInstanceId:'old-consumer'}]]};
 if(version<9){for(const o of d.organisms)delete o.life;delete d.population.replenishment;}
 if(version===7){d.inventory=d.inventory.filter(c=>['oak','grass','grasshopper','frog','rabbit','mushroom'].includes(c.speciesId));d.organisms=d.organisms.filter(o=>['oak','grass','grasshopper','frog','rabbit','mushroom'].includes(o.speciesId));d.observations=d.observations.slice(0,2);d.rewardHistory=d.rewardHistory.filter(r=>!r.rewardId.startsWith('observation:')||d.observations.some(o=>r.rewardId===`observation:${o.relationId}`));delete d.population;delete d.decomposition;}
 return save;
}
