# Session prompt — Batch 1, part 2: visual fixes + cross-community Home

Paste this whole file into a fresh Claude Code session on the `ui` branch.

---

You are continuing the Gloki UI overhaul on the **`ui`** branch. **First, read `CLAUDE.md`,
`ARCHITECTURE.md`, and `DESIGN_SYSTEM.md`** — they're lean now and define the rules below.

## How we work (non-negotiable)

- **Branch + seam:** Develop on `ui` against the **stub layer** only. Every component reads/writes
  through `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/`joinContract`),
  backed by `src/services/demo/`. **Never** call a real server from a component. Keep the UI↔data
  seam clean.
- **Design system is law.** Use tokens from `src/styles/variables.scss` and the shared components in
  `src/components/shared` (`Button`, `Card`, `Modal`, `Badge`, `Banner`, `EmptyState`, …). **No
  ad-hoc hex / px / rgba** in component styles. See `DESIGN_SYSTEM.md` → *Shared component
  inventory*, *Component states*, and *Accessibility* (WCAG AA contrast — this is exactly what the
  buttons below violate).
- **Strings** go through i18n: `t('ns.key', 'English default')` (inline English default is fine).
- **Verify before "done":** `npx tsc -b` clean **and** `npm run build` clean, then walk the routes in
  the browser preview. Dev server config is `.claude/launch.json` → `preview_start({name:"gloki-dev"})`
  (port 5173). Check light + dark + 360px-wide mobile + no console errors. Show evidence (screenshots).
- **Commit locally** in small, clearly-described chunks. **Do NOT push** — Eston controls the deploy
  (a push to `origin/ui` auto-publishes to GitHub Pages).

## What's already done (context)

- **Part A** — docs reorg (committed).
- **Batch 1 / C1** — the demo is now **four globally diverse communities** (no more all-Africa
  "Voices for the Climate"): *Global Health Network*, *Digital Rights Coalition*, *Climate Resilience
  Assembly*, *Fair Futures Forum*. 8 initiatives spread across all 5 stages, 16 global personas, a
  global *"Universal Climate Adaptation Fund"* mandate. Seeded by `src/services/demo/seedDemoCommunity.ts`
  (`seedAllDemoCommunities`) + `mockApi.ts` (`ensureDefaultDemoCommunity`, version-gated). A reload
  auto-refreshes the demo. Fixtures live in `src/services/demo/fixtures/`.

## Your tasks (the rest of Batch 1)

### C2 — Visual / design-system fixes (the "embarrassing" items Eston flagged)

The complaints, verbatim-ish: buttons are inconsistent and "all over the place"; the Proposals/Results
toggle text is **unreadable on hover**; the **text above the results bar is unreadable**; the
"Proposals" toggle uses **white rectangles that break the design**; on the Problem card the
**title is smaller than the vote buttons** (wrong hierarchy); too much text, not enough whitespace;
colors don't mean anything consistent.

1. **Proposals/Results (and QV) toggle buttons.**
   - `src/components/collaboration/flows/voting/ApprovalFlow.tsx` + `ApprovalFlow.module.scss`
     (the `Proposals` / `Results` tabs, ~tsx 198-210; scss `.tab` / `.tabActive`, ~16-35).
   - `src/components/collaboration/flows/voting/QVFlow.tsx` + `QVFlow.module.scss`
     (`Proposals` / `Vote` / `Results` tabs, ~tsx 167-174; same tab styling).
   - Rebuild as a **proper segmented control**: readable active **and** hover states from tokens
     (meet the AA contrast minimums in `DESIGN_SYSTEM.md`), no white-on-light text, no bare white
     rectangles. Fix the unreadable label sitting above the results bar.
2. **Problem card hierarchy.** On the problem feed/card, the initiative title must be the **largest**
   element — clearly bigger than the "Second it" / "Not for me" buttons. Touch
   `src/components/stages/ProblemStage.tsx` (+ scss) and/or `src/pages/StageFeedView.module.scss`
   (`.cardTitle`). Right-size the vote buttons to the shared `Button`/token sizes.
3. **Vote buttons (QV).** Restyle the allocation/heart controls in `QVFlow` to the unified button
   system; keep the "support meter" feel but make it consistent with everything else.
4. **General tidy on the surfaces you touch.** Enforce color semantics ("not interactive → not blue;
   not error → not red"), bump first-order headings, add whitespace, prefer an icon + short label
   over walls of text. Don't gold-plate unrelated screens — stay on the flagged surfaces.

Verify each fix in the preview (open a Proposals-stage and a Vote-stage initiative; open a Problem
card) and screenshot before/after.

### C3 — Cross-community Home (`HomeView`)

Eston wants the landing page to be a **real overview that mixes content from different communities**,
not one stage at a time. Note: `StageFeedView` *already* aggregates initiatives across all the user's
communities (see `src/pages/StageFeedView.tsx`, ~lines 97-137) — it just shows one stage at a time.

1. **Extract the aggregation** from `StageFeedView` into a reusable hook
   `src/hooks/useAllInitiatives.ts` (collect initiatives across `community_contract.py` contracts +
   their stage, with `communityId` / `communityName` / `authorName`). Have **both** `StageFeedView`
   and the new `HomeView` consume it (don't duplicate the logic).
2. **New `src/pages/HomeView.tsx` (+ `.module.scss`)** — a mixed overview:
   - A few **Problems**, **Discussions**, **Proposals**, and **Votes** drawn from across the four
     communities, each card clearly **labeled with its community** (reuse the community-badge pattern
     already in `StageFeedView`).
   - **Mandates** as a smaller "Recent decisions" strip (Eston said mandates shouldn't dominate the
     home).
   - Empty-state fallback: reuse the existing global `SAMPLE_INITIATIVES` in `StageFeedView`.
   - Keep it light and scannable — this is the front door; apply the C2 design polish here too.
3. **Routing.** The root route currently redirects `/` → `/stage/problem` (in the app router, likely
   `src/App.tsx`; confirm). Change `/` to render `HomeView`. Keep `/stage/:stageId` → `StageFeedView`
   for the per-stage browse driven by the global `StageFooter`. `HomepageMenu` (top-right) and
   `StageFooter` (bottom) should appear on `HomeView` too. Update the Routing section of `CLAUDE.md`.

Verify: load `/`, confirm a mix of content from multiple named communities; confirm the 5-stage
footer still browses per-stage; dark + 360px; no console errors.

## When done

- `npx tsc -b` + `npm run build` clean; preview verified with screenshots.
- Commit C2 and C3 as separate local commits (clear messages). **Do not push.**
- Briefly report what changed and hand back to Eston for review.
