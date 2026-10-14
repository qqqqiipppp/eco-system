const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const {dismissWelcome}=require('./fixtures.cjs');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/',KEY='eco-system:forest-save';

// Near-transition saved fixtures exercise the real scheduler and UI. They are
// not a fast-forward option available to students or a device FPS benchmark.
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),contexts=[],errors=[];
 async function setup(raw){
  const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,reducedMotion:'reduce'});contexts.push(context);
  if(raw)await context.addInitScript(({raw,key})=>{if(!sessionStorage.seeded){localStorage.setItem(key,raw);sessionStorage.seeded='yes';}},{raw,key:KEY});
  await context.addInitScript(()=>{
   const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),pending=new Set();
   window.loopStats={callbacks:0,maxPending:0,reads:0};
   window.requestAnimationFrame=callback=>{const id=request(time=>{pending.delete(id);window.loopStats.callbacks++;callback(time);});pending.add(id);window.loopStats.maxPending=Math.max(window.loopStats.maxPending,pending.size);return id;};
   window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};
   const bounds=Element.prototype.getBoundingClientRect;
   Element.prototype.getBoundingClientRect=function(){window.loopStats.reads++;return bounds.call(this);};
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(BASE,{waitUntil:'networkidle'});await dismissWelcome(page);
  await page.evaluate(async()=>{window.s=(await import('./js/main.js')).gameState;});
  assert.equal(await page.locator('#load-error').isVisible(),false);
  return page;
 }
 const state=page=>page.evaluate(()=>structuredClone(window.s));
 async function seed(page,kind){return page.evaluate(async kind=>{
  const {createGameState}=await import('./js/state/game-state.js');
  const {createOrganismInstance}=await import('./js/state/organism-instance.js');
  const {createSaveSnapshot}=await import('./js/services/save-format.js');
  const {organisms}=await import('./data/organisms.js');
  const {stageAt}=await import('./js/state/development-state.js');
  const {developmentRules}=await import('./data/development-config.js');
  const s=createGameState();s.simulationTime=1000;
  const make=(id,name,x=.4,y=.72,origin)=>{
   const o=createOrganismInstance(id,name,{x,y},{time:1000,newborn:Boolean(origin),origin});
   if('hunger'in o){o.hunger=.1;o.lastSuccessfulFeedingAt=1000;}
   return o;
  };
  const progress=(o,seconds)=>{o.development.progressSeconds=seconds;o.development.stage=stageAt(o.speciesId,seconds);return o;};
  if(kind==='growth'){
   s.inventory.find(c=>c.speciesId==='frog').acquired=true;
   s.organisms=[make('oak','tree',.12,.71),make('grass','food',.35,.73),
    progress(make('grass','sprout',.26,.72,'seed-spread'),developmentRules.grass.maturitySeconds-.5),
    progress(make('grasshopper','nymph',.46,.62,'egg-hatch'),developmentRules.grass.maturitySeconds-.5),
    progress(make('rabbit','baby',.58,.75,'birth'),developmentRules.rabbit.stages[1].at-.5),
    progress(make('mushroom','colony',.12,.76),developmentRules.grass.maturitySeconds-.5),make('frog','adult-frog',.65,.65)];
   s.population.breeding.grass={healthySeconds:0,nextAt:1600,pending:{remainingSeconds:developmentRules.grass.pendingSeconds,position:{x:.31,y:.76}}};
   s.population.breeding.grasshopper={healthySeconds:0,nextAt:1600,pending:{remainingSeconds:developmentRules.grass.pendingSeconds,position:{x:.51,y:.69}}};
   s.population.replenishment.grasshopper={healthySeconds:0,nextAt:1600,reserve:6};
  }
  if(kind==='full'){
   // Development-only installation. The 17 future cards remain locked in the
   // actual student game; this fixture deliberately covers all 23 definitions.
   s.inventory.forEach(c=>c.acquired=true);
   s.organisms=organisms.filter(o=>o.id!=='earthworm').map((definition,i)=>make(definition.id,'mixed-'+i,.13+(i%6)*.10,.69+Math.floor(i/6)*.012));
   s.organisms.push(...Array.from({length:7},(_,i)=>progress(make('grass','young-'+i,.16+i*.055,.76,'seed-spread'),developmentRules.grass.maturitySeconds-.5)));
   progress(s.organisms.find(o=>o.speciesId==='mushroom'),developmentRules.grass.maturitySeconds-.5);
   s.population.breeding.grass={healthySeconds:0,nextAt:1000,pending:{remainingSeconds:.5,position:{x:.4,y:.76}}};
  }
  s.decomposition.organicMatter={wood:5,litter:5,remains:5};
  s.population.introductions=Object.fromEntries([...new Set(s.organisms.map(o=>o.speciesId))].map(id=>[id,{count:s.organisms.filter(o=>o.speciesId===id).length,nextAt:0}]));
  return JSON.stringify(createSaveSnapshot(s,{sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2000-01-01T00:00:00Z'));
 },kind);}
 async function openPanel(page,id){if(!(await page.locator('#population-dialog').evaluate(node=>node.open)))await page.locator('#population-open').tap();await page.locator('#population-species').selectOption(id);}
 async function closePanel(page){await page.locator('#population-close').tap();}
 async function resumeUntil(page,predicate){await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(predicate,null,{polling:100});await page.emulateMedia({reducedMotion:'reduce'});}
 try{
  const base=await setup();const initial=await state(base);
  assert.equal(initial.inventory.filter(c=>c.acquired).length,5);
  assert.equal(initial.inventory.filter(c=>!c.acquired&&c.speciesId==='pine').length,1);
  assert.equal(initial.inventory.filter(c=>!c.acquired).length,19);
  assert.equal(await base.locator('.organism-card').count(),24);
  assert.equal(initial.organisms.find(o=>o.speciesId==='grass').development.stage,'seeding');
  await base.locator('.organism-card[data-species-id="grasshopper"]').tap();
  const surface=await base.locator('#placement-surface').boundingBox();await base.touchscreen.tap(surface.x+surface.width*.4,surface.y+surface.height*.62);
  assert.equal((await state(base)).organisms.find(o=>o.speciesId==='grasshopper').development.stage,'adult');
  console.log('A/W: initial student cards remain locked, introduced core organisms are established');

  const growth=await setup(await seed(base,'growth'));
  for(const [id,expected]of [['sprout','강아지풀 새싹'],['nymph','방아깨비 약충'],['baby','새끼 멧토끼'],['colony','버섯 균사체']])assert.equal(await growth.locator(`[data-instance-id="${id}"] .organism-name`).textContent(),expected);
  await openPanel(growth,'grass');assert.match(await growth.locator('#population-cycle').textContent(),/씨앗.*새싹.*자란 강아지풀/);
  assert.match(await growth.locator('#population-development-stage').textContent(),/새싹 1포기.*씨앗 형성 1포기/);
  assert.match(await growth.locator('#population-role').textContent(),/2포기/);assert.match(await growth.locator('#population-pending').textContent(),/씨앗.*개체 수에 포함되지/);
  await openPanel(growth,'grasshopper');assert.match(await growth.locator('#population-development-stage').textContent(),/약충 1마리/);assert.match(await growth.locator('#population-pending').textContent(),/알.*개체 수에 포함되지/);assert.match(await growth.locator('#population-breeding').textContent(),/성충 방아깨비 2마리.*어린 개체/);
  await openPanel(growth,'rabbit');assert.match(await growth.locator('#population-cycle').textContent(),/새끼.*어린 멧토끼.*성체/);assert.match(await growth.locator('#population-development-stage').textContent(),/새끼 1마리/);assert.match(await growth.locator('#population-breeding').textContent(),/성체 멧토끼 2마리.*어린 개체/);
  await openPanel(growth,'frog');assert.match(await growth.locator('#population-cycle').textContent(),/알.*올챙이.*어린 개구리.*성체/);assert.match(await growth.locator('#population-development-stage').textContent(),/성체 참개구리 1마리.*학습 정보.*실제로 생성되지/);assert.match(await growth.locator('#population-development-conditions').textContent(),/다리.*꼬리.*먹이/);
  await openPanel(growth,'mushroom');assert.match(await growth.locator('#population-cycle').textContent(),/균사체.*자실체/);assert.match(await growth.locator('#population-development-stage').textContent(),/균사체 활동 1군집/);assert.match(await growth.locator('#population-pending').textContent(),/새 군집.*늘지는/);
  await openPanel(growth,'oak');assert.equal(await growth.locator('#population-development').isVisible(),false);await closePanel(growth);
  console.log('W: five species cycles/current stages, pending seeds/eggs, mature-parent requirements and frog learning distinction');

  const before=await growth.evaluate(()=>{window.originalNodes=[...document.querySelectorAll('.organism-object')];return {count:window.s.organisms.length,points:window.s.metrics.points,observations:window.s.observations.length,ends:Object.fromEntries(window.s.organisms.filter(o=>o.life.duration).map(o=>[o.instanceId,o.life.startedAt+o.life.duration-o.life.initialAge]))};});
  await resumeUntil(growth,()=>window.s.development.history.length>=4);
  const after=await state(growth);assert.equal(after.organisms.length,before.count);assert.equal(after.metrics.points,before.points);assert.equal(after.observations.length,before.observations);
  assert(await growth.evaluate(()=>window.originalNodes.every(node=>node.isConnected&&node===document.querySelector(`[data-instance-id="${node.dataset.instanceId}"]`))));
  assert.deepEqual(await growth.evaluate(()=>Object.fromEntries(window.s.organisms.filter(o=>o.life.duration).map(o=>[o.instanceId,o.life.startedAt+o.life.duration-o.life.initialAge]))),before.ends);
  assert.equal(await growth.locator('[data-instance-id="sprout"]').getAttribute('data-development-stage'),'grown');
  assert.equal(await growth.locator('[data-instance-id="nymph"]').getAttribute('data-development-stage'),'adult');
  assert.equal(await growth.locator('[data-instance-id="baby"] .organism-name').textContent(),'어린 멧토끼');
  assert.equal(await growth.locator('[data-instance-id="colony"]').getAttribute('data-development-stage'),'fruiting');
  assert.equal(after.development.history.filter(r=>r.speciesId==='frog').length,0);
  console.log('B/C/H/O/X: actual scheduler transitions preserve the same instances, DOM nodes, lifespan endpoints and frog learning separation');

  const marker=growth.locator('.event-marker[aria-label^="성장 관찰"]').first();await marker.waitFor();
  const eventId=await marker.getAttribute('data-event-marker');
  const recordSpecies=await growth.evaluate(eventId=>{const event=window.s.events.find(e=>e.eventId===eventId);return window.s.development.history.find(r=>r.sequence===event.payload.developmentSequence).speciesId;},eventId);
  await marker.tap();await growth.getByRole('button',{name:'살펴보기',exact:true}).tap();await growth.getByRole('button',{name:'성장 기록하기',exact:true}).tap();
  assert.match(await growth.locator('#event-result').textContent(),/성장.*기록/);
  const recorded=await state(growth);assert(recorded.development.history.some(record=>record.noted));assert.equal(recorded.observations.length,before.observations);assert.equal(recorded.metrics.points,before.points);assert.equal(recorded.rewardHistory.length,0);assert.equal(await growth.locator('#observation-count').textContent(),'0');
  await growth.locator('#event-close').tap();await openPanel(growth,recordSpecies);assert.match(await growth.locator('#population-development-history').textContent(),/단계.*관찰/);assert(!/%|초|분/.test(await growth.locator('#population-development-stage').textContent()));await closePanel(growth);
  const recordCount=recorded.development.history.length;
  await growth.emulateMedia({reducedMotion:'no-preference'});await growth.waitForTimeout(1000);await growth.emulateMedia({reducedMotion:'reduce'});assert.equal((await state(growth)).development.history.length,recordCount);
  await growth.evaluate(async()=>(await import('./js/main.js')).saveService.flush(true));
  const savedStages=(await state(growth)).organisms.map(o=>[o.instanceId,o.development?.stage]);
  await growth.reload({waitUntil:'networkidle'});await growth.evaluate(async()=>{window.s=(await import('./js/main.js')).gameState;});assert.deepEqual((await state(growth)).organisms.map(o=>[o.instanceId,o.development?.stage]),savedStages);assert.equal((await state(growth)).development.history.length,recordCount);assert.equal((await state(growth)).metrics.points,before.points);
  console.log('X/Y: confirmed growth records stay separate from 22 food discoveries, grant no points and survive reload without duplicate transitions');

  const full=await setup(await seed(base,'full'));assert.equal((await state(full)).organisms.length,30);assert.equal(await full.locator('.organism-object').count(),30);
  await resumeUntil(full,()=>window.s.development.history.length>=8);
  assert.equal((await state(full)).organisms.length,30);assert.equal(await full.locator('.organism-object').count(),30);assert((await state(full)).population.breeding.grass.pending);assert((await full.locator('.event-marker').count())<=4);
  await openPanel(full,'grass');assert.match(await full.locator('#population-role').textContent(),/8포기/);assert.match(await full.locator('#population-pending').textContent(),/개체 수에 포함되지/);
  const viewportChecks=[];
  for(const [width,height]of [[1280,800],[1138,712],[960,600],[1366,768],[412,915]]){
   await full.setViewportSize({width,height});
   assert.equal(await full.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`page horizontal overflow ${width}x${height}`);
   if(width>=960)assert.equal(await full.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false,`page vertical overflow ${width}x${height}`);
   const panel=await full.locator('#population-dialog').boundingBox();assert(panel.x>=0&&panel.y>=0&&panel.x+panel.width<=width+.5&&panel.y+panel.height<=height+.5,`dialog bounds ${width}x${height}`);
   assert.equal(await full.locator('#population-dialog').evaluate(node=>node.scrollWidth>node.clientWidth),false);
   const controlHeights=[];
   for(const selector of ['#population-species','#population-release','#population-close']){const height=(await full.locator(selector).boundingBox()).height;controlHeights.push(height);assert(height>=44,`${selector} touch size ${width}x${height}`);}
   viewportChecks.push({width,height,horizontalOverflow:false,verticalOverflow:width>=960?false:'mobile vertical scrolling allowed',dialogHeight:panel.height,minControlHeight:Math.min(...controlHeights)});
  }
  await full.setViewportSize({width:1280,height:800});await closePanel(full);
  for(const marker of await full.locator('.event-marker').all()){const box=await marker.boundingBox();assert(box.width>=44&&box.height>=44);}
  await full.evaluate(()=>{window.originalNodes=[...document.querySelectorAll('.organism-object')];window.loopStats.reads=0;window.loopStats.maxPending=0;});
  await full.emulateMedia({reducedMotion:'no-preference'});await full.waitForTimeout(1500);await full.emulateMedia({reducedMotion:'reduce'});
  const performance=await full.evaluate(()=>({sameNodes:window.originalNodes.every(node=>node.isConnected&&node===document.querySelector(`[data-instance-id="${node.dataset.instanceId}"]`)),...window.loopStats}));
  assert(performance.sameNodes);assert.equal(performance.reads,0);assert.equal(performance.maxPending,1);assert.equal((await state(full)).organisms.length,30);assert((await full.locator('.event-marker').count())<=4);
  console.log('Development browser measurements:',JSON.stringify({domCount:await full.locator('.organism-object').count(),visibleEvents:await full.locator('.event-marker').count(),performance,viewportChecks}));
  console.log('W/Z: 30 actual organisms, pending excluded, <=4 visible events, 44px controls, five responsive viewports and stable DOM with one scheduler/no geometry reads');

  await full.evaluate(()=>{window.testHidden=true;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.testHidden?'hidden':'visible'});document.dispatchEvent(new Event('visibilitychange'));});
  await full.emulateMedia({reducedMotion:'no-preference'});
  const paused=await state(full),hiddenCallbacks=await full.evaluate(()=>window.loopStats.callbacks);
  await full.waitForTimeout(1200);
  const hidden=await state(full);assert.equal(hidden.simulationTime,paused.simulationTime);assert.deepEqual(hidden.development,paused.development);assert.deepEqual(hidden.population.breeding,paused.population.breeding);assert.equal(await full.evaluate(()=>window.loopStats.callbacks),hiddenCallbacks);
  await full.evaluate(()=>{window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await full.waitForTimeout(800);await full.emulateMedia({reducedMotion:'reduce'});
  assert((await state(full)).simulationTime-paused.simulationTime<=1);
  console.log('Development visibility measurements:',JSON.stringify({before:paused.simulationTime,hiddenAfter:hidden.simulationTime,resumedAfter:(await state(full)).simulationTime,hiddenGrowthUnchanged:true,hiddenPendingUnchanged:true,errors}));
  console.log('Y/Z: synthetic visibility notification pauses development/pending timers and resumes without offline catch-up; actual S5e device performance remains unmeasured');
  assert.deepEqual(errors,[]);console.log('PASS: development browser, no page errors or relative asset failures');
 }finally{for(const context of contexts)await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
