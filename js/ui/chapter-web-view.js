import {webNodes,webRelations,webLevels,checkRole,checkArrow,foodChains,spreadOfChange,webStatus,chapterFactor,roleNames,roleMeaning} from '../systems/food-web-builder.js';
import {organismById} from '../../data/organisms.js';
import {foodRelationById} from '../../data/food-relations.js';
import {environmentFactors} from '../../data/environment-config.js';
import {visualAsset} from './species-visuals.js';
import {particle} from '../../data/student-text.js';

const element=(tag,props={},children=[])=>{const e=Object.assign(document.createElement(tag),props);e.append(...children);return e;};
const svgElement=(tag,attrs={})=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
const name=id=>organismById[id].name;
const ecosystem='생태계는 생물 요소와 햇빛·물·공기·흙 같은 비생물 요소가 서로 영향을 주고받는 하나의 연결된 체계예요.';

// Positions in percent of the board: producers at the bottom, each consumer one
// row above its food, decomposers in a column on the right, abiotic strip below.
function layout(nodes){
 const levels=webLevels(nodes),rows={},pos={},top=Math.max(1,...nodes.filter(id=>organismById[id].role==='consumer').map(id=>levels[id]));
 const living=nodes.filter(id=>organismById[id].role!=='decomposer'&&id!=='earthworm'),side=nodes.filter(id=>!living.includes(id));
 for(const id of living)(rows[levels[id]]??=[]).push(id);
 for(const [level,ids] of Object.entries(rows))// A crowded row zigzags so its cards do not touch.
 ids.forEach((id,i)=>{pos[id]={x:(side.length?78:100)*(i+1)/(ids.length+1),y:76-64*Number(level)/top+(ids.length>4?(i%2?-3:3):0)};});
 side.forEach((id,i)=>{pos[id]={x:87,y:12+66*(i+.5)/side.length};});
 return pos;
}

// "나의 먹이그물": sort roles, draw arrows, then see how one change spreads.
export function createChapterWebView(progress,{onComplete=()=>{}}={}){
 const dialog=element('dialog',{className:'chapter-dialog chapter-web-dialog'});document.body.append(dialog);
 let chapterNumber=1,selected=null,picks=new Set(),stepNote='';

 // Open first so the board has a size: lines are drawn in real pixels, which keeps arrowheads true.
 function open(n){chapterNumber=n;selected=null;picks=new Set();stepNote='';if(!dialog.open)dialog.showModal();render();}
 function step(status){return status.missingRoles.length?1:status.missingArrows.length?2:!status.systemDone?3:4;}
 function render(){
  const p=progress.read(),status=webStatus(p,chapterNumber),nodes=status.nodes,s=step(status),pos=layout(nodes);
  const relations=webRelations(nodes),chains=foodChains(nodes);
  const steps=['역할 나누기','먹이 관계 잇기','연결 살펴보기'].map((label,i)=>element('li',{className:i+1<s?'done':i+1===s?'now':'',textContent:`${i+1}. ${label}`}));
  const guide={
   1:'새로 만난 생물을 눌러 생산자, 소비자, 분해자 중 하나로 나눠요.',
   2:`먹히는 생물을 먼저 누르고, 그것을 먹는 생물을 눌러요. 화살표는 먹히는 쪽에서 먹는 쪽으로 가요. (${relations.length-status.missingArrows.length}/${relations.length})`,
   3:'',4:'',
  }[s];
  const board=element('div',{className:'web-board'});
  const svg=svgElement('svg',{class:'web-lines','aria-hidden':'true'});board.append(svg);
  const sortedSide=nodes.filter(id=>(organismById[id].role==='decomposer'||id==='earthworm')&&p.roles[id]);
  board.append(element('div',{className:'web-abiotic'},[element('strong',{textContent:'비생물 요소'}),...Object.values(environmentFactors).map(f=>element('span',{textContent:f.name})),element('small',{className:'web-legend',textContent:'실선: 💡로 관찰한 관계 · 점선: 아직 관찰하지 못한 관계'})]));
  if(sortedSide.length)board.append(element('span',{className:'web-loop-label',textContent:'죽은 생물·낙엽 → 분해 → 흙의 양분'}));
  for(const id of nodes){
   const role=p.roles[id],affected=s===3&&picks.has(id);
   const button=element('button',{type:'button',className:`web-node${role?' role-'+role:' unsorted'}${selected===id?' selected':''}${affected?' picked':''}`,
    onclick:()=>tap(id,s)},[element('img',{src:visualAsset(id),alt:''}),element('span',{className:'web-node-text'},[element('span',{textContent:name(id)}),element('small',{textContent:role?roleNames[organismById[id].role]:'?'})])]);
   button.style.left=pos[id].x+'%';button.style.top=pos[id].y+'%';button.dataset.speciesId=id;
   board.append(button);
  }
  const panel=element('div',{className:'web-panel'});
  if(s===1&&selected)panel.append(element('p',{textContent:`${particle(name(selected),'은','는')} 어떤 역할일까요?`}),element('div',{className:'chapter-actions web-roles'},Object.entries(roleNames).map(([role,label])=>element('button',{type:'button',textContent:label,onclick:()=>chooseRole(selected,role)}))));
  if(s===3){
   const f=chapterFactor(chapterNumber),factor=environmentFactors[f.factor].name;
   panel.append(element('p',{className:'web-question',textContent:`${particle(f.name,'으로','로')} ${particle(factor,'이','가')} 나빠지면 어떤 생물이 영향을 받을까요? 영향을 받는 생물을 모두 눌러 고른 뒤 확인해요.`}),
    element('div',{className:'chapter-actions'},[element('button',{type:'button',textContent:`확인 (${picks.size}개 고름)`,onclick:()=>checkSystem(nodes,factor)})]));
  }
  if(s===4)panel.append(element('p',{textContent:`먹이사슬 ${chains.length}개가 ${chains.length>1?'서로 얽혀 먹이그물이 되었어요':'이어져 있어요'}. 한 생물에게 생긴 변화는 먹이그물을 따라 다른 생물에게 퍼져요.`}),element('p',{className:'web-ecosystem',textContent:ecosystem}),
   element('div',{className:'chapter-actions'},[element('button',{type:'button',textContent:'완성!',onclick:()=>{dialog.close();onComplete(chapterNumber);}})]));
  if(stepNote)panel.prepend(element('p',{className:'web-note',textContent:stepNote}));
  dialog.replaceChildren(
   element('div',{className:'web-head'},[element('h2',{textContent:`나의 먹이그물 · 챕터 ${chapterNumber}`}),element('ol',{className:'web-steps'},steps),element('button',{type:'button',className:'web-close',textContent:'닫기',onclick:()=>dialog.close()})]),
   ...(guide?[element('p',{className:'web-guide',textContent:guide})]:[]),
   board,panel,
  );
  drawLines(svg,board,p,relations,sortedSide);
 }
 // Food → eater arrows, sunlight/water/air/soil → plants, and the decomposition loop.
 function drawLines(svg,board,p,relations,sortedSide){
  const box=board.getBoundingClientRect(),at=id=>{const r=board.querySelector(`.web-node[data-species-id="${id}"]`).getBoundingClientRect();return {x:r.left-box.left+r.width/2,top:r.top-box.top,bottom:r.bottom-box.top,left:r.left-box.left,right:r.right-box.left};};
  const ground=box.height-(board.querySelector('.web-abiotic')?.offsetHeight||36);
  svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
  // One arrowhead per colour: older tablet browsers lack context-stroke.
  const heads={observed:'#2f7a3c',arrow:'#5f7457',abiotic:'#a08a5f',loop:'#8a5a2b'};
  svg.innerHTML='<defs>'+Object.entries(heads).map(([k,c])=>`<marker id="web-head-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')+'</defs>';
  const head=cls=>`url(#web-head-${cls.includes('observed')?'observed':cls.includes('abiotic')?'abiotic':cls.includes('loop')?'loop':'arrow'})`;
  const line=(x1,y1,x2,y2,cls)=>svg.append(svgElement('line',{x1,y1,x2,y2,class:cls,'marker-end':head(cls)}));
  for(const id of [...board.querySelectorAll('.web-node')].map(b=>b.dataset.speciesId).filter(id=>organismById[id].role==='producer')){const a=at(id);line(a.x,ground,a.x,a.bottom+2,'web-abiotic-line');}
  for(const r of relations.filter(r=>p.drawn.includes(r.relationId))){const a=at(r.sourceSpeciesId),b=at(r.targetSpeciesId);line(a.x,a.top,b.x,b.bottom+2,p.observed.includes(r.relationId)?'web-arrow observed':'web-arrow');}
  if(sortedSide.length){const last=at(sortedSide.at(-1));svg.append(svgElement('path',{d:`M ${last.x} ${last.bottom} L ${last.x} ${ground-6} L ${box.width*.55} ${ground-6}`,class:'web-loop','marker-end':head('web-loop')}));}
 }
 function tap(id,s){
  const p=progress.read();
  if(s===1){if(p.roles[id]){stepNote=`${name(id)}: ${roleNames[organismById[id].role]}. ${roleMeaning[organismById[id].role]}`;selected=null;}else{selected=id;stepNote='';}render();return;}
  if(s===2){
   if(organismById[id].role==='decomposer'){stepNote='분해자와 이어지는 선은 저절로 그려져요. 살아 있는 생물끼리의 먹이 관계를 이어요.';selected=null;render();return;}
   if(!selected){selected=id;stepNote=`${particle(name(id),'을','를')} 먹는 생물을 눌러요.`;render();return;}
   const r=checkArrow(selected,id,p.observed);stepNote=r.message;selected=null;
   if(r.ok)progress.markDrawn(r.relationId);render();return;
  }
  if(s===3){picks.has(id)?picks.delete(id):picks.add(id);render();}
 }
 function chooseRole(id,role){const r=checkRole(id,role);stepNote=r.message;if(r.ok){progress.setRole(id,role);selected=null;}render();}
 function checkSystem(nodes,factor){
  const steps=spreadOfChange(nodes,factor),missed=nodes.filter(id=>!picks.has(id));
  if(!missed.length){progress.markSystem(chapterNumber);stepNote=`맞아요. 모든 생물이 영향을 받아요. ${[...steps.values()].slice(0,3).join(' ')}`;}
  else stepNote=`아직 영향을 받는 생물이 더 있어요. 힌트: ${steps.get(missed[0])}`;
  render();
 }
 return {open,isComplete:n=>webStatus(progress.read(),n).complete,dialog};
}
