import React from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import ConvictionStaking from '../collaboration/flows/voting/ConvictionStaking';
import { useT } from '../../i18n';
import type { StageVariant } from '../../types/initiative';
import styles from './MandateStage.module.scss';

export interface MandateStageProps {
  /** The initiative contract id — used as the shared parent contract. */
  initiativeId: string;
  /** Feed renders the compact staking control; dashboard renders the full one. */
  variant: StageVariant;
}

/**
 * Stage 5 — Mandate. Owned by Lane E (`src/components/stages/MandateStage.*`).
 * Renders time-weighted conviction staking (compact in the feed, full in the
 * dashboard) — the staking ACTION, which the per-stage gate may block. The
 * read-only "view the published mandate" link is surfaced outside the gate by
 * the feed shell (StageFeedView) and via the JourneyRecap on the dashboard, so
 * a not-yet-eligible member can always reach the published artifact.
 */
const MandateStage: React.FC<MandateStageProps> = ({ initiativeId, variant }) => {
  const t = useT();

  return (
    <ErrorBoundary fallbackMessage={t('mandate.stakeError', 'Conviction staking encountered an error.')}>
      <div className={styles.stage}>
        <ConvictionStaking
          instanceId={`${initiativeId}_conviction`}
          parentContractId={initiativeId}
          stageKey="convictionContractId"
          compact={variant === 'feed'}
        />
      </div>
    </ErrorBoundary>
  );
};

export default MandateStage;
