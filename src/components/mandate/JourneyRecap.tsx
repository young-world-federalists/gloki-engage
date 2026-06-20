import React from 'react';
import { Users, MessagesSquare, Lightbulb, Vote, ScrollText, ArrowRight } from 'lucide-react';
import { Button } from '../shared';
import { useT, type TFunction } from '../../i18n';
import type {
  DiscussionSummary,
  ProposalsSummary,
  VoteSummary,
} from '../collaboration/flows/shared/stageMetrics';
import styles from './JourneyRecap.module.scss';

interface JourneyRecapProps {
  /**
   * Compact horizontal arc (icons + short labels, no per-step text, no CTA) for
   * embedding — e.g. inside MandateCard. The data props are unused when compact.
   */
  compact?: boolean;
  /** Upvotes ("seconds") on the problem, if known. */
  problemUp?: number;
  discussion?: DiscussionSummary | null;
  proposals?: ProposalsSummary | null;
  vote?: VoteSummary | null;
  onViewMandate?: () => void;
}

/** Single source of the five journey steps (icons + labels) for both variants. */
const STEP_META = [
  { Icon: Users, labelKey: 'mandate.recapChoseTitle', labelDefault: 'Chosen together', shortKey: 'mandate.recapShortChose', shortDefault: 'Chosen' },
  { Icon: MessagesSquare, labelKey: 'mandate.recapDelibTitle', labelDefault: 'Deliberated across borders', shortKey: 'mandate.recapShortDelib', shortDefault: 'Deliberated' },
  { Icon: Lightbulb, labelKey: 'mandate.recapProposeTitle', labelDefault: 'Proposed solutions', shortKey: 'mandate.recapShortPropose', shortDefault: 'Proposed' },
  { Icon: Vote, labelKey: 'mandate.recapVoteTitle', labelDefault: 'Voted', shortKey: 'mandate.recapShortVote', shortDefault: 'Voted' },
  { Icon: ScrollText, labelKey: 'mandate.recapMandateTitle', labelDefault: 'Published as a mandate', shortKey: 'mandate.recapShortMandate', shortDefault: 'Mandate' },
] as const;

/** The per-step narration (full variant only) — enriched by live data where present. */
function stepTexts(
  t: TFunction,
  problemUp: number,
  discussion: DiscussionSummary | null,
  proposals: ProposalsSummary | null,
  vote: VoteSummary | null,
): string[] {
  return [
    problemUp > 0
      ? t('mandate.recapChoseData', '{n} members seconded this as a shared problem.', { n: problemUp })
      : t('mandate.recapChoseGeneric', 'The community agreed this was a shared problem worth taking on.'),
    discussion
      ? t('mandate.recapDelibData', '{participants} people shared {comments} perspectives.', {
          participants: discussion.participants,
          comments: discussion.comments,
        })
      : t('mandate.recapDelibGeneric', 'Members deliberated across countries and languages.'),
    proposals
      ? proposals.topApprovedText
        ? t('mandate.recapProposeData', '{n} solutions proposed, led by “{top}”.', {
            n: proposals.proposals,
            top: proposals.topApprovedText,
          })
        : t('mandate.recapProposeCount', '{n} solutions proposed and refined.', { n: proposals.proposals })
      : t('mandate.recapProposeGeneric', 'Solutions were proposed, merged, and refined together.'),
    vote?.winnerText
      ? t('mandate.recapVoteData', 'The community chose “{winner}”.', { winner: vote.winnerText })
      : t('mandate.recapVoteGeneric', 'The community voted on the strongest solutions.'),
    t('mandate.recapMandateText', 'Backed by sustained conviction and published as a mandate the community can point to.'),
  ];
}

/**
 * E3 — "the story so far". Stitches the completed-stage summaries into one
 * readable arc that culminates in the published mandate. The full variant is the
 * dashboard's vertical timeline; the compact variant is a condensed horizontal
 * strip embedded in MandateCard. Single source of step data/icons.
 */
const JourneyRecap: React.FC<JourneyRecapProps> = ({
  compact = false,
  problemUp = 0,
  discussion = null,
  proposals = null,
  vote = null,
  onViewMandate,
}) => {
  const t = useT();

  if (compact) {
    return (
      <ol className={styles.compactSteps} aria-label={t('mandate.recapTitle', 'The story so far')}>
        {STEP_META.map((s, i) => {
          const Icon = s.Icon;
          return (
            <li key={i} className={styles.compactStep}>
              <span className={styles.compactDot}>
                <Icon size={14} aria-hidden />
              </span>
              <span className={styles.compactLabel}>{t(s.shortKey, s.shortDefault)}</span>
              {i < STEP_META.length - 1 && <span className={styles.compactConnector} aria-hidden />}
            </li>
          );
        })}
      </ol>
    );
  }

  const texts = stepTexts(t, problemUp, discussion, proposals, vote);

  return (
    <section className={styles.recap} aria-labelledby="journey-heading">
      <h2 id="journey-heading" className={styles.title}>
        {t('mandate.recapTitle', 'The story so far')}
      </h2>
      <ol className={styles.steps}>
        {STEP_META.map((s, i) => {
          const Icon = s.Icon;
          return (
            <li key={i} className={styles.step}>
              <span className={styles.marker}>
                <span className={styles.dot}>
                  <Icon size={15} aria-hidden />
                </span>
                {i < STEP_META.length - 1 && <span className={styles.line} aria-hidden />}
              </span>
              <div className={styles.body}>
                <span className={styles.stepLabel}>{t(s.labelKey, s.labelDefault)}</span>
                <span className={styles.stepText}>{texts[i]}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {onViewMandate && (
        <Button variant="primary" fullWidth rightIcon={<ArrowRight size={16} aria-hidden />} onClick={onViewMandate}>
          {t('mandate.viewPublished', 'View the published mandate')}
        </Button>
      )}
    </section>
  );
};

export default JourneyRecap;
