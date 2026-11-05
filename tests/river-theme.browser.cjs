// The river (강) is open to every student from "생태계 바꾸기". It shows the pond
// picture, only river cards, says 강 where the forest says 숲, and a tapped card
// lands in that organism's own living space (a medaka in the water).
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const menu=async(p,text)=>{await p.locator('.chapter-menu-button').click();await p.locator('#chapter-menu button',{hasText:text}).click();};
const closeDialogs=p=>p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1138,height:712}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:theme','forest');});
 await p.reload();await p.waitForSelector('.chapter-hud');await closeDialogs(p);
 await menu(p,'탐험 지도');await p.locator('.chapter-map-dialog button',{hasText:'생태계 바꾸기'}).click();await p.waitForSelector('.chapter-theme-dialog[open]');
 const river=p.locator('.theme-card',{hasText:'강'});
 assert.equal(await river.isDisabled(),false,'every student can choose the river');assert.doesNotMatch(await river.textContent(),/준비 중|관리자/);
 await Promise.all([p.waitForEvent('load'),river.click()]);
 await p.waitForSelector('.chapter-hud');
 assert.equal(await p.evaluate(()=>localStorage.getItem('eco-system:theme')),'river');
 assert.match(await p.locator('.forest-art').getAttribute('src'),/river-pond/);
 assert.match(await p.locator('.chapter-hud').textContent(),/연못·습지/);
 await closeDialogs(p);
 const cards=await p.$$eval('.organism-card',l=>l.map(c=>c.dataset.speciesId));
 const riverIds=await p.evaluate(async()=>(await import('./data/river.js')).riverSpecies.filter(s=>!s.invader).map(s=>s.id));
 assert.deepEqual([...cards].sort(),[...riverIds].sort(),'only river cards (no forest species, no invaders)');
 assert.equal(await p.locator('.soil-label').isVisible(),false,'no forest soil label');
 const box=await p.locator('.forest').boundingBox();
 await p.locator('.organism-card[data-species-id="medaka"]').click();
 await p.mouse.click(box.x+box.width*.4,box.y+box.height*.3);
 const medaka=await p.evaluate(async()=>(await import('./js/main.js')).gameState.organisms.find(o=>o.speciesId==='medaka')?.position);
 assert.ok(medaka&&medaka.y>=.56&&medaka.y<=.88,`a medaka swims in the water: ${JSON.stringify(medaka)}`);
 // The river says 강, not 숲: on the screen, in the scene's labels and in an organism's window.
 const noForest=async where=>{const text=await p.evaluate(()=>document.body.innerText+' '+[...document.querySelectorAll('[aria-label]')].filter(e=>e.getClientRects().length).map(e=>e.getAttribute('aria-label')).join(' '));assert.doesNotMatch(text,/숲/,`${where}: ${(text.match(/.{0,20}숲.{0,20}/)||[''])[0]}`);};
 await noForest('the screen');
 await p.locator('.organism-card[data-species-id="daphnia"]').click();await noForest('placing a card');await p.locator('.placing-band button').click();
 await p.locator('.organism-hit').first().click();await p.waitForSelector('#population-dialog[open]');await noForest('an organism window');
 await p.locator('#population-close').click();
 // The choice stays after a reload.
 await p.reload();await p.waitForSelector('.chapter-hud');
 assert.match(await p.locator('.forest-art').getAttribute('src'),/river-pond/);
 assert.deepEqual(errors,[]);await b.close();console.log('PASS river theme preview');
})().catch(e=>{console.error(e.message);process.exit(1);});
