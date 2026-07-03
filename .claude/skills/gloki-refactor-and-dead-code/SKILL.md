---
name: gloki-refactor-and-dead-code
description: Use when deleting, refactoring, or "cleaning up" anything in the Communities2/Gloki repo — removing a component, hook, API method, demo handler, fixture, SCSS class, or i18n key; when an audit or reviewer flags code as dead/unused; when a design "feels diluted" and you're tempted to revert; before greenfielding a component that might already exist orphaned; when scoping a dead-code sweep; or when asked why tsc passing doesn't prove a deletion is safe. Keywords: dead code, orphaned, unused export, consumer graph, dead CSS, recompose, revert, src/obsolete, prior art.
---

# Gloki Refactor & Dead-Code Playbook

## Overview

**Core principle: in this repo, `tsc` proves nothing about deletion safety — grep of the consumer graph is the real gate.**

Why: there is **no test framework** (per CLAUDE.md), and the TypeScript config (`noUnusedLocals: true`) only flags unused *locals inside a file* — an entire exported hook with zero importers compiles green forever. Meanwhile every feature here is a **vertical chain**: component → hook → flow-api wrapper → the seam (`src/services/api.ts`, the single data boundary every component reads/writes through) → demo contract handler (`src/services/demo/demoContracts/*.ts`) → fixture (`src/services/demo/fixtures/*.ts`) → seeder (`seedDemoCommunity.ts`). Deleting one link orphans the rest of the chain *silently*, and conversely a link that "looks dead" may be held live by a consumer three layers away.

Historical proof (S7 sweep, 2026-06-29): the initial audit said "4 components + 3 fixtures + 4 methods." Consumer-graph tracing showed the true dead set was **~3× bigger (~2,200 deleted lines)** — and also that several "obviously dead" exports were live. Both errors in one audit.

Environment constraint that shapes every recipe below: the repo sits on a **slow external USB drive, flaky under parallel I/O**. Greps must be targeted (`src` only, specific `--include` globs), sequential, and must **never** scan `node_modules/` or `dist/`. macOS AppleDouble files (`._Foo.tsx` metadata twins created by the exFAT drive) pollute `find` output — always exclude `! -name '._*'` (a verified sweep run on 2026-07-02 returned 110 false "orphans", every one a `._*` file).

## When NOT to use this skill

| You are actually doing… | Use instead |
|---|---|
| Scoping/planning NEW feature work, running a session end-to-end | **gloki-session-lifecycle** |
| Verifying behavior after a change (preview walks, evidence standards) | **gloki-verification-and-qa** |
| Deciding whether a deletion/rebuild is even *allowed* (push gates, locked decisions) | **gloki-change-control** |
| Checking whether the thing you want to rebuild was already deleted deliberately (PipelineView, PageHeader, left menu, deliberation subsystem…) | **gloki-failure-archaeology** |
| DEMO_VERSION semantics, fixture/seed mechanics in depth | **gloki-seam-and-demo-data** |
| Removing/renaming i18n keys, fr/sw parity tooling | **gloki-i18n-playbook** |
| Finding where things live (directory map, flow registry) | **gloki-frontend-architecture** |
| Updating MASTER_TODO/changelog after a sweep | **gloki-docs-and-writing** |

---

## Recipe 1 — Consumer-graph tracing before ANY deletion

Never delete based on an audit list, a reviewer note, or a name that "sounds dormant." Trace who consumes the thing, layer by layer, in BOTH directions: **upstream** (what would be orphaned if this dies) and **downstream** (what still holds this live).

### The procedure

For each symbol/file X you plan to delete:

```bash
cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"

# 1. Who references X by name (imports, JSX usage, re-exports — all of it)
grep -rln "SymbolName" src --include="*.ts" --include="*.tsx"
```

Name-based grep, not import-path grep — it catches barrel re-exports, aliased imports, and JSX usage in one pass. If the ONLY hits are X's own file and files already on your kill list, X is dead. Any other hit = live consumer; open it and read the usage (it may only read one field — see step 3).

```bash
# 2. Chase the chain down through the seam. If X called a contract method,
#    grep the wire method name (snake_case, matches Ouri's real contract):
grep -rln "get_positions" src --include="*.ts" --include="*.tsx"
```

A hit set like `flowApi.ts + demoContracts/discussion.ts + fixtures/deliberation.ts` means: deleting the flow-api caller orphans the demo handler `case`, its storage shape, the fixture builders, and the seed lines — all of which should join the kill list (each compiles fine while dead).

```bash
# 3. Who reads the RETURNED FIELDS. A hook may be dead while one field of its
#    return object is still consumed elsewhere via a re-export. Grep field names:
grep -rn "deliberationParticipant" src --include="*.ts" --include="*.tsx"
```

Step 3 is what saves you from over-deletion. In S7, `deliberationParticipant` looked like part of the dead deliberation cluster but was live in `ProposalMergePanel.tsx`; `CommentCategory`, `diffWords`, and `ThreadedDiscussion`/`SharedStatement` were likewise kept only because grep showed live consumers.

```bash
# 4. If fixtures/seed lines die, check whether the seeded data SHAPE changes.
#    If yes → DEMO_VERSION bump (src/services/demo/mockApi.ts:17, 'global-v16'
#    at time of writing) so returning visitors reseed. Details: gloki-seam-and-demo-data.
grep -n "DEMO_VERSION" src/services/demo/mockApi.ts
```

```bash
# 5. If a component dies, its i18n keys probably die too — but check DYNAMIC key
#    families first: a key with zero literal grep hits may be built as
#    t(`prefix.${x}`). Grep the PREFIX before declaring a key orphaned:
grep -rn "concerns.severity" src --include="*.tsx"
grep -rn 'concerns\.severity\.' src/i18n/fr.ts | head -3
```

(The 2026-06-21 close-out sweep removed 51 genuinely orphaned keys but kept every dynamically-constructed family — `createCommunity.feature.*`, `concerns.severity.*`, `journey.*`, etc. — after verifying each live. Removal itself: fr.ts and sw.ts in lockstep, see **gloki-i18n-playbook**.)

### Worked example: the S7 sweep (2026-06-29)

The audit said **"4 components + 3 fixtures + 4 methods."** The graph said otherwise:

| Layer | What tracing found | Commit |
|---|---|---|
| Components | `PositionsBoard`, `AnchoredThread`, `ParticipationMeter`, `CoPresenceBar` + their `.scss` (1,652 lines) | `e2fce82` |
| Hook | deleting the components orphaned ALL of `useDiscussionData.ts` (zero remaining callers; its sibling `useAuthorResolver` had only dead callers) | `9f0662b` |
| Flow API | the positions/anchored cluster in `discussionApi.ts` — types, normalizers, get/add/support/withdraw methods | `ace6e9f` |
| Demo handler | dead `case`s + `StoredPosition`/`StoredAnchored` storage in `demoContracts/discussion.ts` | `434da86` |
| CSS | 14 dead classes in `DiscussionFlow.module.scss` | `2c1dcbf` |
| Fixtures/seed | `SeedPosition`/`SeedAnchored` builders, `PRESENCE_*` exports, `positions:[]`/`anchored:[]` seed literals + **DEMO_VERSION v11→v12** | `3efeb58` |

Total ~2,200 deleted lines vs the audit's estimate — AND the same tracing prevented deleting four live symbols the audit would have swept. Both directions matter.

Counter-example of "sounds dead, is live": `src/services/demo/fixtures/presence.ts` survived the presence sweep and is still consumed at HEAD by `AITools.tsx`, the connectivity badges, and `PresenceShowcase` — the *name* says dormant subsystem, the grep says live. Grep, not vibes.

---

## Recipe 2 — SCSS-aware dead-style analysis

CSS is the most dangerous layer to prune: **the build cannot catch a wrong CSS removal** (no type system, no test, and the visual break may only show in one state/breakpoint). Three traps make naive grep false-flag *live* classes:

### Trap A: alias imports

Not every component imports its stylesheet as `styles`. Shared stylesheets are imported under other names — at HEAD, 8 files import `Container.module.scss` as `cs`:

```bash
# Step 1: find ALL importers of the stylesheet (never assume one)
grep -rln "ConcernsFlow.module.scss" src --include="*.tsx"
# Step 2: read each importer's actual alias
grep -n "module.scss'" src/components/mandate/MandatePage.tsx
#   → import cs from '../../pages/Container.module.scss';
```

A dead-class check that only greps `styles.foo` misses every `cs.foo` usage. Check usage under **each** discovered alias.

### Trap B: dynamic-prefix access

Live classes can have ZERO literal grep hits because they're accessed via template keys:

```bash
grep -rn 'styles\[`' src/components --include="*.tsx"
#   InitiativeStageStrip.tsx:  styles[`stage_${stage.id}`]
#   StageStrip.tsx:            styles[`stage_${stage.id}`]
```

Run this on every importer FIRST. If any dynamic access exists, every class matching that prefix pattern (`stage_problem`, `stage_vote`, …) is live regardless of literal grep results.

### Trap C: grouped selectors shared with live classes

A dead class that appears in a grouped/compound selector with a live class cannot be removed by deleting "its" block — you'd mutate the live class's rules. Known standing instance at HEAD: the `ConcernsFlow.module.scss` reject-vote cluster (`card_rejected`, `voteBtn_support`) shares compound `&.` selectors with live `card_resolved`/`voteBtn_resolved`. It was **deliberately left for a surgical per-selector audit** in the 2026-06-21 close-out sweep. Rule: interwoven dead CSS = leave it and note it, unless you are doing a dedicated surgical pass with preview verification of every affected state.

### Per-file dead-class procedure (tested templates)

```bash
# Extract every class-name candidate from the stylesheet (over-captures on purpose;
# catches nested, &-suffixed, and grouped selectors):
grep -oE '\.[a-zA-Z][a-zA-Z0-9_-]*' src/components/collaboration/flows/concerns/ConcernsFlow.module.scss | sort -u

# For each candidate C, grep the BARE name across all importers (catches styles.C,
# alias.C, styles['C'], clsx strings):
grep -n "cardBody" src/components/collaboration/flows/concerns/ConcernsFlow.tsx
```

Zero hits + no dynamic-prefix match + not in a grouped selector with a live class = dead-class candidate. Then verify the removal visually (preview at 360px, light+dark — see **gloki-verification-and-qa**).

### Whole-repo orphaned-stylesheet sweep (slow; dedicated passes only)

```bash
# ~110 real .module.scss files at HEAD; several minutes on the slow drive.
# The ! -name '._*' is MANDATORY: without it, exFAT AppleDouble files produce
# ~110 false ORPHAN lines (verified 2026-07-02 — with the filter: zero orphans).
find src -name '*.module.scss' ! -name '._*' | while read -r f; do
  b=$(basename "$f")
  grep -rql "$b" src --include='*.tsx' --include='*.ts' || echo "ORPHAN: $f"
done
```

---

## Recipe 3 — Orphaned-prior-art check before greenfielding

**Orphaned ≠ absent.** This repo's history includes complete, reviewed components that sat unwired for a month. Before building any "new" shared component, spend two minutes checking whether it already exists:

```bash
# 1. Search commit history for the feature vocabulary (lane/batch/wave/session
#    era names are in commit subjects):
git log --oneline -i --grep='offline' ui | head -20
git log --oneline -i --grep='Lane ' ui | head -20

# 2. Check the surviving dev-lab route and its showcase components:
grep -n "lab/presence" src/App.tsx        # → /lab/presence at src/App.tsx:124
ls src/components/shared/presence/ src/components/shared/connectivity/

# 3. Check the lane inventory doc:
ls docs/LANES.md
```

**Worked example — the Lane F connectivity kit:** built and committed 2026-05-29 (`8e7ce9c`: `SmartImage`, `DataSaverToggle`, `SyncBadge`, `ChannelBadge`, `useDataSaver`), then never wired into the app through the entire batch/wave/session rush. The S14 session prompt (2026-07-01) described "greenfield offline work"; re-grounding found the finished kit sitting at `src/components/shared/connectivity/`, and the session became an **adoption** (`4287d4f` SmartImage at avatar sites, `479ffdd` DataSaverToggle in Profile) instead of a rebuild — 33 days orphaned, zero wasted rebuild.

The `/lab/presence` route (`PresenceLabRoute`/`PresenceShowcase`) still ships at HEAD as an intentional, lazy-loaded dev route — it is the standing gallery of built-but-not-everywhere-adopted primitives. Check it before building anything presence/connectivity/low-bandwidth shaped.

Flip side: if the thing you want to build was *deleted* rather than orphaned, that's usually a settled battle — check **gloki-failure-archaeology** before resurrecting anything.

---

## Recipe 4 — Recomposition, not revert

When Eston (or you) feels a design "has been diluted as stuff was added," the instinct is to revert recent features. **Never restore design quality by reverting shipped, reviewed features.** Audit *composition* first — the dilution is usually structural and local, not feature-caused.

**Worked example — S15 SolutionsBoard (2026-07-02):** Eston felt the card design had degraded across P0–P5. The audit (specs vs live code vs live preview) confirmed the feeling but localized it: **all the accretion was in ONE component**, `SolutionsBoard`, where five sessions of features (commitments, indicators, sources, expert review) had stacked as ~9 co-equal visual blocks in a card-in-a-card-in-a-card. The other 9 card surfaces held their discipline. The fix (`0df30d3`) deleted **zero features**: flush list items + hairline dividers, evidence folded behind an inline expand, two threshold bars merged to one line — ~9 visible blocks → ~4, every feature intact.

Discipline points:

- **Audit before sweeping.** Assume concentration, not app-wide decay, until the audit says otherwise.
- **The repo has ZERO revert commits across all 443 `ui` commits.** The only true revert in the whole repo lives on `archive/blockchain-main` (`963170d`, the QV carry-over data-integrity revert — postmortem in **gloki-failure-archaeology**), and even that concept was later *rebuilt correctly* rather than restored. Reverting is not how this codebase corrects course.
- **Pattern-fit the fold, don't grab the nearest kit part:** `InfoDisclosure` is a *Modal* for rules/explainer prose, NOT an accordion — per-item content folds use an inline expand (button + `aria-expanded` + chevron), the `InitiativeStageCard` dive-on-tap pattern (S15 learning).
- Recomposition that changes copy still needs fr/sw key parity (S15 added 4 keys, then removed 3 orphaned ones in its own chore commit `c26cdc4`).

---

## Recipe 5 — Multi-commit deletion discipline

Deletions land as a **chain of small, layer-scoped `chore(sN)` commits** (sN = the session number), one commit per layer, ordered top-of-chain → bottom. This keeps each commit independently revertable and reviewable, and makes `git log` a readable record of what died and why. Verify the house pattern yourself:

```bash
git log --oneline --grep='chore(s7)' ui
# 0afcd8b chore(s7): drop unused loading/derived from useMandate return
# 2c1dcbf chore(s7): prune 14 dead CSS classes from DiscussionFlow.module.scss
# 3efeb58 chore(s7): drop positions/anchored seed + PRESENCE_* fixtures; bump DEMO_VERSION global-v12
# 434da86 chore(s7): remove dead positions/anchored handlers + storage from demo discussion contract
# ace6e9f chore(s7): drop dead positions/anchored cluster from discussionApi
# 9f0662b chore(s7): remove orphaned useDiscussionData hook (no live consumers)
# e2fce82 chore(s7): remove dormant deliberation components (PositionsBoard/AnchoredThread/ParticipationMeter/CoPresenceBar)
```

Checklist per deletion campaign:

- [ ] One commit per layer: components(+scss) / hook / flow-api / demo handler / CSS prune / fixtures+seed. i18n-key removal gets its own chore commit too (`c26cdc4`, `ea2814b`).
- [ ] The fixtures/seed commit carries the **DEMO_VERSION bump** when seeded data shape changes (S7: `3efeb58` bumped v11→v12 in the same commit as the seed deletion). No fixture change → no bump (S14/S15 shipped without one).
- [ ] Commit subjects state the *reason* ("no live consumers", "superseded by the community feed") — future archaeology depends on it.
- [ ] After each commit: `npx tsc -b` clean; after the chain: `npm run build` (build runs `tsc -b`) + a preview walk of the *neighboring* surfaces that shared code with the deleted set (**gloki-verification-and-qa**).
- [ ] Commits stay local until Eston's explicit green light — **push to `ui` is a production deploy** (see **gloki-change-control**).

---

## Recipe 6 — Deliberate parking is a valid status

Not every piece of dead code should be deleted on sight. Two sanctioned patterns:

**1. Park-then-sweep (the preferred one).** The dormant deliberation subsystem was *knowingly* left in place by an explicit S3 decision ("decision ⑤", recorded in project memory 2026-06) so that its removal could be a planned, dedicated sweep (S7) rather than a side quest inside a feature session. Likewise Eston has explicitly deferred individual Minors (S7 deferred a useMandate stale-flash fix and two a11y nits by name). **If Eston says leave it, leave it** — record the parked item in MASTER_TODO (see **gloki-docs-and-writing**) so it has a status and an owner, then stop touching it. Do not "helpfully" delete parked code inside an unrelated session.

**2. `src/obsolete/` — the typecheck-blind spot.** `tsconfig.app.json` contains `"exclude": ["src/obsolete"]` (live at HEAD; the convention predates the ui reset — the directory has never had committed contents on any branch). Anything moved there that isn't imported by live code gets **zero `tsc` coverage and rots silently**: it will drift out of sync with every type/API change and give a false sense of "we kept it, we can restore it." Prefer real deletion — **git history IS the archive** (the S7 postmortem components are one `git show e2fce82` away). If you must park files there, treat them as snapshots, not restorable code, and log them in MASTER_TODO.

Decision table:

| Situation | Action |
|---|---|
| Dead, self-contained, consumer graph confirms zero live consumers | Delete now, Recipe 5 discipline |
| Dead but interwoven (grouped CSS selectors, shared types with live code) | Leave + note in MASTER_TODO for a surgical pass |
| Dead but Eston said defer | Leave, record status, move on |
| Dormant but planned for later wiring (lab route, kit component) | Leave — it's prior art, not dead code (Recipe 3) |
| "Feels" dead but grep shows a consumer | It's alive. Stop. |

---

## Provenance and maintenance

All facts verified 2026-07-02 against the repo at branch `ui`, HEAD `c26cdc4`, unless marked otherwise. Incident narratives (S3 decision ⑤, S7 audit under-report, S15 recomposition rationale, Lane F adoption arc) are from project memory, 2026-06/07; the supporting commits were re-verified in git as cited. Every grep/find template above was executed once against HEAD with the shown results.

Volatile facts and their one-line re-checks:

| Fact (as of 2026-07-02 @ c26cdc4) | Re-verify with |
|---|---|
| `DEMO_VERSION = 'global-v16'` at mockApi.ts:17 | `grep -n "DEMO_VERSION" src/services/demo/mockApi.ts` |
| `"exclude": ["src/obsolete"]` in tsconfig.app.json; no such dir exists | `grep -n obsolete tsconfig.app.json; ls src/obsolete` |
| `/lab/presence` routed at src/App.tsx:124 | `grep -n "lab/presence" src/App.tsx` |
| ConcernsFlow grouped-selector dead cluster still unresolved | `grep -n "card_rejected\|voteBtn_resolved" src/components/collaboration/flows/concerns/ConcernsFlow.module.scss` |
| 110 live `.module.scss` files, zero orphans | rerun the Recipe 2 sweep loop (slow) |
| Zero revert commits on `ui` (443 commits) | `git log --oneline -i --grep=revert ui` (2 hits are false positives — bodies say "no reverts") |
| `resolveInitiativeStageContract` consumers = 6 files | `grep -rln "resolveInitiativeStageContract" src --include="*.ts" --include="*.tsx"` |
| 8 files import Container.module.scss as `cs` | `grep -rln "Container.module.scss" src --include="*.tsx"` |
| Connectivity kit lives at src/components/shared/connectivity/ (11 files) | `ls src/components/shared/connectivity/` |

If any re-check disagrees with this skill, trust the repo and update this file.
