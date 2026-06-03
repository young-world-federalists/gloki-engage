# Web-of-Trust Verification & Per-Stage Permissions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Gloki's web of trust visible (verified / vouched / unverified) and let communities set who may participate at each pipeline stage, enforced with friendly non-dead-end gates — all mocked through the `src/services/` seam, voting always one-person-one-vote.

**Architecture:** A dependency-free `trustModel.ts` holds the constants + pure predicates; `trust.ts` adds seam wrappers; `useCommunityTrust` exposes it to components. The community demo contract serves the persona vouch graph + per-stage permission blob. A `TrustBadge` shows state everywhere; a `CommunitySettings` page sets rules; a `StageGate` wrapper enforces them around the shared lane-owned stage flows.

**Tech Stack:** React 19 + TypeScript + Redux Toolkit + SCSS Modules + Vite. Verify with `npx tsc -b`, `npm run build`, and the Claude Preview MCP (light/dark/360px). No unit-test framework — this is a UI-only mock branch.

**Spec:** [docs/superpowers/specs/2026-06-03-web-of-trust-permissions-design.md](../specs/2026-06-03-web-of-trust-permissions-design.md)

**Conventions (non-negotiable):**
- Seam only: components never call a server; new mock data lives in `src/services/demo/`.
- Tokens only (DESIGN_SYSTEM.md): no ad-hoc hex/px/rgba; derived `rgba($token, a)` OK.
- All strings via `t('ns.key', 'English default')`.
- Every interactive control: hover/active/focus-visible/disabled/dark; ≥44px targets; AA contrast; never colour alone.
- Commit locally per commit-group; **never push**.

---

## File structure

**New:**
| File | Responsibility |
|------|----------------|
| `src/services/trustModel.ts` | Pure model: types, thresholds, `DEFAULT_STAGE_PERMISSIONS`, `resolveTrustState`, `canParticipate`. **Zero imports** (so the demo contract can import it without a cycle). |
| `src/services/trust.ts` | Seam wrappers (`getCommunityVouches`, `getStagePermissions`, `setStagePermissions`) + `addUserVouch`; re-exports the model. |
| `src/hooks/useCommunityTrust.ts` | Hook: resolves trust + rules for a community through the seam; reactive to the agent store. |
| `src/components/shared/TrustBadge.tsx` + `.module.scss` | Icon+label badge for a trust state. |
| `src/components/community/CommunitySettings.tsx` + `.module.scss` | Admin page: per-stage rule picker. |
| `src/components/community/StageGate.tsx` + `.module.scss` | Wrapper that gates a stage flow with a friendly blocked state. |

**Modified:**
| File | Change |
|------|--------|
| `src/services/demo/fixtures/identity.ts` | Add vouch graph (`getVouchGraph`); `defaultVouchers` seeds 2. |
| `src/services/demo/demoContracts/community.ts` | `get_vouches`, `get_stage_permissions`, `set_stage_permissions`. |
| `src/services/demo/mockApi.ts` | `DEMO_VERSION` → `global-v3`. |
| `src/components/shared/index.ts` | Export `TrustBadge`. |
| `src/components/community/Members.tsx` | Member-row `TrustBadge`. |
| `src/pages/StageFeedView.tsx` | Author `TrustBadge`; `StageGate` per card; fix stale copy. |
| `src/pages/HomeView.tsx` | Author `TrustBadge` (real cards only). |
| `src/components/community/CommunityHome.tsx` | Author `TrustBadge`. |
| `src/components/community/IdentityTrust.tsx` | "Your verification" panel + meet-a-member vouch action. |
| `src/components/community/dialogs/QRScannerDialog.tsx` | Successful member scan → `addUserVouch`. |
| `src/components/collaboration/InitiativeDashboard.tsx` | `StageGate` around active-stage flow. |
| `src/pages/CommunityView.tsx` | Settings menu item + route. |
| `src/i18n/*` | New keys (English defaults inline; add to locale files if a registry exists). |

---

## COMMIT GROUP A — V1: web-of-trust made visible

### Task 1: Pure trust model (`trustModel.ts`)

**Files:** Create `src/services/trustModel.ts`

- [ ] **Step 1: Write the module (complete)**

```ts
// The web-of-trust model — pure, dependency-free so any layer (incl. the demo
// contract) can import it without an import cycle. Confirmed with Eston 2026-06-03:
// Verified = vouched by >= 4 community members; onboarding seeds 2 (pending).
//
// ONE PERSON, ONE VOTE: permission rules gate ELIGIBILITY to act, never the
// WEIGHT of a vote. An eligible member's vote always counts exactly the same as
// any other eligible member's. Never make participation plutocratic.

export type TrustState = 'verified' | 'vouched' | 'unverified';
export type StageRule = 'anyone' | 'members' | 'verified';
export type PipelineStage = 'problem' | 'discussion' | 'proposals' | 'vote' | 'mandate';

export const VERIFIED_THRESHOLD = 4;
export const ONBOARDING_SEED = 2;

export const PIPELINE_STAGES: PipelineStage[] = ['problem', 'discussion', 'proposals', 'vote', 'mandate'];
export const STAGE_RULES: StageRule[] = ['anyone', 'members', 'verified'];

export const DEFAULT_STAGE_PERMISSIONS: Record<PipelineStage, StageRule> = {
  problem: 'members',
  discussion: 'members',
  proposals: 'members',
  vote: 'verified',
  mandate: 'verified',
};

/** Vouch count -> trust state. */
export function resolveTrustState(vouchCount: number): TrustState {
  if (vouchCount >= VERIFIED_THRESHOLD) return 'verified';
  if (vouchCount >= 1) return 'vouched';
  return 'unverified';
}

/** Whether the current user may ACT at a stage (not whether they may view it). */
export function canParticipate(rule: StageRule, trust: TrustState, isMember: boolean): boolean {
  if (rule === 'anyone') return true;
  if (rule === 'members') return isMember;
  return isMember && trust === 'verified'; // rule === 'verified'
}
```

- [ ] **Step 2: Verify** — `npx tsc -b` → expect clean (file compiles, exports resolve).

---

### Task 2: Vouch graph in fixtures (`identity.ts`)

**Files:** Modify `src/services/demo/fixtures/identity.ts`

- [ ] **Step 1: Add the vouch graph** (append after `DEFAULT_INVITE_VOUCHER`/`getVoucher`, before `ONBOARDING_LANGUAGES`)

```ts
// ── Web-of-trust vouch graph (demo) ──────────────────────────────────────────
// Maps a member to the members who vouch for them. Hand-tuned counts so the
// Members list shows all three trust states on first load: most Verified (>=4),
// a few Vouched (1-3), one Unverified (0). Deterministic (uses `pick`).
const VOUCH_COUNTS: Record<string, number> = {
  'demo-user-in-priya': 6, 'demo-user-br-lucas': 5, 'demo-user-ng-amina': 4,
  'demo-user-cn-mei': 5, 'demo-user-it-sofia': 4, 'demo-user-gh-kwame': 4,
  'demo-user-jp-yuki': 7, 'demo-user-de-anika': 5, 'demo-user-mx-diego': 4,
  'demo-user-eg-fatima': 3, 'demo-user-kr-jiwoo': 2, 'demo-user-pk-aisha': 4,
  'demo-user-za-thabo': 4, 'demo-user-pl-marta': 1, 'demo-user-id-putri': 5,
  'demo-user-ph-maria': 0,
};

function seedFromKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) & 0x7fffffff;
  return h || 1;
}

/**
 * Build the vouch graph for a given member set (members vouch for members).
 * Caller passes the community's member keys so vouchers are always members.
 */
export function getVouchGraph(memberKeys: string[]): Record<string, string[]> {
  const memberSet = new Set(memberKeys);
  const graph: Record<string, string[]> = {};
  for (const p of PERSONAS) {
    if (!memberSet.has(p.publicKey)) continue;
    const count = VOUCH_COUNTS[p.publicKey] ?? 0;
    const others = PERSONAS.filter((o) => o.publicKey !== p.publicKey && memberSet.has(o.publicKey));
    graph[p.publicKey] = pick(others, count, seedFromKey(p.publicKey)).map((o) => o.publicKey);
  }
  return graph;
}
```

- [ ] **Step 2: Seed onboarding at 2** — change `defaultVouchers`:

```ts
/** Seed "vouched by 2": the inviter plus one other community member (pending). */
export function defaultVouchers(inviterKey: string): string[] {
  const other = PERSONAS.find((p) => p.publicKey !== inviterKey);
  return other ? [inviterKey, other.publicKey] : [inviterKey];
}
```

- [ ] **Step 3: Verify** — `npx tsc -b` clean.

---

### Task 3: Community contract handlers (`community.ts`) + version bump

**Files:** Modify `src/services/demo/demoContracts/community.ts`, `src/services/demo/mockApi.ts`

- [ ] **Step 1: Imports + state field.** Add to the top import from fixtures, and extend `CommunityState`:

```ts
import { getPersona, getVouchGraph } from '../fixtures/identity';
import { DEFAULT_STAGE_PERMISSIONS, type StageRule } from '../../trustModel';
```
In `interface CommunityState` add:
```ts
  stage_permissions: Record<string, StageRule>;
```
In `defaultState()` add `stage_permissions: {}` to the returned object.

- [ ] **Step 2: Read handlers.** In `communityRead`'s `switch`, add before `default`:

```ts
    case 'get_vouches':
      return getVouchGraph(Object.keys(state.members));
    case 'get_stage_permissions':
      return { ...DEFAULT_STAGE_PERMISSIONS, ...state.stage_permissions };
```

- [ ] **Step 3: Write handler.** In `communityWrite`'s `switch`, add before `default`:

```ts
    case 'set_stage_permissions': {
      const permissions = method.values?.permissions as Record<string, StageRule> | undefined;
      if (!permissions) return null;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.stage_permissions = { ...next.stage_permissions, ...permissions };
        return next;
      });
      return true;
    }
```

- [ ] **Step 4: Bump demo version.** In `mockApi.ts`: `const DEMO_VERSION = 'global-v3';`

- [ ] **Step 5: Verify** — `npx tsc -b` clean. (No cycle: `community.ts`→`trustModel.ts`, which imports nothing.)

---

### Task 4: `useCommunityTrust` hook + `trust.ts` seam wrappers

**Files:** Create `src/services/trust.ts`, `src/hooks/useCommunityTrust.ts`

- [ ] **Step 1: `src/services/trust.ts` (complete)**

```ts
// Seam-facing trust helpers. Components import from here / the hook — never the
// raw vouch graph. Re-exports the pure model for convenience.
import { contractRead, contractWrite } from './api';
import type { IMethod } from './interfaces';
import { getAgent, saveAgent } from '../components/identity/agent/digitalAgentStore';
import {
  DEFAULT_STAGE_PERMISSIONS,
  type PipelineStage,
  type StageRule,
} from './trustModel';

export * from './trustModel';

interface Ctx { serverUrl: string; publicKey: string; communityId: string; }

export async function getCommunityVouches({ serverUrl, publicKey, communityId }: Ctx): Promise<Record<string, string[]>> {
  const res = await contractRead({ serverUrl, publicKey, contractId: communityId, method: { name: 'get_vouches', values: {} } as IMethod });
  return res && typeof res === 'object' ? (res as Record<string, string[]>) : {};
}

export async function getStagePermissions({ serverUrl, publicKey, communityId }: Ctx): Promise<Record<PipelineStage, StageRule>> {
  const res = await contractRead({ serverUrl, publicKey, contractId: communityId, method: { name: 'get_stage_permissions', values: {} } as IMethod });
  return { ...DEFAULT_STAGE_PERMISSIONS, ...(res && typeof res === 'object' ? (res as Record<string, StageRule>) : {}) };
}

export async function setStagePermissions(
  { serverUrl, publicKey, communityId }: Ctx,
  permissions: Record<PipelineStage, StageRule>,
): Promise<void> {
  await contractWrite({ serverUrl, publicKey, contractId: communityId, method: { name: 'set_stage_permissions', values: { permissions } } as IMethod });
}

/**
 * The current user's own vouches live in the Digital Agent store (localStorage,
 * reactive), extending the onboarding pattern. Dedup append. Used by the QR scan
 * and the "meet a member" demo action so a pending user can cross 2 -> 4.
 */
export function addUserVouch(voucherPk: string): void {
  const current = getAgent()?.vouchedBy ?? [];
  if (!voucherPk || current.includes(voucherPk)) return;
  saveAgent({ vouchedBy: [...current, voucherPk] });
}
```

- [ ] **Step 2: `src/hooks/useCommunityTrust.ts` (complete)**

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { useDigitalAgent } from '../components/identity/agent/useDigitalAgent';
import {
  getCommunityVouches,
  getStagePermissions,
  resolveTrustState,
  canParticipate,
  DEFAULT_STAGE_PERMISSIONS,
  type PipelineStage,
  type StageRule,
  type TrustState,
} from '../services/trust';

export interface CommunityTrust {
  trustOf: (publicKey: string) => TrustState;
  vouchCountOf: (publicKey: string) => number;
  isMember: (publicKey: string) => boolean;
  ruleFor: (stage: PipelineStage) => StageRule;
  /** Whether the CURRENT user may act at this stage. */
  canCurrentUserParticipate: (stage: PipelineStage) => boolean;
  currentUserTrust: TrustState;
  currentUserVouchCount: number;
  isReady: boolean;
}

/**
 * Resolve trust + per-stage rules for one community, all through the seam.
 * Persona vouches come from the community contract; the current user's own
 * vouches overlay from the Digital Agent store (reactive). Per-community by
 * design; in the demo every persona is a member of every community, so the
 * current user's count reads the same everywhere (documented simplification).
 */
export function useCommunityTrust(communityId: string | undefined): CommunityTrust {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const members = useAppSelector((s) => (communityId ? s.communities.communityMembers[communityId] : undefined));
  const { agent } = useDigitalAgent();

  const [vouches, setVouches] = useState<Record<string, string[]>>({});
  const [permissions, setPermissions] = useState<Record<PipelineStage, StageRule> | null>(null);

  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    let cancelled = false;
    getCommunityVouches({ serverUrl, publicKey, communityId }).then((v) => { if (!cancelled) setVouches(v); });
    getStagePermissions({ serverUrl, publicKey, communityId }).then((p) => { if (!cancelled) setPermissions(p); });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, communityId]);

  const memberSet = useMemo(() => new Set(Array.isArray(members) ? members : []), [members]);
  const currentUserVouchCount = useMemo(
    () => (agent?.vouchedBy ?? []).filter((v) => memberSet.has(v)).length,
    [agent, memberSet],
  );

  const vouchCountOf = useCallback(
    (pk: string) => (pk === publicKey ? currentUserVouchCount : (vouches[pk]?.length ?? 0)),
    [publicKey, currentUserVouchCount, vouches],
  );
  const trustOf = useCallback((pk: string) => resolveTrustState(vouchCountOf(pk)), [vouchCountOf]);
  const isMember = useCallback((pk: string) => memberSet.has(pk), [memberSet]);
  const ruleFor = useCallback(
    (stage: PipelineStage) => (permissions ?? DEFAULT_STAGE_PERMISSIONS)[stage],
    [permissions],
  );
  const canCurrentUserParticipate = useCallback(
    (stage: PipelineStage) => canParticipate(ruleFor(stage), trustOf(publicKey || ''), isMember(publicKey || '')),
    [ruleFor, trustOf, isMember, publicKey],
  );

  return {
    trustOf, vouchCountOf, isMember, ruleFor, canCurrentUserParticipate,
    currentUserTrust: trustOf(publicKey || ''),
    currentUserVouchCount,
    isReady: permissions !== null,
  };
}

export default useCommunityTrust;
```

- [ ] **Step 3: Verify** — `npx tsc -b` clean.

---

### Task 5: `TrustBadge` shared component

**Files:** Create `src/components/shared/TrustBadge.tsx` + `.module.scss`; modify `src/components/shared/index.ts`

- [ ] **Step 1: Read `Badge.module.scss`** to confirm how children lay out (gap handling), then write `TrustBadge.tsx`:

```tsx
import React from 'react';
import { ShieldCheck, Shield, ShieldOff } from 'lucide-react';
import Badge, { type BadgeTone } from './Badge';
import { useT } from '../../i18n';
import type { TrustState } from '../../services/trustModel';
import styles from './TrustBadge.module.scss';

const CONFIG: Record<TrustState, { tone: BadgeTone; Icon: typeof Shield }> = {
  verified: { tone: 'success', Icon: ShieldCheck },
  vouched: { tone: 'info', Icon: Shield },
  unverified: { tone: 'neutral', Icon: ShieldOff },
};

export interface TrustBadgeProps {
  state: TrustState;
  vouchCount?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Trust state as a Badge — icon AND text (never colour alone), AA, i18n. */
const TrustBadge: React.FC<TrustBadgeProps> = ({ state, vouchCount, size = 'sm', className }) => {
  const t = useT();
  const { tone, Icon } = CONFIG[state];
  const label =
    state === 'verified' ? t('trust.verified', 'Verified')
    : state === 'vouched' ? t('trust.vouched', 'Vouched by {count}', { count: vouchCount ?? 0 })
    : t('trust.unverified', 'Unverified');
  const aria =
    state === 'verified' ? t('trust.verified.aria', 'Verified member')
    : state === 'vouched' ? t('trust.vouched.aria', 'Vouched by {count} members', { count: vouchCount ?? 0 })
    : t('trust.unverified.aria', 'Unverified member');
  return (
    <Badge tone={tone} size={size} className={className}>
      <span className={styles.inner} aria-label={aria}>
        <Icon size={12} aria-hidden />
        <span>{label}</span>
      </span>
    </Badge>
  );
};

export default TrustBadge;
```

- [ ] **Step 2: `TrustBadge.module.scss`**

```scss
@use '../../styles/variables' as *;

.inner {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}
```

- [ ] **Step 3: Export** — add to `src/components/shared/index.ts`:

```ts
export { default as TrustBadge } from './TrustBadge';
export type { TrustBadgeProps } from './TrustBadge';
```

- [ ] **Step 4: Verify** — `npx tsc -b` clean.

---

### Task 6: Show `TrustBadge` on the Members list

**Files:** Modify `src/components/community/Members.tsx`

- [ ] **Step 1:** Thread trust into `MemberItem`. Import the hook + badge in `Members.tsx`; call `const trust = useCommunityTrust(communityId);` in the `Members` component; pass `state`/`count` to each `MemberItem` via new props `trustState?: TrustState; vouchCount?: number;`. In `MemberItem`'s `nameRow`, after `memberName`, render:

```tsx
{trustState && <TrustBadge state={trustState} vouchCount={vouchCount} size="sm" />}
```
Map per person in the `allPeople` build: `trustState: trust.trustOf(pk), vouchCount: trust.vouchCountOf(pk)` (and for task agents too).

- [ ] **Step 2: Verify** — `npx tsc -b` + `npm run build` clean. Preview `/community/:id/members`: badges render, mix of Verified/Vouched/Unverified, AA in light + dark, 360px no overflow. Screenshot.

---

### Task 7: Author `TrustBadge` on cards (feed / home / community home)

**Files:** Modify `src/pages/StageFeedView.tsx`, `src/pages/HomeView.tsx`, `src/components/community/CommunityHome.tsx`

- [ ] **Step 1: StageFeedView.** The feed is cross-community; resolve per card by `item.communityId`. Wrap the author chip render so it shows a small badge. Because a hook can't be called per map-iteration inline, extract the card body into a small `StageFeedCard` component (props: `item`, `stage`, handlers) that calls `useCommunityTrust(item.communityId)` and renders `{item.author && <TrustBadge state={trust.trustOf(item.author)} vouchCount={trust.vouchCountOf(item.author)} />}` beside `item.authorName`. (This refactor also hosts the StageGate in Task 12.)

- [ ] **Step 2: HomeView.** Real initiative cards carry `author` + `communityId` — thread both through the card map (lines ~82) and, in the same per-card component pattern, show the author `TrustBadge`. **Sample cards have no real author → no badge** (honours "never mix real + sample").

- [ ] **Step 3: CommunityHome.** Single community context — `const trust = useCommunityTrust(communityId)` once; render the author `TrustBadge` on each initiative row.

- [ ] **Step 4: Verify** — `tsc -b` + `build` clean. Preview `/`, `/stage/problem`, a community home: author badges present, no layout break at 360px, light + dark. Screenshot each.

---

### Task 8: "Your verification" panel in IdentityTrust

**Files:** Modify `src/components/community/IdentityTrust.tsx`

- [ ] **Step 1:** Add, above the existing `trustSection`, a "Your verification" `Card`: the current user's `TrustBadge`, a one-line status (`t('trust.progress', 'Vouched by {count} of {threshold} needed to verify', { count, threshold: VERIFIED_THRESHOLD })`), and a progress bar (reuse the design-system progress pattern: 8px, `$radius-full`, `$gray-100` track, `$primary` fill → `$success` at 100%). Use `const trust = useCommunityTrust(communityId);` for `currentUserVouchCount` / `currentUserTrust`. (The meet-a-member button is added in Task 14 with the vouch loop.)

- [ ] **Step 2: Verify** — `tsc -b` + `build` clean. Preview `/community/:id/identity`: panel shows "Vouched by 2 of 4", pending badge, AA, dark, 360px. Screenshot.

- [ ] **Step 3: Commit V1**

```bash
git add src/services/trustModel.ts src/services/trust.ts src/hooks/useCommunityTrust.ts \
  src/components/shared/TrustBadge.tsx src/components/shared/TrustBadge.module.scss \
  src/components/shared/index.ts src/services/demo/fixtures/identity.ts \
  src/services/demo/demoContracts/community.ts src/services/demo/mockApi.ts \
  src/components/community/Members.tsx src/pages/StageFeedView.tsx src/pages/HomeView.tsx \
  src/components/community/CommunityHome.tsx src/components/community/IdentityTrust.tsx src/i18n
git commit -m "feat(trust): web-of-trust verification made visible (V1)

TrustBadge (verified/vouched/unverified, icon+label) on Members, author chips
(feed/home/community home) and an IdentityTrust 'Your verification' panel.
Persona vouch graph served through the community contract; current-user vouches
overlay from the agent store via useCommunityTrust. Verified = >=4 vouches;
onboarding seeds 2. DEMO_VERSION -> global-v3.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## COMMIT GROUP B — V2: per-stage community permission settings

### Task 9: `CommunitySettings` page

**Files:** Create `src/components/community/CommunitySettings.tsx` + `.module.scss`

- [ ] **Step 1: Component (complete logic)**

```tsx
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Globe } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useT } from '../../i18n';
import { Banner, SegmentedControl, type SegmentOption } from '../shared';
import {
  getStagePermissions, setStagePermissions, DEFAULT_STAGE_PERMISSIONS,
  PIPELINE_STAGES, type PipelineStage, type StageRule,
} from '../../services/trust';
import styles from './CommunitySettings.module.scss';

const STAGE_LABEL: Record<PipelineStage, string> = {
  problem: 'Problem', discussion: 'Discussion', proposals: 'Proposals', vote: 'Vote', mandate: 'Mandate',
};

interface Props { communityId: string; }

const CommunitySettings: React.FC<Props> = ({ communityId }) => {
  const t = useT();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const [perms, setPerms] = useState<Record<PipelineStage, StageRule>>(DEFAULT_STAGE_PERMISSIONS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    let cancelled = false;
    getStagePermissions({ serverUrl, publicKey, communityId }).then((p) => {
      if (!cancelled) { setPerms(p); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, communityId]);

  const ruleOptions: SegmentOption<StageRule>[] = [
    { value: 'anyone', label: t('perm.anyone', 'Anyone'), icon: <Globe size={14} /> },
    { value: 'members', label: t('perm.members', 'Members'), icon: <Users size={14} /> },
    { value: 'verified', label: t('perm.verified', 'Verified'), icon: <ShieldCheck size={14} /> },
  ];

  const onChange = async (stage: PipelineStage, rule: StageRule) => {
    const prev = perms;
    const next = { ...perms, [stage]: rule };
    setPerms(next); setSaved(false);
    try {
      await setStagePermissions({ serverUrl, publicKey, communityId }, next);
      setSaved(true);
    } catch {
      setPerms(prev); // rollback (optimistic pattern)
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>{t('settings.title', 'Community settings')}</h2>
        <p>{t('settings.lead', 'Choose who can take part at each stage. Read-only viewing is always open.')}</p>
      </header>

      <Banner tone="info" title={t('settings.adminTitle', 'Admin settings')}>
        {t('settings.adminBody', 'These rules apply to everyone in this community. Voting is always one person, one vote — these settings decide who may take part, not how much a vote counts.')}
      </Banner>

      {!loading && PIPELINE_STAGES.map((stage) => (
        <section key={stage} className={styles.stageRow}>
          <div className={styles.stageLabel}>{t(`nav.${stage}`, STAGE_LABEL[stage])}</div>
          <SegmentedControl<StageRule>
            options={ruleOptions}
            value={perms[stage]}
            onChange={(rule) => onChange(stage, rule)}
            fullWidth
            ariaLabel={t('settings.ruleFor', 'Participation rule for {stage}', { stage: STAGE_LABEL[stage] })}
          />
        </section>
      ))}

      {saved && <p className={styles.saved} role="status">{t('settings.saved', 'Saved')}</p>}
    </div>
  );
};

export default CommunitySettings;
```

- [ ] **Step 2: SCSS** — `CommunitySettings.module.scss` (tokens only): `.container { padding: $spacing-lg; max-width: $content-max-width; margin: 0 auto; padding-bottom: $footer-height; }`; `.header h2 { font-size:$text-xl; font-weight:$font-semibold; }` + `p { color:$gray-500; font-size:$text-sm; }`; `.stageRow { margin-top:$spacing-lg; }`; `.stageLabel { font-size:$text-sm; font-weight:$font-medium; margin-bottom:$spacing-sm; }`; `.saved { color:$success; font-size:$text-xs; margin-top:$spacing-md; }`; dark-mode block overriding text colours to `$dark-text`/`$dark-text-secondary`. Verify exact token names against `variables.scss` while writing.

- [ ] **Step 3: Verify** — `tsc -b` clean.

### Task 10: Wire settings into the community menu + route

**Files:** Modify `src/pages/CommunityView.tsx`

- [ ] **Step 1:** Lazy import: `const CommunitySettings = lazy(() => import('../components/community/CommunitySettings'));`. Add `Settings` to the lucide import.

- [ ] **Step 2:** Add a menu item (after `identity`):
```ts
{ key: 'settings', icon: Settings, label: t('community.menu.settings', 'Settings'), onClick: closeAfter(() => navigate(`/community/${communityId}/settings`)) },
```

- [ ] **Step 3:** Add a route (next to the `identity` route):
```tsx
<Route path="settings" element={<CommunitySettings communityId={communityId!} />} />
```

- [ ] **Step 4: Verify** — `tsc -b` + `build` clean. Preview: open community menu → Settings → page loads, change Vote `members`→`verified`, reload route, persists. Light + dark + 360px (3 segments fit). Screenshot.

- [ ] **Step 5: Commit V2**
```bash
git add src/components/community/CommunitySettings.tsx src/components/community/CommunitySettings.module.scss src/pages/CommunityView.tsx src/i18n
git commit -m "feat(trust): per-stage community permission settings (V2)

Admin CommunitySettings page — a SegmentedControl per stage (Anyone/Members/
Verified), persisted through the community contract (set_stage_permissions) and
read back default-merged. Reached from the community SlideOutMenu. One-person-
one-vote reinforced in copy.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## COMMIT GROUP C — V3: enforce the gate (friendly, no dead ends)

### Task 11: `StageGate` wrapper

**Files:** Create `src/components/community/StageGate.tsx` + `.module.scss`

- [ ] **Step 1: Component (complete)**

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Button } from '../shared';
import { useT } from '../../i18n';
import { useCommunityTrust } from '../../hooks/useCommunityTrust';
import type { PipelineStage } from '../../services/trust';

interface Props {
  communityId: string;
  stage: PipelineStage;
  /** The participation flow to gate. Always-visible read-only content stays OUTSIDE this. */
  children: React.ReactNode;
}

/**
 * Renders the stage flow when the current user may act; otherwise a friendly,
 * non-dead-end blocked state explaining the rule and offering a path forward.
 * Read-only content (titles, tallies) lives outside this wrapper and stays visible.
 * The hook's canCurrentUserParticipate already encodes membership + trust, so the
 * gate only needs the rule + the user's vouch count to word the message.
 */
const StageGate: React.FC<Props> = ({ communityId, stage, children }) => {
  const t = useT();
  const navigate = useNavigate();
  const { canCurrentUserParticipate, ruleFor, currentUserVouchCount, isReady } = useCommunityTrust(communityId);

  // While loading, don't flash a block — show the flow (reads are harmless in the mock).
  if (!isReady || canCurrentUserParticipate(stage)) return <>{children}</>;

  if (ruleFor(stage) === 'verified') {
    return (
      <Banner
        tone="warning"
        title={t('gate.verified.title', 'Verified members only')}
        action={<Button size="sm" onClick={() => navigate(`/community/${communityId}/identity`)}>{t('gate.getVerified', 'Get verified')}</Button>}
      >
        {t('gate.verified.body', 'This community asks Verified members to take part here. You’re vouched by {count} — meet a few more members to verify.', { count: currentUserVouchCount })}
      </Banner>
    );
  }
  // rule === 'members' and the user isn't a member ('anyone' never blocks)
  return (
    <Banner
      tone="info"
      title={t('gate.members.title', 'Members only')}
      action={<Button size="sm" onClick={() => navigate('/welcome')}>{t('gate.join', 'Join in')}</Button>}
    >
      {t('gate.members.body', 'Join this community to take part here. You can keep reading either way.')}
    </Banner>
  );
};

export default StageGate;
```

- [ ] **Step 2: SCSS** — only if a wrapper margin is needed: a one-rule `.gate { margin-top: $spacing-sm; }` (Banner carries its own surface). Often unnecessary; skip the file if unused.

- [ ] **Step 3: Verify** — `tsc -b` clean.

### Task 12: Enforce in StageFeedView + fix stale copy

**Files:** Modify `src/pages/StageFeedView.tsx`

- [ ] **Step 1:** In the `StageFeedCard` component (extracted in Task 7), wrap each stage's inline flow:
```tsx
<StageGate communityId={item.communityId} stage={stage}>
  {/* existing <ProblemStage/> | <DiscussionStage/> | ... */}
</StageGate>
```
Keep the card header/title/description **outside** the gate (read-only stays visible).

- [ ] **Step 2: Fix copy** — replace the `vote` `thresholdBanner` string (line ~167) with rule-accurate copy: `t('stagefeed.vote.info', 'Distribute your voting credits across proposals. Each community decides who can cast a binding vote — see the rule on each card.')`. Leave the other threshold banners (participation thresholds — a distinct concept).

- [ ] **Step 3: Verify** — `tsc -b` + `build` clean. Preview `/stage/vote` as a pending user: cards show the read-only context + a "Verified members only" Banner with "Get verified"; `/stage/problem` (members rule, user is a member) shows the flow normally. Light + dark + 360px. Screenshots (blocked + allowed).

### Task 13: Enforce in InitiativeDashboard

**Files:** Modify `src/components/collaboration/InitiativeDashboard.tsx`

- [ ] **Step 1:** Import `StageGate`. Wrap the ACTIVE-stage participation block (the `ProblemStage`/`DiscussionStage`/`ProposalsStage`/`VoteStage`/`MandateStage` render, ~lines 340–378) in `<StageGate communityId={communityId} stage={s.id}>…</StageGate>`. Completed/locked stage rendering is unchanged. `communityId` is already a prop (line 47).

- [ ] **Step 2: Verify** — `tsc -b` + `build` clean. Preview an initiative whose active stage is Vote/Mandate as a pending user → blocked Banner inside the active card; advance/threshold UI unaffected. Light + dark + 360px. Screenshot.

### Task 14: Close the loop — QR scan + meet-a-member add a vouch

**Files:** Modify `src/components/community/dialogs/QRScannerDialog.tsx`, `src/components/community/IdentityTrust.tsx`

- [ ] **Step 1: QR scan → vouch.** In `QRScannerDialog`, when a scan resolves to a valid member (`isValid && isMember`), call `addUserVouch(agent)` (import from `../../../services/trust`) and surface a confirmation line (`t('trust.vouchAdded', 'Vouch added — you’re now vouched by more members')`). Guard against double-adding the same agent (the helper already dedups).

- [ ] **Step 2: Meet-a-member (testable).** In IdentityTrust's "Your verification" panel (Task 8), add a `Button` `t('trust.meetMember', 'Meet a member (demo)')` shown only while `currentUserTrust !== 'verified'`. On click, pick a community member who isn't already a voucher and isn't the current user, and call `addUserVouch(pk)`. Source members from `useAppSelector(s => s.communities.communityMembers[communityId])`. This drives the 2→4 journey in the preview (no camera needed).

- [ ] **Step 3: Verify** — `tsc -b` + `build` clean. Preview `/community/:id/identity`: click "Meet a member" twice → count 2→3→4, badge flips to **Verified**, progress bar fills to `$success`. Then `/stage/vote` for that community → the gate is now **unlocked** (flow renders). Light + dark + 360px. Screenshots: pending → verified → unlocked gate.

- [ ] **Step 4: Commit V3**
```bash
git add src/components/community/StageGate.tsx src/components/community/StageGate.module.scss \
  src/pages/StageFeedView.tsx src/components/collaboration/InitiativeDashboard.tsx \
  src/components/community/IdentityTrust.tsx src/components/community/dialogs/QRScannerDialog.tsx src/i18n
git commit -m "feat(trust): enforce per-stage gate with friendly states + vouch loop (V3)

StageGate wraps the shared stage flows in StageFeedView and the Initiative
Dashboard: when the user can't act, a Banner explains the rule and links to the
fix (get verified / join) while read-only content stays visible. Stale 'web of
trust' copy now reflects the real per-stage rule. QR scan and a testable
'meet a member' action both add a vouch, so a pending user can cross 2 -> 4 and
watch the Vote/Mandate gates unlock.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (whole batch)

- [ ] `npx tsc -b` clean.
- [ ] `npm run build` clean.
- [ ] Preview walk (light + dark + 360px, no console/ErrorBoundary errors), screenshots saved:
  - Members list — mixed trust badges.
  - Author chip with a badge (feed + home).
  - Community Settings — change a rule, reload, persists.
  - Vote stage as pending user — blocked Banner + "Get verified", read-only tally visible.
  - Initiative Dashboard Vote/Mandate — blocked inside active card.
  - Meet-a-member 2→4 → Verified → Vote gate unlocks.
- [ ] `git log --oneline -4` shows Step 0 (spec) + V1 + V2 + V3, nothing pushed.

## Self-review notes (done)

- **Spec coverage:** Step 0 (committed) ✓; V1 Tasks 1–8 ✓; V2 Tasks 9–10 ✓; V3 Tasks 11–14 ✓ (StageFeedView **and** Dashboard; QR **and** meet-a-member per Eston's scope choices).
- **Cycle check:** `trustModel.ts` imports nothing → `community.ts` and `trust.ts` import it safely; `trust.ts`→`api.ts` only (no demo import back into trust). ✓
- **Type consistency:** `StageRule`/`TrustState`/`PipelineStage` defined once in `trustModel.ts`, imported everywhere; hook returns `canCurrentUserParticipate` (used by StageGate). ✓
- **Dropped from spec to avoid dead code:** contract `add_vouch` write (current-user vouches use the agent store; personas use the read-time graph). Noted here so it isn't re-added.
- **Placeholder scan:** clean — no TBD/TODO; `StageGate` rewritten to need no `publicKey` placeholder.
