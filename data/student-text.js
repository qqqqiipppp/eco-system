import {organismById} from './organisms.js';
import {foodPartLabels} from './food-relations.js';

// Presentation only. Keep species, relation and reward identifiers unchanged.
export function particle(word,withFinal,withoutFinal){
 const code=word.charCodeAt(word.length-1)-0xac00;
 return word+(code>=0&&code<11172&&code%28!==0?withFinal:withoutFinal);
}
export function mealName(relation){
 const food=organismById[relation.sourceSpeciesId].name;
 if(relation.feedingMode!=='resource')return food;
 return food+(relation.foodPart==='acorn'?'의 ':' ')+foodPartLabels[relation.foodPart];
}
export function mealSentence(relation){
 return `${particle(organismById[relation.targetSpeciesId].name,'이','가')} ${particle(mealName(relation),'을','를')} 먹었어요.`;
}
