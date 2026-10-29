# Session 23 — S22 gate tail, then kit-convergence part 2 OR D3 (Eston picks)

**Written 2026-07-06 at S22 close. HEAD at write time: local `ui` @ the S22 closeout commit —
`origin/ui` was at `ce0251a` (Eston's parallel session pushed mid-S22, carrying the first four
S22 commits live); the REST of S22 (ProgressBar, dialog convergence, token-zero, helpers,
review fixes, closeout docs) was awaiting Eston's push gate. Re-check first.**

## First: settle the S22 gate state

1. `git status -sb` + `git log --oneline origin/ui..ui` — if the S22 tail is still unpushed,
   present the §8 top entry (S22) for Eston's push green light. Review already done:
   0 Critical / 0 Important / 3 minors fixed (`093fdcf`).
2. After any push: `gh run list --limit 3` (Deploy green) + live-site curl 200. PR #20 ✗ stays
   expected divergence — do not debug.
3. **Concurrent-writer protocol stays in force** (S22 learning): Eston's other session may
   commit/push in this same working tree. `git status` before EVERY commit; stage explicit
   paths only; expect HEAD/origin to move under you.
4. The "tell Ouri `ui` is ready to derive" ping is STILL held at Eston's discretion
   (decided 2026-07-06). Ask only if he raises it.

## Then: pick the arc (batch the ask, recommend-then-confirm)

1. **Kit convergence part 2** (recommended if the goal is handoff polish) — the §7 leftover
   cluster: engage-stack wiring dedup (S20: `useCommunityMemberCounts` + `StageEngageStack`,
   4 copies each), ProblemVoteFlow threshold bar → `<ProgressBar>` (needs marker-overlay
   support; bar currently lacks `role="progressbar"`), the 44px `::after` hit-area mixin (4×),
   `teaserTone` enum, FundingFlow empty-state/tabs kit adoption, VotingFlowShell extraction.
2. **Liquid delegation (D3)** — the one named-but-missing mechanism (fixture stub only in
   `src/services/demo/fixtures/mechanisms.ts`). Product decisions FIRST (delegation scope,
   revocation, cycle handling, UI surface) — brainstorm with Eston before any spec.
3. **Chichewa `ny.ts`** (~1141 keys now) — widens the human-gated review backlog; product call.
4. Offline last-view cache / WhatsApp summary (S14 shipped the lighter anchor deliberately).

## ⚠️ Re-verify these premises vs HEAD (11 straight sessions caught rot — incl. S22's own)

| Premise (true at S22 close) | Check |
|---|---|
| S22 tail unpushed; origin at `ce0251a` | `git status -sb`, `git log --oneline origin/ui..ui` |
| Raw-rgba debt still 0 in `*.module.scss` | `grep -rnE 'rgba\( *[0-9]' src --include='*.module.scss'` (expect 0 lines) |
| fr/sw parity 1141 | parity scanner → `RESULT: PARITY OK` |
| Every dialog on shared Modal (law holds) | `grep -rln 'role="dialog"' src --include='*.tsx'` → only Modal.tsx + SlideOutMenu.tsx |
| ProgressBar has exactly 3 consumer files | `grep -rln "ProgressBar" src/components --include='*.tsx'` (QVFlow, AdoptionFramework, SharedStatement + shared/index) |
| ProblemVoteFlow bar still hand-rolled, no role | `grep -n 'progressbar\|thresholdBar\|barFill' src/components/collaboration/flows/voting/ProblemVoteFlow.tsx` |
| Engage-stack dedup still open (4 copies) | `grep -rln "membersLoaded\|memberCount" src/components/initiative src/components/feed 2>/dev/null` then read §7 |
| D3 still fixture-stub only | `grep -rli "delegat" src --include='*.ts*'` (expect only fixtures/mechanisms.ts) |

## Read first

1. Skills: `gloki-change-control`, `gloki-session-lifecycle`, `gloki-verification-and-qa`
   (+ `gloki-governance-domain` if D3 is picked).
2. Memory: `project_session22_jul2026` (the concurrent-writer + barrel-grep + HMR-ghost
   learnings), `project_handoff_goal_jul2026`.
3. MASTER_TODO §7 Post-handoff tail + §8 top entry (S22); the S22 spec's re-grounding table
   as the template for premise checks.

## Workflow + constraints

Same discipline as S1–S22: re-ground premises → batch Eston's decisions → docs-first spec/plan
→ small ship-grade commits (concurrent writer!) → whole-diff review 0 Crit/0 Imp → **push only
on Eston's explicit green light**. Slow-drive I/O rules hold (sequential subagents, ONE preview,
controller drives it). New strings: full i18n ritual + packet append. No DEMO_VERSION bump
unless seed content changes.

When ready: run the premise checks, then bring Eston the gate state + the batched arc ask.
