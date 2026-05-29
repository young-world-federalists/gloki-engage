import React from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import ProposalMergePanel from '../collaboration/flows/merge/ProposalMergePanel';
import ApprovalFlow from '../collaboration/flows/voting/ApprovalFlow';
import { useT } from '../../i18n';
import type { StageVariant } from '../../types/initiative';

export interface ProposalsStageProps {
  initiativeId: string;
  communityId: string;
  title: string;
  hostServer: string;
  hostAgent: string;
  /** Dashboard adds the merge / expert-review panel above the voting flow. */
  variant: StageVariant;
}

/**
 * Stage 3 — Proposals. Owned by Lane C (`src/components/stages/ProposalsStage.*`).
 * Renders Lane D's approve/withdraw voting flow; in the dashboard it also
 * surfaces the "merge similar proposals" + expert-review panel (C3) above it.
 * The ApprovalFlow mechanism belongs to Lane D — imported, never edited here.
 */
const ProposalsStage: React.FC<ProposalsStageProps> = ({ initiativeId, variant }) => {
  const t = useT();
  return (
    <ErrorBoundary fallbackMessage={t('deliberation.proposals.error', 'Proposals encountered an error.')}>
      {variant === 'dashboard' && <ProposalMergePanel />}
      <ApprovalFlow
        instanceId={`${initiativeId}_proposals`}
        collaborationId={initiativeId}
        collaborationType="initiative"
        parentContractId={initiativeId}
        stageKey="proposalsContractId"
      />
    </ErrorBoundary>
  );
};

export default ProposalsStage;
