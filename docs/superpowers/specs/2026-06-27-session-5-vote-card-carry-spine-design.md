# Session 5 — Vote card redesign + carry the commitments/metrics spine

**Date:** 2026-06-27
**Branch:** `ui`
**Roadmap:** `docs/superpowers/specs/2026-06-25-design-consistency-pipeline-redesign-roadmap.md` (§5 Session 5; §2 decision #2 — the spine; §6 the fixed S4 → S5 → S6 chain)
**Builds on:** S4 (`2026-06-27-session-4-solutions-card-commitments-spine-design.md`) — which authored `commitments` + `expertReviews[].metrics` onto the `approval` contract's `Proposal`.

## 1. Goal

Redesign the **Vote (quadratic-voting) card** so it reads as the deliberate, high-stakes step it is, and **carry S4's commitments + expert-metrics spine onto the ballot** so S6's Mandate can consume the winning solution's. S5 is the **middle link**: S4 authored the spine; S5 makes it legible on the ballot and proves it is read back from the canonical contract; S6 derives the Mandate from it.

The redesigned card replaces the current `proposals` / `allocate` / `results` `SegmentedControl` UI in `QVFlow` with a single **auto-switching** card: a votable ballot of expert-reviewed solutions while voting is open, a hard-locked results view once the member has cast. The quadratic mechanism (hearts, `h²` cost, sqrt results) is unchanged.

## 2. Locked decisions (from the brainstorm, confirmed by Eston via the visual companion)

1. **Spine carry → read from the `approval` (proposals) contract.** The `qv` contract keeps owning hearts / allocation / results. The card additionally reads `approvalApi.getProposals` on the initiative's `proposalsContractId` and **joins by proposal id** (`p0..p3` match across the two contracts — see §6) to pull each solution's `commitments` and `expertReviews[].metrics`. This is the canonical home, matches Ouri's real contracts, and is exactly what S6 will mirror. (Rejected: reading the spine off `qv` proposals — works only because the demo seeder spreads the fields in, but Ouri's real `qv_contract.py` `Proposal` is `{id,text,author,timestamp}` only.)

2. **Ballot = expert-reviewed solutions only.** Show solutions whose `approval` twin has `expertReviews.length > 0`. **Graceful fallback:** if an initiative has *no* reviewed solutions, show all ballot solutions so the card never looks empty/broken.

3. **Results gating → hard-lock once cast.** After a member submits their allocation the ballot becomes read-only: hearts/steppers gone, results revealed, a "You've voted · votes can't be changed" status. Detected client-side via **non-empty `get_my_allocation`** — *no new contract method required*. (The owner-level `set_status:'closed'` path is untouched.)

4. **No Ballot/Results toggle.** The `SegmentedControl` is removed. The card **auto-switches** on `hasVoted`: votable ballot → locked results. A status line updates itself instead of a button.

5. **Completion threshold → "Community turnout", 75%.** `distinct allocators ÷ active community members`, read-only, reusing the S4 threshold-bar pattern. Recoloured **slate** (not the S4 green, which read as approval) and moved to the **bottom** of the card as a quiet footer with a one-line "completes when 75% have taken part" note. Shown in both states.

6. **Hearts → keep & polish.** The existing `lucide-react` `Heart` icon + quadratic logic + "support used" meter stay. Visual polish only (the support meter is tinted heart-red and merged with the how-to text — see §4).

7. **Results colour → 6 world regions + a key.** Replace the per-country `getCountryColor` rainbow (197 colours) with 6 stable regions and a key at the bottom of the results view. New `src/utils/regions.ts`; new `$region-*` design tokens. `getCountryColor` stays for other surfaces.

8. **Identity / scope / SDG** consistent with the problem & solution cards: `UserIdentity` (flag + verified shield) on each solution author byline, the scope prefix ("Global problem" / "Community problem") and SDG label on the card forehead (via the shared `InitiativeStageCard` shell).

## 3. The 6-region scheme

`src/utils/regions.ts` (pure, no React/i18n):

```ts
export type RegionId = 'africa' | 'asiaPacific' | 'europe' | 'latam' | 'northAmerica' | 'mena' | 'other';

export interface Region { id: RegionId; label: string; } // label = English (region names stay English per i18n policy)

export const REGIONS: Region[] = [ /* the 6, in fixed order */
  { id: 'africa',        label: 'Africa' },
  { id: 'asiaPacific',   label: 'Asia & Pacific' },
  { id: 'europe',        label: 'Europe' },
  { id: 'latam',         label: 'Latin America & Caribbean' },
  { id: 'northAmerica',  label: 'North America' },
  { id: 'mena',          label: 'Middle East & North Africa' },
];
// 'other' is the fallback bucket for unmapped / missing country codes (e.g. demo 'OTHER').
// It is NOT in REGIONS (the visible key shows the 6); it renders as a neutral grey
// segment only if present, with an "Other" label appended to the key when used.

export function regionOf(countryCode: string | undefined): RegionId; // ISO 3166-1 alpha-2 → region; default 'other'
export function regionColorVar(id: RegionId): string;                // returns a CSS var() referencing a $region-* token
```

- `regionOf` maps every ISO alpha-2 country to exactly one region. MENA takes precedence over the Africa/Asia split for its member states (e.g. EG, MA, DZ, TN, LY, SD → MENA; SA, AE, QA, … , IR, TR, IL → MENA). Source the mapping from the existing country list in `src/utils/countries.ts`.
- **Colours:** add `$region-africa … $region-mena` (+ `$region-other`) to `src/styles/variables.scss`, plus matching CSS custom properties in the theme layer so they adapt light/dark. Six distinct hues, each **AA** against the card background in both themes. The 5 `$stage-*` tokens are semantically reserved (one per pipeline stage) and there are only 5, so regions get their own token set rather than overloading them. Illustrative target hues (final values AA-verified in implementation): Africa amber, Asia & Pacific teal, Europe blue, Latin America & Caribbean coral, North America violet, MENA green; Other = neutral grey.
- The region **key** is a 2-column grid at the bottom of the results view: swatch + label for each of the 6 (plus Other only when present). Colour is never the only signal — the key is always shown when results are visible.

## 4. Card layout (the locked v4 mock)

The card body is `QVFlow`, rendered inside the shared `InitiativeStageCard` via `VoteEngage → VoteStage`. The **forehead** (scope badge, headline, byline, SDG) comes from the card shell; the body below is `QVFlow`.

### 4a. Voting open (member has NOT cast)

1. **Status line:** "● Voting open · N solutions" (N = reviewed solutions shown).
2. **Guide + support meter (merged, heart-red):** one block — the how-to text ("Tap ♥ to back what you care about — spreading your hearts across solutions costs less than piling them onto one.") + the "support used" meter + "X% of your support used". Tinted heart-red so it reads as *your* allocation, not approval. (This merges the former `mechanisms.qv.intro` text and the support meter into one element.)
3. **Solution cards** (one per reviewed solution, in ballot order):
   - Header row: "Solution _i_ of _N_" + "expert reviewed" tag.
   - **Hearts bar on top** (heart-red tinted): `−` stepper · filled `Heart` icons (count = current hearts) · `+` stepper. Quadratic `canAddHeart` rules unchanged.
   - Solution **text** (the longer, nuanced body from `approval`).
   - **Author byline:** `UserIdentity` (flag + name + verified shield), `size="sm"` — the solution author (a member), keyed off the `approval` proposal's `author`.
   - **Two detail cards** (collapsed by default), each a bordered card with a `+` that rotates to `×` on open:
     - "What this commits to (_k_)" → the `commitments` list.
     - "How we'll know it's working (_k_)" → the flattened `expertReviews[].metrics` list (green-accented).
4. **Cast my votes** button (primary, full-width). Submits hearts→credits via the existing `allocate` path; on success the card re-fetches and flips to the locked state.
5. **Community-turnout footer** (slate, at the very bottom): "Community turnout — _x_% of 75% needed" + a slate bar + "The vote completes when 75% of members have taken part."

### 4b. Voted (hard-locked, results)

1. **Status line:** "● You've voted" + subline "Live results below · votes can't be changed".
2. **Solution cards** (same reviewed set):
   - Header row: "Solution _i_ of _N_" + "expert reviewed" tag.
   - Solution **text**.
   - **"Your vote"** chip (heart-red): the hearts *this member* submitted for this solution (greyed "—" if none).
   - **Region results bar:** stacked segments coloured by `$region-*`, widths ∝ each region's vote share; "_n_ votes" beneath (and "· leading" on the top solution).
   - One collapsed **"Commitments & metrics"** detail card (the two lists folded together to keep the locked view compact).
3. **Region key** (2-col grid).
4. **Community-turnout footer** (same as 4a).

No hearts steppers, no guide/support block, no Cast button in this state.

## 5. Data flow & integration

### 5a. Resolving the approval (proposals) contract inside QVFlow
`QVFlow` already receives `parentContractId={initiativeId}` and `stageKey="voteContractId"` (from `VoteStage`). To read the spine, add a **second** `useFlowContract` exactly as `SolutionsBoard` does:

```ts
const { contractId: proposalsContractId, isReady: proposalsReady } = useFlowContract(
  `${initiativeId}_proposals`, 'approval_voting', 'approval_contract.py', '',
  parentContractId /* = initiativeId */, 'proposalsContractId',
);
```
Then `approvalApi.getProposals(serverUrl, publicKey, proposalsContractId)` → a `Record<id, ApprovalProposal>`. **Join to the qv proposals by id.** For each qv proposal, look up its approval twin; the card displays:
- text/author/commitments/metrics/**reviewed-ness** from the **approval** twin (canonical spine);
- hearts/allocation/results/turnout from the **qv** contract.

If the approval twin is missing for a qv id (shouldn't happen in the demo), fall back to the qv proposal's own text/author and treat it as unreviewed.

### 5b. Reviewed-only filter + fallback
`reviewed = (approvalTwin.expertReviews?.length ?? 0) > 0`. Ballot = qv proposals whose twin is `reviewed`. If that set is empty, ballot = all qv proposals (fallback).

### 5c. hasVoted, turnout, results gating
- `hasVoted = Object.keys(myAllocation).length > 0` (from `get_my_allocation`).
- **Fetch `get_allocations` always** (not only on a results tab) — but use it for the **turnout count only** (`Object.keys(allAllocations).length`) until `hasVoted`. Per-solution region breakdown + vote totals (`get_results`) render **only when `hasVoted`** (anti-bandwagon: turnout count doesn't bias toward any option; per-solution standings do).
- Turnout: `distinct allocators ÷ activeMemberCount`, target 75%. Reuse the threshold-bar markup/pattern from `SolutionsBoard.module.scss` (`.track`/`.fill`), recoloured slate.

### 5d. Member count threading (new prop)
`activeMemberCount` is computed in `VoteActivityCard` (already). Thread it down for the turnout denominator, mirroring `SolutionEngage`'s `communityMemberCount`:
`VoteActivityCard` → `VoteEngage` (new `communityMemberCount` prop) → `VoteStage` (new prop) → `QVFlow` (new `communityMemberCount` prop, optional, default 0).

### 5e. Scope on the card
`VoteActivityCard`'s `fullPost` currently omits `scope`. Add `scope: post.scope` (SDG `post.sdg` already present). `InitiativeStageCard` already renders both badges — no shell change.

### 5f. Region results
Replace `getCountryQVBreakdown` (per-country) with a per-region aggregation: for each voter's allocation, `regionOf(profiles[voter]?.country)` → sum `sqrt(credits)` into the region bucket. Segment colours from `$region-*`.

## 6. Demo seed (DEMO_VERSION bump → `global-v9`)

`privacy` (key `privacy`, `stage:'vote'`, "A Global Baseline for Digital Privacy") already has **4** proposal texts in `PROPOSALS_BY_KEY.privacy`. Seed the spine on **indices 0, 1, 2** (the 3 advanced solutions); index 3 stays unreviewed → filtered out by the reviewed-only rule.

- **Lengthen** `PROPOSALS_BY_KEY.privacy[0..2]` to nuanced, ballot-worthy bodies (the current one-liners are too thin for the vote stage). Keep index 3 as-is (the un-advanced one). The qv ballot is `propProposals.slice(0,4)` and shares text/ids with `approval`, so lengthening flows to both.
- **Add `privacy` to `PROPOSAL_COMMITMENTS_BY_KEY`**: 2–3 commitments on each of indices 0,1,2.
- **Add `privacy` to `PROPOSAL_EXPERT_REVIEWS_BY_KEY`**: one expert review (2 metrics each) on indices 0,1,2. Reuse the existing `demo-expert-renata` / `demo-expert-lena` keys (the reviewer name is **not** displayed on the vote card — only the "expert reviewed" tag and the metrics — so field-of-expertise mismatch is invisible; no new expert personas needed). Spread across the two keys so distinct-reviewer count ≥ 2.
- **Current user opens votable:** ensure the demo's current user (`publicKey`) has **no** seeded `qv` allocation on `privacy`, so the card opens in the votable state for the showcase. Other members carry allocations (so turnout reads mid-progress, e.g. ~58%, and results populate once the user casts). Verify in preview; if `qvAllocationPattern` includes the current user, exclude them for `privacy`.
- **Bump `DEMO_VERSION`** in `src/services/demo/mockApi.ts` from `global-v8` to `global-v9`.

No change to the generic `slice(0,4)` qv seeding is required. (Optional cleanliness, NOT required: strip the spine fields from `qvProposals` so the demo qv contract matches Ouri's real `{id,text,author,timestamp}` shape and proves the card truly reads from `approval`. Deferred to keep the diff tight; the card ignores qv's spine fields regardless.)

## 7. i18n

All new user-facing strings ship at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`; en inline via `t('key','English')`). New keys live under the existing `mechanisms.qv.*` namespace, e.g.:
- `mechanisms.qv.statusOpen` "Voting open · {n} solutions"
- `mechanisms.qv.statusVoted` "You've voted"
- `mechanisms.qv.votedSub` "Live results below · votes can't be changed"
- `mechanisms.qv.guide` "Tap ♥ to back what you care about — spreading your hearts across solutions costs less than piling them onto one."
- `mechanisms.qv.supportUsedPct` "{pct}% of your support used"
- `mechanisms.qv.solutionN` "Solution {i} of {n}"
- `mechanisms.qv.commitsLabel` "What this commits to ({n})"
- `mechanisms.qv.metricsLabel` "How we'll know it's working ({n})"
- `mechanisms.qv.commitsMetrics` "Commitments & metrics" (locked-view folded card)
- `mechanisms.qv.yourVote` "Your vote"
- `mechanisms.qv.votesN` "{n} votes" (reuse existing `votesCount` if present)
- `mechanisms.qv.leading` "leading"
- `mechanisms.qv.turnoutLabel` "Community turnout"
- `mechanisms.qv.turnoutValue` "{pct}% of {target}% needed"
- `mechanisms.qv.turnoutNote` "The vote completes when {target}% of members have taken part."
- `mechanisms.qv.expertReviewed` "expert reviewed" (reuse if present)

Reuse existing `common.*` / `mechanisms.qv.*` keys where they already cover a string. **Region names stay English** (in `regions.ts`, not i18n). After adding: run the key-parity check (extract `'key':` lines from fr.ts & sw.ts, sort, diff → empty) + a code-ref↔i18n cross-check, and append the new keys to `docs/i18n-native-review-candidates.md`.

## 8. Files

**New**
- `src/utils/regions.ts` — `RegionId`, `REGIONS`, `regionOf`, `regionColorVar`.
- `$region-*` tokens in `src/styles/variables.scss` (+ theme CSS vars for light/dark).

**Modified**
- `src/components/collaboration/flows/voting/QVFlow.tsx` — the redesign (remove SegmentedControl + proposals-add UI; add approval read + join; reviewed-only filter; hasVoted auto-switch; merged guide/support; per-solution detail cards; region results; turnout footer; lock-once-cast).
- `src/components/collaboration/flows/voting/QVFlow.module.scss` — restyle to v4 (solution cards, hearts bar, detail cards, region bars + key, slate turnout footer, locked state).
- `src/components/community/VoteActivityCard.tsx` — add `scope: post.scope`; pass `activeMemberCount` to `VoteEngage`.
- `src/components/initiative/stages/VoteEngage.tsx` — new `communityMemberCount` prop → `VoteStage`.
- `src/components/stages/VoteStage.tsx` — new `communityMemberCount` prop → `QVFlow`.
- `src/services/demo/fixtures/deliberation.ts` — lengthen `PROPOSALS_BY_KEY.privacy[0..2]`; add `privacy` to `PROPOSAL_COMMITMENTS_BY_KEY` and `PROPOSAL_EXPERT_REVIEWS_BY_KEY`.
- `src/services/demo/mockApi.ts` — `DEMO_VERSION` → `global-v9`.
- `src/i18n/fr.ts`, `src/i18n/sw.ts` — new `mechanisms.qv.*` keys.
- `docs/i18n-native-review-candidates.md` — append new keys.
- `DESIGN_SYSTEM.md` — document the region-colour system + the vote-card pattern (auto-lock, turnout footer, region key).

**Reused, unchanged**
- `approvalApi.getProposals` (the spine read), `UserIdentity`, the threshold-bar pattern, `Button`, `Heart`/`Plus`/`Minus`, `qvApi` (allocate/getResults/getAllocations/getMyAllocation), `useFlowContract`.

**No contract changes.** Lock-once-cast and turnout are derived client-side from existing reads. Add a `// FOR OURI` note in `QVFlow` documenting that "voted" = non-empty `get_my_allocation` and turnout = distinct-allocator count, so the real wiring matches.

## 9. Accessibility & constraints

- **Tokens only**; region scheme **token-pure + AA** in light and dark; **360px flagship**, verify light + dark.
- Hearts/steppers and the detail-card `+` toggles stay **keyboard-operable** with visible focus rings; the `<details>`/`<summary>` (or button-driven) disclosure is screen-reader friendly; the region results bar carries an accessible label/title per segment ("{region}: {n}").
- ≥44px touch targets on steppers and the Cast button; no `$gray-400` body text.
- The status line and turnout are `role="status"`/`aria-live` where they update; the support meter and turnout bars keep `role="progressbar"` with min/max/now.
- Production build runs `tsc -b` — `npm run build` clean before each commit. Verify via `preview_*` (dev server `gloki-dev`, port 5173) against the `privacy` (Digital Rights Coalition) initiative at 360px, light + dark, both states (votable → cast → locked).

## 10. Out of scope (S5)

- The collab `ApprovalFlow` / `SolutionsBoard` (S4) — untouched.
- S6's Mandate derivation (consuming the winning solution's spine) — S6.
- The dormant `PositionsBoard`/`AnchoredThread`/`ParticipationMeter`/`CoPresenceBar` + `PRESENCE_*`; the 3 S2 cleanups; the Write-Together-registry-as-contract note — all still deferred.
- Adding new expert personas (reuse existing; reviewer name not shown).
