const fs=require('node:fs'),path=require('node:path');
exports.evaluateVisibility=async page=>page.evaluate(()=>{
 const forest=document.querySelector('#placement-surface').getBoundingClientRect();
 const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
 const entries=[...document.querySelectorAll('.organism-object')].map(n=>({id:n.dataset.instanceId,species:n.dataset.speciesId,image:rect(n.querySelector('.organism-visual>img,.organism-placeholder')),label:rect(n.querySelector('.organism-name')),hit:n.querySelector('.organism-hit')?rect(n.querySelector('.organism-hit')):null}));
 const area=r=>Math.max(0,r.right-r.left)*Math.max(0,r.bottom-r.top),intersection=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 let imagePairs=0,severePairs=0,labelPairs=0,hitPairs=0;const severe=new Set(),covered=new Set();
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  const a=entries[i],b=entries[j],overlap=intersection(a.image,b.image);
  if(overlap>0)imagePairs++;
  if(overlap/Math.min(area(a.image),area(b.image))>=.65){severePairs++;severe.add(a.id);severe.add(b.id);}
  if(overlap/area(a.image)>=.95)covered.add(a.id);
  if(intersection(a.label,b.label)>0)labelPairs++;
  if(a.hit&&b.hit&&intersection(a.hit,b.hit)>0)hitPairs++;
 }
 return {entries,domCount:entries.length,imagePairs,severePairs,severeInstances:severe.size,coveredByBoundingBox:covered.size,labelPairs,hitPairs,outside:entries.filter(e=>e.image.left<forest.left-.1||e.image.right>forest.right+.1||e.image.top<forest.top-.1||e.label.bottom>forest.bottom+.1).length,bottomConcentration:entries.filter(e=>(e.image.bottom-forest.top)/forest.height>=.68).length,verticalSpread:Math.max(...entries.map(e=>e.image.bottom))-Math.min(...entries.map(e=>e.image.bottom)),directTargets:entries.filter(e=>e.hit&&e.hit.width>=44&&e.hit.height>=44).length,forest:{left:forest.left,top:forest.top,width:forest.width,height:forest.height},visibleMarkers:document.querySelectorAll('[data-event-marker]').length,horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
});
exports.makeWorld=async()=>{const {mixed24}=await import('./pacing-fixtures.mjs');return mixed24();};
exports.snapshot=async s=>{const {createSaveSnapshot}=await import('../js/services/save-format.js');return createSaveSnapshot(s,{sequence:0,cooldowns:[],questionDone:[],pendingDiscoveries:[]},'2026-10-15T00:00:00Z');};
exports.capture=async({baseline=false}={})=>{
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{dismissWelcome}=require('./fixtures.cjs');
 const browser=await chromium.launch({channel:'msedge',headless:true}),rows=[],errors=[];
 try{const raw=await exports.snapshot(await exports.makeWorld());const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,reducedMotion:'reduce'});
  await context.addInitScript(raw=>{if(!sessionStorage.seeded){localStorage.setItem('eco-system:forest-save',JSON.stringify(raw));sessionStorage.seeded='yes';}},raw);
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/',{waitUntil:'networkidle'});await dismissWelcome(p);
  for(const [width,height]of [[1280,800],[1138,712],[960,600],[1366,768],[412,915]]){await p.setViewportSize({width,height});await p.waitForTimeout(100);rows.push({width,height,...await exports.evaluateVisibility(p)});if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`stage13_7-${baseline?'before':'after'}-${width}x${height}.png`),fullPage:true});}}
  return {stage:baseline?'13.6 before habitat':'13.7',head:'b915891d0d1385247f3abd28d4819ad97537681a',fixture:'identical24species/30actual',rows,errors};
 }finally{await browser.close();}
};
if(require.main===module&&process.argv.includes('--baseline')&&fs.existsSync(path.join(__dirname,'habitat.baseline-results.json')))throw new Error('Preserved baseline already exists; will not overwrite it');
if(require.main===module)exports.capture({baseline:process.argv.includes('--baseline')}).then(data=>{fs.writeFileSync(process.env.RESULTS_PATH||path.join(__dirname,process.argv.includes('--baseline')?'habitat.baseline-results.json':'habitat.visibility-results.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data.rows.map(({width,height,imagePairs,severePairs,labelPairs,outside,directTargets})=>({width,height,imagePairs,severePairs,labelPairs,outside,directTargets}))));}).catch(e=>{console.error(e);process.exitCode=1;});
