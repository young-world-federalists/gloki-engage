# Session prompt — Batch 3: navigation & information architecture (one menu, promote Start, fix vocabulary)

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
  `SegmentedControl`, …). **No ad-hoc hex / px / rgba** in component styles — add a token first if one
  is missing. Meet WCAG AA contrast. Every interactive control needs all states incl. **focus-visible**
  and a `prefers-color-scheme: dark` treatment.
- **Strings** go through i18n: `t('ns.key', 'English default')` (inline English default is fine).
- **Verify before "done":** `npx tsc -b` clean **and** `npm run build` clean, then walk the routes in
  the browser preview. Dev server is `.claude/launch.json` → `preview_start({name:"gloki-dev"})`
  (port 5173; the file is git-ignored but present locally). Check light + dark + 360px-wide mobile +
  no console errors. Show screenshots. Note: the preview's console buffer **persists stale HMR errors
  across reloads** — judge "clean" by `tsc`/`build` exit codes + a live DOM check (no ErrorBoundary
  screen), not the raw console log.
- **Commit locally** in small, clearly-described chunks. **Do NOT push** — Eston controls the deploy
  (a push to `origin/ui` auto-publishes to GitHub Pages).

## What's already done (context)

The lighter **stub-seam batch flow** replaced the old per-lane/wave machinery. Shipped & deployed
(live at `young-world-federalists.github.io/gloki-engage/`, `ui` HEAD `770c24e`):

- **Batch 1** — C1 four globally diverse demo communities (Global Health Network, Digital Rights
  Coalition, Climate Resilience Assembly, Fair Futures Forum), 8 initiatives across all 5 stages, 16
  personas, a global mandate (seeded by `src/services/demo/seedDemoCommunity.ts`, version-gated in
  `mockApi.ts`; a reload auto-refreshes). C2 visual fixes + the **shared `SegmentedControl`**
  (`src/components/shared`; use it for **any** view toggle). C3 cross-community **`HomeView`** at `/`
  + the shared **`useAllInitiatives`** hook (`src/hooks/useAllInitiatives.ts`) — consumed by both
  `HomeView` and `StageFeedView`; **don't duplicate the aggregation.**
- **Batch 2** — C4 design-system consistency sweep (migrated the `MandateDocument` and
  `CollaborationFullView` toggles to `SegmentedControl`; dark-mode/focus/token fixes on
  `CollaborationPage`, `ErrorBoundary`, `AddSegmentDialog`, and the shared `.navItem` in
  `Container.module.scss`; fixed a `SegmentedControl` 360px overflow). C5 Home polish:
  starred-communities-first ordering + ★ glyph, relative time via `src/utils/formatTimeAgo.ts`,
  documented "hide empty sections, never mix real + sample" rule.

Useful shared pieces you should reuse, not re-roll: `SegmentedControl`, `Button`, `Card`, `Modal`,
`EmptyState`, `Banner`, `useAllInitiatives`, `formatTimeAgo`, `preferencesSlice` (starred/hidden).

## Your tasks (Batch 3)

### Step 0 — housekeeping (clear these first)

1. **Author names on cards.** Seeded initiative/mandate cards show a truncated public key
   (`zHTLLctm…`) instead of the persona name. Trace `authorName` in `useAllInitiatives.ts`
   (`profiles[collab.author]`) — the seeded authors almost certainly don't have linked profiles in
   `state.communities.profiles`. Fix at the seed layer (`seedDemoCommunity.ts`) so persona names
   resolve on Home **and** the stage feed. Verify a real name shows.
2. **CI Node bump (time-boxed — deadline 2026-06-16).** The `.github/workflows` "Deploy to GitHub
   Pages" job runs on Node 20, which GitHub force-migrates to Node 24 on 2026-06-16. Bump the action
   versions (`actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact`) to current
   majors. This is a workflow YAML change, not UI — keep it a separate commit and **ask Eston before
   pushing**, since it touches the deploy pipeline.

### C6 — One menu model

There are **two** different slide-out menus today and they diverge in items and styling:
`src/components/identity/HomepageMenu.tsx` (global: Profile, Communities, Join, Create, About,
Contact) and an **inline menu inside `src/pages/CommunityView.tsx`** (`showMenu`/`styles.menuItem`:
Home, Create Initiative, Collab, Chat, Currency, Members, Identity & Trust, Share, Invite, Leave).
The header trigger lives in `src/components/PageHeader.tsx`; the global 5-stage `StageFooter` is the
primary nav and **stays as-is**.

**Audit, then unify** into one coherent slide-out menu pattern so the menu interaction, styling
(tokens, dark, focus-visible, 44px targets), and item grouping are identical everywhere — with
context-appropriate entries (global items always; community items only inside a community). Prefer
extracting/reusing one shared menu component over maintaining two. Don't gold-plate: focus on the two
real slide-outs + the header trigger; leave `Container.nav` (in-page tabs) and `IdentityView`'s
sub-nav unless they're trivially in the way.

### C7 — Promote "Start Initiative" + resolve the initiative-vs-problem vocabulary

1. **Promote the action.** Starting an initiative is buried inside a community (a CTA in
   `ActivityHub.tsx`, a button in `InitiativeList.tsx`, the `CommunityView` menu) and is labelled
   inconsistently — **"Start Initiative"** in some places, **"Create Initiative"** in others. Pick one
   verb, apply it everywhere (via i18n), and give the action a prominent, consistent home so a user
   can find it without spelunking. (The route is `/community/:communityId/create-initiative` →
   `CreateInitiativePage`.) Note the old `CreateInitiativeDialog`/`CreateFlowDialog` are dead — ignore
   or remove, don't wire to them.
2. **Resolve the vocabulary.** "Initiative" and "problem" are used interchangeably in copy, which is
   confusing: an *initiative* is the whole effort; at the first pipeline stage its artifact is a
   *problem*. **Decide the canonical mental model and apply it consistently** across `HomeView`,
   `StageFeedView` empty hints, `CreateInitiativePage`, and the menus — then **confirm the wording
   with Eston** (this is a product-voice call he cares about; propose a recommendation rather than
   guessing silently). Document the decision in a code comment.

For every surface you change, screenshot before/after in light + dark + 360px.

> **Not this batch** (later): full verification UX (mock web-of-trust + per-stage community permission
> settings), stage-UX redesigns (discussion-as-co-authoring, mandate card), the welcome guide, and
> diverse-persona a11y reviews. Stay scoped to Step 0 + C6 + C7.

## When done

- `npx tsc -b` + `npm run build` clean; preview verified with screenshots (light + dark + 360px).
- Commit Step-0 items, C6, and C7 as separate local commits (clear messages). **Do not push** (the
  CI bump aside — ask first).
- Briefly report what changed and hand back to Eston for review.
