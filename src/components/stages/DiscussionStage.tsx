import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { Button } from '../shared';
import { useT } from '../../i18n';
import CoPresenceBar from '../collaboration/flows/discussion/CoPresenceBar';
import {
  DELIBERATION_PARTICIPANTS,
  PRESENCE_NOW,
  PRESENCE_TICKER,
} from '../../services/demo/fixtures/deliberation';
import type { StageVariant } from '../../types/initiative';
import styles from './DiscussionStage.module.scss';

export interface DiscussionStageProps {
  initiativeId: string;
  communityId: string;
  title: string;
  hostServer: string;
  hostAgent: string;
  /** Raw community member count, for the 33% contribution hint (dashboard). */
  memberCount?: number;
  variant: StageVariant;
}

/**
 * Stage 2 — Discussion. Owned by Lane C (`src/components/stages/DiscussionStage.*`).
 * Feed: a live co-presence teaser + a "tap to join" hint (the card itself
 * navigates). Dashboard: the live co-presence bar, a contribution hint, and a
 * button into the full threaded discussion + co-authoring view.
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

  if (variant === 'feed') {
    return (
      <div className={styles.feed}>
        <CoPresenceBar compact participants={DELIBERATION_PARTICIPANTS} hereNow={PRESENCE_NOW} />
        <div className={styles.hint}>
          <MessageCircle size={14} aria-hidden />
          <span>{t('deliberation.discussion.tapToJoin', 'Tap to join the discussion')}</span>
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

  const contributors = Math.ceil(memberCount * 0.33);

  return (
    <div className={styles.dashboard}>
      <CoPresenceBar participants={DELIBERATION_PARTICIPANTS} hereNow={PRESENCE_NOW} ticker={PRESENCE_TICKER} />
      <p className={styles.summaryHint}>
        {t(
          'deliberation.discussion.summary',
          'Share how this problem affects your country. At least {n} members (33%) contribute before this stage advances.',
          { n: contributors },
        )}
      </p>
      <Button variant="primary" leftIcon={<MessageCircle size={16} />} onClick={openDiscussion}>
        {t('deliberation.discussion.join', 'Join the discussion')}
      </Button>
    </div>
  );
};

export default DiscussionStage;
