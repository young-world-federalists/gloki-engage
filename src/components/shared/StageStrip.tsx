import React from 'react';
import clsx from 'clsx';
import { AlertCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import { useT } from '../../i18n';
import styles from './StageStrip.module.scss';

// The canonical 4-stage Gloki pipeline (Problem → Solutions → Vote → Mandate).
// Discussion is a function available at every stage, not a pipeline step, so it
// does not appear here (S16 IA decision). Icons + labels mirror
// `community/stageMeta.ts` (the dashboard/badge source of truth); the colours
// are strip-local because the Badge `info`/`primary` tones collapse to a single
// blue — the strip needs visually distinct stages. All fills are design tokens
// (see StageStrip.module.scss).
const STAGES = [
  { id: 'problem', icon: AlertCircle, labelKey: 'stage.problem', labelDefault: 'Problem' },
  { id: 'proposals', icon: Lightbulb, labelKey: 'stage.proposals', labelDefault: 'Solutions' },
  { id: 'vote', icon: Vote, labelKey: 'stage.vote', labelDefault: 'Vote' },
  { id: 'mandate', icon: ScrollText, labelKey: 'stage.mandate', labelDefault: 'Mandate' },
] as const;

export interface StageStripProps {
  /** Accessible label for the list. Defaults to "The governance stages" —
   *  deliberately distinct from the StageFooter nav's "Pipeline stages" so the
   *  two landmarks don't share an accessible name (Wave 5b). */
  ariaLabel?: string;
  /** Extra class for layout (e.g. margins) at the call site. */
  className?: string;
}

/**
 * Compact, read-only strip of the four governance stages
 * (Problem → Solutions → Vote → Mandate). A glanceable pipeline
 * anchor — NOT navigation and NOT the per-stage explainer (that prose lives
 * behind the page's `(i)`). Used on the task-first create screens so the
 * pipeline context stays visible after the explainer collapses.
 */
const StageStrip: React.FC<StageStripProps> = ({ ariaLabel, className }) => {
  const t = useT();
  return (
    <ol className={clsx(styles.strip, className)} aria-label={ariaLabel ?? t('stage.pipelineOverview', 'The governance stages')}>
      {STAGES.map((stage) => {
        const Icon = stage.icon;
        return (
          <li key={stage.id} className={clsx(styles.stage, styles[`stage_${stage.id}`])}>
            <span className={styles.circle} aria-hidden>
              <Icon size={16} />
            </span>
            <span className={styles.label}>{t(stage.labelKey, stage.labelDefault)}</span>
          </li>
        );
      })}
    </ol>
  );
};

export default StageStrip;
