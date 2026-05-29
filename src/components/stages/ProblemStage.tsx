import React from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import ProblemVoteFlow from '../collaboration/flows/voting/ProblemVoteFlow';

export interface ProblemStageProps {
  /** The initiative contract id — used as the shared parent contract. */
  initiativeId: string;
  /** Active community member count, for threshold math. */
  communityMemberCount: number;
  /** Evidence URLs from initiative details (dashboard only; feed passes none). */
  evidenceLinks?: string[];
  /** Country codes from initiative details (dashboard only; feed passes none). */
  countries?: string[];
}

/**
 * Stage 1 — Problem. Owned by Lane B (`src/components/stages/ProblemStage.*`).
 * Renders the upvote/downvote participation flow used by both the stage feed
 * and the initiative dashboard.
 */
const ProblemStage: React.FC<ProblemStageProps> = ({
  initiativeId,
  communityMemberCount,
  evidenceLinks = [],
  countries = [],
}) => (
  <ErrorBoundary fallbackMessage="Voting encountered an error.">
    <ProblemVoteFlow
      instanceId={`${initiativeId}_problem_vote`}
      description=""
      evidenceLinks={evidenceLinks}
      countries={countries}
      communityMemberCount={communityMemberCount}
      parentContractId={initiativeId}
      stageKey="problemVoteContractId"
    />
  </ErrorBoundary>
);

export default ProblemStage;
