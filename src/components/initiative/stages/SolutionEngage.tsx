import React from 'react';
import StageGate from '../../community/StageGate';
import ProposalsStage from '../../stages/ProposalsStage';
import styles from './SolutionEngage.module.scss';

export interface SolutionEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — gates the proposals participation via {@link StageGate}. */
  communityId: string;
  /** Initiative title, forwarded to ProposalsStage. */
  title: string;
  /** Host coordinates, forwarded to ProposalsStage. */
  hostServer: string;
  hostAgent: string;
  /** Active member count — denominator for the solutions threshold. */
  communityMemberCount?: number;
  /** Community display name, threaded through to the Top causes panel's
   *  discussion status badge (S35 fix-round F4 pattern). */
  communityName?: string;
}

/**
 * The Solution (proposals) stage's **Engage** slot, rendered inside the shared
 * `InitiativeStageCard`. It WRAPS the existing rich {@link ProposalsStage} — the
 * proposal slate + support + merge/expert-review panel — so that richness is
 * preserved exactly (spec §3: "keeps its richness but gains hierarchy"). The card
 * shell owns the read chrome (headline, byline, meta); this slot only carries the
 * participation UI, gated by the community's per-stage trust rule ({@link StageGate}).
 *
 * Carries its own StageGate so callers must render it OUTSIDE any shared gate to
 * avoid double-gating (mirrors MandateEngage).
 */
const SolutionEngage: React.FC<SolutionEngageProps> = ({
  initiativeId,
  communityId,
  title,
  hostServer,
  hostAgent,
  communityMemberCount,
  communityName,
}) => {
  return (
    <div className={styles.engage}>
      <StageGate communityId={communityId} stage="proposals">
        <ProposalsStage
          variant="dashboard"
          initiativeId={initiativeId}
          communityId={communityId}
          title={title}
          hostServer={hostServer}
          hostAgent={hostAgent}
          communityMemberCount={communityMemberCount}
          communityName={communityName}
        />
      </StageGate>
    </div>
  );
};

export default SolutionEngage;
