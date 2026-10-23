import React, { useEffect, useId, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useT } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { resolveInitiativeStageContract } from '../../services/contracts/initiative';
import { getComments, getCommentVotes, type Comment, type CommentVote } from '../collaboration/flows/discussion/discussionApi';
import { computeDiscussionStatus, type DiscussionStatus } from '../../utils/discussionStatus';
import { rankCauses, TOP_CAUSES_CARRIED, type CauseRank } from '../../utils/causes';
import { displayNameFor } from '../../utils/displayName';
import { Card, Badge, EmptyState, UserIdentity } from '../shared';
import { DiscussionStatusBadge, statusAccessibleName } from './DiscussionStatusPill';
import styles from './TopCausesPanel.module.scss';

export interface TopCausesPanelProps {
  initiativeId: string;
  /** Community display name — feeds the scoped Consensus sentence on the
   *  header's DiscussionStatusBadge (S35 F4). Omit to fall back to the
   *  unscoped sentence. */
  communityName?: string;
  /** The Solutions board's own solution list — used only to count how many
   *  solutions address each cause; no fetch of its own. */
  solutions: Array<{ id: string; causeId?: string }>;
  /** Called with the freshly computed ranks after every fetch, so the
   *  Solutions board can populate its cause-select without a second
   *  fetch (S35 D5). */
  onCauses?: (ranks: CauseRank[]) => void;
  /** Called with the raw comments + votes behind those ranks (Task 14) — lets
   *  the Solutions board compute `rankWriters`/assessor eligibility without a
   *  second fetch of the discussion sub-contract. */
  onDiscussionData?: (d: { comments: Comment[]; votes: CommentVote[] }) => void;
}

/**
 * Read-only "Top causes" roll-up shown on the Solutions board (S35 rulings
 * D5/F2). Resolves the initiative's discussion sub-contract, fetches
 * comments + votes, and computes the same `rankCauses` ranking the Causes
 * page shows — so the add-solution cause select and this panel are always in
 * lockstep.
 *
 * Read-only on mount by design (mirrors DiscussionPill/DiscussionStatusPill):
 * looks up the stored discussion sub-contract via
 * `resolveInitiativeStageContract` and NEVER deploys one (the S11 lesson —
 * `useFlowContract` in a display component silently deploys). Renders nothing
 * until that lookup + fetch resolves once.
 */
const TopCausesPanel: React.FC<TopCausesPanelProps> = ({ initiativeId, communityName, solutions, onCauses, onDiscussionData }) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [ranks, setRanks] = useState<CauseRank[]>([]);
  const [status, setStatus] = useState<DiscussionStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();

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
        if (cancelled) return;
        const [comments, votes] = result ?? [[], []];
        const computed = rankCauses(comments, votes);
        setRanks(computed);
        setStatus(comments.length > 0 ? computeDiscussionStatus(comments, votes) : null);
        onCauses?.(computed);
        onDiscussionData?.({ comments, votes });
      })
      .catch(() => {
        // Task 14 fix-round 1 (F1) — the success path below always calls
        // onDiscussionData (even with empty arrays, when there's no
        // discussion sub-contract to resolve); this .catch must match, or
        // SolutionsBoard's discussionReady flag never flips on a failed
        // fetch and the eligibility ladder stays stuck waiting forever.
        if (!cancelled) { setRanks([]); setStatus(null); onDiscussionData?.({ comments: [], votes: [] }); }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, initiativeId, onCauses, onDiscussionData]);

  if (!loaded) return null;

  const rows = ranks.slice(0, TOP_CAUSES_CARRIED);
  const solutionCountFor = (causeId: string) => solutions.filter((s) => s.causeId === causeId).length;
  const toggleTitleText = t('causes.panel.title', 'Top causes ({n})', { n: rows.length });
  // The toggle button's own accessible name (S35 fix-round F4): the status
  // badge inside it is `decorative`, so its name is folded in here instead of
  // being announced a second time.
  const toggleAriaLabel = status
    ? `${toggleTitleText}. ${statusAccessibleName(t, status, communityName)}`
    : undefined;

  return (
    <Card className={styles.card} padded={false}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={toggleAriaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.toggleTitle}>
          {toggleTitleText}
        </span>
        {status && <DiscussionStatusBadge status={status} communityName={communityName} decorative />}
        {open ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
      </button>
      {open && (
        <div id={panelId} className={styles.body}>
          {rows.length === 0 ? (
            <EmptyState
              compact
              title={t('causes.none', 'No causes ranked yet — start in the Causes discussion.')}
            />
          ) : (
            <ul className={styles.list}>
              {rows.map((r) => (
                <li key={r.comment.id} className={styles.row}>
                  <span className={styles.rank}>{t('causes.rank', '#{n}', { n: r.rank })}</span>
                  <div className={styles.rowMain}>
                    <p className={styles.rowText}>{r.comment.text}</p>
                    <div className={styles.rowMeta}>
                      <UserIdentity
                        name={displayNameFor(profiles[r.comment.author], r.comment.author)}
                        countryCode={profiles[r.comment.author]?.country}
                        size="sm"
                      />
                      <span
                        className={styles.score}
                        aria-label={t('causes.vote.score', 'Net score {n}', { n: r.score })}
                      >
                        {r.score > 0 ? `+${r.score}` : r.score}
                      </span>
                      <Badge tone="neutral" size="sm">
                        {(() => {
                          const k = solutionCountFor(r.comment.id);
                          return t(
                            k === 1 ? 'causes.panel.solutions.one' : 'causes.panel.solutions.many',
                            k === 1 ? '1 solution' : '{k} solutions',
                            { k },
                          );
                        })()}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
};

export default TopCausesPanel;
