import {activityById} from '../../data/activities.js';
import {organismById} from '../../data/organisms.js';
import {activityCondition} from './activity-rules.js';

export function unlockSpecies(state,speciesId,activityId) {
 const definition=activityById[activityId];
 const card=state.inventory.find(item=>item.speciesId===speciesId);
 const progress=state.activities.find(item=>item.activityId===activityId);
 if(!Object.hasOwn(organismById,speciesId)||!card||definition?.unlockSpeciesId!==speciesId)return {ok:false,message:'해금 대상과 활동을 확인해 주세요.'};
 if(card.acquired)return {ok:true,unlocked:false};
 if(!progress?.completed||!activityCondition(state,activityId,progress.lastAnswer).ok)return {ok:false,message:'아직 해금 조건을 충족하지 않았어요.'};
 card.acquired=true;
 return {ok:true,unlocked:true};
}
