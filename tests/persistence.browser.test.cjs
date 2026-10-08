const { dismissWelcome, useDeveloperEnvironment } = require('./fixtures.cjs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8082/eco-system/';const KEY='eco-system:forest-save';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];const contexts=[];
 const snapshot=p=>p.evaluate(async()=>structuredClone((await import('./js/main.js')).gameState));
 async function setup(raw,reduce=true){const c=await browser.newContext({viewport:{width:1138,height:712},hasTouch:true,reducedMotion:reduce?'reduce':'no-preference'});contexts.push(c);
  await c.addInitScript(({raw,key})=>{if(raw!==undefined&&!sessionStorage.getItem('seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('seeded','yes')}window.writes=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){if(this===localStorage)window.writes++;return original.apply(this,args)};},{raw,key:KEY});
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});await useDeveloperEnvironment(p); await p.goto(BASE,{waitUntil:'networkidle'}); await dismissWelcome(p);return p;}
 async function environment(p,factor,level){await p.locator('#environment-open').click();await p.getByLabel(`${factor} 상태`,{exact:true}).selectOption(level);await p.locator('#environment-close').click();}
 async function place(p,id,x=.4,y=.72){await p.locator(`.organism-card[data-species-id="${id}"]`).tap();const box=await p.locator('#placement-surface').boundingBox();await p.touchscreen.tap(box.x+x*box.width,box.y+y*box.height);}
 async function seedSnapshot(p,count=12){return p.evaluate(async(count)=>{
  const {createGameState}=await import('./js/state/game-state.js');const {createOrganismInstance}=await import('./js/state/organism-instance.js');const {createSaveSnapshot}=await import('./js/services/save-format.js');const {completeActivity}=await import('./js/systems/activities.js');
  const s=createGameState();s.inventory.forEach(c=>c.acquired=true);s.observations=['grass_to_grasshopper','grasshopper_to_frog'].map(relationId=>({relationId,eventId:'old',discoveredAt:0}));
  completeActivity(s,'producer_quiz','grass');completeActivity(s,'decomposer_classify','decomposer');completeActivity(s,'grass_observation');
  const species=['oak',...Array(6).fill('grass'),...Array(4).fill('grasshopper'),'frog'];while(species.length<count)species.push('rabbit');
  s.organisms=species.map((id,i)=>createOrganismInstance(id,`test-${i}`,{x:.3+(i%4)*.035,y:.74}));s.metrics.bestStability=80;
  return JSON.stringify(createSaveSnapshot(s,{sequence:30,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-08T00:00:00.000Z'));
 },count)}
 try{
  // F/G/K/L/M/O: real progression and management, actual subpath HTTP serving.
  const p=await setup();assert.equal((await snapshot(p)).inventory.filter(c=>c.acquired).length,3);
  await p.locator('.organism-card[data-species-id="mushroom"]').tap();await p.locator('[data-answer="decomposer"]').click();await p.locator('#activity-close').click();await place(p,'mushroom',.36,.76);
  await place(p,'grasshopper',.43,.70);await p.emulateMedia({reducedMotion:'no-preference'});await p.locator('.event-insight').first().waitFor({timeout:40000});
  await p.locator('.event-insight').first().tap();await p.getByRole('button',{name:'살펴보기',exact:true}).click();await p.getByRole('button',{name:'발견 기록하기',exact:true}).click();await p.locator('#event-close').click();
  await p.locator('.organism-card[data-species-id="frog"]').tap();await p.locator('[data-answer="confirm"]').click();await p.locator('#activity-close').click();
  await environment(p,'물','bad');await p.locator('.abiotic-status .event-alert').waitFor({timeout:15000});await p.locator('.abiotic-status .event-alert').tap();await p.getByRole('button',{name:'살펴보기',exact:true}).click();await p.locator('[data-management-action="water-care"]').tap();await p.locator('#event-close').click();
  await place(p,'frog',.16,.65);
  await p.evaluate(async()=>{window.stateForTest=(await import('./js/main.js')).gameState});await p.waitForFunction(()=>window.stateForTest.organisms.some(o=>o.behaviorState==='moveToFood'),null,{timeout:40000});await p.emulateMedia({reducedMotion:'reduce'});
  const before=await snapshot(p);await p.waitForTimeout(1600);assert.equal(await p.locator('#save-status').textContent(),'저장됨');
  const stored=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);assert(!JSON.stringify(stored).includes('targetInstanceId'));assert.equal(stored.domain.managementHistory.length,1);
  await p.reload({waitUntil:'networkidle'});const after=await snapshot(p);
  assert.deepEqual(after.inventory,before.inventory);assert.equal(after.metrics.points,before.metrics.points);assert.deepEqual(after.observations,before.observations);assert.deepEqual(after.activities,before.activities);assert.equal(after.organisms.length,before.organisms.length);
  for(const organism of after.organisms){const prev=before.organisms.find(o=>o.instanceId===organism.instanceId);assert.deepEqual(organism.position,prev.position);if('hunger'in organism){assert.equal(organism.hunger,prev.hunger);assert.equal(organism.behaviorState,'wander');assert.equal(organism.targetInstanceId,null);}}
  assert.equal(after.simulationTime,before.simulationTime);assert.equal(await p.locator('dialog[open]').count(),0);assert.equal(await p.locator('.organism-card[aria-pressed="true"]').count(),0);
  const writes=await p.evaluate(()=>window.writes);await p.waitForTimeout(1700);assert.equal(await p.evaluate(()=>window.writes),writes);
  await p.locator('#goal-open').click();await p.locator('#restart-open').click();await p.locator('#restart-cancel').click();assert.deepEqual(await snapshot(p),after);
  await p.locator('#goal-open').click();await p.locator('#restart-open').click();await p.locator('#restart-confirm').click();const fresh=await snapshot(p);assert.equal(fresh.organisms.length,3);assert.equal(fresh.metrics.points,0);assert.equal(fresh.simulationTime,0);assert.equal(fresh.managementHistory.length,0);assert.equal(fresh.inventory.filter(c=>c.acquired).length,3);assert.equal(await p.evaluate(key=>localStorage.getItem(key),KEY),null);
  assert.equal(await p.locator('.organism-object').count(),3);await place(p,'grass',.4,.74);assert.equal((await snapshot(p)).organisms.length,4);console.log('F/G/K/L/M/O: real progression restored at /eco-system/, safe feeding restart, save coalescing and in-place confirmed reset');
  const goalRaw=await seedSnapshot(p);
  // A/B/C/D/E: actual 30 seconds of ecology, no fast-forwarded clear clock.
  const g=await setup(goalRaw,false);await g.locator('#goal-open').click();await g.waitForFunction(()=>document.querySelector('#hold-progress').value>.06,null,{timeout:15000});await g.locator('#goal-close').click();
  await environment(g,'물','bad');assert.equal((await snapshot(g)).forestProgress.stableSeconds,0);assert.equal((await snapshot(g)).forestProgress.cleared,false);await environment(g,'물','good');
  await g.waitForFunction(()=>document.querySelector('#goal-label').textContent==='숲 생태계 목표 달성!',null,{timeout:65000});const cleared=await snapshot(g);assert(cleared.forestProgress.cleared);assert(cleared.forestProgress.clearedAt>=30);await environment(g,'물','bad');await environment(g,'토양','bad');assert((await snapshot(g)).forestProgress.cleared);assert((await snapshot(g)).metrics.stability<cleared.metrics.bestStability);
  await g.emulateMedia({reducedMotion:'reduce'});await g.reload({waitUntil:'networkidle'});assert((await snapshot(g)).forestProgress.cleared);await g.locator('#goal-open').click();if(process.env.SCREENSHOT_PATH)await g.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});await g.locator('#goal-close').click();
  console.log('A/B/C/D/E: interrupted hold resets, real 30-second clear persists after deterioration/reload');
  // H: recreate a saved shortage immediately without trusting active event JSON.
  const shortage=JSON.parse(goalRaw);shortage.domain.organisms.find(o=>o.speciesId==='frog').hunger=1;shortage.domain.organisms.find(o=>o.speciesId==='frog').foodShortageDuration=12;
  const h=await setup(JSON.stringify(shortage));assert((await snapshot(h)).events.some(e=>e.kind==='alert'&&e.payload.speciesId==='frog'));await h.reload({waitUntil:'networkidle'});assert((await snapshot(h)).events.some(e=>e.kind==='alert'));
  // I/J: damaged storage and out-of-range values are handled before render.
  const bad=await setup('{broken');assert.equal((await snapshot(bad)).organisms.length,3);assert.match(await bad.locator('#save-status').textContent(),/손상/);
  const corrupt=JSON.parse(goalRaw);corrupt.domain.metrics.points=-1;corrupt.domain.organisms[0].speciesId='missing';corrupt.domain.organisms[1].position.x=9;corrupt.domain.organisms.push({...corrupt.domain.organisms[2]});
  const j=await setup(JSON.stringify(corrupt));const fixed=await snapshot(j);assert.equal(fixed.metrics.points,0);assert(fixed.organisms.every(o=>o.position.x<=1));assert.equal(new Set(fixed.organisms.map(o=>o.instanceId)).size,fixed.organisms.length);
  console.log('H/I/J: live alerts regenerated, corrupt JSON/species/coordinates/points safely recovered');
  // N: 30-organism restore with live domain and no extra DOM rebuild from save.
  const raw30=await seedSnapshot(p,30),n=await setup(raw30);const thirty=await snapshot(n);assert.equal(thirty.organisms.length,30);await n.reload({waitUntil:'networkidle'});assert.deepEqual((await snapshot(n)).organisms,thirty.organisms);
  await n.evaluate(()=>{window.nodes=[...document.querySelectorAll('.organism-object')];window.reads=0;const original=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){window.reads++;return original.call(this)}});
  await n.emulateMedia({reducedMotion:'no-preference'});await n.evaluate(async()=>{const {saveService}=await import('./js/main.js');for(let i=0;i<25;i++)saveService.schedule()});const startWrites=await n.evaluate(()=>window.writes);await n.waitForTimeout(1800);
  const perf=await n.evaluate(()=>({stable:[...document.querySelectorAll('.organism-object')].every(node=>window.nodes.includes(node)),reads:window.reads,writes:window.writes}));assert(perf.stable);assert.equal(perf.reads,0);assert(perf.writes-startWrites<=1);assert(JSON.stringify(JSON.parse(raw30)).length<50000);
  for(const [width,height]of [[960,600],[412,915]]){await n.setViewportSize({width,height});await n.waitForTimeout(100);assert.equal(await n.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  console.log('N/K: 30-organism restore and batched save',JSON.stringify(perf));
  // Storage denial leaves gameplay usable, reset failure keeps current state.
  const denied=await setup();await denied.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('quota')};Storage.prototype.removeItem=function(){throw Error('denied')}});await place(denied,'grass',.4,.74);await denied.waitForTimeout(1500);assert.match(await denied.locator('#save-status').textContent(),/저장하지 못/);const kept=await snapshot(denied);await denied.locator('#goal-open').click();await denied.locator('#restart-open').click();await denied.locator('#restart-confirm').click();assert.deepEqual(await snapshot(denied),kept);
  // Close and relaunch Edge with the same temporary browser profile.
  const os=require('node:os'),path=require('node:path'),fs=require('node:fs');
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'eco-system-save-'));
  try {
    let persistent=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,reducedMotion:'reduce'});
    let tab=await persistent.newPage();await useDeveloperEnvironment(tab); await tab.goto(BASE,{waitUntil:'networkidle'}); await dismissWelcome(tab);await tab.locator('#activities-open').click();await tab.locator('[data-answer="grass"]').click();await tab.waitForTimeout(1500);assert.equal((await snapshot(tab)).metrics.points,3);await persistent.close();
    persistent=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,reducedMotion:'reduce'});
    tab=await persistent.newPage();await useDeveloperEnvironment(tab); await tab.goto(BASE,{waitUntil:'networkidle'}); await dismissWelcome(tab);assert.equal((await snapshot(tab)).metrics.points,3);assert((await snapshot(tab)).activities.find(a=>a.activityId==='producer_quiz').completed);await persistent.close();
  } finally {
    const root=fs.realpathSync(os.tmpdir()),target=fs.realpathSync(profile);
    if(target.startsWith(root+path.sep)&&path.basename(target).startsWith('eco-system-save-'))fs.rmSync(target,{recursive:true,force:true});
  }
  console.log('Browser close/relaunch: saved activity and points restored in persistent profile');
  assert.deepEqual(errors,[]);console.log('PASS: persistence A-O, subpath, quota/denial fallback');
 }finally{for(const c of contexts)await c.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
