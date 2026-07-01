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
 * current user cannot participate. Pure reads (no `allocate` import) so no write
 * path leaks past the gate. Mirrors QVFlow's reviewed-only ballot build; renders
 * solution text + byline + live tally, with no steppers and no Cast button.
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
