import {organismById} from '../../data/organisms.js';
import {activityById} from '../../data/activities.js';
import {decomposerIds} from '../../data/learning-goals.js';
import {foodRelationById} from '../../data/food-relations.js';
import {evaluateLearningGoals,inquiryPlant} from './learning-goals.js';
import {replayPlan} from './learning-guidance.js';
import {validateIntroduction} from './population.js';
import {placementConfig} from '../../data/interaction-config.js';
import {particle} from '../../data/student-text.js';

export function learningGoalAction(s){
 const has=id=>s.organisms.some(o=>o.speciesId===id),owns=id=>s.inventory.some(c=>c.speciesId===id&&c.acquired),done=id=>s.activities.some(a=>a.activityId===id&&a.completed);
 const place=id=>s.organisms.length>=placementConfig.maxOrganisms?{kind:'population',text:'숲이 가득 찼어요. 필요한 공간을 살펴봐요.',label:'자리 살펴보기'}:!owns(id)?{kind:'activity',id:Object.values(activityById).find(a=>a.unlockSpeciesId===id)?.activityId,text:organismById[id].name+'의 탐구 방법을 살펴봐요.',label:'짧은 활동'}:validateIntroduction(s,id).ok?{kind:'place',id,text:particle(organismById[id].name,'을','를')+' 놓고 실제 생활을 살펴봐요.',label:'놓기'}:{kind:'watch',text:validateIntroduction(s,id).message,label:''};
 const inspect=(o,text)=>({kind:'goal-inspect',id:o?.instanceId,speciesId:o?.speciesId||s.learningGoalProgress.inquiry?.speciesId,text,label:'살펴보기'});
 if(s.forestProgress.cleared)return null;
 const goals=evaluateLearningGoals(s),p=s.learningGoalProgress;
 for(const id of ['producer_quiz','decomposer_classify'])if(!done(id))return {kind:'activity',id,text:activityById[id].title+'를 실제 숲과 연결해 봐요.',label:'짧은 활동'};
 if(!goals[0].ok){
  if(s.round.number===1){
   for(const id of ['grass','grasshopper'])if(!has(id))return place(id);
   if(!s.observations.some(o=>o.relationId==='v2_grass_to_grasshopper'))return {kind:'watch',text:'방아깨비가 잎을 먹으면 💡에서 발견을 기록해요.',label:''};
   if(!owns('frog'))return {kind:'activity',id:'grass_observation',text:'실제 발견을 참개구리의 먹이 관계로 이어 봐요.',label:'짧은 활동'};
   if(!has('frog'))return place('frog');
   return {kind:'watch',text:'참개구리가 먹이를 먹으면 💡에서 이어지는 관계를 기록해요.',label:''};
  }
  const plan=replayPlan(s);
  for(const id of plan.needed)if(!has(id))return place(id);
  for(const id of plan.needed)if(['soil','producers'].includes(s.round.topic)&&!s.round.inspected.includes(id))return inspect(s.organisms.find(o=>o.speciesId===id),'이번 숲의 '+particle(organismById[id].name,'을','를')+' 살펴봐요.');
  return {kind:'watch',text:plan.description,label:''};
 }
 if(!s.observations.some(o=>foodRelationById[o.relationId]?.feedingMode==='resource')){
  for(const id of ['grass','grasshopper'])if(!has(id))return place(id);
  return {kind:'watch',text:'식물이 먹이가 되는 실제 모습을 💡에 기록해요.',label:''};
 }
 if(!p.decomposer){
  const worker=s.organisms.find(o=>decomposerIds.includes(o.speciesId)&&p.work[o.speciesId]>0);
  if(worker)return inspect(worker,'분해자가 실제로 처리한 유기물과 역할을 연결해 봐요.');
  if(!s.organisms.some(o=>decomposerIds.includes(o.speciesId)))return place('mushroom');
  return {kind:'watch',text:'분해자가 실제 유기물을 처리하는지 살펴봐요. 초기 숲에도 죽은 목재가 조금 있어요.',label:''};
 }
 const q=p.inquiry;
 if(q?.phase!=='confirmed'){
  const plant=s.organisms.find(o=>inquiryPlant(s,o.instanceId));
  if(q?.phase==='result')return inspect(s.organisms.find(o=>o.instanceId===q.plantId),'선택 뒤 실제 먹기와 먹이 회복이 있었어요. 결과를 살펴봐요.');
  if(q?.phase==='watching')return inspect(plant,q.meal?'먹이가 된 뒤 다시 회복하는지 숲을 살펴봐요.':'고른 식물이 실제 먹이가 되는지 살펴봐요. 선택은 다시 고를 수 있어요.');
  if(plant)return inspect(plant,'실제로 먹이가 된 식물을 살펴보고 어떻게 할지 골라요.');
  return place('grass');
 }
 for(const role of ['producer','consumer','decomposer'])if(!s.organisms.some(o=>organismById[o.speciesId].role===role))return place({producer:'grass',consumer:'grasshopper',decomposer:'mushroom'}[role]);
 return {kind:'watch',text:'탐구를 마쳤어요. 생물의 역할과 환경이 알맞게 유지되는지 살펴봐요.',label:''};
}
