---
name: gloki-change-control
description: "Use when starting ANY change in the Communities2/Gloki repo, when unsure whether a change is allowed, when about to push/merge/deploy, when tempted to rename a contract method, darken the brand blue, add a route, rebuild a deleted component, or build something from the deferred list; when asked 'can I just…', when classifying a change (UI-only vs demo variant vs real side vs contract vs product), or when a reviewer/user challenges a locked product decision (1p1v, trust model, 4-stage IA, HomeView landing)."
---

# Gloki Change Control

## Overview

**Core principle: in this repo, discipline is the CI.** There is no test framework and no
protected-branch config. What keeps the trunk healthy is convention: four hard invariants, a few
working rules, a change classification, a list of locked product decisions, and a review ladder.
Every rule below carries its reason — none of them is optional style.

**Who does what.** Two people work on one trunk:

- **Eston** (founder) — product and design. Designs new pages and features as **demo variants**
  (`?demo=true`) on top of the working real app, and owns the product decisions.
- **Ouri** (backend) — the real network: IBC nodes, the Python contracts, the real side of every page.
- **You** (the AI session) build, verify and recommend for whichever of them you are working with.
  That person approves your pushes and confirms product choices in their session.

**Jargon** (defined once):

| Term | Meaning |
|---|---|
| **trunk** | `unified`, becoming `main`. Short feature branches off it, merged back continuously. `server-side` and `ui` are retiring and still deploy until the switch (**gloki-build-env-run**) |
| **real / demo variant** | Every URL has two states: `/page` (real, network data) and `/page?demo=true` (the page's demo variant, `Page.demo.tsx`, demo data). Spec: `docs/DEMO_MODE.md` |
| **the seam** | `src/services/` — the only data access components may use: real services for real variants, `src/services/demo/` for demo variants |
| **wire names** | contract method/field names as they cross the seam (`add_proposal`, `proposal_id`) — must byte-match the real contracts in `src/assets/contracts/` |
| **`DEMO_VERSION`** | seed-version constant in `src/services/demo/mockApi.ts`; bumping it wipes and re-seeds every visitor's demo data |
| **north stars** | the two ordered principles in MASTER_TODO.md §1 that all scope is judged against |

## When NOT to use this skill

| You need… | Use instead |
|---|---|
| Session workflow (prompt → re-ground → spec → build → push) | **gloki-session-lifecycle** |
| Commands, dev server, deploy pipeline, local node, environment rules | **gloki-build-env-run** |
| The real/demo split, demo layer, fixtures, DEMO_VERSION | **gloki-seam-and-demo-data** |
| Writing/reading the Python contract dialect | **gloki-python-contracts** |
| Directory map, hooks, Redux, routing internals | **gloki-frontend-architecture** |
| QV math, trust layers, mandate semantics | **gloki-governance-domain** |
| What counts as verification evidence | **gloki-verification-and-qa** |
| The story behind a deletion or a settled battle | **gloki-failure-archaeology** |
| Deleting or refactoring code safely | **gloki-refactor-and-dead-code** |
| t() ritual, fr/sw parity | **gloki-i18n-playbook** |
| Updating MASTER_TODO, changelog, specs | **gloki-docs-and-writing** |

This skill answers: *is this change allowed, what kind is it, and which gates does it pass through?*

---

## The 4 hard invariants

### 1. The seam rule

Components never call a server, `fetch`, or open an `EventSource` themselves.

- A **real variant** reads and writes through `src/services/` — `api.ts` (`contractRead` /
  `contractWrite`, routed per contract by `contractHosts.ts`, plus the `*OnChain` primitives used by
  the real service modules), `services/contracts/`, `verificationRegistry.ts`, `applicationSettings.ts`.
- A **demo variant** (`*.demo.tsx`) reads and writes only through `src/services/demo/`, and never
  reaches the network.
- New code imports `services/demo` only from `*.demo.tsx` files. Older code still does it for the
  transitional id-based routing (`isDemoContract`); that disappears as pages get their two states.

Reason: swapping or adding a backend must stay a change inside `src/services/`, and the two states of
a page must never leak into each other. Mechanics: **gloki-seam-and-demo-data**.

### 2. The wire-name rule

> "UI contract **method names and field names MUST match the real contract exactly** —
> `add_proposal`/`proposal_id`/`get_results`/`get_proposals` etc. The words 'solution' and
> 'mandate' are **presentation vocabulary only**; the wire names stay `proposal`."
> — docs/FOR_OURI_seam.md, "The one rule that must not break"

The real contracts are in the repo (`src/assets/contracts/`); read the method there before calling it,
and make any demo stub answer the same names. Precedent: the funding work once *inferred* method names
and broke parity (it is `distribute`, not `distribute_commons`; there is no `set_parameters`).

### 3. Contract immutability

A deployed contract never gains methods or changes code. A contract change reaches only contracts
deployed afterwards — every design must say what happens on older ones (absence-tolerant readers,
additive optional arguments, or "create a new one"). Dialect traps: **gloki-python-contracts**.

### 4. The build gate — `tsc -b` clean is the only CI

`npm run build` = `tsc -b && vite build`. tsconfig is strict with `noUnusedLocals` /
`noUnusedParameters` — an unused import fails the GitHub Pages build. `vite.config.ts` also refuses to
build without `VITE_APPLICATION_SERVER_URL` / `VITE_APPLICATION_AGENT` (defaults in `.env`). There is
no lint step in CI.

```bash
npx tsc -b          # must be clean
npm run build       # must be clean
```

Then verify in the running app — recipe in **gloki-verification-and-qa**.

---

## Working rules

### Rule 1 — Never push without an explicit go

Commit locally in small chunks as much as you like; `git push` waits for an explicit "go"/"push it"
from the person you work for, in the conversation. Until the trunk switch, a push to `server-side` or
`ui` **deploys** (both rebuild the live Pages site); don't push to them, or merge into them, unless
asked to.

### Rule 2 — One trunk, short branches

Branch off the trunk for a feature, keep it runnable, merge back soon. A half-built feature lives
behind its page's `?demo=true` variant, so the trunk is always usable. Never force-push or repoint a
shared branch; check what a branch tracks before touching any ref.

### Rule 3 — Product decisions are Eston's

- **Locked decisions** (table below) are settled — never relitigate them, even when a reviewer,
  persona or a11y tool flags them.
- **New product choices** (anything a user would notice: copy framing, mechanism behaviour, IA,
  defaults, visual identity) go **recommend-then-confirm**: present options with a recommendation,
  let the person decide, then build.

### Rule 4 — Never run the local review panel unprompted

Eston's local multi-model panel (`local_review.py`) quits Chrome and other apps with `--free-ram`, ties
up the machine and may send the diff to cloud reviewers. It needs his confirmation every time. Never
pass `--free-ram` or `--quit-chrome` on your own initiative.

### Rule 5 — One driver for the shared preview

Implementer subagents verify with `tsc -b` / build only; the controlling session drives the single
preview browser; persona/tester subagents run one at a time. Detail: **gloki-verification-and-qa**.

---

## Change classification

Classify every change before building; a feature often spans several classes — satisfy the union.

| Class | Test | Extra obligations |
|---|---|---|
| **UI-only** | No data-layer file changes | Invariants 1 + 4 |
| **Demo variant** | A `*.demo.tsx` variant, demo stub or fixture changes | Follow `docs/DEMO_MODE.md` (switch, `<DemoNotice />`, demo ids, `useDemoLink`). If fixtures or seeding change, bump `DEMO_VERSION` (**gloki-seam-and-demo-data**) |
| **Real side** | `src/services/` real modules or a page's real variant change | Real reads and writes only through the services; writes confirmed through their event (no demo-style re-fetch hacks) |
| **Contract change** | A real `.py` contract changes | Invariant 3: only new deployments get it — design for older contracts. Update `docs/FOR_OURI_seam.md` for the methods and fields involved, in the same change |
| **Product-behaviour change** | A user would notice different behaviour, copy framing or flow | Recommend-then-confirm (Rule 3) before building. Check it isn't locked or deferred |

When the demo variant of a page is no longer needed, removing it is a manual cleanup: delete the
`*.demo.tsx` file, the switch, and any fixtures nothing else uses.

---

## Locked product decisions — never relitigate

If a review finding contradicts one, the correct action is a **no-op plus a comment citing the
decision**.

| Decision | What it means | Source |
|---|---|---|
| **1p1v with QV framing** | "One person, one vote — Sybil-resistant, never plutocratic. No token-weighting, no pay-to-influence." Quadratic voting distributes ONE person's credits across options; it never weights people | MASTER_TODO.md §3 |
| **Trust gates eligibility, never weight** | Stage permissions (Anyone/Members/Verified) decide *whether* you may participate, never *how much your vote counts*. | Batch 4; `src/services/trustModel.ts` |
| **Brand blue stays** | White on `$primary` `#3b82f6` is **3.68:1**, below AA — kept deliberately as the brand blue. Do **not** darken `$primary` without a new product decision | DESIGN_SYSTEM.md |
| **4-browseable-stage IA** | Global `StageFooter` = "Browse by stage", exactly 4 stages (Problem/Solutions/Vote/Mandate); Discussion is per-post, not browsed — no /stage/discussion feed | DESIGN_SYSTEM.md |
| **HomeView landing** | `/` → HomeView (cross-community overview; first-run → /welcome) in the full build. Content-first; auth gates only at participation | CLAUDE.md routing |
| **Single AppHeader / single h1** | Exactly one AppHeader per page (the only `banner` landmark; its title is the page's one h1). PageHeader/GlobalHeader/left menu were deleted — don't reintroduce them | DESIGN_SYSTEM.md |
| **Deleted things stay deleted** | PipelineView, the deliberation/presence subsystem, the roadmap page, CoAuthoringPanel — deliberate consolidations. Chronicle: **gloki-failure-archaeology** | git history |
| **Vocabulary** | *initiative* = the effort traveling the stages; *problem* = its Stage-1 statement; UI says "Solutions", wire says `proposal` (invariant 2) | FOR_OURI_seam.md |

> **REVIEW NEEDED (2026-10-29): what "verified" means.** This table used to lock "Verified = ≥4
> vouches, Vouched = 1–3, Unverified = 0", per community. The app now verifies people **app-wide** on
> the verification contract in three phases: the first person verifies themselves (founder), people
> #2–#4 need a vouch from *every* verified person (one candidate at a time), and from then on 4 vouches
> from verified people (`src/services/verificationRegistry.ts`, `docs/FOR_OURI_seam.md` 2026-10-28
> addendum). Eston and Ouri to agree on the rule, then restore it to this table.

---

## Scope discipline

**The deferred list gets rejected, not built.** MASTER_TODO.md §6 ("Deferred — explicitly NOT now")
is kept so nothing gets built early. If a prompt, persona finding or your own enthusiasm proposes one
of its items: decline and cite §6.

**Judge all other scope against the two north stars, in order** (MASTER_TODO.md §1):

1. **Usability first** — "≥70% of participants complete the journey unaided" on a cheap Android with
   intermittent data and English as a third language.
2. **A felt sense of transnational collaboration** — Nairobi and Lilongwe feel they are building
   something together.

Review findings are ranked blocker/major/minor against these stars, not generic code quality.

**Open work lives in MASTER_TODO.md §7, never in code comments.** `src/` has no TODO/FIXME/HACK
markers by policy; add a §7 line instead (**gloki-docs-and-writing**).

**Ship small.** Each chunk leaves the trunk runnable.

---

## Route-map freeze

The top-level route map in `src/App.tsx` is frozen in shape: each area owns a `/*` wildcard and adds
sub-routes inside its own component. A new top-level route is a product/IA change → Rule 3. A demo
variant never needs a route — it is the same URL with `?demo=true`. `/lab/presence` is a deliberately
kept dev showcase route — leave it.

---

## Design-system law (summary — DESIGN_SYSTEM.md is the authority)

> "The one rule: **no ad-hoc values** — Every colour, space, radius, shadow, font size, and
> transition comes from a token in `src/styles/variables.scss`." — DESIGN_SYSTEM.md

- Never a raw hex, raw px/rem, or literal `rgba(...)` in component styles; `rgba($primary, 0.1)` is
  fine. Reviewers reject ad-hoc values.
- "If it's not interactive, it's not blue. If it's not an error, it's not red."
- `$gray-400` is banned for text (2.54:1). Gate:

```bash
grep -rn 'color: $gray-400' src --include='*.module.scss'
# must match ONLY decorative/::placeholder uses
```

Everything else (spacing, touch targets ≥44px, 360px layout, stage colours, primitives) — read
DESIGN_SYSTEM.md before building UI.

---

## The review ladder

| Gate | What | Notes |
|---|---|---|
| 1. Per-task review | A reviewer pass on each task/commit chunk | Standard subagent or self-review |
| 2. **Whole-branch review** | An Opus-class model reviews the entire session diff before the push | The accepted quality gate; findings ranked against the north stars |
| 3. **Push gate** | Explicit "go" from the person you work for (Rule 1) | |

Heavier campaign-style reviews (persona waves, multi-agent audits): **gloki-ui-review-campaign**.

**Doc authority** (when docs disagree): `CLAUDE.md` and `docs/DEMO_MODE.md` on structure;
`DESIGN_SYSTEM.md` on UI; `MASTER_TODO.md` on scope and status; `docs/FOR_OURI_seam.md` on contract
methods — all over `ARCHITECTURE.md` and `docs/LANES.md`. The code at HEAD beats every doc: re-ground
every claim before building on it.

---

## Pre-change checklist

- [ ] Classified the change (UI-only / demo variant / real side / contract / product behaviour)?
- [ ] Not on the §6 deferred list; serves a north star?
- [ ] Not contradicting a locked decision?
- [ ] Product-behaviour parts confirmed (recommend-then-confirm)?
- [ ] Real data only through `src/services/`; demo data only from `*.demo.tsx` through `src/services/demo/`?
- [ ] Demo variant follows `docs/DEMO_MODE.md` (switch, `<DemoNotice />`, demo ids, `useDemoLink`)?
- [ ] Wire names byte-match the real contract in `src/assets/contracts/`?
- [ ] Contract changes mirrored into `docs/FOR_OURI_seam.md`; older deployed contracts considered?
- [ ] `DEMO_VERSION` bumped iff fixtures/seed changed?
- [ ] Strings via `t('ns.key', 'English default')` + fr/sw parity (**gloki-i18n-playbook**)?
- [ ] No ad-hoc style values; `$gray-400` gate clean?
- [ ] `npx tsc -b` and `npm run build` clean?
- [ ] Whole-branch review done; findings resolved or explicitly accepted?
- [ ] Explicit go before `git push`?

---

## Provenance and maintenance

Rewritten 2026-10-29 on branch `unified` for the one-trunk, two-states-per-page structure. Volatile
facts — re-verify before relying on them:

| Fact | Re-verify with |
|---|---|
| `DEMO_VERSION` value | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| Wire-name rule wording | `sed -n '/one rule that must not break/,+6p' docs/FOR_OURI_seam.md` |
| Real contracts | `ls src/assets/contracts/` |
| Pages with two states | `git ls-files '*.demo.tsx'` and the table in `docs/DEMO_MODE.md` |
| Brand-blue deviation kept | `grep -n "Kept deliberately" DESIGN_SYSTEM.md` |
| Deferred list | `sed -n '/## 6. Deferred/,/^---/p' MASTER_TODO.md` |
| Build = tsc gate; required env | `grep '"build"' package.json`; `grep -n REQUIRED_ENV vite.config.ts` |
| No code TODOs | `grep -rn -e TODO -e FIXME -e HACK src --include='*.ts*'` |

If a re-verification fails, the repo has moved — update this skill rather than trusting it.
