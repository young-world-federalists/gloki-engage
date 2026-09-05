import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { resolveInitiativeStageContract } from '../../services/contracts/initiative';
import { getComments, getCommentVotes } from '../collaboration/flows/discussion/discussionApi';
import { computeDiscussionStatus, STATUS_META, type DiscussionStatus } from '../../utils/discussionStatus';
import Badge from '../shared/Badge';
import styles from './DiscussionStatusPill.module.scss';

export interface DiscussionStatusBadgeProps {
  status: DiscussionStatus;
  /** Community display name — feeds the scoped Consensus sentence (S35 F4). */
  communityName?: string;
  className?: string;
}

/**
 * Presentational five-band Causes status badge (S35, rulings D6/F3-F5). Renders
 * from an already-computed {@link DiscussionStatus} — surfaces that already hold
 * comments+votes (the discussion page, `TopCausesPanel`) use this directly so
 * they don't fetch twice. Surfaces that only know the initiative id should use
 * {@link DiscussionStatusPill} instead.
 *
 * Width guard (F5): the word is capped at 12ch and never ellipsized. If it
 * would overflow at narrow widths, the word is hidden off-screen (sr-only) and
 * the Badge's leading dot + accessible name alone carry the status.
 */
export const DiscussionStatusBadge: React.FC<DiscussionStatusBadgeProps> = ({ status, communityName, className }) => {
  const t = useT();
  const meta = STATUS_META[status.key];
  const word = t(meta.labelKey, meta.labelDefault);
  const community = communityName ?? '';
  const scoped =
    status.key === 'consensus'
      ? t('causes.status.scoped', 'Consensus among {n} Gloki participants in {community}', {
          n: status.participants,
          community,
        })
      : t('causes.status.aria', 'Causes discussion: {word}', { word });

  const wordRef = useRef<HTMLSpanElement | null>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = wordRef.current;
    if (!el) return;
    setOverflow(el.scrollWidth > el.clientWidth);
  }, [word]);

  return (
    <Badge
      tone={meta.tone}
      dot
      size="sm"
      className={overflow ? `${styles.dotOnly} ${className ?? ''}` : className}
      aria-label={scoped}
      title={scoped}
    >
      <span ref={wordRef} className={styles.word}>
        {word}
      </span>
    </Badge>
  );
};

export interface DiscussionStatusPillProps {
  initiativeId: string;
  /** Community display name — feeds the scoped Consensus sentence (S35 F4). */
  communityName?: string;
  className?: string;
}

/**
 * Fetching wrapper around {@link DiscussionStatusBadge}: resolves the
 * initiative's discussion sub-contract (read-only, NEVER `useFlowContract` —
 * the S11 lesson) then fetches comments + votes and computes the band.
 *
 * Renders nothing while loading or when no discussion contract exists yet — a
 * card must not show "New" for a problem whose discussion has not started.
 */
export const DiscussionStatusPill: React.FC<DiscussionStatusPillProps> = ({ initiativeId, communityName, className }) => {
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const [status, setStatus] = useState<DiscussionStatus | null>(null);

  useEffect(() => {
    setStatus(null);
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
        const [comments, votes] = result;
        setStatus(computeDiscussionStatus(comments, votes));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, initiativeId]);

  if (!status) return null;
  return <DiscussionStatusBadge status={status} communityName={communityName} className={className} />;
};

export default DiscussionStatusPill;
