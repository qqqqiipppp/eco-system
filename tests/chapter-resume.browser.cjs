// A reload, a closed tab or a sleeping tablet must not throw away the stage:
// it comes back as it was and the student chooses to go on or start again.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {tapBackground}=require('./ux-browser-helpers.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const summary=p=>p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;return {stage:g.chapter.stageId,seeds:g.chapter.seeds,progress:g.chapter.seedProgress,points:g.metrics.points,ids:g.organisms.map(o=>o.instanceId).sort(),time:g.simulationTime,crises:g.chapter.crisisLog.length,drawn:document.querySelectorAll('.organism-object').length};});
const closeIntro=p=>p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:620},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForSelector('.chapter-hud');await closeIntro(p);
 assert.equal(await p.locator('.chapter-resume-dialog[open]').count(),0,'nothing to resume at first');
 for(const x of [.42,.5]){await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,x,.4);await p.waitForTimeout(300);}
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();await closeIntro(p);
 await p.evaluate(async()=>{(await import('./js/main.js')).gameState.chapter.seedProgress=49.9;});
 await p.waitForSelector('.chapter-prepare-dialog[open]');await p.locator('.chapter-prepare button',{hasText:'그냥 기다리기'}).click();
 await p.waitForTimeout(6500);
 const before=await summary(p);assert.equal(before.seeds,1);assert.ok(before.ids.length>=3);
 assert.ok(await p.evaluate(()=>Boolean(localStorage.getItem('eco-system:chapter-stage'))),'the stage is kept while playing');
 // 1. Reload: asked, then "이어서 하기" brings the same forest back and it goes on.
 await p.reload();await p.waitForSelector('.chapter-resume-dialog[open]');
 assert.match(await p.locator('.chapter-resume-dialog').textContent(),/1-1 풀밭의 시작.*숲 별 1개.*방금에 저장했어요|1-1 풀밭의 시작.*숲 별 1개/);
 const shown=await summary(p);
 await p.locator('.chapter-resume-dialog button',{hasText:'이어서 하기'}).click();
 assert.equal(await p.locator('dialog[open]').count(),0,'no stage intro after going on');
 assert.deepEqual([shown.stage,shown.seeds,shown.points,shown.ids,shown.crises],[before.stage,before.seeds,before.points,before.ids,before.crises],'same stage, stars, points, organisms and crises');
 assert.equal(shown.drawn,shown.ids.length,'every organism is drawn');
 assert.ok(shown.time>=before.time-5.5,'at most a few seconds lost');
 await p.waitForTimeout(2500);{const now=await summary(p),open=await p.evaluate(()=>[...document.querySelectorAll('dialog[open]')].map(d=>d.className+':'+d.textContent.slice(0,60)));assert.ok(now.time>=shown.time+1,'the forest goes on '+JSON.stringify({was:shown.time,now:now.time,open}));}
 // Hiding the page saves at once.
 await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 const hidden=await p.evaluate(()=>JSON.parse(localStorage.getItem('eco-system:chapter-stage')).state.simulationTime);
 await p.evaluate(()=>{delete document.visibilityState;});
 assert.ok(hidden>=(await summary(p)).time-1,'saved when hidden');
 // 2. Reload: "처음부터" starts the same stage fresh and forgets the old forest.
 await p.reload();await p.waitForSelector('.chapter-resume-dialog[open]');
 await p.locator('.chapter-resume-dialog button',{hasText:'처음부터'}).click();
 let fresh=await summary(p);assert.deepEqual([fresh.stage,fresh.seeds,fresh.points],['1-1',0,12]);
 assert.equal(await p.evaluate(()=>localStorage.getItem('eco-system:chapter-stage')),null);
 await closeIntro(p);
 // 3. The menu's "이 스테이지 처음부터" asks once, then starts again.
 await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,.45,.4);await p.waitForTimeout(300);
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();
 assert.equal((await summary(p)).points,8);
 await p.locator('.chapter-menu-button').click();await p.locator('.chapter-menu button',{hasText:'이 스테이지 처음부터'}).click();
 await p.locator('.chapter-dialog[open] button',{hasText:'계속하기'}).click();assert.equal((await summary(p)).points,8,'계속하기 keeps the forest');
 await p.locator('.chapter-menu-button').click();await p.locator('.chapter-menu button',{hasText:'이 스테이지 처음부터'}).click();
 await p.locator('.chapter-dialog[open] button',{hasText:'처음부터 하기'}).click();
 fresh=await summary(p);assert.deepEqual([fresh.seeds,fresh.points],[0,12]);
 // 4. A cleared stage is not kept; the next reload starts the next stage.
 await closeIntro(p);
 for(const x of [.42,.5]){await p.locator('.organism-card[data-species-id="grasshopper"]').click();await tapBackground(p,x,.4);await p.waitForTimeout(300);}
 if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();await closeIntro(p);
 await p.waitForTimeout(6000);assert.ok(await p.evaluate(()=>Boolean(localStorage.getItem('eco-system:chapter-stage'))));
 await p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;g.chapter.seeds=2;g.chapter.crisisLog.push({kind:'cloudy',human:false,choice:'wait',stalled:0,startedAt:1,endedAt:2,outcome:'held',reported:true});g.chapter.eventsStarted=1;g.chapter.seedProgress=49.9;});
 await p.evaluate(async()=>{const g=(await import('./js/main.js')).gameState;for(let i=0;i<100&&!g.chapter.cleared;i++)await new Promise(r=>setTimeout(r,100));});
 assert.ok((await p.evaluate(async()=>(await import('./js/main.js')).gameState.chapter.cleared)),'the stage clears');
 assert.equal(await p.evaluate(()=>localStorage.getItem('eco-system:chapter-stage')),null,'a cleared stage is not kept');
 await p.reload();await p.waitForSelector('.chapter-hud');
 assert.equal(await p.locator('.chapter-resume-dialog[open]').count(),0);assert.equal((await summary(p)).stage,'1-2');
 // 5. Broken saved data is ignored.
 await p.evaluate(()=>localStorage.setItem('eco-system:chapter-stage','{"version":1,"stageId":"9-9"}'));await p.reload();await p.waitForSelector('.chapter-hud');
 assert.equal(await p.locator('.chapter-resume-dialog[open]').count(),0);
 assert.deepEqual(errors,[]);await b.close();console.log('PASS chapter resume');
})().catch(e=>{console.error(e);process.exit(1);});
