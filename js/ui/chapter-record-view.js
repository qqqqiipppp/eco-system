import {chapters,stageById} from '../../data/chapters.js';
import {environmentEventDefinitions} from '../../data/environment-events.js';
import {crisisQuestions} from '../../data/crisis-reflection.js';
import {webStatus,webRelations} from '../systems/food-web-builder.js';

const element=(tag,props={},children=[])=>{const e=Object.assign(document.createElement(tag),props);e.append(...children);return e;};
const day=iso=>{const d=new Date(iso);return Number.isNaN(d.getTime())?'':`${d.getMonth()+1}월 ${d.getDate()}일`;};

// "나의 기록": per chapter reached, how "나의 먹이그물" went and how the crisis
// questions were answered. Easy to read at a glance when the teacher walks by.
export function createChapterRecordView(progress,{currentStageId,openWeb}){
 const dialog=element('dialog',{className:'chapter-dialog chapter-record-dialog'});document.body.append(dialog);
 function chapterRecord(chapter,p){
  const n=chapter.number,status=webStatus(p,n),relations=webRelations(status.nodes),stat=p.webStats[n]||{role:0,arrow:0,system:0,completedAt:null};
  const drawn=relations.length-status.missingArrows.length,observed=relations.filter(r=>p.observed.includes(r.relationId)).length;
  const started=status.nodes.length-status.missingRoles.length>0;
  const web=status.complete?`완성했어요${stat.completedAt?` (${day(stat.completedAt)})`:''}`:started?'그리는 중이에요':'아직 그리지 않았어요';
  const answers=p.reflections.filter(r=>stageById[r.stageId]?.chapter.number===n);
  const rows=[
   ['나의 먹이그물',web],
   ['역할 나누기',`${status.nodes.length-status.missingRoles.length}/${status.nodes.length}종`],
   ['먹이 관계 화살표',`${drawn}/${relations.length}개 · 💡 관찰로 확인 ${observed}개`],
   ['다시 생각한 횟수',`역할 ${stat.role} · 화살표 ${stat.arrow} · 연결 질문 ${stat.system}`],
  ];
  const list=answers.length?element('ul',{className:'record-answers'},answers.map(r=>element('li',{className:r.correct?'right':'wrong'},[
   element('strong',{textContent:`${r.correct?'✓':'✗'} ${r.stageId} ${environmentEventDefinitions[r.kind]?.name||''}`}),
   ' '+(crisisQuestions[r.kind]?.[r.question]?.question||'')]))):element('p',{className:'record-empty',textContent:'아직 위기를 만나지 않았어요.'});
  return element('section',{className:'record-chapter'},[
   element('div',{className:'record-head'},[element('h3',{textContent:`챕터 ${n} ${chapter.title}`}),
    element('button',{type:'button',textContent:'먹이그물 보기',onclick:()=>{dialog.close();openWeb(n);}})]),
   element('dl',{className:'record-rows'},rows.map(([k,v])=>element('div',{},[element('dt',{textContent:k}),element('dd',{textContent:v})]))),
   element('h4',{textContent:`위기 돌아보기 (맞힘 ${answers.filter(r=>r.correct).length}/${answers.length})`}),list,
  ]);
 }
 function open(){
  const p=progress.read(),current=stageById[currentStageId()]?.chapter.number||1;
  const reached=Math.max(current,...p.cleared.map(id=>stageById[id]?.chapter.number||1));
  dialog.replaceChildren(element('h2',{textContent:'나의 기록'}),
   ...chapters.filter(c=>c.number<=reached).map(c=>chapterRecord(c,p)),
   element('div',{className:'chapter-actions'},[element('button',{type:'button',textContent:'닫기',onclick:()=>dialog.close()})]));
  dialog.showModal();
 }
 return {open,dialog};
}
