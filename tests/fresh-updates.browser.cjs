// After a deploy, a tablet must run the new files, never a mix of new and the
// old ones it still holds. The server here caches like GitHub Pages (10 min).
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const root=path.resolve(__dirname,'..'),site=fs.mkdtempSync(path.join(os.tmpdir(),'pages-'));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const file=path.join(site,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
 fs.readFile(file,(e,body)=>{if(e){res.writeHead(404);return res.end();}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'max-age=600'});res.end(body);});});
// One "deploy": the site as GitHub Actions would publish it, with a marker in
// one module and in the page so a mix shows.
async function deploy(version,{stamp=true}={}){
 const {build}=await import(path.join(root,'tools/stamp_version.mjs'));
 if(stamp)build(root,site,version);else{fs.rmSync(site,{recursive:true,force:true});fs.cpSync(root,site,{recursive:true,filter:s=>!['.git','tests','node_modules','_site'].includes(path.relative(root,s).split(path.sep)[0])});}
 fs.appendFileSync(path.join(site,'js/ui/error-log.js'),`\nglobalThis.__moduleVersion='${version}';\n`);
 const index=path.join(site,'index.html');fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace('<head>',`<head><script>window.__pageVersion='${version}'</script>`));
}
const seen=p=>p.evaluate(()=>({page:window.__pageVersion,module:globalThis.__moduleVersion,meta:document.querySelector('meta[name=app-version]')?.content||null}));
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const b=await chromium.launch(launch),report=[];
 // Without versions: the reload after a deploy mixes the new page with old modules.
 {const c=await b.newContext(),p=await c.newPage();
  await deploy('A',{stamp:false});await p.goto(base);await p.waitForSelector('.chapter-hud');
  await deploy('B',{stamp:false});await p.reload();await p.waitForSelector('.chapter-hud');
  const v=await seen(p);report.push(`without versions: page ${v.page}, module ${v.module}`);
  assert.deepEqual([v.page,v.module],['B','A'],'the old way mixes files (the problem being fixed)');await c.close();}
 // With versions: the reload runs only the new files.
 const c=await b.newContext({viewport:{width:1280,height:650},hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await deploy('A');await p.goto(base);await p.waitForSelector('.chapter-hud');
 assert.deepEqual(await seen(p),{page:'A',module:'A',meta:'A'});
 assert.equal(await p.locator('.update-bar').count(),0,'no bar while up to date');
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,.45,.4);await p.waitForTimeout(300);
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.waitForTimeout(5500);
 // Deploy B while the tablet is playing: waking the tablet finds it.
 await deploy('B');
 await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await p.waitForSelector('.update-bar');assert.match(await p.locator('.update-bar').textContent(),/새로 바뀌었어요/);
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.screenshot({path:process.env.SHOT||path.join(os.tmpdir(),'update-bar.png')});
 await p.locator('.update-bar button').click();await p.waitForSelector('.chapter-hud');
 assert.deepEqual(await seen(p),{page:'B',module:'B',meta:'B'},'every file is the new one');
 const old=await p.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/\.(js|css)\?v=A$/.test(n)));
 assert.deepEqual(old,[],'no old file is loaded');
 await p.waitForSelector('.chapter-resume-dialog[open]');report.push('with versions: page B, module B; the forest comes back through 이어서 하기');
 await p.locator('.chapter-resume-dialog button',{hasText:'이어서 하기'}).click();
 assert.equal(await p.evaluate(async()=>{const m=[...document.scripts].find(s=>s.type==='module').src;return (await import(m)).gameState.organisms.filter(o=>o.speciesId==='grasshopper').length;}),1,'the grasshopper is still there');
 assert.equal(await p.locator('.update-bar').count(),0,'no bar after updating');
 assert.deepEqual(errors,[]);await b.close();server.close();fs.rmSync(site,{recursive:true,force:true});
 console.log('PASS fresh updates\n '+report.join('\n '));
})().catch(e=>{console.error(e);server.close();process.exit(1);});
