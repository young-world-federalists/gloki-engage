import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../../store/slices/communitiesSlice';
import type { Collaboration } from '../../services/contracts/community';
import type { UserIdentityProps } from '../shared';
import InitiativeStageCard, { type StagePost } from '../initiative/InitiativeStageCard';
import { useInitiativePost } from '../initiative/useInitiativePost';
import DiscussionEngage from '../initiative/stages/DiscussionEngage';
import StageAdvanceBar from '../collaboration/StageAdvanceBar';

export interface DiscussionActivityCardProps {
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
 * The Discussion-stage community-page card: the shared two-part
 * {@link InitiativeStageCard} (Read summary over an Engage panel) wired to the
 * initiative post. Like Mandate, Discussion has a real destination page — the
 * full co-authoring space — so the shell keeps a blue "Open the co-authoring
 * space" button. The Engage slot ({@link DiscussionEngage}) shows a live,
 * per-initiative preview (or a friendly empty state for un-started discussions);
 * the author/co-author advance control ({@link StageAdvanceBar}, discussion →
 * proposals) sits below it.
 */
const DiscussionActivityCard: React.FC<DiscussionActivityCardProps> = ({
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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityActiveMembers = useAppSelector((s) => s.communities.communityActiveMembers);
  const profiles = useAppSelector((s) => s.communities.profiles);

  // Active-member count feeds useInitiativePost + the participation meter
  // denominator (mirrors MandateActivityCard / SolutionActivityCard).
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
    stage: 'discussion',
    headline: post.headline || item.title || t('community.untitled', 'Untitled Initiative'),
    byline: authorName ? t('community.startedBy', 'Started by {name}', { name: authorName }) : undefined,
    authorKey,
    authorCountry: authorKey ? profiles[authorKey]?.country : undefined,
    createdAt: item.createdAt,
    sdg: post.sdg,
    countryCount: post.countryCount,
    source: post.source,
  };

  const openDiscussion = () =>
    navigate(
      `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${item.id}/discussion`,
    );

  return (
    <InitiativeStageCard
      post={fullPost}
      trustState={trustState}
      vouchCount={vouchCount}
      expanded={expanded}
      onToggle={onToggle}
      stageNav={{ communityId, initiativeId: item.id, hostServer, hostAgent }}
      onOpen={openDiscussion}
      openLabel={t('deliberation.discussion.open', 'Open the discussion')}
      collapsedTeaser={t('card.teaserDiscussion', 'Join the discussion')}
    >
      <DiscussionEngage initiativeId={item.id} />
      {/* Discussion → proposals. Ungated, so omit ready/notReadyReason — the bar
          defaults to ready. */}
      <StageAdvanceBar
        initiativeId={item.id}
        communityId={communityId}
        stage="discussion"
        hostServer={hostServer}
        hostAgent={hostAgent}
      />
    </InitiativeStageCard>
  );
};

export default DiscussionActivityCard;
