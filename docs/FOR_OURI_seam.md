# FOR OURI — Contract Seam Hand-off

This is the single source of truth for the backend contract work the `ui` branch
relies on. The UI is built against the `src/services/demo/` stub layer; every
method/field below is implemented as a permissive demo stub today and must be
backed by a real Python contract when `ui` → `new-features` → `main`.

## The one rule that must not break

UI contract **method names and field names MUST match Ouri's real contract
exactly** — `add_proposal`/`proposal_id`/`get_results`/`get_proposals` etc. The
words "solution" and "mandate" are **presentation vocabulary only**; the wire
names stay `proposal`. (e.g. the add-solution popup calls `add_proposal`.)

## Seam methods & fields by stage

### S2 — Discussion (`demoContracts/discussion.ts`)

- **`like_comment(comment_id)`** — 1p1v toggle. Appends the caller's public key
  to the comment's `likes` list if not present; removes it if already there
  (dedup). Surfaces "top" replies in the UI. Does **NOT** gate stage advancement
  in any way; purely advisory signal.

### S3 — Write Together (`demoContracts/discussion.ts`, `demoContracts/approval.ts`)

- **`set_statement(title, body)`** — initialises a co-owned draft with the
  caller as sole co-author (`coAuthors: [caller]`). Used once when a draft is
  created; subsequent fold-ins via `support_edit` extend `coAuthors`. Stored on
  the discussion sub-contract's `statement` field.
- **`add_proposal` gains optional `co_authors`** (string list) — credited
  co-authors carried from a co-owned draft into the approval/solutions contract.
  Stored on the proposal as `coAuthors`.

> **Production note:** the `wtdraft_<id>` JSON draft registry is stored as a
> community property in the stub (`demoState`). Production should use a
> **dedicated draft-registry contract**, not community props, so drafts are
> portable across community members.

### S4 — Solutions + commitments/metrics spine (`demoContracts/approval.ts`)

- **`add_proposal(..., commitments?)`** — `add_proposal` gains an optional
  `commitments` string list (the stub caps it at 3 items × 280 chars; ≥1 is
  enforced in the UI, not the contract). The winning proposal's commitments
  become the Mandate's "What we commit to" (S6). Stored as `proposal.commitments`.

- **`request_expert_review(proposal_id)`** — 1p1v toggle. Appends/removes the
  caller's public key from `proposal.expertReviewRequests`. Signals the Gloki
  Team narratively to solicit experts; does **NOT** mark the solution as
  expert-reviewed.

- **`add_expert_review(proposal_id, metrics, note?)`** — an expert attaches
  success metrics ("how we'll know it's working") to a solution. `metrics` is a
  string list (up to 5 items × 280 chars); `note` is an optional short text.
  The winning proposal's `expertReviews[].metrics` become the Mandate's "How
  we'll know it's working" (S6). One review per expert per proposal — **upsert**
  (re-submitting replaces the prior entry). **The real contract MUST gate this on
  the caller holding the expert role.** The demo stub is permissive.

- **`suggest_proposal_merge(source_id, target_id)`** — advisory suggest-only;
  never auto-merges. Records the suggestion on `source_proposal.mergeSuggestions`
  pointing at `target_id`. Idempotent per `{suggester, target}` pair.

- **`decide_merge_suggestion(source_id, target_id, decision)`** — **new in S33.**
  `decision` is `'accepted' | 'declined'`. Sets `decision` on the matching entry in
  `source_proposal.mergeSuggestions`, and on accept sets `source_proposal.mergedInto
  = target_id`. **The real contract MUST gate this on `caller === source_proposal.author`**
  — the suggestion asks to fold the caller's own solution into someone else's, so
  only its author may answer. The demo stub enforces this (it is the one demo
  handler that does), but the server must not rely on the client.
  Deliberately does **not** move approval counts: folding tallies is a governance
  change, not a display one.
  *Context:* before S33 `suggest_proposal_merge` was write-only — stored by the
  contract and read by no UI at all, so the author it was addressed to could never
  learn it existed. This method plus `SolutionAuthorPanel` closes that loop.

- **New proposal fields added** (all optional, backward-compatible):
  - `commitments: string[]`
  - `co_authors: string[]` (stored as `coAuthors`)
  - `expertReviewRequests: string[]` (public keys of requesters)
  - `expertReviews: { expert: string; metrics: string[]; note?: string; timestamp: number }[]`
  - `mergeSuggestions: { target: string; suggester: string; timestamp: number; decision?: 'accepted' | 'declined' }[]`
  - `mergedInto?: string` (S33 — set when the author accepts a merge suggestion)

### S5 — Vote (`src/components/collaboration/flows/voting/QVFlow.tsx`)

- **Vote lock is derived client-side** from a non-empty `get_my_allocation`
  response. If the caller has already allocated credits (voted), the UI
  hard-locks the ballot — no toggle, no un-vote. **No new contract method or
  state is required** on the QV contract for this.
- The 75% community-turnout footer figure is also a client-side derivation
  (voters ÷ `communityMemberCount`). Not a contract method.
- The vote card **reads** the approval (proposals) contract to display
  commitments/metrics on the ballot — it **never writes** to it.

### S6 — Mandate consume (`src/hooks/useMandate.ts`, `src/components/mandate/MandatePage.tsx`)

- **Read path only — no new contract methods.** `useMandate` calls:
  - `qv.get_results` — to identify the winner (highest QV score)
  - `approval.get_proposals` — to fetch the winning proposal's `commitments` and
    `expertReviews[].metrics`
- The winning proposal's `commitments` map to mandate **articles** ("What we
  commit to"); its `expertReviews[].metrics` map to mandate **indicators** ("How
  we'll know it's working"). Falls back to the hand-authored fixture when no
  spine exists (graceful degradation).
- **Route note:** the `:mandateId` URL parameter IS the initiative contract id —
  the same id the vote card uses. The derivation resolves both contracts from
  that single id.

### 1:1 DM (`src/components/collaboration/SuggestionDmView.tsx`)

- The "suggestion to the author" DM reuses the flat chat contract (`chatApi`) as
  a **private per-requester contract** deployed via `useFlowContract` in per-user
  mode. In the single-user demo the author is a seeded persona (one-way).
- **Production:** implement as a real 1:1 contract keyed by the **unordered
  `{author, requester}` pair** so both parties see the same thread regardless of
  who opens it first.

### S13 addendum — initiative property bag (`demoContracts/initiative.ts`)

Added in S13 for mandate ratification, previously missing from this doc:

- `get_properties` (read, no args) → the initiative's string-keyed property map.
- `set_property` (write, `{ key, value }`) → upserts one property. The stub is
  permissive; **the real contract must gate this to the initiative host /
  authorised experts** (it stores ratification decisions).
- Property in use: **`mandate_ratification`** — a JSON string written/read by
  `src/services/mandateRatification.ts` (indicator targets/baselines/cadence,
  ratification state for the RatificationPanel).

### S16 addendum — Discussion pill (read-only, no new methods)

The per-initiative Discussion button (`src/components/initiative/DiscussionPill.tsx`)
only READS: `initiative.get_stage_contract { stage_key: 'discussionContractId' }`,
then `discussion.get_comments` for the live count. It never deploys or writes —
the discussion page itself remains the deploy-on-intent surface. No contract work
needed beyond what already exists.

### Conviction / backing (`demoContracts/conviction.ts`) — S33 + S40 handoff

**This subsystem was missing from this doc entirely** (it predates it). Full surface,
including the two methods S33 adds. Resolved in **shared mode** from the initiative
contract: `initiative.get_stage_contract { stage_key: 'convictionContractId' }`.
Client wrappers live in `src/components/collaboration/flows/voting/convictionApi.ts`.

#### S40 addendum — time-accrued strength

The server target is `server-side/src/assets/contracts/gloki_engage_initiative_contract.py`.
Its conviction block was re-verified against the current `origin/server-side` baseline
`a81218f` on 2026-09-16. Ouri has **not** yet applied S40. The complete replacement block
is in `docs/contracts/s40-conviction-accrual.py`.

All public method names and argument lists remain exactly as documented in S33; S40 only
tightens `stake` validation and adds derived fields/semantics to the existing reads.

Stake record shape: `{ amount, duration, timestamp, country, voter }`.
`duration` is one of `1w | 1m | 3m | 6m | 1y`, with maximum strengths
**1 / 2 / 4 / 7 / 12**.

Reads:

- `get_my_stake` (no args) → the caller's stake record plus additive `weight`, or
  `null`. `weight` is derived for the response only; it is never persisted.
- `get_stakes` (no args) → `{ [voter]: stake }`.
- `get_total_conviction` (no args) →
  `{ total, count, model: 'time_accrual_v1' }`. `model` is additive and is the UI's
  compatibility signal; `count` is the number of backers.
- `get_conviction_by_country` (no args) → `{ [ISO-alpha-2]: weight }`.

All strength reads use the same formula:

```text
cap = {1w: 1, 1m: 2, 3m: 4, 6m: 7, 1y: 12}[duration]
strength = min(cap, 1 + max(0, elapsed_seconds) / (30 * 24 * 60 * 60))
```

Missing/invalid/future timestamps safely return strength `1`. Totals and country
breakdowns sum this strength directly and never multiply by stored `amount`.

Writes:

- `stake` (`{ amount, duration, country }`) — creates the caller's backing.
  The contract must require **exactly** `amount == 1`; any other value returns
  `{ error: 'Stake amount must be exactly 1' }`. Conviction is time-only and support
  can never be wealth-weighted.
  **Rejects a second `stake` from the same caller** (`{ error: 'Already backing —
  use update_stake' }`). It previously *added* to the existing amount, which made
  one-person-one-commitment depend on the client having read `get_my_stake` first
  — a failed read silently doubled the caller's weight. The real contract must
  reject it server-side too.
- `update_stake` (`{ duration, country }`) — **new in S33.** Changes the caller's
  duration and nothing else; the amount is never touched, so re-committing cannot
  inflate one person's weight. Returns `{ error }` if the caller has no stake.
  **Timestamp handling:** changing to an equal or longer commitment preserves the
  original `timestamp`; shortening resets it to now, so current strength returns to
  `1`. With S40 the timestamp is authoritative input to strength, not display-only
  metadata.
- `withdraw_stake` (no args) — **new in S33.** Removes the caller's stake. Returns
  `{ error }` if there is none.

**Auth the real contract must enforce:** all three writes act on `caller` only — a
caller must never be able to create, change, or withdraw another key's backing.

**Deployment compatibility.** Initiative contracts are immutable after deployment.
`global-v20` only resets UI demo fixtures; it is not a server migration. Newly
deployed contracts containing the S40 replacement report `model: 'time_accrual_v1'`.
Existing contracts omit `model` and remain legacy instant-strength contracts. The UI
detects that absence, retains usable controls and totals, and states that the chosen
strength applies immediately instead of making a false accrual claim.

**Two UI surfaces, one contract.** `MandateStage` (community page / stage feed) and
`MandateBacking` (the published mandate page, S33) both mount `ConvictionStaking`
with the same `instanceId`/`parentContractId`/`stageKey` triple, because the mandate
route's `:mandateId` IS the initiative contract id. They are the same contract, not
two copies — backing on one surface must show on the other.

### S35 addendum — Causes, discussion status, impact assessment (`docs/contracts/s34-initiative-contract-additions.py`)

Wire truth for these methods is the patch file above (apply to `gloki_engage_initiative_contract.py` on `server-side`). Rulings: `docs/superpowers/specs/2026-09-02-s34-decision-record.md`.

- **`__init__` first:** add `self.comment_votes = Storage('comment_votes')` and `self.impact_assessments = Storage('impact_assessments')` to `GlokiEngageInitiative.__init__`. The other four methods raise `AttributeError` on first call without them.
- **`vote_comment(comment_id, direction)`** — `'up' | 'down' | 'none'`; ROOT comments only (the contract returns without writing when the comment has a `parentId`). Storage: flat `comment_votes` collection keyed `caller + ':' + comment_id` → `{voter, commentId, direction}`. Read: **`get_comment_votes()`**. Ranking (top 15 / top 5) and the five-band discussion status are computed client-side from this read; no status method on chain. Votes on soft-deleted roots are also refused.
- **`add_proposal(..., cause_id='')`** — trailing optional arg, stored as `causeId`; immutable; `''` means "proposed before any cause was ranked". The UI sends `cause_id` unconditionally from this merge onward — apply the `add_proposal` hunk in the same change as the merge, or solution submission fails on the live site.
- **`add_impact_assessment(proposal_id, target, targets_cause, mechanism, broader_effects, risks, opportunity_costs, time_horizon)`** — flat `impact_assessments` collection keyed `proposal_id + ':' + caller`; contract guards: proposal exists, max 3 per proposal, one per author. Read: **`get_impact_assessments()`**.
- **D12 (on the record):** assessor eligibility (top-10 writers, `causeScore > 0`, no self-dealing on the same solution or the same cause) and cause alignment are **UI-gated only** in this wave, exactly like the `add_expert_review` expert gate. Server-side eligibility checks belong on the contract roadmap.
- S13 property bag is documented in the S13 addendum above: `set_property` / `get_properties` on
  the initiative contract, including the `mandate_ratification` property in use.
- **Question for Ouri (not a patch change):** `vote_comment` and `add_impact_assessment` guard with `if <id> not in self.comments / self.proposals`, the same form as the live `delete_comment`, `like_comment`, `request_expert_review` and `add_expert_review`. If the storage bridge's `Collection.__contains__` does not coerce a hex string to an `ObjectId` on an `append()`-keyed collection, all of these — old and new — refuse silently. Please confirm on a live community; if it bites, the one-word fix for all six is `self.comments[comment_id].exists()`.

### S36 addendum — Community verification, Wave 1 (`src/services/verification.ts`)

Verification is **platform-wide on the Digital Agent** (S34 D8), not per community. The UI's seam is
`src/services/verification.ts`; today it delegates to a localStorage demo module
(`src/services/demo/verificationDemo.ts`). Neither `digital_agent_contract.py` nor
`gloki_engage_community_contract.py` has these methods yet — they are what the real layer needs:

- **`request_vouch(public_key)`** — the caller asks `public_key` to vouch for them. Creates a pending
  request addressed to `public_key`. UI: `requestVouch(ctx, approverKey)`.
- **`vouch(public_key, method)`** — the caller vouches for `public_key`. `method` is one of
  `direct | call | invitation | daily` (Wave 1 only ever sends `direct`; `call`/`daily` arrive with
  Waves 2–3). Settles any pending request from `public_key` to the caller as approved. UI:
  `respondToRequest(ctx, requestId, true)`. **The real contract must record the vouch as BY THE CALLER
  only — no key may vouch on another's behalf.** One vouch per (voucher, vouchee) pair; re-vouching is
  a no-op.
- **`decline_vouch(public_key)`** — settles the pending request from `public_key` as declined. UI:
  `respondToRequest(ctx, requestId, false)`.
- **`get_vouches()`** (read) → `{ approvals: [{ approver, method, at }], pending: [{ id, requester, at }],
  sent: [{ id, approver, at, status }] }` — vouches the caller holds, requests waiting on the caller, and
  the caller's own requests. UI: `getVerificationState(ctx)`. The UI derives Verified as
  `approvals.length >= 4` (`VERIFIED_THRESHOLD`, locked at Batch 4). Only verified members should
  receive requests; the demo hides `pending` below the threshold — the contract may enforce it.
- **Invitations** (`sendInvitation`, `requestInvitation`) are off-platform (email) and need no contract
  method; the demo records them locally and sends nothing.
- **`listVerifiedMembers(query)`** (read) — the directory a newcomer picks approvers from. No contract
  method exists for this yet: the demo serves a 30-person fixture. The real layer needs a platform-wide
  read of verified members (proposed **`list_verified_members(query)`** on the Digital Agent side, or a
  union of community member lists filtered to `approvals.length >= 4`) — until one exists this call
  stays fixture-backed.
- **Request ids vs public keys:** the UI's `respondToRequest(ctx, requestId, approve)` carries the
  request's id; `vouch` / `decline_vouch` take the requester's `public_key`. The seam resolves
  `requestId → requester` from `get_vouches().pending` before calling either — one extra read, no
  change to the method surface.
- **Demo-only, not for production:** the four simulated outcomes (`declines` flags in
  `src/services/demo/fixtures/verification.ts`) and the dev scenario switcher.

### S37 addendum — Verification call, Wave 2 (`src/services/verification.ts`, `src/services/demo/verificationSim.ts`)

The verification call (S37 spec §3–4) is a **UI simulation with no contract counterpart** — an
in-memory `CallSession` (`src/services/demo/verificationSim.ts`) that dies with the tab, with no
localStorage and no fixture edit either. I4 (§8 above) says every seam function gets a wire-name
row even when the row is "none needed"; this addendum is that row, times eight, specifically so
nothing here gets invented later:

- **`inviteToCall(ctx, verifierKeys)`** — simulation only, no contract method.
- **`availableVerifiers(ctx, excludeKeys)`** — simulation only, no contract method.
- **`joinCallStream(sessionId, onUpdate)`** — simulation only, no contract method.
- **`startCall(ctx, sessionId)`** — simulation only, no contract method.
- **`verifyInCall(ctx, sessionId, verifierKey)`** — simulation only, no contract method of its
  own (see below for its one durable effect).
- **`leaveCall(ctx, sessionId)`** — simulation only, no contract method.
- **`pendingCandidate(ctx)`** — simulation only, no contract method.
- **`joinAsVerifier(ctx)`** — simulation only, no contract method. The C1 amendment: an eighth
  seam function, added because `inviteToCall` assumes the caller is the candidate and the
  verifier role (E6) inverts that — no signature above `pendingCandidate` could express it.

**The one durable effect.** Every in-call verification (`verifyInCall`) calls
`addUserVouch(verifierKey, { method: 'call', at })` — the same Digital Agent write the
request/approve path uses, through the same **`vouch(public_key, method)`** the S36 addendum
above already documents, with `method: 'call'` (an accepted value already, not a new one).
Subject to the same rule as every other vouch: **the vouch is always BY THE CALLER.** Concretely
here, that means it lands on the session's candidate only when the candidate IS the local user
(the normal candidate-role call); a verified user verifying a fixture candidate (`joinAsVerifier`)
never banks anything onto their own agent — there is nothing on the other end of that vouch to
receive it, since the fixture candidate has no persistent store in this demo.

**Do not add `start_call` / `join_call` (or any call-lifecycle method) to the contract.** A call
session is UI-only and disposable by design; the only thing a real call needs to leave behind is
the vouch, and `vouch(public_key, 'call')` already covers it. This row exists specifically to stop
that method from being invented by a future session that sees eight new seam functions and assumes
one of them needs a wire counterpart.

### S38 addendum — Daily verification session, Wave 3

The 21:00 UTC daily session is also an in-memory UI simulation. Every public
daily seam function has **no contract counterpart**:

- `dailySessionState(ctx)` — simulation only.
- `joinDailyStream(id, onUpdate)` — simulation-only subscription.
- `joinDaily(ctx, id)` — simulation-only opt-in.
- `selectVerifiers(ctx, id)` — simulation-only deterministic assignment.
- `enterDailyCall(ctx, id)` — simulation-only child-call creation.
- `finishDailyCall(ctx, id)` — simulation-only result snapshot and cleanup.
- `setDailyReminder(ctx, id, enabled)` — tab-only demo preference. As of S39 it schedules or
  cancels an in-app notification while this tab remains open; see the S39 addendum below.
- `leaveDaily(ctx, id)` — simulation-only cleanup.

**Do not add `join_daily`, `select_verifiers`, or any session-lifecycle method.**
The one durable effect uses the existing `vouch(public_key, method)` method
with `method: 'daily'`, always by the verifier/caller for the candidate. The
demo's schedule, roster, assignments, local result count, reminder and dev
clock have no production wire meaning.

### S39 addendum — Notification centre and authenticated simulation lifecycle

The notification centre adds **no contract method and no browser/OS notification**. Every function
below has wire method **none — simulation/UI lifecycle only**. The owner is always the authenticated
`{ serverUrl, publicKey }` pair; the demo store persists at most 100 sanitized rows under that scope.

- `publishNotification(owner, event)` — owner-guarded stable-id upsert into the active Redux/storage
  scope. Wire method: **none — simulation/UI lifecycle only**.
- `updateNotificationEvent(owner, id, status, payload?)` — owner-guarded transition to `active`,
  `consumed` or `expired`. Wire method: **none — simulation/UI lifecycle only**.
- `startNotificationRuntime(owner)` — starts the authenticated W1/W2 producer lifecycle and returns
  its cleanup. `startDemoNotificationRuntime(owner)` is the demo implementation. Wire method:
  **none — simulation/UI lifecycle only**.
- `recordMergeAbsorbed(owner, input)` — records the UI event after the existing merge workflow
  succeeds. It adds no merge or notification contract call. Wire method:
  **none — simulation/UI lifecycle only**.
- `simOfferCallInvite(owner)`, `simExpireCallOffers(owner)`, `simRestoreCallOffers(owner)` and
  `simForgetExpiredCallOffers(owner)` — create and reconcile one stable daily call-offer event for
  the active owner, including React StrictMode restoration. Wire method:
  **none — simulation/UI lifecycle only**.
- `scheduleDemoDailyReminder(owner, { dayKey, joinOpensAt })` and
  `cancelDemoDailyReminder(owner, dayKey)` — schedule/cancel the off-route, tab-lifetime in-app
  reminder. Reload, tab closure, logout or owner change cancels it. Wire method:
  **none — simulation/UI lifecycle only**.
- `simDailySessionState(owner)`, `simSelectVerifiers(owner, id)`,
  `simFinishDailyCall(owner, id)` and `simLeaveDaily(owner, id)` now publish or expire the stable
  W3 reminder/selection/thank-you event family. The public daily seam names remain the S38 names.
  Wire method: **none — simulation/UI lifecycle only**.

**What a real notification system still needs.** Authenticated recipient routing must happen on the
server, with stable server event ids, replay/cursor semantics, strict account isolation and delivery
while the notifications route is not mounted. This UI-only tab runtime proves the product lifecycle;
it is not that backend. **Do not invent `create_notification`, `schedule_reminder`, `join_daily`,
`select_verifiers`, or any call/session lifecycle wire method.** Existing durable domain writes stay
on their documented methods (`vouch`, merge methods, and so on); notifications describe those events
but do not replace them.

### 2026-09-25 addendum — Initiative ballot guards (`docs/contracts/2026-09-25-initiative-ballot-guards.py`)

The live `gloki_engage_initiative_contract.py` enforces none of the ballot rules the UI enforces
(re-verified 2026-09-25 on `origin/server-side` @ `d930a9e`, byte-identical to `3b563fa`). Any identity
key can move the stage, rewrite the text, change the budget, flip the vote's status flag (which nothing
reads), or `allocate` any number of credits. Because `get_results` sums √credits per voter, one caller
with 10,000 credits casts 100 votes, as many as ten rule-following voters together. A write sends its
identity key in the URL with no signature (`/ibc/app/<key>/<contract>/<method>?action=contract_write`),
so all of this takes nothing but curl, and any non-UI client (an MCP server, a bot) inherits none of
the UI's gates.

**Rulings (Eston, 2026-09-25).**
- **R1:** `set_stage` and `set_details` are open to the initiative's author or a co-author only (the
  UI's `isAuthorOrCoAuthor`). `add_co_author` gets the same guard; otherwise any key could make itself
  a co-author and pass the rest.
- **R2:** after creation, `set_details` changes the text only in the Problem stage.
- **R3:** `set_credits` / `set_status` are fixed at 100 credits per voter, and the vote is open exactly
  while the stage is `vote`.
- **R4:** one final ballot per person.
- Beyond R1–R4, and matching what the UI and the demo stub already do: `set_stage` only accepts the
  next stage in order, and `remove_vote` closes with `upvote` / `downvote`.

**How to apply it:**
- Add four private helpers and replace ten methods, as listed in the patch header.
- No imports, no new `Storage()` entry, no `__init__` change, no signature change.
- The only builtin used is `str()`, which the contract already relies on (`get_proposals`). The type
  checks avoid `isinstance` / `int` / `dict` on purpose, since those are unconfirmed in the sandbox and
  a missing name would stop every ballot.
- The patch shares no method with the S34 or S40 patches, so the three apply in any order.
- Every refusal returns `{'error': …}` and writes nothing (the `stake` convention); success returns
  `None`.
- Refusal strings reuse the demo stubs' wording wherever the rule is the same.

Each guard, and what the UI does with its refusal today:

- **`set_details`.** Creation is unchanged: with no `details` yet, the first writer becomes `author`.
  After that the caller must be the author or a co-author (`'Only the author or a co-author can edit
  this initiative'`), and the stage must be `problem` (`'The initiative text is frozen after the
  Problem stage'`). *UI:* the UI calls it only at creation (`createInitiativeOnChain` on
  `server-side`, `createInitiative` in `src/services/contracts/community.ts` for the demo), and there
  is no edit screen, so in normal use it never meets this refusal. The exception is the creation race
  under the gaps below: `createInitiativeOnChain` ignores the refusal and publishes the initiative
  anyway.
- **`set_stage`.** The caller must be the author or a co-author (`'Only the author or a co-author can
  advance the stage'`), and the stage id must be known (`'Invalid stage'`). The stage may advance only
  one step along `problem → discussion → proposals → vote → mandate` (`'Stages can only advance one
  step at a time'`), the same order and messages as the demo stub. *UI:* `StageAdvanceBar` and
  `InitiativeStagePanel` only offer an author or co-author a one-step advance, so only a race (two
  co-authors clicking at once) or a stale view meets the refusal. **Neither component reads the write's result**, so
  the UI shows a refused advance as successful until the next fetch.
- **`add_co_author`.** The caller must be the author or a co-author (`'Only the author or a co-author
  can add a co-author'`). *UI:* both callers already run as author or co-author: accepting a
  modification suggestion, and accepting a merge *into* this initiative. Both treat a failure as
  non-fatal. Both flows need suggestion and merge-proposal methods the live initiative contract doesn't
  have, so today they only run in the demo.
- **`upvote` / `downvote` / `remove_vote`.** Allowed only in the `problem` stage (`'Problem voting is
  closed'`). `remove_vote` closes with the other two, so the tally that justified the advance can't
  change afterwards. *UI:* the vote control only mounts at `problem`, so only a stale view meets the
  refusal. `problemVoteApi` returns the
  result unchecked, and the optimistic tally corrects itself on the next fetch (a direct refetch on
  `ui`, the SSE-driven `useContractSync` on `server-side`).
- **`get_config`.** Now computed, never stored: `{credits_per_voter: 100, status: 'open' | 'closed'}`,
  with `'open'` only in the `vote` stage. The shape is unchanged and it is still a pure read. *UI:*
  QVFlow uses `credits_per_voter` as the heart pool (still 100); nothing reads `status`.
- **`set_credits` / `set_status`.** Always refused (`'The vote budget is fixed at 100 credits per
  voter'` / `'Voting opens and closes with the Vote stage'`). *UI:* nothing calls them; `qvApi`'s
  `setCredits` / `setStatus` are unused exports.
- **`allocate`.** Every rule, with its refusal:
  - The stage must be `vote`: `'Voting is not open'`.
  - The caller must have no earlier ballot: `'You have already voted'`.
  - The allocations must be a JSON object: `'Allocations must be an object'`.
  - Every key must be a proposal id as `get_proposals` returns it: `'Unknown proposal'`.
  - Every value must be a whole number ≥ 0, and JSON booleans are refused: `'Credits must be whole
    numbers'`.
  - Zero entries are dropped, and at least one entry must remain: `'Ballot is empty'`.
  - The total must be ≤ 100: `'Exceeds credit budget'`.

  *UI:* QVFlow sends one ballot, only at `vote`, with h² credits per solution and a total within the
  pool. It then locks ("votes can't be changed"). `qvApi`'s `throwIfContractError` turns a refusal into
  a thrown error, which QVFlow catches with **`console.error` only**: no message is shown and the
  ballot stays open.

**How this was checked.** A scratch harness (not committed) ran the live contract and the patched one
on the real `storage_interface.py`, with in-memory stand-ins for pymongo/bson. Every UI call sequence
above still succeeds, every exploit is refused with nothing written, and every read stays write-free
(76/76 checks). It passes 76/76 again when the contract code gets only the builtins production
contracts use (`len`, `range`, `round`, `str`). A control run with an `isinstance` check put back
fails there with `NameError`, so the restricted run does catch unconfirmed builtins. An independent
review found no way past R1–R4 for a caller using their own key, and no UI call that the patch
refuses.

**Please confirm (Ouri):** does the `contract_write` SSE event's `reply` carry the method's return
value? On `server-side`, `contractWrite` resolves with `event.reply` (`watchForChainAck` in
`eventStream.ts`). If `reply` is only an acknowledgement, the guards still hold, but the UI can't see
any refusal. The harness can't answer this.

**D1, answered by the bridge code.** In the in-repo `storage_interface.py`, `Collection.__contains__`
is `find_one({'_id': item})` and does not coerce a hex string to an `ObjectId`; `Document(...)` does
coerce. So `x in self.proposals` and `x in self.comments` are always False for an `append()` id, and
`allocate` instead checks ids against `str(key)` over `self.proposals` (the `get_proposals` pattern).

If the server runs this bridge, every live method that uses this test does nothing on every call
today. That is the four named in the S35 question (`delete_comment`, `like_comment`,
`request_expert_review`, `add_expert_review`), plus `suggest_proposal_merge` and
`decide_merge_suggestion`, which use the same test. S34's `vote_comment` and `add_impact_assessment`
will behave the same once applied. The `.exists()` fix given there applies to all eight; it is not part
of this patch.

**Deployment compatibility.** Each initiative contract keeps the source it was deployed with. Only
initiatives deployed by an updated client after this lands are guarded. Existing ones keep the open
methods, and so does anything a stale cached bundle deploys (see "The client supplies the contract
source" below). The UI needs no change for either generation, because every call it makes passes the
guards. The demo stubs are unchanged and stay permissive.

**Known remaining gaps (not in this patch):**
- **Voter eligibility.** The Members-only and Verified-only stage rules (`DEFAULT_STAGE_PERMISSIONS`,
  `src/services/trustModel.ts`) are enforced only in the UI. Membership lives on the community contract
  and verification on the Digital Agent. The authoritative trust root, the signature and key-custody
  model, and the protected-operation matrix are all part of the open **G2** decision in Eston's
  production web-of-trust record (`docs/superpowers/specs/2026-09-17-production-wot-decisions.md`).
  They are deliberately not designed here.
- **Identity keys are public, so the guards don't stop impersonation.** The guards check *which key*
  is calling, but the contract publishes the keys it checks:
  - `get_roles` returns the author and co-authors.
  - `get_votes`, `get_allocations` and `get_stakes` return every participant's key.
  - The community's initiative references carry the author's key as `agent`.

  A write sends its key in the URL with no signature, so anyone who reads a key can act as its holder.
  They can advance stages as the author, or cast a participant's ballot. R4 then makes that forged
  ballot final, and the real voter gets `'You have already voted'`. The guards still enforce the
  budget, the vote window and one ballot per key. Stopping a deliberate impersonator is the G2
  signature and key-custody decision.
- **Creation race.** Whoever calls `set_details` first becomes the author, and with it gets stage,
  text and co-author control. A new contract's id can be seen before the creator's `set_details`
  lands, because the author's `?action=get_contracts` lists it. `createInitiativeOnChain` ignores the
  `set_details` reply and calls `add_initiative` regardless, so an initiative whose race was lost still
  gets published. This survives G2.
  - UI fix: before `add_initiative`, check the reply, or check that `get_roles().author` is the caller.
  - Question for Ouri: can the runtime fix the author at deploy time? The deploy request already
    carries `pid`.
- **The client supplies the contract source.** The deploy request carries the code (a `?raw` import),
  and the community's `add_initiative` appends any object. So anyone can deploy the old unguarded
  source, or a modified one with invented results, and register it in any community. A stale cached
  bundle will also deploy the old source. Closing this needs the server to pin the initiative code
  (for example, with a hash allow-list), or the UI to check the code before listing an initiative.
- **Stage readiness is not enforced by the contract.** The member count lives on the community
  contract, so thresholds such as half the active members seconding before `problem` → `discussion`
  stay UI-only. Moving from `vote` to `mandate` has no readiness check even in the UI
  (`VoteActivityCard` passes none), although the ballot says "The vote completes when 75% of members
  have taken part". With R3, when voting ends is the author's call alone.
- **`allocate` accepts any stored proposal,** including merged ones and the unreviewed ones the
  ballot hides (QVFlow shows only expert-reviewed solutions once any exist). `useMandate` picks the
  winner from all results. This can't happen today, because reviews and merges don't work until the
  D1 fix, but it can once they do.
- **`mark_merged_into`** is still open to any key, so anyone can put a "merged into X" banner, linking
  to X, in front of an initiative's visitors. It can't be author-gated without changing the merge
  flow, because the *target's* author marks the *source*. It needs a flow decision (for example, the
  source's author confirms).
- **`endorse_expert`:** one endorsement, including a self-endorsement, adds a key to `experts`. Any
  future expert gate (such as `add_expert_review` above) is only as strong as this.
- **`add_proposal`, `approve` and `withdraw_approval`** have no stage check. A solution added during the
  vote can appear on the ballot, because the ballot falls back to all solutions when none is
  expert-reviewed.
- **Still open from earlier sections:** `add_expert_review` (needs an expert gate) and
  `decide_merge_suggestion` (needs an author gate) have no caller check on the live contract.
- **Future writers.** Any new method that writes the `details` or `roles` documents needs the same
  author/co-author guard, or it reopens R1.
- **Refusal codes.** Refusals are English strings with no stable code. The seam-wide convention is
  item 41 in §B of `docs/superpowers/specs/2026-09-06-s35-panel-verdict.md`.
