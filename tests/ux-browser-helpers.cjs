// Updated UI navigation for legacy ecology integration tests. Opens only the
// requested optional section with a real click; never changes simulation state.
exports.reveal=async(page,selector)=>{
 const target=page.locator(selector).first();
 for(let i=0;i<5&&!await target.isVisible();i++){
  const summary=page.locator('details:not([open]):has('+selector+') > summary').first();
  if(!await summary.count())break;await summary.click();
 }
};
// Placement tests target actual background. Existing organism buttons remain
// inspectable even while a card is selected; never dispatch through a button.
exports.tapBackground=async(page,x,y)=>{
 await page.locator('#placement-surface').scrollIntoViewIfNeeded();
 const point=await page.locator('#placement-surface').evaluate((surface,{x,y})=>{
  const r=surface.getBoundingClientRect(),candidates=[];
  for(const dy of [0,-12,12,-28,28,-52,52,-90,90,-140])for(const dx of [0,-12,12,-28,28,-52,52]){
   const px=Math.round(Math.max(r.left+3,Math.min(r.right-3,r.left+x*r.width+dx))),py=Math.round(Math.max(r.top+3,Math.min(r.bottom-3,r.top+y*r.height+dy)));
   if([[0,0],[-2,0],[2,0],[0,-2],[0,2]].every(([dx,dy])=>document.elementFromPoint(px+dx,py+dy)===surface))candidates.push({x:px,y:py,d:Math.hypot(dx,dy)});
  }candidates.sort((a,b)=>a.d-b.d);return candidates[0];
 },{x,y});
 // Whole-forest input also permits sky/soil at the same requested x. Dense
 // tree/animal hit boxes can cover the ground; never click through a creature.
 const fallback=point||await page.locator('#placement-surface').evaluate((surface,x)=>{const r=surface.getBoundingClientRect();for(const y of [.12,.22,.35,.48,.9]){const p={x:Math.round(r.left+r.width*x),y:Math.round(r.top+r.height*y)};if([[0,0],[-2,0],[2,0],[0,-2],[0,2]].every(([dx,dy])=>document.elementFromPoint(p.x+dx,p.y+dy)===surface))return p;}return null;},x);
 if(!fallback)throw Error('No background touch target near '+x+','+y+'; '+await page.evaluate(()=>JSON.stringify({dialogs:[...document.querySelectorAll('dialog[open]')].map(n=>n.id),scrollY,viewport:[innerWidth,innerHeight]})));
 await page.touchscreen.tap(fallback.x,fallback.y);
 return {...fallback,normalized:await page.locator('#placement-surface').evaluate((surface,point)=>{const r=surface.getBoundingClientRect();return {x:(point.x-r.left)/r.width,y:(point.y-r.top)/r.height};},fallback)};
};
// Stage15.11.6 intentionally permits vertical reading scroll. Check the actual
// replacement requirement: no horizontal page overflow, no clipped forest/footer,
// and the full pre-change forest area, rather than accepting arbitrary overflow.
exports.assertReadablePage=async page=>{
 const assert=require('node:assert/strict');
 const v=await page.evaluate(()=>{const f=document.querySelector('#placement-surface').getBoundingClientRect(),end=document.querySelector('.game-footer').getBoundingClientRect();return {width:innerWidth,height:innerHeight,horizontal:document.documentElement.scrollWidth>innerWidth,documentHeight:document.documentElement.scrollHeight,footerEnd:end.bottom+scrollY,forestHeight:f.height,overflowY:getComputedStyle(document.body).overflowY};});
 const floors={'1280x800':333,'1138x712':247,'960x600':224,'1366x768':301,'412x915':378};
 assert(!v.horizontal);assert(v.forestHeight>=(floors[v.width+'x'+v.height]||200)-.1);assert(v.footerEnd<=v.documentHeight+1);assert(v.documentHeight<=v.height*2);assert.notEqual(v.overflowY,'hidden');return v;
};
