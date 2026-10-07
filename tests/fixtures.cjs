// Legacy systems are tested independently of progression. Stage 7 browser tests
// use the actual starter inventory and earn unlocks through student interactions.
exports.useUnlockedCards = async page => {
 await page.route('**/js/state/game-state.js',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:(await response.text()).replace('acquired: forestDefinition.initialInventory.includes(speciesId)','acquired: true')});
 });
};
