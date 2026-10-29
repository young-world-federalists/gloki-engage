# Session 4 — Solutions card + commitments/metrics data spine

**Date:** 2026-06-27
**Branch:** `ui` (UI-only stub seam; no backend)
**Roadmap:** `docs/superpowers/specs/2026-06-25-design-consistency-pipeline-redesign-roadmap.md` (§2 decision #2, §5 Session 4, §6 the S4→S5→S6 chain)
**Status:** Brainstorm complete; decisions locked with Eston. Ready for `writing-plans`.

> Redesign the **Solutions (proposals) card** and lay the **commitments + metrics data
> spine** that S5 (Vote) carries and S6 (Mandate) consumes. The spine is the load-bearing
> part: the Mandate's "What we commit to" / "How we'll know it's working" stop being
> hardcoded fixtures and become derived from the winning solution.

---

## 1. Goal

The Solutions stage today renders `ApprovalFlow` (add proposal, approve toggle, a
Proposals/Results `SegmentedControl`, a person-endorsement `ExpertEndorseButton`, and a
separate `ProposalMergePanel`). It carries **no commitments and no metrics**, so the
downstream Mandate has nothing real to consume. Session 4:

1. Redesigns the card: scope badge, SDG badge, two read-only threshold bars, an
   **add-solution-first** body, a solutions list where each solution shows its commitments
   and a `UserIdentity` byline, and a folded **3-action row** (upvote · request expert
   review · suggest merge) with a merge "pick a target" interaction.
2. Lays the data spine: `commitments` (authored here) + an **expert-review pathway**
   attaching `metrics`, both living on the `Proposal` in `approval.ts`, readable back by
   S5/S6. New/extended demo methods, all documented **FOR OURI**.

## 2. Locked decisions (from the brainstorm)

| # | Decision |
|---|----------|
| D1 | **Scope source = explicit field.** Add `scope: 'global' \| 'community'` to the `SeedInitiative` fixture (`problems.ts`); never derive from country count. Rendered as a **standalone badge** ("Global problem" / "Community problem") alongside the SDG chip — *not* an inline text prefix. |
| D2 | **SDG badge** on the card (reuse `SdgTag` / `SDG_OPTIONS`, already on `SeedInitiative`). |
| D3 | **Commitments popup.** "Add a solution" opens a `Modal`: solution text + **3 free-text commitment lines, ≥1 required** (the rest encouraged). Prompt copy: *"Who and what needs to change?"* Stored as `commitments: string[]`. No per-commitment sub-fields. |
| D4 | **Expert mechanic = new clean solution-level action.** A per-solution **"Request expert review"** counter (1p1v), stored as `expertReviewRequests: string[]` (public keys) on the proposal. **Remove `ExpertEndorseButton` from this card** (the author-as-expert endorsement is a different concept and leaves the solution card; the IdentityTrust page keeps its own treatment). |
| D5 | **3-action row per solution:** upvote · request expert review · suggest merge (suggest **only**, never accept). |
| D6 | **Merge = "pick a target" mode, stored at proposal level.** Tapping "suggest merge" enters a mode: the source solution dims, every other solution gets a **token-pure pulsing accent ring** + "tap to merge into this", and a banner offers Cancel. Tapping a target records a **suggestion** (suggest only — never accept). `prefers-reduced-motion` → static ring, no pulse. **Note:** the existing `merge.ts` mechanic is *cross-initiative* (`propose_merge(source_initiative_id, …)`) and does **not** fit solution→solution merges within one slate; S4 stores merge suggestions in `approval.ts` instead (see §4). The pick-a-target *interaction* is the genuinely new bit. |
| D7 | **Two threshold indicators** (reuse the `ProblemVoteFlow` bar pattern; both **read-only**, no hard gate — consistent with S2 killing the 33% gate). **T1:** count of solutions each backed by upvotes from ≥50% of the community, target **5** ("Solutions backed by half the community: 3/5"). **T2:** literal **"Experts reviewed"** = distinct experts who have **actually attached a review**, target **3** (seeded so the bar shows movement, e.g. 2/3). The member "request expert review" signal does **not** fill T2 — it narratively prompts the Gloki Team to solicit experts. |
| D8 | **Remove the Results tab.** The `SegmentedControl` goes; the Proposals view becomes the whole card. |
| D9 | **Expand-in-place** on the solution card, consistent with the problem card (no routing away to the initiative page). |
| D10 | **Data spine** lives on the `Proposal` in `approval.ts` (see §4). S5/S6 read it back from the initiative's approval contract. |

## 3. Card anatomy (360px flagship; light + dark)

Rendered inside the shared `InitiativeStageCard` — the shell owns the read "forehead"
(headline/byline/meta); this Engage slot owns participation.

```
┌─ forehead (card shell) ──────────────────────────────┐
│ [Global problem]  [SDG 3 · Good health]               │   ← scope badge + SDG badge
│ Drug-resistant infections already kill over a         │
│ million people a year. How should communities…        │
├─ Engage slot (redesigned ApprovalFlow) ───────────────┤
│ Solutions backed by half the community     3 / 5      │   ← threshold bar 1 (read-only)
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░                                       │
│ Experts reviewed                           2 / 3      │   ← threshold bar 2 (read-only)
│ ▓▓▓▓▓▓▓▓▓▓░░░░░                                        │
│                                                       │
│ [ + Add a solution to this problem ]                  │   ← opens commitments Modal
│                                                       │
│ ┌ solution ─────────────────────────────────────┐    │
│ │ Fund community antibiotic stewardship leads…    │    │
│ │ • Health ministries fund one steward / district │    │   ← commitments (small bullets)
│ │ • Clinics adopt shared prescribing guidelines   │    │
│ │ 🇰🇪 Amara Okonkwo ˢʰⁱᵉˡᵈ      ✓ expert reviewed  │    │   ← UserIdentity + review marker
│ │ [▲ 142]  [🔬 3]  [⤚ merge]                       │    │   ← 3-action row, ≥40px tall
│ └─────────────────────────────────────────────────┘    │
│ ┌ solution … ┐                                          │
└────────────────────────────────────────────────────────┘
```

- **Add-solution-first** (above the list), per roadmap.
- Each solution: text → commitment bullets → `UserIdentity` byline (+ co-authors when
  present, carried from S3's `coAuthors`) → "expert reviewed" marker when
  `expertReviews.length > 0` → the 3-action row.
- The **merge "pick a target" mode** replaces the list with the dimmed-source + ringed-
  targets treatment + a Cancel banner (mockup state C, approved).

## 4. Data spine (FOR OURI) — `src/services/demo/demoContracts/approval.ts`

`Proposal` gains three **optional, backward-compatible** fields:

```ts
interface ExpertReview {
  expert: string;       // public key of the reviewing expert
  metrics: string[];    // "how we'll know it's working" — consumed by S6 as indicators
  note?: string;        // optional short review note
  timestamp: number;
}

interface MergeSuggestion {
  target: string;       // id of the proposal this one is suggested to merge into
  suggester: string;    // public key of the member who suggested it
  timestamp: number;
}

interface Proposal {
  id; text; author; timestamp; coAuthors?;          // unchanged (coAuthors from S3)
  commitments?: string[];           // authored in the add-solution popup (≥1)
  expertReviewRequests?: string[];  // public keys of members who requested review (1p1v)
  expertReviews?: ExpertReview[];   // experts who reviewed, each attaching metrics
  mergeSuggestions?: MergeSuggestion[]; // solution→solution merge suggestions (suggest-only)
}
```

**Methods** (each tagged `// FOR OURI` in code, like S2's `like_comment` / S3's
`set_statement`):

| Method | Kind | Behaviour |
|--------|------|-----------|
| `add_proposal(text, co_authors?, commitments?)` | write | **Extend** the existing write with `commitments` (sanitised: array of non-empty strings, cap length/count). `co_authors` unchanged. |
| `request_expert_review(proposal_id)` | write | Toggle `caller` in/out of that proposal's `expertReviewRequests` (1p1v). Re-fetch after (demo seam emits no events). |
| `add_expert_review(proposal_id, metrics, note?)` | write | Append an `ExpertReview` for `caller`. **Demo gate:** in the stub, permissive; **FOR OURI:** the real contract gates this on the caller holding the expert role. One review per expert per proposal (replace on re-submit). |
| `suggest_proposal_merge(source_id, target_id)` | write | Record a `MergeSuggestion` on `source_id` pointing at `target_id` (suggest-only — never merges). Dedup per suggester+target. |

Reads: `get_proposals` already returns the proposal map and now carries the richer shape —
no new read needed. Threshold counts are computed **client-side** from the proposal map +
`communityMemberCount` (T1) and the set of distinct `expertReviews[].expert` across
proposals (T2).

**S5/S6 readback:** the winning solution is just a `Proposal` in the initiative's approval
contract (`parentContractId = initiativeId`, `stageKey = 'proposalsContractId'`). S5 (Vote)
renders the expert-reviewed solutions with their `commitments` + `expertReviews[].metrics`;
S6 (Mandate) derives "What we commit to" from `commitments` and "How we'll know it's
working" from `expertReviews[].metrics`, replacing the hardcoded `fixtures/mandate.ts`
articles/indicators. **S4 only authors + stores + displays; the S5/S6 consumption is their
own sessions** — S4's job is to shape the spine so they can.

## 5. Expert-review authoring (light, gated)

So the spine produces real data (and T2 can move by action, not only seed): if the current
user is an expert for the initiative (`getInitiativeRoles().experts` includes their key),
each solution shows a small **"Add expert review"** control opening a metrics `Modal`
(1–N metric lines + optional note) → `add_expert_review`. Non-experts never see it. This is
intentionally minimal; the richer "experts edit the community-voted solutions" flow is a
later concern. The threshold display works from seeded reviews regardless.

## 6. Components & files

- **`ApprovalFlow.tsx` + `.module.scss`** — primary redesign: drop the `SegmentedControl`
  + Results branch (D8) + the `ExpertEndorseButton` import (D4); add the two threshold bars
  (reuse the `ProblemVoteFlow` bar markup/styles — extract a shared `ThresholdBar` if clean),
  the add-solution `Modal` (commitments), the per-solution commitments list + `UserIdentity`
  byline + 3-action row + merge "pick a target" mode. Needs `communityMemberCount` (T1) →
  thread through `ProposalsStage` / `SolutionEngage`.
- **`approval.ts`** — the spine (§4). Plus extend `initApproval` to seed
  `commitments`/`expertReviews`.
- **`approvalApi.ts`** — add `requestExpertReview`, `addExpertReview`; extend `addProposal`
  signature with `commitments`.
- **`problems.ts`** — add `scope` to `SeedInitiative` + seed it on all `INITIATIVES`.
- **`ProposalsStage.tsx` / `SolutionEngage.tsx`** — pass `communityMemberCount`, scope, SDG
  down. **Drop the `ProposalMergePanel`** from the dashboard variant: the card-level merge is
  now the "pick a target" mode writing `suggest_proposal_merge` (§4). (`ProposalMergePanel` /
  `merge.ts` stay in the repo for the cross-initiative use case — just not on this card.)
- **Reuse:** `UserIdentity`, `Modal`, `Button`, `Badge`, the `ProblemVoteFlow` threshold
  bar, `SdgTag`, `initiativeRoles` (for the expert-only authoring gate).
- **Seed:** sample commitments on the proposals stage initiatives (`amr`, `jobs`) + 2 expert
  reviews (so T2 reads 2/3) + `scope` on every initiative. Bump `DEMO_VERSION` global-v7 →
  **global-v8** in `mockApi.ts`.

## 7. i18n

New user-facing strings ship at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`; en
inline). New keys (illustrative): `mechanisms.approval.scopeGlobal` / `scopeCommunity`,
`thresholdSolutions`, `thresholdExperts`, `addSolutionCta`, `commitmentsPrompt` /
`commitmentsHint` / `commitmentPlaceholder`, `requestExpertReview`, `suggestMerge`,
`mergePickTarget` / `mergeCancel`, `expertReviewed`, `addExpertReview`, `metricsPrompt`.
After adding: key-parity check (extract `'key':`, sort, diff fr vs sw → empty) + code-ref↔
i18n cross-check. Append to `docs/i18n-native-review-candidates.md` (wordlists/codes stay
English). **Remove** the now-dead Results-tab keys (`tabResults`, `noResults`,
`approvalsCount`, `viewToggle`, `tabProposals`) from en/fr/sw, keeping parity.

## 8. Accessibility & tokens (per DESIGN_SYSTEM.md)

- Tokens only (no new hex); merge ring + pulse are token-pure with a reduced-motion
  fallback. Stage-Solutions accent from the canonical `$stage-*` palette.
- Icon-only actions get `aria-label`; the upvote/request/merge buttons are ≥44px touch
  (the mockup's 40px is min — bump to 44 in build). No `$gray-400` text; AA contrast; visible
  focus rings. The merge mode is keyboard-operable (targets are buttons; Esc / Cancel exits).

## 9. Out of scope

- S5/S6 consumption (their own sessions) — S4 only authors/stores/displays the spine.
- Backend; the deferred dormant code (`PositionsBoard`/`AnchoredThread`/etc.) and the 3
  outstanding S2 cleanups — leave unless touched.
- No new color-token or button work beyond using the S1 foundation.

## 10. Verification

`npm run build` clean (tsc -b) before each commit. Manual verify via `preview_*` (dev server
`gloki-dev`, 5173) at **360px, light + dark**: scope/SDG badges, both threshold bars,
add-solution Modal (≥1-required validation), commitments rendering, the 3-action row,
upvote/request-review re-fetch, the merge "pick a target" mode + Cancel + reduced-motion,
expand-in-place, expert-only "Add expert review". Then the `/code-review` local panel gate
(no `--quit-chrome`), confirm seed + deploy with Eston, push `origin/ui`.
