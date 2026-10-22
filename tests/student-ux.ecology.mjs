import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const head='edc05037825427867d4fff56932e504683b1f4d4';
if(process.argv.includes('--worker')){
 const {learningProfile,goalStudent}=await import('./learning-goal-fixtures.mjs');
 const {runBiodiversity}=await import('./biodiversity-fixtures.mjs');
 const {runEconomy,introduce,emptyMemory}=await import('./point-economy-fixtures.mjs');
 const {createGameState}=await import('../js/state/game-state.js');
 const {decodeSave}=await import('../js/services/save-format.js');
 const rows=[];
 for(const kind of ['instant','normal']){const r=learningProfile(kind);assert(r.state.forestProgress.cleared);rows.push({kind,minutes:20,digest:hash(r.result.snapshot),clearAt:r.state.forestProgress.clearedAt,peak:r.result.report.peak});}
 const s=createGameState(),goal=goalStudent();introduce(s,'grasshopper');const options={student:true,mode:'normal',checkpointEvery:0,onTick:goal.tick};
 const first=runEconomy(s,10,options),loaded=decodeSave(JSON.stringify(first.snapshot));assert.equal(loaded.status,'loaded');
 for(const key of ['organisms','inventory','rewardHistory','pointEconomy','learningGoalProgress','forestProgress'])assert.deepEqual(loaded.state[key],s[key]);
 const last=runEconomy(loaded.state,10,{...options,memory:loaded.eventMemory});assert.equal(last.state.simulationTime,1200);rows.push({kind:'10-save-10',digest:hash(last.snapshot),boundaryExact:true});
 for(const kind of ['managed24','unmanaged24'])for(const seed of [11,47,2026]){const r=runBiodiversity({kind,seed});assert(r.data.peak<=30);rows.push({kind,seed,minutes:20,digest:hash([r.snapshot,r.data]),peak:r.data.peak,meals:r.data.meals.length,predations:r.data.causeCounts.predation||0,finalSpecies:r.data.final.species,points:r.state.metrics.points});}
 console.log(JSON.stringify(rows));
}else{
 const run=baseline=>{const args=[...(baseline?['--experimental-loader','./tests/full-forest-baseline-loader.mjs']:[]),'tests/student-ux.ecology.mjs','--worker'];const r=spawnSync(process.execPath,args,{cwd:new URL('../',import.meta.url),env:{...process.env,BASELINE_HEAD:head},encoding:'utf8',maxBuffer:12e6});assert.equal(r.status,0,r.stderr+r.stdout);return JSON.parse(r.stdout);};
 const before=run(true),after=run(false);assert.deepEqual(after,before);
 writeFileSync(process.env.RESULTS_PATH||new URL('./student-ux.ecology-results.json',import.meta.url),JSON.stringify({stage:'15.11.6',beforeHead:head,method:'Read-only Git objects in memory; paired deterministic numerical simulation, not actual children or S5e',allNineProfilesExact:true,before,after},null,2)+'\n');console.log('PASS nine paired20min/split/multiple-seed-density ecology profiles exact');
}
