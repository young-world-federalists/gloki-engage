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

- **New proposal fields added** (all optional, backward-compatible):
  - `commitments: string[]`
  - `co_authors: string[]` (stored as `coAuthors`)
  - `expertReviewRequests: string[]` (public keys of requesters)
  - `expertReviews: { expert: string; metrics: string[]; note?: string; timestamp: number }[]`
  - `mergeSuggestions: { target: string; suggester: string; timestamp: number }[]`

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

### Conviction / backing (`demoContracts/conviction.ts`) — documented S33

**This subsystem was missing from this doc entirely** (it predates it). Full surface,
including the two methods S33 adds. Resolved in **shared mode** from the initiative
contract: `initiative.get_stage_contract { stage_key: 'convictionContractId' }`.
Client wrappers live in `src/components/collaboration/flows/voting/convictionApi.ts`.

Stake record shape: `{ amount, duration, timestamp, country, voter }`.
`duration` is one of `1w | 1m | 3m | 6m | 1y`, with weights **1 / 2 / 4 / 7 / 12**.

Reads:

- `get_my_stake` (no args) → the caller's stake record, or `null`.
- `get_stakes` (no args) → `{ [voter]: stake }`.
- `get_total_conviction` (no args) → `{ total, count }` — `total` sums
  `amount × durationWeight`; `count` is the number of backers.
- `get_conviction_by_country` (no args) → `{ [ISO-alpha-2]: weight }`.

Writes:

- `stake` (`{ amount, duration, country }`) — creates the caller's backing.
  **The UI always sends `amount: 1`**: conviction here is *time-only*, so the
  duration weight is the entire weight and support can never be wealth-weighted
  (this is what keeps it consistent with the locked one-person-one-vote decision).
  ⚠️ The stub currently *adds* to `amount` when a stake already exists; the UI no
  longer reaches that path (it routes changes through `update_stake`), but **the
  real contract should reject a second `stake` from the same caller** rather than
  accumulate.
- `update_stake` (`{ duration, country }`) — **new in S33.** Changes the caller's
  duration and nothing else; the amount is never touched, so re-committing cannot
  inflate one person's weight. Returns `{ error }` if the caller has no stake.
  **Timestamp rule the real contract must mirror:** lengthening the commitment
  *preserves* the original `timestamp` (the backing record stands); shortening it
  *resets* `timestamp` to now. This is the honest analogue of time-accrual — a long
  record cannot be harvested and then quietly downgraded.
- `withdraw_stake` (no args) — **new in S33.** Removes the caller's stake. Returns
  `{ error }` if there is none.

**Auth the real contract must enforce:** all three writes act on `caller` only — a
caller must never be able to create, change, or withdraw another key's backing.

**Two UI surfaces, one contract.** `MandateStage` (community page / stage feed) and
`MandateBacking` (the published mandate page, S33) both mount `ConvictionStaking`
with the same `instanceId`/`parentContractId`/`stageKey` triple, because the mandate
route's `:mandateId` IS the initiative contract id. They are the same contract, not
two copies — backing on one surface must show on the other.
