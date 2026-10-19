import {decomposerIds,learningGoalConfig} from '../../data/learning-goals.js';
export const createLearningGoalProgress=()=>({work:Object.fromEntries(decomposerIds.map(id=>[id,0])),decomposer:null,inquiry:null});
// Called only with the actual allocated processing amount, excluding background
// microbes and earthworm feeding. This ledger never affects ecological values.
export function recordDecomposerWork(state,speciesId,amount){
 if(state.goalRevision!==2||!(amount>0)||!decomposerIds.includes(speciesId))return;
 const progress=state.learningGoalProgress;
 progress.work[speciesId]=Math.min(learningGoalConfig.maximumWork,progress.work[speciesId]+amount);
}
