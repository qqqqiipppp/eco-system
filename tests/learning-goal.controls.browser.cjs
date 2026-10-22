const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const screenDir=process.env.GOAL_SCREENSHOT_DIR||require('node:os').tmpdir();
const {tapBackground}=require('./ux-browser-helpers.cjs');
const result={stage:'15.10',fixture:'60 active seconds of actual model ecology, extra grasses legally released, then60 actual model seconds to honor introduction cooldown; inquiry not started; bad sunlight is an explicit QA setup',actualChildren:false,actualS5e:false,scenarios:[],errors:[]};
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});
 const {learningProfile}=await import('./learning-goal-fixtures.mjs'),{removeOrganism}=await import('../js/systems/lifecycle.js'),{createSaveSnapshot}=await import('../js/services/save-format.js');
 const initial=learningProfile('instant',2,1).state;initial.learningGoalProgress.inquiry=null;
 for(const o of initial.organisms.filter(o=>o.speciesId==='grass').slice(1))removeOrganism(initial,o.instanceId,'release');
 for(const o of initial.organisms)if(o.targetInstanceId&&!initial.organisms.some(p=>p.instanceId===o.targetInstanceId)){o.targetInstanceId=null;o.behaviorState='wander';if(o.feedingClock){o.feedingClock.eatRemaining=0;o.feedingClock.pursuitSeconds=0;}}
 const {runEconomy}=await import('./point-economy-fixtures.mjs');runEconomy(initial,1,{checkpointEvery:0});
 const fixture=createSaveSnapshot(initial,{sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-19T00:00:00Z');
 async function scenario(kind){const c=await b.newContext({viewport:{width:960,height:600},hasTouch:true}),p=await c.newPage(),raw=structuredClone(fixture);if(kind==='care')raw.domain.environment.sunlight.value=.15;
  await c.addInitScript(raw=>{if(!sessionStorage.seeded){localStorage.setItem('eco-system:forest-save',JSON.stringify(raw));sessionStorage.seeded='1';}},raw);p.on('pageerror',e=>result.errors.push(e.message));await p.goto(BASE);await p.evaluate(async()=>window.goalState=(await import('./js/main.js')).gameState);const state=()=>p.evaluate(()=>structuredClone(window.goalState));
  await p.locator('#population-open').click();await p.locator('#population-species').selectOption('grass');const before=await state();const text=await p.locator('#population-inquiry').innerText();assert(text.includes('햇빛'));assert(text.includes('토양'));
  assert(!text.includes('강아지풀강아지풀'));const touch=[];for(const [width,height]of [[1280,800],[1138,712],[960,600],[1366,768],[412,915]]){await p.setViewportSize({width,height});const sizes=await p.locator('#population-inquiry button').evaluateAll(nodes=>nodes.map(n=>({height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width})));assert(sizes.length>0&&sizes.every(n=>n.height>=44&&n.width>=44));touch.push({width,height,buttons:sizes});}await p.setViewportSize({width:960,height:600});await p.waitForTimeout(800);assert.deepEqual(await state(),before);assert.equal(await p.locator('[data-goal-action="watch"]').count(),kind==='care'?0:1);
  if(kind==='care'){
   await p.locator('[data-goal-action="care"]').click();let s=await state();assert.equal(s.learningGoalProgress.inquiry.choice,'care');assert.equal(s.learningGoalProgress.inquiry.phase,'watching');assert.equal(s.managementActionCount,before.managementActionCount);
   if(await p.locator('#event-dialog').evaluate(d=>d.open)){const button=p.locator('[data-management-action="habitat-care"]');if(await button.count())await button.click();else await p.getByRole('button',{name:/서식지 회복/}).click();await p.locator('#event-close').click();}
   else {await p.locator('[data-environment-recovery="sunlight"]').click();await p.locator('#environment-close').click();}
   s=await state();assert.equal(s.managementActionCount,before.managementActionCount+1);assert.equal(s.metrics.points,before.metrics.points-8);assert.equal(s.learningGoalProgress.inquiry.phase,'watching');assert(s.environment.sunlight.value>=.4);
  }else {
   await p.locator('[data-goal-action="plant"]').click();assert.equal((await state()).learningGoalProgress.inquiry.phase,'watching');const s=await state(),animal=s.organisms.find(o=>o.speciesId==='rabbit')||s.organisms.find(o=>o.speciesId==='grasshopper');await tapBackground(p,animal.position.x,.4);await p.locator('.clear-selection').click();assert.equal((await state()).learningGoalProgress.inquiry.introducedIds.length,1);assert.equal((await state()).learningGoalProgress.inquiry.phase,'watching');
  }
  // Keep the actual chosen plant as the test subject. Natural seedlings can
  // attract the old rabbit instead; add a legal nearby consumer through the UI.
  const observed=await state(),q=observed.learningGoalProgress.inquiry,target=observed.organisms.find(o=>o.instanceId===(kind==='plant'?q.introducedIds[0]:q.plantId));
  await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,target.position.x,.4);await p.locator('.clear-selection').click();
  await p.waitForFunction(()=>window.goalState.learningGoalProgress.inquiry.phase==='result',null,{timeout:150000}).catch(async e=>{fs.writeFileSync(screenDir+'/stage15_10-controls-'+kind+'-failure.json',JSON.stringify(await state(),null,2));throw e;});assert(!(await state()).forestProgress.cleared);await p.locator('#population-open').click();await p.locator('#population-species').selectOption('grass');const proof=await state();assert(proof.learningGoalProgress.inquiry.meal);assert(proof.learningGoalProgress.inquiry.outcome);await p.locator('[data-goal-action="confirm"]').click();const after=await state();assert.equal(after.learningGoalProgress.inquiry.phase,'confirmed');assert.equal(after.metrics.points,proof.metrics.points);assert.deepEqual(after.rewardHistory,proof.rewardHistory);
  await p.screenshot({path:screenDir+'/stage15_10-'+kind+'.png'});
  await p.evaluate(async()=>(await import('./js/main.js')).saveService.flush(true));await p.reload();await p.evaluate(async()=>window.goalState=(await import('./js/main.js')).gameState);assert.deepEqual((await state()).learningGoalProgress,after.learningGoalProgress);
  result.scenarios.push({kind,copy:text,touch,at:(await state()).simulationTime,proof:after.learningGoalProgress.inquiry,pointsBefore:before.metrics.points,pointsAfter:after.metrics.points,noReward:true,readOnlyFrozen:true});await c.close();
 }
 try{await Promise.all([scenario('care'),scenario('plant')]);assert.deepEqual(result.errors,[]);fs.writeFileSync(process.env.RESULTS_PATH||'tests/learning-goal.controls-results.json',JSON.stringify(result,null,2)+'\n');console.log('PASS controls browser');}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
