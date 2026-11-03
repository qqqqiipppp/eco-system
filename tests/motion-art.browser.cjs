// The painted motion art in the real game (forest mode, every animal with its
// food, Galaxy Tab S5e landscape 1280x650 at 2x): each painted state shows
// only while the animal is really in it, hops and flights leave the ground,
// walkers stay on it, pictures face the way the animal goes, a moving animal
// can still be tapped, and every frame loads once. Reads what is painted from
// js/ui/species-frames.js, so it checks whatever art is in.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const {useUnlockedCards}=require('./fixtures.cjs');
const base=(process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/')+'?mode=forest';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
// Two forests, so every animal fits with its food (a forest holds about 24).
const zoos=[
 {grass:3,oak:1,raspberry:1,'litter-mold':1,earthworm:2,grasshopper:2,frog:2,rabbit:1,chipmunk:1,'field-mouse':1,weasel:1,snake:1,goshawk:1},
 {grass:3,raspberry:2,hazel:1,oak:1,grasshopper:2,caterpillar:2,aphid:2,snail:2,spider:1,ladybird:1,tit:1,bulbul:1},
];
const ground=new Set(['grass','raspberry','hazel','oak','pine','litter-mold','earthworm']);
(async()=>{
 const b=await chromium.launch(launch),errors=[],all={out:[],gaps:[],placed:[],counts:[]};let p;
 for(const zoo of zoos){
  p=await b.newPage({viewport:{width:1280,height:650},deviceScaleFactor:2,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/data/forest.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/initialOrganisms: \[[\s\S]*?\],/,'initialOrganisms: [],')});});
  await useUnlockedCards(p);await p.goto(base);await p.waitForSelector('#placement-surface');
  await p.evaluate(()=>{localStorage.clear();document.querySelectorAll('dialog[open]').forEach(d=>d.close());});
  // Plants, litter and earthworms on the ground row; animals spread over two rows above.
  let g=0,a=0;
  for(const [species,count] of Object.entries(zoo)){await p.locator(`.organism-card[data-species-id="${species}"]`).click();
   for(let n=0;n<count;n++)if(ground.has(species)){await tapBackground(p,.05+(g%13)*.072,.82);g++;}else{await tapBackground(p,.05+(a%14)*.067,.38+.18*((a/14|0)%2));a++;}}
  if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
  await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  all.placed.push(...await p.evaluate(async()=>[...new Set((await import('./js/main.js')).gameState.organisms.map(o=>o.speciesId))]));
  all.counts.push(await p.locator('.organism-object').count());
  // Every animation frame for 40 s: picture, state, lift, facing, CSS animation, frame time.
  const samples=await p.evaluate(ms=>new Promise(done=>{const out=[],gaps=[];let last=performance.now();const t0=last;(function tick(now){gaps.push(now-last);last=now;
   const top=document.querySelector('#placement-surface').getBoundingClientRect().top;
   for(const a of document.querySelectorAll('.organism-object')){const img=a.querySelector('img.organism-art');if(!img)continue;const s=getComputedStyle(img),box=img.getBoundingClientRect();
    out.push({id:a.dataset.instanceId,sp:a.dataset.speciesId,state:a.dataset.visualState,src:img.getAttribute('src').split('/').pop(),lift:parseFloat(s.getPropertyValue('--hop-lift'))||0,facing:s.getPropertyValue('--facing').trim()||'1',anim:s.animationName,cut:(parseFloat(s.getPropertyValue('--hop-lift'))||0)>0?Math.max(0,top-box.top):0});}
   if(now-t0<ms)requestAnimationFrame(tick);else done({out,gaps:gaps.slice(5)});})(t0);}),40000);
  all.out.push(...samples.out);all.gaps.push(...samples.gaps);
  if(zoo!==zoos.at(-1))await p.close();
 }
 const painted=await p.evaluate(async()=>(await import('./js/ui/species-frames.js')).paintedFrames);
 const styles=await p.evaluate(async()=>{const v=await import('./js/ui/species-visuals.js');return Object.fromEntries(Object.keys(v.moveStyles).map(id=>[id,v.moveStyle(id)]));});
 const samples=all,placed=[...new Set(all.placed)];
 const report=[],bySpecies={};for(const s of samples.out)(bySpecies[s.sp]??=[]).push(s);
 for(const [sp,frames] of Object.entries(painted)){
  if(sp.includes(':'))continue;
  assert.ok(bySpecies[sp],sp+' placed');const mine=bySpecies[sp],states=new Set(mine.map(s=>s.state));
  for(const [state,count] of Object.entries(frames)){
   const own=new RegExp(`^${sp}-${state}-\\d+\\.webp$`),shown=mine.filter(s=>own.test(s.src));
   assert.ok(shown.every(s=>s.state===state),`${sp}: ${state} frames only in ${state} (${[...new Set(shown.map(s=>s.state))]})`);
   const inState=mine.filter(s=>s.state===state);
   assert.ok(inState.every(s=>own.test(s.src)),`${sp}: in ${state} the painted frames show`);
   assert.ok(shown.every(s=>s.anim==='none'),`${sp}: no CSS hint over painted ${state}`);
   if(inState.length>40)assert.equal(new Set(shown.map(s=>s.src)).size,count,`${sp}: all ${count} ${state} frames play`);
   report.push(`${sp} ${state}: ${inState.length?`${inState.length} samples, frames ${[...new Set(shown.map(s=>s.src.match(/-(\d+)\.webp/)[1]))].sort()}`:'not seen in 40 s'}`);
  }
  const moving=mine.filter(s=>s.state==='move'),top=Math.max(0,...moving.map(s=>s.lift));
  if(frames.move){const style=styles[sp]||'loop';
   if(style==='loop')assert.equal(top,0,`${sp}: a walker stays on the ground`);
   else if(moving.length>40)assert.ok(top>.1,`${sp}: the ${style} leaves the ground (${top.toFixed(2)})`);
   if(style==='hop')assert.ok(moving.filter(s=>s.lift>0).every(s=>s.src.endsWith(frames.move>=4?'.webp':'-move-1.webp')),`${sp}: in the air on the air frame`);
   report.push(`${sp} move style ${style}, top ${top.toFixed(2)}`);}
  if(sp==='snake')assert.ok(mine.filter(s=>s.state==='eat').every(s=>!/-sense-/.test(s.src)),'snake: no tongue flick while eating');
 }
 // A lifted picture is never cut off at the top of the forest.
 // (The picture box may pass the edge by a pixel or two for one frame while
 // its 33 ms smoothing catches up with a bird that has just moved up.)
 {const cut=samples.out.filter(s=>s.cut>0),worst=Math.max(0,...cut.map(s=>s.cut));report.push(`top edge: ${cut.length} samples past it, at most ${worst.toFixed(1)} px`);
  assert.ok(worst<=3,'no hop or flight goes past the top edge: '+JSON.stringify(cut.slice(0,3)));}
 // Facing follows the way an animal goes.
 const turned=Object.entries(bySpecies).filter(([,m])=>m.some(s=>s.facing==='-1')&&m.some(s=>s.facing==='1')).map(([sp])=>sp);
 assert.ok(turned.length>=4,'animals face both ways: '+turned);
 // Frame pacing with the whole zoo on screen.
 const gaps=samples.gaps.sort((a,b)=>a-b),median=gaps[gaps.length>>1],slow=gaps.filter(g=>g>50).length;
 report.push(`frames: median ${median.toFixed(1)} ms, over 50 ms ${slow} of ${gaps.length}, organisms on screen ${all.counts.join(' and ')}`);
 assert.ok(slow<gaps.length*.02,'smooth with a full forest');
 // A moving animal can still be tapped (its touch target stays with the model).
 // (One not covered by a 💡 marker or another animal right now.)
 const target=await p.evaluate(()=>{for(const a of document.querySelectorAll('.organism-object[data-visual-state="move"]')){const hit=a.querySelector('.organism-hit'),r=hit.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  if(document.elementFromPoint(x,y)===hit)return {x,y,species:a.dataset.speciesId};}return null;});
 assert.ok(target,'a moving animal to tap');await p.touchscreen.tap(target.x,target.y);
 assert.equal(await p.locator('#population-dialog[open]').count(),1,'tapping a moving animal opens it');report.push(`tapped a moving ${target.species}: opened`);
 assert.deepEqual(errors,[]);await b.close();
 console.log(`PASS motion art (${placed.length} species placed: ${placed.join(',')})\n `+report.join('\n '));
})().catch(e=>{console.error(e);process.exit(1);});
