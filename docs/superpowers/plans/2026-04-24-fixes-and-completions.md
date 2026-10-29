# 2026-04-24 — Bug fixes + feature completions

## Context

A.2 (50% threshold) and A.3 (active-member tracking) are shipped in `a2c2e06`. Remaining work falls into three buckets: two user-blocking bugs, four feature completions that connect existing UI to real chain data, and a small amount of copy/polish. Research pass revealed that two items originally on the list — UI_TASKS #3 (inline community nav) and UI_TASKS #7 (single-column communities list) — are already done; the plan records that explicitly so we don't re-do them.

**Hard constraint:** every feature pulls data from the real blockchain backend on `gdi.gloki.contact` (or the configured server). No mocks, no synthetic counters, no in-memory state that isn't backed by a contract. The app already runs this way; the plan just preserves it.

## Principles

- **Contracts are immutable after deploy.** Any new method only applies to fresh communities/initiatives. Old ones must silently fall back at the client. Pattern: try/catch the new read, fall back to the old read or to a computed-from-existing-methods path. Reference: A.3's `fetchCommunityActiveMembers` fallback in [communitiesSlice.ts:94-103](src/store/slices/communitiesSlice.ts:94).
- **No `__init__`-time writes.** Gloki re-runs `__init__` on every invocation and rejects writes during reads. Use `Storage(...)` for handles only; write only inside methods. Reference: CLAUDE.md Architecture Learnings.
- **Timestamp-keyed IDs, not counters.** Matches [discussion_contract.py](src/assets/contracts/discussion_contract.py), [chat_contract.py](src/assets/contracts/chat_contract.py), [concerns_contract.py](src/assets/contracts/concerns_contract.py).
- **No test framework.** Verify via `npx tsc -b --noEmit`, `npm run build`, and browser preview against the real backend.
- **Ship small, ship often.** Each phase below is one commit.

## Phase 1 — Bug fixes (ship first)

### 1.1 Create-community UX failure mode ([CreateCommunityPage.tsx:79](src/pages/CreateCommunityPage.tsx:79))

**Problem.** Kennedy and Eston report "button does nothing." I reproduced the happy path successfully, so the defect isn't universal — it triggers on some errors that the bare `catch` swallows into a generic "Failed to create community. Please try again." with small red text below the submit button. Users miss it.

**Fix.**
- Bind the caught error: `catch (err) { console.error('[CreateCommunity]', err); setError(\`Failed: ${err instanceof Error ? err.message : String(err)}\`); }`
- Raise `.errorMessage` visual weight: add a red-tinted background, border, and an `AlertCircle` icon. Compare against `.sampleBanner` in [StageFeedView.module.scss](src/pages/StageFeedView.module.scss) for an existing elevated-notice pattern.
- Add a tiny disabled-reason hint under the button when `!name.trim()` ("Enter a community name to continue") so "button does nothing" has an obvious cause when the form isn't valid.

**Files.** `src/pages/CreateCommunityPage.tsx`, `src/pages/CreateCommunityPage.module.scss`.

**Verification.** Browser preview: temporarily stub `createCommunity` to throw, confirm the error UI surfaces. Revert. On the happy path the existing flow still deploys.

### 1.2 Collab white-screen ([CommunityView.tsx:498](src/pages/CommunityView.tsx:498))

**Root cause (per Explore).** The `/collab/:collabId` route is inside the top-level `ErrorBoundary` at [line 490](src/pages/CommunityView.tsx:490), but unlike the chat routes it has no *local* boundary. If `CollaborationPage` throws before it renders its internal boundary at [CollaborationPage.tsx:213](src/pages/collaboration/CollaborationPage.tsx:213), the outer boundary catches nothing visible because the component also never reaches its Suspense fallback path. Also: stale localStorage `flowId` (referencing a deleted/unknown flow) sets `ActiveComponent = null` and renders an empty slot ([CollaborationPage.tsx:117-120](src/pages/collaboration/CollaborationPage.tsx:117)).

**Fix.**
- Wrap the `collab/:collabId` Route element in a local `ErrorBoundary` with a specific `fallbackMessage` ("Couldn't load this collab workspace. Try again or pick a different template."), matching the pattern used at [lines 501-505](src/pages/CommunityView.tsx:501) for chat.
- In `CollaborationPage`, when `getFlow(activeTab)` returns undefined, render an inline error card ("Unknown flow: {flowId}. Your saved view may be stale — choose another tab.") instead of the current null-renders-blank behavior.
- Clear stale `flowId` from localStorage when the lookup fails.

**Files.** `src/pages/CommunityView.tsx`, `src/pages/collaboration/CollaborationPage.tsx`.

**Verification.** Create a fresh community on preview → deploy a collab from a template → navigate in. Then manually inject a bogus flowId via DevTools → reload → confirm the inline error shows instead of a white screen.

### 1.3 Chat error on use ([useFlowContract.ts:142](src/components/collaboration/flows/shared/useFlowContract.ts:142), [chatApi.ts:42-65](src/services/contracts/chatApi.ts:42))

**Root cause (per Explore).** Two suspicious spots:
1. `useFlowContract` shared mode calls `resolveInitiativeStageContract` — it's generic despite the name (per CLAUDE.md), but its fallback paths may return `null` when a pre-chat community doesn't expose `get_stage_contract`. The chat UI then proceeds with an unresolved contractId.
2. `chatApi.ts` error swallowing in `normalizeTimestamp` (returns 0 on any failure) masks real data-shape issues from the packed-digit format.

**Fix.**
- In `ChatTopicList` and `ChatTopic`, tighten the `hasError`/`isReady` gate so nothing calls `chatApi` until the flow contract is fully resolved and non-null. Currently the chat polling loop can fire on an unresolved contract and emit errors. Pattern reference: [ProblemVoteFlow.tsx:66-68](src/components/collaboration/flows/voting/ProblemVoteFlow.tsx:66) (`if (isReady) fetchData()`).
- Add a cheap console.warn inside `normalizeTimestamp` when a value comes in that doesn't match the packed-digit format. Not user-facing but makes the next repro loggable.
- Ensure the `hasError` branch in both chat components renders a friendly message mentioning the old-community caveat: "This community's chat isn't hosted yet — chat is available on communities created after 2026-04-22."

**Files.** `src/components/community/chat/ChatTopicList.tsx`, `src/components/community/chat/ChatTopic.tsx`, `src/services/contracts/chatApi.ts`.

**Verification.** On a fresh community, topic creation + message send + poll refresh all work (two-tab test if you have two identities). On the existing "Bug Repro Community" (pre-2026-04-22), the chat route renders the friendly fallback card instead of throwing.

## Phase 2 — Feature completions (data from chain)

### 2.1 Stage-accurate mandate count in Communities list

**Current.** [Communities.tsx:162](src/components/identity/Communities.tsx:162): `mandateCount = collaborations.filter(c => c.type === 'initiative').length` — counts *all* initiatives.

**Change.** Count only initiatives currently in the `mandate` stage. Reuse the `get_stage` fetch pattern from [StageFeedView.tsx:137-160](src/pages/StageFeedView.tsx:137).

**Approach.**
- Extend `communitiesSlice` with `initiativeStages: Record<string /*initiativeId*/, string /*stage*/>` plus a `fetchInitiativeStages` thunk that takes a list of initiativeIds.
- In `Communities.tsx`, dispatch the thunk once `communityCollaborations[id]` is populated, then compute mandateCount client-side.
- Fallback: if `get_stage` fails for an initiative (older contract), count it as "unknown" — exclude from mandate tally.

**Files.** `src/store/slices/communitiesSlice.ts`, `src/components/identity/Communities.tsx`.

**Verification.** Preview: on the freshly-created test community, advance an initiative through to mandate — confirm the community card's "mandate" count increments accordingly; other initiatives not in mandate stage don't contribute.

### 2.2 Top-3 carry-over from Proposals → Vote

**Current.** `QVFlow` reads its own proposals via `qvApi.getProposals`; there's no linkage to the approval-stage outcome.

**Change.** When rendering the QV vote on an initiative, fetch approval counts from the proposals-stage sub-contract, rank, take top 3, and seed them into the QV list. Old communities: if the approval contract is missing or empty, fall back to QV's existing proposal list.

**Approach.**
- Add `getTopApprovals(serverUrl, publicKey, approvalContractId, limit)` to `approvalApi.ts` — wraps `get_approval_counts` + sort-slice.
- In `QVFlow`, accept an optional `approvalContractId` prop. Resolve it via `resolveInitiativeStageContract(parent, 'proposalsContractId')` before first render.
- If approvalContractId resolves: load top 3, use as authoritative proposal set. Otherwise keep current behavior.
- `InitiativeDashboard` and `StageFeedView` pass the parent initiativeId as before; the resolve happens inside QVFlow.

**Files.** `src/components/collaboration/flows/voting/QVFlow.tsx`, `src/components/collaboration/flows/voting/qvApi.ts`, `src/components/collaboration/flows/voting/approvalApi.ts`.

**Verification.** On a fresh initiative: submit 5 proposals, approve them in varying counts, advance to vote, confirm QVFlow lists only the top 3 by approval count.

### 2.3 Completed stage metrics in InitiativeDashboard

**Current.** Only the problem-stage up/down tally renders for completed stages ([InitiativeDashboard.tsx:262-275](src/components/collaboration/InitiativeDashboard.tsx:262)). Discussion / proposals / vote show "Completed" badges without content.

**Change.** For each completed stage show a compact 1-line summary:
- Problem: "X upvotes / Y downvotes" (already present — keep)
- Discussion: "N participants contributed"
- Proposals: "M proposals, top approved: {title} ({approvals} approvals)"
- Vote: "Winner: {title} ({totalCredits} credits)"

**Approach.**
- Create `src/components/collaboration/flows/shared/stageMetrics.ts` with one function per stage: `fetchProblemSummary`, `fetchDiscussionSummary`, `fetchProposalsSummary`, `fetchVoteSummary`. Each resolves the sub-contract via `resolveInitiativeStageContract` and returns a compact summary object.
- Each returns `null` on missing-contract / old-community cases so the UI gracefully hides that line.
- In `InitiativeDashboard`, a single `useEffect` fires `Promise.allSettled` across the four functions when stage is known; results populate local state.
- Render summaries inline in the "completed" section of each stage card.

**Two new contract methods (fresh-communities only):**
- `discussion_contract.py`: `get_participant_count()` — returns count of unique authors. Current workaround: client fetches `get_comments()` and counts. Add the method for new communities; client uses workaround for old ones (detect via try/catch).
- `qv_contract.py`: `get_winner()` — returns `{ proposalId, totalCredits }` for the highest-credit proposal. Workaround: client parses `get_results()` (already exposed).

**Files.**
- `src/assets/contracts/discussion_contract.py` (add one method)
- `src/assets/contracts/qv_contract.py` (add one method)
- `src/components/collaboration/flows/shared/stageMetrics.ts` (new)
- `src/components/collaboration/InitiativeDashboard.tsx` (render wiring)

**Verification.** Advance an initiative through all five stages on a fresh community. After each stage completes, its card should show the metric line. Old community: problem tally still shows; discussion/proposals/vote show "Completed" without a summary line — no errors.

### 2.4 ConvictionStaking polish

**Current.** [ConvictionStaking.tsx](src/components/collaboration/flows/voting/ConvictionStaking.tsx) displays staking form, user's active stake, community conviction totals, and country breakdown. All data sourced from `conviction_contract`.

**Change.** Pure UI polish — no new data, no new methods.
- Elevate "your conviction" with a highlight border / accent color so it's obviously distinct from "community total".
- Show "your share: X%" next to the user's stake (compute client-side from existing totals).
- Add country flag emojis to the country-breakdown bars (already available via [utils/countries.ts](src/utils/countries.ts)).
- If `compact` prop is set (used by StageFeedView mandate cards), keep the layout dense; the elevation is only for the full-size dashboard layout.

**Files.** `src/components/collaboration/flows/voting/ConvictionStaking.tsx`, `src/components/collaboration/flows/voting/ConvictionStaking.module.scss`.

**Verification.** Visual review on the dashboard and on the stage feed. Contract behavior unchanged.

## Phase 3 — Copy / polish

### 3.1 UI_TASKS #8 — Currency explainer expansion

**Current.** [Currency.tsx:165-169](src/components/community/Currency.tsx:165) has a 2-sentence explainer. Card styling already matches the app pattern.

**Change.**
- Expand the explainer to three short paragraphs: what the currency is, how it's governed (median mint/burn voting), and what members can do with it (send, allocate).
- Extract a `.card` SCSS mixin shared between `.balanceCard` and `.actionCard` in `Currency.module.scss` to remove the duplicated block.

**Files.** `src/components/community/Currency.tsx`, `src/components/community/Currency.module.scss`.

**Verification.** Visual. Ensure dark-mode still works.

## Non-items (already done)

Both were on the original UI_TASKS list but research confirms they're already correct in current HEAD:

- **UI_TASKS #3 — inline community nav.** [CommunityView.tsx:441-485](src/pages/CommunityView.tsx:441) renders the nav inline between header and body. Global StageFooter is already suppressed on community routes via [StageFooter.tsx:19](src/components/shared/StageFooter.tsx:19). Nothing to change.
- **UI_TASKS #7 — single-column communities list.** [Communities.module.scss:50-52](src/components/identity/Communities.module.scss:50) sets `display: flex; flex-direction: column;`. Cards already show name, description (2-line clamp), createdDate, memberCount, mandateCount. Nothing to change.

The plan records this so the tasks can be closed without re-investigation next session.

## Rollout order + commits

One commit per sub-task, roughly in listed order. Rough sequencing:

1. `fix(create-community): surface deploy errors in UI` — Phase 1.1
2. `fix(collab): local ErrorBoundary + stale-flow fallback card` — Phase 1.2
3. `fix(chat): gate polling on resolved contract + friendly old-community message` — Phase 1.3
4. `feat(communities): stage-accurate mandate count` — Phase 2.1
5. `feat(qv): top-3 approved proposals carry-over from approval stage` — Phase 2.2
6. `feat(dashboard): completed-stage metric summaries` — Phase 2.3 (contract bumps included)
7. `style(conviction): highlight user share + country flags` — Phase 2.4
8. `docs(currency): expand explainer, dedupe card styles` — Phase 3.1

Each commit is pushed to `eston/dev` individually so any regression is easy to bisect. The contract bump in step 6 is immutable — only fresh communities pick it up, which is the expected behavior and matches A.3's pattern.

## Global verification per phase

- `npx tsc -b --noEmit` — after each commit, must be clean.
- `npm run build` — after each commit, must succeed.
- Preview server: walk the affected flow against `gdi.gloki.contact` with real contract calls.
- Console/network: no unhandled errors; expected 404s / method-not-found responses from old contracts fall through to fallback paths silently.
- Two-user cross-session verification stays Eston's job (same as for A.3).

## Known gotchas carried forward

- Old communities (pre-2026-04-22) can't host Chat/Discussion sub-contracts. Phase 1.3's friendly message explicitly covers this.
- Old communities also lack `record_activity`/`get_active_members` (added in A.3). Phase 2.1's mandate count doesn't touch that path; Phase 2.3's metrics call different sub-contracts so no overlap.
- `chat_contract.get_messages` is O(N); not addressed in this plan. Flag for a later pass if community sizes grow.
- Modification Suggestions `originalAuthor` still isn't wired from the initiative contract. Out of scope here; leave as-is.

## What's explicitly NOT in this plan

- Test framework introduction — per CLAUDE.md, verification stays manual.
- Active-member expiry UX (showing who's active / when last seen) — not requested.
- Auth / onboarding flow changes.
- Any touch to already-deployed contracts beyond additive method changes on fresh deploys.
- Kennedy's specific bug report — Phase 1.1 improves the diagnosis path; the actual underlying deploy failure (if any) requires her repro once the error surfaces. Not something to guess-fix.
