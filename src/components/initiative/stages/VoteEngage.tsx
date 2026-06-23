import React from 'react';
import StageGate from '../../community/StageGate';
import VoteStage from '../../stages/VoteStage';
import styles from './VoteEngage.module.scss';

export interface VoteEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — gates the ballot via {@link StageGate}. */
  communityId: string;
}

/**
 * The Vote stage's **Engage** slot, rendered inside the shared
 * `InitiativeStageCard`. The card collapses to a "Cast your vote" teaser; on
 * expand, the full quadratic-voting ballot ({@link VoteStage}) renders inline —
 * no separate ballot page (Eston, 2026-06-23: card-only). The ballot is gated by
 * the community's per-stage trust rule ({@link StageGate}).
 *
 * Carries its own StageGate, so callers render it OUTSIDE any shared gate to
 * avoid double-gating (mirrors SolutionEngage / MandateEngage).
 */
const VoteEngage: React.FC<VoteEngageProps> = ({ initiativeId, communityId }) => {
  return (
    <div className={styles.engage}>
      <StageGate communityId={communityId} stage="vote">
        <VoteStage initiativeId={initiativeId} />
      </StageGate>
    </div>
  );
};

export default VoteEngage;
