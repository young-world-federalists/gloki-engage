# S40 Conviction Time Accrual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make conviction strength begin at 1 and grow by one point per 30 days actually held, up to the selected commitment cap, while keeping old immutable contracts truthful and usable.

**Architecture:** A pure TypeScript model owns duration caps and browser-time calculation. The demo contract remains authoritative for personal, total and country results; the React surface renders its derived fields and detects old contracts through an additive model marker. A documented Python patch mirrors the formula for Ouri without adding or renaming wire methods.

**Tech Stack:** React 19, TypeScript 5.9 strict mode, Redux-backed Gloki service seam, localStorage demo contracts, SCSS Modules, custom i18n overlays, Gloki Python contract dialect.

**Spec:** `docs/superpowers/specs/2026-09-16-s40-conviction-time-accrual-design.md`

## Global Constraints

- Preserve the existing `stake`, `update_stake`, `withdraw_stake`, `get_my_stake`, `get_stakes`, `get_total_conviction` and `get_conviction_by_country` wire names.
- Preserve the caps exactly: `1w=1`, `1m=2`, `3m=4`, `6m=7`, `1y=12`.
- Strength is `min(cap, 1 + max(0, elapsed) / 30 days)` and is independent of stored `amount`.
- New stakes require `amount === 1`; repeat stakes remain rejected.
- Lengthening or choosing the same duration preserves the timestamp; shortening resets it; withdrawal deletes the stake immediately.
- `get_total_conviction` adds `model: 'time_accrual_v1'`; `get_my_stake` adds a non-persisted `weight`.
- Missing/unknown model markers use the truthful legacy instant-strength UI. Never calculate new accrual against a legacy total.
- Fixture timestamps change, so bump `DEMO_VERSION` exactly once: `global-v19` → `global-v20`.
- No new route, contract method, scheduler, notification, package or test framework.
- Every changed/new visible string has an inline English fallback and matching French/Swahili overlays with identical interpolation tokens.
- No component may import demo modules. All contract access stays behind `convictionApi.ts` and `src/services/api.ts`.
- Do not edit the user's pre-existing untracked `.agents/` directory.
- Tasks are tightly coupled across one mechanism and the repository is on a slow external drive: execute sequentially. Each task is controller/direct-safe; none requires a subagent.
- Run the local multi-model review panel or push only after separate explicit authorization.

## Test strategy for this repository

The repository deliberately has no test runner. Do not add Vitest/Jest for one feature. Use three evidence layers instead:

1. pure-model and demo-contract boundary matrices evaluated through Vite's browser module loader;
2. strict typecheck/build/grep/i18n gates after each coherent task; and
3. rendered controller walks on both existing mandate surfaces at 360px, light/dark, en/fr/sw.

The browser checks below are exact executable matrices, not informal eyeballing. Start the single shared `gloki-dev` preview only through the project's preview/browser tooling; do not start a second raw dev server.

---

### Task 1: Add the pure conviction accrual model

**Execution:** Controller/direct. No React, fixtures or persistence in this task.

**Files:**
- Create: `src/services/convictionModel.ts`

**Interfaces:**
- Produces: `CONVICTION_MODEL`, `ACCRUAL_PERIOD_MS`, `CONVICTION_CAPS`, `CONVICTION_MATURITY_DAYS`, `ConvictionDuration`, `StoredConvictionStake`, `ConvictionStakeRead`, `ConvictionTotal`, `isConvictionDuration()`, `convictionCap()` and `strengthForStake()`.
- Consumed by: Tasks 2–4.

- [ ] **Step 1: Record the model boundary matrix before implementation**

Use this exact expected table in the task review:

| Input | Expected |
|---|---:|
| new `1y` stake | `1` |
| `1m`, 15 days old | `1.5` |
| `3m`, 90 days old | `4` |
| `6m`, 400 days old | `7` |
| `1y`, 330 days old | `12` |
| future-dated `1y` | `1` |
| non-numeric timestamp | `1` |
| unknown duration | `1` |
| `amount: 100`, mature `1m` | `2`, proving amount is ignored |

- [ ] **Step 2: Create the pure model**

Implement this public shape, keeping `now` injectable for deterministic verification:

```ts
export const CONVICTION_MODEL = 'time_accrual_v1' as const;
export const ACCRUAL_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export const CONVICTION_CAPS = {
  '1w': 1,
  '1m': 2,
  '3m': 4,
  '6m': 7,
  '1y': 12,
} as const;

export type ConvictionDuration = keyof typeof CONVICTION_CAPS;

export const CONVICTION_MATURITY_DAYS: Record<ConvictionDuration, number> = {
  '1w': 0,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 330,
};

export interface StoredConvictionStake {
  amount: number;
  duration: string;
  timestamp: number | string;
  country: string;
  voter: string;
}

export interface ConvictionStakeRead extends StoredConvictionStake {
  weight?: number;
}

export interface ConvictionTotal {
  total: number;
  count: number;
  model?: string;
}

export function isConvictionDuration(value: string): value is ConvictionDuration {
  return value in CONVICTION_CAPS;
}

export function convictionCap(duration: string): number {
  return isConvictionDuration(duration) ? CONVICTION_CAPS[duration] : 1;
}

export function strengthForStake(
  stake: Pick<StoredConvictionStake, 'duration' | 'timestamp'>,
  now = Date.now(),
): number {
  const cap = convictionCap(stake.duration);
  const startedAt = Number(stake.timestamp);
  if (!Number.isFinite(startedAt)) return 1;
  const elapsed = Math.max(0, now - startedAt);
  return Math.min(cap, 1 + elapsed / ACCRUAL_PERIOD_MS);
}
```

- [ ] **Step 3: Run strict compilation and the local build**

Run:

```bash
npx --no-install tsc -b --noEmit
npm run build
```

Expected: both exit 0 with no TypeScript errors.

- [ ] **Step 4: Evaluate the boundary matrix through Vite**

In the controller browser, dynamically import `/src/services/convictionModel.ts`, set `now = 2_000_000_000_000`, and evaluate all nine rows. Compare floating-point values with a `1e-9` tolerance. The result must be:

```json
[1,1.5,4,7,12,1,1,1,2]
```

- [ ] **Step 5: Commit the model**

```bash
git add src/services/convictionModel.ts
git commit -m "feat(s40): define conviction time accrual"
```

---

### Task 2: Make demo contract reads authoritative

**Execution:** Controller/direct. Review the complete demo-contract diff before moving to fixtures.

**Files:**
- Modify: `src/services/demo/demoContracts/conviction.ts`
- Modify: `src/components/collaboration/flows/voting/convictionApi.ts`

**Interfaces:**
- Consumes: Task 1's constants, types and `strengthForStake()`.
- Produces: typed `getMyStake(): Promise<ConvictionStakeRead | null>` and `getTotalConviction(): Promise<ConvictionTotal>`; authoritative demo `weight`, `total`, `model` and country results.

- [ ] **Step 1: Replace the private multiplier map with the shared model**

Import:

```ts
import {
  CONVICTION_CAPS,
  CONVICTION_MODEL,
  convictionCap,
  isConvictionDuration,
  strengthForStake,
  type StoredConvictionStake,
} from '../../convictionModel';
```

Use `StoredConvictionStake` for state and `initConviction`. Remove `DURATION_MULTIPLIERS` and the private `Stake` interface.

- [ ] **Step 2: Change reads to calculate, never persist, current weight**

Implement the read cases with this behavior:

```ts
case 'get_my_stake': {
  const stake = s.stakes[caller];
  return stake ? { ...stake, weight: strengthForStake(stake) } : null;
}
case 'get_stakes':
  return s.stakes;
case 'get_total_conviction': {
  let total = 0;
  let count = 0;
  for (const stake of Object.values(s.stakes)) {
    total += strengthForStake(stake);
    count += 1;
  }
  return { total, count, model: CONVICTION_MODEL };
}
case 'get_conviction_by_country': {
  const result: Record<string, number> = {};
  for (const stake of Object.values(s.stakes)) {
    const country = stake.country || 'OTHER';
    result[country] = (result[country] ?? 0) + strengthForStake(stake);
  }
  return result;
}
```

Do not mutate stored stake objects during reads.

- [ ] **Step 3: Enforce one-person-one-commitment on writes**

In `stake`, reject every amount except exactly `1`:

```ts
if (amount !== 1) return { error: 'Stake amount must be exactly 1' };
if (!duration || !isConvictionDuration(duration)) return { error: 'Invalid duration' };
```

In `update_stake`, validate with `isConvictionDuration()`, compare `convictionCap(existing.duration)` with `CONVICTION_CAPS[duration]`, preserve the timestamp for equal/longer caps, and reset only for a lower cap. Keep country normalization and repeat/withdraw errors unchanged.

- [ ] **Step 4: Type the API reads without changing wire calls**

Add type-only imports from `../../../../services/convictionModel` and annotate:

```ts
export async function getMyStake(...): Promise<ConvictionStakeRead | null>
export async function getStakes(...): Promise<Record<string, StoredConvictionStake>>
export async function getTotalConviction(...): Promise<ConvictionTotal>
export async function getConvictionByCountry(...): Promise<Record<string, number>>
```

Keep all `IMethod.name` and payload keys byte-for-byte unchanged.

- [ ] **Step 5: Run the demo-contract matrix in the controller browser**

Create temporary contract id `s40-conviction-check` through `initConviction` with:

```ts
[
  { voter: 'a', amount: 100, duration: '1m', timestamp: now - 15 * day, country: 'KE' },
  { voter: 'b', amount: 1, duration: '3m', timestamp: now - 90 * day, country: 'KE' },
  { voter: 'c', amount: 1, duration: '1y', timestamp: now - 330 * day, country: 'FR' },
]
```

Because contract reads use the real clock, construct `now = Date.now()` immediately before seeding. Verify to display precision:

```json
{
  "myWeight": 1.5,
  "total": 17.5,
  "count": 3,
  "model": "time_accrual_v1",
  "KE": 5.5,
  "FR": 12,
  "inflatedAmountIgnored": true,
  "amountZeroRejected": true,
  "amountTwoRejected": true
}
```

Allow only sub-millisecond floating error before formatting. Remove `gloki_demo_state_s40-conviction-check` from localStorage after the check.

- [ ] **Step 6: Verify and commit the authoritative demo seam**

Run:

```bash
npx --no-install tsc -b --noEmit
npm run build
git diff --check
```

Then commit:

```bash
git add src/services/demo/demoContracts/conviction.ts src/components/collaboration/flows/voting/convictionApi.ts
git commit -m "feat(s40): accrue conviction in contract reads"
```

---

### Task 3: Seed meaningful maturity and reset demo state

**Execution:** Controller/direct. This is the only fixture/version task.

**Files:**
- Modify: `src/services/demo/fixtures/mechanisms.ts:71-99`
- Modify: `src/services/demo/mockApi.ts:17`

**Interfaces:**
- Consumes: `CONVICTION_MATURITY_DAYS`, `ConvictionDuration` and `StoredConvictionStake` from Task 1.
- Produces: deterministic seeded ages distributed across each duration's useful maturity window and the `global-v20` reset.

- [ ] **Step 1: Replace the fixture's private duration type/map**

Import the shared types/constants. Keep the existing deterministic LCG and duration distribution. After choosing `duration`, advance the seed once more for age so duration choice and age do not use the identical random sample:

```ts
const duration = DURATIONS[s % DURATIONS.length];
s = (s * 1103515245 + 12345) & 0x7fffffff;
const maturityDays = CONVICTION_MATURITY_DAYS[duration];
const ageDays = maturityDays === 0 ? s % 7 : s % (maturityDays + 1);
const ageMs = ageDays * 24 * 60 * 60 * 1000;
```

Return `StoredConvictionStake[]`; keep `amount: 1`, country and participation behavior unchanged. Timestamp is `now - ageMs`.

- [ ] **Step 2: Bump the fixture generation once**

Change only:

```ts
const DEMO_VERSION = 'global-v20';
```

- [ ] **Step 3: Inspect one reseed rather than assuming distribution**

Clear only demo-owned state through the existing version gate by loading with `global-v19` stored, then inspect the seeded conviction records. Record:

- every amount is `1`;
- no timestamp is future-dated;
- every age is within its duration's specified window;
- at least one seeded commitment is partial or mature above strength `1`; and
- duration/country participation still exists across more than one country.

If the deterministic seed happens not to produce a partial/mature record, adjust only the age sample formula—not personas, participation or durations—until the feature is visibly represented.

- [ ] **Step 4: Verify and commit fixtures**

Run:

```bash
npx --no-install tsc -b --noEmit
npm run build
git diff --check
```

Then commit:

```bash
git add src/services/demo/fixtures/mechanisms.ts src/services/demo/mockApi.ts
git commit -m "feat(s40): seed conviction maturity"
```

---

### Task 4: Render accrual and legacy behavior truthfully

**Execution:** Controller/direct. Component, styles and locale overlays form one reviewable unit.

**Files:**
- Modify: `src/components/collaboration/flows/voting/ConvictionStaking.tsx:1-333`
- Modify: `src/components/collaboration/flows/voting/ConvictionStaking.module.scss:1-380`
- Modify: `src/i18n/fr.ts:1173-1204`
- Modify: `src/i18n/sw.ts:1172-1203`

**Interfaces:**
- Consumes: `CONVICTION_CAPS`, `CONVICTION_MODEL`, `ConvictionDuration`, `ConvictionStakeRead`, `ConvictionTotal`, `convictionCap()` and typed API reads.
- Produces: current/cap presentation for accrual contracts, instant-strength presentation for legacy contracts, locale-aware decimals, and visible-only refresh lifecycle.

- [ ] **Step 1: Replace component-local authority with shared constants/types**

Remove `StakeRecord`, `MAX_MULTIPLIER` and per-option `multiplier`. Keep labels in `DURATIONS`, type each `value` as `ConvictionDuration`, and derive caps through `CONVICTION_CAPS`.

State becomes:

```ts
const [myStake, setMyStake] = useState<ConvictionStakeRead | null>(null);
const [totalConviction, setTotalConviction] = useState<ConvictionTotal>({ total: 0, count: 0 });
const [countryBreakdown, setCountryBreakdown] = useState<Record<string, number>>({});
const [hasLoadedData, setHasLoadedData] = useState(false);
```

Use typed API results directly—remove the three result casts in `fetchData`. Set
`hasLoadedData` after the first read attempt settles, and keep the existing loading card visible while
`!hasLoadedData`; this prevents a pre-read flash that falsely labels an accrual contract as legacy.
Guard `setDuration(myStake.duration)` with `isConvictionDuration()` so a malformed old record cannot
put an unsupported value into the radio state.

- [ ] **Step 2: Add exact modern/legacy derivation and locale formatting**

Use:

```ts
const isAccrual = totalConviction.model === CONVICTION_MODEL;
const strengthFormatter = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const formatStrength = (value: number) => strengthFormatter.format(value);
```

For an accrual stake, authoritative personal strength is `myStake.weight`; render current/cap progress only when it is finite. For legacy contracts, use the contract's old semantics for personal share:

```ts
const legacyAmount = Number.isFinite(myStake.amount) ? myStake.amount : 1;
const myWeight = isAccrual ? myStake.weight : legacyAmount * convictionCap(myStake.duration);
```

Never calculate accrual from timestamp in the component. Format total and country weights with `formatStrength`; keep backer count integer.

- [ ] **Step 3: Replace the meter meanings and copy branches**

Before backing/editing:

- accrual mode uses `mechanisms.conviction.intro` and labels the meter with `maxStrength`;
- legacy mode uses `legacyIntro`, `legacyNotice` and `legacyStrength`;
- meter width for the selected cap remains `cap / 12`.

Existing commitment:

- accrual meter width is `weight / cap`, clamped 0–100%;
- visible text is `currentStrength` with `{current}` and `{max}`;
- legacy meter stays `cap / 12` and visible text is `legacyStrength`;
- share uses the same `myWeight` as the visible strength.

Remove comments claiming the duration multiplier is immediately the user's weight. Keep `aria-hidden="true"` only on the decorative track; the adjacent visible text is the meter's text equivalent.

- [ ] **Step 4: Add visible-only clock refresh**

Keep the existing initial and post-write fetches. Add one effect after the initial fetch effect:

```ts
useEffect(() => {
  if (!isReady) return;
  const refreshWhenVisible = () => {
    if (document.visibilityState === 'visible') void fetchData();
  };
  document.addEventListener('visibilitychange', refreshWhenVisible);
  const intervalId = window.setInterval(refreshWhenVisible, 15 * 60 * 1000);
  return () => {
    document.removeEventListener('visibilitychange', refreshWhenVisible);
    window.clearInterval(intervalId);
  };
}, [isReady, fetchData]);
```

Do not write on the interval and do not add a live region for fractional changes.

- [ ] **Step 5: Add only the styling needed for truthful state labels**

Reuse `.strengthMeter`, `.strengthTrack`, `.strengthFill` and `.strengthLabel`. Add `.legacyNotice` using existing warning/info tokens already present in `variables.scss`; do not introduce raw colors. Ensure long French text wraps, no element gains a fixed width, and the duration controls retain their 44px floor.

- [ ] **Step 6: Apply the exact English key set and matching overlays**

Change/add these English inline fallbacks:

| Key | English |
|---|---|
| `mechanisms.conviction.intro` | Every backing starts at 1 strength and gains 1 point for every 30 days it is held, up to the maximum for your commitment. |
| `mechanisms.conviction.maxStrength` | Maximum strength: {strength} |
| `mechanisms.conviction.currentStrength` | Current strength: {current} of {max} |
| `mechanisms.conviction.legacyIntro` | This community uses the earlier model: the full strength of your chosen commitment applies immediately. |
| `mechanisms.conviction.legacyNotice` | This community uses the earlier instant-strength model. |
| `mechanisms.conviction.legacyStrength` | Current strength: {strength} (applied immediately) |
| `mechanisms.conviction.how2` | Strength starts at 1 and gains 1 point for every 30 days you keep backing, up to the maximum for your chosen commitment. |
| `mechanisms.conviction.how3` | You can change or withdraw at any time. Committing for longer keeps your original start date; shortening restarts your strength at 1. |

Use these French overlays:

```ts
'mechanisms.conviction.intro': 'Chaque soutien commence avec une force de 1 et gagne 1 point tous les 30 jours où il est maintenu, jusqu’au maximum de votre engagement.',
'mechanisms.conviction.maxStrength': 'Force maximale : {strength}',
'mechanisms.conviction.currentStrength': 'Force actuelle : {current} sur {max}',
'mechanisms.conviction.legacyIntro': 'Cette communauté utilise le modèle précédent : la force maximale de l’engagement choisi s’applique immédiatement.',
'mechanisms.conviction.legacyNotice': 'Cette communauté utilise l’ancien modèle de force immédiate.',
'mechanisms.conviction.legacyStrength': 'Force actuelle : {strength} (appliquée immédiatement)',
'mechanisms.conviction.how2': 'La force commence à 1 et gagne 1 point tous les 30 jours pendant lesquels vous maintenez votre soutien, jusqu’au maximum de l’engagement choisi.',
'mechanisms.conviction.how3': 'Vous pouvez modifier ou retirer votre soutien à tout moment. Un engagement plus long conserve la date de départ ; le raccourcir ramène la force à 1.',
```

Use these Swahili overlays:

```ts
'mechanisms.conviction.intro': 'Kila uungaji mkono huanza na nguvu 1 na huongezeka kwa pointi 1 kwa kila siku 30 unapoendelea, hadi kiwango cha juu cha ahadi yako.',
'mechanisms.conviction.maxStrength': 'Nguvu ya juu zaidi: {strength}',
'mechanisms.conviction.currentStrength': 'Nguvu ya sasa: {current} kati ya {max}',
'mechanisms.conviction.legacyIntro': 'Jumuiya hii inatumia mfumo wa awali: nguvu yote ya ahadi uliyochagua hutumika mara moja.',
'mechanisms.conviction.legacyNotice': 'Jumuiya hii inatumia mfumo wa awali wa nguvu ya papo hapo.',
'mechanisms.conviction.legacyStrength': 'Nguvu ya sasa: {strength} (imetumika mara moja)',
'mechanisms.conviction.how2': 'Nguvu huanza kwa 1 na huongezeka kwa pointi 1 kwa kila siku 30 unapoendelea kuunga mkono, hadi kiwango cha juu cha ahadi uliyochagua.',
'mechanisms.conviction.how3': 'Unaweza kubadilisha au kuondoa uungaji mkono wakati wowote. Kuongeza muda huhifadhi tarehe ya mwanzo; kupunguza muda hurudisha nguvu hadi 1.',
```

Keep identical `{strength}`, `{current}` and `{max}` token sets between locales.

- [ ] **Step 7: Run task-level verification**

Run:

```bash
npx --no-install tsc -b --noEmit
npm run build
node .Codex/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs
sh .Codex/skills/gloki-verification-and-qa/scripts/grep-gates.sh
git diff --check
```

Expected: zero TypeScript errors, build success, `fr=sw` parity with token parity, `ALL GATES CLEAN`, and no whitespace errors.

- [ ] **Step 8: Controller preview walk before commit**

At 360×780:

1. open the community Mandate stage with a seeded mature record;
2. confirm current strength is lower than/equal to cap and aggregate/country decimals agree;
3. open the published mandate route and confirm the same contract values;
4. create a fresh backing and observe `1.0` immediately;
5. lengthen it and confirm the date/strength stays; shorten it and confirm `1.0`; withdraw and confirm totals/count/country update;
6. inject a total result without `model` and verify legacy copy/meter—no accrual claim;
7. repeat layout checks light/dark and en/fr/sw;
8. keyboard through the disclosure, duration radios, submit, edit and withdraw controls; confirm visible focus, one h1, and ≥44px targets.

- [ ] **Step 9: Commit the interface and translations**

```bash
git add src/components/collaboration/flows/voting/ConvictionStaking.tsx src/components/collaboration/flows/voting/ConvictionStaking.module.scss src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s40): show conviction growth truthfully"
```

---

### Task 5: Produce the server handoff and translation packet

**Execution:** Controller/direct. Documentation must match the implemented diff, not merely this plan.

**Files:**
- Create: `docs/contracts/s40-conviction-accrual.py`
- Modify: `docs/FOR_OURI_seam.md:138-183`
- Modify: `docs/i18n-native-review-candidates.md`

**Interfaces:**
- Consumes: exact implemented TypeScript formula, fields, errors and copy from Tasks 1–4.
- Produces: an Ouri-applicable replacement for the conviction section of `gloki_engage_initiative_contract.py`, and the human translation-review ledger.

- [ ] **Step 1: Write the Python patch in the Gloki dialect**

The patch file must identify its target path and replacement span, then provide complete replacements—not ellipses—for `_duration_multiplier`, the new `_conviction_strength`, `stake`, `update_stake`, `withdraw_stake`, `get_my_stake`, `get_stakes`, `get_total_conviction` and `get_conviction_by_country`.

The calculation helper is:

```python
def _conviction_strength(self, stake):
    cap = self._duration_multiplier(stake['duration']) or 1
    started_at = stake['timestamp']
    if not started_at:
        return 1
    try:
        elapsed_seconds = elapsed_time(started_at, timestamp())
    except:
        return 1
    if elapsed_seconds <= 0:
        return 1
    strength = 1 + elapsed_seconds / (30 * 24 * 60 * 60)
    return cap if strength > cap else strength
```

`stake` requires `amount != 1` → `{ 'error': 'Stake amount must be exactly 1' }`. `get_my_stake` snapshots the stored document, attaches `weight`, and returns the snapshot without writing. `get_total_conviction` returns `{'total': total, 'count': count, 'model': 'time_accrual_v1'}`. Country totals call the same helper. Do not multiply by `amount`, import modules, initialize storage, or use `.get(key, default)` on a Document.

- [ ] **Step 2: Rewrite the existing FOR_OURI conviction section**

Update the existing S33 rows in place and add an S40 addendum that states:

- same method names and arguments;
- additive `weight` and `model` read fields;
- exact formula and caps;
- `amount == 1` enforcement and amount-independent reads;
- timestamp policy for equal/longer/shorter changes;
- `global-v20` is a UI demo reset, not a server migration; and
- immutable old initiative contracts remain instant-strength legacy contracts, detected by missing `model`.

Do not claim Ouri has applied the patch. Name `server-side` target file and current baseline `a81218f` as re-verified context.

- [ ] **Step 3: Append the Session 40 native-review packet**

Add a `## Session 40 (2026-09-16) — conviction strength accrual` section. Include the eight changed/new keys from Task 4 in an English/French/Swahili table. Call out three reviewer questions:

1. whether French *force* and Swahili *nguvu* read as civic support strength rather than physical force;
2. whether “applied immediately” clearly distinguishes legacy behavior without sounding like an error; and
3. whether the shortening sentence unmistakably says accrued strength returns to 1.

Record the actual parity count produced after Task 4; do not guess it in advance.

- [ ] **Step 4: Validate the handoff against both implementations**

Run targeted searches and manually compare every named method:

```bash
rg -n "case '(get_my_stake|get_stakes|get_total_conviction|get_conviction_by_country|stake|update_stake|withdraw_stake)'" src/services/demo/demoContracts/conviction.ts
rg -n "def (_duration_multiplier|_conviction_strength|stake|update_stake|withdraw_stake|get_my_stake|get_stakes|get_total_conviction|get_conviction_by_country)" docs/contracts/s40-conviction-accrual.py
rg -n "time_accrual_v1|global-v20|Stake amount must be exactly 1" src docs/FOR_OURI_seam.md docs/contracts/s40-conviction-accrual.py
git diff --check
```

Expected: the seven public method names match; the private helper appears only in implementations/docs; the model/error/version strings are consistent; no whitespace errors.

- [ ] **Step 5: Commit the handoff**

```bash
git add docs/contracts/s40-conviction-accrual.py docs/FOR_OURI_seam.md docs/i18n-native-review-candidates.md
git commit -m "docs(s40): hand off conviction accrual semantics"
```

---

### Task 6: Integrated verification and review gate

**Execution:** Controller only. Reviewers are read-only. The local multi-model panel remains unauthorized.

**Files:**
- Modify only files already in scope if verification finds a defect.
- Do not update roadmap/changelog/next-session closeout until the implementation and review are accepted.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: evidence-backed ship-readiness verdict and any scoped fix commits.

- [ ] **Step 1: Run the complete static gate sequentially**

```bash
npx --no-install tsc -b --noEmit
npm run build
npm run build:prod
node .Codex/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs
sh .Codex/skills/gloki-verification-and-qa/scripts/grep-gates.sh
git diff --check
```

Expected: all commands exit 0. Existing Sass `darken()` deprecation warnings in the unreachable collaboration styles may be reported as known baseline noise; no new warning is accepted without explanation.

- [ ] **Step 2: Run architecture and claims-honesty greps**

```bash
rg -n "DURATION_MULTIPLIERS|amount \*|amount\*" src/services/demo/demoContracts/conviction.ts src/components/collaboration/flows/voting/ConvictionStaking.tsx
rg -n "time_accrual_v1" src docs/FOR_OURI_seam.md docs/contracts/s40-conviction-accrual.py
rg -n "global-v(19|20)" src/services/demo/mockApi.ts docs/superpowers/specs/2026-09-16-s40-conviction-time-accrual-design.md docs/FOR_OURI_seam.md
rg -n "setInterval|visibilitychange" src/components/collaboration/flows/voting/ConvictionStaking.tsx
rg -n "from .*demo" src/components/collaboration/flows/voting/ConvictionStaking.tsx src/components/collaboration/flows/voting/convictionApi.ts
```

Expected: no old multiplier authority or amount multiplication in runtime code; model appears in TypeScript and handoff; runtime version is only v20; exactly one interval lifecycle; no component demo import.

- [ ] **Step 3: Repeat the rendered acceptance matrix**

Record observed evidence—not assumptions—for:

- new, halfway, mature, future and malformed timestamp records;
- amount 100 stored record having no extra weight;
- equal/longer/shorter update behavior and withdrawal;
- personal, total and country figures agreeing to one decimal;
- modern and legacy branches;
- community-stage and published-mandate surfaces sharing state;
- visibility-return refresh and interval cleanup; and
- 360×780 light/dark en/fr/sw, keyboard, accessible names, one h1 and measured targets.

Use a temporary localStorage contract for malformed/legacy scenarios and remove it after the walk. Do not leave a dev-only scenario switch in production code.

- [ ] **Step 4: Run a whole-session read-only review**

Review the range `40b9c09..HEAD` against the design spec. Rank findings against the two north stars and require 0 blocker / 0 major before asking for push authorization. Do not run the local multi-model panel without Eston's separate explicit “yes/go ahead,” because it can send the diff off-machine.

- [ ] **Step 5: Apply and verify any review fixes**

Each coherent fix gets its own `fix(s40): ...` commit. Re-run the smallest failing matrix plus the full static gate after all fixes. If no findings require code changes, create no empty commit.

- [ ] **Step 6: Stop at the push gate**

Present:

- commit range and concise shipping summary;
- static, browser and review evidence;
- any known limitations (especially old immutable contracts and pending Ouri application);
- confirmation that `.agents/` remains untouched; and
- an explicit request for push authorization.

Do not push, merge `server-side`, touch `main`, or begin session closeout without Eston's explicit next instruction.
