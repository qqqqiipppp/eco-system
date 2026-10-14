import {organicNoticeConfig,organicWorkers,earthwormConfig} from '../../data/detritus-config.js';
import {lifespanRules} from '../../data/lifespan-config.js';
import {feedingConfig} from '../../data/ecology-config.js';
const id=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);

export function snapshotDecomposition(d){
 return {organicMatter:{...d.organicMatter},soilNutrients:d.soilNutrients,processed:d.processed,earthwormProcessed:d.earthwormProcessed||0,soilContribution:d.soilContribution||0,
  notices:{sequence:d.notices?.sequence||0,history:(d.notices?.history||[]).map(r=>({...r,position:{...r.position}}))}};
}
export function restoreDecompositionDetails(saved,version,state,{number,repair}){
 const d=state.decomposition;if(version<14)return;
 d.earthwormProcessed=number(saved?.earthwormProcessed,0,1e6);
 d.soilContribution=number(saved?.soilContribution,0,earthwormConfig.soilMaximum,earthwormConfig.soilMaximum);
 const notices=saved?.notices;
 if(!notices||!Array.isArray(notices.history)||!Number.isInteger(notices.sequence)||notices.sequence<0||notices.sequence>1e9){repair();return;}
 d.notices.sequence=notices.sequence;const seen=new Set();
 if(notices.history.length>organicNoticeConfig.historyLimit)repair();
 for(const r of notices.history.slice(-organicNoticeConfig.historyLimit)){
  const rule=r&&Object.hasOwn(lifespanRules,r.sourceSpeciesId)?lifespanRules[r.sourceSpeciesId]:null,part=r?.cause==='starvation'&&rule&&Object.hasOwn(feedingConfig,r.sourceSpeciesId)?'remains':r?.cause==='natural_lifespan'&&rule?.model==='individual'&&!rule.endCause?rule.matter||'remains':null;
  const maximum=(r?.cause==='starvation'?1:rule?.matterAmount||1)+1e-9;
  if(!r||part!==r.part||!part||!Number.isInteger(r.sequence)||r.sequence<1||r.sequence>notices.sequence||seen.has(r.sequence)||!Number.isInteger(r.populationSequence)||r.populationSequence<1||r.populationSequence>state.population.sequence||!id(r.sourceInstanceId)||!(r.targetInstanceId===null||id(r.targetInstanceId))||!(r.amount>0&&r.amount<=maximum)||!Number.isFinite(r.at)||r.at<0||r.at>state.simulationTime||!Number.isFinite(r.position?.x)||!Number.isFinite(r.position?.y)||r.position.x<0||r.position.x>1||r.position.y<0||r.position.y>1||typeof r.noted!=='boolean'){repair();continue;}
  const target=state.organisms.find(o=>o.instanceId===r.targetInstanceId);
  if(target&&!organicWorkers[part].includes(target.speciesId)){repair();continue;}
  seen.add(r.sequence);d.notices.history.push({sequence:r.sequence,populationSequence:r.populationSequence,sourceInstanceId:r.sourceInstanceId,sourceSpeciesId:r.sourceSpeciesId,cause:r.cause,part:r.part,amount:r.amount,position:{x:r.position.x,y:r.position.y},at:r.at,targetInstanceId:r.targetInstanceId,noted:r.noted});
 }
 d.notices.history.sort((a,b)=>a.sequence-b.sequence);
}
