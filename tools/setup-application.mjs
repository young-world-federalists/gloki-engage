// Sets up the central application account on an ibc-go node, once per network:
// the account, its ApplicationSettings and Forum contracts (both public), and the
// settings pointing at the forum. Prints the two build settings for .env.
//
//   node tools/setup-application.mjs <node url> <key file>
//
// The key file is the application account: made on the first run (readable only
// by you), reused afterwards. Keep it out of the repo and back it up. Running
// again with the same key finishes a setup that stopped half way and changes
// nothing that is already done.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Ibc, addressOf, p256Signer } from '@ouripoupko/ibc';

const [url, keyFile] = process.argv.slice(2);
if (!url || !keyFile) {
  console.error('usage: node tools/setup-application.mjs <node url> <key file>');
  process.exit(2);
}
const NODE = url.replace(/\/$/, '');
const SOL = new URL('../src/assets/contracts/sol/', import.meta.url);
const P256 = { name: 'ECDSA', namedCurve: 'P-256' };

/** The account's P-256 key: read from the key file, or made and saved there. */
async function loadKey() {
  let jwk;
  try {
    jwk = JSON.parse(await readFile(keyFile, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    await mkdir(dirname(keyFile), { recursive: true, mode: 0o700 });
    const pair = await crypto.subtle.generateKey(P256, true, ['sign', 'verify']);
    jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    await writeFile(keyFile, JSON.stringify(jwk) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(`made a new key: ${keyFile}`);
  }
  const privateKey = await crypto.subtle.importKey('jwk', jwk, P256, false, ['sign']);
  const b64 = (s) => Buffer.from(s, 'base64url');
  const publicKey = new Uint8Array([4, ...b64(jwk.x), ...b64(jwk.y)]);
  return { privateKey, publicKey };
}

/** The account's contract of that name, deployed now if it has none yet; made public. */
async function ensure(ibc, held, name) {
  let id = held.find((c) => c.name === name)?.id;
  if (id) {
    console.log(`${name}: already deployed, ${id}`);
  } else {
    const source = { [`${name}.sol`]: await readFile(new URL(`${name}.sol`, SOL), 'utf8') };
    const compiled = await ibc.compile(source, name);
    id = await ibc.deploy({ name, ...compiled, constructor: {}, source });
    console.log(`${name}: deployed, ${id}`);
  }
  await ibc.setPublic(id, true);
  return id;
}

const key = await loadKey();
const ibc = await Ibc.connect(NODE, { agent: addressOf(key.publicKey), root: p256Signer(key) });
try {
  if (await ibc.exists()) {
    console.log(`account: already registered, ${ibc.agent}`);
  } else {
    await ibc.register();
    console.log(`account: registered, ${ibc.agent}`);
  }
  const held = await ibc.contracts();
  const settings = await ensure(ibc, held, 'ApplicationSettings');
  const forum = await ensure(ibc, held, 'Forum');
  if ((await Ibc.publicRead(NODE, ibc.agent, settings, 'get_forum')) !== forum) {
    await ibc.write(settings, 'set_forum', { contract_id: forum });
  }
  // Read back as any visitor would, without signing.
  const seen = await Ibc.publicRead(NODE, ibc.agent, settings, 'get_forum');
  if (seen !== forum) throw new Error(`the settings name the forum ${seen}, not ${forum}`);
  console.log('settings: point at the forum (checked with an unsigned read)');
  console.log(`\nFor .env (or .env.local):\n`);
  console.log(`VITE_APPLICATION_SERVER_URL=${NODE}`);
  console.log(`VITE_APPLICATION_AGENT=${ibc.agent}`);
  console.log(`VITE_APPLICATION_SETTINGS_CONTRACT=${settings}`);
} finally {
  ibc.close();
}
