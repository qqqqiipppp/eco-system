// Playtest: "개구리가 방아깨비 먹긴 해?" A hunt is rare next to grazing, so
// chapter mode says it in the message line and always offers its 💡.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3','2-1']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.waitForFunction(()=>/참개구리가 방아깨비를 먹었어요/.test(document.querySelector('#placement-feedback')?.textContent||''),null,{timeout:40000});
 const offers=await p.evaluate(async()=>(await import('./js/main.js')).gameState.chapter.offers.map(o=>o.relationId));
 assert.ok(offers.includes('v2_grasshopper_to_frog'),'the hunt has its 💡');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS hunt is shown');
})().catch(e=>{console.error(e.message);process.exit(1);});
