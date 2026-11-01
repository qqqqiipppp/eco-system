// After a crisis the student answers one "why / what can we do" question and
// sees the explanation; "나의 기록" keeps how the food web and the questions went.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
const shots=process.env.SHOTS;
const menu=async(p,label)=>{await p.locator('.chapter-menu-button').click();await p.locator('.chapter-menu button',{hasText:label}).click();};
const crisisOver=(p,kind)=>p.evaluate(async kind=>{const c=(await import('./js/main.js')).gameState.chapter;c.crisisLog.push({kind,human:false,choice:'wait',stalled:14,startedAt:1,endedAt:2,outcome:'held'});},kind);
const clock=p=>p.evaluate(async()=>(await import('./js/main.js')).gameState.simulationTime);
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:650},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('eco-system:chapter-progress',JSON.stringify({cleared:['1-1','1-2']}));});
 await p.reload();await p.waitForSelector('.chapter-hud');await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 // 1. A crisis ends: the verdict, then one question; going on waits for an answer.
 await crisisOver(p,'cloudy');await p.waitForSelector('.chapter-report-dialog[open]');
 const report=p.locator('.chapter-report-dialog');
 assert.match(await report.locator('.chapter-reflect-question').textContent(),/흐린 날씨에 숲 별이 멈춘 까닭/);
 assert.equal(await report.locator('.chapter-reflect-choices button').count(),3);
 assert.equal(await report.locator('button',{hasText:'계속하기'}).isVisible(),false,'answer first');
 assert.equal(await report.locator('.chapter-lesson').isVisible(),false,'the lesson waits: it gives the answer away');
 assert.equal(await p.evaluate(()=>document.activeElement.tagName),'H2','no choice looks picked');
 if(shots)await p.screenshot({path:`${shots}/reflect-ask.png`});
 assert.ok(await report.locator('.chapter-reflect-choices button').last().evaluate(b=>{const r=b.getBoundingClientRect();return r.bottom<=innerHeight;}),'the question fits without scrolling');
 const paused=await clock(p);
 await report.locator('.chapter-reflect-choices button',{hasText:'동물들이 추워서'}).click();
 assert.match(await report.locator('.chapter-reflect-feedback').textContent(),/다시 생각해 봐요.*햇빛을 받아 양분을/);
 assert.equal(await report.locator('.chapter-reflect-choices button.right').textContent(),'햇빛이 줄어 식물이 잘 자라지 못하고, 먹이가 모자랐기 때문','the right answer is shown');
 assert.equal(await report.locator('.chapter-reflect-choices button:not([disabled])').count(),0,'one answer only');
 assert.equal(await report.locator('.chapter-lesson').isVisible(),true,'then the lesson');
 if(shots)await p.screenshot({path:`${shots}/reflect-wrong.png`});
 assert.equal(await clock(p),paused,'the forest waits while thinking');
 await report.locator('button',{hasText:'계속하기'}).click();assert.equal(await p.locator('dialog[open]').count(),0);
 await p.waitForTimeout(1600);assert.ok(await clock(p)>paused,'the forest goes on');
 // 2. The same crisis again asks the other question.
 await crisisOver(p,'cloudy');await p.waitForSelector('.chapter-report-dialog[open]');
 assert.match(await report.locator('.chapter-reflect-question').textContent(),/오기 전에 숲을 튼튼하게/);
 await report.locator('.chapter-reflect-choices button',{hasText:'먹이 식물을 넉넉히'}).click();
 assert.match(await report.locator('.chapter-reflect-feedback').textContent(),/^맞아요!/);
 if(shots)await p.screenshot({path:`${shots}/reflect-right.png`});
 await report.locator('button',{hasText:'계속하기'}).click();
 // 3. The chapter's food web, with one rethink at each step.
 await menu(p,'나의 먹이그물');await p.waitForSelector('.chapter-web-dialog[open]');
 const node=id=>p.locator(`.chapter-web-dialog .web-node[data-species-id="${id}"]`);
 await node('grass').click();await p.locator('.web-roles button',{hasText:'소비자'}).click();
 for(const [id,role] of [['grass','생산자'],['grasshopper','소비자'],['rabbit','소비자']]){await node(id).click();await p.locator('.web-roles button',{hasText:role}).click();}
 await node('grasshopper').click();await node('grass').click();
 for(const eater of ['grasshopper','rabbit']){await node('grass').click();await node(eater).click();}
 await node('grass').click();await p.locator('.web-panel button',{hasText:'확인'}).click();
 await node('grasshopper').click();await node('rabbit').click();await p.locator('.web-panel button',{hasText:'확인'}).click();
 await p.locator('.web-panel button',{hasText:'완성'}).click();await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 // 4. 나의 기록 shows it all, and stays after a reload.
 for(const pass of [1,2]){
  await menu(p,'나의 기록');await p.waitForSelector('.chapter-record-dialog[open]');
  const ch1=p.locator('.chapter-record-dialog .record-chapter').first(),text=await ch1.textContent(),today=new Date();
  assert.match(text,/챕터 1 풀밭/);assert.match(text,new RegExp(`완성했어요 \\(${today.getMonth()+1}월 ${today.getDate()}일\\)`));
  assert.match(text,/역할 나누기3\/3종/);assert.match(text,/먹이 관계 화살표2\/2개/);assert.match(text,/역할 1 · 화살표 1 · 연결 질문 1/);
  assert.match(text,/위기 돌아보기 \(맞힘 1\/2\)/);
  assert.deepEqual(await ch1.locator('.record-answers li').evaluateAll(l=>l.map(x=>x.className)),['wrong','right']);
  assert.equal(await p.locator('.chapter-record-dialog .record-chapter').count(),1,'only chapters reached');
  if(shots&&pass===1)await p.screenshot({path:`${shots}/record.png`});
  if(pass===1){await p.locator('.chapter-record-dialog button',{hasText:'닫기'}).click();await p.reload();await p.waitForSelector('.chapter-hud');
   if(await p.locator('.chapter-resume-dialog[open]').count())await p.locator('.chapter-resume-dialog button',{hasText:'이어서 하기'}).click();
   await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));}
 }
 await p.locator('.chapter-record-dialog button',{hasText:'먹이그물 보기'}).click();
 await p.waitForSelector('.chapter-web-dialog[open]');assert.equal(await p.locator('.chapter-record-dialog[open]').count(),0);
 assert.deepEqual(errors,[]);await b.close();console.log('PASS chapter learning');
})().catch(e=>{console.error(e);process.exit(1);});
