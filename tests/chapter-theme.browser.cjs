// 생태계 연구소: the game's new name, and "생태계 바꾸기" in the menu with one
// card per ecosystem. The river is shown as coming soon until it is ready.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const menu=async(p,text)=>{await p.locator('.chapter-menu-button').click();await p.locator('#chapter-menu button',{hasText:text}).click();};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');
 assert.match(await p.title(),/^생태계 연구소/);assert.match(await p.locator('.brand h1').textContent(),/생태계 연구소/);
 // With one ready ecosystem nothing is asked at the start.
 assert.equal(await p.locator('.chapter-theme-dialog[open]').count(),0);
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await menu(p,'생태계 바꾸기');await p.waitForSelector('.chapter-theme-dialog[open]');
 const cards=await p.$$eval('.theme-card',l=>l.map(c=>({name:c.querySelector('strong').textContent,disabled:c.disabled,current:c.classList.contains('current'),note:c.querySelector('.theme-note').textContent})));
 assert.deepEqual(cards.map(c=>c.name),['숲','강']);
 assert.ok(cards[0].current&&!cards[0].disabled,'exploring the forest');
 assert.ok(cards[1].disabled&&/준비 중/.test(cards[1].note),'the river is coming soon');
 await p.locator('.theme-card',{hasText:'숲'}).click();
 assert.equal(await p.evaluate(()=>localStorage.getItem('eco-system:theme')),'forest');
 assert.equal(await p.locator('.chapter-theme-dialog[open]').count(),0);
 await menu(p,'탐험 지도');assert.match(await p.locator('.chapter-map-dialog h2').textContent(),/^숲 탐험 지도/);
 assert.equal(await p.locator('.map-stone.done').count(),1,'the forest progress is still there');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS ecosystem choice');
})().catch(e=>{console.error(e.message);process.exit(1);});
