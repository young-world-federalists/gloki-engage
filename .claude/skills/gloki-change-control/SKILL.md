---
name: gloki-change-control
description: "Use when starting ANY change in the Communities2/Gloki repo, when unsure whether a change is allowed, when about to push/merge/deploy, when tempted to rename a contract method, darken the brand blue, add a route, rebuild a deleted component, or build something from the deferred list; when asked 'can I just…', when classifying a change (UI-only vs fixture vs contract-method vs product), or when a reviewer/user challenges a locked product decision (1p1v, trust model, 4-stage IA, HomeView landing)."
---

# Gloki Change Control

## Overview

**Core principle: in this repo, discipline is the CI.** There is no test framework, no
protected-branch config, and no human PR review from the backend partner ("as long as your
code is running, it is fine with me" — Ouri, 2026-06-01). Everything that keeps 443 commits
at **zero reverts** is convention: four hard invariants, five unwritten rules, a change
classification, a list of locked product decisions, and a review-gate ladder. This skill is
that rulebook. Every rule below carries its rationale and the historical incident behind it —
do not treat any of them as optional style.

**Who gates what:** Eston (founder) gates every push and every product decision. Ouri
(backend partner, Haifa) owns `main` and the real server layer. You (the AI session) own
nothing — you build, verify, and recommend.

**Jargon used throughout** (defined once here):

| Term | Meaning |
|---|---|
| **the seam** | `src/services/api.ts` — the only data-access boundary components may touch; currently backed by the `src/services/demo/` mock layer |
| **wire names** | contract method/field names as they cross the seam (`add_proposal`, `proposal_id`) — must byte-match Ouri's real Python contracts |
| **`DEMO_VERSION`** | seed-version constant at `src/services/demo/mockApi.ts:17` (currently `'global-v16'`); bumping it wipes and re-seeds all users' localStorage demo state |
| **north stars** | the two ordered principles in MASTER_TODO.md §1 that all scope is judged against (see Scope discipline below) |
| **`ui` branch** | the active branch. **A push to `ui` IS a production deploy** — a GitHub Actions workflow builds and publishes to GitHub Pages on every push |
| **Opus review** | the whole-branch review by an Opus-class model at the end of a session — the project's accepted quality gate |

---

## When NOT to use this skill

| You need… | Use instead |
|---|---|
| Session workflow (prompt → re-ground → spec → build → push) | **gloki-session-lifecycle** |
| Commands, dev server, deploy pipeline, slow-drive I/O rules | **gloki-build-env-run** |
| DEMO_VERSION bump mechanics, fixtures, localStorage model | **gloki-seam-and-demo-data** |
| Writing/reading the Python contract dialect | **gloki-python-contracts** |
| Directory map, hooks, Redux, routing internals | **gloki-frontend-architecture** |
| QV math, trust layers, mandate semantics | **gloki-governance-domain** |
| What counts as verification evidence, preview lore | **gloki-verification-and-qa** |
| The full story behind a deletion/revert/settled battle | **gloki-failure-archaeology** |
| Deleting or refactoring code safely | **gloki-refactor-and-dead-code** |
| t() ritual, fr/sw parity | **gloki-i18n-playbook** |
| Updating MASTER_TODO, changelog, memory, specs | **gloki-docs-and-writing** |

This skill answers: *is this change allowed, what kind is it, and which gates does it pass through?*

---

## The 4 hard invariants

Violating any of these breaks the `ui` → `new-features` → `main` hand-off or the deploy.
They are non-negotiable; every reviewer checks them.

### 1. The seam rule

> "every component/page reads & writes through `src/services/api.ts`
> (`contractRead`/`contractWrite`/`deployContract`/`joinContract`), currently backed by the
> `src/services/demo/` mock layer. Never call a real server from a component. Keep the
> UI↔service boundary clean so swapping stubs → server calls is a localized change inside
> `src/services/` that never touches components." — CLAUDE.md, verbatim

Also implied: components never import from `src/services/demo/` directly, never call
`fetch`/`EventSource` themselves. Rationale: at each milestone Ouri derives `new-features`
from `ui` and swaps ONLY the internals of `src/services/` for real server calls. One "quick
fetch" in a component breaks that derivation. The whole branch exists because of this seam
(commit `1642822`, 2026-04-25, reset the app onto the stub layer).

Corollary (bites every session): the demo layer emits **no `contract_write` events** —
after any write, the UI must re-fetch or it looks frozen. Mechanics in
**gloki-seam-and-demo-data**.

### 2. The wire-name rule

> "UI contract **method names and field names MUST match Ouri's real contract exactly** —
> `add_proposal`/`proposal_id`/`get_results`/`get_proposals` etc. The words 'solution' and
> 'mandate' are **presentation vocabulary only**; the wire names stay `proposal`. (e.g. the
> add-solution popup calls `add_proposal`.)" — docs/FOR_OURI_seam.md, "The one rule that must not break"

Incidents behind it: the app-wide Proposals→Solutions rename (2026-06-21, `f4379b6`)
deliberately changed display values only — keys and the `'proposals'` contract id survived.
The funding session (2026-06-25) *inferred* method names and broke parity with Ouri's real
contract (it is `distribute`, not `distribute_commons`; there is NO `set_parameters` method).
Before adding any contract call, read the real definitions:

```bash
git show main:src/services/contracts/community.ts   # Ouri's real seam layer
ls src/assets/contracts/                             # in-repo real .py contracts
```

### 3. Contract immutability

> "Contracts are immutable after deploy — new methods require new communities." — CLAUDE.md

A deployed community contract can never gain methods. Standing consequence: communities
deployed before `register_stage_contract` existed silently no-op on it — Chat/Discussion
show an error card there forever (ARCHITECTURE.md known limitation). So: design contract
methods to be additive and complete before they ship, and never assume an old demo community
has a new method. Dialect-level traps (`__init__` re-runs, no writes during reads) live in
**gloki-python-contracts**.

### 4. The build gate — `tsc -b` clean is the only CI

> "Production build runs `tsc -b` — fix all TS errors before pushing" — CLAUDE.md

`npm run build` = `tsc -b && vite build` (package.json). tsconfig is strict with
`noUnusedLocals`/`noUnusedParameters` — **an unused import fails the GitHub Pages deploy**,
because the deploy workflow runs `npm run build:prod` on every push to `ui`. There is no
test framework and no lint step in CI; this typecheck is the entire automated gate.

```bash
npx tsc -b          # must be clean
npm run build       # must be clean
```

Then verify in the running preview (360px, dark mode, keyboard) — recipe in
**gloki-verification-and-qa**.

---

## The 5 unwritten rules (confirmed by Eston, 2026-07-02)

These are first-class gates, equal in force to the invariants above. They are not written
in CLAUDE.md — that is why they are here.

### Rule 1 — Never push without Eston's explicit green light

A push to `ui` triggers the GitHub Actions deploy to the live GitHub Pages site
(https://young-world-federalists.github.io/gloki-engage/). **Pushing IS deploying to
production.** Commit locally in small chunks as much as you like; the push itself waits for
an explicit "go"/"push it" from Eston in the conversation. Every session S1–S15 followed
this; there is no exception precedent.

### Rule 2 — Never merge or touch `main` yourself

`main` is Ouri's real-server layer (last touched 2026-05-05, mid-QA, ~393 commits behind
`ui`). The landing path is: Ouri derives `new-features` from `ui` and pushes to `main` — it
is "not a merge we run" (MASTER_TODO §7 blocked items). Two standing traps:

- **PR #20 (ui→main) shows a red ✗.** That is an *expected merge conflict* with Ouri's
  diverged layer, NOT a build failure — `gh pr checks 20` shows build+deploy SUCCESS. This
  confusion recurred at least 3 times (2026-06-22, 06-25, S8). Reassure; do not "fix".
- A session once mis-repointed the `main` label onto a synthetic baseline believing `main`
  didn't exist (~2026-05-29; restored). Never repoint or force-push `main` — check what a
  branch tracks before touching any ref.

### Rule 3 — Product decisions are Eston's

Two tiers:

- **Locked decisions** (table below) are settled — never relitigate them, even when a
  reviewer, persona, or a11y tool flags them.
- **New product choices** (anything a user would notice: copy framing, mechanism behavior,
  IA, defaults, visual identity) go **recommend-then-confirm**: present options with a
  recommendation (AskUserQuestion in-session), let Eston pick, then build. Never decide
  unilaterally and ship.

### Rule 4 — Never run the local review panel unprompted

The local multi-model review panel (`local_review.py`) quits Chrome and the Jellyfin server
with `--free-ram`, ties up the machine for minutes, and may send the diff to cloud
reviewers. It requires Eston's explicit confirmation every time (a PreToolUse hook also
gates it). Its track record S6–S9 is near-100% false positives, and S11–S15 it was
unavailable entirely; the Opus whole-branch review is the accepted gate. Never pass
`--free-ram` or `--quit-chrome` on your own initiative.

### Rule 5 — Subagents run sequentially; only the controller drives the preview

**Implementer subagents verify via `tsc -b`/build only; the controller session drives the
ONE shared preview browser; persona/tester subagents run one at a time.** The operational
detail and the incident behind this rule live in **gloki-verification-and-qa** (preview
lore); the slow-drive I/O discipline lives in **gloki-build-env-run**.

---

## Change classification

Classify every change before building. The class determines the extra obligations.

| Class | Test | Extra obligations |
|---|---|---|
| **UI-only** | No file under `src/services/demo/` changes | None beyond invariants 1+4. NO `DEMO_VERSION` bump (S14 and S15 both shipped without one) |
| **Fixture/seed** | Anything under `src/services/demo/fixtures/` or the seeding in `seedDemoCommunity.ts` changes | Bump `DEMO_VERSION` in `src/services/demo/mockApi.ts:17`, or returning visitors keep stale localStorage and report "the demo is broken". Bump ONLY when fixtures/seed change. Mechanics: **gloki-seam-and-demo-data** |
| **Contract-method addition** | A demo contract handler in `src/services/demo/demoContracts/` gains a method/field | Update the stub **and** `docs/FOR_OURI_seam.md` **together, in the same change** — that doc is "the single source of truth for the backend contract work the ui branch relies on". Additive/backward-compatible only; wire names per invariant 2; flag any auth the real contract must enforce (the doc already flags `add_expert_review` must be expert-gated — the stub is permissive). Get Eston's sign-off; he coordinates with Ouri. Cautionary precedent: S13 added `set_property`/`get_properties` to `demoContracts/initiative.ts` with sign-off, but FOR_OURI_seam.md was NOT updated and is still missing them at HEAD — an open doc gap (gloki-docs-and-writing §2); don't repeat that half of the precedent |
| **Product-behavior change** | A user would notice different behavior, copy framing, or flow | Recommend-then-confirm with Eston (Rule 3) BEFORE building. Check it is not on the locked list or the deferred list first |

A single piece of work often spans classes (e.g. a new feature = UI + fixture + contract
method) — satisfy the union of obligations.

---

## Locked product decisions — never relitigate

Each of these was decided by Eston, is documented, and has survived challenge. If a review
finding contradicts one, the correct action is a **no-op plus a comment citing the
decision** (S9 precedent: a persona's contrast claim against a documented token was wrong —
verified, no-op'd).

| Decision | What it means | Source |
|---|---|---|
| **1p1v with QV framing** | "One person, one vote — Sybil-resistant, never plutocratic. No token-weighting, no pay-to-influence." Quadratic voting distributes ONE person's credits across options; it never weights people | MASTER_TODO.md §3 |
| **Trust gates eligibility, never weight** | Verified = ≥4 vouches, Vouched = 1–3, Unverified = 0; stage permissions (Anyone/Members/Verified) decide *whether* you may participate, never *how much your vote counts*. Locked at Batch 4. Code: `src/services/trustModel.ts` + `useCommunityTrust` | project memory (Batch 4, 2026-06); S9 changelog in MASTER_TODO §8 |
| **Brand blue stays** | White on `$primary` `#3b82f6` is **3.68:1**, below AA — "Kept deliberately as the brand blue (Eston's call, confirmed at the Batch-8 *and* Batch-9b gates). Do **not** darken `$primary` to 'fix' this without a new product decision" | DESIGN_SYSTEM.md:408 |
| **4-browseable-stage IA** | Global `StageFooter` = "Browse by stage", exactly 4 stages (Problem/Solutions/Vote/Mandate); "Discussion is per-post, not browsed — no /stage/discussion feed exists". Locked at S10. (ARCHITECTURE.md still says 5 icons — it is stale; DESIGN_SYSTEM wins) | DESIGN_SYSTEM.md:344 |
| **HomeView landing** | `/` → HomeView (cross-community overview; first-run → /welcome). Content-first, no auth wall; auth gates only at participation. (LANES.md/ARCHITECTURE.md still say `/` → /stage/problem — stale) | CLAUDE.md routing |
| **Single AppHeader / single h1** | Exactly one AppHeader per page (the app's only `banner` landmark; its title prop is the page's one h1, no page-CTA prop by design). PageHeader/GlobalHeader/left menu were deleted (2026-06-18/20, "confirmed with Eston") — do not reintroduce per-page headers or a left drawer | DESIGN_SYSTEM.md:213; commit `6a6ed3d` |
| **Deleted things stay deleted** | PipelineView, the deliberation/presence subsystem (~2,200 lines, S7), the roadmap page, CoAuthoringPanel — all deliberate consolidations, not accidents. Full chronicle: **gloki-failure-archaeology** | git history (S7 sweep et al.) |
| **Vocabulary** | *initiative* = the effort traveling the 5 stages; *problem* = its Stage-1 founding statement; UI says "Solutions", wire says `proposal` (invariant 2) | project memory (2026-06); FOR_OURI_seam.md |

---

## Scope discipline

**The deferred list gets rejected, not built.** MASTER_TODO.md §6 ("Deferred (Wave 2+ —
explicitly NOT now)", kept "so we don't accidentally build them early"):

- Biometric / hard identity verification (lightweight invite + vouch + web-of-trust mock for now)
- Council DAO, governor elections, full liquid-democracy depth
- Gloki Points economy, leaderboards, gamification depth
- Web5 / censorship-resistant transport, mirror apps
- AI automated debate summaries & public-opinion analysis (AI = translate + light co-writing only)
- On-chain anything (Ouri's separate backend track)

If a prompt, persona finding, or your own enthusiasm proposes one of these: decline, cite §6,
and log it nowhere (it is already logged there).

**Judge all other scope against the two north stars, in order** (MASTER_TODO.md §1):

1. **Usability first** — "≥70% of participants complete the journey unaided" on a cheap
   Android with intermittent data and English as a third language.
2. **A felt sense of transnational collaboration** — Nairobi and Lilongwe feel they are
   building something together.

"If a task doesn't serve one of these, it is probably Wave 2+ (deferred)." Review findings
are ranked blocker/major/minor against these stars, not against generic code quality.

**Open work lives in MASTER_TODO.md §7, never in code comments.** `src/` has zero
TODO/FIXME/HACK markers by policy (verified: one grep hit, a pointer comment in App.tsx).
Do not add TODOs; add a §7 line instead (see **gloki-docs-and-writing**).

**Ship small.** "Ship in small, self-contained chunks, each leaving `ui` runnable"
(MASTER_TODO §4) — Ouri may derive `new-features` from any point on `ui`.

---

## Route-map freeze

The top-level route map in `src/App.tsx` is frozen in shape: each area owns a `/*` wildcard
and "add internal sub-routes inside the area's component where possible" (docs/LANES.md
route-map convention). Adding a new top-level route is a product/IA change → Rule 3
(recommend-then-confirm). Adding a sub-route inside a component you are already changing
(e.g. inside `CommunityView`'s wildcard) is normal work. Note `/lab/presence` (App.tsx) is
a deliberately-kept dev showcase route — leave it.

---

## Design-system law (summary — DESIGN_SYSTEM.md is the authority)

> "The one rule: **no ad-hoc values** — Every colour, space, radius, shadow, font size, and
> transition comes from a token in `src/styles/variables.scss`." — DESIGN_SYSTEM.md

- Never a raw hex, raw px/rem, or literal `rgba(...)` in component styles. Sass-derived
  tints from a token (`rgba($primary, 0.1)`) are allowed. **"Reviewers reject diffs with
  ad-hoc values"** — treat this as a hard gate, not preference.
- "If it's not interactive, it's not blue. If it's not an error, it's not red." (DESIGN_SYSTEM.md:34)
- `$gray-400` is banned for text (2.54:1). Regression gate, run before review:

```bash
grep -rn 'color: $gray-400' src --include='*.module.scss'
# must match ONLY decorative/::placeholder uses — never standalone text color
```

Everything else (spacing, touch targets ≥44px, 360px layout hold, stage/region color
semantics, primitives) — read DESIGN_SYSTEM.md before building UI.

---

## The review-gate ladder

Every session's work passes through, in order:

| Gate | What | Status/notes |
|---|---|---|
| 1. Per-task review | A reviewer pass on each task/commit chunk during the build | Standard subagent-driven or self-review |
| 2. **Opus whole-branch review** | An Opus-class model reviews the entire session diff before push | **THE accepted quality gate** — Eston has repeatedly pre-accepted this as the standing gate. Findings ranked against the north stars |
| 3. **Eston push gate** | Explicit human "go" for the push (Rule 1) | Push = production deploy |

The local multi-model panel is NOT on this ladder (Rule 4). Heavier campaign-style reviews
(persona waves, multi-agent audits) are separate events — see **gloki-ui-review-campaign**
and **gloki-verification-and-qa**.

**Doc-authority tiebreaker** (recurring source of bad premises): when docs disagree,
CLAUDE.md / DESIGN_SYSTEM.md / MASTER_TODO.md / FOR_OURI_seam.md win over ARCHITECTURE.md
and LANES.md, which are known-stale in places (StageFooter icon count, `/` landing route).
Re-ground every claim against HEAD before building on it — five consecutive sessions
(S10–S15) found their prompt premises stale. Full map: **gloki-frontend-architecture**;
workflow: **gloki-session-lifecycle**.

---

## Pre-change checklist (copy into your working notes)

- [ ] Classified the change (UI-only / fixture / contract-method / product-behavior)?
- [ ] Not on the §6 deferred list; serves a north star?
- [ ] Not contradicting a locked decision?
- [ ] Product-behavior parts confirmed with Eston (recommend-then-confirm)?
- [ ] All data access through `src/services/api.ts`; no demo-layer imports in components?
- [ ] Wire names byte-match Ouri's real contract (checked `git show main:...` / the `.py`)?
- [ ] Contract-method additions mirrored into `docs/FOR_OURI_seam.md` in the same change?
- [ ] `DEMO_VERSION` bumped iff fixtures/seed changed?
- [ ] Strings via `t('ns.key', 'English default')` + fr/sw parity (**gloki-i18n-playbook**)?
- [ ] No ad-hoc style values; `$gray-400` grep gate clean?
- [ ] `npx tsc -b` clean and `npm run build` clean?
- [ ] Opus whole-branch review done; findings resolved or explicitly accepted?
- [ ] Eston's explicit green light before `git push`?

---

## Provenance and maintenance

Verified 2026-07-02 @ commit `c26cdc4` (branch `ui`, clean tree, `ui == origin/ui`).
Unwritten rules 1–5 confirmed verbally by Eston 2026-07-02. Incident details (funding
method-name break, PR #20 recurrences, branch-label mishap, S13 precedent, panel
false-positive record) are from project memory, Apr–Jul 2026.

Volatile facts — re-verify before relying on them:

| Fact | As of 2026-07-02 | Re-verify with |
|---|---|---|
| `DEMO_VERSION` value/location | `'global-v16'` @ `src/services/demo/mockApi.ts:17` | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| FOR_OURI wire-name rule wording | "The one rule that must not break" | `sed -n '8,14p' docs/FOR_OURI_seam.md` |
| Brand-blue deviation kept | DESIGN_SYSTEM.md line 408 | `grep -n "Kept deliberately" DESIGN_SYSTEM.md` |
| StageFooter = 4 browseable stages | DESIGN_SYSTEM.md line 344 | `grep -n "Browse by stage" DESIGN_SYSTEM.md` |
| Deferred list contents | MASTER_TODO.md §6 | `sed -n '/## 6. Deferred/,/^---/p' MASTER_TODO.md` |
| Build = tsc gate | `"build": "tsc -b && vite build"` | `grep '"build"' package.json` |
| PR #20 state (✗ = conflict, build green) | mergeable: CONFLICTING; checks SUCCESS | `gh pr checks 20` |
| `main` divergence (Ouri's layer) | ~393 ahead / 2 behind vs main | `git log --oneline main..ui \| wc -l` |
| S13 additive-method precedent | `set_property`/`get_properties` in `demoContracts/initiative.ts` | `grep -n "set_property" src/services/demo/demoContracts/initiative.ts` |
| Zero code TODOs policy holding | 1 hit (a MASTER_TODO pointer comment in App.tsx) | `grep -rn -e TODO -e FIXME -e HACK src --include='*.ts*'` |

If any re-verification fails, the repo has moved — update this skill rather than trusting it.
