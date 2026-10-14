import assert from 'node:assert/strict';
import {createGameState} from '../js/state/game-state.js';
import {activities,activityById} from '../data/activities.js';
import {organisms} from '../data/organisms.js';
import {managementActions} from '../data/management-actions.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createEventSystem} from '../js/systems/events.js';
import {completeActivity} from '../js/systems/activities.js';
import {activityCondition} from '../js/systems/activity-rules.js';
import {placeOrganism} from '../js/systems/placement.js';
import {evaluateStability} from '../js/systems/stability.js';
import {evaluateForestGoal,updateForestGoal} from '../js/systems/forest-progress.js';
import {availableManagement,availableEnvironmentalRecovery,executeManagement} from '../js/systems/management.js';
import {currentEnvironmentEvent,chooseEnvironmentObservation} from '../js/systems/environment-events.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {populationCounts} from '../js/systems/lifecycle.js';
import {world,make,layout,emptyMemory,legacySave} from './ecology-fixtures.mjs';
import {pointEconomyConfig,legacyRewardAmounts} from '../data/point-economy.js';
import {createPointEconomyState} from '../js/state/point-economy-state.js';
import {foodRelations} from '../data/food-relations.js';
import {environmentFactors} from '../data/environment-config.js';

export {layout,emptyMemory};
export const actualCosts=s=>s.pointEconomy?.totals.spent??s.managementHistory.reduce((sum,r)=>sum+r.cost,0);
export function introduce(s,id,x=.44){
 const response=placeOrganism(s,id,{position:{x,y:.72},isPlayArea:true,isUI:false},layout);
 return response;
}
export function freshStudent({earlySpending=false}={}){
 const s=createGameState();assert.equal(s.metrics.points,0);
 if(!earlySpending)for(const x of [.32,.4,.62,.68])assert(introduce(s,'grass',x).ok);
 assert(introduce(s,'grasshopper',earlySpending?.08:.44).ok);
 if(earlySpending)assert(introduce(s,'grasshopper',.09).ok);
 return s;
}
// The same IDs and coordinates as the stage12 comparison, never a student unlock.
export function comparisonForest(kind='representative'){
 const groups=[['oak',2,.65],['grass',5,.2],['grasshopper',6,.4],['frog',1,.45],['mushroom',1,.7]];
 const s=kind==='mixed'?world(organisms.filter(o=>o.id!=='earthworm').map((o,i)=>[o.id,1,.22+(i%5)*.035]),'long'):world(kind==='core'?groups:[...groups,['rabbit',2,.32]],kind==='core'?'long':'representative');
 if(kind==='mixed')s.organisms.push(...Array.from({length:3},(_,i)=>make('grass','extra-grass'+i,.45+i*.03)),...Array.from({length:3},(_,i)=>make('grasshopper','extra-gh'+i,.48+i*.03)),make('aphid','extra-aphid',.35));
 s.observations=['v2_grass_to_grasshopper','v2_grasshopper_to_frog'].map(relationId=>({relationId,eventId:'fixture-prior',discoveredAt:0}));
 s.rewardHistory=s.observations.map(o=>({rewardId:'observation:'+o.relationId,grantedAt:0,sourceId:'fixture-prior',amount:12}));
 s.metrics.stability=evaluateStability(s).score;
 for(const d of activities)assert(completeActivity(s,d.activityId,d.correctAnswer).ok);
 s.metrics.points=30;s.pointEconomy=createPointEconomyState(30,0,0,s.rewardHistory.map(r=>r.rewardId));return s;
}
export function exhaustedForest({points=0,factors=Object.keys(environmentFactors),empty=false}={}){
 const s=comparisonForest('core');s.metrics.points=points;
 s.inventory.forEach(c=>c.acquired=['oak','grass','grasshopper','frog','mushroom','rabbit'].includes(c.speciesId));
 s.observations=foodRelations.filter(r=>s.inventory.find(c=>c.speciesId===r.sourceSpeciesId)?.acquired&&s.inventory.find(c=>c.speciesId===r.targetSpeciesId)?.acquired).map(r=>({relationId:r.relationId,eventId:'fixture-prior',discoveredAt:0}));
 s.rewardHistory=[...legacyRewardAmounts].filter(([id])=>!id.startsWith('observation:')||id.startsWith('observation:v2_')).map(([rewardId,amount])=>({rewardId,amount,sourceId:'fixture-prior',grantedAt:0}));
 s.pointEconomy=createPointEconomyState(points,0,0,s.rewardHistory.map(r=>r.rewardId));
 for(const factor of factors)s.environment[factor].value=.15;
 if(empty)s.organisms=[];s.forestProgress={cleared:false,clearedAt:null,stableSeconds:0};return s;
}
export function blockedPriorSave(version){
 if(version>=10){const s=exhaustedForest(),raw=createSaveSnapshot(s,emptyMemory,'2000-01-01T00:00:00Z');raw.schemaVersion=raw.domain.schemaVersion=version;delete raw.domain.pointEconomy;
  if(version<12)delete raw.domain.environmentEvents;if(version<11){delete raw.domain.development;for(const o of raw.domain.organisms)delete o.development;}return raw;
 }
 const raw=legacySave(version),d=raw.domain,core=['oak','grass','grasshopper','frog','mushroom'];
 d.organisms=d.organisms.filter(o=>core.includes(o.speciesId));d.inventory.forEach(c=>c.acquired=core.includes(c.speciesId));
 const rabbit=d.activities.find(a=>a.activityId==='rabbit_habitat');Object.assign(rabbit,{completed:false,completedAt:null});d.rewardHistory=d.rewardHistory.filter(r=>r.rewardId!=='activity:rabbit_habitat');
 for(const f of ['sunlight','water','air','soil'])d.rewardHistory.push({rewardId:`question:producer_${f}_limit`,sourceId:'old',grantedAt:500,amount:10});
 d.environment={sunlight:{value:.15},water:{value:1},air:{value:1},soil:{value:1}};d.metrics.points=0;d.forestProgress={cleared:false,clearedAt:null,stableSeconds:0};return raw;
}
export function learn(s,events,{maintain=true,earlySpending=false,includeRabbit=true}={}){
 for(const e of s.events.filter(e=>e.status==='active'&&(e.kind==='question'||e.kind==='insight'))){
  if(e.payload.environmentEventId)continue;
  const answer=e.payload.choices?.find(c=>c.correct)?.id;
  assert(events.acknowledge(s,e.eventId,answer).ok);
 }
 for(const d of activities){
  if(!includeRabbit&&d.activityId==='rabbit_habitat')continue;
  if(s.activities.find(p=>p.activityId===d.activityId).completed)continue;
  if(activityCondition(s,d.activityId,d.correctAnswer).ok)assert(completeActivity(s,d.activityId,d.correctAnswer).ok);
 }
 if(!maintain)return;
 const has=id=>s.organisms.some(o=>o.speciesId===id),acquired=id=>s.inventory.some(c=>c.speciesId===id&&c.acquired);
 if(!has('mushroom')&&acquired('mushroom'))introduce(s,'mushroom',.67);
 if(includeRabbit&&!has('rabbit')&&acquired('rabbit'))introduce(s,'rabbit',.4);
 if(!has('frog')&&acquired('frog'))introduce(s,'frog',.44);
 if(earlySpending&&s.simulationTime<300)return;
 const grasses=s.organisms.filter(o=>o.speciesId==='grass');
 if(grasses.length<3)for(const x of [.32,.4,.48,.62]){if(introduce(s,'grass',x).ok)break;}
 if(!has('grasshopper')){
  const grass=s.organisms.find(o=>o.speciesId==='grass'&&o.foodStock>0);
  if(grass)introduce(s,'grasshopper',Math.min(.68,grass.position.x+.02));
 }
}
export function manage(s,events,{mode='observe',oncePerEpisode=false}={}){
 if(mode==='observe')return;
 const current=currentEnvironmentEvent(s);
 const selected=mode==='episode'?{drought:'water-care',cloudy:'habitat-care','air-pollution':'habitat-care','soil-damage':'soil-care'}[current?.kind]:null;
 if(mode==='episode'&&!selected)return;
 const candidates=s.events.filter(e=>e.status==='active'&&e.kind==='alert'&&(mode!=='episode'||e.payload.factor===current?.factor));
 for(const e of candidates){
  for(const option of availableManagement(s,e.eventId).filter(a=>a.available)){
   if(selected&&option.actionId!==selected)continue;
   if(oncePerEpisode&&current?.responses.some(r=>r.actionId===option.actionId))continue;
   if(current?.kind==='rain'&&option.actionId==='water-care')continue;
   if(mode==='normal'&&option.actionId==='food-support'&&!e.payload.urgent)continue;
   const answer=executeManagement(s,option.actionId,e.eventId);
   assert(answer.ok);if(mode==='episode')chooseEnvironmentObservation(s,current.eventId,'observe');events.refresh(s);return answer;
  }
 }
 for(const option of availableEnvironmentalRecovery(s).filter(o=>o.available)){
  if(oncePerEpisode&&current?.responses.some(r=>r.actionId==='habitat-care'))continue;
  if(mode==='episode'&&(selected!=='habitat-care'||option.factor!==current.factor))continue;
  const answer=executeManagement(s,'habitat-care',{sourceType:'environment',sourceId:option.factor});assert(answer.ok);if(mode==='episode')chooseEnvironmentObservation(s,current.eventId,'observe');events.refresh(s);return answer;
 }
}
export function runEconomy(s,minutes,{mode='observe',student=false,earlySpending=false,includeRabbit=true,maintain=student,enabled=true,memory,checkpointEvery=10,onTick,onEpisode,study}={}){
 const start=s.simulationTime,pointsBefore=s.metrics.points,spentBefore=actualCosts(s),rewardBefore=s.rewardHistory.length,actionBefore=s.managementActionCount,studyBefore=s.pointEconomy.totals.study,supportBefore=s.pointEconomy.totals.support;
 const f=createFeedingSystem(start,{environmentEventsEnabled:enabled}),events=createEventSystem(start,memory),meals={},checkpoints=[],initial=populationCounts(s);let peak=s.organisms.length;
 const report=()=>({minutes:(s.simulationTime-start)/60,activeSeconds:s.simulationTime,initial,final:populationCounts(s),types:Object.keys(populationCounts(s)).length,total:s.organisms.length,stability:evaluateStability(s).score,
  environment:Object.fromEntries(Object.entries(s.environment).map(([k,v])=>[k,v.value])),pointsStart:pointsBefore,legacyEarned:s.rewardHistory.slice(rewardBefore).reduce((sum,r)=>sum+r.amount,0),
  spent:actualCosts(s)-spentBefore,points:s.metrics.points,newEarned:s.pointEconomy.totals.study-studyBefore,supportGranted:s.pointEconomy.totals.support-supportBefore,actions:s.managementActionCount-actionBefore,rewards:structuredClone(s.rewardHistory),management:structuredClone(s.managementHistory),economy:structuredClone(s.pointEconomy),
  episodes:structuredClone(s.environmentEvents.history),meals:{...meals},growth:structuredClone(s.development),life:s.organisms.map(o=>({id:o.instanceId,life:structuredClone(o.life),development:structuredClone(o.development)})),
  pending:structuredClone(s.population.breeding),changes:structuredClone(s.population.totals),currentlyGoalReady:evaluateForestGoal(s).ready,cleared:s.forestProgress.cleared,peak,errors:0});
 for(let tick=0;tick<minutes*120;tick++){
  for(let step=0;step<5;step++){
   const result=f.update(s,.1,layout);if(!result.ticked)continue;
   for(const e of result.feedingEvents)meals[e.relationId]=(meals[e.relationId]||0)+1;
   events.update(s,.5,result.feedingEvents);s.metrics.stability=evaluateStability(s).score;
   if(student)learn(s,events,{maintain,earlySpending,includeRabbit});
   else for(const e of s.events.filter(e=>e.status==='active'&&e.payload.developmentSequence))events.acknowledge(s,e.eventId);
   if(earlySpending&&s.simulationTime===300)for(const x of [.1,.17])introduce(s,'grass',x);
   const episode=currentEnvironmentEvent(s)||s.environmentEvents.history.at(-1);
   if(episode&&(student||mode!=='normal'||episode.kind==='rain'||episode.phase==='recovering'))chooseEnvironmentObservation(s,episode.eventId,episode.kind==='rain'||mode==='observe'?'wait':'observe');
   if(mode!=='observe')manage(s,events,{mode:!student&&mode==='normal'?'episode':mode,oncePerEpisode:mode==='normal'});
   if(study)study(s,episode);
   if(onEpisode)onEpisode(s,episode);
   if(onTick)onTick(s,events);
   s.metrics.stability=evaluateStability(s).score;updateForestGoal(s,.5);peak=Math.max(peak,s.organisms.length);
  }
  assert(s.organisms.length<=30);assert(s.metrics.points>=0);
  if(checkpointEvery&&((tick+1)%(checkpointEvery*120)===0||(s.simulationTime-start)===35*60))checkpoints.push(report());
 }
 return {state:s,report:report(),checkpoints,memory:events.exportMemory(),snapshot:createSaveSnapshot(s,events.exportMemory(),'2000-01-01T00:00:00Z')};
}
export function saveRoundTrip(s,memory=emptyMemory){const loaded=decodeSave(JSON.stringify(createSaveSnapshot(s,memory,'2000-01-01T00:00:00Z')));assert.equal(loaded.status,'loaded');return loaded;}
