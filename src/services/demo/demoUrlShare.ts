// Serialises/deserialises the full demo state to/from a URL hash so a populated
// demo session can be shared via link.
//
// Format: `#demo=<base64url(JSON)>` — we gzip-compress JSON via the platform
// CompressionStream when available; fall back to raw JSON otherwise.

import { dumpRegistry, restoreRegistry } from './demoRegistry';
import { dumpAllState, restoreAllState } from './demoState';

const HASH_KEY = 'demo';
const SEED_FLAG_PREFIX = 'gloki_demo_seeded_';

interface DemoBundle {
  v: 1;
  registry: Record<string, unknown>;
  state: Record<string, unknown>;
  seededCommunities: string[];
}

function dumpSeededCommunities(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith(SEED_FLAG_PREFIX) && localStorage.getItem(k) === 'true') {
      out.push(k.slice(SEED_FLAG_PREFIX.length));
    }
  }
  return out;
}

function restoreSeededCommunities(ids: string[]): void {
  for (const id of ids) {
    localStorage.setItem(SEED_FLAG_PREFIX + id, 'true');
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function compressJson(payload: string): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    return new TextEncoder().encode(payload);
  }
  const stream = new Blob([payload]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompressToJson(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  try {
    // Ensure we pass an ArrayBuffer (not SharedArrayBuffer) to Blob constructor.
    const buffer = bytes.slice().buffer;
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  } catch {
    // Fall back to plain text if it wasn't gzipped.
    return new TextDecoder().decode(bytes);
  }
}

function buildBundle(): DemoBundle {
  return {
    v: 1,
    registry: dumpRegistry(),
    state: dumpAllState(),
    seededCommunities: dumpSeededCommunities(),
  };
}

function restoreBundle(bundle: DemoBundle): void {
  if (!bundle || bundle.v !== 1) {
    console.warn('[DemoShare] Unsupported bundle version');
    return;
  }
  restoreRegistry(bundle.registry as Parameters<typeof restoreRegistry>[0]);
  restoreAllState(bundle.state);
  restoreSeededCommunities(bundle.seededCommunities ?? []);
}

export async function buildDemoShareLink(): Promise<string> {
  const bundle = buildBundle();
  const json = JSON.stringify(bundle);
  const compressed = await compressJson(json);
  const encoded = toBase64Url(compressed);
  if (encoded.length > 10_000) {
    console.warn(`[DemoShare] Link payload is ${encoded.length} bytes — may be too long for some chat apps.`);
  }
  const url = new URL(window.location.href);
  url.hash = `${HASH_KEY}=${encoded}`;
  return url.toString();
}

export async function tryHydrateFromHash(): Promise<boolean> {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith(`${HASH_KEY}=`)) return false;
  const payload = hash.slice(HASH_KEY.length + 1);
  try {
    const bytes = fromBase64Url(payload);
    const json = await decompressToJson(bytes);
    const bundle = JSON.parse(json) as DemoBundle;
    restoreBundle(bundle);
    console.log('[DemoShare] Hydrated demo state from URL hash');
    // Clear the hash so re-sharing doesn't accumulate repeat hydrations.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  } catch (err) {
    console.error('[DemoShare] Failed to hydrate from hash:', err);
    return false;
  }
}
