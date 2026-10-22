import {activities,activityById} from '../../data/activities.js';
import {activityCondition} from '../systems/activity-rules.js';
import {studentNextAction} from './student-guidance.js';
export function createActivityView(state,onComplete,{onPlace=()=>{}}={}) {
 const dialog=document.querySelector('#activity-dialog');
 const title=document.querySelector('#activity-title'),prompt=document.querySelector('#activity-prompt');
 const choices=document.querySelector('#activity-choices'),status=document.querySelector('#activity-result'),conditions=document.querySelector('#activity-conditions');
 const fullHint=document.createElement('details'),summary=document.createElement('summary'),hint=document.createElement('p');fullHint.id='activity-hint';summary.textContent='전체 탐구 방법';fullHint.append(summary,hint);conditions.after(fullHint);
 const place=document.createElement('button');place.id='activity-place';place.type='button';place.textContent='획득한 생물 놓기';place.hidden=true;status.after(place);place.addEventListener('click',()=>{const a=activityById[current];if(a?.unlockSpeciesId&&state.inventory.some(c=>c.speciesId===a.unlockSpeciesId&&c.acquired)){dialog.close();onPlace(a.unlockSpeciesId);}});
 const next=document.createElement('p');next.id='activity-next';place.after(next);
 let current=null,signature='',justCompleted=false;
 function open(activityId=activities[0].activityId){
  const definition=activityById[activityId];if(!definition)return;
  current=activityId;signature='';justCompleted=false;next.textContent='';fullHint.open=false;document.querySelector('#activity-library').open=false;hint.textContent=definition.hint;title.textContent=definition.title;prompt.textContent=definition.prompt;status.textContent=state.activities.find(a=>a.activityId===current)?.completed?'이미 끝낸 미션이에요. 다시 살펴볼 수 있어요. '+definition.learningOutcome:'';choices.replaceChildren();
  const answers=definition.choices||[{id:undefined,label:definition.type==='observation'?'관찰 기록 확인하고 완료':'환경 조건 확인하고 완료'}];
  for(const answer of answers){const button=document.createElement('button');button.type='button';button.textContent=answer.label;button.dataset.answer=answer.id||'confirm';button.addEventListener('click',()=>{
    const completed=state.activities.find(a=>a.activityId===current)?.completed,points=state.metrics.points;
    const result=completed&&!definition.choices?{ok:true,unlocked:false}:onComplete(current,answer.id),gained=state.metrics.points-points;
    justCompleted=result.ok&&!completed;
    status.textContent=!result.ok?result.message:completed?'이미 끝낸 미션이에요. 다시 살펴볼 수 있어요. '+definition.learningOutcome:(definition.choices?'정답이에요! ':'미션 완료! ')+definition.learningOutcome+(gained>0?' 생태계 포인트 +'+gained:'');
    next.textContent=result.ok?(definition.unlockSpeciesId?'아래 버튼을 눌러 이 생물을 숲에 놓고 살펴보세요.':studentNextAction(state)?.text||'숲으로 돌아가 생물의 생활을 살펴보세요.'):'';
    render();
  });choices.append(button)}
  if(!dialog.open)dialog.showModal();render();
 }
 for(const item of activities){const button=document.createElement('button');button.type='button';button.textContent=item.title;button.dataset.activityId=item.activityId;button.addEventListener('click',()=>open(item.activityId));document.querySelector('#activity-nav').append(button)}
 function render(){
  if(!dialog.open||!current)return;
  const definition=activityById[current],progress=state.activities.find(item=>item.activityId===current);
  const condition=activityCondition(state,current);
  conditions.hidden=progress.completed;
  const text=progress.completed?(justCompleted?'미션 완료!':'이미 끝낸 미션이에요. 다시 살펴볼 수 있어요. '+definition.learningOutcome):definition.collection?(condition.evidenceReady?'살펴본 내용을 떠올리며 답을 골라 보세요.':condition.checks.find(c=>!c.ok).next):definition.choices?'문제를 읽고 알맞은 답을 골라 보세요.':condition.ok?'이제 확인하면 카드를 얻을 수 있어요.':condition.checks?.find(c=>!c.ok)?.label||definition.hint;
  place.hidden=!definition.unlockSpeciesId||!state.inventory.some(c=>c.speciesId===definition.unlockSpeciesId&&c.acquired);
  place.textContent=definition.unlockSpeciesId?document.querySelector('.organism-card[data-species-id="'+definition.unlockSpeciesId+'"] .card-name').textContent+' 숲에 놓기':'숲으로 돌아가기';
  if(signature!==text){signature=text;conditions.textContent=text}
  document.querySelectorAll('#activity-nav button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.activityId===current)));
 }
 document.querySelector('#activities-open').addEventListener('click',()=>open());
 document.querySelector('#activity-close').addEventListener('click',()=>dialog.close());
 return {open,render,reset() { if(dialog.open)dialog.close();current=null;signature='';choices.replaceChildren();status.textContent=''; }};
}
