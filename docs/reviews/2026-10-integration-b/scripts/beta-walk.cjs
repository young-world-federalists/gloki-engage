// S46 beta walk (VITE_APP_MODE=beta build) at 360px, light + dark, against node-stub.cjs.
// Doors → own server → create key → save key → account kind → profile → ready → forum post
// with byline → reload (returning visitor) → profile shows the account kind.
// Usage: SHOTS=dir node beta-walk.cjs [baseUrl] [stubUrl]
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:4174/gloki-engage';
const STUB = process.argv[3] || 'http://localhost:3011';

(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, colorScheme: scheme });
    const page = await ctx.newPage();
    const errors = [];
    const failed = new Set();
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 160)));
    page.on('requestfailed', (r) => failed.add(new URL(r.url()).host));
    const steps = [];
    const snap = async (label, extra = {}) => {
      await page.waitForTimeout(900);
      const s = await page.evaluate(() => ({
        path: location.pathname,
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        main: !!document.querySelector('main'),
      }));
      await page.screenshot({ path: path.join(process.env.SHOTS, scheme, 'beta-' + label.replace(/[^a-z0-9]+/gi, '-') + '.png') });
      steps.push({ label, ...s, ...extra });
    };
    const click = async (re) => { await page.locator('button').filter({ hasText: re }).first().click(); };
    const name = `Walker ${scheme}`;
    const postText = `Integration walk post (${scheme}) — hello from the beta.`;

    await page.goto(BASE + '/'); await snap('doors');
    await click(/Join as a person/); await snap('your key');
    await click(/Choose a different server/);
    await page.fill('#serverUrl', STUB);
    await click(/Create my key/); await snap('save your key');
    await page.locator('input[type=checkbox]').first().check();
    await click(/^Continue$/); await snap('account kind', {
      personPreselected: await page.locator('[aria-checked="true"], [aria-pressed="true"], input:checked').count(),
    });
    await click(/^Continue$/); await snap('profile');
    await page.fill('#agent-name', name);
    await click(/Select your country/);
    await page.fill('input[placeholder="Search..."]', 'Kenya');
    await page.locator('button, li, [role=option]').filter({ hasText: /^.{0,6}Kenya$/ }).first().click();
    await click(/^Continue$/); await page.waitForTimeout(1200); await snap('ready');
    await click(/Open the forum/); await snap('forum');
    await page.fill('textarea', postText);
    await click(/^Post$/); await page.waitForTimeout(1200);
    const post = page.locator('article, li, [class*="comment" i]').filter({ hasText: postText }).first();
    await snap('forum after post', {
      postShown: await post.count() > 0,
      bylineName: (await post.count()) ? (await post.textContent()).includes(name) : false,
    });
    await page.goto(BASE + '/'); await page.waitForTimeout(1500); await snap('returning root');
    await page.goto(BASE + '/identity/profile'); await snap('profile page', {
      kindShown: (await page.locator('main').textContent()).includes('Person'),
      nameShown: (await page.locator('main').textContent()).includes(name),
    });
    await page.reload(); await snap('profile after reload', {
      kindShown: (await page.locator('main').textContent()).includes('Person'),
    });
    report[scheme] = { steps, errors, failedHosts: [...failed] };
    await ctx.close();
  }
  report.stubLog = await (await fetch(STUB + '/__log')).json();
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})();
