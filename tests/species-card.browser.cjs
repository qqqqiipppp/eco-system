// Species card: real photos and short real-world facts first, game details folded away.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:620},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.waitForSelector('.chapter-hud');
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.evaluate(()=>document.querySelector('#population-open').click());
 const ids=await p.$$eval('#population-species option',o=>o.map(x=>x.value));
 assert.equal(ids.length,24);
 for(const id of ids){
  await p.locator('#population-species').selectOption(id);
  const card=p.locator(`#population-card [data-species-card="${id}"]`);
  assert.equal(await card.count(),1,id+' shows its card');
  assert.equal(await card.locator('.species-card-facts > div').count(),6,id+' has six short facts');
  const photos=await card.locator('.species-card-photos img').count();assert.ok(photos>=2,id+' has real photos');
  await card.locator('.species-card-photos img').first().evaluate(img=>img.decode());
  assert.ok(await card.locator('.species-card-photos img').first().evaluate(img=>Math.max(img.naturalWidth,img.naturalHeight)>=400),id+' first photo loads');
  assert.match(await card.locator('.species-card-credit').textContent(),/사진: .+ · (CC|Public)/,id+' credits the photo');
 }
 const size=await p.locator('#population-card .species-card-facts dd').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
 assert.ok(size>=19,'facts use large type');
 assert.equal(await p.locator('#population-more #population-food').count(),1,'game food status is folded away');
 assert.equal(await p.locator('#population-more').getAttribute('open'),null);
 await p.locator('#population-species').selectOption('grasshopper');
 await p.screenshot({path:process.env.SHOT||'/tmp/species-card.png'});
 // Swiping the strip moves the dots and the credit.
 const strip=p.locator('#population-card .species-card-photos');
 await strip.evaluate(s=>s.scrollTo({left:s.clientWidth}));await p.waitForTimeout(300);
 assert.equal(await p.locator('#population-card .species-card-dots button[aria-current=true]').getAttribute('aria-label'),'2번 사진');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS species card');
})().catch(e=>{console.error(e);process.exit(1);});
