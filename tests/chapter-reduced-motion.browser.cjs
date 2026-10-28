// A tablet in power-saving mode asks for reduced motion. Chapter mode must keep
// its clock (stars, crisis countdowns, breeding); only decorative motion stops.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),c=await b.newContext({viewport:{width:1280,height:712},reducedMotion:'reduce'}),p=await c.newPage();
 await p.goto(base);await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const time=()=>p.evaluate(async()=>(await import('./js/main.js')).gameState.simulationTime);
 const t0=await time();await p.waitForTimeout(2500);assert((await time())-t0>=1.5,'the chapter clock runs with reduced motion');
 await p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;g.chapter.warning={kind:'cloudy',startsAt:g.simulationTime+3};});
 await p.waitForFunction(()=>document.querySelector('.chapter-warning')?.hidden===true||document.querySelector('dialog[open]'),null,{timeout:8000});
 await b.close();console.log('PASS chapter reduced motion');
})().catch(e=>{console.error(e);process.exit(1);});
