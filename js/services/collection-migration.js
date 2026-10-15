import {createProfileState,createRoundState,syncCollection} from '../state/collection-state.js';
import {organismById} from '../../data/organisms.js';
import {foodRelationById} from '../../data/food-relations.js';
import {replayTopics,ROUND_CARE_LIMIT} from '../systems/replay.js';
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const bounded=(v,max)=>Number.isFinite(v)&&v>=0&&v<=max;
export function collectionSnapshot(s){
 const copy={...s,profile:structuredClone(s.profile)};syncCollection(copy);
 return {profile:copy.profile,round:structuredClone(s.round)};
}
export function restoreCollection(d,version,s,repair){
 s.profile=createProfileState();s.round=createRoundState();
 // Imported rights are authoritative; old observations already represent real meals.
 s.profile.acquisitions={};
 if(version>=16){
  const p=object(d.profile)?d.profile:{};if(!object(d.profile))repair();
  s.profile.elapsedBeforeRound=bounded(p.elapsedBeforeRound,1e9)?p.elapsedBeforeRound:0;
  const record=(r,source)=>object(r)&&Number.isInteger(r.round)&&r.round>=1&&r.round<=1e6&&bounded(r.at,1e9)?{round:r.round,at:r.at,source}:null;
  for(const id of Object.keys(organismById)){
   const a=record(p.acquisitions?.[id],['starter','learning-or-prior-right','prior-right'].includes(p.acquisitions?.[id]?.source)?p.acquisitions[id].source:'prior-right');if(a){s.profile.acquisitions[id]=a;const c=s.inventory.find(c=>c.speciesId===id);c.acquired=true;}
   const o=record(p.speciesObservations?.[id],p.speciesObservations?.[id]?.source==='food-observation'?'food-observation':'inspection');if(o)s.profile.speciesObservations[id]=o;
  }
  const seen=new Set();
  for(const r of (Array.isArray(p.relations)?p.relations:[]).slice(0,22))if(r&&Object.hasOwn(foodRelationById,r.relationId)&&!seen.has(r.relationId)&&Number.isInteger(r.round)&&r.round>0&&r.round<=1e6&&bounded(r.discoveredAt,1e9)){seen.add(r.relationId);s.profile.relations.push({relationId:r.relationId,discoveredAt:r.discoveredAt,round:r.round,eventId:typeof r.eventId==='string'?r.eventId.slice(0,100):''});}
  const rounds=new Set();for(const r of (Array.isArray(p.clears)?p.clears:[]).slice(0,1000))if(Number.isInteger(r?.round)&&r.round>0&&r.round<=1e6&&bounded(r.at,1e9)&&!rounds.has(r.round)){rounds.add(r.round);s.profile.clears.push({round:r.round,at:r.at,topic:typeof r.topic==='string'?r.topic.slice(0,100):'basic'});}
  const r=object(d.round)?d.round:{};
  const valid=Number.isInteger(r.number)&&r.number>0&&r.number<=1e6&&r.id==='forest-'+r.number;
  if(!valid)repair();
  s.round.number=valid?r.number:Math.max(1,...s.profile.clears.map(c=>c.round+1));s.round.id='forest-'+s.round.number;
  const topics=replayTopics(s);s.round.topic=s.round.number===1?'basic':topics.some(t=>t.id===r.topic)?r.topic:topics[0]?.id||'producers';
  s.round.inspected=[...new Set((Array.isArray(r.inspected)?r.inspected:[]).filter(id=>Object.hasOwn(organismById,id)))];
  if(s.round.number>1){
   const c=r.care;const validCare=object(c)&&c.limit===ROUND_CARE_LIMIT&&Number.isInteger(c.spent)&&c.spent>=0&&c.spent<=ROUND_CARE_LIMIT&&c.remaining===ROUND_CARE_LIMIT-c.spent;
   if(!validCare)repair();
   s.round.care={limit:ROUND_CARE_LIMIT,spent:validCare?c.spent:ROUND_CARE_LIMIT,remaining:validCare?c.remaining:0,history:validCare&&Array.isArray(c.history)?c.history.slice(-100).filter(h=>Number.isInteger(h.actionNumber)&&h.actionNumber>0&&bounded(h.at,s.simulationTime)&&Number.isInteger(h.amount)&&h.amount>0&&h.amount<=8).map(h=>({actionNumber:h.actionNumber,at:h.at,amount:h.amount})):[]};
  }
 }
 syncCollection(s);
}
