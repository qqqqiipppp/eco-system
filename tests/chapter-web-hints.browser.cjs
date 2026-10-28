// 나의 먹이그물 guidance: a hand where to start, glowing choices, red shake on a
// mistake, the field guide after two misses at one place, a pause after three in a row.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:712},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.evaluate(()=>localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2']})));await p.reload();await p.waitForSelector('.chapter-hud');
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.locator('.chapter-menu-button').click();await p.locator('.chapter-menu button',{hasText:'나의 먹이그물'}).click();
 const web='.chapter-web-dialog[open] ',node=id=>p.locator(`${web}.web-node[data-species-id="${id}"]`),role=name=>p.locator(`${web}.web-roles button`,{hasText:name});
 assert.equal(await p.locator(web+'.web-hand.show').count(),1,'a hand points where to start');
 assert.equal(await p.locator(web+'.web-node.candidate').count(),3,'unsorted organisms glow');
 await node('grasshopper').click();await role('생산자').click();
 assert.equal(await p.locator(web+'.web-node.wrong').count(),1,'a wrong role flashes the organism');
 assert.match(await p.locator(web+'.web-note.wrong').textContent(),/다시 생각해 봐요/);
 await node('grasshopper').click();await role('분해자').click();
 assert.equal(await p.locator(web+'.web-guide-hint').count(),1,'two misses at one place offer the guide');
 await node('grasshopper').click();await role('생산자').click();
 assert.equal(await p.locator(web+'.web-board.locked').count(),1,'three in a row pause the board');
 await node('rabbit').click({force:true});assert.doesNotMatch(await p.locator(web+'.web-panel').textContent(),/멧토끼는 어떤 역할/,'taps are ignored while paused');
 await p.waitForTimeout(5300);assert.equal(await p.locator(web+'.web-board.locked').count(),0);
 for(const [id,r] of [['grass','생산자'],['grasshopper','소비자'],['rabbit','소비자']]){await node(id).click();await role(r).click();}
 assert.equal(await p.locator(web+'.web-hand.show').count(),1,'a new step shows the hand again');
 await node('grasshopper').click();assert.equal(await p.locator(web+'.web-node.candidate').count(),2,'after a food is chosen, the others glow');
 await node('grass').click();assert.equal(await p.locator(web+'.web-lines .web-wrong').count(),1,'a wrong link shows as a red dashed arrow');
 assert.deepEqual(errors,[]);await b.close();console.log('PASS chapter web hints');
})().catch(e=>{console.error(e);process.exit(1);});
