import {environmentFactors,environmentLevels} from '../../data/environment-config.js';
import {factorValue,setEnvironmentLevel} from '../systems/environment.js';

// Explicit development harness. Production main never imports this module.
// Browser tests inject installation; no query-string or student button enables it.
export function installEnvironmentTools(state,onChanged) {
 const area=document.createElement('section');area.id='environment-dev-fields';
 const heading=document.createElement('h3');heading.textContent='개발 검사 전용 환경 변경';area.append(heading);
 for(const [key,factor]of Object.entries(environmentFactors)){
  const label=document.createElement('label');label.textContent=factor.name;
  const select=document.createElement('select');select.setAttribute('aria-label',`${factor.name} 상태`);
  for(const [level,definition]of Object.entries(environmentLevels)){const option=document.createElement('option');option.value=level;option.textContent=definition.label;select.append(option)}
  select.addEventListener('change',()=>{if(setEnvironmentLevel(state,key,select.value))onChanged()});label.append(select);area.append(label);
  document.querySelector('#environment-open').addEventListener('click',()=>{select.value=Object.keys(environmentLevels).find(level=>environmentLevels[level].value===factorValue(state.environment,key))});
 }
 document.querySelector('#environment-fields').after(area);
}
