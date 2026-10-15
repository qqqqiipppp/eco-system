import {organisms} from '../../data/organisms.js';
import {forestDefinition} from '../../data/forest.js';
import {foodRelationById} from '../../data/food-relations.js';
export const createRoundState=()=>({number:1,id:'forest-1',topic:'basic',care:{limit:0,remaining:0,spent:0,history:[]},inspected:[]});
export const createProfileState=()=>({elapsedBeforeRound:0,acquisitions:Object.fromEntries(forestDefinition.initialInventory.map(id=>[id,{round:1,at:0,source:'starter'}])),speciesObservations:{},relations:[],clears:[]});
export function syncCollection(state){
 const p=state.profile;if(!p)return;
 for(const c of state.inventory)if(c.acquired&&!p.acquisitions[c.speciesId])p.acquisitions[c.speciesId]={round:state.round.number,at:state.simulationTime,source:'learning-or-prior-right'};
 for(const o of state.observations){const r=Object.hasOwn(foodRelationById,o.relationId)?foodRelationById[o.relationId]:null;if(!r)continue;
  if(!p.relations.some(n=>n.relationId===r.relationId))p.relations.push({...o,round:state.round.number});
  for(const id of [r.sourceSpeciesId,r.targetSpeciesId])if(!p.speciesObservations[id])p.speciesObservations[id]={round:state.round.number,at:o.discoveredAt,source:'food-observation'};
 }
 if(state.forestProgress.cleared&&!p.clears.some(c=>c.round===state.round.number))p.clears.push({round:state.round.number,at:state.forestProgress.clearedAt,topic:state.round.topic});
}
export function recordSpeciesObservation(state,instanceId){
 const o=state.organisms.find(o=>o.instanceId===instanceId);if(!o)return false;
 if(!state.round.inspected.includes(o.speciesId))state.round.inspected.push(o.speciesId);
 if(!state.profile.speciesObservations[o.speciesId])state.profile.speciesObservations[o.speciesId]={round:state.round.number,at:state.simulationTime,source:'inspection'};
 return true;
}
export const collectionProgress=state=>({acquired:organisms.filter(o=>state.inventory.some(c=>c.speciesId===o.id&&c.acquired)).length,total:organisms.length,observed:organisms.filter(o=>state.profile.speciesObservations[o.id]).length});
