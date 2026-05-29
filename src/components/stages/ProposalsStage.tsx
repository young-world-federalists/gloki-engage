import React from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import CollaborationPanel from '../collaboration/CollaborationPanel';
import ApprovalFlow from '../collaboration/flows/voting/ApprovalFlow';
import type { StageVariant } from '../../types/initiative';

export interface ProposalsStageProps {
  initiativeId: string;
  communityId: string;
  title: string;
  hostServer: string;
  hostAgent: string;
  /** Dashboard adds the modification/merge collaboration panel above the flow. */
  variant: StageVariant;
}

/**
 * Stage 3 — Proposals. Owned by Lane C (`src/components/stages/ProposalsStage.*`).
 * Renders the approve/withdraw proposals flow; in the dashboard it also surfaces
 * the modification/merge collaboration panel.
 */
const ProposalsStage: React.FC<ProposalsStageProps> = ({
  initiativeId,
  communityId,
  title,
  hostServer,
  hostAgent,
  variant,
}) => (
  <ErrorBoundary fallbackMessage="Proposals encountered an error.">
    {variant === 'dashboard' && (
      <CollaborationPanel
        initiativeId={initiativeId}
        communityId={communityId}
        initiativeTitle={title}
        initiativeHostServer={hostServer}
        initiativeHostAgent={hostAgent}
        defaultTab="merges"
      />
    )}
    <ApprovalFlow
      instanceId={`${initiativeId}_proposals`}
      collaborationId={initiativeId}
      collaborationType="initiative"
      parentContractId={initiativeId}
      stageKey="proposalsContractId"
    />
  </ErrorBoundary>
);

export default ProposalsStage;
