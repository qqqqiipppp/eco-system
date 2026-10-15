
import {createGameState} from '../js/state/game-state.js';
import {cardUnlocks} from '../data/card-unlocks.js';import {activities} from '../data/activities.js';
import {foodRelations,foodRelationById} from '../data/food-relations.js';import {organismById} from '../data/organisms.js';
import {completeActivity} from '../js/systems/activities.js';import {activityCondition} from '../js/systems/activity-rules.js';
import {recordSpeciesObservation} from '../js/state/collection-state.js';import {nextAction} from '../js/systems/goal-guidance.js';
import {claimEnvironmentStudy,studyCandidates,studyRecovery} from '../js/systems/point-economy.js';import {chooseEnvironmentObservation} from '../js/systems/environment-events.js';
import {runEconomy,freshStudent,introduce} from './point-economy-fixtures.mjs';import {explore,replayStudent,nextForest,reload} from './replay-fixtures.mjs';import {measure,mixed24,comparisonForest} from './pacing-fixtures.mjs';
export {runEconomy,freshStudent,introduce,explore,replayStudent,nextForest,reload,measure,mixed24,comparisonForest};
const schedule={fast:{cadence:15,times:{producer_quiz:60,grass_observation:180,rabbit_habitat:240,decomposer_classify:720},interests:['pine','caterpillar','tit','raspberry']},normal:{cadence:30,times:{producer_quiz:90,grass_observation:300,rabbit_habitat:420,decomposer_classify:900},interests:['pine','raspberry']},slow:{cadence:45,times:{producer_quiz:120,grass_observation:420,rabbit_habitat:600,decomposer_classify:1260},interests:['pine']}};
export const modelAssumptions=structuredClone(schedule);
export function study(s){for(const r of studyCandidates(s))claimEnvironmentStudy(s,r.eventId,{factor:r.factor,recovery:studyRecovery(r)});}
const has=(s,id)=>s.organisms.some(o=>o.speciesId===id),owns=(s,id)=>s.inventory.some(c=>c.speciesId===id&&c.acquired);
export function reader(mode='normal',{wrong=0,collect=false}={}){
 const plan=schedule[mode],tried={},answers=[],model={last:-60};
 const act=(s,a)=>{const p=s.activities.find(p=>p.activityId===a.activityId);if(p.completed)return;
  tried[a.activityId]=(tried[a.activityId]||0)+1;const answer=a.choices?(tried[a.activityId]<=wrong?a.choices.find(c=>c.id!==a.correctAnswer).id:a.correctAnswer):undefined;
  const r=completeActivity(s,a.activityId,answer);answers.push({id:a.activityId,at:s.simulationTime,ok:r.ok});
 };
 const onTick=(s,e)=>{
  if(s.simulationTime-model.last<plan.cadence)return;model.last=s.simulationTime;
  for(const ev of s.events.filter(v=>v.status==='active'&&(v.kind==='question'||v.kind==='insight'))){if(ev.payload.environmentEventId)continue;e.acknowledge(s,ev.eventId,ev.payload.choices?.find(c=>c.correct)?.id);}
  for(const a of activities.filter(a=>!a.collection))if(s.simulationTime>=plan.times[a.activityId]&&activityCondition(s,a.activityId,a.correctAnswer).ok)act(s,a);
  for(const id of ['mushroom','soil-bacteria','frog','rabbit'])if(owns(s,id)&&!has(s,id))introduce(s,id,.44);
  if(s.organisms.filter(o=>o.speciesId==='grass').length<3)for(const x of [.32,.4,.48,.62])if(introduce(s,'grass',x).ok)break;
  if(!has(s,'grasshopper')){const grass=s.organisms.find(o=>o.speciesId==='grass'&&o.foodStock>0);if(grass)introduce(s,'grasshopper',Math.min(.68,grass.position.x+.02));}
  for(const o of s.organisms)if(!s.profile.speciesObservations[o.speciesId])recordSpeciesObservation(s,o.instanceId);
  if(collect)explore(s,e);
  else for(const a of cardUnlocks.filter(a=>plan.interests.includes(a.unlockSpeciesId))){
   for(const id of a.inspect)if(owns(s,id)&&!has(s,id))for(const x of [.16,.7,.82,.32,.58])if(introduce(s,id,x).ok)break;
   for(const rid of [...(a.relationIds||[]),...(a.relationId?[a.relationId]:[])]){const r=foodRelationById[rid];for(const id of [r.sourceSpeciesId,r.targetSpeciesId])if(owns(s,id)&&!has(s,id))introduce(s,id,.44);}
   if(activityCondition(s,a.activityId,a.correctAnswer).ok)act(s,a);
  }
  const env=s.environmentEvents.history.at(-1);if(env)chooseEnvironmentObservation(s,env.eventId,'wait');study(s);
 };
 return {onTick,answers,assumptions:{mode,...structuredClone(plan),wrongFirstAttempts:wrong,multipleActionsPerDecision:true,actualStudent:false}};
}
// Meaningful choices exclude repeat selection/clicks. Availability is a test-only
// operational indicator, not a measure of a child's understanding or enjoyment.
export function tracker(s){const times={firstFood:null,firstNew:null,requiredLearning:null,firstGrowth:null,firstEnvironment:null,firstDecomposer:null},newCards=[],seen=new Set(),samples=[],hints=[],knownBefore=new Set(s.inventory.filter(c=>c.acquired).map(c=>c.speciesId));let zeroChoiceSeconds=0,optionsTotal=0,optionSamples=0,maxOptions=0,noticeCount=0,peakActive=0,clearEvidence=null;const noticesByKind={};
 const tick=(s,e)=>{
  for(const o of s.observations)if(times.firstFood===null)times.firstFood=o.discoveredAt;
  for(const c of s.inventory.filter(c=>c.acquired&&!knownBefore.has(c.speciesId))){knownBefore.add(c.speciesId);newCards.push({speciesId:c.speciesId,at:s.simulationTime});if(c.speciesId!=='frog'&&c.speciesId!=='rabbit'&&times.firstNew===null)times.firstNew=s.simulationTime;}
  if(times.requiredLearning===null&&['producer_quiz','decomposer_classify','grass_observation'].every(id=>s.activities.some(a=>a.activityId===id&&a.completed)))times.requiredLearning=s.simulationTime;
  if(times.firstGrowth===null&&s.events.some(v=>v.payload.developmentSequence))times.firstGrowth=s.simulationTime;
  if(times.firstEnvironment===null&&s.environmentEvents.history.length)times.firstEnvironment=s.environmentEvents.history[0].startedAt;
  if(times.firstDecomposer===null&&['mushroom','soil-bacteria','litter-mold'].some(id=>s.profile.speciesObservations[id]))times.firstDecomposer=s.simulationTime;
  if(s.forestProgress.cleared&&!clearEvidence)clearEvidence={at:s.forestProgress.clearedAt,foodRelations:s.observations.map(r=>r.relationId),activities:s.activities.filter(a=>a.completed).map(a=>a.activityId),environmentEpisodes:s.environmentEvents.history.length,growthOpportunity:times.firstGrowth!==null&&times.firstGrowth<=s.forestProgress.clearedAt,decomposerInspected:['mushroom','soil-bacteria','litter-mold'].filter(id=>s.profile.speciesObservations[id]),processed:s.decomposition.processed,managementActions:s.managementActionCount};
  const live=s.events.filter(v=>v.status==='active');for(const ev of live){const key=ev.key||ev.eventId;if(!seen.has(key)){seen.add(key);noticeCount++;noticesByKind[ev.kind]=(noticesByKind[ev.kind]||0)+1;}}
  peakActive=Math.max(peakActive,live.length);
  const learn=activities.filter(a=>!s.activities.find(p=>p.activityId===a.activityId).completed&&activityCondition(s,a.activityId,a.correctAnswer).ok).length;
  const observe=s.organisms.filter(o=>!s.profile.speciesObservations[o.speciesId]).length;
  const record=live.filter(v=>v.kind==='insight'||v.kind==='question').length;
  const place=['grass','grasshopper','mushroom','frog'].filter(id=>owns(s,id)&&!has(s,id)&&s.organisms.length<30).length;
  const options=learn+observe+record+place;optionsTotal+=options;optionSamples++;maxOptions=Math.max(maxOptions,options);if(options===0)zeroChoiceSeconds+=.5;
  if(!samples.length||s.simulationTime-samples.at(-1).at>=60)samples.push({at:s.simulationTime,options,acquired:s.inventory.filter(c=>c.acquired).length,points:s.metrics.points,stability:s.metrics.stability});
  if([.5,240,600,960].includes(s.simulationTime))hints.push({at:s.simulationTime,text:nextAction(s)});
 };
 const finish=r=>({times,newCards,novel17:newCards.filter(c=>c.speciesId!=='frog'&&c.speciesId!=='rabbit').length,clearAt:r.state.forestProgress.clearedAt,cleared:r.state.forestProgress.cleared,points:r.state.metrics.points,careSpent:r.state.round.care.spent,acquired:r.state.inventory.filter(c=>c.acquired).length,observed:Object.keys(r.state.profile.speciesObservations).length,food:r.state.profile.relations.length,roundFood:r.state.observations.length,environmentBeforeClear:r.state.forestProgress.clearedAt!==null&&times.firstEnvironment!==null&&times.firstEnvironment<=r.state.forestProgress.clearedAt,meaningfulActions:r.state.population.history.filter(p=>['placement','reintroduction','release'].includes(p.cause)).length+r.state.observations.length+r.state.activities.filter(a=>a.completed).length+Object.keys(r.state.profile.speciesObservations).length+r.state.managementActionCount,availableChoiceIndicator:{average:optionsTotal/Math.max(1,optionSamples),max:maxOptions,zeroChoiceSeconds,definition:'unfinished eligible learning + uninspected living instances + pending insight/question + missing owned core placement; optional UI browsing excluded'},noticesUnique:noticeCount,noticesByKind,peakActive,clearEvidence,samples,hints,population:r.report.final,meals:r.report.meals,processed:r.state.decomposition.processed,wormProcessed:r.state.decomposition.earthwormProcessed,soilContribution:r.state.decomposition.soilContribution,episodes:r.report.episodes.map(e=>({kind:e.kind,at:e.startedAt,phase:e.phase})),earned:r.report.legacyEarned+r.report.newEarned,spent:r.report.spent,peak:r.report.peak});
 return {tick,finish};
}
export function capture(kind,minutes=20){const s=freshStudent(),track=tracker(s);let model,options={checkpointEvery:0};
 if(kind==='instant')options={...options,student:true,mode:'normal',study};
 else if(kind==='collector')options={...options,student:true,onTick:explore};
 else if(kind==='manager')options={...options,student:true,mode:'normal',study};
 else {model=reader(kind==='wrong'?'normal':kind,{wrong:kind==='wrong'?2:0});options.onTick=model.onTick;}
 const custom=options.onTick;options.onTick=(s,e)=>{custom?.(s,e);track.tick(s,e);};
 const r=runEconomy(s,minutes,options);return {result:r,metrics:{...track.finish(r),model:model?.assumptions||{instantCorrectAnswers:true,actualStudent:false},wrongAnswers:model?.answers.filter(a=>!a.ok).length||0}};
}
