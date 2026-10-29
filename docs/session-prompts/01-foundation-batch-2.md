# Foundation batch-2 (run alone, ~30 min session, between Wave 1 and Wave 1.5)

> **When:** after Wave 1's lane work is merged into `ui` and the formal review has run; **before**
> Wave 1.5 lanes start. Picks up the Foundation-owned §10 coordination items left over from Wave 1
> and the quick wins that won't collide with any Wave 1.5 lane.
> **How many sessions:** 1, alone. Merges directly to `ui` like Foundation did.
> **Setup (terminal, once):**
> ```bash
> cd /path/to/gloki-engage
> git pull origin ui
> git worktree add ../gloki-foundation-batch-2 -b foundation/batch-2 ui
> ```
> Open a fresh Claude Code session **in `../gloki-foundation-batch-2`** and paste everything below.

---

You are the **Foundation batch-2** session for the Gloki UI reform. This is a **UI-only mockup** —
no backend, no `?raw` Python imports. Your job is to clear Foundation-owned debt that built up during
Wave 1, plus apply 5 surgical quick wins flagged by the formal review, **without touching any file a
Wave 1.5 lane will rewrite.**

**Read first:** `MASTER_TODO.md` §10 (Coordination log) and §11 (Wave 1 review findings + Wave 1.5
plan), `docs/session-prompts/README.md` (operator guide), `docs/LANES.md` (owned-paths boundaries).

**Mission context:** Wave 1 lanes flagged 4 Foundation-owned coordination items (§10) and the
formal review surfaced 10 quick wins (§11). This session does the 3 Foundation items + the 5 quick
wins that are **safe to do now** — the other 5 quick wins are deferred into Wave 1.5 lanes that own
those files (called out below so future agents know).

**Owned paths (you may edit these):**
- `src/App.tsx` (route additions / redirect logic)
- `src/components/shared/StageFooter.*` (conditional render on `/welcome/*`)
- `src/components/shared/PageHeader.*` (ARIA fix only — no styling changes; lane #1 owns SCSS)
- `src/components/community/chat/ChatTopic.tsx` (ARIA labels only)
- `src/components/collaboration/DiscussionStageView.tsx` (drop unused prop only)
- `src/components/mandate/MandatePage.tsx` (swap one read; do not restyle)
- `src/services/demo/fixtures/problems.ts` (add evidence URLs only)
- `src/services/demo/fixtures/presence.ts` (if needed for `/lab/presence`)
- new: `src/components/shared/presence/PresenceLabRoute.tsx` (thin route wrapper around `PresenceShowcase`)

If you need a change outside these, append a request to **MASTER_TODO §10** instead of editing —
Wave 1.5 lanes start right after you merge and they need their owned paths untouched.

---

## Tasks

### A. Three §10 coordination items (Wave 1 → Foundation)

- **A1 — `/welcome` first-run redirect.** In `App.tsx`, route `/` (and any post-login landing) to
  `/welcome` when the user is **first-run** (heuristic: `localStorage.getItem('gloki.digitalAgent')`
  is missing OR `localStorage.getItem('gloki.onboarding.completed') !== 'true'`); otherwise keep
  redirecting to `/stage/problem`. Lane A built `/welcome/*`, so this just wires the entry point.

- **A2 — Hide `StageFooter` on `/welcome/*`.** The global 5-stage footer frames the first-run flow
  oddly. In `StageFooter.tsx`, early-return `null` when `useLocation().pathname.startsWith('/welcome')`.

- **A3 — `/lab/presence` dev route.** Add a route `/lab/presence` in `App.tsx` rendering a thin
  `PresenceLabRoute` wrapper around Lane F's existing `PresenceShowcase` component
  (`src/components/shared/presence/PresenceShowcase.tsx`). This gives the cross-cutting primitives a
  permanent verification page.

### B. Five quick wins from §11 (safe to do now)

- **B1** — Add `aria-label="Send message"` to ChatTopic's send button (search the file for the icon-only
  send `<button>` and add the attribute).
- **B2** — Add `aria-label="Back to chat topics"` to ChatTopic's back button.
- **B3** — Add `aria-label="Open menu"` and `aria-expanded={open}` to PageHeader's homepage-menu button.
  (Wire `aria-expanded` from whatever state already controls the menu visibility; do not introduce new
  state.)
- **B4** — Remove the unused `collaborationId` prop from `DiscussionStageView`'s props interface and its
  callers (likely none — `git grep collaborationId` to confirm before removing).
- **B5** — `MandatePage` currently calls `getInitiative` for the initiative title. Replace that with a
  lookup in `src/services/demo/fixtures/mandate.ts` (or `problems.ts` if more appropriate). The page
  must function with **no real backend call** to honor the UI-only contract.

### C. One fixture polish (also from §11)

- **C1** — In `src/services/demo/fixtures/problems.ts`, add at least one credible **evidence URL** to
  each initiative that currently has none (the audit named reforestation, votes, water). Use real,
  reputable sources (UN, WHO, IPCC, peer-reviewed). One URL per initiative is enough.

### D. Explicitly NOT doing here (deferred to Wave 1.5)

So future agents don't duplicate work, leave these alone — they'll be done by the lane that owns
the file:

- `$secondary` token doc/delete → **wave-1.5/design-system-canonicalization** (lane #1)
- Section-header comments in DeliberationThread / CoAuthoringPanel / AdoptionFramework → **wave-1.5/shared-affordances-extraction** (lane #3) + **voting-flow-consolidation** (lane #4)
- `aria-busy="true"` on dialog submit buttons → **wave-1.5/shared-affordances-extraction** (lane #3, rewriting the dialogs anyway)
- CSR-only / module-listener comments on AITools.tsx + useDataSaver.ts → **wave-1.5/i18n-promotion-and-multilingual-parity** (lane #5) when it sweeps AITools
- All i18n promotion (`onboarding.*`, `agent.*`, `mechanisms.*`, `community.*`, `stage.*`, `journey.*`, `currency.*` → en/fr/sw parity) → **wave-1.5/i18n-promotion-and-multilingual-parity** (lane #5)

---

## Done when (verify — show evidence, don't assert)

- `npx tsc -b --noEmit` exits clean.
- `npm run build` exits clean.
- Preview walk:
  - First-run path (clear `gloki.digitalAgent` + `gloki.onboarding.completed` from `localStorage`, hit `/`) → lands on `/welcome`. `StageFooter` not visible.
  - Repeat-visit path (set `gloki.onboarding.completed = 'true'`, hit `/`) → lands on `/stage/problem`.
  - `/lab/presence` renders `PresenceShowcase` cleanly.
  - ChatTopic send + back buttons announce their labels in the accessibility snapshot.
  - PageHeader menu button announces "Open menu" and toggles `aria-expanded`.
  - `/mandate/<communityId>/<mandateId>` still renders the right title with **no `getInitiative` call** in the network tab.
- Tick the boxes in `MASTER_TODO.md` §10 for the 3 Wave 1 coordination items you applied.
- Move the 5 done quick wins out of §11 (or mark them ✅ in place).
- Commit, push `foundation/batch-2`, open PR → `ui`. After it merges, delete the worktree:
  `git worktree remove ../gloki-foundation-batch-2 && git branch -d foundation/batch-2`.

## House rules

Hardcoded UI only · every new user-facing string via the i18n scaffold (default English inline is
fine — lane #5 will promote later) · design tokens & shared components only · simplicity over
cleverness · **stay strictly in your owned paths so Wave 1.5 lanes can branch from a clean `ui`**.
