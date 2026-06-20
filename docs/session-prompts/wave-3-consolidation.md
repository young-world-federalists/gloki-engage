# Wave 3 — Consolidation + semantic floor (country widget · "use the kit" / SR pass · Communities.tsx i18n) + Wave 2 follow-ups

**Part of:** the hierarchy + accessibility redesign — see [`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md).
**Branch:** `ui` (deploys to GitHub Pages). **Waves 0, 1, 2a, 2b, 2c all shipped & live** (HEAD `bddb5fe`, Pages green).
**Prerequisite:** Eston has reviewed the deployed **Wave 2** build. Do **not** start Wave 3 until he has.

---

## Read first (in order)
1. **[`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md)** — the plan, the locked decisions, the per-surface recs (esp. moves **#7** country widget, **#8** kit/semantic-floor, and surface **#12** Identity), and "Decisions needed".
2. **`CLAUDE.md`** + **`DESIGN_SYSTEM.md`** — stack, the UI↔service seam rule, tokens, 360px + WCAG AA.
3. **The primitives you'll reuse** (built in earlier waves — do NOT rebuild): `src/components/shared/SearchableSelect.tsx` (the country dropdown), `src/components/shared/InfoDisclosure.tsx` (the `(i)`→Modal), `src/components/AppHeader.tsx`, `src/utils/countries.ts` (197 countries: `getCountryName`/`getCountryFlag`/`getCountryByCode`).

## Where Wave 2 left things (so you don't trip)
- One light `AppHeader` everywhere; `PageHeader`/`GlobalHeader` deleted; one `<h1>` per page; skip-link + `<main id="main">`.
- **Proposals → Solutions is done — value-only.** The i18n **key names** (`nav.proposals`, `stage.proposals`, `mechanisms.*`, …) and the **stage-id/routes** (`'proposals'`, `/stage/proposals`) are deliberately unchanged; only the displayed string VALUES are "Solutions". A `grep proposal src` will still show keys/ids/the Merge feature — that's expected. **Do not re-run the rename.**
- **`InfoDisclosure`** (the `(i)`→Modal standard, tap-only) exists in the kit and is applied to the **Currency** explainer + **ApprovalFlow** help. Reuse it; don't reinvent.
- fr/sw at full key + `{var}` parity. The "Suluhisho" rename + its Swahili noun-class **agreement caveat** are recorded in [`docs/i18n-native-review-candidates.md`](../i18n-native-review-candidates.md).

## Locked decisions (do NOT relitigate)
- **Keep governance signals + inline participation VISIBLE** — never hide sources, tallies, the advance/participation meter, threshold numbers, or inline vote/stake. The disclosure hides *prose only*.
- **Tokens only** — no ad-hoc hex/px/rgba (`DESIGN_SYSTEM.md`). Prefer the kit (`Button`, `Modal`, `Banner`, `EmptyState`, `Badge`, `SearchableSelect`, `InfoDisclosure`).
- **Don't touch the seam** (`src/services/api.ts`) — presentational mockup, no server calls.

---

## The Wave 3 moves (land as sub-batches; verify each at 360px light+dark, en/fr/sw, before its push)

### 3a — Country selection → the shared `SearchableSelect` (pathways #7)
- Replace every **hardcoded 4–5 country-chip** site with the existing `SearchableSelect` over all **197** countries (`src/utils/countries.ts`). A global-democracy app must not exclude 190+ countries.
- **Start from a grep** for the chip sites — expected: the Problem *Propose-a-framing* modal, **CreateInitiativePage** "Countries affected", the **Vote/Concerns** country modal, and any place still hardcoding `KE/NG/MW/CD`-style quick-picks. (Try `rg -n "countryOther|🇰🇪|handleToggleCountry|countries\\.(map|slice)" src`.)
- **Multi-country UX** (confirm with Eston): pick-one-at-a-time + **removable chips**; offer a few regional quick-picks above the full search. Labels already localize via `getCountryName(code, locale)`.

### 3b — `Communities.tsx` i18n gap (a hard fr/sw blocker — pathways #12)
- The communities list/dashboard view is un-i18n'd (hardcoded English). Wire it through `t()` with en/fr/sw in lockstep. (Grep `rg -n "Communities" src/pages src/components` to find the exact file; the pathways doc calls this a hard fr/sw blocker.)

### 3c — "Use the kit" + semantic-floor pass (pathways #8) + IdentityView `<h1>` (pathways #12)
- **Kit swaps:** replace hand-rolled chrome that diverges from the kit (`Banner`/`EmptyState`/`Button`/AuthorTag) — only where it's genuinely hand-rolled, not a wholesale rewrite.
- **Semantic floor (the a11y connective tissue):**
  - **IdentityView sub-pages have 0 `<h1>`** (deferred from Wave 1) — promote each route's visually-small heading to a single `<h1>` per route.
  - `aria-label` + `aria-pressed`/`aria-expanded` **with counts** on icon-only / toggle controls.
  - **Numeral-first meters** — a visible number alongside any colour-only meter (don't rely on colour alone).
  - Labeled inputs; `role="alert"` on error surfaces; colour never the only state signal.

### Wave 2 follow-ups (fold in, or confirm first)
- **Extend `InfoDisclosure` to the create / login explainers** (pathways #13/#15) — the **task-first restructure**: the form/identity is screen one, the "what is a community / what is an initiative / 5 stages" prose collapses behind the `(i)`, and a **compact read-only stage strip stays visible**. Bigger than 2b's two surfaces — confirm Eston is happy with the deployed `(i)` pattern (Currency/Approval) before rolling it out.
- **Discussion "Suggest an edit" CTA** (pathways #5) — currently `size="sm" variant="secondary"` by the statement heading; promote to the thumb-zone primary if the surface's action hierarchy supports it (needs a look at the whole discussion layout).
- **Confirm the ApprovalFlow trigger** should stay **icon-only** (2b made it a bare `(i)` with the aria-label "How does approval voting work?"), or add back a visible "How does X work?" text affordance.
- **Route the fr/sw native-speaker review** — including the new **Suluhisho** noun-class agreement pass — per [`docs/i18n-native-review-candidates.md`](../i18n-native-review-candidates.md).

---

## Constraints (same as every wave)
- Mobile-first **360px**, light **and** dark; verify both. i18n **en/fr/sw parity** for every new/changed string (run the parity check; keep `{var}` tokens identical).
- **Tokens only**; prefer the kit. **Don't touch the seam.**
- **Production build runs `tsc -b`** (`noUnusedLocals`/`noUnusedParameters`) — must pass before any push; clean up every orphaned import/var/SCSS class/i18n key you create.
- **Accepted deviations — do NOT "fix":** `$primary` white-on-blue button fill (brand); `$gray-500` (not `$gray-400`) caption text.
- **Slow external USB drive** — small sequential file batches; avoid heavy parallel I/O. (For bulk locale edits, a validated Python script that aborts on any non-unique match is safer + faster than dozens of Edits — see how Wave 2a did the rename.)

## Verification checklist (evidence before claiming done)
1. `npm run build` passes (`tsc -b` + vite, no errors).
2. Country: every hardcoded chip site now uses `SearchableSelect`; all 197 countries searchable; selected countries show as removable chips; en/fr/sw country names render at 360px.
3. `Communities.tsx` renders fully in fr **and** sw (no raw English).
4. IdentityView: exactly one `<h1>` per route; icon/toggle controls have `aria-label` + state + counts; meters show a numeral; errors use `role="alert"`.
5. No new console errors; 360px light **and** dark; en/fr/sw.

## Delivery
Land each sub-batch (3a → 3b → 3c → the folded follow-ups) as its own **verify → clean · commit · push** (deploys Pages); Eston reviews each on the deployed build. Commit subjects e.g. `feat(country): Wave 3a — shared SearchableSelect replaces hardcoded chips`. End every commit message with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

## First move
Confirm the open decisions with Eston — multi-country chip UX (pick-one + removable chips? which regional quick-picks?); whether to do the **create/login disclosure rollout** now or hold; and the **ApprovalFlow icon-only** question — then execute 3a → 3b → 3c, verifying each at 360px light/dark en/fr/sw before its push.
