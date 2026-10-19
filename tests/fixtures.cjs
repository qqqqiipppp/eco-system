// Legacy systems are tested independently of progression. Stage 7 browser tests
// use the actual starter inventory and earn unlocks through student interactions.
exports.useUnlockedCards = async page => {
 await page.route('**/js/state/game-state.js',async route=>{
  const response=await route.fetch();
  let body=(await response.text()).replaceAll('\r\n','\n');
  if(process.env.LEGACY_GOALS==='1')body=body.replace('goalRevision=GOAL_REVISION','goalRevision=1');
  body="import {enableDevelopmentPlacement} from '../systems/population.js';\n"+body.replace('return {','const state = {').replace('  };\n}', '  };\n  enableDevelopmentPlacement(state);return state;\n}').replace('acquired: forestDefinition.initialInventory.includes(speciesId)','acquired: true');
  await route.fulfill({response,body});
 });
};
exports.useLegacyGoals=async page=>page.route('**/js/state/game-state.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('goalRevision=GOAL_REVISION','goalRevision=1')});});
// Only test response injection installs this developer module; production has no flag.
async function useDeveloperHarness(page,{species=false}={}) {
 await page.route('**/js/main.js',async route=>{
  const response=await route.fetch();let body=await response.text();
  body="import { installEnvironmentTools } from './dev/environment-tools.js';\n"+body;
  if(species)body="import { installSpeciesTools } from './dev/species-tools.js';\n"+body;
  body=body.replace('// Development harness installs its environment controls at this explicit boundary.',`installEnvironmentTools(gameState,()=>{
    eventSystem.refresh(gameState);stabilitySystem.update(gameState);refreshProgress();renderDashboard(gameState);eventView.render();environmentPanel.render();saveService.schedule();loop.refresh();
  });${species?`installSpeciesTools(gameState,()=>{clearSelection();renderCards(gameState,selectSpecies,openLockedActivity);renderDashboard(gameState);refreshProgress();saveService.schedule();loop.refresh();});`:''}`);
  await route.fulfill({response,body});
 });
}
exports.useDeveloperEnvironment = page => useDeveloperHarness(page);
exports.useDeveloperSpecies = page => useDeveloperHarness(page,{species:true});
exports.dismissWelcome = async page => {
 const dialog=page.locator('#help-dialog');
 if(await dialog.evaluate(node=>node.open))await page.locator('#help-skip').click();
};
