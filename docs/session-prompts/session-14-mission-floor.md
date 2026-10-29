# Session 14 — Mission floor (P5)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). The build-ordered roadmap
(**P0 pilot-readiness → P1 navigation/IA → P2 trust/privacy/consent → P3 evidence & expertise → P4 mandate
rigor**) is **complete and deployed** on `origin/ui` (P4/S13 @ `5e2b176`, Pages green). `MASTER_TODO.md` §7 is
now at **P5 — Mission floor**: the north-star-#1 gaps the pilot itself will hit. This is where the product
stops being demo-credible and starts being *usable by the actual pilot cohort* — "a young person on a cheap
Android with intermittent data and English as a third language, participating without anyone sitting next to
them" (§1). The 2026-06-29 nine-persona review flagged all three sub-items (Thandiwe/Pascal on intermittent
expensive data; no Chichewa; fixture content English in every locale).

## ⚠️ This one needs a scoping pass FIRST — there are NO locked decisions yet
Unlike S13 (which had a pre-written spec from S12's scoping), P5 has **no locked decisions**. It is also
**large and multi-part** — realistically more than one session. So the first move is **`superpowers:brainstorming`
with Eston** to lock scope + the engineering decisions below, then **recommend an anchor**, then spec → plan →
build the anchored slice. Do NOT try to build all three sub-items blind in one pass.

**Recommended anchor (surface to Eston, recommend-then-confirm):** make **low-bandwidth / offline mode** the
session's build focus (it's the BLOCKER-class, north-star-#1 item and fully ui-shippable), bundle the small
**localized country names** quick win, and treat **Chichewa locale** + **content-translation strategy** as
scoping decisions that likely become their own follow-up sessions (the latter is backend-adjacent — Ouri's
track). But confirm the anchor with Eston in the brainstorm; he may want a different slice.

## Re-verify these premises vs HEAD (the recurring S10/S11/S12/S13 lesson — S13's storage seam was NOT as the prompt described)
As of `5e2b176` these were checked and are accurate — re-confirm before building:
- **No PWA / service worker exists.** `public/` has only `404.html`, `icon.svg`, `vite.svg` — no `manifest.json`,
  no `vite-plugin-pwa`/`workbox`, no `serviceWorker` registration anywhere. Offline mode is **greenfield**.
- **Locales are a hard-coded union.** `src/i18n/index.tsx`: `LOCALES` (en/fr/sw), `DICTS`, `DEFAULT_LOCALE`,
  and `isLocale()` all enumerate `'en'|'fr'|'sw'`; `Locale` type in `src/i18n/types.ts`. Adding Chichewa (`'ny'`)
  touches all of those + a new `src/i18n/ny.ts` (1109 keys) + `lang.ny` label + the `LanguageSwitcher`.
  translate() already falls back to `en` per-key, so a partial `ny.ts` degrades gracefully.
- **`getCountryName(code)` is NOT locale-aware** (`src/utils/countries.ts:223` — takes only `code`, returns the
  English name). Localized country names is a real gap. Note `MandateCard.tsx` already uses
  `new Intl.DisplayNames([locale],{type:'region'})` locally — the reusable move is to fold that into
  `getCountryName(code, locale)` (Intl.DisplayNames covers fr/sw/ny for region names for free) and thread it
  through `SearchableSelect` consumers.
- **`SearchableSelect`** is generic; country usage flows through `CountryMultiSelect`, `Profile`, `AgentStep`,
  and the write-together `ProblemTagPicker`/`StartDraftForm`. The localized-name change is at the option-label
  source, not the component.
- **All fixture/content text is English in every locale** (problem titles, comments, solutions, mandate body) —
  the content-translation gap. This is a *strategy/decision* item (per-card translate affordance vs pre-translated
  fixtures vs backend), NOT a mechanical build — coordinate with Ouri.

**Surface anything already-done or materially narrower to Eston (recommend-then-confirm) before building**, as
S10/S11/S12/S13 did.

## Open decisions to lock in the brainstorm (these are Eston's calls)
1. **Session anchor** — offline-mode + country-names (recommended) vs a different P5 slice.
2. **Offline caching mechanism** — Vite PWA plugin + Workbox service worker (real offline, app-shell + asset
   precache, but adds a build dep + SW lifecycle/versioning to reason about — note the existing
   `DEMO_VERSION`/localStorage reseed interplay) **vs** a lighter in-app approach (cache last-view state to
   localStorage + an offline banner + defer/lazy images), no SW. Recommend the lighter approach first if the
   goal is "cache last view + defer images + offline state" without owning SW cache-invalidation on a
   GitHub-Pages SPA. Get Eston's call — it's the biggest architectural fork.
3. **"WhatsApp-shareable summary"** — scope: which surface(s) get a share-summary (mandate already has a
   share link from S11; extend to problem/solution?), and the format (plain-text summary via
   `navigator.share`/clipboard, the S11 MandateCard pattern).
4. **Offline UX** — what a not-yet-loaded / offline view shows (banner tone, "you're offline — showing your
   last view", retry), and whether images get a lightweight placeholder while deferred.
5. **Chichewa** — this session or a follow-up? If this session, who provides the translations (machine draft +
   native review, appended to `docs/i18n-native-review-candidates.md`)? Note fr/sw native review is *still*
   human-gated and unshipped — adding `ny` widens that backlog.
6. **Content translation** — defer to an Ouri-coordination decision doc, or attempt a UI "traduire this"
   affordance stub on ui now? (Backend-adjacent; likely defer.)

## Why this is next
P0–P4 made the pipeline reachable → navigable → trustworthy → checkable → its output institutionally credible.
**P5 makes it usable by the people the mission is FOR** — the Kenya/Nigeria/Malawi/DRC pilot cohort on cheap
Androids and intermittent data (§1 usability-first is north-star #1; the concrete bar is the Voices-for-the-
Climate KPI: **≥70% complete the journey unaided**). Offline resilience + their own languages + content they
can read are the floor beneath that KPI.

## Read first (carry the context)
- `MASTER_TODO.md` §1–2 (the two north-stars + the VftC mission + the ≥70%-unaided KPI), §7 **P5** (the
  canonical item list + severities), §8 changelog (the 2026-06-29 findings + P0–P4 shipped entries).
- Project memory: `project_session13_mandate_rigor_jul2026` (P4 + the ★ premise-correction + the macOS-sed
  i18n-parity learning), `project_persona_review_jun2026` (the P0–P6 roadmap + the low-bandwidth/Chichewa/
  content-in-English findings), `project_ui_redesign_apr2026` + `project_hierarchy_a11y_review_jun2026` (the
  full fr/sw parity + `LanguageSwitcher` + shared `CountryMultiSelect` history), and the `MEMORY.md` index.
- `CLAUDE.md` — the **seam rule** (all reads/writes via `src/services/api.ts`; demo seam emits no
  `contract_write` events → re-fetch after writes) + the deploy note (GitHub Pages, `public/404.html` SPA
  routing, `tsc -b` must pass). **A service worker on GitHub Pages interacts with the `import.meta.env.BASE_URL`
  basename + `404.html` deep-link shim — reason about that carefully if PWA is chosen.**
- `DESIGN_SYSTEM.md` — tokens, AA, shared primitives (`AppHeader`/`InfoDisclosure`/`Banner`/`UserIdentity`/
  `SourceLinks`/`CountryMultiSelect`/`SearchableSelect`). Any offline banner + image placeholder must be
  token-pure and use the `Banner` role pattern.
- Surfaces P5 touches: `vite.config.*` + `public/` (PWA/manifest if chosen), `src/i18n/{index.tsx,types.ts,
  en.ts,fr.ts,sw.ts}` + a new `ny.ts` (Chichewa), `src/utils/countries.ts` (`getCountryName` localization),
  `src/components/shared/{SearchableSelect,CountryMultiSelect}.tsx`, `LanguageSwitcher`, and wherever images
  render (defer/lazy).

## Scope — P5 (see MASTER_TODO §7 for the canonical list; re-verify each premise vs HEAD first)
1. **[BLOCKER-class, large] Low-bandwidth / offline mode** — cache the last view, defer/lazy images, an
   "offline" state/banner, and a WhatsApp-shareable summary. (Thandiwe/Pascal on intermittent, expensive data.)
   *Mechanism is decision #2 above.*
2. **[MAJOR, large] More UI locales incl. Chichewa** (+ other widely-spoken African languages that exist as
   *profile* tags but not UI locales) and **localized country names** wired into `SearchableSelect`
   (via `getCountryName(code, locale)` using `Intl.DisplayNames`). *The country-names half is a small,
   self-contained quick win; the Chichewa half is large — decision #5.*
3. **[MAJOR, coordinate w/ backend] Content-translation strategy** — fixture/content text is English in every
   locale; decide per-card translation vs a "traduire" affordance vs pre-translated fixtures vs backend.
   Backend-adjacent → coordinate with Ouri. *Likely a decision doc, not a build — decision #6.*

> Cross-references: reuse the S11 MandateCard share pattern for any WhatsApp summary (`navigator.share` →
> clipboard fallback, pubkey-free routes). Reuse `Banner` (role=status) for the offline indicator. Fold the
> `Intl.DisplayNames` pattern already in `MandateCard.tsx` into `getCountryName`. Do NOT add a service worker
> without reasoning through the GitHub-Pages basename + `404.html` + `DEMO_VERSION` reseed interactions.

## Workflow + constraints (same discipline as S1–S13)
- **Brainstorm FIRST** (`superpowers:brainstorming`) to lock the decisions above → write the spec
  (`.superpowers/sdd/s14-*` ledger, namespaced; clean only your own) → `superpowers:writing-plans` → inline
  execution with build+preview checkpoints (as S10–S13) → **Opus whole-branch review**.
- **Re-verify each P5 premise vs HEAD first** (grep `vite.config`, `public/`, `src/i18n/index.tsx`,
  `src/utils/countries.ts`).
- Branch `ui`, keep it runnable. Stay behind `src/services/api.ts`; never call a real server from a component.
- **Tokens only**; reuse the kit + primitives. 360px flagship; verify **light + dark**; **AA gates**;
  reduced-motion token-pure. **Single `<h1>` per route** + landmark/skip-link survive; any live-region /
  disclosure screen-reader announced. Offline banner + image placeholders must be token-pure.
- **i18n:** new/changed strings at **fr + sw (+ ny if in scope) key parity** (flat dotted keys; en inline via
  `t('key','English')`). Run the parity check with a **position-agnostic set diff** — NOT line-positional
  `diff`, and NOT `sed \s` (macOS BSD sed has no `\s` → false diffs; use `grep -oE "^ *'[^']+':"` + `comm` on
  sorted-unique lists, per S13's learning). New fr/sw/ny strings → append to
  `docs/i18n-native-review-candidates.md` (which already carries an unshipped fr/sw native-review backlog).
- **DEMO_VERSION:** bump `global-v16 → v17` only if fixtures change (likely NOT for offline/i18n — check).
- **Production build runs `tsc -b`** — `npm run build` clean before each commit. No test framework: verify via
  build + `preview_*` (`gloki-dev`, port 5173) at 360px. **Test offline by throttling/going offline in the
  preview** (DevTools offline, or `preview_eval` toggling `navigator.onLine` handlers) — reason about the SW
  path where preview can't fully exercise it.
- **Gate:** the local multi-model review panel is effectively unavailable (S11/S12/S13: cloud reviewers down —
  glm 403 / no `GEMINI_API_KEY`; local Ollama RAM-gated). Confirm with Eston; if no coverage, the **Opus
  whole-branch review is the gate** (S5/S6/S8/S11/S12/S13 precedent). Do **not** pass `--free-ram`/`--quit-chrome`.
- Repo is on a **slow external USB drive** — small sequential I/O; the preview is a single shared browser.
- **Confirm any push to `origin/ui` with Eston first.** PR #20's ✗ vs `main` is expected divergence (Ouri's
  real-server layer), not a build failure.
- Update project memory + MASTER_TODO §7/§8 after the session.

When ready: read the context, **brainstorm the P5 scope + decisions with Eston**, recommend the anchor
(offline-mode + localized country names), re-verify premises vs HEAD, then spec → plan → build the anchored
slice.

## After P5 — the remaining roadmap (for context, not necessarily this session)
- **P5 tail** (if the anchor doesn't consume it all): Chichewa full locale; content-translation strategy w/ Ouri.
- **P6** Wave-1 debt: liquid delegation **D3** (the one named-but-missing core mechanism — only a fixture stub
  today); Wave 1.5 refactor lanes (design-system canonicalization, utils/types consolidation, shared-affordances
  extraction, voting-flow consolidation).
- **Human-gated, parallel:** fr/sw (+ future ny) native-speaker review (`docs/i18n-native-review-candidates.md`).
- **Deferred S12 reuse cleanup:** migrate `ProblemVoteFlow` + `CreateInitiativePage` to the shared
  `SourceLinks`/`SourcesInput` primitives.
- **Blocked / coordination:** land `ui`→`main` is Ouri's pull (he derives `new-features` from `ui`); not a
  merge we run.
