import {stageBlockers} from '../systems/chapter-stage.js';
import {stageConfig as config,stages,stageById} from '../../data/chapters.js';
import {environmentFactors} from '../../data/environment-config.js';
import {foodRelationById} from '../../data/food-relations.js';
import {mealSentence,particle} from '../../data/student-text.js';

const blockerText={
 noConsumer:()=>'아직 먹는 동물이 없어요. 동물 카드를 골라 숲에 놓아 보세요.',
 environment:b=>`${particle(b.factors.map(f=>environmentFactors[f].name).join('·'),'이','가')} 나빠요. 기다리거나 환경을 돌봐요.`,
 starving:()=>'몹시 배고픈 동물이 있어요. 먹이가 충분한지 살펴봐요.',
 depleted:()=>'먹이 식물이 거의 다 먹혔어요. 먹는 동물에 비해 먹이가 모자라요.',
 noMeal:()=>'아직 먹는 모습이 보이지 않아요. 동물이 먹이를 찾을 때까지 지켜봐요.',
};
const element=(tag,props={},children=[])=>{const e=Object.assign(document.createElement(tag),props);e.append(...children);return e;};
const time=seconds=>`${Math.floor(seconds/60)}분 ${Math.round(seconds%60)}초`;

// Stage HUD, observations to catch in the forest, clear and stage dialogs.
// Create before bindDialogPause so the dialogs pause the forest like the others.
export function createChapterView(getState,{forest,cleared,onCatch,onStage,onEnvironment,onExit}){
 const seeds=Array.from({length:config.seedsToClear},()=>element('span',{className:'chapter-seed'}));
 const title=element('h2'),eyebrow=element('span',{className:'eyebrow'}),goal=element('p',{className:'chapter-goal'});
 const meter=element('progress',{max:config.seedSeconds,value:0});meter.setAttribute('aria-label','다음 씨앗까지');
 const status=element('p',{className:'chapter-status'});status.setAttribute('aria-live','polite');
 const careButton=element('button',{type:'button',textContent:'환경 살펴보기',hidden:true,onclick:onEnvironment});
 const pickButton=element('button',{type:'button',textContent:'스테이지 고르기',onclick:()=>openPicker()});
 const exitButton=element('button',{type:'button',textContent:'기존 숲으로',onclick:onExit});
 const hud=element('section',{className:'chapter-hud'},[
  element('div',{className:'chapter-title'},[eyebrow,title,goal]),
  element('div',{className:'chapter-progress'},[element('div',{className:'chapter-seeds'},seeds),meter,status]),
  element('div',{className:'chapter-actions'},[careButton,pickButton,exitButton]),
 ]);hud.setAttribute('aria-label','스테이지 목표');
 document.querySelector('.dashboard').after(hud);
 const layer=element('div',{className:'chapter-offers'});forest.append(layer);
 const clearDialog=element('dialog',{className:'chapter-dialog'}),pickDialog=element('dialog',{className:'chapter-dialog'});
 document.body.append(clearDialog,pickDialog);
 let shownClear=null;

 function render(){
  const s=getState(),c=s.chapter,stage=stageById[c.stageId];
  eyebrow.textContent=`챕터 ${stage.chapter.number} · ${stage.chapter.title}`;
  title.textContent=`${stage.stageId} ${stage.title}`;goal.textContent=stage.goal;
  seeds.forEach((seed,i)=>seed.classList.toggle('filled',i<c.seeds));
  hud.querySelector('.chapter-seeds').setAttribute('aria-label',`씨앗 ${c.seeds}/${config.seedsToClear}`);
  meter.value=c.cleared?config.seedSeconds:c.seedProgress;
  const blockers=c.cleared?[]:stageBlockers(s),first=blockers[0];
  const text=c.cleared?'씨앗 3개를 모두 모았어요!':first?blockerText[first.id](first):'먹이와 먹는 동물이 균형을 이뤄 씨앗이 자라고 있어요.';
  if(status.textContent!==text)status.textContent=text;
  status.dataset.state=c.cleared?'clear':first?'blocked':'growing';
  careButton.hidden=!blockers.some(b=>b.id==='environment');
  renderOffers(c.offers);
  if(c.cleared&&shownClear!==c.stageId&&!document.querySelector('dialog[open]'))openClear();
 }
 function renderOffers(offers){
  const live=new Set(offers.map(o=>o.offerId));
  for(const button of layer.children)if(!live.has(button.dataset.offerId))button.remove();
  const box=forest.getBoundingClientRect();
  // Pinned where the meal happened: a still target is easy to tap on a tablet.
  for(const offer of offers){
   if(layer.querySelector(`[data-offer-id="${offer.offerId}"]`))continue;
   const animal=forest.querySelector(`#organism-layer [data-instance-id="${offer.consumerInstanceId}"]`);
   if(!animal)continue;
   const button=element('button',{type:'button',className:'chapter-offer',textContent:'💡'});
   button.dataset.offerId=offer.offerId;button.setAttribute('aria-label','먹는 모습 관찰하기');
   button.addEventListener('click',event=>{event.stopPropagation();onCatch(offer.offerId);});
   const r=animal.getBoundingClientRect();
   button.style.left=`${r.left-box.left+r.width/2}px`;button.style.top=`${r.top-box.top}px`;
   layer.append(button);
  }
 }
 function caughtMessage(result){
  const relation=foodRelationById[result.offer.relationId];
  const sentence=relation?mealSentence(relation)+' ':'';
  return sentence+(result.bonus?'관찰 기록! 씨앗이 조금 더 자랐어요.':'관찰 기록! 지금은 숲의 균형이 맞지 않아 씨앗이 자라지 않아요.');
 }
 function openClear(){
  const c=getState().chapter,index=stages.findIndex(s=>s.stageId===c.stageId),next=stages[index+1];
  shownClear=c.stageId;
  clearDialog.replaceChildren(
   element('h2',{textContent:`${c.stageId} 완료!`}),
   element('p',{textContent:`씨앗 ${config.seedsToClear}개를 모았어요. 걸린 시간 ${time(c.clearedAt)} · 관찰 ${c.observations}번`}),
   element('p',{textContent:next?`다음 스테이지: ${next.stageId} ${next.title}`:'준비된 스테이지를 모두 마쳤어요. 다음 챕터는 준비 중이에요.'}),
   element('div',{className:'chapter-actions'},[
    ...(next?[element('button',{type:'button',textContent:'다음 스테이지',onclick:()=>{clearDialog.close();onStage(next.stageId);}})]:[]),
    element('button',{type:'button',textContent:'다시 하기',onclick:()=>{clearDialog.close();onStage(c.stageId);}}),
    element('button',{type:'button',textContent:'닫기',onclick:()=>clearDialog.close()}),
   ]));
  clearDialog.showModal();
 }
 function openPicker(){
  const done=cleared();
  pickDialog.replaceChildren(element('h2',{textContent:'스테이지 고르기'}),
   element('ul',{className:'chapter-stage-list'},stages.map((stage,i)=>{
    const open=i===0||done.includes(stages[i-1].stageId);
    return element('li',{},[element('button',{type:'button',disabled:!open,textContent:`${done.includes(stage.stageId)?'✓ ':''}${stage.stageId} ${stage.title}${open?'':' (앞 스테이지를 마치면 열려요)'}`,onclick:()=>{pickDialog.close();onStage(stage.stageId);}})]);
   })),
   element('div',{className:'chapter-actions'},[element('button',{type:'button',textContent:'닫기',onclick:()=>pickDialog.close()})]));
  pickDialog.showModal();
 }
 return {render,caughtMessage,reset:()=>{shownClear=null;layer.replaceChildren();}};
}
