# S11 — Trust, Privacy & Consent (P2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Gloki's vote mechanism auditable before you participate, disclose vote visibility + collection honestly, offer a pseudonym, require consent, and stop the pubkey leaking via shared links — all on the `ui` stub layer.

**Architecture:** Item 1 restructures `VoteEngage` so an always-visible explainer (`InfoDisclosure`) and a read-only `VotePreview` sit *outside* `StageGate`, while the interactive ballot stays gated. Item 2 adds an optional `IProfile.displayName` + a central `displayNameFor()` helper threaded through bylines. Item 3 removes the consent "Skip", enriches the screen, and makes `MandateCard` share a clean id-based URL.

**Tech Stack:** React 19 + TS + Vite + Redux Toolkit + SCSS Modules; i18n via `useT()`/`t('key','English')`; contract seam via `src/services/api.ts` + `src/services/demo/`.

## Global Constraints

- **Branch `ui`, keep runnable.** Every read/write through `src/services/api.ts`; never call a real server from a component. Demo seam emits **no `contract_write` events** → re-fetch after writes.
- **No test framework.** Verification = `npm run build` (runs `tsc -b`) clean + `preview_*`/grep checks. No `*.test.*` files.
- **Tokens only** (no hardcoded colors); reuse `InfoDisclosure` / `StageGate` / `Banner` / `UserIdentity` / `Modal`. 360px flagship; verify **light + dark**; WCAG AA; reduced-motion token-pure.
- **Single `<h1>` per route** preserved on every touched route (never add a second `<h1>`; use `<h2>`/`<p>`).
- **i18n parity:** new/changed strings added to BOTH `src/i18n/fr.ts` and `src/i18n/sw.ts` (flat dotted keys); English inline via `t('key','English')`; only foundation keys go in `src/i18n/en.ts`. Sorted-key diff of fr vs sw must be empty. Append new/changed fr+sw strings to `docs/i18n-native-review-candidates.md`.
- **Contract method names unchanged** (`addProposal`/`proposal_id`); UI vocab stays "Solutions". **Do NOT re-open 1p1v ↔ QV** — keep both, explain the link.
- **DEMO_VERSION** `global-v13` → `global-v14` ONLY in the task that changes fixtures (Task 2).
- Commit after each task with a `feat(s11):` / `refactor(s11):` message. Do NOT push (Eston gates the push).

## File Structure

- **Task 1:** create `src/components/initiative/stages/VoteExplainer.tsx`, `VotePreview.tsx` (+ `VotePreview.module.scss`); modify `VoteEngage.tsx`; edit `mechanisms.qv.disclosure` + add `mechanisms.qv.explainer.*` / `preview.*` in `fr.ts`/`sw.ts`.
- **Task 2:** create `src/utils/displayName.ts`; modify `src/services/interfaces.ts`, `fixtures/identity.ts`, `demoContracts/profile.ts`, byline sites, `Profile.tsx`, `mockApi.ts` (version bump); add `profile.displayName.*` in `fr.ts`/`sw.ts`.
- **Task 3:** modify `steps/RulesStep.tsx`, `OnboardingFlow.tsx`; add `onboarding.consent.*` in `fr.ts`/`sw.ts`.
- **Task 4:** modify `src/components/mandate/MandateCard.tsx`, `MandatePage.tsx`.

---

### Task 1: [BLOCKER] Pre-gate ballot teaser + "how this vote works" explainer

**Files:**
- Create: `src/components/initiative/stages/VoteExplainer.tsx`
- Create: `src/components/initiative/stages/VotePreview.tsx`
- Create: `src/components/initiative/stages/VotePreview.module.scss`
- Modify: `src/components/initiative/stages/VoteEngage.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`
- Modify: `docs/i18n-native-review-candidates.md`

**Interfaces:**
- Consumes: `useCommunityTrust(communityId)` → `{ canCurrentUserParticipate, isReady }` from `src/hooks/useCommunityTrust`; `InfoDisclosure` from `../../shared`; read fns from `../../collaboration/flows/voting/qvApi` (`getProposals`, `getConfig`, `getResults`, `getAllocations`) and `approvalApi` (`getProposals`); `useFlowContract` from `../../collaboration/flows/shared/useFlowContract`.
- Produces: `<VoteExplainer />`, `<VotePreview initiativeId communityMemberCount />`.

- [ ] **Step 1: Create `VoteExplainer.tsx`** — the always-visible "How this vote works" `(i)` explainer. Numbers inline; no second `<h1>`.

```tsx
import React from 'react';
import { InfoDisclosure } from '../../shared';
import { useT } from '../../../i18n';
import styles from './VotePreview.module.scss';

/**
 * S11 P2 — the "how this vote works" explainer, visible BEFORE the gate so the
 * mechanism is auditable without participating. QV cost-curve + conviction time
 * dimension, reconciled with 1p1v (keep both — do not re-open). Reuses the shared
 * InfoDisclosure (i)→Modal standard; numbers stay inline in the prose.
 */
const VoteExplainer: React.FC = () => {
  const t = useT();
  return (
    <div className={styles.explainer}>
      <span className={styles.explainerLabel}>
        {t('mechanisms.qv.explainer.inline', 'How this vote works')}
      </span>
      <InfoDisclosure
        label={t('mechanisms.qv.explainer.label', 'How this vote works')}
        title={t('mechanisms.qv.explainer.title', 'How this vote works')}
        size="md"
      >
        <p>{t('mechanisms.qv.explainer.equalSay', 'Everyone here gets the same set of hearts — one person, the same say. No one can buy more.')}</p>
        <p>{t('mechanisms.qv.explainer.cost', 'You spread those hearts across the solutions you care about. Piling them onto one costs more than sharing them out: 1 heart costs 1 point, 2 hearts cost 4, 3 hearts cost 9. So backing several things you believe in goes further than shouting for just one.')}</p>
        <p>{t('mechanisms.qv.explainer.conviction', 'Support also builds over time — the longer a solution holds its backing, the more settled the community’s conviction behind it.')}</p>
      </InfoDisclosure>
    </div>
  );
};

export default VoteExplainer;
```

- [ ] **Step 2: Create `VotePreview.module.scss`** — token-only styles (mirror QVFlow spacing).

```scss
@use '../../../styles/variables' as *;

.explainer { display: flex; align-items: center; gap: $spacing-sm; margin-bottom: $spacing-md; }
.explainerLabel { font-size: $text-sm; font-weight: $font-medium; color: $gray-700; }

.preview {
  display: flex; flex-direction: column; gap: $spacing-md;
  margin-top: $spacing-md; padding-top: $spacing-md; border-top: 1px solid $gray-200;
}
.previewHead { font-size: $text-sm; color: $gray-600; margin: 0; }
.disclosure { font-size: $text-xs; color: $gray-600; margin: 0; }
.sol {
  display: flex; flex-direction: column; gap: $spacing-sm;
  border: 1.5px solid $gray-200; border-radius: $radius-md; padding: $spacing-md; background: white;
}
.solText { margin: 0; font-size: $text-sm; line-height: 1.5; color: $gray-800; }
.count { font-size: $text-xs; color: $gray-500; }

@media (prefers-color-scheme: dark) {
  .explainerLabel, .previewHead, .disclosure, .count { color: $dark-text-secondary; }
  .solText { color: $dark-text; }
  .preview { border-top-color: $dark-border; }
  .sol { background: $dark-surface; border-color: $dark-border; }
}
```

> Tokens verified against `src/styles/variables.scss` (spacing `$spacing-*`, font `$text-*`, radius `$radius-*`, colors `$gray-*`/`$primary`/`$success`, dark-mode `$dark-*`). This mirrors `QVFlow.module.scss`; the dark block follows its `@media (prefers-color-scheme: dark)` pattern.

- [ ] **Step 3: Create `VotePreview.tsx`** — read-only ballot. Joins the same qv+approval contracts as `QVFlow`, reviewed-only ballot, renders text/byline/results only. **Never imports `allocate`; no steppers, no Cast button.**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
import { getProposals, getConfig, getResults } from '../../collaboration/flows/voting/qvApi';
import { getProposals as getApprovalProposals } from '../../collaboration/flows/voting/approvalApi';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { UserIdentity } from '../../shared';
import { displayNameFor } from '../../../utils/displayName';
import styles from './VotePreview.module.scss';

interface QvProposal { id: string; text: string; author: string; timestamp: string | number }
interface ApprovalProposal { id: string; text: string; author: string; commitments?: string[]; expertReviews?: { metrics: string[] }[] }

export interface VotePreviewProps { initiativeId: string; communityMemberCount?: number }

/**
 * S11 P2 — read-only ballot preview shown OUTSIDE the StageGate, only when the
 * current user cannot participate. Pure reads (no allocate import) so no write
 * path leaks past the gate. Mirrors QVFlow's reviewed-only ballot build.
 */
const VotePreview: React.FC<VotePreviewProps> = ({ initiativeId }) => {
  const t = useT();
  const instanceId = `${initiativeId}_vote`;
  const { contractId, isReady } = useFlowContract(instanceId, 'quadratic_vote', 'qv_contract.py', '', initiativeId, 'voteContractId');
  const { contractId: proposalsContractId, isReady: proposalsReady } =
    useFlowContract(`${initiativeId}_proposals`, 'approval_voting', 'approval_contract.py', '', initiativeId, 'proposalsContractId');
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [qv, setQv] = useState<Record<string, QvProposal>>({});
  const [approval, setApproval] = useState<Record<string, ApprovalProposal>>({});
  const [results, setResults] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const [p, , r, ap] = await Promise.all([
        getProposals(serverUrl, publicKey, contractId),
        getConfig(serverUrl, publicKey, contractId),
        getResults(serverUrl, publicKey, contractId),
        proposalsReady && proposalsContractId ? getApprovalProposals(serverUrl, publicKey, proposalsContractId) : Promise.resolve(null),
      ]);
      setQv((p as Record<string, QvProposal>) || {});
      setResults((r as Record<string, number>) || {});
      if (ap) setApproval(ap as Record<string, ApprovalProposal>);
    } catch (err) { console.error('VotePreview fetch failed:', err); }
  }, [serverUrl, publicKey, contractId, proposalsContractId, proposalsReady]);

  useEffect(() => { if (isReady) fetchData(); }, [isReady, fetchData]);

  const list = Object.values(qv).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const merged = list.map((q) => {
    const twin = approval[q.id];
    return { id: q.id, text: twin?.text ?? q.text, author: twin?.author ?? q.author, reviewed: (twin?.expertReviews?.length ?? 0) > 0 };
  });
  const reviewed = merged.filter((m) => m.reviewed);
  const ballot = reviewed.length > 0 ? reviewed : merged;

  if (ballot.length === 0) return null;

  return (
    <div className={styles.preview}>
      <p className={styles.previewHead}>{t('mechanisms.qv.preview.header', 'Preview — sign in and get verified to take part.')}</p>
      <p className={styles.disclosure}>{t('mechanisms.qv.disclosure', 'Your hearts are visible to the community and counted in the public tally — your vote is attributable, not secret.')}</p>
      {ballot.map((s, i) => (
        <div key={s.id} className={styles.sol}>
          <span className={styles.count}>{t('mechanisms.qv.solutionN', 'Solution {i} of {n}', { i: i + 1, n: ballot.length })}</span>
          <p className={styles.solText}>{s.text}</p>
          <UserIdentity name={displayNameFor(profiles[s.author], s.author)} countryCode={profiles[s.author]?.country} size="sm" />
          <span className={styles.count}>{t('mechanisms.qv.votesCount', '{n} votes', { n: Math.round(results[s.id] || 0) })}</span>
        </div>
      ))}
    </div>
  );
};

export default VotePreview;
```

> DEPENDS ON Task 2's `displayNameFor`. If Task 2 is not yet merged when this runs, temporarily inline `profiles[s.author] ? \`${profiles[s.author].firstName ?? ''} ${profiles[s.author].lastName ?? ''}\`.trim() : s.author.slice(0,8)+'…'` and swap to `displayNameFor` after Task 2. Prefer running Task 2 first.

- [ ] **Step 4: Rewrite `VoteEngage.tsx`** — explainer always visible; preview only when blocked.

```tsx
import React from 'react';
import StageGate from '../../community/StageGate';
import VoteStage from '../../stages/VoteStage';
import VoteExplainer from './VoteExplainer';
import VotePreview from './VotePreview';
import { useCommunityTrust } from '../../../hooks/useCommunityTrust';
import styles from './VoteEngage.module.scss';

export interface VoteEngageProps {
  initiativeId: string;
  communityId: string;
  communityMemberCount?: number;
}

/**
 * The Vote stage's Engage slot. S11 P2: the "how this vote works" explainer and a
 * read-only ballot preview live OUTSIDE the StageGate so the mechanism is
 * auditable before verifying. The interactive ballot stays gated. The preview
 * only renders when the current user cannot participate (participants never see a
 * duplicate); it does pure reads — no write path past the gate.
 */
const VoteEngage: React.FC<VoteEngageProps> = ({ initiativeId, communityId, communityMemberCount }) => {
  const { canCurrentUserParticipate, isReady } = useCommunityTrust(communityId);
  const canVote = !isReady || canCurrentUserParticipate('vote'); // mirror StageGate's loading grace

  return (
    <div className={styles.engage}>
      <VoteExplainer />
      <StageGate communityId={communityId} stage="vote">
        <VoteStage initiativeId={initiativeId} communityMemberCount={communityMemberCount} />
      </StageGate>
      {!canVote && <VotePreview initiativeId={initiativeId} communityMemberCount={communityMemberCount} />}
    </div>
  );
};

export default VoteEngage;
```

- [ ] **Step 5: Edit the visibility disclosure line (item 2a) + add explainer/preview keys in `fr.ts` and `sw.ts`.** Change the existing `'mechanisms.qv.disclosure'` value in BOTH files to the attributable-honest wording, and add the new keys. Example (fr — translate for real; sw parallel):

```
'mechanisms.qv.disclosure': 'Vos cœurs sont visibles par la communauté et comptés dans le décompte public — votre vote est attribuable, pas secret.',
'mechanisms.qv.explainer.inline': 'Comment fonctionne ce vote',
'mechanisms.qv.explainer.label': 'Comment fonctionne ce vote',
'mechanisms.qv.explainer.title': 'Comment fonctionne ce vote',
'mechanisms.qv.explainer.equalSay': 'Chacun ici reçoit le même nombre de cœurs — une personne, la même voix. Personne ne peut en acheter plus.',
'mechanisms.qv.explainer.cost': 'Vous répartissez ces cœurs entre les solutions qui vous tiennent à cœur. Les accumuler sur une seule coûte plus cher que les partager : 1 cœur coûte 1 point, 2 cœurs 4, 3 cœurs 9. Soutenir plusieurs choses va plus loin que n’en crier qu’une.',
'mechanisms.qv.explainer.conviction': 'Le soutien se renforce aussi avec le temps — plus une solution conserve ses appuis, plus la conviction de la communauté derrière elle est ancrée.',
'mechanisms.qv.preview.header': 'Aperçu — connectez-vous et faites-vous vérifier pour participer.',
```

Also update the English inline default of `mechanisms.qv.disclosure` at its call site `QVFlow.tsx:248` to match the new attributable wording: `'Your hearts are visible to the community and counted in the public tally — your vote is attributable, not secret.'`

- [ ] **Step 6: Append the new/changed fr+sw strings to `docs/i18n-native-review-candidates.md`** under a new `## S11 (2026-07-01) — Trust, Privacy & Consent` heading (list each key).

- [ ] **Step 7: Verify build + i18n parity.**

Run: `npm run build`
Expected: exits 0, no TS errors.

Run (parity — sorted keys of fr vs sw must be identical):
`node -e "const fr=Object.keys(require('./src/i18n/fr.ts'));" 2>/dev/null || echo 'use grep diff'`
Fallback: `diff <(grep -oE \"^  '[^']+'\" src/i18n/fr.ts | sort) <(grep -oE \"^  '[^']+'\" src/i18n/sw.ts | sort)`
Expected: empty diff.

- [ ] **Step 8: Commit.**

```bash
git add -A && git commit -m "feat(s11): pre-gate vote explainer + read-only ballot preview; attributable-vote disclosure"
```

---

### Task 2: [MAJOR] Opt-in display name / pseudonym

**Files:**
- Create: `src/utils/displayName.ts`
- Modify: `src/services/interfaces.ts` (`IProfile`)
- Modify: `src/services/demo/fixtures/identity.ts` (persona type + one seed)
- Modify: `src/services/demo/demoContracts/profile.ts` (`get_profile` returns `displayName`)
- Modify byline sites: `src/components/collaboration/flows/voting/QVFlow.tsx` (`authorName`), `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` (`displayName` helper), `src/components/community/Members.tsx`, `src/components/initiative/stages/SolutionsBoard.tsx`, `src/components/community/chat/ChatTopicList.tsx`, `src/services/demo/fixtures/deliberation.ts` (comment author name at line ~537)
- Modify: `src/components/identity/Profile.tsx` (relabel name field + hint)
- Modify: `src/services/demo/mockApi.ts` (`DEMO_VERSION` → `global-v14`)
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`, `docs/i18n-native-review-candidates.md`

**Interfaces:**
- Produces: `displayNameFor(profile: Partial<IProfile> | undefined, fallbackKey?: string): string`.

- [ ] **Step 1: Add `displayName?` to `IProfile`** in `src/services/interfaces.ts` (after `country?`):

```ts
    country?: string;
    /** Optional public display name / pseudonym; when set, bylines show this instead of first+last. */
    displayName?: string;
```

- [ ] **Step 2: Create `src/utils/displayName.ts`.**

```ts
import type { IProfile } from '../services/interfaces';

/**
 * The single source of truth for a member's byline name. Prefers an opt-in
 * public display name / pseudonym; falls back to first+last, then a truncated key.
 * Keep bylines going through this so pseudonymity is honoured everywhere.
 */
export function displayNameFor(profile: Partial<IProfile> | undefined, fallbackKey?: string): string {
  const pseudonym = profile?.displayName?.trim();
  if (pseudonym) return pseudonym;
  const full = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
  if (full) return full;
  return fallbackKey ? `${fallbackKey.slice(0, 8)}…` : '';
}
```

- [ ] **Step 3: Seed one persona pseudonym.** In `src/services/demo/fixtures/identity.ts`, add `displayName?: string` to the persona interface (near `firstName: string`), and set it on ONE privacy-minded persona (e.g. the German privacy advocate `demo-user-de-anika`): add `displayName: 'Anon Fox'` to that record. Then in `src/services/demo/demoContracts/profile.ts` `get_profile`, add `displayName: persona.displayName` to the returned object.

- [ ] **Step 4: Thread bylines through `displayNameFor`.** Replace each inline `firstName + lastName` name-composition with the helper:
  - `QVFlow.tsx` `authorName(key)` → `return displayNameFor(profiles[key], key);` (import `displayNameFor`).
  - `ThreadedDiscussion.tsx` `displayName(...)` helper → keep the `isOwn` short-circuit; replace the `full || slice` body with `return displayNameFor(p, authorKey);` (import helper).
  - `Members.tsx`, `SolutionsBoard.tsx`, `ChatTopicList.tsx`: where they build `` `${firstName} ${lastName}` `` for a member/author byline, swap to `displayNameFor(profile, key)`. (Leave the current user's own "You" labels untouched.)
  - `deliberation.ts` ~line 537: `const name = displayNameFor(persona, persona.publicKey);` (persona has firstName/lastName/displayName).

- [ ] **Step 5: Relabel the profile name field** in `src/components/identity/Profile.tsx`. Change the `edit-name` field label to `t('profile.displayName.label', 'Display name')` and add a hint line below the input: `t('profile.displayName.hint', 'This name is public — it shows on your posts and votes. You can use a pseudonym instead of your real name.')`. (Use existing hint/`fieldHint` styling if present; otherwise a `<p className={styles.fieldHint}>` with token color.)

- [ ] **Step 6: Bump DEMO_VERSION** in `src/services/demo/mockApi.ts`: `const DEMO_VERSION = 'global-v14';`

- [ ] **Step 7: Add i18n keys** `profile.displayName.label`, `profile.displayName.hint` in `fr.ts` + `sw.ts` (translated), and append to `docs/i18n-native-review-candidates.md`.

- [ ] **Step 8: Verify build + parity + render.**

Run: `npm run build` → exits 0.
Run parity diff (as Task 1 Step 7) → empty.
Grep guard (no stray inline name-compose left in byline sites): `grep -rn "firstName.*lastName\|lastName.*firstName" src/components/collaboration/flows/voting/QVFlow.tsx src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` → only the helper import / none.

- [ ] **Step 9: Commit.**

```bash
git add -A && git commit -m "feat(s11): opt-in display-name/pseudonym via IProfile.displayName + displayNameFor byline helper; seed one pseudonym; DEMO_VERSION global-v14"
```

---

### Task 3: [MAJOR] Real, non-skippable consent step

**Files:**
- Modify: `src/components/onboarding/steps/RulesStep.tsx`
- Modify: `src/components/onboarding/OnboardingFlow.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`, `docs/i18n-native-review-candidates.md`

**Interfaces:**
- Consumes: `onAgree`, `onBack`, `headingRef` (drops `onSkip`).

- [ ] **Step 1: Remove skip from `RulesStep.tsx`.** Delete the `onSkip` prop from `Props`, remove the "Skip for now" `<Button>` in `secondaryActions`, and add the "What we collect" block + pilot note + placeholder terms links after the promises list. Full replacement of the component body:

```tsx
import React from 'react';
import { Button } from '../../shared';
import { MessagesSquare, Scale, HeartHandshake, Lock } from 'lucide-react';
import { useT } from '../../../i18n';
import styles from './steps.module.scss';

interface Props {
  onAgree: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

const RulesStep: React.FC<Props> = ({ onAgree, onBack, headingRef }) => {
  const t = useT();
  const rules = [
    { icon: <MessagesSquare aria-hidden />, text: t('onboarding.rules.discuss', 'We discuss before we vote.') },
    { icon: <Scale aria-hidden />, text: t('onboarding.rules.equal', "One person, one voice — everyone gets the same say, and no one can buy more. When you vote, you spread that equal say across the issues you care about.") },
    { icon: <HeartHandshake aria-hidden />, text: t('onboarding.rules.kind', 'Disagree kindly — challenge ideas, not people.') },
    { icon: <Lock aria-hidden />, text: t('onboarding.rules.data', 'Your data stays yours.') },
  ];
  const collected = [
    t('onboarding.consent.collect.key', 'Your public key — your account identifier'),
    t('onboarding.consent.collect.profile', 'Your profile: display name, photo, country, language'),
    t('onboarding.consent.collect.votes', 'What you post and how you vote (visible to your community)'),
    t('onboarding.consent.collect.server', 'The server address your community runs on'),
  ];
  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.rules.title', 'How we work together')}
      </h1>
      <p className={styles.lead}>{t('onboarding.rules.lead', 'Four simple promises everyone here makes.')}</p>
      <ul className={styles.ruleList}>
        {rules.map((rule, i) => (
          <li key={i} className={styles.rule}>
            <span className={styles.ruleIcon}>{rule.icon}</span>
            <span>{rule.text}</span>
          </li>
        ))}
      </ul>

      <h2 className={styles.subheading}>{t('onboarding.consent.collectTitle', 'What we collect')}</h2>
      <ul className={styles.collectList}>
        {collected.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
      <p className={styles.consentNote}>
        {t('onboarding.consent.pilotNote', 'This is an early pilot — nothing here leaves your browser yet.')}{' '}
        <a href="#privacy" className={styles.consentLink}>{t('onboarding.consent.privacyLink', 'Privacy notice')}</a>
        {' · '}
        <a href="#data" className={styles.consentLink}>{t('onboarding.consent.dataLink', 'How your data is used')}</a>
        {' '}({t('onboarding.consent.placeholder', 'placeholders for the pilot')})
      </p>

      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onAgree}>
          {t('onboarding.consent.agree', 'I understand and agree')}
        </Button>
        <div className={styles.secondaryActions}>
          <Button variant="ghost" onClick={onBack}>
            {t('common.back', 'Back')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RulesStep;
```

> Reuse existing `steps.module.scss` classes where they exist (`subheading`, `collectList`, `consentNote`, `consentLink`). If any are missing, add token-only rules for them to `steps.module.scss` (font-size sm, `var(--color-text-secondary)` for note, link uses `var(--color-primary)` and underline; AA-checked).

- [ ] **Step 2: Update `OnboardingFlow.tsx` step 4** — remove the `onSkip` prop from the `<RulesStep>` render (delete the `onSkip={() => go(5)}` line). Leave `onAgree` and `onBack` as they are.

- [ ] **Step 3: Add i18n keys** in `fr.ts` + `sw.ts` (translated): `onboarding.consent.collectTitle`, `collect.key`, `collect.profile`, `collect.votes`, `collect.server`, `pilotNote`, `privacyLink`, `dataLink`, `placeholder`, `agree`. Append to `docs/i18n-native-review-candidates.md`.

- [ ] **Step 4: Verify build + parity + no second `<h1>`.**

Run: `npm run build` → exits 0.
Parity diff → empty.
Guard: `grep -c "className={styles.heading}" src/components/onboarding/steps/RulesStep.tsx` shows the single `<h1>`; the added subheading uses `<h2 className={styles.subheading}>` (grep confirms `<h2`). Confirm no `onSkip` remains: `grep -rn "onSkip" src/components/onboarding/steps/RulesStep.tsx src/components/onboarding/OnboardingFlow.tsx | grep -i rules` → none for RulesStep.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(s11): non-skippable consent step with what-we-collect + pilot terms placeholders"
```

---

### Task 4: [MAJOR] Clean shareable URL (drop pubkey)

**Files:**
- Modify: `src/components/mandate/MandateCard.tsx`
- Modify: `src/components/mandate/MandatePage.tsx`

**Interfaces:**
- Consumes: `communityId`, `mandateId` route params in `MandatePage`.
- Produces: `MandateCardProps` gains `communityId: string; mandateId: string;`.

- [ ] **Step 1: Add ids to `MandateCardProps`** in `MandateCard.tsx`:

```tsx
export interface MandateCardProps {
  mandate: PublishedMandate;
  /** Route ids — used to build a clean, pubkey-free share link. */
  communityId: string;
  mandateId: string;
  onShowSupport: () => void;
  onViewFull: () => void;
}
```

- [ ] **Step 2: Replace `window.location.href` in `share()`** with an id-based canonical URL (BrowserRouter basename = `import.meta.env.BASE_URL`). Update the component signature to destructure `communityId, mandateId`:

```tsx
const MandateCard: React.FC<MandateCardProps> = ({ mandate, communityId, mandateId, onShowSupport, onViewFull }) => {
  // ...
  const share = async () => {
    const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL.slice(0, -1) : import.meta.env.BASE_URL;
    const url = `${window.location.origin}${base}/mandate/${communityId}/${mandateId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: mandate.title, text: mandate.problem, url }); } catch { /* dismissed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };
```

- [ ] **Step 3: Pass the ids from `MandatePage.tsx`.** `MandatePage` already reads `:communityId` and `:mandateId` from route params — pass them: `<MandateCard mandate={mandate} communityId={communityId} mandateId={mandateId} onShowSupport={onShowSupport} onViewFull={onViewFull} />`. (Confirm the param variable names in `MandatePage`; use the actual `useParams` names.)

- [ ] **Step 4: Verify build + no pubkey in shared URL.**

Run: `npm run build` → exits 0.
Guard: `grep -n "window.location.href" src/components/mandate/MandateCard.tsx` → none in `share()`. `grep -n "publicKey\|/initiative/" src/components/mandate/MandateCard.tsx` → the share URL references only `/mandate/${communityId}/${mandateId}`.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(s11): share mandate by community+initiative ids — drop pubkey from shared URL"
```

---

## Recommended task order
Task 2 (helper) → Task 1 (uses `displayNameFor`) → Task 3 → Task 4. Tasks 3 and 4 are independent of 1/2. If Task 1 runs before Task 2, use the temporary inline fallback noted in Task 1 Step 3 and swap after.

## Final whole-branch verification (controller, after all tasks)
- `npm run build` clean.
- fr/sw sorted-key parity diff empty; code-ref↔i18n cross-check (every `t('key', …)` added exists in fr+sw).
- Preview at 360px, light + dark: (a) blocked user on the Vote card sees explainer + read-only preview + gate banner, no steppers; (b) verified user sees the interactive ballot + explainer, no duplicate preview; (c) consent step has no Skip and shows the collect list; (d) a persona byline renders the seeded pseudonym; (e) MandateCard copy-link yields a `/mandate/{cid}/{mid}` URL.
- Single `<h1>` per touched route (vote card host, onboarding consent, mandate).
- Opus whole-branch review; then local review panel (no `--free-ram`) — treat i18n/SCSS "missing key"/"undefined class" findings as likely false positives, verify against files.
