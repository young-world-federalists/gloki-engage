import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useAllInitiatives, type InitiativeWithMeta } from '../hooks/useAllInitiatives';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import type { PipelineStage } from '../types/initiative';
import AppHeader from '../components/AppHeader';
import { UserIdentity, Banner } from '../components/shared';
import { useCommunityTrust } from '../hooks/useCommunityTrust';
import { useT } from '../i18n';
import { getHintSeen, markHintSeen } from '../components/onboarding/welcomeHints';
import styles from './StageFeedView.module.scss';
import cs from './Container.module.scss';

// Sample data for development — shown when no real initiatives exist at a stage.
// Exported so the cross-community Home (HomeView) reuses the same fallback set.
export const SAMPLE_INITIATIVES: Record<string, Array<{ id: string; title: string; description: string; communityName: string; authorName: string; stage: string; tally?: { up: number; down: number; total: number } }>> = {
  problem: [
    { id: 'sample-1', title: 'Access to Clean Drinking Water', description: 'Over 2 billion people worldwide lack access to safely managed drinking water. This affects health, education, and economic development across multiple countries.', communityName: 'Global Health Network', authorName: 'Maria S.', stage: 'problem', tally: { up: 42, down: 5, total: 47 } },
    { id: 'sample-2', title: 'Misinformation and Democratic Erosion', description: 'AI-generated misinformation is undermining democratic processes globally. Voters are being manipulated and public trust in institutions is declining.', communityName: 'Democracy Watch', authorName: 'James T.', stage: 'problem', tally: { up: 28, down: 12, total: 40 } },
    { id: 'sample-3', title: 'Youth Unemployment Crisis', description: 'Youth unemployment rates exceed 30% in many countries. Millions of young people face economic exclusion, leading to social instability and brain drain.', communityName: 'Future Economy Forum', authorName: 'Aisha K.', stage: 'problem', tally: { up: 35, down: 3, total: 38 } },
  ],
  discussion: [
    { id: 'sample-4', title: 'Ocean Plastic Pollution', description: 'Over 8 million tons of plastic enter the oceans each year. Marine ecosystems are collapsing and microplastics are entering the food chain.', communityName: 'Ocean Alliance', authorName: 'Lin W.', stage: 'discussion' },
    { id: 'sample-5', title: 'Global Teacher Shortage', description: 'UNESCO estimates a shortage of 69 million teachers by 2030. Rural and disadvantaged communities are disproportionately affected.', communityName: 'Education for All', authorName: 'Priya M.', stage: 'discussion' },
  ],
  proposals: [
    { id: 'sample-6', title: 'Antibiotic Resistance', description: 'Drug-resistant infections kill 1.27 million people annually. Without coordinated global action, routine surgeries and minor infections could become deadly again.', communityName: 'Global Health Network', authorName: 'Dr. Chen L.', stage: 'proposals' },
  ],
  vote: [
    { id: 'sample-7', title: 'Digital Privacy Standards', description: 'Personal data is harvested at an unprecedented scale with minimal regulation in most countries. A global framework for digital rights is urgently needed.', communityName: 'Digital Rights Coalition', authorName: 'Sam R.', stage: 'vote' },
  ],
  mandate: [
    { id: 'sample-8', title: 'Universal Climate Adaptation Fund', description: 'Communities worldwide voted to establish a decentralized climate adaptation fund. Local communities can apply directly for resilience infrastructure and disaster preparedness resources.', communityName: 'Climate Action Network', authorName: 'Elena V.', stage: 'mandate' },
  ],
};

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

// One initiative card in the per-stage browse feed. Compact + tap-through: the
// title is the real control and a stretched ::after makes the whole card the hit
// area (the community badge stays clickable above it via z-index). The heavy
// per-stage participation UI lives on the initiative's own page — this feed is
// for *browsing*, matching the cross-community Home.
const StageFeedCard: React.FC<{
  item: InitiativeWithMeta;
  onOpen: (item: InitiativeWithMeta) => void;
  onCommunityClick: (e: React.MouseEvent, communityId: string) => void;
}> = ({ item, onOpen, onCommunityClick }) => {
  const trust = useCommunityTrust(item.communityId);
  const profiles = useAppSelector((s) => s.communities.profiles);
  const t = useT();
  return (
    <div className={styles.card}>
      <div className={styles.cardMeta}>
        <button className={styles.communityBadge} onClick={(e) => onCommunityClick(e, item.communityId)}>
          {item.communityName}
        </button>
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
        <button type="button" className={styles.cardTitleButton} onClick={() => onOpen(item)}>
          {item.title || t('stagefeed.untitled', 'Untitled Initiative')}
        </button>
      </h3>
      {item.description && <p className={styles.cardDescription}>{item.description}</p>}
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
  const stageInitiatives = useMemo(
    () => initiatives.filter((item) => item.stage === stage),
    [initiatives, stage],
  );

  // Tap-through: browse here, participate on the initiative's own surface.
  // Discussion opens the co-authoring view; a published mandate opens its
  // read-only artifact; everything else opens the initiative inline on its
  // community page (auto-expands the card).
  const handleCardClick = (item: InitiativeWithMeta) => {
    if (stage === 'discussion') {
      const hostServer = item.hostServer || serverUrl || 'local';
      const hostAgent = item.hostAgent || publicKey || 'local';
      navigate(
        `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${item.communityId}/${item.id}/discussion`,
      );
    } else if (stage === 'mandate') {
      navigate(`/mandate/${item.communityId}/${item.id}`);
    } else {
      navigate(`/community/${item.communityId}?initiative=${item.id}`);
    }
  };

  const handleCommunityClick = (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    navigate(`/community/${communityId}/initiative`);
  };

  // Show sample data when no real initiatives exist at this stage
  const usingSampleData = stageInitiatives.length === 0 && !isLoading;
  const sampleItems = SAMPLE_INITIATIVES[stage] || [];

  const StageIcon = config.icon;

  // Discussion is no longer a browse stage (Unit 5) — it lives only as a
  // per-post thread reached via "Discuss this". Any old /stage/discussion link
  // lands on the Problem feed. Placed after all hooks to keep their order stable.
  if (stageId === 'discussion') {
    return <Navigate to="/stage/problem" replace />;
  }

  return (
    <div className={cs.container}>
      <AppHeader />

      <main id="main" tabIndex={-1} className={styles.feedContainer}>
        <h1 className={styles.srOnly}>{t(`nav.${stage}`, config.label)}</h1>
        {showStageIntro && (
          <Banner
            tone="info"
            title={t('howGloki.pointer.title', 'How Gloki works')}
            onDismiss={() => { markHintSeen('stageFeedIntro'); setShowStageIntro(false); }}
            dismissLabel={t('common.dismiss', 'Dismiss')}
          >
            {t(
              'howGloki.pointer.body',
              'These five steps are how every idea travels — from spotting a Problem to a community Mandate. You’re on {stage}.',
              { stage: t(`nav.${stage}`, config.label) },
            )}
          </Banner>
        )}
        {stage === 'problem' && (
          <div className={styles.thresholdBanner}>
            <AlertCircle size={16} />
            <span>{t('stagefeed.problem.info', 'Advances when 25% take part and 50% approve.')}</span>
          </div>
        )}
        {stage === 'discussion' && (
          <div className={styles.thresholdBanner}>
            <MessageCircle size={16} />
            <span>{t('stagefeed.discussion.info', 'Advances once 33% share a perspective.')}</span>
          </div>
        )}
        {stage === 'proposals' && (
          <div className={styles.thresholdBanner}>
            <Lightbulb size={16} />
            <span>{t('stagefeed.proposals.info', 'Suggest solutions and back the ones you support — the top ones reach the vote.')}</span>
          </div>
        )}
        {stage === 'vote' && (
          <div className={styles.thresholdBanner}>
            <Vote size={16} />
            <span>{t('stagefeed.vote.info', 'Spread your voting credits across the solutions you support.')}</span>
          </div>
        )}
        {stage === 'mandate' && (
          <div className={styles.thresholdBanner}>
            <ScrollText size={16} />
            <span>{t('stagefeed.mandate.info', 'Decisions communities have committed to, across borders.')}</span>
          </div>
        )}

        {isLoading && stageInitiatives.length === 0 && (
          <div className={styles.empty}>
            <StageIcon size={48} />
            <h3>{t('stagefeed.loading.title', 'Loading initiatives...')}</h3>
            <p>{t('stagefeed.loading.body', 'Fetching data from communities...')}</p>
          </div>
        )}

        {usingSampleData && (
          <div className={styles.sampleBanner}>{t('stagefeed.sample.banner', 'Example initiatives — join or create a community to participate')}</div>
        )}

        {stageInitiatives.map((item) => (
          <StageFeedCard
            key={item.id}
            item={item}
            onOpen={handleCardClick}
            onCommunityClick={handleCommunityClick}
          />
        ))}

        {/* Sample cards when no real data — compact, display-only. */}
        {usingSampleData && sampleItems.map((sample) => (
          <div
            key={sample.id}
            className={`${styles.card} ${styles.sampleCard} ${styles.noClick}`}
          >
            <div className={styles.cardMeta}>
              <span className={styles.communityBadge}>{sample.communityName}</span>
              <span className={styles.author}>{sample.authorName}</span>
            </div>

            <h3 className={styles.cardTitle}>{sample.title}</h3>
            <p className={styles.cardDescription}>{sample.description}</p>
          </div>
        ))}
      </main>
    </div>
  );
};

export default StageFeedView;
