# Session prompt — Batch 2: design-system consistency sweep + Home polish

Paste this whole file into a fresh Claude Code session on the `ui` branch.

---

You are continuing the Gloki UI overhaul on the **`ui`** branch. **First, read `CLAUDE.md`,
`ARCHITECTURE.md`, and `DESIGN_SYSTEM.md`** — they define the rules below.

## How we work (non-negotiable)

- **Branch + seam:** Develop on `ui` against the **stub layer** only. Every component reads/writes
  through `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/`joinContract`),
  backed by `src/services/demo/`. **Never** call a real server from a component.
- **Design system is law.** Tokens from `src/styles/variables.scss` and the shared components in
  `src/components/shared` (`Button`, `Card`, `Modal`, `Badge`, `Banner`, `EmptyState`,
  **`SegmentedControl`**, …). **No ad-hoc hex / px / rgba** in component styles. Meet WCAG AA
  contrast. Every interactive control needs all states incl. **focus-visible** and a
  `prefers-color-scheme: dark` treatment.
- **Strings** go through i18n: `t('ns.key', 'English default')` (inline English default is fine).
- **Verify before "done":** `npx tsc -b` clean **and** `npm run build` clean, then walk the routes in
  the browser preview. Dev server is `.claude/launch.json` → `preview_start({name:"gloki-dev"})`
  (port 5173). Check light + dark + 360px-wide mobile + no console errors. Show screenshots.
  Note: the preview's console buffer **persists stale HMR errors across reloads** — judge "clean" by
  `tsc`/`build` exit codes + a live DOM check (no ErrorBoundary screen), not the raw console log.
- **Commit locally** in small, clearly-described chunks. **Do NOT push** — Eston controls the deploy
  (a push to `origin/ui` auto-publishes to GitHub Pages).

## What's already done (context)

- **Batch 1 / C1** — demo is now four globally diverse communities (Global Health Network, Digital
  Rights Coalition, Climate Resilience Assembly, Fair Futures Forum), 8 initiatives across all 5
  stages, 16 personas, a global mandate. Seeded by `src/services/demo/seedDemoCommunity.ts` +
  `mockApi.ts` (version-gated; a reload auto-refreshes the demo).
- **Batch 1 / C2** (commit `b93a152`) — visual/design-system fixes:
  - **New shared `SegmentedControl`** (`src/components/shared/SegmentedControl.tsx` + scss, in the
    barrel and the DESIGN_SYSTEM inventory). Active segment reads like a primary button; AA-readable
    active/hover, focus ring, dark mode, 44px targets. **Use it for any view toggle** instead of
    hand-rolled tabs.
  - Wired into `ApprovalFlow` and `QVFlow`; added the missing dark-mode block to `ApprovalFlow`
    (was rendering white proposal cards + unreadable result labels); unified Add/retry/"Cast my
    votes" to the shared `Button`; QV steppers now 44px with focus.
  - Problem card hierarchy: `StageFeedView .cardTitle` → `$text-xl`; `ProblemVoteFlow` vote buttons
    right-sized to `$text-base` so the title clearly dominates.
- **Batch 1 / C3** (commit `334a0bd`) — cross-community Home:
  - **`useAllInitiatives` hook** (`src/hooks/useAllInitiatives.ts`) — the cross-community aggregation
    + per-initiative stage resolution. **Both `StageFeedView` and `HomeView` consume it** — don't
    duplicate this logic.
  - **`HomeView`** (`src/pages/HomeView.tsx` + scss) at `/` — mixed overview (Problems / In
    discussion / Proposals / Open votes, each card community-badged) + a slim "Recent decisions"
    mandate strip; falls back to the exported `SAMPLE_INITIATIVES` from `StageFeedView` when empty.
  - Routing: `/` → `HomeView` for returning users (first-run still → `/welcome`); header wordmark now
    points at `/`. Removed `StageFeedView`'s **redundant local `<StageFooter/>`** — `App.tsx` renders
    it globally, so **never add a per-page `StageFooter`** (it doubles the nav).
- **Docs** (commit `a0a35b8`) — `SegmentedControl` added to the DESIGN_SYSTEM shared inventory.

These three commits are **local on `ui`, not pushed**. `.claude/launch.json` (the preview dev-server
config) is currently **untracked**.

## Your tasks (Batch 2)

### Step 0 — pick up review feedback

- Check whether Eston left review notes on the Batch 1 commits (`git log b93a152..HEAD`, PR comments,
  or a notes file) and fold any fixes in first.
- Decide `.claude/launch.json`: if the team should share the preview config, commit it; otherwise add
  it to `.gitignore`. (Ask if unsure.)

### C4 — Design-system consistency sweep (the offered extension)

Finish making the controls coherent app-wide. **Stay on surfaces a user actually hits; don't
gold-plate.** Audit, then fix:

1. **Find remaining hand-rolled toggles** and migrate them to `SegmentedControl`. Grep for the old
   pattern: `activeTab`, `tabActive`, `styles.tab`, `setActiveTab`. Likely candidates to check:
   the community/identity in-page nav (`src/pages/Container.module.scss` `.nav`/`.navItem`),
   `ConvictionStaking`/`MandateStage`, `CollaborationPage`, Chat (`ChatTopicList`/`ChatTopic`),
   Currency, Members.
2. **Find surfaces missing a dark-mode block or failing AA contrast.** Grep component `.module.scss`
   files for those **without** a `prefers-color-scheme: dark` block but that use `white` /
   `$gray-*` backgrounds (same failure class as the old ApprovalFlow). Add token-based dark
   treatments; fix any low-contrast gray-on-tint text.
3. **Unify remaining hand-rolled buttons** to the shared `Button`, and kill ad-hoc inline styles:
   grep for `style={{` on interactive elements and for raw `padding: NNpx` / hex / `rgba(` literals
   in the scss you touch.
4. **Enforce color semantics** on touched surfaces ("not interactive → not blue; not error → not
   red") and **focus-visible on every control**.

For each surface you change, screenshot before/after in light + dark + 360px.

### C5 — Home polish + preferences

Iterate `HomeView` into a sharper front door (keep it light and scannable):

1. **Wire starred/hidden communities** (`src/store/slices/preferencesSlice.ts`). `useAllInitiatives`
   already excludes hidden; surface **starred** communities first (a "Starred" lead-in, or sort
   starred initiatives to the top of each section). Confirm hidden communities stay out.
2. **Freshness:** show relative time on cards (reuse/extract `StageFeedView`'s `formatTimeAgo` into a
   small util so both share it).
3. **Sturdier empty handling:** today the sample fallback is all-or-nothing. Decide and implement the
   right behaviour when *some* sections are empty but others have real data (e.g. hide empty sections
   vs. per-section sample backfill) and `log`/comment the choice.
4. Apply the C4 polish here too; re-verify `/` shows a real cross-community mix, the 5-stage footer
   still browses per-stage, dark + 360px, no console errors.

## When done

- `npx tsc -b` + `npm run build` clean; preview verified with screenshots (light + dark + 360px).
- Commit C4 and C5 as separate local commits (clear messages). **Do not push.**
- Briefly report what changed and hand back to Eston for review.
