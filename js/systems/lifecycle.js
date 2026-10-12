import {createOrganismInstance} from '../state/organism-instance.js';
import {populationConfig,decompositionConfig} from '../../data/population-config.js';
import {placementConfig} from '../../data/interaction-config.js';
import {lifespanRules} from '../../data/lifespan-config.js';

export const countSpecies=(state,id)=>state.organisms.filter(o=>o.speciesId===id).length;
export const populationCounts=state=>Object.fromEntries([...new Set(state.organisms.map(o=>o.speciesId))].map(id=>[id,countSpecies(state,id)]));
export function recordPopulationChange(state,speciesId,changeType,before,after,details={}){
  const p=state.population;
  const record={sequence:++p.sequence,speciesId,changeType,cause:changeType,simulationTime:state.simulationTime,countBefore:before,countAfter:after,
    noted:['placement','reintroduction'].includes(changeType),...details};
  p.history.push(record);if(p.history.length>populationConfig.historyLimit)p.history.shift();
  p.totals[changeType]=(p.totals[changeType]||0)+1;
  return record;
}
export function addOrganism(state,speciesId,position,cause='placement',details={}){
  if(state.organisms.length>=placementConfig.maxOrganisms)return null;
  let sequence=state.nextInstanceSequence;
  while(state.organisms.some(o=>o.instanceId===`organism-${sequence}`))sequence++;
  const instance=createOrganismInstance(speciesId,`organism-${sequence}`,position,{time:state.simulationTime,newborn:cause==='reproduction'||['larval-recruitment','egg-hatch'].includes(details.mode)});
  if('hunger'in instance){instance.bornAt=state.simulationTime;instance.acclimationUntil=state.simulationTime+populationConfig.graceSeconds;}
  const before=countSpecies(state,speciesId);state.organisms.push(instance);state.nextInstanceSequence=sequence+1;
  recordPopulationChange(state,speciesId,cause,before,before+1,details);return instance;
}
export function removeOrganism(state,instanceId,cause,details={}){
  const index=state.organisms.findIndex(o=>o.instanceId===instanceId);if(index<0)return null;
  const instance=state.organisms[index],before=countSpecies(state,instance.speciesId);
  state.organisms.splice(index,1);
  for(const o of state.organisms)if(o.targetInstanceId===instanceId){o.targetInstanceId=null;o.behaviorState='wander';}
  if(cause==='starvation')state.decomposition.organicMatter.remains=Math.min(decompositionConfig.maximum,state.decomposition.organicMatter.remains+decompositionConfig.starvationMatter);
  if(cause==='natural_lifespan'){
    const rule=lifespanRules[instance.speciesId],part=rule.matter||'remains';
    state.decomposition.organicMatter[part]=Math.min(decompositionConfig.maximum,state.decomposition.organicMatter[part]+(rule.matterAmount||1));
  }
  const intro=state.population.introductions[instance.speciesId]||{count:before,nextAt:0};
  intro.nextAt=Math.max(intro.nextAt,state.simulationTime+populationConfig.introductionCooldown);state.population.introductions[instance.speciesId]=intro;
  return recordPopulationChange(state,instance.speciesId,cause,before,before-1,details);
}
