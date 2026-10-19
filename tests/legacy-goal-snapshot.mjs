import assert from 'node:assert/strict';
// Compare every original saved field against the frozen schema16 control.
// The separately tested schema17 envelope and empty legacy-only learning ledger
// are the only excluded fields; biological/economic values remain exact.
export function legacyGoalSnapshot(raw){
 const copy=JSON.parse(JSON.stringify(raw));assert.equal(copy.domain.goalRevision,1);
 assert.deepEqual(copy.domain.learningGoalProgress,{work:{mushroom:0,'litter-mold':0,'soil-bacteria':0},decomposer:null,inquiry:null});
 copy.schemaVersion=copy.domain.schemaVersion=16;delete copy.domain.goalRevision;delete copy.domain.learningGoalProgress;return copy;
}
