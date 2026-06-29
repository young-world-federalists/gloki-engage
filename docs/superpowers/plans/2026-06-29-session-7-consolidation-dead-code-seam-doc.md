# Session 7 — Consolidation: Dead-Code Sweep + FOR-OURI Seam Doc — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the fully-dead "deliberation positions/anchored/presence" subsystem that S2/S3 replaced with `ThreadedDiscussion` + `SharedStatement`, trim associated dead CSS, drop `useMandate`'s unused return fields, and consolidate the scattered `// FOR OURI` seam notes into one backend hand-off doc.

**Architecture:** This is a deletion/debt sweep on the `ui` branch (UI-only mockup, stub seam). No new features, no new user-facing strings, no i18n changes. The work is grep-verified dead-code removal in a safe order (consumers before dependencies) so every commit compiles, plus one new Markdown doc. The dormant subsystem was deliberately parked in S3 (decision ⑤) for exactly this removal.

**Tech Stack:** React 19 + TypeScript + Vite + SCSS Modules. No test framework — verify via `npm run build` (runs `tsc -b`) + grep + the `preview_*` tools at 360px.

## Global Constraints

- Branch `ui`; keep it runnable. Never call a real server from a component — stay behind `src/services/api.ts`.
- **No test framework.** Verification per task = (1) `grep` confirms zero remaining references to each removed symbol, AND (2) `npm run build` stays clean. Removing an unused *export* will NOT fail `tsc`, so **grep is the real gate** — never trust the build alone for dead-code removal.
- Tokens only; AA gates per DESIGN_SYSTEM.md. No new/changed user-facing strings in this session → **no i18n work, no `fr.ts`/`sw.ts` edits**. (If any task finds itself adding a string, stop — that's out of scope.)
- Demo-data change ⇒ bump `DEMO_VERSION` in `src/services/demo/mockApi.ts` from `global-v11` to `global-v12` (Task 5 only).
- `deliberationParticipant`, `diffWords`, `CommentCategory`, `DiscussionSeed`, `DISCUSSION_SEED_BY_KEY`, `PERSONAS`, and all `Comment`/`Statement`/`EditSuggestion` API surface are **LIVE — do not remove**.
- Commit after each task with a clear message. Ledger lives under `.superpowers/sdd/` namespaced `s7-`.

---

## Live vs. Dead Boundary (reference for every task)

**LIVE discussion-flow files (keep):** `DiscussionFlow.tsx` + `.module.scss`, `ThreadedDiscussion.tsx` + `.scss`, `SharedStatement.tsx` + `.scss`, `discussionApi.ts` (file kept, cluster trimmed), `demoContracts/discussion.ts` (file kept, cluster trimmed), `fixtures/deliberation.ts` (file kept, cluster trimmed).

**DEAD (remove):** `PositionsBoard`, `AnchoredThread`, `ParticipationMeter`, `CoPresenceBar` (all `.tsx` + `.module.scss`), `useDiscussionData.ts` (whole file), and the positions/anchored/presence symbols inside the three kept files (enumerated per task).

---

### Task 1: Delete the 4 dormant deliberation components + stylesheets

**Files:**
- Delete: `src/components/collaboration/flows/discussion/PositionsBoard.tsx`
- Delete: `src/components/collaboration/flows/discussion/PositionsBoard.module.scss`
- Delete: `src/components/collaboration/flows/discussion/AnchoredThread.tsx`
- Delete: `src/components/collaboration/flows/discussion/AnchoredThread.module.scss`
- Delete: `src/components/collaboration/flows/discussion/ParticipationMeter.tsx`
- Delete: `src/components/collaboration/flows/discussion/ParticipationMeter.module.scss`
- Delete: `src/components/collaboration/flows/discussion/CoPresenceBar.tsx`
- Delete: `src/components/collaboration/flows/discussion/CoPresenceBar.module.scss`

**Interfaces:**
- Consumes: nothing (these have zero live consumers — `PositionsBoard`/`ParticipationMeter`/`CoPresenceBar` are imported nowhere; `AnchoredThread` only by `PositionsBoard`).
- Produces: nothing.

- [ ] **Step 1: Confirm zero live references before deleting**

Run from repo root:
```bash
grep -rn "PositionsBoard\|AnchoredThread\|ParticipationMeter\|CoPresenceBar" src | grep -v "discussion/PositionsBoard\|discussion/AnchoredThread\|discussion/ParticipationMeter\|discussion/CoPresenceBar"
```
Expected: **no output** (every match is inside the files being deleted). If anything else appears, STOP and report.

- [ ] **Step 2: Delete the 8 files**

```bash
cd "src/components/collaboration/flows/discussion"
git rm PositionsBoard.tsx PositionsBoard.module.scss AnchoredThread.tsx AnchoredThread.module.scss ParticipationMeter.tsx ParticipationMeter.module.scss CoPresenceBar.tsx CoPresenceBar.module.scss
cd -
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean (no TS errors). Note: `useDiscussionData.ts` / `discussionApi.ts` position methods are now orphaned but still compile (unused exports don't fail `tsc`). They are removed in Tasks 2–3.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(s7): remove dormant deliberation components (PositionsBoard/AnchoredThread/ParticipationMeter/CoPresenceBar)"
```

---

### Task 2: Delete the now-orphaned `useDiscussionData.ts`

**Files:**
- Delete: `src/components/collaboration/flows/discussion/useDiscussionData.ts`

**Interfaces:**
- Consumes: nothing live. The `useDiscussionData` hook had zero callers even before Task 1; `useAuthorResolver` was imported only by the (now-deleted) `PositionsBoard` and `AnchoredThread`.
- Produces: nothing.

- [ ] **Step 1: Confirm zero references**

```bash
grep -rn "useDiscussionData\|useAuthorResolver" src
```
Expected: **only** matches inside `useDiscussionData.ts` itself (its own definitions/exports). No external importers. If any other file appears, STOP and report.

- [ ] **Step 2: Delete the file**

```bash
git rm "src/components/collaboration/flows/discussion/useDiscussionData.ts"
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(s7): remove orphaned useDiscussionData hook (no live consumers)"
```

---

### Task 3: Excise the positions/anchored cluster from `discussionApi.ts`

**Files:**
- Modify: `src/components/collaboration/flows/discussion/discussionApi.ts`

**Interfaces:**
- Consumes: nothing (the symbols below are now referenced only within this file after Tasks 1–2).
- Produces: the trimmed `discussionApi` module — **keep** all live exports: `CommentCategory`, `Comment`, `Statement`, `EditSuggestion`, `getStatement`, `setStatement`, `getEdits`, `suggestEdit`, `supportEdit`, `withdrawEditSupport`, `getComments`, `addComment`, `deleteComment`, `likeComment`, plus any shared helpers (`toList`, `normalizeComment`, etc.) still used by the kept methods.

**Remove exactly these dead symbols (verify each is referenced ONLY by the others in this list before removing):**
- Type alias `PositionType` (line ~147: `export type PositionType = CommentCategory;`) — **NOTE: keep `CommentCategory` at line ~4, it is live** (used by `Comment.category`).
- `interface Position` (line ~167)
- `interface AnchoredComment` (line ~177)
- `const POSITION_TYPES` (line ~186)
- `function normalizePosition` (line ~228)
- `function normalizeAnchored` (line ~241)
- `getPositions` (line ~342)
- `addPosition` (line ~356)
- `supportPosition` (line ~371)
- `withdrawPositionSupport` (line ~385)
- `getAnchoredComments` (line ~400)
- `addAnchoredComment` (line ~415)
- Any now-dead section comments (e.g. `// --- anchored discussion ---`) introducing the removed block.

- [ ] **Step 1: Pre-removal reference check**

```bash
grep -rn "\bPosition\b\|AnchoredComment\|PositionType\|POSITION_TYPES\|normalizePosition\|normalizeAnchored\|getPositions\|addPosition\|supportPosition\|withdrawPositionSupport\|getAnchoredComments\|addAnchoredComment" src
```
Expected: every match is inside `discussionApi.ts` (the definitions). No consumers in other files. (`CommentCategory` is intentionally NOT in this list — it stays.) If a consumer outside `discussionApi.ts` appears, STOP and report.

- [ ] **Step 2: Remove the symbols listed above**

Edit `discussionApi.ts` to delete each listed type/const/function. Leave the live surface untouched. Do not reformat unrelated code.

- [ ] **Step 3: Post-removal reference check**

```bash
grep -rn "PositionType\|POSITION_TYPES\|normalizePosition\|normalizeAnchored\|getPositions\|addPosition\|supportPosition\|withdrawPositionSupport\|getAnchoredComments\|addAnchoredComment" src
```
Expected: **no output** (the `interface Position`/`AnchoredComment` are gone too — verify with `grep -rn "AnchoredComment" src` → empty).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: clean. If `tsc` flags a now-unused import or helper (e.g. an import only the removed normalizers used), remove that too and rebuild.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(s7): drop dead positions/anchored cluster from discussionApi"
```

---

### Task 4: Excise positions/anchored from the demo discussion contract

**Files:**
- Modify: `src/services/demo/demoContracts/discussion.ts`

**Interfaces:**
- Consumes: `DiscussionSeed` from `fixtures/deliberation.ts` — but stops reading its `positions` and `anchored` fields (those fields are removed from the fixture in Task 5; this task must land first so the fixture's fields are unused before they're deleted).
- Produces: trimmed `DiscussionState` (no `positions`/`anchored` storage) and a contract dispatch with the dead cases removed. **Keep** all comment/statement/edit cases and the `like_comment` / `set_statement` cases (both carry `// FOR OURI` notes consumed in Task 8).

**Remove exactly:**
- `type PositionType` (line ~28) + `const POSITION_TYPES` (line ~29)
- `interface StoredPosition` (line ~47); and the analogous stored-anchored interface if present
- Storage fields `positions: Record<string, StoredPosition>` (line ~68) and `anchored: ...` (the sibling field) from the state interface
- Their initial values in the empty-state object (`positions: {}` line ~88, and the `anchored: {}` sibling)
- In `initDiscussion` (line ~99): the `positions: byId(seed.positions)` (line ~115) and `anchored: byId(seed.anchored)` (line ~116) lines
- Dispatch cases: `get_positions` (line ~155), `get_anchored_comments` (line ~161), `add_position` (line ~285), `support_position` (line ~302), `withdraw_position_support` (line ~311), `add_anchored_comment` (line ~322), plus the `// --- co-authoring: positions ---` section comment (line ~284)

- [ ] **Step 1: Remove the symbols, fields, init lines, and cases listed above**

Edit `discussion.ts`. After removing, ensure `DiscussionState` no longer references `StoredPosition`/positions/anchored and `initDiscussion` no longer reads `seed.positions`/`seed.anchored`.

- [ ] **Step 2: Reference check within the contract**

```bash
grep -n "positions\|anchored\|StoredPosition\|PositionType\|POSITION_TYPES" src/services/demo/demoContracts/discussion.ts
```
Expected: **no output** (all gone). The only remaining `seed.*` reads should be `seed.comments`, `seed.statement`, `seed.edits`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean. `seed.positions`/`seed.anchored` are still *defined* on `DiscussionSeed` in the fixture (removed next task) but simply no longer read — that compiles.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(s7): remove dead positions/anchored handlers + storage from demo discussion contract"
```

---

### Task 5: Trim `deliberation.ts` (positions/anchored seed + PRESENCE_*) and bump DEMO_VERSION

**Files:**
- Modify: `src/services/demo/fixtures/deliberation.ts`
- Modify: `src/services/demo/mockApi.ts` (DEMO_VERSION bump)

**Interfaces:**
- Consumes: nothing new.
- Produces: trimmed `DiscussionSeed` (no `positions`/`anchored` fields) + removal of the three presence exports. **Keep** `deliberationParticipant`, `diffWords`, `PERSONAS`, `DiscussionSeed` (trimmed), `DISCUSSION_SEED_BY_KEY`, `PROPOSALS_BY_KEY`, `PROPOSAL_COMMITMENTS_BY_KEY`, `PROPOSAL_EXPERT_REVIEWS_BY_KEY`, `PROBLEM_STATEMENT`, `EDIT_SUGGESTIONS`, etc.

**Remove exactly:**
- `export const DELIBERATION_PARTICIPANTS` (line ~180)
- `export const PRESENCE_NOW` (line ~183)
- `export const PRESENCE_TICKER` (line ~190)
- `interface SeedPosition` (line ~280)
- The `positions: SeedPosition[]` field on `DiscussionSeed` (line ~307) and the sibling `anchored` field if present
- The `const positions: SeedPosition[] = roots.map(...)` builder (line ~363) and the analogous `anchored` builder if present, plus their inclusion in the returned seed object
- `interface PresenceEvent` and any presence-only types — **only if** grep confirms they are now unreferenced after the three exports are gone

- [ ] **Step 1: Remove the listed exports/interfaces/builders**

Edit `deliberation.ts`. Ensure the seed-building function no longer returns `positions`/`anchored` and `DiscussionSeed` no longer declares them (matches Task 4's trimmed contract).

- [ ] **Step 2: Reference check across the whole repo**

```bash
grep -rn "DELIBERATION_PARTICIPANTS\|PRESENCE_NOW\|PRESENCE_TICKER\|SeedPosition\|PresenceEvent" src
```
Expected: **no output**. Then confirm the kept helper survives:
```bash
grep -rn "deliberationParticipant" src
```
Expected: still referenced by `src/components/collaboration/flows/merge/ProposalMergePanel.tsx` (LIVE — must remain).

- [ ] **Step 3: Bump DEMO_VERSION**

In `src/services/demo/mockApi.ts`, change the `DEMO_VERSION` constant from `global-v11` to `global-v12` (forces a clean reseed so no stale-shape contract state lingers).
```bash
grep -n "global-v11\|DEMO_VERSION" src/services/demo/mockApi.ts
```
Then edit `global-v11` → `global-v12`.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 5: Verify the app still seeds & renders (preview)**

Start the dev server (`preview_start`, port 5173). Load a community's Discussion stage at 360px. Confirm via `preview_console_logs` there are NO errors (esp. no `[useDiscussionData]` or contract-method-not-found noise) and `preview_snapshot` shows the live `ThreadedDiscussion` rendering. Check light + dark.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(s7): drop positions/anchored seed + PRESENCE_* fixtures; bump DEMO_VERSION global-v12"
```

---

### Task 6: Remove the 14 dead CSS classes in `DiscussionFlow.module.scss`

**Files:**
- Modify: `src/components/collaboration/flows/discussion/DiscussionFlow.module.scss`

**Interfaces:**
- Consumes/Produces: nothing — pure CSS cleanup. `DiscussionFlow.tsx` references only `container` (the wrapper); the remaining live classes belong to `ThreadedDiscussion`/its own scss. The 14 below are legacy category/filter/progress selectors no longer referenced.

**Remove exactly these selectors:** `.header`, `.avatar`, `.avatarMe`, `.authorName`, `.categorySelector`, `.categoryChip`, `.categoryChipActive`, `.categoryBadge`, `.filterBar`, `.filterChip`, `.filterChipActive`, `.filterCount`, `.progressBar`, `.progressItem`.

- [ ] **Step 1: Re-verify each class is unreferenced**

For the full set, confirm no `styles.<name>` usage remains in any `.tsx`:
```bash
for c in header avatar avatarMe authorName categorySelector categoryChip categoryChipActive categoryBadge filterBar filterChip filterChipActive filterCount progressBar progressItem; do echo -n "$c: "; grep -rn "styles\.$c\b" src/components/collaboration/flows/discussion/*.tsx | wc -l; done
```
Expected: every count is `0`. If any is non-zero, do NOT remove that class; report it.

- [ ] **Step 2: Delete the 14 selector blocks**

Edit the `.scss`, removing each listed selector and its rule body (and any nested `&` modifiers belonging only to them). Leave the live selectors (`.container`, etc.) intact.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean. (SCSS-module class removal won't error unless a removed class is referenced — grep already confirmed none is.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(s7): prune 14 dead CSS classes from DiscussionFlow.module.scss"
```

---

### Task 7: Drop unused `loading`/`derived` from `useMandate`

**Files:**
- Modify: `src/hooks/useMandate.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `useMandate(initiativeId)` now returns `{ mandate }` only. `UseMandateResult` becomes `{ mandate: PublishedMandate }`. The internal `loading` state machinery (the `loading` useState and both `setLoading` calls) is removed since nothing consumes it. **Keep** all derivation logic (results/proposals fetch, winner pick, spine→mandate mapping, fixture fallback) intact.

- [ ] **Step 1: Confirm no consumer reads `loading`/`derived`**

```bash
grep -rn "useMandate" src
grep -rn "\.loading\|\.derived" src/components/mandate src/pages 2>/dev/null
```
Expected: the only consumer is `MandatePage.tsx`, which destructures `{ mandate }` only. No `.loading`/`.derived` reads anywhere. If found, STOP and report.

- [ ] **Step 2: Edit `useMandate.ts`**

- In `interface UseMandateResult`, remove the `loading: boolean;` and `derived: boolean;` lines (and their doc comment), leaving `{ mandate: PublishedMandate }`.
- Remove `const [loading, setLoading] = useState(false);`.
- Remove the `setLoading(true)` call (start of the effect) and the `finally { if (!cancelled) setLoading(false); }` block (collapse the try/finally — keep the `catch`).
- Change the return from `return { mandate, loading, derived: mandate !== fixture };` to `return { mandate };`.
- If `useState` is now only used for `results`/`proposals`, leave the import (still used). If any import becomes unused, remove it.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean (watch for `noUnusedLocals` on a leftover `loading`/`setLoading` — there should be none after the edits).

- [ ] **Step 4: Verify Mandate page still renders (preview)**

With the dev server running, load a Mandate route at 360px. `preview_console_logs` clean, `preview_snapshot` shows the mandate articles/indicators. Light + dark.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(s7): drop unused loading/derived from useMandate return"
```

---

### Task 8: Write `docs/FOR_OURI_seam.md` (C — backend hand-off)

**Files:**
- Create: `docs/FOR_OURI_seam.md`
- Modify: `CLAUDE.md` (add one pointer line in the "Branch model & data-layer seam" section)

**Interfaces:**
- Consumes: the `// FOR OURI` comments currently in the codebase (re-grep fresh — line numbers shifted after Tasks 1–7).
- Produces: a single hand-off doc the backend dev (Ouri) uses to implement the real contracts.

- [ ] **Step 1: Re-gather the live FOR-OURI notes**

```bash
grep -rin "for ouri\|new method for ouri" src
```
Expected (after this session's deletions): notes in `SuggestionDmView.tsx`, `voting/QVFlow.tsx` (×2), `mandate/MandatePage.tsx`, `hooks/useMandate.ts`, `demoContracts/approval.ts` (×5: commitments, co_authors, request_expert_review, add_expert_review, suggest_proposal_merge), `demoContracts/discussion.ts` (×2: like_comment, set_statement). The deleted positions/anchored code carried NO FOR-OURI notes — confirm none reappear.

- [ ] **Step 2: Author the doc**

Create `docs/FOR_OURI_seam.md` with this structure (fill each section from the gathered notes + the spine context in `project_consistency_pipeline_redesign_jun2026` memory):

```markdown
# FOR OURI — Contract Seam Hand-off

This is the single source of truth for the backend contract work the `ui` branch
relies on. The UI is built against the `src/services/demo/` stub layer; every
method/field below is implemented as a permissive demo stub today and must be
backed by a real Python contract when `ui` → `new-features` → `main`.

## The one rule that must not break
UI contract **method names and field names MUST match Ouri's real contract
exactly** — `addProposal`/`proposal_id`/`get_results`/`get_proposals` etc. The
words "solution" and "mandate" are **presentation vocabulary only**; the wire
names stay `proposal`. (e.g. the add-solution popup calls `add_proposal`.)

## Seam methods & fields by stage
### S2 — Discussion (`demoContracts/discussion.ts`)
- `like_comment(comment_id)` — 1p1v toggle; appends/removes caller pk on the
  comment's `likes` list (dedup). Advisory only — does NOT gate advancement.

### S3 — Write Together (`demoContracts/discussion.ts`, `demoContracts/approval.ts`)
- `set_statement(title, body)` — initialises a co-owned draft with caller as sole
  co-author; later `support_edit` fold-ins extend `coAuthors`.
- `add_proposal` gains optional `co_authors` (string list) carried from a co-owned draft.
- ⚠️ Production note: the `wtdraft_<id>` JSON draft registry is stored as a community
  property in the stub. Production should use a **dedicated draft-registry contract**,
  not community props.

### S4 — Solutions + commitments/metrics spine (`demoContracts/approval.ts`)
- `add_proposal(..., commitments?)` — optional `commitments` string list (UI enforces ≥1).
- `request_expert_review(proposal_id)` — 1p1v toggle into `expertReviewRequests`; signals
  the Gloki Team to solicit experts (does NOT mark reviewed).
- `add_expert_review(proposal_id, metrics, note?)` — expert attaches success metrics.
  **Real contract MUST gate on the caller holding the expert role.** One review per
  expert per proposal (upsert).
- `suggest_proposal_merge(source_id, target_id)` — advisory, never auto-merges; recorded
  on the source proposal's `mergeSuggestions`.
- Proposal fields added: `commitments`, `expertReviewRequests`, `expertReviews[].metrics`
  (+`expert`/`note`/`timestamp`), `mergeSuggestions`.

### S5 — Vote (`voting/QVFlow.tsx`)
- Vote lock is **derived client-side** from a non-empty `get_my_allocation` (voted once →
  hard-lock). No new contract method/state.
- 75% turnout figure is a client-side derivation for the slate footer.

### S6 — Mandate consume (`hooks/useMandate.ts`, `mandate/MandatePage.tsx`)
- Read path only — **no new methods**: `qv.get_results` (winner) joined to
  `approval.get_proposals`; the winning proposal's `commitments` → mandate articles,
  its `expertReviews[].metrics` → mandate indicators. Falls back to the hand-authored
  fixture when no spine exists.
- Route `:mandateId` IS the initiative contract id (same id the vote card uses).

### 1:1 DM (`SuggestionDmView.tsx`)
- The "suggestion to the author" DM reuses the flat chat contract as a private
  per-requester contract. Production: a real 1:1 contract keyed by the unordered
  `{author, requester}` pair.
```

(Adjust wording to match the actual comment text gathered in Step 1; the above is the structure + content to convey. Keep it accurate to the current code.)

- [ ] **Step 3: Add a pointer line in `CLAUDE.md`**

In the "Branch model & data-layer seam" section, add one line:
`> Backend contract hand-off (every method/field the UI relies on): **[docs/FOR_OURI_seam.md](./docs/FOR_OURI_seam.md)**.`

- [ ] **Step 4: Build (sanity — no code changed, but confirm nothing broke)**

Run: `npm run build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs(s7): consolidate FOR-OURI contract seam notes into docs/FOR_OURI_seam.md"
```

---

## Final gate (after all 8 tasks)

- [ ] Full `grep -rn` sweep confirms zero references to any removed symbol (`PositionsBoard`, `AnchoredThread`, `ParticipationMeter`, `CoPresenceBar`, `useDiscussionData`, `useAuthorResolver`, `PositionType`, `POSITION_TYPES`, `getPositions`, `addPosition`, `supportPosition`, `withdrawPositionSupport`, `getAnchoredComments`, `addAnchoredComment`, `normalizePosition`, `normalizeAnchored`, `StoredPosition`, `SeedPosition`, `DELIBERATION_PARTICIPANTS`, `PRESENCE_NOW`, `PRESENCE_TICKER`, `PresenceEvent`).
- [ ] `npm run build` clean.
- [ ] Dev server: Discussion stage + Mandate page render at 360px light+dark, no console errors.
- [ ] Opus whole-branch review of the session diff (subagent-driven final review).
- [ ] Local multi-model review panel on the session diff (do NOT pass `--free-ram`/`--quit-chrome`). If zero-coverage/false-positives-only (no `GEMINI_API_KEY`; Ollama RAM-skip), say so and lean on per-task + Opus reviews.
- [ ] Confirm merge/deploy with Eston before pushing. (PR #20's ✗ vs `main` is expected divergence.)
- [ ] Update project memory.

## Self-Review notes
- **Spec coverage:** B (dead-code) = Tasks 1–7; C (seam doc) = Task 8. The deferred Minors (stale-flash reset, `<dt>/<dd>` a11y, `.liked` contrast) are intentionally OUT (Eston's call) — not in any task.
- **Order safety:** consumers removed before dependencies (components → hook → api → contract → fixture), so every commit compiles. Task 4 before Task 5 so `DiscussionSeed` fields are unused before deletion.
- **No new strings / no i18n** — confirmed; the only new file is an internal English doc.
