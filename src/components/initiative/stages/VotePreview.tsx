import React, { useEffect, useState, useCallback } from 'react';
import { resolveInitiativeStageContract } from '../../../services/contracts/initiative';
import { getProposals, getResults } from '../../collaboration/flows/voting/qvApi';
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
 * current user cannot participate. Genuinely read-only: it resolves the already
 * -registered vote/proposals sub-contracts via `resolveInitiativeStageContract`
 * (a pure `contractRead` — never `useFlowContract`, which can deploy + register)
 * and reads proposals/results. If the vote contract hasn't been initialized yet,
 * there is nothing to preview and it renders null — no deploy, no write path past
 * the gate. Mirrors QVFlow's reviewed-only ballot build; no steppers, no Cast.
 */
const VotePreview: React.FC<VotePreviewProps> = ({ initiativeId }) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [qv, setQv] = useState<Record<string, QvProposal>>({});
  const [approval, setApproval] = useState<Record<string, ApprovalProposal>>({});
  const [results, setResults] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    try {
      // Read-only: resolve the already-registered sub-contracts (no deploy/register).
      const [voteRef, propRef] = await Promise.all([
        resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'voteContractId'),
        resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'proposalsContractId'),
      ]);
      if (!voteRef?.contractId) return; // nothing initialized yet → nothing to preview
      const [p, r, ap] = await Promise.all([
        getProposals(serverUrl, publicKey, voteRef.contractId),
        getResults(serverUrl, publicKey, voteRef.contractId),
        propRef?.contractId ? getApprovalProposals(serverUrl, publicKey, propRef.contractId) : Promise.resolve(null),
      ]);
      setQv((p as Record<string, QvProposal>) || {});
      setResults((r as Record<string, number>) || {});
      if (ap) setApproval(ap as Record<string, ApprovalProposal>);
    } catch (err) { console.error('VotePreview fetch failed:', err); }
  }, [serverUrl, publicKey, initiativeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
