# Session 10 — Navigation & IA (P1) — Design Spec

**Branch:** `ui` · **Date:** 2026-06-30 · **Roadmap:** MASTER_TODO §7 **P1**

Answers the nine-persona review's second-most-cited blocker (4/9): the global stage
footer reads as *next-step nav for the initiative you're in*, the footer omits
Discussion, and a tapped card lands you on a generic feed instead of the item.

## IA framing (locked with Eston, 2026-06-30)
- **Adopt the split.** The per-initiative **stage strip** becomes the
  *follow-this-initiative* control; the **global footer** is reframed as
  *cross-community discovery*.
- **Footer:** stays a persistent bottom bar, **relabelled "Browse by stage"** and
  **visually demoted** so it no longer reads as next-step nav. Stays **4 stages**.
- **Discussion:** first-class in the **per-initiative strip only** (5 stages).
  Honors S2's "discussion is per-post, not browsed" — no `/stage/discussion` feed.
- **Strip interactivity:** *progress indicator + real destinations.* The inline
  dashboard only renders an initiative's **current** stage (`get_stage`); only
  Discussion (`/initiative/.../discussion`) and Mandate (`/mandate/cid/iid`) are
  independent routes. So the strip highlights the current stage and is tappable
  **only where a real surface exists** — never a misleading "jump to past stage".

## Reconciliation with the (stale) prompt
The prompt was written in the persona-review era; the code moved in S6/S9.
- **Item #4 (dangling "View full" + "Vote" links) — MOOT.** No `/stage/` nav
  exists anywhere outside `StageFooter`/`StageFeedView`. "View full"
  ([MandateCard.tsx:92]) already scrolls to the same-page doc anchor;
  there is **no** provenance "Vote" link in the code. Nothing to rewire.
- **Item #3 (card "drops on a feed") — NARROWER.** Home/feed cards already
  navigate to `/community/{cid}?initiative={iid}`, which **auto-expands** the card
  ([CommunityHome.tsx:52]). The real gap: no **scroll-into-view**, so on a
  multi-initiative community you land on the header/feed with the card expanded
  below the fold. Fix = scroll/focus the deep-linked card.

## Build — three real items

### 1. Per-initiative stage strip (`InitiativeStageStrip`)
- **New** `src/components/initiative/InitiativeStageStrip.tsx` (+ `.module.scss`).
  Router-aware sibling of the read-only `StageStrip` primitive (kept pure for the
  design system + create screens). Reuses the canonical 5-stage list + `$stage-*`
  tokens / visual language.
- Props: `current: PipelineStage`, `communityId`, `initiativeId`, `hostServer`,
  `hostAgent`, optional `className`.
- Per stage: state = `done | current | upcoming` (index vs current). Target:
  - `discussion` → `/initiative/{enc host}/{enc agent}/{cid}/{iid}/discussion`
  - `mandate` → `/mandate/{cid}/{iid}`
  - everything else (incl. current) → no nav (status only).
  - Tappable stages render `<button>`; the rest render static markers. `current`
    gets `aria-current="step"` + highlight (no nav — you're here).
- a11y: `<ol aria-label="Stages of this initiative">`, distinct from the footer's
  "Browse by stage" and StageStrip's "The 5 governance stages" landmark names.
  Reduced-motion safe (token transitions only).
- **Placement:** rendered at the top of the expanded panel in the shared
  `InitiativeStageCard` shell (covers all 5 inline stage cards via one change).
  Threaded a new optional `stageNav` prop from each `*ActivityCard`. Strip shows
  only when expanded — the collapsed summary keeps the single stage Badge.

### 2. Global footer → "Browse by stage" (demoted)
- `StageFooter.tsx`: visible **"Browse by stage"** caption/eyebrow; aria-label →
  `nav.browseByStage`. Stays 4 stages (no Discussion).
- `StageFooter.module.scss`: lighter weight (smaller, muted) so it reads as a
  discovery shelf, not next-step nav. Keep AA, focus-visible, dark mode.

### 3. Open the tapped card in focus (`CommunityHome`)
- When `?initiative=` is present, after mount scroll the matching card into view
  (`block:'start'`) and move focus to its summary control. Smooth scroll only when
  `prefers-reduced-motion: no-preference`. Single source of truth (all card taps
  route here).

## i18n (fr + sw parity; en inline-defaulted)
- `nav.browseByStage` = "Browse by stage" (footer caption + aria).
- `stage.initiativeStripLabel` = "Stages of this initiative" (strip aria).
- Per-stage "go to" affordance reuses existing `stage.*` labels.
- Append new strings to `docs/i18n-native-review-candidates.md`.

## Constraints / guardrails
- Stay behind `src/services/api.ts`; demo seam emits no `contract_write` events.
- Tokens only; AA gates; 360px flagship; light + dark; reduced-motion.
- Single `<h1>` per route + landmarks/skip-link survive (re-check touched routes).
- `npm run build` (`tsc -b`) clean before each commit.
- No `DEMO_VERSION` bump (no fixture changes).
- Stage vocab "Solutions" in UI; contract methods stay `addProposal`/`proposal_id`.
- Local multi-model review gate at the end (no `--free-ram`). Confirm push w/ Eston.
