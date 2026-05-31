# How to run the UI reform — operator guide

This folder is the **prompt library** for the Gloki UI reform. Every prompt here is designed to be
copy-pasted into a fresh Claude Code session opened in the right git worktree. This README explains
**which prompt to use, when, and how to set up the session.**

`MASTER_TODO.md` is the living roadmap (north-star principles, lane definitions, review findings).
`docs/LANES.md` is the owned-paths reference. This file is the runtime manual.

---

## Quick decision tree — "I want to…"

| I want to… | Use this prompt | How many sessions | Worktree |
|---|---|---|---|
| Start a fresh wave (Foundation pass) | `00-foundation.md` | 1 alone | main repo dir |
| Apply Wave-1 coordination items + quick wins between waves | `01-foundation-batch-2.md` | 1 alone | `../gloki-foundation-batch-2` |
| Run a Wave 1 build lane (A–G) | `lane-{a..g}-*.md` | 1–7 in parallel | `../gloki-lane-{x}` per session |
| Run a Wave 1.5 refactor lane | `wave-1.5/<lane>.md` | 1–2 in parallel | `../gloki-wave-1.5-<lane>` per session |
| Review the merged build with the diverse-user panel | `REVIEW-WAVE.md` | 1 alone | main repo dir |
| Quick read-only audit of GitHub structure (branches/PRs/deploy) | `REVIEW-STRUCTURE.md` | 1 alone | main repo dir |
| Run the deep multi-agent code/UX audit + generate the next refactor wave | `REVIEW-AND-REFACTOR-WORKFLOW.md` | (workflow, not a session) | n/a — invoked via the `Workflow` tool |

---

## The cycle (one wave at a time)

```
   ┌───────────────────────────────────────────────────────────────┐
   │  FOUNDATION       00-foundation.md          1 session, alone  │
   │                   (pre-wires shared primitives)               │
   └───────────────────────────────────────────────────────────────┘
                              │  (merges to ui)
                              ▼
   ┌───────────────────────────────────────────────────────────────┐
   │  WAVE 1 LANES     lane-a … lane-g           1–7 parallel      │
   │                   (each in its own worktree → merge to ui)    │
   └───────────────────────────────────────────────────────────────┘
                              │  (merges to ui)
                              ▼
   ┌───────────────────────────────────────────────────────────────┐
   │  REVIEW            REVIEW-AND-REFACTOR-      multi-agent      │
   │                    WORKFLOW.md (preferred) — produces the     │
   │                    next wave's lane prompts + quick wins      │
   │                    OR REVIEW-WAVE.md (lighter persona panel)  │
   └───────────────────────────────────────────────────────────────┘
                              │  (findings)
                              ▼
   ┌───────────────────────────────────────────────────────────────┐
   │  FOUNDATION       01-foundation-batch-2.md   1 session, alone │
   │  BATCH-2          (Wave-1 §10 items + safe quick wins)        │
   └───────────────────────────────────────────────────────────────┘
                              │  (merges to ui)
                              ▼
   ┌───────────────────────────────────────────────────────────────┐
   │  WAVE 1.5         wave-1.5/<lane>.md         1–2 parallel     │
   │  REFACTOR LANES   (5 consolidation lanes in 3 batches)        │
   └───────────────────────────────────────────────────────────────┘
                              │
                              └─────► loop back to REVIEW, then WAVE 2…
```

Per-PR-to-main flow runs in parallel to this: every lane that merges to `ui` also gets a DRAFT
`lane/<x> → main` PR for Ouri (see `MASTER_TODO.md` for the rationale).

---

## Where the project is *right now*

(Update this as you progress.)

| | Status |
|---|---|
| Foundation | ✅ Merged into `ui` and open as PR #8 to `main` |
| Wave 1 (A–G) | ✅ All 7 merged into `ui`, each open as DRAFT PR to `main` (#9–12, #16–18) |
| Wave 1 formal review | ✅ Done — findings in `MASTER_TODO §11` |
| **Foundation batch-2** | **⏳ Next — run `01-foundation-batch-2.md`** |
| Wave 1.5 refactor (5 lanes) | ⏳ Pending — prompts ready in `wave-1.5/` |
| Wave 2 features | ⏳ Defined after Wave 1.5 review |

---

## Step-by-step (the full lifecycle)

### Step 0 — Foundation (do once, at the start)
Open a Claude Code session in the repo on `ui`. Paste `00-foundation.md`. Wait for it to merge.
After this, parallel lane work is safe.

### Step 1 — Wave 1 build lanes (run as many as you want, in parallel)

For each lane (`a`, `b`, `c`, `d`, `e`, `f`, `g`):

```bash
cd /path/to/gloki-engage
git pull origin ui
git worktree add ../gloki-lane-<x> -b lane/lane-<x> ui
```

Open a fresh Claude Code session **in `../gloki-lane-<x>`**. Paste `lane-<x>-*.md`. When done, the
session pushes its branch and opens a PR `lane/lane-<x> → ui`. **You** (or I) merge that PR to roll
the work into `ui` (and the Pages deploy). I then open a DRAFT `lane/lane-<x> → main` PR for Ouri.

### Step 2 — Review the merged wave

Two flavors:

- **`REVIEW-AND-REFACTOR-WORKFLOW.md` (preferred for a structural pass)** — invoked via the
  `Workflow` tool, dispatches ~21 subagents across 8 audit dimensions + 7 per-lane reviews,
  synthesizes a refactor plan, **emits ready-to-paste lane prompts for the next refactor wave**.
  Outputs land in `MASTER_TODO §11` and `docs/session-prompts/wave-1.5/`.
- **`REVIEW-WAVE.md` (lighter UX-feel pass)** — single session, dispatches the 9-persona test-user
  panel against the live preview. Use when you want feel-of-the-app feedback (usability gaps,
  transnational collaboration) rather than code structure.

### Step 3 — Foundation batch-2 (apply the safe leftovers)

Once the review has run, paste `01-foundation-batch-2.md` into a fresh session opened in its own
worktree. It applies the §10 coordination items from Wave 1 + the 5 quick wins that are *safe* to do
now (the other 5 quick wins are deferred into Wave 1.5 lanes that own those files — the prompt is
explicit about which is which to prevent double-work).

### Step 4 — Wave 1.5 refactor lanes (3 batches)

Same mechanic as Wave 1 lanes, but with **ordered batches** (because some lanes depend on others):

```bash
git worktree add ../gloki-wave-1.5-<lane> -b wave-1.5/<lane> ui
```

| Batch | Lanes (run in parallel) | Why this order |
|---|---|---|
| 1 | `design-system-canonicalization` + `utils-and-types-consolidation` | Neither blocks; both pure consolidation. Land both before anything else. |
| 2 | `shared-affordances-extraction` | Alone — touches 25+ files, depends on canonical tokens from batch 1. |
| 3 | `voting-flow-consolidation-and-D3-liquid-delegation` + `i18n-promotion-and-multilingual-parity` | Both depend on the shared kit from batch 2. The first ships the missing D3 mechanism; the second backfills FR/SW. |

Each lane's prompt is at `docs/session-prompts/wave-1.5/<lane>.md`. The `wave-1.5/README.md` has more
context.

### Step 5 — Loop

After Wave 1.5 merges, optionally run `REVIEW-AND-REFACTOR-WORKFLOW.md` again to produce Wave 2.
Repeat the cycle. The `MASTER_TODO §11` log grows with each pass.

---

## The prompts at a glance — full table

| File | Purpose | Sessions | When |
|---|---|---|---|
| `00-foundation.md` | Pre-wire shared primitives, pre-partition central files | **1 alone** | Once, at the very start |
| `01-foundation-batch-2.md` | Apply Wave 1 §10 coordination items + safe quick wins | **1 alone** | Between Wave 1 review and Wave 1.5 |
| `lane-a-onboarding.md` | Onboarding & Identity (`/welcome/*`, Digital Agent) | 1 | Wave 1 |
| `lane-b-issue-problem.md` | Issue Selection & Problem framing | 1 | Wave 1 |
| `lane-c-deliberation.md` | Deliberation & Co-authoring | 1 | Wave 1 |
| `lane-d-mechanisms.md` | QV / Conviction / (planned) Liquid Delegation | 1 | Wave 1 |
| `lane-e-mandate-impact.md` | Mandate artifact & Adoption framework | 1 | Wave 1 |
| `lane-f-presence-multilingual.md` | Transnational presence, multilingual, low-tech | 1 | Wave 1 |
| `lane-g-community.md` | Community home & Currency | 1 | Wave 1 |
| `REVIEW-WAVE.md` | Lightweight 9-persona UX review | **1 alone** | After a wave merges, for feel-of-the-app feedback |
| `REVIEW-AND-REFACTOR-WORKFLOW.md` | Deep multi-agent code/UX audit → refactor plan + next-wave prompts | (workflow, not a session) | After a wave merges, for a structural pass |
| `REVIEW-STRUCTURE.md` | Read-only GitHub-structure audit (branches, PRs, deploy) | **1 alone** | Anytime — when you want a hygiene check |
| `wave-1.5/README.md` | Wave 1.5 run order + headline findings | (read) | Reference before starting Wave 1.5 |
| `wave-1.5/design-system-canonicalization.md` | Tokens canonical, kill local hex/rgba | 1 | Wave 1.5 batch 1 |
| `wave-1.5/utils-and-types-consolidation.md` | Dedup formatters/builders/types | 1 | Wave 1.5 batch 1 (parallel to above) |
| `wave-1.5/shared-affordances-extraction.md` | Modal a11y + 9 dialogs onto shared kit | 1 alone | Wave 1.5 batch 2 |
| `wave-1.5/voting-flow-consolidation-and-D3-liquid-delegation.md` | Extract VotingFlowShell + ship missing D3 | 1 | Wave 1.5 batch 3 |
| `wave-1.5/i18n-promotion-and-multilingual-parity.md` | en/fr/sw parity + dev warnings | 1 | Wave 1.5 batch 3 (parallel to above) |

---

## House rules every session obeys

- **Hardcoded UI only.** No backend, no real network, no `?raw` Python imports. Data via `src/services/demo/`.
- **Stay in your owned paths.** The whole parallel model rests on this. If you need a change in
  another lane's file or a shared file, append a request to `MASTER_TODO §10` instead.
- **Every user-facing string via i18n.** Inline English defaults are fine; Wave 1.5 lane #5 backfills FR/SW.
- **Design tokens & shared components only.** No ad-hoc colors or spacing. (Lane #1 makes this enforceable.)
- **Verify before "done":** `npx tsc -b --noEmit` clean + `npm run build` clean + walk your routes
  in the preview (no console errors, dark mode, 360px, keyboard/screen-reader basics).
- **You merge `lane/* → ui`; Ouri merges `→ main`.** The human stays at both merge gates.

---

## Practical mechanics & gotchas

- **Worktree cleanup after merge:** `git worktree remove ../gloki-<x> && git branch -d <branch>`.
- **Don't over-parallelize supervision.** 3–4 concurrent sessions is a comfortable ceiling for one person.
- **`ui` is the integration branch.** Pages deploys from `ui`. `main` only moves when Ouri merges a PR.
- **Lane PRs to `main` stay DRAFT** until Foundation merges to `main` (their diffs collapse to just
  the lane's changes after that).
- **All review-wave outputs are appended to `MASTER_TODO §11`**, never overwritten — that file is the
  audit trail.
