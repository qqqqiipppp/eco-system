// 2-5: a frog egg grows in the pond, shown as egg → tadpole → froglet with its
// name, and then a young frog comes out at the pond's edge.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2','1-3','2-1','2-2','2-3','2-4']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 assert.match(await p.locator('.chapter-title h2').textContent(),/^2-5 연못의 개구리알/);
 assert.ok(await p.locator('.pond-nursery').isHidden(),'nothing in the pond yet');
 const seen=[];
 for(const left of [55,30,5]){
  await p.evaluate(async left=>{const g=(await import('./js/main.js')).gameState,f=g.organisms.find(o=>o.speciesId==='frog');g.chapter.breeding.frog={healthy:0,pending:{remaining:left,total:60,parentId:f.instanceId,position:{x:.21,y:.72}}};},left);
  await p.waitForFunction(n=>document.querySelector('.pond-nursery span')?.textContent&&!document.querySelector('.pond-nursery').hidden,null);await p.waitForTimeout(300);
  seen.push([await p.locator('.pond-nursery span').textContent(),(await p.locator('.pond-nursery img').getAttribute('src')).split('/').pop()]);
 }
 assert.deepEqual(seen,[['개구리알','egg.svg'],['올챙이','tadpole.svg'],['꼬리 달린 새끼 개구리','froglet.svg']]);
 await p.evaluate(async()=>{(await import('./js/main.js')).gameState.chapter.breeding.frog.pending.remaining=.1;});
 await p.waitForFunction(async()=>(await import('./js/main.js')).gameState.chapter.births.some(x=>x.speciesId==='frog'));
 await p.waitForSelector('.pond-nursery',{state:'hidden'});
 assert.deepEqual(errors,[]);await b.close();console.log('PASS frog life in the pond');
})().catch(e=>{console.error(e.message);process.exit(1);});
