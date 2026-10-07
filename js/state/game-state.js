import { activities } from '../../data/activities.js';
import { organisms } from '../../data/organisms.js';
import { forestDefinition } from '../../data/forest.js';
import { createOrganismInstance } from './organism-instance.js';

/** Serializable domain state. UI selection stays separate and is not save data.
 * stability: null means not calculated; do not present a fabricated score.
 * Future save adapters must validate schemaVersion before restoring this shape.
 */
export function createGameState() {
  return {
    schemaVersion: 6,
    activities: activities.map(item => ({activityId:item.activityId,completed:false,attempts:0,completedAt:null})),
    simulationTime: 0,
    rewardHistory: [],
    managementHistory: [],
    managementCooldowns: {},
    managementEffects: [],
    events: [],
    observations: [],
    nextInstanceSequence: forestDefinition.initialOrganisms.length + 1,
    ecosystemId: forestDefinition.id,
    metrics: { stability: null, points: 0 },
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
