import {writeFileSync} from 'node:fs';
import {activities} from '../data/activities.js';
import {foodRelations} from '../data/food-relations.js';
import {rewardConfig} from '../data/management-actions.js';
import {freshStudent,runEconomy,comparisonForest} from './point-economy-fixtures.mjs';
import {createEventSystem} from '../js/systems/events.js';
import {availableEnvironmentalRecovery,availableManagement} from '../js/systems/management.js';
import {environmentFactors} from '../data/environment-config.js';
import {SAVE_VERSION} from '../js/services/save-format.js';
if(SAVE_VERSION!==12)throw new Error('The stage12 baseline was captured before implementation. Read point-economy-baseline-results.json; do not overwrite it with a newer runtime.');
const output={baselineCommit:'c2b609b8ba338f79f63b3ae7e1f79c378c136812',stage:12,method:'Actual placement, meals, acknowledgements, activities and validated care; no point/food/nutrition injections for fresh students; visual wander excluded.',
 theoretical:{all23CardObservation:foodRelations.length*rewardConfig.observation,activities:activities.reduce((sum,a)=>sum+a.pointReward,0),fourQuestions:40,twoManagementResolutions:6,goalReward:0},students:{},comparisons:{}};
for(const mode of ['observe','normal','active','early-spending']){
 const r=runEconomy(freshStudent({earlySpending:mode==='early-spending'}),40,{student:true,earlySpending:mode==='early-spending',mode:mode==='early-spending'?'active':mode});
 output.students[mode]={...r.report,checkpoints:r.checkpoints.map(p=>({minutes:p.activeSeconds/60,earned:p.legacyEarned,spent:p.spent,points:p.points,actions:p.actions,episodes:p.episodes.length,total:p.total,types:p.types,stability:p.stability,ready:p.currentlyGoalReady,cleared:p.cleared}))};
}
for(const forest of ['representative','mixed'])for(const mode of ['none','observe','normal']){
 const r=runEconomy(comparisonForest(forest),40,{enabled:mode!=='none',mode:mode==='none'?'observe':mode});output.comparisons[forest+'-'+mode]=r.report;
}
const blocked=comparisonForest('core');blocked.metrics.points=0;
blocked.observations=foodRelations.map(r=>({relationId:r.relationId,eventId:'fixture-prior',discoveredAt:0}));
blocked.rewardHistory=[...foodRelations.map(r=>({rewardId:'observation:'+r.relationId,grantedAt:0,sourceId:'fixture-prior',amount:12})),...activities.map(a=>({rewardId:'activity:'+a.activityId,grantedAt:0,sourceId:'fixture-prior',amount:a.pointReward})),...Object.keys(environmentFactors).map(f=>({rewardId:`question:producer_${f}_limit`,grantedAt:0,sourceId:'fixture-prior',amount:10})),...['water','soil'].map(f=>({rewardId:`management:${f}_shortage_resolved`,grantedAt:0,sourceId:'fixture-prior',amount:3}))];
for(const f of Object.keys(environmentFactors))blocked.environment[f].value=.15;
const waiting=runEconomy(blocked,10,{student:true,maintain:false,mode:'observe'}),events=createEventSystem(blocked.simulationTime);events.refresh(blocked);
output.blockedFixture={explicitPriorBudgetFixture:true,points:blocked.metrics.points,environment:waiting.report.environment,episodes:waiting.report.episodes.length,allLegacyRewardKeys:blocked.rewardHistory.length,availablePaid:[...blocked.events.filter(e=>e.status==='active').flatMap(e=>availableManagement(blocked,e.eventId)),...availableEnvironmentalRecovery(blocked)].filter(a=>a.available).length,requiredFourFactorRepairCost:28};
output.candidates=[2,4,6].map(amount=>({amount,threeEpisodes:3*amount,lifetimeMaxAtFive:5*amount,typicalEnvironmentCost:14,existingResolutionReward:3,netAfterTypicalCost:3*amount+3-14}));
writeFileSync(new URL('./point-economy-baseline-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({theoretical:output.theoretical,students:Object.fromEntries(Object.entries(output.students).map(([mode,r])=>[mode,r.checkpoints])),comparisons:Object.fromEntries(Object.entries(output.comparisons).map(([k,r])=>[k,{total:r.total,types:r.types,stability:r.stability,earned:r.legacyEarned,spent:r.spent,points:r.points,actions:r.actions}])),blockedFixture:output.blockedFixture,candidates:output.candidates},null,2));
