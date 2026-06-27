import React from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import QVFlow from '../collaboration/flows/voting/QVFlow';

export interface VoteStageProps {
  /** The initiative contract id — used as the shared parent contract. */
  initiativeId: string;
  /** Active community member count — denominator for the turnout footer. */
  communityMemberCount?: number;
}

/**
 * Stage 4 — Vote. Owned by Lane E (`src/components/stages/VoteStage.*`).
 * Renders the quadratic-voting credit-allocation flow (shared by feed + dashboard).
 */
const VoteStage: React.FC<VoteStageProps> = ({ initiativeId, communityMemberCount }) => (
  <ErrorBoundary fallbackMessage="Voting encountered an error.">
    <QVFlow
      instanceId={`${initiativeId}_vote`}
      collaborationId={initiativeId}
      collaborationType="initiative"
      parentContractId={initiativeId}
      stageKey="voteContractId"
      communityMemberCount={communityMemberCount}
    />
  </ErrorBoundary>
);

export default VoteStage;
