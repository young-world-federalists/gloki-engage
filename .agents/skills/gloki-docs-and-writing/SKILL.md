---
name: gloki-docs-and-writing
description: Use when reading or updating any Gloki/Communities2 doc of record — MASTER_TODO.md (§7 roadmap, §8 changelog), ARCHITECTURE.md, DESIGN_SYSTEM.md, docs/FOR_OURI_seam.md, docs/LANES.md, session prompts, specs, the i18n native-review packet, or project memory — when two docs contradict each other, when unsure which doc is authoritative, when writing commit messages, closing a session (changelog/status/memory), authoring the next session-N prompt, or before handing any doc to a human reviewer.
---

# Gloki docs & writing — the docs of record and house style


## Overview

**Core principle: doc drift is this project's recurring, documented failure mode.
Docs are a map; HEAD is the territory. Every load-bearing claim in any doc must be
re-checked against the actual code before you act on it or hand it to a human.**

Five consecutive sessions (S10–S15, recorded in project memory Jun–Jul 2026) found
their own session prompt's premises stale against HEAD — e.g. S14's prompt said
"offline support is greenfield" when a complete connectivity kit already existed
orphaned in the tree. An i18n review packet went to hand-off with 6 references to
deleted keys before an auto-cross-check caught them (S8). ARCHITECTURE.md still
describes navigation that was redesigned two weeks before this skill was written.
Treat *every* doc statement — including in this skill — as "reported, re-verify".

This project has no wiki and no test suite; the markdown docs of record ARE the
institutional memory and part of the quality gate. Keeping them correct is not
housekeeping, it is load-bearing engineering work, and several of them (session
prompts, the i18n packet, FOR_OURI_seam.md) are consumed by people or future AI
sessions with zero other context.

Two vocabulary notes used throughout (defined once here):

- **Real / demo variant** — every page has two states: `/page` on the real network and
  `/page?demo=true` on demo data (`docs/DEMO_MODE.md`). Data access goes only through
  `src/services/` (real) or `src/services/demo/` (demo).
- **Wire names** — contract method/field names, which byte-match the real contracts even where the UI
  vocabulary differs ("Solutions" in the UI, `proposal` on the wire). `docs/FOR_OURI_seam.md` records
  them. Docs must never "correct" wire names to match UI vocabulary.

## When NOT to use this skill

| If the task is… | Use instead |
|---|---|
| Deciding whether you may push, merge, or make a product call | **gloki-change-control** |
| Running a session end-to-end (prompt → build → push gate) — this skill only covers the doc artifacts each step produces | **gloki-session-lifecycle** |
| The t() ritual, fr/sw parity *tooling*, translation mechanics | **gloki-i18n-playbook** (this skill covers only *when to append to the packet* and packet hygiene) |
| DEMO_VERSION mechanics, fixtures, seeding, localStorage | **gloki-seam-and-demo-data** |
| Understanding the code structure the docs describe | **gloki-frontend-architecture** |
| What counts as verification evidence before claiming "done" | **gloki-verification-and-qa** |
| Deleting stale *code* (vs stale docs) | **gloki-refactor-and-dead-code** |
| Why a past decision was made / battles already settled | **gloki-failure-archaeology** |

## 1. The doc-authority map

Precedence, highest first. **When a lower doc disagrees with a higher one, the
higher doc wins. And "re-ground vs HEAD" beats all docs** — if the code at HEAD
disagrees with even CLAUDE.md, the code is the current truth and the doc has
drifted (fix the doc, don't "fix" the code to match it, unless the doc records a
deliberate decision — then ask).

| Rank | Doc | Role |
|---|---|---|
| 1 | `CLAUDE.md` | Agent instructions: stack, branch model, seam rule, key patterns, routing, deployment |
| 1 | `docs/DEMO_MODE.md` | The structure: one app on the real network, two states per page (`?demo=true`), the rules, and every page's current state |
| 2 | `DESIGN_SYSTEM.md` | UI law — tokens, primitives, a11y gates, accepted deviations. Reviewers reject diffs that violate it |
| 3 | `docs/FOR_OURI_seam.md` | Contract methods and fields the UI relies on — demo behaviour and what the real contract provides, by stage, plus dated addenda for what has been built |
| 4 | `MASTER_TODO.md` | Living strategy doc: north stars (§1), mission (§2), working model (§4), persona panel (§5), deferred list (§6), roadmap (§7), changelog (§8) |
| 5 | `ARCHITECTURE.md` | App structure, the data layers, flows, contract learnings, known limitations. Its flow sections describe the demo layer's contracts unless they name a real one |
| 6 | `docs/LANES.md` | Feature→files map + surviving conventions (its parallel-lane process is retired) |
| — | `AGENTS.md` | Defers wholly to CLAUDE.md — never put guidance there |
| — | `README.md` | Entry point: run commands + pointers |

Other doc locations (not in the precedence chain, each with one job):

| Location | Job |
|---|---|
| `docs/superpowers/specs/` | **The current spec library** — dated design specs `YYYY-MM-DD-<slug>-design.md`. New specs go HERE |
| `docs/superpowers/plans/` | Dated implementation plans, paired with specs |
| `docs/specs/` | Legacy — only 2 files from 2026-06-18. Do NOT add new specs here |
| `docs/session-prompts/` | One prompt per session (`session-N-<slug>.md`) + review-workflow docs (`REVIEW-WAVE.md`, `REVIEW-AND-REFACTOR-WORKFLOW.md`, `REVIEW-STRUCTURE.md`). Prompts written before 2026-10-29 assume the two-branch model; batch/lane/wave prompts are historical |
| `docs/contracts/` | Contract patch files from the two-branch era — applied; kept as the record of what changed |
| `docs/i18n-native-review-candidates.md` | The human-gated fr/sw native-review packet (append-only per session) |
| `docs/archive/` | Retired docs (PRD/SDD/SSE; `SDD.md` describes the original contract API) + `WAVE_1_HISTORY.md` |
| Per-developer auto-memory (each person's `MEMORY.md` index + memory files, outside the repo) | Cross-session memory for that developer's sessions |

## 2. Known staleness (verified 2026-10-29)

Do not "learn" these stale claims, and do not re-report them as new discoveries.

| Doc & place | Stale claim | Current truth |
|---|---|---|
| Session prompts dated before 2026-10-29 | `ui` = stubs, `server-side` = real, "push to `ui`", Eston's push gate | One trunk, two states per page (`docs/DEMO_MODE.md`); pushes need an explicit go from whoever you work for |
| `docs/session-prompts/README.md` (status table) | "Foundation batch-2 ⏳ Next" + the parallel-lane/worktree model | Retired. The real next-session prompt is the highest-numbered `session-N-*.md` |
| `docs/session-prompts/next-session.md` | "Wave 1 is ready to build" | A 2026-06-20 artifact |
| `ARCHITECTURE.md` flow sections | Flows "on-chain" via `chat_contract.py`, `concerns_contract.py`, stage sub-contracts | Those run on the demo layer; see its "Data layers" section |
| `docs/FOR_OURI_seam.md` addenda | Written per session in the two-branch era ("on `ui`", "FOR OURI") | Read "on `ui`" as the demo variant and "on `server-side`" as the real one; each addendum marks what was built for real |

Fixing structural/factual drift in living docs is routine. Mission, KPI or decision text: recommend,
don't rewrite (**gloki-change-control**).

## 3. What must be updated when (the update-trigger table)

The discipline that prevents drift. "Same commit" means literally in the same
commit as the code change, so the doc can never silently lag.

| When you… | You must update… | Detail |
|---|---|---|
| Add/change any contract method or field the UI calls (even a demo stub) | `docs/FOR_OURI_seam.md` — **same commit** | Ouri implements the real contract from this doc; an undocumented method is a silent ui→main breakage. Follow the existing per-stage format: method signature, semantics, storage field, and any "the real contract MUST…" production note. Historical failure: the S13 `set_property` seam never made it in (§2) |
| Add or change any fr/sw string | Append to `docs/i18n-native-review-candidates.md` — same session | Use the per-session section format (template in §5.3). Mechanics of parity itself: **gloki-i18n-playbook** |
| Close a session | `MASTER_TODO.md` §7 (flip the tier's status) **and** §8 (prepend a changelog entry) **and** project memory (new `project_*.md` + index line) | Templates in §5. This is the session-lifecycle close step — see **gloki-session-lifecycle** for where it sits in the flow |
| Prepare the next session | New `docs/session-prompts/session-N-<slug>.md` **with the mandatory "Re-verify these premises vs HEAD" section** | Anatomy in §5.2. A prompt without that section is malformed — premises go stale between sessions, guaranteed |
| Lock a design during brainstorm | New spec in `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md` (+ plan in `docs/superpowers/plans/`) | NOT `docs/specs/` (legacy). Specs are historical records — never edit an old spec to match new reality; write a new one or a dated addendum commit (S15 precedent: `f4c65f5 docs(s15): spec note — …`) |
| Change fixtures/seed data | `DEMO_VERSION` decision + note it in the §8 changelog entry ("no DEMO_VERSION bump" is also stated explicitly) | Bump rules live in **gloki-seam-and-demo-data** |
| Notice a doc contradicting HEAD | Fix the doc if it's a factual/structural claim; **ask** if it's mission, KPI, or decision text; if it's user-facing behaviour that changed, mark it `REVIEW NEEDED (date)` and leave it visible | S15 precedent: MASTER_TODO §1–2 mission reframe was an Eston-directed workstream (P5.5), not a hygiene edit |
| During a long multi-task session | Save implementation status to the plan doc before compaction | So interrupted sessions resume cleanly |

**Open work lives in MASTER_TODO.md §7, never in code comments.** The src tree
has zero real TODO/FIXME/HACK markers (verified: the only grep hit is a comment
in `src/App.tsx:19` pointing *at* MASTER_TODO). Do not introduce code TODOs;
file the item in §7 instead.

## 4. House style

### 4.1 Commit messages

Format (verified against the last 25 commits at HEAD):

```
<type>(s<NN>): <imperative subject, lowercase, no trailing period>
```

| Type | Used for | Real examples from `git log` |
|---|---|---|
| `feat(s15):` | Feature/UI work | `feat(s15): recompose SolutionsBoard for card cohesion (Phase 0)` |
| `fix(s13):` | Bug fixes | `fix(s13): dedupe winner metric labels + MASTER_TODO P4 done/changelog (P4)` |
| `docs(s15):` | Specs, plans, doc updates | `docs(s15): P5.5 generalize-Gloki design spec (surgical neutralization)` |
| `chore(s15):` | Cleanup, key removal, mechanical | `chore(s15): remove 3 orphaned i18n keys after SolutionsBoard recompose` |
| `docs:` (no scope) | Session prompts (written before the session number's work starts) | `docs: Session 15 prompt — card-cohesion audit + P5.5 generalize Gloki` |

`sNN` = the session number. Ship in small, self-contained commits, each leaving
the trunk runnable (MASTER_TODO §4). Committing locally is routine; **pushing is not**
— it needs an explicit go every time (see **gloki-change-control**).

### 4.2 Claims-honesty doctrine (applies to ALL user-facing and doc copy)

Established in S9 (P0 "claims honesty" blocker, recorded in project memory
2026-06-30) and enforced since:

- **Under-claim, never over-claim.** Disclosure copy states only what is true of
  the *current* implementation — e.g. the ballot/composer "what's public" lines
  deliberately make no secrecy or permanence promises the demo can't keep.
- **Demo is always labelled.** Every demo variant opens with `<DemoNotice />` ("Demo: this page shows
  sample data…"), and simulated paths say they're simulated (e.g. the verification call and daily
  session).
- **No trust-faking.** When the demo needs to open a gated path, do it honestly
  through the real mechanism (S9 seeded `set_stage_permissions: 'anyone'` on one
  community) — never by faking the user's verification/trust level.
- **Unproven stays labeled.** In docs, open items are "open"/"candidate"/
  "deferred", never quietly promoted to done. In §7, shipped tiers get an
  explicit `✅ DONE (S<N>, date)` with commit range; everything else keeps its
  `[BLOCKER]/[MAJOR]/[MINOR]` severity tag from the review that produced it.
- Corollary for reviewers' claims: verify perception/contrast claims against
  DESIGN_SYSTEM.md + measurement before "fixing" (S9: a persona's contrast claim
  was simply wrong; correct action was a no-op + comment).

### 4.3 Prose conventions in the docs of record

- Dense, **bold the load-bearing facts**, keep entries scannable.
- Learnings are marked `★` (changelog) or `**Learning:**` (memory files).
- Reference specs/commits inline by filename/sha so claims are checkable.
- Severity vocabulary is blocker/major/minor, judged against the two north stars
  (MASTER_TODO §1: ≥70% unaided journey completion; felt transnational
  collaboration) — not generic code quality.
- Region names and country proper nouns in *UI* follow DESIGN_SYSTEM rules; in
  *docs* plain English is fine.
- The backend partner is spelled **Ouri** (not Ori).

## 5. Templates (formats verified against the real files at HEAD)

### 5.1 Session close — MASTER_TODO §7 status + §8 changelog entry

§7: find the tier you shipped under `### Build order (next)` and flip its bold
header line, keeping the evidence inline, e.g. (real S15 text):

```markdown
**P5.5 — Generalize Gloki beyond the VftC/Africa pilot (Eston direction, 2026-07-01). ✅ SHIPPED (S15,
2026-07-02).** The audit found the app was **already ~90% generalized**: …
```

§8: **prepend** (newest first) one entry per session. Skeleton distilled from
the real S13–S15 entries:

```markdown
- **YYYY-MM-DD — S<N>: <one-line title> (shipped|built, push pending).** <What and why,
  1–3 sentences, north-star framing.> **Premise correction:** <if the session prompt was
  stale, say exactly how — S14/S15 both did>. Shipped: <the concrete artifacts — components,
  hooks, seam methods — with backtick names>. <DEMO_VERSION note: "`vN→vN+1`" or explicitly
  "**no `DEMO_VERSION` bump** (no fixtures touched)">. <i18n note: "+K keys at fr/sw parity,
  appended to the native-review packet">. Built <directly | subagent-driven> on <branch>
  (<M> commits `<first>..<last>`); <review gate result, e.g. "Opus whole-branch review:
  0 Crit / 0 Imp">; preview-verified 360px light+dark. **Deferred:** <tail items, filed
  in §7>. ★ Learning: <the one thing the next session must know>.
  Specs: `<YYYY-MM-DD-slug-design.md>`.
```

### 5.2 Next-session prompt — `docs/session-prompts/session-N-<slug>.md`

Anatomy of the real `session-15-card-cohesion-and-generalize.md` (the current
gold standard — read it before writing a new one):

```markdown
# Session <N> — <Title>

Paste into a fresh Claude Code session in the Communities2 repo (the trunk, or the named branch). <One-paragraph
framing: what this session is and is NOT; current HEAD sha and what's deployed.>

## <Phase / task sections>
<Explicit steps. Mark anything that is a REVIEW vs a build. State Eston's own words for any
concern being addressed ("Eston's concern (date): '…'"). State what must NOT be done — e.g.
S15's "Do not 'restore' anything by reverting shipped feature work".>

## Re-verify these premises vs HEAD (the recurring S10–S14 lesson — prompts go stale)
- <Every factual premise the prompt relies on, each with the file/grep to check it against.>
- <e.g. "`PILOT_COLORS` = KE/NG/MW/CD in `src/utils/countries.ts` (confirm still there).">

## Read first (carry the context)
- <Specs, DESIGN_SYSTEM sections, live source files (marked "source of truth"), memory files.>

## Workflow + constraints (same discipline as S1–S<N-1>)
- <brainstorm → spec → plan → build → review-gate chain; seam rule and which pages get a demo
  variant or a real side; tokens-only; i18n parity commands; DEMO_VERSION rule; "confirm any push
  first".>

## Open decisions to lock (<who decides: product calls are Eston's, real-network design is Ouri's>)
1. <Each open decision, with the recommended option marked "(recommended)".>

When ready: <the first concrete action>.
```

The **"Re-verify these premises vs HEAD"** section is mandatory — it exists
because S10–S15 *each* found at least one prompt premise dead on arrival, and
the check repeatedly turned "sizable workstreams" into surgical edits.

### 5.3 i18n native-review packet append — `docs/i18n-native-review-candidates.md`

Append a per-session section before the closing "How to deliver fixes" section,
matching the real Session-15 block:

```markdown
## Session <N> (YYYY-MM-DD) — <what shipped>

**New keys (<phase/feature>):**
- **fr/sw `<flat.dotted.key>`** — "<English>". fr "<french>", sw "<swahili>". <One line of
  render context + what the native reviewer should confirm (truncation, {n} placement, register).>

**Reframed keys (<why>):**
- **fr/sw `<key>`** — now "<new English>". fr "…", sw "…". Confirm <the specific concern>.
```

Before handing the packet (or any doc citing keys/paths) to a human: **cross-check
every cited key against HEAD** — keys get renamed/removed silently and "PARITY OK"
does not catch a doc referencing a deleted key. S8 struck 6 stale refs this way;
the packet's convention is to strike-through and label `[removed]`/`[relocated]`
rather than delete, so reviewers don't hunt for ghosts. Parity tooling:
**gloki-i18n-playbook**.

### 5.4 Project memory file + index line (session close)

Auto-memory files (surfaced in every session's context; do not cite their
filesystem path in repo docs). Format of the real `project_session15_jul2026.md`:

```markdown
---
name: project_session<N>_<mon><year>
description: "S<N> (YYYY-MM-DD) <one-line outcome incl. push state, e.g. 'built, push PENDING' or 'shipped & PUSHED origin/ui'>"
metadata:
  node_type: memory
  type: project
---

Session <N> (date), branch <branch>. <Outcome summary with commit range and review result.>
Continues [[project_session<N-1>_…]].

<Per-workstream paragraphs, bold key facts.>
- **Learning:** <each hard-won lesson as its own bullet — these are what future sessions read.>
```

Plus one line in `MEMORY.md`'s index:
`- [project_session<N>_<mon><year>.md](…) — S<N> (date): <compressed outcome + key learning>`.

## 6. Stale-doc hygiene — the pre-hand-off checklist

Run this before acting on any doc ≥1 session old, and before giving any doc to
Eston, Ouri, or another human reviewer:

- [ ] **Re-ground vs HEAD first**: for each factual premise, grep the actual
      file it describes. The doc is a map, not proof.
- [ ] Cited i18n keys still exist in `src/i18n/fr.ts`/`sw.ts` (grep each key).
- [ ] Cited file paths still exist (`ls` them — components get recomposed;
      S7 deleted ~1712 lines of a dormant subsystem).
- [ ] Cited routes match `src/App.tsx`.
- [ ] Cited contract methods match the real contracts (`src/assets/contracts/*.py`) and the demo
      handlers (`src/services/demo/demoContracts/*`); wire names never follow UI renames.
- [ ] Status claims ("next", "pending", "greenfield") checked against
      MASTER_TODO §7 and `git log` — these rot fastest.
- [ ] If you found drift: fix factual drift in place (strike-through + label in
      hand-off docs; edit in living docs); escalate decision/mission drift
      (recommend-then-confirm, never a unilateral rewrite).

And the standing warnings that save future sessions from re-debugging:

- Retired docs (LANES.md process text, session-prompts/README.md wave tables,
  next-session.md) are historical; quoting them as current process is the exact
  drift this skill exists to stop.

## Provenance and maintenance

Updated 2026-10-29 on branch `unified`. Re-verify volatile facts:

| Fact | Re-verify with |
|---|---|
| Commit-prefix house style | `git log --oneline -15` |
| §7/§8 structure and changelog format | `grep -n "^##" MASTER_TODO.md` then read §8's top entry |
| Latest session prompt | `ls docs/session-prompts/ \| sort -V \| tail` |
| Current spec library | `ls docs/superpowers/specs \| tail -3` |
| Page states documented | the table in `docs/DEMO_MODE.md` vs `git ls-files '*.demo.tsx'` |
| Open review markers | `grep -rn "REVIEW NEEDED" .agents/skills docs *.md` |
| i18n packet format | `head -5 docs/i18n-native-review-candidates.md` and its tail |
| Zero code TODOs | `grep -rn -e TODO -e FIXME -e HACK src --include="*.ts" --include="*.tsx"` |

If a re-verify command shows drift, update THIS skill's §2 table in the same change — a stale-docs skill
that is itself stale is the failure mode it warns about.
