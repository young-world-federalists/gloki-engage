# S34 — Review of Ouri's `server-side` deploy + design/plan for "Causes, impact assessment, status pill" (Prompt 1) and "Community verification" (Prompt 2)

**Date:** 2026-09-02 · **Branch:** `ui` @ `101e4a3` (fast-forwarded to `origin/ui`) · **Status:** DESIGN LOCKED 2026-09-02 by the debate + Opus judge (Eston delegated; see §4 and `2026-09-02-s34-decision-record.md`). Eston may override any ruling. No code written yet; executable plan for Prompt 1: `docs/superpowers/plans/2026-09-02-prompt1-causes-impact-status.md`.

> How to read this: §1 is the review of what Ouri shipped. §2 and §3 are the designs for
> the two prompts, each broken into session-sized waves with the files, contract methods
> and fixtures each wave touches. §4 batches every product decision Eston needs to make.
> After §4 is answered, each wave gets its own executable plan in
> `docs/superpowers/plans/` (bite-sized tasks, in the writing-plans format).

---

## 1. Review — what Ouri's `server-side` branch changed (and what it means for us)

Verified against `origin/server-side` @ `a81218f` (merge-base with `ui` = `282152d`, 50 files,
+2233/−819) and the live site https://young-world-federalists.github.io/gloki-engage/.

### 1.1 The deploy branch moved — pushing `ui` no longer deploys

`.github/workflows/deploy.yml` now triggers on `server-side`, not `ui` (commit `cf0ba5e`,
also landed on `origin/ui` as the two commits my local `ui` was behind). Ouri merged `ui`
into `server-side` via PRs #22 and #23, so `server-side` = `ui` + his real-server layer.
Deploy runs: two failed (`33624146823`, `33624965844`, logs expired) then green on `a81218f`.

**Consequence for our rules.** "A push to `ui` IS a production deploy" (Rule 1) is no longer
true. The branch model is now: `ui` (UI on stubs) → `server-side` (Ouri merges `ui` in, wires
the server, **this deploys**) → `main` (stale at `d28594a`, Ouri's old line). Rule 1 stays
(no unprompted pushes — Ouri derives from whatever is on `ui`) but the blast radius of a
`ui` push is now "Ouri's next merge", not "the live site". Docs to update: `CLAUDE.md`
(branch model + deployment section), `.claude/skills/gloki-change-control` and
`gloki-session-lifecycle` (push-gate wording), `gloki-build-env-run` (deploy branch).

### 1.2 Fonts — nothing was lost in the code; the pairing is device-dependent by design

- `index.html`, `src/styles/variables.scss`, `index.scss`, `globals.scss` are **byte-identical**
  between `ui` and `server-side` (`git diff ui origin/server-side -- index.html src/styles/` is empty).
- On the live site, computed styles are exactly the S33 pairing: headings
  `ui-serif, Georgia, Cambria, 'Times New Roman', serif`, body `-apple-system, … sans-serif`.
  The login `<h1>` renders in a serif in the screenshot I took.
- The pairing is **system fonts only, zero bytes downloaded** (variables.scss:95–111, a
  north-star-1 choice). That means it looks different per device: macOS → New York/Georgia;
  Windows → Cambria/Georgia; **Android has no Georgia/Times, so headings fall to Noto Serif**
  and the body to Roboto. If the design you reviewed (claude.ai/design canvas, S33 W4 audit)
  showed a specific face, that face was never in the repo.
- Options (decision D1): **(a)** keep the zero-byte system pairing; **(b)** self-host one
  subset `woff2` for the display face (e.g. Source Serif 4 or Fraunces, ~25–40 KB per weight,
  `font-display: swap`) — the swap recipe is already written at variables.scss:107–110 and
  nothing else in the app changes; **(c)** also self-host a body sans (Inter/Noto Sans,
  +60–90 KB) — I'd advise against (c) on a cheap-Android budget.

### 1.3 Product-visible changes Ouri made that Eston has not yet signed off (Rule 3)

| # | Change | Where | Why it matters |
|---|---|---|---|
| P-a | **Sample/example content removed** from Home and the stage feeds; empty states instead | `HomeView.tsx`, `StageFeedView.tsx` (`SAMPLE_INITIATIVES` deleted), `CommunityHome.tsx` (samples now demo-communities-only) | Contradicts the recorded decision "homepage shows content immediately… immersive sample data" and north star 1. A brand-new visitor now sees "No activity yet". |
| P-b | **Demo communities excluded from cross-community aggregation** ("Ouri's call", `useAllInitiatives.ts:49–58`) | Home + `/stage/*` show only real `gloki_engage_community_contract.py` communities | Until real communities have content, Home and every stage feed are empty for everyone. Demo communities still work on their own pages. |
| P-c | **Root route waits on the real server** (`digitalAgentProfileChecked`), then routes to `/welcome` if no Digital Agent profile contract exists | `App.tsx` RootRoute, `userSlice.ts` | Correct intent, but the `fetchContracts` catch also sets "no profile" — so **a server outage sends returning users into onboarding** instead of an error state. |
| P-d | **Login/registration and `getContracts` always hit the real server** (`api.ts` `isExistAgent`/`registerAgent`/`getContracts`) | `src/services/api.ts` | The app no longer runs without `https://gdi.gloki.contact`. The demo layer still answers `contractRead/Write` for `demo-*` ids, but you cannot get past login offline. |
| P-e | **Direct-entry onboarding skips Invite/Trust/How** (`DIRECT_STEPS = agent → rules → ready`); step position no longer persists across refresh | `OnboardingFlow.tsx` | Reasonable, but it removes the vouch narrative for self-serve users — relevant to Prompt 2 (§3). |

Recommendation: accept P-c/P-d/P-e as Ouri's server-layer calls (with one fix request on P-c:
distinguish "unreachable" from "no profile" — show an error banner, keep the stored session).
P-a/P-b are **product** calls: decision D2.

### 1.4 Seam and contract observations

- **Wire truth is now in-repo.** `src/assets/contracts/gloki_engage_initiative_contract.py`
  (418 lines) consolidates every stage on ONE contract: `add_comment(text, parent_id, category,
  sources)`, `like_comment`, `add_proposal(text, co_authors, commitments, sources, metrics)`,
  `approve`, `add_expert_review(...)`, `suggest_proposal_merge`, QV and conviction methods.
  `useFlowContract` gained a "single-contract mode" (real parents resolve every stage to the
  parent id). **Every new method in §2 must be added to this file first** (byte-matching names),
  then mirrored into the demo stubs and `docs/FOR_OURI_seam.md`.
- **Comments have `likes` only — no up/down votes** (both real and demo). Prompt 1 needs a
  vote method (§2.1).
- **Mild seam erosion:** components now import `isDemoContract` from
  `services/demo/demoRegistry` (`ThreadedDiscussion.tsx`, `SolutionsBoard.tsx`,
  `useFlowContract.ts`). Suggest one exported predicate on `api.ts`
  (`emitsWriteEvents(contractId)`) so components stop importing demo internals. Minor.
- **New hooks worth reusing:** `useContractSync(contractId, refetch)` /
  `useContractSyncMany(ids, cb)` (`flows/shared/useContractSync.ts`) — SSE-driven refresh for
  real contracts; demo contracts still need the explicit refetch after writes.
- Two pre-existing demo defects surfaced while mapping (fix in W0): `discussionApi.addComment`
  sends `parent_id` but `demoContracts/discussion.ts:146` reads `parentId` (replies flatten to
  root in demo — **confirmed**: `discussionApi.ts:89` sends `parent_id`, the stub reads `values.parentId`); `get_roles`/`endorse_expert` have no demo handler, so
  `isExpert` is never true in demo and the expert-review button never appears.
- Housekeeping: `vite.config.ts` on `server-side` pins port 7173 (`.claude/launch.json` on `ui`
  uses 5173 + `autoPort` — no conflict). `.claude/settings.json` gained `Edit`/`Write` allows.

### 1.5 Verdict

Ouri's layer is coherent and additive; nothing breaks the `ui` stub layer. Three things need
Eston: D1 (fonts), D2 (sample content), D11 (confirm the new branch flow with Ouri). One fix
request to Ouri (P-c outage path). I did **not** sign in on the live site — "Get Started"
registers a real agent on `gdi.gloki.contact`, which is account creation I won't do
unprompted; the code review above stands in for the walkthrough.

---

## 2. Prompt 1 — Causes forum, impact assessment, discussion status pill

### 2.0 Framing and compliance

- **Locked IA holds.** "Discussion is per-post, not browsed" (DESIGN_SYSTEM.md:344, S26). A
  *Causes* forum is still per-problem; the four browseable stages are unchanged. Only the
  function's name and mechanics change.
- **1p1v holds.** One up/down vote per person per comment; ranking never weights people.
- **Vocabulary:** UI says *Causes* (a top-level comment on a problem = a candidate cause);
  wire stays `comment`/`proposal` (invariant 2).
- **Change class:** contract-method additions (real `.py` + demo stub + `FOR_OURI_seam.md` in
  the same change) + fixtures (DEMO_VERSION `global-v17` → `v18`) + product behaviour (D3–D7).
- **Not AI:** impact assessments are written by people (the §6 "AI debate summaries" deferral
  does not apply).

### 2.1 Wave 1 — Causes: up/down voting + ranking + rename

**Contract (additive, both `gloki_engage_initiative_contract.py` and `demoContracts/discussion.ts`) — shape per ruling F1/D4:**

```python
# NEW collection — `self.votes` is already the problem vote (Storage('problem_vote'))
self.comment_votes = Storage('comment_votes')

def vote_comment(self, comment_id, direction):   # 'up' | 'down' | 'none'
    caller = master()
    if comment_id not in self.comments:
        return
    if self.comments[comment_id]['parentId']:     # D4: root comments only, ENFORCED
        return
    key = caller + ':' + comment_id                # flat, composite-keyed (proven shape)
    if direction == 'none':
        if key in self.comment_votes:
            del self.comment_votes[key]
    else:
        self.comment_votes[key] = {'voter': caller, 'commentId': comment_id, 'direction': direction}

def get_comment_votes(self):
    return {str(key): self.comment_votes[key].get_dict() for key in self.comment_votes}
```

Votes are NOT nested on the comment doc (that shape "reliably came back empty on read" —
see the contract's own `approve` comment). The client groups `get_comment_votes()` by
`commentId`. Replies keep `like_comment`.

**Ranking (pure util, client-side, no new read method):** `src/utils/causes.ts`

```ts
export interface CauseRank { comment: Comment; score: number; up: number; down: number; rank: number }
export function rankCauses(comments: Comment[], votes: CommentVote[]): CauseRank[]   // ROOT comments only (D4), score = up − down, tie → older first
export const TOP_CAUSES_CARRIED = 15;   // carried into Solutions
export const TOP_CAUSES_ALIGN   = 5;    // a solution must align to one of these
```

**UI:**
- `ThreadedDiscussion.tsx`: on ROOT comments the Heart → **up/down pair** (`ThumbsUp`/`ThumbsDown`,
  44px targets, `aria-pressed`, visible net score); replies keep the Heart/like (D4). Sort "Top"
  uses `score` then timestamp for roots, likes for replies. Root comments get a rank ordinal
  chip ("#1"…"#15") when in the carried set. Composer placeholder becomes "What is causing
  this problem?". A once-per-user dismissible hint above the list (F6): "Vote up if this is a
  real driver of the problem, down if it isn't." (dismissal in `preferencesSlice`).
- Rename surfaces (i18n keys only — D3): `DiscussionPill` label → "Causes · {n}",
  `DiscussionStageView` title → "Causes", `DiscussionEngage` teaser, StageGate copy for
  `discussion`, ThreadedDiscussion headings. `stageKey: 'discussion'`, the `/discussion` URL
  suffix and the `discussionContractId` slot **do not change** (wire + routing stable).
- `discussionApi.ts`: `voteComment(serverUrl, publicKey, contractId, id, direction)` +
  `getCommentVotes(...)` → `CommentVote[]` (`{voter, commentId, direction}`); `Comment` is
  unchanged on the wire; a client helper `tallyVotes(votes)` → `Record<commentId, {up, down}>`.
- Demo: after a vote, explicit refetch (demo emits no events); real: `useContractSync`.

**Fixtures:** seed `votes` on the databroker + misinfo discussions (so ranking and the status
pill have signal), root comments rewritten as cause statements where needed.

**Verification:** `tsc -b`; preview walk at 360px light/dark: vote, un-vote, re-sort, rank
chips; fr/sw parity script clean.

### 2.2 Wave 2 — Discussion status pill (5 stages)

**Metric (pure util):** `src/utils/discussionStatus.ts`

```ts
export type DiscussionStatusKey = 'open' | 'contested' | 'divided' | 'converging' | 'consensus';
export interface DiscussionStatus { key: DiscussionStatusKey; agreement: number; votes: number }
export const STATUS_VOTE_FLOOR = 10;   // below this → 'open'
export function computeDiscussionStatus(comments: Comment[]): DiscussionStatus
```

Sample = the ≤10 ROOT comments with the most total votes (up+down) (D4, F3). `agreement =
Σ|up−down| / Σ(up+down)` over the sample (0 = every top comment split down the middle, 1 =
unanimous). Return `open` unless BOTH `Σ(up+down) ≥ STATUS_VOTE_FLOOR (10)` across root comments
AND at least `MIN_VOTED_COMMENTS (3)` root comments have ≥1 vote (F3). Bands: `< 0.25`
contested · `< 0.5` divided · `< 0.75` converging · `≥ 0.75` consensus. Titles + tones (ruled, D6):

| key | word | Badge tone | dot |
|---|---|---|---|
| open | New | neutral | ● gray |
| contested | Contested | warning | ● amber |
| divided | Divided | info | ● teal/blue-info |
| converging | Converging | primary | ● blue |
| consensus | Consensus | success | ● green |

(No red: "if it's not an error, it's not red". `Badge` already supports `tone` + `dot`.)
Width budget ≤12 chars in `en`; if a fr/sw translation overflows the chin pill at 360px the pill
degrades to dot + accessible name, never an ellipsis (F5). Every surface that leaves the app
(mandate document, export, share text) renders the scoped string "Consensus among {n} Gloki
participants in {community}"; the in-app pill keeps one word with the scoped string as its
`title`/`aria-label` (F4).

**Component:** `src/components/initiative/DiscussionStatusPill.tsx` — reads via
`resolveInitiativeStageContract(initiativeId, 'discussionContractId')` → `get_comments`
(**never `useFlowContract`** — read-only surfaces must not deploy; S11/S23 lesson). Renders
`<Badge tone dot size="sm">{word}</Badge>` with `title`/`aria-label` "Causes discussion: {word}".

**Surfaces (all cards "throughout the initiative"):** `DiscussionPill` (chin — word appended
inside the existing pill so the chin gains no extra control), `InitiativeStageCard` header
meta, `ProblemActivityCard` / `SolutionActivityCard` / `VoteActivityCard` header meta,
`StageFeedView` card summary, `DiscussionStageView` AppHeader subtitle, the Wave-3 "Top
causes" panel header. DESIGN_SYSTEM.md gets a "Status pill" row in the Badge inventory + the
5-band definition (doc-of-record rule).

### 2.3 Wave 3 — Causes → Solutions link (top 15 carried, align to top 5)

**Contract (additive):** `add_proposal(self, text, co_authors, commitments, sources, metrics, cause_id='')`
→ stored as `causeId`. Demo stub mirrors. `FOR_OURI_seam.md` documents the new optional arg.

**UI:**
- `SolutionsBoard.tsx` gains a collapsible **"Top causes (15)"** panel above the solutions
  list (`TopCausesPanel.tsx`, reads the discussion contract like the pill; each row: rank,
  cause text, net score, author `UserIdentity`, count of solutions addressing it).
- Add-solution modal: **"Which cause does this address?"** `SearchableSelect` listing the top 5.
  Ruled D5: when ≥1 ranked cause exists the field is required AND pre-populated with the #1
  cause (changeable, never empty, submit enabled from the start); when zero ranked causes exist
  the field is omitted, `cause_id=''` is written and the solution shows a neutral chip "Proposed
  before any cause was ranked". Helper copy: "Your metrics and implementation measures should
  follow from this cause."
- `SolutionEvidence` fold + `QVFlow` ballot card + `VotePreview` + `MandateCard` show
  "Addresses cause: …" as the first line of the evidence fold, plus a neutral chip "Cause now
  ranked #n" while it is ranked or "Cause no longer ranked" once it has left the top 15 (F2).
  `causeId` is immutable once written — never re-bucketed or hidden.
- Existing "commitments" are relabelled **"Implementation measures"** in UI copy (wire stays
  `commitments`) so Prompt 1's vocabulary is consistent (D3 covers this too).

**Fixtures:** `causeId` on seeded solutions; DEMO_VERSION bump happens once at the end of W4.

### 2.4 Wave 4 — Impact assessment (3 volunteers from the top-10 writers)

**Eligibility (pure util):** `src/utils/writerRank.ts` (ruled D7/F7/F8/D12)

```ts
export interface WriterScore { publicKey: string; causeScore: number; solutionScore: number; total: number; firstAt: number }
// Sort: total desc → causeScore desc → firstAt asc → publicKey asc (F7; all four keys are stored data).
export function rankWriters(comments: Comment[], votes: CommentVote[], proposals: Proposal[], approvalCounts: Record<string, number>): WriterScore[]
export const TOP_WRITERS = 10; export const ASSESSORS_PER_SOLUTION = 3;
export type EligibilityRung = 'strict' | 'no-floor' | 'top-25' | 'any-verified';   // F8 ladder
export function eligibleAssessors(proposal: Proposal, allProposals: Proposal[], writers: WriterScore[], verifiedKeys: string[], existing: ImpactAssessment[]): { keys: string[]; rung: EligibilityRung }
export function canAssess(publicKey: string, ...same args): boolean
```

Filters: in top 10 by `total`; `causeScore > 0`; not author/co-author of the solution; not
author/co-author of ANY solution sharing its `causeId`; not already an assessor; fewer than 3
assessments. If fewer than 3 eligible non-assessors exist, relax in order (F8): drop the
`causeScore` floor → widen to top 25 → any verified member; the two self-dealing exclusions are
never relaxed; the panel copy names the current rung. `causeScore` = Σ net votes on the writer's
root comments; `solutionScore` = Σ approvals on the writer's solutions. All of this is UI-gated
only (D12) — logged in `FOR_OURI_seam.md` next to the `add_expert_review` precedent.

**Contract (additive, both layers) — flat collection per F1:**

```python
self.impact_assessments = Storage('impact_assessments')

def add_impact_assessment(self, proposal_id, target, targets_cause, mechanism,
                          broader_effects, risks, opportunity_costs, time_horizon):
    caller = master()
    if proposal_id not in self.proposals:
        return
    existing = [k for k in self.impact_assessments if self.impact_assessments[k]['proposalId'] == proposal_id]
    if len(existing) >= 3:
        return
    for k in existing:
        if self.impact_assessments[k]['author'] == caller:
            return
    key = proposal_id + ':' + caller
    self.impact_assessments[key] = {
        'author': caller, 'proposalId': proposal_id, 'timestamp': timestamp(),
        'target': target, 'targetsCause': targets_cause, 'mechanism': mechanism,
        'broaderEffects': broader_effects, 'risks': risks,
        'opportunityCosts': opportunity_costs, 'timeHorizon': time_horizon,
    }

def get_impact_assessments(self):
    return {str(key): self.impact_assessments[key].get_dict() for key in self.impact_assessments}
```

**UI:**
- `ImpactAssessmentForm.tsx` (kit `Modal`, 7 fields; each label carries the prompt text as
  helper copy: "What cause or mechanism does this solution target?", "Cause or symptom?",
  "How is it expected to produce its effect?", "Expected broader effects and consequences",
  "Risks and trade-offs", "Opportunity costs", "Time horizon — how quickly, and for how long").
- `ImpactAssessmentCard.tsx` — read view: 7 labelled rows, author byline with trust shield,
  "Assessment 2 of 3".
- `SolutionsBoard` per-solution chin: **"Assess impact"** pill for eligible writers; counter
  "Impact assessments · 1/3" for everyone.
- **Voter surface:** `QVFlow.tsx:316–319` currently flattens `[...commitments, ...metrics]`
  into one list. Recompose the per-solution `<details>` into three folds: *Implementation
  measures* · *Metrics* (author + expert) · *Impact assessments (n)* rendering
  `ImpactAssessmentCard`s. Same in the results view and in `VotePreview` (read-only).
- `MandateCard`: assessments carried forward under "Why we expected this to work".

**Fixtures:** 2 seeded assessments on the seeded databroker solution (viewer-authored one
included so the "Assess impact" CTA has a demo path); **DEMO_VERSION → `global-v18`**.

### 2.5 W0 (before Wave 1) — housekeeping this review surfaced

1. `CLAUDE.md` + 3 skills: branch/deploy model (§1.1).
2. `docs/FOR_OURI_seam.md`: point at the in-repo real contract; add the S13 `set_property`
   /`get_properties` gap already noted in memory.
3. Verify + fix the demo `parent_id`/`parentId` mismatch; add demo handlers for `get_roles`
   /`endorse_expert` (so expert review is reachable in demo, and W4 can reuse its modal pattern).
4. Optional: `api.ts` `emitsWriteEvents()` predicate (§1.4).

---

## 3. Prompt 2 — Community verification system

### 3.0 Reconciling the prompt with this repo's laws

The prompt was written for a greenfield React/Tailwind/shadcn app. Same screens, same flows,
but adapted to this codebase:

| Prompt says | Here | Why |
|---|---|---|
| Tailwind + shadcn | SCSS modules + `variables.scss` tokens + the kit (`Button`, `Card`, `Badge`, `ProgressBar`, `SegmentedControl`, `EmptyState`, `Modal`, `Stepper`, `SearchableSelect`, `UserIdentity`, `TrustBadge`) | DESIGN_SYSTEM law; "no ad-hoc values" |
| `AppShell` with sidebar nav | Single `AppHeader` + context-aware global menu (S29) + `StageFooter`; bell already in the header | Locked: no left drawer / per-page headers |
| `mock-data.ts` + mocked async | `src/services/demo/fixtures/verification.ts` + `demoContracts/`; seam functions in `src/services/verification.ts` with `setTimeout` delays inside the demo layer | Seam rule — components never own mock data |
| New `AuthContext` with `role` | `state.user` + Digital Agent store (`agent.vouchedBy`) + `useCommunityTrust`; `resolveTrustState(n)`: ≥4 verified | Trust model locked at Batch 4 — **"4 approvals" = `VERIFIED_THRESHOLD = 4` exactly** |
| `/verification/*`, `/notifications` top-level | `/identity/verification/*` and `/identity/notifications` inside `IdentityView`'s wildcard (D9) | Route-map freeze |
| "Young World Federalists" | No org branding in copy; the platform is general (S15) | P5.5 generalisation |
| Dev toolbar bottom-right | "Demo state" entry in the global menu next to "Reset demo" (dev-only) | No floating chrome; one menu |
| Lucide icons | already the icon set | — |

**Scope:** verification is **platform-wide on the Digital Agent** (D8, recommended) — the
local agent store already holds `vouchedBy` and `useCommunityTrust` already merges it into
every community's trust. Per-community `IdentityTrust` (`/community/:id/identity`) keeps its
page and links to the hub. Video calls and the daily session are **UI simulations** (no
WebRTC, no contract) exactly as the prompt specifies; only vouches persist.

**Deferred-list check:** "Biometric / hard identity verification" stays deferred; this is the
"lightweight invite + vouch + web-of-trust" path the deferral explicitly keeps.

### 3.1 Data model + seam (Wave 1 foundation)

`src/services/verification.ts` (the only import components use):

```ts
export type VouchMethod = 'direct' | 'call' | 'invitation' | 'daily';
export interface Approval { id: string; approver: string; method: VouchMethod; at: number }
export interface VerificationState { approvals: Approval[]; pending: VouchRequest[]; sent: VouchRequest[] }
export interface VouchRequest { id: string; requester: string; approver: string; at: number; status: 'pending'|'approved'|'declined' }

getVerificationState(ctx): Promise<VerificationState>
listVerifiedMembers(ctx, query?): Promise<MemberSummary[]>     // {publicKey, name, country, online}
requestVouch(ctx, approverKey): Promise<VouchRequest>          // demo: resolves 2–5 s later, random approve/decline
respondToRequest(ctx, requestId, approve: boolean): Promise<void>
sendInvitation(ctx, {name, email, vouch: boolean}): Promise<void>
requestInvitation(ctx, memberKey): Promise<void>
// call + daily session are simulated in-memory (src/services/demo/verificationSim.ts) and
// expose: inviteToCall(keys) → CallSession; joinStream(session) (simulated joins);
// verifyInCall(session, verifierKey); dailySessionState(); joinDaily(); selectVerifiers()
```

Persisted vouches go through the existing `addUserVouch` (Digital Agent store) extended with
`{method, at}`; `useCommunityTrust` needs no change. **Real-contract note for FOR_OURI:**
Ouri's `digital_agent_contract.py` / `gloki_engage_community_contract.py` have **no vouch
methods**; document `request_vouch(public_key)`, `vouch(public_key, method)`,
`decline_vouch(public_key)`, `get_vouches()` as the methods the real layer will need. The
call/session simulation never needs a contract.

Fixtures (`fixtures/verification.ts`): 30 members across 5 continents (reuse `PILOT_COUNTRIES`
/ `getCountryFlag`), 3–5 pending requests, 6–8 notifications, approval history; demo state
switcher: `unverified-0`, `partial-2`, `verified-4`, `member-view`.
**DEMO_VERSION → next value** when this ships.

### 3.2 Kit additions (shared, added in the wave that first needs them)

| Component | Notes |
|---|---|
| `ProgressBar` `segments={4}` prop | the kit bar (S22) has `value/max/label` only — add an optional `segments` prop rather than a second bar; fill animation via the `transition` token |
| `MemberCard` | `UserIdentity` + flag + online dot + action slot; 44px row |
| `VerifyButton` | 48px green, states idle → loading → confirmed; `aria-live` announce |
| `VideoTile` | placeholder rect, initials (`initials()` util from S22), name overlay, mic/cam icons |
| `NotificationItem` | icon, message, timestamp (`formatTimeAgo`), inline action slot |
| `CountdownTimer` + `useCountdown` | tabular figures (S33 token), respects `prefers-reduced-motion` |
| `Toast` | **none exists** (only `OfflineBanner` has a live region) — add one to the kit: polite live region, 4 s auto-dismiss, stack of 3, keyboard-dismissable |
| Confetti | CSS-only, gated on `prefers-reduced-motion` |

### 3.3 Waves

**Wave 1 — Hub + request + approve + invite** (Screens 1–4)
`src/components/identity/verification/`: `VerificationHub.tsx` (segmented progress, "{X} of 4
approvals received", verified state with "Go to Home"), `PathwayCards.tsx` (2×2 → 1 column at
360px, each card a kit `Card` with icon/title/line/CTA), `ApprovalHistory.tsx`,
`InvitePage.tsx` (branch on trust: verified → invite form with vouch checkbox; unverified →
member search + "Request invitation"), `RequestPage.tsx` (member list, "Requested ✓"
disabled state, simulated 2–5 s outcome toast), `ApprovePage.tsx` (pending cards, Approve →
slide-out + check animation, Decline text button, empty state). Routes added inside
`IdentityView.tsx`: `verification`, `verification/invite`, `verification/request`,
`verification/approve`, (`call`, `daily` land in W2/W3). `StageGate`'s "Get verified" link
and `IdentityTrust`'s demo button point at the hub.

**Wave 2 — Verification call** (Screen 5, states A–D)
`CallFlow.tsx` state machine (`select → waiting → inCall → summary`), `VerifierPicker.tsx`
("Available now" 8–10 random online members + Refresh; "Schedule for later" = `AvailabilityGrid`
7×12 toggles + timezone `SearchableSelect` + "Find matching times" → suggestions with verifier
counts), `WaitingRoom.tsx` (join list, "{N} of {total} joined", Start enabled at ≥1, Cancel,
5-min timeout message — simulated at 20 s in demo), `InCallView.tsx` (candidate tile large +
verifier tile grid; verifier view shows `VerifyButton`; live "2 of 4 verified"; controls bar
mute/video/leave; completion overlay + 5 s countdown → hub), `CallSummary.tsx`.

**Wave 3 — Daily session** (Screen 6)
`DailySession.tsx`: pre-session (`CountdownTimer` to 21:00 UTC, "Set reminder" toggle, Join
enabled within 5 min — demo clock override in the state switcher), lobby (participant count,
list, "Selecting verifiers in 2:30…"), selection result (selected → banner → `InCallView`;
not selected → thanks + auto-dismiss + "Today {N} new members were verified").

**Wave 4 — Notification centre + bell** (Screen 7)
Extend `notificationsSlice.ts` `NotificationType` from one type to seven
(`merge_absorbed` + `verification_request | call_invite | approval_received | daily_reminder |
verifier_selected | session_thanks`), producers in the W1–W3 sims, `NotificationCenter.tsx` at
`/identity/notifications` with inline actions per type, `NotificationsBell` → unread count +
link to the centre, mark-read on click. This also closes the P9 follow-up "NotificationsBell
is permanently empty".

Each wave: `tsc -b` + build clean, 360px light/dark walk, keyboard pass, fr/sw parity,
Opus whole-branch review, Eston's push gate.

---

## 4. Decisions — RULED (debate of three Sonnet advocates + Opus judge, 2026-09-02)

Eston delegated these to a structured debate (usability / governance / engineering lenses,
opening positions + rebuttals) and an Opus judge. Full record with rationale and dissents:
**`docs/superpowers/specs/2026-09-02-s34-decision-record.md`**. Eston may override any line.

| # | Ruling |
|---|---|
| D1 | Keep the zero-byte system font pairing; no webfont in S34 |
| D2 | Conditional client-side demo fallback in `useAllInitiatives` + persistent "Example activity" banner; no revert of Ouri's commits |
| D3 | Labels only; `/discussion` URL, `stageKey`, contract slot unchanged; copy never implies a Cause is validated |
| D4 | Root comments only, **enforced in the contract**; replies keep likes; ranking + status read roots only |
| D5 | Hard requirement with #1-cause pre-select; field omitted (and a "Proposed before any cause was ranked" chip) when none ranked |
| D6 | New · Contested · Divided · Converging · Consensus (neutral/warning/info/primary/success); floor 10 votes + 3 voted comments; bands .25/.5/.75 |
| D7 | `total = causeScore + solutionScore`; filters: `causeScore > 0`, not author of the solution, not author of any solution sharing the cause; relaxation ladder F8 |
| D8 | Platform-wide verification on the Digital Agent |
| D9 | `/identity/verification/*` + `/identity/notifications`; no new top-level route |
| D10 | Prompt 1 fully first (W0→W4), then Prompt 2; Prompt 2 Wave 1 does NOT run in parallel (F9) |
| D11 | Confirm branch flow with Ouri in writing; update CLAUDE.md + 3 skills in W0 before code |
| D12 | Eligibility (assessor + cause alignment) is UI-gated only; contract enforces data invariants; logged for Ouri's roadmap |
| F1 | Flat composite-keyed collections `comment_votes` / `impact_assessments` with `get_comment_votes` / `get_impact_assessments`; never nested on the doc |
| F2 | `causeId` immutable; "Cause now ranked #n" / "Cause no longer ranked" chip |
| F3 | Status = `open` unless Σvotes ≥ 10 AND ≥3 voted root comments |
| F4 | Off-app surfaces say "Consensus among {n} Gloki participants in {community}" |
| F5 | ≤12 chars in en; overflow → dot + accessible name, never ellipsis |
| F6 | Once-per-user downvote hint, dismissal in `preferencesSlice` |
| F7 | Writer tie-break: total → causeScore → first contribution → publicKey |
| F8 | Assessor relaxation ladder: drop floor → top 25 → any verified; self-dealing never relaxed |
| F10 | Every call/daily-session entry carries "Uses your camera and mobile data. No camera? Ask a member to vouch for you instead."; non-video pathways ordered first |

Next: per-wave executable plans in `docs/superpowers/plans/`, starting with Prompt 1
(`2026-09-02-prompt1-causes-impact-status.md`), built wave-by-wave on `ui`, reviewed, pushed on Eston's go.
