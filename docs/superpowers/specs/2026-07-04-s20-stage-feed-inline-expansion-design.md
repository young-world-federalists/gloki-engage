# S20 — Campaign Wave 3: stage-feed inline expansion (D1)

**Session 20, 2026-07-04. Base: `ui` == `origin/ui` @ `8c3d3f2` (clean — S19/W2 pushed).
Source decision: D1 in `2026-07-03-s18-ui-campaign-findings.md` (Eston-directed). Method:
re-host the S19-recomposed engage panels inside the global stage feeds without breaking the
feeds' compare-across-communities framing (north star 2).**

## Re-grounded premises (verified vs HEAD 8c3d3f2, 2026-07-04)

| S20-prompt premise | Reality at HEAD |
|---|---|
| W2 push state uncertain | Pushed; clean tree; diff base = `origin/ui` |
| Feeds are compact tap-through (StageFeedCard) | ✓ — tap → `/community/:id?initiative=<id>` (problem/proposals/vote), `/mandate/:communityId/:id` (mandate); `/stage/discussion` → redirect to Problem |
| ActivityCard stack usable outside CommunityView | ✓ — `useAllInitiatives` supplies item+community context; `useCommunityTrust` self-loads via seam; activity cards fetch their own member counts. No ambient CommunityView state anywhere in the stack |
| Read-only on expand for non-participants | ✓ by construction — deploy-capable components (`SolutionsBoard`, `QVFlow` via `useFlowContract`) sit behind `StageGate`; `VotePreview` + `DiscussionPill` are pure `resolveInitiativeStageContract` reads. Empirical network check still in DoD |
| Vote panel = 4 blocks (S19 M2) | Matches code; measured in verification |
| `qvGuide` burns only on a rendered ballot | ✓ (`QVFlow.tsx:78`) |
| **"Discussion-stage initiatives appear in Problem/Solutions gaps"** | ❌ **WRONG** — feed filter is exact-stage, so discussion-stage initiatives appear in NO global stage feed (only Home + community feeds). 8th consecutive session with a stale prompt premise |

## Decisions (Eston, 2026-07-04)

1. **Collapsed state stays the compact StageFeedCard summary** (community badge + author +
   title + description) — designed for cross-community scanning. Expanding reveals the stage
   strip + the S19 engage panel beneath it. NOT the InitiativeStageCard summary swap.
2. **Discussion-stage initiatives become visible in the Problem feed** with an "In
   discussion" state; the active `DiscussionPill` is their only engage (no inline
   co-authoring).
3. **Expanded panels keep a quiet "Open in community" link** (preserves the old tap-through
   path; routes to the existing `?initiative=` deep-link auto-expand).
4. (S18, locked) **Mandate cards keep navigating** to the published artifact page.

## Design

### New component: `src/components/initiative/FeedEngagePanel.tsx` (+ module.scss)

The expanded body of a stage-feed card. Mirrors the community activity cards' wiring once,
parameterized by stage — it does NOT touch or refactor the three community cards (follow-up
noted in §Deferred).

Props: `{ initiativeId, title, stage: 'problem' | 'discussion' | 'proposals' | 'vote',
communityId, hostServer, hostAgent, authorKey?, authorName? }`.

Internals (same pattern as ProblemActivityCard/SolutionActivityCard/VoteActivityCard):

- Fetch `communityMembers`/`communityActiveMembers` for `communityId` if absent (mounts only
  on expand, so collapsed feeds fetch nothing new).
- `useInitiativePost(initiativeId, activeMemberCount, title)` → `post`/`up`/`thresholdMet`.
- Render, top to bottom:
  1. **stageNav row** — `InitiativeStageStrip current={stage}` + `DiscussionPill`
     (`active` when stage === 'discussion'), same row layout as InitiativeStageCard.
  2. **Per-stage engage** (each carries its own `StageGate`):
     - `problem` → `ProblemEngage` (with `up`, author props) + `StageAdvanceBar`
       (`ready={thresholdMet}` + `notReadyReason`, same copy as ProblemActivityCard)
     - `proposals` → `SolutionEngage` + `StageAdvanceBar`
     - `vote` → `VoteEngage` + `StageAdvanceBar`
     - `discussion` → nothing (the active pill in row 1 is the whole engage — decision 2)
  3. **Quiet "Open in community" link** → `/community/{communityId}?initiative={id}`
     (new key `stagefeed.openInCommunity`; styled like ActivityCard's `deepLink`).
- **No metaLine** (scope/SDG/countries/source): the feed card already shows the description;
  keeping the panel lean preserves the ≤5-block bar and avoids duplicating
  InitiativeStageCard's internal markup.

### StageFeedView changes

- `expandedIds: Set<string>` + toggle (CommunityHome pattern).
- **Problem-feed filter widens** to `stage === 'problem' || stage === 'discussion'`
  (decision 2). Proposals/vote/mandate filters unchanged.
- `StageFeedCard` gains `expanded`/`onToggle` + chevron affordance; the title button becomes
  the expand toggle (`aria-expanded` + `aria-controls`) for problem/discussion/proposals/vote.
  **Mandate keeps `onOpen` navigation** (decision 4). Discussion items show an
  "In discussion" `Badge` in the meta row (reuses `stage.discussionPillActive`).
- Expanded card renders `FeedEngagePanel` under the summary.
- Sample cards stay display-only; banners/title block unchanged.

### i18n

New key: `stagefeed.openInCommunity` = "Open in community" (+ fr/sw at parity, packet
append). Reused keys: `stage.discussionPillActive`. No fixture change → **no DEMO_VERSION
bump**; no wire names touched.

### Bars (measured in verification)

- Expanded vote feed card engage zone: ≤5 co-equal blocks, ≤2 boxed depth (stageNav row and
  the quiet link are nav chrome, counted against the ≤5 total all the same:
  strip row · VoteEngage's 4-block stack · link — advance bar renders null for visitors).
- No contract deploy/join on expand for a fresh unverified visitor (network/console check).
- 360px light+dark en/fr/sw walk of all four feeds; keyboard: toggle reachable,
  `aria-expanded` truthful; single h1 per feed.

## Deferred / follow-ups

- Refactoring ProblemActivityCard/SolutionActivityCard/VoteActivityCard onto a shared
  wiring component (FeedEngagePanel is the 4th copy of the member-fetch pattern) — a §7
  post-handoff cleanup candidate, not W3 scope.
- W4 (theme toggle codemod + menu LanguageSwitcher) stays deferred.
