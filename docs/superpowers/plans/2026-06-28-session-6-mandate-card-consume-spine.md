# Session 6 — Mandate card redesign + consume commitments/metrics spine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Mandate card and derive its commitments (articles) and expert-metrics (indicators) from the winning solution's spine, read back through the same qv/approval contracts the vote card uses, with a graceful fallback to the hand-authored fixture.

**Architecture:** A new `useMandate(initiativeId)` hook owns the derivation: it resolves the initiative's vote + proposals contracts (the `QVFlow` pattern — a 2nd `useFlowContract` on `${initiativeId}_proposals`), finds the winner via `qvApi.getResults`, joins it to its `approvalApi.getProposals` twin, and maps the winner's `commitments`/`expertReviews[].metrics` onto the mandate's `articles`/`indicators`. Components stay presentational. The fixture supplies everything that doesn't derive (preamble, provenance, adopters, jurisdiction, the new `problem`).

**Tech Stack:** React + TypeScript, Redux (`useAppSelector`), react-router (`useParams`/`useNavigate`), SCSS modules with `styles/variables` tokens, lucide-react icons, the in-house i18n (`useI18n`/`useT`, flat dotted keys), demo seam via `services/api.ts` → `mockApi`.

## Global Constraints

- Branch `ui`. Keep it runnable. All reads via `src/services/api.ts`; never call a real server from a component. Demo seam emits no `contract_write` events → re-fetch after writes (S6 is read-only — no writes).
- **No test framework.** Per-task verification = `npm run build` clean (`tsc -b`) + dev-server (`gloki-dev`, port 5173) preview at **360px**, light + dark. The `adaptation` initiative ("A Universal Climate Adaptation Fund", Climate Resilience Assembly community) is the seeded `stage:'mandate'` showcase to verify against.
- **Tokens only** (`@use '../../styles/variables' as *;`). No `$gray-400` body text. ≥44px touch targets. Visible focus rings. Verify light + dark (`@media (prefers-color-scheme: dark)` with `$dark-*` tokens).
- **i18n:** new user-facing strings ship at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`; en is the inline default via `t('key','English')`; `en.ts` carries no entry). Flat dotted keys. After adding, run the parity check (`diff <(grep -oE "'[a-zA-Z0-9_.]+':" fr.ts|sort -u) <(grep -oE "'[a-zA-Z0-9_.]+':" sw.ts|sort -u)` → empty) + a code-ref↔i18n cross-check. Append new strings to `docs/i18n-native-review-candidates.md`.
- **Derivation lives in the hook layer, not components.** Document new read paths for Ouri with `// FOR OURI`. **No new contract methods** — reads `qvApi.getResults` + `approvalApi.getProposals` only.
- `npm run build` must be clean before each commit. Bump `DEMO_VERSION` (`src/services/demo/mockApi.ts`) `global-v9` → `global-v10` once new demo data is seeded (Task 2).
- Reuse the kit (`Button`/`Badge`/`CountryPresence`) + canonical `$stage-*`/`$primary`/`$gray-*` palette. Keep `MandateEngage` conviction staking (do not remove — it is the only commitment control).

---

### Task 1: Add the `problem` field to `PublishedMandate` + author adaptation's problem

**Files:**
- Modify: `src/services/demo/fixtures/mandate.ts` (interface `PublishedMandate` ~line 82-99; `ADAPTATION_MANDATE` ~line 106)

**Interfaces:**
- Produces: `PublishedMandate.problem: string` — the one-line problem statement the redesigned card renders above the solution.

- [ ] **Step 1: Add the field to the interface.** In `PublishedMandate`, add after `subtitle: string;`:

```ts
  /** One-line problem the mandate answers (card lead-in; hand-authored, not derived). */
  problem: string;
```

- [ ] **Step 2: Author adaptation's problem.** In `ADAPTATION_MANDATE`, add after `subtitle: 'A global community mandate',`:

```ts
  problem: 'Frontline communities face climate disasters without the resources to adapt.',
```

- [ ] **Step 3: Build.** Run: `npm run build` — Expected: PASS. (If any other `PublishedMandate` literal exists without `problem`, TypeScript will flag it — add a one-line `problem` to each such fixture. Grep first: `grep -rn "PublishedMandate" src/ | grep -v "\.test"`.)

- [ ] **Step 4: Commit.**

```bash
git add src/services/demo/fixtures/mandate.ts
git commit -m "feat(mandate): add hand-authored problem field to PublishedMandate"
```

---

### Task 2: Seed adaptation's winning solution with the commitments/metrics spine + bump DEMO_VERSION

**Files:**
- Modify: `src/services/demo/fixtures/deliberation.ts` (`PROPOSAL_COMMITMENTS_BY_KEY`, `PROPOSAL_EXPERT_REVIEWS_BY_KEY`)
- Modify: `src/services/demo/mockApi.ts` (`DEMO_VERSION`)

**Interfaces:**
- Consumes: the existing seed shape — `PROPOSAL_COMMITMENTS_BY_KEY: Record<key, Record<proposalIndex, string[]>>` and `PROPOSAL_EXPERT_REVIEWS_BY_KEY: Record<key, Array<{ proposalIndex; expert; metrics; note? }>>`.
- Produces: adaptation's winning proposal (**index 0** — text "A community-governed adaptation fund frontline towns can apply to directly", which matches `provenance.voteWinner`) now carries `commitments` (→ derived articles) and an `expertReviews[].metrics` (→ derived indicators).

Context: adaptation's deliberation proposals are index 0/1/2; the seeded `qvAllocationPattern` ranks **index 0** first. Verify before seeding: `grep -n "register_stage_contract\|stage_key\|qvAllocationPattern\|adaptation" src/services/demo/seedDemoCommunity.ts` and confirm the qv winner for adaptation is `p0` (highest `get_results`). The qv stage is registered under `stage_key: 'voteContractId'` and the approval/proposals stage under `'proposalsContractId'` — note both for Task 3.

- [ ] **Step 1: Add adaptation commitments.** In `PROPOSAL_COMMITMENTS_BY_KEY`, add an `adaptation` entry. These four commitments become the four derived articles, aligned to the existing hand-authored adaptation articles:

```ts
  adaptation: {
    0: [
      'A standing adaptation fund accepts applications directly from frontline towns, islands and neighbourhoods — not only national governments.',
      'A community-majority board decides how the money is allocated.',
      'Priority goes to low-cost, locally-maintainable resilience: drainage, mangroves, water storage and early warning.',
      'Every funded project publishes progress on a simple public dashboard, updated by the community.',
    ],
    1: [
      'Spending favours resilience communities can maintain themselves over large external contracts.',
    ],
    2: [
      'Every funded project is tracked openly, with community-reported updates.',
    ],
  },
```

- [ ] **Step 2: Add adaptation expert metrics.** In `PROPOSAL_EXPERT_REVIEWS_BY_KEY`, add an `adaptation` entry. The winning proposal (index 0) carries the metrics that become the four derived indicators:

```ts
  adaptation: [
    {
      proposalIndex: 0,
      expert: 'demo-expert-renata',
      metrics: [
        'Frontline communities funded each year',
        'Share of each grant reaching local control',
        'Funded projects with open progress reporting',
        'Days from application to first disbursement',
      ],
      note: 'Direct-access funding works only if disbursement stays fast and local control is measured — track both.',
    },
  ],
```

- [ ] **Step 3: Bump the demo version.** In `src/services/demo/mockApi.ts`, change `const DEMO_VERSION = 'global-v9';` → `const DEMO_VERSION = 'global-v10';`.

- [ ] **Step 4: Build.** Run: `npm run build` — Expected: PASS.

- [ ] **Step 5: Verify the seed renders on the ballot.** Start `gloki-dev` (port 5173). Open the adaptation initiative's vote stage at 360px and confirm the winning solution shows its commitments/metrics (the S5 ballot read-back). This proves the spine is seeded before Task 3 consumes it.

- [ ] **Step 6: Commit.**

```bash
git add src/services/demo/fixtures/deliberation.ts src/services/demo/mockApi.ts
git commit -m "feat(demo): seed adaptation winning solution commitments + expert metrics (global-v10)"
```

---

### Task 3: The `useMandate` derivation hook

**Files:**
- Create: `src/hooks/useMandate.ts`

**Interfaces:**
- Consumes: `useFlowContract(instanceId, name, file, code, parentContractId, stageKey)` from `../components/collaboration/flows/shared/useFlowContract` (returns `{ contractId, isReady, ... }`); `qvApi.getResults(serverUrl, publicKey, contractId): Promise<Record<id, number>>`; `approvalApi.getProposals(serverUrl, publicKey, contractId): Promise<Record<id, ApprovalProposal>>`; `useAppSelector` from `../store/hooks`; `MANDATES_BY_KEY`, `DEFAULT_MANDATE_KEY`, `PublishedMandate`, `MandateArticle`, `MandateIndicator` from `../services/demo/fixtures/mandate`.
- Produces: `useMandate(initiativeId: string | undefined): { mandate: PublishedMandate; loading: boolean; derived: boolean }`. `mandate` is the fixture with `articles`/`indicators` replaced by the derived spine (and `provenance.voteWinner` set to the winner's text) when the winning solution has `commitments`; otherwise the untouched fixture.

- [ ] **Step 1: Write the hook.** Create `src/hooks/useMandate.ts`:

```ts
import { useEffect, useMemo, useState } from 'react';
import { useFlowContract } from '../components/collaboration/flows/shared/useFlowContract';
import * as qvApi from '../components/collaboration/flows/voting/qvApi';
import * as approvalApi from '../components/collaboration/flows/voting/approvalApi';
import { useAppSelector } from '../store/hooks';
import {
  MANDATES_BY_KEY,
  DEFAULT_MANDATE_KEY,
  type PublishedMandate,
  type MandateArticle,
  type MandateIndicator,
} from '../services/demo/fixtures/mandate';

interface ApprovalProposal {
  id: string;
  text: string;
  commitments?: string[];
  expertReviews?: { expert: string; metrics: string[]; note?: string; timestamp: number }[];
}

export interface UseMandateResult {
  mandate: PublishedMandate;
  loading: boolean;
  /** true when articles/indicators came from the winning solution's spine (not the fixture). */
  derived: boolean;
}

/**
 * FOR OURI — the S6 "consume". Derives the published mandate's articles
 * (commitments) and indicators (expert metrics) from the winning solution, read
 * back through the SAME approval/qv contracts the vote card uses. Resolves the
 * initiative's vote + proposals contracts (the QVFlow pattern), picks the winner
 * by qv results, joins to its approval twin, and maps its spine onto the mandate
 * shape. Falls back to the hand-authored fixture when no spine exists. No new
 * contract methods — reads get_results + get_proposals only.
 */
export function useMandate(initiativeId: string | undefined): UseMandateResult {
  const fixture = MANDATES_BY_KEY[initiativeId ?? ''] ?? MANDATES_BY_KEY[DEFAULT_MANDATE_KEY];

  const parent = initiativeId ?? '';
  const { contractId: voteContractId, isReady: voteReady } = useFlowContract(
    parent, 'quadratic_vote', 'qv_contract.py', '', parent, 'voteContractId',
  );
  const { contractId: proposalsContractId, isReady: proposalsReady } = useFlowContract(
    `${parent}_proposals`, 'approval_voting', 'approval_contract.py', '', parent, 'proposalsContractId',
  );

  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [proposals, setProposals] = useState<Record<string, ApprovalProposal> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!initiativeId || !serverUrl || !publicKey) return;
    if (!voteReady || !voteContractId || !proposalsReady || !proposalsContractId) return;
    setLoading(true);
    (async () => {
      try {
        const [r, p] = await Promise.all([
          qvApi.getResults(serverUrl, publicKey, voteContractId),
          approvalApi.getProposals(serverUrl, publicKey, proposalsContractId),
        ]);
        if (cancelled) return;
        setResults((r as Record<string, number>) || {});
        setProposals((p as Record<string, ApprovalProposal>) || {});
      } catch {
        if (!cancelled) { setResults({}); setProposals({}); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initiativeId, serverUrl, publicKey, voteReady, voteContractId, proposalsReady, proposalsContractId]);

  const mandate = useMemo<PublishedMandate>(() => {
    if (!results || !proposals) return fixture;
    const winnerId = Object.entries(results).sort((a, b) => b[1] - a[1])[0]?.[0];
    const winner = winnerId ? proposals[winnerId] : undefined;
    const commitments = winner?.commitments ?? [];
    if (commitments.length === 0) return fixture; // graceful fallback — no spine
    const articles: MandateArticle[] = commitments.map((body, i) => ({ id: `art-${i + 1}`, title: '', body }));
    const metrics = (winner?.expertReviews ?? []).flatMap((rv) => rv.metrics);
    const indicators: MandateIndicator[] = metrics.length
      ? metrics.map((label) => ({ label, target: '' }))
      : fixture.indicators;
    return {
      ...fixture,
      articles,
      indicators,
      provenance: { ...fixture.provenance, voteWinner: winner?.text || fixture.provenance.voteWinner },
    };
  }, [results, proposals, fixture]);

  return { mandate, loading, derived: mandate !== fixture };
}
```

- [ ] **Step 2: Build.** Run: `npm run build` — Expected: PASS. (Verify the import paths resolve: `useFlowContract`, `qvApi`, `approvalApi`, `useAppSelector`, the mandate fixture exports.)

- [ ] **Step 3: Commit.**

```bash
git add src/hooks/useMandate.ts
git commit -m "feat(mandate): add useMandate derivation hook (consume winning-solution spine)"
```

(Wiring + live verification happen in Task 6, where `MandatePage` calls this hook with the real route param.)

---

### Task 4: Render `MandateDocument` gracefully when article title / indicator target are empty

**Files:**
- Modify: `src/components/mandate/MandateDocument.tsx` (article render ~line 149-154; indicator render ~line 163-168)

**Interfaces:**
- Consumes: derived `MandateArticle { title: '' }` and `MandateIndicator { target: '' }` from `useMandate`.

- [ ] **Step 1: Skip the empty article title.** Replace the article `<li>` body (lines ~150-153) with a conditional title:

```tsx
                <li key={a.id} className={styles.article}>
                  {a.title && <h3 className={styles.articleTitle}>{a.title}</h3>}
                  <p className={styles.articleBody}>{a.body}</p>
                </li>
```

- [ ] **Step 2: Drop the empty indicator target.** Replace the indicator block (lines ~164-167) so the right-aligned target only renders when present:

```tsx
                <div key={ind.label} className={styles.indicator}>
                  <dt className={styles.indicatorLabel}>{ind.label}</dt>
                  {ind.target && <dd className={styles.indicatorTarget}>{ind.target}</dd>}
                </div>
```

- [ ] **Step 3: Build.** Run: `npm run build` — Expected: PASS.

- [ ] **Step 4: Verify both shapes render.** Preview at 360px: the hand-authored fixture (with titles/targets) still renders headings + targets; a derived mandate (body-only) renders clean numbered commitments with no empty heading and metric labels with no dangling target. (Confirmed live in Task 6.)

- [ ] **Step 5: Commit.**

```bash
git add src/components/mandate/MandateDocument.tsx
git commit -m "feat(mandate): render document gracefully for body-only derived articles/indicators"
```

---

### Task 5: Redesign `MandateCard`

**Files:**
- Modify: `src/components/mandate/MandateCard.tsx` (full rewrite of the render)
- Modify: `src/components/mandate/MandateCard.module.scss` (replace `.decided`/`.signals`/signal styles)

**Interfaces:**
- Consumes: `PublishedMandate` with `problem` (Task 1) and derived `provenance.voteWinner` (Task 3).
- Produces: `MandateCardProps { mandate: PublishedMandate; onShowSupport: () => void; onViewFull: () => void }`. `MANDATE_DOC_ANCHOR_ID` export unchanged.

Design (validated at 360px): eyebrow = `ShieldCheck` icon + brand "Gloki Mandate" (brand only — no verified/1p1v line, no subtitle); title; one label-left list — **Problem** (muted) · **Mandate** (the `provenance.voteWinner` text in a tinted box, with an understated "View full" link under the label) · **Reach** ("{participants} people across {countries} countries" + note "over a year of open deliberation") · **Jurisdiction** (two-column country list via `CountryPresence` or flag+name, first 4 then a "View all" inline toggle when >4) · **Conviction** ("Backed by {n}" + note "in sustained conviction"); actions row — primary "Show your support" (`Heart`) + secondary "Share". The `JourneyRecap` breadcrumb and the "Ratified" badge/date are removed from the card (the date stays in `MandateDocument`).

- [ ] **Step 1: Rewrite `MandateCard.tsx`.** Replace the file with:

```tsx
import React, { useState } from 'react';
import { ShieldCheck, Heart, Share2, ArrowRight } from 'lucide-react';
import { Button } from '../shared';
import { useI18n } from '../../i18n';
import type { PublishedMandate } from '../../services/demo/fixtures/mandate';
import styles from './MandateCard.module.scss';

/** The scroll target id MandatePage puts on the full document. */
export const MANDATE_DOC_ANCHOR_ID = 'mandate-document';

/** ISO alpha-2 → display name in the active locale (raw code on failure). */
function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** ISO alpha-2 → flag emoji (regional indicator pair). */
function flagOf(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  const base = 0x1f1e6;
  return String.fromCodePoint(base + (code.toUpperCase().charCodeAt(0) - 65), base + (code.toUpperCase().charCodeAt(1) - 65));
}

const COUNTRY_PREVIEW = 4;

export interface MandateCardProps {
  mandate: PublishedMandate;
  /** Primary CTA → the initiative's mandate stage where conviction staking lives. */
  onShowSupport: () => void;
  /** "View full" → scroll/route to the full published document. */
  onViewFull: () => void;
}

/**
 * The scannable, shareable hero atop the published mandate. One label-left list:
 * the problem, the winning solution (the mandate), and its provenance (reach,
 * jurisdiction, conviction). The primary action drives engagement (conviction),
 * not reading; the full document is one understated "View full" away.
 */
const MandateCard: React.FC<MandateCardProps> = ({ mandate, onShowSupport, onViewFull }) => {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const { provenance } = mandate;

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: mandate.title, text: mandate.problem, url });
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked (insecure context) */
    }
  };

  const countries = mandate.countries;
  const shown = showAllCountries ? countries : countries.slice(0, COUNTRY_PREVIEW);

  return (
    <section className={styles.card} aria-label={t('mandate.card.aria', 'Mandate summary')}>
      <div className={styles.eyebrow}>
        <ShieldCheck size={15} aria-hidden className={styles.eyebrowIcon} />
        <span className={styles.brand}>{t('mandate.card.brand', 'Gloki Mandate')}</span>
      </div>

      <h1 className={styles.title}>{mandate.title}</h1>

      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt className={styles.rowLabel}>{t('mandate.card.problemLabel', 'Problem')}</dt>
          <dd className={`${styles.rowValue} ${styles.problem}`}>{mandate.problem}</dd>
        </div>

        <div className={`${styles.row} ${styles.mandateRow}`}>
          <dt className={styles.rowLabel}>
            <span>{t('mandate.card.mandateLabel', 'Mandate')}</span>
            <button type="button" className={styles.linkBtn} onClick={onViewFull}>
              {t('mandate.card.viewFull', 'View full')}
              <ArrowRight size={11} aria-hidden />
            </button>
          </dt>
          <dd className={styles.rowValue}>
            <span className={styles.solBox}>{provenance.voteWinner}</span>
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.rowLabel}>{t('mandate.card.reachLabel', 'Reach')}</dt>
          <dd className={styles.rowValue}>
            {t('mandate.card.reachValue', '{people} people across {countries} countries', {
              people: provenance.participants.toLocaleString(),
              countries: provenance.countries,
            })}
            <span className={styles.note}>{t('mandate.card.reachNote', 'over a year of open deliberation')}</span>
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.rowLabel}>{t('mandate.card.jurisdictionLabel', 'Jurisdiction')}</dt>
          <dd className={styles.rowValue}>
            <ul className={styles.countries}>
              {shown.map((c) => (
                <li key={c} className={styles.country}>
                  <span className={styles.flag} aria-hidden>{flagOf(c)}</span>
                  {countryName(c, locale)}
                </li>
              ))}
            </ul>
            {countries.length > COUNTRY_PREVIEW && (
              <button type="button" className={styles.linkBtn} onClick={() => setShowAllCountries((v) => !v)}>
                {showAllCountries
                  ? t('mandate.card.viewLess', 'View less')
                  : t('mandate.card.viewAll', 'View all')}
                <ArrowRight size={11} aria-hidden />
              </button>
            )}
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.rowLabel}>{t('mandate.card.convictionLabel', 'Conviction')}</dt>
          <dd className={styles.rowValue}>
            {t('mandate.card.convictionValue', 'Backed by {n}', { n: provenance.convictionBackers.toLocaleString() })}
            <span className={styles.note}>{t('mandate.card.convictionNote', 'in sustained conviction')}</span>
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Button variant="primary" size="lg" fullWidth leftIcon={<Heart size={16} aria-hidden />} onClick={onShowSupport}>
          {t('mandate.card.showSupport', 'Show your support')}
        </Button>
        <Button variant="secondary" leftIcon={<Share2 size={16} aria-hidden />} onClick={share}>
          {copied ? t('mandate.copied', 'Copied') : t('mandate.card.share', 'Share')}
        </Button>
      </div>
      <span className={styles.srStatus} role="status" aria-live="polite">
        {copied ? t('mandate.card.copiedStatus', 'Link copied to clipboard') : ''}
      </span>
    </section>
  );
};

export default MandateCard;
```

- [ ] **Step 2: Replace the card SCSS.** In `MandateCard.module.scss`, keep `.card` and `.srStatus` as-is; replace everything between them (the `.eyebrowRow`…`.signalFlags` and `.actions` blocks) with:

```scss
.eyebrow {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  color: $primary-dark;

  @media (prefers-color-scheme: dark) {
    color: $primary-light;
  }
}

.eyebrowIcon { flex: 0 0 auto; }

.brand {
  font-size: $text-xs;
  font-weight: $font-bold;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.title {
  margin: 0;
  font-size: $text-2xl;
  font-weight: $font-bold;
  line-height: 1.25;
  color: $gray-900;

  @media (prefers-color-scheme: dark) {
    color: $dark-text;
  }
}

.rows {
  display: flex;
  flex-direction: column;
  margin: 0;
}

.row {
  display: flex;
  gap: $spacing-md;
  align-items: baseline;
  padding: $spacing-sm 0;

  & + & {
    border-top: 1px solid $gray-100;

    @media (prefers-color-scheme: dark) {
      border-top-color: $dark-border;
    }
  }
}

.rowLabel {
  flex: 0 0 84px;
  font-size: $text-xs;
  font-weight: $font-semibold;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: $gray-500;

  @media (prefers-color-scheme: dark) {
    color: $dark-text-secondary;
  }
}

.rowValue {
  flex: 1;
  margin: 0;
  font-size: $text-sm;
  line-height: 1.4;
  color: $gray-900;

  @media (prefers-color-scheme: dark) {
    color: $dark-text;
  }
}

.problem { color: $gray-600;

  @media (prefers-color-scheme: dark) {
    color: $dark-text-secondary;
  }
}

.note {
  display: block;
  margin-top: 2px;
  font-size: $text-xs;
  color: $gray-500;

  @media (prefers-color-scheme: dark) {
    color: $dark-text-secondary;
  }
}

/* Mandate row — boxed hero value + understated "View full" under the label. */
.mandateRow { align-items: flex-start; }

.mandateRow .rowLabel {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.solBox {
  display: block;
  padding: $spacing-sm $spacing-md;
  background: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.2);
  border-radius: $radius-md;
  font-size: $text-base;
  font-weight: $font-semibold;
  line-height: 1.36;
  color: $gray-900;

  @media (prefers-color-scheme: dark) {
    background: rgba($primary, 0.16);
    border-color: rgba($primary, 0.4);
    color: $dark-text;
  }
}

.linkBtn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: $primary;
  text-transform: none;
  letter-spacing: 0;

  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; border-radius: $radius-sm; }

  @media (prefers-color-scheme: dark) { color: $primary-light; }
}

.countries {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px $spacing-md;
  margin: 0;
  padding: 0;
  list-style: none;
}

.country {
  font-size: $text-sm;
  white-space: nowrap;
}

.flag { margin-right: $spacing-xs; }

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}
```

- [ ] **Step 3: Build.** Run: `npm run build` — Expected: PASS. (TypeScript will error in `MandatePage` because `MandateCard` now requires `onShowSupport`/`onViewFull` — that is wired in Task 6; if running Task 5 standalone, temporarily ignore the `MandatePage` callsite error and fix it in Task 6. Prefer running Task 6 immediately after.)

- [ ] **Step 4: Verify any unused token vars.** If `$primary-light` is not defined in `styles/variables`, substitute the nearest defined light-primary token (grep: `grep -n "primary-light\|primary-dark" src/styles/variables*`). Adjust and rebuild.

- [ ] **Step 5: Commit.**

```bash
git add src/components/mandate/MandateCard.tsx src/components/mandate/MandateCard.module.scss
git commit -m "feat(mandate): redesign card — brand eyebrow, label-left rows, boxed solution, support CTA"
```

---

### Task 6: Wire `MandatePage` — resolve initiativeId, consume `useMandate`, route "Show your support"

**Files:**
- Modify: `src/components/mandate/MandatePage.tsx`
- Reference (read, do not necessarily modify): `src/components/mandate/MandatePage.demo.ts`, `src/components/community/MandateActivityCard.tsx`, `src/components/initiative/stages/MandateEngage.tsx`, `src/components/shared/StageFooter.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `useMandate(initiativeId)` (Task 3); `MandateCardProps` with `onShowSupport`/`onViewFull` (Task 5); `useParams`/`useNavigate` (react-router).

Context: the route is `/mandate/:communityId/:mandateId/*` (App.tsx). Today `MandatePage` ignores the params and calls `getPublishedMandate(undefined)` → always the flagship. The `:mandateId` param is the value the feeds pass as `item.id` when navigating (`navigate(\`/mandate/\${item.communityId}/\${item.id}\`)` in `StageFeedView`/`MandateActivityCard`), i.e. the initiative id used as `parentContractId` in `seedDemoCommunity`.

- [ ] **Step 1: Verify the id mapping (spike).** Read `StageFeedView.tsx` and `MandateActivityCard.tsx` for the exact value passed as the `:mandateId` segment, and `seedDemoCommunity.ts` for the `initiativeId` used as `parentContractId` + the qv `stage_key`. Confirm they are the same id space (so `useFlowContract(mandateId, …, mandateId, 'voteContractId')` resolves the seeded contract). If `:mandateId` is NOT the initiativeId (e.g. it's a title or a mandate key), add a resolver in `MandatePage.demo.ts` (`initiativeIdForMandate(mandateId): string`) and use its result as the `useMandate` argument. Note the finding inline as a `// FOR OURI` comment.

- [ ] **Step 2: Determine the "Show your support" destination.** From the routing read, pick the route that renders the initiative's mandate-stage `ConvictionStaking`. Preferred: a direct initiative mandate-stage route if one exists; otherwise navigate to the bottom-nav mandate feed `/stage/mandate` (where the initiative's conviction card lives on expand). Record the chosen target.

- [ ] **Step 3: Rewrite `MandatePage.tsx`:**

```tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../AppHeader';
import MandateCard, { MANDATE_DOC_ANCHOR_ID } from './MandateCard';
import MandateDocument from './MandateDocument';
import AdoptionFramework from './AdoptionFramework';
import { useMandate } from '../../hooks/useMandate';
import cs from '../../pages/Container.module.scss';
import styles from './MandatePage.module.scss';

/**
 * Lane E — Mandate & Impact. Routed at `/mandate/:communityId/:mandateId/*`.
 *
 * The published Mandate artifact (E1) + adoption framework (E2). `useMandate`
 * derives the articles/indicators from the winning solution's spine (S6 consume),
 * falling back to the hand-authored fixture. FOR OURI: `:mandateId` is the
 * initiative id; the derivation reads the same qv/approval contracts the vote
 * card uses (see useMandate).
 */
const MandatePage: React.FC = () => {
  const navigate = useNavigate();
  const { mandateId } = useParams<{ communityId: string; mandateId: string }>();
  const { mandate } = useMandate(mandateId);

  const onViewFull = () => {
    const el = document.getElementById(MANDATE_DOC_ANCHOR_ID);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Decision B: route to where conviction staking lives (set in Step 2).
  const onShowSupport = () => navigate('/stage/mandate');

  return (
    <div className={cs.container}>
      <AppHeader showBack onBack={() => navigate(-1)} />

      <main id="main" tabIndex={-1} className={cs.content}>
        <div className={cs.main}>
          <div className={styles.page}>
            <MandateCard mandate={mandate} onShowSupport={onShowSupport} onViewFull={onViewFull} />
            <div id={MANDATE_DOC_ANCHOR_ID} className={styles.docAnchor}>
              <MandateDocument mandate={mandate} />
            </div>
            <AdoptionFramework mandateId={mandate.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MandatePage;
```

(If Step 1 needed a resolver, replace `useMandate(mandateId)` with `useMandate(initiativeIdForMandate(mandateId))` and import it. If Step 2 found a better support route, replace `'/stage/mandate'` accordingly.)

- [ ] **Step 4: Build.** Run: `npm run build` — Expected: PASS (the Task 5 callsite error is now resolved).

- [ ] **Step 5: Live verification (the payoff).** `gloki-dev` at 360px, light + dark. Navigate to the adaptation mandate (open the adaptation initiative → its mandate → "View the published mandate", or hit `/mandate/<communityId>/<adaptation-initiative-id>`). Confirm:
  - The redesigned card matches the approved mockup (brand eyebrow, Problem/Mandate(boxed)/Reach/Jurisdiction/Conviction rows, "View full" link, "Show your support" + "Share").
  - The Mandate box text = the winning solution ("A community-governed adaptation fund frontline towns can apply to directly").
  - **The document's "What we commit to" shows the four DERIVED commitments** (Task 2 seed), and "How we'll know it's working" shows the four DERIVED metric labels (no targets) — proving the spine is consumed, not the fixture.
  - "View full" scrolls to the document; "Show your support" reaches the conviction surface.
  - Jurisdiction lists countries; "View all" toggles when >4.

- [ ] **Step 6: Commit.**

```bash
git add src/components/mandate/MandatePage.tsx src/components/mandate/MandatePage.demo.ts
git commit -m "feat(mandate): wire MandatePage to useMandate (derived spine) + support routing"
```

---

### Task 7: i18n parity + native-review log

**Files:**
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`
- Modify: `docs/i18n-native-review-candidates.md`

**Interfaces:**
- Consumes: the new/changed keys used in Task 5's `MandateCard` and the unchanged document keys.

New keys to add at fr + sw parity (translate appropriately; brand stays "Gloki Mandate"): `mandate.card.brand`, `mandate.card.problemLabel`, `mandate.card.viewFull`, `mandate.card.reachNote`, `mandate.card.jurisdictionLabel`, `mandate.card.viewAll`, `mandate.card.viewLess`, `mandate.card.showSupport`. Update existing `mandate.card.reachValue` text to the "{people} people across {countries} countries" form in both dicts. Remove now-orphaned card keys if present in fr/sw: `mandate.card.decided`, `mandate.card.readFull`, `mandate.card.mandateValue`, `mandate.card.oneVote`, `mandate.card.ratified`, `mandate.card.ratifiedOn` (verify each is unused via grep before deleting — some may be shared with `MandateDocument`, which uses the un-prefixed `mandate.*` keys, so only delete `mandate.card.*` orphans).

- [ ] **Step 1: Add/Update fr.ts + sw.ts.** Add the new keys and update `reachValue` in both files (French + Swahili). Example fr values:

```ts
  'mandate.card.brand': 'Gloki Mandate',
  'mandate.card.problemLabel': 'Problème',
  'mandate.card.viewFull': 'Voir en entier',
  'mandate.card.reachValue': '{people} personnes dans {countries} pays',
  'mandate.card.reachNote': 'au fil d’une année de délibération ouverte',
  'mandate.card.jurisdictionLabel': 'Juridiction',
  'mandate.card.viewAll': 'Voir tout',
  'mandate.card.viewLess': 'Voir moins',
  'mandate.card.showSupport': 'Apportez votre soutien',
```

Example sw values:

```ts
  'mandate.card.brand': 'Gloki Mandate',
  'mandate.card.problemLabel': 'Tatizo',
  'mandate.card.viewFull': 'Tazama kamili',
  'mandate.card.reachValue': 'Watu {people} katika nchi {countries}',
  'mandate.card.reachNote': 'kwa mwaka mzima wa majadiliano ya wazi',
  'mandate.card.jurisdictionLabel': 'Mamlaka',
  'mandate.card.viewAll': 'Tazama zote',
  'mandate.card.viewLess': 'Tazama chache',
  'mandate.card.showSupport': 'Onyesha uungaji mkono wako',
```

- [ ] **Step 2: Parity check.** Run:

```bash
diff <(grep -oE "'[a-zA-Z0-9_.]+':" src/i18n/fr.ts | sort -u) <(grep -oE "'[a-zA-Z0-9_.]+':" src/i18n/sw.ts | sort -u)
```

Expected: empty output (perfect key parity).

- [ ] **Step 3: Code-ref ↔ i18n cross-check.** For each `mandate.card.*` key referenced in `MandateCard.tsx`, confirm it exists in fr + sw (or is intentionally inline-en-only — but these all need parity). Grep: `grep -oE "mandate\.card\.[a-zA-Z]+" src/components/mandate/MandateCard.tsx | sort -u` and confirm coverage. Confirm no deleted key is still referenced anywhere: `grep -rn "mandate.card.decided\|mandate.card.readFull\|mandate.card.mandateValue\|mandate.card.oneVote" src/`.

- [ ] **Step 4: Append to the native-review log.** Add the new strings (en/fr/sw) to `docs/i18n-native-review-candidates.md` under a dated S6 heading.

- [ ] **Step 5: Build.** Run: `npm run build` — Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add src/i18n/fr.ts src/i18n/sw.ts docs/i18n-native-review-candidates.md
git commit -m "i18n: S6 mandate card strings at fr+sw parity; prune orphaned card keys"
```

---

## Final verification (after all tasks)

- [ ] `npm run build` clean from a fresh state.
- [ ] Preview the adaptation mandate at 360px, **light + dark**: card matches the approved design; the document renders the **derived** commitments + metric indicators; "View full" scrolls; "Show your support" reaches conviction; "Share" copies.
- [ ] Toggle a non-adaptation initiative (no spine) → it falls back to the fixture cleanly (no empty articles/indicators).
- [ ] AA spot check: muted Problem text, `.linkBtn`, and `.note` colors pass contrast (no `$gray-400` body text); focus rings visible on `.linkBtn` and buttons; touch targets ≥44px.
- [ ] i18n parity diff empty.
- [ ] **Gate:** local multi-model review panel (`/code-review`) on the session diff — do **NOT** pass `--quit-chrome`. If it returns zero-coverage (no `GEMINI_API_KEY`; Ollama RAM-skips while Jellyfin transcodes), say so and lean on the per-task + Opus whole-branch reviews.
- [ ] Confirm seed/demo content + deploy with Eston, then push `origin/ui`.

## Self-review notes (plan ↔ spec coverage)

- Spec decision 1 (read-back + fallback) → Task 3. Decision 2 (body-only mapping) → Task 3 (mapping) + Task 4 (graceful render). Decision 3 (seed adaptation + v10) → Task 2. Decision 4 (problem field) → Task 1. Decision 5 (Show your support → B) → Task 5 (CTA) + Task 6 (routing).
- Card redesign (eyebrow, rows, boxed solution, "View full", two-column jurisdiction + "View all", remove breadcrumb/badge) → Task 5.
- MandatePage param wiring (the `// SEAM (Ouri)` fix) → Task 6.
- i18n parity + native-review log → Task 7.
- Out-of-scope per spec (scope badge, privacy seeding, MandateEngage conviction removal) → not in any task, by design.
- Integration risk (does `:mandateId` resolve to the seeded `initiativeId`) → Task 6 Step 1 spike, before the rest of the wiring.
