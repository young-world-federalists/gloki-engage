import React from 'react';
import clsx from 'clsx';
import { useT } from '../../i18n';
import type { PipelineStage } from '../../types/initiative';
import styles from './InitiativeStageStrip.module.scss';

// The canonical 4-stage Gloki pipeline (mirrors `community/stageMeta.ts` +
// the read-only `StageStrip` primitive). Discussion is a function reachable at
// every stage via the DiscussionPill next to this strip, not a pipeline step
// (S16 IA decision) — initiatives whose data says `stage === 'discussion'`
// render in the Problem→Solutions gap (Problem done, nothing current).
const STAGES = [
  { id: 'problem', labelKey: 'stage.problem', labelDefault: 'Problem' },
  { id: 'proposals', labelKey: 'stage.proposals', labelDefault: 'Solutions' },
  { id: 'vote', labelKey: 'stage.vote', labelDefault: 'Vote' },
  { id: 'mandate', labelKey: 'stage.mandate', labelDefault: 'Mandate' },
] as const;

const ORDER: PipelineStage[] = ['problem', 'proposals', 'vote', 'mandate'];

export interface InitiativeStageStripProps {
  /** The stage the user is currently viewing — highlighted, marked aria-current. */
  current: PipelineStage;
  className?: string;
}

/**
 * The *where-is-this-initiative* marker: four compact stage pills with the
 * current stage tinted. A pure progress indicator — nothing here navigates
 * (S19 W2, Eston): stage browsing lives in the global StageFooter, discussion
 * on the DiscussionPill rendered alongside, and a published mandate is linked
 * from mandate-stage card content. Stage colour rides a small dot so the strip
 * keeps the pipeline vocabulary without out-shouting the card it sits in.
 */
const InitiativeStageStrip: React.FC<InitiativeStageStripProps> = ({ current, className }) => {
  const t = useT();
  // `discussion` is not in ORDER: an in-discussion initiative sits between
  // Problem (done) and Solutions (upcoming), with no stage marked current.
  const currentIndex = current === 'discussion' ? 0.5 : ORDER.indexOf(current);

  return (
    <ol
      className={clsx(styles.strip, className)}
      aria-label={t('stage.initiativeStripLabel', 'Stages of this initiative')}
    >
      {STAGES.map((stage, i) => {
        const isCurrent = stage.id === current;
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';

        return (
          <li
            key={stage.id}
            className={clsx(styles.stage, styles[`stage_${stage.id}`], styles[state])}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className={styles.pill}>
              <span className={styles.dot} aria-hidden="true" />
              {t(stage.labelKey, stage.labelDefault)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default InitiativeStageStrip;
