import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp } from 'lucide-react';

import type { FlowProps } from '../types';
import { useFlowContract } from '../shared/useFlowContract';
import CountryBadge from '../shared/CountryBadge';
import * as api from './approvalApi';
import { useAppSelector } from '../../../../store/hooks';
import { getCountryColor, getCountryName } from '../../../../utils/countries';
import { getInitiativeRoles, type InitiativeRoles } from '../../../../services/initiativeRoles';
import ExpertEndorseButton from '../../../shared/ExpertEndorseButton';
import { SegmentedControl, Button } from '../../../shared';
import { useT } from '../../../../i18n';
const approvalContractCode = '';import styles from './ApprovalFlow.module.scss';

interface Proposal {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

const ApprovalFlow: React.FC<FlowProps> = ({ instanceId, collaborationId, parentContractId, stageKey }) => {
  const t = useT();
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    instanceId,
    'approval_voting',
    'approval_contract.py',
    approvalContractCode,
    parentContractId,
    stageKey,
  );
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [activeTab, setActiveTab] = useState<'proposals' | 'results'>('proposals');
  const [showHelp, setShowHelp] = useState(false);
  const [proposals, setProposals] = useState<Record<string, Proposal>>({});
  const [approvalCounts, setApprovalCounts] = useState<Record<string, number>>({});
  const [approvals, setApprovals] = useState<Record<string, Record<string, boolean>>>({});
  const [myApprovals, setMyApprovals] = useState<Record<string, boolean>>({});
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [roles, setRoles] = useState<InitiativeRoles | null>(null);
  useEffect(() => {
    if (!serverUrl || !publicKey || !collaborationId) return;
    let cancelled = false;
    getInitiativeRoles(serverUrl, publicKey, collaborationId).then((r) => {
      if (!cancelled) setRoles(r);
    });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, collaborationId]);

  const countApprovals = useCallback((approvalMap: Record<string, Record<string, boolean>>) => {
    const counts: Record<string, number> = {};
    for (const voterApprovals of Object.values(approvalMap)) {
      for (const [proposalId, approved] of Object.entries(voterApprovals)) {
        if (!approved) continue;
        counts[proposalId] = (counts[proposalId] || 0) + 1;
      }
    }
    return counts;
  }, []);

  const sanitizeApprovalCounts = useCallback((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const sanitized: Record<string, number> = {};
    for (const [proposalId, count] of Object.entries(value as Record<string, unknown>)) {
      if (typeof count === 'number' && Number.isFinite(count) && count >= 0) {
        sanitized[proposalId] = count;
      }
    }
    return sanitized;
  }, []);

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setLoading(true);
    try {
      const [p, myApprovalsRes] = await Promise.all([
        api.getProposals(serverUrl, publicKey, contractId),
        api.getMyApprovals(serverUrl, publicKey, contractId),
      ]);

      const proposalMap = (p as Record<string, Proposal>) || {};
      setProposals(proposalMap);
      setMyApprovals((myApprovalsRes as Record<string, boolean>) || {});

      let nextCounts: Record<string, number> = {};
      let nextApprovals: Record<string, Record<string, boolean>> = {};

      try {
        const countsRes = await api.getApprovalCounts(serverUrl, publicKey, contractId);
        nextCounts = sanitizeApprovalCounts(countsRes);
      } catch {
        nextCounts = {};
      }

      if (activeTab === 'results') {
        nextApprovals = (await api.getApprovals(serverUrl, publicKey, contractId) as Record<string, Record<string, boolean>>) || {};
        if (Object.keys(nextCounts).length === 0) {
          nextCounts = countApprovals(nextApprovals);
        }
      } else {
        nextApprovals = {};
        if (Object.keys(nextCounts).length === 0 && Object.keys(proposalMap).length > 0) {
          const fallbackApprovals = (await api.getApprovals(serverUrl, publicKey, contractId) as Record<string, Record<string, boolean>>) || {};
          nextCounts = countApprovals(fallbackApprovals);
        }
      }

      setApprovalCounts(nextCounts);
      setApprovals(nextApprovals);
    } catch (err) {
      console.error('Failed to fetch approval data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, contractId, countApprovals, publicKey, sanitizeApprovalCounts, serverUrl]);

  useEffect(() => {
    if (isReady) fetchData();
  }, [isReady, fetchData]);

  const handleAdd = async () => {
    const trimmed = newText.trim();
    if (!serverUrl || !publicKey || !contractId || !trimmed || trimmed.length > 500) return;
    setSubmitting(true);
    try {
      await api.addProposal(serverUrl, publicKey, contractId, trimmed);
      setNewText('');
      await fetchData();
    } catch (err) {
      console.error('Failed to add proposal:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleApproval = async (proposalId: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    setTogglingId(proposalId);
    try {
      const isApproved = myApprovals[proposalId] === true;
      if (isApproved) {
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

  if (hasError) return (
    <div className={styles.loading}>
      <p>{errorMessage || t('mechanisms.approval.setupError', 'Failed to set up solutions.')}</p>
      <Button variant="secondary" size="sm" onClick={retry}>
        {t('common.retry', 'Try again')}
      </Button>
    </div>
  );
  if (isDeploying || !isReady) return (
    <div className={styles.loading}>{statusMessage || t('mechanisms.approval.settingUp', 'Setting up solutions…')}</div>
  );
  if (loading && Object.keys(proposals).length === 0) return <div className={styles.loading}>{t('common.loading', 'Loading…')}</div>;

  const proposalList = Object.values(proposals).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const getApprovalCount = (proposalId: string): number =>
    approvalCounts[proposalId] || 0;

  const getCountryBreakdown = (proposalId: string): Record<string, number> => {
    const breakdown: Record<string, number> = {};
    for (const [voter, voterApprovals] of Object.entries(approvals)) {
      if (!voterApprovals[proposalId]) continue;
      const profile = profiles[voter];
      const country = profile?.country || 'OTHER';
      breakdown[country] = (breakdown[country] || 0) + 1;
    }
    return breakdown;
  };

  const isMyApproval = (proposalId: string): boolean =>
    myApprovals[proposalId] === true;

  return (
    <div className={styles.container}>
      {/* View toggle */}
      <SegmentedControl
        fullWidth
        ariaLabel={t('mechanisms.approval.viewToggle', 'Solutions or results')}
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'proposals', label: t('mechanisms.approval.tabProposals', 'Solutions') },
          { value: 'results', label: t('mechanisms.approval.tabResults', 'Results') },
        ]}
      />

      <div className={styles.helpSection}>
        <button className={styles.helpToggle} onClick={() => setShowHelp(v => !v)}>
          {showHelp ? t('mechanisms.approval.helpHide', 'Hide explanation') : t('mechanisms.approval.helpShow', 'How does approval voting work?')}
        </button>
        {showHelp && (
          <div className={styles.helpBox}>
            <p>{t('mechanisms.approval.helpBody', 'Review the solutions below and approve as many as you support. Each solution you approve gets one vote from you. The solutions with the most approvals rise to the top.')}</p>
          </div>
        )}
      </div>

      {activeTab === 'proposals' && (
        <>
          {/* Add proposal */}
          <div className={styles.addForm}>
            <input
              className={styles.addInput}
              type="text"
              placeholder={t('mechanisms.approval.addPlaceholder', 'Add a solution...')}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              maxLength={500}
              disabled={submitting}
            />
            <Button
              variant="primary"
              onClick={handleAdd}
              loading={submitting}
              disabled={!newText.trim()}
            >
              {t('mechanisms.approval.add', 'Add')}
            </Button>
          </div>

          {/* Proposal list */}
          {proposalList.length === 0 ? (
            <p className={styles.noData}>{t('mechanisms.approval.noProposals', 'No solutions yet. Add one above.')}</p>
          ) : (
            <div className={styles.proposalList}>
              {proposalList.map((p) => (
                <div key={p.id} className={styles.proposalCard}>
                  <div className={styles.proposalBody}>
                    <div className={styles.proposalText}>{p.text}</div>
                    <div className={styles.proposalMeta}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span>{p.author.slice(0, 8)}...</span>
                        {roles && (
                          <ExpertEndorseButton
                            initiativeId={collaborationId}
                            target={p.author}
                            endorsementCount={roles.endorsementCounts[p.author] ?? 0}
                            isExpert={roles.experts.includes(p.author)}
                            iEndorse={Boolean(publicKey && roles.endorsements[p.author]?.includes(publicKey))}
                            onChange={() => {
                              if (serverUrl && publicKey) {
                                getInitiativeRoles(serverUrl, publicKey, collaborationId).then(setRoles);
                              }
                            }}
                          />
                        )}
                      </div>
                      <CountryBadge countryCode={profiles[p.author]?.country} />
                    </div>
                  </div>
                  <button
                    className={`${styles.approveBtn} ${isMyApproval(p.id) ? styles.approveBtnActive : ''}`}
                    onClick={() => handleToggleApproval(p.id)}
                    disabled={togglingId === p.id}
                  >
                    <ThumbsUp size={16} />
                    <span className={styles.approvalCount}>{getApprovalCount(p.id)}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'results' && (
        <>
          {proposalList.length === 0 ? (
            <p className={styles.noData}>{t('mechanisms.approval.noResults', 'No solutions to show results for.')}</p>
          ) : (
            <div className={styles.resultsList}>
              {[...proposalList]
                .sort((a, b) => getApprovalCount(b.id) - getApprovalCount(a.id))
                .map((p) => {
                  const total = getApprovalCount(p.id);
                  const breakdown = getCountryBreakdown(p.id);
                  const maxApprovals = Math.max(
                    ...proposalList.map((pp) => getApprovalCount(pp.id)),
                    1,
                  );
                  return (
                    <div key={p.id} className={styles.resultRow}>
                      <div className={styles.resultLabel}>{p.text}</div>
                      <div className={styles.resultBar}>
                        {Object.entries(breakdown).map(([country, count]) => (
                          <div
                            key={country}
                            className={styles.resultSegment}
                            style={{
                              width: `${(count / maxApprovals) * 100}%`,
                              backgroundColor: getCountryColor(country),
                            }}
                            title={`${getCountryName(country)}: ${count}`}
                          />
                        ))}
                      </div>
                      <div className={styles.resultCount}>{t('mechanisms.approval.approvalsCount', '{n} approvals', { n: total })}</div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ApprovalFlow;
