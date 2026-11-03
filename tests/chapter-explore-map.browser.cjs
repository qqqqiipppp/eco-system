// Teacher ask: students see how far they are and how much is left, and replay
// any cleared stage ("탐험 지도"). A teacher with the number 4828 can start any
// stage (관리자 모드), until it is turned off.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const menu=async(p,text)=>{await p.locator('.chapter-menu-button').click();await p.locator('#chapter-menu button',{hasText:text}).click();};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 // How far, how much is left, per chapter too.
 await menu(p,'탐험 지도');await p.waitForSelector('.chapter-map-dialog[open]');
 assert.match(await p.locator('.map-progress').textContent(),/15개 중 3개.*12개 남았어요/);
 assert.match(await p.locator('.map-area').first().locator('.map-count').textContent(),/3\/3/);
 assert.equal(await p.locator('.map-stone.done').count(),3);assert.equal(await p.locator('.map-stone.current').count(),1);
 // A cleared stage can be played again.
 await p.locator('.map-stone.done').first().click();
 await p.waitForFunction(()=>document.querySelector('.chapter-title h2')?.textContent.startsWith('1-1'));
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 // 관리자 모드: a wrong number does nothing, 4828 opens every stage.
 await menu(p,'관리자 모드');await p.locator('.admin-code').fill('1234');await p.locator('.chapter-dialog[open] button',{hasText:'확인'}).click();
 assert.match(await p.locator('.admin-note').textContent(),/맞지 않아요/);
 await p.locator('.admin-code').fill('4828');await p.locator('.chapter-dialog[open] button',{hasText:'확인'}).click();
 await p.waitForSelector('.chapter-map-dialog[open]');
 assert.equal(await p.locator('.map-stone[disabled]').count(),0,'every stage open');
 assert.match(await p.locator('.chapter-map-dialog h2').textContent(),/관리자/);
 await p.locator('.map-stone[aria-label^="4-3"]').click();
 await p.waitForFunction(()=>document.querySelector('.chapter-title h2')?.textContent.startsWith('4-3'));
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('eco-system:chapter-progress')).cleared),['1-1','1-2','1-3'],'progress untouched');
 // It stays after a reload, until turned off.
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 assert.equal(await p.locator('.admin-badge').count(),1);
 await menu(p,'관리자 모드 끄기');assert.equal(await p.locator('.admin-badge').count(),0);
 await menu(p,'탐험 지도');assert.ok(await p.locator('.map-stone[disabled]').count()>0,'locked again');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS explore map and admin mode');
})().catch(e=>{console.error(e.message);process.exit(1);});
