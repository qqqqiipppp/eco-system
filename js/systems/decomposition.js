import {decompositionConfig as config} from '../../data/population-config.js';
import {organismById} from '../../data/organisms.js';
import {countSpecies} from './lifecycle.js';

export function decompositionMultiplier(state){return 1+state.decomposition.soilNutrients*config.maximumGrowthBonus;}
export function updateDecomposition(state,seconds){
 const d=state.decomposition,plants=state.organisms.filter(o=>organismById[o.speciesId].role==='producer');
 d.organicMatter.litter=Math.min(config.maximum,d.organicMatter.litter+plants.length*config.litterPerProducer*seconds);
 d.organicMatter.wood=Math.min(config.maximum,d.organicMatter.wood+plants.filter(o=>['oak','pine'].includes(o.speciesId)).length*config.woodPerTree*seconds);
 let processed=0;
 for(const part of Object.keys(d.organicMatter)){
  let rate=config.backgroundRate;
  for(const [id,parts]of Object.entries(config.rates))rate+=(parts[part]||0)*Math.min(3,countSpecies(state,id));
  const amount=Math.min(d.organicMatter[part],rate*seconds);d.organicMatter[part]-=amount;processed+=amount;
 }
 d.processed=Math.min(1e6,d.processed+processed);
 d.soilNutrients=Math.max(0,Math.min(1,d.soilNutrients+processed*config.nutrientYield-plants.length*config.nutrientUsePerProducer*seconds));
 return processed;
}
