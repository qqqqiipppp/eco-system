import {organisms} from '../data/organisms.js';
import {lifespanRules,replenishmentRules,colonyConfig} from '../data/lifespan-config.js';
import {developmentRules} from '../data/development-config.js';
import {ecologyConfig,foodResourceConfig,feedingConfig} from '../data/ecology-config.js';
import {populationConfig,reproductionRules,decompositionConfig,satietySeconds,starvationLimits} from '../data/population-config.js';
import {growthConfig} from '../data/environment-config.js';
import {environmentEventConfig,environmentEventDefinitions} from '../data/environment-events.js';
import {earthwormConfig,organicNoticeConfig} from '../data/detritus-config.js';
import {managementActions} from '../data/management-actions.js';
import {forestGoal} from '../data/forest-goal.js';
import {runEconomy,freshStudent,comparisonForest,introduce} from './point-economy-fixtures.mjs';
import {world,make} from './ecology-fixtures.mjs';
import {studyCandidates,claimEnvironmentStudy,studyRecovery} from '../js/systems/point-economy.js';

export const audit=()=>({lifespanRules,replenishmentRules,colonyConfig,developmentRules,ecologyConfig,foodResourceConfig,feedingConfig,populationConfig,reproductionRules,decompositionConfig,satietySeconds,starvationLimits,growthConfig,environmentEventConfig,environmentEventDefinitions,earthwormConfig,organicNoticeConfig,managementActions,forestGoal});
export function mixed24(){const s=world(organisms.map((o,i)=>[o.id,1,.12+(i%6)*.1]));for(let i=0;i<6;i++)s.organisms.push(make('grass','pacing-extra-'+i,.3+i*.035));return s;}
export const study=s=>{for(const r of studyCandidates(s))claimEnvironmentStudy(s,r.eventId,{factor:r.factor,recovery:studyRecovery(r)});};
export function measure(s,minutes,options={}){
 let developmentChanges=0,noticesShown=0;const seen=new Set(),milestones=[];
 const r=runEconomy(s,minutes,{checkpointEvery:0,study,...options,onTick:(s,e)=>{
  developmentChanges=Math.max(developmentChanges,s.development.sequence);
  for(const n of s.events.filter(n=>n.status==='active'&&n.payload.organicOriginSequence))if(!seen.has(n.payload.organicOriginSequence)){seen.add(n.payload.organicOriginSequence);noticesShown++;}
  if(milestones.length===0||s.simulationTime-milestones.at(-1).at>=60)milestones.push({at:s.simulationTime,total:s.organisms.length,stability:s.metrics.stability,points:s.metrics.points});
  options.onTick?.(s,e);
 }});
 return {result:r,data:{minutes,total:r.report.total,types:r.report.types,meals:r.report.meals,predation:r.report.changes.predation||0,naturalEnd:r.report.changes.natural_lifespan||0,starvation:r.report.changes.starvation||0,reproduction:r.report.changes.reproduction||0,replenishment:r.report.changes.replenishment||0,developmentChanges,processed:s.decomposition.processed,wormProcessed:s.decomposition.earthwormProcessed,soilContribution:s.decomposition.soilContribution,noticesShown,organicOrigins:s.decomposition.notices.sequence,episodes:r.report.episodes.map(r=>({kind:r.kind,at:r.startedAt,phase:r.phase})),earned:r.report.legacyEarned+r.report.newEarned+r.report.supportGranted,spent:r.report.spent,points:r.report.points,stability:r.report.stability,cleared:s.forestProgress.cleared,clearedAt:s.forestProgress.clearedAt,currentlyGoalReady:r.report.currentlyGoalReady,final:r.report.final,peak:r.report.peak,milestones}};
}
export {freshStudent,comparisonForest,introduce,world,make};
