import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import CollaborationPanel from '../collaboration/CollaborationPanel';
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
 * Feed: a compact "tap to join" hint (the card itself navigates). Dashboard: the
 * modification/suggestion collaboration panel plus a link into the full
 * threaded discussion view.
 */
const DiscussionStage: React.FC<DiscussionStageProps> = ({
  initiativeId,
  communityId,
  title,
  hostServer,
  hostAgent,
  memberCount = 0,
  variant,
}) => {
  const navigate = useNavigate();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  if (variant === 'feed') {
    return (
      <div className={styles.hint}>
        <MessageCircle size={14} />
        <span>Tap to join the discussion</span>
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
    <>
      <CollaborationPanel
        initiativeId={initiativeId}
        communityId={communityId}
        initiativeTitle={title}
        initiativeHostServer={hostServer}
        initiativeHostAgent={hostAgent}
        defaultTab="suggestions"
      />
      <div className={styles.summary}>
        <p className={styles.summaryHint}>
          Share perspectives on how this problem affects your country. At least{' '}
          {Math.ceil(memberCount * 0.33)} members (33%) must contribute.
        </p>
        <button className={styles.joinBtn} onClick={openDiscussion}>
          <MessageCircle size={16} /> Join Discussion
        </button>
      </div>
    </>
  );
};

export default DiscussionStage;
