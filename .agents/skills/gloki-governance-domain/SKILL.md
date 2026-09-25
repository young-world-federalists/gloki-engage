---
name: gloki-governance-domain
description: "Use when touching any governance mechanic in Communities2/Gloki: the 5-stage pipeline (Problem/Discussion/Solutions/Vote/Mandate), quadratic voting, hearts, credits, vote budgets, turnout, ballot or results UI, QVFlow, useMandate, ratification, indicators, commitments, metrics, conviction staking, adopters, trust/verification/vouching, canParticipate, stage permission rules, Sybil resistance, 1p1v — or when confused why 'verified' means three different things, why votes read back as sqrt(credits), or which contract owns a ballot field."
---

# Gloki Governance Domain — direct democracy as implemented here

## Overview

This skill is the domain-theory pack for Gloki's governance mechanics **as shipped in this
repo** — not a civics textbook. Everything below was read out of the code at commit
`c26cdc4` (2026-07-02); file:line references point at the ground truth.

**Core principle: trust gates WHO may act; it never weights a vote.** One person, one
vote (1p1v) is a LOCKED product decision (see `gloki-change-control`) written into the
header of `src/services/trustModel.ts`: *"permission rules gate ELIGIBILITY to act, never
the WEIGHT of a vote… Never make participation plutocratic."* Any feature that weights
votes by tokens, vouches, stake, or reputation is off-limits by design — do not propose
it, do not relitigate it.

Two vocabulary facts you need before anything else:

- **The seam** = `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/
  `joinContract`), currently backed by the `src/services/demo/` mock layer. All
  governance state lives behind it.
- **Wire names vs UI labels**: the UI says **"Solutions"** but every method/field name on
  the wire stays **`proposal`** (`add_proposal`, `proposal_id`, `get_proposals`) because
  it must byte-match Ouri's real Python contracts. This is "The one rule that must not
  break" (`docs/FOR_OURI_seam.md:8`). Never invent a wire name from UI vocabulary.

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
(`StageAdvanceBar.tsx:114` gates on `isAuthorOrCoAuthor`), writing `set_stage` through
the seam. The demo initiative contract enforces exactly one step at a time — `set_stage`
rejects `idx !== cur + 1` with "Stages can only advance one step at a time"
(`src/services/demo/demoContracts/initiative.ts:120-136`). There is no "skip to mandate".

**Solution merging is suggest-only, never automatic**: `suggest_proposal_merge` records a
suggestion on the source proposal (`approval.ts:195-210`); nothing auto-merges.

## 2. Quadratic voting as shipped

The whole QV implementation is two files: UI in
`src/components/collaboration/flows/voting/QVFlow.tsx`, stub contract in
`src/services/demo/demoContracts/qv.ts` (mock of `qv_contract.py`).

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

**Contract-side `allocate` validation** (`qv.ts:113-132`): voting status must be
`'open'`; every credit value must be an integer ≥ 0; every proposal id must exist;
total ≤ `credits_per_voter`. Zero-credit entries are dropped. The allocation replaces the
caller's previous one wholesale.

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

## 3. Two-contract vote architecture — "which contract owns this field?"

The vote stage joins **two** contracts. This is the first question to ask before adding
any field to the ballot, results, or mandate:

| Contract (stub → real) | Stage key on the parent initiative | Owns | Who writes it |
|---|---|---|---|
| `qv.ts` → `qv_contract.py` | `voteContractId` | Vote MECHANICS: proposals list (id/text/author), config, allocations, results | Voters (`allocate`), via QVFlow |
| `approval.ts` → `approval_contract.py` (the "approval twin") | `proposalsContractId` | The SPINE: canonical text, `commitments`, author `metrics`, `sources`, `co_authors`, `expertReviews`, merge suggestions | Solutions-stage UI (SolutionsBoard etc.) — **never** the vote or mandate UI |

QVFlow resolves both (`QVFlow.tsx:44-50`) and joins rows **by proposal id**
(`QVFlow.tsx:111-122`): the qv contract supplies mechanics, the twin supplies
text/commitments/metrics (`twin?.text ?? q.text` fallback). The ballot filters to
expert-reviewed solutions (`reviews.length > 0`) with a **graceful fallback to all** when
nothing is reviewed yet (`QVFlow.tsx:123-124`).

**Read-only rule**: QVFlow and `useMandate` READ the approval twin and must NEVER write
it. If your feature needs to persist something at vote/mandate time, it does not belong
on the approval contract — it belongs on the qv contract (voting mechanics) or as a
property on the initiative contract (like ratification, §5).

**Related trap (S11 incident, recorded in project memory 2026-07-01)**: a component that
merely *displays* stage data must not call `useFlowContract` — in shared mode that hook
joins-or-DEPLOYS. Pure reads go through `resolveInitiativeStageContract`
(`src/services/contracts/initiative.ts:65`). Details and the hook decision table:
`gloki-frontend-architecture`. (Nuance: `useMandate` itself currently uses
`useFlowContract` shared mode to resolve both contracts — it predates the rule and is on
pages where the contracts must exist anyway; `useMandateJourney.ts` shows the read-only
resolver pattern.)

**Sub-contract registration is first-write-wins**: `register_stage_contract` on the
initiative contract returns the existing payload if the stage key is already taken
(`demoContracts/initiative.ts:137-155`) — that is how concurrent deploy races resolve to
one shared contract per stage. And the demo seam emits **no write events**: after every
`contractWrite`, re-fetch explicitly (`QVFlow.tsx:148` is the canonical example).

## 4. The commitments/metrics spine (approval contract methods)

The spine is what threads Solutions → Vote → Mandate. All on the approval twin
(`src/services/demo/demoContracts/approval.ts`):

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

**The demo expert gate is permissive by design** — the stub lets anyone
`add_expert_review`; the comment at `approval.ts:170-172` records that Ouri's REAL
contract must gate it on the expert role. Do not rely on the stub for authorization
semantics, and do not remove the FOR OURI comments that carry these obligations.

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
  flashing the previous initiative's mandate (`useMandate.ts:70-75`, a real past bug)

**Ratification is a completeness predicate, not a ceremony.** A mandate flips to
`'ratified'` automatically when EVERY indicator has non-empty target + baseline + cadence
(`isMandateRatified`, `fixtures/mandate.ts:129-133`; applied at `useMandate.ts:142`).
`RatificationPanel` (`src/components/mandate/RatificationPanel.tsx:39-45`) is gated to
host / co-author / endorsed expert via `getInitiativeRoles`, and saves the WHOLE
indicator map as one JSON string property `mandate_ratification` on the **initiative**
contract via `set_property`/`get_properties` — full replace on save
(`src/services/mandateRatification.ts`, `RATIFICATION_KEY = 'mandate_ratification'`).

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

Time-weighted backing of a published mandate
(`src/services/demo/demoContracts/conviction.ts`):

- `stake(amount, duration, country)` — amount > 0; duration one of the multiplier keys;
  country normalized to upper-case or `'OTHER'`
- `DURATION_MULTIPLIERS` (`conviction.ts:17-19`): `1w`=1×, `1m`=2×, `3m`=4×, `6m`=7×,
  `1y`=12×
- conviction = amount × multiplier; `get_total_conviction` returns `{total, count}`;
  `get_conviction_by_country` aggregates per country
- re-staking ADDS to the caller's amount but OVERWRITES duration and country
  (`conviction.ts:80-89`) — one stake row per voter

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

## 8. The THREE unrelated trust layers sharing the word "verified"

When anyone says "verified", first establish WHICH layer. They are three unrelated
mechanisms:

| Layer | Mechanism | Where | Threshold / rule |
|---|---|---|---|
| 1. UI vouch web-of-trust | Members vouch for each other in person by scanning QR codes | `src/services/trustModel.ts` + `src/components/community/IdentityTrust.tsx` | `TrustState`: unverified (0) / vouched (≥1) / **verified (≥ VERIFIED_THRESHOLD = 4)**; onboarding seeds 2 (`ONBOARDING_SEED`), so new users are "pending" |
| 2. Contract-level nomination graph | Edge-rewiring membership approval — the real Sybil defense | `src/assets/contracts/community_contract.py:76-131` (`request_join`/`approve`) | see below |
| 3. Mandate adopter flag | Attestation that an ORGANIZATION's adoption claim is confirmed | `fixtures/mandate.ts:73-79` (§7) | seeded/attested only; viewer endorsements always claimed |

`canParticipate(rule, trust, isMember)` (`trustModel.ts:35-39`) is **the single
eligibility gate** in the UI — layer 1 feeding the per-stage rules of §1. `'verified'`
rule = member AND trust === 'verified'. Do not write a second gate.

**Layer 2, the nomination graph** (worth understanding — it is the platform's actual
Sybil economics): first member joins free; while members < 5, one nominate at a time is
approved by all existing members; at ≥ 5 members, `request_join` draws two random
edge-disjoint edges of the member graph (4 distinct members) as nominators. Membership
requires full mutual approval among all 4 nominators and the nominate; on success the
graph REWIRES — each nominator drops the edge to their pair-partner and gains an edge to
the new member. The graph stays ~4-regular, so every join costs 4 real in-person
relationships. `disapprove()` tears the nomination down. (Internals of the Python dialect:
`gloki-python-contracts`.)

**Layer-1 lore — "the gate that makes the demo SAFE makes it EMPTY"** (persona-review
learning, recorded in project memory 2026-06-29): vote/mandate default to the `verified`
rule, so a fresh demo user (2 seeded vouches) sees them locked. The **"Meet a member
(demo)"** affordance (`IdentityTrust.tsx:94`, comment at :34-36) exists precisely so a
pending user can cross 2 → 4 vouches and watch the gated stages unlock live — the QR
camera isn't exercisable in the preview. Do not delete it as "demo cruft", and keep its
`(demo)` label (§9).

## 9. Claims-honesty doctrine

Gloki never fakes trust. Concrete rules already shipped:

- **Demo affordances are labeled `(demo)`** in the UI — e.g. "Meet a member (demo)".
  Anything that simulates what the real platform earns must say so.
- **The Sybil statement** is a static, honest platform statement embedded in the mandate
  document AND its machine-readable spec (`VERIFICATION_STATEMENT`,
  `MandateDocument.tsx:20`): one person one vote, in-person QR web of trust, *"No ID
  papers, no biometrics, no face scans are collected, and no one can buy extra
  influence."* Keep spec copy in English; on-screen copy is i18n'd
  (`mandate.verification.*` keys — see `gloki-i18n-playbook`).
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
  fact: the demo initiative contract does not implement `get_roles`, so in the demo the
  expert list comes back empty and the RatificationPanel gate effectively works via
  author/co-author.
- **Measurable democratic outcomes** — the ambition that indicators/ratification exist to
  serve (did the mandate change anything measurable?) is an OPEN research direction, not
  a shipped feature: `gloki-research-frontier`.

## Worked example: "add a field to the vote ballot"

Task: show each solution's funding estimate on the vote card.

1. **Which contract owns it?** Funding estimate is solution TEXT/spine data → the
   approval twin, not the qv contract. It must be written at Solutions stage
   (`add_proposal` gains an optional field), never by the vote UI.
2. **Wire name**: pick a `snake_case` name that Ouri's real `approval_contract.py` will
   adopt (e.g. `funding_estimate`), check `docs/FOR_OURI_seam.md` for collisions, and
   update that doc — the seam contract table is the hand-off of record.
3. **Backward compatibility**: contracts are immutable after deploy — already-deployed
   communities will never return the field. Make it optional in the stub
   (`approval.ts` proposal shape) and make every reader tolerate absence
   (`twin?.funding_estimate ?? undefined`), exactly like `commitments`/`metrics` do.
4. **Ballot join**: surface it in QVFlow's `merged` map (`QVFlow.tsx:111-122`) from the
   twin — QVFlow still never writes the approval contract.
5. **Re-fetch after any write** at Solutions stage (no write events in the demo seam).
6. **If seed fixtures change**, bump `DEMO_VERSION` (`gloki-seam-and-demo-data`).
7. New UI copy goes through the i18n ritual (`gloki-i18n-playbook`); pushing waits for
   Eston's green light (`gloki-change-control`).

## Provenance and maintenance

All facts verified 2026-07-02 against branch `ui` @ commit `c26cdc4` by direct file
reads. Incident details ("S11", persona-review learnings, QV revert) come from in-repo
docs/commits plus project memory (recorded 2026-06/07). Line numbers WILL drift — trust
the identifier names over the `:NN`. Re-verify the volatile facts:

| Fact | Re-verify with |
|---|---|
| Stage union + UI labels | `head -1 src/types/initiative.ts` and `grep -n "labelDefault" src/components/shared/StageStrip.tsx` |
| 1p1v header, `VERIFIED_THRESHOLD=4`, stage-rule defaults, `canParticipate` | `cat src/services/trustModel.ts` (39 lines) |
| `heartCost`/`heartsFromCredits`, `2 * h + 1`, `TURNOUT_TARGET=75` | `grep -n "heartCost\|heartsFromCredits\|2 \* h + 1\|TURNOUT_TARGET" src/components/collaboration/flows/voting/QVFlow.tsx` |
| `get_results` sqrt + `allocate` validation + default budget 100 | `grep -n "sqrt\|credits_per_voter" src/services/demo/demoContracts/qv.ts` |
| Two-contract join + stage keys | `grep -n "proposalsContractId\|voteContractId" src/components/collaboration/flows/voting/QVFlow.tsx src/hooks/useMandate.ts` |
| Spine methods + limits + permissive expert gate | `grep -n "case '" src/services/demo/demoContracts/approval.ts` |
| `isMandateRatified`, label-keyed ratification, `mandate_ratification` key | `grep -n "isMandateRatified\|RATIFICATION_KEY\|indicators\[label\]" src/services/demo/fixtures/mandate.ts src/services/mandateRatification.ts src/hooks/useMandate.ts` |
| Conviction multipliers | `grep -n "DURATION_MULTIPLIERS" -A 2 src/services/demo/demoContracts/conviction.ts` |
| Nomination graph | `sed -n '76,135p' src/assets/contracts/community_contract.py` |
| Sybil statement + turnout sentence | `grep -n "VERIFICATION_STATEMENT\|turnoutLine" src/components/mandate/MandateDocument.tsx` |
| Problem threshold 50% | `grep -n "0.5" src/components/initiative/useInitiativePost.ts` |
| Seam rule of record | `sed -n '1,40p' docs/FOR_OURI_seam.md` |

Open/candidate items (NOT shipped facts): real expert-role gating on
`add_expert_review`, a real ratification contract, real adopter attestation — all are FOR
OURI obligations carried in code comments; outcome measurement is `gloki-research-frontier`.
