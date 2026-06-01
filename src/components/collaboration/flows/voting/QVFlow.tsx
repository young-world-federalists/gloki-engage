import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, Plus, Minus } from 'lucide-react';
import type { FlowProps } from '../types';
import { useFlowContract } from '../shared/useFlowContract';
import CountryBadge from '../shared/CountryBadge';
import * as api from './qvApi';
import { useAppSelector } from '../../../../store/hooks';
import { getCountryColor, getCountryName } from '../../../../utils/countries';
import { useT } from '../../../../i18n';
import { SegmentedControl, Button } from '../../../shared';
import styles from './QVFlow.module.scss';

const qvContractCode = '';

interface Proposal { id: string; text: string; author: string; timestamp: string; }
interface Config { credits_per_voter: number; status: string; }

// The mechanism is quadratic voting, but the voter never sees the math. They tap
// "hearts" (= whole votes) onto proposals; the *cost* of those hearts is
// quadratic (h hearts cost h² from a shared support pool), so piling onto one
// proposal drains the pool fast while spreading is cheap. We store hearts in the
// draft and only convert hearts → credits (h²) when submitting to the contract,
// which keeps the existing sqrt-based results untouched (sqrt(h²) = h).
const heartCost = (hearts: number): number => hearts * hearts;
const heartsFromCredits = (credits: number): number => Math.max(0, Math.round(Math.sqrt(credits)));

const QVFlow: React.FC<FlowProps> = ({ instanceId, parentContractId, stageKey }) => {
  const t = useT();
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(instanceId, 'quadratic_vote', 'qv_contract.py', qvContractCode, parentContractId, stageKey);
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [activeTab, setActiveTab] = useState<'proposals' | 'allocate' | 'results'>('proposals');
  const [proposals, setProposals] = useState<Record<string, Proposal>>({});
  const [config, setConfig] = useState<Config>({ credits_per_voter: 100, status: 'open' });
  const draftInitialized = useRef(false);
  const [allAllocations, setAllAllocations] = useState<Record<string, Record<string, number>>>({});
  const [results, setResults] = useState<Record<string, number>>({});
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // draft maps proposalId -> hearts (whole votes). Quadratic cost applied on top.
  const [draft, setDraft] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setLoading(true);
    try {
      const showDetailedResults = activeTab === 'results';
      const [p, c, ma, aa, r] = await Promise.all([
        api.getProposals(serverUrl, publicKey, contractId),
        api.getConfig(serverUrl, publicKey, contractId),
        api.getMyAllocation(serverUrl, publicKey, contractId),
        showDetailedResults
          ? api.getAllocations(serverUrl, publicKey, contractId)
          : Promise.resolve(null),
        showDetailedResults
          ? api.getResults(serverUrl, publicKey, contractId)
          : Promise.resolve(null),
      ]);
      setProposals((p as Record<string, Proposal>) || {});
      setConfig((c as Config) || { credits_per_voter: 100, status: 'open' });
      const myAlloc = (ma as Record<string, number>) || {};
      if (!draftInitialized.current) {
        // Contract stores credits (h²); rehydrate the draft back into hearts.
        const hearts: Record<string, number> = {};
        for (const [pid, credits] of Object.entries(myAlloc)) {
          const h = heartsFromCredits(credits);
          if (h > 0) hearts[pid] = h;
        }
        setDraft(hearts);
        draftInitialized.current = true;
      }
      setAllAllocations(showDetailedResults ? ((aa as Record<string, Record<string, number>>) || {}) : {});
      setResults(showDetailedResults ? ((r as Record<string, number>) || {}) : {});
    } catch (err) { console.error('Failed to fetch QV data:', err); }
    finally { setLoading(false); }
  }, [activeTab, serverUrl, publicKey, contractId]);

  useEffect(() => { if (isReady) fetchData(); }, [isReady, fetchData]);

  const handleAddProposal = async () => {
    const trimmed = newText.trim();
    if (!serverUrl || !publicKey || !contractId || !trimmed || trimmed.length > 500) return;
    setSubmitting(true);
    try {
      await api.addProposal(serverUrl, publicKey, contractId, trimmed);
      setNewText('');
      await fetchData();
    } catch (err) { console.error('Failed to add proposal:', err); }
    finally { setSubmitting(false); }
  };

  const pool = config.credits_per_voter;
  const spent = Object.values(draft).reduce((sum, h) => sum + heartCost(h), 0);
  const poolUsedPct = pool > 0 ? Math.min((spent / pool) * 100, 100) : 0;

  // Adding heart (h+1) to a proposal already holding h costs (h+1)² − h² = 2h+1.
  const canAddHeart = (proposalId: string): boolean => {
    const h = draft[proposalId] || 0;
    return spent + (2 * h + 1) <= pool;
  };

  const addHeart = (proposalId: string) => {
    if (!canAddHeart(proposalId)) return;
    setDraft((prev) => ({ ...prev, [proposalId]: (prev[proposalId] || 0) + 1 }));
  };

  const removeHeart = (proposalId: string) => {
    setDraft((prev) => {
      const h = prev[proposalId] || 0;
      if (h <= 1) {
        const { [proposalId]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [proposalId]: h - 1 };
    });
  };

  const handleSubmitAllocation = async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setSubmitting(true);
    try {
      // hearts → credits (h²) so the contract's sqrt results read back as whole votes.
      const credits: Record<string, number> = {};
      for (const [pid, h] of Object.entries(draft)) {
        if (h > 0) credits[pid] = heartCost(h);
      }
      await api.allocate(serverUrl, publicKey, contractId, credits);
      setActiveTab('results');
    } catch (err) { console.error('Failed to submit allocation:', err); }
    finally { setSubmitting(false); }
  };

  if (hasError) return (
    <div className={styles.loading}>
      <p>{errorMessage || t('mechanisms.qv.setupError', 'Failed to set up voting.')}</p>
      <Button variant="secondary" size="sm" onClick={retry}>{t('common.retry', 'Try again')}</Button>
    </div>
  );
  if (isDeploying || !isReady) return (
    <div className={styles.loading}>{statusMessage || t('mechanisms.qv.settingUp', 'Setting up voting…')}</div>
  );
  if (loading && Object.keys(proposals).length === 0) return <div className={styles.loading}>{t('common.loading', 'Loading…')}</div>;

  const proposalList = Object.values(proposals).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Country breakdown of votes for a proposal. Credits stored as h², so each
  // voter's contribution is sqrt(credits) = their heart count (whole votes).
  const getCountryQVBreakdown = (proposalId: string): Record<string, number> => {
    const breakdown: Record<string, number> = {};
    for (const [voter, voterAlloc] of Object.entries(allAllocations)) {
      const credits = voterAlloc[proposalId];
      if (!credits) continue;
      const profile = profiles[voter];
      const country = profile?.country || 'OTHER';
      breakdown[country] = (breakdown[country] || 0) + Math.sqrt(credits);
    }
    return breakdown;
  };

  return (
    <div className={styles.container}>
      <SegmentedControl
        fullWidth
        ariaLabel={t('mechanisms.qv.viewToggle', 'Proposals, vote, or results')}
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'proposals', label: t('mechanisms.qv.tabProposals', 'Proposals') },
          { value: 'allocate', label: t('mechanisms.qv.tabVote', 'Vote') },
          { value: 'results', label: t('mechanisms.qv.tabResults', 'Results') },
        ]}
      />

      {activeTab === 'proposals' && (
        <>
          <div className={styles.addForm}>
            <input className={styles.addInput} type="text"
              placeholder={t('mechanisms.qv.addPlaceholder', 'Add a proposal…')}
              value={newText} onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddProposal(); }}
              maxLength={500}
              disabled={submitting} />
            <Button variant="primary" onClick={handleAddProposal}
              loading={submitting} disabled={!newText.trim()}>
              {t('mechanisms.qv.add', 'Add')}
            </Button>
          </div>
          {proposalList.length === 0 ? (
            <p className={styles.noData}>{t('mechanisms.qv.noProposals', 'No proposals yet. Add one above.')}</p>
          ) : (
            <div className={styles.proposalList}>
              {proposalList.map((p) => (
                <div key={p.id} className={styles.proposalCard}>
                  <div className={styles.proposalBody}>
                    <div className={styles.proposalText}>{p.text}</div>
                    <div className={styles.proposalMeta}>
                      <span>{p.author.slice(0, 8)}…</span>
                      <CountryBadge countryCode={profiles[p.author]?.country} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'allocate' && (
        <>
          <p className={styles.intro}>
            {t(
              'mechanisms.qv.intro',
              'Tap ♥ to back what you care about. Piling onto one costs more than spreading out — so even a few people who care deeply get heard.',
            )}
          </p>
          {proposalList.length === 0 ? (
            <p className={styles.noData}>{t('mechanisms.qv.noneToBack', 'No proposals to back yet.')}</p>
          ) : (
            <>
              <div
                className={styles.meter}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(poolUsedPct)}
                aria-label={t('mechanisms.qv.supportUsed', 'Support used')}
              >
                <div className={styles.meterTrack}>
                  <div
                    className={`${styles.meterFill} ${poolUsedPct >= 100 ? styles.meterFull : ''}`}
                    style={{ width: `${poolUsedPct}%` }}
                  />
                </div>
                <span className={styles.meterHint}>
                  {poolUsedPct >= 100
                    ? t('mechanisms.qv.poolFull', 'All your support is in — remove a ♥ to back something else.')
                    : t('mechanisms.qv.poolHint', 'Your support')}
                </span>
              </div>
              <div className={styles.allocateList}>
                {proposalList.map((p) => {
                  const hearts = draft[p.id] || 0;
                  return (
                    <div key={p.id} className={styles.allocateRow}>
                      <div className={styles.allocateLabel}>{p.text}</div>
                      <div className={styles.allocateControls}>
                        <button
                          className={styles.stepperBtn}
                          onClick={() => removeHeart(p.id)}
                          disabled={hearts === 0}
                          aria-label={t('mechanisms.qv.removeHeart', 'Remove support from this proposal')}
                        >
                          <Minus size={16} />
                        </button>
                        <div
                          className={styles.hearts}
                          role="img"
                          aria-label={t('mechanisms.qv.heartsAria', '{n} hearts of support', { n: hearts })}
                        >
                          {hearts === 0 ? (
                            <Heart size={18} className={styles.heartEmpty} aria-hidden="true" />
                          ) : (
                            Array.from({ length: hearts }).map((_, i) => (
                              <Heart key={i} size={18} className={styles.heartFilled} fill="currentColor" aria-hidden="true" />
                            ))
                          )}
                        </div>
                        <button
                          className={styles.stepperBtn}
                          onClick={() => addHeart(p.id)}
                          disabled={!canAddHeart(p.id)}
                          aria-label={t('mechanisms.qv.addHeart', 'Back this proposal')}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.submitRow}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSubmitAllocation}
                  loading={submitting}
                >
                  {t('mechanisms.qv.cast', 'Cast my votes')}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'results' && (
        <>
          {proposalList.length === 0 ? (
            <p className={styles.noData}>{t('mechanisms.qv.noResults', 'No proposals to show results for.')}</p>
          ) : (
            <div className={styles.resultsList}>
              {[...proposalList]
                .sort((a, b) => (results[b.id] || 0) - (results[a.id] || 0))
                .map((p) => {
                  const totalVotes = results[p.id] || 0;
                  const breakdown = getCountryQVBreakdown(p.id);
                  const maxVotes = Math.max(...Object.values(results), 1);
                  return (
                    <div key={p.id} className={styles.resultRow}>
                      <div className={styles.resultLabel}>{p.text}</div>
                      <div className={styles.resultBar}>
                        {Object.entries(breakdown).map(([country, votes]) => (
                          <div key={country} className={styles.resultSegment}
                            style={{ width: `${(votes / maxVotes) * 100}%`, backgroundColor: getCountryColor(country) }}
                            title={`${getCountryName(country)}: ${Math.round(votes)}`} />
                        ))}
                      </div>
                      <div className={styles.resultCount}>
                        {t('mechanisms.qv.votesCount', '{n} votes', { n: Math.round(totalVotes) })}
                      </div>
                    </div>
                  );
                })}
              <div className={styles.participation}>
                {t('mechanisms.qv.participants', '{n} took part', { n: Object.keys(allAllocations).length })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QVFlow;
