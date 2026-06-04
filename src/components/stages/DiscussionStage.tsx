import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { Button } from '../shared';
import { useT } from '../../i18n';
import CoPresenceBar from '../collaboration/flows/discussion/CoPresenceBar';
import ParticipationMeter from '../collaboration/flows/discussion/ParticipationMeter';
import {
  DELIBERATION_PARTICIPANTS,
  PRESENCE_NOW,
  PRESENCE_TICKER,
  DISCUSSION_SEED_SUMMARY,
} from '../../services/demo/fixtures/deliberation';
import type { StageVariant } from '../../types/initiative';
import styles from './DiscussionStage.module.scss';

export interface DiscussionStageProps {
  initiativeId: string;
  communityId: string;
  title: string;
  hostServer: string;
  hostAgent: string;
  /** Raw community member count, for the participation meter (dashboard). */
  memberCount?: number;
  variant: StageVariant;
}

/**
 * Stage 2 — Discussion, as a co-authoring space. Feed: a live co-presence teaser
 * + a one-line "leaning signal" + "tap to co-author" (the card navigates).
 * Dashboard: co-presence, the participation meter, a compact preview, and an
 * entry point into the full co-authoring view. Feed/dashboard read a seed
 * summary (no contract deploy); the full view reads the live contract.
 */
const DiscussionStage: React.FC<DiscussionStageProps> = ({
  initiativeId,
  communityId,
  memberCount = 0,
  variant,
}) => {
  const navigate = useNavigate();
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const { positions, openEdits, participants } = DISCUSSION_SEED_SUMMARY;

  if (variant === 'feed') {
    return (
      <div className={styles.feed}>
        <CoPresenceBar compact participants={DELIBERATION_PARTICIPANTS} hereNow={PRESENCE_NOW} />
        <p className={styles.leaning}>
          {t('deliberation.discussion.leaning', '{p} positions · {e} open edits', { p: positions, e: openEdits })}
        </p>
        <div className={styles.hint}>
          <Users size={14} aria-hidden />
          <span>{t('deliberation.discussion.tapToCoauthor', 'Tap to co-author')}</span>
        </div>
      </div>
    );
  }

  const openDiscussion = () =>
    navigate(
      `/initiative/${encodeURIComponent(serverUrl || '')}/${encodeURIComponent(
        publicKey || '',
      )}/${communityId}/${initiativeId}/discussion`,
    );

  return (
    <div className={styles.dashboard}>
      <CoPresenceBar participants={DELIBERATION_PARTICIPANTS} hereNow={PRESENCE_NOW} ticker={PRESENCE_TICKER} />
      <ParticipationMeter taken={participants} members={memberCount} />
      <p className={styles.summaryHint}>
        {t('deliberation.discussion.preview', 'Statement forming · {p} positions · {e} open edits', {
          p: positions,
          e: openEdits,
        })}
      </p>
      <Button variant="primary" rightIcon={<ArrowRight size={16} />} onClick={openDiscussion}>
        {t('deliberation.discussion.open', 'Open the co-authoring space')}
      </Button>
    </div>
  );
};

export default DiscussionStage;
