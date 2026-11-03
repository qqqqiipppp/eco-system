// Playtest: litter is the piece itself (black bag, bottle, can), not a
// "🥤 쓰레기" label; a piece left too long shows "치워 주세요!". Its harm to the
// soil is unchanged (tests/chapter-stage.test.mjs).
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3','2-1','2-2','2-3','2-4','2-5']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState,t=g.simulationTime;
  g.chapter.trash.push({trashId:'trash-a',kind:'soil-damage',x:.3,y:.74,piece:'bag',at:t},{trashId:'trash-b',kind:'soil-damage',x:.5,y:.74,piece:'bottle',at:t-30},{trashId:'trash-c',kind:'soil-damage',x:.7,y:.74,piece:'can',at:t});});
 await p.waitForSelector('.chapter-trash[data-tap-id="trash-c"]');
 const pieces=await p.$$eval('.chapter-trash',l=>l.map(e=>({id:e.dataset.tapId,img:e.querySelector('img')?.getAttribute('src'),text:e.textContent.trim(),w:e.querySelector('img')?.getBoundingClientRect().width,old:e.classList.contains('is-old'),label:e.getAttribute('aria-label')})));
 assert.deepEqual(pieces.map(x=>x.img.split('/').pop()),['bag.webp','bottle.webp','can.webp']);
 assert.ok(pieces.every(x=>x.text===''&&x.w<=36&&x.label==='쓰레기 치우기'),'the piece alone, small, still named for screen readers');
 assert.deepEqual(pieces.map(x=>x.old),[false,true,false],'only the piece left long asks for help');
 await p.locator('.chapter-trash[data-tap-id="trash-b"]').tap();
 await p.waitForSelector('.chapter-trash[data-tap-id="trash-b"]',{state:'detached'});
 assert.deepEqual(errors,[]);await b.close();console.log('PASS litter pieces');
})().catch(e=>{console.error(e.message);process.exit(1);});
