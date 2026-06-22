# Card Redesign — Unit 1 Implementation Plan (shell + Problem card)

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use `- [ ]` checkboxes.
> **No test framework** in this repo (CLAUDE.md). "Verify" steps = `npx tsc -b` (must exit 0) **and** browser checks via the preview tools at 360px, en + fr + sw, light + dark. Never claim done without a preview screenshot/snapshot.

**Goal:** Introduce one shared two-part (Read / Engage) card — `InitiativeStageCard` — and use it for the Problem stage in both the stage feed and the community page, replacing the bespoke, over-stuffed Problem rendering.

**Architecture:** A presentational shell owns the **Read** zone (stage pill + content-as-headline paragraph + single byline + one quiet SDG/country-count/source line) and a collapsed→expanded toggle with a blue "Open the full {stage}" button. The per-stage **Engage** zone is passed as `children` (rendered only when expanded, in a visually distinct shaded panel). A `useInitiativePost` hook supplies the Read-zone data (extracted from today's `ProblemStage` reads, through the `api.ts` seam). `ProblemEngage` renders only the quick action (the existing `ProblemVoteFlow`) + Discuss this + Propose a framing.

**Tech Stack:** React 19 + TS + SCSS modules + Redux Toolkit. Contract reads/writes only via `src/services/api.ts` + `src/services/contracts/*`. Icons: lucide-react.

## Global Constraints (from the spec, apply to every task)
- North star **layered**: collapsed summary by default; depth on tap. Read zone always above Engage zone, never interleaved.
- Stage type is a small coloured **pill** only — never a full-width coloured bar.
- Content is the **headline**; for Problem, merge statement + who-it-affects into one paragraph.
- **Author shown once** (no duplicate initials avatar). No "We chose this together" banner. No "N countries" flag-wall — a flag icon + count only.
- All contract I/O through `api.ts`/`contracts/*`. Keep `ProblemStage.demo.ts` behaviour identical.
- fr/sw parity for any new copy key (add to `src/i18n/fr.ts` + `sw.ts`). Reuse existing `problems.*` keys where possible.
- Verify at 360px, en/fr/sw, light+dark. `tsc -b` clean before every commit.

## File Structure
- Create `src/components/initiative/InitiativeStageCard.tsx` (+ `.module.scss`) — the shell.
- Create `src/components/initiative/useInitiativePost.ts` — Read-zone data hook (extract from `ProblemStage` reads: `getInitiative`, `getProblemFraming`, `getTally`).
- Create `src/components/initiative/stages/ProblemEngage.tsx` — the Problem engage slot (wraps `ProblemVoteFlow` + threshold status + Discuss this + the existing `ProposeIssueModal`, moved here).
- Modify `src/pages/StageFeedView.tsx` — render problem cards via `InitiativeStageCard` (collapsed; tap title still routes to the community page per current behaviour, OR expand inline — see Task 4 decision).
- Modify `src/components/community/ActivityCard.tsx` — for the problem stage, render `InitiativeStageCard` (expanded inline) instead of `InitiativeStagePanel`.
- Modify `src/components/stages/ProblemStage.tsx` — reduce to a thin adapter that renders `InitiativeStageCard` + `ProblemEngage` (or is superseded by them), preserving the `.demo.ts` seam.

---

### Task 1: `InitiativeStageCard` shell (presentational)

**Files:** Create `src/components/initiative/InitiativeStageCard.tsx`, `InitiativeStageCard.module.scss`.

**Interfaces — Produces:**
```ts
export type StagePost = {
  stage: PipelineStage;            // from ../../types/initiative
  headline: string;                // content as headline (problem statement merged w/ who-it-affects)
  byline?: string;                 // e.g. "Started by Mei Chen"
  authorKey?: string;              // for the TrustBadge
  createdAt?: number;
  sdg?: { id: number | string; label: string };
  countryCount?: number;
  source?: { label: string; url: string };
};
export interface InitiativeStageCardProps {
  post: StagePost;
  trustState?: React.ComponentProps<typeof TrustBadge>['state'];
  vouchCount?: number;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;              // blue "Open the full {stage}"
  openLabel: string;              // already-translated, e.g. t('card.openProblem','Open the full problem')
  collapsedTeaser?: React.ReactNode; // e.g. "12 agree · weigh in"
  children?: React.ReactNode;       // ENGAGE zone (rendered only when expanded)
}
```

- [ ] **Step 1: Build the Read zone + toggle.** Header row = stage pill (use `STAGE_META[stage]` tone/icon/label from `src/components/community/stageMeta.ts`) on the left, chevron toggle on the right (`aria-expanded={expanded}`, `aria-controls` the engage panel id). Headline `<p>` (clamp to 3 lines when collapsed, full when expanded). Byline row: `post.byline` + `TrustBadge` (if authorKey) + relative date via `formatTimeAgo`. Quiet meta line: SDG badge + `<i>`/lucide `Flag` + `{countryCount} countries` + source link — only render each piece if present, comma/dot separated, one line, wraps gracefully.
- [ ] **Step 2: Build the Engage panel.** When `expanded`, render a shaded panel (`styles.engage`, `border-top`, `background: $gray-50`/dark equiv) containing `children`, then the blue primary button `onOpen` with `openLabel` + `ArrowRight`. Collapsed: render `collapsedTeaser` as a single muted line instead.
- [ ] **Step 3: SCSS.** White card, 0.5px `$gray-100` border, `$radius-lg`, padding `$spacing-lg` (md at ≤`$breakpoint-sm`); engage panel shaded + divider; pill uses the stage tone; full dark-mode block (mirror StageFeedView/HomeView card dark rules); stage pill is inline (not full width). Tokens only — no hex.
- [ ] **Step 4: Verify** `npx tsc -b` exits 0. (Visual verification happens once it's mounted in Task 3.)
- [ ] **Step 5: Commit** `feat(card): InitiativeStageCard shell — read zone + engage slot + collapsed/expanded`.

### Task 2: `useInitiativePost` hook + `ProblemEngage`

**Files:** Create `src/components/initiative/useInitiativePost.ts`, `src/components/initiative/stages/ProblemEngage.tsx`. Reference `src/components/stages/ProblemStage.tsx` (reads to extract) + `ProblemStage.demo.ts`.

**Interfaces:**
- Consumes: `getInitiative`, `resolveInitiativeStageContract`, `getTally` (from `services/contracts/initiative` + `problemVoteApi`), `getProblemFraming` (from `ProblemStage.demo`).
- Produces: `useInitiativePost(initiativeId, fallbackTitle?) => { post: Partial<StagePost>, thresholdMet: boolean, loading }` where `post.headline` = framing.description merged with framing.whoWhy into one paragraph; `post.countryCount` = unique country count; `post.sdg`/`post.source` from framing/details. `ProblemEngage({ initiativeId, communityId, communityMemberCount })` renders: the threshold status line (reuse `problems.thresholdHint`/`thresholdMetHint`), `ProblemVoteFlow` (unchanged), a "Discuss this" button (routes to the per-post thread — Unit 5 wires the destination; for now route to the existing discussion deep-link), and the `ProposeIssueModal` (moved verbatim from `ProblemStage.tsx`, with its `CountryMultiSelect` swapped per spec §5 in Unit 5 — leave as-is in Unit 1).

- [ ] **Step 1:** Implement `useInitiativePost` by lifting the `useEffect` + `useMemo` framing/tally logic out of `ProblemStage` (do not change the seam calls). Merge `framing.description` + `framing.whoWhy` → `headline`.
- [ ] **Step 2:** Implement `ProblemEngage` — move the threshold hint + `ProblemVoteFlow` + propose-link + `ProposeIssueModal` out of `ProblemStage`. Drop the "We chose this together" `Banner` and the "Why this matters / voices" block (per spec).
- [ ] **Step 3: Verify** `npx tsc -b` exits 0.
- [ ] **Step 4: Commit** `feat(card): useInitiativePost + ProblemEngage (extracted from ProblemStage)`.

### Task 3: Adopt in the community page (ActivityCard, problem stage)

**Files:** Modify `src/components/community/ActivityCard.tsx`; `src/components/stages/ProblemStage.tsx` becomes `InitiativeStageCard`+`ProblemEngage` composed (or ActivityCard composes them directly for stage==='problem').

- [ ] **Step 1:** For `stage === 'problem'`, render `InitiativeStageCard` (post from `useInitiativePost`, `expanded` from the existing ActivityCard toggle, `onOpen` → the initiative page / per-post discussion) with `<ProblemEngage/>` as children. Keep other stages on the current `InitiativeStagePanel` for now (units 2–4 convert them).
- [ ] **Step 2: Verify (browser).** preview_start; open a community page with a problem initiative; expand it. Confirm: single byline (no duplicate initials), no "We chose this together", problem statement is the headline, SDG+flag-count+source on one quiet line, vote works, "Propose a framing" opens. Screenshot light + dark, 360px. Switch locale fr + sw — no raw keys.
- [ ] **Step 3: Commit** `feat(card): community page problem card uses InitiativeStageCard`.

### Task 4: Adopt in the stage feed (StageFeedView, problem)

**Files:** Modify `src/pages/StageFeedView.tsx`.

- [ ] **Step 1:** For the problem stage, render `InitiativeStageCard` collapsed with a `collapsedTeaser` (e.g. `{up} agree · weigh in`) and `onOpen`/title-tap routing unchanged (→ community page `?initiative=`). Decision to confirm with Eston: do feed cards expand inline, or stay tap-through-only? Default: **tap-through-only** (keep the feed a pure browse list; engage on the community page) — simplest, matches current behaviour. If inline-expand is wanted, reuse the same `expanded` state pattern.
- [ ] **Step 2: Verify (browser)** at 360px en/fr/sw light+dark: feed still scannable; no regression vs current compact card; tap opens the community page.
- [ ] **Step 3: Commit** `feat(card): stage feed problem cards use InitiativeStageCard`.

### Task 5: Remove dead Problem chrome

- [ ] **Step 1:** Delete the now-unused parts of `ProblemStage.tsx`/`.module.scss` (the read chrome the shell now owns) and any orphaned styles. `ProblemStage` either re-exports the composed card or is removed if no importer remains (grep first).
- [ ] **Step 2: Verify** `tsc -b` clean; grep shows no dangling imports; browser re-check Task 3 + 4 screens.
- [ ] **Step 3: Commit** `refactor(card): drop dead ProblemStage read chrome`.

---

## Units 2–6 (outline — detail each against the real shell API once Unit 1 lands)
- **Unit 2 — Solution card:** `SolutionEngage` (back/support + counts + discuss), adopt shell in ActivityCard + feed for `proposals`.
- **Unit 3 — Vote card:** `VoteEngage` (ballot teaser on card; full ballot on page), adopt shell.
- **Unit 4 — Mandate card:** adopt shell; "View the published mandate" is the `onOpen`; remove the old bespoke chrome.
- **Unit 5 — Discussion:** per-post thread is the `onOpen`/"Discuss this" destination; fix the id-resolution bug; retire/redirect the standalone discussion page; simplify "Propose a framing" country picker → single-select; remove the voices list.
- **Unit 6 — Community card:** members + flag-count one line; drop the journey list; thinner `CommunityCard`.

## Self-review notes
- Spec coverage: Unit 1 covers spec §2 (shell), §3 (Problem engage), part of §7 (components). §4/§5/§6 land in units 5/6. ✓
- Seam: no new direct server calls; reuses existing `contracts/*` + `.demo`. ✓
- No-test-framework: every task verifies via `tsc -b` + preview. ✓
