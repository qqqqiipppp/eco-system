import {activities,activityById} from '../../data/activities.js';
import {activityCondition} from '../systems/activity-rules.js';
export function createActivityView(state,onComplete,{onPlace=()=>{}}={}) {
 const dialog=document.querySelector('#activity-dialog');
 const title=document.querySelector('#activity-title'),prompt=document.querySelector('#activity-prompt');
 const choices=document.querySelector('#activity-choices'),status=document.querySelector('#activity-result'),conditions=document.querySelector('#activity-conditions');
 const fullHint=document.createElement('details'),summary=document.createElement('summary'),hint=document.createElement('p');fullHint.id='activity-hint';summary.textContent='전체 탐구 방법';fullHint.append(summary,hint);conditions.after(fullHint);
 const place=document.createElement('button');place.id='activity-place';place.type='button';place.textContent='획득한 생물 놓기';place.hidden=true;status.after(place);place.addEventListener('click',()=>{const a=activityById[current];if(a?.unlockSpeciesId&&state.inventory.some(c=>c.speciesId===a.unlockSpeciesId&&c.acquired)){dialog.close();onPlace(a.unlockSpeciesId);}});
 let current=null,signature='';
 function open(activityId=activities[0].activityId){
  const definition=activityById[activityId];if(!definition)return;
  current=activityId;signature='';fullHint.open=false;document.querySelector('#activity-library').open=false;hint.textContent=definition.hint;title.textContent=definition.title;prompt.textContent=definition.prompt;status.textContent='';choices.replaceChildren();
  const answers=definition.choices||[{id:undefined,label:definition.type==='observation'?'관찰 기록 확인하고 완료':'환경 조건 확인하고 완료'}];
  for(const answer of answers){const button=document.createElement('button');button.type='button';button.textContent=answer.label;button.dataset.answer=answer.id||'confirm';button.addEventListener('click',()=>{
    const completed=state.activities.find(a=>a.activityId===current)?.completed,points=state.metrics.points;
    const result=onComplete(current,answer.id),gained=state.metrics.points-points;
    const outcome=definition.learningOutcome.split(/\.\s/)[0]+'.';
    status.textContent=!result.ok?result.message:completed?'완료한 활동이에요. 기록과 보상은 그대로예요.':outcome+(result.unlocked?' 카드를 얻었어요.':'')+(gained>0?' '+gained+'포인트를 받았어요.':'');
    render();
  });choices.append(button)}
  if(!dialog.open)dialog.showModal();render();
 }
 for(const item of activities){const button=document.createElement('button');button.type='button';button.textContent=item.title;button.dataset.activityId=item.activityId;button.addEventListener('click',()=>open(item.activityId));document.querySelector('#activity-nav').append(button)}
 function render(){
  if(!dialog.open||!current)return;
  const definition=activityById[current],progress=state.activities.find(item=>item.activityId===current);
  const condition=activityCondition(state,current);
  const text=progress.completed?'완료했어요. 기록과 보상은 그대로예요.':definition.collection?(condition.evidenceReady?'관찰했어요. 답을 골라 봐요.':condition.checks.find(c=>!c.ok).next):definition.choices?'답을 고르고 숲에서 확인해요.':condition.ok?'조건을 갖췄어요. 확인하면 카드를 얻어요.':condition.checks?.find(c=>!c.ok)?.label||definition.hint;
  place.hidden=!definition.unlockSpeciesId||!state.inventory.some(c=>c.speciesId===definition.unlockSpeciesId&&c.acquired);
  place.textContent=definition.unlockSpeciesId?'이 생물 놓기':'숲으로 돌아가기';
  if(signature!==text){signature=text;conditions.textContent=text}
  document.querySelectorAll('#activity-nav button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.activityId===current)));
 }
 document.querySelector('#activities-open').addEventListener('click',()=>open());
 document.querySelector('#activity-close').addEventListener('click',()=>dialog.close());
 return {open,render,reset() { if(dialog.open)dialog.close();current=null;signature='';choices.replaceChildren();status.textContent=''; }};
}
