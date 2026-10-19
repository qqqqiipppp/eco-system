import assert from 'node:assert/strict';
import {cardUnlocks} from '../data/card-unlocks.js';
import {activityById} from '../data/activities.js';
import {foodRelationById} from '../data/food-relations.js';
import {recordSpeciesObservation,syncCollection} from '../js/state/collection-state.js';
import {completeActivity} from '../js/systems/activities.js';
import {activityCondition} from '../js/systems/activity-rules.js';
import {freshStudent,runEconomy,introduce,emptyMemory} from './point-economy-fixtures.mjs';
import {createNextForest} from '../js/systems/replay.js';
import {decodeSave,createSaveSnapshot} from '../js/services/save-format.js';
export const trace=[];
const placeStudy=(s,id)=>{for(const x of [.46,.58,.7,.3,.16,.82,.92]){const r=introduce(s,id,x);if(r.ok)return r;}return {ok:false};};
export function explore(s,e,{delay=0,limit=17}={}){
 if(s.simulationTime<delay)return;
 for(const o of s.organisms)recordSpeciesObservation(s,o.instanceId);
 for(const a of cardUnlocks.slice(0,limit)){
  if(s.activities.find(p=>p.activityId===a.activityId).completed)continue;
  for(const id of a.inspect){if(!s.organisms.some(o=>o.speciesId===id)&&s.inventory.find(c=>c.speciesId===id)?.acquired){const p=placeStudy(s,id);if(p.ok)recordSpeciesObservation(s,p.instance.instanceId);}}
  for(const rid of [...new Set([...(a.relationId?[a.relationId]:[]),...(a.relationIds||[])])]){const r=foodRelationById[rid];for(const id of [r.sourceSpeciesId,r.targetSpeciesId])if(!s.organisms.some(o=>o.speciesId===id)&&s.inventory.find(c=>c.speciesId===id)?.acquired)placeStudy(s,id);}
  if(activityCondition(s,a.activityId,a.correctAnswer).ok){const points=s.metrics.points,r=completeActivity(s,a.activityId,a.correctAnswer);assert(r.ok);assert.equal(s.metrics.points,points);trace.push({species:a.unlockSpeciesId,at:s.simulationTime,round:s.round.number,source:'actual-student-route'});}
 }
 syncCollection(s);
}
export function firstForest(){return runEconomy(freshStudent(),3,{student:true,checkpointEvery:0});}
// An optional explicit STUDENT strategy for changed resource demand: place one
// owned chipmunk near a real oak when the original arrangement only uses pine.
// No observation, unlock, stock, clock, money or feeding success is fabricated.
export function adaptiveExplorer(){let placed=false;const actions=[];return {actions,onTick(s,e){explore(s,e);if(!placed&&s.simulationTime>=120&&!s.observations.some(o=>o.relationId==='v2_oak_to_chipmunk')&&s.inventory.find(c=>c.speciesId==='chipmunk')?.acquired){for(const oak of s.organisms.filter(o=>o.speciesId==='oak')){const r=introduce(s,'chipmunk',Math.max(.08,Math.min(.69,oak.position.x+.01)));if(r.ok){placed=true;actions.push({at:s.simulationTime,type:'place-owned-chipmunk-near-oak',instanceId:r.instance.instanceId,position:{...r.instance.position}});break;}}}}};}
export function allCardsForest(minutes=20){return runEconomy(freshStudent(),minutes,{student:true,checkpointEvery:0,onTick:explore});}
export function nextForest(s,topic='food:v2_grass_to_grasshopper'){const n=createNextForest(s,topic);assert(n.ok,n.message);return n.state;}
export const reload=(s,m=emptyMemory)=>decodeSave(JSON.stringify(createSaveSnapshot(s,m,'2026-10-15T00:00:00Z')));
export function replayStudent(s,e){
 for(const event of s.events.filter(v=>v.status==='active'&&v.kind==='insight'&&v.payload.relationId))assert(e.acknowledge(s,event.eventId).ok);
 const needed=s.round.topic==='soil'?['earthworm','mushroom','soil-bacteria']:s.round.topic.startsWith('food:')?(()=>{const r=foodRelationById[s.round.topic.slice(5)];return [r.sourceSpeciesId,r.targetSpeciesId,'mushroom'];})():['grasshopper','mushroom'];
 for(const id of needed)if(!s.organisms.some(o=>o.speciesId===id))introduce(s,id,.44);
 for(const o of s.organisms)recordSpeciesObservation(s,o.instanceId);
}
export {freshStudent,runEconomy,introduce,emptyMemory,activityById};
