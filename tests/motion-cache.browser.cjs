// Swapping motion frames must not hit the network: with GitHub Pages caching
// (10 min, ETag), each frame is fetched once at the start and play adds no
// requests. A local python server sends no cache headers, so this test runs
// its own server that caches like Pages.
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const root=path.resolve(__dirname,'..'),hits={};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://x').pathname,file=path.join(root,u.endsWith('/')?u+'index.html':u);
 fs.readFile(file,(e,body)=>{if(e){res.writeHead(404);return res.end();}const etag='"'+crypto.createHash('md5').update(body).digest('hex')+'"',name=path.basename(u);
  if(/-(eat|move|sense)-\d+\.webp$/.test(name))hits[name]=(hits[name]||0)+1;
  if(req.headers['if-none-match']===etag){res.writeHead(304,{etag,'cache-control':'max-age=600'});return res.end();}
  res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'max-age=600',etag});res.end(body);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:650},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 // Stage 3-4: the bulbul and grasshoppers move and eat on painted frames.
 await p.goto(base);await p.evaluate(async()=>{const {stages}=await import('./data/chapters.js');const ids=stages.map(s=>s.stageId);localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:ids.slice(0,ids.indexOf('3-4'))}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.waitForTimeout(3000);const atStart={...hits};
 const painted=await p.evaluate(()=>new Promise(done=>{let n=0;const t0=performance.now();(function tick(){n+=document.querySelectorAll('img.organism-art[src*="-eat-"],img.organism-art[src*="-move-"]').length;if(performance.now()-t0<20000)requestAnimationFrame(tick);else done(n);})();}));
 assert.ok(painted>100,'painted frames were on screen');
 assert.ok(Object.values(atStart).every(n=>n===1),'each frame fetched once at the start');
 assert.deepEqual(hits,atStart,'no frame fetched during 20 s of play');
 assert.deepEqual(errors,[]);await b.close();server.close();
 console.log(`PASS motion cache (${Object.keys(atStart).length} frames fetched once, ${painted} painted frame samples in play)`);
})().catch(e=>{console.error(e);server.close();process.exit(1);});
