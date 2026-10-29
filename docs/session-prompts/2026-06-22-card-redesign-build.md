# Next session — build the card-system redesign (Unit 1 → units 2–6)

## Mission
Continue the Gloki card-system redesign. **Finish Unit 1** (mount the new shared card on
the Problem card so it's visible + verified), then **build units 2–6 with a focused agent
team** against the approved spec. Eston already approved the direction and the execution
mode ("foundation first, then team").

## Read these first (the contract — don't re-litigate settled decisions)
1. `docs/superpowers/specs/2026-06-22-card-redesign-design.md` — the design spec (source of truth).
2. `docs/superpowers/plans/2026-06-22-card-redesign-unit1.md` — Unit 1 task-by-task plan.
3. `docs/superpowers/specs/2026-06-22-card-redesign-brief.md` — Eston's raw feedback (every ask).
4. Memory `project_card_redesign_jun2026.md` (+ `project_stage_feed_simplification_jun2026.md`).

## Locked decisions (settled — build to these)
- **North star: layered** — scan fast, dive on tap.
- **One shared two-part card** `InitiativeStageCard` (already built): a Read summary (stage
  *pill* only, content-as-headline paragraph, single byline) over a shaded **Engage** panel
  (per-stage quick action + a blue "Open the full {stage}"). Collapsed→expand = the
  Mandate-card model. Approved via mockup.
- **Framed by content**: the problem *statement* is the headline; merge "the problem" +
  "who it affects" into one paragraph. Author shown **once** (no duplicate initials avatar).
  Kill "We chose this together", the "N countries" flag-wall (use a flag icon + count), and
  the "Why this matters / voices" list.
- **Discussion = one thread per post** ("Discuss this"), **keep** the community chat,
  **retire/redirect** the standalone discussion-stage page, and **fix** the bug where a
  problem's discussion opens an *unrelated* statement (id resolution).
- **Execution: foundation by hand, then agent team.** Unit 1 is built solo; units 2–6 go to
  a focused agent team (one agent per stage) against this spec — Eston has opted in.

## Current state
- Branch **`ui`** (the deploy branch — develop here; PRs are `ui→main`). HEAD **`3378168`**,
  fully pushed, in sync with `origin/ui`.
- **Deploy reality:** pushing to `ui` triggers a green GitHub Pages build (~1 min). Live at
  https://young-world-federalists.github.io/gloki-engage/ . The **orange ✗ on PR #20 is an
  expected merge conflict with `main`** (long-lived review PR), NOT a build failure — ignore it.
- **Shipped & live this session:** stage-feed compact tap-through cards + "Explore Gloki" +
  trimmed stage banners (`a3f3598`/`71fdd27`); Track A shell bugs — global footer on
  community pages, dark-mode community-pill contrast, header community-name hidden via the
  new `AppHeader` `titleVisuallyHidden` prop (`dd89095`).
- **Unit 1 Task 1 done:** `src/components/initiative/InitiativeStageCard.tsx` (+ `.module.scss`)
  — the shell. Presentational, **unused so far** (app unchanged). Read it for the API
  (`StagePost`, `InitiativeStageCardProps`).

## Your task — finish Unit 1 (Tasks 2, 3, 5), then verify, then units 2–6

### Task 2 — extract `useInitiativePost` + `ProblemEngage`
- Read `src/components/stages/ProblemStage.tsx` (the logic to lift) and `ProblemStage.demo.ts`
  (`getProblemFraming`, `proposeCandidateIssue`).
- Create `src/components/initiative/useInitiativePost.ts` — lift ProblemStage's reads
  (`getInitiative`, `resolveInitiativeStageContract`, `getTally`, `getProblemFraming`) into a
  hook returning a `StagePost` (merge `framing.description` + `framing.whoWhy` → `headline`;
  `countryCount` = unique countries; `sdg`/`source` from framing/details) + `{ thresholdMet }`.
- Create `src/components/initiative/stages/ProblemEngage.tsx` — move ProblemStage's threshold
  status line + `<ProblemVoteFlow/>` (unchanged) + the "Propose a framing" link + the
  `ProposeIssueModal` (move verbatim). **Drop** the "We chose this together" `Banner` and the
  "Why this matters / voices" block. Add a "Discuss this" action (route to the existing
  discussion deep-link for now; Unit 5 finalizes the per-post thread).
- Verify `npx tsc -b` = 0. Commit.

### Task 3 — mount on the community-page Problem card (the visible payoff)
- Read `src/components/community/ActivityCard.tsx` and
  `src/components/collaboration/InitiativeStagePanel.tsx` (what ActivityCard mounts on expand).
- For `stage === 'problem'`, render `InitiativeStageCard` (post from `useInitiativePost`,
  `expanded`/`onToggle` from ActivityCard's existing state, `onOpen` → the initiative/discussion
  page, `openLabel` = `t('card.openProblem','Open the full problem')`) with `<ProblemEngage/>`
  as children — instead of `InitiativeStagePanel`. Leave other stages on `InitiativeStagePanel`
  (units 2–4 convert them). Add the new i18n key to en fallback + `fr.ts` + `sw.ts`.

### Task 5 — remove dead Problem read chrome
- Strip the now-duplicated read chrome from `ProblemStage.tsx`/`.module.scss` (grep for
  importers first; keep the `.demo.ts` seam intact).

### Verify (REQUIRED — no test framework in this repo)
- `npx tsc -b` must exit 0 before every commit.
- `preview_start` (config name **`gloki-dev`**, port 5173). Navigate `/stage/problem`, click a
  problem card → lands on `/community/:id?initiative=:id` (auto-expands the card). Confirm the
  expanded Problem card shows: **single byline** (no initials circle), the **problem statement
  as the headline**, **no "We chose this together"**, SDG + flag-count + source on **one quiet
  line**, the vote works, "Propose a framing" opens, and the blue **"Open the full problem"**.
- Screenshot **light + dark at 360px**; switch locale **en/fr/sw** (no raw `key.like.this`).
- Commit + push (deploy goes green). Then confirm on the live URL.

### Then — units 2–6 via the agent team
Dispatch one agent per unit against the spec (§3, §4, §6) + the real `InitiativeStageCard` API:
2 Solution engage · 3 Vote engage · 4 Mandate (adopt shell; "View the published mandate" =
`onOpen`) · 5 Discussion (per-post thread; **fix the wrong-content id bug** in
`DiscussionStageView`; retire/redirect the standalone discussion page; simplify "Propose a
framing" country picker → single-select; remove the voices list) · 6 `CommunityCard` (members +
flag-count one line, drop the journey bullet list, thinner). Each agent verifies at 360px
en/fr/sw light+dark and the shell stays the single shared component (no per-stage card forks).

## Working constraints
- **Seam rule:** all contract I/O through `src/services/api.ts` / `src/services/contracts/*`.
  Never call a server from a component. Keep `*.demo.ts` behaviour identical.
- **i18n parity:** any new copy key → en fallback + `src/i18n/fr.ts` + `src/i18n/sw.ts`.
- **External USB drive is slow** — throttle parallel git/IO into small sequential batches.
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Open items to confirm with Eston as they arise (spec §10)
- "Propose a framing" flow (adopt-via-co-authoring vs lightweight suggestion).
- The Vote card's inline quick-action (teaser vs a first credit allocation).
- Whether `/stage/discussion` stays as a browse feed or leaves the footer.

## Definition of done (this session)
Unit 1 visibly live (the community-page Problem card is the new two-part shell, verified
en/fr/sw light+dark at 360px, pushed + green), and units 2–6 either built+verified by the
agent team or in flight with clear per-unit status.
