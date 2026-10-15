import {createGameState} from '../state/game-state.js';
import {syncCollection} from '../state/collection-state.js';
import {foodRelations,foodRelationById} from '../../data/food-relations.js';
import {organismById} from '../../data/organisms.js';
export const ROUND_CARE_LIMIT=28; // one repair of all four factors:6+6+8+8; never cash.
const owned=(s,id)=>s.inventory.some(c=>c.speciesId===id&&c.acquired);
export function replayTopics(s){
 const topics=foodRelations.filter(r=>owned(s,r.sourceSpeciesId)&&owned(s,r.targetSpeciesId)).map(r=>({id:'food:'+r.relationId,label:organismById[r.sourceSpeciesId].name+' → '+organismById[r.targetSpeciesId].name+' 관찰'}));
 if(s.inventory.filter(c=>c.acquired&&organismById[c.speciesId].role==='producer').length>=2)topics.push({id:'producers',label:'여러 생산자와 먹이 관계'});
 if(['earthworm','mushroom','soil-bacteria'].every(id=>owned(s,id)))topics.push({id:'soil',label:'낙엽과 토양동물·분해자'});
 return topics;
}
export function createNextForest(state,topic){
 if(!state.forestProgress.cleared)return {ok:false,message:'지금 숲의 목표를 먼저 완성해 주세요.'};
 if(!replayTopics(state).some(t=>t.id===topic))return {ok:false,message:'획득한 카드로 탐구할 수 있는 주제를 골라 주세요.'};
 const previous=structuredClone(state);syncCollection(previous);
 const next=createGameState();
 // These domain fields belong to the student, not to an individual forest.
 for(const k of ['inventory','activities','rewardHistory','pointEconomy','recoverySupportUsed','legacyEcology'])next[k]=structuredClone(previous[k]);
 next.metrics.points=previous.metrics.points;next.profile=previous.profile;
 next.profile.elapsedBeforeRound+=previous.simulationTime;
 next.round={number:previous.round.number+1,id:'forest-'+(previous.round.number+1),topic,inspected:[],care:{limit:ROUND_CARE_LIMIT,remaining:ROUND_CARE_LIMIT,spent:0,history:[]}};
 // Globally monotone episode IDs keep the lifetime five-study cap and receipts valid.
 next.environmentEvents.sequence=previous.environmentEvents.sequence;
 return {ok:true,state:next};
}
export function evaluateReplayEvidence(s){
 const t=s.round.topic,inspected=id=>s.round.inspected.includes(id);
 let ok=false,detail='';
 if(t.startsWith('food:')){const r=foodRelationById[t.slice(5)];detail=r?organismById[r.sourceSpeciesId].name+' → '+organismById[r.targetSpeciesId].name+'를 이 숲에서 실제로 관찰하고 💡에 기록해요.':'탐구 주제를 확인해 주세요.';ok=!!r&&s.observations.some(o=>o.relationId===r.relationId);}
 else if(t==='producers'){detail='이 숲에서 생산자 두 종류를 눌러 살펴보고, 먹이 관계 한 가지를 💡에 기록해요.';ok=s.inventory.filter(c=>c.acquired&&organismById[c.speciesId].role==='producer'&&inspected(c.speciesId)).length>=2&&s.observations.length>0;}
 else if(t==='soil'){detail='이 숲에서 참지렁이·구름송편버섯·고초균을 눌러 살펴보고 참지렁이가 실제 낙엽 잔해를 먹는지 관찰해요.';ok=['earthworm','mushroom','soil-bacteria'].every(inspected)&&s.decomposition.earthwormProcessed>0;}
 return {id:'observations',label:detail,ok};
}
