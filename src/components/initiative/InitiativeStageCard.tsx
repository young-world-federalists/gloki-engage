import React, { useId } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Flag, ExternalLink } from 'lucide-react';
import { Card, Badge, TrustBadge } from '../shared';
import { STAGE_META } from '../community/stageMeta';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { useT } from '../../i18n';
import type { PipelineStage } from '../../types/initiative';
import styles from './InitiativeStageCard.module.scss';

/** The read-zone data for one initiative card, independent of stage. */
export type StagePost = {
  stage: PipelineStage;
  /** The content shown as the headline — e.g. a problem statement, not a topic title. */
  headline: string;
  /** e.g. "Started by Mei Chen". */
  byline?: string;
  /** Author public key — drives the trust badge (when present). */
  authorKey?: string;
  createdAt?: number;
  sdg?: { id: number | string; label: string };
  countryCount?: number;
  source?: { label: string; url: string };
};

export interface InitiativeStageCardProps {
  post: StagePost;
  trustState?: React.ComponentProps<typeof TrustBadge>['state'];
  vouchCount?: number;
  expanded: boolean;
  onToggle: () => void;
  /** The blue "Open the full {stage}" action. */
  onOpen: () => void;
  /** Already-translated label for the open button. */
  openLabel: string;
  /** A single muted line shown when collapsed (e.g. "12 agree · weigh in"). */
  collapsedTeaser?: React.ReactNode;
  /** The per-stage Engage UI — rendered only when expanded, in the shaded panel. */
  children?: React.ReactNode;
}

/**
 * The one shared card shell for every pipeline stage. Two zones, never
 * interleaved: a **Read** summary (a stage pill, the content as the headline, a
 * single byline) that's always visible, over an **Engage** panel (the per-stage
 * quick action + a blue "Open the full {stage}") revealed on expand. Collapsed it
 * shows just the read summary + an optional one-line teaser — scan fast, dive on
 * tap (the Mandate-card model generalised to all stages).
 */
const InitiativeStageCard: React.FC<InitiativeStageCardProps> = ({
  post,
  trustState,
  vouchCount,
  expanded,
  onToggle,
  onOpen,
  openLabel,
  collapsedTeaser,
  children,
}) => {
  const t = useT();
  const meta = STAGE_META[post.stage] || STAGE_META.problem;
  const Icon = meta.icon;
  const panelId = useId();

  return (
    <Card as="article" className={styles.card}>
      <button
        type="button"
        className={styles.summary}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={styles.badgeRow}>
          <Badge tone={meta.tone}>
            <span className={styles.badgeInner}>
              <Icon size={12} />
              {t(meta.labelKey, meta.labelDefault)}
            </span>
          </Badge>
          {expanded ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
        </span>

        <span className={styles.headline}>{post.headline}</span>

        {post.byline && (
          <span className={styles.byline}>
            <span className={styles.bylineName}>{post.byline}</span>
            {post.authorKey && trustState && (
              <TrustBadge state={trustState} vouchCount={vouchCount ?? 0} size="sm" />
            )}
            {post.createdAt != null && (
              <span className={styles.date}>{formatTimeAgo(t, post.createdAt)}</span>
            )}
          </span>
        )}
      </button>

      {expanded ? (
        <div id={panelId} className={styles.panel}>
          {(post.sdg || post.countryCount || post.source) && (
            <div className={styles.metaLine}>
              {post.sdg && (
                <span className={styles.metaItem}>
                  {t('problems.sdgTag', 'SDG {id} · {label}', { id: post.sdg.id, label: post.sdg.label })}
                </span>
              )}
              {post.countryCount ? (
                <span className={styles.metaItem}>
                  <Flag size={13} aria-hidden />
                  {t('problems.nCountries', '{n} countries', { n: post.countryCount })}
                </span>
              ) : null}
              {post.source && (
                <a
                  className={styles.metaItem}
                  href={post.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={13} aria-hidden />
                  {post.source.label}
                </a>
              )}
            </div>
          )}

          <div className={styles.engage}>
            {children}
            <button type="button" className={styles.openBtn} onClick={onOpen}>
              {openLabel}
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        collapsedTeaser ? <div className={styles.teaser}>{collapsedTeaser}</div> : null
      )}
    </Card>
  );
};

export default InitiativeStageCard;
