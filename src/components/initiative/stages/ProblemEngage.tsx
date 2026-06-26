import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, MessageCircle, Send } from 'lucide-react';
import ErrorBoundary from '../../shared/ErrorBoundary';
import ProblemVoteFlow from '../../collaboration/flows/voting/ProblemVoteFlow';
import StageGate from '../../community/StageGate';
import { Button } from '../../shared';
import { useT } from '../../../i18n';
import { codeForId } from '../../../utils/problemCode';
import styles from './ProblemEngage.module.scss';

export interface ProblemEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
  /** Hosting community — gates participation. */
  communityId: string;
  /** Active community member count, for the threshold copy. */
  communityMemberCount: number;
  /** Live "second" upvote count (read by the parent), for the threshold copy. */
  up: number;
  /** Host coordinates for the Discuss / Suggest deep links. */
  hostServer: string;
  hostAgent: string;
  /** Problem author — the recipient of "Send suggestion to author". */
  authorKey?: string;
  authorName?: string;
}

/**
 * The Problem stage's Engage slot inside the shared InitiativeStageCard. Flush
 * (no card-in-a-card): the "Is this a shared problem?" vote ({@link ProblemVoteFlow},
 * gated by {@link StageGate}) first, then a plain-language threshold line, then two
 * clear actions — Discuss this problem (threaded chat) and Send suggestion to
 * author (DM). Advancement is the shared-problem vote only; discussion is ungated.
 */
const ProblemEngage: React.FC<ProblemEngageProps> = ({
  initiativeId,
  communityId,
  communityMemberCount,
  up,
  hostServer,
  hostAgent,
  authorKey,
  authorName,
}) => {
  const t = useT();
  const navigate = useNavigate();

  const needed = Math.max(Math.ceil(communityMemberCount * 0.5), 1);
  const thresholdMet = up >= needed;

  const base = `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${initiativeId}`;
  const openDiscussion = () => navigate(`${base}/discussion`);
  const openSuggest = () => navigate(`${base}/suggest`, { state: { authorKey, authorName } });

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

      <p className={styles.thresholdHint}>
        {thresholdMet
          ? t('problems.thresholdMetHint', 'Agreed by at least half of your community.')
          : t('problems.thresholdHintShort', 'It becomes a shared problem once at least half of your community agrees.')}
      </p>

      <button
        type="button"
        className={styles.codeChip}
        onClick={() => navigator.clipboard?.writeText(codeForId(initiativeId))}
        aria-label={t('writeTogether.copyCode', 'Copy problem code')}
      >
        <span className={styles.codeLabel}>{t('writeTogether.problemCodeLabel', 'Problem code')}</span>
        <code className={styles.codeValue}>{codeForId(initiativeId)}</code>
        <Copy size={14} aria-hidden />
      </button>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={openDiscussion}>
          <MessageCircle size={16} aria-hidden /> {t('card.discussProblem', 'Discuss this problem')}
        </Button>
        <Button variant="secondary" onClick={openSuggest}>
          <Send size={16} aria-hidden /> {t('card.suggestToAuthor', 'Send suggestion to author')}
        </Button>
      </div>
    </div>
  );
};

export default ProblemEngage;
