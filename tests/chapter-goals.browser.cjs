// The stage goal at a glance: two short chips in the round face, ticked as the
// forest reaches them; the whole story shows when the title is tapped.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2']}));});
 await p.reload();await p.waitForSelector('.chapter-tasks li');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const chips=p.locator('.chapter-tasks li');
 assert.deepEqual(await chips.allTextContents(),['멧토끼 기르기✓','방아깨비 번식하기✓']);
 assert.deepEqual(await chips.evaluateAll(l=>l.map(li=>li.dataset.done)),['false','false']);
 assert.ok(!await p.locator('.chapter-goal').isVisible(),'the long goal waits behind the title');
 await p.evaluate(async()=>{(await import('./js/main.js')).gameState.chapter.births.push({speciesId:'grasshopper',at:1});});
 await p.waitForFunction(()=>document.querySelectorAll('.chapter-tasks li')[1].dataset.done==='true');
 assert.ok(await p.locator('.chapter-tasks li').nth(1).locator('.task-check').isVisible(),'ticked');
 await p.locator('.chapter-title').click();assert.ok(await p.locator('.chapter-goal').isVisible(),'tapping the title shows it');
 assert.ok(await p.evaluate(async()=>{await document.fonts.ready;return document.fonts.check('19px Jua','멧토끼');}),'the round face is loaded');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS chapter goals');
})().catch(e=>{console.error(e.message);process.exit(1);});
