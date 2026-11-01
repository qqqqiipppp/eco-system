// Home screen install opens the game full screen; in a Chrome tab the menu's
// "전체 화면" hides the address bar.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:650},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.waitForSelector('.chapter-hud');
 // The manifest: Korean name, full screen, landscape, start at the chapter game, icons that load.
 const manifest=await p.evaluate(async()=>{const link=document.querySelector('link[rel=manifest]');const m=await (await fetch(link.href)).json();
  const icons=await Promise.all(m.icons.map(i=>new Promise(done=>{const img=new Image();img.onload=()=>done({...i,w:img.naturalWidth,h:img.naturalHeight});img.onerror=()=>done({...i,w:0});img.src=new URL(i.src,link.href);})));
  return {...m,icons,start:new URL(m.start_url,link.href).href};});
 assert.equal(manifest.name,'작은 숲 연구소');assert.equal(manifest.display,'fullscreen');assert.equal(manifest.orientation,'landscape');
 assert.equal(manifest.start,base,'opens the chapter game');
 for(const i of manifest.icons)assert.equal(`${i.w}x${i.h}`,i.sizes,i.src+' loads at its size');
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'&&i.sizes==='512x512')&&manifest.icons.some(i=>i.sizes==='192x192'&&!i.purpose));
 // In a tab: the menu button goes full screen and back.
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.locator('.chapter-menu-button').click();
 const button=p.locator('.chapter-menu button',{hasText:/^전체 화면$/});assert.equal(await button.count(),1);
 await button.click();await p.waitForFunction(()=>Boolean(document.fullscreenElement));
 await p.locator('.chapter-menu-button').click();await p.locator('.chapter-menu button',{hasText:'전체 화면 끝내기'}).click();
 await p.waitForFunction(()=>!document.fullscreenElement);
 // Opened from the home screen (already full screen): no button.
 const app=await b.newPage();await app.addInitScript(()=>{const real=matchMedia.bind(window);window.matchMedia=q=>q==='(display-mode: fullscreen)'?{matches:true,media:q,addEventListener(){},removeEventListener(){}}:real(q);});
 await app.goto(base);await app.waitForSelector('.chapter-hud');
 assert.equal(await app.locator('.chapter-menu button',{hasText:'전체 화면'}).count(),0);
 assert.deepEqual(errors,[]);await b.close();console.log('PASS fullscreen');
})().catch(e=>{console.error(e);process.exit(1);});
