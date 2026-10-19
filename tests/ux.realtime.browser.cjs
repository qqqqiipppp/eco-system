// Real wall time, production RAF. Read state for QA decisions; actions use UI.
// RUN_REALTIME=1 node tests/ux.realtime.browser.cjs (about 22-30 wall minutes).
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
if(process.env.RUN_REALTIME!=='1')throw new Error('Explicit RUN_REALTIME=1 required');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),output={stage:'15.9',clock:'real browser RAF, no acceleration or state grants',actualS5e:false,runs:[]};
 async function play(split){const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true}),p=await context.newPage(),errors=[],started=Date.now();p.on('pageerror',e=>errors.push(e.message));await p.goto(BASE);await p.locator('#help-skip').click();await p.locator('#memo-toggle').click();let taps=2,reloaded=false,lastLog=-1,loop=0;const actions=[];
 let targetEnd=1200;
 const state=()=>p.evaluate(async()=>structuredClone((await import('./js/main.js')).gameState));
 const click=async locator=>{if(await locator.isVisible()){await locator.click({timeout:3000});taps++;return true;}return false;};
 async function place(id,x=.42,y=.71){const card=p.locator('.organism-card[data-species-id="'+id+'"]');await card.scrollIntoViewIfNeeded();await click(card);const b=await p.locator('#placement-surface').boundingBox();await p.touchscreen.tap(b.x+b.width*x,b.y+b.height*y);taps++;await click(p.locator('.clear-selection'));}
 await place('grasshopper');
 while((await state()).simulationTime<targetEnd){
  let s=await state();if(Math.floor(s.simulationTime/60)!==lastLog){lastLog=Math.floor(s.simulationTime/60);console.log(split?'split':'continuous',lastLog,'active minutes',Date.now()-started,'wall ms');}
  const open=await p.evaluate(()=>[...document.querySelectorAll('dialog[open]')].at(-1)?.id||null);
  if(open){if(open==='goal-dialog')await click(p.locator('#goal-close'));else if(open==='activity-dialog')await click(p.locator('#activity-close'));else if(open==='event-dialog')await click(p.locator('#event-close'));else await p.keyboard.press('Escape');}
  s=await state();
  if(split&&!reloaded&&s.simulationTime>=600){const before=await p.evaluate(async()=>{const m=await import('./js/main.js');m.saveService.flush(true);return structuredClone(m.gameState);});await p.reload();const after=await state();assert(after.simulationTime-before.simulationTime<=.5);assert.equal(after.metrics.points,before.metrics.points);assert.deepEqual(after.rewardHistory,before.rewardHistory);actions.push({at:after.simulationTime,type:'save-reload',points:after.metrics.points});targetEnd=before.simulationTime+600;reloaded=true;}
  if(await p.locator('#memo-toggle').getAttribute('aria-expanded')==='false')await click(p.locator('#memo-toggle'));
  // Small decisions every 5 seconds. No opening the full learning library.
  const action=await p.evaluate(async()=>{const m=await import('./js/main.js'),{forestAction}=await import('./js/ui/forest-flow.js');return forestAction(m.gameState);});
  if(action.kind==='event'){
   await p.locator('#memo-action').click();taps++;const button=p.locator('#event-actions button').first();if(await button.count())await click(button);await click(p.locator('#event-close'));
  }else if(action.kind==='activity'){
   await p.locator('#memo-action').click();taps++;const answer=await p.evaluate(async id=>(await import('./data/activities.js')).activityById[id].correctAnswer||'confirm',action.id);await click(p.locator('[data-answer="'+answer+'"]'));await click(p.locator('#activity-close'));actions.push({at:s.simulationTime,type:'activity',id:action.id});
  }else if(action.kind==='place')await place(action.id,action.id==='frog'?.44:.40,.72);
  // Optional genuine inspection makes later card activities discoverable.
  if(loop%3===0){const ids=await p.evaluate(async()=>{const s=(await import('./js/main.js')).gameState;return s.organisms.filter(o=>!s.profile.speciesObservations[o.speciesId]).map(o=>o.instanceId);});if(ids[0]){const hit=p.locator('[data-inspect-instance="'+ids[0]+'"]');if(await hit.count()){await hit.click({force:true});const choice=p.locator('[data-inspect-choice="'+ids[0]+'"]');if(await choice.isVisible())await click(choice);await click(p.locator('#population-close'));}}}
  // Existing paid management only, whenever an actual bad factor permits it.
  if(loop%6===0){const bad=Object.values((await state()).environment).some(e=>e.value<.4);if(bad){await click(p.locator('#environment-open'));const recovery=p.locator('[data-environment-recovery][aria-disabled="false"]').first();if(await recovery.count())await click(recovery);await click(p.locator('#environment-close'));}}
  fs.writeFileSync('tests/ux.realtime-'+(split?'split':'continuous')+'-checkpoint.json',JSON.stringify({status:'running',startedAt:new Date(started).toISOString(),wallSeconds:(Date.now()-started)/1000,state:await state(),actions},null,2));
  loop++;await p.waitForTimeout(5000);
 }
 const s=await state();assert(s.organisms.length<=30);assert.equal(s.rewardHistory.length,new Set(s.rewardHistory.map(r=>r.rewardId)).size);assert.deepEqual(errors,[]);output.runs.push({split,wallSeconds:(Date.now()-started)/1000,simulationSeconds:s.simulationTime,taps,menusOpenedFromHeader:0,points:s.metrics.points,acquired:s.inventory.filter(c=>c.acquired).length,observations:s.observations.length,cleared:s.forestProgress,organisms:s.organisms.length,environmentEpisodes:s.environmentEvents.history.length,development:s.development.history.length,actions,errors});fs.writeFileSync(process.env.RESULTS_PATH||'tests/ux.realtime-results.json',JSON.stringify(output,null,2)+'\n');await context.close();}
 try{await Promise.all([play(false),play(true)]);}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
