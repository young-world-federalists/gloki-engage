import React from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import SolutionsBoard from '../initiative/stages/SolutionsBoard';
import { useT } from '../../i18n';
import type { StageVariant } from '../../types/initiative';

export interface ProposalsStageProps {
  initiativeId: string;
  communityId: string;
  title: string;
  hostServer: string;
  hostAgent: string;
  variant: StageVariant;
  /** Active member count — denominator for the solutions threshold. */
  communityMemberCount?: number;
  /** Community display name, threaded through to the Top causes panel's
   *  discussion status badge (S35 fix-round F4 pattern). */
  communityName?: string;
}

const ProposalsStage: React.FC<ProposalsStageProps> = ({ initiativeId, communityId, communityMemberCount, communityName }) => {
  const t = useT();
  return (
    <ErrorBoundary fallbackMessage={t('deliberation.proposals.error', 'Solutions encountered an error.')}>
      <SolutionsBoard
        initiativeId={initiativeId}
        communityId={communityId}
        communityMemberCount={communityMemberCount}
        communityName={communityName}
      />
    </ErrorBoundary>
  );
};

export default ProposalsStage;
