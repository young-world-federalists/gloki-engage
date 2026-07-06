import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, Plus, Minus, ChevronDown } from 'lucide-react';
import type { FlowProps } from '../types';
import { useFlowContract } from '../shared/useFlowContract';
import { getHintSeen, markHintSeen } from '../../../onboarding/welcomeHints';
import * as api from './qvApi';
import * as approvalApi from './approvalApi';
import { useAppSelector } from '../../../../store/hooks';
import { useT } from '../../../../i18n';
import { Button, ProgressBar, UserIdentity } from '../../../shared';
import { displayNameFor } from '../../../../utils/displayName';
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
  // S19 M2: the how-hearts-work prose folds behind an inline expand — open on a
  // user's very first ballot (north star 1), collapsed on every later one.
  const [guideOpen, setGuideOpen] = useState(() => !getHintSeen('qvGuide'));

  // "Voted" = this member already has an allocation (hard-lock once cast). FOR OURI:
  // derived client-side from get_my_allocation; no new contract method needed.
  const hasVoted = Object.keys(myAllocation).length > 0;

  // The one-time hint burns only once a ballot actually renders — a mount that
  // dies in the deploy/error path must not cost the user their one expanded read.
  useEffect(() => {
    if (isReady && !hasError && !hasVoted) markHintSeen('qvGuide');
  }, [isReady, hasError, hasVoted]);

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

  const authorName = (key: string): string => displayNameFor(profiles[key], key);

  const turnoutFooter = (
    <div className={styles.turnout}>
      <div className={styles.turnoutHead}>
        <span>{t('mechanisms.qv.turnoutLabel', 'Community turnout')}</span>
        {/* Plain language (S17): the turnoutNote below owns the {target}% explanation. */}
        <span>{t('mechanisms.qv.turnoutValue', '{pct}% have voted', { pct: turnoutPct })}</span>
      </div>
      <ProgressBar
        size="md"
        variant="neutral"
        value={turnoutPct}
        fillPct={turnoutFillPct}
        label={t('mechanisms.qv.turnoutLabel', 'Community turnout')}
      />
      <div className={styles.turnoutNote}>
        {t('mechanisms.qv.turnoutNote', 'The vote completes when {target}% of members have taken part.', { target: TURNOUT_TARGET })}
      </div>
    </div>
  );

  // Folded by default (S19 M2): the per-solution bars stay visible — the key is
  // reference material, not the signal itself.
  const regionKey = (
    <details className={styles.dcard}>
      <summary className={styles.dsummary}>
        <span>{t('mechanisms.qv.regionKeyToggle', 'Region colour key')}</span>
        <ChevronDown size={16} className={styles.chev} aria-hidden />
      </summary>
      <div className={styles.keygrid}>
        {REGIONS.map((rg) => (
          <div key={rg.id} className={styles.keyitem}>
            <span className={styles.sw} style={{ backgroundColor: regionColorVar(rg.id) }} aria-hidden="true" />
            {rg.label}
          </div>
        ))}
      </div>
    </details>
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
          {/* One ballot-header block: open-status line, live support meter, and the
              folded how-hearts-work prose + privacy line (S19 M2 recomposition). */}
          <div className={styles.guide}>
            <div className={styles.status} role="status">
              <span className={styles.dot} aria-hidden="true" />
              {t('mechanisms.qv.statusOpen', 'Voting open · {n} solutions', { n: ballot.length })}
            </div>
            <ProgressBar
              size="md"
              value={poolUsedPct}
              label={t('mechanisms.qv.supportUsed', 'Support used')}
            />
            <div className={styles.guideMeta}>
              <span className={styles.hint}>
                {t('mechanisms.qv.supportUsedPct', '{pct}% of your support used', { pct: Math.round(poolUsedPct) })}
              </span>
              <button
                type="button"
                className={styles.guideToggle}
                aria-expanded={guideOpen}
                onClick={() => setGuideOpen((o) => !o)}
              >
                {t('mechanisms.qv.guideToggle', 'How hearts work')}
                <ChevronDown size={16} className={styles.chev} aria-hidden />
              </button>
            </div>
            {guideOpen && (
              <div className={styles.guideBody}>
                <p className={styles.guideText}>
                  {t('mechanisms.qv.guide', 'Everyone here has the same set of hearts. Tap ♥ to back what you care about — spreading them across solutions costs less than piling them onto one.')}
                </p>
                <p className={styles.guidePrivacy}>
                  {t('mechanisms.qv.disclosure', 'Your hearts are visible to the community and counted in the public tally — your vote is attributable, not secret.')}
                </p>
              </div>
            )}
          </div>

          <ul className={styles.ballot}>
          {ballot.map((s, i) => {
            const hearts = draft[s.id] || 0;
            const detailCount = s.commitments.length + s.metrics.length;
            return (
              <li key={s.id} className={styles.sol}>
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
                {detailCount > 0 && (
                  <details className={styles.dcard}>
                    <summary className={styles.dsummary}>
                      <span>{t('mechanisms.qv.commitsMetricsN', 'Commitments & metrics ({n})', { n: detailCount })}</span>
                      <ChevronDown size={16} className={styles.chev} aria-hidden />
                    </summary>
                    <div className={styles.dinner}><ul>{[...s.commitments, ...s.metrics].map((x, k) => <li key={k}>{x}</li>)}</ul></div>
                  </details>
                )}
              </li>
            );
          })}
          </ul>

          <Button variant="primary" size="lg" fullWidth onClick={handleSubmitAllocation} loading={submitting} disabled={spent === 0}>
            {t('mechanisms.qv.cast', 'Cast my votes')}
          </Button>

          {turnoutFooter}
        </>
      ) : (
        <>
          <div className={styles.votedHead}>
            <div className={styles.status} role="status">
              <span className={`${styles.dot} ${styles.dotDone}`} aria-hidden="true" />
              {t('mechanisms.qv.statusVoted', 'You’ve voted')}
            </div>
            <p className={styles.statusSub}>{t('mechanisms.qv.votedSub', 'Live results below · votes can’t be changed')}</p>
          </div>

          <ul className={styles.ballot}>
          {[...ballot].sort((a, b) => (results[b.id] || 0) - (results[a.id] || 0)).map((s, idx) => {
            const total = results[s.id] || 0;
            const breakdown = regionBreakdown(s.id);
            const sumVotes = Object.values(breakdown).reduce((x, y) => x + (y || 0), 0) || 1;
            const myHearts = draft[s.id] || 0;
            return (
              <li key={s.id} className={styles.sol}>
                <div className={styles.solHead}>
                  <span className={styles.solNum}>{t('mechanisms.qv.solutionN', 'Solution {i} of {n}', { i: idx + 1, n: ballot.length })}</span>
                  {s.reviewed && <span className={styles.reviewed}>{t('mechanisms.qv.expertReviewed', 'expert reviewed')}</span>}
                </div>
                <p className={styles.solText}>{s.text}</p>
                <div className={styles.yourVote}>
                  <span className={styles.yourVoteLbl}>{t('mechanisms.qv.yourVote', 'Your vote')}</span>
                  <span className={styles.yourVoteHearts} role="img" aria-label={t('mechanisms.qv.heartsAria', '{n} hearts of support', { n: myHearts })}>
                    {myHearts === 0 ? '—' : Array.from({ length: myHearts }).map((_, k) => (
                      <Heart key={k} size={16} fill="currentColor" aria-hidden="true" />
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
                  <details className={styles.dcard}>
                    <summary className={styles.dsummary}>
                      <span>{t('mechanisms.qv.commitsMetricsN', 'Commitments & metrics ({n})', { n: s.commitments.length + s.metrics.length })}</span>
                      <ChevronDown size={16} className={styles.chev} aria-hidden />
                    </summary>
                    <div className={styles.dinner}><ul>{[...s.commitments, ...s.metrics].map((x, k) => <li key={k}>{x}</li>)}</ul></div>
                  </details>
                )}
              </li>
            );
          })}
          </ul>

          {regionKey}
          {turnoutFooter}
        </>
      )}
    </div>
  );
};

export default QVFlow;
