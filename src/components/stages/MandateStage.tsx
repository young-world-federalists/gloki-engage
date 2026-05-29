import React from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import ConvictionStaking from '../collaboration/flows/voting/ConvictionStaking';
import type { StageVariant } from '../../types/initiative';

export interface MandateStageProps {
  /** The initiative contract id — used as the shared parent contract. */
  initiativeId: string;
  /** Feed renders the compact staking control; dashboard renders the full one. */
  variant: StageVariant;
}

/**
 * Stage 5 — Mandate. Owned by Lane E (`src/components/stages/MandateStage.*`).
 * Renders time-weighted conviction staking (compact in the feed, full in the dashboard).
 */
const MandateStage: React.FC<MandateStageProps> = ({ initiativeId, variant }) => (
  <ErrorBoundary fallbackMessage="Conviction staking encountered an error.">
    <ConvictionStaking
      instanceId={`${initiativeId}_conviction`}
      parentContractId={initiativeId}
      stageKey="convictionContractId"
      compact={variant === 'feed'}
    />
  </ErrorBoundary>
);

export default MandateStage;
