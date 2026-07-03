import React, { useEffect } from 'react';
import { useT } from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../../store/slices/communitiesSlice';
import type { Collaboration } from '../../services/contracts/community';
import type { UserIdentityProps } from '../shared';
import InitiativeStageCard, { type StagePost } from '../initiative/InitiativeStageCard';
import { useInitiativePost } from '../initiative/useInitiativePost';
import VoteEngage from '../initiative/stages/VoteEngage';
import StageAdvanceBar from '../collaboration/StageAdvanceBar';

export interface VoteActivityCardProps {
  item: Collaboration;
  communityId: string;
  authorName: string;
  authorKey?: string;
  trustState: UserIdentityProps['trustState'];
  vouchCount: number;
  hostServer: string;
  hostAgent: string;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * The Vote-stage community-page card: the shared two-part
 * {@link InitiativeStageCard} wired to the initiative post. The initiative title
 * rides above the problem-statement headline (voters recognise the ballot by
 * name — S17 N4); the byline shows the author once; the collapsed card
 * shows a "Cast your vote" teaser styled as an affordance, and expanding reveals the full ballot inline
 * ({@link VoteEngage}, gated) plus the author/co-author advance control
 * ({@link StageAdvanceBar}, vote → mandate). Card-only stage (no dedicated ballot
 * page — Eston, 2026-06-23): no Open button.
 */
const VoteActivityCard: React.FC<VoteActivityCardProps> = ({
  item,
  communityId,
  authorName,
  authorKey,
  trustState,
  vouchCount,
  hostServer,
  hostAgent,
  expanded,
  onToggle,
}) => {
  const t = useT();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityActiveMembers = useAppSelector((s) => s.communities.communityActiveMembers);
  const profiles = useAppSelector((s) => s.communities.profiles);

  // Active-member count feeds useInitiativePost (mirrors SolutionActivityCard).
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
    stage: 'vote',
    // Voters need to recognise WHICH initiative this ballot belongs to (S17 N4):
    // the title rides above the problem-statement headline. The card hides it
    // when the headline already fell back to the title.
    title: item.title || undefined,
    headline: post.headline || item.title || t('community.untitled', 'Untitled Initiative'),
    byline: authorName ? t('community.startedBy', 'Started by {name}', { name: authorName }) : undefined,
    authorKey,
    authorCountry: authorKey ? profiles[authorKey]?.country : undefined,
    createdAt: item.createdAt,
    sdg: post.sdg,
    scope: post.scope,
    countryCount: post.countryCount,
    source: post.source,
  };

  return (
    <InitiativeStageCard
      post={fullPost}
      trustState={trustState}
      vouchCount={vouchCount}
      expanded={expanded}
      onToggle={onToggle}
      stageNav={{ communityId, initiativeId: item.id, hostServer, hostAgent }}
      collapsedTeaser={t('card.teaserVote', 'Cast your vote')}
      teaserAction
    >
      <VoteEngage initiativeId={item.id} communityId={communityId} communityMemberCount={activeMemberCount} />
      {/* Vote → mandate. Readiness is ungated for vote, so omit ready/notReadyReason. */}
      <StageAdvanceBar
        initiativeId={item.id}
        communityId={communityId}
        stage="vote"
        hostServer={hostServer}
        hostAgent={hostAgent}
      />
    </InitiativeStageCard>
  );
};

export default VoteActivityCard;
