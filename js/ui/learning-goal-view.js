import {organismById} from '../../data/organisms.js';
import {decomposerIds} from '../../data/learning-goals.js';
import {confirmDecomposerRole,inquiryPlant,inquiryChoices,beginInquiry,confirmInquiry} from '../systems/learning-goals.js';
import {qualityLabel} from '../systems/environment.js';
import {foodStockCapacity} from '../systems/food-resources.js';
import {particle} from '../../data/student-text.js';

// A small section inside the existing inspection dialog. Rendering is read-only;
// only an explicit choice/confirmation writes evidence. No new modal or clock.
export function createLearningGoalView(state,{onChange,onPlace,onCare}){
 const panel=document.querySelector('#population-inquiry'),dialog=document.querySelector('#population-dialog');
 let selected=null,signature='';
 function button(label,action,disabled=false,key=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.dataset.goalAction=key;b.addEventListener('click',action);panel.append(b);}
 function text(value){const p=document.createElement('p');p.textContent=value;panel.append(p);}
 function changed(result){onChange(result);signature='';render(selected?.speciesId,selected);}
 function render(speciesId,instance){
  selected=instance||{speciesId};panel.hidden=state.goalRevision!==2;if(panel.hidden)return;
  const p=state.learningGoalProgress,q=p.inquiry,work=p.work[speciesId]||0;
  const stock=instance&&'foodStock'in instance?(instance.foodStock/foodStockCapacity(instance)>.6?'충분해요':instance.foodStock>0?'줄어 있어요':'거의 없어요'):null;
  const environment=Object.entries({sunlight:'햇빛',water:'물',air:'공기',soil:'토양'}).map(([key,name])=>name+' '+qualityLabel(state.environment[key].value)).join(' · ');
  const next=JSON.stringify([speciesId,instance?.instanceId,stock,environment,work>0,!!p.decomposer,state.activities.find(a=>a.activityId==='decomposer_classify')?.completed,q?.phase,q?.choice,q?.meal?.at,instance?inquiryChoices(state,instance.instanceId):[]]);
  if(signature===next)return;signature=next;panel.replaceChildren();
  if(decomposerIds.includes(speciesId)){
   text(work>0?particle(organismById[speciesId].name,'이','가')+' 이 숲의 유기물을 실제로 분해하는 데 참여했어요. 양분은 식물이 다시 이용해요.':'이 분해자가 실제로 처리한 유기물은 아직 확인되지 않았어요. 자원과 환경을 살펴봐요.');
   if(p.decomposer)text('분해자의 역할을 이 숲의 탐구에 남겼어요.');
   else if(!state.activities.find(a=>a.activityId==='decomposer_classify')?.completed)text('미션 활동에서 구름송편버섯의 역할을 알아봐요.');
   else button('실제 분해와 역할을 확인했어요',()=>changed(confirmDecomposerRole(state,speciesId)),!work,'decomposer');
  }else if(organismById[speciesId]?.role==='producer'){
   if(stock)text('이 식물의 먹이 자원은 '+stock+'. '+environment);
   if(q?.phase==='confirmed')text('선택 뒤 실제 먹기와 먹이 회복을 확인했어요.');
   else if(q?.phase==='result'){
    text(particle(organismById[q.speciesId].name,'을','를')+' 실제로 먹은 뒤, 그 식물의 먹이 자원이 다시 늘었어요. 알맞은 환경과 생산자의 먹이 공급을 연결해 봐요.');
    button('선택 뒤 변화를 확인했어요',()=>changed(confirmInquiry(state)),false,'confirm');
   }else if(q?.phase==='watching'){
    text(q.meal?'실제로 먹은 모습을 확인했어요. 숲으로 돌아가 그 식물의 먹이 회복도 살펴봐요.':q.choice==='plant'?'먹이를 찾는 동물 가까이에 식물을 놓아요. 새로 놓은 식물이 먹이가 되는지 살펴보고, 필요하면 선택을 다시 골라요.':'선택을 남겼어요. 숲에서 이 식물을 실제로 먹고 먹이가 회복되는지 살펴봐요.');
    if(q.choice==='plant'&&!q.introducedIds.length)button('고른 식물 놓으러 가기',()=>{dialog.close();onPlace(q.speciesId)},false,'place');
    if(q.choice==='care')button('환경 살펴보기',()=>{dialog.close();onCare()},false,'care');
    button('관찰 대상을 다시 고르기',()=>{p.inquiry=null;changed({ok:true,message:'지금 숲을 살펴보고 다시 판단해요.'})},false,'retry');
   }else if(instance&&inquiryPlant(state,instance.instanceId)){
    text(q?.phase==='interrupted'?'관찰하던 식물이 없어졌어요. 지금 숲에서 다시 골라요.':'이 종류의 식물이 먹이가 된 발견을 기록했어요. 지금 먹이와 환경을 살펴보고 어떻게 할지 골라요.');
    for(const choice of inquiryChoices(state,instance.instanceId))if(choice.available)button(choice.label,()=>{const r=beginInquiry(state,instance.instanceId,choice.id);changed(r);if(r.ok){dialog.close();if(choice.id==='plant')onPlace(speciesId);if(choice.id==='care')onCare();}},false,choice.id);
   }else text('이 식물이 실제로 먹이가 된 발견을 먼저 기록해요.');
  }else text('소비자가 먹이를 이용하는 모습을 숲의 💡에서 기록해 봐요.');
 }
 return {render};
}
