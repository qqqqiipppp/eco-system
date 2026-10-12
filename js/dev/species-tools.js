import {organismById} from '../../data/organisms.js';
import {enableDevelopmentPlacement} from '../systems/population.js';

/** Explicit test/developer installation only; production never imports this. */
export function grantDevelopmentCards(state){
  enableDevelopmentPlacement(state);
  for(const card of state.inventory)if(Object.hasOwn(organismById,card.speciesId))card.acquired=true;
}
export function installSpeciesTools(state,onChanged){
  const button=document.createElement('button');button.type='button';button.id='development-species-unlock';
  button.textContent='개발 검사: 23종 카드 배치 허용';
  button.addEventListener('click',()=>{grantDevelopmentCards(state);onChanged();button.textContent='개발 검사: 23종 배치 허용됨';});
  document.querySelector('#environment-dialog').append(button);
}
