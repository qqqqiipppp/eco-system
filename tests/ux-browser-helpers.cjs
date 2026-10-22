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
 const point=await page.locator('#placement-surface').evaluate((surface,{x,y})=>{
  const r=surface.getBoundingClientRect(),candidates=[];
  for(const dy of [0,-12,12,-28,28,-52,52,-90,90,-140])for(const dx of [0,-12,12,-28,28,-52,52]){
   const px=Math.max(r.left+2,Math.min(r.right-2,r.left+x*r.width+dx)),py=Math.max(r.top+2,Math.min(r.bottom-2,r.top+y*r.height+dy));
   if(document.elementFromPoint(px,py)===surface)candidates.push({x:px,y:py,d:Math.hypot(dx,dy)});
  }candidates.sort((a,b)=>a.d-b.d);return candidates[0];
 },{x,y});
 if(!point)throw Error('No background touch target near '+x+','+y);
 await page.touchscreen.tap(point.x,point.y);
};
