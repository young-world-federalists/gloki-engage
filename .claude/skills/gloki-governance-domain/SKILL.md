---
name: gloki-governance-domain
description: "Use when touching any governance mechanic in Communities2/Gloki: the 5-stage pipeline (Problem/Discussion/Solutions/Vote/Mandate), quadratic voting, hearts, credits, vote budgets, turnout, ballot or results UI, QVFlow, useMandate, ratification, indicators, commitments, metrics, conviction staking, adopters, trust/verification/vouching, canParticipate, stage permission rules, Sybil resistance, 1p1v — or when confused why 'verified' means three different things, why votes read back as sqrt(credits), or which contract owns a ballot field."
---

# Gloki Governance Domain — direct democracy as implemented here


## Overview

This skill is the domain-theory pack for Gloki's governance mechanics **as shipped in this
repo** — not a civics textbook. Line references point at the ground truth and drift; trust the
identifier names over the `:NN`.

Every mechanic exists in two layers (`docs/DEMO_MODE.md`): the **real** issue contract
(`src/assets/contracts/gloki_engage_initiative_contract.py`, one contract per issue holding every
stage) and the **demo** stubs in `src/services/demo/demoContracts/` (one stub per stage). Where they
differ, both are stated below.

**Core principle: trust gates WHO may act; it never weights a vote.** One person, one
vote (1p1v) is a LOCKED product decision (see `gloki-change-control`) written into the
header of `src/services/trustModel.ts`: *"permission rules gate ELIGIBILITY to act, never
the WEIGHT of a vote… Never make participation plutocratic."* Any feature that weights
votes by tokens, vouches, stake, or reputation is off-limits by design — do not propose
it, do not relitigate it.

Two vocabulary facts you need before anything else:

- **The seam** = `src/services/` — real services for real pages, `src/services/demo/` for demo
  variants. All governance state lives behind it.
- **Wire names vs UI labels**: the UI says **"Solutions"** but every method/field name on
  the wire stays **`proposal`** (`add_proposal`, `proposal_id`, `get_proposals`) because
  it must byte-match the real contracts. This is "The one rule that must not break"
  (`docs/FOR_OURI_seam.md`). Never invent a wire name from UI vocabulary.

## When NOT to use this skill

| You actually need… | Use instead |
|---|---|
| Push gates, locked-decision list, scope discipline | `gloki-change-control` |
| Session workflow (spec → build → review → push) | `gloki-session-lifecycle` |
| Running the app, build commands, slow-drive I/O rules | `gloki-build-env-run` |
| Seam mechanics, demo router, fixtures, DEMO_VERSION bumps | `gloki-seam-and-demo-data` |
| Python contract dialect, `Storage()`/`master()`, immutability patterns, demurrage currency internals | `gloki-python-contracts` |
| `useFlowContract` vs `resolveInitiativeStageContract`, flow registry, Redux, routing | `gloki-frontend-architecture` |
| Debugging a broken vote/mandate screen | `gloki-debugging-playbook` |
| History of the QV carry-over revert and other settled battles | `gloki-failure-archaeology` |
| Measurable-democratic-outcomes ambition, open research questions | `gloki-research-frontier` |

## 1. The 5-stage pipeline

Canonical stage ids (wire names) live in ONE union, duplicated in two files:

```
src/types/initiative.ts:1      → export type PipelineStage = 'problem' | 'discussion' | 'proposals' | 'vote' | 'mandate';
src/services/trustModel.ts:16  → PIPELINE_STAGES (same five, dependency-free copy)
src/components/shared/StageStrip.tsx:12-18 → STAGES (ids + icons + UI labels)
```

| Stage (wire id) | UI label | Mechanism | Default permission rule |
|---|---|---|---|
| `problem` | Problem | 1p1v up/down "seconding"; threshold = `Math.max(Math.ceil(communityMemberCount * 0.5), 1)` (`src/components/initiative/useInitiativePost.ts:129`); tally from `problemVote` stub (`src/services/demo/demoContracts/problemVote.ts`) | `members` |
| `discussion` | Discussion | Threaded conversation; explicitly **NO threshold gate** — "discussion is conversation, not a threshold" (`src/components/initiative/stages/DiscussionEngage.tsx:20`) | `members` |
| `proposals` | **Solutions** | Approval voting + the commitments/metrics spine (§4) | `members` |
| `vote` | Vote | Quadratic voting over expert-reviewed solutions (§2) | `verified` |
| `mandate` | Mandate | Published document + ratification + conviction staking + adoption framework (§5–§7) | `verified` |

Defaults from `DEFAULT_STAGE_PERMISSIONS` (`trustModel.ts:19-25`). Rules gate ACTING,
never viewing — anyone can read every stage.

**Stage advancement**: only the initiative author or a co-author may advance
(`StageAdvanceBar.tsx` gates on `isAuthorOrCoAuthor`), writing `set_stage` through
the seam. Both layers enforce exactly one step at a time ("Stages can only advance one step at a
time"); the real contract also refuses anyone but the author or a co-author, and closes the problem
vote (`upvote`/`downvote`/`remove_vote`) once the issue leaves the Problem stage. There is no
"skip to mandate".

**Solution merging is suggest-only, never automatic**: `suggest_proposal_merge` records a
suggestion on the source proposal (`approval.ts:195-210`); nothing auto-merges.

## 2. Quadratic voting as shipped

UI in `src/components/collaboration/flows/voting/QVFlow.tsx`; contract side in the real issue
contract (`get_config`, `allocate`, `get_results`, …) and, for demo issues, the stub
`src/services/demo/demoContracts/qv.ts`.

**The h²-credits invariant** (memorize this — it is THE pattern):

- The **UI thinks in hearts**. Hearts are whole votes.
- **h hearts cost h² credits** from a per-voter budget (`credits_per_voter`, default
  **100** — `qv.ts:24`).
- The **contract stores credits** (`allocate` takes a `{proposalId: credits}` map).
- **Results read back as whole votes**: `get_results` sums `Math.sqrt(credits)` per
  proposal across all voters (`qv.ts:64-73`), so `sqrt(h²) = h`.

The two helper functions that own the round-trip (`QVFlow.tsx:36-37`):

```ts
const heartCost = (hearts: number): number => hearts * hearts;
const heartsFromCredits = (credits: number): number => Math.max(0, Math.round(Math.sqrt(credits)));
```

Any new vote UI MUST round-trip through these two helpers (draft stores hearts;
`heartCost(h)` on submit at `QVFlow.tsx:146`; `heartsFromCredits` when rehydrating a
stored allocation at `QVFlow.tsx:92`). Recompute totals ad hoc and they silently stop
being whole votes.

**Marginal cost of the next heart = 2h + 1** (since (h+1)² − h² = 2h+1). That is the
affordance gate, verbatim (`QVFlow.tsx:130-133`):

```ts
const canAddHeart = (id: string): boolean => {
  const h = draft[id] || 0;
  return spent + (2 * h + 1) <= pool;
};
```

**Contract-side `allocate` validation**: voting must be open; every credit value an integer ≥ 0;
every proposal id must exist; total ≤ `credits_per_voter`; zero-credit entries dropped. The **real**
contract also fixes the budget at 100 (`set_credits`/`set_status` always refuse), opens voting exactly
while the stage is `vote`, and makes the first ballot **final** ("You have already voted"). The demo
stub replaces a previous allocation wholesale, but the UI locks after one ballot either way.

**Vote lock**: "voted" is derived client-side — a non-empty `get_my_allocation` means the
ballot hard-locks with no un-vote (`QVFlow.tsx:67-69`; documented FOR OURI as "no new
contract method needed"). There is no `has_voted` contract method; do not invent one.

**Transparency doctrine**: votes are attributable, not secret. The disclosure copy ships
on the ballot (`QVFlow.tsx:245`): *"Your hearts are visible to the community and counted
in the public tally — your vote is attributable, not secret."* Do not add features that
pretend votes are anonymous.

**Region results**: per-solution breakdown maps each voter's profile country through
`regionOf()` into 6 world regions + `other` (`src/utils/regions.ts` — africa,
asiaPacific, europe, latam, northAmerica, mena; region labels deliberately stay English)
and sums `Math.sqrt(credits)` per region (`QVFlow.tsx:159-168`).

**Why QV, in the product's own words** (user-facing rationale,
`src/components/initiative/stages/VoteExplainer.tsx:25`): *"1 heart costs 1 point, 2
hearts cost 4, 3 hearts cost 9. So backing several things you believe in goes further
than shouting for just one."* Everyone gets the same 100-credit pool, so QV expresses
*intensity* of preference while 1p1v-style equality holds: no one can buy extra
influence. QV shapes HOW a vote is spread; trust rules gate WHO votes; neither ever
weights one person above another.

**Settled QV battle (do not re-fight)**: the original top-3 carry-over from Solutions
into Vote was reverted on the old blockchain branch (commit `963170d` on
`archive/blockchain-main`) for three data-integrity bugs — `master()`-as-author
misattribution on seeded proposals, concurrent double-seed from a per-browser ref, and an
approval contract id not keyed per initiative. The concept was rebuilt safely as the S5
"carry spine" (`169a149`). Lesson: **never seed shared contract state from a per-browser
ref**. Full postmortem: `gloki-failure-archaeology`.

## 3. Which contract owns a field?

**Real issues: one contract.** The real issue contract holds every stage — proposals, approvals,
expert reviews, the ballot, results and conviction — so QVFlow's two reads resolve to the same contract
(single-contract mode, **gloki-frontend-architecture**).

**Demo issues: two stage contracts.** The vote stage joins two stubs, registered on the parent as
sub-contracts:

| Demo stub | Stage key on the parent | Owns | Who writes it |
|---|---|---|---|
| `qv.ts` | `voteContractId` | Vote MECHANICS: proposals list, config, allocations, results | Voters (`allocate`), via QVFlow |
| `approval.ts` (the "approval twin") | `proposalsContractId` | The SPINE: canonical text, `commitments`, author `metrics`, `sources`, `co_authors`, `expertReviews`, merge suggestions | Solutions-stage UI — **never** the vote or mandate UI |

In both layers QVFlow joins rows **by proposal id**: mechanics from the vote data, text/commitments/
metrics from the spine (`twin?.text ?? q.text`). The ballot filters to expert-reviewed solutions with a
**graceful fallback to all** when nothing is reviewed yet.

**Read-only rule**: QVFlow and `useMandate` READ the spine and must NEVER write it. Something to
persist at vote/mandate time belongs with the voting mechanics or as issue-level data (like
ratification, §5) — not on the spine.

**Related trap**: a component that merely *displays* stage data must not call `useFlowContract` — in
shared (demo) mode it joins-or-DEPLOYS. Pure reads go through `resolveInitiativeStageContract`
(`src/services/contracts/initiative.ts`). `useMandateJourney.ts` shows the read-only pattern.

**Refresh after writes**: demo writes emit no events — re-fetch (`QVFlow.tsx`); real writes confirm
through their event (**gloki-seam-and-demo-data** §4).

## 4. The commitments/metrics spine (approval contract methods)

The spine is what threads Solutions → Vote → Mandate — on the real issue contract, or on the demo
approval twin (`src/services/demo/demoContracts/approval.ts`):

| Method | Semantics | Limits (UI/stub) |
|---|---|---|
| `add_proposal(text, co_authors?, commitments?, metrics?, sources?)` | Author submits a solution; commitments = "what we'll do", author metrics = *proposed* indicators | text ≤ 500; commitments ≤ 3 × 280 chars (≥ 1 enforced in UI only); metrics ≤ 3 × 280 (`approval.ts:117-134`) |
| `approve` / `withdraw_approval` | 1p1v approval voting on solutions | keyed by caller |
| `request_expert_review(proposal_id)` | 1p1v toggle signalling a solution should get expert review — does **NOT** mark it reviewed (`approval.ts:153-168`) | toggle in/out |
| `add_expert_review(proposal_id, metrics, note?, assessment?, credentials?, sources?)` | Expert attaches validated metrics; upsert — one review per expert per proposal, replace on re-submit (`approval.ts:169-195`) | metrics ≤ 5 × 280, ≥ 1 required; note ≤ 500; assessment ≤ 700; credentials ≤ 120 |
| `suggest_proposal_merge(source_id, target_id)` | Suggest-only merge pointer | never auto-merges |

**Author-proposed metrics are deliberately distinct from expert-validated metrics.**
`useMandate` reads ONLY `expertReviews[].metrics`; author metrics are a proposal, not an
indicator. Do not "simplify" by merging the two lists.

**The expert gate is permissive in both layers** — anyone may `add_expert_review`; the expert role
is checked only in the UI. The obligation to gate it on the expert role is recorded in
`docs/FOR_OURI_seam.md`.

> **REVIEW NEEDED (2026-10-29): expert reviews, review requests and merge suggestions on real
> issues.** On the real issue contract, `add_expert_review`, `request_expert_review` and
> `suggest_proposal_merge` (and `like_comment` / `delete_comment`) look the proposal up with
> `x in self.proposals`, which is always False for `append()` ids (**gloki-python-contracts** §3). They
> silently save nothing, so on real issues the ballot always falls back to "all solutions", and the
> mandate gets no expert-validated indicators. The demo stubs work. Decide the fix and what users see
> until then.

## 5. The mandate model

**Derivation** (`src/hooks/useMandate.ts`): winner = highest score in qv `get_results`
(`useMandate.ts:120`), joined to its approval twin by proposal id. Then:

- winner `commitments` → mandate **articles** (`useMandate.ts:124`)
- de-duped winner `expertReviews[].metrics` → **indicators** (`useMandate.ts:127`,
  `[...new Set(...)]` — two reviews naming the same metric would collide on React keys
  and merge many→one in ratification)
- falls back to the hand-authored flagship fixture when no spine exists
  (`src/services/demo/fixtures/mandate.ts`; empty commitments → fixture,
  `useMandate.ts:123`)
- read-only: no new contract methods — `get_results` + `get_proposals` +
  `get_properties` only; derived state is cleared on `initiativeId` change to prevent
  flashing the previous initiative's mandate (a real past bug)

**Ratification is a completeness predicate, not a ceremony.** A mandate flips to
`'ratified'` automatically when EVERY indicator has non-empty target + baseline + cadence
(`isMandateRatified`, `fixtures/mandate.ts:129-133`; applied at `useMandate.ts:142`).
`RatificationPanel` (`src/components/mandate/RatificationPanel.tsx:39-45`) is gated to
host / co-author / endorsed expert via `getInitiativeRoles`, and saves the WHOLE
indicator map as one JSON string property `mandate_ratification` on the **initiative**
contract via `set_property`/`get_properties` — full replace on save
(`src/services/mandateRatification.ts`, `RATIFICATION_KEY = 'mandate_ratification'`).

> **REVIEW NEEDED (2026-10-29): ratification on real issues.** `set_property` / `get_properties` exist
> only on the demo initiative stub, not on the real issue contract. On a real issue the ratification
> panel's save does nothing, so a real mandate can never become `'ratified'`. Decide where ratification
> lives on the real side.

**Indicator LABELS are ids.** Stored ratification data is keyed by metric label and
merged onto derived indicators BY LABEL (`useMandate.ts:130-134`). Renaming a metric —
even fixing a typo in an expert review — **orphans its target/baseline/cadence**. Treat
labels as stable identifiers.

**Turnout denominators are always explicit and client-derived.** Never show a percentage
without naming N (S13 rule; personas flagged unlabeled percentages):

- **voters** (numerator) = count of distinct allocation keys from `get_allocations`
  (`useMandate.ts:104`; `QVFlow.tsx:154`)
- **eligible** (denominator N) = fallback chain: community *active*-member count →
  `members.length` → fixture seed (`useMandate.ts:113-116,138`)
- the vote card's completion bar uses `TURNOUT_TARGET = 75` (% of members whose votes
  complete the stage, `QVFlow.tsx:39,153-156`) — a client-side derivation, NOT a
  contract method
- the mandate document prints the full sentence: *"X of N eligible members voted (pct%)"*
  (`MandateDocument.tsx:151-155`)

## 6. Conviction staking (mandate stage)

Time-weighted backing of a published mandate — the same rules on the real issue contract and the demo
stub (`src/services/demo/demoContracts/conviction.ts`):

- `stake(amount, duration, country)` — **amount must be exactly 1** (support is never
  wealth-weighted); duration one of `1w`/`1m`/`3m`/`6m`/`1y`; country upper-cased or `'OTHER'`.
- **One backing per person**: a second `stake` is refused ("Already backing — use update_stake");
  `update_stake(duration, country)` changes the commitment (shortening restarts the clock, lengthening
  keeps it); `withdraw_stake()` removes it.
- **Strength accrues with time**: starts at 1 and grows by one per 30 days held, capped by the duration
  (1w=1, 1m=2, 3m=4, 6m=7, 1y=12). `get_total_conviction` returns `{total, count, model}`;
  `get_conviction_by_country` sums strength per country.

This is the time dimension the VoteExplainer describes: *"the longer a solution holds its
backing, the more settled the community's conviction behind it."*

## 7. Adopters: claimed vs verified

`MandateAdopter.verified` (`fixtures/mandate.ts:73-79`) is `true` ONLY for confirmed
adoptions (seeded in the stub; FOR OURI a real attestation). Viewer-added endorsements
get ids prefixed `endorse-` and are ALWAYS `verified: false` = rendered as **"Claimed"**
(`AdoptionFramework.tsx:161,192-198`). Adoption levels: `'endorsed'` (public support) vs
`'subscribed'` (acting + reporting `progress` 0..1 with `progressNote`). The
machine-readable spec projection counts claimed and verified separately
(`MandateDocument.tsx` `buildSpec`, adoption block at :58-63). Never flip a viewer action
to `verified: true` — that is trust-faking (§9).

## 8. The trust layers sharing the word "verified"

When anyone says "verified", first establish WHICH layer:

| Layer | Mechanism | Where |
|---|---|---|
| 1. Person verification | People vouch that someone is a real person; the verified list is the single source of truth for "verified", app-wide | real: `gloki_verification_contract.py` via `src/services/verificationRegistry.ts` + `src/hooks/useVerificationRegistry.ts`; UI: `src/components/identity/verification/`, `IdentityTrust.tsx` |
| 2. Community membership | Who belongs to a community | real: the community contract's partners (`get_partners`), joined with an invitation (`join_contract`); the old `community_contract.py` models a nomination graph (below) |
| 3. Mandate adopter flag | Attestation that an ORGANIZATION's adoption claim is confirmed | `fixtures/mandate.ts` (§7); viewer endorsements always "Claimed" |

`canParticipate(rule, trust, isMember)` (`trustModel.ts`) is **the single eligibility gate** in the UI —
layers 1 and 2 feeding the per-stage rules of §1. `'verified'` rule = member AND verified. Do not write
a second gate.

> **REVIEW NEEDED (2026-10-29): the person-verification rule changed.** This skill used to say
> verified = ≥ 4 vouches (`VERIFIED_THRESHOLD`), per community, with onboarding seeding 2 vouches.
> Today verification is **app-wide** and in **three phases** on the verification contract: the first
> person verifies themselves (the founder, who becomes the steward); people #2–#4 need a vouch from
> *every* verified person, one candidate at a time (the steward can reset a stalled candidate); from
> then on, 4 vouches from verified people. The app registers a person with their vouches and the
> contract re-checks each one. Invitations, video calls and the daily session are still simulated and
> can't verify anyone. Details: `docs/FOR_OURI_seam.md` (2026-10-28 addendum). Confirm the rule and
> what each phase tells the user.

> **REVIEW NEEDED (2026-10-29): who can join a community.** The real community contract has no
> membership rule: anyone holding a member's invitation (`{server, agent, contract}`, from "Share
> Community Link") joins and becomes a member (a partner). The nomination graph below — the earlier
> design for Sybil-resistant membership — exists only in the old `community_contract.py`, which the app
> no longer deploys. Decide whether real communities get membership approval.

**The nomination-graph design** (`community_contract.py`, `request_join`/`approve`): first member joins
free; while members < 5, one nominate at a time is approved by all existing members; at ≥ 5,
`request_join` draws two random edge-disjoint edges of the member graph (4 distinct members) as
nominators; membership needs full mutual approval, and on success the graph rewires so it stays
~4-regular — every join costs 4 real relationships. The verification contract's sequential phase
borrows its "one at a time, approved by everyone" idea.

## 9. Claims-honesty doctrine

Gloki never fakes trust. Concrete rules already shipped:

- **Demo is always labelled.** Every demo variant shows `<DemoNotice />` ("Demo: this page shows sample
  data…"), and simulated verification paths say they're simulated. Anything that simulates what the
  real platform earns must say so.
- **The Sybil statement** is a static, honest platform statement embedded in the mandate
  document AND its machine-readable spec (`VERIFICATION_STATEMENT`,
  `MandateDocument.tsx:20`): one person one vote, in-person QR web of trust, *"No ID
  papers, no biometrics, no face scans are collected, and no one can buy extra
  influence."* Keep spec copy in English; on-screen copy is i18n'd
  (`mandate.verification.*` keys — see `gloki-i18n-playbook`).

  > **REVIEW NEEDED (2026-10-29): the Sybil statement's wording.** It promises an "in-person QR web of
  > trust", but people are now verified by asking verified members through the app (§8, layer 1), and
  > the first person verifies themselves. Check that the statement still describes what the platform
  > actually does.
- **Votes are disclosed as attributable, not secret** (§2).
- **Claimed ≠ verified adopters** (§7) — never blur the badge.
- **Turnout always names N** (§5).

When writing any new governance copy, match this register: state what the mechanism
actually does, including its limits. Overselling trust is a product bug.

## 10. Adjacent mechanics owned elsewhere

- **Community currency** (demurrage money: daily burn/mint, member allocations to fund
  accounts, `distribute()`) lives in `community_contract.py` — dialect and internals:
  `gloki-python-contracts`; the Funds page seam: `gloki-seam-and-demo-data`.
- **Roles** (`getInitiativeRoles`, `endorse_expert`, `add_co_author`) and the
  get_roles → get_details fallback: `gloki-frontend-architecture`. One governance-relevant
  fact: the real issue contract implements `get_roles`; the demo initiative stub doesn't, so in the demo
  the expert list comes back empty and the RatificationPanel gate effectively works via
  author/co-author.
- **Measurable democratic outcomes** — the ambition that indicators/ratification exist to
  serve (did the mandate change anything measurable?) is an OPEN research direction, not
  a shipped feature: `gloki-research-frontier`.

## Worked example: "add a field to the vote ballot"

Task: show each solution's funding estimate on the vote card.

1. **Which data owns it?** Funding estimate is solution spine data. It's written at Solutions stage
   (`add_proposal` gains an optional trailing argument), never by the vote UI.
2. **Wire name**: a `snake_case` name (e.g. `funding_estimate`) on the real issue contract's
   `add_proposal` and the demo approval stub alike; record it in `docs/FOR_OURI_seam.md`.
3. **Backward compatibility**: contracts are immutable — issues created earlier never return the
   field, and reject the new argument if the UI sends it to them. Make it optional with a default, and
   make every reader tolerate absence (`twin?.funding_estimate ?? undefined`), like `commitments`.
4. **Ballot join**: surface it in QVFlow's `merged` map (`QVFlow.tsx:111-122`) from the
   twin — QVFlow still never writes the approval contract.
5. **Refresh after writes** per layer (demo: re-fetch; real: the write's event).
6. **If seed fixtures change**, bump `DEMO_VERSION` (`gloki-seam-and-demo-data`).
7. New UI copy goes through the i18n ritual (`gloki-i18n-playbook`); pushing waits for
   an explicit go (`gloki-change-control`).

## Provenance and maintenance

Updated 2026-10-29 on branch `unified`. Line numbers drift — trust identifier names. Re-verify:

| Fact | Re-verify with |
|---|---|
| Stage union + UI labels | `head -1 src/types/initiative.ts` and `grep -n "labelDefault" src/components/shared/StageStrip.tsx` |
| 1p1v header, stage-rule defaults, `canParticipate` | `cat src/services/trustModel.ts` |
| Verification phases | `grep -n "phaseOf\|requiredVouches\|canRegister" src/services/verificationRegistry.ts` |
| `heartCost`/`heartsFromCredits`, `2 * h + 1`, `TURNOUT_TARGET` | `grep -n "heartCost\|heartsFromCredits\|2 \* h + 1\|TURNOUT_TARGET" src/components/collaboration/flows/voting/QVFlow.tsx` |
| Real ballot rules | `grep -n "def allocate" -A30 src/assets/contracts/gloki_engage_initiative_contract.py` |
| Spine methods (real / demo) | `grep -n "    def " src/assets/contracts/gloki_engage_initiative_contract.py`; `grep -n "case '" src/services/demo/demoContracts/approval.ts` |
| Ratification storage | `grep -n "RATIFICATION_KEY\|set_property" src/services/mandateRatification.ts` |
| Conviction rules | `grep -n "def stake\|def update_stake\|_conviction_strength" src/assets/contracts/gloki_engage_initiative_contract.py` |
| Sybil statement + turnout sentence | `grep -n "VERIFICATION_STATEMENT\|turnoutLine" src/components/mandate/MandateDocument.tsx` |
| Problem threshold 50% | `grep -n "0.5" src/components/initiative/useInitiativePost.ts` |

Open items (not shipped): expert-role gating on `add_expert_review`, real ratification storage, real
adopter attestation; outcome measurement is `gloki-research-frontier`.
