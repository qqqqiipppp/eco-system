import {reader,tracker,study} from './balance-fixtures.mjs';
import {freshStudent,runEconomy,introduce} from './point-economy-fixtures.mjs';
import {confirmDecomposerRole,beginInquiry,inquiryPlant,confirmInquiry,inquiryChoices} from '../js/systems/learning-goals.js';
import {decomposerIds} from '../data/learning-goals.js';
import {recordSpeciesObservation} from '../js/state/collection-state.js';
import {foodRelations} from '../data/food-relations.js';
import {activities} from '../data/activities.js';
import {discoveryEvents} from '../data/event-config.js';

export function goalStudent({cadence=.5,choice='watch'}={}){
 let last=-60;const actions=[];
 const tick=s=>{
  if(s.goalRevision!==2||s.simulationTime-last<cadence)return;last=s.simulationTime;
  if(!s.learningGoalProgress.decomposer){const worker=s.organisms.find(o=>decomposerIds.includes(o.speciesId)&&s.learningGoalProgress.work[o.speciesId]>0);if(worker){recordSpeciesObservation(s,worker.instanceId);const r=confirmDecomposerRole(s,worker.speciesId);if(r.ok)actions.push({kind:'role',at:s.simulationTime,species:worker.speciesId});}}
  const q=s.learningGoalProgress.inquiry;
  if(q?.phase==='result'){const r=confirmInquiry(s);if(r.ok)actions.push({kind:'result',at:s.simulationTime});}
  else if(!q||q.phase==='interrupted'){
   const plant=s.organisms.find(o=>inquiryPlant(s,o.instanceId));
   if(plant){const available=inquiryChoices(s,plant.instanceId).filter(c=>c.available),selected=available.find(c=>c.id===choice)||available[0];if(selected){recordSpeciesObservation(s,plant.instanceId);const r=beginInquiry(s,plant.instanceId,selected.id);if(r.ok){actions.push({kind:'choice',at:s.simulationTime,choice:selected.id});if(selected.id==='plant'){const consumer=s.organisms.find(o=>foodRelations.some(r=>r.sourceSpeciesId===plant.speciesId&&r.targetSpeciesId===o.speciesId&&r.feedingMode==='resource'));for(const x of [consumer?.position.x??.44,.32,.48,.62,.68])if(introduce(s,plant.speciesId,x).ok)break;}}}}
  }
 };
 return {tick,actions};
}
export function learningProfile(kind,revision=2,minutes=20){
 const s=freshStudent();s.goalRevision=revision;
 const track=tracker(s),model=['fast','normal','wrong'].includes(kind)?reader(kind==='wrong'?'normal':kind,{wrong:kind==='wrong'?2:0}):null;
 const goal=goalStudent({cadence:kind==='instant'?.5:kind==='normal'||kind==='wrong'?30:15,choice:kind==='manager'?'plant':'watch'});
 let clearInteractions=null;
 const options={checkpointEvery:0,student:!model,mode:kind==='manager'||kind==='instant'?'normal':'observe',includeRabbit:kind!=='minimal',study,onTick:(s,e)=>{model?.onTick(s,e);goal.tick(s);track.tick(s,e);if(s.forestProgress.cleared&&!clearInteractions)clearInteractions=measureInteractions(s,model,goal);}};
 const r=runEconomy(s,minutes,options);
 return {state:s,result:r,metrics:{...track.finish(r),kind,goalRevision:revision,goalActions:goal.actions,clearInteractions,proof:structuredClone(s.learningGoalProgress),wrongAnswers:model?.answers.filter(a=>!a.ok).length||0,model:model?.assumptions||{cadence:kind==='instant'?.5:15,actualStudent:false}}};
}
function measureInteractions(s,model,goal){
 const placements=s.population.history.filter(r=>['placement','reintroduction'].includes(r.cause)).length,learning=s.activities.filter(a=>a.completed).length,records=s.observations.length,decisions=goal.actions.length,failed=model?.answers.filter(a=>!a.ok).length||0;
 const activityCharacters=activities.filter(a=>s.activities.some(p=>p.activityId===a.activityId&&p.completed)).reduce((n,a)=>n+[a.title,a.prompt,...(a.choices||[]).map(c=>c.label),a.learningOutcome].join('').length,0);
 const discoveryCharacters=s.observations.reduce((n,o)=>{const d=discoveryEvents[o.relationId];return n+(d?[d.title,d.message].join('').length:0);},0);
 return {placements,learning,records,failedAttempts:failed,goalDecisions:decisions,paidCare:s.managementActionCount,semanticActions:placements+learning+records+decisions+s.managementActionCount+failed,
  modeledTouches:(placements+learning+records+decisions+failed)*3+s.managementActionCount*2,
  touchAssumptions:'3 per place/card-clear, open-answer-close, record, goal decision or failed attempt;2 per paid care; navigation/optional reading excluded. Not measured UI touches.',
  modeledDialogOpens:learning+records+decisions+failed+s.managementActionCount,
  authoredTextCharacters:activityCharacters+discoveryCharacters,
  textScope:'Completed activity title/prompt/choices/outcome plus recorded discovery title/message; excludes chrome, goal inspection prose, retry rereading and hidden details. Source text count, not total UI reading.',
  biologicalInquiryWait:s.learningGoalProgress.inquiry?.outcome?s.learningGoalProgress.inquiry.outcome.at-s.learningGoalProgress.inquiry.at:null};
}
