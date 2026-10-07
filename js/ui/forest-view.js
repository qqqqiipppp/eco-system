import {forestGoal} from '../../data/forest-goal.js';
import {evaluateForestGoal,calculateProgress} from '../systems/forest-progress.js';
const messages={new:'자동 저장 준비',loaded:'저장된 숲을 불러왔어요',saved:'저장됨',pending:'저장 중',recovered:'일부 저장 기록을 정리해 불러왔어요',damaged:'저장 기록이 손상되어 새 숲을 열었어요', 'missing-version':'저장 형식을 확인할 수 없어 새 숲을 열었어요','old-version':'이전 저장 형식이에요. 새로 시작하기 전에는 덮어쓰지 않아요.','future-version':'더 새로운 저장 형식이에요. 새로 시작하기 전에는 덮어쓰지 않아요.',unavailable:'이 브라우저에서는 저장을 사용할 수 없어요',failed:'저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'};
export function showSaveStatus(status){const node=document.querySelector('#save-status');if(node)node.textContent=messages[status]||status;}
export function createForestView(state,onRestart){
 const dialog=document.querySelector('#goal-dialog'),reset=document.querySelector('#restart-dialog');
 let signature='';
 document.querySelector('#goal-open').addEventListener('click',()=>{render();dialog.showModal()});
 document.querySelector('#goal-close').addEventListener('click',()=>dialog.close());
 document.querySelector('#restart-open').addEventListener('click',()=>{dialog.close();document.querySelector('#restart-result').textContent='';reset.showModal()});
 document.querySelector('#restart-cancel').addEventListener('click',()=>reset.close());
 document.querySelector('#restart-confirm').addEventListener('click',()=>{if(onRestart())reset.close();else document.querySelector('#restart-result').textContent='저장 기록을 지우지 못했어요. 현재 숲은 유지했어요.';});
 function render(){
  const progress=state.forestProgress,goal=evaluateForestGoal(state);
  const label=progress.cleared?'숲 생태계 목표 달성!':goal.ready?'숲이 안정되어 가고 있어요':'숲 목표 살펴보기';
  const node=document.querySelector('#goal-label');if(node.textContent!==label)node.textContent=label;
  document.querySelector('#forest-progress').value=calculateProgress(state);
  document.querySelector('#hold-progress').value=Math.min(1,progress.stableSeconds/forestGoal.stableSeconds);
  const hint=progress.cleared?'목표를 달성했어요. 계속 관찰하고 숲을 돌볼 수 있어요.':goal.ready?'안정 상태를 조금 더 유지해 보세요.':'아래 조건을 함께 갖추어 보세요. 조건이 깨지면 안정 상태 유지가 처음부터 시작돼요.';
  const status=document.querySelector('#goal-status');if(status.textContent!==hint)status.textContent=hint;
  const next=JSON.stringify(goal.checks);if(next!==signature){signature=next;const list=document.querySelector('#goal-checks');list.replaceChildren();for(const check of goal.checks){const li=document.createElement('li');li.textContent=`${check.ok?'✓':'○'} ${check.label}`;list.append(li)}}
 }
 return {render};
}
