import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useT } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { resolveInitiativeStageContract } from '../../services/contracts/initiative';
import { getComments, getCommentVotes } from '../collaboration/flows/discussion/discussionApi';
import { computeDiscussionStatus, type DiscussionStatus } from '../../utils/discussionStatus';
import { DiscussionStatusBadge } from './DiscussionStatusPill';
import styles from './DiscussionPill.module.scss';

export interface DiscussionPillProps {
  initiativeId: string;
  communityId: string;
  hostServer: string;
  hostAgent: string;
  /** Community display name — feeds the S35 F4 scoped Consensus sentence. Omit
   *  where a name isn't in scope; the badge's aria then reads without one. */
  communityName?: string;
  className?: string;
}

/**
 * The persistent per-initiative **Discussion** button (S16 IA decision:
 * discussion is a function available at every stage, not a pipeline step).
 * Rendered next to the InitiativeStageStrip; navigates to the initiative's
 * discussion page and shows a live comment count when a discussion exists.
 *
 * Read-only on mount by design: it looks up the stored discussion sub-contract
 * via `resolveInitiativeStageContract` and NEVER deploys one (the S11 lesson —
 * `useFlowContract` in a display component silently deploys). If no discussion
 * has started yet the count stays absent and the page itself deploys on real
 * user intent.
 */
const DiscussionPill: React.FC<DiscussionPillProps> = ({
  initiativeId,
  communityId,
  hostServer,
  hostAgent,
  communityName,
  className,
}) => {
  const t = useT();
  const navigate = useNavigate();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<DiscussionStatus | null>(null);

  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'discussionContractId')
      .then((stageContract) => {
        if (cancelled || !stageContract) return null;
        return Promise.all([
          getComments(serverUrl, publicKey, stageContract.contractId),
          getCommentVotes(serverUrl, publicKey, stageContract.contractId),
        ]);
      })
      .then((result) => {
        if (cancelled || !result) return;
        const [list, votes] = result;
        setCount(list.filter((c) => !c.parentId && !c.deleted).length); // a cause = a root comment (D3/D4)
        setStatus(computeDiscussionStatus(list, votes));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, initiativeId]);

  // Always the neutral function label (W3, campaign §5 rule 10): the live
  // comment count — not a stage-styled skin — signals activity.
  const label = t('stage.discussionPill', 'Causes');
  const ariaLabel =
    count != null && count > 0
      ? t('stage.discussionPillCount', '{label} — {n} causes', { label, n: count })
      : label;

  return (
    <button
      type="button"
      className={`${styles.pill} ${className ?? ''}`}
      onClick={() =>
        navigate(
          `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${initiativeId}/discussion`,
        )
      }
      aria-label={ariaLabel}
    >
      <MessageCircle size={16} aria-hidden />
      <span>{label}</span>
      {count != null && count > 0 && (
        <span className={styles.count} aria-hidden>
          {count}
        </span>
      )}
      {status && <DiscussionStatusBadge status={status} communityName={communityName} />}
    </button>
  );
};

export default DiscussionPill;
