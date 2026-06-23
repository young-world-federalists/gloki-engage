import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../../store/slices/communitiesSlice';
import type { Collaboration } from '../../services/contracts/community';
import type { TrustBadgeProps } from '../shared';
import InitiativeStageCard, { type StagePost } from '../initiative/InitiativeStageCard';
import { useInitiativePost } from '../initiative/useInitiativePost';
import SolutionEngage from '../initiative/stages/SolutionEngage';
import StageAdvanceBar from '../collaboration/StageAdvanceBar';

export interface SolutionActivityCardProps {
  item: Collaboration;
  communityId: string;
  authorName: string;
  authorKey?: string;
  trustState: TrustBadgeProps['state'];
  vouchCount: number;
  hostServer: string;
  hostAgent: string;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * The Solution-stage (proposals) community-page card: the shared two-part
 * {@link InitiativeStageCard} (Read summary over an Engage panel) wired to the
 * initiative post. The initiative statement is the headline; the byline shows the
 * author once; the Engage slot WRAPS the existing rich {@link SolutionEngage}
 * (proposal slate + support + merge — unchanged, just gains hierarchy, spec §3)
 * plus the author/co-author advance control ({@link StageAdvanceBar}, proposals →
 * vote). The blue "Open the full solution" routes to the discussion page.
 */
const SolutionActivityCard: React.FC<SolutionActivityCardProps> = ({
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

  // Active-member count feeds useInitiativePost (mirrors MandateActivityCard).
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
    stage: 'proposals',
    headline: post.headline || item.title || t('community.untitled', 'Untitled Initiative'),
    byline: authorName ? t('community.startedBy', 'Started by {name}', { name: authorName }) : undefined,
    authorKey,
    createdAt: item.createdAt,
    sdg: post.sdg,
    countryCount: post.countryCount,
    source: post.source,
  };

  // No dedicated "full solution" page exists in this mockup — the `/initiative/...`
  // route redirects to the community card. The discussion deep link is the interim
  // target (matches ProblemActivityCard). TODO: reviewer to confirm the final
  // destination with the product owner.
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
      onOpen={openDiscussion}
      openLabel={t('card.openSolution', 'Open the full solution')}
      collapsedTeaser={t('card.teaserSolution', 'Weigh in on the solutions')}
    >
      <SolutionEngage
        initiativeId={item.id}
        communityId={communityId}
        title={item.title || ''}
        hostServer={hostServer}
        hostAgent={hostAgent}
      />
      {/* Proposals → vote. Readiness is ungated for proposals, so omit
          ready/notReadyReason — the bar defaults to ready. */}
      <StageAdvanceBar
        initiativeId={item.id}
        communityId={communityId}
        stage="proposals"
        hostServer={hostServer}
        hostAgent={hostAgent}
      />
    </InitiativeStageCard>
  );
};

export default SolutionActivityCard;
