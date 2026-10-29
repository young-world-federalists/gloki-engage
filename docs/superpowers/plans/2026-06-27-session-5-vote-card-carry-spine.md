# Session 5 — Vote Card + Carry the Commitments/Metrics Spine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the quadratic-voting card (`QVFlow`) so it shows the expert-reviewed solutions with their commitments + expert metrics (carried from S4's `approval` contract), votes via hearts, hard-locks once cast, and shows results coloured by 6 world regions with a key and a 75% community-turnout footer.

**Architecture:** `QVFlow` reads the ballot mechanics from the `qv` contract and the commitments/metrics **spine** from the initiative's `approval` (proposals) contract via a second `useFlowContract`, joining by proposal id. The card auto-switches between a votable ballot and a hard-locked results view based on whether the member has an allocation. Results recolour from per-country (`getCountryColor`) to 6 regions via a new `src/utils/regions.ts` + `$region-*` tokens. No contract methods change.

**Tech Stack:** React 19 + TypeScript + Vite + SCSS Modules; demo stub layer behind `src/services/api.ts`; `lucide-react` icons; i18n via `useT`.

## Global Constraints

- Branch `ui`; keep it runnable. Never call a real server from a component — all reads/writes via `src/services/api.ts`. Demo seam emits **no `contract_write` events → re-fetch after writes**.
- **No test framework.** The per-task verification cycle is `npm run build` (runs `tsc -b` — must be clean) plus `preview_*` checks where the change is observable. Never claim done without a clean build.
- **Tokens only** (from `src/styles/variables.scss`): `$spacing-*`, `$text-*`, `$gray-*`, `$radius-*`, `$primary`, `$success`, `$warning`, `$font-medium`/`$font-bold`, `$shadow-sm`, `$transition-*`, `$dark-bg`/`$dark-surface`/`$dark-border`/`$dark-text`/`$dark-text-secondary`. No hardcoded hex in components. Region colours via `var(--region-*)` CSS custom properties.
- **AA + a11y:** AA contrast light + dark; ≥44px touch targets on steppers/Cast; visible `:focus-visible` rings; no `$gray-400` body text; `prefers-reduced-motion` honored (no transitions); `role="progressbar"` on meters with min/max/now; `role="status"` on the auto-updating status line.
- **360px flagship**, verify light + dark, both states (votable → cast → locked).
- **i18n:** new user-facing strings under `mechanisms.qv.*`, en inline via `t('key','English')`, fr + sw key parity. Region names stay English (in `regions.ts`).
- **ui contract method/field names MUST match Ouri's real contract** — the "solution" UI vocab over `proposal`/`addProposal` contract names is by design; do not rename contract methods.
- **DEMO_VERSION bump** required when seeding new demo data (S4 ended at `global-v8` → S5 is `global-v9`).
- Spec: `docs/superpowers/specs/2026-06-27-session-5-vote-card-carry-spine-design.md`.

---

## File Structure

- `src/utils/regions.ts` — **new.** Pure region taxonomy: `RegionId`, `REGIONS`, `regionOf(code)`, `regionColorVar(id)`. One responsibility: country→region + colour token lookup.
- `src/styles/variables.scss` — **modify.** Add `$region-*` SCSS tokens.
- `src/styles/index.scss` — **modify.** Expose `--region-*` CSS custom properties (light + dark).
- `src/services/demo/fixtures/deliberation.ts` — **modify.** Lengthen `privacy` proposals 0–2; add `privacy` commitments + expert reviews.
- `src/services/demo/mockApi.ts` — **modify.** `DEMO_VERSION` → `global-v9`.
- `src/components/community/VoteActivityCard.tsx` — **modify.** Add `scope`; pass `activeMemberCount` down.
- `src/components/initiative/stages/VoteEngage.tsx` — **modify.** New `communityMemberCount` prop.
- `src/components/stages/VoteStage.tsx` — **modify.** New `communityMemberCount` prop → `QVFlow`.
- `src/components/collaboration/flows/voting/QVFlow.tsx` — **modify (rewrite body).** The redesigned card.
- `src/components/collaboration/flows/voting/QVFlow.module.scss` — **modify (rewrite).** v4 styling.
- `src/i18n/fr.ts`, `src/i18n/sw.ts` — **modify.** New `mechanisms.qv.*` keys.
- `docs/i18n-native-review-candidates.md` — **modify.** Append new keys.
- `DESIGN_SYSTEM.md` — **modify.** Document region system + vote-card pattern.

---

## Task 1: Region taxonomy util + colour tokens

**Files:**
- Create: `src/utils/regions.ts`
- Modify: `src/styles/variables.scss` (append `$region-*` tokens)
- Modify: `src/styles/index.scss` (append `--region-*` CSS vars, light + dark)

**Interfaces:**
- Produces: `type RegionId = 'africa' | 'asiaPacific' | 'europe' | 'latam' | 'northAmerica' | 'mena' | 'other'`; `interface Region { id: RegionId; label: string }`; `const REGIONS: Region[]` (the 6 visible, in fixed order, no `'other'`); `function regionOf(countryCode: string | undefined): RegionId`; `function regionColorVar(id: RegionId): string` (returns e.g. `'var(--region-africa)'`).

- [ ] **Step 1: Create `src/utils/regions.ts`**

```ts
// Maps ISO 3166-1 alpha-2 country codes to 6 world regions for the vote-results
// colour scheme (replaces the 197-colour per-country rainbow on the ballot).
// 'other' is the fallback for unmapped/missing codes (incl. the demo 'OTHER'
// sentinel); it is NOT in REGIONS (the visible key shows the 6) but renders as a
// neutral grey segment when present. Region names stay English (not i18n).

export type RegionId =
  | 'africa' | 'asiaPacific' | 'europe' | 'latam' | 'northAmerica' | 'mena' | 'other';

export interface Region { id: RegionId; label: string }

export const REGIONS: Region[] = [
  { id: 'africa', label: 'Africa' },
  { id: 'asiaPacific', label: 'Asia & Pacific' },
  { id: 'europe', label: 'Europe' },
  { id: 'latam', label: 'Latin America & Caribbean' },
  { id: 'northAmerica', label: 'North America' },
  { id: 'mena', label: 'Middle East & North Africa' },
];

// Disjoint code sets. Checked in order; first hit wins. Unmatched → 'other'.
const MENA = new Set([
  'DZ','EG','LY','MA','TN','SD','BH','IR','IQ','IL','JO','KW','LB','OM','PS','QA','SA','SY','AE','YE','TR',
]);
const EUROPE = new Set([
  'AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','XK',
  'LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE',
  'CH','UA','GB','VA',
]);
const NORTH_AMERICA = new Set(['US','CA','GL','BM']);
const LATAM = new Set([
  'MX','GT','BZ','SV','HN','NI','CR','PA','CO','VE','GY','SR','EC','PE','BR','BO','PY','UY','AR','CL','CU',
  'JM','HT','DO','BS','BB','AG','DM','GD','KN','LC','VC','TT','PR',
]);
const ASIA_PACIFIC = new Set([
  'AF','AM','AZ','GE','BD','BT','BN','KH','CN','IN','ID','JP','KZ','KP','KR','KG','LA','MY','MV','MN','MM',
  'NP','PK','PH','SG','LK','TW','TJ','TH','TL','TM','UZ','VN','HK','MO',
  'AU','NZ','FJ','PG','SB','VU','WS','TO','KI','TV','NR','FM','MH','PW','CK','NU',
]);
const AFRICA = new Set([
  'AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CD','CG','CI','DJ','GQ','ER','SZ','ET','GA','GM','GH',
  'GN','GW','KE','LS','LR','MG','MW','ML','MR','MU','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','SS',
  'TZ','TG','UG','ZM','ZW',
]);

export function regionOf(countryCode: string | undefined): RegionId {
  if (!countryCode) return 'other';
  const c = countryCode.toUpperCase();
  if (MENA.has(c)) return 'mena';
  if (EUROPE.has(c)) return 'europe';
  if (NORTH_AMERICA.has(c)) return 'northAmerica';
  if (LATAM.has(c)) return 'latam';
  if (ASIA_PACIFIC.has(c)) return 'asiaPacific';
  if (AFRICA.has(c)) return 'africa';
  return 'other';
}

const COLOR_VARS: Record<RegionId, string> = {
  africa: 'var(--region-africa)',
  asiaPacific: 'var(--region-asia-pacific)',
  europe: 'var(--region-europe)',
  latam: 'var(--region-latam)',
  northAmerica: 'var(--region-north-america)',
  mena: 'var(--region-mena)',
  other: 'var(--region-other)',
};

export function regionColorVar(id: RegionId): string {
  return COLOR_VARS[id];
}
```

- [ ] **Step 2: Append `$region-*` tokens to `src/styles/variables.scss`**

Add at the end of the colour section (after the `$stage-*` block near lines 26–30):

```scss
// Region palette — vote-results colours (6 regions + neutral fallback).
// Chosen distinct + AA as bar fills against card backgrounds in light & dark.
$region-africa:        #d98a2b;
$region-asia-pacific:  #1f9e94;
$region-europe:        #4f63d2;
$region-latam:         #d94f6a;
$region-north-america: #8b5cf6;
$region-mena:          #2f9e57;
$region-other:         #8a909c;
```

- [ ] **Step 3: Expose `--region-*` CSS custom properties in `src/styles/index.scss`**

Inside the existing `:root { … }` block (after `color-scheme: light dark;`), add:

```scss
  // Region colours (consumed by the vote-results bars via regionColorVar()).
  --region-africa: #{$region-africa};
  --region-asia-pacific: #{$region-asia-pacific};
  --region-europe: #{$region-europe};
  --region-latam: #{$region-latam};
  --region-north-america: #{$region-north-america};
  --region-mena: #{$region-mena};
  --region-other: #{$region-other};
```

Then add a dark override block at the end of `index.scss` (slightly lightened for AA on dark surfaces):

```scss
@media (prefers-color-scheme: dark) {
  :root {
    --region-africa: #e8a33d;
    --region-asia-pacific: #2bb8ac;
    --region-europe: #6f81e8;
    --region-latam: #e86d84;
    --region-north-america: #a78bfa;
    --region-mena: #3fb86c;
    --region-other: #a0a6b2;
  }
}
```

- [ ] **Step 4: Verify the build is clean**

Run: `npm run build`
Expected: completes with no TS/SCSS errors (the util is unused so far — that's fine).

- [ ] **Step 5: Commit**

```bash
git add src/utils/regions.ts src/styles/variables.scss src/styles/index.scss
git commit -m "feat(vote): add 6-region taxonomy util + \$region-* colour tokens

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Seed the `privacy` vote-stage spine + bump DEMO_VERSION

**Files:**
- Modify: `src/services/demo/fixtures/deliberation.ts` (`PROPOSALS_BY_KEY.privacy`, `PROPOSAL_COMMITMENTS_BY_KEY`, `PROPOSAL_EXPERT_REVIEWS_BY_KEY`)
- Modify: `src/services/demo/mockApi.ts` (`DEMO_VERSION`)

**Interfaces:**
- Consumes: the existing seeder path — `propProposals` (built from `PROPOSALS_BY_KEY[key]` + `PROPOSAL_COMMITMENTS_BY_KEY[key]` + `PROPOSAL_EXPERT_REVIEWS_BY_KEY[key]`) and `qvProposals = propProposals.slice(0,4)` (shares ids `p0..p3`). No code change in `seedDemoCommunity.ts`.
- Produces: a `privacy` initiative whose `approval` proposals 0–2 carry `commitments` + `expertReviews[].metrics`; proposal 3 stays unreviewed.

- [ ] **Step 1: Lengthen `PROPOSALS_BY_KEY.privacy` indices 0–2** in `src/services/demo/fixtures/deliberation.ts`

Replace the existing `privacy: [ … ]` array (currently lines ~37–42) with:

```ts
  privacy: [
    'An independent data-protection authority with binding audit powers over both public agencies and large platforms, funded by a levy on data processors so it can never be starved of the budget it needs to police them.',
    'End-to-end encryption by default for all citizen–government messaging, built on open, independently audited protocols with no exceptional-access backdoors, so a leak or a change of government can’t retroactively expose people.',
    'A free, portable digital identity that every resident fully controls, with an offline fallback so access to services never depends on connectivity, a smartphone, or a single vendor.',
    'Independent audits of high-risk algorithms, with public summaries.',
  ],
```

- [ ] **Step 2: Add `privacy` to `PROPOSAL_COMMITMENTS_BY_KEY`** (in the same file, ~line 454)

Add this key inside the `PROPOSAL_COMMITMENTS_BY_KEY` object (after the `jobs: { … }` entry):

```ts
  privacy: {
    0: ['An independent authority audits the largest platforms every year', 'Every ruling is published within 30 days'],
    1: ['The reference client is open-sourced', 'An independent security audit passes before launch'],
    2: ['An offline fallback works in every region', 'People can export their data in one tap — no vendor lock-in'],
  },
```

- [ ] **Step 3: Add `privacy` to `PROPOSAL_EXPERT_REVIEWS_BY_KEY`** (same file, ~line 469)

Add this key inside the `PROPOSAL_EXPERT_REVIEWS_BY_KEY` object (after the `jobs: [ … ]` entry). Reuse the existing expert keys (reviewer names are not shown on the vote card; spread across both so distinct reviewers ≥ 2):

```ts
  privacy: [
    { proposalIndex: 0, expert: 'demo-expert-renata', metrics: ['Share of audits completed on schedule', 'Median days to resolve a complaint'] },
    { proposalIndex: 1, expert: 'demo-expert-lena', metrics: ['Independent audits passed', 'Share of public services encrypted by default'] },
    { proposalIndex: 2, expert: 'demo-expert-renata', metrics: ['Share of the population with an active ID', 'Service uptime including offline mode'] },
  ],
```

- [ ] **Step 4: Bump `DEMO_VERSION`** in `src/services/demo/mockApi.ts`

Find the `DEMO_VERSION` constant (value `'global-v8'`) and change it to `'global-v9'`.

```ts
const DEMO_VERSION = 'global-v9';
```

- [ ] **Step 5: Verify the build is clean**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/services/demo/fixtures/deliberation.ts src/services/demo/mockApi.ts
git commit -m "feat(demo): seed privacy vote-stage spine (3 reviewed solutions); DEMO_VERSION v9

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Thread scope + member count to the vote card

**Files:**
- Modify: `src/components/community/VoteActivityCard.tsx`
- Modify: `src/components/initiative/stages/VoteEngage.tsx`
- Modify: `src/components/stages/VoteStage.tsx`

**Interfaces:**
- Consumes: `useInitiativePost(...).post.scope` (already provided by the hook); `activeMemberCount` (already computed in `VoteActivityCard`).
- Produces: `VoteEngageProps` gains `communityMemberCount?: number`; `VoteStageProps` gains `communityMemberCount?: number`; both forward it to `QVFlow` (Task 4 consumes it as `communityMemberCount`).

- [ ] **Step 1: `VoteActivityCard.tsx` — add `scope` to `fullPost` and pass member count**

In the `fullPost` object, add `scope: post.scope,` (next to the existing `sdg: post.sdg,`). Then pass the count to `VoteEngage`:

```tsx
      <VoteEngage initiativeId={item.id} communityId={communityId} communityMemberCount={activeMemberCount} />
```

- [ ] **Step 2: `VoteEngage.tsx` — accept + forward the prop**

Update the props interface and the component:

```tsx
export interface VoteEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — gates the ballot via {@link StageGate}. */
  communityId: string;
  /** Active community member count — denominator for the turnout footer. */
  communityMemberCount?: number;
}

const VoteEngage: React.FC<VoteEngageProps> = ({ initiativeId, communityId, communityMemberCount }) => {
  return (
    <div className={styles.engage}>
      <StageGate communityId={communityId} stage="vote">
        <VoteStage initiativeId={initiativeId} communityMemberCount={communityMemberCount} />
      </StageGate>
    </div>
  );
};
```

- [ ] **Step 3: `VoteStage.tsx` — accept + forward the prop**

```tsx
export interface VoteStageProps {
  /** The initiative contract id — used as the shared parent contract. */
  initiativeId: string;
  /** Active community member count — denominator for the turnout footer. */
  communityMemberCount?: number;
}

const VoteStage: React.FC<VoteStageProps> = ({ initiativeId, communityMemberCount }) => (
  <ErrorBoundary fallbackMessage="Voting encountered an error.">
    <QVFlow
      instanceId={`${initiativeId}_vote`}
      collaborationId={initiativeId}
      collaborationType="initiative"
      parentContractId={initiativeId}
      stageKey="voteContractId"
      communityMemberCount={communityMemberCount}
    />
  </ErrorBoundary>
);
```

- [ ] **Step 4: Verify the build is clean**

Run: `npm run build`
Expected: PASS. (Execution order note: Task 4 runs **before** this task, so `QVFlow` already declares the optional `communityMemberCount?: number` prop — passing it here compiles cleanly with no errors.)

- [ ] **Step 5: Commit**

```bash
git add src/components/community/VoteActivityCard.tsx src/components/initiative/stages/VoteEngage.tsx src/components/stages/VoteStage.tsx
git commit -m "feat(vote): thread scope badge + active member count to the vote card

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Redesign `QVFlow` (the card)

**Files:**
- Modify (rewrite): `src/components/collaboration/flows/voting/QVFlow.tsx`
- Modify (rewrite): `src/components/collaboration/flows/voting/QVFlow.module.scss`

**Interfaces:**
- Consumes: `regions.ts` (`REGIONS`, `regionOf`, `regionColorVar`, `RegionId`); `communityMemberCount` prop (Task 3); the seeded spine (Task 2); `approvalApi.getProposals`; `qvApi` (`getProposals`/`getConfig`/`getMyAllocation`/`getAllocations`/`getResults`/`allocate`); `useFlowContract`; `UserIdentity`, `Button`.
- Produces: `QVFlowProps = FlowProps & { communityMemberCount?: number }`. The redesigned card (no public API beyond the prop).

- [ ] **Step 1: Replace the entire contents of `QVFlow.tsx`**

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, Plus, Minus } from 'lucide-react';
import type { FlowProps } from '../types';
import { useFlowContract } from '../shared/useFlowContract';
import * as api from './qvApi';
import * as approvalApi from './approvalApi';
import { useAppSelector } from '../../../../store/hooks';
import { useT } from '../../../../i18n';
import { Button, UserIdentity } from '../../../shared';
import { REGIONS, regionOf, regionColorVar, type RegionId } from '../../../../utils/regions';
import styles from './QVFlow.module.scss';

interface QvProposal { id: string; text: string; author: string; timestamp: string | number }
interface ExpertReview { expert: string; metrics: string[]; note?: string; timestamp: number }
interface ApprovalProposal {
  id: string; text: string; author: string; timestamp: number | string;
  commitments?: string[]; expertReviews?: ExpertReview[];
}
interface Config { credits_per_voter: number; status: string }

// A ballot row: hearts/results from qv, commitments/metrics/reviewed from approval.
interface BallotSolution {
  id: string; text: string; author: string;
  commitments: string[]; metrics: string[]; reviewed: boolean;
}

export interface QVFlowProps extends FlowProps {
  /** Active community member count — denominator for the 75% turnout footer. */
  communityMemberCount?: number;
}

// Hearts are whole votes; their cost is quadratic (h hearts cost h² from a shared
// pool). We store hearts in the draft and convert to credits (h²) on submit, so the
// contract's sqrt-based results read back as whole votes (sqrt(h²) = h).
const heartCost = (hearts: number): number => hearts * hearts;
const heartsFromCredits = (credits: number): number => Math.max(0, Math.round(Math.sqrt(credits)));

const TURNOUT_TARGET = 75; // % of the community whose votes complete the stage

const QVFlow: React.FC<QVFlowProps> = ({ instanceId, parentContractId, stageKey, communityMemberCount = 0 }) => {
  const t = useT();
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } =
    useFlowContract(instanceId, 'quadratic_vote', 'qv_contract.py', '', parentContractId, stageKey);
  // The initiative's approval (proposals) contract is the canonical home of the S4
  // commitments + expert-metrics spine. The vote card READS it (never writes) and
  // joins by proposal id. FOR OURI: this is the carry — S6 reads the winning
  // solution's commitments/metrics from the same approval contract.
  const { contractId: proposalsContractId, isReady: proposalsReady } =
    useFlowContract(`${parentContractId}_proposals`, 'approval_voting', 'approval_contract.py', '', parentContractId, 'proposalsContractId');

  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [qvProposals, setQvProposals] = useState<Record<string, QvProposal>>({});
  const [approvalProposals, setApprovalProposals] = useState<Record<string, ApprovalProposal>>({});
  const [config, setConfig] = useState<Config>({ credits_per_voter: 100, status: 'open' });
  const [allAllocations, setAllAllocations] = useState<Record<string, Record<string, number>>>({});
  const [results, setResults] = useState<Record<string, number>>({});
  const [myAllocation, setMyAllocation] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Record<string, number>>({});
  const draftInitialized = useRef(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // "Voted" = this member already has an allocation (hard-lock once cast). FOR OURI:
  // derived client-side from get_my_allocation; no new contract method needed.
  const hasVoted = Object.keys(myAllocation).length > 0;

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setLoading(true);
    try {
      const [p, c, ma, aa, r, ap] = await Promise.all([
        api.getProposals(serverUrl, publicKey, contractId),
        api.getConfig(serverUrl, publicKey, contractId),
        api.getMyAllocation(serverUrl, publicKey, contractId),
        api.getAllocations(serverUrl, publicKey, contractId), // always — for turnout count
        api.getResults(serverUrl, publicKey, contractId),
        proposalsReady && proposalsContractId
          ? approvalApi.getProposals(serverUrl, publicKey, proposalsContractId)
          : Promise.resolve(null),
      ]);
      setQvProposals((p as Record<string, QvProposal>) || {});
      setConfig((c as Config) || { credits_per_voter: 100, status: 'open' });
      const mine = (ma as Record<string, number>) || {};
      setMyAllocation(mine);
      if (!draftInitialized.current) {
        const hearts: Record<string, number> = {};
        for (const [pid, credits] of Object.entries(mine)) {
          const h = heartsFromCredits(credits);
          if (h > 0) hearts[pid] = h;
        }
        setDraft(hearts);
        draftInitialized.current = true;
      }
      setAllAllocations((aa as Record<string, Record<string, number>>) || {});
      setResults((r as Record<string, number>) || {});
      if (ap) setApprovalProposals(ap as Record<string, ApprovalProposal>);
    } catch (err) { console.error('Failed to fetch QV data:', err); }
    finally { setLoading(false); }
  }, [serverUrl, publicKey, contractId, proposalsContractId, proposalsReady]);

  useEffect(() => { if (isReady) fetchData(); }, [isReady, fetchData]);

  // ── Build the ballot: join qv (mechanics) + approval (spine), reviewed-only ──
  const qvList = Object.values(qvProposals).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const merged: BallotSolution[] = qvList.map((q) => {
    const twin = approvalProposals[q.id];
    const reviews = twin?.expertReviews ?? [];
    return {
      id: q.id,
      text: twin?.text ?? q.text,
      author: twin?.author ?? q.author,
      commitments: twin?.commitments ?? [],
      metrics: reviews.flatMap((rv) => rv.metrics),
      reviewed: reviews.length > 0,
    };
  });
  const reviewedList = merged.filter((m) => m.reviewed);
  const ballot = reviewedList.length > 0 ? reviewedList : merged; // graceful fallback

  // ── Hearts / quadratic pool ──
  const pool = config.credits_per_voter;
  const spent = Object.values(draft).reduce((sum, h) => sum + heartCost(h), 0);
  const poolUsedPct = pool > 0 ? Math.min((spent / pool) * 100, 100) : 0;
  const canAddHeart = (id: string): boolean => {
    const h = draft[id] || 0;
    return spent + (2 * h + 1) <= pool;
  };
  const addHeart = (id: string) => { if (canAddHeart(id)) setDraft((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 })); };
  const removeHeart = (id: string) => setDraft((prev) => {
    const h = prev[id] || 0;
    if (h <= 1) { const { [id]: _omit, ...rest } = prev; return rest; }
    return { ...prev, [id]: h - 1 };
  });

  const handleSubmitAllocation = async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setSubmitting(true);
    try {
      const credits: Record<string, number> = {};
      for (const [pid, h] of Object.entries(draft)) if (h > 0) credits[pid] = heartCost(h);
      await api.allocate(serverUrl, publicKey, contractId, credits);
      await fetchData(); // demo seam emits no write events → re-fetch; flips to locked
    } catch (err) { console.error('Failed to submit allocation:', err); }
    finally { setSubmitting(false); }
  };

  // ── Turnout (distinct allocators ÷ active members) ──
  const allocators = Object.keys(allAllocations).length;
  const turnoutPct = communityMemberCount > 0 ? Math.round((allocators / communityMemberCount) * 100) : 0;
  const turnoutFillPct = Math.min((turnoutPct / TURNOUT_TARGET) * 100, 100);

  // ── Region breakdown of a solution's votes (sqrt(credits) = whole votes) ──
  const regionBreakdown = (id: string): Partial<Record<RegionId, number>> => {
    const out: Partial<Record<RegionId, number>> = {};
    for (const [voter, alloc] of Object.entries(allAllocations)) {
      const credits = alloc[id];
      if (!credits) continue;
      const region = regionOf(profiles[voter]?.country);
      out[region] = (out[region] || 0) + Math.sqrt(credits);
    }
    return out;
  };

  const authorName = (key: string): string => {
    const p = profiles[key];
    const n = p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : '';
    return n || `${key.slice(0, 8)}…`;
  };

  const turnoutFooter = (
    <div className={styles.turnout}>
      <div className={styles.turnoutHead}>
        <span>{t('mechanisms.qv.turnoutLabel', 'Community turnout')}</span>
        <span>{t('mechanisms.qv.turnoutValue', '{pct}% of {target}% needed', { pct: turnoutPct, target: TURNOUT_TARGET })}</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={turnoutPct}
        aria-label={t('mechanisms.qv.turnoutLabel', 'Community turnout')}
      >
        <div className={`${styles.fill} ${styles.fillTurnout}`} style={{ width: `${turnoutFillPct}%` }} />
      </div>
      <div className={styles.turnoutNote}>
        {t('mechanisms.qv.turnoutNote', 'The vote completes when {target}% of members have taken part.', { target: TURNOUT_TARGET })}
      </div>
    </div>
  );

  const regionKey = (
    <div className={styles.keygrid}>
      {REGIONS.map((rg) => (
        <div key={rg.id} className={styles.keyitem}>
          <span className={styles.sw} style={{ backgroundColor: regionColorVar(rg.id) }} aria-hidden="true" />
          {rg.label}
        </div>
      ))}
    </div>
  );

  if (hasError) return (
    <div className={styles.loading}>
      <p>{errorMessage || t('mechanisms.qv.setupError', 'Failed to set up voting.')}</p>
      <Button variant="secondary" size="sm" onClick={retry}>{t('common.retry', 'Try again')}</Button>
    </div>
  );
  if (isDeploying || !isReady) return (
    <div className={styles.loading}>{statusMessage || t('mechanisms.qv.settingUp', 'Setting up voting…')}</div>
  );
  if (loading && qvList.length === 0) return <div className={styles.loading}>{t('common.loading', 'Loading…')}</div>;

  return (
    <div className={styles.container}>
      {!hasVoted ? (
        <>
          <div className={styles.status} role="status">
            <span className={styles.dot} aria-hidden="true" />
            {t('mechanisms.qv.statusOpen', 'Voting open · {n} solutions', { n: ballot.length })}
          </div>

          <div className={styles.guide}>
            <p className={styles.guideText}>
              {t('mechanisms.qv.guide', 'Tap ♥ to back what you care about — spreading your hearts across solutions costs less than piling them onto one.')}
            </p>
            <div
              className={styles.track}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(poolUsedPct)}
              aria-label={t('mechanisms.qv.supportUsed', 'Support used')}
            >
              <div className={`${styles.fill} ${styles.fillSupport}`} style={{ width: `${poolUsedPct}%` }} />
            </div>
            <span className={styles.hint}>
              {t('mechanisms.qv.supportUsedPct', '{pct}% of your support used', { pct: Math.round(poolUsedPct) })}
            </span>
          </div>

          {ballot.map((s, i) => {
            const hearts = draft[s.id] || 0;
            return (
              <div key={s.id} className={styles.sol}>
                <div className={styles.solHead}>
                  <span className={styles.solNum}>{t('mechanisms.qv.solutionN', 'Solution {i} of {n}', { i: i + 1, n: ballot.length })}</span>
                  {s.reviewed && <span className={styles.reviewed}>{t('mechanisms.qv.expertReviewed', 'expert reviewed')}</span>}
                </div>
                <div className={styles.heartsBar}>
                  <button
                    className={styles.stepper}
                    onClick={() => removeHeart(s.id)}
                    disabled={hearts === 0}
                    aria-label={t('mechanisms.qv.removeHeart', 'Remove support from this solution')}
                  >
                    <Minus size={16} />
                  </button>
                  <div className={styles.hearts} role="img" aria-label={t('mechanisms.qv.heartsAria', '{n} hearts of support', { n: hearts })}>
                    {hearts === 0
                      ? <Heart size={18} className={styles.heartEmpty} aria-hidden="true" />
                      : Array.from({ length: hearts }).map((_, k) => (
                          <Heart key={k} size={18} className={styles.heartFilled} fill="currentColor" aria-hidden="true" />
                        ))}
                  </div>
                  <button
                    className={styles.stepper}
                    onClick={() => addHeart(s.id)}
                    disabled={!canAddHeart(s.id)}
                    aria-label={t('mechanisms.qv.addHeart', 'Back this solution')}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className={styles.solText}>{s.text}</p>
                <div className={styles.solByline}>
                  <UserIdentity name={authorName(s.author)} countryCode={profiles[s.author]?.country} size="sm" />
                </div>
                {s.commitments.length > 0 && (
                  <details className={styles.dcard}>
                    <summary className={styles.dsummary}>
                      <span>{t('mechanisms.qv.commitsLabel', 'What this commits to ({n})', { n: s.commitments.length })}</span>
                      <span className={styles.plus} aria-hidden="true">+</span>
                    </summary>
                    <div className={styles.dinner}><ul>{s.commitments.map((c, k) => <li key={k}>{c}</li>)}</ul></div>
                  </details>
                )}
                {s.metrics.length > 0 && (
                  <details className={`${styles.dcard} ${styles.metricsCard}`}>
                    <summary className={styles.dsummary}>
                      <span>{t('mechanisms.qv.metricsLabel', 'How we’ll know it’s working ({n})', { n: s.metrics.length })}</span>
                      <span className={styles.plus} aria-hidden="true">+</span>
                    </summary>
                    <div className={styles.dinner}><ul>{s.metrics.map((m, k) => <li key={k}>{m}</li>)}</ul></div>
                  </details>
                )}
              </div>
            );
          })}

          <Button variant="primary" size="lg" fullWidth onClick={handleSubmitAllocation} loading={submitting} disabled={spent === 0}>
            {t('mechanisms.qv.cast', 'Cast my votes')}
          </Button>

          {turnoutFooter}
        </>
      ) : (
        <>
          <div className={styles.status} role="status">
            <span className={`${styles.dot} ${styles.dotDone}`} aria-hidden="true" />
            {t('mechanisms.qv.statusVoted', 'You’ve voted')}
          </div>
          <p className={styles.statusSub}>{t('mechanisms.qv.votedSub', 'Live results below · votes can’t be changed')}</p>

          {[...ballot].sort((a, b) => (results[b.id] || 0) - (results[a.id] || 0)).map((s, idx) => {
            const total = results[s.id] || 0;
            const breakdown = regionBreakdown(s.id);
            const sumVotes = Object.values(breakdown).reduce((x, y) => x + (y || 0), 0) || 1;
            const myHearts = draft[s.id] || 0;
            return (
              <div key={s.id} className={styles.sol}>
                <div className={styles.solHead}>
                  <span className={styles.solNum}>{t('mechanisms.qv.solutionN', 'Solution {i} of {n}', { i: idx + 1, n: ballot.length })}</span>
                  {s.reviewed && <span className={styles.reviewed}>{t('mechanisms.qv.expertReviewed', 'expert reviewed')}</span>}
                </div>
                <p className={styles.solText}>{s.text}</p>
                <div className={`${styles.yourVote} ${myHearts === 0 ? styles.yourVoteNone : ''}`}>
                  <span className={styles.yourVoteLbl}>{t('mechanisms.qv.yourVote', 'Your vote')}</span>
                  <span className={styles.yourVoteHearts} role="img" aria-label={t('mechanisms.qv.heartsAria', '{n} hearts of support', { n: myHearts })}>
                    {myHearts === 0 ? '—' : Array.from({ length: myHearts }).map((_, k) => (
                      <Heart key={k} size={13} fill="currentColor" aria-hidden="true" />
                    ))}
                  </span>
                </div>
                <div className={styles.regbar} role="img" aria-label={t('mechanisms.qv.votesCount', '{n} votes', { n: Math.round(total) })}>
                  {REGIONS.map((rg) => {
                    const v = breakdown[rg.id] || 0;
                    if (!v) return null;
                    return <span key={rg.id} style={{ width: `${(v / sumVotes) * 100}%`, backgroundColor: regionColorVar(rg.id) }} title={`${rg.label}: ${Math.round(v)}`} />;
                  })}
                  {breakdown.other ? (
                    <span style={{ width: `${(breakdown.other / sumVotes) * 100}%`, backgroundColor: regionColorVar('other') }} title={`${t('mechanisms.qv.regionOther', 'Other')}: ${Math.round(breakdown.other)}`} />
                  ) : null}
                </div>
                <div className={styles.rescount}>
                  {t('mechanisms.qv.votesCount', '{n} votes', { n: Math.round(total) })}{idx === 0 ? ` · ${t('mechanisms.qv.leading', 'leading')}` : ''}
                </div>
                {(s.commitments.length > 0 || s.metrics.length > 0) && (
                  <details className={`${styles.dcard} ${styles.metricsCard}`}>
                    <summary className={styles.dsummary}>
                      <span>{t('mechanisms.qv.commitsMetrics', 'Commitments & metrics')}</span>
                      <span className={styles.plus} aria-hidden="true">+</span>
                    </summary>
                    <div className={styles.dinner}><ul>{[...s.commitments, ...s.metrics].map((x, k) => <li key={k}>{x}</li>)}</ul></div>
                  </details>
                )}
              </div>
            );
          })}

          {regionKey}
          {turnoutFooter}
        </>
      )}
    </div>
  );
};

export default QVFlow;
```

- [ ] **Step 2: Replace the entire contents of `QVFlow.module.scss`**

```scss
@use '../../../../styles/variables' as *;

.container { display: flex; flex-direction: column; gap: $spacing-lg; }

.loading {
  display: flex; flex-direction: column; align-items: center; gap: $spacing-md;
  padding: $spacing-xl; color: $gray-600; font-size: $text-sm;
}

// ─── Auto status line ──────────────────────────────────────────────────
.status {
  display: flex; align-items: center; gap: $spacing-sm;
  font-size: $text-sm; font-weight: $font-medium; color: $primary;
}
.dot { width: 8px; height: 8px; border-radius: $radius-full; background: currentColor; flex: 0 0 auto; }
.dotDone { color: $success; }
.statusSub { font-size: $text-xs; color: $gray-600; margin: 0; }

// ─── Merged guide + support meter ──────────────────────────────────────
.guide {
  display: flex; flex-direction: column; gap: $spacing-xs;
  padding: $spacing-md; border-radius: $radius-md;
  background: rgba($primary, 0.06); border: 1px solid rgba($primary, 0.2);
}
.guideText { margin: 0 0 $spacing-xs; font-size: $text-sm; line-height: 1.5; color: $gray-700; }
.hint { font-size: $text-xs; color: $gray-600; }

.track { height: 8px; background: $gray-100; border-radius: $radius-full; overflow: hidden; }
.fill { height: 100%; border-radius: $radius-full; transition: width 0.3s ease; }
.fillSupport { background: $primary; }
.fillTurnout { background: $gray-500; }
@media (prefers-reduced-motion: reduce) { .fill { transition: none; } }

// ─── Solution card ─────────────────────────────────────────────────────
.sol { border: 1.5px solid $gray-200; border-radius: $radius-md; padding: $spacing-md; background: white; }
.solHead { display: flex; align-items: center; justify-content: space-between; gap: $spacing-sm; margin-bottom: $spacing-sm; }
.solNum { font-size: $text-xs; font-weight: $font-bold; text-transform: uppercase; letter-spacing: 0.04em; color: $gray-500; }
.reviewed { font-size: $text-xs; font-weight: $font-medium; color: $success; }

.solText { margin: 0 0 $spacing-sm; font-size: $text-sm; line-height: 1.5; color: $gray-800; }
.solByline { display: flex; align-items: center; gap: $spacing-sm; margin-bottom: $spacing-sm; }

// ─── Hearts bar (on top) ───────────────────────────────────────────────
.heartsBar {
  display: flex; align-items: center; justify-content: center; gap: $spacing-md;
  padding: $spacing-sm; margin-bottom: $spacing-sm;
  background: rgba($primary, 0.06); border: 1px solid rgba($primary, 0.22); border-radius: $radius-md;
}
.stepper {
  width: 44px; height: 44px; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  background: $gray-100; border: 1px solid $gray-200; border-radius: $radius-md; color: $gray-700; cursor: pointer;
  transition: background-color $transition-base, color $transition-base, transform $transition-fast;
  &:hover:not(:disabled) { background: $gray-200; color: $gray-900; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
  &:active:not(:disabled) { transform: translateY(1px); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
.hearts { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: $spacing-xs; flex: 1; min-height: 24px; }
.heartFilled { color: $primary; }
.heartEmpty { color: $gray-500; opacity: 0.5; }

// ─── Detail cards (commitments / metrics) ──────────────────────────────
.dcard { border: 1px solid $gray-200; border-radius: $radius-md; margin-top: $spacing-xs; overflow: hidden; }
.dsummary {
  list-style: none; cursor: pointer; min-height: 44px;
  display: flex; align-items: center; justify-content: space-between; gap: $spacing-sm;
  padding: 0 $spacing-md; font-size: $text-sm; font-weight: $font-medium; color: $gray-700;
  &::-webkit-details-marker { display: none; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: -2px; }
}
.plus {
  width: 24px; height: 24px; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid $gray-200; border-radius: $radius-sm; font-size: $text-lg; line-height: 1;
  transition: transform $transition-base;
}
.dcard[open] .plus { transform: rotate(45deg); }
@media (prefers-reduced-motion: reduce) { .plus { transition: none; } }
.dinner { padding: 0 $spacing-md $spacing-md; }
.dinner ul { margin: 0; padding-left: $spacing-md; }
.dinner li { font-size: $text-xs; line-height: 1.6; color: $gray-600; }
.metricsCard { border-color: rgba($success, 0.4); }
.metricsCard .dsummary { color: $success; }

// ─── Your vote (locked) ────────────────────────────────────────────────
.yourVote {
  display: flex; align-items: center; gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm; margin-bottom: $spacing-sm;
  background: rgba($primary, 0.08); border: 1px solid rgba($primary, 0.22); border-radius: $radius-sm;
}
.yourVoteLbl { font-size: $text-xs; font-weight: $font-bold; color: $gray-700; }
.yourVoteHearts { display: flex; align-items: center; gap: 2px; color: $primary; }
.yourVoteNone { opacity: 0.6; }

// ─── Region results bar ────────────────────────────────────────────────
.regbar { display: flex; height: 20px; border-radius: $radius-sm; overflow: hidden; background: $gray-100; margin-bottom: $spacing-xs; }
.regbar > span { height: 100%; display: block; }
.rescount { font-size: $text-xs; color: $gray-500; }

// ─── Region key ────────────────────────────────────────────────────────
.keygrid {
  display: grid; grid-template-columns: 1fr 1fr; gap: $spacing-xs $spacing-md;
  padding-top: $spacing-md; border-top: 1px solid $gray-200;
}
.keyitem { display: flex; align-items: center; gap: $spacing-sm; font-size: $text-xs; color: $gray-600; }
.sw { width: 12px; height: 12px; border-radius: $radius-sm; flex: 0 0 auto; }

// ─── Turnout footer ────────────────────────────────────────────────────
.turnout { display: flex; flex-direction: column; gap: 4px; padding-top: $spacing-md; border-top: 1px solid $gray-200; }
.turnoutHead { display: flex; justify-content: space-between; font-size: $text-sm; color: $gray-600; }
.turnoutNote { font-size: $text-xs; color: $gray-500; margin-top: 2px; }

// ─── Dark mode ─────────────────────────────────────────────────────────
@media (prefers-color-scheme: dark) {
  .loading, .statusSub, .hint, .turnoutHead, .turnoutNote, .rescount, .keyitem, .dinner li { color: $dark-text-secondary; }
  .guideText, .solText { color: $dark-text; }
  .solNum { color: $dark-text-secondary; }
  .track, .regbar { background: $dark-border; }
  .sol { background: $dark-bg; border-color: $dark-border; }
  .dcard { border-color: $dark-border; }
  .dsummary { color: $dark-text; }
  .plus { border-color: $dark-border; }
  .stepper {
    background: $dark-surface; border-color: $dark-border; color: $dark-text;
    &:hover:not(:disabled) { background: $dark-border; color: $dark-text; }
  }
  .keygrid, .turnout { border-color: $dark-border; }
  .yourVoteLbl { color: $dark-text; }
}
```

- [ ] **Step 3: Verify the build is clean**

Run: `npm run build`
Expected: PASS (no TS/SCSS errors). (`QVFlow` declares `communityMemberCount?: number` as optional, so it compiles even though no caller passes it until Task 3, which runs next.)

- [ ] **Step 4: Verify in the browser (preview)**

Start/confirm the dev server (`gloki-dev`, port 5173). Navigate to the **Digital Rights** community → the **"A Global Baseline for Digital Privacy"** initiative's Vote card; expand it. At **360px**, check **light + dark**:
- Status "Voting open · 3 solutions"; merged guide + support meter; 3 numbered solutions, each "expert reviewed", hearts bar on top, author byline (flag + shield via UserIdentity), collapsible "What this commits to (2)" + "How we’ll know it’s working (2)" cards (the `+` rotates).
- Tap `+` hearts on a couple of solutions → support meter fills; **Cast my votes** enabled. Click it.
- Card flips to **locked**: "You’ve voted", "Your vote · ♥" per solution, region-coloured result bars, region key (2-col), slate turnout footer at the bottom. No steppers, no Cast.
- Confirm console has no errors.

If the card opens already locked (current user had a seeded allocation), or the ballot is empty, see Task 4a.

- [ ] **Step 5: Commit**

```bash
git add src/components/collaboration/flows/voting/QVFlow.tsx src/components/collaboration/flows/voting/QVFlow.module.scss
git commit -m "feat(vote): redesign QV card — carry spine, auto-lock, region results

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4a: Ensure the demo opens votable (verify, fix only if needed)

**Files:**
- Inspect: `src/services/demo/seedDemoCommunity.ts` (`qvAllocationPattern`, `voters`)

**Interfaces:**
- Consumes: the seeded `qv` allocations for `privacy`.
- Produces: a `privacy` ballot that opens in the **votable** state for the current demo user (no pre-existing allocation) while other members carry allocations (turnout reads mid-progress).

- [ ] **Step 1: Check whether the current user has a seeded allocation**

In the preview (Task 4 Step 4), if the privacy Vote card opens **votable**, this task is a no-op — skip to Step 3 and record "verified, no change". If it opens **locked** on first load, the demo's current user (`publicKey`) is among the seeded `qv` allocators.

- [ ] **Step 2: Exclude the current user from the privacy qv seed (only if it opened locked)**

Read `qvAllocationPattern` in `src/services/demo/seedDemoCommunity.ts`. The current demo user is the community creator (`publicKey` passed into the seed). If `voters` includes that key for `privacy`, filter it out of the allocation seed **for the privacy initiative only** so the current user opens votable, e.g. by excluding the creator's key when building `qvAllocationPattern(...)` for that initiative. Keep other voters' allocations intact (so turnout > 0). Bump `DEMO_VERSION` again to `global-v9a` if you change seed data here. Re-verify in preview.

- [ ] **Step 3: Commit (or record no-op)**

If changed:
```bash
git add src/services/demo/seedDemoCommunity.ts src/services/demo/mockApi.ts
git commit -m "fix(demo): privacy vote opens votable for the current user

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
If no change was needed, note "Task 4a verified — privacy opens votable, no change" in the ledger and move on.

---

## Task 5: i18n — fr + sw parity + native-review log

**Files:**
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`
- Modify: `docs/i18n-native-review-candidates.md`

**Interfaces:**
- Consumes: the new `mechanisms.qv.*` keys referenced in `QVFlow.tsx` (Task 4).
- Produces: fr + sw translations for every new key; identical key sets across both files.

**i18n format (verified):** the dictionaries are **flat objects of dotted string keys** — e.g. `'mechanisms.qv.cast': 'Voter',` — NOT nested objects. `en.ts` carries **no** `mechanisms.qv.*` keys; English comes from the inline `defaultValue` in each `t('key','English')` call (resolver: `DICTS[locale]?.[key] ?? DICTS.en[key] ?? defaultValue ?? key`). **So only `fr.ts` and `sw.ts` need new entries; do NOT touch `en.ts`.**

The 16 new keys to add: `'mechanisms.qv.statusOpen'`, `'mechanisms.qv.statusVoted'`, `'mechanisms.qv.votedSub'`, `'mechanisms.qv.guide'`, `'mechanisms.qv.supportUsedPct'`, `'mechanisms.qv.solutionN'`, `'mechanisms.qv.commitsLabel'`, `'mechanisms.qv.metricsLabel'`, `'mechanisms.qv.commitsMetrics'`, `'mechanisms.qv.yourVote'`, `'mechanisms.qv.leading'`, `'mechanisms.qv.turnoutLabel'`, `'mechanisms.qv.turnoutValue'`, `'mechanisms.qv.turnoutNote'`, `'mechanisms.qv.regionOther'`, `'mechanisms.qv.expertReviewed'`.

**Reused existing keys (already in fr.ts + sw.ts — do NOT re-add):** `'mechanisms.qv.supportUsed'`, `'mechanisms.qv.cast'`, `'mechanisms.qv.addHeart'`, `'mechanisms.qv.removeHeart'`, `'mechanisms.qv.heartsAria'`, `'mechanisms.qv.votesCount'`, `'mechanisms.qv.settingUp'`, `'mechanisms.qv.setupError'`, `'common.retry'`, `'common.loading'`. (The old `'mechanisms.qv.intro'` / `tab*` / `add*` / `pool*` / `participants` keys are now unused by the component but harmless — leave them.)

- [ ] **Step 1: Confirm which keys already exist**

Run: `grep -n "'mechanisms.qv\." src/i18n/fr.ts` and the same for `sw.ts`. Confirm the 16 new keys are NOT present and the reused ones ARE. (Both files currently have 21 `mechanisms.qv.*` keys.)

- [ ] **Step 2: Add the 16 new keys to `src/i18n/fr.ts`** — insert as flat dotted keys, two-space indent, alongside the existing `'mechanisms.qv.*'` block (after line ~911), matching the existing comma/quote style:

```ts
  'mechanisms.qv.statusOpen': 'Vote ouvert · {n} solutions',
  'mechanisms.qv.statusVoted': 'Vous avez voté',
  'mechanisms.qv.votedSub': 'Résultats en direct ci-dessous · le vote ne peut pas être modifié',
  'mechanisms.qv.guide': 'Touchez ♥ pour soutenir ce qui vous tient à cœur — répartir vos cœurs coûte moins que de tout miser sur une seule solution.',
  'mechanisms.qv.supportUsedPct': '{pct} % de votre soutien utilisé',
  'mechanisms.qv.solutionN': 'Solution {i} sur {n}',
  'mechanisms.qv.commitsLabel': 'Ce à quoi cela engage ({n})',
  'mechanisms.qv.metricsLabel': 'Comment nous saurons que ça marche ({n})',
  'mechanisms.qv.commitsMetrics': 'Engagements et indicateurs',
  'mechanisms.qv.yourVote': 'Votre vote',
  'mechanisms.qv.leading': 'en tête',
  'mechanisms.qv.turnoutLabel': 'Participation de la communauté',
  'mechanisms.qv.turnoutValue': '{pct} % sur {target} % requis',
  'mechanisms.qv.turnoutNote': 'Le vote se termine lorsque {target} % des membres ont participé.',
  'mechanisms.qv.regionOther': 'Autre',
  'mechanisms.qv.expertReviewed': 'examiné par un expert',
```

- [ ] **Step 3: Add the same 16 keys to `src/i18n/sw.ts`** (flat dotted keys, same style):

```ts
  'mechanisms.qv.statusOpen': 'Upigaji kura uko wazi · suluhu {n}',
  'mechanisms.qv.statusVoted': 'Umepiga kura',
  'mechanisms.qv.votedSub': 'Matokeo ya moja kwa moja hapa chini · kura haiwezi kubadilishwa',
  'mechanisms.qv.guide': 'Gusa ♥ kuunga mkono unachojali — kueneza mioyo yako kwenye suluhu nyingi kunagharimu kidogo kuliko kuirundika kwenye moja.',
  'mechanisms.qv.supportUsedPct': 'Asilimia {pct} ya uungaji mkono wako imetumika',
  'mechanisms.qv.solutionN': 'Suluhu {i} kati ya {n}',
  'mechanisms.qv.commitsLabel': 'Inachojitolea ({n})',
  'mechanisms.qv.metricsLabel': 'Jinsi tutakavyojua inafanya kazi ({n})',
  'mechanisms.qv.commitsMetrics': 'Ahadi na vipimo',
  'mechanisms.qv.yourVote': 'Kura yako',
  'mechanisms.qv.leading': 'inaongoza',
  'mechanisms.qv.turnoutLabel': 'Ushiriki wa jamii',
  'mechanisms.qv.turnoutValue': 'Asilimia {pct} kati ya {target} zinazohitajika',
  'mechanisms.qv.turnoutNote': 'Upigaji kura unakamilika wakati asilimia {target} ya wanachama wameshiriki.',
  'mechanisms.qv.regionOther': 'Nyingine',
  'mechanisms.qv.expertReviewed': 'imekaguliwa na mtaalam',
```

- [ ] **Step 4: Run the key-parity check (flat dotted keys)**

Run:
```bash
cd "$(git rev-parse --show-toplevel)"
diff <(grep -oE "'[a-zA-Z0-9_.]+':" src/i18n/fr.ts | sort -u) \
     <(grep -oE "'[a-zA-Z0-9_.]+':" src/i18n/sw.ts | sort -u)
```
Expected: **empty** (every key in fr exists in sw and vice-versa). If non-empty, it lists keys present in only one file — fix until empty. Then spot-check the new keys exist in both:
```bash
for k in statusOpen statusVoted votedSub guide supportUsedPct solutionN commitsLabel metricsLabel commitsMetrics yourVote leading turnoutLabel turnoutValue turnoutNote regionOther expertReviewed; do
  f=$(grep -c "'mechanisms.qv.$k'" src/i18n/fr.ts); s=$(grep -c "'mechanisms.qv.$k'" src/i18n/sw.ts);
  echo "$k fr=$f sw=$s";
done
```
Expected: every key shows `fr=1 sw=1`.

- [ ] **Step 5: Verify the build is clean**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Append the new keys to `docs/i18n-native-review-candidates.md`**

Add a dated section listing the 16 new `mechanisms.qv.*` keys with their English source strings, for native fr/sw review. (Region names stay English and are NOT i18n keys — note that.)

- [ ] **Step 7: Commit**

```bash
git add src/i18n/fr.ts src/i18n/sw.ts docs/i18n-native-review-candidates.md
git commit -m "i18n(vote): fr+sw parity for redesigned QV card strings

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Document the region system + vote-card pattern

**Files:**
- Modify: `DESIGN_SYSTEM.md`

**Interfaces:**
- Consumes: nothing (docs).
- Produces: a documented "Region colours" token set and a "Vote card" pattern entry.

- [ ] **Step 1: Add a "Region colours (vote results)" subsection to `DESIGN_SYSTEM.md`**

Document: the 6 regions + `other`, the `$region-*` SCSS tokens / `--region-*` CSS vars (light + dark), `src/utils/regions.ts` (`regionOf`, `regionColorVar`, `REGIONS`), the rule that the key is always shown so colour is never the only signal, and that region names stay English.

- [ ] **Step 2: Add a "Vote card (QVFlow)" pattern entry to `DESIGN_SYSTEM.md`**

Document: reads ballot mechanics from `qv` + the commitments/metrics spine from the `approval` contract (joined by id, reviewed-only with fallback); auto-switches votable ↔ hard-locked on `hasVoted` (non-empty `get_my_allocation`); hearts on top; collapsible commitment/metric cards; region results + key; slate community-turnout footer (75%).

- [ ] **Step 3: Commit**

```bash
git add DESIGN_SYSTEM.md
git commit -m "docs(design-system): region colours + vote-card pattern

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review (completed during planning)

**Spec coverage:**
- §2.1 spine carry → Task 4 (second `useFlowContract` + join). ✓
- §2.2 reviewed-only + fallback → Task 4 (`reviewedList`/`ballot`). ✓
- §2.3 hard-lock once cast → Task 4 (`hasVoted`). ✓
- §2.4 no toggle / auto-switch → Task 4 (single conditional render). ✓
- §2.5 turnout 75% slate at bottom → Task 4 (`turnoutFooter`, `.fillTurnout`). ✓
- §2.6 hearts keep & polish → Task 4 (Heart icons + quadratic logic retained). ✓
- §2.7 6 regions + key + tokens → Task 1 + Task 4 (`regionKey`, `regbar`). ✓
- §2.8 identity/scope/SDG → Task 3 (scope) + Task 4 (`UserIdentity`); SDG already threaded. ✓
- §6 demo seed + DEMO_VERSION → Task 2 (+ Task 4a votable check). ✓
- §7 i18n parity → Task 5. ✓
- §8 files → all covered. ✓
- §9 a11y → constraints + Task 4 markup (roles, focus, 44px). ✓

**Placeholder scan:** none — every code step shows full content; the only conditional step (Task 4a) is gated on an explicit preview observation with concrete fix instructions.

**Type consistency:** `RegionId`/`REGIONS`/`regionOf`/`regionColorVar` defined in Task 1 and used identically in Task 4; `communityMemberCount?: number` defined in Task 3 (`VoteEngageProps`, `VoteStageProps`) and consumed as `QVFlowProps.communityMemberCount` in Task 4; `BallotSolution` fields (`commitments`/`metrics`/`reviewed`) consistent throughout Task 4.

**Execution order:** run Task 4 (QVFlow, which declares the optional `communityMemberCount?` prop) **before** Task 3 (which wires the callers to pass it). Full order: 1 → 2 → 4 → 3 → 4a → 5 → 6. Every task then builds clean with no transient errors. (Task 4's preview shows turnout at 0% until Task 3 wires the member count; the populated-turnout check lands in Task 3/4a.)
