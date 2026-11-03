// Playtest: after the litter was all picked up the soil was still bad, and the
// status line still said "쓰레기를 눌러 치워요" with nothing left to tap. It
// now says the litter is gone and points to the care button.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3','2-1','2-2','2-3','2-4','2-5']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const status=()=>p.locator('.chapter-status').textContent();
 // Litter lying in the forest: tap it.
 await p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;g.environment.soil.value=.2;g.chapter.trash.push({trashId:'trash-x',kind:'soil-damage',x:.4,y:.74,piece:'bag',at:g.simulationTime});});
 await p.waitForFunction(()=>/쓰레기를 눌러/.test(document.querySelector('.chapter-status').textContent));
 // All picked up, soil still bad: no litter to tap, use the care button.
 await p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;g.chapter.trash=[];g.environment.soil.value=.2;});
 await p.waitForFunction(()=>!/쓰레기를 눌러/.test(document.querySelector('.chapter-status').textContent));
 assert.match(await status(),/쓰레기는 다 치웠어요.*숲 바닥 되살리기/);
 assert.deepEqual(errors,[]);await b.close();console.log('PASS litter gone, care named');
})().catch(e=>{console.error(e.message);process.exit(1);});
