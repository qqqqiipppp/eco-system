import {replayPlan} from '../systems/learning-guidance.js';
import {organisms,organismById} from '../../data/organisms.js';
import {activityForSpecies} from '../../data/activities.js';
import {createFieldGuideView} from './field-guide-view.js';
import {createFoodWebView} from './food-web-view.js';
import {node,speciesVisual as visual} from './collection-dom.js';
import {collectionProgress,syncCollection} from '../state/collection-state.js';
import {activityCondition} from '../systems/activity-rules.js';
import {replayTopics} from '../systems/replay.js';
import {foodRelationById} from '../../data/food-relations.js';
import {mealSentence} from '../../data/student-text.js';
export function lockedPreview(s){
 return organisms.filter(o=>!s.inventory.find(c=>c.speciesId===o.id)?.acquired).sort((a,b)=>{
  const ready=o=>{const a=activityForSpecies[o.id];if(!a)return 0;const c=activityCondition(s,a.activityId,a.correctAnswer);return c.ok?2:c.checks?.length?c.checks.filter(c=>c.ok).length/c.checks.length:0;};
  return ready(b)-ready(a);
 }).slice(0,6);
}
export function createCollectionView(state,{onActivity,onReplay,onPlace=()=>{},onReturn=()=>{}}){
 const guide=document.querySelector('#guide-dialog'),web=document.querySelector('#web-dialog'),replay=document.querySelector('#replay-dialog');
 let navigationOrigin=null;
 const leave=action=>{navigationOrigin=null;guide.close();web.close();action();};
 const guideView=createFieldGuideView(state,{onWeb:id=>openWeb(id),onActivity:id=>leave(()=>onActivity(id)),onPlace:id=>leave(()=>onPlace(id))});
 const webView=createFoodWebView(state,{onGuide:id=>openGuide(id)});
 function openGuide(id,source){
  if(source!==undefined)navigationOrigin=source;
  web.close();guideView.render(id);if(!guide.open)guide.showModal();
 }
 function openWeb(id,source){
  if(source!==undefined)navigationOrigin=source;
  guide.close();webView.open(id);if(!web.open)web.showModal();webView.focusRelation();
 }
 function restoreOrigin(){if(guide.open||web.open||!navigationOrigin)return;const source=navigationOrigin;navigationOrigin=null;onReturn(source);}
 guide.addEventListener('close',restoreOrigin);web.addEventListener('close',restoreOrigin);
 let clearSignature='',origin=null,busy=false;
 function renderClear(){
  const area=document.querySelector('#clear-collection');area.hidden=!state.forestProgress.cleared;
  const title=document.querySelector('#goal-title'),close=document.querySelector('#goal-close'),actions=area.querySelector('.clear-actions');
  if(area.hidden){title.textContent='첫 숲 목표';if(close.parentElement===actions)document.querySelector('.reset-details').before(close);return;}
  if(title.textContent!=='첫 숲 목표 달성!')title.textContent='첫 숲 목표 달성!';
  if(area.previousElementSibling!==title)title.after(area);
  if(close.parentElement!==actions)actions.append(close);

  syncCollection(state);const p=collectionProgress(state),preview=lockedPreview(state),signature=JSON.stringify([state.round.id,p,preview.map(o=>o.id),state.environmentEvents.sequence]);if(signature===clearSignature)return;clearSignature=signature;
  const learned=document.querySelector('#clear-learned');learned.replaceChildren();
  for(const record of state.observations){const relation=foodRelationById[record.relationId];if(relation)learned.append(node('li',mealSentence(relation)));}
  const progress=state.learningGoalProgress;
  if(state.goalRevision===2&&progress.decomposer)learned.append(node('li',organismById[progress.decomposer.speciesId].name+'의 분해 활동과 양분의 순환을 살펴봤어요.'));
  if(state.goalRevision===2&&progress.inquiry?.phase==='confirmed')learned.append(node('li','내 선택 뒤 식물이 먹이가 되고, 그 식물의 먹이가 다시 늘어나는 것을 확인했어요.'));
  document.querySelector('#clear-progress').textContent='나의 생물 도감: '+p.acquired+' / 24종';
  document.querySelector('#clear-invitation').textContent=p.acquired===24?'24종 카드를 모두 모았어요! 새 숲에서 아직 관찰하지 못한 생물과 먹이 관계를 탐구해 봐요.':'아직 만나지 못한 생물들이 있어요. 다음 숲에서 탐구해 볼까요?';
  document.querySelector('#clear-optional').textContent=state.environmentEvents.history.length?'지금 숲에서 성장과 분해를 더 살펴봐요.':'숲을 계속 관찰하며 환경 변화를 만나 봐요.';
  const list=document.querySelector('#clear-locked');list.replaceChildren();for(const o of preview){const b=node('button');b.dataset.previewSpecies=o.id;b.append(visual(o),node('strong','🔒 '+o.name),node('small','눌러서 탐구 방법 보기'));b.addEventListener('click',()=>{document.querySelector('#goal-dialog').close();openGuide(o.id,null);});list.append(b);}
 }
 document.querySelector('#guide-open').addEventListener('click',()=>openGuide(undefined,null));
 document.querySelector('#guide-close').addEventListener('click',()=>guide.close());
 document.querySelector('#web-open').addEventListener('click',()=>openWeb(undefined,null));
 document.querySelector('#guide-web').addEventListener('click',()=>openWeb(guideView.selected()||undefined));
 document.querySelector('#web-close').addEventListener('click',()=>web.close());
 document.querySelector('#clear-guide').addEventListener('click',()=>{document.querySelector('#goal-dialog').close();openGuide(undefined,null);});
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
 return {openGuide,openWeb,renderClear,reset(){clearSignature='';navigationOrigin=null;guideView.reset();webView.reset();}};
}
