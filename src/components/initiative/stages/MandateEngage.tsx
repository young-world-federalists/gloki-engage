import React from 'react';
import { useNavigate } from 'react-router-dom';
import StageGate from '../../community/StageGate';
import MandateStage from '../../stages/MandateStage';
import JourneyRecap from '../../mandate/JourneyRecap';
import { useMandateJourney } from '../useMandateJourney';
import styles from './MandateEngage.module.scss';

export interface MandateEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — gates the conviction staking via {@link StageGate}. */
  communityId: string;
  /**
   * Render JourneyRecap's own "View the published mandate" button. Default `true`
   * for standalone use (the InitiativeStagePanel mandate branch, which has no card
   * shell). The shared `InitiativeStageCard` appends its own blue Open button, so
   * `MandateActivityCard` passes `false` to avoid a duplicate CTA.
   */
  showViewMandate?: boolean;
}

/**
 * The Mandate stage's **Engage** slot, rendered inside the shared
 * `InitiativeStageCard`. Mandate is the LAST pipeline stage — there is no
 * "advance" control. It carries the journey recap (the whole arc culminating in
 * the published mandate, data via {@link useMandateJourney}) plus the real
 * mandate ACTION: time-weighted conviction staking ({@link MandateStage} →
 * `ConvictionStaking`), gated by the community's per-stage trust rule
 * ({@link StageGate}).
 *
 * NOTE (spec discrepancy): spec §3 calls Mandate "read-only", but the live
 * mandate participation is conviction/commitment staking. We KEEP it — dropping
 * it would remove the only commitment control. Flagged for the product owner.
 */
const MandateEngage: React.FC<MandateEngageProps> = ({
  initiativeId,
  communityId,
  showViewMandate = true,
}) => {
  const navigate = useNavigate();
  const { problemUp, discussion, proposals, vote } = useMandateJourney(initiativeId);

  return (
    <div className={styles.engage}>
      <JourneyRecap
        problemUp={problemUp}
        discussion={discussion}
        proposals={proposals}
        vote={vote}
        onViewMandate={
          showViewMandate ? () => navigate(`/mandate/${communityId}/${initiativeId}`) : undefined
        }
      />

      <StageGate communityId={communityId} stage="mandate">
        <MandateStage initiativeId={initiativeId} variant="dashboard" />
      </StageGate>
    </div>
  );
};

export default MandateEngage;
