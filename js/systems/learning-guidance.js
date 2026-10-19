
import {evaluateReplayEvidence} from './replay.js';
import {foodRelations} from '../../data/food-relations.js';
import {organismById} from '../../data/organisms.js';
import {activityForSpecies,activityById} from '../../data/activities.js';
import {foodRelationById,foodPartLabels} from '../../data/food-relations.js';
import {environmentFactors} from '../../data/environment-config.js';
import {factorValue} from './environment.js';
import {validateIntroduction,survivalStage} from './population.js';
import {placementConfig} from '../../data/interaction-config.js';
import {pointGuidance} from './point-economy.js';
const owns=(s,id)=>s.inventory.some(c=>c.speciesId===id&&c.acquired);
const has=(s,id)=>s.organisms.some(o=>o.speciesId===id);
const discovered=(s,id)=>s.profile.relations.some(r=>r.relationId===id)||s.observations.some(r=>r.relationId===id);
export function placementHint(s,id){
 const o=organismById[id];if(!o)return '도감에서 탐구 조건을 살펴봐요.';
 if(!owns(s,id))return o.name+' 카드를 먼저 얻어요. 잠긴 카드의 ‘'+(activityForSpecies[id]?.title||'탐구')+'’ 조건을 살펴봐요.';
 if(s.organisms.length>=placementConfig.maxOrganisms)return '숲의 자리가 가득 찼어요. 생물 상태에서 필요한 공간을 마련한 뒤 '+o.name+'를 놓아요.';
 const check=validateIntroduction(s,id);if(!check.ok)return check.message;
 return o.name+' 카드를 고르고 숲의 빈자리에 놓아요.';
}
export function relationHint(s,relationId){
 const r=Object.hasOwn(foodRelationById,relationId)?foodRelationById[relationId]:null;if(!r)return '먹이그물에서 기존 관계를 살펴봐요.';
 if(s.events.some(e=>e.status==='active'&&e.kind==='insight'&&e.payload.relationId===relationId))return '💡를 눌러 ‘발견 기록하기’를 선택해요.';
 for(const id of [r.sourceSpeciesId,r.targetSpeciesId])if(!has(s,id))return placementHint(s,id);
 return organismById[r.targetSpeciesId].name+'가 '+organismById[r.sourceSpeciesId].name+'의 '+foodPartLabels[r.foodPart]+' 먹이를 얻는지 살펴봐요. 먹이와 거리가 알맞아야 해요.';
}
export function learningEvidence(s,a){
 const checks=a.inspect.map(id=>({id:'inspect:'+id,label:organismById[id].name+' 개체 살펴보기',ok:!!s.profile.speciesObservations[id],next:has(s,id)?'카드 선택을 해제한 뒤 숲의 '+organismById[id].name+'를 눌러 살펴봐요.':placementHint(s,id)}));
 if(a.priorActivity)checks.push({id:'activity:'+a.priorActivity,label:activityById[a.priorActivity].title+' 완료',ok:s.activities.some(p=>p.activityId===a.priorActivity&&p.completed),next:'활동 ‘'+activityById[a.priorActivity].title+'’을 먼저 살펴봐요.'});
 for(const rid of [...new Set([...(a.relationId?[a.relationId]:[]),...(a.relationIds||[])])]){const r=foodRelationById[rid];checks.push({id:'food:'+rid,label:organismById[r.sourceSpeciesId].name+' → '+organismById[r.targetSpeciesId].name+' 발견',ok:discovered(s,rid),next:relationHint(s,rid)});}
 if(a.requiresLitterMeal)checks.push({id:'litter-meal',label:'이번 숲의 실제 참지렁이 낙엽 섭식',ok:s.decomposition.earthwormProcessed>0,next:!has(s,'earthworm')?placementHint(s,'earthworm'):s.decomposition.organicMatter.litter<=0?'지금은 낙엽 잔해가 없어요. 식물의 자연스러운 세대교체와 잔해 발생을 살펴봐요.':'생물 상태에서 참지렁이의 낙엽 잔해 섭식을 살펴봐요. 느낌표 확인만으로 섭식이 완료되지는 않아요.'});
 return checks;
}
export function nextCardExploration(s){
 for(const a of Object.values(activityForSpecies))if(a.collection&&!owns(s,a.unlockSpeciesId)&&learningEvidence(s,a).every(c=>c.ok))return {speciesId:a.unlockSpeciesId,activityId:a.activityId,text:'잠긴 '+organismById[a.unlockSpeciesId].name+' 카드의 ‘'+a.title+'’ 탐구를 해 볼 수 있어요.'};
 return null;
}
export function replayPlan(s,topic=s.round.topic){
 if(topic.startsWith('food:')){const id=topic.slice(5),r=Object.hasOwn(foodRelationById,id)?foodRelationById[id]:null;if(r)return {needed:[r.sourceSpeciesId,r.targetSpeciesId],relationId:id,title:organismById[r.sourceSpeciesId].name+' → '+organismById[r.targetSpeciesId].name,description:'두 생물을 놓고 실제로 먹기를 관찰해요. 💡에서 이번 숲의 발견을 기록해요. 생산자·소비자·분해자와 환경도 함께 돌봐요.'};}
 if(topic==='soil')return {needed:['earthworm','mushroom','soil-bacteria'],title:'낙엽과 토양',description:'참지렁이·구름송편버섯·고초균을 이 숲에서 눌러 비교해요. 참지렁이의 실제 낙엽 섭식도 살펴봐요. 동물의 섭식과 균류·세균의 분해는 달라요.'};
 const producers=s.inventory.filter(c=>c.acquired&&organismById[c.speciesId].role==='producer').sort((a,b)=>Number(s.round.inspected.includes(b.speciesId))-Number(s.round.inspected.includes(a.speciesId))||Number(has(s,b.speciesId))-Number(has(s,a.speciesId))).slice(0,2).map(c=>c.speciesId);
 const relation=foodRelations.filter(r=>owns(s,r.sourceSpeciesId)&&owns(s,r.targetSpeciesId)).sort((a,b)=>Number(has(s,b.sourceSpeciesId))-Number(has(s,a.sourceSpeciesId)))[0];
 return {needed:[...new Set([...producers,...(!s.observations.length&&relation?[relation.sourceSpeciesId,relation.targetSpeciesId]:[])])],producerIds:producers,relationId:relation?.relationId,title:'여러 생산자',description:'이번 숲의 생산자 두 종류를 눌러 살펴봐요. 먹이 관계 하나를 실제로 관찰하고 💡에 기록해요. 환경과 생물 역할의 균형도 돌봐요.'};
}
export function replayNextAction(s){
 const bad=Object.keys(environmentFactors).filter(f=>factorValue(s.environment,f)<.4);
 if(bad.length)return bad.map(f=>environmentFactors[f].name).join('·')+'이 나빠요. 환경 상태에서 원인과 회복 방법을 살펴봐요. '+pointGuidance(s);
 const plan=replayPlan(s);
 const weak=s.organisms.find(o=>survivalStage(o)==='weak');if(weak)return organismById[weak.speciesId].name+'가 쇠약해졌어요. !에서 실제 먹이와 거리를 먼저 살펴봐요.';
 if(s.forestProgress.cleared)return '이번 숲의 탐구를 마쳤어요! 도감과 먹이그물에서 다음 관계를 골라 볼까요? 지금 숲을 계속 관찰해도 좋아요.';
 if(!evaluateReplayEvidence(s).ok)for(const id of plan.needed)if(!has(s,id))return placementHint(s,id);
 if(s.round.topic==='soil'){
  for(const id of plan.needed)if(!s.round.inspected.includes(id))return '카드 선택을 해제한 뒤 이번 숲의 '+organismById[id].name+'를 눌러 살펴봐요.';
  if(s.decomposition.earthwormProcessed<=0)return s.decomposition.organicMatter.litter<=0?'지금은 낙엽 잔해가 없어요. 식물의 세대교체와 잔해 발생을 살펴봐요.':'생물 상태에서 참지렁이가 실제로 낙엽 잔해를 먹는지 살펴봐요.';
 }else if(s.round.topic==='producers'){
  for(const id of plan.producerIds)if(!s.round.inspected.includes(id))return '이번 숲의 '+organismById[id].name+'를 눌러 생산자의 역할을 살펴봐요.';
  if(!s.observations.length)return relationHint(s,plan.relationId);
 }else if(plan.relationId&&!s.observations.some(r=>r.relationId===plan.relationId))return relationHint(s,plan.relationId);
 for(const role of ['producer','consumer','decomposer'])if(!s.organisms.some(o=>organismById[o.speciesId].role===role))return placementHint(s,{producer:'grass',consumer:'grasshopper',decomposer:'mushroom'}[role]);
 return '생물과 환경의 균형을 살펴봐요. 조건이 모두 알맞으면 안정 상태 30초를 이어가요.';
}
