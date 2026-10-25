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
  await p.goto(base);await p.waitForSelector('#chapter-open');
  assert.equal(await p.locator('.chapter-hud').count(),0,'regular forest has no stage HUD');
  await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  await p.waitForTimeout(1500);

  await p.locator('#chapter-open').click();await p.waitForSelector('.chapter-hud');
  // Leaving the regular forest flushes its own save, so record it from here.
  const forestSave=await p.evaluate(()=>localStorage.getItem('eco-system:forest-save'));
  assert(forestSave,'regular forest had saved before chapter mode');
  assert.match(p.url(),/mode=chapter/);
  assert.equal(await p.locator('dialog[open]').count(),0,'no help dialog over the first stage');
  assert.match(await p.locator('.chapter-title h2').textContent(),/1-1 풀밭의 시작/);
  assert.match(await p.locator('.chapter-status').textContent(),/먹는 동물이 없어요/);
  assert(!(await p.locator('.forest-memo').isVisible()),'mission memo hidden');
  const cards=await p.locator('.organism-card[data-species-id]').evaluateAll(cards=>cards.filter(c=>!c.disabled&&!c.classList.contains('locked')).map(c=>c.dataset.speciesId));
  assert(cards.includes('grasshopper')&&cards.includes('grass'));

  for(const x of [.42,.5]){await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,x,.4);await p.waitForTimeout(400);}
  if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
  assert.equal((await p.evaluate(async()=>(await import('./js/main.js')).gameState.organisms.filter(o=>o.speciesId==='grasshopper').length)),2,'two grasshoppers placed');

  await p.waitForSelector('.chapter-offer',{timeout:30000});
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-offer.png`});
  await p.locator('.chapter-offer').first().click();
  assert.equal((await chapter(p)).observations,1,'caught observation is counted');
  assert.match(await p.locator('#placement-feedback').textContent(),/관찰 기록/);

  await forward(p,49.9);
  await seedsReach(p,1,30000);
  const afterSeed=await chapter(p);assert(afterSeed.eventStarted,'cloudy day starts with the first seed');
  assert.equal(await p.locator('.chapter-seed.filled').count(),1);
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-cloudy.png`});

  await forward(p,49.9);await seedsReach(p,2,120000);
  await forward(p,49.9);await p.waitForSelector('.chapter-dialog[open]',{timeout:120000});
  assert.match(await p.locator('.chapter-dialog[open]').textContent(),/1-1 완료/);
  if(shots)await p.screenshot({path:`${shots}/chapter-${viewport.width}-clear.png`});
  assert.deepEqual(JSON.parse(await p.evaluate(()=>localStorage.getItem('eco-system:chapter-progress'))).cleared,['1-1']);

  await p.locator('.chapter-dialog[open] button',{hasText:'다음 스테이지'}).click();
  await p.waitForFunction(()=>document.querySelector('.chapter-title h2')?.textContent.includes('1-2'));
  assert.equal((await chapter(p)).seeds,0);
  assert.equal((await p.evaluate(async()=>(await import('./js/main.js')).gameState.organisms.filter(o=>o.speciesId==='grasshopper').length)),5,'1-2 starts crowded');

  await p.reload();await p.waitForSelector('.chapter-hud');
  assert.match(await p.locator('.chapter-title h2').textContent(),/1-2/,'reload resumes at the first uncleared stage');
  assert.equal(await p.evaluate(()=>localStorage.getItem('eco-system:forest-save')),forestSave,'regular forest save untouched');

  await p.locator('.chapter-actions button',{hasText:'기존 숲으로'}).click();await p.waitForSelector('#chapter-open');
  assert.equal(await p.locator('.chapter-hud').count(),0);
  assert.deepEqual(errors,[],errors.join('\n'));
  await p.evaluate(()=>{localStorage.removeItem('eco-system:chapter-progress');});
  await p.close();console.log(`PASS chapter mode ${viewport.width}x${viewport.height}`);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
