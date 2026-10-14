import { activities } from '../../data/activities.js';
import { organisms } from '../../data/organisms.js';
import { forestDefinition } from '../../data/forest.js';
import { createOrganismInstance } from './organism-instance.js';
import {ECOLOGY_REVISION} from '../../data/species-taxonomy.js';
import {createEnvironmentEventState} from './environment-event-state.js';
import {createPointEconomyState} from './point-economy-state.js';

/** Serializable domain state. UI selection stays separate and is not save data.
 * stability: null means not calculated; do not present a fabricated score.
 * Future save adapters must validate schemaVersion before restoring this shape.
 */
export function createGameState() {
  return {
    schemaVersion: 14,
    pointEconomy:createPointEconomyState(),
    recoverySupportUsed:false,
    environmentEvents: createEnvironmentEventState(),
    development: {sequence:0,history:[]},
    ecologyRevision: ECOLOGY_REVISION,
    legacyEcology: {revision:1,migratedFromVersion:null,observations:[],pendingDiscoveries:[],instances:[],breeding:{},replenishment:{},populationTotals:{}},
    population: {sequence:0,history:[],totals:{},breeding:{},replenishment:{},introductions:Object.fromEntries([...new Set(forestDefinition.initialOrganisms.map(o=>o.speciesId))].map(id=>[id,{count:forestDefinition.initialOrganisms.filter(o=>o.speciesId===id).length,nextAt:0}]))},
    decomposition: {organicMatter:{wood:.3,litter:.5,remains:0},soilNutrients:0,processed:0,earthwormProcessed:0,soilContribution:0,notices:{sequence:0,history:[]}},
    forestProgress: {cleared:false,clearedAt:null,stableSeconds:0},
    activities: activities.map(item => ({activityId:item.activityId,completed:false,attempts:0,completedAt:null})),
    simulationTime: 0,
    rewardHistory: [],
    managementHistory: [],
    managementActionCount: 0,
    managementCooldowns: {},
    managementEffects: [],
    events: [],
    observations: [],
    nextInstanceSequence: forestDefinition.initialOrganisms.length + 1,
    ecosystemId: forestDefinition.id,
    metrics: { stability: null, points: 0, bestStability: 0 },
    environment: JSON.parse(JSON.stringify(forestDefinition.abiotic)),
    organisms: forestDefinition.initialOrganisms.map(item => createOrganismInstance(item.speciesId, item.instanceId, item.position)),
    inventory: organisms.map(({id:speciesId}) => ({ speciesId, acquired: forestDefinition.initialInventory.includes(speciesId) })),
  };
}

export function getSpeciesCount(state) {
  return new Set(state.organisms.map(item => item.speciesId)).size;
}

export function createUIState() {
  return { selectedSpeciesId: null };
}
