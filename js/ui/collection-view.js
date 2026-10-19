import {replayPlan} from '../systems/learning-guidance.js';
import {organisms,organismById,roleLabels} from '../../data/organisms.js';
import {activityForSpecies} from '../../data/activities.js';
import {foodRelations,foodPartLabels} from '../../data/food-relations.js';
import {collectionProgress,syncCollection} from '../state/collection-state.js';
import {activityCondition} from '../systems/activity-rules.js';
import {replayTopics} from '../systems/replay.js';
const node=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function lockedPreview(s){
 return organisms.filter(o=>!s.inventory.find(c=>c.speciesId===o.id)?.acquired).sort((a,b)=>{
  const ready=o=>{const a=activityForSpecies[o.id];if(!a)return 0;const c=activityCondition(s,a.activityId,a.correctAnswer);return c.ok?2:c.checks?.length?c.checks.filter(c=>c.ok).length/c.checks.length:0;};
  return ready(b)-ready(a);
 }).slice(0,6);
}
export function createCollectionView(state,{onActivity,onReplay,onPlace=()=>{}}){
 const guide=document.querySelector('#guide-dialog'),web=document.querySelector('#web-dialog'),replay=document.querySelector('#replay-dialog');
 const empty=node('p','이 조건에 맞는 생물은 없어요. 전체 24종 보기를 선택해 봐요.');empty.id='guide-empty';empty.hidden=true;document.querySelector('#guide-list').after(empty);
 const owned=id=>state.inventory.some(c=>c.speciesId===id&&c.acquired);
 function visual(o){if(o.image){const img=node('img');img.src=o.image;img.alt='';img.loading='lazy';return img;}const icon=node('span',o.placeholder);icon.className='guide-placeholder';icon.setAttribute('aria-hidden','true');return icon;}
 function openGuide(){syncCollection(state);renderGuide();if(!guide.open)guide.showModal();}
 function details(o){
  const d=document.querySelector('#guide-detail');d.replaceChildren();d.append(node('h3',o.name));
  const acquired=owned(o.id),observed=state.profile.speciesObservations[o.id],a=activityForSpecies[o.id],first=state.profile.acquisitions[o.id];
  d.append(node('p',(acquired?'카드 획득':'아직 미획득')+' · '+(observed?'실제 숲 관찰 기록 있음':'실제 숲 관찰 기록 없음')));
  if(acquired){const place=node('button','이 생물 놓기');place.dataset.guidePlace=o.id;place.addEventListener('click',()=>{guide.close();onPlace(o.id);});d.append(place,node('p','지금 숲에 '+state.organisms.filter(n=>n.speciesId===o.id).length+'개체가 있어요.'));d.append(node('p',roleLabels[o.role]+' · '+o.habitat),node('p',o.description));
   const relations=foodRelations.filter(r=>r.sourceSpeciesId===o.id||r.targetSpeciesId===o.id);
   for(const r of relations)d.append(node('p',organismById[r.sourceSpeciesId].name+' → '+organismById[r.targetSpeciesId].name+' · '+(state.profile.relations.some(v=>v.relationId===r.relationId)?'누적 발견':'아직 미발견')));
   if(!relations.length)d.append(node('p',o.id==='earthworm'?'공유 낙엽 잔해를 먹는 토양동물이에요. 먹고 먹히는 관계와 함께 살펴봐요.':'유기물 분해는 따로 살펴봐요.'));
   if(first)d.append(node('p','처음 획득: '+first.round+'번째 숲'+(first.source==='prior-right'?' (이전 저장 권한 포함)':'')));
   if(observed)d.append(node('p','처음 관찰: '+observed.round+'번째 숲 · '+(observed.source==='inspection'?'실제 개체 살펴보기':'실제 먹이 관계 발견')));
  }else if(a){d.append(node('p',a.hint));const b=node('button','탐구 활동 보기');b.dataset.guideActivity=a.activityId;b.addEventListener('click',()=>{guide.close();onActivity(a.activityId);});d.append(b);}
  d.hidden=false;d.focus();
 }
 function renderGuide(){
  const p=collectionProgress(state);document.querySelector('#guide-progress').textContent='획득한 생물 '+p.acquired+' / '+p.total+'종 · 실제 관찰 '+p.observed+'종 · 아직 획득하지 못한 생물 '+(p.total-p.acquired)+'종';
  const list=document.querySelector('#guide-list');list.replaceChildren();
  const filter=document.querySelector('#guide-filter').value;
  for(const o of organisms){if(filter==='unobserved'&&(!owned(o.id)||state.profile.speciesObservations[o.id])||filter==='locked'&&owned(o.id)||['producer','consumer','decomposer'].includes(filter)&&o.role!==filter)continue;const b=node('button');b.dataset.guideSpecies=o.id;b.className='guide-card'+(owned(o.id)?'':' is-locked');b.append(visual(o),node('strong',o.name),node('span',owned(o.id)?state.profile.speciesObservations[o.id]?'획득 · 관찰':'획득 · 관찰 전':'🔒 미획득'),node('small',owned(o.id)?roleLabels[o.role]:'카드를 눌러 탐구 방법을 봐요.'));b.addEventListener('click',()=>details(o));list.append(b);}
  empty.hidden=list.children.length>0;
 }
 function renderWeb(){
  syncCollection(state);const known=new Set(state.profile.relations.map(o=>o.relationId)),current=new Set(state.observations.map(o=>o.relationId)),filter=document.querySelector('#web-filter').value;
  document.querySelector('#web-progress').textContent='누적 발견 '+known.size+' / '+foodRelations.length+'개 관계 · 이번 숲 '+current.size+'개';
  const list=document.querySelector('#web-list');list.replaceChildren();
  for(const r of [...foodRelations].sort((a,b)=>Number(known.has(b.relationId))-Number(known.has(a.relationId)))){
   if(filter==='found'&&!known.has(r.relationId)||filter==='available'&&(!owned(r.sourceSpeciesId)||!owned(r.targetSpeciesId)))continue;
   const row=node('li');row.dataset.webRelation=r.relationId;row.dataset.discovered=String(known.has(r.relationId));
   row.append(node('strong',(owned(r.sourceSpeciesId)?'':'🔒 ')+organismById[r.sourceSpeciesId].name+' → '+(owned(r.targetSpeciesId)?'':'🔒 ')+organismById[r.targetSpeciesId].name),node('p',(current.has(r.relationId)?'이 숲에서 기록했어요':known.has(r.relationId)?'이전 숲에서 발견했어요':'아직 발견하지 못했어요')+' · '+foodPartLabels[r.foodPart]+' 먹이'));
   list.append(row);
  }
 }
 function openWeb(relationId){
  const relation=typeof relationId==='string'&&foodRelations.find(r=>r.relationId===relationId);
  if(relation)document.querySelector('#web-filter').value='all';
  renderWeb();if(!web.open)web.showModal();
  if(relation){const row=document.querySelector('[data-web-relation="'+relation.relationId+'"]');row.tabIndex=-1;row.focus();row.scrollIntoView({block:'nearest'});}
 }
 let clearSignature='',origin=null,busy=false;
 function renderClear(){
  const area=document.querySelector('#clear-collection');area.hidden=!state.forestProgress.cleared;
  const title=document.querySelector('#goal-title'),close=document.querySelector('#goal-close'),actions=area.querySelector('.clear-actions');
  if(area.hidden){title.textContent='첫 숲 목표';if(close.parentElement===actions)document.querySelector('.reset-details').before(close);return;}
  if(title.textContent!=='첫 숲 목표 달성!')title.textContent='첫 숲 목표 달성!';
  if(area.previousElementSibling!==title)title.after(area);
  if(close.parentElement!==actions)actions.append(close);

  syncCollection(state);const p=collectionProgress(state),preview=lockedPreview(state),signature=JSON.stringify([state.round.id,p,preview.map(o=>o.id),state.environmentEvents.sequence]);if(signature===clearSignature)return;clearSignature=signature;
  document.querySelector('#clear-progress').textContent='나의 생물 도감: '+p.acquired+' / 24종';
  document.querySelector('#clear-invitation').textContent=p.acquired===24?'24종 카드를 모두 모았어요! 새 숲에서 아직 관찰하지 못한 생물과 먹이 관계를 탐구해 봐요.':'아직 만나지 못한 생물들이 있어요. 다음 숲에서 탐구해 볼까요?';
  document.querySelector('#clear-optional').textContent=state.environmentEvents.history.length?'지금 숲에서 성장과 분해를 더 살펴봐요.':'숲을 계속 관찰하며 환경 변화를 만나 봐요.';
  const list=document.querySelector('#clear-locked');list.replaceChildren();for(const o of preview){const b=node('button');b.dataset.previewSpecies=o.id;b.append(visual(o),node('strong','🔒 '+o.name),node('small','눌러서 탐구 방법 보기'));b.addEventListener('click',()=>{document.querySelector('#goal-dialog').close();openGuide();details(o);});list.append(b);}
 }
 document.querySelector('#guide-open').addEventListener('click',openGuide);document.querySelector('#guide-close').addEventListener('click',()=>guide.close());document.querySelector('#guide-filter').addEventListener('change',()=>{document.querySelector('#guide-detail').hidden=true;renderGuide();});
 document.querySelector('#web-open').addEventListener('click',openWeb);document.querySelector('#guide-web').addEventListener('click',()=>{guide.close();openWeb();});document.querySelector('#web-close').addEventListener('click',()=>web.close());document.querySelector('#web-filter').addEventListener('change',renderWeb);
 document.querySelector('#clear-guide').addEventListener('click',()=>{document.querySelector('#goal-dialog').close();openGuide();});
 const topicHint=()=>{const plan=replayPlan(state,document.querySelector('#replay-topic').value);document.querySelector('#replay-topic-hint').textContent=plan.description+' 필요한 카드: '+plan.needed.map(id=>organismById[id].name).join('·')+'.';};
 document.querySelector('#replay-topic').addEventListener('change',topicHint);
 document.querySelector('#replay-open').addEventListener('click',()=>{
  if(!state.forestProgress.cleared)return;
  origin=state.round.id;busy=false;const select=document.querySelector('#replay-topic');select.replaceChildren();
  for(const t of replayTopics(state)){const option=node('option',t.label);option.value=t.id;select.append(option);}
  topicHint();
  document.querySelector('#replay-confirm').disabled=false;document.querySelector('#replay-result').textContent='';document.querySelector('#goal-dialog').close();replay.showModal();
 });
 document.querySelector('#replay-cancel').addEventListener('click',()=>replay.close());
 document.querySelector('#replay-confirm').addEventListener('click',()=>{
  if(busy||origin!==state.round.id)return;busy=true;document.querySelector('#replay-confirm').disabled=true;
  const result=onReplay(document.querySelector('#replay-topic').value);
  if(result.ok){replay.close();clearSignature='';}else {busy=false;document.querySelector('#replay-confirm').disabled=false;document.querySelector('#replay-result').textContent=result.message;}
 });
 return {openGuide,openWeb,renderClear,reset(){clearSignature='';document.querySelector('#guide-detail').hidden=true;}};
}
