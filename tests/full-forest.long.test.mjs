import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {world,emptyMemory} from './ecology-fixtures.mjs';
import {geometry} from './spatial-fixtures.mjs';
import {runEconomy} from './point-economy-fixtures.mjs';
import {placeNearestOrganism} from '../js/systems/placement-target.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
const results={stage:'15.11.5',actualS5e:false,actualStudents:false,fixture:'explicit QA card permissions; valid placement API; finite actual food and ordinary ecology, no observation or reward acknowledgement'};
function build(){const s=world([]),g=geometry();s.decomposition.organicMatter.litter=1;
 for(const [id,x]of [['grass',.8],['grass',.94],['pine',.72],['grasshopper',.84],['rabbit',.9],['frog',.88],['mushroom',.96],['earthworm',.93]]){
  const r=placeNearestOrganism(s,id,{position:{x,y:.4},isPlayArea:true,isUI:false},g);assert(r.ok,id+' '+r.message);assert(r.instance.position.x>.69);
 }return s;}
test('right forest20min runs actual feeding,predation,growth,life,decomposition and environment without invented points',()=>{
 const r=runEconomy(build(),20,{checkpointEvery:0});assert.equal(r.state.simulationTime,1200);assert(r.report.peak<=30);assert(r.report.meals.v2_grass_to_grasshopper>0);assert(r.report.meals.v2_grasshopper_to_frog>0);assert(r.state.decomposition.processed>0);assert(r.state.decomposition.earthwormProcessed>0);assert(r.state.environmentEvents.history.length>0);assert.equal(r.state.metrics.points,0);assert.equal(r.state.observations.length,0);
 results.continuous={report:r.report,snapshot:r.snapshot};
});
test('right10-save10 retains all boundary coordinates and food/life/rights; same final domain as continuous20',()=>{
 const full=runEconomy(build(),20,{checkpointEvery:0}),first=runEconomy(build(),10,{checkpointEvery:0}),loaded=decodeSave(JSON.stringify(first.snapshot));assert.equal(loaded.status,'loaded');
 for(const o of loaded.state.organisms)assert.deepEqual(o.position,first.state.organisms.find(p=>p.instanceId===o.instanceId).position);
 const last=runEconomy(loaded.state,10,{checkpointEvery:0,memory:loaded.eventMemory});
 for(const key of ['organisms','decomposition','development','environment','environmentEvents','inventory','observations','rewardHistory','pointEconomy','learningGoalProgress','forestProgress'])assert.deepEqual(last.state[key],full.state[key],key);
 const snap=createSaveSnapshot(last.state,emptyMemory,'2026-10-22T00:00:00Z');assert.equal(snap.schemaVersion,17);assert.equal(snap.domain.ecologyRevision,2);assert.equal(snap.domain.pacingRevision,1);assert.equal(snap.domain.goalRevision,2);
 results.split={coordinateBoundaryExact:true,finalDomainExact:true,snapshot:last.snapshot};
});
process.on('exit',code=>writeFileSync(new URL('./full-forest.long-results.json',import.meta.url),JSON.stringify({...results,exitCode:code},null,2)+'\n'));
