---
name: gloki-session-lifecycle
description: Use when starting, running, or closing out a Gloki/Communities2 work session — e.g. handed a session prompt (docs/session-prompts/session-N-*.md), asked to "do the next session" or pick up MASTER_TODO roadmap work, unsure whether to build directly or via subagents, preparing for review or a push, wrapping up (changelog, memory, next-session prompt), or when a session prompt's claims look inconsistent with the actual code at HEAD.
---

# Gloki Session Lifecycle

## Overview

In this repo the **session** is the unit of work: one named arc (S1…S15 so far) that takes an idea
from prompt → verified premises → Eston-locked decisions → spec → plan → build → review → gated
push → closeout docs. This discipline is why the `ui` branch has **443 commits and ZERO reverts**
(verified `git log --oneline ui | wc -l` and `git log -i --grep=revert ui` — the only true revert
in the whole repo lives on the abandoned `archive/blockchain-main` line). Docs-first, review-before-
push, and premise re-grounding are the load-bearing habits; skip them and you become the first revert.

**Core principle: treat the session prompt as a possibly-stale map, never as ground truth.
Re-verify every premise against HEAD before building — six consecutive sessions (S10–S15) found
stale premises, and every single time the check shrank a "sizable workstream" into a surgical edit.**

Key vocabulary (used throughout, defined once):

| Term | Meaning |
|---|---|
| **Session (S-N)** | One named work arc driven by a prompt file in `docs/session-prompts/` |
| **MASTER_TODO.md §7 / §8** | §7 "Roadmap" (line ~126) = the ONLY source of open work (src has zero TODO/FIXME markers — verified); §8 "Changelog" (line ~275) = per-session shipped record |
| **North stars** | MASTER_TODO §1: (1) ≥70% unaided usability, (2) felt transnational collaboration. All finding severities (blocker/major/minor) are judged against these, not generic code quality |
| **Recommend-then-confirm** | You present a recommendation + alternatives for each open product decision; **Eston decides**. Never decide product questions unilaterally |
| **Seam** | `src/services/api.ts` boundary; all data access goes through it (see gloki-seam-and-demo-data) |
| **DEMO_VERSION** | Seed-version string at `src/services/demo/mockApi.ts` (currently `'global-v16'`, line 17); bump ONLY when demo fixtures change |
| **Opus whole-branch review** | The standing quality gate: one high-capability review of the session's whole diff before the push is proposed |
| **i18n packet** | `docs/i18n-native-review-candidates.md` — append-only log of new/changed fr/sw strings awaiting a human native-speaker pass |
| **Push gate** | Eston's explicit green light. A push to `ui` IS a production deploy (GitHub Pages auto-deploys every push) |

## When NOT to use this skill

| If the task is… | Use instead |
|---|---|
| The invariants themselves — locked decisions, who gates what, scope rules | **gloki-change-control** |
| Running the app, build commands, deploy pipeline, slow-drive I/O rules | **gloki-build-env-run** |
| What counts as verification evidence, preview-automation lore, review tiers in detail | **gloki-verification-and-qa** |
| Seam/API mechanics, demo fixtures, localStorage, DEMO_VERSION bump mechanics | **gloki-seam-and-demo-data** |
| Writing the spec/plan/changelog/memory docs themselves (templates, doc-authority map) | **gloki-docs-and-writing** |
| fr/sw parity tooling and the t() ritual | **gloki-i18n-playbook** |
| Debugging a live symptom mid-session | **gloki-debugging-playbook** |
| "Has this been tried/deleted before?" | **gloki-failure-archaeology** |
| Running a full multi-persona UI review campaign | **gloki-ui-review-campaign** |
| Dead-code deletion or refactor scoping | **gloki-refactor-and-dead-code** |

## The lifecycle at a glance

| # | Step | Gate / output |
|---|---|---|
| 1 | Orient: MASTER_TODO §7 + the session prompt | You can state the tier, scope, and open decisions |
| 2 | **Re-ground every prompt premise vs HEAD** | A verified-premises list; scope usually shrinks |
| 3 | Brainstorm open decisions with Eston | Batched recommend-then-confirm; decisions locked |
| 4 | Spec + plan as **docs commits BEFORE feat commits** | `docs/superpowers/specs/` + `plans/` files committed |
| 5 | Build in small chunks; `ui` stays runnable | Green `npm run build` per chunk |
| 6 | Review: per-task, then Opus whole-branch | 0 Critical / 0 Important, or fixes applied |
| 7 | **Push gate: Eston's explicit yes** | Push = production deploy; never push unprompted |
| 8 | Closeout: §7/§8, i18n packet, memory, next prompt | The next session can start cold |

## Step 1 — Orient

Read, in order (small sequential reads — the repo is on a slow external USB drive; see
gloki-build-env-run for the full I/O discipline):

1. `MASTER_TODO.md` §7 (Roadmap, line ~126) — find the current tier. As of 2026-07-02: P0–P5.5 all
   ✅ DONE; open = P5 tail (Chichewa `ny.ts` locale; content-translation strategy — needs Ouri;
   deferred offline last-view cache + WhatsApp summary), P6 (liquid delegation D3 — the one
   named-but-missing mechanism, only a fixture stub; Wave-1.5 refactor lanes, prompts in
   `docs/session-prompts/wave-1.5/`), plus a deferred S12 reuse cleanup (migrate ProblemVoteFlow +
   CreateInitiativePage onto SourceLinks/SourcesInput).
2. The session prompt: `docs/session-prompts/session-N-*.md`. Use `session-15-card-cohesion-and-generalize.md`
   as the canonical template — its anatomy is: context recap w/ HEAD sha → **"Re-verify these
   premises vs HEAD"** list → "Read first" docs → "Workflow + constraints" → "Open decisions to
   lock" (Eston's calls) → kickoff instruction.
3. The prompt's "Read first" list (specs, memory files, CLAUDE.md sections it names).

Items NOT yours to drive, ever (MASTER_TODO "Blocked / coordination"): landing `ui`→`main`
(Ouri derives `new-features` from `ui`; Eston coordinates) and the fr/sw native review (needs a
human native speaker). If a prompt seems to ask for these, stop and check with Eston.

Stale docs to distrust while orienting: `docs/session-prompts/README.md`'s "where the project is"
table and `next-session.md` describe the retired 2026-05 parallel-lane/worktree model — historical
only. The current model is single sequential named sessions on `ui`.

## Step 2 — MANDATORY: re-ground every premise vs HEAD

**This is the #1 hard-won lesson of the project.** Session prompts are written at the previous
session's close while HEAD keeps moving; premises rot silently. The record — six consecutive
sessions, every one caught stale premises (recorded in project memory, S10–S15, 2026-06/07):

| Session | Prompt claimed | Reality at HEAD | Effect of the check |
|---|---|---|---|
| S10 | "Dangling Vote links" to fix | Already moot | Item dropped |
| S11 | Pseudonym support to build | Partly existed | Scope shrank |
| S12 | Build a submit-review modal | Modal existed; real gap was reviewer *attribution* | Redirected the work |
| S13 | `wtdraft_` pattern on initiative contract | It ran on the **community** contract | Prevented a wrong-layer build |
| S14 | "Offline support is greenfield" | A **complete orphaned connectivity kit** (Lane F, built 2026-05-30) sat unwired at `src/components/shared/connectivity/` + `/lab/presence` | "Build offline" became "adopt existing kit" |
| S15 | "App-wide generalization sweep needed" | App was already ~90% general; "Voices for the Climate" survived in **one copy string** (`onboarding.invite.lead`) | A sweep became 4 surgical edits |

Procedure — for EVERY factual claim in the prompt ("X doesn't exist", "Y is hardcoded", "Z is
broken"), verify with a targeted grep/read before planning around it:

```bash
cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
git rev-parse --short HEAD            # trust this over local `git log` on this drive
grep -rn "ClaimedString" src --include='*.ts' --include='*.tsx'   # does the premise hold?
```

Rules of the check:

- **Grep the actual files; never trust the prompt's line numbers or "doesn't exist" claims.**
- **Check for built-but-orphaned prior art before greenfielding anything** — search
  `git log --oneline --grep='<feature word>' ui` and check the `/lab/presence` route
  (`src/App.tsx`, `PresenceLabRoute`). Orphaned ≠ absent (the S14 lesson: the kit sat finished
  for 32 days).
- Present the corrected premise list to Eston **before** the brainstorm — corrected premises
  usually change what decisions are even open.
- Sonnet-class models otherwise faithfully build against a dead premise. Do not be that session.

## Step 3 — Brainstorm open decisions with Eston

The prompt's "Open decisions to lock" section lists product choices. These are **Eston's calls**:

- Use the `superpowers:brainstorming` skill if available; either way the shape is
  **recommend-then-confirm**: for each decision give a recommendation, the alternatives, and the
  trade-off in 2–3 lines.
- **Batch** the decisions into one or two question rounds (AskUserQuestion-style with option
  buttons where the harness supports it) — don't drip-feed ten single questions.
- Locked decisions are NEVER reopened here (1p1v with QV framing, trust/verification model,
  brand blue, 4-stage browse IA with per-post discussion — see gloki-change-control for the full
  list). If your analysis suggests relitigating one, flag it as an observation, don't act.
- Decisions Eston makes during brainstorm go into the spec verbatim, attributed ("Eston,
  2026-07-02: surgical neutralization, VftC stays one named pilot example").

## Step 4 — Spec + plan as docs commits BEFORE feat commits

Docs-first is the mechanism behind zero reverts: the design is reviewed as prose before it is
expensive as code, and the git history records intent separately from implementation.

- Spec → `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md` (24 dated specs exist; latest
  `2026-07-02-p55-generalize-gloki-design.md`). Commit as `docs(sN): …` **before** any feat commit.
- Plan → `docs/superpowers/plans/YYYY-MM-DD-<slug>.md` (21 exist). Use `superpowers:writing-plans`
  if available. Templates and doc-authority details: **gloki-docs-and-writing**.
- Note: `docs/specs/` (2 old files) is NOT the spec library — `docs/superpowers/specs/` is.
- The plan must name, per task: files touched, the verification step, and whether the task is
  subagent-safe (next step).

## Step 5 — Build: small chunks, runnable `ui`, subagent discipline

- Ship in small commits that each leave `ui` runnable and `npm run build` (= `tsc -b && vite build`)
  green — Ouri derives his branch from `ui` at milestones, so a broken `ui` blocks him.
- Conventional-commit style with the session tag: `feat(s16): …`, `chore(s16): …`, `docs(s16): …`.
  Deletions get their own `chore` commits (see gloki-refactor-and-dead-code).
- Commit locally as you go. **Committing is fine; pushing is gated (Step 7).**

**Subagent discipline** (the slow-drive + shared-browser reality):

| Situation | Mode |
|---|---|
| Decoupled tasks with disjoint files | Subagent-driven (`superpowers:subagent-driven-development` if available), **sequential** |
| Tightly-coupled changes, nav/routing work, anything cross-cutting | Direct execution with checkpoints (S10/S11/S13 all chose this deliberately) |
| Any preview-browser interaction | **Controller only** |

Hard rules:

1. **Subagents run SEQUENTIALLY, never parallel** on this drive; give each subagent exact file
   paths, not "explore the codebase" (incident detail: **gloki-build-env-run**).
2. **Implementer subagents verify via build only and NEVER touch the preview browser; the
   controller (you) drives the ONE shared preview** — full rule, the S9/S14 incidents, and the
   preview lore (auth seeding, eval tricks) live in **gloki-verification-and-qa**.
3. Tester/reviewer subagents are read-only — they never edit code.
4. If the session runs long, **keep status current before any compaction**: write progress into
   the plan doc or project CLAUDE.md so a resumed session starts warm (Eston's standing
   preference, recorded in project memory, Apr 2026).

Per-chunk verification floor (full recipe in **gloki-verification-and-qa**): `npm run build` clean;
preview walk at 360px, light + dark; new strings at fr/sw key parity (**gloki-i18n-playbook**);
DEMO_VERSION bumped only if fixtures changed (S14 and S15 both correctly shipped with NO bump).

## Step 6 — Review gate

Two layers, in order:

1. **Per-task review** — after each task or coherent chunk, a spec-conformance + quality review
   (subagent or `superpowers:requesting-code-review` style). Fix findings before the next task.
2. **Opus whole-branch review** — one review of the session's entire diff. **This is the standing
   quality gate** the project actually trusts; sessions ship at "0 Critical / 0 Important".

Do NOT reach for the local multi-model Ollama review panel: it requires Eston's explicit
confirmation (it quits his apps and may send the diff to cloud reviewers), it was effectively
unavailable S11–S15 (RAM-gated, cloud keys down), and across S6–S9 its findings were consistently
false positives. Never pass `--free-ram`/`--quit-chrome` unprompted. Details and calibration:
**gloki-verification-and-qa**.

Findings are ranked **blocker/major/minor against the two north stars**, not generic lint taste.

## Step 7 — Push gate (hard stop)

- **Never push without Eston's explicit green light.** A push to `origin/ui` auto-deploys to the
  live GitHub Pages site (https://young-world-federalists.github.io/gloki-engage/) — push = deploy
  to production. Present the review verdict + a one-paragraph summary of what would ship, then
  wait for a literal "yes/go/push".
- **Never merge or touch `main`** — `ui`→`main` lands via Ouri's `new-features` derivation.
- After pushing: PR #20 (ui→main) showing ✗/CONFLICTING is **expected divergence, not a build
  failure** — this has been mistakenly re-debugged at least 3 times. Check
  `gh pr checks 20` if in doubt (build+deploy show SUCCESS). Reassure, don't debug.
- If a returning visitor reports "everything broken" right after a deploy: stale SPA chunk cache;
  hard refresh. Not code.

## Step 8 — Closeout

A session isn't done when the code is pushed. Complete ALL of:

| Artifact | Action |
|---|---|
| `MASTER_TODO.md` §7 | Mark the tier ✅ DONE with a parenthetical summary + spec link (match the existing P0–P5.5 entries' style) |
| `MASTER_TODO.md` §8 | Prepend a dated changelog entry (what shipped, key decisions, commit range) |
| `docs/i18n-native-review-candidates.md` | Append a "Session N (date)" section listing every new/changed fr/sw string (format precedent: the "Session 15 (2026-07-02)" section) |
| Project memory | Write/update the session's memory file + one-line MEMORY.md index entry: what shipped, commit range, push state, and the session's LEARNING (the learnings are the project's institutional knowledge) |
| Next-session prompt | Write `docs/session-prompts/session-N+1-<slug>.md` following the session-15 anatomy — and INCLUDE a "Re-verify these premises vs HEAD" section listing your own claims, because your prompt WILL go stale too |

Closeout docs are committed (and pushed only within the already-granted green light, or held for
the next gate — ask if ambiguous).

## Worked example — Session 15 (2026-07-02), the canonical arc

1. **Orient**: prompt `session-15-card-cohesion-and-generalize.md`; MASTER_TODO §7 tier = P5.5
   "generalize Gloki beyond VftC/Africa" + Eston's card-cohesion complaint ("card design has been
   removed").
2. **Re-ground**: Phase-0 audit found NOTHING had been deleted — P0–P5 features had stacked ~9
   co-equal blocks inside `SolutionsBoard` (accretion-dilution in ONE component, not an app-wide
   decay). Grep for "Voices for the Climate" found it in exactly ONE copy string; `PILOT_COUNTRIES`
   was already 197 countries; `regions.ts` already global. A presumed sweep collapsed to surgery.
3. **Brainstorm**: 6 batched decisions (fix scope, anchor, keep-VftC-as-example, geography defaults,
   fixture depth, docs reframe) → Eston locked "surgical neutralization", climate stays one
   community among several.
4. **Spec/plan first**: `docs(s15)` commits (`2026-07-01-solutionsboard-recomposition-design.md`,
   `2026-07-02-p55-generalize-gloki-design.md`) landed before any `feat(s15)`.
5. **Build**: recomposition NOT reverts (never "restore" a design by reverting shipped reviewed
   features); 2 changed i18n keys at fr/sw parity; no fixture change → **no DEMO_VERSION bump**.
6. **Review**: Opus whole-branch → 0 Critical / 0 Important.
7. **Push**: Eston green-lit; `eef225e..d5a6471` pushed to `origin/ui` (+ closeout `c26cdc4`).
8. **Closeout**: §7 P5.5 marked shipped, §8 entry, i18n packet "Session 15" section appended,
   memory file `project_session15_jul2026.md`, learnings recorded.

## Provenance and maintenance

Facts verified 2026-07-02 against HEAD `c26cdc4` on branch `ui`. Incident details (S9–S15 stale
premises, subagent stalls, panel false positives) are embedded from project memory entries dated
2026-04 → 2026-07; unwritten gate rules confirmed by Eston 2026-07-02.

Volatile facts — re-verify before relying on them:

| Fact (as of 2026-07-02) | Re-verify with |
|---|---|
| MASTER_TODO §7 at line ~126, §8 at ~275 | `grep -n "^## " MASTER_TODO.md` |
| Open work = P5 tail + P6 (D3, Wave-1.5) | read `MASTER_TODO.md` §7 "Build order" tail + "Blocked" |
| Latest session = S15; prompts through `session-15-*` | `ls docs/session-prompts/ \| tail` |
| DEMO_VERSION = `'global-v16'` at `src/services/demo/mockApi.ts:17` | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| Spec/plan libraries = `docs/superpowers/specs/` (24) + `plans/` (21) | `ls docs/superpowers/specs/ \| tail -3` |
| 443 commits, zero reverts on `ui` | `git log --oneline ui \| wc -l` ; `git log -i --grep=revert ui` |
| Preview server name `gloki-dev`, port 5173 | `cat .claude/launch.json` |
| `npm run build` = `tsc -b && vite build` | `grep -A6 '"scripts"' package.json` |
| PR #20 = long-lived expected-conflict review PR | `gh pr view 20 --json mergeable` + `gh pr checks 20` |
| Src has zero code TODOs (open work lives in §7 only) | `grep -rn -e TODO -e FIXME src --include='*.ts*'` (expect 1 hit: a MASTER_TODO pointer comment in App.tsx) |
