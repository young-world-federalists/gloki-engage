import React, { useEffect, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { resolveInitiativeStageContract } from '../../../services/contracts/initiative';
import { getProposals, getResults } from '../../collaboration/flows/voting/qvApi';
import { getProposals as getApprovalProposals, getImpactAssessments, type ImpactAssessment } from '../../collaboration/flows/voting/approvalApi';
import { getComments, getCommentVotes } from '../../collaboration/flows/discussion/discussionApi';
import { rankCauses, type CauseRank } from '../../../utils/causes';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { UserIdentity } from '../../shared';
import { displayNameFor } from '../../../utils/displayName';
import CauseLine from '../CauseLine';
import ImpactAssessmentCard from '../ImpactAssessmentCard';
import styles from './VotePreview.module.scss';

interface QvProposal { id: string; text: string; author: string; timestamp: string | number }
interface ApprovalProposal {
  id: string; text: string; author: string;
  commitments?: string[]; metrics?: string[]; expertReviews?: { metrics: string[] }[]; causeId?: string;
}

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
  // Causes ranked in the discussion contract (S35 F2, Task 11) — resolved
  // read-only alongside the vote/proposals sub-contracts below.
  const [causes, setCauses] = useState<CauseRank[]>([]);
  // Impact assessments (Task 14) — same approval contract as `approval`,
  // isolated so a failed read never blanks the read-only preview.
  const [assessments, setAssessments] = useState<ImpactAssessment[]>([]);

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    try {
      // Read-only: resolve the already-registered sub-contracts (no deploy/register).
      const [voteRef, propRef, discRef] = await Promise.all([
        resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'voteContractId'),
        resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'proposalsContractId'),
        resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'discussionContractId'),
      ]);
      if (!voteRef?.contractId) return; // nothing initialized yet → nothing to preview
      const [p, r, ap, discussion, ia] = await Promise.all([
        getProposals(serverUrl, publicKey, voteRef.contractId),
        getResults(serverUrl, publicKey, voteRef.contractId),
        propRef?.contractId ? getApprovalProposals(serverUrl, publicKey, propRef.contractId) : Promise.resolve(null),
        discRef?.contractId
          ? Promise.all([
              getComments(serverUrl, publicKey, discRef.contractId),
              getCommentVotes(serverUrl, publicKey, discRef.contractId),
            ]).catch(() => null)
          : Promise.resolve(null),
        propRef?.contractId
          ? getImpactAssessments(serverUrl, publicKey, propRef.contractId).catch(() => [])
          : Promise.resolve([]),
      ]);
      setQv((p as Record<string, QvProposal>) || {});
      setResults((r as Record<string, number>) || {});
      if (ap) setApproval(ap as Record<string, ApprovalProposal>);
      if (discussion) {
        const [comments, votes] = discussion;
        setCauses(rankCauses(comments, votes));
      }
      setAssessments((ia as ImpactAssessment[]) || []);
    } catch (err) { console.error('VotePreview fetch failed:', err); }
  }, [serverUrl, publicKey, initiativeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const list = Object.values(qv).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const merged = list.map((q) => {
    const twin = approval[q.id];
    const reviews = twin?.expertReviews ?? [];
    const found = twin?.causeId ? causes.find((c) => c.comment.id === twin.causeId) : undefined;
    // Task 14 — author-proposed indicators + expert-validated metrics, deduped.
    const metrics = Array.from(new Set([...(twin?.metrics ?? []), ...reviews.flatMap((rv) => rv.metrics)]));
    return {
      id: q.id,
      text: twin?.text ?? q.text,
      author: twin?.author ?? q.author,
      reviewed: reviews.length > 0,
      commitments: twin?.commitments ?? [],
      metrics,
      causeId: twin?.causeId,
      causeText: found?.comment.text,
      causeRank: found?.rank,
      assessments: assessments.filter((a) => a.proposalId === q.id),
    };
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
          <CauseLine
            className={styles.causeChip}
            causeId={s.causeId}
            causeText={s.causeText}
            causeRank={s.causeRank}
            causesLoaded={causes.length > 0}
          />
          <UserIdentity name={displayNameFor(profiles[s.author], s.author)} countryCode={profiles[s.author]?.country} size="sm" />
          <span className={styles.count}>{t('mechanisms.qv.votesCount', '{n} votes', { n: Math.round(results[s.id] || 0) })}</span>
          {s.commitments.length > 0 && (
            <details className={styles.dcard}>
              <summary className={styles.dsummary}>
                <span>{t('mechanisms.qv.measuresN', 'Implementation measures ({n})', { n: s.commitments.length })}</span>
                <ChevronDown size={16} className={styles.chev} aria-hidden />
              </summary>
              <div className={styles.dinner}><ul>{s.commitments.map((x, k) => <li key={k}>{x}</li>)}</ul></div>
            </details>
          )}
          {s.metrics.length > 0 && (
            <details className={styles.dcard}>
              <summary className={styles.dsummary}>
                <span>{t('mechanisms.qv.metricsN', 'Metrics ({n})', { n: s.metrics.length })}</span>
                <ChevronDown size={16} className={styles.chev} aria-hidden />
              </summary>
              <div className={styles.dinner}><ul>{s.metrics.map((x, k) => <li key={k}>{x}</li>)}</ul></div>
            </details>
          )}
          {s.assessments.length > 0 && (
            <details className={styles.dcard}>
              <summary className={styles.dsummary}>
                <span>{t('impact.foldN', 'Impact assessments ({n})', { n: s.assessments.length })}</span>
                <ChevronDown size={16} className={styles.chev} aria-hidden />
              </summary>
              <div className={styles.dinner}>
                {s.assessments.map((a, k) => (
                  <ImpactAssessmentCard key={a.author} assessment={a} index={k + 1} />
                ))}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
};

export default VotePreview;
