// Scripted students for chapter stages, run headless with the production ecology.
import {createFeedingSystem} from '../js/systems/feeding.js';
import {placeOrganism} from '../js/systems/placement.js';
import {removeOrganism} from '../js/systems/lifecycle.js';
import {evaluateStability} from '../js/systems/stability.js';
import {createEventSystem} from '../js/systems/events.js';
import {createStageGameState,updateStage,stageBlockers,catchObservation,careOptions,careFor,buyCheck,payFor,collectTrash,prepareOptions,prepareFor} from '../js/systems/chapter-stage.js';
import {stageById,crisisForFactor} from '../data/chapters.js';
import {organismById} from '../data/organisms.js';
import {foodRelations} from '../data/food-relations.js';
import {layout} from './ecology-fixtures.mjs';

const xs=[.18,.26,.34,.42,.5,.58,.66,.74,.82,.22,.3,.38,.46,.54,.62,.7,.78];
// Chapter stages are a shop: a placement is paid for, like a tap in the game.
export function place(s,id){if(s.chapter&&!buyCheck(s,id).ok)return false;for(const x of xs){const r=placeOrganism(s,id,{position:{x,y:.72},isPlayArea:true,isUI:false},layout);if(r.ok){if(s.chapter)payFor(s,id);return true;}}return false;}
const count=(s,id)=>s.organisms.filter(o=>o.speciesId===id).length;
const has=(s,id)=>s.inventory.some(c=>c.speciesId===id&&c.acquired);

// What the status line suggests, done by a student who looks every 5 s.
export function carefulStudent(s){
 const stage=stageById[s.chapter.stageId],blockers=stageBlockers(s),ids=new Set(blockers.map(b=>b.id)),acts=[];
 for(const b of blockers){
  if(b.id==='missing'||b.id==='noConsumer'){for(const id of b.species?.map(m=>m.id)||Object.keys(stage.requiredSpecies))if(place(s,id))acts.push('place '+id);}
  if(b.id==='environment'){
   for(const o of careOptions(s))if(o.ok&&careFor(s,o.factor).ok)acts.push(o.actionId+' '+o.factor);
   // Weather cannot be fixed: plant more food plants to hold out.
   if(b.factors.some(f=>!crisisForFactor(f)?.care)){const plant=stage.inventory.find(id=>organismById[id].role==='producer');if(plant&&s.organisms.filter(o=>organismById[o.speciesId].role==='producer').length<6&&place(s,plant))acts.push('place '+plant);}
  }
  if(b.id==='noDecomposition')for(const id of ['litter-mold','mushroom','earthworm'])if(has(s,id)&&count(s,id)<2&&place(s,id)){acts.push('place '+id);break;}
 }
 if(ids.has('depleted')||ids.has('starving')){
  // Feed the hungriest level: plant food plants, or add prey for hungry predators.
  const hungry=s.organisms.filter(o=>'hunger'in o&&o.hunger>.6),eaters=new Set(hungry.map(o=>o.speciesId));
  const foods=foodRelations.filter(r=>eaters.has(r.targetSpeciesId)&&has(s,r.sourceSpeciesId)).map(r=>r.sourceSpeciesId);
  const food=foods.find(id=>organismById[id].role==='producer')||foods[0];
  if(food&&place(s,food))acts.push('place '+food);
  else if(ids.has('depleted')){
   // No room or cooldown: release one of the most numerous plant eaters.
   const eatersOfPlants=s.organisms.filter(o=>'hunger'in o&&foodRelations.some(r=>r.targetSpeciesId===o.speciesId&&r.feedingMode==='resource'));
   const most=Object.entries(Object.groupBy(eatersOfPlants,o=>o.speciesId)).sort((a,b)=>b[1].length-a[1].length)[0];
   if(most&&most[1].length>2){removeOrganism(s,most[1][0].instanceId,'release');acts.push('release '+most[0]);}
  }
 }
 for(const t of [...s.chapter.trash])if(collectTrash(s,t.trashId).ok)acts.push('collect '+t.kind);
 // A breeding stage: make a pair of the species that must have young.
 if(stage.birthRequired&&count(s,stage.birthRequired)<2&&place(s,stage.birthRequired))acts.push('place '+stage.birthRequired);
 // Before weather: plant more food plants.
 if(prepareOptions(s).length){const r=prepareFor(s,prepareOptions(s).find(o=>o.id==='plant').ok?'plant':'wait');acts.push('prepare '+r.choice);if(r.choice==='plant'&&place(s,r.speciesId))acts.push('place '+r.speciesId);}
 return acts;
}
export function idleStudent(s){const acts=[];if(s.simulationTime<1)for(const [id,n] of Object.entries(stageById[s.chapter.stageId].requiredSpecies))while(count(s,id)<n&&place(s,id))acts.push('place '+id);return acts;}

export function runStage(stageId,{seconds=900,student=carefulStudent,catchAll=student===carefulStudent,every=5}={}){
 const s=createStageGameState(stageById[stageId]),f=createFeedingSystem(0),events=createEventSystem(0),blocked={},actions=[];let eventAt=null,next=0;
 for(let t=0;t<seconds*10&&!s.chapter.cleared;t++){
  if(s.simulationTime>=next){next=s.simulationTime+every;for(const a of student(s))actions.push(Math.round(s.simulationTime)+' '+a);}
  const r=f.update(s,.1,layout);if(!r.ticked)continue;
  events.update(s,.5,r.feedingEvents);s.metrics.stability=evaluateStability(s).score;
  const out=updateStage(s,.5,r.feedingEvents);if(out.eventStarted)eventAt=s.simulationTime;
  if(catchAll)for(const o of [...s.chapter.offers]){const c=catchObservation(s,o.offerId);if(c.eventStarted)eventAt=s.simulationTime;}
  for(const b of stageBlockers(s))blocked[b.id]=(blocked[b.id]||0)+.5;
 }
 const final=Object.fromEntries(Object.entries(Object.groupBy(s.organisms,o=>o.speciesId)).map(([k,v])=>[k,v.length]));
 return {s,cleared:s.chapter.cleared,clearedAt:s.chapter.clearedAt,seeds:s.chapter.seeds,eventAt,blocked,actions,final,points:s.metrics.points,trash:s.chapter.trashCollected,spent:s.pointEconomy.totals.spent};
}
