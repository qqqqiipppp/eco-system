import {ECOLOGY_REVISION} from './species-taxonomy.js';
// Eaten -> eater. Revision IDs distinguish old observations from current facts.
const edge=(sourceSpeciesId,targetSpeciesId,foodPart,evidenceId,evidenceLevel='B',core=false)=>({
 relationId:`v${ECOLOGY_REVISION}_${sourceSpeciesId.replaceAll('-','_')}_to_${targetSpeciesId.replaceAll('-','_')}`,
 ecologyRevision:ECOLOGY_REVISION,sourceSpeciesId,targetSpeciesId,type:'food',foodPart,
 feedingMode:foodPart==='animal'?'predation':'resource',evidenceId,evidenceLevel,core,
});
export const foodRelations=[
 edge('grass','grasshopper','leaves','F1','B',true),
 edge('grasshopper','frog','animal','F2','B',true),
 edge('grass','rabbit','leaves','F3'),
 edge('oak','chipmunk','acorn','F4'),
 edge('pine','chipmunk','seeds','F5'),
 edge('pine','caterpillar','needles','F6','A'),
 edge('grass','snail','leaves','F7'),
 edge('aphid','spider','animal','F8'),
 edge('caterpillar','tit','animal','F6','A'),
 edge('spider','tit','animal','F9'),
 edge('raspberry','bulbul','fruit','F10','A'),
 edge('hazel','bulbul','fruit','F16'),
 edge('hazel','aphid','leaves','F19','A'),
 edge('frog','snake','animal','F11'),
 edge('grasshopper','weasel','animal','F12'),
 edge('chipmunk','weasel','animal','F12'),
 edge('frog','weasel','animal','F13'),
 edge('rabbit','goshawk','animal','F14'),
 edge('chipmunk','goshawk','animal','F14'),
 edge('bulbul','goshawk','animal','F15','A'),
 edge('snail','ladybird','animal','F17'),
 edge('grasshopper','field-mouse','animal','F18'),
];
export const foodPartLabels={leaves:'잎',needles:'솔잎',seeds:'씨앗',acorn:'도토리',fruit:'열매',animal:'동물'};
export const foodRelationById=Object.fromEntries(foodRelations.map(r=>[r.relationId,r]));
export const coreRelationIds=foodRelations.filter(r=>r.core).map(r=>r.relationId);
export const relationsByConsumer=new Map(),relationByPair=new Map();
for(const r of foodRelations){const list=relationsByConsumer.get(r.targetSpeciesId)||[];list.push(r);relationsByConsumer.set(r.targetSpeciesId,list);relationByPair.set(`${r.sourceSpeciesId}:${r.targetSpeciesId}`,r);}
export const relationFor=(foodSpeciesId,consumerSpeciesId)=>relationByPair.get(`${foodSpeciesId}:${consumerSpeciesId}`);
