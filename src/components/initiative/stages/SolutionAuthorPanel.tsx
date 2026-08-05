import React from 'react';
import { Inbox, Microscope, GitMerge, Check, X } from 'lucide-react';
import { UserIdentity } from '../../shared';
import type { TFunction } from '../../../i18n';
import styles from './SolutionAuthorPanel.module.scss';

export interface AuthorMergeSuggestion {
  target: string;
  suggester: string;
  timestamp: number;
  decision?: 'accepted' | 'declined';
}

export interface SolutionAuthorPanelProps {
  /** Public keys of members who asked for an expert review on this solution. */
  reviewRequests: string[];
  /** Whether an expert has actually reviewed it yet. */
  reviewed: boolean;
  /** Merge suggestions pointing this solution INTO another one. */
  mergeSuggestions: AuthorMergeSuggestion[];
  /** Resolve a proposal id to its (truncated) text, for naming the merge target. */
  targetTextOf: (proposalId: string) => string;
  authorName: (publicKey: string) => string;
  profiles: Record<string, { country?: string }>;
  /** Decide a merge suggestion. Disabled while a decision is in flight. */
  onDecideMerge: (targetId: string, decision: 'accepted' | 'declined') => void;
  decidingTarget: string | null;
  t: TFunction;
}

/**
 * S33 — what the AUTHOR sees on their own solution.
 *
 * Before this the app had no author perspective at all: a request for expert
 * review rendered as the same anonymous counter for the author, the requester and
 * a passing stranger, and a merge suggestion was written to the contract and read
 * by *nothing* — the person it was addressed to could not learn it existed.
 *
 * This panel renders only on a solution the viewer authored, and it is the one
 * place those two signals become addressed to someone.
 */
const SolutionAuthorPanel: React.FC<SolutionAuthorPanelProps> = ({
  reviewRequests, reviewed, mergeSuggestions, targetTextOf, authorName, profiles,
  onDecideMerge, decidingTarget, t,
}) => {
  const openMerges = mergeSuggestions.filter((m) => !m.decision);
  const settledMerges = mergeSuggestions.filter((m) => m.decision);
  const openCount = (reviewed ? 0 : reviewRequests.length) + openMerges.length;

  return (
    <section className={styles.panel} aria-label={t('mechanisms.approval.author.panelLabel', 'Your solution — things waiting on you')}>
      <header className={styles.head}>
        <Inbox size={16} aria-hidden className={styles.headIcon} />
        <h4 className={styles.title}>{t('mechanisms.approval.author.title', 'Your solution')}</h4>
        {openCount > 0 && (
          <span className={styles.badge}>
            {t('mechanisms.approval.author.openCount', '{n} waiting on you', { n: openCount })}
          </span>
        )}
      </header>

      {openCount === 0 && settledMerges.length === 0 && (
        <p className={styles.empty}>
          {t('mechanisms.approval.author.nothing', 'Nothing needs you right now. You’ll see requests for expert review and merge suggestions here.')}
        </p>
      )}

      {/* Expert review — the author can't grant this, so it's status, not an action. */}
      {reviewRequests.length > 0 && (
        <div className={styles.ask}>
          <p className={styles.askHead}>
            <Microscope size={15} aria-hidden />
            {reviewed
              ? t('mechanisms.approval.author.reviewDone', 'An expert has reviewed your solution.')
              : t('mechanisms.approval.author.reviewAsked', '{n} people asked for an expert to review your solution', { n: reviewRequests.length })}
          </p>
          <ul className={styles.who}>
            {reviewRequests.map((k) => (
              <li key={k}>
                <UserIdentity name={authorName(k)} countryCode={profiles[k]?.country} size="sm" />
              </li>
            ))}
          </ul>
          {!reviewed && (
            <p className={styles.note}>
              {t('mechanisms.approval.author.reviewNote', 'You don’t need to do anything — an expert has to pick it up. Adding sources and indicators makes that easier.')}
            </p>
          )}
        </div>
      )}

      {/* Merge suggestions — this IS the author's decision. */}
      {openMerges.map((m) => (
        <div key={`${m.suggester}:${m.target}`} className={styles.ask}>
          <p className={styles.askHead}>
            <GitMerge size={15} aria-hidden />
            {t('mechanisms.approval.author.mergeAsked', '{name} suggested merging your solution into another one', {
              name: authorName(m.suggester),
            })}
          </p>
          <p className={styles.targetQuote}>“{targetTextOf(m.target)}”</p>
          <div className={styles.decideRow}>
            <button
              type="button"
              className={styles.acceptBtn}
              onClick={() => onDecideMerge(m.target, 'accepted')}
              disabled={decidingTarget === m.target}
            >
              <Check size={15} aria-hidden />
              {t('mechanisms.approval.author.accept', 'Accept the merge')}
            </button>
            <button
              type="button"
              className={styles.declineBtn}
              onClick={() => onDecideMerge(m.target, 'declined')}
              disabled={decidingTarget === m.target}
            >
              <X size={15} aria-hidden />
              {t('mechanisms.approval.author.decline', 'Keep mine separate')}
            </button>
          </div>
        </div>
      ))}

      {settledMerges.map((m) => (
        <p key={`${m.suggester}:${m.target}`} className={styles.settled}>
          {m.decision === 'accepted'
            ? t('mechanisms.approval.author.mergeAccepted', 'You merged this into “{text}”.', { text: targetTextOf(m.target) })
            : t('mechanisms.approval.author.mergeDeclined', 'You kept this separate from “{text}”.', { text: targetTextOf(m.target) })}
        </p>
      ))}
    </section>
  );
};

export default SolutionAuthorPanel;
