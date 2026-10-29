# Session 14 — P5 Mission floor: offline resilience + localized country names

**Date:** 2026-07-01
**Branch:** `ui`
**Roadmap:** `MASTER_TODO.md` §7 **P5 — Mission floor** (the north-star-#1 usability floor for the
Kenya/Nigeria/Malawi/DRC pilot cohort on cheap Androids + intermittent, expensive data).
**Status:** approved design → implementation plan next.

---

## 1. Context & the reframe

P5 is the "make it usable by the people the mission is FOR" tier. The 2026-06-29 nine-persona review
flagged three sub-items: low-bandwidth/offline, no Chichewa UI locale, and fixture content English in every
locale. This session takes the **BLOCKER-class offline slice + the small localized-country-names quick win**
as its anchor; Chichewa and content-translation strategy are explicitly deferred to follow-up sessions.

**Chosen mechanism:** the *lighter in-app approach* — **no service worker / PWA**. We cache nothing at the
network layer, own no SW lifecycle/cache-invalidation against the GitHub-Pages `BASE_URL` basename +
`404.html` deep-link shim, and don't touch the `DEMO_VERSION`/localStorage reseed interplay. Offline
usefulness comes from data-saver image handling + an honest offline indicator.

**Key premise correction (verified vs HEAD `a359d06`):** offline is **not greenfield**. A complete
"**Lane F — connectivity kit**" already exists at `src/components/shared/connectivity/`:
`useDataSaver` (provider-free `useSyncExternalStore` + localStorage store), `SmartImage`
(data-saver initials/icon placeholder + native `loading="lazy"` + `decoding="async"`), `DataSaverToggle`
(accessible `role="switch"`), plus `SyncBadge` / `ChannelBadge`. The kit is token-pure and already
i18n-wired (`connectivity.*` keys present in en/fr/sw). **But it is orphaned** — its only consumer is the
`/lab/presence` dev route (`PresenceLabRoute` / `PresenceShowcase`). Real users never see it. So the offline
work is mostly **adopt-and-wire the existing kit + fill two genuine gaps**, not a fresh build.

**Verified-accurate premises (HEAD `a359d06`):**
- No PWA/SW/manifest/workbox anywhere; `public/` has only `404.html`, `icon.svg`, `vite.svg`.
- `Locale = 'en' | 'fr' | 'sw'` (hard union); `translate()` falls back to `DICTS.en` per key.
- `getCountryName(code)` (`src/utils/countries.ts:223`) takes only `code`, returns the curated English name.
- `MandateCard.tsx:14` already does `new Intl.DisplayNames([locale], {type:'region'}).of(code)` locally.
- No `navigator.onLine` / online-offline handling exists anywhere.
- `App.tsx` carries a **FROZEN ROUTE MAP** rule ("lanes must NOT edit App.tsx"); it is route-specific, and
  `StageFooter` is already mounted as a global shell element in `AppContent`.

---

## 2. Scope

**In scope**
1. **Adopt the connectivity kit** — wire `SmartImage` into real network-image sites; surface
   `DataSaverToggle` in Identity settings.
2. **Online/offline detection + offline Banner** — new `useOnline` hook + `OfflineBanner`, mounted globally.
3. **Localized country names** — `getCountryName(code, locale?)` via `Intl.DisplayNames`, threaded through the
   country-display call sites.

**Out of scope (follow-ups)**
- Last-view cache to localStorage.
- Extended WhatsApp-shareable summary on problem/solution cards (mandate already has S11's share).
- Chichewa (`ny`) locale.
- Content-translation strategy (backend-adjacent → Ouri coordination doc, a later session).
- `SyncBadge` / `ChannelBadge` wiring — **deferred to the backend** (see Unit 1 rationale).

---

## 3. Units

### Unit 1 — Adopt the connectivity kit

**1a. `SmartImage` at real network-image sites.** Replace raw `<img>` that fetch remote/user photos so
data-saver mode actually cuts bytes and images lazy-load. Candidate sites (finalize exact list in the plan by
reading each — only swap sites that render a *network* image, and preserve current sizing/rounding/alt):
- `src/components/community/Members.tsx` — member avatars.
- `src/components/identity/DigitalAgentCard.tsx` — `userPhoto`.
- `src/components/shared/RoleDisplay.tsx` — avatar.
- `src/components/onboarding/steps/ReadyStep.tsx` — photo.
- `src/components/community/dialogs/ApprovalDialog.tsx` — avatar **only if** it's a network photo.

**Skip (with reason):** `GlokiMark` (bundled brand asset — always wanted, no data-saver benefit),
`PhotoPicker` (local upload preview — a blob, no bytes on the wire), `QRScannerDialog` (camera/QR, not a
content image).

`SmartImage` requires `src` + `alt` and takes `size`/`rounded`/`fallbackLabel`/`className`. Each swap must map
the existing element's dimensions to `size`, its circle-crop to `rounded`, and keep the existing `alt`. Where a
site currently has non-square images or CSS-driven sizing, keep behaviour equivalent (do not regress layout).

**1b. `DataSaverToggle` in Identity settings.** Surface the toggle where `LanguageSwitcher` already lives in
the identity/settings area so users can actually enable data-saver. Reuse the existing `connectivity.dataSaver`
/ `connectivity.dataSaverHint` strings (already in en/fr/sw).

**1c. `SyncBadge` / `ChannelBadge` — deferred.** The demo seam has no pending-write/sync-queue or channel
state to reflect; wiring them now would be decorative and misleading. They remain in the kit for when Ouri's
backend provides real sync state. (Confirmed with Eston during brainstorming.)

### Unit 2 — Online/offline detection + offline Banner

**2a. `useOnline` hook.** New hook (co-located in `src/components/shared/connectivity/`, exported from the
kit `index.ts`) built in the same provider-free `useSyncExternalStore` style as `useDataSaver`:
- Module-level `value` initialised from `navigator.onLine` (guard `typeof navigator`), a `Set` of listeners,
  and a single pair of `window.addEventListener('online' | 'offline', …)` that update `value` and `emit()`.
- `getServerSnapshot` returns `true` (assume online — harmless in this CSR app).
- Returns a boolean `online`.

**2b. `OfflineBanner` component.** New component in the connectivity kit. Renders the shared `Banner`
primitive with `tone="warning"` (→ `role="status"`, an `aria-live="polite"` region, so the state change is
announced to screen readers). Copy: title "You're offline" + body "Some content may not load until you
reconnect." Renders `null` when `online === true`. No dismiss button (state-driven, not user-dismissed).
Token-pure and reduced-motion-safe by inheritance from `Banner`.

**2c. Global mount.** Mount `<OfflineBanner />` once inside `AppContent` in `App.tsx`, adjacent to the
existing global `StageFooter`. This is a global shell element, **not a new route**, so it respects the frozen
route-map rule. Position it so it doesn't overlap the fixed `StageFooter` or steal the single `<h1>` /
landmark structure (render above the routed content / as a top status strip; verify at 360px).

### Unit 3 — Localized country names

**3a. `getCountryName(code, locale?)`.** Extend the signature (locale optional → backward compatible):
```ts
export function getCountryName(code: string, locale?: string): string {
  if (locale && code !== 'OTHER') {
    try {
      const localized = new Intl.DisplayNames([locale], { type: 'region' }).of(code);
      if (localized) return localized;
    } catch { /* unsupported env/code — fall through to curated name */ }
  }
  return getCountryByCode(code).name;
}
```
`OTHER` keeps its caller-side translation (`t('country.other', …)`), matching current `CountryMultiSelect`.
Optionally memoize the `Intl.DisplayNames` instance per-locale at module scope to avoid per-call construction;
a plain call is acceptable if simpler — decide in the plan.

**3b. Fold `MandateCard`'s local helper.** Remove the local `Intl.DisplayNames` inline in `MandateCard.tsx`
and call `getCountryName(code, locale)` instead — single source of truth.

**3c. Thread `locale`.** At each country-display call site, pass `locale` from `useI18n()`/`useT` context:
`CountryMultiSelect`, `CountryFlag`, `CountryParticipation`, `CountryPresence`,
`ConvictionStaking`, `ApprovalFlow`, `AdoptionFramework`, `WorldMapLite`. (`WorldMapLite` is presence-lab
adjacent — thread it for consistency but it is low-traffic.) Call sites that already consume i18n will pass
`locale`; verify none regress when `locale === 'en'` (Intl returns English → identical to curated for the
pilot set).

---

## 4. Cross-cutting constraints

- **Design system:** tokens only; reuse `Banner` (role pattern) + the existing kit. No new colors.
- **A11y:** AA contrast (light+dark); single `<h1>` per route preserved; landmark/skip-link intact; the
  offline banner announced via `role="status"`; `DataSaverToggle` keeps its `role="switch"` semantics.
- **Responsive:** 360px flagship; verify light + dark; reduced-motion token-pure (inherited from `Banner`).
- **i18n:** new/changed strings at **fr + sw key parity** (flat dotted keys; en inline via `t('key','English')`).
  New keys: `connectivity.offline.title`, `connectivity.offline.body` (reuse existing `connectivity.dataSaver*`).
  Parity check with a **position-agnostic set diff** — `grep -oE "^ *'[^']+':" src/i18n/fr.ts | sort -u` vs same
  for `sw.ts`, compared with `comm` (NOT line `diff`, NOT `sed \s` — macOS BSD sed lacks `\s` → false diffs).
  Append new fr/sw strings to `docs/i18n-native-review-candidates.md`.
- **DEMO_VERSION:** **no bump** — no fixtures change (offline + country-name localization are UI-only).
- **Seam rule:** no component calls a real server; everything stays behind `src/services/api.ts`. (This slice
  touches no reads/writes — purely presentational + a browser-connectivity hook.)
- **Build:** `npm run build` (`tsc -b`) clean before each commit. No test framework → verify via `npm run dev`
  + `preview_*` at 360px, toggling offline (DevTools offline / `navigator.onLine` + dispatching
  `online`/`offline` events) and data-saver.

---

## 5. Verification plan

1. `tsc -b` / `npm run build` clean.
2. Preview @360px light + dark:
   - Data-saver OFF → real avatars fetch + lazy-load; ON → initials/icon placeholders, no image requests.
   - `DataSaverToggle` visible + operable in Identity settings; state persists across reload (localStorage).
   - Dispatch `offline` event → `OfflineBanner` appears (warning, announced); dispatch `online` → hidden.
   - Country dropdown + display chips show localized names under fr/sw; identical to before under en.
3. i18n parity set-diff passes (fr == sw key sets).
4. **Opus whole-branch review is the gate** (local multi-model panel is effectively unavailable — cloud
   reviewers down, local Ollama RAM-gated; confirm with Eston, do NOT pass `--free-ram`/`--quit-chrome`).

---

## 6. Risks / notes

- **App.tsx edit:** minimal, shell-level (one global element), consistent with `StageFooter`; not a route.
  Keep the diff tiny.
- **SmartImage layout regressions:** the main risk. Each swap must preserve size/rounding/alt; verify each
  visually. If a site uses CSS background-images or non-square dimensions, adapt or skip rather than regress.
- **Intl.DisplayNames coverage:** covers fr/sw region names in modern browsers; the `try/catch` + curated
  fallback keeps it safe on any gap. Pilot-country names verified under fr/sw during preview.
- **Push:** confirm any push to `origin/ui` with Eston. PR #20's ✗ vs `main` is expected Ouri-divergence,
  not a build failure.
- Repo is on a slow external USB drive — small sequential I/O; single shared preview browser.
