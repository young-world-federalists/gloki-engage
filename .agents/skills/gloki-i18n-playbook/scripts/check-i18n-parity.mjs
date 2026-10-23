#!/usr/bin/env node
/**
 * check-i18n-parity.mjs — fr/sw i18n overlay parity checker for Communities2/Gloki.
 *
 * Checked-in replacement for the historical throwaway /tmp/i18ncheck_b12.mjs
 * (recipe: docs/i18n-native-review-candidates.md, Ground rule 4).
 *
 * Checks (position-agnostic SET comparisons, never line-positional):
 *   1. fr.ts and sw.ts hold IDENTICAL key sets.
 *   2. For every shared key, the {var} interpolation token sets match fr <-> sw.
 *   3. No duplicate keys within any of en/fr/sw.ts.
 *   4. Parse sanity: warns about any line that looks like an entry but did not
 *      parse (guards against format drift silently shrinking the key set).
 *   5. Info only (non-fatal): en.ts keys missing from the overlays.
 *
 * Usage:   node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs [repoRoot]
 * Output:  "RESULT: PARITY OK" and exit 0, or "RESULT: PARITY FAIL" + diffs and exit 1.
 *
 * Entry format assumed (verified at HEAD c26cdc4): one entry per line,
 *   'flat.dotted.key': 'value',   or   'flat.dotted.key': "value with 'apostrophes'",
 * Keys are always single-quoted; values are single- or double-quoted; no
 * template literals or multi-line values in the dictionaries.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || process.cwd();
const FILES = ['en.ts', 'fr.ts', 'sw.ts'];

// One key/value pair: key ':' value (single- or double-quoted, backslash escapes
// allowed). Global — a few real lines carry TWO entries (e.g. fr.ts
// mechanisms.approval.reviewSourcesHeading + reviewPending share a line).
const ENTRY_RE = /'([^']+)':\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;
// A line that starts like a dictionary entry (comments start with //).
const LOOKS_LIKE_ENTRY_RE = /^\s*'[^']+':/;

function parseDict(file) {
  const path = join(root, 'src', 'i18n', file);
  const lines = readFileSync(path, 'utf8').split('\n');
  const map = new Map();
  const dupes = [];
  const unparsed = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!LOOKS_LIKE_ENTRY_RE.test(line)) continue; // skip comments, braces, imports
    let matched = 0;
    for (const m of line.matchAll(ENTRY_RE)) {
      matched++;
      const key = m[1];
      const value = m[2].slice(1, -1); // strip quotes; escapes irrelevant for token scan
      if (map.has(key)) dupes.push(`${key} (line ${i + 1})`);
      map.set(key, value);
    }
    if (matched === 0) unparsed.push(`${file}:${i + 1}: ${line.trim().slice(0, 80)}`);
  }
  return { map, dupes, unparsed };
}

function tokens(value) {
  return new Set([...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
}

function setDiff(a, b) {
  return [...a].filter((k) => !b.has(k)).sort();
}

let failed = false;
const dicts = {};
for (const f of FILES) {
  const d = parseDict(f);
  dicts[f] = d;
  if (d.dupes.length) {
    failed = true;
    console.log(`FAIL: duplicate keys in ${f}:`);
    d.dupes.forEach((k) => console.log(`  ${k}`));
  }
  if (d.unparsed.length) {
    console.log(`WARN: ${d.unparsed.length} entry-like line(s) in ${f} did not parse (check format drift):`);
    d.unparsed.forEach((l) => console.log(`  ${l}`));
  }
}

const fr = dicts['fr.ts'].map;
const sw = dicts['sw.ts'].map;
const en = dicts['en.ts'].map;
console.log(`Parsed keys: en=${en.size} fr=${fr.size} sw=${sw.size}`);

const frKeys = new Set(fr.keys());
const swKeys = new Set(sw.keys());
const onlyFr = setDiff(frKeys, swKeys);
const onlySw = setDiff(swKeys, frKeys);
if (onlyFr.length || onlySw.length) {
  failed = true;
  if (onlyFr.length) {
    console.log(`FAIL: ${onlyFr.length} key(s) in fr.ts but NOT sw.ts:`);
    onlyFr.forEach((k) => console.log(`  ${k}`));
  }
  if (onlySw.length) {
    console.log(`FAIL: ${onlySw.length} key(s) in sw.ts but NOT fr.ts:`);
    onlySw.forEach((k) => console.log(`  ${k}`));
  }
}

let tokenMismatches = 0;
for (const key of frKeys) {
  if (!swKeys.has(key)) continue;
  const tf = tokens(fr.get(key));
  const ts = tokens(sw.get(key));
  const missInSw = setDiff(tf, ts);
  const missInFr = setDiff(ts, tf);
  if (missInSw.length || missInFr.length) {
    failed = true;
    tokenMismatches++;
    console.log(
      `FAIL: {var} token mismatch on '${key}': fr={${[...tf].sort()}} sw={${[...ts].sort()}}`,
    );
  }
}
if (tokenMismatches === 0) console.log('Token check: all shared keys have matching {var} sets.');

// Info only: en.ts is intentionally a partial seed, but its keys are shell/kit
// strings that SHOULD be translated in the overlays. Known intentional gap:
// lang.en/fr/sw stay as endonyms in the switcher (fr.ts header comment).
const KNOWN_EN_ONLY = new Set(['lang.en', 'lang.fr', 'lang.sw']);
const enMissing = setDiff(new Set(en.keys()), frKeys).filter((k) => !KNOWN_EN_ONLY.has(k));
if (enMissing.length) {
  console.log(`INFO (non-fatal): ${enMissing.length} en.ts key(s) missing from overlays:`);
  enMissing.forEach((k) => console.log(`  ${k}`));
}

console.log(failed ? 'RESULT: PARITY FAIL' : 'RESULT: PARITY OK');
process.exit(failed ? 1 : 0);
