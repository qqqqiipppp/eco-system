// The prepare window before weather. Playtest bugs: with no animal to spare it
// threw (its "돌려보내기" label read the name of no animal) and never opened;
// "더 심기" without enough points was taken as the choice, then nothing was planted.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:620},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForSelector('.chapter-hud');
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 // One grasshopper only: none can be sent back.
 await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,.46,.4);await p.waitForTimeout(300);
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 assert.equal(await p.evaluate(async()=>(await import('./js/main.js')).gameState.organisms.filter(o=>o.speciesId==='grasshopper').length),1);
 await p.evaluate(async()=>{(await import('./js/main.js')).gameState.chapter.seedProgress=49.9;});
 await p.waitForSelector('.chapter-prepare-dialog[open]',{timeout:8000});
 const reduce=p.locator('.chapter-prepare button').nth(1);
 assert.ok(await reduce.isDisabled(),'nothing to send back: the button is off');
 assert.match(await reduce.textContent(),/돌려보내기/);
 // Not enough points: the button flashes red and says so; the window stays and nothing is chosen.
 await p.evaluate(async()=>{(await import('./js/main.js')).gameState.metrics.points=0;});
 const plant=p.locator('.chapter-prepare button').first();await plant.click();
 assert.ok(await plant.evaluate(b=>b.classList.contains('is-short')),'the button flashes');
 assert.match(await p.locator('.chapter-prepare-dialog .chapter-short-note').textContent(),/포인트가 \d+점 부족/);
 assert.ok(await p.locator('.chapter-prepare-dialog[open]').count(),'the window stays open');
 assert.equal(await p.evaluate(async()=>(await import('./js/main.js')).gameState.chapter.crisisLog.at(-1).choice??null),null,'nothing chosen yet');
 await p.locator('.chapter-prepare button',{hasText:'그냥 기다리기'}).click();
 assert.equal(await p.evaluate(async()=>(await import('./js/main.js')).gameState.chapter.crisisLog.at(-1).choice),'wait');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS prepare window');
})().catch(e=>{console.error(e.message);process.exit(1);});
