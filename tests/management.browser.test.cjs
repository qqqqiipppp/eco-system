const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
 const snapshot=page=>page.evaluate(async()=>structuredClone((await import('./js/main.js')).gameState));
 async function setup(counts){
  const page=await browser.newPage({viewport:{width:1138,height:712},hasTouch:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.intervals=0;const original=window.setInterval;window.setInterval=(...args)=>{window.intervals++;return original(...args)}});
  await page.route('**/data/forest.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/initialOrganisms: \[[\s\S]*?\],/,'initialOrganisms: [],')});});
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:8080/',{waitUntil:'networkidle'});await page.emulateMedia({reducedMotion:'reduce'});
  for(const [species,count] of Object.entries(counts)){
   await page.locator(`.organism-card[data-species-id="${species}"]`).tap();
   for(let i=0;i<count;i++){const box=await page.locator('#placement-surface').boundingBox();await page.touchscreen.tap(box.x+box.width*(.16+(i%6)*.08),box.y+box.height*(species==='grass'?.74:.6+Math.floor(i/6)*.035));}
  }
  await page.emulateMedia({reducedMotion:'no-preference'});return page;
 }
 async function environment(page,factor,level){await page.locator('#environment-open').click();await page.getByLabel(`${factor} 상태`,{exact:true}).selectOption(level);await page.locator('#environment-close').click();}
 async function inspectAlert(page){await page.locator('.event-alert').first().tap();await page.getByRole('button',{name:'살펴보기',exact:true}).click();}
 try{
  // A/B/C/G/H: earn points through the real investigation, then spend them.
  {
   const page=await setup({grass:1});await environment(page,'물','bad');await page.locator('.event-question').waitFor({timeout:15000});
   await inspectAlert(page);const before=await snapshot(page);
   await page.locator('[data-management-action="water-care"]').tap({force:true});assert.match(await page.locator('#event-result').textContent(),/포인트가 부족/);
   const after=await snapshot(page);assert.equal(after.metrics.points,0);assert.equal(after.environment.water.value,before.environment.water.value);assert.equal(after.managementHistory.length,0);
   assert.equal(await page.locator('[data-management-action="food-support"]').count(),0);
   await page.locator('#event-close').click();await page.locator('.event-question').tap();await page.getByRole('button',{name:'원인 생각하기',exact:true}).click();
   await page.getByRole('button',{name:'카드를 많이 모아서',exact:true}).click();assert.equal((await snapshot(page)).metrics.points,0);
   await page.getByRole('button',{name:'비생물 환경이 나빠져서',exact:true}).click();assert.equal((await snapshot(page)).metrics.points,10);
   await page.locator('#event-close').click();await inspectAlert(page);
   if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
   await page.locator('[data-management-action="water-care"]').tap();const state=await snapshot(page);
   assert.equal(state.environment.water.value,.6);assert.equal(state.metrics.points,7);assert.equal(state.managementHistory[0].cost,6);assert.equal(state.managementHistory[0].result,'resolved');
   assert(state.events.some(e=>e.kind==='alert'&&e.status==='resolved'));assert.match(await page.locator('#event-result').textContent(),/한 단계 개선/);
   await page.locator('#event-close').click();await page.locator('#environment-open').click();assert.equal(await page.getByLabel('물 상태',{exact:true}).inputValue(),'normal');await page.locator('#environment-close').click();
   await environment(page,'물','good');
   const atomic=await page.evaluate(async()=>{const {gameState:s,eventSystem}=await import('./js/main.js');const {executeManagement}=await import('./js/systems/management.js');const before=JSON.stringify(s);const result=executeManagement(s,'water-care',s.managementHistory[0].sourceEventId);eventSystem.acknowledge(s,s.events.find(e=>e.kind==='question').eventId,'environment');return {ok:result.ok,same:before===JSON.stringify(s)}});
   assert.deepEqual(atomic,{ok:false,same:true});console.log('A/B/C/G/H: earned 10, spent 6, resolved reward 3; good/no-funds/repeated reward blocked');await page.close();
  }
  // F: actual feeding, explicit record reward only once.
  {
   const page=await setup({grass:3,grasshopper:2});await page.locator('.event-insight').first().waitFor({timeout:30000});assert.equal((await snapshot(page)).metrics.points,0);
   await page.locator('.event-insight').first().tap();await page.getByRole('button',{name:'살펴보기',exact:true}).click();await page.getByRole('button',{name:'발견 기록하기',exact:true}).click();assert.equal((await snapshot(page)).metrics.points,12);
   await page.locator('#event-close').click();for(let i=0;i<2;i++){await page.locator('#observations-open').click();await page.locator('#observations-close').click()}assert.equal((await snapshot(page)).metrics.points,12);
   console.log('F: real feeding discovery grants 12 once');await page.close();
  }
  // E: compare two real ecology runs with identical starting state.
  {
   const page=await setup({grass:1});await environment(page,'물','bad');await page.locator('.event-alert').waitFor({timeout:15000});
   await page.evaluate(async()=>{const s=(await import('./js/main.js')).gameState;s.metrics.points=20;s.organisms[0].growth=.2;s.organisms[0].foodStock=0;});
   await inspectAlert(page);await page.locator('[data-management-action="habitat-care"]').tap();let s=await snapshot(page);assert.equal(s.managementEffects.length,1);assert.equal(s.metrics.points,12);assert(s.events.some(e=>e.kind==='alert'&&e.status==='active'));
   await page.locator('#event-close').click();const start=(await snapshot(page)).organisms[0].foodStock;await page.waitForTimeout(2100);assert((await snapshot(page)).organisms[0].foodStock>start);
   console.log('E: habitat effect active, resource recovery over time, environmental alert remains');await page.close();
  }
  // D/I: real shortage on 30 frogs; one temporary intervention; no new timers or DOM rebuild.
  {
   const page=await setup({frog:30});await page.locator('.event-alert').first().waitFor({timeout:30000});
   await page.evaluate(async()=>{(await import('./js/main.js')).gameState.metrics.points=20;window.nodes=[...document.querySelectorAll('.organism-object')];});
   await inspectAlert(page);const first=await snapshot(page);await page.locator('[data-management-action="food-support"]').tap();const next=await snapshot(page);
   assert.equal(next.metrics.points,15);assert.equal(next.organisms.length,30);const history=next.managementHistory[0];const target=next.organisms.find(o=>o.instanceId===history.sourceId);assert(target.hunger<first.organisms.find(o=>o.instanceId===target.instanceId).hunger);
   assert(next.managementCooldowns[`food-support:${target.instanceId}`]>next.simulationTime);
   await page.locator('#event-close').click();await page.evaluate(()=>{window.reads=0;const original=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){window.reads++;return original.call(this)}});await page.waitForTimeout(2400);
   const perf=await page.evaluate(()=>({stable:window.nodes.every((n,i)=>n===document.querySelectorAll('.organism-object')[i]),reads:window.reads,intervals:window.intervals,markers:document.querySelectorAll('.event-marker').length}));assert(perf.stable);assert.equal(perf.reads,0);assert.equal(perf.intervals,0);assert(perf.markers<=4);
   await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'))});const hidden=await snapshot(page);await page.waitForTimeout(1200);assert.deepEqual(await snapshot(page),hidden);
   await page.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(650);assert((await snapshot(page)).simulationTime>hidden.simulationTime);
   for(const [width,height] of [[960,600],[412,915]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
   console.log('D/I: temporary support + cooldown, 30 animals',JSON.stringify(perf));await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS management browser scenarios');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
