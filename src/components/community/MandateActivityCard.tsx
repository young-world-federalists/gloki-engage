import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../../store/slices/communitiesSlice';
import type { Collaboration } from '../../services/contracts/community';
import type { TrustBadgeProps } from '../shared';
import InitiativeStageCard, { type StagePost } from '../initiative/InitiativeStageCard';
import { useInitiativePost } from '../initiative/useInitiativePost';
import MandateEngage from '../initiative/stages/MandateEngage';

export interface MandateActivityCardProps {
  item: Collaboration;
  communityId: string;
  authorName: string;
  authorKey?: string;
  trustState: TrustBadgeProps['state'];
  vouchCount: number;
  /**
   * Host coordinates — accepted for prop-bag symmetry with the other stage cards
   * (ActivityCard passes the same set), but unused here: the mandate page route
   * is `/mandate/:communityId/:initiativeId`, host-agnostic.
   */
  hostServer?: string;
  hostAgent?: string;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * The Mandate-stage community-page card: the shared two-part
 * {@link InitiativeStageCard} (Read summary over an Engage panel) wired to a
 * Mandate post. Mandate is the LAST pipeline stage, so there is **no advance
 * control**. The Engage slot ({@link MandateEngage}) carries the journey recap
 * plus the gated conviction-staking action; the single blue "View the published
 * mandate" (owned by the shell) routes to the mandate page.
 */
const MandateActivityCard: React.FC<MandateActivityCardProps> = ({
  item,
  communityId,
  authorName,
  authorKey,
  trustState,
  vouchCount,
  expanded,
  onToggle,
}) => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityActiveMembers = useAppSelector((s) => s.communities.communityActiveMembers);

  // Active-member count feeds useInitiativePost (mirrors ProblemActivityCard).
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (!communityMembers[communityId]) {
      dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    }
    if (communityActiveMembers[communityId] === undefined) {
      dispatch(fetchCommunityActiveMembers({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [serverUrl, publicKey, communityId, communityMembers, communityActiveMembers, dispatch]);

  const memberCount = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId].length : 0;
  const activeMemberCount = communityActiveMembers[communityId] ?? memberCount;

  const { post } = useInitiativePost(item.id, activeMemberCount, item.title);

  const fullPost: StagePost = {
    stage: 'mandate',
    headline: post.headline || item.title || t('community.untitled', 'Untitled Initiative'),
    byline: authorName ? t('community.startedBy', 'Started by {name}', { name: authorName }) : undefined,
    authorKey,
    createdAt: item.createdAt,
    sdg: post.sdg,
    countryCount: post.countryCount,
    source: post.source,
  };

  const openMandate = () => navigate(`/mandate/${communityId}/${item.id}`);

  return (
    <InitiativeStageCard
      post={fullPost}
      trustState={trustState}
      vouchCount={vouchCount}
      expanded={expanded}
      onToggle={onToggle}
      onOpen={openMandate}
      openLabel={t('card.viewMandate', 'View the published mandate')}
      collapsedTeaser={t('card.teaserMandate', 'Community mandate')}
    >
      {/* Shell appends its own blue "View the published mandate" — suppress the
          recap's duplicate so there's a single CTA. */}
      <MandateEngage initiativeId={item.id} communityId={communityId} showViewMandate={false} />
    </InitiativeStageCard>
  );
};

export default MandateActivityCard;
