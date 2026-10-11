// Food (eaten) -> consumer (eater). Evidence keys resolve in FOREST_SPECIES.md.
// Parts describe the meal; a producer's foodStock remains a shared prototype pool.
const edge=(sourceSpeciesId,targetSpeciesId,foodPart,evidenceId,core=false)=>({
  relationId:`${sourceSpeciesId.replaceAll('-','_')}_to_${targetSpeciesId.replaceAll('-','_')}`,
  sourceSpeciesId,targetSpeciesId,type:'food',foodPart,
  feedingMode:foodPart==='animal'?'predation':'resource',evidenceId,core,
});
export const foodRelations = [
  edge('grass','grasshopper','leaves','R1',true),
  edge('grasshopper','frog','animal','R2',true),
  edge('grass','rabbit','leaves','R3'),
  edge('oak','chipmunk','acorn','R4'),
  edge('pine','chipmunk','seeds','R5'),
  edge('hazel','chipmunk','nut','R4'),
  edge('oak','field-mouse','acorn','R6'),
  edge('grass','field-mouse','seeds','R6'),
  edge('caterpillar','field-mouse','animal','R6'),
  edge('oak','caterpillar','leaves','R7'),
  edge('hazel','aphid','sap','R8'),
  edge('grass','snail','leaves','R9'),
  edge('aphid','ladybird','animal','R10'),
  edge('aphid','spider','animal','R11'),
  edge('caterpillar','spider','animal','R12'),
  edge('spider','frog','animal','R12'),
  edge('caterpillar','tit','animal','R13'),
  edge('spider','tit','animal','R13'),
  edge('raspberry','bulbul','fruit','R14'),
  edge('frog','snake','animal','R15'),
  edge('field-mouse','weasel','animal','R16'),
  edge('grasshopper','weasel','animal','R16'),
  edge('chipmunk','weasel','animal','R17'),
  edge('frog','weasel','animal','R18'),
  edge('rabbit','goshawk','animal','R19'),
  edge('chipmunk','goshawk','animal','R19'),
  edge('bulbul','goshawk','animal','R20'),
];
export const foodPartLabels={leaves:'잎',seeds:'씨앗',acorn:'도토리',nut:'개암 열매',sap:'수액',fruit:'열매',animal:'동물'};
export const foodRelationById=Object.fromEntries(foodRelations.map(relation=>[relation.relationId,relation]));
export const relationsByConsumer=new Map();
export const relationByPair=new Map();
for(const relation of foodRelations){
  const list=relationsByConsumer.get(relation.targetSpeciesId)||[];
  list.push(relation);relationsByConsumer.set(relation.targetSpeciesId,list);
  relationByPair.set(`${relation.sourceSpeciesId}:${relation.targetSpeciesId}`,relation);
}
export const relationFor=(foodSpeciesId,consumerSpeciesId)=>relationByPair.get(`${foodSpeciesId}:${consumerSpeciesId}`);
