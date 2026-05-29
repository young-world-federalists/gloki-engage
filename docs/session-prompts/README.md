# How to run the UI reform — operator guide

This folder holds the prompts you paste into Claude Code sessions to execute the
[MASTER_TODO.md](../../MASTER_TODO.md). This page explains **what each prompt is, when to run it, and
how** — read it once before you start.

---

## The big picture (one cycle)

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  STEP 0   Foundation        1 session, ALONE                      │
   │           00-foundation.md  → merges to `ui`                      │
   └─────────────────────────────────────────────────────────────────┘
                              │  (must finish & merge first)
                              ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STEP 1   Wave 1 lanes      up to 7 sessions, AT THE SAME TIME    │
   │           lane-a … lane-g   each in its own worktree → merge to ui│
   └─────────────────────────────────────────────────────────────────┘
                              │  (when the lanes you ran are merged)
                              ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STEP 2   Review            1 session, ALONE                      │
   │           REVIEW-WAVE.md    → 9 test-user personas walk the build │
   └─────────────────────────────────────────────────────────────────┘
                              │  (findings)
                              ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STEP 3   Refactor          1 session (or just me)                │
   │           update MASTER_TODO §11, write Wave 2 lane prompts       │
   └─────────────────────────────────────────────────────────────────┘
                              │
                              └────────────►  back to STEP 1 for Wave 2
```

You repeat **Steps 1→2→3** for each wave. Step 0 happens only once.

---

## The prompts at a glance

| Prompt | When to run it | How many sessions | Run after |
|---|---|---|---|
| **`00-foundation.md`** | Once, at the very start | **1** (alone) | nothing |
| **`lane-a-onboarding.md`** | Wave 1 | 1 | Foundation merged |
| **`lane-b-issue-problem.md`** | Wave 1 | 1 | Foundation merged |
| **`lane-c-deliberation.md`** | Wave 1 | 1 | Foundation merged |
| **`lane-d-mechanisms.md`** | Wave 1 | 1 | Foundation merged |
| **`lane-e-mandate-impact.md`** | Wave 1 | 1 | Foundation merged |
| **`lane-f-presence-multilingual.md`** | Wave 1 | 1 | Foundation merged |
| **`lane-g-community.md`** | Wave 1 | 1 | Foundation merged |
| **`REVIEW-WAVE.md`** | After a wave's lanes merge | **1** (alone) | Wave lanes merged |

The 7 lanes are **independent** — run as many at once as you're comfortable supervising. They edit
disjoint files, so they never collide.

---

## Step-by-step

### Step 0 — Foundation (do this first, alone)
1. Open a Claude Code session in the repo (`gloki-engage`, branch `ui`).
2. Paste the contents of **`00-foundation.md`**.
3. Let it finish and **merge to `ui`**. Pull `ui` locally afterwards.
4. ⚠️ **Do not start any lane until Foundation has merged.** Everything else branches from it.

> Why: Foundation pre-wires the routing and splits the sample-data files so the parallel lanes never
> touch the same file. That's what makes Step 1 safe.

### Step 1 — Wave 1 lanes (parallel)
For **each** lane you want to run, do this in a **separate** Claude Code session:

1. In a terminal, create that lane's isolated workspace (a *worktree* = a second copy of the repo in
   its own folder, on its own branch — so two sessions never fight over files):
   ```bash
   cd /path/to/gloki-engage
   git worktree add ../gloki-lane-a -b lane/lane-a ui      # lane-a; repeat per lane
   ```
2. Open a Claude Code session **in that new folder** (`../gloki-lane-a`).
3. Paste that lane's prompt (e.g. `lane-a-onboarding.md`).
4. When it's done it commits, pushes `lane/lane-a`, and opens a PR into `ui`. Merge the PR (rebase on
   `ui` first if GitHub asks). Because lanes own disjoint files, merges are clean.

**How many at once?** If this is your first time, start with **2–3 lanes** to get a feel for it. Once
comfortable, all 7 can run simultaneously. You don't have to run them all in one wave — pick the
lanes that matter most and defer the rest.

**Recommended Wave 1 priority** (if you don't run all 7): **C (deliberation)** and **F (presence/
multilingual)** carry the "transnational collaboration" principle; **A (onboarding)** and **B (issue
selection)** carry "usability" and the entry point. Those four are the strongest opening hand.

### Step 2 — Review (after the wave's lanes merge, alone)
1. Pull the merged `ui`. Start the preview build (`npm run dev`).
2. Open one Claude Code session in the repo, paste **`REVIEW-WAVE.md`**.
3. It spins up the 9-persona panel (Amara, Thandiwe, Pascal, Dr. Giorgia, …) as subagents, has each
   walk the new features on the live preview, and collects findings rated blocker/major/minor against
   the two north-star principles (usability + transnational collaboration).

### Step 3 — Refactor & loop
1. Feed the review findings back into **`MASTER_TODO.md`**: append them to **§11 changelog**,
   re-prioritize the backlog, and write the next wave's lane prompts.
2. (You can ask me to do this step — "refactor the master TODO from this review" — and I'll generate
   the Wave 2 prompts.)
3. Go back to Step 1 for the next wave.

---

## Practical notes & gotchas

- **Who merges to `ui`?** You do (or me, on request). A session pushes its branch and opens a PR;
  you click merge. Keeping a human at the merge gate is intentional.
- **Cleaning up a worktree** after its lane merges:
  ```bash
  git worktree remove ../gloki-lane-a && git branch -d lane/lane-a
  ```
- **"Stay in your lane" is the one rule that matters.** Each lane prompt lists its **owned paths**. A
  session must only edit those. If it needs something in a shared file (e.g. a new route, a design
  token), it appends a note to **MASTER_TODO §10** for the next Foundation pass — it must not edit the
  shared file itself. This is what prevents merge conflicts.
- **Every session is UI-only.** No backend, no real network, no `?raw` Python imports. New data goes
  in that lane's fixture file and flows through `src/services/demo/`.
- **"Done" means verified**, not "looks right": `tsc` clean + `build` clean + walked the routes in the
  preview (no console errors, dark mode, 360px-wide mobile, keyboard/screen-reader basics).
- **You can pause anytime.** Waves are independent. Run one lane, review it, and stop if you want —
  nothing breaks.
- **Don't over-parallelize supervision.** Each running session may ask you questions. 3–4 concurrent
  is a comfortable ceiling for one person; 7 is for when you're confident and have time to babysit.

---

## What each lane delivers (quick reference)

| Lane | Delivers | VftC phase |
|---|---|---|
| **A** Onboarding & Identity | invite → vouch → Digital Agent → consent, unaided & multilingual | Phase 1 |
| **B** Issue Selection & Problem | collective "what do we tackle" + problem framing | Phase 1→2 |
| **C** Deliberation & Co-authoring | cross-border co-writing, threads, merge, expert review | Phase 2 |
| **D** The 3 Mechanisms | QV + conviction refined, **liquid delegation built** | Phase 2→3 |
| **E** Mandate & Impact | published mandate artifact + adoption framework | Phase 3→4 |
| **F** Presence, Multilingual & Low-tech | translation, country presence, offline/low-bandwidth UX | cross-cutting |
| **G** Community home & Currency | welcoming transnational "town square" | cross-cutting |

Full task detail for every lane lives in **[MASTER_TODO.md §9](../../MASTER_TODO.md)**.
