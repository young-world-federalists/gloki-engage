---
name: gloki-failure-archaeology
description: "Use when tempted to rebuild, revert, or 'fix' something in Communities2/Gloki that may already be settled history — e.g. resurrecting a deleted component (PipelineView, PositionsBoard, PageHeader, left menu), re-adding QV carry-over seeding, wondering why there were separate ui and server-side branches (and why there is one trunk now), greenfielding an offline/presence component, trusting local review-panel findings, repointing branches, or when a prompt/reviewer describes code that doesn't match HEAD and you need the historical why."
---

# Gloki Failure Archaeology


The chronicle of every major investigation, dead end, rejected fix, revert, and deliberate deletion in this repo — so no session re-fights a settled battle, rebuilds a deliberately deleted subsystem, or "fixes" something that is working as designed.

## Overview

**Core principle: before building, reverting, or debugging anything that smells historical, check this chronicle first. Most "bugs" a fresh session finds here are settled decisions, expected divergence, or stale premises — and most "new" components already exist as orphaned prior art.**

Course correction here has never been done by reverting: docs-first sessions, review-before-push and deletions as deliberate chore commits kept it that way. The one true revert in the repo lives on an archive branch and is the most instructive postmortem in the project (entry 2).

Status tags used below:

| Tag | Meaning |
|---|---|
| **SETTLED** | Decided, done, evidence in git. Do not reopen, do not rebuild, do not relitigate. |
| **RESOLVED-CONVENTION** | The incident produced a standing rule/workflow that all sessions follow. |
| **OPEN** | Known, unresolved, or deliberately parked. Safe to pick up — with confirmation from whoever owns it. |

Jargon used throughout, defined once:
- **Real / demo variant**: every page has two states, `/page` on the real network and `/page?demo=true` on the demo layer (`src/services/demo/`) — `docs/DEMO_MODE.md`.
- **Trunk**: `unified`, becoming `main` (entry 1).
- **DEMO_VERSION**: seed-version string in `src/services/demo/mockApi.ts`; bumped only when seed fixtures change.
- **Eras**: work happened in named waves — *Lanes A–G* (parallel worktrees, late May 2026), *Batches 5–17* (early–mid June), *Waves 0–5* (hierarchy/a11y, June 20–21), *Sessions S1–S46+* (from June 26). Commit prefixes like `(s7)` and grep-able names like "Lane F" refer to these.

---

## 1. Three eras of branches — and why there is one trunk now

**Status: SETTLED**

- **Era 1 (Jul 2025 – Apr 2026)**: Ouri's original blockchain build on `main` — real server, Python contracts (`archive/blockchain-main` keeps the pre-reset line).
- **Era 2 (2026-04-25 – 2026-10)**: commit `1642822` "feat(ui-only): reset to main + apply hardcoded UI snapshot" started the **`ui`** branch — the whole UI on an in-browser demo layer. From 2026-09-02 Ouri merged `ui` into **`server-side`**, wired the real network there, and `server-side` deployed. The UI and the real side drifted apart and had to be reconciled at every merge.
- **Era 3 (from 2026-10-29)**: **one trunk** (`unified`, becoming `main`) that contains both: the real app is the base, and every page can also show its demo variant at `?demo=true`. Eston designs on demo variants, Ouri builds the real side, both on the same code (`docs/DEMO_MODE.md`). `server-side` and `ui` retire once the trunk replaces them.
- Don't recreate a separate "UI on stubs" branch: a design that isn't real yet is a page's demo variant on the trunk.

## 2. THE QV carry-over revert — never seed shared contract state from per-browser refs

**Status: SETTLED anti-pattern (the only true revert in repo history)**

- **Goal**: carry top-3 approved proposals from the Proposals stage into the Vote stage (`2d3aaae`, 2026-04-24, on what is now `archive/blockchain-main`).
- **Root cause — three data-integrity bugs** (full postmortem in the revert commit body, `git log -1 --format=%B 963170d`):
  1. QVFlow seeded proposals via `add_proposal(text)`, which stores `master()` as author → **the first visitor to open the vote stage became the permanent displayed author/country of every carried proposal**.
  2. Two concurrent users both saw an empty proposal map and both wrote the full top-3 → **6 rows instead of 3, permanently** — `carriedOverRef` is per-browser, not cross-member.
  3. `approvalContractId` was not keyed on `collaborationId` in InitiativeDashboard → initiative A's approval contract could seed initiative B.
- **Evidence**: reverted same day in `963170d` (2026-04-24, archive/blockchain-main). The concept returned *safely* on ui as the **S5 "carry spine"** (`169a149`, 2026-06-27) — contract-side, canonical-author-preserving, idempotent.
- **The settled rule**: shared contract state must be seeded contract-side (idempotent, author-preserving), **never from a per-browser React ref or first-visitor client write**. If you see client code about to write "initial" shared state, stop and check this pattern.

## 3. The deliberation/presence subsystem — built dormant, swept in S7. Do not resurrect

**Status: SETTLED — and the audit-undercount lesson is RESOLVED-CONVENTION**

- **Arc**: rich co-authoring deliberation UI (PositionsBoard / AnchoredThread / ParticipationMeter / CoPresenceBar) built in Batch 5 (`f8b211e`, 2026-06-04) → never live-wired; the discussion stage became a thin ThreadedDiscussion wrapper (`438fbd6`, 2026-06-26) → deleted in the S7 sweep, 2026-06-29: `e2fce82` (8 files, 1,652 deletions) + `9f0662b` (useDiscussionData hook) + `ace6e9f` + `434da86` + `2c1dcbf` + `3efeb58` (fixtures + DEMO_VERSION global-v12) — **~2,200 lines total across six dedicated chore commits**.
- **Do not rebuild** PositionsBoard/AnchoredThread/ParticipationMeter/CoPresenceBar or the positions/anchored data chain. If a future spec wants deliberation UI, it's a new product decision → recommend-then-confirm with Eston (see gloki-change-control).
- **The S7 lesson**: the initial dead-code audit under-reported scope by ~3x ("4 components + 3 fixtures + 4 methods"); manual consumer-graph tracing revealed the full hook→api→demo-contract→fixture→seed chain. **`tsc` never fails on unused exports — grep the consumer graph (who imports what, who reads returned fields) is the real gate.** Full method: gloki-refactor-and-dead-code.

## 4. PipelineView, dual header, left menu — deliberately deleted chrome. Do not reintroduce

**Status: SETTLED**

- **PipelineView** (the original collaboration pipeline page): orphaned by the community-feed restructure, deleted `fd40f04` (2026-06-18, 947 deletions). Stale docs kept referencing it after deletion — if you see a doc mention PipelineView, the doc is stale, not the codebase.
- **Left menu**: dropped for a global Gloki header, `41b42dc` (2026-06-18).
- **Dual header** (PageHeader + GlobalHeader): deleted for one AppHeader with skip-link + `<main>` landmark, `6a6ed3d` (2026-06-20, Wave 1 keystone); commit body records the decisions as "confirmed with Eston".
- Do not add per-page headers, a left drawer/menu, or a pipeline page. Navigation IA is a locked product decision (gloki-change-control).

## 5. Lane F connectivity kit — orphaned 32 days, then adopted. Orphaned ≠ absent

**Status: RESOLVED-CONVENTION (check for prior art before greenfielding)**

- **Arc**: SmartImage / DataSaverToggle / SyncBadge / ChannelBadge + a `/lab/presence` showcase built in Lane F (`8e7ce9c`, 2026-05-29) → sat finished-but-unwired for a month → **adopted into the live app in S14** (2026-07-01): `4287d4f` (SmartImage at avatar sites), `479ffdd` (DataSaverToggle in Profile), `1b842eb` (useOnline + OfflineBanner). The S14 prompt called offline work "greenfield"; it was actually a complete orphaned kit.
- **Residue**: the `/lab/presence` dev route still ships (`PresenceLabRoute` in `src/App.tsx`). Check it before building any presence/offline/connectivity component.
- **The rule**: before building any "new" component, run the orphaned-prior-art check — `git log --oneline --grep="<lane/batch/feature name>" -i`, grep `src/components/shared/`, check existing `*.demo.tsx` variants, and visit `/lab/presence`. Full procedure: gloki-refactor-and-dead-code.

## 6. The lane/worktree model — a one-time bootstrap, retired

**Status: SETTLED**

- Seven parallel worktree lanes (A–G) with owned-paths coordination ran exactly once (merged 2026-05-30/31), then the machinery was deliberately retired (`c3c4995`, 2026-06-01, which also archived the backend docs to `docs/archive/`).
- The ongoing model is **named sessions**: brainstorm → spec → plan → build → review → push gate (gloki-session-lifecycle), on short branches off the trunk. Subagents share one preview browser, so they run **sequentially** (and on Eston's machine the repo sits on a slow USB drive that freezes under parallel I/O — gloki-build-env-run).
- If old docs (`docs/LANES.md`, lane prompts) suggest spinning up lanes: historical artifacts, not instructions.

## 7. Accretion-dilution (S15) — fix by RE-COMPOSITION, never by reverting shipped features

**Status: RESOLVED-CONVENTION**

- **Symptom**: Eston's feedback that "the design has been removed" / the page felt design-less.
- **Root cause**: NOT app-wide decay — nine sessions of features had stacked **~9 co-equal visual blocks inside ONE component** (SolutionsBoard), each individually fine, collectively a wall.
- **Fix**: recompose the component — flush list, inline "Evidence" expand, promoted hierarchy (`0df30d3`, 2026-07-01) — keeping every shipped feature. **Audit to locate the concentration before sweeping**, and never respond to "it looks worse" by reverting functionality.
- Bonus settled fact from the same session: `InfoDisclosure` is a **modal** (for rules/explainer prose), not an accordion — per-item content folds use an inline expand (button + `aria-expanded` + chevron).

## 8. The stale-premise saga — re-ground every prompt against HEAD first

**Status: RESOLVED-CONVENTION (the #1 recurring lesson)**

Session prompts are written from earlier state and go stale silently. Session after session contained a false premise (S14's "greenfield offline work" was the complete orphaned kit of entry 5; S15's "generalize the whole app" was one copy string). Re-grounding against HEAD repeatedly turned "sizable workstreams" into surgical edits.

**Rule**: verify every premise in a session prompt against HEAD before writing code. Procedure: **gloki-session-lifecycle** Step 2.

## 9. Smaller settled items

| Item | Symptom → cause → status |
|---|---|
| **Batch 16: five shape mismatches** (2026-06-14) | Demo stub ↔ card feature merge had FIVE field-shape mismatches (`decision` vs `status`; votes map vs `forCount`/`againstCount`; vote vocab; `accept` vs `accepted`; `createdAt` seconds vs ms). The 5th surfaced only as a rendered "20598159 days left" countdown — demo contracts emit `Date.now()` ms; the card's `*1000` was the outlier. **RESOLVED-CONVENTION: render the UI state; code review alone misses shape bugs** (gloki-verification-and-qa). |
| **Batch 8: a read with no writer** (2026-06-09) | Every returning user stuck at `/welcome` because the first-run check read a localStorage key nothing ever wrote. **SETTLED** (first run is now decided by the real profile contract) — but grep for the writer whenever a check reads a key. |
| **Batch 9b: focus-trap disabled edges** | Tab escaped the Modal → disabled controls were counted as focus-trap edge elements. Fixed with `:not(:disabled)` in both Modal and SlideOutMenu. **SETTLED**; reuse the selector in any new trap. |
| **Branch-label near-miss** (~2026-05-29) | A session mis-moved the `main` branch label onto a synthetic baseline, believing main "didn't exist"; restored. **RESOLVED-CONVENTION: never repoint or force-move a shared branch without checking what it tracks** (gloki-change-control). |
| **Branches inventory** | `unified` = the trunk (becoming `main`). `server-side`, `ui` = retiring two-branch model (entry 1). `origin/foundation-baseline` = frozen 2026-05-29 snapshot, 0 unique commits — ignore. `archive/blockchain-main` = pre-reset on-chain line, historical reference only; it holds the QV revert postmortem (entry 2). **SETTLED**. |
| **Zero code TODOs by policy** | `grep -rn TODO src --include='*.ts*'` at HEAD hits only a comment naming the MASTER_TODO doc. Open work lives in `MASTER_TODO.md` §7, not in code comments. **RESOLVED-CONVENTION: don't leave TODO comments; file them in MASTER_TODO** (gloki-docs-and-writing). |
| **Local review panel's false-positive record** | S6: all findings false positives (small models misread *deleted* diff lines as live bugs); S7: Gemini misread FOR_OURI production-TODO notes as defects; S8: zero diff coverage; S9: ran fully, 0 valid blockers (can't see locale/scss files); deepseek-r1 dropped entirely (never emits JSON). **RESOLVED-CONVENTION: panel findings are leads to verify (tsc/grep/preview), never verdicts; never run it — or `--free-ram`/`--quit-chrome` — unprompted.** The accepted quality gate is per-task reviews + an Opus whole-branch review (gloki-verification-and-qa). |

## What is genuinely OPEN (not settled)

- The dead-but-interwoven CSS cluster sharing grouped selectors with live classes, deliberately parked during the hierarchy-review close-out for a later surgical audit (build can't catch a wrong CSS removal). **OPEN** — coordinate with gloki-refactor-and-dead-code.
- `/lab/presence` still routed (`src/App.tsx`) — a surviving lab artifact, kept intentionally as a dev verification page. Removing it is a product decision, not a cleanup to do in passing.
- The transitional id-based mixing of real and demo data on pages that don't have a demo variant yet (`docs/DEMO_MODE.md`, Transition). **OPEN** — removed page by page.

---

## When NOT to use this skill

| You actually need… | Use instead |
|---|---|
| The standing rules/gates themselves (push gate, locked decisions, scope) | **gloki-change-control** |
| How to run a session end-to-end (re-grounding procedure, close-out) | **gloki-session-lifecycle** |
| How to scope/execute a deletion or refactor NOW (consumer-graph method, SCSS checks, orphan check procedure) | **gloki-refactor-and-dead-code** |
| Live debugging of a current symptom (triage table) | **gloki-debugging-playbook** |
| Seam mechanics, DEMO_VERSION bump rules, fixtures | **gloki-seam-and-demo-data** |
| What counts as evidence, preview lore, review tiers | **gloki-verification-and-qa** |
| QV math / trust model semantics (not their history) | **gloki-governance-domain** |
| Env/build/deploy commands, slow-drive discipline details | **gloki-build-env-run** |
| Future ambitions and open research problems | **gloki-research-frontier** |

This skill is the *history* — the why-it's-settled. The siblings hold the *how-to-now*.

## Provenance and maintenance

Updated 2026-10-29 on branch `unified`; earlier entries verified in git as cited. Re-verify:

| Fact | Re-verify with |
|---|---|
| No revert commits besides `963170d` | `git log --oneline -i --grep=revert --all` |
| QV revert postmortem text | `git log -1 --format=%B 963170d` |
| DEMO_VERSION | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| `/lab/presence` still routed | `grep -n "lab/presence" src/App.tsx` |
| Branch inventory | `git branch -a` |
| Zero real TODOs in src | `grep -rn TODO src --include='*.ts' --include='*.tsx'` |

If a re-verify command disagrees with this file, the repo wins — update the entry and re-date this section.
