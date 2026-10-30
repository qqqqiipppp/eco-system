// Adult grasshopper hops in the real game: crouch (move-0), push off (move-1),
// legs drawn in while flying (move-2), legs reaching down (move-3), landing on
// the same ground line. View-only: the model position, the name and the touch
// target stay on the ground. Checked at tablet sizes and at a ~36px sprite.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const views=[['1280x620',{width:1280,height:620}],['1280x712',{width:1280,height:712}],['Tab S5e (1280x650, 2x)',{width:1280,height:650},2],['small 412x915',{width:412,height:915}]];
(async()=>{
 const b=await chromium.launch(launch),report=[];
 for(const [label,viewport,scale] of views){
  const p=await b.newPage({viewport,deviceScaleFactor:scale||1,hasTouch:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);await p.waitForSelector('.chapter-hud');
  await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  for(const x of [.35,.6]){await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,x,.4);await p.waitForTimeout(300);}
  if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
  await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  const samples=await p.evaluate(()=>new Promise(done=>{const out=[],t0=performance.now();(function tick(){
   for(const a of document.querySelectorAll('.organism-object[data-species-id="grasshopper"]')){const img=a.querySelector('img.organism-art'),r=img.getBoundingClientRect(),hit=a.querySelector('.organism-hit').getBoundingClientRect(),s=getComputedStyle(img);
    out.push({id:a.dataset.instanceId,t:performance.now()-t0,frame:(/move-(\d)/.exec(img.getAttribute('src'))||[])[1]??'-',state:a.dataset.visualState,lift:parseFloat(s.getPropertyValue('--hop-lift'))||0,rise:hit.bottom-r.bottom,height:r.height,width:r.width,hopX:parseFloat(s.getPropertyValue('--hop-x'))||0,facing:s.getPropertyValue('--facing')});}
   if(performance.now()-t0<7000)requestAnimationFrame(tick);else done(out);})();}));
  const ids=[...new Set(samples.map(s=>s.id))];assert.equal(ids.length,2,label+': two grasshoppers');
  let hopsSeen=0;
  for(const id of ids){
   const mine=samples.filter(s=>s.id===id),seq=mine.map(s=>s.frame).filter((f,i,a)=>f!==a[i-1]);
   const moving=mine.filter(s=>s.state==='move');if(moving.length<20)continue;hopsSeen++;
   for(const f of ['0','1','2','3'])assert.ok(seq.includes(f),`${label}: frame move-${f} shows`);
   // Every switch follows the hop order (or ends a hop / starts from idle).
   const allowed=new Set(['-0','0-1','1-2','2-3','3-0','0--','3--','2--','1--','--1','--0']);
   for(let i=1;i<seq.length;i++)assert.ok(allowed.has(seq[i-1]+'-'+seq[i]),`${label}: frame order ${seq[i-1]}→${seq[i]}`);
   assert.ok(moving.filter(s=>s.frame==='0').every(s=>s.lift===0),`${label}: crouch and rest on the ground`);
   assert.ok(Math.max(...moving.map(s=>s.lift))>=.3,`${label}: a real rise`);
   assert.ok(Math.abs(Math.max(...mine.map(s=>s.hopX)))<=mine[0].width,`${label}: small view-only catch-up`);
  }
  assert.ok(hopsSeen>=1,label+': at least one grasshopper hopped');
  // The rise itself (the catch-up toward the model point is reported apart).
  const peak=Math.max(...samples.map(s=>s.lift*s.height)),size=samples[0].width;
  assert.ok(peak>=10,`${label}: about 10px or more of visible rise (${peak.toFixed(1)})`);
  // Tap while hopping: the touch target stays with the model and opens it.
  await p.locator('.organism-object[data-species-id="grasshopper"] .organism-hit').first().click();
  assert.equal(await p.locator('#population-dialog[open]').count(),1,label+': tapping a hopping grasshopper opens it');
  assert.deepEqual(errors,[]);report.push(`${label}: sprite ${size.toFixed(0)}px wide, rise up to ${peak.toFixed(1)}px, catch-up up to ${Math.max(...samples.map(s=>Math.abs(s.hopX))).toFixed(1)}px`);
  await p.close();
 }
 await b.close();console.log('PASS grasshopper hop\n '+report.join('\n '));
})().catch(e=>{console.error(e);process.exit(1);});
