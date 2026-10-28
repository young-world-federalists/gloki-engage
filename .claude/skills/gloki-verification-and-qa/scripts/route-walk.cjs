// Demo route walk at 360px, light + dark (S45). Prints JSON: per-step path, h1s, overflow, main,
// plus console errors and failed hosts. Diff two runs (old vs new deps) with the ids stripped.
// Usage: node route-walk.cjs [baseUrl]   (default http://localhost:5173; start Vite with
// `node node_modules/vite/bin/vite.js`, not npx, so killing its PID really stops it)
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:5173';

const snap = (page) => page.evaluate(() => JSON.stringify({
  path: location.pathname,
  h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()).slice(0, 2),
  overflow: document.documentElement.scrollWidth > window.innerWidth,
  main: !!document.querySelector('main'),
}));

(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, colorScheme: scheme });
    await ctx.addInitScript(() => {
      if (!localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify({ publicKey: 'a'.repeat(64), serverUrl: 'https://gdi.gloki.contact' }));
      }
    });
    const page = await ctx.newPage();
    const errors = [];
    const failed = new Set();
    page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL/.test(m.text())) errors.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 160)));
    page.on('requestfailed', (r) => failed.add(new URL(r.url()).host));
    const steps = [];
    const go = async (label, fn) => { await fn(); await page.waitForTimeout(1500); steps.push({ label, ...JSON.parse(await snap(page)) }); };

    await go('home', () => page.goto(BASE + '/'));
    await go('stage/discussion', () => page.goto(BASE + '/stage/discussion'));
    await go('communities', () => page.goto(BASE + '/identity/communities'));
    await go('click community', () => page.locator('[role="button"][aria-label^="Open "]').first().click());
    const community = await page.evaluate(() => location.pathname);
    for (const sub of ['members', 'chat', 'currency', 'collab']) {
      await go('community/' + sub, () => page.goto(BASE + community + '/' + sub));
    }
    await go('history.back', () => page.goBack());
    await go('community feed', () => page.goto(BASE + community));
    // First initiative entry point the feed offers (ActivityCard navigates on click).
    const expanders = page.locator('main button[aria-expanded]');
    if (await expanders.count()) {
      await expanders.first().click();
      await page.waitForTimeout(1000);
      await go('Causes (initiative)', () => page.locator('main button:has-text("Causes")').first().click());
      const init = await page.evaluate(() => location.pathname);
      if (init.startsWith('/initiative/')) {
        const dash = init.replace(/\/(discussion|causes)$/, '');
        await go('initiative dash', () => page.goto(BASE + dash));
        await go('back', () => page.goBack());
      }
      await go('community feed again', () => page.goto(BASE + community));
      await page.locator('main button[aria-expanded]').first().click();
      await page.waitForTimeout(1000);
      await go('published mandate', () => page.locator('main button:has-text("View the published mandate")').first().click());
    } else steps.push({ label: 'NO expander', path: '', h1: [] });
    await go('unknown route', () => page.goto(BASE + '/no-such-page'));
    await go('identity/profile', () => page.goto(BASE + '/identity/profile'));
    report[scheme] = { steps, errors, failedHosts: [...failed] };
    await ctx.close();
  }
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})();
