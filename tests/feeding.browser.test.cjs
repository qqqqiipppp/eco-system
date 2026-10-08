const { dismissWelcome } = require('./fixtures.cjs');
const { useUnlockedCards } = require('./fixtures.cjs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  const results = [];
  async function runScenario(name, counts) {
    const page = await browser.newPage({ viewport: { width: 1138, height: 712 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
    // Test fixture only: start an empty forest, then use real cards and touch.
    await page.route('**/data/forest.js', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/initialOrganisms: \[[\s\S]*?\],/, 'initialOrganisms: [],');
      await route.fulfill({ response, body });
    });
    await useUnlockedCards(page);
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', { waitUntil: 'networkidle' }); await dismissWelcome(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const snapshot = () => page.evaluate(async () => {
      const { gameState, feedingSystem } = await import('./js/main.js');
      return { organisms: structuredClone(gameState.organisms), stats: feedingSystem.getDiagnostics(), metrics: structuredClone(gameState.metrics) };
    });
    for (const [species, count] of Object.entries(counts)) {
      await page.locator(`.organism-card[data-species-id="${species}"]`).tap();
      for (let i = 0; i < count; i++) {
        const box = await page.locator('#placement-surface').boundingBox();
        const x = 0.18 + (i % 7) * 0.07;
        const y = species === 'grass' ? 0.74 : 0.69;
        await page.touchscreen.tap(box.x + box.width * x, box.y + box.height * y);
      }
    }
    const initial = await snapshot();
    assert.equal(initial.organisms.length, Object.values(counts).reduce((sum, count) => sum + count, 0));
    assert.equal(await page.locator('.organism-debug').count(), 0);
    await page.evaluate(() => {
      window.stage3Nodes = new Map([...document.querySelectorAll('.organism-object')].map(node => [node.dataset.instanceId, node]));
      window.stage3Changes = { added: 0, removed: 0, reads: 0, eatingSeen: false, feedbackSeen: false };
      const bounds = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () { window.stage3Changes.reads++; return bounds.call(this); };
      new MutationObserver(records => {
        for (const record of records) {
          window.stage3Changes.added += [...record.addedNodes].filter(node=>node.classList?.contains('organism-object')).length;
          window.stage3Changes.removed += [...record.removedNodes].filter(node=>node.classList?.contains('organism-object')).length;
        }
      }).observe(document.querySelector('#organism-layer'), { childList: true, subtree: true });
      new MutationObserver(() => {
        if (document.querySelector('.is-eating')) window.stage3Changes.eatingSeen = true;
      }).observe(document.querySelector('#organism-layer'), { attributes: true, subtree: true, attributeFilter: ['class'] });
      new MutationObserver(() => {
        if (document.querySelector('#placement-feedback').textContent.includes('먹었어요')) window.stage3Changes.feedbackSeen = true;
      }).observe(document.querySelector('#placement-feedback'), { childList: true });
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // One bounded polling loop in the test harness, not a game loop.
    let current;
    for (let attempt = 0; attempt < 80; attempt++) {
      await page.waitForTimeout(500);
      current = await snapshot();
      if (name === 'A' && current.stats.plantMeals >= 1) break;
      if (name === 'B' && current.stats.predations >= 1) break;
      if ((name === 'C' || name === 'D') && current.organisms.every(item => item.foodShortageDuration >= 2)) break;
      if (name === 'E' && current.stats.ticks >= 28 && current.stats.plantMeals > 0 && current.stats.predations > 0) break;
    }
    if (name === 'A') {
      assert(current.stats.plantMeals > 0);
      assert.equal(current.organisms.filter(item => item.speciesId === 'grass').length, 3);
      assert(current.organisms.some(item => item.speciesId === 'grass' && item.foodStock < 3));
      assert(current.organisms.some(item => item.lastSuccessfulFeedingAt > 0 && item.hunger < 0.6));
    } else if (name === 'B') {
      assert(current.stats.predations > 0);
      assert(current.organisms.filter(item => item.speciesId === 'grasshopper').length < 3);
      assert(current.organisms.find(item => item.speciesId === 'frog').lastSuccessfulFeedingAt > 0);
      assert(current.organisms.find(item => item.speciesId === 'frog').hunger < 0.6);
    } else if (name === 'C' || name === 'D') {
      assert.equal(current.organisms.length, 2);
      assert(current.organisms.every(item => item.foodShortageDuration >= 2 && item.lastSuccessfulFeedingAt === null));
    } else {
      assert(current.stats.ticks >= 28);
      assert(current.stats.plantMeals > 0 && current.stats.predations > 0);
      assert(current.stats.searches < current.stats.ticks * 20);
    }
    const rendering = await page.evaluate(() => ({
      ...window.stage3Changes,
      stableSurvivors: [...document.querySelectorAll('.organism-object')].every(node => window.stage3Nodes.get(node.dataset.instanceId) === node),
      count: document.querySelectorAll('.organism-object').length,
    }));
    assert.equal(rendering.added, 0);
    assert.equal(rendering.removed, current.stats.predations);
    assert.equal(rendering.reads, 0);
    assert.equal(rendering.stableSurvivors, true);
    assert.equal(rendering.count, current.organisms.length);
    if (name === 'A' || name === 'B' || name === 'E') {
      assert(rendering.eatingSeen && rendering.feedbackSeen);
    }
    assert.equal(current.metrics.points, 0); assert(Number.isFinite(current.metrics.stability));
    // Hidden signal freezes hunger, stock, motion and low-frequency tick together.
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hidden = await snapshot();
    await page.waitForTimeout(550);
    assert.deepEqual(await snapshot(), hidden);
    await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(600);
    assert((await snapshot()).stats.ticks > hidden.stats.ticks);
    assert.deepEqual(errors, []);
    results.push({ scenario: name, initial: initial.organisms.length, remaining: current.organisms.length, ...current.stats, rendering });
    console.log(JSON.stringify(results.at(-1)));
    if (name === 'B' && process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
    await page.close();
  }
  try {
    for (const [name, counts] of [
      ['A', { grass: 3, grasshopper: 2 }],
      ['B', { grass: 3, grasshopper: 3, frog: 1 }],
      ['C', { grasshopper: 2 }],
      ['D', { frog: 2 }],
      ['E', { grass: 10, grasshopper: 14, frog: 6 }],
    ]) {
      if (!process.env.SCENARIO || process.env.SCENARIO === name) await runScenario(name, counts);
    }
    console.log('PASS: A–E real touch, feeding, state mutation, DOM removal, no rebuild/layout polling, hidden pause and resume.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
