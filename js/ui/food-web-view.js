import {organisms,organismById,roleLabels} from '../../data/organisms.js';
import {foodRelationById,foodRelations} from '../../data/food-relations.js';
import {speciesStatus,visibleRelations,relationStatus,relationStatusLabels,relationName,foodPartName,decompositionParts,organicPartNames} from './collection-model.js';
import {focusLayout,followChain} from './food-web-layout.js';
import {node,button,speciesVisual} from './collection-dom.js';
const svgNode=(tag,attributes={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attributes))n.setAttribute(k,String(v));return n;};

export function createFoodWebView(state,{onGuide}){
 const filter=document.querySelector('#web-filter'),select=document.querySelector('#web-species'),stage=document.querySelector('#web-stage'),list=document.querySelector('#web-list'),related=document.querySelector('#web-related'),selection=document.querySelector('#web-selection');
 let focus='grass',selectedRelation=null,chain=['grass'];
 const center=()=>{const canvas=document.querySelector('#web-canvas-scroll');canvas.scrollLeft=Math.max(0,(canvas.scrollWidth-canvas.clientWidth)/2);};
 for(const role of ['producer','consumer','decomposer']){const group=node('optgroup');group.label=roleLabels[role];for(const o of organisms.filter(o=>o.role===role)){const option=node('option',o.name);option.value=o.id;group.append(option);}select.append(group);}
 function selectRelation(id){selectedRelation=id;render();document.querySelector('[data-web-edge="'+id+'"]')?.focus({preventScroll:true});}
 function selectNode(id,relation){
  if(relation){chain=followChain(chain,relation.sourceSpeciesId,relation.targetSpeciesId,foodRelations);selectedRelation=relation.relationId;}
  else if(id!==focus){chain=[id];selectedRelation=null;}
  focus=id;select.value=id;render();center();document.querySelector('[data-web-node="'+id+'"]')?.focus({preventScroll:true});
 }
 function renderSelection(){
  selection.replaceChildren();const r=foodRelationById[selectedRelation];selection.hidden=!r;if(!r)return;
  const status=relationStatus(state,r);selection.append(node('h3',relationName(r)),node('p',foodPartName(r)+' · '+relationStatusLabels[status.kind]),node('p',status.live?'● 지금 두 생물이 있어요. 아직 실제로 먹었다는 뜻은 아니에요.':'○ 지금 한쪽 생물이 없어요. 이미 확인한 발견은 남아 있어요.'));
  selection.append(node('p',r.evidenceLevel==='B'?'이 관계는 실제 먹이군을 게임에서 간단히 나타낸 것이에요.':'기존 생태 자료를 바탕으로 만든 게임의 먹이 관계예요.'));
  const actions=node('div');actions.className='web-detail-actions';actions.append(button('먹이 생물 도감',()=>onGuide(r.sourceSpeciesId)),button('먹는 생물 도감',()=>onGuide(r.targetSpeciesId)));selection.append(actions);
 }
 function render(){
  const relations=visibleRelations(state,filter.value),layout=focusLayout(relations,focus),known=new Set(state.profile.relations.map(r=>r.relationId)),current=new Set(state.observations.map(r=>r.relationId));
  document.querySelector('#web-progress').textContent='누적 발견 '+known.size+' / '+foodRelations.length+'개 관계 · 이번 숲 '+current.size+'개';
  select.value=focus;stage.replaceChildren();stage.style.aspectRatio=layout.width+'/'+layout.height;
  const svg=svgNode('svg',{viewBox:`0 0 ${layout.width} ${layout.height}`,'aria-label':'먹이에서 먹는 생물로 향하는 화살표',role:'group'}),defs=svgNode('defs');
  const colors={current:'#2d6a44',previous:'#3e6394',unseen:'#7a8077',selected:'#80501b'};
  for(const [kind,color]of Object.entries(colors)){const marker=svgNode('marker',{id:'food-arrow-'+kind,viewBox:'0 0 12 12',refX:10,refY:6,markerWidth:12,markerHeight:12,markerUnits:'userSpaceOnUse',orient:'auto'});marker.append(svgNode('path',{d:'M 1 1 L 11 6 L 1 11 Z',fill:color}));defs.append(marker);}svg.append(defs);
  for(const edge of layout.edges){
   const r=foodRelationById[edge.id],status=relationStatus(state,r),selected=selectedRelation===edge.id;
   const group=svgNode('g',{'data-web-edge':edge.id,'data-source':edge.source,'data-target':edge.target,'data-status':status.kind,role:'button',tabindex:0,'aria-label':relationName(r)+' · '+foodPartName(r)+' · '+relationStatusLabels[status.kind],'aria-pressed':String(selected)});
   if(selected)group.append(svgNode('path',{d:edge.path,class:'web-edge-halo'}));
   group.append(svgNode('path',{d:edge.path,class:'web-edge '+status.kind,'marker-end':'url(#food-arrow-'+(selected?'selected':status.kind)+')',stroke:selected?colors.selected:colors[status.kind]}),svgNode('path',{d:edge.path,class:'web-edge-hit'}));
   group.addEventListener('click',()=>selectRelation(edge.id));group.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();selectRelation(edge.id);}});svg.append(group);
  }
  stage.append(svg);
  for(const n of layout.nodes){
   const o=organismById[n.id],status=speciesStatus(state,n.id),r=relations.find(r=>(r.sourceSpeciesId===focus&&r.targetSpeciesId===n.id)||(r.targetSpeciesId===focus&&r.sourceSpeciesId===n.id));
   const b=button('',()=>n.id===focus?onGuide(n.id):selectNode(n.id,r));b.className='web-node '+n.side;b.dataset.webNode=n.id;b.dataset.role=o.role;b.setAttribute('aria-pressed',String(n.id===focus));b.dataset.relationSelected=String(Boolean(selectedRelation&&[foodRelationById[selectedRelation]?.sourceSpeciesId,foodRelationById[selectedRelation]?.targetSpeciesId].includes(n.id)));b.setAttribute('aria-label',o.name+' · '+roleLabels[o.role]+' · '+(status.acquired?'카드 있음':'아직 카드 없음')+' · '+(status.current?'이번 숲 관찰':status.observed?'이전 관찰':'기록 전'));
   b.style.left=n.x/layout.width*100+'%';b.style.top=n.y/layout.height*100+'%';b.style.width=n.width/layout.width*100+'%';
   b.append(speciesVisual(o),node('strong',o.name),node('small',roleLabels[o.role]+' · '+(status.current?'✓ 이번 숲':status.observed?'↶ 이전 관찰':'기록 전')),node('span',(status.acquired?'카드 있음':'🔒 카드 없음')+' · '+(status.living?'숲에 있음':'숲에 없음')));stage.append(b);
  }
  related.replaceChildren();for(const edge of layout.edges){const r=foodRelationById[edge.id],v=relationStatus(state,r),b=button(relationName(r)+' · '+foodPartName(r)+' · '+relationStatusLabels[v.kind],()=>selectRelation(edge.id));b.dataset.webRelated=edge.id;b.setAttribute('aria-pressed',String(selectedRelation===edge.id));related.append(b);}
  document.querySelector('#web-empty').hidden=layout.edges.length>0||organismById[focus].role==='decomposer';
  const chainArea=document.querySelector('#web-chain');chainArea.textContent='먹이사슬 따라보기: '+chain.map(id=>organismById[id].name).join(' → ')+(chain.length>1?' · 발견 여부는 각 화살표에서 확인해요.':' · 옆 생물을 눌러 이어 봐요.');
  const cycle=document.querySelector('#web-decomposition');cycle.hidden=organismById[focus].role!=='decomposer'&&focus!=='earthworm';cycle.replaceChildren();
  if(!cycle.hidden){
   if(focus==='earthworm')cycle.append(node('h3','낙엽을 먹는 토양동물·소비자'),node('p','낙엽은 죽은 식물의 잔해예요. 참지렁이는 이를 먹고 토양을 도와요. 다른 동물에게 먹히는 관계는 화살표에서 봐요.'));
   else cycle.append(node('h3','유기물 분해를 따로 살펴봐요'),node('p',organismById[focus].name+'의 게임 자원: '+decompositionParts(focus).map(p=>organicPartNames[p]).join('·')+'. 실제 유기물을 처리하면 숲의 토양 양분에 기여해요. 유기물 분해와 동물의 먹이 활동을 구분해 봐요.'));
  }
  list.replaceChildren();for(const r of relations){const status=relationStatus(state,r),li=node('li');li.dataset.webRelation=r.relationId;li.dataset.discovered=String(status.known);const b=button(relationName(r)+' · '+foodPartName(r)+' · '+relationStatusLabels[status.kind],()=>{focus=r.targetSpeciesId;chain=[r.sourceSpeciesId,r.targetSpeciesId];selectedRelation=r.relationId;render();document.querySelector('[data-web-edge="'+r.relationId+'"]')?.focus({preventScroll:true});});li.append(b);list.append(li);}
  renderSelection();
 }
 filter.addEventListener('change',()=>{if(selectedRelation&&!visibleRelations(state,filter.value).some(r=>r.relationId===selectedRelation))selectedRelation=null;render();});select.addEventListener('change',()=>selectNode(select.value));
 document.querySelector('#web-guide').addEventListener('click',()=>onGuide(focus));document.querySelector('#web-chain-reset').addEventListener('click',()=>{chain=[focus];selectedRelation=null;render();});
 return {render,open(input){
  if(typeof input==='string'&&foodRelationById[input]){const r=foodRelationById[input];filter.value='all';focus=r.targetSpeciesId;chain=[r.sourceSpeciesId,r.targetSpeciesId];selectedRelation=r.relationId;}
  else if(typeof input==='string'&&organismById[input]&&input!==focus){focus=input;chain=[input];selectedRelation=null;}
  render();
 },focusRelation(){center();if(selectedRelation)document.querySelector('[data-web-edge="'+selectedRelation+'"]')?.focus({preventScroll:true});},reset(){focus='grass';chain=['grass'];selectedRelation=null;filter.value='all';}};
}
