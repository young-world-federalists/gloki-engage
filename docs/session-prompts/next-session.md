# Next session — continue the Gloki hierarchy + accessibility redesign

You are picking up an in-flight redesign of the Gloki app (`Communities2`, branch `ui`, a UI-only
mockup deployed to GitHub Pages). A whole-platform hierarchy + accessibility review is done, the
plan is locked, **Wave 0 is shipped**, and **Wave 1 is fully spec'd and ready to build — that's
your job.** Read this top to bottom, then read the two linked docs before touching code.

## Read first (in order)
1. **[`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md)** — the plan: 8 moves in 4 waves, the locked decisions, per-surface recommendations, and the coverage gaps. This is the source of truth for the whole arc.
2. **[`docs/session-prompts/wave-1-appheader.md`](./wave-1-appheader.md)** — your immediate task, fully specified (the `AppHeader`, all 9 call sites, verification checklist).
3. **`CLAUDE.md`** + **`DESIGN_SYSTEM.md`** — stack, the UI↔service seam rule, design tokens, mobile (360px) + WCAG AA standards.

## Where things stand (2026-06-20)
- **Review done:** 47-agent pass over 15 surfaces → 192 findings (4 blocker / 75 high / 70 med / 43 low). Synthesis lives in the pathways doc (the raw run output was a temp file — don't rely on it; the pathways doc has everything durable).
- **Decisions locked by Eston (do NOT relitigate):** light top-bar header · **no** dedicated pipeline cue (the global `StageFooter` already carries stage context) · app-wide **Proposals→Solutions** rename · **keep governance signals + inline participation visible** (cut prose behind an info icon, never hide sources/tallies/meters/inline voting).
- **Wave 0 shipped & deployed** (`572d135`): token-only AA contrast sweep across 21 SCSS files + a global `prefers-reduced-motion` reset in `index.scss`. Don't redo it.

## Your task: execute Wave 1 (the `AppHeader`)
Follow `wave-1-appheader.md` exactly. In short: build one light, sticky `AppHeader`; **delete `PageHeader`** (and its dead `single-row` layout); fold in `GlobalHeader`; migrate all **9 call sites**; add a **skip link + `<main>` landmark**. Net result: one header per screen, the wordmark once, community name visible in chrome, exactly one `<h1>` per page, light, no page CTA in the header.

**Four header sub-decisions** have recommended answers baked into the prompt, flagged overridable — **confirm with Eston before building if he hasn't already weighed in:**
- (A) artifact/initiative title lives in **content**, community name = the header `<h1>`;
- (B) notification bell on **every** inner page (global);
- (C) **drop** the dark Gloki hero (light everywhere);
- (D) **drop** the member-count chip (clutter).

## The roadmap after Wave 1 (don't start these until Wave 1 lands + is reviewed)
- **Wave 2 (standards hung on the new header):** the `(i)`-icon → `Modal` disclosure pattern for all rules/explainer/threshold prose (keep the threshold *numbers* inline); reframe `JourneyRecap` → "how this mandate was earned"; the "one primary action per screen" CTA standard (`Button size='lg'` in the thumb zone, never in the header); the **app-wide Proposals→Solutions rename** (new `stage.solutions`/`nav.solutions` keys, contract id stays `proposals`, en/fr/sw in lockstep — confirm the Swahili word with Eston). **Fold in gaps:** the app-shell chrome (`App.tsx`/`ErrorBoundary` loading/crash UI) is hardcoded English with no i18n; there is **no `path='*'` 404 route**.
- **Wave 3 (consolidation + semantic floor):** one shared country `SearchableSelect`-with-chips widget for the 3 hardcoded-chip sites; a "use the kit" pass (Banner/EmptyState/Button/AuthorTag, token surfaces); the screen-reader "semantic floor" (aria-labels, aria-pressed/expanded with counts, numeral-first meters, labeled inputs, `role=alert`); land the `Communities.tsx` i18n gap (a hard fr/sw blocker). **Fold in gaps:** aria-live for async/optimistic updates; optimistic-write failure/rollback UX.
- See the pathways doc's "Decisions needed" section for the per-surface open questions to raise with Eston as each wave is planned, and "Coverage gaps" for whole surfaces never reviewed (the mandate **AdoptionFramework**, QR camera-denied path, connectivity layer, the `/lab/presence` dev route shipping to prod).

## Working norms & gotchas
- **Slow external USB drive** — work in small sequential batches; avoid heavy parallel file I/O (it stalls). Give each agent exact file paths so it reads directly instead of grep-storming.
- **No test framework** — verify via `npm run dev` + the browser preview tools at **360px, light AND dark, en/fr/sw**, plus `npm run build` (it runs `tsc -b` — must pass) before any push.
- **Tokens only** — no ad-hoc hex/px/rgba (`DESIGN_SYSTEM.md`); all user-facing strings via `t('key','fallback')` with en/fr/sw parity. Prefer the shared kit (`Button`, `Card`, `Modal`, `Banner`, `Badge`, `EmptyState`, `SearchableSelect`, `SegmentedControl`).
- **Accepted deviations — do NOT "fix":** `$primary` white-on-blue button fill (3.68:1, brand, Eston's call); use `$gray-500` (not `$gray-400`) for caption text.
- **`ProblemVoteFlow`** — Eston approved *token-only* SCSS edits (done in Wave 0); still avoid markup/logic changes there.
- **Delivery rhythm:** land each wave as one batch — verify, then **clean · commit · push (deploys Pages)**; Eston reviews on the deployed build. Commit messages end with the `Co-Authored-By` trailer. Don't push unverified code.
- **Don't touch the seam:** components read/write only through `src/services/api.ts`; never add a server call. This is a presentational mockup.

## First move
Confirm with Eston whether the Wave 1 header decisions (A–D) stand as recommended or change, then execute `wave-1-appheader.md` and verify all 9 surfaces before committing.
