// The forest's "나의 먹이그물" follows the river's rule: each chapter its own web;
// when the last one is finished they join into the whole forest's web, which
// opens by itself and stays a tap away afterwards.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};

// Cards on the board must not cover each other (a sliver of shadow is fine).
const overlaps=p=>p.$$eval('dialog[open] .web-node',l=>{const r=l.map(e=>e.getBoundingClientRect()),bad=[];
 for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const w=Math.min(r[i].right,r[j].right)-Math.max(r[i].left,r[j].left),h=Math.min(r[i].bottom,r[j].bottom)-Math.max(r[i].top,r[j].top);
  if(w>4&&h>4)bad.push(l[i].textContent+' / '+l[j].textContent);}return bad;});
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1138,height:712}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);
 // At the last stage, every web done but the last step of the last one.
 await p.evaluate(async()=>{localStorage.clear();localStorage.setItem('eco-system:theme','forest');
  const {stages}=await import('./data/chapters.js');
  const {webNodes,webRelations}=await import('./js/systems/food-web-builder.js'),{organismById}=await import('./data/organisms.js');
  const nodes=[1,2,3,4].flatMap(webNodes);
  localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:stages.map(s=>s.stageId).slice(0,-1),observed:[],system:[1,2,3],
   drawn:[...new Set([1,2,3,4].flatMap(n=>webRelations(webNodes(n)).map(r=>r.relationId)))],roles:Object.fromEntries(nodes.map(id=>[id,organismById[id].role]))}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.locator('.chapter-menu-button').click();await p.locator('#chapter-menu button',{hasText:'나의 먹이그물'}).click();
 await p.waitForSelector('.chapter-web-dialog[open] .web-node');
 assert.equal(await p.locator('.chapter-web-dialog .web-node').count(),12,'the deep forest web: only what lives there');
 assert.equal(await p.locator('.chapter-web-dialog .web-whole-open').count(),0,'the whole forest waits for the last web');
 // The last step: every creature is touched when the water turns bad.
 for(const node of await p.locator('.chapter-web-dialog .web-node').all())await node.click();
 await p.locator('.chapter-web-dialog .web-check').click();
 await p.locator('.chapter-web-dialog button',{hasText:'완성!'}).click();
 // The whole forest opens by itself.
 await p.waitForSelector('.chapter-web-dialog[open] .web-board.whole');
 assert.match(await p.locator('.chapter-web-dialog h2').textContent(),/숲 전체 먹이그물/);
 const whole=await p.evaluate(async()=>{const {wholeWeb,webRelations}=await import('./js/systems/food-web-builder.js'),ids=Object.keys(wholeWeb());return {nodes:ids.length,arrows:webRelations(ids).length};});
 assert.equal(await p.locator('.chapter-web-dialog .web-node').count(),whole.nodes,'every forest creature, once');
 assert.equal(await p.locator('.chapter-web-dialog .web-arrow').count(),whole.arrows,'every food arrow, across the parts too');
 assert.deepEqual(await p.$$eval('.chapter-web-dialog .web-part',l=>l.map(e=>e.textContent)),['풀밭','물가','나무 아래','큰 숲']);
 await p.screenshot({path:(process.env.OUT||'/tmp')+'/forest-whole-web.png'});
 assert.deepEqual(await overlaps(p),[],'the whole web\'s cards stand apart');
 await p.screenshot({path:(process.env.OUT||'/tmp')+'/forest-whole-web.png'});
 // Afterwards it stays a tap away from any forest web.
 await p.locator('.chapter-web-dialog .web-close').click();
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.locator('.chapter-menu-button').click();await p.locator('#chapter-menu button',{hasText:'나의 먹이그물'}).click();
 await p.locator('.chapter-web-dialog .web-whole-open').click();
 await p.waitForSelector('.chapter-web-dialog[open] .web-board.whole');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS forest webs');
})().catch(e=>{console.error(e.message);process.exit(1);});
