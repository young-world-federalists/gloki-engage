import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useUrlExpandedSet } from '../hooks/useUrlExpandedSet';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useAllInitiatives, type InitiativeWithMeta } from '../hooks/useAllInitiatives';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import type { PipelineStage } from '../types/initiative';
import AppHeader from '../components/AppHeader';
import { UserIdentity, Banner } from '../components/shared';
import FeedEngagePanel from '../components/initiative/FeedEngagePanel';
import { useCommunityTrust } from '../hooks/useCommunityTrust';
import { useT } from '../i18n';
import { getHintSeen, markHintSeen } from '../components/onboarding/welcomeHints';
import styles from './StageFeedView.module.scss';
import cs from './Container.module.scss';

// Vocabulary: an *initiative* is the effort that travels the pipeline; a
// *problem* is its Stage-1 founding statement (see CreateInitiativePage for the
// full decision). Copy below keeps "initiative" as the object and "problem" for
// Stage 1 only.
// Labels are t()-wired at the use sites via the shared `nav.*` keys (the value
// here is the English fallback). Per-stage banner copy lives in the render.
const STAGE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  problem: { label: 'Problem', icon: AlertCircle },
  discussion: { label: 'Discussion', icon: MessageCircle },
  proposals: { label: 'Solutions', icon: Lightbulb },
  vote: { label: 'Vote', icon: Vote },
  mandate: { label: 'Mandate', icon: ScrollText },
};

// The per-stage intro, rendered as the header subtitle (S23 — formerly a blue
// info card floating below an eyebrowed title).
const STAGE_SUBTITLES: Record<string, { key: string; fallback: string }> = {
  problem: { key: 'stagefeed.problem.info', fallback: 'Advances when 25% take part and 50% approve.' },
  proposals: { key: 'stagefeed.proposals.info', fallback: 'Suggest solutions and back the ones you support — the top ones reach the vote.' },
  vote: { key: 'stagefeed.vote.info', fallback: 'Spread your voting credits across the solutions you support.' },
  mandate: { key: 'stagefeed.mandate.info', fallback: 'Decisions communities have committed to, across borders.' },
};

// One initiative card in the per-stage browse feed. The compact summary
// (community badge + author + title + description) stays the collapsed state —
// it was designed for cross-community scanning (Eston, 2026-07-04). The title is
// the real control and a stretched ::after makes the whole card its hit area
// (community badge and expanded panel sit above it via z-index). For
// problem/discussion/proposals/vote the control expands the S19 engage panel IN
// PLACE ({@link FeedEngagePanel}); mandate keeps navigating to the published
// artifact (S18 D1).
const StageFeedCard: React.FC<{
  item: InitiativeWithMeta;
  hostServer: string;
  hostAgent: string;
  expandable: boolean;
  expanded: boolean;
  onToggle: (item: InitiativeWithMeta) => void;
  onOpen: (item: InitiativeWithMeta) => void;
  onCommunityClick: (e: React.MouseEvent, communityId: string) => void;
}> = ({ item, hostServer, hostAgent, expandable, expanded, onToggle, onOpen, onCommunityClick }) => {
  const trust = useCommunityTrust(item.communityId);
  const profiles = useAppSelector((s) => s.communities.profiles);
  const t = useT();
  const panelId = `stagefeed-panel-${item.id}`;
  // Only discussion/proposals/vote items need a remap; everything else in an
  // expandable feed is problem-stage by the feed filter (the fallback is
  // hardcoded 'problem', NOT the feed's stage).
  const panelStage =
    item.stage === 'discussion' || item.stage === 'proposals' || item.stage === 'vote'
      ? item.stage
      : 'problem';
  return (
    <div className={styles.card}>
      {/* The summary owns the card's inset padding (S30 A-5.2): the card itself is
          padding:0 + overflow:hidden so the expanded panel's chin can bleed a
          full-width tint. The title button's stretched ::after still resolves to
          .card (this wrapper is static), so the S20 whole-card hit area holds. */}
      <div className={styles.summary}>
        <div className={styles.cardMeta}>
          <button className={styles.communityBadge} onClick={(e) => onCommunityClick(e, item.communityId)}>
            {item.communityName}
          </button>
          {/* No "In discussion" badge (W3, §5 rule 10): a discussion-stage item in
              this feed is still a problem — the expanded panel's Discussion pill
              (with its live count) carries the activity signal. */}
          {item.authorName && item.author ? (
            <UserIdentity
              name={item.authorName}
              countryCode={profiles[item.author]?.country}
              trustState={trust.trustOf(item.author)}
              size="sm"
            />
          ) : item.authorName ? (
            <span className={styles.author}>{item.authorName}</span>
          ) : null}
          {item.createdAt && <span className={styles.time}>{formatTimeAgo(t, item.createdAt)}</span>}
        </div>

        <h3 className={styles.cardTitle}>
          <button
            type="button"
            className={styles.cardTitleButton}
            onClick={() => (expandable ? onToggle(item) : onOpen(item))}
            aria-expanded={expandable ? expanded : undefined}
            aria-controls={expandable && expanded ? panelId : undefined}
          >
            {item.title || t('stagefeed.untitled', 'Untitled Initiative')}
          </button>
          {expandable &&
            (expanded ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />)}
        </h3>
        {item.description && <p className={styles.cardDescription}>{item.description}</p>}
      </div>

      {expandable && expanded && (
        <div id={panelId} className={styles.panelWrap}>
          <FeedEngagePanel
            initiativeId={item.id}
            title={item.title || ''}
            stage={panelStage}
            communityId={item.communityId}
            hostServer={hostServer}
            hostAgent={hostAgent}
            authorKey={item.author}
            authorName={item.authorName}
          />
        </div>
      )}
    </div>
  );
};

const StageFeedView: React.FC = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const t = useT();
  const [showStageIntro, setShowStageIntro] = useState(() => !getHintSeen('stageFeedIntro'));
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);

  const stage = (stageId || 'problem') as PipelineStage;
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.problem;

  // Cross-community aggregation + per-initiative stage resolution lives in one
  // shared hook (also powers the cross-community Home).
  const { initiatives, isLoading } = useAllInitiatives();

  // Filter initiatives to the current stage (excludes unresolved / _unknown).
  // Discussion-stage initiatives surface in the Problem feed (Eston,
  // 2026-07-04) — discussion has no feed of its own, and without this they'd
  // vanish from stage browsing for the whole phase. They carry no distinct
  // badge (W3: discussion is a function, not a stage) — they read as problems.
  const stageInitiatives = useMemo(
    () =>
      initiatives.filter(
        (item) => item.stage === stage || (stage === 'problem' && item.stage === 'discussion'),
      ),
    [initiatives, stage],
  );

  // Expand in place (S20 W3): problem/discussion/proposals/vote cards reveal the
  // community feed's engage panel right here — browsing a stage never teleports
  // the visitor into an unfamiliar community. Mandate keeps navigating: a
  // published mandate is a read-only artifact page (S18 D1).
  // Expansion lives in the URL (S23): leaving for a discussion and coming back
  // restores it, and switching stage via the footer drops the param naturally
  // (one route element serves all four feeds — no reset effect needed).
  const expandable = stage !== 'mandate';
  const { expandedIds, toggleExpanded } = useUrlExpandedSet();

  const handleCardOpen = (item: InitiativeWithMeta) => {
    navigate(`/mandate/${item.communityId}/${item.id}`);
  };

  const handleCommunityClick = (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    navigate(`/community/${communityId}/initiative`);
  };

  // No sample fallback here — once loading is done, a stage with no real
  // initiatives just shows the empty state below, never mockup content.
  const isEmpty = stageInitiatives.length === 0 && !isLoading;

  const StageIcon = config.icon;

  // Discussion is no longer a browse stage (Unit 5) — it lives only as a
  // per-post thread reached via "Discuss this". Any old /stage/discussion link
  // lands on the Problem feed. Placed after all hooks to keep their order stable.
  if (stageId === 'discussion') {
    return <Navigate to="/stage/problem" replace />;
  }

  return (
    <div className={cs.container}>
      <AppHeader
        title={t(`nav.${stage}`, config.label)}
        subtitle={STAGE_SUBTITLES[stage] ? t(STAGE_SUBTITLES[stage].key, STAGE_SUBTITLES[stage].fallback) : undefined}
      />

      <main id="main" tabIndex={-1} className={styles.feedContainer}>
        {showStageIntro && (
          <Banner
            tone="info"
            title={t('howGloki.pointer.title', 'How Gloki works')}
            onDismiss={() => { markHintSeen('stageFeedIntro'); setShowStageIntro(false); }}
            dismissLabel={t('common.dismiss', 'Dismiss')}
          >
            {t(
              'howGloki.pointer.body',
              'These four steps are how every idea travels — from spotting a Problem to a community Mandate. You’re on {stage}.',
              { stage: t(`nav.${stage}`, config.label) },
            )}
          </Banner>
        )}

        {isLoading && (
          <div className={styles.feedLoading}>
            <div className="loading-spinner-small" />
            <p>{t('stagefeed.loading.body', 'Fetching data from communities...')}</p>
          </div>
        )}

        {isEmpty && (
          <div className={styles.empty}>
            <StageIcon size={48} />
            <h3>{t('stagefeed.empty.title', 'No initiatives here yet')}</h3>
            <p>{t('stagefeed.empty.body', 'Start an initiative in one of your communities to see it here.')}</p>
          </div>
        )}

        {stageInitiatives.map((item) => (
          <StageFeedCard
            key={item.id}
            item={item}
            hostServer={item.hostServer || serverUrl || 'local'}
            hostAgent={item.hostAgent || publicKey || 'local'}
            expandable={expandable}
            expanded={expandedIds.has(item.id)}
            onToggle={(it) => toggleExpanded(it.id)}
            onOpen={handleCardOpen}
            onCommunityClick={handleCommunityClick}
          />
        ))}
      </main>
    </div>
  );
};

export default StageFeedView;
