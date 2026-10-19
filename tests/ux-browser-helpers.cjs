// Updated UI navigation for legacy ecology integration tests. Opens only the
// requested optional section with a real click; never changes simulation state.
exports.reveal=async(page,selector)=>{
 const target=page.locator(selector).first();
 for(let i=0;i<5&&!await target.isVisible();i++){
  const summary=page.locator('details:not([open]):has('+selector+') > summary').first();
  if(!await summary.count())break;await summary.click();
 }
};
