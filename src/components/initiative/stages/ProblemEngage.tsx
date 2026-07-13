import React from 'react';
import ErrorBoundary from '../../shared/ErrorBoundary';
import ProblemVoteFlow from '../../collaboration/flows/voting/ProblemVoteFlow';
import StageGate from '../../community/StageGate';
import { useT } from '../../../i18n';
import styles from './ProblemEngage.module.scss';

export interface ProblemEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — gates participation. */
  communityId: string;
  /** Active community member count — passed through to the vote flow's bar. */
  communityMemberCount: number;
}

/**
 * The Problem stage's Engage slot inside the shared InitiativeStageCard. Flush
 * (no card-in-a-card): the "Is this a shared problem?" vote ({@link ProblemVoteFlow},
 * gated by {@link StageGate}) with its threshold bar + caption is the whole body
 * now. The "Suggest" action and the problem-code chip moved to the card chin
 * (S30 A-5, {@link ProblemChinExtras}); discussion is the chin's DiscussionPill.
 */
const ProblemEngage: React.FC<ProblemEngageProps> = ({
  initiativeId,
  communityId,
  communityMemberCount,
}) => {
  const t = useT();

  return (
    <div className={styles.engage}>
      <StageGate communityId={communityId} stage="problem">
        <ErrorBoundary fallbackMessage={t('problems.voteError', 'Voting encountered an error.')}>
          <ProblemVoteFlow
            instanceId={`${initiativeId}_problem_vote`}
            description=""
            evidenceLinks={[]}
            countries={[]}
            communityMemberCount={communityMemberCount}
            parentContractId={initiativeId}
            stageKey="problemVoteContractId"
          />
        </ErrorBoundary>
      </StageGate>
    </div>
  );
};

export default ProblemEngage;
