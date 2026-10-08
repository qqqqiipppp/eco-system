import {forestGoal} from '../../data/forest-goal.js';
import {goalPresentation,nextAction} from '../systems/goal-guidance.js';
import {calculateProgress} from '../systems/forest-progress.js';
const messages={new:'자동 저장 준비',loaded:'저장된 숲을 불러왔어요',saved:'저장됨',pending:'저장 중',recovered:'일부 저장 기록을 정리해 불러왔어요',damaged:'저장 기록이 손상되어 새 숲을 열었어요', 'missing-version':'저장 형식을 확인할 수 없어 새 숲을 열었어요','old-version':'이전 저장 형식이에요. 새로 시작하기 전에는 덮어쓰지 않아요.','future-version':'더 새로운 저장 형식이에요. 새로 시작하기 전에는 덮어쓰지 않아요.',unavailable:'이 브라우저에서는 저장을 사용할 수 없어요',failed:'저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'};
export function showSaveStatus(status){const node=document.querySelector('#save-status');if(node)node.textContent=messages[status]||status;}
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
  setText('goal-count',presentation.achieved+'/'+presentation.total+'개 달성');
  setText('hold-label','최종 안정 상태 '+forestGoal.stableSeconds+'초 유지');
  setText('next-action',nextAction(state));
  document.querySelector('#forest-progress').value=calculateProgress(state);
  document.querySelector('#hold-progress').value=Math.min(1,progress.stableSeconds/forestGoal.stableSeconds);
  setText('goal-status',progress.cleared?'목표 달성 기록은 유지돼요. 현재 부족한 조건도 계속 돌봐요.':presentation.ready?'안정 상태를 조금 더 유지해 보세요.':'조건이 깨지면 안정 상태 유지가 처음부터 시작돼요.');
  const list=document.querySelector('#goal-checks');
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
