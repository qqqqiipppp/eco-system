const {reveal}=require('./ux-browser-helpers.cjs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {dismissWelcome}=require('./fixtures.cjs'),{snapshot}=require('./habitat.browser-fixtures.cjs');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
(async()=>{
 const {world}=await import('./ecology-fixtures.mjs'),{foodRelations}=await import('../data/food-relations.js'),{survivalConfig}=await import('../data/survival-config.js');
 const browser=await chromium.launch({channel:'msedge',headless:true}),results={stage:'15.7',viewport:{width:1280,height:800},actualS5e:false,scenarios:[],errors:[]};
 async function scenario(consumer,food,{releaseFirst=false}={}){
  const removedFood={ladybird:'snail','field-mouse':'grasshopper',weasel:'frog'}[consumer];const s=world([[consumer,1,.4],[food,1,consumer==='spider'?.41:.43],...(releaseFirst?[[removedFood,1,.41]]:[])]);s.organisms[0].hunger=1;for(const o of s.organisms.slice(1)){if('hunger'in o)o.hunger=0;if(o.speciesId==='earthworm')o.life.initialAge=survivalConfig.earthwormCycleSeconds-survivalConfig.earthwormSurfaceSeconds-(releaseFirst?4:0);}
  const c=await browser.newContext({viewport:results.viewport,hasTouch:true,reducedMotion:'reduce'});
  // Reproducible wandering only; production choices/resources/feeding/rendering remain active.
  await c.addInitScript(raw=>{Math.random=()=>.7;if(!sessionStorage.seeded){localStorage.setItem('eco-system:forest-save',JSON.stringify(raw));sessionStorage.seeded='1';}},await snapshot(s));
  const p=await c.newPage();p.on('pageerror',e=>results.errors.push(e.message));await p.goto(BASE,{waitUntil:'networkidle'});await dismissWelcome(p);
  await p.evaluate(async()=>{
   const m=await import('./js/main.js');window.state=m.gameState;window.audit={meals:[],contacts:[],targets:[]};const update=m.feedingSystem.update;
   m.feedingSystem.update=(...args)=>{const r=update(...args);window.audit.meals.push(...r.feedingEvents);const o=window.state.organisms[0];if(o?.targetInstanceId)window.audit.targets.push({species:o.speciesId,target:o.targetInstanceId,behavior:o.behaviorState});return r;};
   const pos=id=>{const n=document.querySelector('[data-instance-id="'+id+'"]');if(!n)return null;const m=new DOMMatrix(getComputedStyle(n).transform);return {x:m.e,y:m.f};};
   window.audit.resting=pos(window.state.organisms[0].instanceId);new MutationObserver(()=>{for(const o of window.state.organisms){if(o.behaviorState!=='eat'||!o.targetInstanceId)continue;const a=pos(o.instanceId),b=pos(o.targetInstanceId);if(a&&b)window.audit.contacts.push({consumer:o.speciesId,target:o.targetInstanceId,gap:Math.hypot(a.x-b.x,a.y-b.y),physical:{...o.position},consumerView:a,targetView:b});}}).observe(document.querySelector('#organism-layer'),{subtree:true,attributes:true,attributeFilter:['class']});
  });
  await p.emulateMedia({reducedMotion:'no-preference'});
  if(releaseFirst){
   const rabbit=s.organisms.find(o=>o.speciesId===removedFood);await p.waitForFunction(id=>window.state.organisms[0].targetInstanceId===id,rabbit.instanceId,{timeout:12000,polling:50});await p.emulateMedia({reducedMotion:'reduce'});
   // Student's existing two-tap release action removes the currently pursued rabbit.
   await p.locator('#population-open').tap();await p.locator('#population-species').selectOption(removedFood);await reveal(p,'#population-release');await p.locator('#population-release').tap();await reveal(p,'#population-release');await p.locator('#population-release').tap();await p.locator('#population-close').tap();
   assert(!await p.evaluate(id=>window.state.organisms.some(o=>o.instanceId===id),rabbit.instanceId));await p.emulateMedia({reducedMotion:'no-preference'});
  }
  await p.waitForFunction(id=>window.audit.contacts.some(c=>c.consumer===id),consumer,{timeout:20000,polling:50});
  if(process.env.SCREENSHOT_DIR){await p.emulateMedia({reducedMotion:'reduce'});fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.SCREENSHOT_DIR,consumer+'-'+food+(releaseFirst?'-after-release':'')+'.png'),fullPage:true});await p.emulateMedia({reducedMotion:'no-preference'});}
  await p.waitForFunction(id=>window.audit.meals.some(m=>m.consumerSpeciesId===id),consumer,{timeout:20000,polling:50});await p.emulateMedia({reducedMotion:'reduce'});
  const data=await p.evaluate(()=>({audit:window.audit,state:structuredClone(window.state),dom:[...document.querySelectorAll('.organism-object')].map(n=>n.dataset.instanceId),feedback:document.querySelector('#placement-feedback').textContent})),meal=data.audit.meals.find(m=>m.consumerSpeciesId===consumer);
  assert.equal(meal.foodSpeciesId,food);assert(data.audit.contacts.some(c=>c.consumer===consumer&&c.target===meal.foodInstanceId&&c.gap<50));
  const relation=foodRelations.find(r=>r.relationId===meal.relationId);assert.equal(data.dom.includes(meal.foodInstanceId),relation.feedingMode==='resource');assert.equal(data.state.metrics.points,0);assert.equal(data.state.observations.length,0);assert.match(data.feedback,/먹었어요|먹이를 얻었어요/);
  if(consumer==='spider'){for(const contact of data.audit.contacts.filter(c=>c.consumer==='spider'))assert.deepEqual(contact.consumerView,data.audit.resting);}if(releaseFirst)assert(!data.audit.meals.some(m=>m.foodSpeciesId===removedFood));
  const box=await p.locator('[data-inspect-instance="'+s.organisms[0].instanceId+'"]').boundingBox();assert(box.width>=44&&box.height>=44);await p.locator('[data-inspect-instance="'+s.organisms[0].instanceId+'"]').tap({position:{x:4,y:box.height-4}});await p.locator('#population-dialog').waitFor({state:'visible'});if(await p.locator('#population-dialog').getAttribute('data-selected-instance-id')!==s.organisms[0].instanceId)await p.locator('[data-inspect-choice="'+s.organisms[0].instanceId+'"]').tap();assert.equal(await p.locator('#population-dialog').getAttribute('data-selected-instance-id'),s.organisms[0].instanceId);
  await p.locator('#population-close').tap();await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(rid=>window.state.events.some(e=>e.status==='active'&&e.payload.relationId===rid),meal.relationId,{timeout:10000});await p.emulateMedia({reducedMotion:'reduce'});const eventId=await p.evaluate(rid=>window.state.events.find(e=>e.status==='active'&&e.payload.relationId===rid).eventId,meal.relationId);await p.locator('[data-event-marker="'+eventId+'"]').tap();await p.getByRole('button',{name:'발견 기록하기',exact:true}).tap();assert.equal(await p.evaluate(()=>window.state.metrics.points),12);await p.locator('#event-close').tap();await p.evaluate(async()=>(await import('./js/main.js')).saveService.flush(true));await p.reload({waitUntil:'networkidle'});const restored=await p.evaluate(async()=>structuredClone((await import('./js/main.js')).gameState));assert.equal(restored.metrics.points,12);assert(restored.profile.relations.some(r=>r.relationId===meal.relationId));await p.locator('#web-open').tap();assert.equal(await p.locator('[data-web-relation]').count(),27);assert.match(await p.locator('#web-progress').textContent(),/27개/);const row={consumer,food,releaseFirst,meal,confirmedPoints:12,reload:true,webCount:27,contactPixels:Math.min(...data.audit.contacts.filter(c=>c.consumer===consumer&&c.target===meal.foodInstanceId).map(c=>c.gap)),victimDOMRemoved:relation.feedingMode==='predation',actualTouch:true,points:0,recordedWithoutAcknowledgement:false,feedback:data.feedback};results.scenarios.push(row);console.log(JSON.stringify(row));await c.close();
 }
 try{for(const [consumer,food]of [['ladybird','earthworm'],['weasel','earthworm'],['field-mouse','earthworm'],['field-mouse','aphid'],['bulbul','caterpillar']])await scenario(consumer,food);for(const consumer of ['ladybird','field-mouse','weasel'])await scenario(consumer,'earthworm',{releaseFirst:true});assert.deepEqual(results.errors,[]);fs.writeFileSync(process.env.RESULTS_PATH||path.join(__dirname,'food-expansion.browser-results.json'),JSON.stringify(results,null,2)+'\n');console.log('PASS 8 real-clock feeding/render/contact/touch scenarios');}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});





