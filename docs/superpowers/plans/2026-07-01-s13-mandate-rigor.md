# S13 — P4 Mandate Rigor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the published mandate institutionally credible — every indicator carries a target + baseline + measurement cadence (gated behind a host/expert "Prepare for ratification" step), the artifact states its turnout denominator (X of N eligible) and a static Sybil-resistance statement, and org endorsements are marked claimed vs verified.

**Architecture:** Stub-layer only, behind `src/services/api.ts`. A new `mandate_ratification` JSON property on the **initiative** contract (new `set_property`/`get_properties` methods mirroring `community.ts`) stores per-indicator target/baseline/cadence. `useMandate` reads it back and merges by label, computes ratified-vs-pending from indicator completeness, and threads turnout (X voters from `getAllocations`, N eligible from the community member slice). `MandateDocument`/`MandateCard`/`AdoptionFramework` render the new rigor; `buildSpec` reflects it in `mandate.spec.json`. A host/expert-gated panel on `MandatePage` is the one new authoring surface.

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules. No test framework — verify via `npm run build` (`tsc -b`) + `preview_*` at 360px light+dark.

## Global Constraints

- Branch `ui`, keep runnable. All reads/writes via `src/services/api.ts` (`contractRead`/`contractWrite`); never call a real server from a component.
- The demo seam emits **no `contract_write` events** → **re-fetch after every write** (ratification panel + useMandate refresh).
- Do NOT reopen the S12 spine method names (`add_proposal`/`add_expert_review`/`proposal_id`). Ratification data is a NEW additive initiative property.
- Reuse `getInitiativeRoles(serverUrl, publicKey, initiativeId)` for the host/expert gate (as `SolutionsBoard`). Reuse the vote-stage turnout denominator (`activeMemberCount`); don't invent a second.
- Verification statement is **static, platform-level, honest** — must match the existing copy at `IdentityTrust.tsx:61` (web of trust; QR vouching; **no ID papers, no face scan**) and `VoteExplainer` / `CommunitySettings` (one person, one vote; no one can buy more).
- **Tokens only** (`$stage-*`/`--region-*`/kit vars). 360px flagship; verify **light + dark**; AA contrast; reduced-motion token-pure; **single `<h1>` per route**; landmark/skip-link intact; live-region/disclosure screen-reader announced.
- New/changed strings at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`, flat dotted keys). English is inline via `t('key','English')` — **do NOT add keys to `en.ts`**. New fr/sw strings → append to `docs/i18n-native-review-candidates.md`.
- **DEMO_VERSION** bump `global-v15 → global-v16` (fixtures change).
- `npm run build` clean before every commit.

---

## File Structure

- `src/services/demo/fixtures/mandate.ts` — MODIFY: extend `MandateIndicator` (`baseline?`,`cadence?`), `MandateProvenance` (`eligible`,`voters`), `MandateAdopter` (`verified`); populate flagship fixture; add `MandateRatification` type + `isMandateRatified` helper.
- `src/services/demo/demoContracts/initiative.ts` — MODIFY: add `properties` bag + `set_property`/`get_properties` methods (mirror `community.ts`).
- `src/services/mandateRatification.ts` — CREATE: `getRatification`/`saveRatification` seam API over the `mandate_ratification` property.
- `src/hooks/useMandate.ts` — MODIFY: read ratification + allocations, merge indicators by label, compute status, thread turnout; new `communityId` + `refreshToken` params; expose `refetch`.
- `src/components/mandate/MandateDocument.tsx` — MODIFY: render baseline/cadence, turnout line, static verification block, pending-ratification affordance; `buildSpec` gains `indicators[].baseline/cadence`, `provenance.turnout`, `provenance.verification`, `adoption.{claimed,verified}`.
- `src/components/mandate/MandateDocument.module.scss` — MODIFY: styles for the above (token-pure).
- `src/components/mandate/MandateCard.tsx` — MODIFY: pending-ratification eyebrow state.
- `src/components/mandate/MandateCard.module.scss` — MODIFY: pending badge style.
- `src/components/mandate/RatificationPanel.tsx` — CREATE: host/expert-gated "Prepare for ratification" panel.
- `src/components/mandate/RatificationPanel.module.scss` — CREATE.
- `src/components/mandate/AdoptionFramework.tsx` — MODIFY: verified badge on adopter cards.
- `src/components/mandate/AdoptionFramework.module.scss` — MODIFY: verified badge style (if needed beyond `Badge`).
- `src/components/mandate/MandatePage.tsx` — MODIFY: thread `communityId`, mount `RatificationPanel`, wire refresh.
- `src/i18n/fr.ts`, `src/i18n/sw.ts` — MODIFY: new keys, parity.
- `src/services/demo/mockApi.ts:17` — MODIFY: `global-v15` → `global-v16`.
- `docs/i18n-native-review-candidates.md` — MODIFY: append new keys.

---

### Task 1: Data model + fixture + DEMO_VERSION bump

**Files:**
- Modify: `src/services/demo/fixtures/mandate.ts`
- Modify: `src/services/demo/mockApi.ts:17`

**Interfaces:**
- Produces:
  - `interface MandateIndicator { label: string; target: string; baseline?: string; cadence?: string }`
  - `interface MandateProvenance { …existing; eligible: number; voters: number }`
  - `interface MandateAdopter { …existing; verified: boolean }`
  - `interface MandateRatification { indicators: Record<string, { target: string; baseline: string; cadence: string }> }`
  - `function isMandateRatified(indicators: MandateIndicator[]): boolean` — true iff every indicator has non-empty `target` && `baseline` && `cadence`.

- [ ] **Step 1: Extend `MandateIndicator`** (`src/services/demo/fixtures/mandate.ts`, replace the interface at lines 42-46):

```ts
/** A measurable success indicator ("how we'll know it's working"). */
export interface MandateIndicator {
  label: string;
  /** The value we're aiming for, e.g. "500 by end of 2028". */
  target: string;
  /** Where we start from today, e.g. "About 40 communities funded in 2025". */
  baseline?: string;
  /** How often it's measured & reported, e.g. "Quarterly". */
  cadence?: string;
}
```

- [ ] **Step 2: Add `verified` to `MandateAdopter`** (after the `since` field, before the closing brace of the interface at ~line 68):

```ts
  /** Human "since" label, e.g. "Apr 2026". */
  since: string;
  /**
   * Claimed vs verified: `true` only when the adoption has been confirmed
   * (stub = seeded data; FOR OURI: a real attestation). Viewer-added
   * endorsements are always `false` (claimed).
   */
  verified: boolean;
```

- [ ] **Step 3: Extend `MandateProvenance`** (replace the interface at lines 70-79):

```ts
/** Where the mandate's legitimacy comes from — shown as a provenance strip. */
export interface MandateProvenance {
  participants: number;
  countries: number;
  deliberationMonths: number;
  /** Text of the proposal that won the vote. */
  voteWinner: string;
  /** People who backed the mandate with conviction staking. */
  convictionBackers: number;
  /** Turnout denominator N — eligible voters (community member count). */
  eligible: number;
  /** Turnout numerator X — members who cast a vote (allocated). */
  voters: number;
}
```

- [ ] **Step 4: Add the ratification type + helper** (after the `PublishedMandate` interface, ~line 101):

```ts
/**
 * Host/expert-entered ratification data, keyed by indicator label. Stored as a
 * JSON `mandate_ratification` property on the initiative contract and merged
 * onto the derived indicators by label (see `useMandate`).
 * FOR OURI: a real mandate/ratification contract.
 */
export interface MandateRatification {
  indicators: Record<string, { target: string; baseline: string; cadence: string }>;
}

/** A mandate is ratified only when every indicator carries target + baseline + cadence. */
export function isMandateRatified(indicators: MandateIndicator[]): boolean {
  return indicators.length > 0 && indicators.every(
    (i) => !!i.target?.trim() && !!i.baseline?.trim() && !!i.cadence?.trim(),
  );
}
```

- [ ] **Step 5: Populate flagship fixture indicators with baseline + cadence** (replace the `indicators` array at lines 148-153):

```ts
  indicators: [
    {
      label: 'Frontline communities funded',
      target: '500 by end of 2028',
      baseline: 'About 40 communities funded in 2025',
      cadence: 'Reported quarterly',
    },
    {
      label: 'Funds reaching local control',
      target: '≥ 70% of every grant',
      baseline: 'Roughly 45% under current national-only channels',
      cadence: 'Reported per grant, reviewed annually',
    },
    {
      label: 'Projects with open progress reporting',
      target: '100%',
      baseline: '30% of comparable projects report publicly today',
      cadence: 'Continuous public dashboard',
    },
    {
      label: 'Application to first disbursement',
      target: 'Under 90 days',
      baseline: 'Typically 8–14 months through existing funds',
      cadence: 'Reported quarterly',
    },
  ],
```

- [ ] **Step 6: Add `eligible` + `voters` to the flagship provenance** (replace lines 154-160):

```ts
  provenance: {
    participants: 1240,
    countries: 18,
    deliberationMonths: 12,
    voteWinner: 'A community-governed adaptation fund frontline towns can apply to directly',
    convictionBackers: 760,
    eligible: 1400,
    voters: 1085,
  },
```

- [ ] **Step 7: Seed `verified` on every fixture adopter** — add `verified: true` to `adopt-gra`, `adopt-bd-dm`, `adopt-pif` (the three high-credibility subscribers) and `verified: false` to `adopt-mercycorps`, `adopt-c40`, `adopt-undrr` (claimed). Add the field to each of the six adopter objects (lines 161-213), e.g. for the first:

```ts
    {
      id: 'adopt-gra',
      name: 'Global Resilience Alliance',
      type: 'youth-network',
      level: 'subscribed',
      progress: 0.32,
      progressNote: 'First 40 community projects funded across 9 countries.',
      since: '2026-04',
      verified: true,
    },
```

Repeat: `adopt-bd-dm` → `verified: true`, `adopt-pif` → `verified: true`, `adopt-mercycorps` → `verified: false`, `adopt-c40` → `verified: false`, `adopt-undrr` → `verified: false`.

- [ ] **Step 8: Bump DEMO_VERSION** (`src/services/demo/mockApi.ts:17`):

```ts
const DEMO_VERSION = 'global-v16';
```

- [ ] **Step 9: Build**

Run: `npm run build`
Expected: clean (0 TS errors). Existing renders ignore the new optional/added fields; `addEndorsement` in `MandatePage.demo.ts` will now fail type-check because `MandateAdopter.verified` is required — **fix it in the same step**: in `src/components/mandate/MandatePage.demo.ts`, add `verified: false,` to the `adopter` object built in `addEndorsement` (viewer additions are claimed).

- [ ] **Step 10: Commit**

```bash
git add src/services/demo/fixtures/mandate.ts src/services/demo/mockApi.ts src/components/mandate/MandatePage.demo.ts
git commit -m "feat(s13): mandate rigor data model — indicator baseline/cadence, turnout denominator, verified adopters (P4)"
```

---

### Task 2: Ratification storage seam (initiative contract + API)

**Files:**
- Modify: `src/services/demo/demoContracts/initiative.ts`
- Create: `src/services/mandateRatification.ts`

**Interfaces:**
- Consumes: `MandateRatification` (Task 1).
- Produces:
  - Initiative contract methods `set_property { key, value }` (write) and `get_properties {}` (read → `Record<string,unknown>`).
  - `async function getRatification(serverUrl, publicKey, initiativeId): Promise<MandateRatification | null>`
  - `async function saveRatification(serverUrl, publicKey, initiativeId, data: MandateRatification): Promise<void>`
  - `const RATIFICATION_KEY = 'mandate_ratification'`

- [ ] **Step 1: Add a `properties` bag to `InitiativeState`** (`src/services/demo/demoContracts/initiative.ts`) — add to the interface (after `steps`, ~line 26) and to `defaultState()` (after `steps: []`, ~line 39):

```ts
// in interface InitiativeState:
  steps: unknown[];
  properties: Record<string, unknown>;
```
```ts
// in defaultState():
    steps: [],
    properties: {},
```

- [ ] **Step 2: Add `get_properties` to `initiativeRead`** (in the `switch` in `initiativeRead`, before `default:` ~line 94):

```ts
    case 'get_properties':
      return s.properties;
```

- [ ] **Step 3: Add `set_property` to `initiativeWrite`** (in the `switch` in `initiativeWrite`, before `default:` ~line 206) — mirrors `community.ts`:

```ts
    case 'set_property': {
      const key = method.values?.key as string | undefined;
      const value = method.values?.value;
      if (!key) return { error: 'Invalid property key' };
      updateState<InitiativeState>(contractId, (s) => ({
        ...s,
        properties: { ...s.properties, [key]: value },
      }));
      return null;
    }
```

- [ ] **Step 4: Create the seam API** (`src/services/mandateRatification.ts`):

```ts
// Mandate ratification seam. Stores host/expert-entered indicator
// target/baseline/cadence as a single JSON property on the initiative contract
// (mirrors the write-together `wtdraft_` property pattern, but on the
// initiative rather than the community). FOR OURI: a real ratification contract.
import { contractRead, contractWrite } from './api';
import type { IMethod } from './interfaces';
import type { MandateRatification } from './demo/fixtures/mandate';

export const RATIFICATION_KEY = 'mandate_ratification';

/** Read the stored ratification data for an initiative, or null if none. */
export async function getRatification(
  serverUrl: string, publicKey: string, initiativeId: string,
): Promise<MandateRatification | null> {
  try {
    const raw = await contractRead({
      serverUrl, publicKey, contractId: initiativeId,
      method: { name: 'get_properties', values: {} } as IMethod,
    });
    const props = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const stored = props[RATIFICATION_KEY];
    if (typeof stored !== 'string') return null;
    const parsed = JSON.parse(stored) as MandateRatification;
    return parsed && typeof parsed === 'object' && parsed.indicators ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist ratification data (full replace — the panel always writes the whole map). */
export async function saveRatification(
  serverUrl: string, publicKey: string, initiativeId: string, data: MandateRatification,
): Promise<void> {
  await contractWrite({
    serverUrl, publicKey, contractId: initiativeId,
    method: { name: 'set_property', values: { key: RATIFICATION_KEY, value: JSON.stringify(data) } } as IMethod,
  });
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: clean. `mandateRatification.ts` is not imported yet (unused module is fine for `tsc -b`).

- [ ] **Step 6: Commit**

```bash
git add src/services/demo/demoContracts/initiative.ts src/services/mandateRatification.ts
git commit -m "feat(s13): initiative-contract property seam + mandate ratification API (P4)"
```

---

### Task 3: `useMandate` — merge ratification, compute status, thread turnout

**Files:**
- Modify: `src/hooks/useMandate.ts`

**Interfaces:**
- Consumes: `getRatification` (Task 2); `isMandateRatified`, `MandateRatification` (Task 1); `qvApi.getAllocations` (existing); redux `communities.communityMembers`/`communityActiveMembers`.
- Produces: `function useMandate(initiativeId, communityId?, refreshToken?): { mandate: PublishedMandate }`. The derived mandate's `indicators` carry merged `target/baseline/cadence`; `status` is `'ratified'` iff `isMandateRatified`; `provenance.eligible`/`.voters` reflect live turnout.

- [ ] **Step 1: Broaden the hook signature + imports** (`src/hooks/useMandate.ts`). Update imports (lines 1-12) to add allocations, ratification, the helper, and member fetch:

```ts
import { useEffect, useMemo, useState } from 'react';
import { useFlowContract } from '../components/collaboration/flows/shared/useFlowContract';
import * as qvApi from '../components/collaboration/flows/voting/qvApi';
import * as approvalApi from '../components/collaboration/flows/voting/approvalApi';
import { getRatification } from '../services/mandateRatification';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../store/slices/communitiesSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  MANDATES_BY_KEY,
  DEFAULT_MANDATE_KEY,
  isMandateRatified,
  type PublishedMandate,
  type MandateArticle,
  type MandateIndicator,
  type MandateRatification,
} from '../services/demo/fixtures/mandate';
```

- [ ] **Step 2: Update the signature + add member/allocation/ratification state** (replace lines 34-52):

```ts
export function useMandate(
  initiativeId: string | undefined,
  communityId?: string,
  refreshToken: number = 0,
): UseMandateResult {
  const fixture = MANDATES_BY_KEY[initiativeId ?? ''] ?? MANDATES_BY_KEY[DEFAULT_MANDATE_KEY];

  const parent = initiativeId ?? '';
  const { contractId: voteContractId, isReady: voteReady } = useFlowContract(
    parent, 'quadratic_vote', 'qv_contract.py', '', parent, 'voteContractId',
  );
  const { contractId: proposalsContractId, isReady: proposalsReady } = useFlowContract(
    `${parent}_proposals`, 'approval_voting', 'approval_contract.py', '', parent, 'proposalsContractId',
  );

  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityActiveMembers = useAppSelector((s) => s.communities.communityActiveMembers);

  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [proposals, setProposals] = useState<Record<string, ApprovalProposal> | null>(null);
  const [voters, setVoters] = useState<number | null>(null);
  const [ratification, setRatification] = useState<MandateRatification | null>(null);
```

- [ ] **Step 3: Fetch community members for the eligible denominator** — add a new effect after the existing reset effect (~after line 60):

```ts
  // Eligible denominator N — mirror MandateActivityCard: fetch the community's
  // member + active-member counts so turnout reads "X of N".
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (!communityMembers[communityId]) {
      dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    }
    if (communityActiveMembers[communityId] === undefined) {
      dispatch(fetchCommunityActiveMembers({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [serverUrl, publicKey, communityId, communityMembers, communityActiveMembers, dispatch]);
```

- [ ] **Step 4: Clear voters + ratification on initiative change** (extend the existing reset effect at lines 57-60):

```ts
  useEffect(() => {
    setResults(null);
    setProposals(null);
    setVoters(null);
    setRatification(null);
  }, [initiativeId]);
```

- [ ] **Step 5: Read allocations (X) + ratification alongside results/proposals** (replace the fetch effect at lines 62-80):

```ts
  useEffect(() => {
    let cancelled = false;
    if (!initiativeId || !serverUrl || !publicKey) return;
    if (!voteReady || !voteContractId || !proposalsReady || !proposalsContractId) return;
    (async () => {
      try {
        const [r, p, allocs, ratif] = await Promise.all([
          qvApi.getResults(serverUrl, publicKey, voteContractId),
          approvalApi.getProposals(serverUrl, publicKey, proposalsContractId),
          qvApi.getAllocations(serverUrl, publicKey, voteContractId),
          getRatification(serverUrl, publicKey, initiativeId),
        ]);
        if (cancelled) return;
        setResults((r as Record<string, number>) || {});
        setProposals((p as Record<string, ApprovalProposal>) || {});
        setVoters(Object.keys((allocs as Record<string, unknown>) || {}).length);
        setRatification(ratif);
      } catch {
        if (!cancelled) { setResults({}); setProposals({}); setVoters(0); setRatification(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [initiativeId, serverUrl, publicKey, voteReady, voteContractId, proposalsReady, proposalsContractId, refreshToken]);
```

- [ ] **Step 6: Merge ratification + turnout in the memo** (replace the `useMemo` at lines 82-99):

```ts
  const eligible = communityId
    ? (communityActiveMembers[communityId]
        ?? (Array.isArray(communityMembers[communityId]) ? communityMembers[communityId].length : 0))
    : 0;

  const mandate = useMemo<PublishedMandate>(() => {
    if (!results || !proposals) return fixture;
    const winnerId = Object.entries(results).sort((a, b) => b[1] - a[1])[0]?.[0];
    const winner = winnerId ? proposals[winnerId] : undefined;
    const commitments = winner?.commitments ?? [];
    if (commitments.length === 0) return fixture; // graceful fallback — no spine
    const articles: MandateArticle[] = commitments.map((body, i) => ({ id: `art-${i + 1}`, title: '', body }));
    const metrics = (winner?.expertReviews ?? []).flatMap((rv) => rv.metrics);
    // Merge host/expert-entered target/baseline/cadence onto each derived
    // indicator by label; unfilled indicators keep empty strings (pending).
    const indicators: MandateIndicator[] = metrics.length
      ? metrics.map((label) => {
          const r = ratification?.indicators[label];
          return { label, target: r?.target ?? '', baseline: r?.baseline ?? '', cadence: r?.cadence ?? '' };
        })
      : fixture.indicators;
    // Turnout: prefer live counts, fall back to the fixture's seeded numbers so
    // the flagship still reads sensibly before member/allocation reads land.
    const liveEligible = eligible > 0 ? eligible : fixture.provenance.eligible;
    const liveVoters = voters ?? fixture.provenance.voters;
    return {
      ...fixture,
      status: isMandateRatified(indicators) ? 'ratified' : 'published',
      articles,
      indicators,
      provenance: {
        ...fixture.provenance,
        voteWinner: winner?.text || fixture.provenance.voteWinner,
        eligible: liveEligible,
        voters: liveVoters,
      },
    };
  }, [results, proposals, ratification, voters, eligible, fixture]);

  return { mandate };
}
```

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useMandate.ts
git commit -m "feat(s13): useMandate merges ratification, computes status, threads turnout (P4)"
```

---

### Task 4: MandatePage — thread communityId, mount RatificationPanel plumbing

**Files:**
- Modify: `src/components/mandate/MandatePage.tsx`

> The panel component itself is built in Task 6; this task wires `useMandate`'s new params + the refresh token so Task 6 can drop in cleanly. Keeping the wiring here isolates the hook-signature change from the panel UI.

**Interfaces:**
- Consumes: `useMandate(mandateId, communityId, refreshToken)` (Task 3).
- Produces: `refreshToken` state + `bumpRatification` callback passed to the panel in Task 6.

- [ ] **Step 1: Thread communityId + refresh token** (`src/components/mandate/MandatePage.tsx`, replace lines 20-23):

```ts
const MandatePage: React.FC = () => {
  const navigate = useNavigate();
  const { communityId, mandateId } = useParams<{ communityId: string; mandateId: string }>();
  const [ratifyToken, setRatifyToken] = React.useState(0);
  const { mandate } = useMandate(mandateId, communityId, ratifyToken);
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: clean (`setRatifyToken` unused for now triggers `noUnusedLocals` — if the build errors on it, add a temporary `void setRatifyToken;` line right after; Task 6 removes it. Verify by reading the error; if no error, skip).

- [ ] **Step 3: Commit**

```bash
git add src/components/mandate/MandatePage.tsx
git commit -m "feat(s13): thread communityId + ratify refresh token into MandatePage (P4)"
```

---

### Task 5: MandateDocument — indicators rigor, turnout, verification, buildSpec, pending affordance

**Files:**
- Modify: `src/components/mandate/MandateDocument.tsx`
- Modify: `src/components/mandate/MandateDocument.module.scss`

**Interfaces:**
- Consumes: `PublishedMandate` with new fields (Task 1); `isMandateRatified` for the status pill.
- Produces: `buildSpec` output with `indicators[].baseline/cadence`, `provenance.turnout {voters, eligible, pct}`, `provenance.verification` (string), `adoption.{claimed, verified}`.

- [ ] **Step 1: Extend `buildSpec`** (`MandateDocument.tsx`, replace the function body at lines 18-40). Add a `t`-independent verification string constant near the top of the file (module scope, above `buildSpec`) so both spec + render share one source of truth — but the RENDERED copy is i18n'd (Step 4); the spec string is English by design (machine-readable):

```ts
/** Static, honest platform-level Sybil-resistance statement (English in the spec;
 *  the on-screen copy is i18n'd — see mandate.verification.* keys). Mirrors the
 *  web-of-trust / one-person-one-vote copy in IdentityTrust + VoteExplainer. */
const VERIFICATION_STATEMENT =
  'One person, one vote. Gloki keeps the electorate real through a community web of trust — ' +
  'members vouch for one another in person by scanning QR codes. No ID papers, no biometrics, ' +
  'no face scans are collected, and no one can buy extra influence.';

function turnoutPct(voters: number, eligible: number): number {
  return eligible > 0 ? Math.round((voters / eligible) * 100) : 0;
}

/** The structured, machine-readable projection of the mandate. */
function buildSpec(mandate: PublishedMandate) {
  return {
    id: mandate.id,
    title: mandate.title,
    version: mandate.specVersion,
    status: mandate.status,
    ratified_on: mandate.ratifiedOn,
    jurisdictions: mandate.countries,
    articles: mandate.articles.map((a) => ({ id: a.id, title: a.title, commitment: a.body })),
    indicators: mandate.indicators.map((i) => ({
      metric: i.label,
      target: i.target,
      baseline: i.baseline ?? '',
      cadence: i.cadence ?? '',
    })),
    provenance: {
      participants: mandate.provenance.participants,
      countries: mandate.provenance.countries,
      deliberation_months: mandate.provenance.deliberationMonths,
      vote_winner: mandate.provenance.voteWinner,
      conviction_backers: mandate.provenance.convictionBackers,
      turnout: {
        voters: mandate.provenance.voters,
        eligible: mandate.provenance.eligible,
        percent: turnoutPct(mandate.provenance.voters, mandate.provenance.eligible),
      },
      verification: VERIFICATION_STATEMENT,
    },
    adoption: {
      endorsements: mandate.adopters.filter((a) => a.level === 'endorsed').length,
      subscriptions: mandate.adopters.filter((a) => a.level === 'subscribed').length,
      claimed: mandate.adopters.filter((a) => !a.verified).length,
      verified: mandate.adopters.filter((a) => a.verified).length,
    },
  };
}
```

- [ ] **Step 2: Import the status helper + ShieldCheck icon** (`MandateDocument.tsx`, update imports at lines 1-6):

```ts
import React, { useMemo, useState } from 'react';
import { FileText, Code2, Copy, Check, Globe, Users, TrendingUp, CalendarCheck, ShieldCheck, Vote } from 'lucide-react';
import { Badge, CountryPresence, SegmentedControl } from '../shared';
import { useI18n } from '../../i18n';
import type { PublishedMandate } from '../../services/demo/fixtures/mandate';
import styles from './MandateDocument.module.scss';
```

- [ ] **Step 3: Swap the fixed "Ratified" pill for a status-aware pill** (replace lines 76-84, the `metaRow` block):

```tsx
        <div className={styles.metaRow}>
          {mandate.status === 'ratified' ? (
            <Badge tone="success" size="sm">{t('mandate.statusRatified', 'Ratified')}</Badge>
          ) : (
            <Badge tone="warning" size="sm">{t('mandate.statusPending', 'Pending ratification')}</Badge>
          )}
          <span className={styles.ratified}>
            <CalendarCheck size={14} aria-hidden />
            {t('mandate.ratifiedOn', 'Ratified {date}', { date: ratified })}
          </span>
        </div>
```

- [ ] **Step 4: Add the turnout stat + verification block** — insert into the `legitimacy` list a turnout `<li>`, and after the `</ul>` (line 119) add a verification section. Replace lines 103-119 with:

```tsx
      <ul className={styles.legitimacy} aria-label={t('mandate.legitimacyLabel', 'How this mandate was earned')}>
        <li className={styles.stat}>
          <Users size={16} aria-hidden className={styles.statIcon} />
          <span className={styles.statValue}>{mandate.provenance.participants}</span>
          <span className={styles.statLabel}>{t('mandate.statParticipants', 'participants')}</span>
        </li>
        <li className={styles.stat}>
          <Globe size={16} aria-hidden className={styles.statIcon} />
          <span className={styles.statValue}>{mandate.provenance.countries}</span>
          <span className={styles.statLabel}>{t('mandate.statCountries', 'countries')}</span>
        </li>
        <li className={styles.stat}>
          <TrendingUp size={16} aria-hidden className={styles.statIcon} />
          <span className={styles.statValue}>{mandate.provenance.convictionBackers}</span>
          <span className={styles.statLabel}>{t('mandate.statBackers', 'conviction backers')}</span>
        </li>
      </ul>

      <div className={styles.turnout}>
        <Vote size={16} aria-hidden className={styles.turnoutIcon} />
        <p className={styles.turnoutText}>
          {t('mandate.turnoutLine', '{voters} of {eligible} eligible members voted ({pct}%)', {
            voters: mandate.provenance.voters.toLocaleString(),
            eligible: mandate.provenance.eligible.toLocaleString(),
            pct: turnoutPct(mandate.provenance.voters, mandate.provenance.eligible),
          })}
        </p>
      </div>

      <section className={styles.verification} aria-labelledby="mandate-verification">
        <h3 id="mandate-verification" className={styles.verificationTitle}>
          <ShieldCheck size={15} aria-hidden /> {t('mandate.verification.title', 'How we keep the vote real')}
        </h3>
        <p className={styles.verificationBody}>
          {t(
            'mandate.verification.body',
            'One person, one vote. Gloki keeps the electorate real through a community web of trust — members vouch for one another in person by scanning QR codes. No ID papers, no biometrics, no face scans are collected, and no one can buy extra influence.',
          )}
        </p>
      </section>
```

- [ ] **Step 5: Render baseline + cadence under each indicator** (replace the indicators `<dl>` block at lines 162-171):

```tsx
            <dl className={styles.indicators}>
              {mandate.indicators.map((ind) => (
                <div key={ind.label} className={styles.indicator}>
                  <dt className={styles.indicatorLabel}>{ind.label}</dt>
                  {/* Always emit the <dd> (empty when there's no target) so every
                      <dt> has its required pair and the <dl> stays well-formed. */}
                  <dd className={styles.indicatorTarget}>
                    {ind.target || t('mandate.indicatorPending', 'Target not yet set')}
                    {(ind.baseline || ind.cadence) && (
                      <span className={styles.indicatorMeta}>
                        {ind.baseline && (
                          <span className={styles.indicatorMetaItem}>
                            {t('mandate.indicatorBaseline', 'From {baseline}', { baseline: ind.baseline })}
                          </span>
                        )}
                        {ind.cadence && (
                          <span className={styles.indicatorMetaItem}>
                            {t('mandate.indicatorCadence', 'Measured {cadence}', { cadence: ind.cadence })}
                          </span>
                        )}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
```

- [ ] **Step 6: Add styles** (`MandateDocument.module.scss`) — append token-pure rules. Read the file first to match its variable conventions (spacing/typography tokens); add:

```scss
.turnout {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  margin-top: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);
}
.turnoutIcon { color: var(--color-text-secondary); flex: none; }
.turnoutText { margin: 0; font-size: var(--font-size-sm); color: var(--color-text-secondary); }

.verification {
  margin-top: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);
}
.verificationTitle {
  display: flex; align-items: center; gap: var(--space-1);
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text);
}
.verificationBody { margin: 0; font-size: var(--font-size-sm); line-height: 1.5; color: var(--color-text-secondary); }

.indicatorMeta { display: flex; flex-direction: column; gap: 2px; margin-top: 2px; }
.indicatorMetaItem { font-size: var(--font-size-xs); color: var(--color-text-tertiary); }
```

> NOTE: exact token names (`--space-*`, `--color-*`, `--font-size-*`, `--radius-*`) MUST match this file's existing usage — read `MandateDocument.module.scss` and reuse whatever it already references (e.g. it may use `$space-3` SCSS vars, not CSS custom props). Align to the file, don't introduce new token spellings.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 8: Preview verify** — start `gloki-dev`, open a mandate page (`/mandate/<communityId>/<initiativeId>`), confirm at 360px light + dark: turnout line reads "X of N eligible members voted (Y%)", verification block shows the honest copy, indicators show baseline/cadence, spec view JSON includes `turnout`, `verification`, `indicators[].baseline/cadence`, `adoption.claimed/verified`. (Flagship fallback path — should be fully ratified.)

- [ ] **Step 9: Commit**

```bash
git add src/components/mandate/MandateDocument.tsx src/components/mandate/MandateDocument.module.scss
git commit -m "feat(s13): mandate document — indicator baseline/cadence, turnout, Sybil statement, spec block (P4)"
```

---

### Task 6: RatificationPanel — the host/expert-gated authoring surface

**Files:**
- Create: `src/components/mandate/RatificationPanel.tsx`
- Create: `src/components/mandate/RatificationPanel.module.scss`
- Modify: `src/components/mandate/MandatePage.tsx`

**Interfaces:**
- Consumes: `getInitiativeRoles`, `isAuthorOrCoAuthor` (`src/services/initiativeRoles.ts`); `getRatification`/`saveRatification` (Task 2); `MandateRatification`, `PublishedMandate` (Task 1); the `bumpRatification` + `mandate` from MandatePage (Task 4).
- Produces: `<RatificationPanel initiativeId mandate onSaved />` — renders only for host/coauthor/expert; edits each indicator's target/baseline/cadence; saves and calls `onSaved()`.

- [ ] **Step 1: Build the panel** (`src/components/mandate/RatificationPanel.tsx`):

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Button, Banner } from '../shared';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { getInitiativeRoles, isAuthorOrCoAuthor } from '../../services/initiativeRoles';
import { getRatification, saveRatification } from '../../services/mandateRatification';
import { isMandateRatified, type PublishedMandate, type MandateRatification } from '../../services/demo/fixtures/mandate';
import styles from './RatificationPanel.module.scss';

interface RatificationPanelProps {
  /** The initiative contract id (== route :mandateId). */
  initiativeId: string;
  /** The resolved mandate — its indicators seed the editable rows. */
  mandate: PublishedMandate;
  /** Called after a successful save so the page can re-derive the mandate. */
  onSaved: () => void;
}

type Row = { label: string; target: string; baseline: string; cadence: string };

/**
 * P4 — "Prepare for ratification". Host/expert-only. Lists each of the
 * mandate's indicators and lets the initiative's host, co-authors or endorsed
 * experts enter the target, today's baseline, and the measurement cadence that
 * make the mandate ratifiable. Writes one JSON property on the initiative
 * contract; the demo seam emits no write events, so the parent re-fetches.
 */
const RatificationPanel: React.FC<RatificationPanelProps> = ({ initiativeId, mandate, onSaved }) => {
  const { t } = useI18n();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [canEdit, setCanEdit] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);

  // Gate: host, co-author, or endorsed expert of this initiative.
  useEffect(() => {
    let cancelled = false;
    if (!serverUrl || !publicKey || !initiativeId) return;
    getInitiativeRoles(serverUrl, publicKey, initiativeId).then((roles) => {
      if (cancelled) return;
      const allowed = isAuthorOrCoAuthor(roles, publicKey) || roles.experts.includes(publicKey);
      setCanEdit(allowed);
    });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, initiativeId]);

  // Seed editable rows from the mandate's indicators (already merged with any
  // stored ratification data by useMandate).
  useEffect(() => {
    setRows(mandate.indicators.map((i) => ({
      label: i.label,
      target: i.target ?? '',
      baseline: i.baseline ?? '',
      cadence: i.cadence ?? '',
    })));
  }, [mandate.indicators]);

  const allComplete = useMemo(
    () => isMandateRatified(rows.map((r) => ({ label: r.label, target: r.target, baseline: r.baseline, cadence: r.cadence }))),
    [rows],
  );

  if (!canEdit || rows.length === 0) return null;

  const update = (idx: number, field: keyof Omit<Row, 'label'>, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    setSavedAt(false);
  };

  const handleSave = async () => {
    if (!serverUrl || !publicKey) return;
    setSaving(true);
    try {
      const data: MandateRatification = {
        indicators: Object.fromEntries(
          rows.map((r) => [r.label, { target: r.target.trim(), baseline: r.baseline.trim(), cadence: r.cadence.trim() }]),
        ),
      };
      await saveRatification(serverUrl, publicKey, initiativeId, data);
      // Re-read to confirm the write landed (no contract_write events in demo).
      await getRatification(serverUrl, publicKey, initiativeId);
      setSavedAt(true);
      onSaved();
    } catch {
      /* leave the form intact so the host can retry */
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="ratify-heading">
      <header className={styles.head}>
        <ClipboardCheck size={18} aria-hidden className={styles.headIcon} />
        <h2 id="ratify-heading" className={styles.heading}>
          {t('mandate.ratify.title', 'Prepare for ratification')}
        </h2>
      </header>
      <p className={styles.intro}>
        {t('mandate.ratify.intro', 'As a host or expert, set each indicator’s target, today’s baseline, and how often it’s measured. A mandate is only marked ratified once every indicator is complete.')}
      </p>

      <ul className={styles.rows}>
        {rows.map((r, idx) => (
          <li key={r.label} className={styles.row}>
            <span className={styles.rowLabel}>{r.label}</span>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('mandate.ratify.target', 'Target')}</span>
              <input
                className={styles.input} type="text" value={r.target} maxLength={120}
                placeholder={t('mandate.ratify.targetPlaceholder', 'e.g. 500 communities by 2028')}
                onChange={(e) => update(idx, 'target', e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('mandate.ratify.baseline', 'Baseline today')}</span>
              <input
                className={styles.input} type="text" value={r.baseline} maxLength={120}
                placeholder={t('mandate.ratify.baselinePlaceholder', 'e.g. About 40 today')}
                onChange={(e) => update(idx, 'baseline', e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('mandate.ratify.cadence', 'Measured')}</span>
              <input
                className={styles.input} type="text" value={r.cadence} maxLength={80}
                placeholder={t('mandate.ratify.cadencePlaceholder', 'e.g. Quarterly')}
                onChange={(e) => update(idx, 'cadence', e.target.value)}
              />
            </label>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <p className={styles.status}>
          {allComplete
            ? t('mandate.ratify.ready', 'All indicators complete — this mandate reads as ratified.')
            : t('mandate.ratify.incomplete', 'Fill every field to ratify. Partial entries are saved as pending.')}
        </p>
        <Button
          variant="primary" size="sm" onClick={handleSave} disabled={saving}
          leftIcon={saving ? <Loader2 size={16} className={styles.spin} aria-hidden /> : <ClipboardCheck size={16} aria-hidden />}
        >
          {saving ? t('mandate.ratify.saving', 'Saving…') : t('mandate.ratify.save', 'Save ratification details')}
        </Button>
      </div>

      {savedAt && (
        <Banner tone="success" className={styles.saved}>
          {t('mandate.ratify.saved', 'Saved. The published mandate has been updated.')}
        </Banner>
      )}
      <span className={styles.srStatus} role="status" aria-live="polite">
        {savedAt ? t('mandate.ratify.saved', 'Saved. The published mandate has been updated.') : ''}
      </span>
    </section>
  );
};

export default RatificationPanel;
```

- [ ] **Step 2: Styles** (`src/components/mandate/RatificationPanel.module.scss`) — token-pure; match the token spelling used by a sibling module (read `AdoptionFramework.module.scss` first and reuse its variable convention):

```scss
.panel {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.head { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
.headIcon { color: var(--color-primary); flex: none; }
.heading { margin: 0; font-size: var(--font-size-lg); font-weight: 600; }
.intro { margin: 0 0 var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-3); }
.row {
  display: flex; flex-direction: column; gap: var(--space-2);
  padding: var(--space-3); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); background: var(--color-surface-subtle);
}
.rowLabel { font-weight: 600; font-size: var(--font-size-sm); }
.field { display: flex; flex-direction: column; gap: 4px; }
.fieldLabel { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
.input {
  width: 100%; padding: var(--space-2); font-size: var(--font-size-sm);
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-surface); color: var(--color-text);
}
.input:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
.footer { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-3); }
.status { margin: 0; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.saved { margin-top: var(--space-2); }
.srStatus { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.spin { animation: spin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 3: Mount the panel in MandatePage** (`MandatePage.tsx`). Add the import at the top, remove any temporary `void setRatifyToken`, and render the panel above the document. Replace the JSX block (lines 42-48) with:

```tsx
          <div className={styles.page}>
            <MandateCard mandate={mandate} communityId={communityId ?? ''} mandateId={mandateId ?? ''} onShowSupport={onShowSupport} onViewFull={onViewFull} />
            {mandateId && (
              <RatificationPanel
                initiativeId={mandateId}
                mandate={mandate}
                onSaved={() => setRatifyToken((n) => n + 1)}
              />
            )}
            <div id={MANDATE_DOC_ANCHOR_ID} className={styles.docAnchor}>
              <MandateDocument mandate={mandate} />
            </div>
            <AdoptionFramework mandateId={mandate.id} />
          </div>
```

And add to imports (after the MandateDocument import, line 5):

```tsx
import RatificationPanel from './RatificationPanel';
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 5: Preview verify** — the panel is host/expert-gated. For a seeded persona who is the initiative host/expert, confirm at 360px light+dark: the panel renders, editing a field + Save persists, the document's status pill flips to Ratified when all fields complete (partial → Pending ratification), and a non-host viewer sees no panel. Where preview automation can't set the host identity, verify by code-correctness reasoning against `getInitiativeRoles` (author fallback via `get_details`) and note it in the session log.

- [ ] **Step 6: Commit**

```bash
git add src/components/mandate/RatificationPanel.tsx src/components/mandate/RatificationPanel.module.scss src/components/mandate/MandatePage.tsx
git commit -m "feat(s13): host/expert Prepare-for-ratification panel + MandatePage wiring (P4)"
```

---

### Task 7: MandateCard pending affordance + AdoptionFramework verified badge

**Files:**
- Modify: `src/components/mandate/MandateCard.tsx`
- Modify: `src/components/mandate/MandateCard.module.scss`
- Modify: `src/components/mandate/AdoptionFramework.tsx`

**Interfaces:**
- Consumes: `mandate.status` (Task 3); `adopter.verified` (Task 1).

- [ ] **Step 1: MandateCard — pending eyebrow** (`MandateCard.tsx`, replace the eyebrow block at lines 86-89):

```tsx
      <div className={styles.eyebrow}>
        <ShieldCheck size={15} aria-hidden className={styles.eyebrowIcon} />
        <span className={styles.brand}>{t('mandate.card.brand', 'Gloki Mandate')}</span>
        {mandate.status !== 'ratified' && (
          <span className={styles.pending}>{t('mandate.statusPending', 'Pending ratification')}</span>
        )}
      </div>
```

- [ ] **Step 2: MandateCard styles** (`MandateCard.module.scss`) — append (match the file's token convention):

```scss
.pending {
  margin-left: auto;
  padding: 2px var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-warning-text, var(--color-text));
  background: var(--color-warning-subtle, var(--color-surface-subtle));
  border-radius: var(--radius-sm);
}
```

> Verify `--color-warning-*` tokens exist; if not, use the existing warning tokens the codebase uses for `Badge tone="warning"`. Read the file + a warning usage first.

- [ ] **Step 3: AdoptionFramework — verified badge** (`AdoptionFramework.tsx`, in `AdopterCard`, replace the `badges` block at lines 186-195):

```tsx
        <div className={styles.badges}>
          {isViewer && (
            <Badge tone="primary" size="sm">
              {t('mandate.you', 'You')}
            </Badge>
          )}
          {adopter.verified ? (
            <Badge tone="success" size="sm" icon={<ShieldCheck size={12} aria-hidden />}>
              {t('mandate.verifiedAdopter', 'Verified')}
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm">
              {t('mandate.claimedAdopter', 'Claimed')}
            </Badge>
          )}
          <Badge tone={isSubscribed ? 'success' : 'info'} size="sm">
            {isSubscribed ? t('mandate.subscribed', 'Subscribed') : t('mandate.endorsed', 'Endorsed')}
          </Badge>
        </div>
```

Add `ShieldCheck` to the lucide import at line 2:

```tsx
import { HeartHandshake, Globe, Plus, ShieldCheck } from 'lucide-react';
```

> VERIFY the shared `Badge` supports an `icon` prop and a `neutral` tone. Read `src/components/shared/Badge.tsx` first. If `icon` is unsupported, place `<ShieldCheck>` inline before the label text inside the Badge children. If `neutral` is unsupported, use the tone the codebase uses for muted badges (e.g. `info` or a `default`). Align to the actual Badge API.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 5: Preview verify** — at 360px light+dark: verified adopters (GRA, Bangladesh MDM, Pacific Islands Forum) show a "Verified" shield badge; claimed adopters (Mercy Corps, C40, UNDRR) show a muted "Claimed" badge; a viewer-added org appears as "Claimed".

- [ ] **Step 6: Commit**

```bash
git add src/components/mandate/MandateCard.tsx src/components/mandate/MandateCard.module.scss src/components/mandate/AdoptionFramework.tsx
git commit -m "feat(s13): pending-ratification affordance on card + claimed/verified adopter badges (P4)"
```

---

### Task 8: i18n parity + native-review doc + final verification

**Files:**
- Modify: `src/i18n/fr.ts`
- Modify: `src/i18n/sw.ts`
- Modify: `docs/i18n-native-review-candidates.md`

**Interfaces:**
- Consumes: every new `t('mandate.*', …)` key introduced in Tasks 5-7.

- [ ] **Step 1: Enumerate the new keys** — the full set added this session:

```
mandate.statusPending
mandate.turnoutLine
mandate.verification.title
mandate.verification.body
mandate.indicatorPending
mandate.indicatorBaseline
mandate.indicatorCadence
mandate.verifiedAdopter
mandate.claimedAdopter
mandate.ratify.title
mandate.ratify.intro
mandate.ratify.target
mandate.ratify.targetPlaceholder
mandate.ratify.baseline
mandate.ratify.baselinePlaceholder
mandate.ratify.cadence
mandate.ratify.cadencePlaceholder
mandate.ratify.ready
mandate.ratify.incomplete
mandate.ratify.save
mandate.ratify.saving
mandate.ratify.saved
```

- [ ] **Step 2: Add French translations** — append to `src/i18n/fr.ts` (flat dotted keys, in the mandate group; match interpolation placeholders exactly — `{voters}`,`{eligible}`,`{pct}`,`{baseline}`,`{cadence}`):

```ts
  'mandate.statusPending': 'Ratification en attente',
  'mandate.turnoutLine': '{voters} membres sur {eligible} ont voté ({pct} %)',
  'mandate.verification.title': 'Comment nous garantissons un vote authentique',
  'mandate.verification.body': 'Une personne, une voix. Gloki maintient un corps électoral réel grâce à une toile de confiance communautaire : les membres se portent garants les uns des autres en personne en scannant des codes QR. Aucun papier d’identité, aucune donnée biométrique, aucun scan du visage n’est collecté, et personne ne peut acheter d’influence supplémentaire.',
  'mandate.indicatorPending': 'Cible non encore définie',
  'mandate.indicatorBaseline': 'À partir de {baseline}',
  'mandate.indicatorCadence': 'Mesuré {cadence}',
  'mandate.verifiedAdopter': 'Vérifié',
  'mandate.claimedAdopter': 'Déclaré',
  'mandate.ratify.title': 'Préparer la ratification',
  'mandate.ratify.intro': 'En tant qu’hôte ou expert, définissez pour chaque indicateur sa cible, son point de départ actuel et sa fréquence de mesure. Un mandat n’est marqué comme ratifié qu’une fois chaque indicateur complété.',
  'mandate.ratify.target': 'Cible',
  'mandate.ratify.targetPlaceholder': 'p. ex. 500 communautés d’ici 2028',
  'mandate.ratify.baseline': 'Point de départ actuel',
  'mandate.ratify.baselinePlaceholder': 'p. ex. environ 40 aujourd’hui',
  'mandate.ratify.cadence': 'Mesuré',
  'mandate.ratify.cadencePlaceholder': 'p. ex. chaque trimestre',
  'mandate.ratify.ready': 'Tous les indicateurs sont complétés — ce mandat est considéré comme ratifié.',
  'mandate.ratify.incomplete': 'Remplissez chaque champ pour ratifier. Les entrées partielles sont enregistrées comme en attente.',
  'mandate.ratify.save': 'Enregistrer les détails de ratification',
  'mandate.ratify.saving': 'Enregistrement…',
  'mandate.ratify.saved': 'Enregistré. Le mandat publié a été mis à jour.',
```

- [ ] **Step 3: Add Swahili translations** — append to `src/i18n/sw.ts`:

```ts
  'mandate.statusPending': 'Inasubiri kuidhinishwa',
  'mandate.turnoutLine': 'Wanachama {voters} kati ya {eligible} walipiga kura ({pct}%)',
  'mandate.verification.title': 'Jinsi tunavyohakikisha kura ni halisi',
  'mandate.verification.body': 'Mtu mmoja, kura moja. Gloki huweka wapiga kura kuwa halisi kupitia mtandao wa kuaminiana wa jamii — wanachama huthibitishana ana kwa ana kwa kuchanganua misimbo ya QR. Hakuna vitambulisho, hakuna alama za kibiolojia, hakuna uchunguzi wa uso unaokusanywa, na hakuna anayeweza kununua ushawishi zaidi.',
  'mandate.indicatorPending': 'Lengo bado halijawekwa',
  'mandate.indicatorBaseline': 'Kutoka {baseline}',
  'mandate.indicatorCadence': 'Hupimwa {cadence}',
  'mandate.verifiedAdopter': 'Imethibitishwa',
  'mandate.claimedAdopter': 'Imedaiwa',
  'mandate.ratify.title': 'Jiandae kuidhinisha',
  'mandate.ratify.intro': 'Ukiwa mwenyeji au mtaalamu, weka lengo la kila kiashiria, hali ya sasa, na mara ngapi kinapimwa. Agizo huwekwa alama ya kuidhinishwa tu pale kila kiashiria kinapokamilika.',
  'mandate.ratify.target': 'Lengo',
  'mandate.ratify.targetPlaceholder': 'mf. jamii 500 ifikapo 2028',
  'mandate.ratify.baseline': 'Hali ya sasa',
  'mandate.ratify.baselinePlaceholder': 'mf. takriban 40 leo',
  'mandate.ratify.cadence': 'Hupimwa',
  'mandate.ratify.cadencePlaceholder': 'mf. kila robo mwaka',
  'mandate.ratify.ready': 'Viashiria vyote vimekamilika — agizo hili linasomeka kama limeidhinishwa.',
  'mandate.ratify.incomplete': 'Jaza kila sehemu ili kuidhinisha. Maingizo yasiyokamilika huhifadhiwa kama yanayosubiri.',
  'mandate.ratify.save': 'Hifadhi maelezo ya uidhinishaji',
  'mandate.ratify.saving': 'Inahifadhi…',
  'mandate.ratify.saved': 'Imehifadhiwa. Agizo lililochapishwa limesasishwa.',
```

- [ ] **Step 4: Parity check** — verify fr and sw have identical key sets:

```bash
cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
diff <(grep -oE "^\s*'[^']+':" src/i18n/fr.ts | tr -d " ':" | sort) \
     <(grep -oE "^\s*'[^']+':" src/i18n/sw.ts | tr -d " ':" | sort)
```
Expected: empty output (identical key sets).

- [ ] **Step 5: Code-ref ↔ i18n cross-check** — every `t('mandate.*')` key used in code exists in fr.ts:

```bash
cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
for k in $(grep -rhoE "t\('mandate\.[a-zA-Z.]+'" src/components/mandate src/hooks | sed -E "s/t\('//; s/'//"); do
  grep -q "'$k'" src/i18n/fr.ts || echo "MISSING in fr.ts: $k"
done
```
Expected: no MISSING lines.

- [ ] **Step 6: Append to the native-review doc** (`docs/i18n-native-review-candidates.md`) — add an S13 section listing the 22 new keys (from Step 1) with their English source strings, flagged for native fr/sw review (mirror the existing section format in that file — read it first).

- [ ] **Step 7: Final build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 8: Full preview sweep** — `gloki-dev`, 360px light + dark: mandate page renders turnout + verification + baseline/cadence in fr and sw (switch via LanguageSwitcher); verified/claimed badges localized; ratification panel labels localized; single `<h1>` on the route (MandateCard's `<h1>`); no console errors.

- [ ] **Step 9: Commit**

```bash
git add src/i18n/fr.ts src/i18n/sw.ts docs/i18n-native-review-candidates.md
git commit -m "feat(s13): fr/sw parity for mandate-rigor strings + native-review candidates (P4)"
```

---

## Post-plan: whole-branch review + push

- [ ] Run the **Opus whole-branch review** (`superpowers:requesting-code-review` against `origin/ui`), triage findings, fix Crit/Important.
- [ ] Confirm with Eston whether to run the local multi-model panel (cloud reviewers likely down; local RAM-gated). Do NOT pass `--free-ram`/`--quit-chrome`.
- [ ] **Confirm push to `origin/ui` with Eston** before pushing. PR #20's ✗ vs `main` is expected divergence.
- [ ] Update project memory (`project_session13_mandate_rigor_jul2026`), MASTER_TODO §7 (mark P4 done) + §8 changelog.
- [ ] Clean the S13 ledger (`.superpowers/sdd/s13-*`) — own namespace only.

---

## Self-Review

**Spec coverage:**
- Decision 1 (indicator target/baseline/cadence + ratification gate): Task 1 (fields), Task 2 (seam), Task 3 (merge + status), Task 6 (panel). ✅
- Decision 2 (turnout denominator N=member count, X=voters): Task 1 (fields + seed), Task 3 (live wiring), Task 5 (render + spec). ✅
- Decision 3 (static Sybil statement, i18n, on every mandate + spec): Task 5 (render + `buildSpec.provenance.verification`), Task 8 (fr/sw). ✅
- Decision 4 (claimed-vs-verified endorsements): Task 1 (`verified` field + seed mix), Task 7 (badge), Task 5 (`buildSpec.adoption.{claimed,verified}`). ✅
- DEMO_VERSION bump: Task 1. ✅  fr/sw parity + native-review doc: Task 8. ✅

**Placeholder scan:** No TBD/TODO; every code step carries complete code. SCSS token names flagged for alignment-to-file (explicit instruction, not a placeholder).

**Type consistency:** `MandateIndicator.baseline/cadence` optional strings used consistently; `isMandateRatified(MandateIndicator[])` signature matches call sites (Task 3 memo, Task 6 panel); `MandateRatification.indicators` shape identical in fixture type (Task 1), seam API (Task 2), useMandate merge (Task 3), panel save (Task 6); `useMandate(initiativeId, communityId?, refreshToken?)` matches the single caller (Task 4). `verified` required on `MandateAdopter` with all construction sites updated (fixture Task 1 step 7, `addEndorsement` Task 1 step 9).

**Open risk flagged for execution:** shared `Badge` `icon`/`neutral` API and exact CSS token spellings are verify-then-align at execution time (Tasks 5-7 notes) — read the target file before writing styles/props.
