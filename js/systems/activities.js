import {activityById} from '../../data/activities.js';
import {organismById} from '../../data/organisms.js';
import {activityCondition} from './activity-rules.js';
import {unlockSpecies} from './unlocks.js';
import {grantReward} from './rewards.js';

export function completeActivity(state,activityId,answer) {
 const definition=activityById[activityId];
 const progress=state.activities.find(item=>item.activityId===activityId);
 if(!definition||!progress)return {ok:false,message:'알 수 없는 활동이에요.'};
 if(definition.choices&&!definition.choices.some(item=>item.id===answer))return {ok:false,message:'답을 골라 주세요.'};
 const card=definition.unlockSpeciesId&&state.inventory.find(item=>item.speciesId===definition.unlockSpeciesId);
 if(definition.unlockSpeciesId&&(!card||!Object.hasOwn(organismById,definition.unlockSpeciesId)))return {ok:false,message:'카드 정보를 확인할 수 없어요.'};
 const condition=activityCondition(state,activityId,answer);
 progress.attempts++;
 if(!condition.ok)return {ok:false,message:condition.message};
 if(progress.completed)return {ok:true,message:'다시 잘 확인했어요. 최초 보상은 이미 받았어요.',unlocked:false};
 progress.completed=true;progress.completedAt=state.simulationTime;
 if(definition.choices)progress.lastAnswer=answer;
 const result=card?unlockSpecies(state,definition.unlockSpeciesId,activityId):{ok:true,unlocked:false};
 const reward=grantReward(state,'activity',activityId,activityId);
 return {ok:true,unlocked:result.unlocked,message:`${definition.learningOutcome} ${result.unlocked?organismById[definition.unlockSpeciesId].name+' 카드를 사용할 수 있어요. ':''}생태계 포인트 ${reward}를 받았어요.`};
}
