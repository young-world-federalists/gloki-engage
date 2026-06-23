import React from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, TrustBadge } from '../shared';
import type { Collaboration } from '../../services/contracts/community';
import { useT } from '../../i18n';
import { STAGE_META } from './stageMeta';
import InitiativeStagePanel from '../collaboration/InitiativeStagePanel';
import ProblemActivityCard from './ProblemActivityCard';
import MandateActivityCard from './MandateActivityCard';
import styles from './ActivityCard.module.scss';

export interface ActivityCardProps {
  item: Collaboration;
  communityId: string;
  stage: string;
  authorName: string;
  authorKey?: string;
  trustState: React.ComponentProps<typeof TrustBadge>['state'];
  vouchCount: number;
  hostServer: string;
  hostAgent: string;
  expanded: boolean;
  onToggle: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  item, communityId, stage, authorName, authorKey, trustState, vouchCount,
  hostServer, hostAgent, expanded, onToggle,
}) => {
  const t = useT();
  const navigate = useNavigate();

  // The Problem stage renders the new shared two-part card (Read summary over an
  // Engage panel). Other stages keep the InitiativeStagePanel body until units
  // 2–4 convert them to the same shell.
  if (stage === 'problem') {
    return (
      <ProblemActivityCard
        item={item}
        communityId={communityId}
        authorName={authorName}
        authorKey={authorKey}
        trustState={trustState}
        vouchCount={vouchCount}
        hostServer={hostServer}
        hostAgent={hostAgent}
        expanded={expanded}
        onToggle={onToggle}
      />
    );
  }

  // The Mandate stage (last in the pipeline — no advance control) uses the same
  // shared shell: a journey recap + the gated conviction action in the Engage slot.
  if (stage === 'mandate') {
    return (
      <MandateActivityCard
        item={item}
        communityId={communityId}
        authorName={authorName}
        authorKey={authorKey}
        trustState={trustState}
        vouchCount={vouchCount}
        hostServer={hostServer}
        hostAgent={hostAgent}
        expanded={expanded}
        onToggle={onToggle}
      />
    );
  }

  const meta = STAGE_META[stage] || STAGE_META.problem;
  const Icon = meta.icon;
  const panelId = `activity-panel-${item.id}`;

  return (
    <Card as="article" className={styles.card}>
      <button
        type="button"
        className={styles.summary}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={styles.summaryMain}>
          <Badge tone={meta.tone}>
            <span className={styles.badgeInner}><Icon size={12} />{t(meta.labelKey, meta.labelDefault)}</span>
          </Badge>
          <span className={styles.title}>{item.title || t('community.untitled', 'Untitled Initiative')}</span>
          {authorName && (
            <span className={styles.byline}>
              {t('community.startedBy', 'Started by {name}', { name: authorName })}
              {authorKey && <TrustBadge state={trustState} vouchCount={vouchCount} size="sm" />}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
      </button>

      {expanded && (
        <div id={panelId} className={styles.panel}>
          <InitiativeStagePanel
            initiativeId={item.id}
            communityId={communityId}
            title={item.title || ''}
            hostServer={hostServer}
            hostAgent={hostAgent}
          />
          <button
            type="button"
            className={styles.deepLink}
            onClick={() =>
              navigate(`/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${item.id}/discussion`)
            }
          >
            {t('community.openDiscussion', 'Open discussion')} <ExternalLink size={14} aria-hidden />
          </button>
        </div>
      )}
    </Card>
  );
};

export default ActivityCard;
