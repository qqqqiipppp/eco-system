// Playtest: all points spent on grass in 1-1. No animal, no 💡, no card
// affordable: the status says so and offers starting the stage again.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForSelector('.chapter-hud');
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const points=()=>p.evaluate(async()=>(await import('./js/main.js')).gameState.metrics.points);
 assert.equal(await p.locator('.chapter-restart').count(),0,'not offered while an animal can be bought');
 for(const x of [.2,.65,.8,.12]){await p.locator('.organism-card[data-species-id="grass"]').click();await tapBackground(p,x,.45);await p.waitForTimeout(300);}
 assert.ok(await points()<4,'no points left for a grasshopper');
 await p.waitForSelector('.chapter-restart',{timeout:3000});
 assert.match(await p.locator('.chapter-status').textContent(),/처음부터/);
 await p.locator('.chapter-restart').click();
 await p.locator('dialog[open] button',{hasText:'처음부터 하기'}).click();
 await p.waitForFunction(async()=>(await import('./js/main.js')).gameState.metrics.points===12);
 await p.waitForSelector('.chapter-restart',{state:'detached',timeout:3000});
 assert.deepEqual(errors,[]);await b.close();console.log('PASS stuck stage offers a restart');
})().catch(e=>{console.error(e.message);process.exit(1);});
