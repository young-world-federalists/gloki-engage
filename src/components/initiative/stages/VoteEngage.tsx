import React from 'react';
import StageGate from '../../community/StageGate';
import VoteStage from '../../stages/VoteStage';
import VoteExplainer from './VoteExplainer';
import VotePreview from './VotePreview';
import { useCommunityTrust } from '../../../hooks/useCommunityTrust';
import styles from './VoteEngage.module.scss';

export interface VoteEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — gates the ballot via {@link StageGate}. */
  communityId: string;
  /** Active community member count — denominator for the turnout footer. */
  communityMemberCount?: number;
}

/**
 * The Vote stage's **Engage** slot, rendered inside the shared
 * `InitiativeStageCard`. S11 P2: the "how this vote works" explainer and a
 * read-only ballot preview live OUTSIDE the `StageGate` so the mechanism is
 * auditable before verifying. The interactive quadratic ballot ({@link VoteStage})
 * stays gated by the community's per-stage trust rule. The preview renders only
 * when the current user cannot participate — participants never see a duplicate —
 * and does pure reads, so no write path leaks past the gate.
 */
const VoteEngage: React.FC<VoteEngageProps> = ({ initiativeId, communityId, communityMemberCount }) => {
  const { canCurrentUserParticipate, isReady } = useCommunityTrust(communityId);
  // Mirror StageGate's loading grace (reads are harmless in the mock): assume
  // participation while permissions load, so we don't flash the preview.
  const canVote = !isReady || canCurrentUserParticipate('vote');

  return (
    <div className={styles.engage}>
      <VoteExplainer />
      <StageGate communityId={communityId} stage="vote">
        <VoteStage initiativeId={initiativeId} communityMemberCount={communityMemberCount} />
      </StageGate>
      {!canVote && <VotePreview initiativeId={initiativeId} communityMemberCount={communityMemberCount} />}
    </div>
  );
};

export default VoteEngage;
