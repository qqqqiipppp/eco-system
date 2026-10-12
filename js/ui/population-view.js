import {organisms,organismById,roleLabels} from '../../data/organisms.js';
import {survivalStage,populationMessage,validateIntroduction} from '../systems/population.js';
import {reproductionRules} from '../../data/population-config.js';

export function createPopulationView(state,onRelease){
 const dialog=document.querySelector('#population-dialog'),select=document.querySelector('#population-species'),release=document.querySelector('#population-release');
 let confirmation=null;
 for(const species of organisms){const option=document.createElement('option');option.value=species.id;option.textContent=species.name;select.append(option);}
 const labels={normal:'현재는 정상 상태예요.',hungry:'먹이를 찾고 있어요.',severe:'먹이가 오랫동안 부족해요.',weak:'쇠약해졌어요. 먹이와 관리가 필요해요.',static:'자리를 지키고 있어요.'};
 function render(){
  if(!dialog.open)return;
  const id=select.value,species=organismById[id],members=state.organisms.filter(o=>o.speciesId===id);
  document.querySelector('#population-role').textContent=`역할: ${roleLabels[species.role]} · 현재 숲 개체 수: ${members.length}`;
  const stages=members.map(survivalStage),worst=['weak','severe','hungry','normal','static'].find(v=>stages.includes(v));
  document.querySelector('#population-state').textContent=members.length?labels[worst]:'지금 숲에는 없어요. 획득한 카드는 계속 사용할 수 있어요.';
  const check=validateIntroduction(state,id),locked=!state.inventory.find(c=>c.speciesId===id)?.acquired;
  document.querySelector('#population-introduction').textContent=locked?(species.unlockStage===14?'추후 해금 예정인 카드예요. 지금은 획득한 생물로 숲을 돌봐요.':'카드를 해금한 뒤 들일 수 있어요.'):check.ok?'카드 선택 후 숲을 터치해요. 나쁜 환경에서는 먹이와 회복을 더 살펴보세요.':check.message;
  const rule=reproductionRules[id];
  document.querySelector('#population-breeding').textContent=rule?`${rule.mode==='seed-spread'?'씨앗 확산':'번식'}: ${rule.minimum}개체 이상, 먹이·환경·공간 조건이 필요해요. 잠시 좋아졌다고 바로 늘어나지는 않아요.`:'이번 단계에는 이 생물의 번식이 없어요.';
  const d=state.decomposition;
  document.querySelector('#population-soil').textContent=`유기물: ${Object.values(d.organicMatter).reduce((a,b)=>a+b,0)>1?'분해할 자원이 있어요':'조금 있어요'} · 토양의 이용 가능한 양분: ${d.soilNutrients>.6?'좋음':d.soilNutrients>.2?'보통':'조금'}. 분해자는 유기물 분해를 도와요. 화면에 없는 미생물의 분해도 조금 반영해요.`;
  const list=document.querySelector('#population-history');list.replaceChildren();
  for(const record of state.population.history.filter(r=>r.speciesId===id&&!['placement','reintroduction'].includes(r.cause)).slice(-4).reverse()){const li=document.createElement('li');li.textContent=populationMessage(record);list.append(li);}
  release.disabled=!members.length;release.textContent=confirmation?'다시 눌러 한 개체 돌려보내기':'한 개체를 돌려보내 공간 마련';
 }
 document.querySelector('#population-open').addEventListener('click',()=>{confirmation=null;dialog.showModal();render();});
 document.querySelector('#population-close').addEventListener('click',()=>dialog.close());
 select.addEventListener('change',()=>{confirmation=null;render();});
 release.addEventListener('click',()=>{
  const instance=state.organisms.find(o=>o.speciesId===select.value);if(!instance)return;
  if(confirmation!==instance.instanceId){confirmation=instance.instanceId;render();return;}
  onRelease(instance.instanceId);confirmation=null;render();
 });
 return {render,select:id=>{select.value=id;confirmation=null;render()},reset:()=>{confirmation=null;select.value='oak';dialog.close()}};
}
