# S20 plan — stage-feed inline expansion (W3/D1)

Spec: `../specs/2026-07-04-s20-stage-feed-inline-expansion-design.md`. Base `8c3d3f2`.
Direct execution (cross-cutting nav/feed work — S10/S11/S13 precedent), controller owns the
preview. Each task ends with `npx tsc -b` clean; `ui` stays runnable.

## Task 1 — `feat(s20)`: FeedEngagePanel + i18n keys

Files: `src/components/initiative/FeedEngagePanel.tsx` (new),
`FeedEngagePanel.module.scss` (new), `src/i18n/en.ts`, `fr.ts`, `sw.ts`
(`stagefeed.openInCommunity`).

- Wiring per spec §Design (member fetch on mount, `useInitiativePost`, stageNav row,
  per-stage engage + StageAdvanceBar, quiet link).
- Styles: tokens only; panel visually matches ActivityCard's `.panel` (shaded surface,
  `$space` gaps); link matches `.deepLink`.
- Verify: `npx tsc -b`.

## Task 2 — `feat(s20)`: StageFeedView expansion wiring

Files: `src/pages/StageFeedView.tsx`, `StageFeedView.module.scss`.

- `expandedIds` state + toggle; title button → `aria-expanded`/`aria-controls` toggle for
  problem/discussion/proposals/vote; chevron affordance; mandate keeps navigate.
- Problem filter includes `discussion`; "In discussion" badge on those cards.
- Render FeedEngagePanel when expanded.
- Verify: `npx tsc -b` + `npm run build`.

## Task 3 — verification (controller, ONE preview)

- grep gates + i18n parity scanner; no DEMO_VERSION bump (no fixture change).
- Seed demo auth; walk `/stage/problem|proposals|vote|mandate` at 360px, light+dark,
  en/fr/sw; expand cards in each; mandate card navigates.
- Fresh-visitor no-deploy check: clear state, unverified identity, expand each stage card,
  network/console → zero `deploy`/`join` calls.
- Block-count eval on expanded vote feed card (spec bars); keyboard + h1 checks.

## Task 4 — review + gate + closeout

- Opus whole-branch review (origin/ui..ui) → 0 Crit / 0 Imp.
- Eston push gate (explicit yes).
- Closeout: MASTER_TODO §8 entry, i18n packet Session-20 section, memory file + index,
  session-21 (W4) prompt with re-counted `prefers-color-scheme` blocks.
