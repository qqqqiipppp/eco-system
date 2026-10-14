import {pointEconomyConfig as config,legacyRewardAmounts,recoveryChoices} from '../../data/point-economy.js';
import {environmentEventDefinitions} from '../../data/environment-events.js';
import {environmentFactors} from '../../data/environment-config.js';
import {managementActions} from '../../data/management-actions.js';
import {createPointEconomyState,ledgerBalance} from '../state/point-economy-state.js';
import {willRecoverNaturally} from '../systems/point-economy.js';

const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const eventNumber=id=>typeof id==='string'&&/^environment-[1-9]\d{0,9}$/.test(id)?Number(id.slice(12)):0;
const text=v=>typeof v==='string'?v.slice(0,100):'';
const guardedLegacy=()=>[...legacyRewardAmounts.keys()].filter(id=>id.startsWith('question:')||id.startsWith('management:'));
export function snapshotPointEconomy(state){
 const p=state.pointEconomy;
 return {...structuredClone(p),openingBalance:p.openingBalance+state.metrics.points-ledgerBalance(p)};
}
export function restorePointEconomy(saved,version,state,{number,repair}){
 const known=state.rewardHistory.map(r=>r.rewardId);
 // Already recorded discoveries/completions remain consumed even if one old
 // reward row was damaged. They are not new rewards and do not change balance.
 known.push(...state.observations.map(o=>'observation:'+o.relationId),...state.activities.filter(a=>a.completed).map(a=>'activity:'+a.activityId));
 const fresh=createPointEconomyState(state.metrics.points,state.simulationTime,state.environmentEvents.sequence,known);
 if(version<13)return fresh;
 if(!object(saved)){
  repair();fresh.legacyClaimed=[...new Set([...known,...guardedLegacy()])];fresh.studyCount=config.studyLimit;fresh.studyUnidentifiedCount=config.studyLimit;fresh.support.used=state.recoverySupportUsed;
  if(fresh.support.used){const factors=Object.keys(environmentFactors).filter(f=>state.environment[f].value<config.minimumEnvironment&&!willRecoverNaturally(state,f));const budget=Math.min(state.metrics.points,factors.reduce((sum,f)=>sum+(managementActions.find(a=>a.effect.factor===f)?.cost||8),0));fresh.support={used:true,grantedAt:state.simulationTime,amount:0,budget,remaining:budget,factors};}
  return fresh;
 }
 const bounded=(v,limit)=>{if(!Array.isArray(v)){repair();return [];}if(v.length>limit)repair();return v.slice(-limit);};
 const integer=(v,max,fallback=0)=>{const n=number(v,0,max,fallback);if(!Number.isInteger(n))repair();return Math.floor(n);};
 const time=v=>number(v,0,state.simulationTime);
 const p=createPointEconomyState(state.metrics.points,time(saved.openingAt),integer(saved.studyStartSequence,state.environmentEvents.sequence));
 p.legacyClaimed=[...new Set([...known,...(Array.isArray(saved.legacyClaimed)?bounded(saved.legacyClaimed,100).filter(id=>{if(!legacyRewardAmounts.has(id)){repair();return false;}return true;}):guardedLegacy())])];if(!Array.isArray(saved.legacyClaimed))repair();
 const seen=new Set();
 for(const c of bounded(saved.studyClaims,config.studyLimit)){
  const n=eventNumber(c?.eventId),d=c&&Object.hasOwn(environmentEventDefinitions,c.kind)?environmentEventDefinitions[c.kind]:null;
  if(!object(c)||!d||n<1||n>state.environmentEvents.sequence||c.rewardId!==`environment-study:${c.eventId}`||c.factor!==d.factor||c.amount!==config.studyReward||!recoveryChoices.some(r=>r.id===c.recovery)||!Number.isFinite(c.grantedAt)||c.grantedAt<0||c.grantedAt>state.simulationTime||seen.has(c.eventId)){repair();continue;}
  seen.add(c.eventId);p.studyClaims.push({rewardId:c.rewardId,eventId:c.eventId,kind:c.kind,factor:c.factor,recovery:c.recovery,amount:config.studyReward,grantedAt:c.grantedAt});
 }
 p.studyCount=Math.max(p.studyClaims.length,integer(saved.studyCount,config.studyLimit));
 p.studyClaimedIds=[...new Set([...p.studyClaims.map(c=>c.eventId),...bounded(saved.studyClaimedIds,config.studyLimit).filter(id=>{const valid=eventNumber(id)>0&&eventNumber(id)<=state.environmentEvents.sequence;if(!valid)repair();return valid;})])];
 p.studyUnidentifiedCount=integer(saved.studyUnidentifiedCount,config.studyLimit);
 const totals=object(saved.totals)?saved.totals:{};if(!object(saved.totals))repair();
 p.totals={legacy:number(totals.legacy,0,1e6),study:number(totals.study,0,config.studyMaximum),support:number(totals.support,0,config.supportMaximum),spent:number(totals.spent,0,1e6)};
 p.studyCount=Math.max(p.studyCount,Math.ceil(p.totals.study/config.studyReward));
 const s=object(saved.support)?saved.support:null;
 if(!s){repair();p.support.used=true;}else{
  const used=s.used===true||p.totals.support>0;if(typeof s.used!=='boolean')repair();
  const amount=integer(s.amount,config.supportMaximum),budget=integer(s.budget,config.supportMaximum),remaining=integer(s.remaining,budget);
  const factors=[...new Set(bounded(s.factors,4).filter(f=>{if(!Object.hasOwn(environmentFactors,f)){repair();return false;}return true;}))];
  p.support=used?{used:true,grantedAt:time(s.grantedAt),amount:Math.max(amount,p.totals.support),budget:Math.max(budget,amount,p.totals.support),remaining,factors}:fresh.support;
  if(!used&&(amount||budget||remaining||factors.length)){repair();p.support.used=true;}
 }
 p.sequence=integer(saved.sequence,1e9);const rowIds=new Set(),sequences=new Set();
 for(const row of bounded(saved.ledger,config.ledgerLimit)){
  const validAmount=row?.type==='legacy'?legacyRewardAmounts.has(row.id)&&legacyRewardAmounts.get(row.id)===row.amount:
   row?.type==='study'?/^environment-study:environment-[1-9]\d*$/.test(row.id)&&eventNumber(row.id.slice('environment-study:'.length))<=state.environmentEvents.sequence&&row.amount===config.studyReward:
   row?.type==='support'?row.id==='support:environment-recovery'&&Number.isInteger(row.amount)&&row.amount>0&&row.amount<=config.supportMaximum:
   row?.type==='management'?/^management:[1-9]\d*$/.test(row.id)&&managementActions.some(a=>a.actionId===row.sourceId&&row.amount===-a.cost):false;
  if(!object(row)||!validAmount||!Number.isInteger(row.sequence)||row.sequence<1||row.sequence>1e9||rowIds.has(row.id)||sequences.has(row.sequence)||!Number.isFinite(row.at)||row.at<0||row.at>state.simulationTime||!Number.isFinite(row.balance)||row.balance<0||row.balance>1e6){repair();continue;}
  rowIds.add(row.id);sequences.add(row.sequence);p.ledger.push({sequence:row.sequence,id:row.id,type:row.type,amount:row.amount,at:row.at,balance:row.balance,sourceId:text(row.sourceId)});
 }
 p.ledger.sort((a,b)=>a.sequence-b.sequence);p.sequence=Math.max(p.sequence,0,...p.ledger.map(r=>r.sequence));
 for(const row of p.ledger){if(row.type==='legacy'&&!p.legacyClaimed.includes(row.id))p.legacyClaimed.push(row.id);}
 const studies=p.ledger.filter(r=>r.type==='study');
 for(const row of studies){const id=row.id.slice('environment-study:'.length);if(eventNumber(id)<=state.environmentEvents.sequence&&!p.studyClaimedIds.includes(id)){repair();p.studyClaimedIds.push(id);}}
 p.studyClaimedIds=p.studyClaimedIds.slice(0,config.studyLimit);p.studyCount=Math.min(config.studyLimit,Math.max(p.studyCount,p.studyClaimedIds.length+p.studyUnidentifiedCount));
 const unidentified=p.studyCount-p.studyClaimedIds.length;if(unidentified>p.studyUnidentifiedCount){repair();p.studyStartSequence=state.environmentEvents.sequence;p.studyUnidentifiedCount=unidentified;}
 const income=type=>p.ledger.filter(r=>r.type===type).reduce((sum,r)=>sum+Math.abs(r.amount),0);
 p.totals.legacy=Math.max(p.totals.legacy,income('legacy'));p.totals.study=Math.min(config.studyMaximum,Math.max(p.totals.study,p.studyClaims.length*config.studyReward,income('study')));p.totals.support=Math.min(config.supportMaximum,Math.max(p.totals.support,income('support')));p.totals.spent=Math.max(p.totals.spent,income('management'));
 if(p.ledger.some(r=>r.type==='support')){
  p.support.used=true;p.support.amount=Math.max(p.support.amount,...p.ledger.filter(r=>r.type==='support').map(r=>r.amount));
  if(!s?.used){repair();const factors=Object.keys(environmentFactors).filter(f=>state.environment[f].value<config.minimumEnvironment);const need=factors.reduce((sum,f)=>sum+(managementActions.find(a=>a.effect.factor===f)?.cost||8),0);p.support.budget=Math.max(p.support.amount,need);p.support.remaining=Math.min(need,state.metrics.points);p.support.factors=factors;}
 }
 // The stored balance is never rebuilt from an incomplete/bounded history.
 p.openingBalance=state.metrics.points-p.totals.legacy-p.totals.study-p.totals.support+p.totals.spent;
 return p;
}
