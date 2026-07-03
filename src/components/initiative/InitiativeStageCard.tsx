import React, { useId } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Flag, ExternalLink } from 'lucide-react';
import { Card, Badge, UserIdentity } from '../shared';
import type { UserIdentityProps } from '../shared';
import { STAGE_META } from '../community/stageMeta';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { useT } from '../../i18n';
import type { PipelineStage } from '../../types/initiative';
import InitiativeStageStrip from './InitiativeStageStrip';
import DiscussionPill from './DiscussionPill';
import styles from './InitiativeStageCard.module.scss';

/** The read-zone data for one initiative card, independent of stage. */
export type StagePost = {
  stage: PipelineStage;
  /** The content shown as the headline — e.g. a problem statement, not a topic title. */
  headline: string;
  /** The initiative's name, shown above the headline where recognising WHICH
   *  initiative matters (the vote card — S17 N4, Eston 2026-07-03). Hidden when
   *  it equals the headline (the fallback case). Other stages omit it:
   *  content-as-headline stays the card model. */
  title?: string;
  /** e.g. "Started by Mei Chen". */
  byline?: string;
  /** Author public key — drives the trust badge (when present). */
  authorKey?: string;
  /** ISO 3166-1 alpha-2 country code for the author — renders a flag before the byline name. */
  authorCountry?: string;
  createdAt?: number;
  sdg?: { id: number | string; label: string };
  scope?: 'global' | 'community';
  countryCount?: number;
  source?: { label: string; url: string };
};

export interface InitiativeStageCardProps {
  post: StagePost;
  trustState?: UserIdentityProps['trustState'];
  vouchCount?: number;
  expanded: boolean;
  onToggle: () => void;
  /** The blue "Open the full {stage}" action. Omit (with openLabel) for card-only
   *  stages that have no dedicated page — the button is then not rendered. */
  onOpen?: () => void;
  /** Already-translated label for the open button. */
  openLabel?: string;
  /** A single muted line shown when collapsed (e.g. "12 agree · weigh in"). */
  collapsedTeaser?: React.ReactNode;
  /** Style the collapsed teaser as a tappable affordance (primary + semibold)
   *  instead of muted info — for CTA teasers like "Cast your vote". */
  teaserAction?: boolean;
  /** Routing context for the per-initiative stage strip (the follow-this-initiative
   *  control rendered atop the expanded panel). Omit to hide the strip. */
  stageNav?: {
    communityId: string;
    initiativeId: string;
    hostServer: string;
    hostAgent: string;
  };
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
  expanded,
  onToggle,
  onOpen,
  openLabel,
  collapsedTeaser,
  teaserAction,
  stageNav,
  children,
}) => {
  const t = useT();
  const meta = STAGE_META[post.stage] || STAGE_META.problem;
  const Icon = meta.icon;
  const panelId = useId();
  const showTitle = !!post.title && post.title !== post.headline;

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

        {showTitle && <span className={styles.titleLine}>{post.title}</span>}
        <span className={`${styles.headline} ${showTitle ? styles.headlineWithTitle : ''}`}>
          {post.headline}
        </span>

        {post.byline && (
          <span className={styles.byline}>
            <UserIdentity
              name={post.byline}
              countryCode={post.authorCountry}
              trustState={trustState}
              size="sm"
            />
            {post.createdAt != null && (
              <span className={styles.date}>{formatTimeAgo(t, post.createdAt)}</span>
            )}
          </span>
        )}
      </button>

      {expanded ? (
        <div id={panelId} className={styles.panel}>
          {stageNav && (
            <div className={styles.stageNavRow}>
              <InitiativeStageStrip current={post.stage} />
              <DiscussionPill
                initiativeId={stageNav.initiativeId}
                communityId={stageNav.communityId}
                hostServer={stageNav.hostServer}
                hostAgent={stageNav.hostAgent}
                active={post.stage === 'discussion'}
              />
            </div>
          )}
          {(post.scope || post.sdg || post.countryCount || post.source) && (
            <div className={styles.metaLine}>
              {post.scope && (
                <Badge tone={post.scope === 'global' ? 'info' : 'primary'} size="sm">
                  {post.scope === 'global'
                    ? t('problems.scopeGlobal', 'Global problem')
                    : t('problems.scopeCommunity', 'Community problem')}
                </Badge>
              )}
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
                  <ExternalLink size={16} aria-hidden />
                  {post.source.label}
                </a>
              )}
            </div>
          )}

          <div className={styles.engage}>
            {children}
            {onOpen && openLabel && (
              <button type="button" className={styles.openBtn} onClick={onOpen}>
                {openLabel}
                <ArrowRight size={16} aria-hidden />
              </button>
            )}
          </div>
        </div>
      ) : (
        collapsedTeaser ? (
          <div className={`${styles.teaser} ${teaserAction ? styles.teaserAction : ''}`}>
            {collapsedTeaser}
          </div>
        ) : null
      )}
    </Card>
  );
};

export default InitiativeStageCard;
