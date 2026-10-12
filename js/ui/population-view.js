import {organisms,organismById,roleLabels} from '../../data/organisms.js';
import {survivalStage,populationMessage,validateIntroduction} from '../systems/population.js';
import {reproductionRules} from '../../data/population-config.js';
import {lifespanRules,replenishmentRules} from '../../data/lifespan-config.js';
import {effectiveAge} from '../state/life-state.js';

export function createPopulationView(state,onRelease){
 const dialog=document.querySelector('#population-dialog'),select=document.querySelector('#population-species'),release=document.querySelector('#population-release');
 let confirmation=null;
 for(const species of organisms){const option=document.createElement('option');option.value=species.id;option.textContent=species.name;select.append(option);}
 const labels={normal:'현재는 정상 상태예요.',hungry:'먹이를 찾고 있어요.',severe:'먹이가 오랫동안 부족해요.',weak:'쇠약해졌어요. 먹이와 관리가 필요해요.',static:'자리를 지키고 있어요.'};
 function render(){
  if(!dialog.open)return;
  const id=select.value,species=organismById[id],members=state.organisms.filter(o=>o.speciesId===id);
  const lifeRule=lifespanRules[id];
  document.querySelector('#population-role').textContent=`역할: ${roleLabels[species.role]} · 현재 숲 개체 수: ${members.length}${lifeRule.unit}`;
  const stages=members.map(survivalStage),worst=['weak','severe','hungry','normal','static'].find(v=>stages.includes(v));
  document.querySelector('#population-state').textContent=members.length?labels[worst]:'지금 숲에는 없어요. 획득한 카드는 계속 사용할 수 있어요.';
  const age=members.some(o=>lifeRule.model==='individual'&&effectiveAge(o,state.simulationTime)/o.life.duration>.8)?' 생애의 후반을 보내는 개체가 있어요. 자연스러운 세대교체를 살펴봐요.':'';
  const colony=lifeRule.model==='colony'&&members.length?` 군집 활동: ${members.some(o=>o.life.stressSeconds>0)?'서식 환경이 좋지 않아요':members.some(o=>o.life.vigor<.5)?'자원이 적어 쉬고 있어요':'새로운 세대가 이어질 수 있어요'}.`:'';
  document.querySelector('#population-lifespan').textContent=`생애주기: ${lifeRule.label}.${age}${colony} 실제 생애와 게임 시간은 달라요.`;
  const check=validateIntroduction(state,id),locked=!state.inventory.find(c=>c.speciesId===id)?.acquired;
  document.querySelector('#population-introduction').textContent=locked?(species.unlockStage===14?'추후 해금 예정인 카드예요. 지금은 획득한 생물로 숲을 돌봐요.':'카드를 해금한 뒤 들일 수 있어요.'):check.ok?'카드 선택 후 숲을 터치해요. 나쁜 환경에서는 먹이와 회복을 더 살펴보세요.':check.message;
  const rule=reproductionRules[id];
  document.querySelector('#population-breeding').textContent=rule?`${rule.mode==='seed-spread'?'씨앗 확산':'번식'}: ${rule.minimum}개체 이상, 먹이·환경·공간 조건이 필요해요. 잠시 좋아졌다고 바로 늘어나지는 않아요.`:lifeRule.model==='colony'?'자원과 환경이 적절하면 군집 안에서 새 세대가 이어져요. 자원이 적으면 활동을 줄이고 쉬어요.':replenishmentRules[id]?'한 번 들인 생물은 먹이·환경·공간이 계속 적절하면 주변 서식지에서 제한적으로 보충돼요. 획득한 카드로 다시 들일 수도 있어요.':'긴 생애가 끝나도 획득한 카드로 다시 들일 수 있어요. 먹이와 공간을 먼저 살펴봐요.';
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
