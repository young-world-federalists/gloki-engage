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
 * auditable before verifying — but ONLY for visitors who cannot vote (W3 3.7:
 * participants get the ballot's own "How hearts work" guide, so showing both
 * double-explained the same mechanism). The interactive quadratic ballot
 * ({@link VoteStage}) stays gated by the community's per-stage trust rule.
 * The preview does pure reads, so no write path leaks past the gate.
 */
const VoteEngage: React.FC<VoteEngageProps> = ({ initiativeId, communityId, communityMemberCount }) => {
  const { canCurrentUserParticipate, isReady } = useCommunityTrust(communityId);
  // Mirror StageGate's loading grace (reads are harmless in the mock): assume
  // participation while permissions load, so we don't flash the preview.
  const canVote = !isReady || canCurrentUserParticipate('vote');

  return (
    <div className={styles.engage}>
      <StageGate communityId={communityId} stage="vote">
        <VoteStage initiativeId={initiativeId} communityMemberCount={communityMemberCount} />
      </StageGate>
      {!canVote && (
        <>
          <VoteExplainer />
          <VotePreview initiativeId={initiativeId} communityMemberCount={communityMemberCount} />
        </>
      )}
    </div>
  );
};

export default VoteEngage;
