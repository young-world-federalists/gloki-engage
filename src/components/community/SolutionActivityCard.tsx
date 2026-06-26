import React, { useEffect } from 'react';
import { useT } from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../../store/slices/communitiesSlice';
import type { Collaboration } from '../../services/contracts/community';
import type { UserIdentityProps } from '../shared';
import InitiativeStageCard, { type StagePost } from '../initiative/InitiativeStageCard';
import { useInitiativePost } from '../initiative/useInitiativePost';
import SolutionEngage from '../initiative/stages/SolutionEngage';
import StageAdvanceBar from '../collaboration/StageAdvanceBar';

export interface SolutionActivityCardProps {
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
 * The Solution-stage (proposals) community-page card: the shared two-part
 * {@link InitiativeStageCard} (Read summary over an Engage panel) wired to the
 * initiative post. The initiative statement is the headline; the byline shows the
 * author once; the Engage slot WRAPS the existing rich {@link SolutionEngage}
 * (proposal slate + support + merge — unchanged, just gains hierarchy, spec §3)
 * plus the author/co-author advance control ({@link StageAdvanceBar}, proposals →
 * vote). Card-only stage (no dedicated page — Eston, 2026-06-23): no Open button.
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

  return (
    <InitiativeStageCard
      post={fullPost}
      trustState={trustState}
      vouchCount={vouchCount}
      expanded={expanded}
      onToggle={onToggle}
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
