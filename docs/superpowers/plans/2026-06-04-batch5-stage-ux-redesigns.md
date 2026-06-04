# Batch 5 — Stage-UX Redesigns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, this session) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn two passive stage surfaces into the artifacts the platform is about — Stage 2 becomes one co-authoring space (a co-owned statement + ranked, country-tagged positions + anchored discussion, all 1p1v), and Stage 5 gains a scannable, shareable mandate hero card with three never-conflated legitimacy signals — both rendered inside the existing `StageGate`, both keeping the `'feed' | 'dashboard'` variant contract, both reading/writing only through `src/services/`.

**Architecture:** Redesign A migrates Stage 2 off fixture-local component state onto the seam: a new co-authoring method group on `discussionApi.ts`, new handlers + a fixture-derived self-seed on `demoContracts/discussion.ts`, and a recast `deliberation.ts` (`DEMO_VERSION` → `global-v4`). Three new components (`SharedStatement`, `PositionsBoard`, `ParticipationMeter`) replace `CoAuthoringPanel` + `DeliberationThread`. Redesign B is pure UI over existing fixtures: a `MandateCard` hero above `MandateDocument`, a `JourneyRecap` `compact` variant, and a minimal `StageFeedView` gate nuance so the read-only published mandate is reachable. No new fields for B, no `DEMO_VERSION` impact from B.

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules. Verify with `npx tsc -b`, `npm run build`, and the Claude Preview MCP (light/dark/360px). **No unit-test framework** — this is the UI-only mock branch.

**Spec (design source of truth):** [docs/specs/2026-06-04-stage-ux-redesigns-design.md](../../specs/2026-06-04-stage-ux-redesigns-design.md) — confirmed with Eston via the question tool 2026-06-04.

**Conventions (non-negotiable):**
- **Seam only:** components never call a server; new mock data lives in `src/services/demo/`; everything routes through `contractRead`/`contractWrite`.
- **One person, one vote:** every support action (edit support, position support) is 1p1v — append-pk-with-dedup. Eligibility is gated by `StageGate`, never vote weight. Conviction staking stays a *separate* signal, never a vote.
- **`StageGate`:** read-only *viewing* (statement, positions, discussion, the mandate card) is always visible; every *action* renders inside the gate. The gate's blocked/allowed states are untouched.
- **`StageVariant`:** each stage component keeps its `'feed'` (compact) and `'dashboard'` (expanded) variants.
- **Tokens only** (DESIGN_SYSTEM.md): no ad-hoc hex/px/rgba; derived `rgba($token, a)` OK. AA contrast; focus-visible on every control; ≥44px targets; light + `prefers-color-scheme: dark`; flagship **360px**.
- All strings via `t('ns.key', 'English default')`.
- Commit locally per commit-group; **never push** (Eston controls the push).

---

## Verification gate (GATE — referenced by every task)

A task is **done** only when:
1. `npx tsc -b` exits 0 (production build runs `tsc -b` — zero TS errors).
2. `npm run build` exits 0.
3. Preview renders the changed surface correctly in **light + dark + 360px**, no `ErrorBoundary` and no console errors (`preview_console_logs` / `preview_logs`).
4. For interactive changes: drive React with a **real** `preview_click`/`preview_fill` + short `await`, then `preview_snapshot` asserts the DOM actually changed (no asserting from source).
5. Local commit made with the group's message. No push.

---

## File structure

**New (4 component pairs):**
| File | Responsibility |
|------|----------------|
| `src/components/collaboration/flows/discussion/SharedStatement.tsx` + `.module.scss` | The co-owned statement hero: current statement + co-author credit, "Suggest an edit" (→ `SuggestEditModal` + `diffWords` preview), open edits as track-changes diffs each with a 1p1v support bar toward the fold-in target + Support/Withdraw, resolved-edit banners, "Discuss the statement" (anchor `'statement'`). Seam-backed. Supersedes `CoAuthoringPanel`. |
| `src/components/collaboration/flows/discussion/PositionsBoard.tsx` + `.module.scss` | "Where we stand": Add-a-position compose (type chips) + ranked position cards (type chip + author + country flag + text + Support 1p1v + reply count) → tap to expand anchored discussion (recursive replies + compose); low-support collapse under "also raised". Replaces `DeliberationThread`. |
| `src/components/collaboration/flows/discussion/ParticipationMeter.tsx` + `.module.scss` | "{taken} of {members} taking part · 33% needed to advance" with a threshold bar. "Taking part" = any contribution, computed from seam reads. |
| `src/components/mandate/MandateCard.tsx` + `.module.scss` | Hero atop `MandatePage`: eyebrow+Ratified badge+date, title, "What we decided" (`voteWinner`), three separated trust signals (Reach / Mandate / Conviction), compact `JourneyRecap`, Share + "Read the full mandate". |

**Modified (~10):**
| File | Change |
|------|--------|
| `src/services/demo/mockApi.ts` | `DEMO_VERSION` `'global-v3'` → `'global-v4'` (one line). |
| `src/components/collaboration/flows/discussion/discussionApi.ts` | Append the co-authoring method group + types + normalizers (legacy `add/get/delete_comment` untouched). |
| `src/services/demo/demoContracts/discussion.ts` | statement/edits/positions/anchored handlers + fixture-derived self-seed (`defaultState()` returns the seed; writes seed-merge as today). |
| `src/services/demo/fixtures/deliberation.ts` | Add `DISCUSSION_SEED` recast from existing `PROBLEM_STATEMENT`/`CO_AUTHORS`/`EDIT_SUGGESTIONS`/`DISCUSSION_COMMENTS` (+ seeded supporters). Keep all existing exports (other consumers + the seed read them). |
| `src/components/collaboration/DiscussionStageView.tsx` | Assemble `CoPresenceBar` + `ParticipationMeter` + `SharedStatement` + `PositionsBoard` (swap out `CoAuthoringPanel` + `DeliberationThread`). |
| `src/components/stages/DiscussionStage.tsx` (+ scss) | Feed variant (glanceable leaning signal) + dashboard variant (summary + "Open the co-authoring space"). |
| `src/components/mandate/MandatePage.tsx` | Render `<MandateCard>` above `<MandateDocument>`; add scroll-anchor id on the document. |
| `src/components/mandate/JourneyRecap.tsx` (+ scss) | Add `compact?: boolean` → condensed horizontal step strip (same step data/icons; no per-step paragraph, no CTA). Full timeline unchanged. |
| `src/pages/StageFeedView.tsx` | Surface the read-only "View the published mandate" link **outside** `StageGate` for the mandate stage; keep `ConvictionStaking` inside. Gate itself unchanged. |
| `src/i18n/*` | New keys (English defaults inline via `t()`; add to locale files if a registry exists). |

**Deleted (each only imported by `DiscussionStageView`, now superseded):**
| File | Replaced by |
|------|-------------|
| `src/components/collaboration/flows/discussion/DeliberationThread.tsx` + `.module.scss` | `PositionsBoard` |
| `src/components/collaboration/flows/modifications/CoAuthoringPanel.tsx` + `.module.scss` | `SharedStatement` (the `modifications/` folder stays — `ModificationSuggestions`/`modificationApi` untouched). |

**Leave untouched:** `DiscussionFlow`, `PipelineView`, the flow `registry`, `ModificationSuggestions`/`modificationApi`, `MandateDocument` internals, `AdoptionFramework`, `StageGate`, `trust.ts`/`trustModel.ts`/`useCommunityTrust`, `CoPresenceBar`.

---

## Cross-file seam contract (the type-consistency anchor — A1 locks this; A2–A4 consume it verbatim)

These TS types are the single source of truth shared across fixture-seed → contract → api → components. Method names are the contract surface (router dispatches by filename, so **no `demoRouter` change**). Country is resolved **client-side** from `profiles[pk].country` (as `deliberationParticipant` does today) — the contract stores only `author` pk.

```ts
// discussionApi.ts — appended exports (legacy Comment/add/get/delete untouched)
export type PositionType = CommentCategory; // 'evidence' | 'impact' | 'solutions' | 'concerns'

export interface Statement { title: string; body: string; coAuthors: string[] /* pks */ }

export interface EditSuggestion {
  id: string;
  field: 'title' | 'body';
  author: string;          // pk
  baseText: string;        // text the edit was drafted against (for the diff)
  text: string;            // proposed replacement
  rationale: string;
  supporters: string[];    // pks — 1p1v
  status: 'open' | 'accepted' | 'stale';
  createdAgo: number;      // minutes — feeds relativeTimeKey(); 0 = just now. Stable (no Date.now in seed).
}

export interface Position {
  id: string;
  type: PositionType;
  author: string;          // pk
  text: string;
  supporters: string[];    // pks — 1p1v
  replyCount: number;      // DERIVED by the contract read from anchored under this position
  createdAgo: number;
}

export interface AnchoredComment {
  id: string;
  anchor: string;          // 'statement' | positionId
  author: string;          // pk
  text: string;
  parentId: string | null; // threads within an anchor
  createdAgo: number;
}

// Method group (all take (serverUrl, publicKey, contractId, …) like the legacy ones):
// reads:  get_statement → Statement | get_edits → EditSuggestion[] | get_positions → Position[]
//         get_anchored_comments {anchor} → AnchoredComment[]
// writes: suggest_edit {field,text,rationale} | support_edit {edit_id,target} (1p1v + fold-in)
//         withdraw_edit_support {edit_id} | add_position {type,text}
//         support_position {position_id} | withdraw_position_support {position_id}
//         add_anchored_comment {anchor,text,parent_id}
```

**Fold-in rule (`support_edit`):** append caller to `edits[id].supporters` (dedup → 1p1v). When `len(supporters) >= target` (`target` passed by the UI from member count, floor 3): set `statement[field] = edits[id].text`; append `edits[id].author` to `statement.coAuthors` (dedup); mark the edit `accepted`; mark sibling **open** edits to the *same field* `stale`. Documented simplification: contested spans resolve "most-supported wins; siblings need reworking".

**Seed stability:** `defaultState()` builds the seed from `DISCUSSION_SEED` (fixture) with **stable ids** (`s1…`, `pos-c1…`) and `createdAgo` from the fixture `minutesAgo` — **no `Date.now()` in the seed** (it re-runs every call; churn would break React keys). New user items use `newId()` + `createdAgo: 0`. Writes seed-merge (`{...defaultState(), ...persisted, <mutation>}`) so the seed survives the first write.

---

## COMMIT GROUP A — Redesign A: Discussion-as-co-authoring (Stage 2)

### Task A1 — Seam: co-authoring method group + handlers + fixture recast + version bump
**Files:** Modify `discussionApi.ts`, `demoContracts/discussion.ts`, `fixtures/deliberation.ts`, `mockApi.ts`. **Read first:** (all already read this session — fixture/handler/api/state/router grounded.)
- [ ] Add `DISCUSSION_SEED` to `deliberation.ts`: statement = `PROBLEM_STATEMENT`(+`description`→`body`)+`CO_AUTHORS`; edits = `EDIT_SUGGESTIONS` mapped (`field 'description'→'body'`, `suggestedText→text`, `+ supporters` = deterministic participant slices sized ~hearts, capped < members, `status:'open'`, `createdAgo:minutesAgo`); positions = root `DISCUSSION_COMMENTS` (`pos-<id>`, `type:category`, supporters from hearts, `createdAgo:minutesAgo`); anchored = reply comments re-keyed to `anchor:'pos-<rootId>'` preserving thread `parentId`. Keep every existing export.
- [ ] `discussion.ts`: `defaultState()` returns the seeded state (legacy `comments:[]` + statement/edits/positions/anchored maps built from `DISCUSSION_SEED`, stable ids). Add reads (`get_statement`/`get_edits`/`get_positions` with derived `replyCount`/`get_anchored_comments`) + writes (`suggest_edit`/`support_edit` with fold-in/`withdraw_edit_support`/`add_position`/`support_position`/`withdraw_position_support`/`add_anchored_comment`), each write seed-merging. Keep `get_participant_count`/`get_summary`/legacy comment handlers.
- [ ] `discussionApi.ts`: append types above + the 11 method wrappers + normalizers (mirror `normalizeComment`; tolerate missing fields, coerce `supporters` to `string[]`).
- [ ] `mockApi.ts`: `DEMO_VERSION` → `'global-v4'`.
- [ ] **GATE.** Commit: `feat(stage2): seam co-authoring group — statement/edits/positions/anchored + fixture seed (v4)`.

### Task A2 — `SharedStatement` (seam-backed; 1p1v support + fold-in)
**Files:** Create `SharedStatement.tsx` + `.module.scss`. **Read first:** `modifications/CoAuthoringPanel.tsx` (+ scss) for the statement/credit/`SuggestEditModal`/diff markup to carry over; locate `SuggestEditModal`; `useCommunityTrust` + `StageGate` usage for the action-gating predicate.
- [ ] Build the component reading via the new `discussionApi`: current statement + co-author credit (flags+names via `deliberationParticipant`); "Suggest an edit" → `SuggestEditModal` (live `diffWords` preview) writing `suggestEdit`; open edits as track-changes diffs each with a 1p1v progress bar toward `target` + Support/Withdraw (`supportEdit`/`withdrawEditSupport`); resolved edits show a `Banner`. Actions use `canCurrentUserParticipate('discussion')`; viewing is always visible. `target` = `max(3, ceil(memberCount/2))` from the community member count.
- [ ] **GATE** (verify a real support click moves a bar and a crossed-target edit folds into the statement + credits the author). Commit: `feat(stage2): SharedStatement co-authoring hero (1p1v support + fold-in)`.

### Task A3 — `PositionsBoard` + anchored discussion + `ParticipationMeter`
**Files:** Create `PositionsBoard.tsx` + `.module.scss`, `ParticipationMeter.tsx` + `.module.scss`. **Read first:** `DeliberationThread.tsx` (+ scss) for the recursive `CommentItem`/`ComposeBox` + `CategoryLabel` markup to reuse; confirm the `Badge`-toned category label source.
- [ ] `PositionsBoard`: "Where we stand" + Add-a-position compose (type chips) → `addPosition`; ranked position cards (sort by `supporters.length` desc) with type chip + author + country flag + text + Support 1p1v (`supportPosition`/`withdrawPositionSupport`) + reply count; tap → expand anchored discussion (recursive replies + compose via `getAnchoredComments`/`addAnchoredComment`, anchor = positionId); low-support under "also raised". Actions gated; viewing always visible.
- [ ] `ParticipationMeter`: "{taken} of {members} taking part · 33% needed to advance" + threshold bar; "taking part" = union of edit/position/anchored authors + supporters from seam reads.
- [ ] **GATE** (add a position, support a position 1p1v, post an anchored reply, watch the meter move). Commit: `feat(stage2): PositionsBoard + anchored discussion + ParticipationMeter`.

### Task A4 — Variants + route assembly
**Files:** Modify `DiscussionStage.tsx` (+ scss), `DiscussionStageView.tsx`. **Read first:** both files; confirm `StageVariant` prop threading + how the feed card navigates.
- [ ] `DiscussionStage` feed: compact `CoPresenceBar` + truncated statement **title** + one-line leaning signal ("N positions · M open edits · K taking part") + "Tap to co-author" (no editing). Dashboard: `CoPresenceBar` + `ParticipationMeter` + compact preview + "Open the co-authoring space" → `DiscussionStageView`.
- [ ] `DiscussionStageView`: `PageHeader` → `CoPresenceBar` + `ParticipationMeter` → `SharedStatement` → `PositionsBoard`, inside the existing `ErrorBoundary`. Remove `CoAuthoringPanel` + `DeliberationThread` imports; **delete** those 4 files; confirm no other importer (`grep`).
- [ ] **GATE** (Stage 2 feed card, dashboard inline card, full co-authoring view all render; gate still blocks a pending user's actions while showing read-only). Commit: `feat(stage2): wire feed/dashboard variants + DiscussionStageView; retire CoAuthoringPanel/DeliberationThread`.

---

## COMMIT GROUP B — Redesign B: Mandate card (Stage 5)

### Task B1 — `MandateCard` + three signals + `JourneyRecap` compact + Share
**Files:** Create `MandateCard.tsx` + `.module.scss`; modify `JourneyRecap.tsx` (+ scss). **Read first:** `fixtures/mandate.ts` (`PublishedMandate` type, `getPublishedMandate`/`MANDATES_BY_KEY`, `provenance` fields); `MandateDocument.tsx` (its copy-to-clipboard pattern to mirror); `JourneyRecap.tsx` (step data/icons to share); `CountryPresence`/`Badge`/`Button`/`TrustBadge` shared APIs; `ConvictionStaking` for the `compact` convention.
- [ ] `JourneyRecap`: add `compact?: boolean` → condensed horizontal step strip (icons + short labels, no per-step paragraph, no CTA), single source of step data. Full vertical timeline unchanged.
- [ ] `MandateCard({ mandate })`: eyebrow `subtitle` + Ratified `Badge` + `ratifiedOn`; title; "What we decided" = `provenance.voteWinner`; three separated signals — **Reach** ("{participants} people · {countries} countries" + `CountryPresence`), **Mandate** ("Decided by verified members · one person, one vote" + shield glyph), **Conviction** ("Backed by {convictionBackers} in sustained conviction"); `<JourneyRecap compact />`; Share (`navigator.share` → else `clipboard.writeText(url)` + "Copied" `aria-live` ~2s) + "Read the full mandate" (secondary `Button`, scrolls to the document anchor). Tokens only; own raised surface in light + dark.
- [ ] **GATE** (three signals legible + visibly distinct in light/dark/360px; compact arc renders; Share copy-fallback shows "Copied"; dashboard full `JourneyRecap` un-regressed). Commit: `feat(mandate): MandateCard hero — reach/mandate/conviction signals + compact JourneyRecap + share`.

### Task B2 — Wiring: `MandatePage` hero + anchor + `StageFeedView` gate nuance
**Files:** Modify `MandatePage.tsx`, `StageFeedView.tsx`. **Read first:** `MandatePage.tsx`; `StageFeedView.tsx` mandate-stage region (where the "View the published mandate" link + `ConvictionStaking` sit relative to `StageGate`).
- [ ] `MandatePage`: render `<MandateCard mandate={mandate} />` above `<MandateDocument>`; add a scroll-anchor `id` on the document so "Read the full mandate" targets it.
- [ ] `StageFeedView`: move the mandate stage's read-only "View the published mandate" link **outside** `StageGate` into the always-visible card region; keep `ConvictionStaking` inside the gate. Gate component unmodified. Re-verify the gate still blocks the staking action for a pending user.
- [ ] **GATE** (published page hero card above document, "Read the full mandate" scrolls; feed mandate link reachable by a pending user; staking still gated). Commit: `feat(mandate): wire MandateCard into MandatePage + reach read-only mandate link past the feed gate`.

---

## COMMIT GROUP — i18n + polish
### Task P1 — keys + dark-mode/focus-visible sweep
- [ ] Collect all new `t('ns.key', 'default')` keys; add to locale files if a registry exists (else inline defaults stand).
- [ ] Sweep every new control for hover/active/**focus-visible**/disabled + dark + ≥44px + AA + 360px. Fix gaps.
- [ ] **GATE** (full light+dark+360px walk of both redesigns, no console/ErrorBoundary errors). Commit: `polish(batch5): i18n keys + dark-mode + focus-visible sweep`.

---

## Self-review (run against the spec before executing)

**1. Spec coverage:** A.statement→A2; A.positions+anchored→A3; A.participation-meter→A3; A.feed/dashboard→A4; A.seam(`discussionApi`+`discussion.ts`+`deliberation.ts`+v4)→A1; B.card+3 signals→B1; B.JourneyRecap compact→B1; B.share→B1; B.MandatePage hero+anchor→B2; B.feed gate nuance→B2; i18n+polish→P1. **All §1–§5 spec items map to a task.** ✓
**2. Placeholder scan:** Component bodies are intentionally written during execution against just-in-time reads (flaky-drive + same-session-executor adaptation, stated up front) — the *cross-file seam contract* (the part that must stay type-consistent across files) is fully specified above. Not hand-waves: each task names exact files, exact reads, exact methods, and a concrete acceptance check. ✓
**3. Type consistency:** `Statement`/`EditSuggestion`/`Position`/`AnchoredComment` + the 11 method names are defined once (seam contract) and consumed verbatim by A2–A4. Note the deliberate rename at the seam: fixture `field:'description'`/`suggestedText` → seam `field:'body'`/`text`; `minutesAgo` → `createdAgo`. A1 owns the mapping; downstream uses the seam names only. ✓

## Execution
Inline, this session (superpowers:executing-plans), A1 → P1 in order, GATE after each, local commits only, **no push**. Component reads happen just-in-time at the head of each task.
