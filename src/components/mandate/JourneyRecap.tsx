import React from 'react';
import { Users, MessagesSquare, Lightbulb, Vote, ScrollText, ArrowRight } from 'lucide-react';
import { Button } from '../shared';
import { useT } from '../../i18n';
import type {
  DiscussionSummary,
  ProposalsSummary,
  VoteSummary,
} from '../collaboration/flows/shared/stageMetrics';
import styles from './JourneyRecap.module.scss';

interface JourneyRecapProps {
  /** Upvotes ("seconds") on the problem, if known. */
  problemUp: number;
  discussion: DiscussionSummary | null;
  proposals: ProposalsSummary | null;
  vote: VoteSummary | null;
  onViewMandate: () => void;
}

/**
 * E3 — "the story so far". Stitches the completed-stage summaries the dashboard
 * already fetched into one readable narrative so the whole journey reads back as
 * a story that culminates in the published mandate. Each step enriches with live
 * data where available and falls back to plain narration otherwise, so it always
 * tells a coherent arc.
 */
const JourneyRecap: React.FC<JourneyRecapProps> = ({
  problemUp,
  discussion,
  proposals,
  vote,
  onViewMandate,
}) => {
  const t = useT();

  const steps = [
    {
      icon: <Users size={15} aria-hidden />,
      label: t('mandate.recapChoseTitle', 'Chosen together'),
      text:
        problemUp > 0
          ? t('mandate.recapChoseData', '{n} members seconded this as a shared problem.', {
              n: problemUp,
            })
          : t('mandate.recapChoseGeneric', 'The community agreed this was a shared problem worth taking on.'),
    },
    {
      icon: <MessagesSquare size={15} aria-hidden />,
      label: t('mandate.recapDelibTitle', 'Deliberated across borders'),
      text: discussion
        ? t('mandate.recapDelibData', '{participants} people shared {comments} perspectives.', {
            participants: discussion.participants,
            comments: discussion.comments,
          })
        : t('mandate.recapDelibGeneric', 'Members deliberated across countries and languages.'),
    },
    {
      icon: <Lightbulb size={15} aria-hidden />,
      label: t('mandate.recapProposeTitle', 'Proposed solutions'),
      text: proposals
        ? proposals.topApprovedText
          ? t('mandate.recapProposeData', '{n} solutions proposed, led by “{top}”.', {
              n: proposals.proposals,
              top: proposals.topApprovedText,
            })
          : t('mandate.recapProposeCount', '{n} solutions proposed and refined.', {
              n: proposals.proposals,
            })
        : t('mandate.recapProposeGeneric', 'Solutions were proposed, merged, and refined together.'),
    },
    {
      icon: <Vote size={15} aria-hidden />,
      label: t('mandate.recapVoteTitle', 'Voted'),
      text: vote?.winnerText
        ? t('mandate.recapVoteData', 'The community chose “{winner}”.', { winner: vote.winnerText })
        : t('mandate.recapVoteGeneric', 'The community voted on the strongest proposals.'),
    },
    {
      icon: <ScrollText size={15} aria-hidden />,
      label: t('mandate.recapMandateTitle', 'Published as a mandate'),
      text: t(
        'mandate.recapMandateText',
        'Backed by sustained conviction and published as a mandate the community can point to.',
      ),
    },
  ];

  return (
    <section className={styles.recap} aria-labelledby="journey-heading">
      <h2 id="journey-heading" className={styles.title}>
        {t('mandate.recapTitle', 'The story so far')}
      </h2>
      <ol className={styles.steps}>
        {steps.map((s, i) => (
          <li key={i} className={styles.step}>
            <span className={styles.marker}>
              <span className={styles.dot}>{s.icon}</span>
              {i < steps.length - 1 && <span className={styles.line} aria-hidden />}
            </span>
            <div className={styles.body}>
              <span className={styles.stepLabel}>{s.label}</span>
              <span className={styles.stepText}>{s.text}</span>
            </div>
          </li>
        ))}
      </ol>
      <Button
        variant="primary"
        fullWidth
        rightIcon={<ArrowRight size={16} aria-hidden />}
        onClick={onViewMandate}
      >
        {t('mandate.viewPublished', 'View the published mandate')}
      </Button>
    </section>
  );
};

export default JourneyRecap;
