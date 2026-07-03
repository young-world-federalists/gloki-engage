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

- **Seam** — the rule that all UI data access goes through `src/services/api.ts`,
  currently backed by the `src/services/demo/` stub layer. The backend hand-off
  doc for that boundary is `docs/FOR_OURI_seam.md` (Ouri = the backend partner
  who wires real server calls on his own branch).
- **Wire names** — contract method/field names (`add_proposal`, `proposal_id`…)
  that must byte-match Ouri's real Python contracts even where the UI vocabulary
  differs ("Solutions" in the UI, `proposal` on the wire). Docs must never
  "correct" wire names to match UI vocabulary.

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
deliberate decision — then ask Eston).

| Rank | Doc | Role | Trust level at 2026-07-02 |
|---|---|---|---|
| 1 | `CLAUDE.md` | Agent instructions: stack, branch model, seam rule, key patterns, routing, deployment | Current. One known gap: its routing block omits the live `/mandate/:communityId/:mandateId/*` route (verified in `src/App.tsx:123`) |
| 2 | `DESIGN_SYSTEM.md` | UI law — tokens, primitives, a11y gates, accepted deviations. Reviewers reject diffs that violate it | Current. One dated note: its "country proper nouns render canonical-English" line predates S14's locale-aware `getCountryName(code, locale)` |
| 3 | `docs/FOR_OURI_seam.md` | Backend seam truth — every demo-stubbed contract method/field the UI relies on, for Ouri to implement for real | Authoritative in intent, **stale in fact** — see §2 |
| 4 | `MASTER_TODO.md` | Living strategy doc: north stars (§1), mission (§2), working model (§4), persona panel (§5), deferred list (§6), roadmap (§7), changelog (§8) | Current — it is updated at every session close |
| 5 | `ARCHITECTURE.md` | App structure, the 8 blockchain-backed flows, contract learnings, known limitations | Useful but **demonstrably stale in places** — see §2. Its "Architecture Learnings" and "Known Limitations" sections remain the best single source for contract quirks |
| 6 | `docs/LANES.md` | Retired parallel-lane model, kept **only** as a feature→files map + surviving conventions (says so itself, lines 3–6) | Map only. Never take process or routing claims from it |
| — | `AGENTS.md` | Explicitly defers wholly to CLAUDE.md ("Don't duplicate project guidance here") | Never edit it with guidance; edit CLAUDE.md |
| — | `README.md` | Entry point: run commands + pointers | Current |

Other doc locations (not in the precedence chain, each with one job):

| Location | Job |
|---|---|
| `docs/superpowers/specs/` | **The current spec library** — 24 dated design specs `YYYY-MM-DD-<slug>-design.md` (latest: `2026-07-02-p55-generalize-gloki-design.md`). New specs go HERE |
| `docs/superpowers/plans/` | Dated implementation plans (21 files), paired with specs |
| `docs/specs/` | Legacy — only 2 files from 2026-06-18. Do NOT add new specs here |
| `docs/session-prompts/` | One prompt per session (`session-N-<slug>.md`) + review-workflow docs (`REVIEW-WAVE.md`, `REVIEW-AND-REFACTOR-WORKFLOW.md`, `REVIEW-STRUCTURE.md`). Also full of retired batch/lane/wave prompts — historical |
| `docs/i18n-native-review-candidates.md` | The human-gated fr/sw native-review packet (append-only per session, ~795 lines) |
| `docs/archive/` | Retired backend-era docs (PRD/SDD/SSE = Ouri's track; `SDD.md` has the authoritative contract-API description) + `WAVE_1_HISTORY.md` |
| Project auto-memory (`MEMORY.md` index + `project_*.md` files, surfaced in each session's context) | Cross-session institutional memory — one file per session/arc, indexed |

## 2. Known staleness at HEAD (verified 2026-07-02 @ `c26cdc4`)

Do not "learn" these stale claims, and do not re-report them as new discoveries.
Fixing them is real work — recommend it to Eston, don't silently rewrite mission
or decision text (see gloki-change-control).

| Doc & place | Stale claim | Current truth |
|---|---|---|
| `ARCHITECTURE.md` (Navigation, line ~9) | StageFooter = "5 stage icons (Problem, Discussion, Proposals, Vote, Mandate)" | Superseded by the S10 locked IA: StageFooter is a demoted **"Browse by stage"** nav with **4** browseable stages (Problem/Solutions/Vote/Mandate); Discussion is per-post, no `/stage/discussion` feed. See `DESIGN_SYSTEM.md` line ~344 |
| `ARCHITECTURE.md` (line ~11) + `docs/LANES.md` route map | "Default landing page at `/stage/problem`" | `/` → HomeView (first-run users → `/welcome`). CLAUDE.md routing is correct |
| `ARCHITECTURE.md`, stage vocabulary | "Proposals" as a stage/UI name | UI vocabulary is "Solutions" app-wide; **wire names stay `proposal`** (FOR_OURI_seam.md's "one rule") |
| `docs/FOR_OURI_seam.md` | Claims to list *every* seam method, but was last touched at S7 (`27f24b3`, 2026-06-29) | **Missing the S13 additions**: `set_property`/`get_properties` on the **initiative** contract + the `mandate_ratification` JSON property written by `src/services/mandateRatification.ts` (verified: that file calls both at lines 18/36; zero hits for either in FOR_OURI_seam.md). First candidate fix whenever you touch that doc |
| `docs/session-prompts/README.md` (status table, line ~77) | "Foundation batch-2 ⏳ Next" + the whole parallel-lane/worktree model | That model is retired (LANES.md:3–6). Sessions are single, sequential, on `ui` |
| `docs/session-prompts/next-session.md` | "Wave 1 is ready to build — that's your job" | Stale 2026-06-20 artifact from the hierarchy/a11y arc. The real next-session prompt is always the highest-numbered `session-N-*.md` |
| `CLAUDE.md` routing block | (omission) no `/mandate/...` route listed | Route exists at `src/App.tsx:123` |

Quick re-verification one-liners for the two biggest:

```bash
grep -n "5 stage icons\|/stage/problem" ARCHITECTURE.md          # stale nav claims still present?
git log -1 --oneline -- docs/FOR_OURI_seam.md                    # still 27f24b3 ⇒ S13 seam gap still open
grep -c "set_property" docs/FOR_OURI_seam.md                     # 0 ⇒ gap still open
```

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
| Notice a doc contradicting HEAD | Fix the doc if it's a factual/structural claim; **ask Eston** if it's mission, KPI, or decision text | S15 precedent: MASTER_TODO §1–2 mission reframe was an Eston-directed workstream (P5.5), not a hygiene edit |
| During a long multi-task session | Compact and save implementation status to project `CLAUDE.md` | Eston's standing preference (recorded Apr 2026) so interrupted sessions resume cleanly |

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
`ui` runnable (MASTER_TODO §4). Committing locally is routine; **pushing is not**
— push to `ui` is a production deploy of the live demo and requires Eston's
explicit green light every time (see **gloki-change-control**).

### 4.2 Claims-honesty doctrine (applies to ALL user-facing and doc copy)

Established in S9 (P0 "claims honesty" blocker, recorded in project memory
2026-06-30) and enforced since:

- **Under-claim, never over-claim.** Disclosure copy states only what is true of
  the *current* implementation — e.g. the ballot/composer "what's public" lines
  deliberately make no secrecy or permanence promises the demo can't keep.
- **Demo affordances are labeled `(demo)`** where the mechanism isn't real yet.
  Live example: `src/components/community/IdentityTrust.tsx:94` —
  `t('trust.meetMember', 'Meet a member (demo)')`.
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
  appended to the native-review packet">. Built <directly | subagent-driven> on `ui`
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

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). <One-paragraph
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
- <brainstorm → spec → plan → build → review-gate chain; slow-drive I/O note; seam rule;
  tokens-only; i18n parity commands; DEMO_VERSION rule; "Confirm any push to `origin/ui`
  with Eston first"; "PR #20's ✗ vs main is expected Ouri divergence".>

## Open decisions to lock (<who decides: these are Eston's calls>)
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

Session <N> (date), branch `ui`. <Outcome summary with commit range and review result.>
Continues [[project_session<N-1>_…]].

<Per-workstream paragraphs, bold key facts.>
- **Learning:** <each hard-won lesson as its own bullet — these are what future sessions read.>
```

Plus one line in `MEMORY.md`'s index:
`- [project_session<N>_<mon><year>.md](…) — S<N> (date): <compressed outcome + key learning>`.

## 6. Stale-doc hygiene — the pre-hand-off checklist

Run this before acting on any doc ≥1 session old, and before giving any doc to
Eston, Ouri, or a human reviewer:

- [ ] **Re-ground vs HEAD first**: for each factual premise, grep the actual
      file it describes. The doc is a map, not proof.
- [ ] Cited i18n keys still exist in `src/i18n/fr.ts`/`sw.ts` (grep each key).
- [ ] Cited file paths still exist (`ls` them — components get recomposed;
      S7 deleted ~1712 lines of a dormant subsystem).
- [ ] Cited routes match `src/App.tsx`.
- [ ] Cited contract methods match `src/services/demo/demoContracts/*` (and
      remember wire names never follow UI renames).
- [ ] Status claims ("next", "pending", "greenfield") checked against
      MASTER_TODO §7 and `git log` — these rot fastest.
- [ ] If you found drift: fix factual drift in place (strike-through + label in
      hand-off docs; edit in living docs); escalate decision/mission drift to
      Eston (recommend-then-confirm, never a unilateral rewrite).

And the standing warnings that save future sessions from re-debugging:

- PR #20 (`ui`→`main`) showing ✗ is **expected** merge-conflict divergence with
  Ouri's real-server layer, NOT a build failure — reassure, don't debug (this
  confusion recurred ≥3 times).
- `ui`→`main` landing belongs to Ouri; never write docs that instruct merging it.
- Retired docs (LANES.md process text, session-prompts/README.md wave tables,
  next-session.md) are historical; quoting them as current process is the exact
  drift this skill exists to stop.

## Provenance and maintenance

All facts verified 2026-07-02 against branch `ui` @ commit `c26cdc4` unless
labeled otherwise. Incident details (S8 stale refs, S9 claims-honesty, S10–S15
stale premises) are from project memory, recorded Jun–Jul 2026. Volatile facts
and their one-line re-verification commands:

| Fact | Re-verify with |
|---|---|
| Commit-prefix house style (`feat(sNN):` etc.) | `git log --oneline -15` |
| §7/§8 structure and changelog format | `grep -n "^##" MASTER_TODO.md` then read §8's top entry |
| Latest session prompt = current template | `ls docs/session-prompts/` — take the highest `session-N-*.md` |
| Current spec library is `docs/superpowers/specs/` | `ls docs/superpowers/specs \| tail -3` (dated ≥ 2026-07) |
| FOR_OURI_seam.md still missing S13 `set_property` seam | `grep -c "set_property" docs/FOR_OURI_seam.md` (0 = still open) and `git log -1 --oneline -- docs/FOR_OURI_seam.md` (still `27f24b3` = untouched since S7) |
| ARCHITECTURE.md nav staleness still uncorrected | `grep -n "5 stage icons" ARCHITECTURE.md; grep -n "/stage/problem" ARCHITECTURE.md` |
| i18n packet last-verified marker & tail format | `head -5 docs/i18n-native-review-candidates.md` and `tail -40` of it |
| "(demo)" label example still live | `grep -rn "(demo)" src/components/community/IdentityTrust.tsx` |
| Zero code TODOs rule still holds | `grep -rn -e TODO -e FIXME -e HACK src --include="*.ts" --include="*.tsx"` — only expected hit: the `src/App.tsx:19` comment pointing at MASTER_TODO §10 |

If a re-verify command shows drift, update THIS skill's §2 table in the same
change — a stale-docs skill that is itself stale is the failure mode it warns
about.
