import {organisms,organismById,roleLabels} from '../../data/organisms.js';
import {activityForSpecies} from '../../data/activities.js';
import {speciesHabitats,habitatZones} from '../../data/habitats.js';
import {collectionProgress} from '../state/collection-state.js';
import {particle} from '../../data/student-text.js';
import {studentDescription} from './student-guidance.js';
import {studentFood} from './student-status.js';
import {speciesStatus,guideSpecies,speciesRelations,relationStatus,relationStatusLabels,relationName,foodPartName,decompositionParts,organicPartNames} from './collection-model.js';
import {node,button,speciesVisual} from './collection-dom.js';

export function createFieldGuideView(state,{onWeb,onActivity,onPlace}){
 const list=document.querySelector('#guide-list'),detail=document.querySelector('#guide-detail'),layout=document.querySelector('#guide-layout');
 const filter=document.querySelector('#guide-filter'),search=document.querySelector('#guide-search'),empty=document.querySelector('#guide-empty');
 let selected=null,signature='';
 const roleButtons=[...document.querySelectorAll('[data-guide-role-filter]')];
 function renderDetail(){
  detail.hidden=!selected;layout.classList.toggle('has-detail',Boolean(selected));if(!selected)return;
  const o=organismById[selected],status=speciesStatus(state,selected);detail.replaceChildren();
  const back=button('목록 보기',()=>{selected=null;render();list.querySelector('[data-guide-species="'+o.id+'"]')?.focus({preventScroll:true});});
  const top=node('div');top.className='guide-detail-heading';top.append(speciesVisual(o),node('h3',o.name),back);detail.append(top);
  if(o.id==='soil-bacteria')detail.append(node('p','고초균은 아주 작아서 맨눈으로 보기 어려워요. 그림은 여러 세균을 크게 나타냈어요.'))
  else detail.append(node('p','게임 속 크기는 화면에서 보기 쉽게 조절했어요. 실제 생물끼리의 크기 비율과는 달라요.'));
  detail.append(node('p',roleLabels[o.role]+' · '+(status.acquired?'카드를 가지고 있어요.':'🔒 아직 얻지 못한 생물이에요.')));
  detail.append(node('p',status.current?'✓ 이번 숲에서 살펴봤어요!':status.observed?'↶ 지난 숲에서 살펴봤어요.':status.acquired?'카드는 있지만 아직 살펴보지 않았어요.':'아직 살펴보지 않은 생물이에요.'));
  detail.append(node('p',status.living?'지금 숲에 '+status.living+'개체가 있어요.':'지금 숲에는 없어요.'));
  const actions=node('div');actions.className='guide-detail-actions';
  const web=button('관련 먹이그물 보기',()=>onWeb(selected));web.dataset.guideWeb=selected;actions.append(web);
  if(status.acquired){
   const place=button('이 생물 놓기',()=>onPlace(selected));place.dataset.guidePlace=selected;actions.append(place);
   detail.append(node('p',studentDescription(o).split(/(?<=\.)\s/)[0]));
   detail.append(node('p','사는 곳: '+o.habitat+' · 게임 활동 공간: '+habitatZones[speciesHabitats[selected].primary]));
   const relations=speciesRelations(selected);
   detail.append(node('h4',o.role==='producer'?'양분을 만드는 생산자':'먹이를 얻는 방법'),node('p',studentFood(selected)));
   function group(title,rows,emptyText){
    detail.append(node('h4',title));if(!rows.length){detail.append(node('p',emptyText));return;}
    const ul=node('ul');ul.className='guide-relation-list';
    for(const r of rows){const li=node('li'),b=button(relationName(r)+' · '+foodPartName(r)+' · '+relationStatusLabels[relationStatus(state,r).kind],()=>onWeb(r.relationId));b.dataset.guideRelation=r.relationId;li.append(b);ul.append(li);}detail.append(ul);
   }
   if(o.role!=='producer')group('이 게임에서 먹는 생물',relations.foods,selected==='earthworm'?'참지렁이의 낙엽 잔해 섭식은 아래 포식 화살표와 따로 살펴봐요.':o.role==='decomposer'?'분해자는 포식 화살표 대신 유기물 처리를 살펴봐요.':'현재 구현된 생물 먹이 관계는 없어요.');
   group(particle(o.name,'을','를')+' 먹는 생물',relations.predators,'현재 구현된 포식 화살표는 없어요.');
   if(o.role==='decomposer')detail.append(node('p','게임에서 처리하는 자원: '+decompositionParts(selected).map(p=>organicPartNames[p]).join('·')+'. 실제 처리 여부는 숲에서 확인해요.'));
   if(selected==='earthworm')detail.append(node('p','참지렁이는 낙엽 잔해를 먹고 토양을 돕는 소비자예요. 균류·세균인 분해자와 구분해요.'));
   const more=node('details'),summary=node('summary','생물 특징 더 보기');more.append(summary,node('p',studentDescription(o)));
   const first=state.profile.acquisitions[selected],observed=state.profile.speciesObservations[selected];
   if(first)more.append(node('p','처음 획득: '+first.round+'번째 숲'+(first.source==='prior-right'?' (이전 저장 권한 포함)':'')));
   if(observed)more.append(node('p','처음 관찰: '+observed.round+'번째 숲 · '+(observed.source==='inspection'?'실제 개체 살펴보기':'실제 먹이 관계 발견')));
   detail.append(more);
  }else{
   const a=activityForSpecies[selected];detail.append(node('p','이 카드는 아직 없어요. 이름과 역할, 먹이그물 미리보기는 발견 완료 기록이 아니에요.'));
   if(a){detail.append(node('p',a.hint));const learn=button('미션 시작하기',()=>onActivity(a.activityId));learn.dataset.guideActivity=a.activityId;actions.append(learn);}
  }
  detail.append(actions);
 }
 function render(requested){
  if(requested&&organismById[requested]){
   selected=requested;
   if(!guideSpecies(state,filter.value,search.value).some(o=>o.id===requested)){filter.value='all';search.value='';}
  }
  const p=collectionProgress(state);document.querySelector('#guide-progress').textContent='획득한 생물 '+p.acquired+' / '+p.total+'종 · 실제 관찰 '+organisms.filter(o=>speciesStatus(state,o.id).observed).length+'종';
  for(const b of roleButtons)b.setAttribute('aria-pressed',String(filter.value===b.dataset.guideRoleFilter));
  const shown=guideSpecies(state,filter.value,search.value);
  const next=JSON.stringify([filter.value,search.value,state.round.id,organisms.map(o=>speciesStatus(state,o.id))]);
  if(signature!==next){signature=next;list.replaceChildren();
   for(const o of shown){const status=speciesStatus(state,o.id),b=button('',()=>{selected=o.id;render();detail.focus({preventScroll:true});});
    b.dataset.guideSpecies=o.id;b.dataset.role=o.role;b.className='guide-card'+(status.acquired?'':' is-locked');
    const copy=node('span');copy.className='guide-card-copy';copy.append(node('strong',o.name),node('small',roleLabels[o.role]+' · '+o.caption),node('span',(status.acquired?'카드 있음':'🔒 아직 카드 없음')+' · '+(status.current?'✓ 이번 숲에서 살펴봤어요':status.observed?'↶ 지난 숲에서 살펴봤어요':'아직 살펴보기 전')));
    b.append(speciesVisual(o),copy);b.setAttribute('aria-label',o.name+' · '+roleLabels[o.role]+' · '+(status.acquired?'카드 있음':'아직 카드 없음')+' · '+(status.current?'이번 숲에서 살펴봄':status.observed?'지난 숲에서 살펴봄':'아직 살펴보기 전'));list.append(b);
   }
  }
  for(const b of list.querySelectorAll('[data-guide-species]'))b.setAttribute('aria-pressed',String(b.dataset.guideSpecies===selected));
  empty.hidden=shown.length>0;document.querySelector('#guide-results').textContent=shown.length+'종을 보고 있어요';renderDetail();
 }
 filter.addEventListener('change',()=>{selected=null;render();});search.addEventListener('input',()=>{selected=null;render();});
 for(const b of roleButtons)b.addEventListener('click',()=>{selected=null;filter.value=b.dataset.guideRoleFilter;render();});
 return {render,selected:()=>selected,reset(){selected=null;signature='';filter.value='all';search.value='';detail.hidden=true;layout.classList.remove('has-detail');}};
}
