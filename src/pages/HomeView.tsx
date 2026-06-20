import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText, ArrowRight, Star } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useAllInitiatives } from '../hooks/useAllInitiatives';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { SAMPLE_INITIATIVES } from './StageFeedView';
import AppHeader from '../components/AppHeader';
import { TrustBadge } from '../components/shared';
import { useCommunityTrust } from '../hooks/useCommunityTrust';
import { useT } from '../i18n';
import styles from './HomeView.module.scss';
import cs from './Container.module.scss';

// A normalised card the Home renders for both real initiatives and the sample
// fallback. `communityId` (and host/agent) are only present for real items —
// sample cards are display-only.
interface HomeCard {
  id: string;
  title: string;
  description: string;
  communityName: string;
  communityId?: string;
  authorName?: string;
  /** Author public key — present for real items only, used to resolve trust. */
  author?: string;
  hostServer?: string;
  hostAgent?: string;
  createdAt?: number;
}

// One Home initiative card. Its own component so it can resolve the author's
// trust in that card's community. Sample cards (no communityId) show no badge —
// we never present sample data as real trust.
const HomeInitiativeCard: React.FC<{
  card: HomeCard;
  starred: boolean;
  interactionProps: Record<string, unknown>;
  onCommunityClick: (e: React.MouseEvent, communityId?: string) => void;
}> = ({ card, starred, interactionProps, onCommunityClick }) => {
  const t = useT();
  const trust = useCommunityTrust(card.communityId);
  const clickable = Boolean(card.communityId);
  return (
    <div className={`${styles.card} ${clickable ? '' : styles.cardStatic}`} {...interactionProps}>
      <div className={styles.cardMeta}>
        {starred && (
          <Star size={12} className={styles.starIcon} aria-label={t('home.starred', 'Starred community')} />
        )}
        {clickable ? (
          <button type="button" className={styles.communityBadge} onClick={(e) => onCommunityClick(e, card.communityId)}>
            {card.communityName}
          </button>
        ) : (
          <span className={`${styles.communityBadge} ${styles.communityBadgeStatic}`}>{card.communityName}</span>
        )}
        {card.authorName && <span className={styles.author}>{card.authorName}</span>}
        {card.communityId && card.author && (
          <TrustBadge state={trust.trustOf(card.author)} vouchCount={trust.vouchCountOf(card.author)} size="sm" />
        )}
        {card.createdAt ? <span className={styles.time}>{formatTimeAgo(t, card.createdAt)}</span> : null}
      </div>
      <h3 className={styles.cardTitle}>{card.title}</h3>
      {card.description && <p className={styles.cardDesc}>{card.description}</p>}
    </div>
  );
};

type ActiveStage = 'problem' | 'discussion' | 'proposals' | 'vote';

const SECTIONS: {
  stage: ActiveStage;
  icon: React.ComponentType<{ size?: number }>;
  titleKey: string;
  titleFallback: string;
  limit: number;
}[] = [
  { stage: 'problem', icon: AlertCircle, titleKey: 'home.problems', titleFallback: 'Problems', limit: 3 },
  { stage: 'discussion', icon: MessageCircle, titleKey: 'home.discussions', titleFallback: 'In discussion', limit: 2 },
  { stage: 'proposals', icon: Lightbulb, titleKey: 'home.proposals', titleFallback: 'Solutions', limit: 2 },
  { stage: 'vote', icon: Vote, titleKey: 'home.votes', titleFallback: 'Open votes', limit: 2 },
];

/**
 * The front door — a cross-community overview that mixes a few Problems,
 * Discussions, Proposals and Votes drawn from across all of the user's
 * communities (each card labelled with its community), plus a slim "Recent
 * decisions" strip for mandates. Falls back to the shared sample set when the
 * user has no real initiatives yet. The per-stage browse lives in the global
 * StageFooter / StageFeedView; this page never renders the heavy inline flows.
 */
const HomeView: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const { starred } = useAppSelector((s) => s.preferences);
  const { initiatives, isLoading } = useAllInitiatives();

  const isStarred = useCallback(
    (communityId?: string) => !!communityId && starred.includes(communityId),
    [starred],
  );

  // Group real initiatives by their resolved stage (unresolved ones excluded),
  // then float initiatives from starred communities to the top of each section.
  // `initiatives` is already newest-first and Array.sort is stable, so within
  // both the starred and non-starred groups the newest-first order is preserved.
  // (Hidden communities never reach us — useAllInitiatives filters them out.)
  const realByStage = useMemo(() => {
    const map: Record<string, HomeCard[]> = {};
    for (const i of initiatives) {
      if (!i.stage || i.stage === '_unknown') continue;
      (map[i.stage] ||= []).push({
        id: i.id,
        title: i.title || 'Untitled Initiative',
        description: i.description || '',
        communityName: i.communityName,
        communityId: i.communityId,
        authorName: i.authorName,
        author: i.author,
        hostServer: i.hostServer,
        hostAgent: i.hostAgent,
        createdAt: i.createdAt,
      });
    }
    for (const stage of Object.keys(map)) {
      map[stage].sort(
        (a, b) => Number(isStarred(b.communityId)) - Number(isStarred(a.communityId)),
      );
    }
    return map;
  }, [initiatives, isStarred]);

  // Empty-section handling: when the user has ANY real initiative we show only
  // real data and hide the sections that happen to be empty (via the per-section
  // `cards.length === 0` guard below). We deliberately do NOT backfill empty
  // sections with samples — mixing real and example items in one view erodes
  // trust ("are these votes real?"). The full immersive sample set appears only
  // when the user has NO real initiatives anywhere (a brand-new account), as a
  // preview of what Gloki looks like in use.
  const hasReal = Object.keys(realByStage).length > 0;
  const useSamples = !isLoading && !hasReal;

  // The shared sample set, reshaped into HomeCards (display-only).
  const sampleByStage = useMemo(() => {
    const map: Record<string, HomeCard[]> = {};
    for (const [stage, items] of Object.entries(SAMPLE_INITIATIVES)) {
      map[stage] = items.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        communityName: s.communityName,
        authorName: s.authorName,
      }));
    }
    return map;
  }, []);

  const source = useSamples ? sampleByStage : realByStage;
  const mandates = (source.mandate || []).slice(0, 4);

  const openInitiative = (card: HomeCard) => {
    if (!card.communityId) return; // sample card — display only
    // The initiative roadmap lives inline on the community page now — link straight
    // there (auto-expands the card) instead of via the /…/roadmap redirect hop.
    navigate(`/community/${card.communityId}?initiative=${card.id}`);
  };

  const handleCommunityClick = (e: React.MouseEvent, communityId?: string) => {
    e.stopPropagation();
    if (communityId) navigate(`/community/${communityId}/initiative`);
  };

  const cardInteractionProps = (card: HomeCard) => {
    if (!card.communityId) return {};
    return {
      role: 'button',
      tabIndex: 0,
      onClick: () => openInitiative(card),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openInitiative(card);
        }
      },
    };
  };

  const renderCard = (card: HomeCard) => (
    <HomeInitiativeCard
      key={card.id}
      card={card}
      starred={isStarred(card.communityId)}
      interactionProps={cardInteractionProps(card)}
      onCommunityClick={handleCommunityClick}
    />
  );

  return (
    <div className={cs.container}>
      <AppHeader />

      <main id="main" tabIndex={-1} className={styles.home}>
        <header className={styles.intro}>
          <h1 className={styles.introTitle}>{t('home.title', 'Across your communities')}</h1>
          <p className={styles.introSubtitle}>
            {t('home.subtitle', 'A live look at what people are working on — from problems to decisions.')}
          </p>
        </header>

        {isLoading && !hasReal && (
          <div className={styles.notice}>{t('home.loading', 'Gathering activity from your communities…')}</div>
        )}

        {useSamples && (
          <div className={styles.notice}>
            {t('home.sampleBanner', 'Example activity — join or create a community to take part')}
          </div>
        )}

        {SECTIONS.map((section) => {
          const cards = (source[section.stage] || []).slice(0, section.limit);
          if (cards.length === 0) return null;
          const Icon = section.icon;
          return (
            <section key={section.stage} className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Icon size={18} aria-hidden />
                  {t(section.titleKey, section.titleFallback)}
                </h2>
                <button className={styles.seeAll} onClick={() => navigate(`/stage/${section.stage}`)}>
                  {t('home.seeAll', 'See all')}
                  <ArrowRight size={14} aria-hidden />
                </button>
              </div>
              <div className={styles.cards}>{cards.map(renderCard)}</div>
            </section>
          );
        })}

        {mandates.length > 0 && (
          <section className={`${styles.section} ${styles.mandates}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <ScrollText size={18} aria-hidden />
                {t('home.mandates', 'Recent decisions')}
              </h2>
              <button className={styles.seeAll} onClick={() => navigate('/stage/mandate')}>
                {t('home.seeAll', 'See all')}
                <ArrowRight size={14} aria-hidden />
              </button>
            </div>
            <div className={styles.mandateStrip}>
              {mandates.map((m) => {
                const clickable = Boolean(m.communityId);
                return (
                  <div
                    key={m.id}
                    className={`${styles.mandateCard} ${clickable ? '' : styles.cardStatic}`}
                    {...cardInteractionProps(m)}
                  >
                    <span className={styles.mandateCommunity}>{m.communityName}</span>
                    <span className={styles.mandateTitle}>{m.title}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default HomeView;
