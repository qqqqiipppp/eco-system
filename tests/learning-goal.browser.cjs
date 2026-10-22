const {tapBackground}=require('./ux-browser-helpers.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/',long=process.argv.includes('--long'),optimized=process.argv.includes('--optimized');
const output=process.env.RESULTS_PATH||'tests/learning-goal.browser-results.json';
const result={stage:'15.10',actualS5e:false,actualChildren:false,mode:long?'real foreground20min, no fast-forward':optimized?'optimized real foreground UI, no imposed46s pause':'real foreground UI, old path comparison until46s',runs:[]};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
 async function run(split=false){
  const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true}),p=await context.newPage(),errors=[],started=Date.now();
  let taps=0,dialogs=0,textCharacters=0;const snapshots=[],pauses=[],views=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.goalAudit={taps:0,dialogs:[],last:new Set()};document.addEventListener('click',()=>window.goalAudit.taps++,true);new MutationObserver(()=>{for(const d of document.querySelectorAll('dialog[open]'))if(!window.goalAudit.last.has(d)){window.goalAudit.last.add(d);window.goalAudit.dialogs.push({id:d.id,characters:d.innerText.length});}for(const d of window.goalAudit.last)if(!d.open)window.goalAudit.last.delete(d);}).observe(document,{attributes:true,subtree:true,attributeFilter:['open']});});
  await p.goto(BASE);await p.locator('#help-skip').click();await p.evaluate(async()=>window.goalState=(await import('./js/main.js')).gameState);
  const state=()=>p.evaluate(async()=>structuredClone((await import('./js/main.js')).gameState));
  const close=async()=>{for(const id of ['goal','event','activity','population','environment','help','web','guide'])if(await p.locator('#'+id+'-dialog').evaluate(d=>d.open))await p.locator('#'+id+'-close').click();};
  const place=async(id,x=.43)=>{await close();await p.locator('.organism-card[data-species-id="'+id+'"]').click();const b=await p.locator('#placement-surface').boundingBox();await tapBackground(p,x,.4);if(await p.locator('.clear-selection').count())await p.locator('.clear-selection').click();};
  const activity=async(id,answer)=>{await close();if(id==='grass_observation')await p.locator('.organism-card[data-species-id="frog"]').click();else{await p.locator('#activities-open').click();if(id!=='producer_quiz'){if(!await p.locator('#activity-library').evaluate(d=>d.open))await p.locator('#activity-library > summary').click();await p.locator('[data-activity-id="'+id+'"]').click();}}await p.locator('[data-answer="'+answer+'"]').click();await p.locator('#activity-close').click();};
  const record=async rid=>{await close();const s=await state(),e=s.events.find(e=>e.status==='active'&&e.payload.relationId===rid);assert(e,JSON.stringify({rid,at:s.simulationTime,events:s.events,organisms:s.organisms.map(o=>o.speciesId)}));await p.locator('[data-event-marker="'+e.eventId+'"]').click();await p.getByRole('button',{name:'발견 기록하기',exact:true}).click();await p.locator('#event-close').click();};
  const inspect=async species=>{await close();await p.locator('#population-open').click();await p.locator('#population-species').selectOption(species);};
  const missionViews=[];async function missionCheck(expected,step){assert.match(await p.locator('#mission-count').innerText(),new RegExp(expected+'/3'));missionViews.push({step,count:await p.locator('#mission-count').innerText(),next:await p.locator('#mission-preview').innerText()});}
  await missionCheck(0,'first forest');
  await place('grasshopper',.4);await place('grasshopper',.46);await place('mushroom',.32);
  await activity('producer_quiz','grass');await activity('decomposer_classify','decomposer');
  await p.waitForFunction(()=>{const s=window.goalState;return s.events.some(e=>e.status==='active'&&e.payload.relationId==='v2_grass_to_grasshopper');},null,{timeout:45000});
  await record('v2_grass_to_grasshopper');await activity('grass_observation','confirm');await place('frog');
  await p.waitForFunction(()=>{const s=window.goalState;return s.events.some(e=>e.status==='active'&&e.payload.relationId==='v2_grasshopper_to_frog');},null,{timeout:70000});await record('v2_grasshopper_to_frog');
  await missionCheck(1,'actual connected food discoveries');
  while(!optimized&&(await state()).simulationTime<46)await p.waitForTimeout(400);
  const oldPath=await state();assert(!oldPath.forestProgress.cleared);assert.equal(oldPath.learningGoalProgress.decomposer,null);assert.equal(oldPath.learningGoalProgress.inquiry,null);
  const points=oldPath.metrics.points,rewards=oldPath.rewardHistory.length;
  await inspect('mushroom');await p.locator('[data-goal-action="decomposer"]').click();await p.locator('#population-close').click();
  await missionCheck(2,'actual decomposition and explicit role confirmation');
  await inspect('grass');assert.equal(await p.locator('[data-goal-action="confirm"]').count(),0);await p.locator('[data-goal-action="watch"]').click();
  assert(!(await state()).forestProgress.cleared);assert.equal((await state()).metrics.points,points);assert.equal((await state()).rewardHistory.length,rewards);
  const chosen=await state();
  const deadline=Date.now()+180000;while((await state()).learningGoalProgress.inquiry.phase!=='result'&&Date.now()<deadline){const s=await state();if(!s.organisms.some(o=>o.speciesId==='grasshopper'))await place('grasshopper');else await p.waitForTimeout(500);}
  assert.equal((await state()).learningGoalProgress.inquiry.phase,'result');assert(!(await state()).forestProgress.cleared);
  await inspect('grass');const paused=await state();await p.waitForTimeout(700);assert.deepEqual(await state(),paused);pauses.push({dialog:'population',at:paused.simulationTime,frozen:true});await p.locator('[data-goal-action="confirm"]').click();await p.locator('#population-close').click();
  await missionCheck(3,'actual food recovery and explicit result confirmation');
  while(!(await state()).forestProgress.cleared&&Date.now()<deadline){const s=await state();if(!s.organisms.some(o=>o.speciesId==='grasshopper'))await place('grasshopper');else await p.waitForTimeout(500);}
  const cleared=await state();assert(cleared.forestProgress.cleared);assert.equal(cleared.goalRevision,2);assert.equal(cleared.schemaVersion,17);
  const clearAudit=await p.evaluate(()=>({taps:window.goalAudit.taps,dialogs:window.goalAudit.dialogs}));
  await close();taps+=clearAudit.taps;dialogs+=clearAudit.dialogs.length;textCharacters+=clearAudit.dialogs.reduce((n,d)=>n+d.characters,0);
  for(const [width,height]of [[1280,800],[1138,712],[960,600],[1366,768],[412,915]]){
   await p.setViewportSize({width,height});if(await p.locator('#memo-toggle').getAttribute('aria-expanded')==='false')await p.locator('#memo-toggle').click();
   const v=await p.evaluate(()=>({width:innerWidth,height:innerHeight,horizontal:document.documentElement.scrollWidth>innerWidth,vertical:document.documentElement.scrollHeight>innerHeight,forestHeight:document.querySelector('.forest').getBoundingClientRect().height}));assert(!v.horizontal);await require('./ux-browser-helpers.cjs').assertReadablePage(p);await inspect('grass');const touch=await p.locator('#population-inquiry button').evaluateAll(nodes=>nodes.map(n=>({height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width})));assert(touch.every(b=>b.height>=44&&b.width>=44));views.push({...v,touch});await close();
  }
  await p.setViewportSize({width:1280,height:800});
  let savedAt=null,restoredAt=null,afterTarget=1200;
  if(long){
   while((await state()).simulationTime<afterTarget){
    await close();let s=await state();
    if(split&&savedAt===null&&s.simulationTime>=600){
     await p.locator('#help-open').click();const before=await state();await p.evaluate(async()=>(await import('./js/main.js')).saveService.flush(true));
     const raw=await p.evaluate(()=>JSON.parse(localStorage.getItem('eco-system:forest-save')));savedAt=raw.domain.simulationTime;
     taps+=await p.evaluate(()=>window.goalAudit.taps)-clearAudit.taps;
     await p.reload();s=await state();restoredAt=s.simulationTime;assert(s.simulationTime-savedAt<=.5);for(const key of ['inventory','rewardHistory','pointEconomy','learningGoalProgress','forestProgress'])assert.deepEqual(s[key],before[key]);assert.equal(await p.locator('dialog[open]').count(),0);afterTarget=savedAt+600;pauses.push({dialog:'help/save/reload',at:savedAt,exactRights:true});
    }
    if(!s.organisms.some(o=>o.speciesId==='grasshopper'))await place('grasshopper');
    else if(s.organisms.filter(o=>o.speciesId==='grass').length<3){for(const x of [.25,.58,.66]){const before=(await state()).organisms.length;await place('grass',x);if((await state()).organisms.length>before)break;}}
    // Actual discoveries remain explicit student UI actions. No state grants.
    s=await state();for(const e of s.events.filter(e=>e.status==='active'&&e.payload.relationId))await record(e.payload.relationId);
    if(Math.floor(s.simulationTime)%60===0&&!snapshots.some(x=>x.at===Math.floor(s.simulationTime)))snapshots.push({at:Math.floor(s.simulationTime),total:s.organisms.length,points:s.metrics.points,environmentEpisodes:s.environmentEvents.history.length,processed:s.decomposition.processed});
    await p.waitForTimeout(700);
   }
  }
  await close();await p.locator('#help-open').click();const before=await state();await p.waitForTimeout(1000);assert.deepEqual(await state(),before);await p.evaluate(async()=>(await import('./js/main.js')).saveService.flush(true));await p.reload();const final=await state();assert.equal(final.goalRevision,2);assert(final.forestProgress.cleared);assert.equal(final.rewardHistory.length,new Set(final.rewardHistory.map(r=>r.rewardId)).size);assert(final.organisms.length<=30);assert.deepEqual(errors,[]);
  result.runs.push({missionViews,split,wallSeconds:(Date.now()-started)/1000,activeSeconds:final.simulationTime,savedAt,restoredAt,afterSaveSeconds:savedAt===null?null:final.simulationTime-savedAt,oldPathAt:oldPath.simulationTime,oldPathBlocked:true,clearAt:cleared.forestProgress.clearedAt,goalActions:chosen.learningGoalProgress.inquiry.choice,proof:cleared.learningGoalProgress,tapsToClear:clearAudit.taps-1,dialogsToClear:clearAudit.dialogs.filter(d=>!['help-dialog','goal-dialog'].includes(d.id)).length,textCharactersToClear:clearAudit.dialogs.filter(d=>!['help-dialog','goal-dialog'].includes(d.id)).reduce((n,d)=>n+d.characters,0),clearAudit,views,pauses,snapshots,final:{points:final.metrics.points,cards:final.inventory.filter(c=>c.acquired).length,food:final.observations.length,environmentEpisodes:final.environmentEvents.history.length,growth:final.development.sequence,processed:final.decomposition.processed,goalRevision:final.goalRevision},errors});
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log('PASS learning-goal browser',split,final.simulationTime,cleared.forestProgress.clearedAt);await context.close();
 }
 try{await Promise.all(long?[run(false),run(true)]:[run(false)]);}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
