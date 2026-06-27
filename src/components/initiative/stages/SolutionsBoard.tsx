import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp } from 'lucide-react';

import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
import * as api from '../../collaboration/flows/voting/approvalApi';
import { useAppSelector } from '../../../store/hooks';
import { Button, UserIdentity, InfoDisclosure, Modal } from '../../shared';
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
