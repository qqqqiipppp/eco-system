import {writeFileSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {learningProfile,goalStudent} from './learning-goal-fixtures.mjs';
import {runEconomy,introduce,emptyMemory} from './point-economy-fixtures.mjs';
import {createGameState} from '../js/state/game-state.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {runBiodiversity} from './biodiversity-fixtures.mjs';
const snapshot=s=>createSaveSnapshot(s,emptyMemory,'2026-10-22T00:00:00Z');
const results={stage:'15.11',profiles:{},split:null,mixed:null};
for(const kind of ['instant','normal']){const r=learningProfile(kind);results.profiles[kind]={metrics:r.metrics,snapshot:snapshot(r.state)};assert(r.state.forestProgress.cleared);assert(r.result.report.peak<=30);}
const s=createGameState(),goal=goalStudent();introduce(s,'grasshopper');const options={student:true,mode:'normal',checkpointEvery:0,onTick:goal.tick};const first=runEconomy(s,10,options),loaded=decodeSave(JSON.stringify(first.snapshot));assert.equal(loaded.status,'loaded');for(const k of ['inventory','rewardHistory','pointEconomy','learningGoalProgress','forestProgress'])assert.deepEqual(loaded.state[k],s[k]);const rest=runEconomy(loaded.state,10,{...options,memory:loaded.eventMemory});assert.equal(rest.state.simulationTime,1200);assert(rest.state.forestProgress.cleared);results.split={snapshot:rest.snapshot,report:rest.report};
results.mixed=runBiodiversity({kind:'managed24',seed:11}).data;
const normalized=JSON.parse(JSON.stringify(results));
if(process.env.FIELD_GUIDE_BASELINE){writeFileSync(process.env.FIELD_GUIDE_BASELINE,JSON.stringify(normalized,null,2)+'\n');console.log('saved HEAD ecology baseline');}
else {const before=JSON.parse(readFileSync(new URL('./field-guide.baseline-results.json',import.meta.url)));assert.deepEqual(normalized,before);writeFileSync(new URL('./field-guide.ecology-results.json',import.meta.url),JSON.stringify({stage:'15.11',exactFullSnapshots:true,continuousMinutes:20,splitSeconds:[600,600],mixed24:true,beforeHead:'59566e4cc11571d1e7e4884d0b8432f85ceb5c03',actualS5e:false,actualStudents:false},null,2)+'\n');console.log('PASS exact saved ecology/economy/goal snapshots vs HEAD,20 and10+10');}
