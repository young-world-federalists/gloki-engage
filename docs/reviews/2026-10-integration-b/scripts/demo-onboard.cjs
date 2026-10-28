// S46: demo-build onboarding, direct entry + ?invite=, for a fresh key on the stub.
const { chromium } = require('playwright');
const BASE = 'http://localhost:4173/gloki-engage';
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const variant of ['direct', 'invite']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 800 } });
    const key = Array.from({ length: 64 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
    await ctx.addInitScript((k) => { if (!localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify({ publicKey: k, serverUrl: 'http://localhost:3011' })); }, key);
    const p = await ctx.newPage(); const errors = []; const seen = [];
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
    const h1 = async () => { await p.waitForTimeout(900); const v = await p.evaluate(() => [location.pathname + location.search, [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()).join('|')]); seen.push(v.join('  ')); };
    const click = (re) => p.locator('button').filter({ hasText: re }).first().click();
    await p.goto(BASE + (variant === 'invite' ? '/welcome?invite=AMARA' : '/')); await h1();
    if (variant === 'invite') { for (let i = 0; i < 3; i++) { await click(/Continue|Next|Get started|Accept/); await h1(); } }
    await p.fill('#agent-name', 'Demo ' + variant);
    await click(/Select your country/); await p.fill('input[placeholder="Search..."]', 'Kenya');
    await p.locator('button, li, [role=option]').filter({ hasText: /^.{0,6}Kenya$/ }).first().click();
    await click(/^Continue$/); await h1();
    await click(/agree/i); await h1();
    const nudge = await p.locator('main').textContent();
    out[variant] = { seen, errors, consentNudgeShown: nudge.includes('You skipped the community promises') };
    await p.goto(BASE + '/'); await h1();
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
