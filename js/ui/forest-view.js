import {renderMissionList} from './forest-flow.js';
import {forestGoal} from '../../data/forest-goal.js';
import {goalPresentation} from '../systems/goal-guidance.js';
import {calculateProgress} from '../systems/forest-progress.js';
const keepSave='새로 시작하기 전에는 저장을 바꾸지 않아요.';
const messages={'unknown-pacing':'진행 속도가 다른 숲이라 열 수 없어요. '+keepSave,new:'자동 저장 준비',loaded:'저장된 숲을 불러왔어요',saved:'저장됨',pending:'저장 중',recovered:'읽을 수 있는 기록으로 숲을 불러왔어요. 일부 기록은 정리했어요.',damaged:'저장된 숲을 읽을 수 없어 새 숲을 열었어요.', 'missing-version':'저장된 숲의 버전을 알 수 없어 새 숲을 열었어요.','old-version':'너무 오래된 버전의 숲이라 열 수 없어요. '+keepSave,'future-version':'더 새로운 게임에서 저장한 숲이에요. '+keepSave,unavailable:'이 브라우저에서는 저장을 사용할 수 없어요',failed:'저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'};
export function showSaveStatus(status){const node=document.querySelector('#save-status');if(node)node.textContent=status==='unknown-goal'?'탐구 목표가 다른 숲이라 열 수 없어요. '+keepSave:status==='unknown-ecology'?'생물 종류가 다른 숲이라 열 수 없어요. '+keepSave:messages[status]||status;}
export function createForestView(state,onRestart){
 const dialog=document.querySelector('#goal-dialog'),reset=document.querySelector('#restart-dialog');
 const rows=new Map();
 document.querySelector('#goal-open').addEventListener('click',()=>{render();dialog.showModal()});
 document.querySelector('#goal-close').addEventListener('click',()=>dialog.close());
 document.querySelector('#restart-open').addEventListener('click',()=>{dialog.close();document.querySelector('#restart-result').textContent='';reset.showModal()});
 document.querySelector('#restart-cancel').addEventListener('click',()=>reset.close());
 document.querySelector('#restart-confirm').addEventListener('click',()=>{if(onRestart())reset.close();else document.querySelector('#restart-result').textContent='저장 기록을 지우지 못했어요. 현재 숲은 유지했어요.';});
 function render(){
  const progress=state.forestProgress,presentation=goalPresentation(state);
  const setText=(id,text)=>{const node=document.querySelector('#'+id);if(node.textContent!==text)node.textContent=text;};
  setText('goal-label',progress.cleared?'숲 생태계 목표 달성!':presentation.ready?'숲이 안정되어 가고 있어요':'🌲 숲 생태계 목표');
  const learning=presentation.groups.filter(g=>['food','roles','inquiry'].includes(g.id));
  setText('goal-count',state.goalRevision===2?learning.filter(g=>g.ok).length+'/3가지 탐구':presentation.achieved+'/'+presentation.total+'개 달성');
  setText('hold-label','최종 안정 상태 '+forestGoal.stableSeconds+'초 유지');
  document.querySelector('#forest-progress').value=calculateProgress(state);
  document.querySelector('#hold-progress').value=Math.min(1,progress.stableSeconds/forestGoal.stableSeconds);
  setText('goal-status',progress.cleared?'목표 달성 기록은 유지돼요. 현재 부족한 조건도 계속 돌봐요.':presentation.ready?'안정 상태를 조금 더 유지해 보세요.':'조건이 깨지면 안정 상태 유지가 처음부터 시작돼요.');
  renderMissionList(document.querySelector('#goal-missions'),state);
  const list=document.querySelector('#goal-checks');
  for(const [id,row]of rows)if(!presentation.groups.some(g=>g.id===id)){row.node.remove();rows.delete(id);}
  for(const group of presentation.groups){
    let row=rows.get(group.id);
    if(!row){const node=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('p');node.dataset.goalGroup=group.id;node.append(title,detail);list.append(node);row={node,title,detail};rows.set(group.id,row);}
    const title=(group.ok?'✓ ':'○ ')+group.title;
    if(row.title.textContent!==title)row.title.textContent=title;
    if(row.detail.textContent!==group.detail)row.detail.textContent=group.detail;
    row.node.dataset.achieved=String(group.ok);
  }
 }
 return {render};
}
