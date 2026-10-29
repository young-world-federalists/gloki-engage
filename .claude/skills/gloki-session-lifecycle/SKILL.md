---
name: gloki-session-lifecycle
description: Use when starting, running, or closing out a Gloki/Communities2 work session — e.g. handed a session prompt (docs/session-prompts/session-N-*.md), asked to "do the next session" or pick up MASTER_TODO roadmap work, unsure whether to build directly or via subagents, preparing for review or a push, wrapping up (changelog, next-session prompt), or when a session prompt's claims look inconsistent with the actual code at HEAD.
---

# Gloki Session Lifecycle

## Overview

The **session** is the unit of work: one named arc (S1…S46 so far) that takes an idea from prompt →
verified premises → confirmed decisions → spec → plan → build → review → gated push → closeout docs.
Docs-first, review-before-push and premise re-grounding are the load-bearing habits.

**Core principle: treat the session prompt as a possibly-stale map, never as ground truth.** Re-verify
every premise against HEAD before building. Session after session found stale premises, and the check
usually shrank a "sizable workstream" into a surgical edit.

Vocabulary:

| Term | Meaning |
|---|---|
| **Session (S-N)** | One named work arc driven by a prompt in `docs/session-prompts/` |
| **MASTER_TODO.md §7 / §8** | §7 Roadmap = the ONLY source of open work (`src/` has no TODO markers); §8 Changelog = what shipped |
| **North stars** | MASTER_TODO §1: (1) ≥70% unaided usability, (2) felt transnational collaboration — severities are judged against these |
| **Recommend-then-confirm** | Present a recommendation + alternatives for each open product decision; the person you work for decides |
| **Real / demo variant** | Every page: `/page` (real) and `/page?demo=true` (demo variant) — `docs/DEMO_MODE.md` |
| **Whole-branch review** | One Opus-class review of the session's whole diff before the push is proposed |
| **i18n packet** | `docs/i18n-native-review-candidates.md` — new/changed fr/sw strings awaiting a native speaker |
| **Push gate** | An explicit go from the person you work for (Eston or Ouri) |

## When NOT to use this skill

| If the task is… | Use instead |
|---|---|
| Locked decisions, change classes, scope rules | **gloki-change-control** |
| Running the app, build, deploy, the local node | **gloki-build-env-run** |
| What counts as verification evidence | **gloki-verification-and-qa** |
| Real vs demo data, fixtures, DEMO_VERSION | **gloki-seam-and-demo-data** |
| Writing specs/plans/changelog docs | **gloki-docs-and-writing** |
| fr/sw parity and the t() ritual | **gloki-i18n-playbook** |
| A live symptom mid-session | **gloki-debugging-playbook** |
| "Has this been tried/deleted before?" | **gloki-failure-archaeology** |
| A multi-persona UI review campaign | **gloki-ui-review-campaign** |
| Dead-code deletion | **gloki-refactor-and-dead-code** |

## The lifecycle at a glance

| # | Step | Gate / output |
|---|---|---|
| 1 | Orient: MASTER_TODO §7 + the session prompt | You can state the scope and the open decisions |
| 2 | **Re-ground every prompt premise vs HEAD** | A verified-premises list; scope usually shrinks |
| 3 | Brainstorm open decisions | Batched recommend-then-confirm; decisions confirmed |
| 4 | Spec + plan as **docs commits before feat commits** | `docs/superpowers/specs/` + `plans/` files |
| 5 | Build on a short branch off the trunk, in small runnable chunks | Green `npm run build` per chunk |
| 6 | Review: per-task, then whole-branch | 0 Critical / 0 Important, or fixes applied |
| 7 | **Push gate** | Explicit go; never push unprompted |
| 8 | Closeout: §7/§8, i18n packet, `docs/DEMO_MODE.md` page table, next prompt | The next session can start cold |

## Step 1 — Orient

1. `MASTER_TODO.md` §7 (Roadmap) — the current open work and the blocked/coordination items.
2. The session prompt `docs/session-prompts/session-N-*.md`. A good prompt has: context recap with the
   HEAD sha → **"Re-verify these premises vs HEAD"** → "Read first" → workflow + constraints → open
   decisions → kickoff.
3. The prompt's "Read first" list, plus `CLAUDE.md` and `docs/DEMO_MODE.md` for structure.

Prompts written before 2026-10-29 assume the two-branch model (`ui` on stubs, `server-side` real); read
them through `docs/DEMO_MODE.md`. The fr/sw native review needs a human native speaker — never "do" it.

## Step 2 — MANDATORY: re-ground every premise vs HEAD

Prompts are written at the previous session's close while HEAD keeps moving; premises rot silently.
Typical findings: a "missing" feature already existed, a "greenfield" kit sat finished but orphaned, a
"sweep" was one string, a pattern ran on a different contract than claimed.

For EVERY factual claim ("X doesn't exist", "Y is hardcoded", "Z is broken"), verify with a targeted
grep/read before planning around it:

```bash
git rev-parse --short HEAD
grep -rn "ClaimedString" src --include='*.ts' --include='*.tsx'
```

- **Grep the actual files; never trust the prompt's line numbers or "doesn't exist" claims.**
- **Check for built-but-orphaned prior art before greenfielding**: `git log --oneline --grep='<word>'`,
  the `/lab/presence` route, existing `*.demo.tsx` variants.
- Present the corrected premises **before** the brainstorm — they usually change which decisions are open.

## Step 3 — Brainstorm open decisions

- Shape: **recommend-then-confirm** — for each decision a recommendation, the alternatives, the
  trade-off in 2–3 lines. Product calls are Eston's; real-network design is Ouri's.
- **Batch** the decisions into one or two question rounds.
- Locked decisions are never reopened (**gloki-change-control**); if analysis suggests relitigating one,
  flag it as an observation.
- Record decisions in the spec verbatim, attributed and dated.

## Step 4 — Spec + plan as docs commits BEFORE feat commits

- Spec → `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`, committed as `docs(sN): …` before any
  feat commit. Plan → `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`. (`docs/specs/` is not the spec
  library.) Templates: **gloki-docs-and-writing**.
- The plan names, per task: files touched, the verification step, whether it's subagent-safe, and —
  for a page — whether the work is its demo variant, its real side, or both.

## Step 5 — Build

- Branch off the trunk (`unified`, becoming `main`); merge back soon. Design-only work goes behind the
  page's `?demo=true` variant so the trunk stays usable (`docs/DEMO_MODE.md`).
- Small commits, each leaving the trunk runnable with `npm run build` green. Conventional commits with
  the session tag: `feat(s47): …`, `chore(s47): …`, `docs(s47): …`; deletions get their own `chore`
  commits.
- Committing is fine; pushing is gated (Step 7).

**Subagent discipline:**

| Situation | Mode |
|---|---|
| Decoupled tasks with disjoint files | Subagent-driven, **sequential** |
| Tightly coupled changes, nav/routing, anything cross-cutting | Direct execution with checkpoints |
| Any preview-browser interaction | **Controller only** |

Give each subagent exact file paths. Implementers verify via build only and never touch the preview;
tester/reviewer subagents are read-only. If the session runs long, write progress into the plan doc
before any compaction so a resumed session starts warm.

Per-chunk floor (**gloki-verification-and-qa**): `npm run build` clean; walk the change in the app at
360px, light + dark — **both states** of any page you touched (`/page` and `/page?demo=true`); new
strings at fr/sw parity; DEMO_VERSION bumped only if fixtures changed.

## Step 6 — Review gate

1. **Per-task review** after each task or chunk; fix findings before the next.
2. **Whole-branch review** of the session's entire diff — the standing quality gate; ship at
   "0 Critical / 0 Important".

Don't run Eston's local review panel unless he asks (**gloki-change-control** Rule 4). Rank findings
blocker/major/minor against the north stars.

## Step 7 — Push gate (hard stop)

- **Never push without an explicit go** from the person you work for. Present the review verdict + a
  one-paragraph summary of what would ship, then wait for a literal "yes/go/push".
- Until the trunk switch, pushes to `server-side` and `ui` deploy the live site — don't push or merge
  into them unless asked.
- A returning visitor reporting "everything broken" right after a deploy: stale SPA chunk cache; hard
  refresh.

## Step 8 — Closeout

| Artifact | Action |
|---|---|
| `MASTER_TODO.md` §7 | Mark the item done with a short summary + spec link |
| `MASTER_TODO.md` §8 | Prepend a dated changelog entry (what shipped, key decisions, commit range) |
| `docs/DEMO_MODE.md` | Update the page table if a page gained (or lost) its demo variant |
| `docs/i18n-native-review-candidates.md` | Append a "Session N (date)" section with every new/changed fr/sw string |
| Next-session prompt | `docs/session-prompts/session-N+1-<slug>.md`, with a "Re-verify these premises vs HEAD" section listing your own claims |

Closeout docs are committed, and pushed only within an explicit go.

## Provenance and maintenance

Rewritten 2026-10-29 on branch `unified`. Re-verify before relying on these:

| Fact | Re-verify with |
|---|---|
| MASTER_TODO section layout | `grep -n "^## " MASTER_TODO.md` |
| Latest session prompt | `ls docs/session-prompts/ \| sort -V \| tail` |
| Spec/plan libraries | `ls docs/superpowers/specs/ docs/superpowers/plans/ \| tail` |
| `npm run build` = `tsc -b && vite build` | `grep -A8 '"scripts"' package.json` |
| No code TODOs | `grep -rn -e TODO -e FIXME src --include='*.ts*'` |
