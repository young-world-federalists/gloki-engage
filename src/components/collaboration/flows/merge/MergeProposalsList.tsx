import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { useFlowContract } from '../shared/useFlowContract';
const mergeCode = '';import { getMergeProposals, getMyMergeVote, type MergeProposal } from './mergeApi';
import { markMergedInto, addCoAuthor, getInitiativeRoles } from '../../../../services/initiativeRoles';
import { addNotification } from '../../../../store/slices/notificationsSlice';
import MergeProposalCard from './MergeProposalCard';
import MergeProposalSubmitModal from './MergeProposalSubmitModal';
import { useT } from '../../../../i18n';
import styles from './MergeProposalsList.module.scss';

interface MergeProposalsListProps {
  targetInitiativeId: string;
  targetTitle: string;
  targetCommunityId: string;
  canDecide: boolean;
  onCountChange?: (n: number) => void;
}

const MergeProposalsList: React.FC<MergeProposalsListProps> = ({
  targetInitiativeId, targetTitle, targetCommunityId, canDecide, onCountChange,
}) => {
  const t = useT();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const { contractId, isReady, isDeploying, hasError, errorMessage, retry } = useFlowContract(
    `${targetInitiativeId}_merge`,
    'merge',
    'merge_contract.py',
    mergeCode,
    targetInitiativeId,
    'mergeContractId',
  );

  const [proposals, setProposals] = useState<MergeProposal[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [showSubmit, setShowSubmit] = useState(false);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    const list = await getMergeProposals(serverUrl, publicKey, contractId);
    setProposals(list);
    if (onCountChange) onCountChange(list.length);
    const votes: Record<string, string> = {};
    for (const p of list) {
      if (p.status === 'pending') {
        votes[p.id] = await getMyMergeVote(serverUrl, publicKey, contractId, p.id);
      }
    }
    setMyVotes(votes);
  }, [serverUrl, publicKey, contractId, onCountChange]);

  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  const handleAcceptCrossContract = useCallback(async (proposal: MergeProposal) => {
    if (!serverUrl || !publicKey) return;
    try {
      await markMergedInto(serverUrl, publicKey, proposal.sourceInitiativeId, targetInitiativeId);
    } catch { /* non-fatal */ }

    try {
      const sourceRoles = await getInitiativeRoles(serverUrl, publicKey, proposal.sourceInitiativeId);
      const toPromote = new Set<string>([proposal.proposer]);
      if (sourceRoles.author) toPromote.add(sourceRoles.author);
      for (const k of sourceRoles.coAuthors) toPromote.add(k);
      for (const k of toPromote) {
        try {
          await addCoAuthor(serverUrl, publicKey, targetInitiativeId, k);
        } catch { /* non-fatal per-entry */ }
      }
    } catch { /* non-fatal */ }

    dispatch(addNotification({
      type: 'merge_absorbed',
      payload: {
        sourceInitiativeId: proposal.sourceInitiativeId,
        targetInitiativeId,
        targetTitle,
        communityId: targetCommunityId,
      },
    }));
  }, [serverUrl, publicKey, targetInitiativeId, targetCommunityId, targetTitle, dispatch]);

  if (hasError) {
    return (
      <div className={styles.error}>
        <p>{errorMessage || t('deliberation.merge.list.loadError', 'Failed to load merge proposals.')}</p>
        <button onClick={retry} className={styles.retryBtn}>{t('common.retry', 'Try again')}</button>
      </div>
    );
  }

  if (isDeploying || !isReady || !contractId) {
    return <p className={styles.loading}>{t('deliberation.merge.list.settingUp', 'Setting up merge contract…')}</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('deliberation.merge.list.title', 'Merge Proposals')}</h3>
        <button className={styles.proposeBtn} onClick={() => setShowSubmit(true)}>
          <Plus size={14} /> {t('deliberation.merge.list.propose', 'Propose Merge')}
        </button>
      </div>

      {proposals.length === 0 && (
        <p className={styles.emptyText}>{t('deliberation.merge.list.empty', 'No merge proposals yet.')}</p>
      )}

      {proposals.map((p) => (
        <MergeProposalCard
          key={p.id}
          proposal={p}
          myVote={myVotes[p.id] ?? ''}
          mergeContractId={contractId}
          canDecide={canDecide}
          onAcceptCrossContract={handleAcceptCrossContract}
          onChange={refresh}
        />
      ))}

      {showSubmit && (
        <MergeProposalSubmitModal
          targetInitiativeId={targetInitiativeId}
          targetTitle={targetTitle}
          targetCommunityId={targetCommunityId}
          mergeContractId={contractId}
          onClose={() => setShowSubmit(false)}
          onSubmitted={refresh}
        />
      )}
    </div>
  );
};

export default MergeProposalsList;
