import {stageBlockers,careOptions} from '../systems/chapter-stage.js';
import {stageConfig as config,chapters,stages,stageById} from '../../data/chapters.js';
import {environmentFactors} from '../../data/environment-config.js';
import {environmentEventDefinitions} from '../../data/environment-events.js';
import {foodRelationById} from '../../data/food-relations.js';
import {organismById} from '../../data/organisms.js';
import {mealSentence,particle} from '../../data/student-text.js';

const name=id=>organismById[id].name;
const blockerText={
 noConsumer:()=>'아직 먹는 동물이 없어요. 동물 카드를 골라 숲에 놓아 보세요.',
 missing:b=>`${particle(name(b.species[0].id),'이','가')} 부족해요. ${b.species[0].need}마리 이상 있어야 해요.`,
 environment:b=>`${particle(b.factors.map(f=>environmentFactors[f].name).join('·'),'이','가')} 나빠요. 기다리거나 환경을 돌봐요.`,
 starving:()=>'먹이를 찾지 못해 배고픈 동물이 있어요. 먹이가 충분한지 살펴봐요.',
 depleted:()=>'먹이 식물이 거의 다 먹혔어요. 먹는 동물에 비해 먹이가 모자라요.',
 noDecomposition:()=>'낙엽과 죽은 나무가 분해되지 않고 있어요. 분해자가 일할 수 있게 해요.',
 noMeal:()=>'아직 먹는 모습이 보이지 않아요. 동물이 먹이를 찾을 때까지 지켜봐요.',
};
const element=(tag,props={},children=[])=>{const e=Object.assign(document.createElement(tag),props);e.append(...children);return e;};
const time=seconds=>`${Math.floor(seconds/60)}분 ${Math.round(seconds%60)}초`;
const chapterNews=chapter=>[
 element('p',{textContent:chapter.intro}),
 element('p',{textContent:`새로 만나는 생물: ${chapter.newSpecies.map(name).join(', ')}`}),
 element('p',{textContent:`새로운 사건: ${environmentEventDefinitions[chapter.events[0]].name}`}),
];

// Stage HUD, observations to catch in the forest, chapter and stage dialogs.
// Create before bindDialogPause so the dialogs pause the forest like the others.
export function createChapterView(getState,{forest,cleared,onCatch,onStage,onCare,onExit}){
 const seeds=Array.from({length:config.seedsToClear},()=>element('span',{className:'chapter-seed'}));
 const title=element('h2'),eyebrow=element('span',{className:'eyebrow'}),goal=element('p',{className:'chapter-goal'});
 const meter=element('progress',{value:0});meter.setAttribute('aria-label','다음 씨앗까지');
 const status=element('p',{className:'chapter-status'});status.setAttribute('aria-live','polite');
 const care=element('div',{className:'chapter-care'});
 const pickButton=element('button',{type:'button',textContent:'스테이지 고르기',onclick:()=>openPicker()});
 const exitButton=element('button',{type:'button',textContent:'기존 숲으로',onclick:onExit});
 const hud=element('section',{className:'chapter-hud'},[
  element('div',{className:'chapter-title'},[eyebrow,title,goal]),
  element('div',{className:'chapter-progress'},[element('div',{className:'chapter-seeds'},seeds),meter,status,care]),
  element('div',{className:'chapter-actions'},[pickButton,exitButton]),
 ]);hud.setAttribute('aria-label','스테이지 목표');
 document.querySelector('.dashboard').after(hud);
 const layer=element('div',{className:'chapter-offers'});forest.append(layer);
 const dialog=element('dialog',{className:'chapter-dialog'});document.body.append(dialog);
 let shownClear=null,shownIntro=null,careKey='';

 function render(){
  const s=getState(),c=s.chapter,stage=stageById[c.stageId];
  // A chapter's first stage opens with its news, like a new tank in the original.
  if(shownIntro!==c.stageId&&stage.chapter.stages[0].stageId===c.stageId&&!document.querySelector('dialog[open]'))openIntro(stage);
  eyebrow.textContent=`챕터 ${stage.chapter.number} · ${stage.chapter.title}`;
  title.textContent=`${stage.stageId} ${stage.title}`;goal.textContent=stage.goal;
  seeds.forEach((seed,i)=>seed.classList.toggle('filled',i<c.seeds));
  hud.querySelector('.chapter-seeds').setAttribute('aria-label',`씨앗 ${c.seeds}/${config.seedsToClear}`);
  meter.max=stage.seedSeconds;meter.value=c.cleared?stage.seedSeconds:c.seedProgress;
  const blockers=c.cleared?[]:stageBlockers(s),first=blockers[0];
  const text=c.cleared?'씨앗 3개를 모두 모았어요!':first?blockerText[first.id](first):'먹이와 먹는 동물이 균형을 이뤄 씨앗이 자라고 있어요.';
  if(status.textContent!==text)status.textContent=text;
  status.dataset.state=c.cleared?'clear':first?'blocked':'growing';
  renderCare(c.cleared?[]:careOptions(s),s.metrics.points);
  renderOffers(c.offers);
  if(c.cleared&&shownClear!==c.stageId&&!document.querySelector('dialog[open]'))openClear();
 }
 // One button per bad factor, rebuilt only when what it would show changes.
 function renderCare(options,points){
  const key=JSON.stringify([options,points]);if(key===careKey)return;careKey=key;
  care.replaceChildren(...options.map(o=>{
   const button=element('button',{type:'button',disabled:!o.ok,textContent:`${environmentFactors[o.factor].name} 돌보기 ${o.cost}P`,onclick:()=>onCare(o.factor)});
   if(!o.ok)button.title=o.message;return button;
  }));
 }
 function renderOffers(offers){
  const live=new Set(offers.map(o=>o.offerId));
  for(const button of [...layer.children])if(!live.has(button.dataset.offerId))button.remove();
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
 const actions=buttons=>element('div',{className:'chapter-actions'},buttons.map(([label,onclick])=>element('button',{type:'button',textContent:label,onclick})));
 const show=children=>{dialog.replaceChildren(...children);dialog.showModal();};
 function openIntro(stage){
  shownIntro=stage.stageId;
  show([element('span',{className:'eyebrow',textContent:`챕터 ${stage.chapter.number}`}),element('h2',{textContent:stage.chapter.title}),...chapterNews(stage.chapter),actions([['시작하기',()=>dialog.close()]])]);
 }
 function openClear(){
  const c=getState().chapter,stage=stageById[c.stageId],index=stages.indexOf(stage),next=stages[index+1];
  const chapterDone=!next||next.chapter!==stage.chapter;
  shownClear=c.stageId;
  show([
   element('h2',{textContent:chapterDone?`챕터 ${stage.chapter.number} ${stage.chapter.title} 완료!`:`${c.stageId} 완료!`}),
   element('p',{textContent:`씨앗 ${config.seedsToClear}개를 모았어요. 걸린 시간 ${time(c.clearedAt)} · 관찰 ${c.observations}번`}),
   ...(next?chapterDone?[element('h3',{textContent:`다음 챕터: ${next.chapter.title}`}),...chapterNews(next.chapter)]:[element('p',{textContent:`다음 스테이지: ${next.stageId} ${next.title}`})]
    :[element('p',{textContent:'모든 챕터를 마쳤어요! 숲의 먹이그물을 끝까지 지켜 냈어요.'})]),
   actions([...(next?[[chapterDone?'다음 챕터로':'다음 스테이지',()=>{dialog.close();onStage(next.stageId);}]]:[]),['다시 하기',()=>{dialog.close();onStage(c.stageId);}],['닫기',()=>dialog.close()]]),
  ]);
 }
 function openPicker(){
  const done=cleared(),open=stage=>{const i=stages.indexOf(stage);return i===0||done.includes(stages[i-1].stageId);};
  show([element('h2',{textContent:'스테이지 고르기'}),...chapters.map(chapter=>element('section',{className:'chapter-stage-group'},[
   element('h3',{textContent:`챕터 ${chapter.number} ${chapter.title}`}),
   element('ul',{className:'chapter-stage-list'},chapter.stages.map(raw=>{const stage=stageById[raw.stageId],ok=open(stage);
    return element('li',{},[element('button',{type:'button',disabled:!ok,textContent:`${done.includes(stage.stageId)?'✓ ':''}${stage.stageId} ${stage.title}${ok?'':' (앞 스테이지를 마치면 열려요)'}`,onclick:()=>{dialog.close();onStage(stage.stageId);}})]);})),
  ])),actions([['닫기',()=>dialog.close()]])]);
 }
 return {render,caughtMessage,reset:()=>{shownClear=null;careKey='';layer.replaceChildren();}};
}
