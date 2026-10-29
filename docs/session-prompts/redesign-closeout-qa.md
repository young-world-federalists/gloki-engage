# Redesign close-out — whole-build regression + a11y verification, orphan/dead-code sweep, DESIGN_SYSTEM sync

**Branch:** `ui` (deploys to GitHub Pages). **Status:** the hierarchy + a11y redesign (Waves 0→5) is **fully shipped** — every move in [`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md) (#5/#8/#13/#15) is shipped or resolved.

This is **not** new feature work. It's the one remaining **UI-branch** session worth doing before launch: the six waves were each verified individually, but **never verified together**, and six waves of edits leave real cleanup debt. This session ties that off.

> **Out of scope (tracked elsewhere — do NOT do here):**
> - **fr/sw native-speaker review** — human-gated; the worklist is [`docs/i18n-native-review-candidates.md`](../i18n-native-review-candidates.md). Needs a native fr + native sw reviewer assigned by Eston, not a coding session.
> - **Seam localization for the real server** (`src/services/`) — Ouri's data-layer session (when stubs → real calls). Documented in the Batch-8 notes. The `ui` branch stays stub-backed.

## Read first
1. **`CLAUDE.md`** + **`DESIGN_SYSTEM.md`** — the UI↔service seam rule, tokens, 360px + WCAG AA.
2. **[`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md)** — what the redesign set out to do, and the locked decisions (light AppHeader / no dedicated pipeline cue / Proposals→Solutions / keep governance signals visible).
3. The **deployed build** — confirm Eston is happy with the cumulative Wave 0–5 result before any cleanup.

## The moves

### A — Whole-build regression + a11y verification sweep (the core)
Verify the surfaces the redesign touched, **together**, at **360px, en/fr/sw, light + dark**. Verification-first — only edit if something is actually broken; every fix is its own small, separately-verified change.

**Surfaces** (one AppHeader per page since Wave 1; one `<h1>` per route):
- **Shell:** AppHeader on every page (home, community feed, stage feed, identity, mandate, discussion, create-*), skip-link → `#main`, the `path='*'` **404**, the `App.tsx`/`ErrorBoundary` loading+crash UI.
- **Pipeline:** the 5 stages (Problem / Discussion / Solutions / Vote / Mandate) + the global `StageFooter`.
- **Create/login:** CreateCommunity, CreateInitiative, Login — task-first form + `(i)` `InfoDisclosure`→Modal + the `StageStrip`.
- **Identity:** Communities list, Join, Profile, About, Contact (one `<h1>` each).
- **Mandate:** MandateCard hero + JourneyRecap.
- **Discussion:** the co-authoring space (the Wave-5 primary CTA, participation meter, Support toggles).

**Check, per surface:** exactly one `<h1>`; no double top-bars / nested `<main>`/dup-id; focus traps on `InfoDisclosure`/`Modal`/`SlideOutMenu` (focus moves in, restores on close); `aria-expanded`/`aria-pressed`/`aria-current` correct; `prefers-reduced-motion` honored; **no clipped/overflowing strings** in fr/sw (the longest locale); **no console errors**. Reaching the discussion stage: the seeded **misinfo / "Digital Rights Coalition"** initiative — `/initiative/{encodeURIComponent(serverUrl)}/{publicKey}/{communityId}/{initiativeId}/discussion`, demo user `'a'×64` passes `canParticipate('discussion')`.

> Optional escalation: this sweep can run as a focused manual pass, **or** — if Eston wants maximum thoroughness pre-launch — as a multi-agent **Workflow** (one agent per surface → adversarial a11y verify → synthesis), like the original 47-agent review. Ask Eston which.

### B — Orphan / dead-code sweep (`tsc -b` does NOT catch these)
- **Orphaned i18n keys:** for each key in `fr.ts`/`sw.ts` (926 each), grep the codebase for the key string; anything unreferenced is dead. Remove via a validated key-removal script (the Batch-9/12 pattern), **fr/sw lockstep**, then re-run the parity check (`RESULT: PARITY OK`). Wave-1 left a few known-dead keys in place (`mandate.pageTitle`, `deliberation.discussion.viewTitle`, `collab.backToCommunity`) — confirm and sweep.
- **Orphaned SCSS classes:** grep `.module.scss` class names against their `.tsx`; remove unused (esp. from surfaces that were restructured: PageHeader deletion, the (i)→Modal swaps, the kit-Button swaps).
- **PipelineView is already deleted** (zero occurrences in `src` — the old "flag-for-Ouri" note is stale; nothing to do).

### C — DESIGN_SYSTEM.md sync
The redesign created the canonical shared kit, but **`DESIGN_SYSTEM.md` documents none of it** (0 mentions). Add concise entries so future work reuses them instead of hand-rolling:
- **`AppHeader`** (`src/components/AppHeader.tsx`) — the single light top bar; props (showBack/onBack/title=`<h1>`/eyebrow/bell); one per page.
- **`InfoDisclosure`** (`src/components/shared/InfoDisclosure.tsx`) — the `(i)`→focus-trapped-Modal disclosure standard (tap-only); the rule: prose behind the (i), but **numbers/tallies/meters/sources stay inline-visible**.
- **`StageStrip`** (`src/components/shared/StageStrip.tsx`) — read-only 5-stage `<ol>`; token-pure rainbow; default aria-label `stage.pipelineOverview` (distinct from StageFooter's `nav.stagesLabel`).
- **`CountryMultiSelect`** (`src/components/shared/CountryMultiSelect.tsx`) — chips + search over 198 + regional quick-picks.
- **`Banner`** (`src/components/shared/Banner.tsx`) — status/alert messaging with baked-in `role`.

## Constraints (same as every wave)
- Mobile-first **360px**, light **and** dark. **i18n en/fr/sw parity** for any key change (parity diff empty, `{var}` tokens identical).
- **Tokens only**; prefer the kit. **Don't touch the seam** (`src/services/api.ts`).
- **Production build runs `tsc -b`** (`noUnusedLocals`/`noUnusedParameters`) — must pass before any push.
- **Slow external USB drive** — small sequential file batches; avoid heavy parallel I/O.
- **Accepted deviations — do NOT "fix":** `$primary` white-on-blue Button fill (brand); `$gray-500` (not `$gray-400`) caption text; the global `button:focus-visible` finding (see DESIGN_SYSTEM).

## Verification checklist (evidence before claiming done)
1. `npm run build` passes (`tsc -b` + vite).
2. A: each touched surface re-verified at 360px en/fr/sw light+dark; document what was checked and any regressions found+fixed.
3. B: parity check `RESULT: PARITY OK` after any key removal; no orphaned SCSS left; build still green.
4. No new console errors on a fresh load of each surface.

## Delivery
Small commits per concern (A regressions / B sweep / C docs), each `verify → clean · commit · push` (deploys Pages). End every commit message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## First move
Confirm with Eston: **(1)** happy with the deployed Wave 0–5 build? **(2)** run A as a focused manual sweep or escalate to a multi-agent Workflow? **(3)** any specific surface he's worried about? Then execute A → B → C, verifying each at 360px light/dark en/fr/sw before its push.
