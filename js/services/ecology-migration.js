import {legacyEcology as definitions,legacyRelationIds} from '../../data/legacy-ecology.js';
import {organismById} from '../../data/organisms.js';
import {changedSpeciesIds,convertedLifeIds} from '../../data/species-taxonomy.js';
import {lifespanRules} from '../../data/lifespan-config.js';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
// Bounded historical payload. Never a source of current feeding or discoveries.
export function restoreEcologyHistory(domain,version,read,eventMemory){
 const {array,number,time}=read,previous=version<10;
 const input=previous?{observations:domain.observations,pendingDiscoveries:eventMemory?.pendingDiscoveries,instances:domain.organisms,breeding:domain.population?.breeding,replenishment:domain.population?.replenishment,populationTotals:domain.population?.totals,migratedFromVersion:version}:domain.legacyEcology;
 const result={revision:1,migratedFromVersion:[7,8,9].includes(input?.migratedFromVersion)?input.migratedFromVersion:null,observations:[],pendingDiscoveries:[],instances:[],breeding:{},replenishment:{},populationTotals:{}};
 const seen=new Set();
 for(const r of array(input?.observations??[],27))if(r&&legacyRelationIds.has(r.relationId)&&!seen.has(r.relationId)){seen.add(r.relationId);result.observations.push({relationId:r.relationId,eventId:typeof r.eventId==='string'?r.eventId.slice(0,100):'',discoveredAt:time(r.discoveredAt)});}
 const pendingSeen=new Set();
 for(const entry of array(input?.pendingDiscoveries??[],27)){
  if(!Array.isArray(entry)||!legacyRelationIds.has(entry[0])||pendingSeen.has(entry[0]))continue;
  pendingSeen.add(entry[0]);const id=entry[1]?.consumerInstanceId;
  result.pendingDiscoveries.push([entry[0],{consumerInstanceId:typeof id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(id)?id:null}]);
 }
 const seenInstances=new Set();
 for(const r of array(input?.instances??[],30)){
  if(!r||!Object.hasOwn(organismById,r.speciesId)||!changedSpeciesIds.has(r.speciesId)||typeof r.instanceId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(r.instanceId)||seenInstances.has(r.instanceId))continue;
  seenInstances.add(r.instanceId);const record={instanceId:r.instanceId,speciesId:r.speciesId};
  const lifeKeys=definitions.lifespan[r.speciesId].model==='colony'?['renewalSeconds','nextRenewalAt','vigor','stressSeconds','generation']:['startedAt','initialAge','duration'];
  if(object(r.life))record.life=Object.fromEntries(lifeKeys.filter(key=>key in r.life).map(key=>[key,number(r.life[key],0,1e9)]));
  for(const key of ['hunger','deprivationSeconds','foodShortageDuration','lastSuccessfulFeedingAt','bornAt','satietyUntil','growth','foodStock'])if(key in r)record[key]=r[key]===null&&key==='lastSuccessfulFeedingAt'?null:number(r[key],0,['hunger','growth'].includes(key)?1:1e9);
  result.instances.push(record);
 }
 for(const [key,rules]of [['breeding',definitions.reproduction],['replenishment',definitions.replenishment]])for(const [id,rule]of Object.entries(rules)){
  const m=input?.[key]?.[id];if(!object(m))continue;
  result[key][id]={healthySeconds:number(m.healthySeconds,0,rule.healthySeconds),nextAt:number(m.nextAt,0,1e9),...(rule.seedBank?{reserve:Math.floor(number(m.reserve??0,0,rule.reserveMaximum))}:{})};
 }
 for(const cause of ['placement','reintroduction','reproduction','predation','starvation','release','natural_lifespan','life_stage_exit','colony_renewal','colony_decline','replenishment'])if(input?.populationTotals?.[cause]!==undefined)result.populationTotals[cause]=Math.floor(number(input.populationTotals[cause],0,1e9));
 return result;
}
export function migrateLife(instance,oldLife,simulationTime){
 if(!convertedLifeIds.has(instance.speciesId))return {...oldLife};
 const oldRule=definitions.lifespan[instance.speciesId],newRule=lifespanRules[instance.speciesId];
 // Preserve relative age and deterministic lifespan percentile; reserve >=10%.
 const age=Math.min(.9,Math.max(0,(oldLife.initialAge+simulationTime-oldLife.startedAt)/oldLife.duration));
 const percentile=(oldLife.duration-oldRule.min)/(oldRule.max-oldRule.min);
 const duration=newRule.min+percentile*(newRule.max-newRule.min);
 return {duration,startedAt:simulationTime,initialAge:age*duration};
}
