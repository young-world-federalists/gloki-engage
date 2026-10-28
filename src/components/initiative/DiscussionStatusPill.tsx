import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { resolveInitiativeStageContract } from '../../services/contracts/initiative';
import { getComments, getCommentVotes } from '../collaboration/flows/discussion/discussionApi';
import { computeDiscussionStatus, STATUS_META, type DiscussionStatus } from '../../utils/discussionStatus';
import Badge from '../shared/Badge';
import styles from './DiscussionStatusPill.module.scss';

/**
 * The five-band status's accessible name (S35 F1/F4): the scoped "Consensus
 * among {n} Gloki participants in {community}" sentence for `consensus`,
 * otherwise the plain "Causes discussion: {word}" sentence. Exported so
 * surfaces that fold the status into a larger control's own `aria-label`
 * (e.g. `DiscussionPill`, S35 fix-round F1) can compute it without rendering
 * a second accessible name for the same information.
 */
export function statusAccessibleName(
  t: ReturnType<typeof useT>,
  status: DiscussionStatus,
  communityName?: string,
): string {
  const meta = STATUS_META[status.key];
  const word = t(meta.labelKey, meta.labelDefault);
  if (status.key !== 'consensus') {
    return t('causes.status.aria', 'Causes discussion: {word}', { word });
  }
  if (!communityName) {
    return t('causes.status.scopedNoCommunity', 'Consensus among {n} Gloki participants', {
      n: status.participants,
    });
  }
  return t('causes.status.scoped', 'Consensus among {n} Gloki participants in {community}', {
    n: status.participants,
    community: communityName,
  });
}

export interface DiscussionStatusBadgeProps {
  status: DiscussionStatus;
  /** Community display name — feeds the scoped Consensus sentence (S35 F4). */
  communityName?: string;
  className?: string;
  /**
   * When true, the badge carries no accessible name of its own (`aria-hidden`,
   * no `aria-label`/`title`) — for a host control that already folds the
   * status word into its own `aria-label` (S35 fix-round F1), so the status
   * isn't announced twice.
   */
  decorative?: boolean;
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
 * the Badge's leading dot + accessible name alone carry the status. Measured
 * with `ResizeObserver` (not just on word change) so a card that resizes after
 * mount — orientation change, sidebar collapse, font load — re-evaluates.
 */
export const DiscussionStatusBadge: React.FC<DiscussionStatusBadgeProps> = ({
  status,
  communityName,
  className,
  decorative,
}) => {
  const t = useT();
  const meta = STATUS_META[status.key];
  const word = t(meta.labelKey, meta.labelDefault);
  const scoped = statusAccessibleName(t, status, communityName);

  const wordRef = useRef<HTMLSpanElement | null>(null);
  const overflowRef = useRef(false);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const el = wordRef.current;
    if (!el) return;
    const measure = () => {
      const next = el.scrollWidth > el.clientWidth;
      if (next !== overflowRef.current) {
        overflowRef.current = next;
        setOverflow(next);
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
  }, [word]);

  const badge = (
    <Badge
      tone={meta.tone}
      dot
      size="sm"
      className={overflow ? `${styles.dotOnly} ${className ?? ''}` : className}
      aria-label={decorative ? undefined : scoped}
      title={decorative ? undefined : scoped}
    >
      <span ref={wordRef} className={styles.word}>
        {word}
      </span>
    </Badge>
  );

  return decorative ? <span aria-hidden="true">{badge}</span> : badge;
};

export interface DiscussionStatusPillProps {
  initiativeId: string;
  /** Community display name — feeds the scoped Consensus sentence (S35 F4). */
  communityName?: string;
  className?: string;
  /**
   * When true, forwarded to {@link DiscussionStatusBadge} so the badge carries
   * no accessible name of its own — for a host control (e.g. a card's
   * expand/collapse toggle) that folds the status word into its own
   * `aria-label` instead (S35 fix-round F4).
   */
  decorative?: boolean;
  /**
   * Called whenever a status is computed, so a host component can fold the
   * status name into its own `aria-label` without re-fetching (S35 fix-round
   * F4). Not called while loading or when no discussion contract exists yet.
   */
  onStatus?: (status: DiscussionStatus) => void;
}

/**
 * Fetching wrapper around {@link DiscussionStatusBadge}: resolves the
 * initiative's discussion sub-contract (read-only, NEVER `useFlowContract` —
 * the S11 lesson) then fetches comments + votes and computes the band.
 *
 * Renders nothing while loading or when no discussion contract exists yet — a
 * card must not show "New" for a problem whose discussion has not started.
 */
export const DiscussionStatusPill: React.FC<DiscussionStatusPillProps> = ({
  initiativeId,
  communityName,
  className,
  decorative,
  onStatus,
}) => {
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const [status, setStatus] = useState<DiscussionStatus | null>(null);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

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
        const next = computeDiscussionStatus(comments, votes);
        setStatus(next);
        onStatusRef.current?.(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, initiativeId]);

  if (!status) return null;
  return <DiscussionStatusBadge status={status} communityName={communityName} className={className} decorative={decorative} />;
};

export default DiscussionStatusPill;
