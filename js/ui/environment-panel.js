import {environmentFactors} from '../../data/environment-config.js';
import {factorValue,qualityLabel} from '../systems/environment.js';
import {environmentEventPresentation} from '../systems/environment-events.js';

// Student panel is read-only. Paid actions are verified by management callbacks.
export function bindEnvironmentPanel(state,recovery={options:()=>[],execute:()=>({ok:false})}) {
 const dialog=document.querySelector('#environment-dialog');
 const fields=document.querySelector('#environment-fields');
 const nodes=new Map();
 for(const [key,factor]of Object.entries(environmentFactors)){
  const row=document.createElement('div'),name=document.createElement('strong'),value=document.createElement('span');
  name.textContent=factor.name;value.dataset.environmentFactor=key;
  row.append(name,value);fields.append(row);nodes.set(key,value);
 }
 const area=document.querySelector('#environment-recovery'),result=document.querySelector('#environment-result');let signature='';
 const currentArea=document.querySelector('#environment-event-current'),empty=document.querySelector('#environment-event-empty');
 const eventFields=Object.fromEntries(['title','phase','cause','direction','expected','actual','responses','choice'].map(key=>[key,document.querySelector(`#environment-event-${key}`)]));
 const historyArea=document.querySelector('#environment-event-history-area'),history=document.querySelector('#environment-event-history');
 const choiceButtons=[...document.querySelectorAll('[data-environment-event-choice]')];
 let currentEventId=null;
 const setText=(node,text)=>{if(node.textContent!==text)node.textContent=text;};
 function setList(node,values){
  const next=JSON.stringify(values);if(node.dataset.signature===next)return;
  node.dataset.signature=next;node.replaceChildren();
  for(const text of values){const item=document.createElement('li');item.textContent=text;node.append(item);}
 }
 function renderEvents(){
  // Expected effects and confirmed reactions are supplied by the domain system.
  const presentation=environmentEventPresentation(state),current=presentation.current;
  currentEventId=current?.eventId??null;currentArea.hidden=!current;empty.hidden=Boolean(current);
  if(current){
   setText(eventFields.title,current.name);setText(eventFields.phase,current.phaseLabel);
   setText(eventFields.cause,`원인: ${current.cause}`);setText(eventFields.direction,current.direction);
   setText(eventFields.expected,current.expected);
   setList(eventFields.actual,current.actual.length?current.actual:['확인된 생물 반응은 아직 없어요. 생물의 성장과 먹이를 더 살펴봐요.']);
   setList(eventFields.responses,current.responses.length?current.responses:['아직 관리 행동을 선택하지 않았어요. 관찰하거나 기다리는 것도 선택이에요.']);
   setText(eventFields.choice,current.choice==='wait'?'기다리며 변화를 살펴보기로 했어요.':current.choice==='observe'?'이 환경 변화를 기록했어요.':current.observed?'원인을 살펴봤어요. 이제 관찰하거나 기다리기를 선택할 수 있어요.':'먼저 원인과 실제 변화를 살펴보고 선택해요.');
   for(const button of choiceButtons)button.setAttribute('aria-pressed',String(button.dataset.environmentEventChoice===current.choice));
  }
  const recent=presentation.history.slice(-3).reverse(),next=JSON.stringify(recent);
  historyArea.hidden=!recent.length;
  if(history.dataset.signature===next)return;history.dataset.signature=next;history.replaceChildren();
  for(const record of recent){
   const item=document.createElement('li'),name=document.createElement('strong'),text=document.createElement('p');
   item.dataset.environmentEventId=record.eventId;name.textContent=`${record.name} · ${record.phaseLabel}`;
   text.textContent=record.actual.length?record.actual.join(' '):'아직 확인된 생물 반응이 없어요.';item.append(name,text);history.append(item);
  }
 }
 for(const button of choiceButtons)button.addEventListener('click',()=>{
  if(!currentEventId)return;
  const response=recovery.onEventChoice?.(currentEventId,button.dataset.environmentEventChoice);
  render();if(response?.message)result.textContent=response.message;
 });
 function render(){
  for(const [key,node]of nodes){const text=qualityLabel(factorValue(state.environment,key));if(node.textContent!==text)node.textContent=text;}
  if(!dialog.open)return;
  renderEvents();
  const options=recovery.options();const next=JSON.stringify([options,state.metrics.points]);if(next===signature)return;signature=next;area.replaceChildren();
  for(const option of options){const button=document.createElement('button');button.type='button';button.dataset.environmentRecovery=option.factor;button.textContent=`${option.name} · ${option.cost}포인트 (${environmentFactors[option.factor].name})`;button.setAttribute('aria-disabled',String(!option.available));
   button.addEventListener('click',()=>{const response=recovery.execute(option.factor);render();result.textContent=response.message;});
   const hint=document.createElement('p');hint.textContent=option.available?'나쁜 상태를 한 단계 개선해요. 생태계 포인트와 재사용 대기를 확인해요.':option.reason;area.append(button,hint);
  }
 }
 document.querySelector('#environment-open').addEventListener('click',()=>{result.textContent='';recovery.onEventOpen?.();dialog.showModal();render();});
 document.querySelector('#environment-close').addEventListener('click',()=>dialog.close());
 render();return {render};
}
