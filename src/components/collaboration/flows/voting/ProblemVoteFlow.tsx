import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useFlowContract } from '../shared/useFlowContract';
import * as api from './problemVoteApi';
import { useAppSelector } from '../../../../store/hooks';
const problemVoteCode = '';import { sanitizeExternalUrl } from '../../../../utils/urlSafety';
import { getCountryByCode, getCountryName } from '../../../../utils/countries';
import { useI18n } from '../../../../i18n';
import { ProgressBar } from '../../../shared';
import styles from './ProblemVoteFlow.module.scss';

interface ProblemVoteFlowProps {
  instanceId: string;
  description: string;
  evidenceLinks: string[];
  countries: string[];
  communityMemberCount: number;
  parentContractId?: string;
  stageKey?: string;
}

interface Tally {
  up: number;
  down: number;
  total: number;
}

const ProblemVoteFlow: React.FC<ProblemVoteFlowProps> = ({
  instanceId,
  description,
  evidenceLinks,
  countries,
  communityMemberCount,
  parentContractId,
  stageKey,
}) => {
  const { t, locale } = useI18n();
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    instanceId, 'problem_vote', 'problem_vote_contract.py', problemVoteCode, parentContractId, stageKey,
  );
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [tally, setTally] = useState<Tally>({ up: 0, down: 0, total: 0 });
  const [myVote, setMyVote] = useState<'up' | 'down' | null>(null);
  const [voting, setVoting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const tallyRes = await api.getTally(serverUrl, publicKey, contractId);
      setTally((tallyRes as Tally) || { up: 0, down: 0, total: 0 });

      try {
        const myVoteRes = await api.getMyVote(serverUrl, publicKey, contractId);
        setMyVote(myVoteRes === 'up' ? 'up' : myVoteRes === 'down' ? 'down' : null);
      } catch {
        // Backward compatibility for contracts deployed before get_my_vote existed.
        const votesRes = await api.getVotes(serverUrl, publicKey, contractId);
        const votes = (votesRes as Record<string, string>) || {};
        setMyVote(votes[publicKey] === 'up' ? 'up' : votes[publicKey] === 'down' ? 'down' : null);
      }
    } catch (err) {
      console.error('Failed to fetch problem vote data:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => {
    if (isReady) fetchData();
  }, [isReady, fetchData]);

  const handleVote = async (direction: 'up' | 'down') => {
    if (!serverUrl || !publicKey || !contractId || voting) return;
    setVoting(true);

    // Optimistic update
    const prevTally = { ...tally };
    const prevVote = myVote;
    if (myVote === direction) {
      // Removing vote
      setTally({
        up: tally.up - (direction === 'up' ? 1 : 0),
        down: tally.down - (direction === 'down' ? 1 : 0),
        total: tally.total - 1,
      });
      setMyVote(null);
    } else {
      // Changing or new vote
      setTally({
        up: tally.up + (direction === 'up' ? 1 : 0) - (myVote === 'up' ? 1 : 0),
        down: tally.down + (direction === 'down' ? 1 : 0) - (myVote === 'down' ? 1 : 0),
        total: tally.total + (myVote === null ? 1 : 0),
      });
      setMyVote(direction);
    }

    try {
      if (prevVote === direction) {
        await api.removeVote(serverUrl, publicKey, contractId);
      } else if (direction === 'up') {
        await api.upvote(serverUrl, publicKey, contractId);
      } else {
        await api.downvote(serverUrl, publicKey, contractId);
      }
      await fetchData();
    } catch (err) {
      // Rollback on failure
      setTally(prevTally);
      setMyVote(prevVote);
      console.error('Failed to vote:', err);
    } finally {
      setVoting(false);
    }
  };

  const thresholdMet = communityMemberCount > 0 && tally.up / communityMemberCount >= 0.50;
  // The bar's denominator: half the community, floored at 1 (a 0-member read must
  // not divide by zero). Value is clamped to it so aria-valuenow never exceeds
  // aria-valuemax once seconding passes the halfway mark (review S30 #1).
  const threshold = Math.max(Math.ceil(communityMemberCount * 0.50), 1);
  // A-4: the plain-language threshold line, relocated here from the floating <p>
  // in ProblemEngage so it captions the bar it explains — and doubles as the
  // ProgressBar's accessible name (A-3).
  const thresholdHint = thresholdMet
    ? t('problems.thresholdMetHint', 'Agreed by at least half of your community.')
    : t('problems.thresholdHintShort', 'It becomes a shared problem once at least half of your community agrees.');
  const safeEvidenceLinks = evidenceLinks
    .map((link) => sanitizeExternalUrl(link))
    .filter((link): link is string => link !== null);

  if (hasError) return (
    <div className={styles.loading}>
      <p>{errorMessage || t('mechanisms.problem.setupError', 'Failed to set up voting.')}</p>
      <button onClick={retry} className={styles.retryBtn}>{t('common.retry', 'Try again')}</button>
    </div>
  );
  if (isDeploying || !isReady) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>{statusMessage || t('mechanisms.problem.settingUp', 'Setting up voting…')}</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Problem details */}
      {description && <p className={styles.description}>{description}</p>}
      {safeEvidenceLinks.length > 0 && (
        <div className={styles.evidence}>
          <h4>{t('mechanisms.problem.evidence', 'Evidence')}</h4>
          <ul>
            {safeEvidenceLinks.map((link, i) => (
              <li key={i}>
                <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {countries.length > 0 && (
        <div className={styles.countries}>
          {countries.map((code) => {
            const country = getCountryByCode(code);
            return (
              <span key={code} className={styles.chip} title={getCountryName(code, locale)}>
                {country.flag} {getCountryName(code, locale)}
              </span>
            );
          })}
        </div>
      )}

      {/* Voting */}
      <div className={styles.votingSection}>
        <h4>{t('mechanisms.problem.heading', 'Is this a shared problem?')}</h4>
        <div className={styles.voteButtons}>
          <button
            className={`${styles.voteBtn} ${styles.upBtn} ${myVote === 'up' ? styles.active : ''}`}
            onClick={() => handleVote('up')}
            disabled={voting}
          >
            <ThumbsUp size={18} />
            <span>{t('mechanisms.problem.second', 'Second it')}</span>
            <span className={styles.voteCount}>{tally.up}</span>
          </button>
          <button
            className={`${styles.voteBtn} ${styles.downBtn} ${myVote === 'down' ? styles.active : ''}`}
            onClick={() => handleVote('down')}
            disabled={voting}
          >
            <ThumbsDown size={18} />
            <span>{t('mechanisms.problem.notForMe', 'Not for me')}</span>
            <span className={styles.voteCount}>{tally.down}</span>
          </button>
        </div>

        {/* Threshold progress toward the 50%-agreement bar. S30 A-3: the shared
            ProgressBar kit — was a bespoke track with a redundant gray end-line
            marker (thresholdMarker, left:100%) and zero ARIA. The kit brings
            role=progressbar + aria-valuenow/max. */}
        <div className={styles.thresholdSection}>
          <ProgressBar
            value={Math.min(tally.up, threshold)}
            max={threshold}
            label={thresholdHint}
            variant={thresholdMet ? 'success' : 'primary'}
            size="md"
          />
          <div className={styles.thresholdLabels}>
            <span>{t('mechanisms.problem.secondedCount', '{n} seconded', { n: tally.up })}</span>
            <span className={styles.thresholdTarget}>
              {thresholdMet
                ? t('mechanisms.problem.thresholdMet', 'Enough agree!')
                : t('mechanisms.problem.moreNeeded', '{n} more to go', {
                    n: Math.max(Math.ceil(communityMemberCount * 0.50) - tally.up, 0),
                  })}
            </span>
          </div>
          {/* A-4: the "agreed by half…" line, relocated from the floating <p> in
              ProblemEngage to caption the bar directly. aria-hidden — the
              ProgressBar's aria-label already announces this copy. */}
          <p className={styles.thresholdCaption} aria-hidden>{thresholdHint}</p>
        </div>

        {myVote && (
          <p className={styles.yourVote}>
            {myVote === 'up'
              ? t('mechanisms.problem.youSeconded', 'You seconded this')
              : t('mechanisms.problem.youDeclined', 'You marked this “not for me”')}{' '}
            <span className={styles.undoHint}>{t('mechanisms.problem.tapToUndo', '(tap again to undo)')}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default ProblemVoteFlow;
