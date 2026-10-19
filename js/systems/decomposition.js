import {decompositionConfig as config} from '../../data/population-config.js';
import {organismById} from '../../data/organisms.js';
import {colonyActivity} from './lifespan.js';
import {earthwormConfig as worm} from '../../data/detritus-config.js';
import {recordDecomposerWork} from '../state/learning-goal-state.js';

export function decompositionMultiplier(state){return 1+state.decomposition.soilNutrients*config.maximumGrowthBonus;}
export function updateDecomposition(state,seconds){
 const d=state.decomposition,plants=state.organisms.filter(o=>organismById[o.speciesId].role==='producer');
 d.organicMatter.litter=Math.min(config.maximum,d.organicMatter.litter+plants.length*config.litterPerProducer*seconds);
 d.organicMatter.wood=Math.min(config.maximum,d.organicMatter.wood+plants.filter(o=>['oak','pine','hazel'].includes(o.speciesId)).length*config.woodPerTree*seconds);
 let processed=0,wormProcessed=0;
 const worms=state.organisms.filter(o=>o.speciesId==='earthworm').slice(0,worm.activeLimit);
 const wormActivity=Math.min(...['water','soil','air'].map(f=>state.environment[f].value));
 for(const part of Object.keys(d.organicMatter)){
  let rate=config.backgroundRate;
  const contributions=[];
  for(const [id,parts]of Object.entries(config.rates)){
   const contribution=(parts[part]||0)*state.organisms.filter(o=>o.speciesId===id).slice(0,3).reduce((sum,o)=>sum+colonyActivity(o,state.environment),0);
   rate+=contribution;contributions.push([id,contribution]);
  }
  const wormRate=part==='litter'?worms.length*worm.rate*wormActivity:0,totalRate=rate+wormRate;
  const amount=Math.min(d.organicMatter[part],totalRate*seconds);d.organicMatter[part]-=amount;processed+=amount;
  for(const [id,contribution]of contributions)recordDecomposerWork(state,id,amount*contribution/totalRate);
  const eaten=amount*wormRate/totalRate;wormProcessed+=eaten;
  if(eaten>0)for(const instance of worms){instance.litterConsumed+=eaten/worms.length;instance.lastLitterFeedingAt=state.simulationTime;}
 }
 d.processed=Math.min(1e6,d.processed+processed);
 d.soilNutrients=Math.max(0,Math.min(1,d.soilNutrients+processed*config.nutrientYield-plants.length*config.nutrientUsePerProducer*seconds));
 d.earthwormProcessed=Math.min(1e6,(d.earthwormProcessed||0)+wormProcessed);
 const soil=state.environment.soil;
 if(wormProcessed>0&&['water','air'].every(f=>state.environment[f].value>=worm.helpMinimum)){
  const contribution=Math.max(0,Math.min(wormProcessed*worm.soilPerUnit,worm.soilMaximum-(d.soilContribution||0),worm.soilCeiling-soil.value));
  soil.value+=contribution;d.soilContribution=(d.soilContribution||0)+contribution;
 }
 return processed;
}
