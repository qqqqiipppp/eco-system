const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),phase=process.argv[2]||'after';
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const out=process.env.RESULTS_PATH||path.join(require('node:os').tmpdir(),'forest-background-'+phase+'.json');
const shots=process.env.SCREENSHOT_DIR||path.dirname(out);fs.mkdirSync(shots,{recursive:true});
const sizes=[[1280,800],[1138,712],[960,600],[1366,768],[412,915]];
(async()=>{
 const {world,emptyMemory}=await import('./ecology-fixtures.mjs'),{organisms}=await import('../data/organisms.js');
 const {createGameState}=await import('../js/state/game-state.js'),{createSaveSnapshot}=await import('../js/services/save-format.js');
 const {backgroundHabitatSpaces}=await import('../data/forest-spaces.js');
 const scene=(groups,id)=>world(groups,'background-'+id);
 const initial=scene([['oak',1,.21],['grass',1,.45],['grasshopper',1,.47],['mushroom',1,.7],['soil-bacteria',1,.84]],'B');initial.inventory=createGameState().inventory;
 const dense=scene(organisms.map((o,i)=>[o.id,1,.09+(i%8)*.11]),'G');
 for(let i=0;i<6;i++)dense.organisms.push(...scene([['grass',1,.25+i*.09]],'extra'+i).organisms);
 const scenes=[
  ['A-empty',scene([],'A')],['B-starter',initial],
  ['C-tree-users',scene([['oak',1,.24],['pine',1,.54],['hazel',1,.88],['chipmunk',1,.25],['chipmunk',1,.94],['tit',1,.25],['bulbul',1,.56],['goshawk',1,.94]],'C')],
  ['D-ground',scene([['grass',1,.36],['grasshopper',1,.39],['frog',1,.57],['rabbit',1,.72],['field-mouse',1,.87],['weasel',1,.19]],'D')],
  ['E-litter-soil',scene([['mushroom',1,.2],['litter-mold',1,.4],['soil-bacteria',1,.56],['snail',1,.69],['ladybird',1,.8],['earthworm',1,.9]],'E')],
  ['F-right',scene([['pine',1,.83],['caterpillar',1,.85],['tit',1,.95],['chipmunk',1,.95],['grass',1,.72],['grasshopper',1,.75],['earthworm',1,.92]],'F')],
  ['G-dense',dense]
 ];
 const b=await chromium.launch({channel:'msedge',headless:true});
 const c=await b.newContext({hasTouch:true,reducedMotion:'reduce',viewport:{width:1138,height:712}}),p=await c.newPage();
 const r={stage:'15.12.2',phase,actualS5e:false,actualStudents:false,method:'Identical fixed save snapshots and reduced-motion pause; actual game renderer, view offsets and model positions. QA fixture rights do not change student unlock rules.',scenes:[],errors:[],supports:[]};
 p.on('pageerror',e=>r.errors.push(e.message));p.on('response',v=>{if(v.status()>=400)r.errors.push(v.status()+' '+v.url());});
 await c.addInitScript(()=>{const seed=sessionStorage.getItem('background-next');if(seed){localStorage.setItem('eco-system:forest-save',seed);sessionStorage.removeItem('background-next');}});
 try{
  await p.goto(base);if(await p.locator('#help-dialog').evaluate(d=>d.open))await p.locator('#help-skip').click();
  for(const [name,s]of scenes){
   await p.evaluate(raw=>sessionStorage.setItem('background-next',raw),JSON.stringify(createSaveSnapshot(s,emptyMemory,'2026-10-22T00:00:00Z')));
   await p.reload();await p.locator('.forest-art').evaluate(n=>n.decode());
   await p.locator('.organism-art').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));
   const row={name,views:[]};
   for(const [width,height]of sizes){
    await p.setViewportSize({width,height});await p.locator('.forest').scrollIntoViewIfNeeded();
    const v=await p.evaluate(async()=>{
     const {gameState}=await import('./js/main.js');const f=document.querySelector('#placement-surface').getBoundingClientRect();
     return {width:innerWidth,height:innerHeight,forest:{width:f.width,height:f.height},horizontalOverflow:document.documentElement.scrollWidth>innerWidth,background:{src:document.querySelector('.forest-art').getAttribute('src'),fit:getComputedStyle(document.querySelector('.forest-art')).objectFit},
      models:gameState.organisms.map(o=>({id:o.instanceId,species:o.speciesId,position:o.position})),
      rendered:[...document.querySelectorAll('.organism-object')].map(n=>{const m=new DOMMatrix(getComputedStyle(n).transform),hit=n.querySelector('.organism-hit').getBoundingClientRect();return {id:n.dataset.instanceId,anchor:n.dataset.anchorId,x:m.m41,y:m.m42,hit:{width:hit.width,height:hit.height}};})};
    });
    assert(!v.horizontalOverflow);assert.equal(v.models.length,s.organisms.length);assert(v.rendered.every(n=>n.hit.width>=43.99&&n.hit.height>=43.99));
    assert.equal(v.background.src,'./assets/images/forest.svg');assert.equal(v.background.fit,'fill');
    await p.locator('.forest').screenshot({path:path.join(shots,phase+'-'+name+'-'+width+'.jpg'),type:'jpeg',quality:88});
    if(name==='G-dense')await p.screenshot({path:path.join(shots,phase+'-full-'+width+'.png'),fullPage:true});
    row.views.push(v);
   }
   r.scenes.push(row);
  }
  // SVG geometry is independent of the runtime provider. Test actual drawn
  // branch strokes/trunk fills against its six existing support centers.
  const raw=fs.readFileSync(path.join(root,'assets/images/forest.svg'),'utf8');
  await p.setContent(raw);r.svg=await p.locator('svg').evaluate(n=>({viewBox:n.getAttribute('viewBox'),aspect:n.getAttribute('preserveAspectRatio'),elements:n.querySelectorAll('*').length,filters:n.querySelectorAll('filter,animate,animateTransform,foreignObject,image,script').length}));
  assert.equal(r.svg.viewBox,'0 0 1200 470');assert.equal(r.svg.aspect,'none');assert.equal(r.svg.filters,0);
  const mapped=backgroundHabitatSpaces.filter(a=>['canopy','trunk'].includes(a.zone));
  if(phase==='after'){
   for(const a of mapped){
    const proof=await p.evaluate(a=>{const n=document.getElementById('support-'+a.id),q=new DOMPoint(a.x,a.y);if(!n)return {id:a.id,visible:false};return {id:a.id,visible:true,onWood:a.zone==='canopy'?n.isPointInStroke(q):n.isPointInFill(q),x:a.x,y:a.y};},a);
    r.supports.push(proof);assert(proof.onWood,'anchor must meet drawn wood: '+a.id);
   }
   const before=JSON.parse(fs.readFileSync(process.env.BEFORE_RESULTS_PATH,'utf8'));
   assert.equal(before.scenes.length,r.scenes.length);
   for(let i=0;i<r.scenes.length;i++)assert.deepEqual(r.scenes[i].views,before.scenes[i].views,'same world, geometry and view offsets: '+r.scenes[i].name);
   r.identicalGeometry=true;
  }
  await p.evaluate(mapped=>{const svg=document.querySelector('svg'),ns='http://www.w3.org/2000/svg';for(const a of mapped){const g=document.createElementNS(ns,'g');g.innerHTML='<ellipse cx="'+a.x+'" cy="'+a.y+'" rx="'+a.rx+'" ry="'+a.ry+'" fill="#fffef4" fill-opacity=".3" stroke="#874b47" stroke-dasharray="4 3"/><circle cx="'+a.x+'" cy="'+a.y+'" r="4" fill="#874b47"/><text x="'+(a.x-25)+'" y="'+(a.y-9)+'" fill="#3c3932" font-size="12">'+a.id+'</text>';svg.append(g);}},mapped);
  await p.setViewportSize({width:1200,height:470});await p.locator('svg').evaluate(n=>n.setAttribute('style','width:1200px;height:470px;display:block'));await p.evaluate(()=>{document.body.style.margin='0'});
  await p.screenshot({path:path.join(shots,phase+'-anchor-map.png')});
  assert.deepEqual(r.errors,[]);r.completed=true;fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');
  console.log('PASS '+phase+':7 identical scenes x5 viewports; '+r.supports.length+' drawn supports; original geometry'+(r.identicalGeometry?' exactly preserved':''));
 }catch(e){fs.writeFileSync(out,JSON.stringify({...r,failure:String(e)},null,2));throw e;}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
