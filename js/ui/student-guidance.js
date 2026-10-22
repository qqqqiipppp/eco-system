import {organismById} from '../../data/organisms.js';
import {foodRelationById} from '../../data/food-relations.js';
import {activityById} from '../../data/activities.js';
import {mealSentence,particle} from '../../data/student-text.js';
import {evaluateLearningGoals} from '../systems/learning-goals.js';
import {learningGoalAction} from '../systems/learning-goal-guidance.js';
import {speciesHabitats} from '../../data/habitats.js';
import {validateIntroduction} from '../systems/population.js';
import {placementConfig} from '../../data/interaction-config.js';
import {replayPlan} from '../systems/learning-guidance.js';

// Student wording only. Read the existing contracts; never manufacture evidence.
export const missionNames={food:'먹이사슬 발견하기',roles:'생물의 역할 알아보기',inquiry:'숲의 변화 살펴보기'};
export function forestMissions(state){
 if(state.goalRevision!==2)return [];
 return evaluateLearningGoals(state).map(goal=>({...goal,title:goal.id==='food'&&state.round.number>1?goal.label:missionNames[goal.id],...(goal.id==='food'&&state.round.number>1?{note:replayPlan(state).description}:{})}));
}
export function activityAction(state,activity){
 const id=activity?.unlockSpeciesId;
 return id&&!state.inventory.some(c=>c.speciesId===id&&c.acquired)?organismById[id].name+' 카드 얻기':'미션 시작하기';
}
export function studentNextAction(state){
 const has=id=>state.organisms.some(o=>o.speciesId===id);
 // First show the forest action, rather than starting with two abstract quizzes.
 if(state.round.number===1&&!state.observations.length){
  const missing=['grass','grasshopper'].find(id=>!has(id));
  if(missing&&state.organisms.length<placementConfig.maxOrganisms){const check=validateIntroduction(state,missing);return check.ok?{kind:'place',id:missing,text:particle(organismById[missing].name,'을','를')+' 골라 숲에 놓아 보세요.',label:'숲에 놓기'}:{kind:'watch',text:check.message,label:''};}
  if(has('grass')&&has('grasshopper'))return {kind:'watch',text:'방아깨비가 잎을 먹는지 살펴보세요. 💡가 나타나면 눌러서 확인해요.',label:''};
 }
 const action=learningGoalAction(state);if(!action)return null;
 if(action.kind==='activity'){
  const a=activityById[action.id];
  return {...action,text:a.choices?'문제를 읽고 알맞은 답을 골라 보세요.':a.prompt,label:activityAction(state,a)};
 }
 return {...action,text:action.text.replaceAll('실제 먹기','먹는 모습').replaceAll('탐구 방법','만나는 방법'),label:action.kind==='place'?'숲에 놓기':action.label};
}
export function missionContext(state){
 const goals=forestMissions(state),next=goals.find(g=>!g.ok);
 return next?'진행 중 · '+next.title:goals.length?'미션 완료! 숲의 균형도 계속 살펴봐요.':'이전 숲의 목표를 이어서 진행해요.';
}
export function discoveryCopy(relation){
 const food=organismById[relation.sourceSpeciesId].name,consumer=organismById[relation.targetSpeciesId].name;
 return {title:mealSentence(relation).replace(/\.$/,'!'),
  message:particle(consumer,'은','는')+' '+particle(food,'을','를')+' 먹는 소비자예요.',
  detail:(relation.feedingMode==='resource'?'식물은 남아 있고 먹이가 된 부분은 줄었어요.':'동물 한 마리가 먹혀 숲의 개체 수가 줄었어요.')+' '+(relation.evidenceLevel==='B'?'이 게임에서는 먹이 종류를 대표하는 생물로 나타냈어요. 자연에서는 지역과 상황에 따라 달라요.':'생태 자료를 바탕으로 만든 게임 속 먹이 관계예요.')};
}
export function studentEvent(event){
 const relation=foodRelationById[event.payload?.relationId];
 if(relation)return discoveryCopy(relation);
 return {title:studentSentence(event.title),message:studentSentence(event.message),detail:studentSentence(event.explanation)};
}
export function studentSentence(text=''){
 let result=text;
 for(const species of Object.values(organismById))for(const [bad,a,b]of [['가','이','가'],['를','을','를'],['는','은','는'],['와','과','와']])result=result.replaceAll(species.name+bad+' ',particle(species.name,a,b)+' ');
 return result.replaceAll('숲 메모','다음 할 일').replaceAll('배움에서','미션 활동에서');
}
export function studentDescription(species){
 return species.description.replaceAll('단순화한 관계','예로 나타낸 관계').replaceAll('단순화해요','예로 나타내요').replaceAll('단순화했어요','간단히 나타냈어요').replaceAll('단순화한 것이에요','예로 나타낸 것이에요');
}
export function placementHint(speciesId){
 if(speciesId==='earthworm')return '참지렁이는 흙과 낙엽 아래에서 활동해요.';
 const habitat=speciesHabitats[speciesId];
 if(habitat.movement==='perching')return '가까운 나뭇가지에서 활동해요.';
 if(habitat.movement==='plant-surface')return '가까운 먹이 식물 주변에 놓아요.';
 if(organismById[speciesId].role==='producer')return particle(organismById[speciesId].name,'은','는')+' 땅에 뿌리를 내려요.';
 return '빈 숲을 누르면 놓고, 이미 있는 생물을 누르면 살펴봐요.';
}
export function studentPlacementMessage(result){
 if(result.ok)return particle(organismById[result.instance.speciesId].name,'을','를')+' 놓았어요. '+placementHint(result.instance.speciesId);
 return {space:'이 근처에는 자리가 부족해요. 다른 곳을 눌러 보세요.',food:'이 생물은 가까이에 먹이가 필요해요. 먹이그물에서 먹는 것을 살펴봐요.',cooldown:result.message,inventory:'아직 얻지 못한 카드예요.',selection:'먼저 아래에서 생물 카드를 골라 주세요.',limit:'숲에 30개체가 살고 있어요. 생물 살펴보기에서 자리를 마련해요.',overlap:'나무끼리 너무 가까워요. 조금 떨어진 곳을 눌러 보세요.',area:'생물을 놓으려면 빈 숲을 눌러 주세요.'}[result.reason]||result.message;
}
