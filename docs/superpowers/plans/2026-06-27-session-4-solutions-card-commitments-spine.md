# Session 4 — Solutions Card + Commitments/Metrics Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Solutions (proposals) card and lay the commitments + expert-metrics data spine on the `Proposal`, so the Mandate (S6) can later derive its commitments/indicators from the winning solution.

**Architecture:** The data spine extends the demo `approval.ts` contract with three optional fields (`commitments`, `expertReviewRequests`, `expertReviews`) plus a `mergeSuggestions` field, all backward-compatible, with new methods documented FOR OURI. The card UI becomes a new focused `SolutionsBoard` component (Solutions stage only) so the shared `ApprovalFlow` used by the collab-menu registry is left untouched. Scope flows through the same fixture→framing→`StagePost` path the SDG already uses.

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules. Demo seam under `src/services/demo/` (no backend). No test framework — verify via `npm run build` (runs `tsc -b`) + the `preview_*` tools (dev server `gloki-dev`, port 5173).

## Global Constraints

- **Branch `ui`, keep it runnable.** Every read/write stays behind `src/services/api.ts`; never call a real server from a component. The demo seam emits **no `contract_write` events** → flows **re-fetch after writes**.
- **`npm run build` must be clean** (`tsc -b`) before every commit. There is no test runner; "verify" = build + targeted `preview_*` checks.
- **Tokens only** — no new hex. Stage-Solutions accent from the canonical `$stage-*` palette. The merge gradient/ring is token-pure with a `prefers-reduced-motion` fallback.
- **AA per `DESIGN_SYSTEM.md`:** no `$gray-400` body text; interactive controls ≥44px touch; visible focus rings; icon-only buttons get `aria-label`.
- **New user-facing strings ship at fr + sw key parity** (`src/i18n/fr.ts` + `src/i18n/sw.ts`; en is the inline `t()` default). After adding: extract `'key':` lines, sort, diff fr vs sw → must be empty. Append new keys to `docs/i18n-native-review-candidates.md` (wordlists/codes stay English).
- **New contract methods/fields named cleanly and tagged `// FOR OURI`** (he has no commitments/metrics contract yet), like S2's `like_comment` / S3's `set_statement`.
- **360px flagship; verify light + dark.**
- **Bump `DEMO_VERSION`** `global-v7` → `global-v8` when new demo data is seeded.
- Spec: `docs/superpowers/specs/2026-06-27-session-4-solutions-card-commitments-spine-design.md`.

---

## File Structure

- `src/services/demo/demoContracts/approval.ts` — **modify**: the data spine (fields + methods + seeding passthrough).
- `src/components/collaboration/flows/voting/approvalApi.ts` — **modify**: client wrappers for the new methods + `commitments`.
- `src/services/demo/fixtures/problems.ts` — **modify**: `scope` on `SeedInitiative` + `ProblemFraming` + all `INITIATIVES`.
- `src/components/stages/ProblemStage.demo.ts` — **modify**: `scope` on the propose-issue path.
- `src/components/initiative/useInitiativePost.ts` — **modify**: expose `scope` on the post.
- `src/components/initiative/InitiativeStageCard.tsx` — **modify**: `scope` on `StagePost` + render scope badge in the meta line.
- `src/components/community/SolutionActivityCard.tsx` — **modify**: thread `scope` into the post + `communityMemberCount` into `SolutionEngage`.
- `src/components/collaboration/InitiativeStagePanel.tsx` — **modify**: thread `communityMemberCount` into `SolutionEngage`.
- `src/components/initiative/stages/SolutionEngage.tsx` — **modify**: accept + forward `communityMemberCount`.
- `src/components/stages/ProposalsStage.tsx` — **modify**: render `SolutionsBoard` (dashboard) instead of `ApprovalFlow`; drop `ProposalMergePanel`; forward `communityMemberCount`.
- `src/services/demo/fixtures/deliberation.ts` — **modify**: seed commitments + expert reviews maps.
- `src/services/demo/seedDemoCommunity.ts` — **modify**: attach seeded commitments/reviews to proposals.
- `src/services/demo/mockApi.ts` — **modify**: `DEMO_VERSION` bump.
- `src/components/initiative/stages/SolutionsBoard.tsx` — **create**: the redesigned solutions experience.
- `src/components/initiative/stages/SolutionsBoard.module.scss` — **create**: its styles.
- `src/i18n/fr.ts`, `src/i18n/sw.ts` — **modify**: new keys + remove dead Results keys.
- `docs/i18n-native-review-candidates.md` — **modify**: append new keys.

---

## Task 1: Data spine in `approval.ts`

**Files:**
- Modify: `src/services/demo/demoContracts/approval.ts`

**Interfaces:**
- Produces: `Proposal` gains `commitments?: string[]`, `expertReviewRequests?: string[]`, `expertReviews?: ExpertReview[]`, `mergeSuggestions?: MergeSuggestion[]`. New write methods: `request_expert_review` (values `{ proposal_id }`), `add_expert_review` (values `{ proposal_id, metrics, note? }`), `suggest_proposal_merge` (values `{ source_id, target_id }`). `add_proposal` now also reads `values.commitments`.

- [ ] **Step 1: Add the new interfaces + extend `Proposal`**

In `approval.ts`, replace the `Proposal` interface (lines ~5-11) with:

```ts
interface ExpertReview {
  expert: string;     // public key of the reviewing expert
  metrics: string[];  // "how we'll know it's working" — consumed by S6 as indicators
  note?: string;      // optional short review note
  timestamp: number;
}

interface MergeSuggestion {
  target: string;     // id of the proposal this one is suggested to merge into
  suggester: string;  // public key of the member who suggested it
  timestamp: number;
}

interface Proposal {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  coAuthors?: string[];
  // --- S4 commitments/metrics spine (all optional, backward-compatible) ---
  commitments?: string[];           // authored in the add-solution popup (≥1)
  expertReviewRequests?: string[];  // public keys of members who requested review (1p1v)
  expertReviews?: ExpertReview[];   // experts who reviewed, each attaching metrics
  mergeSuggestions?: MergeSuggestion[]; // solution→solution merge suggestions (suggest-only)
}
```

- [ ] **Step 2: Add a commitments sanitiser + extend `add_proposal`**

Below the existing `cleanText` helper (after line ~52), add:

```ts
// Sanitise a commitments array: trim, drop empties, cap to 3 lines × 280 chars.
// FOR OURI: `add_proposal` gains optional `commitments` (string list) authored
// in the add-solution popup; the winning proposal's commitments become the
// Mandate's "What we commit to" (S6). ≥1 is enforced in the UI, not here.
function cleanStringList(raw: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x.length > 0 && x.length <= maxLen)
    .slice(0, maxItems);
}
```

In the `add_proposal` case, after the `coAuthors` line and before the `s.proposals[id] = ...` assignment, add the commitments read, then include it in the stored object:

```ts
      const commitments = cleanStringList(method.values?.commitments, 3, 280);
      s.proposals[id] = { id, text, author: caller, timestamp: Date.now(), coAuthors, commitments };
```

- [ ] **Step 3: Add the three new write methods**

In `approvalWrite`, before the `default:` case, add:

```ts
    case 'request_expert_review': {
      // FOR OURI: a 1p1v member signal that a solution should get expert review.
      // Toggles the caller in/out of the proposal's expertReviewRequests. This
      // does NOT mark the solution expert-reviewed — it narratively prompts the
      // Gloki Team to solicit experts (see add_expert_review).
      const pid = method.values?.proposal_id as string | undefined;
      if (!pid || !(pid in s.proposals)) return { error: 'Unknown proposal' };
      const p = s.proposals[pid];
      const reqs = Array.isArray(p.expertReviewRequests) ? p.expertReviewRequests : [];
      p.expertReviewRequests = reqs.includes(caller)
        ? reqs.filter((k) => k !== caller)
        : [...reqs, caller];
      writeState(contractId, s);
      return null;
    }
    case 'add_expert_review': {
      // FOR OURI: an expert attaches metrics ("how we'll know it's working") to a
      // solution. Demo gate is permissive; the real contract MUST gate this on the
      // caller holding the expert role. One review per expert per proposal (replace
      // on re-submit). The winning proposal's metrics become the Mandate's
      // "How we'll know it's working" (S6).
      const pid = method.values?.proposal_id as string | undefined;
      if (!pid || !(pid in s.proposals)) return { error: 'Unknown proposal' };
      const metrics = cleanStringList(method.values?.metrics, 5, 280);
      if (metrics.length === 0) return { error: 'At least one metric is required' };
      const rawNote = method.values?.note;
      const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim().slice(0, 500) : undefined;
      const p = s.proposals[pid];
      const reviews = Array.isArray(p.expertReviews) ? p.expertReviews.filter((r) => r.expert !== caller) : [];
      reviews.push({ expert: caller, metrics, note, timestamp: Date.now() });
      p.expertReviews = reviews;
      writeState(contractId, s);
      return null;
    }
    case 'suggest_proposal_merge': {
      // FOR OURI: a suggest-only solution→solution merge (never auto-merges).
      // Records the suggestion on the source proposal pointing at the target.
      const sourceId = method.values?.source_id as string | undefined;
      const targetId = method.values?.target_id as string | undefined;
      if (!sourceId || !(sourceId in s.proposals)) return { error: 'Unknown source proposal' };
      if (!targetId || !(targetId in s.proposals) || targetId === sourceId) return { error: 'Invalid merge target' };
      const p = s.proposals[sourceId];
      const existing = Array.isArray(p.mergeSuggestions) ? p.mergeSuggestions : [];
      if (!existing.some((m) => m.target === targetId && m.suggester === caller)) {
        existing.push({ target: targetId, suggester: caller, timestamp: Date.now() });
      }
      p.mergeSuggestions = existing;
      writeState(contractId, s);
      return null;
    }
```

(`initApproval` needs no change — it spreads `Proposal[]` into the map, so the new optional fields flow through when the seeder supplies them in Task 4.)

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS (no TS errors). The new optional fields are backward-compatible.

- [ ] **Step 5: Commit**

```bash
git add src/services/demo/demoContracts/approval.ts
git commit -m "feat(approval): commitments + expert-review + merge-suggestion spine (FOR OURI)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Client API wrappers in `approvalApi.ts`

**Files:**
- Modify: `src/components/collaboration/flows/voting/approvalApi.ts`

**Interfaces:**
- Consumes: the Task 1 methods.
- Produces: `addProposal(serverUrl, publicKey, contractId, text, coAuthors?, commitments?)`; `requestExpertReview(serverUrl, publicKey, contractId, proposalId)`; `addExpertReview(serverUrl, publicKey, contractId, proposalId, metrics, note?)`; `suggestProposalMerge(serverUrl, publicKey, contractId, sourceId, targetId)`.

- [ ] **Step 1: Extend `addProposal` with `commitments`**

Replace the existing `addProposal` (lines ~16-29) with:

```ts
export async function addProposal(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  text: string,
  coAuthors: string[] = [],
  commitments: string[] = [],
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_proposal', values: { text, co_authors: coAuthors, commitments } } as IMethod,
  }));
}
```

- [ ] **Step 2: Add the three new wrappers**

At the end of the file, append:

```ts
export async function requestExpertReview(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  proposalId: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'request_expert_review', values: { proposal_id: proposalId } } as IMethod,
  }));
}

export async function addExpertReview(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  proposalId: string,
  metrics: string[],
  note?: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_expert_review', values: { proposal_id: proposalId, metrics, note } } as IMethod,
  }));
}

export async function suggestProposalMerge(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  sourceId: string,
  targetId: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'suggest_proposal_merge', values: { source_id: sourceId, target_id: targetId } } as IMethod,
  }));
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS. (The extra optional `commitments` param on `addProposal` doesn't break `ApprovalFlow`'s existing call.)

- [ ] **Step 4: Commit**

```bash
git add src/components/collaboration/flows/voting/approvalApi.ts
git commit -m "feat(approvalApi): wrappers for commitments, expert review, merge suggestion

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Scope field through fixtures → framing → card

**Files:**
- Modify: `src/services/demo/fixtures/problems.ts`
- Modify: `src/components/stages/ProblemStage.demo.ts`
- Modify: `src/components/initiative/useInitiativePost.ts`
- Modify: `src/components/initiative/InitiativeStageCard.tsx`
- Modify: `src/components/community/SolutionActivityCard.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Produces: `ProblemScope = 'global' | 'community'`; `SeedInitiative.scope`, `ProblemFraming.scope`, `StagePost.scope` all `ProblemScope`. i18n keys `problems.scopeGlobal` / `problems.scopeCommunity`.

- [ ] **Step 1: Add `scope` to the fixture types + seed it**

In `problems.ts`, add the type near the top (after the imports):

```ts
/** Whether a problem is framed as global in reach or specific to one community. */
export type ProblemScope = 'global' | 'community';
```

Add `scope` to `SeedInitiative` (after `stage`) and to `ProblemFraming` (after `title`):

```ts
  /** Global-reach vs single-community problem (drives the card scope badge). */
  scope: ProblemScope;
```

Seed `scope` on every entry in `INITIATIVES`. Use: `water: 'global'`, `amr: 'global'`, `misinfo: 'global'`, `privacy: 'global'`, `ocean: 'global'`, `adaptation: 'global'`, `jobs: 'community'`, `housing: 'community'`. (Add `scope: 'global',` / `scope: 'community',` immediately after each `stage:` line.)

In `toProblemFraming`, add `scope: seed.scope,` to the returned object.

- [ ] **Step 2: Thread `scope` through the propose-issue path**

In `ProblemStage.demo.ts`: add to `ProposeIssueInput` (after `whoWhy?`):

```ts
  /** Global-reach vs single-community framing. */
  scope?: import('../../services/demo/fixtures/problems').ProblemScope;
```

In `proposeCandidateIssue`, destructure `scope` from `input` and include `scope: scope ?? 'community'` in the `proposedFraming.set(...)` object (alongside `voices: []`).

- [ ] **Step 3: Expose `scope` on the post**

In `useInitiativePost.ts`, in the `post` `useMemo`, add to the returned object:

```ts
      scope: framing?.scope,
```

- [ ] **Step 4: Add `scope` to `StagePost` + render the scope badge**

In `InitiativeStageCard.tsx`:

Add to `StagePost` (after `sdg?`):

```ts
  scope?: 'global' | 'community';
```

The scope + SDG should read together. Replace the meta-line condition + SDG block (lines ~106-112) so scope renders as a `Badge` first:

```tsx
          {(post.scope || post.sdg || post.countryCount || post.source) && (
            <div className={styles.metaLine}>
              {post.scope && (
                <Badge tone={post.scope === 'global' ? 'info' : 'primary'} size="sm">
                  {post.scope === 'global'
                    ? t('problems.scopeGlobal', 'Global problem')
                    : t('problems.scopeCommunity', 'Community problem')}
                </Badge>
              )}
              {post.sdg && (
                <span className={styles.metaItem}>
                  {t('problems.sdgTag', 'SDG {id} · {label}', { id: post.sdg.id, label: post.sdg.label })}
                </span>
              )}
```

(Keep the rest of the meta line — `countryCount`, `source` — unchanged. `Badge` is already imported on line 3.)

- [ ] **Step 5: Pass `scope` from `SolutionActivityCard`**

In `SolutionActivityCard.tsx`, add `scope: post.scope,` to the `fullPost` object (after `sdg: post.sdg,`).

- [ ] **Step 6: Add the i18n keys (fr + sw)**

In `src/i18n/fr.ts`, under the `problems` namespace, add:

```ts
  'problems.scopeGlobal': 'Problème mondial',
  'problems.scopeCommunity': 'Problème de la communauté',
```

In `src/i18n/sw.ts`, under the `problems` namespace, add:

```ts
  'problems.scopeGlobal': 'Tatizo la kimataifa',
  'problems.scopeCommunity': 'Tatizo la jamii',
```

(Place each next to the existing `problems.sdgTag` key so both files stay aligned.)

- [ ] **Step 7: Verify build + parity**

Run: `npm run build`
Expected: PASS.

Run: `diff <(grep -oE "^\s*'[a-zA-Z0-9_.]+':" src/i18n/fr.ts | tr -d " '" | sort) <(grep -oE "^\s*'[a-zA-Z0-9_.]+':" src/i18n/sw.ts | tr -d " '" | sort)`
Expected: empty (fr/sw key parity holds).

- [ ] **Step 8: Commit**

```bash
git add src/services/demo/fixtures/problems.ts src/components/stages/ProblemStage.demo.ts src/components/initiative/useInitiativePost.ts src/components/initiative/InitiativeStageCard.tsx src/components/community/SolutionActivityCard.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(card): per-problem scope flag + Global/Community problem badge

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Seed commitments + expert reviews + DEMO_VERSION bump

**Files:**
- Modify: `src/services/demo/fixtures/deliberation.ts`
- Modify: `src/services/demo/seedDemoCommunity.ts`
- Modify: `src/services/demo/mockApi.ts`

**Interfaces:**
- Consumes: `EXPERTS` keys (`demo-expert-renata`, `demo-expert-lena`) from `deliberation.ts`.
- Produces: `PROPOSAL_COMMITMENTS_BY_KEY: Record<string, Record<number, string[]>>`, `PROPOSAL_EXPERT_REVIEWS_BY_KEY: Record<string, Array<{ proposalIndex: number; expert: string; metrics: string[]; note?: string }>>`.

- [ ] **Step 1: Add the seed maps to `deliberation.ts`**

After `EXPERT_REVIEWS` (line ~446), append:

```ts
// ---------------------------------------------------------------------------
// S4 — commitments + expert-metric seeds (keyed by initiative `key`, then by
// the proposal's index in PROPOSALS_BY_KEY). The proposals-stage initiatives
// (amr, jobs) open with real commitments + two distinct expert reviews so the
// redesigned card's threshold bars read mid-progress (Experts reviewed: 2/3).
// ---------------------------------------------------------------------------
export const PROPOSAL_COMMITMENTS_BY_KEY: Record<string, Record<number, string[]>> = {
  amr: {
    0: ['Health ministries make antibiotics prescription-only', 'Pharmacists are trained and funded as gatekeepers', 'Clinics adopt shared prescribing guidelines'],
    1: ['Donors fund rapid point-of-care test kits', 'Clinics are reimbursed for testing before prescribing'],
    2: ['Labs report prescribing data to a shared registry', 'Communities see local resistance trends each month'],
    3: ['Governments invest in clean water and sanitation', 'Vaccination coverage is widened to cut infections'],
  },
  jobs: {
    0: ['Employers offer placements with a public stipend', 'Local governments co-fund the stipend for low-income youth'],
    1: ['Training boards rebuild curricula around employer-listed gaps', 'Colleges refresh courses each year, not each decade'],
    2: ['A public dashboard matches training to posted jobs', 'Regions publish quarterly skills-gap data'],
    3: ['Small businesses receive a wage subsidy for first hires', 'Mentors are funded for each first-time worker'],
  },
};

export const PROPOSAL_EXPERT_REVIEWS_BY_KEY: Record<string, Array<{ proposalIndex: number; expert: string; metrics: string[]; note?: string }>> = {
  amr: [
    { proposalIndex: 0, expert: 'demo-expert-renata', metrics: ['Share of antibiotics sold without prescription', 'Districts with a trained stewardship lead'], note: 'Gatekeeping works only if the rapid tests (idea 2) are funded alongside — pair them.' },
    { proposalIndex: 2, expert: 'demo-expert-lena', metrics: ['Clinics reporting prescribing data monthly', 'Regions with a published resistance trend'] },
  ],
  jobs: [
    { proposalIndex: 0, expert: 'demo-expert-renata', metrics: ['Young people placed per quarter', 'Share of placements taken by low-income youth'] },
    { proposalIndex: 2, expert: 'demo-expert-lena', metrics: ['Courses realigned to live job postings', 'Time from skills-gap signal to curriculum update'] },
  ],
};
```

- [ ] **Step 2: Attach the seeds in `seedDemoCommunity.ts`**

Add the imports to the existing `deliberation` import (line 17):

```ts
import { PROPOSALS_BY_KEY, DISCUSSION_SEED_BY_KEY, type DiscussionSeed, PROPOSAL_COMMITMENTS_BY_KEY, PROPOSAL_EXPERT_REVIEWS_BY_KEY } from './fixtures/deliberation';
```

Replace the `propProposals` map (lines ~160-165) with one that attaches commitments + expert reviews:

```ts
    const commitmentsByIndex = PROPOSAL_COMMITMENTS_BY_KEY[seed.key] ?? {};
    const reviewSeeds = PROPOSAL_EXPERT_REVIEWS_BY_KEY[seed.key] ?? [];
    const propProposals = proposals.map((text, i) => {
      const reviews = reviewSeeds
        .filter((r) => r.proposalIndex === i)
        .map((r) => ({ expert: r.expert, metrics: r.metrics, note: r.note, timestamp: Date.now() - (proposals.length - i) * 3_600_000 }));
      return {
        id: 'p' + i,
        text,
        author: voters[i % voters.length].publicKey,
        timestamp: Date.now() - (proposals.length - i) * 3_600_000,
        commitments: commitmentsByIndex[i] ?? [],
        ...(reviews.length > 0 ? { expertReviews: reviews } : {}),
      };
    });
```

- [ ] **Step 3: Bump `DEMO_VERSION`**

In `mockApi.ts` line 17, change `const DEMO_VERSION = 'global-v7';` to `const DEMO_VERSION = 'global-v8';`.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS. (The seeded `propProposals` objects now carry `commitments`/`expertReviews`, which `initApproval` accepts as `Proposal[]`.)

- [ ] **Step 5: Commit**

```bash
git add src/services/demo/fixtures/deliberation.ts src/services/demo/seedDemoCommunity.ts src/services/demo/mockApi.ts
git commit -m "feat(seed): commitments + expert reviews on proposals-stage demos; DEMO_VERSION global-v8

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `SolutionsBoard` scaffold (list + upvote, replaces ApprovalFlow on the Solutions stage)

**Files:**
- Create: `src/components/initiative/stages/SolutionsBoard.tsx`
- Create: `src/components/initiative/stages/SolutionsBoard.module.scss`
- Modify: `src/components/stages/ProposalsStage.tsx`
- Modify: `src/components/initiative/stages/SolutionEngage.tsx`
- Modify: `src/components/community/SolutionActivityCard.tsx`
- Modify: `src/components/collaboration/InitiativeStagePanel.tsx`

**Interfaces:**
- Consumes: `useFlowContract(instanceId, 'approval_voting', 'approval_contract.py', '', parentContractId, stageKey)`; `approvalApi` (`getProposals`, `getMyApprovals`, `getProposalsAndCounts`, `approve`, `withdrawApproval`); `profiles` from `state.communities.profiles`.
- Produces: `SolutionsBoard` (props `{ initiativeId, communityId, communityMemberCount }`). `Proposal` view type with `commitments`, `expertReviews`, `expertReviewRequests`, `mergeSuggestions`, `coAuthors`. Later tasks add modals/threshold/actions onto this file.

- [ ] **Step 1: Create `SolutionsBoard.tsx` (scaffold)**

This ports ApprovalFlow's contract + fetch + approve logic, drops the Results tab, and renders each solution with a `UserIdentity` byline + commitments bullets + a single upvote button. Later tasks fold in the modal, thresholds, action row, merge mode, and expert authoring.

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp } from 'lucide-react';

import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
import * as api from '../../collaboration/flows/voting/approvalApi';
import { useAppSelector } from '../../../store/hooks';
import { Button, UserIdentity, InfoDisclosure } from '../../shared';
import { useT } from '../../../i18n';
import styles from './SolutionsBoard.module.scss';

export interface SolutionsBoardProps {
  initiativeId: string;
  communityId: string;
  /** Active community member count — denominator for the 50%-upvote threshold. */
  communityMemberCount?: number;
}

interface ExpertReview { expert: string; metrics: string[]; note?: string; timestamp: number }
interface MergeSuggestion { target: string; suggester: string; timestamp: number }
interface Proposal {
  id: string;
  text: string;
  author: string;
  timestamp: number | string;
  coAuthors?: string[];
  commitments?: string[];
  expertReviewRequests?: string[];
  expertReviews?: ExpertReview[];
  mergeSuggestions?: MergeSuggestion[];
}

const SolutionsBoard: React.FC<SolutionsBoardProps> = ({ initiativeId, communityMemberCount = 0 }) => {
  const t = useT();
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    `${initiativeId}_proposals`,
    'approval_voting',
    'approval_contract.py',
    '',
    initiativeId,
    'proposalsContractId',
  );
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [proposals, setProposals] = useState<Record<string, Proposal>>({});
  const [approvalCounts, setApprovalCounts] = useState<Record<string, number>>({});
  const [myApprovals, setMyApprovals] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setLoading(true);
    try {
      const [{ proposals: p, counts }, myRes] = await Promise.all([
        api.getProposalsAndCounts(serverUrl, publicKey, contractId),
        api.getMyApprovals(serverUrl, publicKey, contractId),
      ]);
      setProposals((p as Record<string, Proposal>) || {});
      setApprovalCounts(counts || {});
      setMyApprovals((myRes as Record<string, boolean>) || {});
    } catch (err) {
      console.error('Failed to fetch solutions:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId, publicKey, serverUrl]);

  useEffect(() => { if (isReady) fetchData(); }, [isReady, fetchData]);

  const handleToggleApproval = async (proposalId: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    setTogglingId(proposalId);
    try {
      if (myApprovals[proposalId] === true) {
        await api.withdrawApproval(serverUrl, publicKey, contractId, proposalId);
      } else {
        await api.approve(serverUrl, publicKey, contractId, proposalId);
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle approval:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const authorName = (key: string): string => {
    const p = profiles[key];
    const name = p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : '';
    return name || `${key.slice(0, 8)}…`;
  };

  if (hasError) return (
    <div className={styles.loading}>
      <p>{errorMessage || t('mechanisms.approval.setupError', 'Failed to set up solutions.')}</p>
      <Button variant="secondary" size="sm" onClick={retry}>{t('common.retry', 'Try again')}</Button>
    </div>
  );
  if (isDeploying || !isReady) return (
    <div className={styles.loading}>{statusMessage || t('mechanisms.approval.settingUp', 'Setting up solutions…')}</div>
  );
  if (loading && Object.keys(proposals).length === 0) return <div className={styles.loading}>{t('common.loading', 'Loading…')}</div>;

  const proposalList = Object.values(proposals).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <div className={styles.container}>
      <div className={styles.helpSection}>
        <InfoDisclosure
          label={t('mechanisms.approval.helpShow', 'How does choosing solutions work?')}
          title={t('mechanisms.approval.helpShow', 'How does choosing solutions work?')}
        >
          <p>{t('mechanisms.approval.helpBody', 'Add a solution and the commitments it needs. Upvote the ones you support, ask for expert review, or suggest two be merged. The strongest rise to the vote.')}</p>
        </InfoDisclosure>
      </div>

      {/* Threshold bars (Task 7) + Add-solution (Task 6) render here. */}

      {proposalList.length === 0 ? (
        <p className={styles.noData}>{t('mechanisms.approval.noProposals', 'No solutions yet. Add one above.')}</p>
      ) : (
        <div className={styles.list}>
          {proposalList.map((p) => {
            const reviewed = (p.expertReviews?.length ?? 0) > 0;
            return (
              <div key={p.id} className={styles.solution}>
                <p className={styles.text}>{p.text}</p>
                {(p.commitments?.length ?? 0) > 0 && (
                  <ul className={styles.commitments}>
                    {p.commitments!.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                )}
                <div className={styles.byline}>
                  <UserIdentity name={authorName(p.author)} countryCode={profiles[p.author]?.country} size="sm" />
                  {reviewed && (
                    <span className={styles.reviewedTag}>{t('mechanisms.approval.expertReviewed', 'expert reviewed')}</span>
                  )}
                </div>
                {/* The 3-action row (Task 8) replaces this single upvote button. */}
                <div className={styles.actionRow}>
                  <button
                    className={`${styles.actionBtn} ${myApprovals[p.id] ? styles.actionBtnActive : ''}`}
                    onClick={() => handleToggleApproval(p.id)}
                    disabled={togglingId === p.id}
                    aria-label={t('mechanisms.approval.upvote', 'Upvote')}
                  >
                    <ThumbsUp size={16} aria-hidden />
                    <span>{approvalCounts[p.id] || 0}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolutionsBoard;
```

- [ ] **Step 2: Create `SolutionsBoard.module.scss` (complete — covers Tasks 5–10)**

Token vocabulary verified against `src/styles/variables.scss`: text = `$gray-800` (primary) / `$gray-600` (secondary, AA-safe — do NOT use `$gray-400`); border = `$gray-200`; muted bg = `$gray-100`; card bg = `white`; sizes = `$text-base`/`$text-sm`/`$text-xs`; weights = `$font-medium`/`$font-bold`; `$primary`, `$success`, `$error`, `$radius-md`/`$radius-sm`/`$radius-full`, `$spacing-*`, `$transition-base`; dark mode via a `@media (prefers-color-scheme: dark)` block using `$dark-bg`/`$dark-border`/`$dark-text`/`$dark-text-secondary`/`$dark-surface` (same pattern as `ApprovalFlow.module.scss`). The `@use` path is three levels up from `initiative/stages/`. This stylesheet is complete for the whole component — Tasks 6–10 reference these classes and add **no** SCSS.

```scss
@use '../../../styles/variables' as *;

.container { display: flex; flex-direction: column; gap: $spacing-lg; }
.loading { display: flex; flex-direction: column; align-items: center; gap: $spacing-md; padding: $spacing-xl; color: $gray-600; font-size: $text-sm; }
.noData { font-size: $text-sm; color: $gray-600; font-style: italic; padding: $spacing-lg 0; }
.helpSection { margin-bottom: $spacing-xs; }

// ─── Threshold bars (Task 7) ───────────────────────────────────────────
.thresholds { display: flex; flex-direction: column; gap: $spacing-sm; }
.threshold { display: flex; flex-direction: column; gap: 4px; }
.thresholdHead { display: flex; justify-content: space-between; font-size: $text-sm; color: $gray-600; }
.thresholdCount { font-weight: $font-bold; color: $gray-800; }
.track { height: 6px; background: $gray-100; border-radius: $radius-full; overflow: hidden; }
.fill { height: 100%; background: $primary; border-radius: $radius-full; transition: width 0.3s ease; }
.fillSuccess { background: $success; }
@media (prefers-reduced-motion: reduce) { .fill { transition: none; } }

// ─── Add solution (Task 6) ─────────────────────────────────────────────
.addBtn {
  width: 100%; min-height: 44px; text-align: left;
  display: flex; align-items: center; gap: 8px;
  border: 1px dashed $gray-200; border-radius: $radius-md;
  background: none; color: $gray-600; cursor: pointer;
  padding: 0 $spacing-md; font-size: $text-base;
  &:hover { background: rgba($primary, 0.05); color: $gray-800; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
}
.addForm { display: flex; flex-direction: column; gap: $spacing-sm; }
.addTextarea, .commitInput {
  width: 100%; box-sizing: border-box; padding: $spacing-sm $spacing-md;
  border: 1px solid $gray-200; border-radius: $radius-md; font-size: $text-sm; color: $gray-800;
  &:focus { border-color: $primary; outline: none; }
  &::placeholder { color: $gray-500; }
}
.addTextarea { resize: vertical; }
.commitPrompt { margin: $spacing-xs 0 0; font-size: $text-sm; font-weight: $font-medium; color: $gray-800; }
.commitHint { margin: 0 0 $spacing-xs; font-size: $text-xs; color: $gray-600; }

// ─── Solution list (Tasks 5/8/10) ──────────────────────────────────────
.list { display: flex; flex-direction: column; gap: $spacing-md; }
.solution { border: 1.5px solid $gray-200; border-radius: $radius-md; padding: $spacing-md; background: white; }
.text { margin: 0 0 $spacing-sm; font-size: $text-sm; line-height: 1.5; color: $gray-800; }
.commitments {
  margin: 0 0 $spacing-sm; padding-left: $spacing-md;
  font-size: $text-xs; color: $gray-600; line-height: 1.6;
  li { margin: 0; }
}
.metrics { margin: 0 0 $spacing-sm; font-size: $text-xs; color: $gray-600;
  ul { margin: 2px 0 0; padding-left: $spacing-md; line-height: 1.6; }
}
.metricsLabel { margin: 0; font-weight: $font-medium; color: $gray-800; font-size: $text-xs; }
.byline { display: flex; align-items: center; justify-content: space-between; gap: $spacing-sm; flex-wrap: wrap; }
.reviewedTag { font-size: $text-xs; color: $success; }

.actionRow { display: flex; gap: $spacing-xs; margin-top: $spacing-sm; border-top: 1px solid $gray-200; padding-top: $spacing-sm; }
.actionBtn {
  flex: 1; min-height: 44px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 1.5px solid $gray-200; border-radius: $radius-sm;
  background: none; color: $gray-600; cursor: pointer; font-size: $text-sm;
  transition: all $transition-base;
  &:hover:not(:disabled) { border-color: $primary; color: $primary; background: rgba($primary, 0.05); }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.actionBtnActive { border-color: $primary; color: $primary; background: rgba($primary, 0.1); }
.expertAddBtn {
  margin-top: $spacing-xs; min-height: 44px; width: 100%;
  background: none; border: 1.5px solid $primary; color: $primary;
  border-radius: $radius-sm; cursor: pointer; font-size: $text-sm;
  &:hover { background: rgba($primary, 0.08); }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
}

// ─── Merge "pick a target" mode (Task 9) ───────────────────────────────
.mergeBanner {
  display: flex; align-items: center; gap: 8px;
  padding: $spacing-sm $spacing-md; border-radius: $radius-sm;
  background: rgba($primary, 0.1); color: $primary; font-size: $text-sm;
}
.mergeCancel {
  margin-left: auto; background: none; border: none; cursor: pointer;
  color: $primary; text-decoration: underline; font-size: $text-sm;
  min-height: 44px; padding: 0 $spacing-xs;
}
.mergeSourceCard { opacity: 0.5; }
.mergeTargetCard {
  border: 2px solid $primary; cursor: pointer;
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
  animation: mergeRingPulse 1.6s ease-in-out infinite;
}
.mergeHint { margin: 0 0 $spacing-xs; font-size: $text-sm; color: $primary; }
@keyframes mergeRingPulse { 0%, 100% { border-color: $primary; } 50% { border-color: $gray-200; } }
@media (prefers-reduced-motion: reduce) { .mergeTargetCard { animation: none; } }

// ─── Dark mode ─────────────────────────────────────────────────────────
@media (prefers-color-scheme: dark) {
  .loading, .noData, .thresholdHead, .commitHint, .commitments, .metrics { color: $dark-text-secondary; }
  .thresholdCount, .text, .commitPrompt, .metricsLabel { color: $dark-text; }
  .track { background: $dark-border; }
  .solution { background: $dark-bg; border-color: $dark-border; }
  .addBtn { border-color: $dark-border; color: $dark-text-secondary; &:hover { color: $dark-text; } }
  .addTextarea, .commitInput {
    background: $dark-bg; border-color: $dark-border; color: $dark-text;
    &::placeholder { color: $dark-text-secondary; }
  }
  .actionBtn { border-color: $dark-border; color: $dark-text-secondary; }
  .mergeSourceCard { opacity: 0.5; }
}
```

- [ ] **Step 3: Render `SolutionsBoard` from `ProposalsStage`**

Replace the body of `ProposalsStage.tsx` so the dashboard variant uses `SolutionsBoard` and drops `ProposalMergePanel`:

```tsx
import React from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import SolutionsBoard from '../initiative/stages/SolutionsBoard';
import { useT } from '../../i18n';
import type { StageVariant } from '../../types/initiative';

export interface ProposalsStageProps {
  initiativeId: string;
  communityId: string;
  title: string;
  hostServer: string;
  hostAgent: string;
  variant: StageVariant;
  /** Active member count — denominator for the solutions threshold. */
  communityMemberCount?: number;
}

const ProposalsStage: React.FC<ProposalsStageProps> = ({ initiativeId, communityId, communityMemberCount }) => {
  const t = useT();
  return (
    <ErrorBoundary fallbackMessage={t('deliberation.proposals.error', 'Solutions encountered an error.')}>
      <SolutionsBoard
        initiativeId={initiativeId}
        communityId={communityId}
        communityMemberCount={communityMemberCount}
      />
    </ErrorBoundary>
  );
};

export default ProposalsStage;
```

(The `variant` prop stays in the interface for callers but no longer branches; `ProposalMergePanel` is no longer imported here — it remains in the repo for cross-initiative use.)

- [ ] **Step 4: Thread `communityMemberCount` through `SolutionEngage`**

In `SolutionEngage.tsx`, add `communityMemberCount?: number;` to `SolutionEngageProps`, destructure it, and pass it to `ProposalsStage`:

```tsx
        <ProposalsStage
          variant="dashboard"
          initiativeId={initiativeId}
          communityId={communityId}
          title={title}
          hostServer={hostServer}
          hostAgent={hostAgent}
          communityMemberCount={communityMemberCount}
        />
```

- [ ] **Step 5: Pass the count from both card hosts**

In `SolutionActivityCard.tsx`, pass `communityMemberCount={activeMemberCount}` to `<SolutionEngage>`.

In `InitiativeStagePanel.tsx` (the `stage === 'proposals'` branch, ~line 238), pass `communityMemberCount={activeMemberCount}` to `<SolutionEngage>`.

- [ ] **Step 6: Verify build + run**

Run: `npm run build`
Expected: PASS.

Start the dev server (`preview_start`, `gloki-dev`, 5173), open a proposals-stage initiative card (e.g. the "Antibiotic Resistance" or "Youth Employment" card), expand it. Confirm via `preview_snapshot`: the solutions list renders with commitment bullets + a flag+name byline + an "expert reviewed" tag on the seeded reviewed solutions, and the upvote button increments. Check `preview_console_logs` for errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/initiative/stages/SolutionsBoard.tsx src/components/initiative/stages/SolutionsBoard.module.scss src/components/stages/ProposalsStage.tsx src/components/initiative/stages/SolutionEngage.tsx src/components/community/SolutionActivityCard.tsx src/components/collaboration/InitiativeStagePanel.tsx
git commit -m "feat(solutions): SolutionsBoard scaffold — commitments + UserIdentity byline + upvote

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Add-solution modal with commitments

**Files:**
- Modify: `src/components/initiative/stages/SolutionsBoard.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Consumes: `api.addProposal(serverUrl, publicKey, contractId, text, [], commitments)`.

- [ ] **Step 1: Add the modal state + handler**

In `SolutionsBoard.tsx`, import `Modal` (add to the `../../shared` import) and `useState` is already imported. Add state near the other `useState`s:

```tsx
  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCommitments, setNewCommitments] = useState<string[]>(['', '', '']);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = newText.trim().length > 0 && newCommitments.some((c) => c.trim().length > 0);

  const handleAdd = async () => {
    if (!serverUrl || !publicKey || !contractId || !canSubmit) return;
    setSubmitting(true);
    try {
      const commitments = newCommitments.map((c) => c.trim()).filter(Boolean);
      await api.addProposal(serverUrl, publicKey, contractId, newText.trim(), [], commitments);
      setNewText(''); setNewCommitments(['', '', '']); setAddOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to add solution:', err);
    } finally {
      setSubmitting(false);
    }
  };
```

- [ ] **Step 2: Render the Add button + Modal**

Replace the `{/* Threshold bars (Task 7) + Add-solution (Task 6) render here. */}` placeholder with the Add button (the threshold bars land above it in Task 7):

```tsx
      <button type="button" className={styles.addBtn} onClick={() => setAddOpen(true)}>
        + {t('mechanisms.approval.addSolutionCta', 'Add a solution to this problem')}
      </button>

      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('mechanisms.approval.addSolutionTitle', 'Add a solution')}
        closeLabel={t('common.close', 'Close')}
        footer={
          <Button variant="primary" onClick={handleAdd} loading={submitting} disabled={!canSubmit}>
            {t('mechanisms.approval.addSolutionSubmit', 'Add solution')}
          </Button>
        }
      >
        <div className={styles.addForm}>
          <textarea
            className={styles.addTextarea}
            placeholder={t('mechanisms.approval.solutionPlaceholder', 'Describe your solution')}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <p className={styles.commitPrompt}>{t('mechanisms.approval.commitmentsPrompt', 'Who and what needs to change?')}</p>
          <p className={styles.commitHint}>{t('mechanisms.approval.commitmentsHint', 'List up to three commitments. At least one.')}</p>
          {newCommitments.map((c, i) => (
            <input
              key={i}
              className={styles.commitInput}
              type="text"
              placeholder={t('mechanisms.approval.commitmentPlaceholder', 'A commitment this solution needs')}
              value={c}
              maxLength={280}
              onChange={(e) => setNewCommitments((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
        </div>
      </Modal>
```

- [ ] **Step 3: Styles**

No SCSS change — `.addBtn`, `.addForm`, `.addTextarea`, `.commitPrompt`, `.commitHint`, `.commitInput` are already defined in the complete stylesheet from Task 5.

- [ ] **Step 4: Add i18n keys (fr + sw)**

Add under `mechanisms.approval` in `fr.ts`:

```ts
  'mechanisms.approval.addSolutionCta': 'Ajouter une solution à ce problème',
  'mechanisms.approval.addSolutionTitle': 'Ajouter une solution',
  'mechanisms.approval.addSolutionSubmit': 'Ajouter la solution',
  'mechanisms.approval.solutionPlaceholder': 'Décrivez votre solution',
  'mechanisms.approval.commitmentsPrompt': 'Qui et quoi doivent changer ?',
  'mechanisms.approval.commitmentsHint': 'Indiquez jusqu’à trois engagements. Au moins un.',
  'mechanisms.approval.commitmentPlaceholder': 'Un engagement nécessaire à cette solution',
  'mechanisms.approval.expertReviewed': 'examiné par un expert',
  'mechanisms.approval.upvote': 'Soutenir',
```

Add under `mechanisms.approval` in `sw.ts`:

```ts
  'mechanisms.approval.addSolutionCta': 'Ongeza suluhisho kwa tatizo hili',
  'mechanisms.approval.addSolutionTitle': 'Ongeza suluhisho',
  'mechanisms.approval.addSolutionSubmit': 'Ongeza suluhisho',
  'mechanisms.approval.solutionPlaceholder': 'Eleza suluhisho lako',
  'mechanisms.approval.commitmentsPrompt': 'Nani na nini lazima vibadilike?',
  'mechanisms.approval.commitmentsHint': 'Orodhesha hadi ahadi tatu. Angalau moja.',
  'mechanisms.approval.commitmentPlaceholder': 'Ahadi inayohitajika kwa suluhisho hili',
  'mechanisms.approval.expertReviewed': 'imekaguliwa na mtaalam',
  'mechanisms.approval.upvote': 'Unga mkono',
```

(`expertReviewed` + `upvote` are added now since the scaffold uses them; if already present from earlier, skip duplicates. Keep both files in the same key order.)

- [ ] **Step 5: Verify build + parity + run**

Run: `npm run build` → PASS.
Run the fr/sw parity diff from Task 3 Step 7 → empty.
Reload the dev server; open the Add modal; confirm: submit is disabled until text + ≥1 commitment are present; on submit the new solution appears with its commitment bullets (re-fetch worked). `preview_console_logs` clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/initiative/stages/SolutionsBoard.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(solutions): add-solution modal collects 3 commitments (>=1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Two threshold bars

**Files:**
- Modify: `src/components/initiative/stages/SolutionsBoard.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Consumes: `approvalCounts`, `proposals`, `communityMemberCount`. No new API.

- [ ] **Step 1: Compute the two thresholds**

In `SolutionsBoard.tsx`, after `proposalList` is built, add:

```tsx
  // T1: solutions each backed by upvotes from >=50% of the community.
  const half = Math.max(Math.ceil(communityMemberCount * 0.5), 1);
  const backedCount = proposalList.filter((p) => (approvalCounts[p.id] || 0) >= half).length;
  const T1_TARGET = 5;
  // T2: distinct experts who have actually reviewed (attached metrics), any solution.
  const reviewerSet = new Set<string>();
  proposalList.forEach((p) => (p.expertReviews ?? []).forEach((r) => reviewerSet.add(r.expert)));
  const expertsReviewed = reviewerSet.size;
  const T2_TARGET = 3;

  const pct = (n: number, target: number) => `${Math.min(Math.round((n / target) * 100), 100)}%`;
```

- [ ] **Step 2: Render the bars above the Add button**

Immediately before the `<button ... className={styles.addBtn}>`, insert:

```tsx
      <div className={styles.thresholds}>
        <div className={styles.threshold}>
          <div className={styles.thresholdHead}>
            <span>{t('mechanisms.approval.thresholdSolutions', 'Solutions backed by half the community')}</span>
            <span className={styles.thresholdCount}>{backedCount} / {T1_TARGET}</span>
          </div>
          <div className={styles.track}><div className={styles.fill} style={{ width: pct(backedCount, T1_TARGET) }} /></div>
        </div>
        <div className={styles.threshold}>
          <div className={styles.thresholdHead}>
            <span>{t('mechanisms.approval.thresholdExperts', 'Experts reviewed')}</span>
            <span className={styles.thresholdCount}>{expertsReviewed} / {T2_TARGET}</span>
          </div>
          <div className={styles.track}><div className={`${styles.fill} ${styles.fillSuccess}`} style={{ width: pct(expertsReviewed, T2_TARGET) }} /></div>
        </div>
      </div>
```

- [ ] **Step 3: Styles**

No SCSS change — `.thresholds`, `.threshold`, `.thresholdHead`, `.thresholdCount`, `.track`, `.fill`, `.fillSuccess` are already defined in Task 5's stylesheet.

- [ ] **Step 4: i18n keys (fr + sw)**

`fr.ts`:
```ts
  'mechanisms.approval.thresholdSolutions': 'Solutions soutenues par la moitié de la communauté',
  'mechanisms.approval.thresholdExperts': 'Experts ayant examiné',
```
`sw.ts`:
```ts
  'mechanisms.approval.thresholdSolutions': 'Suluhisho zinazoungwa mkono na nusu ya jamii',
  'mechanisms.approval.thresholdExperts': 'Wataalam waliokagua',
```

- [ ] **Step 5: Verify build + parity + run**

Run: `npm run build` → PASS. fr/sw parity diff → empty.
Reload; confirm both bars render, "Experts reviewed" reads `2 / 3` on the seeded `amr`/`jobs` initiatives, and the solutions bar reflects the seeded approval counts. Verify light + dark via `preview_resize` / dark scheme.

- [ ] **Step 6: Commit**

```bash
git add src/components/initiative/stages/SolutionsBoard.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(solutions): two read-only threshold bars (solutions backed / experts reviewed)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Three-action row + request expert review

**Files:**
- Modify: `src/components/initiative/stages/SolutionsBoard.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Consumes: `api.requestExpertReview(serverUrl, publicKey, contractId, proposalId)`; enters merge mode (Task 9 wires the handler — here the merge button calls a stub `setMergeSource`).

- [ ] **Step 1: Add request-review handler + merge-source state**

Add imports `Microscope, GitMerge` from `lucide-react` (alongside `ThumbsUp`). Add state + handler:

```tsx
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleRequestReview = async (proposalId: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    setRequestingId(proposalId);
    try {
      await api.requestExpertReview(serverUrl, publicKey, contractId, proposalId);
      await fetchData();
    } catch (err) {
      console.error('Failed to request expert review:', err);
    } finally {
      setRequestingId(null);
    }
  };
```

- [ ] **Step 2: Replace the single-button action row**

Replace the `<div className={styles.actionRow}>…</div>` block from the scaffold with the three-action row:

```tsx
                <div className={styles.actionRow}>
                  <button
                    className={`${styles.actionBtn} ${myApprovals[p.id] ? styles.actionBtnActive : ''}`}
                    onClick={() => handleToggleApproval(p.id)}
                    disabled={togglingId === p.id}
                    aria-label={t('mechanisms.approval.upvote', 'Upvote')}
                  >
                    <ThumbsUp size={16} aria-hidden />
                    <span>{approvalCounts[p.id] || 0}</span>
                  </button>
                  <button
                    className={`${styles.actionBtn} ${publicKey && p.expertReviewRequests?.includes(publicKey) ? styles.actionBtnActive : ''}`}
                    onClick={() => handleRequestReview(p.id)}
                    disabled={requestingId === p.id}
                    aria-label={t('mechanisms.approval.requestReview', 'Request expert review')}
                  >
                    <Microscope size={16} aria-hidden />
                    <span>{p.expertReviewRequests?.length ?? 0}</span>
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => setMergeSource(p.id)}
                    aria-label={t('mechanisms.approval.suggestMerge', 'Suggest a merge')}
                  >
                    <GitMerge size={16} aria-hidden />
                  </button>
                </div>
```

- [ ] **Step 3: Verify build + run**

Run: `npm run build` → PASS.
Reload; confirm three buttons per solution (≥44px), the request-review count increments/toggles and re-fetches, and tapping merge sets state (no visible mode yet — Task 9). `preview_console_logs` clean.

- [ ] **Step 4: i18n keys (fr + sw)**

`fr.ts`:
```ts
  'mechanisms.approval.requestReview': 'Demander un examen par un expert',
  'mechanisms.approval.suggestMerge': 'Proposer une fusion',
```
`sw.ts`:
```ts
  'mechanisms.approval.requestReview': 'Omba ukaguzi wa mtaalam',
  'mechanisms.approval.suggestMerge': 'Pendekeza muunganiko',
```

- [ ] **Step 5: Verify parity + commit**

Run: `npm run build` → PASS. fr/sw parity diff → empty.

```bash
git add src/components/initiative/stages/SolutionsBoard.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(solutions): 3-action row — upvote, request expert review, suggest merge

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Merge "pick a target" mode

**Files:**
- Modify: `src/components/initiative/stages/SolutionsBoard.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Consumes: `api.suggestProposalMerge(serverUrl, publicKey, contractId, sourceId, targetId)`; the `mergeSource` state from Task 8.

- [ ] **Step 1: Add the complete-merge handler**

```tsx
  const handlePickMergeTarget = async (targetId: string) => {
    if (!serverUrl || !publicKey || !contractId || !mergeSource || targetId === mergeSource) return;
    try {
      await api.suggestProposalMerge(serverUrl, publicKey, contractId, mergeSource, targetId);
      setMergeSource(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to suggest merge:', err);
      setMergeSource(null);
    }
  };
```

- [ ] **Step 2: Render the merge banner + apply per-solution mode classes**

Above the `{proposalList.length === 0 ? … }` block, add the banner (only in merge mode):

```tsx
      {mergeSource && (
        <div className={styles.mergeBanner} role="status">
          <GitMerge size={16} aria-hidden />
          <span>{t('mechanisms.approval.mergePickTarget', 'Tap the solution to merge this into')}</span>
          <button type="button" className={styles.mergeCancel} onClick={() => setMergeSource(null)}>
            {t('mechanisms.approval.mergeCancel', 'Cancel')}
          </button>
        </div>
      )}
```

Change the solution wrapper to reflect merge mode. Replace `<div key={p.id} className={styles.solution}>` with a button-or-div that, in merge mode, becomes a target:

```tsx
              <div
                key={p.id}
                className={[
                  styles.solution,
                  mergeSource && p.id === mergeSource ? styles.mergeSourceCard : '',
                  mergeSource && p.id !== mergeSource ? styles.mergeTargetCard : '',
                ].filter(Boolean).join(' ')}
                {...(mergeSource && p.id !== mergeSource
                  ? { role: 'button', tabIndex: 0,
                      onClick: () => handlePickMergeTarget(p.id),
                      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePickMergeTarget(p.id); } } }
                  : {})}
              >
```

Inside the card, when it is a merge target, show the hint (place right after the opening tag's children start, before `<p className={styles.text}>`):

```tsx
                {mergeSource && p.id !== mergeSource && (
                  <p className={styles.mergeHint}>{t('mechanisms.approval.mergeIntoThis', 'Tap to merge into this')}</p>
                )}
```

Optionally hide the action row while in merge mode by wrapping it: `{!mergeSource && (<div className={styles.actionRow}>…</div>)}`.

- [ ] **Step 3: Styles**

No SCSS change — `.mergeBanner`, `.mergeCancel`, `.mergeSourceCard`, `.mergeTargetCard`, `.mergeHint`, the `mergeRingPulse` keyframes, and the `prefers-reduced-motion` fallback are already defined in Task 5's stylesheet.

- [ ] **Step 4: i18n keys (fr + sw)**

`fr.ts`:
```ts
  'mechanisms.approval.mergePickTarget': 'Touchez la solution dans laquelle fusionner celle-ci',
  'mechanisms.approval.mergeIntoThis': 'Toucher pour fusionner dans celle-ci',
  'mechanisms.approval.mergeCancel': 'Annuler',
```
`sw.ts`:
```ts
  'mechanisms.approval.mergePickTarget': 'Gusa suluhisho la kuunganisha hili ndani yake',
  'mechanisms.approval.mergeIntoThis': 'Gusa kuunganisha ndani ya hili',
  'mechanisms.approval.mergeCancel': 'Ghairi',
```

- [ ] **Step 5: Verify build + parity + run**

Run: `npm run build` → PASS. fr/sw parity diff → empty.
Reload; tap "suggest merge" on one solution → source dims, others get the ring + "tap to merge into this" + the Cancel banner; tap a target → suggestion records, mode exits, re-fetch. Cancel exits without writing. Verify the ring holds static under `prefers-reduced-motion` (toggle via `preview_eval` emulating reduced motion or note the CSS path). Light + dark.

- [ ] **Step 6: Commit**

```bash
git add src/components/initiative/stages/SolutionsBoard.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(solutions): merge 'pick a target' mode (suggest-only, reduced-motion safe)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Expert-only "Add expert review" modal

**Files:**
- Modify: `src/components/initiative/stages/SolutionsBoard.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Consumes: `getInitiativeRoles(serverUrl, publicKey, initiativeId)` → `roles.experts`; `api.addExpertReview(serverUrl, publicKey, contractId, proposalId, metrics, note?)`.

- [ ] **Step 1: Load roles + add review modal state**

Add imports: `import { getInitiativeRoles, type InitiativeRoles } from '../../../services/initiativeRoles';`. Add state + effect:

```tsx
  const [roles, setRoles] = useState<InitiativeRoles | null>(null);
  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    getInitiativeRoles(serverUrl, publicKey, initiativeId).then((r) => { if (!cancelled) setRoles(r); });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, initiativeId]);
  const isExpert = Boolean(publicKey && roles?.experts.includes(publicKey));

  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [reviewMetrics, setReviewMetrics] = useState<string[]>(['', '']);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const canSubmitReview = reviewMetrics.some((m) => m.trim().length > 0);

  const handleAddReview = async () => {
    if (!serverUrl || !publicKey || !contractId || !reviewFor || !canSubmitReview) return;
    setReviewSubmitting(true);
    try {
      const metrics = reviewMetrics.map((m) => m.trim()).filter(Boolean);
      await api.addExpertReview(serverUrl, publicKey, contractId, reviewFor, metrics, reviewNote.trim() || undefined);
      setReviewFor(null); setReviewMetrics(['', '']); setReviewNote('');
      await fetchData();
    } catch (err) {
      console.error('Failed to add expert review:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };
```

`initiativeId` is a prop — destructure it in the component signature (the scaffold only destructured `communityMemberCount`; add `initiativeId`).

- [ ] **Step 2: Render expert metrics + the gated "Add expert review" control**

Render seeded/attached metrics under each reviewed solution (after the commitments `<ul>`):

```tsx
                {(p.expertReviews?.length ?? 0) > 0 && (
                  <div className={styles.metrics}>
                    <p className={styles.metricsLabel}>{t('mechanisms.approval.metricsLabel', 'How we’ll know it’s working')}</p>
                    <ul>
                      {p.expertReviews!.flatMap((r) => r.metrics).map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
```

Inside the action row (only when `isExpert`), add a fourth control, or place it below the row:

```tsx
                {isExpert && !mergeSource && (
                  <button type="button" className={styles.expertAddBtn} onClick={() => setReviewFor(p.id)}>
                    {t('mechanisms.approval.addExpertReview', 'Add expert review')}
                  </button>
                )}
```

Render the modal once (outside the list map, near the Add-solution Modal):

```tsx
      <Modal
        isOpen={reviewFor !== null}
        onClose={() => setReviewFor(null)}
        title={t('mechanisms.approval.addExpertReview', 'Add expert review')}
        closeLabel={t('common.close', 'Close')}
        footer={
          <Button variant="primary" onClick={handleAddReview} loading={reviewSubmitting} disabled={!canSubmitReview}>
            {t('mechanisms.approval.submitReview', 'Submit review')}
          </Button>
        }
      >
        <div className={styles.addForm}>
          <p className={styles.commitPrompt}>{t('mechanisms.approval.metricsPrompt', 'How will we know this is working?')}</p>
          {reviewMetrics.map((m, i) => (
            <input
              key={i}
              className={styles.commitInput}
              type="text"
              placeholder={t('mechanisms.approval.metricPlaceholder', 'A measurable indicator')}
              value={m}
              maxLength={280}
              onChange={(e) => setReviewMetrics((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
          <textarea
            className={styles.addTextarea}
            placeholder={t('mechanisms.approval.reviewNotePlaceholder', 'A short review note (optional)')}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            maxLength={500}
            rows={2}
          />
        </div>
      </Modal>
```

- [ ] **Step 3: Styles**

No SCSS change — `.metrics`, `.metricsLabel`, `.expertAddBtn` are already defined in Task 5's stylesheet.

- [ ] **Step 4: i18n keys (fr + sw)**

`fr.ts`:
```ts
  'mechanisms.approval.metricsLabel': 'Comment nous saurons que ça marche',
  'mechanisms.approval.addExpertReview': 'Ajouter un examen d’expert',
  'mechanisms.approval.submitReview': 'Envoyer l’examen',
  'mechanisms.approval.metricsPrompt': 'Comment saurons-nous que cela fonctionne ?',
  'mechanisms.approval.metricPlaceholder': 'Un indicateur mesurable',
  'mechanisms.approval.reviewNotePlaceholder': 'Une brève note d’examen (facultatif)',
```
`sw.ts`:
```ts
  'mechanisms.approval.metricsLabel': 'Jinsi tutakavyojua inafanya kazi',
  'mechanisms.approval.addExpertReview': 'Ongeza ukaguzi wa mtaalam',
  'mechanisms.approval.submitReview': 'Wasilisha ukaguzi',
  'mechanisms.approval.metricsPrompt': 'Tutajuaje kama hili linafanya kazi?',
  'mechanisms.approval.metricPlaceholder': 'Kipimo kinachoweza kupimika',
  'mechanisms.approval.reviewNotePlaceholder': 'Dokezo fupi la ukaguzi (hiari)',
```

- [ ] **Step 5: Verify build + parity + run**

Run: `npm run build` → PASS. fr/sw parity diff → empty.
Reload; confirm seeded metrics render under reviewed solutions ("How we'll know it's working"). The "Add expert review" control is hidden for the demo user (not an expert) — confirm absent. (Optional: temporarily force `isExpert` true via `preview_eval` or a transient edit to confirm the modal writes + bumps the experts bar, then revert.)

- [ ] **Step 6: Commit**

```bash
git add src/components/initiative/stages/SolutionsBoard.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(solutions): render expert metrics + gated expert-review authoring modal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: i18n cleanup (remove dead Results keys) + native-review doc

**Files:**
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`
- Modify: `docs/i18n-native-review-candidates.md`

**Interfaces:** none.

- [ ] **Step 1: Remove the now-dead Results-tab keys**

`SolutionsBoard` no longer uses the Results tab. Grep the codebase to confirm these keys are unused anywhere else, then remove them from BOTH `fr.ts` and `sw.ts`:

Run: `grep -rn "mechanisms.approval.tabResults\|mechanisms.approval.noResults\|mechanisms.approval.approvalsCount\|mechanisms.approval.viewToggle\|mechanisms.approval.tabProposals" src/`

Expected: matches ONLY in `src/i18n/fr.ts`, `src/i18n/sw.ts`, and `src/components/collaboration/flows/voting/ApprovalFlow.tsx` (the collab-registry flow still uses them). 

- If `ApprovalFlow.tsx` still references any of these (it does — `viewToggle`, `tabProposals`, `tabResults`, `noResults`, `approvalsCount`), **keep those keys** — they are live for the collab flow. Only remove a key if it has zero remaining references outside the i18n files.
- Net effect: likely **no keys are removable** because `ApprovalFlow.tsx` is untouched. In that case, skip the removal and record in the commit message that the Results keys remain live via `ApprovalFlow`.

- [ ] **Step 2: Append new keys to the native-review doc**

Add a dated section to `docs/i18n-native-review-candidates.md` listing the new keys from Tasks 3, 6, 7, 8, 9, 10 (the `problems.scope*` and `mechanisms.approval.*` additions), noting they were machine-translated and need fr/sw native review. (Wordlists/codes stay English — none added here.)

- [ ] **Step 3: Verify build + final parity**

Run: `npm run build` → PASS.
Run the fr/sw parity diff → empty.
Run a code-ref↔i18n cross-check for a sampling of new keys, e.g.:
`for k in addSolutionCta commitmentsPrompt thresholdExperts requestReview mergePickTarget metricsLabel; do echo "== $k =="; grep -rn "approval.$k" src/ | grep -c .; done`
Expected: each used in `SolutionsBoard.tsx` and present in both i18n files.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/fr.ts src/i18n/sw.ts docs/i18n-native-review-candidates.md
git commit -m "chore(i18n): record S4 keys for native review; confirm fr/sw parity

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Whole-card verification pass (360px, light + dark)

**Files:** none (verification only; fixes go back into the relevant task's files).

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: PASS (clean `tsc -b`).

- [ ] **Step 2: Manual verification at 360px**

With the dev server running, `preview_resize` to 360px and walk a proposals-stage initiative (e.g. "Coordinated Action on Antibiotic Resistance"):

- [ ] Scope badge ("Global problem") + SDG render together in the card meta line.
- [ ] Both threshold bars show; "Experts reviewed" reads 2/3 on seeded initiatives.
- [ ] Add-solution modal: submit disabled until text + ≥1 commitment; new solution appears with its commitment bullets after submit.
- [ ] Each solution shows commitments + flag+name byline; reviewed solutions show the "expert reviewed" tag + the "How we'll know it's working" metrics.
- [ ] 3-action row: upvote toggles + re-fetches; request-expert-review toggles count; all controls ≥44px with visible focus rings and aria-labels.
- [ ] Merge mode: source dims, targets ring + hint + Cancel banner; tap target records + exits; ring static under reduced-motion.
- [ ] Expand-in-place: the card expands on the feed without routing away.
- [ ] Repeat the visual checks in dark mode (`preview_resize` + dark color scheme); confirm no clashing colors, AA-legible text.
- [ ] `preview_console_logs` + `preview_network` clean (no errors, writes succeed).

- [ ] **Step 3: Capture proof + commit any fixes**

`preview_screenshot` the expanded card (light + dark) and the merge mode as proof. If any check fails, fix in the owning file, rebuild, re-verify, and commit with a `fix(solutions): …` message.

---

## Self-Review (completed during planning)

- **Spec coverage:** D1 scope→Task 3; D2 SDG→already in card (confirmed Task 3/12); D3 commitments popup→Task 6; D4 request-expert-review + drop ExpertEndorseButton→Tasks 8 + 5 (SolutionsBoard doesn't import it); D5 3-action row→Task 8; D6 merge pick-a-target→Task 9; D7 two thresholds→Task 7; D8 remove Results tab→Task 5 (SolutionsBoard omits it); D9 expand-in-place→already in `InitiativeStageCard` (confirmed Task 12); D10 spine→Tasks 1–2; readback shape→Tasks 1/4. Expert authoring (spec §5)→Task 10. Seed + DEMO_VERSION→Task 4. i18n parity→every UI task + Task 11.
- **Placeholder scan:** none — every code step carries full code. Token names in SCSS are flagged with a verify-against-`variables.scss` instruction (Task 5 Step 2) because exact token spellings weren't all read; the implementer substitutes the nearest real token, never a hex.
- **Type consistency:** `Proposal` fields (`commitments`, `expertReviewRequests`, `expertReviews`, `mergeSuggestions`) match across `approval.ts` (Task 1) and `SolutionsBoard.tsx` (Task 5+). API names (`requestExpertReview`, `addExpertReview`, `suggestProposalMerge`, `addProposal(+commitments)`) match Tasks 2 ↔ 5–10. Method `values` keys (`proposal_id`, `metrics`, `note`, `source_id`, `target_id`, `commitments`) match contract (Task 1) ↔ api (Task 2).
- **Known risk:** SCSS token names — the only place I couldn't fully verify; Task 5 Step 2 makes substitution explicit. The `ApprovalFlow` Results keys likely can't be removed (still live in the collab flow) — Task 11 handles both branches.
