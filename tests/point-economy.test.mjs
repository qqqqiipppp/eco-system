import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGameState} from '../js/state/game-state.js';
import {createOrganismInstance} from '../js/state/organism-instance.js';
import {createSaveSnapshot,decodeSave} from '../js/services/save-format.js';
import {pointEconomyConfig,legacyRewardAmounts} from '../data/point-economy.js';
import {environmentEventDefinitions} from '../data/environment-events.js';
import {managementActions} from '../data/management-actions.js';
import {foodRelations} from '../data/food-relations.js';
import {organisms} from '../data/organisms.js';
import {grantReward} from '../js/systems/rewards.js';
import {completeActivity} from '../js/systems/activities.js';
import {startEnvironmentEvent,updateEnvironmentEvents,chooseEnvironmentObservation} from '../js/systems/environment-events.js';
import {claimEnvironmentStudy,studyRecovery,studyCandidates,claimRecoverySupport,supportQuote,pointGuidance,supportReserved} from '../js/systems/point-economy.js';
import {ledgerBalance} from '../js/state/point-economy-state.js';
import {executeManagement,validateManagement} from '../js/systems/management.js';
import {createEventSystem} from '../js/systems/events.js';
import {freshStudent,runEconomy,exhaustedForest,introduce} from './point-economy-fixtures.mjs';
const answer=r=>({factor:r.factor,recovery:studyRecovery(r)});
function ended(s,kind='drought'){
 const r=startEnvironmentEvent(s,kind),d=environmentEventDefinitions[kind];assert(r);s.simulationTime+=d.duration+d.recoverySeconds;updateEnvironmentEvents(s);return r;
}
test('A/B/H/U/V/Z: unchanged amounts, keys, actions,23/22 and5 incidents; every legacy achievement once',()=>{
 assert.equal(organisms.length,24);assert.equal(foodRelations.length,22);assert.equal(Object.keys(environmentEventDefinitions).length,5);
 assert.deepEqual(managementActions.map(a=>[a.cost,a.cooldown]),[[6,8],[6,8],[5,45],[8,75]]);
 const s=createGameState();assert(completeActivity(s,'producer_quiz','grass').ok);assert.equal(s.metrics.points,3);assert(completeActivity(s,'producer_quiz','grass').ok);assert.equal(s.metrics.points,3);
 assert.equal(grantReward(s,'observation','v2_grass_to_grasshopper','actual'),12);assert.equal(grantReward(s,'observation','v2_grass_to_grasshopper','again'),0);
 assert.equal(s.metrics.points,15);assert.equal(ledgerBalance(s.pointEconomy),15);assert.equal(s.pointEconomy.ledger.length,2);
 assert.equal(legacyRewardAmounts.get('question:producer_water_limit'),10);assert.equal(legacyRewardAmounts.get('management:water_shortage_resolved'),3);
});
test('C/D/E/O: only completed real changes plus both correct scientific answers grant4; observation/wait/open alone give0',()=>{
 const s=createGameState(),r=startEnvironmentEvent(s,'drought');assert(!claimEnvironmentStudy(s,r.eventId,{factor:'water',recovery:'natural'}).ok);
 s.simulationTime=420;updateEnvironmentEvents(s);assert.equal(r.phase,'ended');const before=structuredClone({food:s.observations,growth:s.development,life:s.organisms.map(o=>o.life)});
 chooseEnvironmentObservation(s,r.eventId,'observe');chooseEnvironmentObservation(s,r.eventId,'wait');assert.equal(s.metrics.points,0);
 assert(!claimEnvironmentStudy(s,r.eventId,{factor:'air',recovery:'natural'}).ok);assert(!claimEnvironmentStudy(s,r.eventId,{factor:'water',recovery:'care'}).ok);
 assert(claimEnvironmentStudy(s,r.eventId,answer(r)).ok);assert.equal(s.metrics.points,4);
 for(let i=0;i<100;i++)assert(!claimEnvironmentStudy(s,r.eventId,answer(r)).ok);assert.equal(s.metrics.points,4);
 assert.deepEqual({food:s.observations,growth:s.development,life:s.organisms.map(o=>o.life)},before);assert.equal(s.pointEconomy.studyClaims.length,1);assert.equal(s.rewardHistory.length,0);assert.equal(ledgerBalance(s.pointEconomy),4);
});
test('C/V: rain at alreadygood water has no actualchange and cannot pay; cloud never invents a colony reward',()=>{
 const s=createGameState(),r=ended(s,'rain');assert.equal(r.appliedDelta,0);assert(!claimEnvironmentStudy(s,r.eventId,answer(r)).ok);assert.equal(s.metrics.points,0);assert.equal(s.pointEconomy.studyCount,0);
});
test('N/O/W: real rain and real paid water jointly improve the factor; the learned cause is mixed, not a fabricated natural-only result',()=>{
 const s=exhaustedForest({points:30,factors:['water']}),r=startEnvironmentEvent(s,'rain');s.simulationTime=r.duration/2;updateEnvironmentEvents(s);
 const es=createEventSystem(s.simulationTime);es.refresh(s);const e=s.events.find(e=>e.payload.environmentEventId===r.eventId);assert(e);assert(executeManagement(s,'water-care',e.eventId).ok);
 s.simulationTime=r.duration;updateEnvironmentEvents(s);assert.equal(studyRecovery(r),'mixed');assert(!claimEnvironmentStudy(s,r.eventId,{factor:'water',recovery:'rain'}).ok);assert(claimEnvironmentStudy(s,r.eventId,{factor:'water',recovery:'mixed'}).ok);assert.equal(s.metrics.points,28);
});
test('G/Y: different incidents are capped at5/20 over arbitrarily long play and bounded history pruning cannot renew payment',()=>{
 const s=createGameState();let granted=0;
 for(let i=0;i<30;i++){const r=ended(s,'drought');if(claimEnvironmentStudy(s,r.eventId,answer(r)).ok)granted++;}
 assert.equal(granted,5);assert.equal(s.metrics.points,20);assert.equal(s.pointEconomy.studyCount,5);assert.equal(s.pointEconomy.totals.study,20);assert.equal(s.environmentEvents.history.length,20);assert.equal(s.pointEconomy.studyClaims.length,5);
});
test('P/Q/R/S: genuinely blocked fourbad/noeligible rewards receives only the exact28 shortfall once without changing biology or environment',()=>{
 const s=exhaustedForest(),before=structuredClone({env:s.environment,organisms:s.organisms,food:s.observations,growth:s.development,pending:s.population.breeding});
 assert(supportQuote(s).available);assert.equal(supportQuote(s).amount,28);assert(claimRecoverySupport(s).ok);assert.equal(s.metrics.points,28);assert.equal(supportReserved(s),28);
 assert.deepEqual({env:s.environment,organisms:s.organisms,food:s.observations,growth:s.development,pending:s.population.breeding},before);
 assert(!claimRecoverySupport(s).ok);assert.equal(s.metrics.points,28);assert.equal(s.pointEconomy.totals.support,28);assert.equal(ledgerBalance(s.pointEconomy),28);
});
test('P/S: no aid when existingfunds, actual learning or bounded natural recovery can resolve the state',()=>{
 for(const s of [createGameState(),exhaustedForest({points:28})]){assert(!claimRecoverySupport(s).ok);assert.equal(s.pointEconomy.totals.support,0);}
 const learning=exhaustedForest();learning.rewardHistory=learning.rewardHistory.filter(r=>r.rewardId!=='activity:producer_quiz');learning.pointEconomy.legacyClaimed=learning.pointEconomy.legacyClaimed.filter(id=>id!=='activity:producer_quiz');Object.assign(learning.activities.find(a=>a.activityId==='producer_quiz'),{completed:false,completedAt:null});assert(!claimRecoverySupport(learning).ok);assert.match(pointGuidance(learning),/양분을 만드는/);
 const natural=exhaustedForest({factors:[]});const r=startEnvironmentEvent(natural,'drought');natural.metrics.points=0;natural.simulationTime=180;updateEnvironmentEvents(natural);assert(!claimRecoverySupport(natural).ok);assert.match(pointGuidance(natural),/자연적으로 회복/);assert.equal(natural.pointEconomy.totals.support,0);
});
test('I/J/K/L/N/Y: protected rescue budget uses real paid actions, exact costs, beforeafter fields and original cooldowns',()=>{
 const s=exhaustedForest({points:2});assert.equal(claimRecoverySupport(s).amount,26);assert.equal(s.metrics.points,28);
 const by=f=>['water','soil'].includes(f)?f==='water'?'water-care':'soil-care':'habitat-care',context=f=>({sourceType:'environment',sourceId:f});
 let spent=0;for(const factor of ['water','soil','sunlight','air']){
  if(factor==='air')s.simulationTime+=75;
  const r=executeManagement(s,by(factor),context(factor));assert(r.ok,r.message);spent+=r.record.cost;assert.equal(s.environment[factor].value,.6);assert.equal(r.record.beforeValue,.15);assert.equal(r.record.afterValue,.6);assert.match(r.message,/포인트.*사용/);assert.equal(r.record.supportUsed,r.record.cost);
  const points=s.metrics.points;assert(!executeManagement(s,by(factor),context(factor)).ok);assert.equal(s.metrics.points,points);
 }
 assert.equal(spent,28);assert.equal(s.metrics.points,0);assert.equal(supportReserved(s),0);assert.equal(s.pointEconomy.totals.spent,28);assert.equal(s.pointEconomy.totals.support,26);assert.equal(ledgerBalance(s.pointEconomy),0);
});
test('J/M/S: repair budget cannot be wasted on unrelated food support; ordinary earned points remain usable',()=>{
 const s=exhaustedForest();claimRecoverySupport(s);const gh=s.organisms.find(o=>o.speciesId==='grasshopper');Object.assign(gh,{hunger:1,foodShortageDuration:20,deprivationSeconds:200});
 const es=createEventSystem();es.refresh(s);const e=s.events.find(e=>e.sourceId===gh.instanceId);assert(e);const before=structuredClone(s);assert(!executeManagement(s,'food-support',e.eventId).ok);assert.deepEqual(s,before);
 s.metrics.points+=5;assert(executeManagement(s,'food-support',e.eventId).ok);assert.equal(s.metrics.points,28);assert.equal(supportReserved(s),28);assert.equal(gh.lastSuccessfulFeedingAt,null);assert.match(s.managementHistory.at(-1).actionId,/food-support/);
});
test('R/S: empty blocked forest retains acquired cards, requires ordinary free plant placement then exact paidrepair',()=>{
 const s=exhaustedForest({factors:['water'],empty:true});assert.equal(claimRecoverySupport(s).amount,6);assert(!executeManagement(s,'water-care',{sourceType:'environment',sourceId:'water'}).ok);
 assert(introduce(s,'grass',.4).ok);assert(executeManagement(s,'water-care',{sourceType:'environment',sourceId:'water'}).ok);assert.equal(s.metrics.points,0);assert.equal(s.environment.water.value,.6);assert.equal(s.organisms.length,1);
});
test('T/W: exhausted rewards never prompt fake repeat points; new eligible study and wait guidance are state dependent',()=>{
 const s=exhaustedForest({factors:['air']});assert.match(pointGuidance(s),/한 번 복구 지원/);assert.doesNotMatch(pointGuidance(s),/발견.*얻|조사.*얻/);
 const r=ended(s,'drought');assert(studyCandidates(s).length);assert.match(pointGuidance(s),/완료된 변화/);assert(!supportQuote(s).available);assert(claimEnvironmentStudy(s,r.eventId,answer(r)).ok);
});
test('U/V/Z: economic receipts alone never change growth/life/environment/food/population and own no clocks or deletions',()=>{
 for(const file of ['../js/systems/point-economy.js','../js/state/point-economy-state.js']){
  const source=readFileSync(new URL(file,import.meta.url),'utf8');assert(!/setInterval|setTimeout|requestAnimationFrame|Date\.now|removeOrganism|Math\.random/.test(source));
 }
 assert.equal(pointEconomyConfig.studyReward,4);assert.equal(pointEconomyConfig.studyLimit,5);assert.equal(pointEconomyConfig.supportMaximum,28);
});
test('P/S: actual in-progress study is a future earned path; support waits and only later fills the residual4',()=>{
 const s=exhaustedForest({factors:['air']}),r=startEnvironmentEvent(s,'drought');s.simulationTime=60;updateEnvironmentEvents(s);
 assert(!supportQuote(s).available);assert.match(pointGuidance(s),/사건과 회복이 끝난 뒤/);s.simulationTime=420;updateEnvironmentEvents(s);assert(claimEnvironmentStudy(s,r.eventId,answer(r)).ok);
 assert.equal(s.metrics.points,4);assert.equal(claimRecoverySupport(s).amount,4);assert.equal(s.metrics.points,8);assert.equal(supportReserved(s),8);
 assert(executeManagement(s,'habitat-care',{sourceType:'environment',sourceId:'air'}).ok);assert.equal(s.metrics.points,0);assert.equal(ledgerBalance(s.pointEconomy),0);
});
test('Q/S: genuinely unused food learning through alreadyacquired plant/consumer cards avoids unnecessary support',()=>{
 const s=exhaustedForest(),id='observation:v2_pine_to_caterpillar';for(const key of ['pine','caterpillar'])s.inventory.find(c=>c.speciesId===key).acquired=true;
 s.rewardHistory=s.rewardHistory.filter(r=>r.rewardId!==id);s.pointEconomy.legacyClaimed=s.pointEconomy.legacyClaimed.filter(key=>key!==id);
 assert(!supportQuote(s).available);assert.match(pointGuidance(s),/소나무.*솔나방/);assert(introduce(s,'pine',.12).ok);assert(introduce(s,'caterpillar',.14).ok);
 const r=runEconomy(s,1,{student:true,maintain:false});assert.equal(r.report.legacyEarned,12);assert(r.report.meals.v2_pine_to_caterpillar>0);assert.equal(s.pointEconomy.totals.support,0);
});
test('Y: over100 genuine paid supports trim displayed history while cumulative spending/balance survive reload',()=>{
 const s=exhaustedForest({points:1000,factors:[]});s.organisms=Array.from({length:3},(_,i)=>createOrganismInstance('frog','ledger-frog-'+i,{x:.4+i*.04,y:.72}));
 const r=runEconomy(s,30,{mode:'active'});assert(r.report.actions>100);assert.equal(s.managementHistory.length,100);assert.equal(s.pointEconomy.ledger.length,100);assert.equal(r.report.spent,r.report.actions*5);assert.equal(s.metrics.points,1000-r.report.spent);assert.equal(ledgerBalance(s.pointEconomy),s.metrics.points);
 const loaded=decodeSave(JSON.stringify(createSaveSnapshot(s,r.memory,'2000-01-01T00:00:00Z')));assert.equal(loaded.status,'loaded');assert.equal(loaded.state.pointEconomy.totals.spent,r.report.spent);assert.equal(loaded.state.metrics.points,s.metrics.points);
});
