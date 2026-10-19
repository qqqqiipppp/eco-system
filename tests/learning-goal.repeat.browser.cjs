const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
(async()=>{
 const {learningProfile}=await import('./learning-goal-fixtures.mjs'),{createSaveSnapshot}=await import('../js/services/save-format.js');
 const previous=learningProfile('instant',1).state,raw=createSaveSnapshot(previous,{sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-19T00:00:00Z');
 const b=await chromium.launch({channel:'msedge',headless:true});try{
  const c=await b.newContext({viewport:{width:1138,height:712},hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await c.addInitScript(raw=>{if(!sessionStorage.seeded){localStorage.setItem('eco-system:forest-save',JSON.stringify(raw));sessionStorage.seeded='1';}},raw);
  await p.goto(BASE);await p.evaluate(async()=>window.s=(await import('./js/main.js')).gameState);const state=()=>p.evaluate(()=>structuredClone(window.s));assert.equal((await state()).goalRevision,1);
  await p.locator('#goal-open').click();await p.locator('#replay-open').click();await p.locator('#replay-topic').selectOption('food:v2_grass_to_grasshopper');await p.locator('#replay-confirm').click();
  const start=await state();assert.equal(start.goalRevision,2);assert.equal(start.round.number,2);assert.equal(start.observations.length,0);assert.equal(start.learningGoalProgress.decomposer,null);assert.equal(start.learningGoalProgress.inquiry,null);assert.equal(start.round.care.remaining,28);assert.deepEqual(start.inventory,previous.inventory);assert.deepEqual(start.pointEconomy,previous.pointEconomy);assert(start.profile.relations.length>0);assert.equal(start.organisms.length,3);
  const place=async(id,x=.43)=>{await p.locator('.organism-card[data-species-id="'+id+'"]').click();const box=await p.locator('#placement-surface').boundingBox();await p.touchscreen.tap(box.x+box.width*x,box.y+box.height*.72);await p.locator('.clear-selection').click();};
  await place('grasshopper',.4);await place('grasshopper',.46);await place('mushroom',.32);
  await p.waitForFunction(()=>window.s.events.some(e=>e.status==='active'&&e.payload.relationId==='v2_grass_to_grasshopper'),null,{timeout:40000});
  const id=(await state()).events.find(e=>e.status==='active'&&e.payload.relationId==='v2_grass_to_grasshopper').eventId;
  await p.locator('[data-event-marker="'+id+'"]').click();await p.getByRole('button',{name:'발견 기록하기',exact:true}).click();await p.locator('#event-close').click();assert.equal((await state()).metrics.points,start.metrics.points);
  const inspect=async id=>{await p.locator('#population-open').click();await p.locator('#population-species').selectOption(id);};
  await inspect('mushroom');await p.locator('[data-goal-action="decomposer"]').click();await p.locator('#population-close').click();await inspect('grass');await p.locator('[data-goal-action="watch"]').click();
  await p.waitForFunction(()=>window.s.learningGoalProgress.inquiry.phase==='result',null,{timeout:90000});assert(!(await state()).forestProgress.cleared);await inspect('grass');await p.locator('[data-goal-action="confirm"]').click();await p.locator('#population-close').click();
  await p.waitForFunction(()=>window.s.forestProgress.cleared,null,{timeout:90000});const final=await state();assert.equal(final.metrics.points,start.metrics.points);assert.deepEqual(final.rewardHistory,start.rewardHistory);assert.equal(final.round.care.spent,0);assert.equal(final.profile.clears.length,2);assert.equal(final.organisms.some(o=>o.speciesId==='frog'),false);
  await p.evaluate(async()=>(await import('./js/main.js')).saveService.flush(true));await p.reload();await p.evaluate(async()=>window.s=(await import('./js/main.js')).gameState);assert.deepEqual((await state()).learningGoalProgress,final.learningGoalProgress);assert.equal((await state()).round.number,2);assert.deepEqual(errors,[]);
  fs.writeFileSync(process.env.RESULTS_PATH||'tests/learning-goal.repeat-results.json',JSON.stringify({stage:'15.10',setup:'completed revision1 actual-engine model; UI creates and completes revision2 round',actualChildren:false,actualS5e:false,round:2,clearAt:final.forestProgress.clearedAt,points:start.metrics.points,careSpent:0,food:final.observations,proof:final.learningGoalProgress,profileClears:final.profile.clears,errors},null,2)+'\n');console.log('PASS new goal repeated UI',final.forestProgress.clearedAt);await c.close();
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
