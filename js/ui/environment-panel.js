import {environmentFactors} from '../../data/environment-config.js';
import {factorValue,qualityLabel} from '../systems/environment.js';

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
 function render(){
  for(const [key,node]of nodes){const text=qualityLabel(factorValue(state.environment,key));if(node.textContent!==text)node.textContent=text;}
  if(!dialog.open)return;
  const options=recovery.options();const next=JSON.stringify([options,state.metrics.points]);if(next===signature)return;signature=next;area.replaceChildren();
  for(const option of options){const button=document.createElement('button');button.type='button';button.dataset.environmentRecovery=option.factor;button.textContent=`${option.name} · ${option.cost}포인트 (${environmentFactors[option.factor].name})`;button.setAttribute('aria-disabled',String(!option.available));
   button.addEventListener('click',()=>{const response=recovery.execute(option.factor);render();result.textContent=response.message;});
   const hint=document.createElement('p');hint.textContent=option.available?'나쁜 상태를 한 단계 개선해요. 생태계 포인트와 재사용 대기를 확인해요.':option.reason;area.append(button,hint);
  }
 }
 document.querySelector('#environment-open').addEventListener('click',()=>{result.textContent='';dialog.showModal();render();});
 document.querySelector('#environment-close').addEventListener('click',()=>dialog.close());
 render();return {render};
}
