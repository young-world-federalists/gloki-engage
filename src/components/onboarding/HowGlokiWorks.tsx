import React from 'react';
import clsx from 'clsx';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useT } from '../../i18n';
import {
  PIPELINE_STAGES,
  DEFAULT_STAGE_PERMISSIONS,
  VERIFIED_THRESHOLD,
  ONBOARDING_SEED,
  type PipelineStage,
} from '../../services/trustModel';
import styles from './HowGlokiWorks.module.scss';

export interface HowGlokiWorksProps {
  variant: 'compact' | 'full';
  /** compact only — the user's live vouch count for the "you're vouched by N" line. */
  vouchCount?: number;
}

interface StageGuide {
  stage: PipelineStage;
  icon: LucideIcon;
  labelKey: string;
  labelDefault: string;
  descKey: string;
  descDefault: string;
}

// Icons mirror StageFooter's stage iconography (StageFooter stays untouched);
// stage NAMES stay single-source via the already-localized `nav.*` keys.
const STAGE_GUIDE: StageGuide[] = [
  { stage: 'problem', icon: AlertCircle, labelKey: 'nav.problem', labelDefault: 'Problem', descKey: 'howGloki.problem.desc', descDefault: 'Name a shared problem and rally support behind it.' },
  { stage: 'discussion', icon: MessageCircle, labelKey: 'nav.discussion', labelDefault: 'Discuss', descKey: 'howGloki.discussion.desc', descDefault: 'Co-author the community’s shared understanding of it.' },
  { stage: 'proposals', icon: Lightbulb, labelKey: 'nav.proposals', labelDefault: 'Solutions', descKey: 'howGloki.proposals.desc', descDefault: 'Put forward concrete solutions to weigh.' },
  { stage: 'vote', icon: Vote, labelKey: 'nav.vote', labelDefault: 'Vote', descKey: 'howGloki.vote.desc', descDefault: 'Decide together — one person, one vote.' },
  { stage: 'mandate', icon: ScrollText, labelKey: 'nav.mandate', labelDefault: 'Mandate', descKey: 'howGloki.mandate.desc', descDefault: 'Turn the decision into a shared mandate for action.' },
];

/**
 * The single-source explainer for what Gloki is and how participation works.
 * `compact` seeds the model in the welcome journey; `full` is the About-page reference.
 * Trust copy is derived from the `trustModel` constants so it can never drift.
 */
const HowGlokiWorks: React.FC<HowGlokiWorksProps> = ({ variant, vouchCount }) => {
  const t = useT();
  const isFull = variant === 'full';

  const nameOf = (s: PipelineStage): string => {
    const g = STAGE_GUIDE.find((x) => x.stage === s)!;
    return t(g.labelKey, g.labelDefault);
  };
  const listJoin = (items: string[]): string =>
    items.length <= 1 ? items[0] ?? '' : `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;

  const open = listJoin(PIPELINE_STAGES.filter((s) => DEFAULT_STAGE_PERMISSIONS[s] !== 'verified').map(nameOf));
  const gated = listJoin(PIPELINE_STAGES.filter((s) => DEFAULT_STAGE_PERMISSIONS[s] === 'verified').map(nameOf));

  return (
    <section className={clsx(styles.root, isFull ? styles.full : styles.compact)}>
      {isFull && (
        <p className={styles.intro}>
          {t('howGloki.intro', 'Gloki is global direct democracy — communities decide what to do, together.')}
        </p>
      )}

      <h2 className={styles.sectionTitle}>{t('howGloki.pipelineTitle', 'How an idea travels')}</h2>
      <ol className={styles.pipeline}>
        {STAGE_GUIDE.map((g) => {
          const Icon = g.icon;
          return (
            <li key={g.stage} className={styles.stage}>
              <span className={styles.stageIcon} aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className={styles.stageText}>
                <span className={styles.stageName}>{t(g.labelKey, g.labelDefault)}</span>
                <span className={styles.stageDesc}>{t(g.descKey, g.descDefault)}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <h2 className={styles.sectionTitle}>{t('howGloki.trustTitle', 'What you can do')}</h2>
      {isFull ? (
        <ul className={styles.states}>
          <li className={styles.state}>
            {t('howGloki.state.unverified', 'Unverified (0 vouches) — you can read everything.')}
          </li>
          <li className={styles.state}>
            {t('howGloki.state.vouched', 'Vouched (1–{max}) — take part in {open}.', {
              max: VERIFIED_THRESHOLD - 1,
              open,
            })}
          </li>
          <li className={clsx(styles.state, styles.stateVerified)}>
            {t('howGloki.state.verified', 'Verified ({threshold}+) — you can take part in {gated}.', {
              threshold: VERIFIED_THRESHOLD,
              gated,
            })}
          </li>
        </ul>
      ) : (
        <p className={styles.trustLine}>
          {t(
            'howGloki.trust.compact',
            'You’re vouched by {count}. {open} are open to you now — reach {threshold} vouches to unlock {gated}.',
            { count: vouchCount ?? ONBOARDING_SEED, open, threshold: VERIFIED_THRESHOLD, gated },
          )}
        </p>
      )}

      <p className={styles.onePerson}>
        <ShieldCheck size={16} aria-hidden="true" />
        <span>{t('howGloki.onePersonOneVote', 'One person, one vote — always. No one can buy more say.')}</span>
      </p>
    </section>
  );
};

export default HowGlokiWorks;
