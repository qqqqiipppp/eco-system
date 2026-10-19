import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {organisms} from '../data/organisms.js';
import {feedingConfig,ecologyConfig} from '../data/ecology-config.js';
import {populationConfig,satietySeconds,starvationLimits,reproductionRules} from '../data/population-config.js';
import {lifespanRules,replenishmentRules} from '../data/lifespan-config.js';
import {relationsByConsumer} from '../data/food-relations.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {survivalStage} from '../js/systems/population.js';
import {world,layout} from './ecology-fixtures.mjs';

function probe(id,food=false){
 const groups=[[id,1,.4]],seen=new Set([id]);
 function addFood(consumer,depth=0){if(depth>3)return;const edge=relationsByConsumer.get(consumer)?.[0];if(!edge||seen.has(edge.sourceSpeciesId))return;seen.add(edge.sourceSpeciesId);groups.push([edge.sourceSpeciesId,edge.feedingMode==='predation'?3:2,.405]);addFood(edge.sourceSpeciesId,depth+1);}
 if(food)addFood(id);
 const s=world(groups,'audit-'+id),o=s.organisms[0],f=createFeedingSystem(0,{environmentEventsEnabled:false}),times=[];
 const out={duration:600,food,firstHungry:null,firstSevere:null,firstWeak:null,removedAt:null,cause:null,mealTimes:times,searchTimes:[],failedSearchTimes:[]};
 for(let i=0;i<6000;i++){
  const was=o.behaviorState,r=f.update(s,.1,layout);for(const m of r.feedingEvents)if(m.consumerInstanceId===o.instanceId)times.push(s.simulationTime);
  if(!r.ticked)continue;
  if(was==='searchFood'){out.searchTimes.push(s.simulationTime);if(o.behaviorState==='wander'&&o.feedingClock.shortage)out.failedSearchTimes.push(s.simulationTime);}
  if(o.hunger>=feedingConfig[id].hungryAt&&out.firstHungry===null)out.firstHungry=s.simulationTime;
  if(['severe','weak'].includes(survivalStage(o))&&out.firstSevere===null)out.firstSevere=s.simulationTime;
  if(survivalStage(o)==='weak'&&out.firstWeak===null)out.firstWeak=s.simulationTime;
  if(!s.organisms.includes(o)){out.removedAt=s.simulationTime;out.cause=s.population.history.filter(r=>r.speciesId===id&&r.countAfter<r.countBefore).at(-1)?.cause;break;}
 }
 const mean=a=>a.length>1?(a.at(-1)-a[0])/(a.length-1):null;
 return {...out,meanMealInterval:mean(times),meanSearchInterval:mean(out.searchTimes),meanFailedRetryInterval:mean(out.failedSearchTimes),mealCount:times.length,remainingAt600:s.organisms.includes(o),finalHunger:o.hunger,finalDeprivation:o.deprivationSeconds};
}
export function auditSurvival(label){
 return {stage:'15.8',label,ecologyConfig:{...ecologyConfig},populationConfig:{...populationConfig},species:organisms.map(o=>{
  const c=feedingConfig[o.id],life=lifespanRules[o.id];
  return {id:o.id,name:o.name,role:o.role,feeding:c?{...c}:null,emptyToHungrySeconds:c?c.hungryAt/c.hungerPerSecond:null,satiety:satietySeconds[o.id]||0,starvationLimit:c?(starvationLimits[o.id]||populationConfig.deathAfter):null,life:{...life},introducedRemainingMin:life.model==='individual'?life.min*(1-life.initialAge):null,introducedRemainingMax:life.model==='individual'?life.max*(1-life.initialAge):null,predators:organisms.filter(x=>relationsByConsumer.get(x.id)?.some(r=>r.sourceSpeciesId===o.id)).map(x=>x.id),reproduction:reproductionRules[o.id]||null,replenishment:replenishmentRules[o.id]||null,noFood:c?probe(o.id):null,actualFeeding:c?probe(o.id,true):null};
 }),notes:['600 active seconds, fixed nearby positions, existing real feeding/resources and .5 tick; no added meals or hunger resets.','Food fixtures recursively include up to three real prey and their first defined food, not an unlimited prey supply. An interval is only reported when >=2 actual meals exist.','These measurements are conditional fixture results, not wild feeding intervals. A single/no meal has null mean. Worm litter feeding is separate; colonies have no consumer hunger.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)writeFileSync(process.argv[3]||new URL('./biodiversity.audit-results.json',import.meta.url),JSON.stringify(auditSurvival(process.argv[2]||'current'),null,2)+'\n');
