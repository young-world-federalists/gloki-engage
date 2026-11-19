import { agent, deploy, guestJoin, ok, refused, eq, finish, Ibc, NODE } from './lib.mjs';
const V = 'GlokiVerification';
console.log('ApplicationSettings + GlokiVerification');
const app = await agent();
const settings = await deploy(app, 'ApplicationSettings');
await app.setPublic(settings, true);
const founder = await agent();
const verification = await deploy(founder, V, { node: NODE, profile: 'p0' });
await founder.setPublic(verification, true);
await ok('founder is verified and steward', async () => { const s = await founder.read(verification, 'get_status'); eq(s.steward, founder.agent); eq(s.verified.length, 1); eq(s.verified[0].method, 'founder'); });
await ok('founder joins settings as guest', async () => eq((await guestJoin(founder, app, settings, 'ApplicationSettings')).reply, true));
await ok('register_verification', () => founder.write(settings, 'register_verification', { server: NODE, contract_id: verification }));
await ok('public read of settings', async () => { const [c, hosts] = await Ibc.publicRead(NODE, app.agent, settings, 'get_verification'); eq(c, verification); eq(hosts.length, 1); eq(hosts[0].agent, founder.agent); });
const rogue = await agent();
await guestJoin(rogue, app, settings, 'ApplicationSettings');
await refused('another id is refused', 'Verification has already started', () => rogue.write(settings, 'register_verification', { server: 'http://evil', contract_id: '0xbad' }));
await ok('a second host adds its own entry, cannot repoint the founder', async () => {
  await rogue.write(settings, 'register_verification', { server: 'http://evil', contract_id: verification });
  const [, hosts] = await Ibc.publicRead(NODE, app.agent, settings, 'get_verification');
  eq(hosts[0].server, NODE); eq(hosts.length, 2);
});
await refused('only the owner resets', 'Only the application account', () => rogue.write(settings, 'reset_verification'));
await refused('only the owner sets the forum', 'Only the application account can set the forum', () => rogue.write(settings, 'set_forum', { contract_id: '0x1' }));
await ok('the owner sets the forum; anyone reads it', async () => { await app.write(settings, 'set_forum', { contract_id: '0xf0' }); eq(await Ibc.publicRead(NODE, app.agent, settings, 'get_forum'), '0xf0'); });

// Sequential phase: #2..#4, everyone verified must vouch.
const people = [];
for (let i = 0; i < 7; i++) { const p = await agent(); await guestJoin(p, founder, verification, V); people.push(p); }
const [b, c, d, e, f, g, h] = people;
const status = () => Ibc.publicRead(NODE, founder.agent, verification, 'get_status');
await ok('b requests a vouch', () => b.write(verification, 'request_vouch', { approver: founder.agent, node: NODE, profile: 'pb' }));
await refused('c is refused while b is the candidate', 'Someone else is being verified', () => c.write(verification, 'request_vouch', { approver: founder.agent, node: NODE, profile: '' }));
await refused('b cannot vouch for anyone', 'Only verified people can vouch', () => b.write(verification, 'vouch', { requester: c.agent }));
await refused('b cannot register without the vouch', 'has not vouched for you', () => b.write(verification, 'register', { vouchers: [founder.agent], node: NODE, profile: 'pb' }));
await ok('founder vouches for b', () => founder.write(verification, 'vouch', { requester: b.agent }));
await refused('c cannot register as someone else', 'Someone else is being verified', () => c.write(verification, 'register', { vouchers: [], node: NODE, profile: '' }));
await ok('b registers (V=2)', async () => { await b.write(verification, 'register', { vouchers: [founder.agent], node: NODE, profile: 'pb' }); const s = await status(); eq(s.verified.length, 2); eq(s.candidate, '0x0000000000000000000000000000000000000000'); eq(s.requests.length, 0); });
for (const [p, label] of [[c, 'c (V=3)'], [d, 'd (V=4)']]) {
  await ok(`${label}: request, vouches from everyone, register`, async () => {
    const verified = (await status()).verified.map((v) => v.key);
    const voters = [founder, ...people].filter((x) => verified.includes(x.agent));
    for (const v of voters) await p.write(verification, 'request_vouch', { approver: v.agent, node: NODE, profile: '' });
    for (const v of voters.slice(0, -1)) await v.write(verification, 'vouch', { requester: p.agent });
    let refusedEarly = false;
    try { await p.write(verification, 'register', { vouchers: voters.slice(0, -1).map((v) => v.agent), node: NODE, profile: '' }); } catch (err) { refusedEarly = err.message.includes('Every verified person must vouch'); }
    eq(refusedEarly, true, 'missing vouch refused');
    await voters.at(-1).write(verification, 'vouch', { requester: p.agent });
    await p.write(verification, 'register', { vouchers: voters.map((v) => v.agent), node: NODE, profile: '' });
    return (await status()).verified.length;
  });
}
// Open phase: four vouches, several requesters at once.
await ok('open phase: e and f request at once', async () => {
  for (const v of [founder, b, c, d]) await e.write(verification, 'request_vouch', { approver: v.agent, node: NODE, profile: '' });
  await f.write(verification, 'request_vouch', { approver: founder.agent, node: NODE, profile: '' });
});
for (const v of [founder, b, c]) await v.write(verification, 'vouch', { requester: e.agent });
await refused('three vouches are not enough', 'Four vouches are needed', () => e.write(verification, 'register', { vouchers: [founder.agent, b.agent, c.agent], node: NODE, profile: '' }));
await refused('a listed voucher must have vouched', 'has not vouched for you', () => e.write(verification, 'register', { vouchers: [founder.agent, b.agent, c.agent, d.agent], node: NODE, profile: '' }));
await refused('duplicates are refused', 'listed once', () => e.write(verification, 'register', { vouchers: [founder.agent, b.agent, c.agent, c.agent], node: NODE, profile: '' }));
await d.write(verification, 'vouch', { requester: e.agent });
await ok('e registers with four (V=5)', async () => { await e.write(verification, 'register', { vouchers: [founder.agent, b.agent, c.agent, d.agent], node: NODE, profile: '' }); return (await status()).verified.length; });
await ok('founder declines f', () => founder.write(verification, 'decline_vouch', { requester: f.agent }));
await refused('declining twice', 'already settled', () => founder.write(verification, 'decline_vouch', { requester: f.agent }));
await refused('only the steward resets', 'Only the steward', () => g.write(verification, 'reset_candidate'));
await ok('steward resets', () => founder.write(verification, 'reset_candidate'));
finish(app, founder, rogue, ...people);
