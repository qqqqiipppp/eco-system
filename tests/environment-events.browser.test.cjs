const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {dismissWelcome}=require('./fixtures.cjs');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/',KEY='eco-system:forest-save';

// Explicit saved developer fixtures put episodes near a useful observation.
// Students have no event generator, fast-forward control or unlocked-card flag.
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),contexts=[],errors=[];
 async function setup(raw){
  const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,reducedMotion:'reduce'});contexts.push(context);
  if(raw)await context.addInitScript(({raw,key})=>{if(!sessionStorage.seeded){localStorage.setItem(key,raw);sessionStorage.seeded='yes';}},{raw,key:KEY});
  await context.addInitScript(()=>{
   const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),pending=new Set();
   window.loopStats={callbacks:0,maxPending:0,reads:0,intervals:0};
   window.requestAnimationFrame=callback=>{const id=request(time=>{pending.delete(id);window.loopStats.callbacks++;callback(time);});pending.add(id);window.loopStats.maxPending=Math.max(window.loopStats.maxPending,pending.size);return id;};
   window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};
   const bounds=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){window.loopStats.reads++;return bounds.call(this);};
   const interval=window.setInterval;window.setInterval=(...args)=>{window.loopStats.intervals++;return interval(...args);};
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(BASE,{waitUntil:'networkidle'});await dismissWelcome(page);await page.evaluate(async()=>{window.s=(await import('./js/main.js')).gameState;});
  assert.equal(await page.locator('#load-error').isVisible(),false);return page;
 }
 const state=page=>page.evaluate(async()=>{window.s??=(await import('./js/main.js')).gameState;return structuredClone(window.s);});
 async function seed(page,kind,mode='normal'){return page.evaluate(async({kind,mode})=>{
  const {createGameState}=await import('./js/state/game-state.js'),{createOrganismInstance}=await import('./js/state/organism-instance.js');
  const {createSaveSnapshot}=await import('./js/services/save-format.js'),{createFeedingSystem}=await import('./js/systems/feeding.js');
  const {startEnvironmentEvent,updateEnvironmentEvents}=await import('./js/systems/environment-events.js');
  const {organisms}=await import('./data/organisms.js'),{environmentEventDefinitions:defs}=await import('./data/environment-events.js');
  const {stageAt}=await import('./js/state/development-state.js');
  const {speciesProfiles}=await import('./data/interaction-config.js');
  const s=createGameState();s.simulationTime=1000;s.metrics.points=30;
  const make=(id,name,x=.3,y=.73,origin)=>{const o=createOrganismInstance(id,name,{x,y},{time:s.simulationTime,newborn:Boolean(origin),origin});if('hunger'in o){o.hunger=.1;o.lastSuccessfulFeedingAt=s.simulationTime;}return o;};
  const young=()=>{const o=make('grass','sprout',.54,.75,'seed-spread');o.development.progressSeconds=10;o.development.stage=stageAt('grass',10);return o;};
  s.organisms=[make('oak','tree',.13,.71),make('grass','food',.23,.73),young()];
  s.decomposition.organicMatter={wood:5,litter:5,remains:5};
  s.population.breeding.grass={healthySeconds:0,nextAt:1600,pending:{remainingSeconds:60,position:{x:.65,y:.76}}};
  let memory={sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]};
  if(mode==='history'){
   for(const previous of ['drought','rain','cloudy','air-pollution']){const r=startEnvironmentEvent(s,previous),d=defs[previous];s.simulationTime+=d.duration+d.recoverySeconds;updateEnvironmentEvents(s);r.observed=true;}
   s.organisms=[make('oak','tree',.13,.71),make('grass','food',.23,.73),young()];
  }
  if(kind==='rain')s.environment.water.value=mode==='no-change'?1:.2;
  if(mode==='full'){
   s.inventory.forEach(c=>c.acquired=true);
   // All23 definitions and30 anchors are covered only by this saved fixture.
   s.organisms=organisms.map((d,i)=>make(d.id,'mixed-'+i,.13+(i%6)*.1,.69+Math.floor(i/6)*.012));
   s.organisms.push(...Array.from({length:7},(_,i)=>make('grass','young-'+i,.15+i*.055,.76,'seed-spread')));
   s.environment.air.value=.4;
  }
  if(mode==='priority'){
   const gh=make('grasshopper','feeding-gh',.23,.63);gh.hunger=.9;
   const frog=make('frog','urgent-frog',.66,.65);s.organisms.push(gh,frog);s.inventory.find(c=>c.speciesId==='frog').acquired=true;
   const sprout=s.organisms.find(o=>o.instanceId==='sprout');sprout.development.progressSeconds=179.5;sprout.development.stage='sprout';
  }
  const record=startEnvironmentEvent(s,kind);
  if(!record)throw new Error('fixture episode did not start');
  if(mode==='full') {s.simulationTime+=20;updateEnvironmentEvents(s);}
  else {
   const duration=mode==='paid'?170:mode==='air-recovery'?116:mode==='no-change'?1:10;
   const f=createFeedingSystem(s.simulationTime),signals=new Map(),layout={width:1120,height:324,sizes:Object.fromEntries(Object.entries(speciesProfiles).map(([id,p])=>[id,{width:p.width,height:p.height}])),footprints:Object.fromEntries(Object.entries(speciesProfiles).map(([id,p])=>[id,{halfWidth:p.width/2240,above:p.height/324,below:p.labelHeight/324}])),blockedRects:[]};
   for(let i=0;i<duration*10;i++){const result=f.update(s,.1,layout);for(const signal of result.feedingEvents)signals.set(signal.relationId,signal);}
   memory.pendingDiscoveries=[...signals];
   if(mode==='priority'){
    if(!signals.size||!s.development.history.length)throw new Error('priority fixture requires actual feeding and growth: '+JSON.stringify({signals:signals.size,history:s.development.history,grass:s.organisms.find(o=>o.instanceId==='sprout').development,gh:s.organisms.find(o=>o.instanceId==='feeding-gh').behaviorState}));
    const frog=s.organisms.find(o=>o.instanceId==='urgent-frog');frog.hunger=.99;frog.foodShortageDuration=10;frog.deprivationSeconds=190;
   }
  }
  s.population.introductions=Object.fromEntries([...new Set(s.organisms.map(o=>o.speciesId))].map(id=>[id,{count:s.organisms.filter(o=>o.speciesId===id).length,nextAt:0}]));
  return JSON.stringify(createSaveSnapshot(s,memory,'2000-01-01T00:00:00Z'));
 },{kind,mode});}
 async function openEnvironment(page){await page.locator('#environment-open').tap();}
 async function closeEnvironment(page){await page.locator('#environment-close').tap();}
 async function resumeUntil(page,predicate){await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(predicate,null,{polling:100});await page.emulateMedia({reducedMotion:'reduce'});}
 try{
  const base=await setup();assert.equal((await state(base)).schemaVersion,14);assert.equal(await base.locator('.organism-card').count(),24);assert.equal((await state(base)).inventory.filter(c=>c.acquired).length,5);
  await openEnvironment(base);assert.equal(await base.locator('#environment-event-current').isVisible(),false);assert.equal(await base.locator('#environment-dialog select, #environment-dialog input').count(),0);assert.equal(await base.locator('[data-force-environment-event]').count(),0);await closeEnvironment(base);
  const names={'drought':'가뭄',rain:'비 내림',cloudy:'흐린 날씨','air-pollution':'공기 오염','soil-damage':'숲 바닥 훼손'};
  for(const [kind,name]of Object.entries(names)){
   const p=await setup(await seed(base,kind));await openEnvironment(p);const before=await state(p),r=before.environmentEvents.history.at(-1);
   assert.equal(await p.locator('#environment-event-title').textContent(),name);assert.match(await p.locator('#environment-event-cause').textContent(),kind==='soil-damage'?/사람들이/:kind==='cloudy'?/구름/:kind==='air-pollution'?/오염/:/비/);
   assert.match(await p.locator('#environment-event-expected').textContent(),/수 있어요/);assert.match(await p.locator('#environment-event-direction').textContent(),kind==='rain'?/나아지는/:/낮아지는/);
   assert(r.appliedDelta!==0);assert.match(await p.locator('#environment-event-actual').textContent(),/실제로 있었어요/);assert.match(await p.locator('#environment-event-responses').textContent(),/아직 관리 행동/);
   const unchanged=JSON.stringify({points:before.metrics.points,food:before.observations,growth:before.development,rewards:before.rewardHistory,life:before.organisms.map(o=>o.life),pending:before.population.breeding,environment:before.environment});
   for(const choice of ['wait','observe','observe'])await p.locator(`[data-environment-event-choice="${choice}"]`).tap();const after=await state(p);
   assert.equal(after.environmentEvents.history.at(-1).choice,'observe');assert(after.environmentEvents.history.at(-1).observed);
   assert.equal(JSON.stringify({points:after.metrics.points,food:after.observations,growth:after.development,rewards:after.rewardHistory,life:after.organisms.map(o=>o.life),pending:after.population.breeding,environment:after.environment}),unchanged);
   if(kind==='cloudy')assert.equal(after.environment.air.value,1);
   if(kind==='soil-damage')assert.match(await p.locator('#environment-event-expected').textContent(),/서식지 회복은 흙.*직접 올리지는/);
   await p.evaluate(async()=>(await import('./js/main.js')).saveService.flush(true));await p.reload({waitUntil:'networkidle'});await openEnvironment(p);assert.equal((await state(p)).environmentEvents.history.at(-1).choice,'observe');
   assert.equal((await state(p)).environmentEvents.history.at(-1).appliedDelta,r.appliedDelta);
  }
  console.log('U/V/X: five causes, expected/actual distinction, no free controls, zero-point choices and stable saved effects/life/pending');
  const neutral=await setup(await seed(base,'rain','no-change'));await openEnvironment(neutral);assert.match(await neutral.locator('#environment-event-actual').textContent(),/아직 없어요/);assert(!/강아지풀.*실제 성장/.test(await neutral.locator('#environment-event-actual').textContent()));await closeEnvironment(neutral);
  const noticeId=await neutral.evaluate(()=>window.s.events.find(e=>e.status==='active'&&e.payload.environmentEventId).eventId);await neutral.locator(`[data-event-marker="${noticeId}"]`).tap();await neutral.getByRole('button',{name:'살펴보기',exact:true}).tap();const neutralBefore=await state(neutral);await neutral.getByRole('button',{name:'환경 변화 기록하기',exact:true}).tap();const neutralAfter=await state(neutral);assert.equal(neutralAfter.metrics.points,neutralBefore.metrics.points);assert.equal(neutralAfter.observations.length,0);assert.equal(neutralAfter.development.history.length,0);await neutral.locator('#event-close').tap();
  console.log('V: unchanged rain never claims a biological response; environment notice acknowledges separately for zero points');
  const paid=await setup(await seed(base,'drought','paid'));const alert=await paid.evaluate(()=>window.s.events.find(e=>e.status==='active'&&e.kind==='alert'&&e.payload.factor==='water').eventId);
  await paid.locator(`[data-event-marker="${alert}"]`).tap();await paid.getByRole('button',{name:'살펴보기',exact:true}).tap();const paidBefore=await state(paid);await paid.locator('[data-management-action="water-care"]').tap();const paidAfter=await state(paid);
  assert.equal(paidAfter.managementHistory.length,1);assert.equal(paidAfter.managementHistory[0].cost,6);assert(paidAfter.environment.water.value>paidBefore.environment.water.value);assert.equal(paidAfter.managementCooldowns['water-care']-paidAfter.simulationTime,8);
  const reward=paidAfter.rewardHistory.reduce((sum,r)=>sum+r.amount,0)-paidBefore.rewardHistory.reduce((sum,r)=>sum+r.amount,0);assert.equal(paidAfter.metrics.points,paidBefore.metrics.points-6+reward);
  if(await paid.locator('[data-management-action="water-care"]').count())await paid.locator('[data-management-action="water-care"]').tap({force:true});assert.equal((await state(paid)).managementHistory.length,1);assert.equal((await state(paid)).metrics.points,paidAfter.metrics.points);
  await paid.locator('#event-close').tap();await openEnvironment(paid);assert.match(await paid.locator('#environment-event-responses').textContent(),/물 환경 개선.*실제로 나아졌어요/);
  const air=await setup(await seed(base,'air-pollution','air-recovery'));await openEnvironment(air);assert.equal((await state(air)).environment.air.value<.4,true);const airBefore=await state(air);await air.locator('[data-environment-recovery="air"]').tap();const airAfter=await state(air);assert.equal(airAfter.environment.air.value,.6);assert.equal(airAfter.metrics.points,airBefore.metrics.points-8);assert.equal(airAfter.managementHistory.length,1);assert.match(await air.locator('#environment-event-responses').textContent(),/서식지 회복.*실제로 나아졌어요/);await closeEnvironment(air);
  console.log('N: water care costs6/cooldown8 once, original reward accounting retained; paid air recovery8 -> actual normal .6');
  const historyPage=await setup(await seed(base,'soil-damage','history'));await openEnvironment(historyPage);assert.equal(await historyPage.locator('#environment-event-history>li').count(),3);assert.match(await historyPage.locator('#environment-event-history>li').first().textContent(),/공기 오염/);assert.equal((await state(historyPage)).observations.length,0);await closeEnvironment(historyPage);
  const priority=await setup(await seed(base,'cloudy','priority'));const priorities=await priority.evaluate(async()=>{const {eventPriority}=await import('./data/event-config.js');return window.s.events.filter(e=>e.status==='active').map(e=>({id:e.eventId,value:eventPriority(e),urgent:Boolean(e.payload.urgent),food:Boolean(e.payload.relationId),growth:Boolean(e.payload.developmentSequence),environment:Boolean(e.payload.environmentEventId)}));});
  assert(priorities.some(e=>e.urgent&&e.value===4));assert(priorities.some(e=>e.food&&e.value===3.25));assert(priorities.some(e=>e.growth&&e.value===1));assert(priorities.some(e=>e.environment&&e.value===.75));
  const visible=await priority.locator('[data-event-marker]').evaluateAll(nodes=>nodes.map(n=>n.dataset.eventMarker));assert(visible.length<=4);assert(visible.includes(priorities.find(e=>e.urgent).id));assert(visible.includes(priorities.find(e=>e.food).id));assert(visible.includes(priorities.find(e=>e.growth).id));
  console.log('W: urgent4/core food3.25/growth1/environment .75; real pre-fixture feeding and growth signals, at most4 markers');
  const full=await setup(await seed(base,'air-pollution','full'));assert.equal((await state(full)).organisms.length,30);assert.equal(await full.locator('.organism-object').count(),30);await openEnvironment(full);
  const viewportChecks=[];for(const [width,height]of [[1280,800],[1138,712],[960,600],[1366,768],[412,915]]){
   await full.setViewportSize({width,height});await full.locator('#environment-event-choices').scrollIntoViewIfNeeded();
   const check=await full.evaluate(()=>{const d=document.querySelector('#environment-dialog'),r=d.getBoundingClientRect(),controls=[...d.querySelectorAll('button')].filter(n=>n.getClientRects().length);return {width:innerWidth,height:innerHeight,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,verticalOverflow:innerWidth>800?document.documentElement.scrollHeight>innerHeight:'mobile scrolling allowed',dialogHorizontalOverflow:d.scrollWidth>d.clientWidth,dialogInside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,dialogHeight:r.height,minControlHeight:Math.min(...controls.map(n=>n.getBoundingClientRect().height)),closeVisible:(()=>{const c=document.querySelector('#environment-close').getBoundingClientRect();return c.top>=r.top&&c.bottom<=r.bottom;})()};});
   assert.equal(check.horizontalOverflow,false);if(width>800)assert.equal(check.verticalOverflow,false);assert.equal(check.dialogHorizontalOverflow,false);assert(check.dialogInside&&check.closeVisible);assert(check.minControlHeight>=44);viewportChecks.push(check);
   if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await full.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`stage12-environment-${width}x${height}.png`),fullPage:true});}
  }
  await full.setViewportSize({width:1280,height:800});await full.waitForTimeout(150);await full.evaluate(()=>{window.originalNodes=[...document.querySelectorAll('.organism-object')];window.loopStats.reads=0;window.loopStats.callbacks=0;window.loopStats.maxPending=0;});
  const beforeRun=await state(full);await resumeUntil(full,()=>window.s.simulationTime>=1021.5);const performance=await full.evaluate(()=>({sameNodes:window.originalNodes.every(n=>n.isConnected),...window.loopStats,domCount:document.querySelectorAll('.organism-object').length,visibleEvents:document.querySelectorAll('[data-event-marker]').length}));
  assert(performance.sameNodes);assert.equal(performance.domCount,30);assert.equal(performance.reads,0);assert(performance.maxPending<=1);assert.equal(performance.intervals,0);assert(performance.visibleEvents<=4);
  assert.deepEqual((await state(full)).organisms.map(o=>o.life.duration),beforeRun.organisms.map(o=>o.life.duration));assert((await state(full)).population.breeding.grass.pending);
  await full.emulateMedia({reducedMotion:'no-preference'});await full.waitForTimeout(600);await full.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenBefore=await full.evaluate(()=>({time:window.s.simulationTime,effect:window.s.environmentEvents.history.at(-1).effectSeconds,events:JSON.stringify(window.s.environmentEvents),pending:JSON.stringify(window.s.population.breeding),growth:JSON.stringify(window.s.organisms.map(o=>o.development)),callbacks:window.loopStats.callbacks}));await full.waitForTimeout(1200);
  const hiddenAfter=await full.evaluate(()=>({time:window.s.simulationTime,effect:window.s.environmentEvents.history.at(-1).effectSeconds,events:JSON.stringify(window.s.environmentEvents),pending:JSON.stringify(window.s.population.breeding),growth:JSON.stringify(window.s.organisms.map(o=>o.development)),callbacks:window.loopStats.callbacks}));assert.deepEqual(hiddenAfter,hiddenBefore);
  await full.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});document.dispatchEvent(new Event('visibilitychange'));});await full.waitForTimeout(800);await full.emulateMedia({reducedMotion:'reduce'});const resumed=await state(full);assert(resumed.simulationTime-hiddenBefore.time<=1);assert(resumed.environmentEvents.history.at(-1).effectSeconds-hiddenBefore.effect<=1);
  assert.deepEqual(errors,[]);console.log('Environment browser measurements:',JSON.stringify({viewportChecks,performance,hidden:{before:hiddenBefore.time,after:hiddenAfter.time,resumed:resumed.simulationTime,eventsUnchanged:true,pendingUnchanged:true,growthUnchanged:true},errors}));
  console.log('PASS: environment-events browser; fixtures are local desktop checks, not S5e FPS/thermal/battery measurements');
 }finally{for(const context of contexts)await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
