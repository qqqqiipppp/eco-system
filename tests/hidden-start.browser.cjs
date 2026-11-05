// The game can start while its forest has no size yet (a hidden or not yet
// laid-out window): it waits to draw the organisms until the forest has a size.
const assert=require('node:assert/strict');
const {asForestStudent}=require('./ux-browser-helpers.cjs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=asForestStudent(await chromium.launch(launch)),p=await b.newPage({viewport:{width:1280,height:650}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 // The forest has no width when the game starts, as in a hidden window
 // (the resize observer watches the forest, as it watches the window).
 await p.addInitScript(()=>document.addEventListener('readystatechange',()=>{if(document.readyState!=='interactive')return;const s=document.createElement('style');s.id='no-size';s.textContent='.forest{width:0!important;min-width:0!important;flex:none!important}';document.head.append(s);}));
 await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForSelector('.chapter-hud');
 assert.equal(await p.locator('.chapter-hud').count(),1,'the chapter starts');
 assert.deepEqual(errors,[],'no error while the forest has no size');
 // Then the window shows: the organisms are drawn and the game goes on.
 await p.evaluate(()=>document.querySelector('#no-size').remove());
 await p.waitForFunction(()=>[...document.querySelectorAll('.organism-object')].some(a=>a.querySelector('img.organism-art').getBoundingClientRect().width>0&&a.style.getPropertyValue('--sprite-width')));
 const drawn=await p.evaluate(async()=>({organisms:(await import('./js/main.js')).gameState.organisms.length,drawn:document.querySelectorAll('.organism-object').length,sized:[...document.querySelectorAll('.organism-object')].every(a=>parseFloat(a.style.getPropertyValue('--sprite-width'))>0)}));
 assert.equal(drawn.drawn,drawn.organisms,'every organism is drawn');assert.ok(drawn.sized,'with its size');
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const t0=await p.evaluate(async()=>(await import('./js/main.js')).gameState.simulationTime);await p.waitForTimeout(2500);
 assert.ok(await p.evaluate(async()=>(await import('./js/main.js')).gameState.simulationTime)>t0,'the forest runs');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS hidden start');
})().catch(e=>{console.error(e);process.exit(1);});
