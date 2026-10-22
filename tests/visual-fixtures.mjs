import {world,layout} from './ecology-fixtures.mjs';
import {organisms} from '../data/organisms.js';
import {relationsByConsumer} from '../data/food-relations.js';
import {createFeedingSystem} from '../js/systems/feeding.js';
import {createWanderSystem} from '../js/systems/wander.js';
import {createVisualTracker} from '../js/ui/species-visuals.js';
// QA starting rights/food/hunger; subsequent changes use production engines.
export function consumerMotion(id){
 const relation=relationsByConsumer.get(id)[0],s=world([[id,1,.75],[relation.sourceSpeciesId,1,id==='spider'?.751:.69]],'visual-'+id);
 const eater=s.organisms[0];eater.hunger=0;
 const f=createFeedingSystem(0,{environmentEventsEnabled:false}),w=createWanderSystem(()=>.3),tracker=createVisualTracker(),seen=new Map();let meals=0;
 function record(work){const row=tracker.sample(s,.1,work).find(r=>r.instanceId===eater.instanceId);if(row&&!seen.has(row.motion+'-'+row.frame))seen.set(row.motion+'-'+row.frame,{row,state:structuredClone(s),work:{...work}});}
 record({});
 for(let i=0;i<1600;i++){
  if(i===30)eater.hunger=1;
  const r=f.update(s,.1,layout);w.forget(r.removedIds);w.update(s.organisms,.1,layout);
  meals+=r.feedingEvents.filter(e=>e.consumerInstanceId===eater.instanceId).length;record(r.visualWork);
  if(meals&&['idle','move','eat'].every(m=>[0,1].every(n=>seen.has(m+'-'+n))))break;
 }
 return {id,relationId:relation.relationId,seen,meals};
}
export const movingSpecies=organisms.filter(o=>o.role==='consumer'&&o.id!=='earthworm');
