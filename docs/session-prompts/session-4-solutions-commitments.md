# Session 4 kickoff — Solutions card + commitments data spine

> Paste this into a fresh Claude Code session in the Communities2 repo (branch `ui`) to start Session 4 of the design-consistency + pipeline-redesign roadmap. Sessions 1 (design-system foundation), 2 (problem card + discussion-as-chat + DM), and 3 ("Write together" community page + co-authoring relocation) are shipped & deployed.

---

You're picking up **Session 4** of the 6-session "design-consistency + pipeline redesign" roadmap. Start by reading these for context (don't skip — they carry the locked decisions and the foundation you build on):

- Roadmap / master spec: `docs/superpowers/specs/2026-06-25-design-consistency-pipeline-redesign-roadmap.md` (see **§2 decision #2 — the commitments+metrics spine**, **§5 Session 4**, and **§6 dependencies**: S4 → S5 → S6 is a fixed chain).
- S1 plan (shipped): `docs/superpowers/plans/2026-06-25-session-1-design-system-consistency.md`
- S2 spec + plan (shipped): `docs/superpowers/specs/2026-06-26-problem-card-discussion-chat-design.md`, `docs/superpowers/plans/2026-06-26-session-2-problem-card-discussion-chat.md`
- S3 spec + plan (shipped): `docs/superpowers/specs/2026-06-26-write-together-community-page-design.md`, `docs/superpowers/plans/2026-06-26-session-3-write-together.md`
- `DESIGN_SYSTEM.md` and `ARCHITECTURE.md`.

**This is creative UI + data-model work → begin with the `superpowers:brainstorming` skill.** Resolve the open questions below *with Eston* (one at a time, recommend-then-confirm; offer the visual companion the first time a layout question is genuinely clearer shown than told). Write a short spec, then `superpowers:writing-plans`, then execute with `superpowers:subagent-driven-development`. Do NOT start coding before Eston approves the design.

## What S1–S3 gave you (reuse it — don't reinvent)
- **`UserIdentity`** (`src/components/shared/UserIdentity.tsx`) — `[flag] Name [verified-shield]`. Use for every solution author / co-author / commitment-author byline.
- **The threshold-bar pattern** from `ProblemVoteFlow` (the problem card's "agreed by at least half" bar + the de-boxed `ProblemEngage` reorder) — **reuse it for the two solution thresholds** (don't build a new bar).
- **The approval/solutions mechanics** already exist and are the thing you're redesigning (not rebuilding from scratch): `ApprovalFlow` (add proposal + approve toggle + Proposals/Results `SegmentedControl`), the **merge** mechanic (`ProposalMergePanel`/`MergeProposalCard`/`merge.ts`, "suggest a merge"), and the **expert** mechanic (`ExpertEndorseButton`, `initiativeRoles`, `EXPERTS`/`EXPERT_REVIEWS`).
- **S3 already extended `add_proposal` with optional `coAuthors`/`co_authors`** — solutions submitted from "Write together" carry co-authors; render them. You'll extend the SAME write again with `commitments`.
- Canonical `$stage-*` palette; the shared kit (`Button`/`Card`/`Modal`/`Banner`/`Badge`/`EmptyState`/`InfoDisclosure`/`SearchableSelect`/`StageStrip`). Prefer these. The 3-commitments collector is a `Modal`.
- **SDG:** `SdgTag` + `SDG_OPTIONS` (`fixtures/problems.ts`) already render on problem cards — extend to the solution card.

## Session 4 goal (roadmap §5 + decision #2)
Redesign the **Solutions (proposals) card** and lay the **commitments + metrics data spine** that threads through S5 (Vote carries) → S6 (Mandate consumes — its "What we commit to" / "How we'll know it's working" stop being hardcoded fixtures in `fixtures/mandate.ts` and become derived from the winning solution). The card work:

1. **Forehead scope prefix:** prefix the problem text with **"Global problem:"** vs **"Community problem:"** (driven by a per-problem scope flag). *Finalize the exact labels at brainstorm.*
2. **SDG label** on the card.
3. **Body order — "Add solution to this problem" input FIRST.** On "Add", a **popup collects 3 commitments** — *"Who and what needs to change to make this solution a reality."* Below the input, the list of other solutions, each showing its commitments (small bullet text) + the identity treatment (flag + name + shield).
4. **Fold three actions into the one per-solution feed:** **upvote**, **suggest expert review**, **suggest a merge** (suggest only — never accept). Suggesting a merge triggers a **gradient animation** around all solutions prompting the user to click a target solution to complete the suggestion.
5. **Two threshold indicators** above the input (reuse the problem threshold pattern): e.g. *"5 solutions with upvotes from 50% of community"* and *"3 experts reviewed."* (3 experts = three users clicked "suggest expert review" → Gloki Team solicits experts; experts edit the community-voted solutions, which then advance to a vote.)
6. **Remove the Results tab** (un-illuminating at this stage).
7. **Data spine (decision #2):** extend the proposal shape with `commitments` (authored here); add an **expert-review pathway** that lets experts attach `metrics`. New demo methods/fields in `approval.ts` — **named cleanly and documented for Ouri** (he has no contract for these yet). Store them so S5 can carry and S6 can consume.
8. Apply **expand-in-place** to the solution card.

## Open design questions to resolve in the brainstorm (with my leanings)
- **Scope flag source.** How is "Global problem:" vs "Community problem:" determined in the stub? **Lean: an explicit per-problem `scope: 'global' | 'community'` field (seeded on the `INITIATIVES` fixture; later settable in the Write-Together / create-initiative paths). Don't derive from country count — too implicit.** Confirm the exact label copy.
- **The 3-commitments popup.** Structure + how many required. **Lean: on "Add solution", a `Modal` collects the solution text + 3 commitment lines (free-text, ≥1 required, all encouraged), stored as `commitments: string[]` on the proposal. Keep it light — no per-commitment "who/what" sub-fields unless you want them.** Confirm required-count + free-text vs structured.
- **The per-solution action row + the merge gradient.** Confirm the three inline actions (upvote / suggest expert review / suggest a merge). **Lean: reuse the existing `merge.ts` "suggest" mechanic; the new bit is the interaction — entering a "pick a target" mode that draws a token-pure gradient ring around all solutions, tap a target to complete, with a `prefers-reduced-motion` fallback. Keep "suggest expert review" as a 1p1v counter toward the 3-expert threshold (reuse/extend `ExpertEndorseButton`/`initiativeRoles`).** Confirm whether the old `ExpertEndorseButton` stays or folds into the new row.
- **The two thresholds.** Confirm the exact rules + how each is counted in the stub: *solutions-with-50%-upvote* count toward "5"; distinct "suggest expert review" clicks toward "3". **Lean: reuse the problem threshold-bar component; both are read-only indicators (no hard gate this stage — consistent with S2 killing the 33% gate).**
- **Commitments + metrics data spine (the load-bearing decision).** Finalize the shape + method names for Ouri: `commitments: string[]` on `add_proposal` (extend the existing write); a new expert pathway (e.g. `add_metrics(proposal_id, metrics)` / an expert-review record) attaching `metrics: string[]`. **Decide how the winning solution's commitments+metrics will be readable by S5/S6** (this is why S4 precedes them) — e.g. they live on the proposal in `approval.ts` and the Vote/Mandate read them back. Name everything cleanly; document for Ouri.
- **Remove the Results tab** — confirm (roadmap says yes; the `ApprovalFlow` Proposals/Results `SegmentedControl` loses Results).
- **Layout at 360px.** The redesigned card (scope prefix + SDG + two thresholds + add-solution-first + the solutions list with commitments + the 3-action row + the merge "pick a target" animation). Resolve in the brainstorm (use the visual companion for the card + the merge interaction).

## Current-state pointers (read during brainstorm)
- **The solution card surface to redesign:** `src/components/initiative/stages/SolutionEngage.tsx` (+ `.module.scss`) — currently a thin wrapper that `StageGate`s + renders `ProposalsStage` (variant `dashboard`). `src/components/stages/ProposalsStage.tsx` renders `ApprovalFlow` (instanceId `${initiativeId}_proposals`, `parentContractId={initiativeId}`, `stageKey="proposalsContractId"`).
- **The mechanism (Lane D — imported, redesign carefully):** `src/components/collaboration/flows/voting/ApprovalFlow.tsx` (+ `.module.scss`) — add proposal, approve toggle, Proposals/Results `SegmentedControl`, `ProposalMergePanel`, `ExpertEndorseButton`. API: `src/components/collaboration/flows/voting/approvalApi.ts` (`addProposal(…, coAuthors?)`, `approve`, `withdrawApproval`, `getProposals`/`getApprovalCounts`/`getMyApprovals`/`getProposalsAndCounts`).
- **Demo contract:** `src/services/demo/demoContracts/approval.ts` — `Proposal` = `{ id, text, author, timestamp, coAuthors? }` (NO commitments/metrics yet); `add_proposal`/`approve`/`withdraw_approval`/`get_proposals`/`get_approval_counts`/`get_my_approvals`/`get_approvals`. This is where `commitments` + the expert `metrics` pathway land.
- **Merge family:** `ProposalMergePanel`, `MergeProposalCard`, `src/services/demo/demoContracts/merge.ts` (+ its api) — the "suggest a merge" mechanic to reuse.
- **Expert family:** `ExpertEndorseButton`, `src/services/initiativeRoles.ts`, `EXPERTS`/`EXPERT_REVIEWS` in `src/services/demo/fixtures/deliberation.ts`.
- **Threshold pattern to reuse:** `src/components/collaboration/flows/voting/ProblemVoteFlow.tsx` (+ `.module.scss`) — the de-boxed threshold bar from S2.
- **SDG:** `SdgTag`/`SDG_OPTIONS` in `src/services/demo/fixtures/problems.ts` + how problem cards render the tag.
- **Scope flag:** `INITIATIVES` in `fixtures/problems.ts` (each has `community`, `countries`) — where a `scope` field would be seeded.
- **The Mandate consumer (S6, but design the spine for it now):** `fixtures/mandate.ts` (hardcoded articles=commitments / indicators=metrics) + `MandateDocument.tsx` — decision #2's payoff is making these derived. Read so the spine you author is shaped to what S6 will consume.
- **Card shell + expand-in-place:** `InitiativeStageCard.tsx` (forehead = header; Engage slot = body). Funds page (`Currency.tsx`) is the self-contained-page precedent if any of this needs a sub-page.

## S3 hand-off — relevant to S4
- S3 left `SolutionEngage` **deliberately untouched** — the solution-card redesign is wholly yours.
- S3 extended `add_proposal` with optional `coAuthors`; **extend the same write with `commitments`** (keep both optional/backward-compatible).
- **Still-deferred cleanups (not S4's job unless you're already in the file):** the dormant `PositionsBoard`/`AnchoredThread`/`ParticipationMeter`/`CoPresenceBar` + `PRESENCE_*` fixtures remain in the repo (Eston's "leave dead code" call); the 3 original S2 cleanups (DiscussionFlow.module.scss dead CSS, presence fixtures, `.liked` AA) still pending; and a for-Ouri note that the Write-Together draft registry (JSON in community props) should become a dedicated contract at production scale. Leave these unless touched.

## Workflow + constraints (same discipline as S1–S3)
- **Branch `ui`, keep it runnable.** Stay behind `src/services/api.ts`; never call a real server from a component. The demo seam emits **no `contract_write` events** → flows **re-fetch after writes** (the ConcernsFlow/funding/Write-Together pattern).
- **New contract methods/fields named cleanly and documented for Ouri** (he has no commitments/metrics contract yet) — in-code "FOR OURI" comments, like S2/S3's `like_comment`/`set_statement`.
- **Tokens only**; reuse `UserIdentity` + the threshold bar + the kit; **360px flagship, verify light + dark.** The merge gradient animation must be token-pure + have a `prefers-reduced-motion` fallback. AA gates per `DESIGN_SYSTEM.md` (no `$gray-400` text; ≥44px touch; focus rings).
- **New user-facing strings ship at fr + sw key parity** (`src/i18n/fr.ts` + `src/i18n/sw.ts`; en inline). After adding, run the key-parity check (extract `'key':` lines, sort, diff fr vs sw — must be empty) + a code-ref↔i18n cross-check. Append new strings to `docs/i18n-native-review-candidates.md` (wordlists/codes stay English).
- **Production build runs `tsc -b`** — `npm run build` must be clean before each commit. No test framework: verify via build + the `preview_*` tools (dev server `gloki-dev`, port 5173) at 360px.
- If new demo data is seeded (sample commitments/metrics/expert-reviewed solutions), **bump `DEMO_VERSION`** in `src/services/demo/mockApi.ts` (S3 ended at `global-v7`; next is `v8`).
- Execute **subagent-driven** (fresh implementer per task — cheapest tier when the plan carries full code, mid-tier for integration; per-task spec+quality review; an **Opus whole-branch review** at the end). Track a ledger (`.superpowers/sdd/progress.md`); for i18n parity + prune do your own grep cross-check.
- **Gate:** run the local multi-model review panel (`/code-review` → `local-review` skill) on the session diff — **do NOT pass `--quit-chrome`** (Eston keeps Chrome open; heavy Ollama models may RAM-skip — note it; `GEMINI_API_KEY` from `.env` adds the gemini-flash architecture reviewer). Then **push `origin/ui`** to deploy (PR #20's ✗ vs `main` is expected divergence, not a build failure). **Confirm the seed/demo-content + the deploy with Eston before pushing.**
- Update project memory after the session (`project_consistency_pipeline_redesign_jun2026` + the `MEMORY.md` index line).

When ready, kick off with the brainstorming skill and the first open question (the scope-flag source + exact "Global/Community problem:" labels) — and remember the commitments+metrics spine is the load-bearing part: design it so S5 carries it and S6 consumes it.
