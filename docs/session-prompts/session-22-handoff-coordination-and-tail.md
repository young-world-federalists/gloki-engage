# Session 22 — campaign closed: handoff coordination + §7 tail

**Written 2026-07-05 at S21 close. HEAD at write time: local `ui` @ S21 closeout (9 commits
ahead of origin — push was PENDING Eston's gate at S21 close; re-check first). The S18 UI
campaign (W1–W4) is COMPLETE.** This session has no pre-committed build scope: it opens with
gates + coordination, then picks from the §7 tail with Eston.

## First: settle the S21 gate state

1. `git status -sb` + `git log origin/ui..ui` — if S21 is still unpushed, present the S21
   summary (MASTER_TODO §8 top entry) and the **3 adopted-but-unratified decisions**
   (segmented theme control at the global-menu bottom w/ Auto default; LanguageSwitcher in the
   same section; Auto = no `data-theme` attribute) for Eston's ratification + push green light.
2. After any push: `gh run list --limit 3` (expect Deploy to GitHub Pages green) + the live-site
   curl 200 check. PR #20's ✗ vs main stays expected divergence — do not debug.
3. **Spot-check the deployed theme toggle on the LIVE Pages site** (the head snippet + base
   path `/gloki-engage/` ran only in dev/preview so far): force Dark, reload deep-linked route,
   confirm no flash and persistence.

## Then: handoff coordination (Eston's call, not yours to drive)

MASTER_TODO §7 "Handoff-blocking" has ONE open line: "S17 push … After it lands: tell Ouri
`ui` is ready to derive." Pushes have landed through S20 (and S21 if gated through) — the line
is stale. Recommend to Eston: mark it done, and (his call) message Ouri that `ui` is ready to
derive `new-features`. Landing `ui`→`main` is Ouri's, never yours.

## Then: pick the next arc with Eston (batch the ask)

Post-handoff §7 tail, in rough value order — recommend-then-confirm:

1. **Wave 1.5 refactor lanes** (design-system canonicalization; prompts in
   `docs/session-prompts/wave-1.5/`) — includes the progress-bar triplication (S18 m6) and
   the SegmentedControl radiogroup-semantics question (S21 review note).
2. **Liquid delegation (D3)** — the one named-but-missing mechanism (fixture stub only).
3. **Chichewa `ny.ts`** — widens the human-gated review backlog; product decision first.
4. Offline last-view cache / WhatsApp summary (S14 deliberately shipped the lighter anchor).
5. S12 reuse cleanup (ProblemVoteFlow + CreateInitiativePage onto SourceLinks/SourcesInput).

## ⚠️ Re-verify these premises vs HEAD (10 straight sessions caught rot — incl. S21's own)

| Premise (true at S21 close) | Check |
|---|---|
| S21 unpushed, 9 commits ahead (`dc6dbc1..` closeout) | `git status -sb`, `git log --oneline origin/ui..ui` |
| Zero raw `prefers-color-scheme` outside variables.scss mixin internals | `grep -rn "prefers-color-scheme" src --include='*.scss'` (expect 5 lines, all variables.scss) |
| Theme mechanism: `gloki.theme` + `data-theme` + `useTheme.ts` + head snippet | `grep -rn "gloki.theme" src index.html` |
| fr/sw parity 1126 keys | the parity scanner (`RESULT: PARITY OK`) |
| §7 Handoff-blocking S17-push line still stale | read MASTER_TODO §7 |
| 404.html title "Accord" fixed or still open (a task chip was spawned for it) | `grep -n "<title>" public/404.html` |
| Preview lore: separate click-eval from read-eval; reload after colorScheme flip | gloki-verification-and-qa |

## Read first

1. `.claude/skills/gloki-change-control` + `gloki-session-lifecycle` + `gloki-verification-and-qa`.
2. Memory: `project_session21_jul2026` (the S21 learnings), `project_handoff_goal_jul2026`.
3. MASTER_TODO §7 tail + §8 top entry.

## Workflow + constraints

Same discipline as S1–S21: re-ground premises → batch Eston's decisions → docs-first spec/plan
→ small runnable commits → whole-diff review 0 Crit/0 Imp → **push only on Eston's explicit
green light** (push = production deploy). Slow-drive I/O rules hold (sequential subagents, ONE
preview, controller drives it). New strings: the full i18n ritual + packet append.

When ready: run the premise checks, then bring Eston the gate state + the batched §7-tail ask.
