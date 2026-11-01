// Stand-in art goes in through the import tool, and the real game uses it at
// once: frogs hop and a weasel bounds on 4 frames, a bulbul lifts off flapping and lands to eat, a
// grasshopper nymph shows its own picture, and painted states drop the CSS hint.
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const root=path.resolve(__dirname,'..'),site=fs.mkdtempSync(path.join(os.tmpdir(),'motion-site-')),art=path.join(site,'..',path.basename(site)+'-art');
fs.cpSync(root,site,{recursive:true,filter:s=>!['.git','tests','node_modules','_site'].includes(path.relative(root,s).split(path.sep)[0])});
execFileSync('python3',[path.join(root,'tests/fixtures/make_motion_art.py'),path.join(root,'assets/images/species-raster'),art]);
execFileSync('python3',[path.join(root,'tools/build_species_raster.py'),'--import',art,path.join(site,'assets/images/species-raster'),path.join(site,'js/ui/species-frames.js')]);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const file=path.join(site,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
 fs.readFile(file,(e,body)=>{if(e){res.writeHead(404);return res.end();}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});res.end(body);});});
async function open(b,stageId){
 const p=await b.newPage({viewport:{width:1280,height:650},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.errors=errors;
 await p.goto(base);await p.evaluate(async id=>{const {stages}=await import('./data/chapters.js');const ids=stages.map(s=>s.stageId);
  localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:ids.slice(0,ids.indexOf(id))}));},stageId);
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 return p;
}
// Every frame for a few seconds: picture, state, lift and whether a CSS animation runs on it.
const watch=(p,species,ms)=>p.evaluate(({species,ms})=>new Promise(done=>{const out=[],t0=performance.now();(function tick(){
 for(const a of document.querySelectorAll(`.organism-object[data-species-id="${species}"]`)){const img=a.querySelector('img.organism-art'),s=getComputedStyle(img);
  out.push({id:a.dataset.instanceId,src:img.getAttribute('src').split('/').pop(),state:a.dataset.visualState,lift:parseFloat(s.getPropertyValue('--hop-lift'))||0,anim:s.animationName});}
 if(performance.now()-t0<ms)requestAnimationFrame(tick);else done(out);})();}),{species,ms});
let base;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
 const b=await chromium.launch(launch),report=[];
 // Frogs hop: frames 0→1→2→3→0, off the ground in the air.
 let p=await open(b,'4-1');
 const frogs=await watch(p,'frog',9000),hops=frogs.filter(s=>/^frog-move-\d/.test(s.src));
 assert.ok(hops.length>20,'frogs hop '+JSON.stringify([...new Set(frogs.map(s=>s.src+'/'+s.state))]));
 for(const f of [0,1,2,3])assert.ok(hops.some(s=>s.src===`frog-move-${f}.webp`),'frame '+f);
 assert.ok(Math.max(...hops.map(s=>s.lift))>=.3,'a real rise');assert.ok(hops.filter(s=>s.src==='frog-move-0.webp').every(s=>s.lift===0),'crouch on the ground');
 assert.ok(hops.every(s=>s.anim==='none'),'painted hop: no CSS hint');
 report.push(`frog: ${hops.length} hop samples, top ${Math.max(...hops.map(s=>s.lift)).toFixed(2)} of its height`);
 // A grasshopper nymph shows its own painted picture.
 await p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;g.organisms.find(o=>o.speciesId==='grasshopper').development.stage='nymph';});
 const nymph=await watch(p,'grasshopper',1200);
 assert.ok(nymph.some(s=>/^grasshopper-nymph(-eat-\d)?\.webp$/.test(s.src)),'nymph picture: '+[...new Set(nymph.map(s=>s.src))]);
 assert.deepEqual(p.errors,[]);await p.close();
 // A weasel bounds: the same four frames, one low quick bound after another.
 p=await open(b,'4-2');
 await p.locator('.organism-card[data-species-id="weasel"]').click();await tapBackground(p,.5,.4);await p.waitForTimeout(300);
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const weasel=await watch(p,'weasel',9000),bounds=weasel.filter(s=>/^weasel-move-\d/.test(s.src));
 assert.ok(bounds.length>20,'the weasel bounds: '+[...new Set(weasel.map(s=>s.src+'/'+s.state))]);
 for(const f of [0,1,2,3])assert.ok(bounds.some(s=>s.src===`weasel-move-${f}.webp`),'frame '+f);
 const top=Math.max(...bounds.map(s=>s.lift));assert.ok(top>=.1&&top<=.17,'low bound: '+top);
 report.push(`weasel: ${bounds.length} bound samples, top ${top.toFixed(2)} of its height`);
 assert.deepEqual(p.errors,[]);await p.close();
 // A bulbul flies: wing frames while moving, up off the ground; it settles to eat on painted eat frames.
 p=await open(b,'3-4');
 const birds=await watch(p,'bulbul',12000),flying=birds.filter(s=>/^bulbul-move-\d/.test(s.src)),eating=birds.filter(s=>/^bulbul-eat-\d/.test(s.src));
 assert.ok(flying.length>10,'the bulbul flies');assert.equal(new Set(flying.map(s=>s.src)).size,4,'four wing frames');assert.equal(new Set(eating.map(s=>s.src)).size,3,'three eating frames');
 assert.ok(Math.max(...flying.map(s=>s.lift))>.2,'up off the ground');
 assert.ok(eating.length>0&&eating.every(s=>s.lift<.05),'eats on the ground');
 assert.ok([...flying,...eating].every(s=>s.anim==='none'),'painted states: no CSS hint');
 report.push(`bulbul: ${flying.length} flying, ${eating.length} eating samples, top ${Math.max(...flying.map(s=>s.lift)).toFixed(2)}`);
 // Not painted yet: still the base picture with its CSS hint.
 const others=await watch(p,'grasshopper',1500);assert.ok(others.some(s=>s.src==='grasshopper.webp'||/grasshopper-move/.test(s.src)));
 assert.deepEqual(p.errors,[]);await b.close();server.close();
 fs.rmSync(site,{recursive:true,force:true});fs.rmSync(art,{recursive:true,force:true});
 console.log('PASS motion ready\n '+report.join('\n '));
})().catch(e=>{console.error(e);server.close();process.exit(1);});
