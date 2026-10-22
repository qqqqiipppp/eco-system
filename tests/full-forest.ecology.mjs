import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {learningProfile,goalStudent} from './learning-goal-fixtures.mjs';
import {runEconomy,introduce,emptyMemory} from './point-economy-fixtures.mjs';
import {createGameState} from '../js/state/game-state.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {runBiodiversity} from './biodiversity-fixtures.mjs';
const snapshot=s=>createSaveSnapshot(s,emptyMemory,'2026-10-22T00:00:00Z');
const result={stage:'15.11.5',profiles:{}};
for(const kind of ['instant','normal']){const r=learningProfile(kind);assert(r.state.forestProgress.cleared);assert(r.result.report.peak<=30);result.profiles[kind]={metrics:r.metrics,snapshot:snapshot(r.state)};}
const s=createGameState(),goal=goalStudent();introduce(s,'grasshopper');
const options={student:true,mode:'normal',checkpointEvery:0,onTick:goal.tick};
const first=runEconomy(s,10,options),loaded=decodeSave(JSON.stringify(first.snapshot));assert.equal(loaded.status,'loaded');
for(const key of ['inventory','rewardHistory','pointEconomy','learningGoalProgress','forestProgress'])assert.deepEqual(loaded.state[key],s[key]);
const last=runEconomy(loaded.state,10,{...options,memory:loaded.eventMemory});assert.equal(last.state.simulationTime,1200);assert(last.state.forestProgress.cleared);
result.split={snapshot:last.snapshot,report:last.report};result.mixed=runBiodiversity({kind:'managed24',seed:11}).data;
const normalized=JSON.parse(JSON.stringify(result));
if(process.env.FULL_FOREST_BASELINE){writeFileSync(process.env.FULL_FOREST_BASELINE,JSON.stringify(normalized,null,2)+'\n');console.log('Saved HEAD full forest ecology baseline');}
else {
 const before=JSON.parse(readFileSync(new URL('./full-forest.baseline-results.json',import.meta.url)));
 assert.deepEqual(normalized.profiles,before.profiles);assert.deepEqual(normalized.split,before.split);
 const summarize=r=>({peak:r.peak,meals:r.meals.length,final:r.final,causes:r.causeCounts,pointTotals:r.pointsLedger.totals});
 const mixed={before:summarize(before.mixed),after:summarize(normalized.mixed)};
 assert(normalized.mixed.peak<=30);
 writeFileSync(new URL('./full-forest.ecology-results.json',import.meta.url),JSON.stringify({stage:'15.11.5',beforeHead:'d9e83594c14d7491ace3c4b55bf18d743021d24f',continuousMinutes:20,splitMinutes:[10,10],sameStudentProfilesAndSplitExact:true,mixed24UsesExpandedWanderArea:true,mixed,actualS5e:false,expandedMixedResult:normalized.mixed},null,2)+'\n');console.log('PASS student20 and10-save10 exact;expanded24-species wander results recorded separately');
}
