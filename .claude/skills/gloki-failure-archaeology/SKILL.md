---
name: gloki-failure-archaeology
description: "Use when tempted to rebuild, revert, or 'fix' something in Communities2/Gloki that may already be settled history — e.g. resurrecting a deleted component (PipelineView, PositionsBoard, PageHeader, left menu), re-adding QV carry-over seeding, re-debugging ui-vs-main divergence or PR #20's red X, greenfielding an offline/presence component, trusting local review-panel findings, repointing branches, or when a prompt/reviewer describes code that doesn't match HEAD and you need the historical why."
---

# Gloki Failure Archaeology

The chronicle of every major investigation, dead end, rejected fix, revert, and deliberate deletion in this repo — so no session re-fights a settled battle, rebuilds a deliberately deleted subsystem, or "fixes" something that is working as designed.

## Overview

**Core principle: before building, reverting, or debugging anything that smells historical, check this chronicle first. Most "bugs" a fresh session finds here are settled decisions, expected divergence, or stale premises — and most "new" components already exist as orphaned prior art.**

This repo has **443 commits and ZERO reverts on the `ui` branch** (verify: `git log --oneline -i --grep=revert ui` — 2 hits, both commit bodies saying "no reverts"). That record was earned by docs-first sessions, review-before-push, and deletions done as deliberate chore commits — not by luck. The one true revert in the whole repo lives on an archive branch and is the most instructive postmortem in the project (see entry 2).

Status tags used below:

| Tag | Meaning |
|---|---|
| **SETTLED** | Decided, done, evidence in git. Do not reopen, do not rebuild, do not relitigate. |
| **RESOLVED-CONVENTION** | The incident produced a standing rule/workflow that all sessions follow. |
| **OPEN** | Known, unresolved, or deliberately parked. Safe to pick up — with Eston's confirmation. |

Jargon used throughout, defined once:
- **The seam**: `src/services/api.ts` — every component reads/writes contracts through it, currently backed by the `src/services/demo/` mock layer (the "stub" layer).
- **`ui` branch**: the active UI-mockup branch, deployed to GitHub Pages on every push. **A push to `ui` IS a production deploy** — Eston gates every push.
- **`main`**: Ouri's (backend partner's) real-server line. Never merged or cherry-picked by Claude sessions.
- **DEMO_VERSION**: seed-version string at `src/services/demo/mockApi.ts:17` (currently `'global-v16'`); bumped only when seed fixtures change.
- **Eras**: work happened in named waves — *Lanes A–G* (parallel worktrees, late May 2026), *Batches 5–17* (early-mid June), *Waves 0–5* (hierarchy/a11y, June 20–21), *Sessions S1–S15* (June 26 – July 2). Commit prefixes like `(s7)` and grep-able names like "Lane F" refer to these.

---

## 1. The two-era history — why ui..main divergence is permanent

**Status: RESOLVED-CONVENTION**

- **Era 1 (Jul 2025 – Apr 2026)**: Ouri's original blockchain build — real server, Python contracts, ~40 commits, self-described "unstable commit" era (`2e8a8e5`, `492368c` "currently not working but we cant go back").
- **Era 2 (2026-04-25 → now)**: commit `1642822` "feat(ui-only): reset to main + apply hardcoded UI snapshot" **birthed the ui stub line** — stripped the real-network api.ts, routed everything through the demo seam. ~400 commits landed in the following five weeks.
- Consequence: `ui` was reset from a *snapshot*, not branched-and-merged, so **ui and main can never fast-forward into each other**. At last count ui is 393 ahead of main; main's 2 unique commits (`d28594a`, `459e084` — Ouri's real-coin fundraising work) are **Ouri's, never to be cherry-picked into ui**. ui→main landing is Ouri's job via his `new-features` layer.
- **Recurring false alarm (hit at least 3 sessions)**: PR #20 (ui→main) shows an orange/red ✗. That is `mergeable: CONFLICTING` — the *expected* permanent divergence — **NOT a build failure**. `gh pr checks 20` shows build+deploy SUCCESS. Reassure, don't re-debug.

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
- **Residue at HEAD**: the `/lab/presence` dev route still ships — `PresenceLabRoute` routed at `src/App.tsx:124`. Check it before building any presence/offline/connectivity component.
- **The rule**: before building any "new" component, run the orphaned-prior-art check — `git log --oneline --grep="<lane/batch/feature name>" -i ui`, grep `src/components/shared/`, and visit `/lab/presence`. Full procedure: gloki-refactor-and-dead-code.

## 6. The lane/worktree model — a one-time bootstrap, retired

**Status: SETTLED**

- Seven parallel worktree lanes (A–G) with owned-paths coordination ran exactly once (merged 2026-05-30/31), then the machinery was deliberately retired (`c3c4995`, 2026-06-01, which also archived the backend docs to `docs/archive/`).
- The ongoing model is **sequential named sessions** (S1–S15…): brainstorm → spec → plan → build → review → Eston's push gate (gloki-session-lifecycle). Parallel worktrees are additionally impractical now: the repo lives on a slow USB drive that freezes under parallel I/O, and subagents share one preview browser, so they run **sequentially** (gloki-build-env-run, gloki-verification-and-qa).
- If old docs (`docs/LANES.md`, lane prompts) suggest spinning up lanes: historical artifacts, not instructions.

## 7. Accretion-dilution (S15) — fix by RE-COMPOSITION, never by reverting shipped features

**Status: RESOLVED-CONVENTION**

- **Symptom**: Eston's feedback that "the design has been removed" / the page felt design-less.
- **Root cause**: NOT app-wide decay — nine sessions of features had stacked **~9 co-equal visual blocks inside ONE component** (SolutionsBoard), each individually fine, collectively a wall.
- **Fix**: recompose the component — flush list, inline "Evidence" expand, promoted hierarchy (`0df30d3`, 2026-07-01) — keeping every shipped feature. **Audit to locate the concentration before sweeping**, and never respond to "it looks worse" by reverting functionality.
- Bonus settled fact from the same session: `InfoDisclosure` is a **modal** (for rules/explainer prose), not an accordion — per-item content folds use an inline expand (button + `aria-expanded` + chevron).

## 8. The stale-premise saga (S10–S15) — re-ground every prompt against HEAD first

**Status: RESOLVED-CONVENTION (the #1 recurring lesson, six sessions running)**

Session prompts are written from spec-era state and go stale silently. Every one of S10–S15 contained a false premise (e.g. S14's "greenfield offline work" was actually the complete orphaned kit of entry 5; S15's "generalize the whole app" was one copy string). Re-grounding against HEAD repeatedly turned "sizable workstreams" into surgical edits.

**Rule**: verify every premise in a session prompt against HEAD before writing a line of code. The per-session premise→reality table and the re-grounding procedure live in **gloki-session-lifecycle** (Step 2) — that table is the single home; update it there when S16+ adds a row.

## 9. Smaller settled items

| Item | Symptom → cause → status |
|---|---|
| **Batch 16: five shape mismatches** (2026-06-14) | Demo stub ↔ card feature merge had FIVE field-shape mismatches (`decision` vs `status`; votes map vs `forCount`/`againstCount`; vote vocab; `accept` vs `accepted`; `createdAt` seconds vs ms). The 5th surfaced only as a rendered "20598159 days left" countdown — demo contracts emit `Date.now()` ms; the card's `*1000` was the outlier. **RESOLVED-CONVENTION: render the UI state; code review alone misses shape bugs** (gloki-verification-and-qa). |
| **Batch 8: isFirstRun dead key** (2026-06-09) | Every returning user stuck at `/welcome` → `isFirstRun` read a localStorage key (`gloki.onboarding.completed`) that nothing ever wrote. Fixed in Batch 8. **SETTLED** — but the pattern (a read with no writer) is worth grepping for when a redirect misbehaves. |
| **Batch 9b: focus-trap disabled edges** | Tab escaped the Modal → disabled controls were counted as focus-trap edge elements. Fixed with `:not(:disabled)` in both Modal and SlideOutMenu. **SETTLED**; reuse the selector in any new trap. |
| **Branch-label near-miss** (~2026-05-29) | A session mis-moved the `main` branch label onto a synthetic baseline, believing main "didn't exist" (it was the old blockchain line); restored. **RESOLVED-CONVENTION: never repoint or force-move `main` (or any branch) without checking what it tracks** — and per the standing gates, never touch main at all (gloki-change-control). |
| **Dead branches inventory** | `origin/foundation-baseline` = frozen 2026-05-29 snapshot, **0 unique commits** — ignore. `archive/blockchain-main` = pre-reset on-chain line, 146 unique commits, tip 2026-04-24 — **historical reference only; it holds the QV revert postmortem (entry 2)**. `main`'s 2 unique commits are Ouri's — never cherry-pick. **SETTLED** (re-verify: `git log ui..<branch> --oneline \| wc -l`). |
| **Zero code TODOs by policy** | `grep -rn TODO src --include='*.ts*'` at HEAD hits only a comment naming the MASTER_TODO doc. Open work lives in `MASTER_TODO.md` §7, not in code comments. **RESOLVED-CONVENTION: don't leave TODO comments; file them in MASTER_TODO** (gloki-docs-and-writing). |
| **Local review panel's false-positive record** | S6: all findings false positives (small models misread *deleted* diff lines as live bugs); S7: Gemini misread FOR_OURI production-TODO notes as defects; S8: zero diff coverage; S9: ran fully, 0 valid blockers (can't see locale/scss files); deepseek-r1 dropped entirely (never emits JSON). **RESOLVED-CONVENTION: panel findings are leads to verify (tsc/grep/preview), never verdicts; never run it — or `--free-ram`/`--quit-chrome` — unprompted.** The accepted quality gate is per-task reviews + an Opus whole-branch review (gloki-verification-and-qa). |

## What is genuinely OPEN (not settled)

- The dead-but-interwoven CSS cluster sharing grouped selectors with live classes, deliberately parked during the hierarchy-review close-out for a later surgical audit (build can't catch a wrong CSS removal). **OPEN** — coordinate with gloki-refactor-and-dead-code.
- `/lab/presence` still routed at HEAD (`src/App.tsx:124`) — surviving lab artifact, kept intentionally as a dev verification page. Removing it would be a decision for Eston, not a cleanup to do in passing.
- PR #20's 28%-docs bulk (strip-planning-docs lever was offered to Eston, not executed). **OPEN**, Eston/Ouri's call.

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

Verified 2026-07-02 @ ui HEAD `c26cdc4` by direct `git log`/`git show`/`grep` against the repo. All shas in this file were individually resolved at that commit. Session-numbered incident details (S6–S15, Batches 8/9b/16) are drawn from project memory records (Apr–Jul 2026) where no commit body carries them; commit-anchored facts were re-verified in git.

Volatile facts and their re-verification one-liners:

| Fact (as of 2026-07-02) | Re-verify with |
|---|---|
| ui has 443 commits, zero reverts | `git log --oneline ui \| wc -l` ; `git log --oneline -i --grep=revert ui` |
| DEMO_VERSION = `'global-v16'` at `mockApi.ts:17` | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| `/lab/presence` still routed | `grep -n "lab/presence" src/App.tsx` |
| ui..main = 2 commits (Ouri's), main..ui = 393 | `git log ui..main --oneline` ; `git log main..ui --oneline \| wc -l` |
| foundation-baseline 0 unique / archive 146 unique | `git log ui..origin/foundation-baseline --oneline \| wc -l` ; `git log ui..archive/blockchain-main --oneline \| wc -l` |
| Zero real TODOs in src | `grep -rn TODO src --include='*.ts' --include='*.tsx'` |
| QV revert postmortem text | `git log -1 --format=%B 963170d` |
| PR #20 ✗ = conflict not build failure | `gh pr view 20 --json mergeable` ; `gh pr checks 20` |

If a re-verify command disagrees with this file, the repo wins — update the entry and re-date this section.
