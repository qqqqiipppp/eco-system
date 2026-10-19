import {organismById} from '../../data/organisms.js';
import {foodRelationById} from '../../data/food-relations.js';
import {learningGoalConfig,decomposerIds} from '../../data/learning-goals.js';
import {evaluateReplayEvidence} from './replay.js';
import {validateIntroduction,survivalStage} from './population.js';
import {placementConfig} from '../../data/interaction-config.js';
import {particle} from '../../data/student-text.js';

const completed=(s,id)=>s.activities.some(a=>a.activityId===id&&a.completed);
export const currentFoodRecords=s=>s.observations.map(o=>foodRelationById[o.relationId]).filter(Boolean);
export function connectedFoodChain(s){
 const records=currentFoodRecords(s);
 return records.some(a=>organismById[a.sourceSpeciesId].role==='producer'&&organismById[a.targetSpeciesId].role==='consumer'&&records.some(b=>a.targetSpeciesId===b.sourceSpeciesId&&organismById[b.targetSpeciesId].role==='consumer'));
}
export function evaluateLearningGoals(s){
 const records=currentFoodRecords(s),p=s.learningGoalProgress;
 return [
  {id:'food',label:s.round.number===1?'이어지는 먹이 관계 알아보기':'이번 숲의 주제 살펴보기',ok:s.round.number===1?connectedFoodChain(s):evaluateReplayEvidence(s).ok},
  {id:'roles',label:'생산자·소비자·분해자의 역할 알아보기',ok:records.some(r=>r.feedingMode==='resource')&&completed(s,'producer_quiz')&&completed(s,'decomposer_classify')&&Boolean(p.decomposer)},
  {id:'inquiry',label:'판단하고 실제 변화 확인하기',ok:p.inquiry?.phase==='confirmed'},
 ];
}
export function confirmDecomposerRole(s,id){
 if(s.goalRevision!==2||!decomposerIds.includes(id)||!s.organisms.some(o=>o.speciesId===id)||!(s.learningGoalProgress.work[id]>0)||!completed(s,'decomposer_classify'))return {ok:false,message:'분해자의 실제 활동과 역할을 먼저 살펴봐요.'};
 if(s.learningGoalProgress.decomposer)return {ok:true,message:'이미 이 숲의 분해 활동을 기록했어요.'};
 s.learningGoalProgress.decomposer={speciesId:id,at:s.simulationTime,processed:s.learningGoalProgress.work[id]};
 return {ok:true,message:organismById[id].name+'의 실제 분해 참여를 기록했어요. 포인트는 바뀌지 않아요.'};
}
export function inquiryPlant(s,id){
 const plant=s.organisms.find(o=>o.instanceId===id);
 return plant&&'foodStock'in plant&&currentFoodRecords(s).some(r=>r.sourceSpeciesId===plant.speciesId&&r.feedingMode==='resource')?plant:null;
}
export function inquiryChoices(s,id){
 const plant=inquiryPlant(s,id);if(!plant)return [];
 const bad=Object.keys(s.environment).filter(k=>s.environment[k].value<.4),weak=s.organisms.some(o=>['severe','weak'].includes(survivalStage(o))),intro=validateIntroduction(s,plant.speciesId);
 return [
  {id:'watch',label:'먹이와 환경이 괜찮아 지켜볼래요',available:!bad.length&&!weak,reason:'먹이가 오래 부족하거나 환경이 나쁘면 먼저 돌봐요.'},
  {id:'plant',label:particle(organismById[plant.speciesId].name,'을','를')+' 더 놓고 살펴볼래요',available:s.organisms.length<placementConfig.maxOrganisms&&intro.ok&&s.inventory.some(c=>c.speciesId===plant.speciesId&&c.acquired),reason:intro.message||'숲의 빈자리와 카드를 먼저 살펴봐요.'},
  {id:'care',label:'나쁜 환경부터 돌볼래요',available:bad.length>0,reason:'지금은 네 가지 환경이 모두 보통 이상이에요.'},
 ];
}
export function beginInquiry(s,id,choice){
 if(s.goalRevision!==2||s.learningGoalProgress.inquiry?.phase==='confirmed')return {ok:false,message:'이 숲의 변화 확인은 이미 마쳤어요.'};
 const plant=inquiryPlant(s,id),option=inquiryChoices(s,id).find(c=>c.id===choice);
 if(!plant||!option?.available)return {ok:false,message:option?.reason||'실제로 먹이가 된 식물을 먼저 살펴봐요.'};
 s.learningGoalProgress.inquiry={phase:'watching',choice,plantId:id,speciesId:plant.speciesId,at:s.simulationTime,stockBefore:plant.foodStock,environmentBefore:Object.fromEntries(Object.entries(s.environment).map(([k,v])=>[k,v.value])),managementBefore:s.managementActionCount,introducedIds:[],meal:null,outcome:null,confirmedAt:null};
 return {ok:true,message:'선택을 남겼어요. 숲으로 돌아가 실제 먹기와 먹이 회복을 살펴봐요.'};
}
export function noteGoalIntroduction(s,instance){
 const p=s.learningGoalProgress?.inquiry;
 if(s.goalRevision===2&&p?.phase==='watching'&&p.choice==='plant'&&p.speciesId===instance.speciesId&&!p.introducedIds.includes(instance.instanceId))p.introducedIds.push(instance.instanceId);
}
function careEvidence(s,p){
 if(p.choice!=='care')return true;
 if(s.managementActionCount<=p.managementBefore)return false;
 return s.managementHistory.some(r=>r.executedAt>=p.at&&r.cost>0&&['water-care','soil-care','habitat-care'].includes(r.actionId)&&Object.keys(p.environmentBefore).some(f=>p.environmentBefore[f]<.4&&s.environment[f].value>p.environmentBefore[f]&&[r.targetFactor,r.factor,r.sourceId].includes(f)));
}
export function advanceGoalInquiry(s,meals){
 if(s.goalRevision!==2)return;
 const p=s.learningGoalProgress.inquiry;if(p?.phase!=='watching')return;
 const targets=p.choice==='plant'?p.introducedIds:[p.plantId];
 if((p.choice!=='plant'||targets.length)&&!s.organisms.some(o=>targets.includes(o.instanceId))){p.phase='interrupted';return;}
 if(!careEvidence(s,p))return;
 for(const meal of meals)if(s.simulationTime>p.at&&targets.includes(meal.foodInstanceId)&&foodRelationById[meal.relationId]?.feedingMode==='resource'){
  const plant=s.organisms.find(o=>o.instanceId===meal.foodInstanceId);if(plant)p.meal={at:s.simulationTime,foodId:plant.instanceId,stockAfter:plant.foodStock};
 }
 if(!p.meal||s.simulationTime<=p.meal.at)return;
 const plant=s.organisms.find(o=>o.instanceId===p.meal.foodId);
 if(plant&&plant.foodStock>=p.meal.stockAfter+learningGoalConfig.recoveryDifference){p.phase='result';p.outcome={at:s.simulationTime,foodId:plant.instanceId,stock:plant.foodStock};}
}
export function confirmInquiry(s){
 const p=s.learningGoalProgress?.inquiry;
 if(s.goalRevision!==2||p?.phase!=='result'||!p.meal||!p.outcome)return {ok:false,message:'선택 뒤 실제 먹기와 먹이 회복을 더 살펴봐요.'};
 p.phase='confirmed';p.confirmedAt=s.simulationTime;
 return {ok:true,message:'선택 뒤 실제 먹기와 먹이 회복을 확인했어요. 이 숲의 탐구에 남겼어요.'};
}
