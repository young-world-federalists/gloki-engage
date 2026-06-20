# Wave 2 — Standards hung on the new header (disclosure · CTA · JourneyRecap · rename · app-shell)

**Part of:** the hierarchy + accessibility redesign — see [`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md).
**Branch:** `ui` (deploys to GitHub Pages). **Wave 0 + Wave 1 already shipped & live** (`572d135`, `6a6ed3d`).
**Prerequisite:** Eston has reviewed the deployed Wave 1 build. Do **not** start Wave 2 until he has.

---

## Read first (in order)
1. **[`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md)** — the plan, the locked decisions, the per-surface recommendations (15), and "Decisions needed" (per-surface open questions). Source of truth for the arc.
2. **`CLAUDE.md`** + **`DESIGN_SYSTEM.md`** — stack, the UI↔service seam rule, tokens, 360px + WCAG AA standards.
3. **`src/components/AppHeader.tsx`** — the Wave 1 spine. Wave 2 hangs the disclosure `(i)` and the primary CTA off **content / the thumb zone**, never the header (the header has no CTA prop, by design).

## Where Wave 1 left things (so you don't trip on it)
- One light `AppHeader` on every screen; `PageHeader` + `GlobalHeader` are **deleted**. Don't reintroduce a header.
- Community name is the `<h1>` on community pages; the mandate card title is the `<h1>` on `/mandate`.
- Skip-link + one `<main id="main">` per migrated page already exist.
- **CollaborationPage is a header-less sub-route** of CommunityView (it renders no `AppHeader`/`<main>`; CommunityView provides them). Keep it that way.
- **Known-deferred from Wave 1:** IdentityView sub-pages still have 0 `<h1>` (Wave 3, pathways item 12); a few now-dead i18n keys (`mandate.pageTitle`, `deliberation.discussion.viewTitle`, `collab.backToCommunity`) — fine to delete as drive-by cleanup if you touch those files.

---

## The locked decisions (do NOT relitigate)
- **No dedicated pipeline cue / header rail** — the global `StageFooter` carries stage context. The journey is told **only** on the mandate (the JourneyRecap reframe). Any extra cue elsewhere must be a *small, limited* text marker, used sparingly.
- **Keep governance signals + inline participation VISIBLE** — the disclosure pattern hides **prose/rules only**. NEVER hide sources, tallies, the advance/participation meter, inline stake/vote, or the **threshold numbers**. (Move the *explanation* behind the `(i)`; keep the *number* inline.)
- **Proposals → Solutions** is app-wide, label-only; the contract id / stage key stays `proposals`.
- Primary CTAs live in content (thumb zone), never in the header.

---

## The five Wave 2 moves
Large wave — **recommend landing as 3 sub-batches**, each verified + pushed on its own so Eston reviews incrementally. Suggested order below (low-risk/mechanical first).

### 2a — Proposals→Solutions rename + app-shell i18n + 404 (mechanical, low-risk)
- **Rename (pathways #6):** flip every user-facing "Proposals" label → "Solutions" across all surfaces. Add `stage.solutions` / `nav.solutions` keys; **keep the contract id and the `proposals` stage key in code unchanged** (label-only). en/fr/sw in lockstep. Start from a `grep -rni "proposal" src` enumeration; expect ~13 string sites (nav/footer label, `home.proposals`, `stagefeed.proposals.*`, the ProposalsStage UI, section titles). fr = "Solutions" (clean). **sw is the one human gate** — confirm "Suluhu" vs existing "Suluhisho" with Eston (route via the pending native review, doc `docs/i18n-native-review-candidates.md`). Watch the **PositionsBoard "Solutions" category collision** in the discussion board — rename that category (e.g. "Ideas") so it doesn't clash with the stage name.
- **App-shell i18n (folded gap):** `src/App.tsx` (the "Validating session…" loader, the Suspense "Loading…" fallbacks, the `ErrorBoundary` `fallbackMessage` strings) and `src/components/shared/ErrorBoundary.tsx` ("Something went wrong" crash UI) are **hardcoded English, raw divs, no `t()`**. Wire them through i18n (en/fr/sw) and the kit where reasonable. Note: `App.tsx`/`ErrorBoundary` render **outside** `I18nProvider`'s consumers in places — verify `t` is reachable (ErrorBoundary is a class component; may need a small functional wrapper or the `translate(locale,…)` helper reading the stored `gloki.locale`).
- **404 route (folded gap):** there is **no `path='*'`** route in `App.tsx` → an unknown URL renders a blank screen. Add a `path='*'` element: a simple, i18n'd, kit-styled "not found" with a link home. (`App.tsx` is a frozen route map — this is the one sanctioned addition; keep it minimal.)

### 2b — The `(i)` → Modal disclosure standard (pathways #5; ~12 surfaces)
- Build **one reusable disclosure** affordance: a small `(i)` icon-button (≥44px, translated `aria-label`, `aria-expanded`) that opens the existing focus-trapped **`Modal`** kit component with the rules/explainer prose. Put it next to the thing it explains.
- Apply to the rules/how-it-works/threshold **prose** on the ~12 surfaces (e.g. `StageFeedView`'s `stagefeed.*.info` threshold banners, the `HowGlokiWorks` explainer, the Currency explainer, the QV "piling costs more" explanation, the problem-card rules). **Keep the threshold NUMBER inline** (e.g. "25% must participate" stays visible; the *paragraph* explaining it goes behind the `(i)`).
- Open per-surface questions to confirm with Eston: first-run **auto-open** the rules `(i)` once? · QV explanation **fully** behind the `(i)` or keep one line always visible? (pathways "Decisions needed").

### 2c — "One primary action per screen" CTA standard (pathways #3) + JourneyRecap reframe (pathways #4)
- **CTA standard:** one obvious primary action per surface via the **`Button` kit at `size='lg'`** (48px) in the thumb zone; demote competing buttons to secondary/tertiary; bind each CTA to its referent (no ambiguous "Submit"). The header never hosts it (Wave 1 guarantees this). Walk the per-surface recs in the pathways doc (mandate "Read the full mandate"; problem "Second it"; discussion "Suggest an edit"; etc.).
- **JourneyRecap reframe:** `src/components/mandate/JourneyRecap.tsx` (used compact in `MandateCard`, full in `MandateDocument`) — reframe from a flat stage list into the **"how this mandate was earned"** throughline; add an `<h2>` "The story so far" (per pathways item 2/3) and fix the ~10px step labels (confirm with Eston: scroll vs fewer/larger steps). This is the *only* place the stage→mandate journey is narrated.

---

## Constraints (same as every wave)
- Mobile-first **360px**, light **and** dark; verify both. i18n **en/fr/sw parity** for every new/changed string.
- **Tokens only** — no ad-hoc hex/px/rgba (`DESIGN_SYSTEM.md`). Prefer the kit (`Button`, `Modal`, `Badge`, `Banner`, `EmptyState`, `SearchableSelect`).
- **Don't touch the seam** (`src/services/api.ts`) — presentational mockup, no server calls.
- **No test framework** — verify via `npm run dev` + the browser preview tools (the demo is gated behind a first-run onboarding; complete it once to reach a seeded community, or deep-link routes directly — only `/` redirects to `/welcome`).
- **Production build runs `tsc -b`** (with `noUnusedLocals`/`noUnusedParameters`) — it must pass before any push; clean up every orphaned import/var.
- **Accepted deviations — do NOT "fix":** `$primary` white-on-blue button fill (brand, Eston's call); `$gray-500` (not `$gray-400`) for caption text.
- **Slow external USB drive** — small sequential file batches; avoid heavy parallel I/O.

## Verification checklist (evidence before claiming done)
1. `npm run build` passes (`tsc -b` + vite, no errors).
2. Rename: `grep -rni "proposal" src` shows only the contract-id / stage-key `proposals` (no user-facing "Proposal*" label left); footer + every stage surface read "Solutions"; en/fr/sw all render at 360px.
3. Disclosure: rules/explainer prose is behind a keyboard-operable `(i)`→Modal (focus-trapped, `aria-expanded`); **threshold numbers, tallies, meters, sources, and inline vote/stake remain visible**.
4. One unambiguous `size='lg'` primary CTA per reviewed surface, in the thumb zone, not in the header.
5. Mandate: JourneyRecap reads as an earned-legitimacy story with an `<h2>`; labels legible.
6. Unknown URL renders the i18n'd 404, not a blank screen; app-shell loader/crash strings are translated.
7. No new console errors; 360px light **and** dark; en/fr/sw.

## Delivery
Land each sub-batch (2a → 2b → 2c) as its own **verify → clean · commit · push** (deploys Pages); Eston reviews each on the deployed build. Commit subjects e.g. `feat(rename): Wave 2a — Proposals→Solutions + app-shell i18n + 404`. End every commit message with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

## First move
Confirm the Wave 2 open decisions with Eston (the Swahili "Solutions" word; PositionsBoard category rename; first-run auto-open of the rules `(i)`; QV one-line-vs-fully-hidden; JourneyRecap label fix), then execute 2a → 2b → 2c, verifying each at 360px light/dark en/fr/sw before its push.
