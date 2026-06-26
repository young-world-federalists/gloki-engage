// Human-memorable 3-word codes for problems (Write Together, S3).
// Deterministic + derived from the problem's contract id — no storage. Pattern:
// adjective-animal-noun (e.g. "brave-otter-river"). The wordlist is curated to
// be unambiguous and inoffensive; codes are for memorability/word-of-mouth, not
// security. Resolution scans a known set of problems and matches codeForId.

const ADJECTIVES = [
  'brave', 'calm', 'clever', 'bright', 'bold', 'kind', 'swift', 'warm',
  'gentle', 'happy', 'eager', 'fair', 'keen', 'lively', 'merry', 'noble',
  'proud', 'quick', 'sunny', 'tidy', 'wise', 'witty', 'jolly', 'lucky',
  'plucky', 'snug', 'spry', 'steady', 'sturdy', 'zesty', 'trusty', 'vivid',
];
const ANIMALS = [
  'otter', 'falcon', 'heron', 'bison', 'koala', 'lynx', 'gecko', 'tapir',
  'panda', 'robin', 'finch', 'crane', 'moose', 'ibex', 'lemur', 'puffin',
  'badger', 'beaver', 'marten', 'osprey', 'quokka', 'raven', 'salmon', 'turtle',
  'walrus', 'wombat', 'yak', 'zebra', 'dolphin', 'gazelle', 'hare', 'newt',
];
const NOUNS = [
  'river', 'meadow', 'harbor', 'summit', 'canyon', 'orchard', 'lantern', 'compass',
  'beacon', 'garden', 'bridge', 'haven', 'forest', 'valley', 'island', 'spring',
  'harvest', 'anchor', 'ember', 'willow', 'cedar', 'maple', 'cove', 'delta',
  'fjord', 'glade', 'grove', 'ridge', 'shore', 'thicket', 'tundra', 'prairie',
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function codeForId(id: string): string {
  const h = hash(id);
  const a = ADJECTIVES[h % ADJECTIVES.length];
  const b = ANIMALS[(h >>> 5) % ANIMALS.length];
  const c = NOUNS[(h >>> 10) % NOUNS.length];
  return `${a}-${b}-${c}`;
}

/** Normalise a pasted code to the canonical "word-word-word" form, or null. */
export function parseCode(raw: string): string | null {
  const norm = raw.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  return /^[a-z]+-[a-z]+-[a-z]+$/.test(norm) ? norm : null;
}

export function resolveCode<T extends { id: string }>(raw: string, problems: T[]): T | null {
  const code = parseCode(raw);
  if (!code) return null;
  return problems.find((p) => codeForId(p.id) === code) ?? null;
}
