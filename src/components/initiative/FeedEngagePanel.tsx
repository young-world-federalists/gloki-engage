import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useT } from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers } from '../../store/slices/communitiesSlice';
import InitiativeStageStrip from './InitiativeStageStrip';
import DiscussionPill from './DiscussionPill';
import { useInitiativePost } from './useInitiativePost';
import ProblemEngage from './stages/ProblemEngage';
import SolutionEngage from './stages/SolutionEngage';
import VoteEngage from './stages/VoteEngage';
import StageAdvanceBar from '../collaboration/StageAdvanceBar';
import styles from './FeedEngagePanel.module.scss';

export interface FeedEngagePanelProps {
  initiativeId: string;
  /** Initiative title — the headline fallback for {@link useInitiativePost}. */
  title: string;
  /** The initiative's resolved data stage (discussion renders pill-only engage). */
  stage: 'problem' | 'discussion' | 'proposals' | 'vote';
  /** Hosting community — every card resolves its OWN community's contracts. */
  communityId: string;
  hostServer: string;
  hostAgent: string;
  authorKey?: string;
  authorName?: string;
}

/** Problem-stage engage + advance, isolated so its tally/threshold reads
 *  (useInitiativePost) fire only when a problem card actually expands. */
const ProblemFeedBlock: React.FC<{
  initiativeId: string;
  title: string;
  communityId: string;
  hostServer: string;
  hostAgent: string;
  authorKey?: string;
  authorName?: string;
  activeMemberCount: number;
  /** False until the member reads land — readiness must not be judged against a
   *  zero denominator (needed would collapse to 1 and enable a premature advance). */
  membersLoaded: boolean;
}> = ({
  initiativeId,
  title,
  communityId,
  hostServer,
  hostAgent,
  authorKey,
  authorName,
  activeMemberCount,
  membersLoaded,
}) => {
  const t = useT();
  const { up, thresholdMet } = useInitiativePost(initiativeId, activeMemberCount, title);

  const needed = Math.max(Math.ceil(activeMemberCount * 0.5), 1);
  const remaining = Math.max(needed - up, 0);
  const notReadyReason = !membersLoaded
    ? t('common.loading', 'Loading…')
    : remaining === 1
      ? t('dashboard.readiness.upvotes.one', '1 more upvote needed ({up}/{threshold})', { up, threshold: needed })
      : t('dashboard.readiness.upvotes.many', '{remaining} more upvotes needed ({up}/{threshold})', {
          remaining,
          up,
          threshold: needed,
        });

  return (
    <>
      <ProblemEngage
        initiativeId={initiativeId}
        communityId={communityId}
        communityMemberCount={activeMemberCount}
        up={up}
        hostServer={hostServer}
        hostAgent={hostAgent}
        authorKey={authorKey}
        authorName={authorName}
      />
      <StageAdvanceBar
        initiativeId={initiativeId}
        communityId={communityId}
        stage="problem"
        hostServer={hostServer}
        hostAgent={hostAgent}
        ready={membersLoaded && thresholdMet}
        notReadyReason={notReadyReason}
      />
    </>
  );
};

/**
 * The expanded body of a global stage-feed card (S20 W3): the same engage stack
 * the community feed's activity cards host, re-hosted under the feed's compact
 * summary so browsing a stage never teleports the visitor into an unfamiliar
 * community. Per-card community context only — the feed is cross-community, so
 * nothing here reads ambient CommunityView state.
 *
 * Read-only on mount for non-participants: the engage components carry their own
 * StageGate, and the strip/pill are pure reads — expanding deploys nothing.
 * Discussion-stage initiatives (visible in the Problem feed) get the active
 * DiscussionPill as their only engage (Eston, 2026-07-04).
 */
const FeedEngagePanel: React.FC<FeedEngagePanelProps> = ({
  initiativeId,
  title,
  stage,
  communityId,
  hostServer,
  hostAgent,
  authorKey,
  authorName,
}) => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityActiveMembers = useAppSelector((s) => s.communities.communityActiveMembers);

  // Active-member count drives threshold math (mirrors the community activity
  // cards). Mounts only on expand, so collapsed feeds fetch nothing extra.
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (!communityMembers[communityId]) {
      dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    }
    if (communityActiveMembers[communityId] === undefined) {
      dispatch(fetchCommunityActiveMembers({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [serverUrl, publicKey, communityId, communityMembers, communityActiveMembers, dispatch]);

  const membersLoaded =
    Array.isArray(communityMembers[communityId]) && communityActiveMembers[communityId] !== undefined;
  const memberCount = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId].length : 0;
  const activeMemberCount = communityActiveMembers[communityId] ?? memberCount;

  return (
    <div className={styles.panel}>
      <div className={styles.stageNavRow}>
        <InitiativeStageStrip current={stage} />
        <DiscussionPill
          initiativeId={initiativeId}
          communityId={communityId}
          hostServer={hostServer}
          hostAgent={hostAgent}
          active={stage === 'discussion'}
        />
      </div>

      {stage === 'problem' && (
        <ProblemFeedBlock
          initiativeId={initiativeId}
          title={title}
          communityId={communityId}
          hostServer={hostServer}
          hostAgent={hostAgent}
          authorKey={authorKey}
          authorName={authorName}
          activeMemberCount={activeMemberCount}
          membersLoaded={membersLoaded}
        />
      )}

      {stage === 'proposals' && (
        <>
          <SolutionEngage
            initiativeId={initiativeId}
            communityId={communityId}
            title={title}
            hostServer={hostServer}
            hostAgent={hostAgent}
            communityMemberCount={activeMemberCount}
          />
          <StageAdvanceBar
            initiativeId={initiativeId}
            communityId={communityId}
            stage="proposals"
            hostServer={hostServer}
            hostAgent={hostAgent}
          />
        </>
      )}

      {stage === 'vote' && (
        <>
          <VoteEngage
            initiativeId={initiativeId}
            communityId={communityId}
            communityMemberCount={activeMemberCount}
          />
          <StageAdvanceBar
            initiativeId={initiativeId}
            communityId={communityId}
            stage="vote"
            hostServer={hostServer}
            hostAgent={hostAgent}
          />
        </>
      )}

      <button
        type="button"
        className={styles.openLink}
        onClick={() => navigate(`/community/${communityId}?initiative=${initiativeId}`)}
      >
        {t('stagefeed.openInCommunity', 'Open in community')} <ExternalLink size={16} aria-hidden />
      </button>
    </div>
  );
};

export default FeedEngagePanel;
