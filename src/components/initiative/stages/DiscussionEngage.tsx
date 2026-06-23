import React from 'react';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
import { useDiscussionData } from '../../collaboration/flows/discussion/useDiscussionData';
import CoPresenceBar from '../../collaboration/flows/discussion/CoPresenceBar';
import ParticipationMeter from '../../collaboration/flows/discussion/ParticipationMeter';
import {
  DELIBERATION_PARTICIPANTS,
  PRESENCE_NOW,
  PRESENCE_TICKER,
} from '../../../services/demo/fixtures/deliberation';
import styles from './DiscussionEngage.module.scss';

export interface DiscussionEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — accepted for prop-bag symmetry (the full view gates). */
  communityId: string;
  /** Community member count, for the participation meter denominator. */
  memberCount: number;
}

/**
 * The Discussion stage's **Engage** slot, rendered inside the shared
 * `InitiativeStageCard` (and directly in `InitiativeStagePanel`). Unlike the old
 * `DiscussionStage` dashboard preview — which read a single hardcoded misinfo
 * seed for every initiative — this reads the LIVE per-initiative discussion
 * sub-contract through the seam, so the seeded `misinfo` showcase shows a rich
 * preview while every other initiative shows a friendly empty state inviting the
 * first contribution.
 *
 * Read-only preview: the co-authoring ACTIONS (suggest an edit, add a position)
 * live in the full {@link DiscussionStageView}, reached via the shell's blue
 * "Open the co-authoring space". No `StageGate` here.
 */
const DiscussionEngage: React.FC<DiscussionEngageProps> = ({ initiativeId, memberCount }) => {
  const t = useT();

  const { contractId, isReady } = useFlowContract(
    `discussion-${initiativeId}`,
    'discussion',
    'discussion_contract.py',
    '',
    initiativeId,
    'discussionContractId',
  );
  const data = useDiscussionData(contractId, isReady);

  const hasContent =
    isReady && (data.participantCount > 0 || !!data.statement.title || data.positions.length > 0);

  return (
    <div className={styles.engage}>
      {/* Ambient cross-border presence — fixture-backed, fine to keep (mirrors the
          retired DiscussionStage dashboard). */}
      <CoPresenceBar participants={DELIBERATION_PARTICIPANTS} hereNow={PRESENCE_NOW} ticker={PRESENCE_TICKER} />

      {hasContent ? (
        <>
          <ParticipationMeter taken={data.participantCount} members={memberCount} />
          <p className={styles.preview}>
            {t('deliberation.discussion.preview', 'Statement forming · {p} positions · {e} open edits', {
              p: data.positions.length,
              e: data.edits.filter((x) => x.status === 'open').length,
            })}
          </p>
        </>
      ) : (
        <EmptyState
          compact
          icon={<MessageSquare size={28} aria-hidden />}
          title={t('deliberation.empty.title', 'No discussion yet')}
          message={t(
            'deliberation.empty.body',
            'Be the first to co-author a shared statement for this problem.',
          )}
        />
      )}
    </div>
  );
};

export default DiscussionEngage;
