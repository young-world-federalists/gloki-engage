import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Send } from 'lucide-react';
import { useT } from '../../i18n';
import { codeForId } from '../../utils/problemCode';
import styles from './ProblemChinExtras.module.scss';

export interface ProblemChinExtrasProps {
  /** The initiative contract id — drives the suggest deep link + the problem code. */
  initiativeId: string;
  /** Hosting community — part of the suggest route. */
  communityId: string;
  /** Host coordinates for the Suggest deep link. */
  hostServer: string;
  hostAgent: string;
  /** Problem author — the recipient of "Send suggestion to author" (DM). */
  authorKey?: string;
  authorName?: string;
}

/**
 * The Problem card's chin extras (S30 A-5): a "Suggest" secondary action pill
 * (DM the author) + the copyable problem-code chip. Lifted out of ProblemEngage's
 * body into the card chin so both chin owners render an identical set —
 * InitiativeStageCard via its `chinExtras` slot, FeedEngagePanel directly.
 *
 * Returns a Fragment so its pieces are direct flex children of the chin: the
 * suggest pill shares row 1 with the DiscussionPill; the code chip takes its own
 * full-width row (flex-basis:100%). The pill echoes DiscussionPill's outlined-pill
 * grammar (it IS interactive); the code chip stays a quiet copy affordance.
 */
const ProblemChinExtras: React.FC<ProblemChinExtrasProps> = ({
  initiativeId,
  communityId,
  hostServer,
  hostAgent,
  authorKey,
  authorName,
}) => {
  const t = useT();
  const navigate = useNavigate();
  const base = `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${initiativeId}`;

  return (
    <>
      <button
        type="button"
        className={styles.suggestPill}
        onClick={() => navigate(`${base}/suggest`, { state: { authorKey, authorName } })}
        aria-label={t('card.suggestToAuthor', 'Send suggestion to author')}
      >
        <Send size={16} aria-hidden />
        <span>{t('card.suggestToAuthorShort', 'Suggest')}</span>
      </button>

      <button
        type="button"
        className={styles.codeChip}
        onClick={() => navigator.clipboard?.writeText(codeForId(initiativeId))}
        aria-label={t('writeTogether.copyCode', 'Copy problem code')}
      >
        <span className={styles.codeLabel}>{t('writeTogether.problemCodeLabel', 'Problem code')}</span>
        <code className={styles.codeValue}>{codeForId(initiativeId)}</code>
        <Copy size={16} aria-hidden />
      </button>
    </>
  );
};

export default ProblemChinExtras;
