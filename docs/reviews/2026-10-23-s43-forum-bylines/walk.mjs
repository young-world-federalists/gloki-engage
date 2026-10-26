// Needs `playwright-core` (not a project dependency): `npm i playwright-core` in a scratch folder, then
// `node walk.mjs <output-dir>` with `VITE_APP_MODE=beta vite` serving :5173 and Chromium 1194 at /opt/pw-browsers.
// S43 preview walk — 360px, light + dark, against VITE_APP_MODE=beta vite on :5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const KEY = 'a'.repeat(64);
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });

async function walk(theme) {
  const tag = (s) => `[${theme}] ${s}`;
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, colorScheme: theme });
  const errors = []; const warnings = [];
  ctx.on('page', (p) => {
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
    p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  });
  // Seed once per key: signed-in, onboarded, kind = person. `gloki.theme` pins the theme before first paint.
  await ctx.addInitScript(({ theme, KEY }) => {
    // Init scripts also run on Playwright's about:blank, where localStorage throws; that is the harness, not the app.
    let ls; try { ls = window.localStorage; } catch { return; }
    const seed = (k, v) => { if (!ls.getItem(k)) ls.setItem(k, v); };
    seed('gloki.theme', theme);
    seed('user', JSON.stringify({ publicKey: KEY, serverUrl: 'https://gdi.gloki.contact' }));
    seed('gloki.digitalAgent', JSON.stringify({ displayName: 'Walk Tester', photo: '', country: 'KE', languages: ['en'], createdAt: Date.now(), vouchedBy: [], consentedAt: Date.now(), accountKind: 'person' }));
    seed('gloki.onboarding', JSON.stringify({ step: 6, completed: true }));
  }, { theme, KEY });
  const page = await ctx.newPage();
  const shot = async (name, bottom = false) => {
    await page.screenshot({ path: `${OUT}/${theme}-${name}.png` });
    if (bottom) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(200); await page.screenshot({ path: `${OUT}/${theme}-${name}-bottom.png` }); await page.evaluate(() => window.scrollTo(0, 0)); }
    log(tag(`shot ${name}${bottom ? ' (+bottom)' : ''}  url=${new URL(page.url()).pathname}`));
  };
  const h1 = async (where) => { const t = await page.locator('h1').allTextContents(); log(tag(`h1 @ ${where}: ${t.length === 1 ? 'OK' : 'FAIL'} ${JSON.stringify(t)}`)); };

  // 1. Forum opens with the seeded welcome post, named + flagged.
  await page.goto(BASE + '/forum');
  await page.getByText('Welcome to the Gloki forum').waitFor({ timeout: 15000 });
  await page.getByText('Priya Nair').waitFor({ timeout: 15000 });
  await h1('forum');
  const welcome = page.locator('article, li, div').filter({ hasText: 'Welcome to the Gloki forum' }).filter({ has: page.getByText('Priya Nair') }).last();
  const flagLabel = await welcome.locator('[aria-label*="India"], [title*="India"], img[alt*="India"]').first().getAttribute('aria-label').catch(() => null);
  const bylineText = await page.locator('text=Priya Nair').first().evaluate((el) => el.closest('[class*="commentHeader"]')?.textContent ?? el.parentElement?.textContent ?? '');
  log(tag(`welcome byline: "${bylineText.trim()}"  flag=${flagLabel ?? (bylineText.includes('🇮🇳') ? 'emoji 🇮🇳' : 'MISSING')}`));
  const rawKey = await page.getByText(/demo-use…/).count();
  log(tag(`truncated-key bylines on screen: ${rawKey} ${rawKey === 0 ? 'OK' : 'FAIL'}`));
  await shot('01-forum-welcome');

  // 2. Own post → "You".
  await page.getByPlaceholder('What do you want to say?').fill('Hello from the walk. Posting as the signed-in user.');
  await page.getByRole('button', { name: 'Post', exact: true }).click();
  await page.getByText('Hello from the walk').waitFor();
  const youCount = await page.getByText('You', { exact: true }).count();
  log(tag(`own post byline "You": ${youCount >= 1 ? 'OK' : 'FAIL'} (${youCount})`));
  await shot('02-forum-own-post');

  // 3. Reply under the welcome post.
  const welcomeNode = page.locator('[class*="commentBody"]').filter({ hasText: 'Welcome to the Gloki forum' }).first();
  await welcomeNode.getByRole('button', { name: 'Reply' }).click();
  const replyBox = page.getByPlaceholder(/Reply to Priya Nair/);
  await replyBox.waitFor();
  await replyBox.fill('Hello Priya, writing from Nairobi.');
  const composer = page.locator('[class*="composeBox"]').filter({ has: replyBox });
  await composer.locator('[class*="btnSubmit"]').click();
  await page.locator('p', { hasText: 'Hello Priya, writing from Nairobi.' }).waitFor();
  const nested = await page.locator('p', { hasText: 'Hello Priya, writing from Nairobi.' }).evaluate((el) => {
    const item = el.closest('[class*="commentItem"]');
    const inChildrenOfWelcome = !!el.closest('[class*="children"]')?.parentElement?.textContent?.includes('Welcome to the Gloki forum');
    return { nested: !!item && /nested/.test(item.className), inChildrenOfWelcome };
  });
  log(tag(`reply nested under welcome post: ${nested.nested && nested.inChildrenOfWelcome ? 'OK' : 'FAIL'} ${JSON.stringify(nested)}`));
  const youBylines = await page.getByText('You', { exact: true }).count();
  log(tag(`reply byline "You": ${youBylines >= 2 ? 'OK' : 'FAIL'} (${youBylines} own bylines)`));
  await shot('03-forum-reply', true);

  // 4. Profile: kind badge, change it from the edit modal, reflected on the card.
  await page.goto(BASE + '/identity/profile');
  await page.getByText('Walk Tester').waitFor();
  await h1('profile');
  const before = await page.getByText('Person', { exact: true }).count();
  log(tag(`kind badge before: ${before >= 1 ? 'OK Person' : 'FAIL'}`));
  await shot('04-profile-kind-person');
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.locator('#edit-kind').waitFor();
  await page.waitForTimeout(500); // let the modal's fade-in settle before the capture
  await shot('05-profile-edit-kind');
  await page.locator('#edit-kind').selectOption('organisation');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByText('Organisation', { exact: true }).waitFor();
  log(tag(`kind badge after save: OK Organisation`));
  await page.reload();
  await page.getByText('Organisation', { exact: true }).waitFor();
  log(tag(`kind survives reload: OK`));
  await shot('06-profile-kind-organisation');

  // 5. About / Contact back → "/" (signed in → /forum).
  for (const leaf of ['about', 'contact']) {
    await page.goto(BASE + `/identity/${leaf}`);
    await page.waitForLoadState('networkidle');
    const back = page.getByRole('button', { name: /back/i }).first();
    await back.click();
    await page.waitForURL(/\/forum$/, { timeout: 10000 });
    log(tag(`${leaf} back → ${new URL(page.url()).pathname} OK`));
  }

  const realA = errors.filter((e) => !/ERR_TUNNEL_CONNECTION_FAILED/.test(e));
  log(tag(`console errors (signed-in walk): ${errors.length} (known SSE tunnel: ${errors.length - realA.length}, other: ${realA.length})`));
  for (const e of realA) log(tag(`  ERROR ${e}`));
  log(tag(`console warnings (signed-in walk): ${warnings.length}`));
  for (const w of warnings) log(tag(`  WARN ${w}`));
  await ctx.close();
  await walkSignedOut(theme);
}

async function walkSignedOut(theme) {
  const tag = (s) => `[${theme}] ${s}`;
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, colorScheme: theme });
  const errors = []; const warnings = [];
  ctx.on('page', (p) => {
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
    p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  });
  await ctx.addInitScript((theme) => { let ls; try { ls = window.localStorage; } catch { return; } if (!ls.getItem('gloki.theme')) ls.setItem('gloki.theme', theme); }, theme);
  const page = await ctx.newPage();
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${theme}-${name}.png` }); log(tag(`shot ${name}  url=${new URL(page.url()).pathname}`)); };
  const h1 = async (where) => { const t = await page.locator('h1').allTextContents(); log(tag(`h1 @ ${where}: ${t.length === 1 ? 'OK' : 'FAIL'} ${JSON.stringify(t)}`)); };

  // 6. Keys screen hint (signed out).
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'I already have a key' }).click();
  await page.getByText(/64-character code/).waitFor();
  const hint = await page.getByText(/64-character code/).textContent();
  log(tag(`keys hint: "${hint.trim()}" ${/every community/.test(hint) ? 'FAIL' : 'OK'}`));
  await h1('keys');
  await shot('07-keys-hint');

  // 7. Kind step lead (fresh onboarding).
  await page.evaluate(() => { localStorage.setItem('user', JSON.stringify({ publicKey: 'b'.repeat(64), serverUrl: 'https://gdi.gloki.contact' })); });
  await page.goto(BASE + '/welcome');
  await page.getByRole('checkbox').waitFor();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Who is this account for?').waitFor();
  const kindLead = await page.getByText(/change it later from your profile/).count();
  log(tag(`kind lead mentions the profile: ${kindLead ? 'OK' : 'not on this step — ' + (await page.locator('h1').allTextContents()).join()}`));
  if (kindLead) await shot('08-kind-lead');

  const real = errors.filter((e) => !/ERR_TUNNEL_CONNECTION_FAILED/.test(e));
  log(tag(`console errors (signed-out walk): ${errors.length} (known SSE tunnel: ${errors.length - real.length}, other: ${real.length})`));
  for (const e of real) log(tag(`  ERROR ${e}`));
  log(tag(`console warnings (signed-out walk): ${warnings.length}`));
  for (const w of warnings) log(tag(`  WARN ${w}`));
  await ctx.close();
}

for (const theme of ['light', 'dark']) await walk(theme);
await browser.close();
