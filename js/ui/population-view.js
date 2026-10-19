import {activityForSpecies} from '../../data/activities.js';
import {speciesHabitats,habitatZones,movementLabels} from '../../data/habitats.js';
import {organisms,organismById,roleLabels} from '../../data/organisms.js';
import {survivalStage,populationMessage,validateIntroduction} from '../systems/population.js';
import {reproductionRules} from '../../data/population-config.js';
import {lifespanRules,replenishmentRules} from '../../data/lifespan-config.js';
import {effectiveAge} from '../state/life-state.js';
import {developmentRules} from '../../data/development-config.js';
import {developmentStage,developmentConditions,developmentNotice} from '../systems/development.js';
import {studentStatus,studentFood} from './student-status.js';
import {placementConfig} from '../../data/interaction-config.js';

export function createPopulationView(state,onRelease,onFocus=()=>{}){
 const dialog=document.querySelector('#population-dialog'),select=document.querySelector('#population-species'),release=document.querySelector('#population-release');
 const developmentPanel=document.querySelector('#population-development');
 const developmentFields=Object.fromEntries(['cycle','development-stage','development-conditions','pending','development-history'].map(key=>[key,document.querySelector(`#population-${key}`)]));
 let confirmation=null,selectedInstanceId=null,candidateIds=[],candidateSignature='';
 const individual=document.querySelector('#population-individual'),nearby=document.querySelector('#population-nearby');
 function choose(id){const o=state.organisms.find(o=>o.instanceId===id);if(!o)return;selectedInstanceId=id;select.value=o.speciesId;confirmation=null;onFocus(id);render();}
 function renderIndividual(){
  const o=state.organisms.find(o=>o.instanceId===selectedInstanceId);
  dialog.dataset.selectedInstanceId=o?.instanceId||'';
  individual.hidden=!candidateIds.length;
  if(candidateIds.length)individual.textContent=o?organismById[o.speciesId].name+' · '+habitatZones[speciesHabitats[o.speciesId].primary]:'가까운 생물 중 하나를 골라요.';
  const live=candidateIds.filter(id=>state.organisms.some(o=>o.instanceId===id));
  const signature=live.join('|')+'#'+selectedInstanceId;
  nearby.hidden=live.length<2&&Boolean(o);
  dialog.classList.toggle('is-choosing',candidateIds.length>0&&!o&&live.length>0);
  if(signature!==candidateSignature){candidateSignature=signature;nearby.replaceChildren();for(const id of live){const o=state.organisms.find(o=>o.instanceId===id),button=document.createElement('button');button.type='button';button.dataset.inspectChoice=id;button.textContent=organismById[o.speciesId].name+' '+(state.organisms.filter(n=>n.speciesId===o.speciesId).findIndex(n=>n.instanceId===id)+1);button.setAttribute('aria-pressed',String(id===selectedInstanceId));button.addEventListener('click',()=>choose(id));nearby.append(button);}}
 }
 function inspect(ids){candidateIds=ids.filter(id=>state.organisms.some(o=>o.instanceId===id));selectedInstanceId=null;confirmation=null;onFocus(null);if(!candidateIds.length)return;if(!dialog.open)dialog.showModal();if(candidateIds.length===1)choose(candidateIds[0]);else render();}

 for(const species of organisms){const option=document.createElement('option');option.value=species.id;option.textContent=species.name;select.append(option);}
 function setText(node,text){if(node.textContent!==text)node.textContent=text;}
 function renderDevelopment(id,members){
  const rule=developmentRules[id];developmentPanel.hidden=!rule;if(!rule)return;
  const cycle=Array.isArray(rule.cycle)?rule.cycle.join(' → '):rule.cycle||rule.stages.map(stage=>stage.label).join(' → ');
  setText(developmentFields.cycle,`생애주기: ${cycle}. ${rule.description}`);
  if(rule.model==='learning'){
   setText(developmentFields['development-stage'],`현재 숲: 성체 참개구리 ${members.length}마리. 알과 올챙이는 학습 정보이며 이 숲에 실제로 생성되지 않아요.`);
   setText(developmentFields['development-conditions'],'올챙이는 자라며 다리가 생기고 꼬리가 줄어요. 성체가 되면 생활 모습과 먹이를 이용하는 방법도 달라져요. 지금 숲에서는 성체의 먹이와 물을 살펴봐요.');
  }else{
   const counts=rule.stages.map(stage=>({label:stage.label,count:members.filter(instance=>developmentStage(instance)===stage.id).length})).filter(stage=>stage.count);
   const unit=lifespanRules[id].unit;
   setText(developmentFields['development-stage'],members.length?`현재 숲: ${counts.map(stage=>`${stage.label} ${stage.count}${unit}`).join(' · ')}. 단계가 달라져도 같은 ${rule.model==='colony'?'군집':'개체'}예요.`:'현재 숲에는 없어요. 생애주기 설명과 실제 숲의 상태를 구분해요.');
   const conditions=members.map(instance=>developmentConditions(state,instance));
   const prefix=rule.model==='colony'?'군집 상태':'성장 상태';
   setText(developmentFields['development-conditions'],conditions.length?`${prefix}: ${[...new Set(conditions.map(condition=>condition.label))].join(' · ')}. ${[...new Set(conditions.map(condition=>condition.description))].join(' ')}`:rule.model==='colony'?'죽은 나무 같은 분해할 자원과 물·토양·공기가 군집의 활동에 필요해요.':'생물의 성장에는 알맞은 환경과 먹이가 필요해요.');
  }
  const pending=state.population.breeding[id]?.pending;
  developmentFields.pending.hidden=!['grass','grasshopper','mushroom'].includes(id);
  if(id==='grass')setText(developmentFields.pending,pending?'씨앗이 기다리고 있어요. 알맞은 환경과 빈 공간에서 새싹이 나요. 이 씨앗은 아직 숲의 개체 수에 포함되지 않아요.':'현재 기다리는 씨앗은 없어요. 씨앗을 만드는 강아지풀이 있어야 다음 새싹으로 이어질 수 있어요.');
  if(id==='grasshopper')setText(developmentFields.pending,pending?'알이 기다리고 있어요. 먹이·환경·공간이 알맞으면 약충이 나와요. 이 알은 아직 숲의 개체 수에 포함되지 않아요.':'현재 기다리는 알은 없어요. 성충이 번식하고 알에서 약충이 나오는 과정을 간단히 나타내요.');
  if(id==='mushroom')setText(developmentFields.pending,'포자 준비는 같은 군집의 생애 정보예요. 포자에서 새 군집이 자동으로 생기거나 군집 수가 늘지는 않아요.');
  const records=(state.development?.history||[]).filter(record=>record.speciesId===id&&record.noted).slice(-4).reverse();
  const history=developmentFields['development-history'],signature=JSON.stringify([id,records.map(record=>[record.sequence,record.stage])]);
  if(history.dataset.signature!==signature){
   history.dataset.signature=signature;history.replaceChildren();
   for(const record of records){const li=document.createElement('li');li.textContent=developmentNotice(record);history.append(li);}
   if(!records.length){const li=document.createElement('li');li.textContent=rule.model==='learning'?'이 생애주기는 학습 정보예요. 성체 참개구리의 생활을 관찰해요.':'성장 변화의 💡를 눌러 성장 기록을 남겨 보세요.';history.append(li);}
  }
 }
 function render(){
  if(!dialog.open)return;
  renderIndividual();
  const id=select.value,species=organismById[id],members=state.organisms.filter(o=>o.speciesId===id);
  const lifeRule=lifespanRules[id];
  document.querySelector('#population-role').textContent=`역할: ${roleLabels[species.role]} · 현재 숲 개체 수: ${members.length}${lifeRule.unit}`;
  const stages=members.map(survivalStage),worst=['weak','severe','hungry','normal','static'].find(v=>stages.includes(v));
  const selected=members.find(o=>o.instanceId===selectedInstanceId)||members.find(o=>survivalStage(o)===worst)||members[0];
  document.querySelector('#population-state').textContent=studentStatus(selected,state.simulationTime);
  document.querySelector('#population-food').textContent=studentFood(id);
  document.querySelector('#population-place').disabled=state.organisms.length>=placementConfig.maxOrganisms||!state.inventory.some(c=>c.speciesId===id&&c.acquired)||!validateIntroduction(state,id).ok;
  const age=members.some(o=>lifeRule.model==='individual'&&effectiveAge(o,state.simulationTime)/o.life.duration>.8)?' 생애의 후반을 보내는 개체가 있어요. 자연스러운 세대교체를 살펴봐요.':'';
  const colony=lifeRule.model==='colony'&&members.length?` 군집 활동: ${members.some(o=>o.life.stressSeconds>0)?'서식 환경이 좋지 않아요':members.some(o=>o.life.vigor<.5)?'자원이 적어 쉬고 있어요':'새로운 세대가 이어질 수 있어요'}.`:'';
  document.querySelector('#population-lifespan').textContent=`생애주기: ${lifeRule.label}.${age}${colony} 실제 생애와 게임 시간은 달라요.`;
  const check=validateIntroduction(state,id),locked=!state.inventory.find(c=>c.speciesId===id)?.acquired;
  document.querySelector('#population-introduction').textContent=locked?'잠긴 카드를 눌러 탐구 방법을 봐요.':state.organisms.length>=placementConfig.maxOrganisms?'숲이 가득 찼어요. 아래 자세히 보기에서 한 개체를 돌려보낼 수 있어요.':check.ok?'먹이와 환경을 살펴보고 필요한 생물을 놓아요.':check.message;
  const rule=reproductionRules[id];
  document.querySelector('#population-breeding').textContent=rule?id==='grass'?'씨앗을 만드는 강아지풀과 알맞은 환경·공간이 필요해요. 씨앗이 기다린 뒤 새싹이 나와요.':`${id==='grasshopper'?'성충 방아깨비':'성체 멧토끼'} ${rule.minimum}마리 이상과 먹이·환경·공간이 필요해요. 어린 개체는 아직 부모가 되지 못해요. 잠시 좋아졌다고 바로 늘어나지는 않아요.`:lifeRule.model==='colony'?'자원과 환경이 적절하면 군집 안에서 새 세대가 이어져요. 자원이 적으면 활동을 줄이고 쉬어요.':replenishmentRules[id]?'한 번 들인 생물은 먹이·환경·공간이 계속 적절하면 주변 서식지에서 제한적으로 보충돼요. 획득한 카드로 다시 들일 수도 있어요.':'긴 생애가 끝나도 획득한 카드로 다시 들일 수 있어요. 먹이와 공간을 먼저 살펴봐요.';
  renderDevelopment(id,members);
  const d=state.decomposition;
  document.querySelector('#population-soil').textContent=`유기물: ${Object.values(d.organicMatter).reduce((a,b)=>a+b,0)>1?'분해할 자원이 있어요':'조금 있어요'} · 토양의 이용 가능한 양분: ${d.soilNutrients>.6?'좋음':d.soilNutrients>.2?'보통':'조금'}. 분해자는 유기물 분해를 도와요. 화면에 없는 미생물의 분해도 조금 반영해요.`;
  const list=document.querySelector('#population-history');list.replaceChildren();
  for(const record of state.population.history.filter(r=>r.speciesId===id&&!['placement','reintroduction'].includes(r.cause)).slice(-4).reverse()){const li=document.createElement('li');li.textContent=populationMessage(record);list.append(li);}
  release.disabled=candidateIds.length?!selectedInstanceId||!state.organisms.some(o=>o.instanceId===selectedInstanceId):!members.length;release.textContent=confirmation?'다시 눌러 한 개체 돌려보내기':'한 개체를 돌려보내 공간 마련';
 }
 document.querySelector('#population-open').addEventListener('click',()=>{confirmation=null;selectedInstanceId=null;candidateIds=[];onFocus(null);dialog.showModal();render();});
 const clearInspection=()=>{confirmation=null;selectedInstanceId=null;candidateIds=[];onFocus(null);};
 document.querySelector('#population-close').addEventListener('click',()=>{clearInspection();dialog.close();});
 dialog.addEventListener('close',clearInspection);
 select.addEventListener('change',()=>{confirmation=null;selectedInstanceId=null;candidateIds=[];onFocus(null);render();});
 release.addEventListener('click',()=>{
  const instance=selectedInstanceId?state.organisms.find(o=>o.instanceId===selectedInstanceId):candidateIds.length?null:state.organisms.find(o=>o.speciesId===select.value);if(!instance)return;
  if(confirmation!==instance.instanceId){confirmation=instance.instanceId;render();return;}
  onRelease(instance.instanceId);confirmation=null;render();
 });
 return {render,inspect,select:id=>{select.value=id;confirmation=null;selectedInstanceId=null;candidateIds=[];onFocus(null);render()},reset:()=>{confirmation=null;selectedInstanceId=null;candidateIds=[];onFocus(null);select.value='oak';dialog.close()}};
}
