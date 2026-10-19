import {calculateProgress} from '../systems/forest-progress.js';
// Pure boundary data, not a grade. No identity or network calls.
export function createProgressSummary(state,lastUpdated=null) {
 return {schemaVersion:state.schemaVersion,ecologyRevision:state.ecologyRevision,goalRevision:state.goalRevision,theme:'forest',studentId:null,
  roundNumber:state.round.number,observedSpeciesCount:Object.keys(state.profile.speciesObservations).length,cumulativeObservationsCount:state.profile.relations.length,clearedRounds:state.profile.clears.length,firstClear:state.profile.clears[0]?{...state.profile.clears[0]}:null,
  progress:calculateProgress(state),cleared:state.forestProgress.cleared,
  acquiredSpeciesCount:state.inventory.filter(item=>item.acquired).length,
  completedActivitiesCount:state.activities.filter(item=>item.completed).length,
  observationsCount:state.observations.length,historicalObservationsCount:state.legacyEcology.observations.length,managementActionCount:state.managementActionCount,
  currentStability:state.metrics.stability,bestStability:state.metrics.bestStability,lastUpdated,
  activeOrganismCount:state.organisms.length,populationChanges:{...state.population.totals},
  historicalPopulationChanges:{...state.legacyEcology.populationTotals},
  currentPopulationChanges:Object.fromEntries(Object.entries(state.population.totals).map(([cause,total])=>[cause,Math.max(0,total-(state.legacyEcology.populationTotals[cause]||0))]))};
}
