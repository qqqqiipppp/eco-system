import {careAvailable} from '../systems/round-care.js';
import {environmentFactors} from '../../data/environment-config.js';
import {managementActions} from '../../data/management-actions.js';
import {pointEconomyConfig,recoveryChoices} from '../../data/point-economy.js';
import {activityById} from '../../data/activities.js';
import {foodRelationById} from '../../data/food-relations.js';
import {organismById} from '../../data/organisms.js';
import {environmentEventDefinitions} from '../../data/environment-events.js';
import {studyCandidates,studyPresentation,supportQuote,supportReserved,pointGuidance} from '../systems/point-economy.js';

export function bindPointEconomyView(state,callbacks){
 const root=document.querySelector('#point-economy'),balance=root.querySelector('[data-point-balance]'),guidance=root.querySelector('[data-point-guidance]');
 const study=root.querySelector('[data-point-study]'),episodes=root.querySelector('[data-study-episodes]'),question=root.querySelector('[data-study-question]'),description=root.querySelector('[data-study-description]');
 const factorArea=root.querySelector('[data-study-factors]'),recoveryArea=root.querySelector('[data-study-recovery]'),submit=root.querySelector('[data-study-submit]'),studyHint=root.querySelector('[data-study-hint]');
 const support=root.querySelector('[data-point-support]'),supportHint=root.querySelector('[data-support-hint]'),supportButton=root.querySelector('[data-support-claim]'),care=root.querySelector('[data-support-care-area]');
 const recent=root.querySelector('[data-point-recent]'),result=root.querySelector('[data-point-result]');let chosen=null,answers={},signature='';
 const set=(node,text)=>{if(node.textContent!==text)node.textContent=text;};
 const make=(label,key,value,area)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.studyAnswer=key;b.dataset.value=value;
  b.addEventListener('click',()=>{answers[key]=value;for(const n of area.children)n.setAttribute('aria-pressed',String(n.dataset.value===value));});area.append(b);};
 for(const [id,f]of Object.entries(environmentFactors))make(f.name,'factor',id,factorArea);
 for(const c of recoveryChoices)make(c.label,'recovery',c.id,recoveryArea);
 submit.addEventListener('click',()=>{const response=callbacks.onStudy?.(chosen,answers);set(result,response?.message||'원인과 결과를 골라 주세요.');signature='';render();});
 supportButton.addEventListener('click',()=>{const response=callbacks.onSupport?.();set(result,response?.message||'지금 가능한 회복 방법을 다시 살펴봐요.');signature='';render();});
 function render(){
  const candidates=studyCandidates(state),quote=supportQuote(state),reserved=supportReserved(state),guide=pointGuidance(state);
  const careChecks=reserved?state.pointEconomy.support.factors.filter(f=>state.environment[f].value<pointEconomyConfig.minimumEnvironment).map(f=>{const check=callbacks.supportCareOption?.(f);return [f,check?{ok:check.ok,message:check.message}:null];}):[];
  if(!candidates.some(r=>r.eventId===chosen)){chosen=candidates[0]?.eventId||null;answers={};for(const b of [...factorArea.children,...recoveryArea.children])b.setAttribute('aria-pressed','false');}
  const current=candidates.find(r=>r.eventId===chosen),summary=studyPresentation(state,current);
  const next=JSON.stringify([state.metrics.points,state.pointEconomy.sequence,candidates.map(r=>r.eventId),chosen,quote,reserved,guide,careChecks]);if(next===signature)return;signature=next;
  set(balance,`현재 생태계 포인트: ${state.metrics.points}`+(state.round.number>1?' · 이번 숲 관리 지원: '+careAvailable(state)+' / 28점 (지원부터 사용)':''));set(guidance,guide);study.hidden=!summary;
  set(studyHint,state.pointEconomy.studyCount>=pointEconomyConfig.studyLimit?'누적 환경 학습 운영 보상 5회는 모두 받았어요. 관찰과 자연 회복은 계속할 수 있어요.':summary?'완료된 실제 변화의 원인과 회복 결과를 확인하면 4포인트를 한 번 받아요. 그냥 열기·관찰·기다림에는 지급하지 않아요.':'실제로 변한 환경 사건이 끝나면 원인과 결과를 확인할 수 있어요. 이전 사건은 새 보상으로 바꾸지 않아요.');
  if(summary){set(question,`${summary.name}: 어떤 환경 요소가 변했나요?`);set(description,summary.description);episodes.replaceChildren();
   for(const r of candidates.slice(0,5)){const b=document.createElement('button');b.type='button';b.textContent=studyPresentation(state,r).name;b.dataset.studyEpisode=r.eventId;b.setAttribute('aria-pressed',String(r.eventId===chosen));b.addEventListener('click',()=>{chosen=r.eventId;answers={};signature='';for(const n of [...factorArea.children,...recoveryArea.children])n.setAttribute('aria-pressed','false');render();});episodes.append(b);}
  }
  support.hidden=!quote.available&&!reserved;set(supportHint,quote.available?quote.reason:reserved?'이 예산은 지정된 나쁜 환경을 보통으로 돌보는 데 먼저 써요. 다른 관리에는 남은 일반 포인트를 써요.':'');
  supportButton.hidden=!quote.available;supportButton.textContent=`한 번 복구 지원 ${quote.amount}포인트 받기`;care.replaceChildren();
  for(const [factor,check] of careChecks){
   const action=managementActions.find(a=>a.effect.factor===factor)||managementActions.find(a=>a.actionId==='habitat-care');
   const b=document.createElement('button');b.type='button';b.dataset.supportCare=factor;b.textContent=`${environmentFactors[factor].name} 돌보기 · ${action.cost}포인트`;
   b.setAttribute('aria-disabled',String(!check?.ok));b.addEventListener('click',()=>{const response=callbacks.onSupportCare?.(factor);set(result,response?.message||'지금 상태를 다시 살펴봐요.');signature='';render();});care.append(b);
   if(check&&!check.ok){const hint=document.createElement('p');hint.textContent=check.message;care.append(hint);}
  }
  recent.replaceChildren();for(const row of state.pointEconomy.ledger.slice(-3).reverse()){
   const relation=foodRelationById[row.id.replace('observation:','')],event=state.environmentEvents.history.find(r=>r.eventId===row.sourceId);
   const legacy=row.id.startsWith('activity:')?activityById[row.id.slice(9)]?.title:relation?`${organismById[relation.sourceSpeciesId].name} → ${organismById[relation.targetSpeciesId].name} 첫 발견`:row.id.startsWith('question:')?'식물 회복 원인 조사':row.id.startsWith('management:')?'물·토양의 실제 해결':'처음 발견·학습';
   const item=document.createElement('li'),reason=row.type==='study'?`${event?environmentEventDefinitions[event.kind].name+' ':''}원인·결과 학습`:row.type==='support'?'막힌 환경의 한 번 복구 지원':row.type==='management'?managementActions.find(a=>a.actionId===row.sourceId)?.name||'숲 관리':legacy;
   item.textContent=`${reason}: ${row.amount>0?'+':''}${row.amount}포인트`;recent.append(item);
  }
  if(!recent.children.length){const item=document.createElement('li');item.textContent='이어서 시작한 포인트와 기존 보상은 보존돼요. 새 획득·지출이 생기면 여기에 남아요.';recent.append(item);}
 }
 return {render};
}
