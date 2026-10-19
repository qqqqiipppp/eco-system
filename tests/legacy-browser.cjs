// Run the pre15.10 browser scenarios as existing-goal forests. New policy tests
// use the real unmodified responses and never load this compatibility adapter.
require('node:module').register('./legacy-goal-loader.mjs',require('node:url').pathToFileURL(__filename));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{const browser=await launch(...args),newContext=browser.newContext.bind(browser);browser.newContext=async(...args)=>{const context=await newContext(...args);await context.route('**/js/state/game-state.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('goalRevision=GOAL_REVISION','goalRevision=1')});});return context;};return browser;};
