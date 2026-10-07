const { useUnlockedCards } = require('./fixtures.cjs');
// Requires Playwright and a local static server; no application dependencies.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      const pending = new Set();
      window.loopStats = { callbacks: 0, maxPending: 0, reads: 0 };
      window.requestAnimationFrame = callback => {
        const id = request(time => { pending.delete(id); window.loopStats.callbacks++; callback(time); });
        pending.add(id);
        window.loopStats.maxPending = Math.max(window.loopStats.maxPending, pending.size);
        return id;
      };
      window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
      const bounds = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () { window.loopStats.reads++; return bounds.call(this); };
    });
    await useUnlockedCards(page);
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080/', { waitUntil: 'networkidle' });
    const state = () => page.evaluate(async () => structuredClone((await import('./js/main.js')).gameState));
    const count = async () => (await state()).organisms.length;
    const choose = id => page.locator(`.organism-card[data-species-id="${id}"]`).tap();
    const tap = async (x, y) => {
      const box = await page.locator('#placement-surface').boundingBox();
      await page.touchscreen.tap(box.x + x * box.width, box.y + y * box.height);
    };
    assert.equal(await count(), 3);
    assert.equal(await page.locator('.organism-object').count(), 3);
    assert.equal(await page.locator('.organism-card').count(), 6);
    assert.match(await page.locator('.organism-card[data-species-id="oak"]').textContent(), /상수리나무/);
    assert.equal(await page.evaluate(() => window.loopStats.callbacks), 0);

    // Locked cards remain visible with a hint; fixture reload restores unlocked regression setup.
    await page.evaluate(async () => {
      const { gameState } = await import('./js/main.js');
      gameState.inventory.find(item => item.speciesId === 'rabbit').acquired = false;
      (await import('./js/ui/render.js')).renderCards(gameState, () => {});
    });
    assert.equal(await page.locator('.organism-card').count(), 6);
    assert.equal(await page.locator('.organism-card[data-species-id="rabbit"]').getAttribute('data-locked'), 'true');
    await page.reload({ waitUntil: 'networkidle' });

    await tap(0.4, 0.72);
    assert.equal(await count(), 3);
    assert.match(await page.locator('#placement-feedback').textContent(), /먼저/);
    await choose('oak');
    assert.equal(await page.locator('.organism-card[aria-pressed="true"]').count(), 1);
    await tap(0.25, 0.72);
    assert.equal(await count(), 3);
    assert.match(await page.locator('#placement-feedback').textContent(), /가까워요/);
    await tap(0.4, 0.30);
    assert.equal(await count(), 3);
    assert.match(await page.locator('#placement-feedback').textContent(), /배치할 수 없어요/);
    await page.locator('.observation').tap();
    await page.locator('.dashboard').tap();
    await page.locator('.inventory-note').tap();
    assert.equal(await count(), 3);
    await tap(0.4, 0.72);
    assert.equal(await count(), 4);
    assert.equal((await state()).organisms.at(-1).speciesId, 'oak');
    assert.equal((await state()).inventory.length, 6);
    await tap(0.081, 0.73);
    assert.equal(await count(), 5);
    assert.equal(await page.locator('.organism-card[data-species-id="oak"]').getAttribute('aria-pressed'), 'true');

    const plants = (await state()).organisms;
    await choose('rabbit');
    await tap(0.44, 0.64);
    await tap(0.61, 0.68);
    assert.equal(await count(), 7);
    const beforeMove = (await state()).organisms.filter(item => item.speciesId === 'rabbit');
    await page.waitForTimeout(2200);
    assert.notDeepEqual((await state()).organisms.filter(item => item.speciesId === 'rabbit'), beforeMove);
    assert.deepEqual((await state()).organisms.filter(item => item.speciesId !== 'rabbit'), plants);

    // Pause actual scheduler through the visibility API signal; no hidden catch-up.
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hiddenState = await state();
    const hiddenCallbacks = await page.evaluate(() => window.loopStats.callbacks);
    await page.waitForTimeout(600);
    assert.deepEqual(await state(), hiddenState);
    assert.equal(await page.evaluate(() => window.loopStats.callbacks), hiddenCallbacks);

    for (const [width, height] of [[1138, 712], [1024, 768], [960, 600], [800, 1280], [412, 915], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(100);
      assert.deepEqual(await state(), hiddenState);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width >= 960) assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false);
      assert.equal(await page.evaluate(() => {
        const layer = document.querySelector('#organism-layer').getBoundingClientRect();
        return [...document.querySelectorAll('.organism-visual')].every(node => {
          const rect = node.getBoundingClientRect();
          return rect.left >= layer.left && rect.right <= layer.right && rect.top >= layer.top && rect.bottom <= layer.bottom;
        });
      }), true);
    }
    await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
    // Fill to 30 using the real touch path, including many rabbits.
    for (let attempts = 0; attempts < 30 && await count() < 30; attempts += 1) {
      const i = await count();
      await tap(0.12 + (i % 9) * 0.06, 0.64 + (i % 3) * 0.035);
    }
    await tap(0.4, 0.72);
    assert.equal(await count(), 30);
    assert.match(await page.locator('#placement-feedback').textContent(), /30개/);
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      window.savedNodes = [...document.querySelectorAll('.organism-object')];
      window.childChanges = 0;
      new MutationObserver(records => { window.childChanges += records.length; }).observe(document.querySelector('#organism-layer'), { childList: true, subtree: true });
      window.loopStats.reads = 0;
    });
    await page.waitForTimeout(2200);
    const perf = await page.evaluate(() => ({
      stableNodes: window.savedNodes.every((node, i) => node === document.querySelectorAll('.organism-object')[i]),
      childChanges: window.childChanges, ...window.loopStats,
    }));
    assert.equal(perf.stableNodes, true);
    assert.equal(perf.childChanges, 0);
    assert.equal(perf.reads, 0);
    assert.equal(perf.maxPending, 1);
    for (const organism of (await state()).organisms) {
      const expectedKeys = organism.speciesId === 'grass' ? ['foodStock', 'growth', 'instanceId', 'position', 'speciesId'] : organism.speciesId === 'oak' ? ['growth', 'instanceId', 'position', 'speciesId'] : ['instanceId', 'position', 'speciesId'];
      assert.deepEqual(Object.keys(organism).sort(), expectedKeys);
      assert(organism.position.x >= 0 && organism.position.x <= 1 && organism.position.y >= 0 && organism.position.y <= 1);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedState = await state();
    await page.waitForTimeout(150);
    assert.deepEqual(await state(), reducedState);
    assert.equal(await page.locator('.organism-object').count(), 30);
    assert.equal((await state()).metrics.points, 0); assert(Number.isFinite((await state()).metrics.stability));
    console.log('30-object structure:', JSON.stringify(perf));
    if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
    await page.reload({ waitUntil: 'networkidle' });
    await choose('mushroom');
    await page.locator('#placement-surface').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    assert.equal(await count(), 4);
    assert.equal((await state()).organisms.at(-1).speciesId, 'mushroom');
    assert.deepEqual(errors, []);
    console.log('PASS: acquired cards, touch placement, state contract, UI/area/spacing rejection, repeated species, wander, pause/resume, resizing, cap, stable DOM, one loop, reduced motion, keyboard.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
