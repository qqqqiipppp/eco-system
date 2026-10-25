import {stageBlockers,careOptions,needStates,neededCards,priceOf,prepareOptions,crisisReport,markReported,breedingState,isYoung} from '../systems/chapter-stage.js';
import {currentEnvironmentEvent} from '../systems/environment-events.js';
import {stageConfig as config,chapters,stages,stageById,crises,crisisForFactor,breeding} from '../../data/chapters.js';
import {environmentFactors} from '../../data/environment-config.js';
import {environmentEventDefinitions} from '../../data/environment-events.js';
import {foodRelationById} from '../../data/food-relations.js';
import {organismById} from '../../data/organisms.js';
import {mealSentence,particle} from '../../data/student-text.js';
import {visualAsset} from './species-visuals.js';

const name=id=>organismById[id].name;
const blockerText={
 noConsumer:()=>'아직 먹는 동물이 없어요. 동물 카드를 골라 숲에 놓아 보세요.',
 missing:b=>`${particle(name(b.species[0].id),'이','가')} 부족해요. ${b.species[0].need}마리 이상 있어야 해요.`,
 environment:b=>crisisForFactor(b.factors[0])?.status||`${particle(b.factors.map(f=>environmentFactors[f].name).join('·'),'이','가')} 나빠요.`,
 starving:()=>'먹이를 찾지 못해 배고픈 동물이 있어요. 먹이가 충분한지 살펴봐요.',
 depleted:()=>'먹이 식물이 거의 다 먹혔어요. 먹는 동물에 비해 먹이가 모자라요.',
 noDecomposition:()=>'낙엽과 죽은 나무가 분해되지 않고 있어요. 분해자가 일할 수 있게 해요.',
 noMeal:()=>'아직 먹는 모습이 보이지 않아요. 동물이 먹이를 찾을 때까지 지켜봐요.',
 needBirth:(b,s)=>{const n=name(b.speciesId),count=s.organisms.filter(o=>o.speciesId===b.speciesId).length;
  return `세 번째 숲 별은 새로 태어난 ${particle(n,'이','가')} 있어야 차올라요. `+(count<2?`${particle(n,'이','가')} 두 마리 있어야 번식해요. 한 마리를 더 놓아요.`:breedingLine(s)||`${n} 두 마리가 배고프지 않게 지내면 ${particle(breeding.species[b.speciesId].sign,'이','가')} 생겨요.`);},
};
// How far the stage's own species is along: "멧토끼 짝이 번식을 준비하고 있어요 (30초 남음)".
// Rounded to 5 s so the spoken status does not change every second.
const fiveUp=seconds=>Math.max(5,Math.ceil(seconds/5)*5);
function breedingLine(s){
 const id=stageById[s.chapter.stageId].birthRequired,b=id&&breedingState(s)[id];if(!b)return '';
 if(b.pending)return `${name(id)}의 ${particle(b.rule.sign,'이','가')} 생겼어요. 약 ${fiveUp(b.pending.remaining)}초 뒤에 태어나요.`;
 return b.pair.length?`${name(id)} 짝이 번식을 준비하고 있어요 (${fiveUp(b.rule.healthySeconds-b.healthy)}초 남음).`:'';
}
const element=(tag,props={},children=[])=>{const e=Object.assign(document.createElement(tag),props);e.append(...children);return e;};
const time=seconds=>`${Math.floor(seconds/60)}분 ${Math.round(seconds%60)}초`;
const chapterNews=chapter=>[
 element('p',{textContent:chapter.intro}),
 element('p',{textContent:`새로 만나는 생물: ${chapter.newSpecies.map(name).join(', ')}`}),
 element('p',{textContent:`새로운 사건: ${environmentEventDefinitions[chapter.events[0]].name}${crises[chapter.events[0]].human?' (사람이 만든 문제)':' (자연 현상)'}`}),
];

// Stage HUD, things to tap in the forest (💡 and litter), crisis warnings,
// chapter dialogs and the chapter map. Create before bindDialogPause so the
// dialogs pause the forest like the others. No sound: motion and colour only.
export function createChapterView(getState,{forest,cleared,notify,onCatch,onCollect,onPrepare,onStage,onCare,onExit,openWeb,webComplete}){
 const seeds=Array.from({length:config.seedsToClear},()=>element('span',{className:'chapter-seed'}));
 const title=element('h2'),eyebrow=element('span',{className:'eyebrow'}),goal=element('p',{className:'chapter-goal'});
 const meter=element('progress',{value:0});meter.setAttribute('aria-label','다음 숲 별까지');
 const status=element('p',{className:'chapter-status'});status.setAttribute('aria-live','polite');
 const care=element('div',{className:'chapter-care'});
 const mapButton=element('button',{type:'button',textContent:'숲 지도',onclick:()=>openMap()});
 const webButton=element('button',{type:'button',textContent:'나의 먹이그물',onclick:()=>openWeb(stageById[getState().chapter.stageId].chapter.number)});
 const exitButton=element('button',{type:'button',textContent:'기존 숲으로',onclick:onExit});
 const hud=element('section',{className:'chapter-hud'},[
  element('div',{className:'chapter-title'},[eyebrow,title,goal]),
  element('div',{className:'chapter-progress'},[element('div',{className:'chapter-seeds'},seeds),meter,status,care]),
  element('div',{className:'chapter-actions'},[webButton,mapButton,exitButton]),
 ]);hud.setAttribute('aria-label','스테이지 목표');
 document.querySelector('.dashboard').after(hud);
 const layer=element('div',{className:'chapter-offers'}),warning=element('p',{className:'chapter-warning',hidden:true});
 warning.setAttribute('role','alert');forest.append(layer,warning);
 const dialog=element('dialog',{className:'chapter-dialog'});document.body.append(dialog);
 let shownClear=null,shownIntro=null,careKey='',shopKey='',lastSeeds=0;

 function render(){
  const s=getState(),c=s.chapter,stage=stageById[c.stageId];
  // A chapter's first stage opens with its news, like a new tank in the original.
  if(shownIntro!==c.stageId&&stage.chapter.stages[0].stageId===c.stageId&&!document.querySelector('dialog[open]'))openIntro(stage);
  eyebrow.textContent=`챕터 ${stage.chapter.number} · ${stage.chapter.title}`;
  title.textContent=`${stage.stageId} ${stage.title}`;goal.textContent=stage.goal;
  seeds.forEach((seed,i)=>seed.classList.toggle('filled',i<c.seeds));
  if(c.seeds>lastSeeds)pop(seeds[c.seeds-1]);lastSeeds=c.seeds;
  hud.querySelector('.chapter-seeds').setAttribute('aria-label',`숲 별 ${c.seeds}/${config.seedsToClear}`);
  meter.max=stage.seedSeconds;meter.value=c.cleared?stage.seedSeconds:c.seedProgress;
  const blockers=c.cleared?[]:stageBlockers(s),first=blockers[0];
  const birthDone=c.births.some(b=>b.speciesId===stage.birthRequired);
  const text=c.cleared?'숲 별 3개를 모두 모았어요!':first?blockerText[first.id](first,s):'먹이와 먹는 동물이 균형을 이뤄 숲 별이 차오르고 있어요.'+(stage.birthRequired&&!birthDone&&breedingLine(s)?' '+breedingLine(s):'');
  if(status.textContent!==text)status.textContent=text;
  status.dataset.state=c.cleared?'clear':first?'blocked':'growing';
  renderCare(c.cleared?[]:careOptions(s),s.metrics.points);
  renderShop(s);
  renderNeeds(c.cleared?new Map():needStates(s),c.cleared?new Set():neededCards(s,blockers));
  renderTaps(c);
  renderBreeding(s);
  renderCrisis(s);
  const idle=!document.querySelector('dialog[open]');
  // Weather is coming: stop and choose how to prepare. Then see how it went.
  if(idle&&prepareOptions(s).length)openPrepare(s);
  else if(idle&&!c.cleared&&crisisReport(s))openReport(crisisReport(s));
  if(c.cleared&&shownClear!==c.stageId&&!document.querySelector('dialog[open]'))openClear();
 }
 // A short-lived class for a one-off animation, removed when it ends.
 function pop(el,cls='pop'){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);el.addEventListener('animationend',()=>el.classList.remove(cls),{once:true});}
 // "+1P" / "-4P" rising from where it happened.
 function float(text,rect,kind){
  const box=forest.getBoundingClientRect(),tag=element('span',{className:`chapter-float ${kind}`,textContent:text});
  tag.setAttribute('aria-hidden','true');tag.style.left=`${rect.left-box.left+rect.width/2}px`;tag.style.top=`${rect.top-box.top}px`;
  forest.append(tag);tag.addEventListener('animationend',()=>tag.remove(),{once:true});setTimeout(()=>tag.remove(),2000);
  pop(document.querySelector('#points-value')?.closest('.metric'),'bump');
 }
 // Breeding made visible. A pair wears two half hearts (left on one, right on
 // the other) that make one heart together; the stage's own species is bright,
 // the others pale. Then the egg or nest with its countdown, then the newborn.
 const pairNote='번식 준비 중인 짝';
 let pairMemory={},formedShown=new Set();
 function renderBreeding(s){
  const states=breedingState(s),focus=stageById[s.chapter.stageId].birthRequired,marks={};
  for(const [id,b] of Object.entries(states)){
   if(b.pending)marks[b.pending.parentId]={kind:'pending',label:`${b.rule.sign} ${Math.max(1,Math.ceil(b.pending.remaining))}`};
   else b.pair.forEach((pid,i)=>{marks[pid]={kind:i?'pair-right':'pair-left',label:''};});
   if(id===focus)watchPair(s,id,b);
  }
  for(const el of forest.querySelectorAll('#organism-layer .organism-object')){
   const o=s.organisms.find(x=>x.instanceId===el.dataset.instanceId);if(!o)continue;
   const rule=breeding.species[o.speciesId];
   const mark=marks[o.instanceId]||(rule&&isYoung(s,o)?{kind:'young',label:`새로 태어난 ${rule.young}`}:{kind:'',label:''});
   const tone=mark.kind.startsWith('pair')?(o.speciesId===focus?'focus':'other'):'';
   if((el.dataset.breed||'')!==mark.kind)mark.kind?el.dataset.breed=mark.kind:delete el.dataset.breed;
   if((el.dataset.breedLabel||'')!==mark.label)mark.label?el.dataset.breedLabel=mark.label:delete el.dataset.breedLabel;
   if((el.dataset.breedTone||'')!==tone)tone?el.dataset.breedTone=tone:delete el.dataset.breedTone;
   const hit=el.querySelector('.organism-hit'),note=tone?pairNote:'';
   if(hit&&(hit.getAttribute('aria-description')||'')!==note)note?hit.setAttribute('aria-description',note):hit.removeAttribute('aria-description');
  }
 }
 // Say once what the hearts mean, and why a pair came apart (not every flicker).
 function watchPair(s,id,b){
  const before=pairMemory[id]||{pair:[],at:-99},n=name(id);
  if(b.pair.length&&!before.pair.length&&!formedShown.has(id)){formedShown.add(id);
   notify(`${n} 두 마리가 짝을 이뤘어요. 반쪽 하트 두 개가 만나 하나가 돼요. 둘 다 배고프지 않게 지내면 ${particle(b.rule.sign,'이','가')} 생겨요.`,true);}
  const justBorn=s.chapter.births.some(x=>x.speciesId===id&&s.simulationTime-x.at<10);
  if(!b.pair.length&&before.pair.length&&!b.pending&&!justBorn&&s.simulationTime-before.at>=20){
   const parents=before.pair.map(pid=>s.organisms.find(o=>o.instanceId===pid));
   const reason=parents.some(o=>!o)?'짝 한 마리가 숲에서 사라져서':b.count>=breeding.maximum?`숲에 ${particle(n,'이','가')} 이미 많아서`:parents.some(o=>o.hunger>.8)?`${particle(n,'이','가')} 배고파서`:`${particle(n,'이','가')} 약해져서`;
   notify(`${reason} 번식 준비가 멈췄어요.`,false);before.at=s.simulationTime;
  }
  pairMemory[id]={pair:b.pair,at:before.at};
 }
 // Warning before a crisis, then the forest's colour while it lasts.
 function renderCrisis(s){
  const c=s.chapter,event=currentEnvironmentEvent(s),kind=c.warning?.kind||(event&&event.phase!=='ended'?event.kind:'');
  if((forest.dataset.weather||'')!==kind){if(kind)forest.dataset.weather=kind;else delete forest.dataset.weather;}
  const text=c.warning?`⚠ ${crises[c.warning.kind].notice} ${Math.max(1,Math.ceil(c.warning.startsAt-s.simulationTime))}`:'';
  if(warning.textContent!==text)warning.textContent=text;warning.hidden=!text;
 }
 // Badges on the animals and plants, and the cards that would help: the same
 // rules that stall the seeds, so what the student sees is the reason.
 const needLabel={hungry:'!',starving:'!!',eaten:'다 먹혔어요'};
 function renderNeeds(states,cards){
  for(const el of forest.querySelectorAll('#organism-layer .organism-object')){
   const state=states.get(el.dataset.instanceId)||'';if((el.dataset.need||'')===state)continue;
   if(state){el.dataset.need=state;el.dataset.needLabel=needLabel[state];}else{delete el.dataset.need;delete el.dataset.needLabel;}
  }
  for(const card of document.querySelectorAll('.organism-card[data-species-id]')){
   const on=cards.has(card.dataset.speciesId);if((card.dataset.chapterNeed==='true')===on)continue;
   if(on)card.dataset.chapterNeed='true';else delete card.dataset.chapterNeed;
  }
 }
 // The card row is the shop: each card shows its price and dims when unaffordable.
 function renderShop(s){
  const cards=[...document.querySelectorAll('.organism-card[data-species-id]')],key=s.metrics.points+':'+cards.length;
  if(key===shopKey&&cards.every(c=>c.dataset.price))return;shopKey=key;
  for(const card of cards){const price=priceOf(card.dataset.speciesId);card.dataset.price=price+'P';card.dataset.afford=String(s.metrics.points>=price);}
 }
 // One button per bad factor people can act on, rebuilt only when it changes.
 function renderCare(options,points){
  const key=JSON.stringify([options,points]);if(key===careKey)return;careKey=key;
  care.replaceChildren(...options.map(o=>{
   const button=element('button',{type:'button',disabled:!o.ok,textContent:`${o.label} ${o.cost}P`,onclick:()=>onCare(o.factor)});
   if(!o.ok)button.title=o.message;return button;
  }));
 }
 // 💡 pinned where a meal happened, and litter or smog where it fell. Both are
 // still targets: easy to tap on a tablet.
 function renderTaps(c){
  const live=new Set([...c.offers.map(o=>o.offerId),...c.trash.map(t=>t.trashId)]);
  for(const button of [...layer.children])if(!live.has(button.dataset.tapId))button.remove();
  const box=forest.getBoundingClientRect();
  for(const offer of c.offers){
   if(layer.querySelector(`[data-tap-id="${offer.offerId}"]`))continue;
   const animal=forest.querySelector(`#organism-layer [data-instance-id="${offer.consumerInstanceId}"]`);if(!animal)continue;
   const r=animal.getBoundingClientRect();
   tapButton(offer.offerId,'chapter-offer','💡','먹는 모습 관찰하기',r.left-box.left+r.width/2,r.top-box.top,button=>{
    const rect=button.getBoundingClientRect(),result=onCatch(offer.offerId);if(result?.ok)float(`+${config.observationReward}P${result.bonus?' ★':''}`,rect,'gain');});
  }
  for(const item of c.trash){
   if(layer.querySelector(`[data-tap-id="${item.trashId}"]`))continue;
   const crisis=crises[item.kind];
   tapButton(item.trashId,'chapter-trash',`${crisis.icon} ${crisis.item}`,`${crisis.item} 치우기`,item.x*box.width,item.y*box.height,button=>{
    const rect=button.getBoundingClientRect(),result=onCollect(item.trashId);if(result?.ok)float(`+${config.trashReward}P`,rect,'gain');});
  }
 }
 function tapButton(id,cls,icon,label,x,y,onTap){
  const button=element('button',{type:'button',className:cls,textContent:icon});
  button.dataset.tapId=id;button.setAttribute('aria-label',label);button.style.left=`${x}px`;button.style.top=`${y}px`;
  button.addEventListener('click',event=>{event.stopPropagation();onTap(button);});
  layer.append(button);
 }
 function spent(price,instance){
  const el=forest.querySelector(`#organism-layer [data-instance-id="${instance.instanceId}"]`);
  if(el)float(`-${price}P`,el.getBoundingClientRect(),'spend');
 }
 function caughtMessage(result){
  const relation=foodRelationById[result.offer.relationId];
  const sentence=relation?mealSentence(relation)+' ':'';
  return sentence+(result.bonus?'관찰 기록! 숲 별이 조금 더 찼어요.':'관찰 기록! 지금은 숲의 균형이 맞지 않아 숲 별이 차오르지 않아요.');
 }
 const actions=buttons=>element('div',{className:'chapter-actions'},buttons.map(([label,onclick])=>element('button',{type:'button',textContent:label,onclick})));
 const show=(children,cls='')=>{dialog.className=`chapter-dialog ${cls}`;dialog.replaceChildren(...children);dialog.showModal();};
 function openIntro(stage){
  shownIntro=stage.stageId;
  show([element('span',{className:'eyebrow',textContent:`챕터 ${stage.chapter.number}`}),element('h2',{textContent:stage.chapter.title}),...chapterNews(stage.chapter),
   element('p',{className:'chapter-shop-note',textContent:'💡를 잡으면 포인트가 생겨요. 포인트로 생물 카드를 사서 숲에 놓아요.'}),actions([['시작하기',()=>dialog.close()]])]);
 }
 // Before weather: it cannot be changed, but the forest can be made sturdier.
 const prepareLabel={plant:id=>`${name(id)} 더 심기 (${priceOf(id)}P)`,reduce:id=>`${name(id)} 한 마리 돌려보내기`,wait:()=>'그냥 기다리기'};
 const prepareChosen={plant:'먹이 식물 더 심기',reduce:'먹는 동물 줄이기',wait:'그냥 기다리기'};
 function openPrepare(s){
  const kind=s.chapter.warning?.kind||s.chapter.crisisLog.at(-1).kind,crisis=crises[kind],options=prepareOptions(s);
  show([element('span',{className:'eyebrow',textContent:'대비하기'}),element('h2',{textContent:crisis.notice}),
   element('p',{textContent:`${crisis.effect} 날씨는 바꿀 수 없지만, 숲을 미리 튼튼하게 만들 수는 있어요. 무엇을 할까요?`}),
   element('div',{className:'chapter-actions chapter-prepare'},options.map(o=>{
    const button=element('button',{type:'button',disabled:!o.ok,textContent:prepareLabel[o.id](o.speciesId),onclick:()=>{dialog.close();onPrepare(o.id);}});
    if(o.id==='reduce'&&!o.ok)button.title='더 줄일 수 있는 먹는 동물이 없어요.';return button;}))],'chapter-prepare-dialog');
 }
 function reportLines(record){
  const event=environmentEventDefinitions[record.kind],stalled=Math.round(record.stalled);
  return [element('p',{textContent:`고른 대비: ${prepareChosen[record.choice||'wait']} · ${particle(event.name,'이','가')} 오는 동안 숲 별이 멈춘 시간: ${stalled}초`}),
   element('p',{className:'chapter-lesson',textContent:`${stalled<=5?'미리 대비한 덕분에 숲이 잘 버텼어요.':'먹이가 모자라 숲 별이 멈췄어요. 다음에는 날씨가 오기 전에 먹이 식물을 늘려 봐요.'} 날씨는 바꿀 수 없지만, 생태계를 튼튼하게 하면 더 잘 버틸 수 있어요.`})];
 }
 function openReport(record){
  markReported(record);
  show([element('h2',{textContent:`${particle(environmentEventDefinitions[record.kind].name,'이','가')} 지나갔어요`}),...reportLines(record),actions([['계속하기',()=>dialog.close()]])]);
 }
 // The original's pet hatching: three seeds go into the soil and sprout.
 const planting=()=>element('div',{className:'chapter-planting'},Array.from({length:config.seedsToClear},(_,i)=>{
  const spot=element('span',{className:'plant-spot'},[element('span',{className:'plant-seed'}),element('span',{className:'plant-sprout'})]);
  spot.style.setProperty('--i',i);return spot;}));
 function openClear(){
  const c=getState().chapter,stage=stageById[c.stageId],index=stages.indexOf(stage),next=stages[index+1];
  const chapterDone=!next||next.chapter!==stage.chapter,number=stage.chapter.number;
  // A chapter ends with its part of "나의 먹이그물"; only then does the next one open.
  const webDue=chapterDone&&!webComplete(number);
  shownClear=c.stageId;
  show([
   planting(),
   element('h2',{textContent:chapterDone?`챕터 ${stage.chapter.number} ${stage.chapter.title} 완료!`:`${c.stageId} 완료!`}),
   ...getState().chapter.crisisLog.filter(r=>!r.reported).flatMap(r=>{markReported(r);return reportLines(r);}),
   element('p',{textContent:`숲 별 ${config.seedsToClear}개를 모아 숲에 새싹이 돋았어요. 걸린 시간 ${time(c.clearedAt)} · 관찰 ${c.observations}번${c.trashCollected?` · 치운 ${crises[stage.events.find(k=>crises[k].human)]?.item||'쓰레기'} ${c.trashCollected}개`:''}`}),
   ...(next?chapterDone?[element('h3',{textContent:`다음 챕터: ${next.chapter.title}`}),...chapterNews(next.chapter)]:[element('p',{textContent:`다음 스테이지: ${next.stageId} ${next.title}`})]
    :[element('p',{textContent:'모든 챕터를 마쳤어요! 숲의 먹이그물을 끝까지 지켜 냈어요.'})]),
   ...(webDue?[element('p',{className:'web-due',textContent:`이번 챕터에서 만난 생물로 나의 먹이그물을 이어 그려야 ${next?'다음 챕터가 열려요':'모든 챕터를 마쳐요'}.`})]:[]),
   actions([...(webDue?[['나의 먹이그물 그리기',()=>{dialog.close();openWeb(number);}]]:next?[[chapterDone?'다음 챕터로':'다음 스테이지',()=>{dialog.close();onStage(next.stageId);}]]:[]),['다시 하기',()=>{dialog.close();onStage(c.stageId);}],['숲 지도',()=>openMap()]]),
  ]);
 }
 // The original's tank select: four forest areas on a path, three stages each.
 function openMap(){
  const done=cleared(),current=getState().chapter.stageId,open=stage=>{const i=stages.indexOf(stage);return i===0||done.includes(stages[i-1].stageId);};
  show([element('h2',{textContent:'숲 지도'}),element('div',{className:'chapter-map'},chapters.map(chapter=>{
   const list=chapter.stages.map(raw=>stageById[raw.stageId]),reached=open(list[0]),crisis=crises[chapter.events[0]];
   return element('section',{className:`map-area map-${chapter.chapterId}${reached?'':' locked'}`},[
    element('div',{className:'map-head'},[element('span',{className:'eyebrow',textContent:`챕터 ${chapter.number}`}),element('h3',{textContent:chapter.title}),
     ...(webComplete(chapter.number)?[element('span',{className:'map-web',textContent:'먹이그물 완성'})]:[])]),
    element('div',{className:'map-species'},chapter.newSpecies.slice(0,4).map(id=>element('img',{src:visualAsset(id),alt:name(id),title:name(id)}))),
    element('p',{className:'map-crisis',textContent:`${crisis.human?'사람이 만든 문제':'자연 현상'}: ${environmentEventDefinitions[chapter.events[0]].name}`}),
    element('ol',{className:'map-stones'},list.map(stage=>{const ok=open(stage),state=done.includes(stage.stageId)?'done':stage.stageId===current?'current':ok?'open':'locked';
     const button=element('button',{type:'button',disabled:!ok,className:`map-stone ${state}`,textContent:state==='done'?'✓':state==='locked'?'🔒':stage.stageId.split('-')[1],
      onclick:()=>{dialog.close();onStage(stage.stageId);}});
     button.setAttribute('aria-label',`${stage.stageId} ${stage.title}${state==='done'?' 완료':state==='locked'?' 잠김':''}`);button.title=`${stage.stageId} ${stage.title}`;
     return element('li',{},[button,element('span',{textContent:stage.title})]);})),
   ]);
  })),actions([['닫기',()=>dialog.close()]])],'chapter-map-dialog');
 }
 // Back from a finished web: show the chapter's end again, now with the way on.
 const webDone=()=>{if(getState().chapter.cleared&&!document.querySelector('dialog[open]'))openClear();};
 return {render,caughtMessage,webDone,spent,reset:()=>{shownClear=null;careKey='';shopKey='';lastSeeds=0;pairMemory={};formedShown=new Set();layer.replaceChildren();}};
}
