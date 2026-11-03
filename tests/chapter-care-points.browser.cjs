// Care for air or soil costs points. Short of them, the button still answers:
// it flashes red and says points are short, instead of doing nothing.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3','2-1','2-2','2-3','2-4','2-5','3-1','3-2','3-3','3-4']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 assert.match(await p.locator('.chapter-title h2').textContent(),/^4-1/);
 await p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;g.environment.air.value=.2;g.metrics.points=0;});
 const button=p.locator('.chapter-care button').first();await button.waitFor();
 assert.equal(await button.getAttribute('aria-disabled'),'true');
 // aria-disabled, not disabled: a real tap still reaches it.
 await button.click({force:true});
 assert.ok(await button.evaluate(b=>b.classList.contains('is-short')),'the button flashes');
 await p.waitForFunction(()=>/포인트가 부족해서 할 수 없어요/.test(document.querySelector('#placement-feedback')?.textContent||''));
 assert.ok(await p.evaluate(async()=>(await import('./js/main.js')).gameState.environment.air.value<.25),'nothing was done');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS care short of points');
})().catch(e=>{console.error(e.message);process.exit(1);});
