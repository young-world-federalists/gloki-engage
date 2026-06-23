import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../../store/slices/communitiesSlice';
import type { Collaboration } from '../../services/contracts/community';
import type { TrustBadgeProps } from '../shared';
import InitiativeStageCard, { type StagePost } from '../initiative/InitiativeStageCard';
import { useInitiativePost } from '../initiative/useInitiativePost';
import ProblemEngage from '../initiative/stages/ProblemEngage';
import StageAdvanceBar from '../collaboration/StageAdvanceBar';

export interface ProblemActivityCardProps {
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
 * The Problem-stage community-page card: the shared two-part
 * {@link InitiativeStageCard} (Read summary over an Engage panel) wired to a
 * Problem post. The content (problem statement merged with who-it-affects) is
 * the headline; the byline shows the author once; the Engage slot carries the
 * quick "second" vote ({@link ProblemEngage}) plus the author-only advance
 * control ({@link StageAdvanceBar}), preserving the governance that used to live
 * in InitiativeStagePanel. The blue "Open the full problem" routes to the
 * discussion page (Unit 5 makes that the per-post thread).
 */
const ProblemActivityCard: React.FC<ProblemActivityCardProps> = ({
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

  // Active-member count drives the threshold math (mirrors InitiativeStagePanel).
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

  const { post, thresholdMet, up } = useInitiativePost(item.id, activeMemberCount, item.title);

  const fullPost: StagePost = {
    stage: 'problem',
    headline: post.headline || item.title || t('community.untitled', 'Untitled Initiative'),
    byline: authorName ? t('community.startedBy', 'Started by {name}', { name: authorName }) : undefined,
    authorKey,
    createdAt: item.createdAt,
    sdg: post.sdg,
    countryCount: post.countryCount,
    source: post.source,
  };

  const needed = Math.max(Math.ceil(activeMemberCount * 0.5), 1);
  const remaining = Math.max(needed - up, 0);
  const notReadyReason =
    remaining === 1
      ? t('dashboard.readiness.upvotes.one', '1 more upvote needed ({up}/{threshold})', { up, threshold: needed })
      : t('dashboard.readiness.upvotes.many', '{remaining} more upvotes needed ({up}/{threshold})', {
          remaining,
          up,
          threshold: needed,
        });

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
      openLabel={t('card.openProblem', 'Open the full problem')}
      collapsedTeaser={
        thresholdMet
          ? t('card.teaserAgreed', 'Agreed by your community')
          : t('card.teaserWeighIn', '{n} agree · weigh in', { n: up })
      }
    >
      <ProblemEngage
        initiativeId={item.id}
        communityId={communityId}
        communityMemberCount={activeMemberCount}
        up={up}
        hostServer={hostServer}
        hostAgent={hostAgent}
      />
      <StageAdvanceBar
        initiativeId={item.id}
        communityId={communityId}
        stage="problem"
        hostServer={hostServer}
        hostAgent={hostAgent}
        ready={thresholdMet}
        notReadyReason={notReadyReason}
      />
    </InitiativeStageCard>
  );
};

export default ProblemActivityCard;
