import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle, XCircle } from 'lucide-react';
import { useAppSelector } from '../../../../store/hooks';
import { voteOnMerge, authorDecideMerge, type MergeProposal } from './mergeApi';
import { useT, type TFunction } from '../../../../i18n';
import styles from './MergeProposalCard.module.scss';

const DECISION_WINDOW_DAYS = 14;

interface MergeProposalCardProps {
  proposal: MergeProposal;
  myVote: string;
  mergeContractId: string;
  canDecide: boolean;
  onAcceptCrossContract?: (proposal: MergeProposal) => Promise<void>;
  onChange?: () => void;
}

function formatDaysLeft(createdAt: number, t: TFunction): string {
  // `createdAt` is a millisecond epoch in demo data (every demo contract emits
  // Date.now(), and formatTimeAgo assumes ms). Tolerate a seconds epoch too so
  // the countdown stays correct whichever unit the real contract returns.
  const createdMs = createdAt > 1e12 ? createdAt : createdAt * 1000;
  const elapsedMs = Date.now() - createdMs;
  const remainingMs = (DECISION_WINDOW_DAYS * 24 * 60 * 60 * 1000) - elapsedMs;
  if (remainingMs <= 0) return t('deliberation.merge.card.status.expired', 'expired');
  const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return days === 1
    ? t('deliberation.merge.card.dayOneLeft', '1 day left to decide')
    : t('deliberation.merge.card.daysLeft', '{n} days left to decide', { n: days });
}

const MergeProposalCard: React.FC<MergeProposalCardProps> = ({
  proposal, myVote, mergeContractId, canDecide, onAcceptCrossContract, onChange,
}) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);
  const [voting, setVoting] = useState(false);
  const [deciding, setDeciding] = useState(false);

  const proposerProfile = profiles[proposal.proposer];
  const proposerName = proposerProfile
    ? `${proposerProfile.firstName ?? ''} ${proposerProfile.lastName ?? ''}`.trim() || proposal.proposer.slice(0, 8)
    : proposal.proposer.slice(0, 8);

  const totalVotes = proposal.forCount + proposal.againstCount;
  const supportPct = totalVotes === 0 ? 0 : Math.round((proposal.forCount / totalVotes) * 100);

  const handleVote = async (vote: 'for' | 'against') => {
    if (!serverUrl || !publicKey || voting) return;
    setVoting(true);
    try {
      await voteOnMerge(serverUrl, publicKey, mergeContractId, proposal.id, vote);
      if (onChange) onChange();
    } catch { /* silent */ }
    finally { setVoting(false); }
  };

  const handleDecide = async (decision: 'accept' | 'reject') => {
    if (!serverUrl || !publicKey || deciding) return;
    setDeciding(true);
    try {
      await authorDecideMerge(serverUrl, publicKey, mergeContractId, proposal.id, decision);
      if (decision === 'accept' && onAcceptCrossContract) {
        await onAcceptCrossContract(proposal);
      }
      if (onChange) onChange();
    } catch { /* silent */ }
    finally { setDeciding(false); }
  };

  const isPending = proposal.status === 'pending';
  const statusClass = proposal.status === 'accepted' ? styles.accepted
    : proposal.status === 'rejected' ? styles.rejected
    : proposal.status === 'expired' ? styles.expired
    : '';

  return (
    <div className={`${styles.card} ${statusClass}`}>
      <div className={styles.header}>
        <div className={styles.sourceLink}>{t('deliberation.merge.card.source', 'Source initiative')} · {proposal.sourceInitiativeId.slice(0, 10)}…</div>
        <span className={`${styles.statusBadge} ${statusClass}`}>
          {proposal.status && t(`deliberation.merge.card.status.${proposal.status}`, proposal.status)}
        </span>
      </div>

      <div className={styles.proposer}>{t('deliberation.merge.card.proposedBy', 'proposed by {name}', { name: proposerName })}</div>

      <p className={styles.rationale}>"{proposal.rationale}"</p>

      <div className={styles.voteBar}>
        <div className={styles.voteBarText}>
          <span>{t('deliberation.merge.card.tally', 'Community: {forCount} for · {againstCount} against', { forCount: proposal.forCount, againstCount: proposal.againstCount })}</span>
          <span className={styles.pct}>{t('deliberation.merge.card.support', '{pct}% support', { pct: supportPct })}</span>
        </div>
        <div className={styles.voteBarTrack}>
          <div className={styles.voteBarFill} style={{ width: `${supportPct}%` }} />
        </div>
      </div>

      {isPending && (
        <div className={styles.actions}>
          <div className={styles.voteButtons}>
            <button
              className={`${styles.voteBtn} ${myVote === 'for' ? styles.voted : ''}`}
              onClick={() => handleVote('for')}
              disabled={voting}
            >
              <ThumbsUp size={12} /> {t('deliberation.merge.card.voteFor', 'Vote For')}
            </button>
            <button
              className={`${styles.voteBtn} ${myVote === 'against' ? styles.voted : ''}`}
              onClick={() => handleVote('against')}
              disabled={voting}
            >
              <ThumbsDown size={12} /> {t('deliberation.merge.card.voteAgainst', 'Vote Against')}
            </button>
          </div>
          {canDecide && (
            <div className={styles.decideButtons}>
              <button className={styles.acceptBtn} onClick={() => handleDecide('accept')} disabled={deciding}>
                <CheckCircle size={12} /> {t('deliberation.merge.card.accept', 'Accept Merge')}
              </button>
              <button className={styles.rejectBtn} onClick={() => handleDecide('reject')} disabled={deciding}>
                <XCircle size={12} /> {t('deliberation.merge.card.reject', 'Reject')}
              </button>
            </div>
          )}
        </div>
      )}

      {isPending && <div className={styles.deadline}>{formatDaysLeft(proposal.createdAt, t)}</div>}
    </div>
  );
};

export default MergeProposalCard;
