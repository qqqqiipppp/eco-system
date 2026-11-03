// Playtest: "팽나무 크기가 너무 작은데". Chapter mode shows trees grown, about
// 3x the forest mode's (which keeps its sizes), and keeps them apart.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3','2-1','2-2','2-3']}));});
 await p.reload();await p.waitForSelector('.organism-object[data-species-id="hazel"]',{state:'attached'});
 const height=()=>p.evaluate(id=>parseFloat(document.querySelector(`.organism-object[data-species-id="${id}"]`).style.getPropertyValue('--sprite-height')),'hazel');
 await p.waitForFunction(()=>document.querySelector('.organism-object[data-species-id="hazel"]').style.getPropertyValue('--sprite-height'));
 assert.equal(await height(),208,'a grown 팽나무 in chapter mode');
 const foot=await p.evaluate(()=>{const a=document.querySelector('.organism-object[data-species-id="hazel"]'),img=a.querySelector('img').getBoundingClientRect(),base=a.getBoundingClientRect().top;return (img.bottom-img.height*18/192)-base;});
 assert.ok(Math.abs(foot)<=2,`the tree stands on its foot point (${foot.toFixed(1)} px off)`);
 const tooClose=await p.evaluate(async()=>{const m=await import('./js/main.js'),{placeOrganism}=await import('./js/systems/placement.js');const g=m.gameState,h=g.organisms.find(o=>o.speciesId==='hazel');
  return placeOrganism(g,'hazel',{position:{x:h.position.x+.17,y:h.position.y},isPlayArea:true,isUI:false},{footprints:{},blockedRects:[]}).ok;});
 assert.equal(tooClose,false,'trees keep apart');
 // "다람쥐가 날아다니는 것처럼 보이잖아": a chipmunk keeps to the grown oak's
 // trunk, drawn in front of it, never on a far painted trunk.
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3','2-1','2-2','2-3','2-4','2-5','3-1','3-2']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const oakX=await p.evaluate(async()=>(await import('./js/main.js')).gameState.organisms.find(o=>o.speciesId==='oak').position.x);
 await p.locator('.organism-card[data-species-id="chipmunk"]').click();await tapBackground(p,.6,.45);
 assert.match(await p.locator('#placement-feedback').textContent(),/나무줄기에서 지내요/,'far from a tree: told where it lives');
 await tapBackground(p,oakX+.03,.45);await p.waitForSelector('.organism-object[data-species-id="chipmunk"]',{state:'attached'});await p.waitForTimeout(800);
 const chip=await p.evaluate(()=>{const c=document.querySelector('.organism-object[data-species-id="chipmunk"]'),oak=document.querySelector('.organism-object[data-species-id="oak"]'),r=c.querySelector('img').getBoundingClientRect(),o=oak.querySelector('img').getBoundingClientRect();
  return {anchor:c.dataset.anchorId,front:Number(c.style.zIndex)>Number(oak.style.zIndex),dx:Math.abs((r.left+r.right)/2-(o.left+o.right)/2)/o.width};});
 assert.match(chip.anchor,/^producer:.*oak/);assert.ok(chip.front,'in front of its tree');assert.ok(chip.dx<.2,`on the trunk (${chip.dx.toFixed(2)} of the tree's width off)`);
 const f=await b.newPage({viewport:{width:1280,height:800}});await f.goto(base+'?mode=forest');
 assert.equal(await f.evaluate(async()=>(await import('./data/interaction-config.js')).speciesProfiles.hazel.height),60,'forest mode keeps its sizes');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS grown trees');
})().catch(e=>{console.error(e.message);process.exit(1);});
