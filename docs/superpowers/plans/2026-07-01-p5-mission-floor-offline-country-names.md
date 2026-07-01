# P5 Mission Floor — Offline Resilience + Localized Country Names — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the pipeline usable by the pilot cohort on cheap Androids / intermittent data by adopting the orphaned "Lane F connectivity kit" into the real app, adding an honest online/offline indicator, and localizing country names.

**Architecture:** Lighter in-app approach — **no service worker**. Wire the existing `SmartImage`/`DataSaverToggle`/`useDataSaver` primitives (currently only reachable via `/lab/presence`) into real surfaces; add a provider-free `useOnline` hook + `OfflineBanner` mounted once in the App shell; extend `getCountryName(code, locale?)` with `Intl.DisplayNames` and thread `locale` through call sites.

**Tech Stack:** React 19 + TypeScript + Vite + SCSS Modules; `useSyncExternalStore` (matches existing `useDataSaver`); the shared `Banner` primitive; `Intl.DisplayNames`.

## Global Constraints

- **No test framework** — each task's verification is `npm run build` (`tsc -b` must pass) + `preview_*` checks at 360px, light + dark. There are no unit tests to write.
- **Tokens only**; reuse the design-system kit + `Banner` role pattern. No new colors/hardcoded values.
- **A11y:** AA contrast (light + dark); single `<h1>` per route preserved; landmark/skip-link intact; offline banner announced via `role="status"`; `DataSaverToggle` keeps `role="switch"`.
- **Responsive:** 360px flagship; reduced-motion token-pure (inherited from `Banner`).
- **i18n:** new/changed strings at **fr + sw key parity** (flat dotted keys; en inline via `t('key','English')`). Parity check with a **position-agnostic set diff**: `grep -oE "^ *'[^']+':" src/i18n/fr.ts | sort -u` vs same for `sw.ts`, compared with `comm` — NOT line `diff`, NOT `sed \s` (macOS BSD sed lacks `\s`). New fr/sw strings appended to `docs/i18n-native-review-candidates.md`.
- **DEMO_VERSION:** **no bump** — no fixtures change.
- **Seam rule:** no component calls a real server; everything behind `src/services/api.ts`. (This slice touches no reads/writes.)
- **Do NOT edit `App.tsx` routes** (frozen route map). Mounting one global non-route element (like the existing `StageFooter`) is allowed.
- **Branch `ui`; keep runnable. Confirm any push to `origin/ui` with Eston.**
- Repo on a slow external USB drive — small sequential I/O; single shared preview browser.

---

## Task 1: Localized country-name core (`getCountryName(code, locale?)`)

**Files:**
- Modify: `src/utils/countries.ts:223-225`
- Modify: `src/components/mandate/MandateCard.tsx:12-16` (fold the local `Intl.DisplayNames` helper)

**Interfaces:**
- Produces: `getCountryName(code: string, locale?: string): string` — when `locale` is given and `code !== 'OTHER'`, returns the `Intl.DisplayNames` region name, falling back to the curated English name; unchanged (English) when `locale` omitted.

- [ ] **Step 1: Extend `getCountryName`**

Replace `src/utils/countries.ts:223-225` with:

```ts
// Cache one Intl.DisplayNames instance per locale — constructing it per call is wasteful.
const REGION_NAMES = new Map<string, Intl.DisplayNames>();

function regionNames(locale: string): Intl.DisplayNames | null {
  const hit = REGION_NAMES.get(locale);
  if (hit) return hit;
  try {
    const dn = new Intl.DisplayNames([locale], { type: 'region' });
    REGION_NAMES.set(locale, dn);
    return dn;
  } catch {
    return null;
  }
}

export function getCountryName(code: string, locale?: string): string {
  if (locale && code !== 'OTHER') {
    const localized = regionNames(locale)?.of(code);
    if (localized && localized !== code) return localized;
  }
  return getCountryByCode(code).name;
}
```

- [ ] **Step 2: Fold `MandateCard`'s local helper**

In `src/components/mandate/MandateCard.tsx`, remove the local region-name helper (the function wrapping `new Intl.DisplayNames([locale], { type: 'region' })` around line 12-16) and its call, replacing usage with `getCountryName(code, locale)`. Add the import if missing:

```ts
import { getCountryName } from '../../utils/countries';
```

Ensure `locale` is available from the existing i18n hook in that component (it already uses `Intl.DisplayNames([locale],…)`, so `locale` is in scope).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `tsc -b` passes, no errors.

- [ ] **Step 4: Preview-verify**

Start `gloki-dev` (port 5173) if not running. Navigate to a published mandate (`/mandate/:cid/:mid`). Switch locale to fr, then sw (LanguageSwitcher on the login screen, or set `localStorage['gloki.locale']`). Confirm adopter country names render localized (e.g. "Kenya" → "Kenya"/"Kénya" as Intl provides) and en is unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/utils/countries.ts src/components/mandate/MandateCard.tsx
git commit -m "feat(s14): getCountryName(code, locale) via Intl.DisplayNames + fold MandateCard helper"
```

---

## Task 2: Thread `locale` through country call sites

**Files (all Modify):**
- `src/components/shared/CountryFlag.tsx:16`
- `src/components/shared/CountryParticipation.tsx:25`
- `src/components/shared/CountryPresence.tsx:39-40`
- `src/components/shared/CountryMultiSelect.tsx:49`
- `src/components/collaboration/flows/voting/ConvictionStaking.tsx:219`
- `src/components/collaboration/flows/voting/ApprovalFlow.tsx:317`
- `src/components/mandate/AdoptionFramework.tsx:177`
- `src/components/identity/Profile.tsx:136` (SearchableSelect option labels)

**Interfaces:**
- Consumes: `getCountryName(code, locale)` from Task 1.

For each file: obtain `locale` from the existing i18n hook and pass it to every `getCountryName(code)` call. The idiom in this codebase is `const { locale } = useI18n();` (or add `locale` to an existing `useI18n()` destructure). Where a component currently only calls `useT()`, switch to `const { t, locale } = useI18n();` and derive `t` from it (`useI18n` returns `{ t, locale, … }`).

- [ ] **Step 1: `CountryFlag.tsx`**

Add `locale` from `useI18n()` and change line 16 to `const name = getCountryName(code, locale);`. If the component has no i18n hook yet, add `import { useI18n } from '../../i18n';` and `const { locale } = useI18n();`.

- [ ] **Step 2: `CountryParticipation.tsx`**

Pass `locale` to `getCountryName(code, locale)` at line 25 (title). Add `locale` from `useI18n()` if not present.

- [ ] **Step 3: `CountryPresence.tsx`**

Pass `locale` to both `getCountryName(code)` calls (lines 39, 40). Add `locale` from `useI18n()` if not present.

- [ ] **Step 4: `CountryMultiSelect.tsx`**

Line 49 currently: `code === 'OTHER' ? t('country.other', 'Other') : getCountryName(code);` → change to `getCountryName(code, locale)`. `useI18n`/`t` is already present; add `locale` to the destructure.

- [ ] **Step 5: `ConvictionStaking.tsx` and `ApprovalFlow.tsx`**

Pass `locale` to `getCountryName(country, locale)` at ConvictionStaking:219 and ApprovalFlow:317. Add `locale` from `useI18n()` in each if not present.

- [ ] **Step 6: `AdoptionFramework.tsx`**

Pass `locale` to `getCountryName(adopter.country, locale)` at line 177. Add `locale` from `useI18n()` if not present.

- [ ] **Step 7: `Profile.tsx` country dropdown**

At `src/components/identity/Profile.tsx:134-142`, the `SearchableSelect` options are built from `COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }))`. Change `label: c.name` to `label: getCountryName(c.code, locale)` (and the OTHER option likewise, keeping its flag). Add imports/`locale`:

```ts
import { getCountryName } from '../../utils/countries';
import { useI18n } from '../../i18n';
// inside component:
const { locale } = useI18n();
```

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: `tsc -b` passes.

- [ ] **Step 9: Preview-verify (fr + sw)**

At 360px: open Profile → Edit profile → country dropdown shows localized names under fr/sw; open a vote/results view with country breakdown (`ConvictionStaking`/`ApprovalFlow`) and confirm country labels localize; confirm en unchanged. Verify light + dark.

- [ ] **Step 10: Commit**

```bash
git add src/components/shared/CountryFlag.tsx src/components/shared/CountryParticipation.tsx src/components/shared/CountryPresence.tsx src/components/shared/CountryMultiSelect.tsx src/components/collaboration/flows/voting/ConvictionStaking.tsx src/components/collaboration/flows/voting/ApprovalFlow.tsx src/components/mandate/AdoptionFramework.tsx src/components/identity/Profile.tsx
git commit -m "feat(s14): thread locale through country-name call sites"
```

---

## Task 3: `useOnline` hook + `OfflineBanner` + global mount + i18n keys

**Files:**
- Create: `src/components/shared/connectivity/useOnline.ts`
- Create: `src/components/shared/connectivity/OfflineBanner.tsx`
- Modify: `src/components/shared/connectivity/index.ts` (export both)
- Modify: `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/sw.ts` (add `connectivity.offlineBanner.*` — 2 keys each)
- Modify: `src/App.tsx` (mount `<OfflineBanner />` in the shell, next to `StageFooter`)
- Modify: `docs/i18n-native-review-candidates.md` (append the 4 new fr/sw strings)

**Interfaces:**
- Produces: `useOnline(): boolean` and `OfflineBanner: React.FC`.

Note: `connectivity.offline` (='Offline') already exists (used by `SyncBadge`); use the distinct namespace `connectivity.offlineBanner.title` / `connectivity.offlineBanner.body` to avoid ambiguity.

- [ ] **Step 1: Create `useOnline.ts`**

```ts
import { useSyncExternalStore } from 'react';

// Provider-free connectivity state, mirroring the useDataSaver store shape.
// Backed by navigator.onLine + the browser online/offline events; no <Provider> needed.

const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  } catch {
    return true;
  }
}

let value = read();

function emit() {
  value = read();
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', emit);
  window.addEventListener('offline', emit);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** `const online = useOnline();` — true when the browser reports a connection. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => value,
    () => true, // server snapshot — assume online (harmless in this CSR app)
  );
}
```

- [ ] **Step 2: Create `OfflineBanner.tsx`**

```tsx
import React from 'react';
import Banner from '../Banner';
import { useT } from '../../../i18n';
import { useOnline } from './useOnline';

/**
 * Global, state-driven offline indicator. Renders the shared Banner
 * (tone="warning" → role="status", announced to screen readers) only while
 * the browser reports no connection. No dismiss — it reflects live state.
 */
const OfflineBanner: React.FC = () => {
  const t = useT();
  const online = useOnline();
  if (online) return null;
  return (
    <Banner tone="warning" title={t('connectivity.offlineBanner.title', "You're offline")}>
      {t('connectivity.offlineBanner.body', 'Some content may not load until you reconnect.')}
    </Banner>
  );
};

export default OfflineBanner;
```

- [ ] **Step 3: Export from the kit**

In `src/components/shared/connectivity/index.ts` add:

```ts
export { default as OfflineBanner } from './OfflineBanner';
export { useOnline } from './useOnline';
```

- [ ] **Step 4: Add i18n keys**

In `src/i18n/en.ts`, after `'connectivity.viaUssd': …,` (line ~94) add:

```ts
  'connectivity.offlineBanner.title': "You're offline",
  'connectivity.offlineBanner.body': 'Some content may not load until you reconnect.',
```

In `src/i18n/fr.ts`, after its `'connectivity.viaUssd': …,` add:

```ts
  'connectivity.offlineBanner.title': 'Vous êtes hors ligne',
  'connectivity.offlineBanner.body': 'Certains contenus peuvent ne pas se charger tant que vous n’êtes pas reconnecté.',
```

In `src/i18n/sw.ts`, after its `'connectivity.viaUssd': …,` add:

```ts
  'connectivity.offlineBanner.title': 'Uko nje ya mtandao',
  'connectivity.offlineBanner.body': 'Baadhi ya maudhui yanaweza yasipakie hadi utakapounganishwa tena.',
```

- [ ] **Step 5: Mount in the App shell**

In `src/App.tsx`, add the import (with the other shared imports):

```ts
import { OfflineBanner } from './components/shared/connectivity';
```

Inside `AppContent`'s returned tree, mount it as a global element within `<Router>` above `<Routes>` so it sits atop routed content:

```tsx
      <Router basename={getBasename()}>
        <OfflineBanner />
        <Suspense …>
          <Routes>
            …
          </Routes>
          <StageFooter />
        </Suspense>
      </Router>
```

Do not add or modify any `<Route>`.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: `tsc -b` passes.

- [ ] **Step 7: Preview-verify offline toggle**

In the preview, simulate offline. Two ways: DevTools Network → Offline, or via `preview_eval`:

```js
window.dispatchEvent(new Event('offline'));
```

Confirm the banner appears (warning tone, "You're offline"). Then:

```js
window.dispatchEvent(new Event('online'));
```

Confirm it disappears. Verify at 360px, light + dark, that the banner does not overlap the fixed `StageFooter` or the page `<h1>`/skip-link. Switch locale to fr/sw and re-trigger offline to confirm translated copy.

- [ ] **Step 8: i18n parity check**

Run:

```bash
comm -3 <(grep -oE "^ *'[^']+':" src/i18n/fr.ts | tr -d " '" | sort -u) <(grep -oE "^ *'[^']+':" src/i18n/sw.ts | tr -d " '" | sort -u)
```

Expected: no output (fr and sw key sets identical).

- [ ] **Step 9: Append to native-review doc**

Add the 4 new fr/sw strings (`connectivity.offlineBanner.title/body`) to `docs/i18n-native-review-candidates.md` under a Session-14 heading, matching the file's existing format.

- [ ] **Step 10: Commit**

```bash
git add src/components/shared/connectivity/useOnline.ts src/components/shared/connectivity/OfflineBanner.tsx src/components/shared/connectivity/index.ts src/i18n/en.ts src/i18n/fr.ts src/i18n/sw.ts src/App.tsx docs/i18n-native-review-candidates.md
git commit -m "feat(s14): useOnline hook + global OfflineBanner + fr/sw parity keys"
```

---

## Task 4: Adopt `SmartImage` at avatar sites

**Files (all Modify):**
- `src/components/community/Members.tsx` (two `<img src={profileImage}>` renders — lines ~43 and ~122 area)
- `src/components/identity/DigitalAgentCard.tsx:26`
- `src/components/shared/RoleDisplay.tsx:31`
- `src/components/onboarding/steps/ReadyStep.tsx:31`

**Interfaces:**
- Consumes: `SmartImage` from `src/components/shared/connectivity` — `<SmartImage src alt fallbackLabel? size? rounded? className? />`. When data-saver is ON it renders an initials/icon placeholder (sized by `size`); otherwise a lazy `<img>`.

**Skip (with reason):** `ApprovalDialog` (288px hero photo → a full-size initials placeholder is poor UX; single image behind a user action = negligible data-saver value) and `PhotoPicker`/`QRScannerDialog`/`GlokiMark` (local blob / camera / bundled brand asset — no bytes-on-wire benefit).

**Recipe (per site):** replace the `{photo ? <img … /> : <fallback/>}` so the `<img>` branch becomes `<SmartImage>` with `size` = the container px, `rounded` (all these avatars are circular), `fallbackLabel` = the person's display name (so the data-saver placeholder shows correct initials), and the existing `className`/`alt` preserved. Keep the existing non-photo fallback branch untouched.

- [ ] **Step 1: `Members.tsx`**

Add `import { SmartImage } from '../shared/connectivity';`. Replace each `<img src={profileImage} alt={displayName} className={styles.avatarImage} />` with:

```tsx
<SmartImage src={profileImage} alt={displayName} fallbackLabel={displayName} size={56} rounded className={styles.avatarImage} />
```

(Both the list render and the header render. The `.memberAvatar` is 56px; the responsive 48px variant still contains the placeholder since the container has `overflow`.)

- [ ] **Step 2: `DigitalAgentCard.tsx`**

Add the import. Replace line 26's img:

```tsx
{agent.photo ? (
  <SmartImage src={agent.photo} alt="" fallbackLabel={agent.displayName} size={64} rounded />
) : (
  <span>{getInitials(agent.displayName)}</span>
)}
```

(`.avatar` is 64px; container is `aria-hidden`, so `alt=""` is correct.)

- [ ] **Step 3: `RoleDisplay.tsx`**

Add the import. Replace line 31's img:

```tsx
{photo ? (
  <SmartImage src={photo} alt={title} fallbackLabel={title} size={22} rounded />
) : (
  <span>{init}</span>
)}
```

(`.avatar` is 22px.)

- [ ] **Step 4: `ReadyStep.tsx`**

Add the import. Replace line 31's img:

```tsx
{agent?.photo ? (
  <SmartImage src={agent.photo} alt="" fallbackLabel={name || ''} size={56} rounded />
) : (
  <span>{getInitials(name || '')}</span>
)}
```

(`.recapAvatar` is 56px; container is `aria-hidden`.)

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: `tsc -b` passes.

- [ ] **Step 6: Preview-verify (data-saver OFF then ON)**

At 360px, light + dark: with data-saver OFF (default), confirm avatars render photos and lazy-load (Members list, a profile card, an onboarding recap). Then enable data-saver (Task 5 wires the toggle; until then flip it via `preview_eval`):

```js
localStorage.setItem('gloki.dataSaver','true'); window.dispatchEvent(new StorageEvent('storage',{key:'gloki.dataSaver'}));
```

Confirm each swapped avatar now shows an initials placeholder at the correct size/shape (no layout shift), and no network requests fire for those images (check `preview_network`). Reset:

```js
localStorage.setItem('gloki.dataSaver','false'); window.dispatchEvent(new StorageEvent('storage',{key:'gloki.dataSaver'}));
```

- [ ] **Step 7: Commit**

```bash
git add src/components/community/Members.tsx src/components/identity/DigitalAgentCard.tsx src/components/shared/RoleDisplay.tsx src/components/onboarding/steps/ReadyStep.tsx
git commit -m "feat(s14): adopt SmartImage (data-saver + lazy-load) at avatar sites"
```

---

## Task 5: Surface `DataSaverToggle` in Profile preferences

**Files:**
- Modify: `src/components/identity/Profile.tsx` (add a preferences section rendering `DataSaverToggle`)
- Modify: `src/components/identity/Profile.module.scss` (only if a small wrapper style is needed — prefer reusing existing spacing tokens/classes)

**Interfaces:**
- Consumes: `DataSaverToggle` from `src/components/shared/connectivity` (self-contained; reads/writes the shared `useDataSaver` store). Reuses existing `connectivity.dataSaver` / `connectivity.dataSaverHint` strings (already in en/fr/sw — no new keys).

- [ ] **Step 1: Render the toggle**

In `src/components/identity/Profile.tsx`, add `import { DataSaverToggle } from '../shared/connectivity';`. After the Network-identity disclosure block (after the `{showIdentity && (…)}` Card, before the Edit `Modal`), add a preferences section:

```tsx
      {/* Preferences — device-local, apply immediately */}
      <section className={styles.prefs} aria-label={t('profile.prefs', 'Preferences')}>
        <DataSaverToggle />
      </section>
```

Use an existing spacing class if `styles.prefs` isn't defined; otherwise add a minimal `.prefs { margin-top: $space-4; }`-style rule using tokens (check `Profile.module.scss` for the token names already in use).

- [ ] **Step 2: Add the `profile.prefs` i18n label (3 langs)**

Add `'profile.prefs': 'Preferences',` to `en.ts`, `'profile.prefs': 'Préférences',` to `fr.ts`, `'profile.prefs': 'Mapendeleo',` to `sw.ts` (place near other `profile.*` keys). Append the fr/sw strings to `docs/i18n-native-review-candidates.md`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `tsc -b` passes.

- [ ] **Step 4: Preview-verify**

At 360px, light + dark: open `/identity/profile`. Confirm the Data-saver switch appears, is keyboard-operable (`role="switch"`, `aria-checked` flips), and toggling it immediately changes the avatars from Task 4 (photos ↔ initials placeholders). Reload the page and confirm the toggle state persists (localStorage). Confirm the switch label localizes under fr/sw.

- [ ] **Step 5: i18n parity check**

Run:

```bash
comm -3 <(grep -oE "^ *'[^']+':" src/i18n/fr.ts | tr -d " '" | sort -u) <(grep -oE "^ *'[^']+':" src/i18n/sw.ts | tr -d " '" | sort -u)
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/identity/Profile.tsx src/components/identity/Profile.module.scss src/i18n/en.ts src/i18n/fr.ts src/i18n/sw.ts docs/i18n-native-review-candidates.md
git commit -m "feat(s14): surface DataSaverToggle in Profile preferences"
```

---

## Final verification (after all tasks)

- [ ] `npm run build` clean on the full branch.
- [ ] Full 360px light + dark walkthrough: offline banner (fr/sw), data-saver toggle + placeholders, localized country names in Profile dropdown + vote/mandate country breakdowns.
- [ ] i18n parity set-diff clean (fr == sw).
- [ ] **Opus whole-branch review is the gate** (local multi-model panel effectively unavailable — confirm with Eston; do NOT pass `--free-ram`/`--quit-chrome`).
- [ ] Update `MASTER_TODO.md` §7 (mark the P5 offline + country-names slice done) and §8 changelog; update project memory.
- [ ] **Confirm push to `origin/ui` with Eston** before pushing.

## Self-review notes

- **Spec coverage:** Unit 1 → Tasks 4 & 5; Unit 2 → Task 3; Unit 3 → Tasks 1 & 2. SyncBadge/ChannelBadge intentionally deferred (spec §Unit 1c). Last-view cache / extended share / Chichewa / content-translation out of scope per spec §2.
- **Type consistency:** `getCountryName(code, locale?)`, `useOnline(): boolean`, `OfflineBanner: React.FC`, `SmartImage` props (`src/alt/fallbackLabel/size/rounded/className`) used consistently across tasks.
- **No new fixtures → no DEMO_VERSION bump.**
