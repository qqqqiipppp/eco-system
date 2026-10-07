const { useUnlockedCards } = require('./fixtures.cjs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 async function setup(counts){
  const page=await browser.newPage({viewport:{width:1138,height:712},hasTouch:true});
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/data/forest.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/initialOrganisms: \[[\s\S]*?\],/,'initialOrganisms: [],')});});
  await useUnlockedCards(page);
    await page.goto(process.env.BASE_URL||'http://127.0.0.1:8080/',{waitUntil:'networkidle'});
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const [species,count] of Object.entries(counts)){
   await page.locator(`.organism-card[data-species-id="${species}"]`).tap();
   for(let i=0;i<count;i++){
    const box=await page.locator('#placement-surface').boundingBox();
    await page.touchscreen.tap(box.x+box.width*(.16+(i%6)*.08),box.y+box.height*(species==='grass'?.74:.6+Math.floor(i/6)*.035));
   }
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  return page;
 }
 const snapshot=page=>page.evaluate(async()=>structuredClone((await import('./js/main.js')).gameState));
 async function waitEvent(page,kind){await page.waitForFunction(kind=>[...document.querySelectorAll(`.event-${kind}`)].length>0,kind,{timeout:30000});}
 try{
  // A and B: real no-food conditions, no automatic modal, no duplicate events.
  for(const species of ['grasshopper','frog']){
   const page=await setup({[species]:2});await waitEvent(page,'alert');
   assert.equal(await page.locator('#event-dialog').evaluate(d=>d.open),false);
   const first=await snapshot(page);assert(first.events.some(e=>e.kind==='alert'&&e.sourceType==='organism'));
   await page.locator('.event-alert').first().tap();
   assert.equal((await snapshot(page)).organisms.length,2);
   await page.locator('#event-actions button').click();
   assert(await page.locator('#event-detail').isVisible());
   await page.locator('#event-close').click();
   await page.waitForTimeout(2200);
   const second=await snapshot(page);
   assert.equal(new Set(second.events.filter(e=>e.status==='active').map(e=>e.key)).size,second.events.filter(e=>e.status==='active').length);
   assert(second.events.length<=2);
   console.log(`${species}: actual alert, touch panel, no accidental placement or duplication`);await page.close();
  }
  // C: environment source marker, investigation and immediate resolution.
  {
   const page=await setup({grass:1});
   await page.getByRole('button',{name:'환경 살펴보기',exact:true}).click();
   await page.getByLabel('물 상태',{exact:true}).selectOption('bad');
   await page.locator('#environment-close').click();await waitEvent(page,'question');
   assert(await page.locator('.abiotic-status .event-alert').count()>0);
   await page.locator('.event-question').click();
   await page.getByRole('button',{name:'원인 생각하기',exact:true}).click();
   await page.getByRole('button',{name:'카드를 많이 모아서',exact:true}).click();
   assert.match(await page.locator('#event-result').textContent(),/다시 살펴/);
   await page.getByRole('button',{name:'비생물 환경이 나빠져서',exact:true}).click();
   assert(await page.locator('#event-detail').isVisible());
   await page.locator('#event-close').click();
   await page.getByRole('button',{name:'환경 살펴보기',exact:true}).click();
   await page.getByLabel('물 상태',{exact:true}).selectOption('good');
   await page.locator('#environment-close').click();
   assert.equal((await snapshot(page)).events.filter(e=>e.status==='active').length,0);
   console.log('water: alert + question, judgment feedback, resolution after improvement');await page.close();
  }
  // D/E: real feeding -> insight; student confirmation creates one observation.
  {
   const page=await setup({grass:3,grasshopper:2});await waitEvent(page,'insight');
   assert.equal((await snapshot(page)).observations.length,0);
   await page.locator('.event-insight').first().tap();
   await page.getByRole('button',{name:'살펴보기',exact:true}).click();
   await page.getByRole('button',{name:'발견 기록하기',exact:true}).click();
   assert.equal((await snapshot(page)).observations[0].relationId,'grass_to_grasshopper');
   await page.locator('#event-close').click();
   await page.getByRole('button',{name:/발견 기록/}).click();
   assert.match(await page.locator('#observation-records').textContent(),/메뚜기가 풀/);
   await page.locator('#observations-close').click();
   // Encourage the next real meal without inventing a feeding event.
   await page.evaluate(async()=>{for(const item of (await import('./js/main.js')).gameState.organisms)if(item.speciesId==='grasshopper')item.hunger=1;});
   await page.waitForTimeout(4500);
   assert.equal((await snapshot(page)).events.filter(e=>e.key==='discovery:grass_to_grasshopper').length,1);
   assert.equal((await snapshot(page)).observations.length,1);
   await page.reload({waitUntil:'networkidle'});assert.equal((await snapshot(page)).observations.length,0);
   console.log('discovery: actual meal, explicit recording, no repeats, no persistence');await page.close();
  }
  // F: 30 live animals with event conditions, existing organism DOM remains.
  {
   const page=await setup({frog:30});await waitEvent(page,'alert');await page.waitForTimeout(1000);
   await page.evaluate(()=>{
    window.keptNodes=[...document.querySelectorAll('.organism-object')];window.geometryReads=0;
    const original=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){window.geometryReads++;return original.call(this)};
   });
   const before=await page.evaluate(async()=>(await import('./js/main.js')).eventSystem.getDiagnostics().checks);
   await page.waitForTimeout(2400);
   const result=await page.evaluate(async()=>({
    markers:document.querySelectorAll('.event-marker').length,
    stable:window.keptNodes.every((node,i)=>node===document.querySelectorAll('.organism-object')[i]),
    reads:window.geometryReads,checks:(await import('./js/main.js')).eventSystem.getDiagnostics().checks,
   }));
   assert(result.markers>0&&result.markers<=4);assert(result.stable);assert.equal(result.reads,0);assert(result.checks-before<=3);
   assert((await snapshot(page)).events.length<=30);
   const box=await page.locator('.event-marker').first().boundingBox();assert(box.width>=44&&box.height>=44);
   for(const [width,height] of [[960,600],[412,915]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width>=960)assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
   }
   await page.setViewportSize({width:1138,height:712});
   if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
   await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
   const hidden=await snapshot(page);await page.waitForTimeout(1200);assert.deepEqual(await snapshot(page),hidden);
   console.log('30 animals:',JSON.stringify(result));await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: events A-F and touch, judgment, records, responsiveness, hidden pause.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
