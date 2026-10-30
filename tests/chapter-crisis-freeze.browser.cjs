// Classroom report: the forest froze behind the "곧 가뭄이 와요!" window.
// The prepare window must never hold the forest forever, and one failing
// frame must never end the game loop.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
async function warnedForest(b){
 const p=await b.newPage({viewport:{width:1280,height:620},hasTouch:true});
 await p.goto(base);await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 for(const x of [.42,.5]){await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,x,.4);await p.waitForTimeout(300);}
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.evaluate(async()=>{(await import('./js/main.js')).gameState.chapter.seedProgress=49.9;});
 await p.waitForSelector('.chapter-prepare-dialog[open]',{timeout:8000});
 return p;
}
const state=p=>p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;return {t:g.simulationTime,choice:g.chapter.crisisLog.at(-1)?.choice,open:Boolean(document.querySelector('dialog[open]'))};});
(async()=>{
 const b=await chromium.launch(launch);
 // 1. Nobody chooses: after the countdown the forest goes on with "wait".
 let p=await warnedForest(b);
 assert.match(await p.locator('.chapter-prepare-timer').textContent(),/20초 안에 고르지 않으면/);
 const frozen=await state(p);await p.waitForTimeout(21500);
 let now=await state(p);
 assert.equal(now.choice,'wait','an unanswered window goes on with wait');assert.equal(now.open,false);
 await p.waitForTimeout(1500);assert.ok((await state(p)).t>frozen.t+1,'the forest clock runs again');
 await p.close();
 // 2. Closed another way (back button or Esc): same as wait, and it does not come back.
 p=await warnedForest(b);await p.keyboard.press('Escape');await p.waitForTimeout(800);
 now=await state(p);assert.equal(now.choice,'wait');assert.equal(now.open,false,'the window does not reopen');
 const t1=now.t;await p.waitForTimeout(1500);assert.ok((await state(p)).t>t1+1);
 await p.close();
 // 3. A choice still works at once.
 p=await warnedForest(b);await p.locator('.chapter-prepare button',{hasText:'그냥 기다리기'}).tap();
 assert.equal((await state(p)).choice,'wait');await p.close();
 // 4. The actual classroom freeze: with nothing to send back (one grasshopper),
 // building the "send one back" label threw and the forest stopped at "5".
 p=await b.newPage({viewport:{width:1280,height:620},hasTouch:true});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,.45,.4);await p.waitForTimeout(300);
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
 await p.evaluate(()=>{localStorage.removeItem('eco-system:errors');document.querySelectorAll('dialog[open]').forEach(d=>d.close());});
 await p.evaluate(async()=>{(await import('./js/main.js')).gameState.chapter.seedProgress=49.9;});
 await p.waitForSelector('.chapter-prepare-dialog[open]',{timeout:8000});
 assert.equal(await p.locator('.chapter-prepare button',{hasText:'먹는 동물 한 마리 돌려보내기'}).isDisabled(),true,'an unusable option is shown disabled');
 await p.locator('.chapter-prepare button',{hasText:'그냥 기다리기'}).tap();
 const t2=(await state(p)).t;await p.waitForTimeout(1500);assert.ok((await state(p)).t>t2+1,'the forest goes on');
 assert.equal(await p.evaluate(()=>localStorage.getItem('eco-system:errors')),null,'no frame error');
 assert.deepEqual(errors,[]);await p.close();
 // 5. One failing frame does not end the loop.
 p=await b.newPage();await p.goto(base);await p.waitForSelector('.chapter-hud');
 const frames=await p.evaluate(async()=>{const {createUpdateLoop}=await import('./js/systems/update-loop.js');let n=0,errors=0;
  const loop=createUpdateLoop({update:()=>{n++;if(n===2)throw new Error('boom');return {};},render:()=>{},hasWork:()=>true,onError:()=>errors++,pauseForReducedMotion:false});
  loop.refresh();await new Promise(r=>setTimeout(r,600));loop.dispose();return {n,errors};});
 assert.equal(frames.errors,1);assert.ok(frames.n>5,'frames continue after an error: '+frames.n);
 const log=await p.evaluate(async()=>{const {recordError}=await import('./js/ui/error-log.js');recordError(new Error('test'),'test');return JSON.parse(localStorage.getItem('eco-system:errors')).at(-1).message;});
 assert.equal(log,'test','errors are kept on the device for #errors');
 await b.close();console.log('PASS chapter crisis never freezes');
})().catch(e=>{console.error(e);process.exit(1);});
