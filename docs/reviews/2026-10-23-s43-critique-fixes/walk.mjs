// Needs `playwright-core` (not a project dependency); `node walk.mjs <output-dir>` with `VITE_APP_MODE=beta vite` on :5173 and Chromium 1194 at /opt/pw-browsers.
// S43 critique fixes — 360px walk of the changed screens, light + dark.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = 'http://127.0.0.1:5173'; const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const KEY = 'a'.repeat(64); const log = (...a) => console.log(...a);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const seedScript = ({ theme, KEY, agent, door }) => {
  let ls; try { ls = window.localStorage; } catch { return; }
  const seed = (k, v) => { if (!ls.getItem(k)) ls.setItem(k, v); };
  seed('gloki.theme', theme);
  if (door) seed('gloki.beta.door', door);
  if (KEY) seed('user', JSON.stringify({ publicKey: KEY, serverUrl: 'https://gdi.gloki.contact' }));
  if (agent) { seed('gloki.digitalAgent', JSON.stringify({ displayName: 'Walk Tester', photo: '', country: 'KE', languages: ['en'], createdAt: Date.now(), vouchedBy: [], consentedAt: Date.now(), accountKind: 'person' })); seed('gloki.onboarding', JSON.stringify({ step: 6, completed: true })); }
};
async function ctxFor(theme, opts) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, colorScheme: theme });
  const errors = []; ctx.on('page', (p) => { p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message)); });
  await ctx.addInitScript(seedScript, { theme, ...opts });
  return { ctx, errors, page: await ctx.newPage() };
}
for (const theme of ['light', 'dark']) {
  const tag = (s) => `[${theme}] ${s}`; const allErrors = [];
  const shot = async (page, name) => { await page.waitForTimeout(250); await page.screenshot({ path: `${OUT}/${theme}-${name}.png` }); log(tag(`shot ${name}  url=${new URL(page.url()).pathname}`)); };
  const inView = async (page, loc) => { const b = await loc.boundingBox(); return b && b.y >= 0 && b.y + b.height <= 740; };

  // 1. Newcomer keys screen: door recorded, no user.
  { const { ctx, errors, page } = await ctxFor(theme, {});
    await page.goto(BASE + '/'); await page.getByRole('button', { name: 'Join as a person' }).click();
    await page.getByRole('button', { name: 'Create my key' }).waitFor();
    log(tag(`keys newcomer: lead="${(await page.locator('h1 + p, p').first().textContent()).trim().slice(0, 60)}…" create-primary=${await page.getByRole('button', { name: 'Create my key' }).count()} keyField=${await page.locator('#publicKey').count()} server=${await page.locator('#serverUrl').count()}`));
    await shot(page, '01-keys-newcomer');
    await page.getByRole('button', { name: 'I already have a key' }).click(); await page.locator('#publicKey').waitFor();
    await page.locator('#publicKey').fill('bad'); await page.locator('#publicKey').blur(); await page.waitForTimeout(100);
    const errBefore = await page.getByRole('alert').count();
    await page.getByRole('button', { name: 'Generate a new identity key' }).click(); await page.waitForTimeout(100);
    log(tag(`stale error after Generate: before=${errBefore} after=${await page.getByRole('alert').count()} ${(await page.getByRole('alert').count()) === 0 ? 'OK' : 'FAIL'}`));
    await shot(page, '01b-keys-paste-open');
    await page.getByRole('button', { name: 'Create my key' }).click();
    await page.getByText('Save your key').waitFor({ timeout: 15000 });
    log(tag(`Create my key → ${new URL(page.url()).pathname} h1=${JSON.stringify(await page.locator('h1').allTextContents())}`));
    // 2. Backup step: checkbox + Continue in view; copied banner.
    const cont = page.getByRole('button', { name: 'Continue' }); const box = page.getByRole('checkbox');
    log(tag(`backup: Continue in viewport=${await inView(page, cont)} checkbox in viewport=${await inView(page, box)}`));
    await page.getByRole('button', { name: 'Copy key' }).click(); await page.getByText('Copied to the clipboard.').waitFor();
    const bannerRole = await page.getByText('Copied to the clipboard.').evaluate((el) => el.closest('[role]')?.getAttribute('role'));
    log(tag(`copied banner role=${bannerRole}`));
    await shot(page, '02-backup');
    await box.check(); log(tag(`Continue enabled after tick: ${await cont.isEnabled()}`));
    await cont.click(); await page.getByText('Who is this account for?').waitFor();
    log(tag(`kind lead: "${(await page.locator('h1 + p').textContent()).trim()}"`));
    await shot(page, '03-kind');
    await page.getByRole('button', { name: 'Continue' }).click(); await page.getByText('Create your profile').waitFor();
    log(tag(`profile lead: "${(await page.locator('h1 + p').textContent()).trim()}" language label: ${await page.getByText('Language you speak').count()}`));
    await shot(page, '04-profile');
    await page.getByLabel(/Your name/).fill('Walk Tester');
    await page.getByRole('button', { name: /Select your country/ }).click(); await page.getByRole('textbox').last().fill('Kenya'); await page.getByRole('option', { name: /Kenya/ }).first().click().catch(async () => { await page.getByText('Kenya', { exact: false }).first().click(); });
    await page.getByRole('button', { name: 'Continue' }).click(); await page.getByText("You're ready to participate").waitFor();
    log(tag(`ready: next line=${await page.getByText(/Next: four people who know you/).count()} primary="${await page.getByRole('button', { name: 'Ask someone who knows you' }).textContent()}"`));
    await shot(page, '05-ready');
    await page.getByRole('button', { name: 'Ask someone who knows you' }).click(); await page.getByText('Get verified').first().waitFor();
    await page.waitForTimeout(300);
    log(tag(`hub: eyebrow "Verification"=${await page.getByText('Verification', { exact: true }).count()} primary cards=${await page.getByRole('button', { name: 'Ask someone', exact: true }).count()} other-ways toggle=${await page.getByRole('button', { name: /Other ways to get approvals/ }).count()} camera lines=${await page.getByText('Uses your camera').count()}`));
    await shot(page, '06-hub');
    await page.getByRole('button', { name: /Other ways/ }).click(); await page.waitForTimeout(200); await page.evaluate(() => window.scrollTo(0, 400)); await shot(page, '06b-hub-others');
    allErrors.push(...errors); await ctx.close(); }

  // 3. Forum + profile, signed in and onboarded.
  { const { ctx, errors, page } = await ctxFor(theme, { KEY, agent: true });
    await page.goto(BASE + '/forum'); await page.getByText('Welcome to the Gloki forum').waitFor();
    const ta = page.getByRole('textbox', { name: 'What do you want to say?' });
    log(tag(`forum: textarea labelled=${await ta.count()} add-sources=${await page.getByText('+ Add sources').count()} sort-toggle=${await page.getByRole('radiogroup').count() + await page.getByRole('group', { name: /Sort/ }).count()} count="${(await page.locator('[class*="count"]').first().textContent()).trim()}"`));
    await ta.fill('line one'); await ta.press('Enter'); await ta.type('line two');
    log(tag(`Enter made a newline: ${(await ta.inputValue()).includes('\n') ? 'OK' : 'FAIL'}`));
    await ta.press('Control+Enter'); await page.getByText('line two').waitFor();
    log(tag(`Ctrl+Enter posted: OK; count now "${(await page.locator('[class*="count"]').first().textContent()).trim()}"`));
    await shot(page, '07-forum');
    await page.getByRole('button', { name: 'Delete' }).first().click(); await page.getByRole('dialog').waitFor();
    log(tag(`delete asks first: dialog="${(await page.getByRole('dialog').locator('h2, [class*="title"]').first().textContent()).trim()}"`));
    await shot(page, '07b-forum-delete-confirm');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await page.goto(BASE + '/identity/profile'); await page.getByText('Walk Tester').waitFor();
    log(tag(`profile: participation block=${await page.getByText('Participation').count()} edit-btn h=${(await page.getByRole('button', { name: 'Edit profile' }).boundingBox()).height} bell=${JSON.stringify(await page.getByRole('link', { name: /Notifications/ }).boundingBox().then(b => b && [b.width, b.height]))}`));
    await shot(page, '08-profile');
    await page.getByRole('button', { name: 'Edit profile' }).click(); await page.locator('#edit-kind').waitFor(); await page.waitForTimeout(400);
    log(tag(`edit modal: AI key field=${await page.locator('#edit-key').count()} language label=${await page.getByText('Language you speak').count()}`));
    await shot(page, '08b-profile-edit');
    await page.keyboard.press('Escape');
    // menu logout confirm
    await page.getByRole('button', { name: /menu/i }).first().click(); await page.getByRole('button', { name: 'Logout' }).click(); await page.getByRole('dialog').waitFor();
    log(tag(`logout asks first: "${(await page.getByRole('dialog').textContent()).trim().slice(0, 80)}"`));
    await shot(page, '09-logout-confirm');
    allErrors.push(...errors); await ctx.close(); }
  const real = allErrors.filter((e) => !/ERR_TUNNEL_CONNECTION_FAILED/.test(e));
  log(tag(`console errors: ${allErrors.length} (tunnel ${allErrors.length - real.length}, other ${real.length})`)); for (const e of real) log(tag(`  ERROR ${e}`));
}
await browser.close();
