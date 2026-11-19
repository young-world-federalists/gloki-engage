// Helpers for the contract checks: agents with WebCrypto P-256 root keys in
// place of passkeys, on an ibc-go node (IBC_URL, default the local one).
import { readFile } from 'node:fs/promises';
import { Ibc, addressOf, newP256Key, p256Signer } from '@ouripoupko/ibc';

export const NODE = process.env.IBC_URL ?? 'http://localhost:2611';
const SOL = new URL('../../src/assets/contracts/sol/', import.meta.url);

/** A contract's source as the app sends it: one file, by its name. */
export async function source(name) {
  return { [`${name}.sol`]: await readFile(new URL(`${name}.sol`, SOL), 'utf8') };
}

/** A new agent, registered on the node. */
export async function agent() {
  const key = await newP256Key();
  const ibc = await Ibc.connect(NODE, { agent: addressOf(key.publicKey), root: p256Signer(key) });
  await ibc.register();
  return ibc;
}

/** Deploys the contract of that name (its file's root contract) and returns its id. */
export async function deploy(ibc, name, ctor = {}) {
  const src = await source(name);
  const compiled = await ibc.compile(src, name);
  return ibc.deploy({ name, ...compiled, constructor: ctor, source: src });
}

async function join(ibc, host, contract, name, guest) {
  const src = await source(name);
  const done = new Promise((resolve) => {
    const off = ibc.onEvent((e) => {
      if (e.action === 'join_contract') {
        off();
        resolve(e);
      }
    });
  });
  await ibc.join(contract, host.url, host.agent, { source: src, guest });
  return done;
}

export const guestJoin = (ibc, host, contract, name) => join(ibc, host, contract, name, true);
export const partnerJoin = (ibc, host, contract, name) => join(ibc, host, contract, name, false);

let pass = 0;
let fail = 0;

/** A step that must succeed; prints its result. */
export async function ok(label, fn) {
  try {
    const v = await fn();
    pass++;
    console.log('  ok  ', label, v === undefined ? '' : JSON.stringify(v).slice(0, 160));
    return v;
  } catch (e) {
    fail++;
    console.log('  FAIL', label, e.message);
    return undefined;
  }
}

/** A step the contract must refuse, with a message containing `msg`. */
export async function refused(label, msg, fn) {
  try {
    await fn();
    fail++;
    console.log('  FAIL', label, '(not refused)');
  } catch (e) {
    if (e.message.includes(msg)) {
      pass++;
      console.log('  ok  ', label, '→', e.message);
    } else {
      fail++;
      console.log('  FAIL', label, 'wrong error:', e.message);
    }
  }
}

export function eq(a, b, label = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${label} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`);
  return a;
}

/** Prints the totals; exit status 1 if anything failed. */
export function finish(...agents) {
  for (const a of agents) a.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

export { Ibc };
