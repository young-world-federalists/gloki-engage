import React from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import { useT } from '../../i18n';
import type { PipelineStage } from '../../types/initiative';
import styles from './InitiativeStageStrip.module.scss';

// The canonical 5-stage Gloki pipeline (mirrors `community/stageMeta.ts` +
// the read-only `StageStrip` primitive). Colours are strip-local design tokens.
const STAGES = [
  { id: 'problem', icon: AlertCircle, labelKey: 'stage.problem', labelDefault: 'Problem' },
  { id: 'discussion', icon: MessageCircle, labelKey: 'stage.discussion', labelDefault: 'Discussion' },
  { id: 'proposals', icon: Lightbulb, labelKey: 'stage.proposals', labelDefault: 'Solutions' },
  { id: 'vote', icon: Vote, labelKey: 'stage.vote', labelDefault: 'Vote' },
  { id: 'mandate', icon: ScrollText, labelKey: 'stage.mandate', labelDefault: 'Mandate' },
] as const;

const ORDER: PipelineStage[] = ['problem', 'discussion', 'proposals', 'vote', 'mandate'];

export interface InitiativeStageStripProps {
  /** The stage the user is currently viewing — highlighted, marked aria-current. */
  current: PipelineStage;
  communityId: string;
  initiativeId: string;
  hostServer: string;
  hostAgent: string;
  className?: string;
}

/**
 * The *follow-this-initiative* control: a strip of the five governance stages
 * with the current stage highlighted, and tappable **only where a real surface
 * exists** for this initiative — Discussion and Mandate have their own routes;
 * the other stages render as progress markers (the inline dashboard only exposes
 * the initiative's *current* stage, so there is no past-stage surface to link).
 * Distinct from the global "Browse by stage" footer (cross-community discovery)
 * and from the read-only `StageStrip` primitive (a glanceable pipeline anchor).
 */
const InitiativeStageStrip: React.FC<InitiativeStageStripProps> = ({
  current,
  communityId,
  initiativeId,
  hostServer,
  hostAgent,
  className,
}) => {
  const t = useT();
  const navigate = useNavigate();
  const currentIndex = ORDER.indexOf(current);

  // A stage is navigable only when it has a real per-initiative destination AND
  // it isn't the stage you're already viewing.
  const targetFor = (id: PipelineStage): (() => void) | null => {
    if (id === current) return null;
    if (id === 'discussion') {
      return () =>
        navigate(
          `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${initiativeId}/discussion`,
        );
    }
    if (id === 'mandate') {
      return () => navigate(`/mandate/${communityId}/${initiativeId}`);
    }
    return null;
  };

  return (
    <ol
      className={clsx(styles.strip, className)}
      aria-label={t('stage.initiativeStripLabel', 'Stages of this initiative')}
    >
      {STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const isCurrent = stage.id === current;
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
        const onGo = targetFor(stage.id);
        const label = t(stage.labelKey, stage.labelDefault);

        const inner = (
          <>
            <span className={styles.circle} aria-hidden>
              <Icon size={16} />
            </span>
            <span className={styles.label}>{label}</span>
          </>
        );

        return (
          <li
            key={stage.id}
            className={clsx(styles.stage, styles[`stage_${stage.id}`], styles[state])}
            aria-current={isCurrent ? 'step' : undefined}
          >
            {onGo ? (
              <button
                type="button"
                className={styles.go}
                onClick={onGo}
                aria-label={t('stage.goTo', 'Go to {stage}', { stage: label })}
              >
                {inner}
              </button>
            ) : (
              <span className={styles.marker}>{inner}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default InitiativeStageStrip;
