import React from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, UserIdentity } from '../shared';
import type { UserIdentityProps } from '../shared';
import { useAppSelector } from '../../store/hooks';
import type { Collaboration } from '../../services/contracts/community';
import { useT } from '../../i18n';
import { STAGE_META } from './stageMeta';
import InitiativeStagePanel from '../collaboration/InitiativeStagePanel';
import ProblemActivityCard from './ProblemActivityCard';
import DiscussionActivityCard from './DiscussionActivityCard';
import SolutionActivityCard from './SolutionActivityCard';
import VoteActivityCard from './VoteActivityCard';
import MandateActivityCard from './MandateActivityCard';
import styles from './ActivityCard.module.scss';

export interface ActivityCardProps {
  item: Collaboration;
  communityId: string;
  stage: string;
  authorName: string;
  authorKey?: string;
  trustState: UserIdentityProps['trustState'];
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
  const profiles = useAppSelector((s) => s.communities.profiles);

  // The Problem stage renders the new shared two-part card (Read summary over an
  // Engage panel). Problem/Solution/Mandate are converted; the remaining stages
  // keep the InitiativeStagePanel body until later units convert them.
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

  // The Discussion stage uses the same shared shell: a live, per-initiative
  // co-authoring preview (or a friendly empty state) in the Engage slot, plus a
  // blue "Open the co-authoring space" to the full view (Discussion has a real
  // destination page, like Mandate).
  if (stage === 'discussion') {
    return (
      <DiscussionActivityCard
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

  // The Solution stage (proposals) uses the same shared shell: the existing rich
  // proposal slate (wrapped, not rebuilt) + the author/co-author advance control
  // in the Engage slot.
  if (stage === 'proposals') {
    return (
      <SolutionActivityCard
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

  // The Vote stage uses the same shared shell: a "Cast your vote" teaser that
  // expands to the full ballot inline (gated) + the advance control (vote → mandate).
  if (stage === 'vote') {
    return (
      <VoteActivityCard
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
              <UserIdentity
                name={t('community.startedBy', 'Started by {name}', { name: authorName })}
                countryCode={authorKey ? profiles[authorKey]?.country : undefined}
                trustState={trustState}
                size="sm"
              />
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
            {t('community.openDiscussion', 'Open discussion')} <ExternalLink size={16} aria-hidden />
          </button>
        </div>
      )}
    </Card>
  );
};

export default ActivityCard;
