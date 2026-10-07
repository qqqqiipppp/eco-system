const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1138,height:712},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:8080/',{waitUntil:'networkidle'});
  const state=()=>page.evaluate(async()=>structuredClone((await import('./js/main.js')).gameState));
  const initial=await state(); assert(Number.isFinite(initial.metrics.stability));
  assert.equal(await page.locator('.abiotic-status b').count(),4);
  await page.getByRole('button',{name:'환경 살펴보기',exact:true}).tap();
  for(const name of ['햇빛','물','공기','토양']) await page.getByLabel(`${name} 상태`,{exact:true}).selectOption('bad');
  assert((await state()).metrics.stability < initial.metrics.stability);
  assert.equal(await page.locator('#environment-value').textContent(),'나쁨');
  await page.getByRole('button',{name:'닫기',exact:true}).tap();
  await page.waitForTimeout(1800);
  const bad=await state(); assert(bad.organisms.find(o=>o.speciesId==='grass').growth<1);
  assert(bad.organisms.find(o=>o.speciesId==='grass').foodStock<3);
  assert.equal(bad.organisms.length,initial.organisms.length);
  await page.getByRole('button',{name:'환경 살펴보기',exact:true}).tap();
  for(const name of ['햇빛','물','공기','토양']) await page.getByLabel(`${name} 상태`,{exact:true}).selectOption('good');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#environment-dialog').evaluate(d=>d.open),false);
  await page.waitForTimeout(1800);
  assert((await state()).organisms.find(o=>o.speciesId==='grass').growth > bad.organisms.find(o=>o.speciesId==='grass').growth);
  for(const [width,height] of [[1280,800],[960,600],[412,915]]) {
   await page.setViewportSize({width,height}); await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width>=960)assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
   await page.getByRole('button',{name:'환경 살펴보기',exact:true}).click();
   assert.equal(await page.getByLabel('토양 상태',{exact:true}).isVisible(),true);
   await page.getByRole('button',{name:'닫기',exact:true}).click();
  }
  await page.setViewportSize({width:1138,height:712});
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: 4 factors, good/bad controls, stability change, gradual growth/food loss and recovery, dialog touch/Escape, responsive layout.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
