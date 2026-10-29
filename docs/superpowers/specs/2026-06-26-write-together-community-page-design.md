# Session 3 — "Write together" community page (+ relocating the dormant co-authoring) — Design Spec

**Date:** 2026-06-26
**Branch:** `ui` (UI-only stub layer; no backend)
**Roadmap:** `docs/superpowers/specs/2026-06-25-design-consistency-pipeline-redesign-roadmap.md` (§5 Session 3)
**Builds on:** Session 1 (`UserIdentity`, `$stage-*` palette, the shared kit) and Session 2 (`ThreadedDiscussion`; the co-authoring mechanic made **dormant** and reserved for exactly this session).
**Status:** Design approved-in-principle (six brainstorm decisions locked, below). This spec → `writing-plans` → `subagent-driven-development`.

---

## 1. Goal

Give the community a place to **co-author a problem or solution as a group and submit it to the feed** — and give the rich co-authoring mechanic (built in S2's discussion, left dormant) its permanent home. The user-facing wins:

1. A new **"Write together"** community page where members start a **problem** or **solution** draft, collaborate on it via the co-owned statement + track-changes edits (1p1v fold-in), and **submit it to the feed** of any community they belong to — including drafting **for other communities**.
2. A **solution → problem tag** that works both in-app (a dropdown of open problems) and by **word-of-mouth** (an auto-generated, human-memorable **3-word code** anyone can read off a problem and paste to tag a solution to it — even across communities).

This is the relocation the roadmap fixed as **"S3 must precede the solution-card co-authoring removal in S4."** S3 builds the new home; S4 redesigns the solution card.

## 2. Locked decisions (from the brainstorm)

1. **Carry the core co-authoring only.** The Write-Together draft editor reuses the co-owned `Statement` + track-changes `EditSuggestion`s with 1p1v fold-in (the differentiated "write together" value). The other dormant pieces — `PositionsBoard`, `AnchoredThread`, `ParticipationMeter`, `CoPresenceBar` — are **not** carried (redundant with `ThreadedDiscussion` / killed in S2). When a draft wants discussion, **attach `ThreadedDiscussion`**.
2. **Submit mints real feed items carrying co-authors.** A problem draft becomes a real Problem initiative in the target community's feed (`proposeCandidateIssue`); a solution draft becomes a real proposal on the chosen problem (`add_proposal`). Both carry an optional **`coAuthors`** list (from the draft's fold-ins), surfaced via `UserIdentity`. Documented for Ouri.
3. **Tagging = dropdown + 3-word code.** An in-app dropdown of the target community's open problems, **and** a deterministic per-problem 3-word code (`brave-otter-river`) for cross-community word-of-mouth (paste resolves by scanning known problems).
4. **Target picker = your communities.** A `SearchableSelect` over the communities the user belongs to (`state.user.contracts`), keyed by community contract id, default = current. The 3-word code already gives cross-community *reach* for solution tagging.
5. **New home, reuse-in-place, leave dead code.** S3 builds Write-Together and reuses the Statement + edits mechanic where it lives; it **does not delete** the not-carried dormant pieces and **does not touch** `SolutionEngage` (the solution card is wholly S4). The three S2-deferred cleanups (dead `DiscussionFlow` CSS, orphaned presence fixtures, `.liked` AA) stay **re-flagged**, not done here.
6. **Layout: drafts-list → detail; A-style start + B-style editor.** A drafts list (like Funds/Collab) with "Start a draft"; starting uses an explicit A-style form (mode / target / tag / initial title+body); the ongoing editor uses a B-style compact setup header with the co-owned draft as the hero.

## 3. Current-state grounding (what exists today)

- **Community shell:** `src/pages/CommunityView.tsx` — `menuItems` (≈line 221; Funds registered as `{ key:'currency', icon:Coins, label, onClick: navigate('/community/:id/currency') }`) and the nested `<Routes>` (≈line 263; `currency` → lazy `Currency`). The most recent self-contained community page is `src/components/community/Currency.tsx` (list → detail via local state `selectedFundId`, `loadAllocationData` re-fetch after writes, `get_properties` registry of `fund_<name>` → contract id).
- **Dormant co-authoring (all intact, zero live importers outside `flows/discussion/`):**
  - `SharedStatement.tsx` — the co-owned statement + open track-changes `EditCard`s; `target = Math.max(3, ceil(participantCount/2))`; calls `discussionApi.suggestEdit/supportEdit/withdrawEditSupport`; renders authors via the **misinfo fixture** (`deliberationParticipant`) + `CountryFlag` (to be re-pointed at `UserIdentity` + `profiles`).
  - `discussionApi.ts` — `getStatement/getEdits/suggestEdit/supportEdit/withdrawEditSupport` (+ the dormant positions/anchored group); the live threaded-comment group (`getComments/addComment/deleteComment/likeComment`) backs `ThreadedDiscussion`.
  - `demoContracts/discussion.ts` — the discussion contract holds **both** the comment group **and** the co-authoring group (`get_statement`/`get_edits`/`suggest_edit`/`support_edit`/`withdraw_edit_support`), with the 1p1v + fold-in rule already implemented in `support_edit`. **No `set_statement` write exists** (the statement is only seeded or mutated by fold-ins).
- **Reuse kit:** `ThreadedDiscussion` (`{ contractId, communityId?, canParticipate, emptyHint? }` — post/reply/heart, Top/Newest, continue-thread; the discussion contract's comment group also lives on any discussion contract); `UserIdentity` (`{ name, countryCode?, trustState?, size }`); `SearchableSelect`; the kit (`Button`/`Card`/`Modal`/`Banner`/`Badge`/`EmptyState`/`InfoDisclosure`).
- **Submission hooks:** `proposeCandidateIssue` (`src/components/stages/ProblemStage.demo.ts`, dormant — deploys a Problem-stage initiative + a problem-vote sub-contract seeded with the proposer's "second" + registers the initiative on the community via `add_collaboration`; returns the new initiative id). `approval.ts` `add_proposal(text)` (proposal = `{ id, text, author, timestamp }`) is the solution-submission write; the solutions sub-contract is registered on an initiative under a stage key (the `useFlowContract` shared-mode pattern: read parent's stored contract → join, else deploy + register).
- **Problems for tagging:** seeded `INITIATIVES` (`fixtures/problems.ts`, keyed by `key` + `community`); at runtime a community's initiatives are in `state.communities.communityCollaborations[communityId]` (populated by `fetchCollaborations`). The demo user owns all **4** seeded communities (`seedAllDemoCommunities`), so `state.user.contracts` lists all four.

## 4. The design

### 4.1 Route + menu entry

- **Menu:** add to `CommunityView.tsx` `menuItems`, immediately after `create-initiative`:
  `{ key:'write-together', icon: PenLine, label: t('community.menu.writeTogether','Write together'), onClick: closeAfter(() => navigate(`/community/${communityId}/write-together`)) }`.
- **Route:** add `<Route path="write-together" element={<WriteTogetherPage communityId={communityId!} />} />` (lazy import, like the other section pages) inside CommunityView's `<Routes>`.

### 4.2 Page structure — `WriteTogetherPage` (list ↔ detail, local state)

Self-contained, mirroring `Currency`. Local view state: `view = { mode:'list' } | { mode:'start' } | { mode:'edit', draftId }`. The page title is an **`<h2>`** "Write together" (CommunityView's `AppHeader` owns the route's single, visually-hidden `<h1>` = the community name; section pages use `<h2>` — the `CreateInitiativePage` pattern, **not** Funds' pre-existing visible-`<h1>` deviation) + an `InfoDisclosure` ("How writing together works") + subtitle. A `useAlert` instance for confirmations/errors. Each view sets its own `<main>`/heading focus appropriately. The demo seam emits no `contract_write` events → **re-fetch the registry after every write** (the `Currency`/ConcernsFlow pattern).

### 4.3 Drafts list (`view:'list'`)

- **Read:** the current community's `get_properties`; parse keys `wtdraft_<id>` whose JSON value is the draft registry entry: `{ contractId, mode:'problem'|'solution', target, tag?, title, status:'draft'|'submitted', submittedRef?, author, createdAt }`.
- **Render:** "Start a draft" `Button` (primary, `Plus`) → `view:'start'`. A list of draft rows (`Card`-like): a mode `Badge` (Problem = `$stage-problem`; Solution = `$stage-proposals`), the `title`, `for {targetCommunityName}`, the tag title (solution), and a status pill (`Draft` / `Submitted`). The starter renders via `UserIdentity`. Tapping a draft → `view:'edit', draftId`.
- **Empty state:** `EmptyState` ("No drafts yet — start one and write it together.").
- *(Co-author chips are a detail-screen feature (§4.5), not the list — keeps the list a single `get_properties` read.)*

### 4.4 Start a draft (`view:'start'`, A-style form) — `StartDraftForm`

Explicit, full-width, stacked at 360px (the `CreateInitiativePage` idiom):
1. **Mode** — Problem / Solution segmented toggle.
2. **Drafting for** — `SearchableSelect` over `state.user.contracts` (id → community name), default current `communityId`.
3. **Tag to a problem** *(solution only)* — `ProblemTagPicker` (§4.6).
4. **Initial draft** — title input + body textarea (the author's first version of the co-owned statement).
5. **Start draft** `Button`: deploy a draft contract, `set_statement(title, body)` (§4.8) → seeds `{title, body, coAuthors:[me]}`, register `wtdraft_<id>` on the **current** community via `set_property`, then `view:'edit', draftId`. Back → `view:'list'`.

> Drafts are registered on the **current** community (where you collaborate); `target` is only where the finished draft gets submitted.

### 4.5 Draft editor (`view:'edit'`, B-style) — `DraftEditor`

- **Compact setup header:** mode pill · `for {targetCommunityName}` · tag chip (solution). Each is tappable to change — target opens the community `SearchableSelect`, tag opens `ProblemTagPicker`; a change rewrites the `wtdraft_<id>` registry entry. (Mode is fixed after creation — it determines the submission path.)
- **Co-owned draft (the hero):** reuse **`SharedStatement`**, **adapted**: render the statement title/body + "Co-owned" `Badge`, the co-authors and each edit's author via **`UserIdentity` + `state.communities.profiles`** (shedding the `deliberationParticipant` misinfo-fixture coupling — this is the "relocation"), and the open track-changes `EditCard`s with the 1p1v support bar + fold-in (unchanged logic). `participantCount` = distinct people who've taken part in *this draft* (statement `coAuthors` ∪ edit authors ∪ edit supporters ∪ discussion comment authors), so the fold-in `target` (`max(3, ceil(n/2))`) stays meaningful at small scale. `canParticipate` = the user is a member of the **current** community. Re-fetch statement + edits after each write.
- **Discuss this draft:** a collapsible section rendering `<ThreadedDiscussion contractId={draftContractId} communityId={communityId} canParticipate={…} emptyHint=… />`. The draft contract is discussion-style, so its comment group backs the thread — **no extra contract**.
- **Submit:** a `Button` "Submit to {targetCommunityName}" → the submission orchestration (§4.7). Disabled when the statement is empty or already submitted; on success, mark the draft `submitted`, store `submittedRef`, and show a confirmation linking to the created feed item.

### 4.6 Problem tagging — `ProblemTagPicker` + the 3-word code

- **Dropdown:** the **target** community's open problems. Source: `state.communities.communityCollaborations[target]` (dispatch `fetchCollaborations(target)` when the target changes) filtered to initiatives (type `initiative`). Each row shows the title + its 3-word `codeForId(id)`. Selecting one sets `tag = { problemId, title, community: target }`.
- **Paste a code:** an input; on enter, `resolveCode(code)` scans **all problems the demo knows** — the seeded `INITIATIVES` ∪ every `communityCollaborations[c]` for `c` in `state.user.contracts` — and matches on `codeForId(id) === code`. A hit sets `tag` (even if the problem lives in a community the user isn't browsing) and shows the resolved title; a miss shows an inline "No problem found for that code."
- **`src/utils/problemCode.ts`:** pure `codeForId(id: string): string` over a **curated, safe wordlist** (three lists — adjectives, animals, nouns — ~64 each; deterministic index from a simple string hash; `adjective-animal-noun`). `parseCode`/`resolveCode(code, problems)` helpers. No storage — the code is derived, so it's stable and portable.
- **Discoverability (small, flagged cross-cut):** surface the code on the problem card so it can be read off for word-of-mouth — add a copyable `Problem code · brave-otter-river` line to `ProblemEngage` (`codeForId(initiativeId)`). This is the only edit outside the Write-Together feature; it's ~a line and is required for the paste story to have a source. Flagged for Eston in spec review.

### 4.7 Submission orchestration

A UI-level `submitDraft(draft)` (no single "submit" contract method):

- **Problem** → `proposeCandidateIssue({ publicKey, communityId: draft.target, title: statement.title, description: statement.body, countries: [], evidence: [], coAuthors: statement.coAuthors })`. Extend `ProposeIssueInput` + `proposeCandidateIssue` with optional `coAuthors`, threaded onto the initiative record and the `add_collaboration` payload. Returns the new initiative id → store as `submittedRef`.
- **Solution** → resolve the **target problem's** solutions (approval) contract via the shared-mode pattern: read the problem initiative's registered approval contract; **join** if present, else **deploy + register** it (a small helper mirroring `useFlowContract` shared mode). Then `add_proposal(text: statement.body, coAuthors: statement.coAuthors)`. Extend `add_proposal` to accept optional `coAuthors` (stored on the proposal). Store `{ initiativeId, proposalId }` as `submittedRef`.
- After either, rewrite `wtdraft_<id>` with `status:'submitted'` + `submittedRef`, re-fetch the registry, and surface success.

### 4.8 Data-layer / seam changes (documented for Ouri)

All behind `src/services/api.ts`; UI never calls a server directly. Names chosen to match an eventual real contract.

- **`discussion.ts` (demo) + `discussionApi.ts` — one new write `set_statement`:** `values:{ title, body }` → sets `statement = { title, body, coAuthors:[caller] }` on a fresh draft contract (idempotent enough for the demo; only used at draft start). `discussionApi.setStatement(serverUrl, publicKey, contractId, title, body)`. Everything else (`get_statement`/`get_edits`/`suggest_edit`/`support_edit`/`withdraw_edit_support`, and the comment group for the thread) is **reused unchanged**.
- **`coAuthors` field (optional):** added to the initiative-creation path (`proposeCandidateIssue` → the initiative record + `add_collaboration` payload) and to `approval.ts` `add_proposal` (proposal gains optional `coAuthors: string[]`). Read back wherever the created item is rendered.
- **Draft registry:** reuse the community contract's existing `set_property` / `get_properties` with `wtdraft_<id>` keys (JSON entry per §4.3) — **no new community method** (mirrors Funds' `fund_<name>`).
- **Dormant (untouched):** the not-carried co-authoring methods (`get_positions`/`add_position`/…/`add_anchored_comment`) stay in `discussion.ts`/`discussionApi.ts`, still reserved.

### 4.9 Seed + `DEMO_VERSION`

Seed **one** sample in-progress Write-Together draft on a community (proposed: Global Health Network) so the list opens alive: deploy a draft contract seeded with a statement (`set_statement`-shape) + 2 co-authors + one open edit one supporter short of fold-in + 2–3 `ThreadedDiscussion` comments, and a `wtdraft_<id>` registry entry (`status:'draft'`). Add the seed in the existing seed orchestrator. **Bump `DEMO_VERSION` `global-v6` → `global-v7`** (`src/services/demo/mockApi.ts`) so returning users re-seed.

## 5. Component inventory (delta)

**New**
- `community/writeTogether/WriteTogetherPage.tsx` (+ `.module.scss`) — list ↔ start ↔ edit container; the registry read + re-fetch; `useAlert`.
- `community/writeTogether/StartDraftForm.tsx` — the A-style start form (mode/target/tag/title/body → start).
- `community/writeTogether/DraftEditor.tsx` — the B-style editor (compact setup header + `SharedStatement` + collapsible `ThreadedDiscussion` + submit).
- `community/writeTogether/ProblemTagPicker.tsx` — open-problems dropdown + 3-word-code paste/resolve.
- `utils/problemCode.ts` — `codeForId` / `parseCode` / `resolveCode` + the curated wordlist.

**Modified**
- `pages/CommunityView.tsx` — menu item + route.
- `components/collaboration/flows/discussion/SharedStatement.tsx` — author/co-author rendering via `UserIdentity` + `profiles` (drop the `deliberationParticipant` coupling); accept a "you" label; otherwise behavior-preserving.
- `components/collaboration/flows/discussion/discussionApi.ts` — `setStatement`.
- `services/demo/demoContracts/discussion.ts` — `set_statement` write.
- `services/demo/demoContracts/approval.ts` — optional `coAuthors` on `add_proposal`.
- `components/stages/ProblemStage.demo.ts` — optional `coAuthors` on `ProposeIssueInput`/`proposeCandidateIssue` (no longer "dormant"; remove the dormancy comment).
- `components/initiative/stages/ProblemEngage.tsx` (+ `.module.scss`) — the copyable `Problem code` line (§4.6, flagged).
- `services/demo/seedDemoCommunity.ts` (+ fixtures) — the sample draft seed.
- `services/demo/mockApi.ts` — `DEMO_VERSION` → `global-v7`.

**Dormant / untouched (reserved):** `PositionsBoard`, `AnchoredThread`, `ParticipationMeter`, `CoPresenceBar`, `useDiscussionData`, their contract/api methods, the `PRESENCE_*` fixtures.

## 6. i18n (fr + sw parity)

- **New keys (en inline + fr + sw):** `community.menu.writeTogether`; a `writeTogether.*` family — page title/subtitle/explainer; list (`startDraft`, `empty`, status `draft`/`submitted`, `for`); start form (`modeProblem`/`modeSolution`, `draftingFor`, `tagToProblem`, `titleLabel`/`titlePlaceholder`, `bodyLabel`/`bodyPlaceholder`, `start`); editor (`setupMode`/`setupFor`/`setupTag`, `discussTitle`, `submitTo`, `submittedNote`); tagging (`pickProblem`, `pasteCode`, `codeNotFound`, `problemCodeLabel`, `copyCode`/`copied`). Reuse existing `deliberation.coauthor.*` (SharedStatement) and `deliberation.thread.*` (ThreadedDiscussion).
- **Process:** after adding, run the key-parity check (extract `'key':` lines, sort, diff fr vs sw — must be empty) and a code-ref vs i18n cross-check (catch over/under-prune). Append new strings to `docs/i18n-native-review-candidates.md`. The curated 3-word **wordlist stays English** (a shared spoken code, like the identity-card credential) — note this in the candidates doc.

## 7. Out of scope

- No backend; everything on the `ui` stub seam.
- No deletion of the not-carried dormant pieces; no `SolutionEngage`/solution-card work (S4); no Vote/Mandate (S5/S6).
- The three S2-deferred cleanups (dead `DiscussionFlow` CSS, orphaned `PRESENCE_*` fixtures, `.liked` AA) — **re-flagged, not done** (decision ⑤).
- No DM inbox; no fr/sw native-language review (human-gated). No draft deletion/archival beyond the submitted-status flip (a nice-to-have, deferrable).

## 8. Verification (no test framework)

- `npm run build` (`tsc -b`) clean before every commit.
- `npm run dev` + `preview_*` at **360px**, **light and dark**, on the seeded community:
  1. Menu → Write together → list shows the seeded draft; "Start a draft" opens the A-style form.
  2. Start a **problem** draft for the current community → editor opens; suggest an edit, support it to fold-in (co-author credited via `UserIdentity`); "Discuss this draft" posts a comment; **Submit** → it appears as a Problem initiative in the feed.
  3. Start a **solution** draft **for another community**; tag via the dropdown; then via a **pasted 3-word code** (resolves a problem in a community you're not browsing); Submit → it appears as a proposal on that problem.
  4. The compact setup header lets you change target/tag; the change persists on the list.
  5. Empty states + submitted-status read friendly; no co-presence/positions/33%-meter anywhere.
- AA gates per `DESIGN_SYSTEM.md` (no `$gray-400` text; ≥44px touch on toggles/CTAs/code-copy/support; focus rings). Tokens only — no ad-hoc hex.

## 9. Self-review notes

- **Smallest seam footprint:** one new contract write (`set_statement`); one optional field (`coAuthors`) on two existing writes; the draft registry rides existing `set_property`/`get_properties`. Submission reuses `proposeCandidateIssue` + `add_proposal`. All documented for Ouri.
- **One reuse risk — `SharedStatement` adaptation:** it currently renders authors from the misinfo fixture. Re-pointing to `UserIdentity` + `profiles` is the relocation; verify co-author + edit-author bylines render with flag + shield when profiles are loaded, and that the fold-in/`target` math is unchanged.
- **One interaction risk — cross-community solution submit:** deploying/registering a target problem's solutions contract from outside the initiative dashboard. Mirror `useFlowContract` shared mode exactly (read register → join, else deploy + register) so a solution never lands on an orphaned contract.
- **3-word code:** curated wordlist must be unambiguous and inoffensive; codes are for memorability, not security. Resolution scans a bounded known-problems set (seeded slate + your communities) — log nothing silently dropped.
