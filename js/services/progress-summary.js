import {calculateProgress} from '../systems/forest-progress.js';
// Pure boundary data, not a grade. No identity or network calls.
export function createProgressSummary(state,lastUpdated=null) {
 return {schemaVersion:state.schemaVersion,theme:'forest',studentId:null,
  progress:calculateProgress(state),cleared:state.forestProgress.cleared,
  acquiredSpeciesCount:state.inventory.filter(item=>item.acquired).length,
  completedActivitiesCount:state.activities.filter(item=>item.completed).length,
  observationsCount:state.observations.length,managementActionCount:state.managementActionCount,
  currentStability:state.metrics.stability,bestStability:state.metrics.bestStability,lastUpdated};
}
