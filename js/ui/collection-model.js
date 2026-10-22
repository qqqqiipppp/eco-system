import {organisms,organismById} from '../../data/organisms.js';
import {foodRelations,foodRelationById,foodPartLabels} from '../../data/food-relations.js';
import {decompositionConfig} from '../../data/population-config.js';

// Presentation selectors only. No sync, discovery acknowledgement or reward.
export const relationStatusLabels={current:'✓ 이번 숲 관찰',previous:'↶ 이전 숲 발견',unseen:'⋯ 아직 발견하기 전'};
export function speciesStatus(s,id){
 const current=s.round.inspected.includes(id)||s.observations.some(o=>{const r=foodRelationById[o.relationId];return r&&(r.sourceSpeciesId===id||r.targetSpeciesId===id);});
 const priorRelation=s.profile.relations.some(o=>{const r=foodRelationById[o.relationId];return r&&(r.sourceSpeciesId===id||r.targetSpeciesId===id);});
 return {acquired:s.inventory.some(c=>c.speciesId===id&&c.acquired),current,observed:current||Boolean(s.profile.speciesObservations[id])||priorRelation,living:s.organisms.filter(o=>o.speciesId===id).length};
}
export function relationStatus(s,r){
 const current=s.observations.some(o=>o.relationId===r.relationId),known=current||s.profile.relations.some(o=>o.relationId===r.relationId);
 return {id:r.relationId,kind:current?'current':known?'previous':'unseen',known,current,
  live:s.organisms.some(o=>o.speciesId===r.sourceSpeciesId)&&s.organisms.some(o=>o.speciesId===r.targetSpeciesId),
  available:s.inventory.some(c=>c.speciesId===r.sourceSpeciesId&&c.acquired)&&s.inventory.some(c=>c.speciesId===r.targetSpeciesId&&c.acquired)};
}
export function visibleRelations(s,filter='all'){
 return foodRelations.filter(r=>{const v=relationStatus(s,r);return filter==='current'?v.current:filter==='found'?v.known:filter==='available'?v.available:filter==='live'?v.live:true;});
}
export function speciesRelations(id){return {foods:foodRelations.filter(r=>r.targetSpeciesId===id),predators:foodRelations.filter(r=>r.sourceSpeciesId===id)};}
export function guideSpecies(s,filter='all',query=''){
 const search=query.trim().normalize('NFC');
 return organisms.filter(o=>{
  const status=speciesStatus(s,o.id),matches=filter==='locked'?!status.acquired:filter==='unobserved'?status.acquired&&!status.observed:['producer','consumer','decomposer'].includes(filter)?o.role===filter:true;
  return matches&&(!search||o.name.normalize('NFC').includes(search));
 });
}
export function relationName(r){return organismById[r.sourceSpeciesId].name+' → '+organismById[r.targetSpeciesId].name;}
export function foodPartName(r){return r.feedingMode==='resource'?foodPartLabels[r.foodPart]:'동물 먹이';}
export const decompositionParts=id=>Object.keys(decompositionConfig.rates[id]||{});
export const organicPartNames={wood:'죽은 목재',litter:'낙엽과 식물 잔해',remains:'동물 유래 유기물'};
