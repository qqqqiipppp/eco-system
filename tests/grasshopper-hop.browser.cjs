// Adult grasshopper hops: crouch (move-0), push and fly (move-1) with a real
// rise above the ground, land on the same ground line, then rest. View-only:
// the model position, the name and the touch target stay on the ground.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:620},hasTouch:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.waitForSelector('.chapter-hud');
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,.45,.4);await p.waitForTimeout(300);
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 // Sample every animation frame for a few seconds.
 const samples=await p.evaluate(()=>new Promise(done=>{const out=[],t0=performance.now();(function tick(){
  const a=document.querySelector('.organism-object[data-species-id="grasshopper"]');
  if(a){const img=a.querySelector('img.organism-art'),hit=a.querySelector('.organism-hit').getBoundingClientRect(),r=img.getBoundingClientRect(),s=getComputedStyle(img);
   out.push({t:performance.now()-t0,src:img.getAttribute('src').split('/').pop(),state:a.dataset.visualState,lift:parseFloat(s.getPropertyValue('--hop-lift'))||0,bottom:r.bottom,anchorY:a.getBoundingClientRect().bottom,height:r.height,hitTop:hit.top,hopX:parseFloat(s.getPropertyValue('--hop-x'))||0});}
  if(performance.now()-t0<6000)requestAnimationFrame(tick);else done(out);})();}));
 const moving=samples.filter(s=>s.state==='move');
 assert.ok(moving.length>20,'the grasshopper moves during the sample');
 const air=moving.filter(s=>s.src==='grasshopper-move-1.webp'),ground=moving.filter(s=>s.src==='grasshopper-move-0.webp');
 assert.ok(air.length&&ground.length,'both hop frames are shown');
 const peak=Math.max(...air.map(s=>s.lift));
 assert.ok(peak>=.3,'the body rises well above the ground: '+peak);
 assert.ok(ground.every(s=>s.lift===0),'the crouch and the landing sit on the ground');
 assert.ok(air.filter(s=>s.lift>0).length>=air.length*.6,'the push frame is the frame in the air');
 const rise=Math.max(...samples.map(s=>s.anchorY-s.bottom)),px=peak*samples[0].height;
 assert.ok(rise>=10||px>=10,'at least about 10px of visible rise: '+rise.toFixed(1));
 assert.ok(samples.every(s=>Math.abs(s.hopX)<=60),'the view-only catch-up stays small');
 assert.ok(new Set(samples.map(s=>Math.round(s.hitTop))).size<=new Set(samples.map(s=>Math.round(s.anchorY))).size+1,'the touch target follows the model, not the hop');
 // Inspect while it hops: the tap still reaches this individual.
 await p.locator('.organism-object[data-species-id="grasshopper"] .organism-hit').click();
 assert.equal(await p.locator('#population-dialog[open]').count(),1,'tapping a hopping grasshopper opens it');
 assert.deepEqual(errors,[]);
 if(process.env.SAMPLES)require('node:fs').writeFileSync(process.env.SAMPLES,JSON.stringify(samples));
 await b.close();console.log('PASS grasshopper hop (peak lift',peak.toFixed(2),'of sprite height,',(peak*samples[0].height).toFixed(1),'px)');
})().catch(e=>{console.error(e);process.exit(1);});
