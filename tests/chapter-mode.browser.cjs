// Chapter mode in a real browser. Needs a static HTTP server at BASE_URL and
// Playwright (PLAYWRIGHT_MODULE). Uses Edge like the other checks, or
// CHROMIUM_PATH when given. Seed progress is fast-forwarded through the
// exported module state; the ecology itself runs for real.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const shots=process.env.SCREENSHOT_DIR;
const forward=(p,seconds)=>p.evaluate(async seconds=>{const m=await import('./js/main.js');m.gameState.chapter.seedProgress=seconds;},seconds);
const chapter=p=>p.evaluate(async()=>{const m=await import('./js/main.js');return JSON.parse(JSON.stringify(m.gameState.chapter));});
// waitForFunction would treat an async predicate's Promise as already true.
async function seedsReach(p,n,ms){const end=Date.now()+ms;while((await chapter(p)).seeds<n){if(Date.now()>end)throw new Error('seeds did not reach '+n);await p.waitForTimeout(250);}}

(async()=>{
 const browser=await chromium.launch(launch);
 for(const viewport of [{width:1280,height:800},{width:960,height:600}]){
  const p=await browser.newPage({viewport,hasTouch:true}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  // Chapter mode opens first; the regular forest is ?mode=forest.
  await p.goto(base);await p.waitForSelector('.chapter-hud');
  await p.goto(base+'?mode=forest');await p.waitForSelector('#chapter-open');
  assert.equal(await p.locator('.chapter-hud').count(),0,'regular forest has no stage HUD');
  await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  await p.waitForTimeout(1500);

  await p.locator('#chapter-open').click();await p.waitForSelector('.chapter-hud');
  // Leaving the regular forest flushes its own save, so record it from here.
  const forestSave=await p.evaluate(()=>localStorage.getItem('eco-system:forest-save'));
  assert(forestSave,'regular forest had saved before chapter mode');
  assert.doesNotMatch(p.url(),/mode=forest/);
  // Chapter 1 opens with its news card instead of the regular help dialog.
  await p.waitForSelector('.chapter-dialog[open]');
  const intro=await p.locator('.chapter-dialog[open]').textContent();
  assert.match(intro,/풀밭/);assert.match(intro,/강아지풀/);assert.match(intro,/흐린 날씨/);
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-intro.png`});
  await p.locator('.chapter-dialog[open] button',{hasText:'시작하기'}).click();
  assert.equal(await p.locator('dialog[open]').count(),0);
  assert.match(await p.locator('.chapter-title h2').textContent(),/1-1 풀밭의 시작/);
  assert.match(await p.locator('.chapter-status').textContent(),/먹는 동물이 없어요/);
  assert(!(await p.locator('.forest-memo').isVisible()),'mission memo hidden');
  const cards=await p.locator('.organism-card[data-species-id]').evaluateAll(cards=>cards.filter(c=>!c.disabled&&!c.classList.contains('locked')).map(c=>c.dataset.speciesId));
  assert(cards.includes('grasshopper')&&cards.includes('grass'));

  // The card row is a shop: prices on the cards, paid on placement.
  assert.equal(await p.locator('.organism-card[data-species-id="grasshopper"]').getAttribute('data-price'),'4P');
  for(const x of [.42,.5]){await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,x,.4);await p.waitForTimeout(400);}
  if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
  assert.equal((await p.evaluate(async()=>(await import('./js/main.js')).gameState.organisms.filter(o=>o.speciesId==='grasshopper').length)),2,'two grasshoppers placed');
  assert.equal(await p.evaluate(async()=>(await import('./js/main.js')).gameState.metrics.points),4,'two grasshoppers cost 8 of 12 points');
  await p.evaluate(async()=>{(await import('./js/main.js')).gameState.metrics.points=2;});
  await p.waitForSelector('.organism-card[data-species-id="grasshopper"][data-afford=false]');
  await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,.6,.4);
  assert.match(await p.locator('#placement-feedback').textContent(),/포인트가 2점 부족해요/,'cannot buy without points');
  if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
  await p.evaluate(async()=>{(await import('./js/main.js')).gameState.metrics.points=4;});

  await p.waitForSelector('.chapter-offer',{timeout:30000});
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-offer.png`});
  await p.locator('.chapter-offer').first().click();
  assert.equal((await chapter(p)).observations,1,'caught observation is counted');
  assert.equal(await p.evaluate(async()=>(await import('./js/main.js')).gameState.metrics.points),5,'a caught 💡 earns a point');
  assert.match(await p.locator('#placement-feedback').textContent(),/관찰 기록/);

  await forward(p,49.9);
  await seedsReach(p,1,30000);
  // Weather is announced, and the forest stops to ask how to prepare.
  await p.waitForSelector('.chapter-prepare-dialog[open]');
  assert.match(await p.locator('.chapter-prepare-dialog[open]').textContent(),/날씨는 바꿀 수 없지만/);
  assert.equal(await p.locator('.chapter-prepare button').count(),3);
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-prepare.png`});
  await p.locator('.chapter-prepare button',{hasText:'강아지풀 더 심기'}).click();
  assert.equal((await chapter(p)).crisisLog[0].choice,'plant');
  await tapBackground(p,.25,.4);await p.waitForTimeout(300);
  if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
  assert.match(await p.locator('.chapter-warning').textContent(),/흐린 날씨/);
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-warning.png`});
  await p.waitForSelector('.forest[data-weather=cloudy]');
  const afterSeed=await chapter(p);assert.equal(afterSeed.seeds,1);
  assert.equal(await p.locator('.chapter-seed.filled').count(),1);
  const started=Date.now();while((await chapter(p)).eventsStarted<1){assert(Date.now()-started<30000,'cloudy day starts after its warning');await p.waitForTimeout(250);}
  await p.waitForSelector('.chapter-warning',{state:'hidden'});
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-cloudy.png`});

  await forward(p,49.9);await seedsReach(p,2,120000);
  await forward(p,49.9);await p.waitForSelector('.chapter-dialog[open]',{timeout:120000});
  assert.match(await p.locator('.chapter-dialog[open]').textContent(),/1-1 완료/);
  assert.match(await p.locator('.chapter-dialog[open]').textContent(),/고른 대비: 먹이 식물 더 심기/,'the weather outcome joins the clear');
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-clear.png`});
  assert.deepEqual(JSON.parse(await p.evaluate(()=>localStorage.getItem('eco-system:chapter-progress'))).cleared,['1-1']);

  await p.locator('.chapter-dialog[open] button',{hasText:'다음 스테이지'}).click();
  // Weather cannot be fixed with points: no care button for sunlight.
  await p.waitForFunction(()=>document.querySelector('.chapter-title h2')?.textContent.includes('1-2'));
  await p.evaluate(async()=>{(await import('./js/main.js')).gameState.environment.sunlight.value=.3;});
  await p.waitForTimeout(500);
  assert.equal(await p.locator('.chapter-care button').count(),0);
  await p.evaluate(async()=>{(await import('./js/main.js')).gameState.environment.sunlight.value=1;});
  await p.waitForFunction(()=>document.querySelector('.chapter-title h2')?.textContent.includes('1-2'));
  assert.equal((await chapter(p)).seeds,0);
  assert.equal((await p.evaluate(async()=>(await import('./js/main.js')).gameState.organisms.filter(o=>o.speciesId==='grasshopper').length)),5,'1-2 starts crowded');
  // The crowded meadow shows its problem on the forest: eaten grass, hungry animals, the grass card.
  await p.waitForSelector('#organism-layer [data-need=eaten]',{state:'attached',timeout:60000});
  await p.waitForSelector('.organism-card[data-species-id=grass][data-chapter-need]',{timeout:5000});
  await p.waitForSelector('#organism-layer [data-need=hungry], #organism-layer [data-need=starving]',{state:'attached',timeout:60000});
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-needs.png`});

  await p.reload();await p.waitForSelector('.chapter-hud');
  assert.match(await p.locator('.chapter-title h2').textContent(),/1-2/,'reload resumes at the first uncleared stage');
  assert.equal(await p.evaluate(()=>localStorage.getItem('eco-system:forest-save')),forestSave,'regular forest save untouched');

  // Finishing a chapter announces the next chapter's animals and crisis.
  await p.evaluate(()=>localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2']})));
  await p.reload();await p.waitForSelector('.chapter-hud');
  assert.match(await p.locator('.chapter-title h2').textContent(),/1-3/);
  await p.evaluate(async()=>{const c=(await import('./js/main.js')).gameState.chapter;Object.assign(c,{seeds:3,cleared:true,clearedAt:200});});
  await p.waitForSelector('.chapter-dialog[open]');
  const done=await p.locator('.chapter-dialog[open]').textContent();
  assert.match(done,/챕터 1 풀밭 완료/);assert.match(done,/다음 챕터: 물가/);assert.match(done,/참개구리/);assert.match(done,/가뭄/);
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-chapter-clear.png`});
  // The next chapter opens only after the chapter's part of "나의 먹이그물".
  assert.equal(await p.locator('.chapter-dialog[open] button',{hasText:'다음 챕터로'}).count(),0);
  await p.locator('.chapter-dialog[open] button',{hasText:'나의 먹이그물 그리기'}).click();
  await p.waitForSelector('.chapter-web-dialog[open]');
  const node=id=>p.locator(`.chapter-web-dialog .web-node[data-species-id="${id}"]`),note=()=>p.locator('.web-note').textContent();
  await node('grass').click();await p.locator('.web-roles button',{hasText:'소비자'}).click();assert.match(await note(),/햇빛/,'wrong role explained');
  for(const [id,role] of [['grass','생산자'],['grasshopper','소비자'],['rabbit','소비자']]){await node(id).click();await p.locator('.web-roles button',{hasText:role}).click();}
  await node('grasshopper').click();await node('grass').click();assert.match(await note(),/거꾸로/,'reversed arrow explained');
  for(const eater of ['grasshopper','rabbit']){await node('grass').click();await node(eater).click();}
  assert.equal(await p.locator('.web-arrow').count(),2);
  assert.equal(await p.locator('.web-arrow.observed').count(),(await p.evaluate(()=>JSON.parse(localStorage.getItem('eco-system:chapter-progress')).observed.filter(id=>['v2_grass_to_grasshopper','v2_grass_to_rabbit'].includes(id)).length)),'observed relations drawn solid');
  await node('grass').click();await p.locator('.web-panel button',{hasText:'확인'}).click();assert.match(await note(),/더 있어요/);
  await node('grasshopper').click();await node('rabbit').click();await p.locator('.web-panel button',{hasText:'확인'}).click();
  assert.match(await p.locator('.web-panel').textContent(),/생물 요소와[^.]*비생물 요소가 서로 영향을/);
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-web.png`});
  await p.locator('.web-panel button',{hasText:'완성'}).click();
  await p.waitForSelector('.chapter-dialog[open] >> text=다음 챕터로');
  await p.locator('.chapter-dialog[open] button',{hasText:'다음 챕터로'}).click();
  await p.waitForFunction(()=>document.querySelector('.chapter-title h2')?.textContent.includes('2-1'));
  await p.waitForSelector('.chapter-dialog[open]');assert.match(await p.locator('.chapter-dialog[open]').textContent(),/물가/);
  await p.locator('.chapter-dialog[open] button',{hasText:'시작하기'}).click();
  await p.locator('.chapter-actions button',{hasText:'숲 지도'}).click();
  assert.equal(await p.locator('.map-area').count(),4,'map shows 4 forest areas');
  assert.equal(await p.locator('.map-area .map-web').count(),1,'chapter 1 web completed');
  await p.locator('.chapter-dialog[open] button',{hasText:'닫기'}).click();
  await p.locator('.chapter-actions button',{hasText:'나의 먹이그물'}).click();
  assert.equal(await p.locator('.chapter-web-dialog .web-node.unsorted').count(),1,'chapter 2 adds only the frog to sort');
  await p.locator('.web-close').click();
  await p.locator('.chapter-actions button',{hasText:'숲 지도'}).click();
  assert.equal(await p.locator('.map-stone:not([disabled])').count(),3,'1-1, 1-2 and the next stage are open');
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-picker.png`});
  await p.locator('.chapter-dialog[open] button',{hasText:'닫기'}).click();
  // A human-made crisis drops litter that is tapped away for a point.
  await p.evaluate(()=>localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3','2-1','2-2','2-3']})));
  await p.reload();await p.waitForSelector('.chapter-hud');
  if(await p.locator('.chapter-dialog[open]').count())await p.locator('.chapter-dialog[open] button',{hasText:'시작하기'}).click();
  await p.evaluate(async()=>{const m=await import('./js/main.js');m.gameState.chapter.trash.push({trashId:'t1',kind:'soil-damage',x:.5,y:.74});m.gameState.environment.soil.value=.3;});
  await p.waitForSelector('.chapter-trash');
  await p.waitForSelector('.chapter-care button',{state:'attached'});assert.match(await p.locator('.chapter-care button').textContent(),/숲 바닥 되살리기/);
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-trash.png`});
  const before=await p.evaluate(async()=>(await import('./js/main.js')).gameState.metrics.points);
  await p.locator('.chapter-trash').click();
  assert.equal(await p.locator('.chapter-trash').count(),0);
  assert.equal(await p.evaluate(async()=>(await import('./js/main.js')).gameState.metrics.points),before+1);
  await p.locator('.chapter-actions button',{hasText:'숲 지도'}).click();await p.waitForSelector('.chapter-map-dialog[open]');
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-map.png`});
  await p.locator('.chapter-dialog[open] button',{hasText:'닫기'}).click();
  await p.locator('.chapter-actions button',{hasText:'기존 숲으로'}).click();await p.waitForSelector('#chapter-open');
  assert.equal(await p.locator('.chapter-hud').count(),0);
  assert.deepEqual(errors,[],errors.join('\n'));
  await p.evaluate(()=>{localStorage.removeItem('eco-system:chapter-progress');});
  await p.close();console.log(`PASS chapter mode ${viewport.width}x${viewport.height}`);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
