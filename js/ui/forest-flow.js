import {activities} from '../../data/activities.js';
import {organismById} from '../../data/organisms.js';
import {eventPriority} from '../../data/event-config.js';
import {activityCondition} from '../systems/activity-rules.js';
import {nextAction} from '../systems/goal-guidance.js';
import {validateIntroduction} from '../systems/population.js';
import {placementConfig} from '../../data/interaction-config.js';
import {studentNextAction,forestMissions,missionContext,activityAction,placementHint,studentSentence} from './student-guidance.js';

export function readyActivity(state,activity){
 if(state.activities.find(a=>a.activityId===activity.activityId)?.completed)return false;
 if(activity.collection&&state.inventory.some(c=>c.speciesId===activity.unlockSpeciesId&&c.acquired))return false;
 const condition=activityCondition(state,activity.activityId);
 return activity.collection?condition.evidenceReady:activity.choices?true:condition.ok;
}
export function nextReadyActivity(state){
 const observation=activities.find(a=>a.activityId==='grass_observation'&&readyActivity(state,a));
 return observation||activities.find(a=>readyActivity(state,a));
}
export function forestAction(state){
 const active=state.events.filter(e=>e.status==='active').sort((a,b)=>eventPriority(b)-eventPriority(a)||a.createdAt-b.createdAt);
 const urgent=active.find(e=>e.payload.urgent);
 if(urgent)return {kind:'event',id:urgent.eventId,text:urgent.message,label:'도와주기'};
 const discovery=active[0];
 if(discovery?.kind==='insight')return {kind:'event',id:discovery.eventId,text:discovery.message,label:discovery.payload.developmentSequence?'성장 기록':'발견 기록'};
 const has=id=>state.organisms.some(o=>o.speciesId===id),owns=id=>state.inventory.some(c=>c.speciesId===id&&c.acquired);
 if(state.goalRevision===2&&!state.forestProgress.cleared){
  if(discovery?.kind==='alert'&&!discovery.payload.populationSequence&&!discovery.payload.organicOriginSequence)return {kind:'event',id:discovery.eventId,text:discovery.message,label:'도와주기'};
  return studentNextAction(state);
 }
 if(state.organisms.length>=placementConfig.maxOrganisms&&['grass','grasshopper','frog','mushroom'].some(id=>owns(id)&&!has(id)))return {kind:'population',text:'숲이 가득 찼어요. 필요한 생물을 골라 돌려보낼 수 있어요.',label:'자리 살펴보기'};
 for(const id of ['grass','grasshopper','frog','mushroom'])if(!has(id)&&owns(id)&&validateIntroduction(state,id).ok)return {kind:'place',id,text:organismById[id].name+' 카드를 골라 숲에 놓아요.',label:'놓기'};
 if(discovery?.kind==='alert'&&!discovery.payload.populationSequence&&!discovery.payload.organicOriginSequence)return {kind:'event',id:discovery.eventId,text:discovery.message,label:'도와주기'};
 const ready=nextReadyActivity(state);
 if(ready)return {kind:'activity',id:ready.activityId,text:ready.unlockSpeciesId&&!owns(ready.unlockSpeciesId)?organismById[ready.unlockSpeciesId].name+' 카드를 배워 볼까요?':ready.title,label:'짧은 활동'};
 const alert=active[0];
 if(alert)return {kind:'event',id:alert.eventId,text:alert.message,label:'확인하기'};
 const hint=nextAction(state).split(/(?<=\.)\s/)[0];
 return {kind:'watch',text:state.forestProgress.cleared?'첫 목표를 해냈어요. 이제 성장과 환경 변화를 더 살펴봐요.':hint,label:''};
}
export function renderMissionList(node,state){
 const goals=forestMissions(state),signature=JSON.stringify([state.goalRevision,state.round.id,goals.map(g=>[g.id,g.title,g.note,g.ok])]);
 if(node.dataset.signature===signature)return;node.dataset.signature=signature;node.replaceChildren();
 // Keep the Korean learning terms, with a concrete action beneath each title.
 const notes={food:'먹는 모습을 💡에 기록하고 이어지는 관계를 찾아요.',roles:'양분을 만드는 생산자, 먹이를 먹는 소비자, 유기물을 분해하는 분해자를 살펴봐요.',inquiry:'식물과 환경을 보고 선택한 뒤, 먹는 모습과 먹이 회복을 확인해요.'};
 for(const goal of goals){const li=document.createElement('li'),note=document.createElement('span');li.dataset.mission=goal.id;li.dataset.achieved=String(goal.ok);li.textContent=(goal.ok?'✓ ':'○ ')+goal.title;note.className='mission-note';note.textContent=goal.ok?'이번 숲에서 확인했어요!':goal.note||notes[goal.id];li.append(note);node.append(li);}
}
export function createForestFlow(state,{onActivity,onEvent,onPlace,onPopulation,onGoalInspect,getSelection=()=>null,getPlacementConfirmed=()=>false}){
 const toggle=document.querySelector('#memo-toggle'),body=document.querySelector('#memo-body'),text=document.querySelector('#next-action'),action=document.querySelector('#memo-action');
 let current,placementPending=false;
 const close=()=>{toggle.setAttribute('aria-expanded','false');body.hidden=true;};
 const fit=()=>{if(!body.hidden)body.style.maxHeight=Math.max(120,innerHeight-body.getBoundingClientRect().top-12)+'px';};
 toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));body.hidden=!open;if(open){toggle.scrollIntoView({block:'center'});fit();}});
 window.addEventListener('resize',fit);
 document.addEventListener('click',e=>{if(!e.target.closest('.forest-memo'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!body.hidden){close();toggle.focus({preventScroll:true});}});
 document.querySelector('#memo-goals').addEventListener('click',()=>{close();document.querySelector('#goal-open').click();});
 const execute=()=>{close();if(current?.kind==='activity')onActivity(current.id);else if(current?.kind==='event')onEvent(current.id);else if(current?.kind==='place')onPlace(current.id);else if(current?.kind==='population')onPopulation();else if(current?.kind==='goal-inspect')onGoalInspect(current);};
 action.addEventListener('click',execute);
 document.querySelector('#now-action').addEventListener('click',()=>{if(placementPending||current?.kind==='watch'){close();const surface=document.querySelector('#placement-surface');surface.scrollIntoView({block:'center'});surface.focus({preventScroll:true});}else execute();});
 function render(){
  current=forestAction(state);
  if(current.kind==='activity')current={...current,label:activityAction(state,activities.find(a=>a.activityId===current.id))};
  const selected=getSelection(),display=selected&&!getPlacementConfirmed()&&['place','watch'].includes(current.kind)?organismById[selected].name+' 카드를 골랐어요. 원하는 곳을 누르면 가까운 자리에 놓아요. '+placementHint(selected):studentSentence(current.text);
  placementPending=Boolean(selected&&!getPlacementConfirmed()&&['place','watch'].includes(current.kind));
  const now=document.querySelector('#now-action'),nowLabel=placementPending?'숲에 놓기':current.kind==='place'?'카드 고르기':current.label||'숲 살펴보기';if(now.textContent!==nowLabel)now.textContent=nowLabel;
  const next=studentSentence(current.text);if(text.textContent!==next)text.textContent=next;
  const preview=document.querySelector('#mission-preview');if(preview.textContent!==display)preview.textContent=display;
  const goals=forestMissions(state),count=document.querySelector('#mission-count'),context=document.querySelector('#mission-context');
  const set=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  set(count,goals.length?goals.filter(g=>g.ok).length+'/3':'이어 하기');set(context,missionContext(state));
  set(document.querySelector('#mission-heading'),goals.length?'나의 숲 미션':'이어 하는 숲 목표');
  renderMissionList(document.querySelector('#mission-list'),state);
  action.hidden=Boolean(selected&&current.kind==='place'&&selected===current.id)||!current.label;if(action.textContent!==current.label)action.textContent=current.label;
  const actionable=String(Boolean(current.label));if(toggle.dataset.actionable!==actionable)toggle.dataset.actionable=actionable;
  for(const card of document.querySelectorAll('.organism-card')){
   const id=card.dataset.speciesId,owned=state.inventory.some(c=>c.speciesId===id&&c.acquired),activity=activities.find(a=>a.unlockSpeciesId===id),ready=!owned&&activity&&readyActivity(state,activity),count=state.organisms.filter(o=>o.speciesId===id).length;
   const check=validateIntroduction(state,id),availability=state.organisms.length>=placementConfig.maxOrganisms?'자리 필요':check.ok?'놓기 가능':check.reason==='food'?'먹이 필요':check.reason==='density'?'충분해요':'잠시 기다려요';
   const status=owned?(count?'숲에 '+count+' · '+availability:availability):ready?'카드 얻으러 가기':'🔒 눌러서 얻는 방법';
   const readyValue=String(Boolean(ready));if(card.dataset.ready!==readyValue)card.dataset.ready=readyValue;
   const caption=card.querySelector('.card-caption');if(caption.textContent!==status)caption.textContent=status;
   const label=organismById[id].name+' · '+status+' · '+(owned?'골라서 숲에 놓기':'탐구 방법 보기');if(card.getAttribute('aria-label')!==label)card.setAttribute('aria-label',label);
  }
 }
 return {render};
}
