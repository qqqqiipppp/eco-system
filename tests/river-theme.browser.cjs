// The river (강) is still being made: 관리자 모드 can already open it from
// "생태계 바꾸기". It shows the pond picture, only river cards, and a tapped
// card lands in that organism's own living space (a medaka in the water).
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const menu=async(p,text)=>{await p.locator('.chapter-menu-button').click();await p.locator('#chapter-menu button',{hasText:text}).click();};
const closeDialogs=p=>p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1138,height:712}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:admin','on');});
 await p.reload();await p.waitForSelector('.chapter-hud');await closeDialogs(p);
 await menu(p,'생태계 바꾸기');await p.waitForSelector('.chapter-theme-dialog[open]');
 const river=p.locator('.theme-card',{hasText:'강'});
 assert.equal(await river.isDisabled(),false,'관리자 모드 can try the river');assert.match(await river.textContent(),/관리자 모드/);
 await Promise.all([p.waitForEvent('load'),river.click()]);
 await p.waitForSelector('.chapter-hud');
 assert.equal(await p.evaluate(()=>localStorage.getItem('eco-system:theme')),'river');
 assert.match(await p.locator('.forest-art').getAttribute('src'),/river-pond/);
 assert.match(await p.locator('.chapter-hud').textContent(),/연못·습지/);
 await closeDialogs(p);
 assert.deepEqual(await p.$$eval('.organism-card',l=>l.map(c=>c.dataset.speciesId)).then(ids=>ids.sort()),['algae','daphnia','duckweed','medaka','pond-snail','water-lily','water-strider'],'only river cards');
 assert.equal(await p.locator('.soil-label').isVisible(),false,'no forest soil label');
 const box=await p.locator('.forest').boundingBox();
 await p.locator('.organism-card[data-species-id="medaka"]').click();
 await p.mouse.click(box.x+box.width*.4,box.y+box.height*.3);
 const medaka=await p.evaluate(async()=>(await import('./js/main.js')).gameState.organisms.find(o=>o.speciesId==='medaka')?.position);
 assert.ok(medaka&&medaka.y>=.56&&medaka.y<=.88,`a medaka swims in the water: ${JSON.stringify(medaka)}`);
 // Turning 관리자 모드 off goes back to the forest, which is ready.
 await p.evaluate(()=>localStorage.removeItem('eco-system:admin'));await p.reload();await p.waitForSelector('.chapter-hud');
 assert.match(await p.locator('.forest-art').getAttribute('src'),/forest-b/);
 assert.deepEqual(errors,[]);await b.close();console.log('PASS river theme preview');
})().catch(e=>{console.error(e.message);process.exit(1);});
