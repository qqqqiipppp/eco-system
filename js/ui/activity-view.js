import {activities,activityById} from '../../data/activities.js';
import {activityCondition} from '../systems/activity-rules.js';
export function createActivityView(state,onComplete,{onPlace=()=>{}}={}) {
 const dialog=document.querySelector('#activity-dialog');
 const title=document.querySelector('#activity-title'),prompt=document.querySelector('#activity-prompt');
 const choices=document.querySelector('#activity-choices'),status=document.querySelector('#activity-result'),conditions=document.querySelector('#activity-conditions');
 const fullHint=document.createElement('details'),summary=document.createElement('summary'),hint=document.createElement('p');summary.textContent='전체 탐구 방법';fullHint.append(summary,hint);conditions.after(fullHint);
 const place=document.createElement('button');place.id='activity-place';place.type='button';place.textContent='획득한 생물 놓기';place.hidden=true;status.after(place);place.addEventListener('click',()=>{const a=activityById[current];if(a?.unlockSpeciesId&&state.inventory.some(c=>c.speciesId===a.unlockSpeciesId&&c.acquired)){dialog.close();onPlace(a.unlockSpeciesId);}});
 let current=null,signature='';
 function open(activityId=activities[0].activityId){
  const definition=activityById[activityId];if(!definition)return;
  current=activityId;signature='';fullHint.open=false;hint.textContent=definition.hint;title.textContent=definition.title;prompt.textContent=definition.prompt;status.textContent='';choices.replaceChildren();
  const answers=definition.choices||[{id:undefined,label:definition.type==='observation'?'관찰 기록 확인하고 완료':'환경 조건 확인하고 완료'}];
  for(const answer of answers){const button=document.createElement('button');button.type='button';button.textContent=answer.label;button.dataset.answer=answer.id||'confirm';button.addEventListener('click',()=>{const result=onComplete(current,answer.id);status.textContent=result.message;render()});choices.append(button)}
  if(!dialog.open)dialog.showModal();render();
 }
 for(const item of activities){const button=document.createElement('button');button.type='button';button.textContent=item.title;button.dataset.activityId=item.activityId;button.addEventListener('click',()=>open(item.activityId));document.querySelector('#activity-nav').append(button)}
 function render(){
  if(!dialog.open||!current)return;
  const definition=activityById[current],progress=state.activities.find(item=>item.activityId===current);
  const condition=activityCondition(state,current);
  const text=progress.completed?(progress.ecologyRevision===1?'이전 구성에서 완료한 활동이에요. 학습과 카드 권한은 유지돼요. 현재 생물은 새로 관찰하고 기록해요.':definition.collection?'획득한 카드예요. 다시 살펴봐도 추가 카드나 포인트는 지급되지 않아요.':'완료한 활동이에요. 다시 살펴볼 수 있지만 최초 보상은 한 번이에요.'):definition.collection?(condition.evidenceReady?'✓ 관찰 근거를 갖췄어요. 이제 질문을 읽고 골라 봐요.\n':condition.checks.find(c=>!c.ok).next+'\n')+condition.checks.map(c=>`${c.ok?'✓':'○'} ${c.label}`).join('\n'):definition.choices?definition.hint:condition.checks?condition.checks.map(c=>`${c.ok?'✓':'○'} ${c.label}`).join('\n'):condition.ok?'✓ 강아지풀과 방아깨비의 관찰 기록이 있어요. 완료하면 참개구리를 배치할 수 있어요.':definition.hint;
  place.hidden=!definition.unlockSpeciesId||!state.inventory.some(c=>c.speciesId===definition.unlockSpeciesId&&c.acquired);
  if(signature!==text){signature=text;conditions.textContent=text}
  document.querySelectorAll('#activity-nav button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.activityId===current)));
 }
 document.querySelector('#activities-open').addEventListener('click',()=>open());
 document.querySelector('#activity-close').addEventListener('click',()=>dialog.close());
 return {open,render,reset() { if(dialog.open)dialog.close();current=null;signature='';choices.replaceChildren();status.textContent=''; }};
}
