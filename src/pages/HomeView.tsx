import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lightbulb, Vote, ScrollText, ArrowRight, Star, Megaphone } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useAllInitiatives } from '../hooks/useAllInitiatives';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import AppHeader from '../components/AppHeader';
import { UserIdentity, EmptyState } from '../components/shared';
import { useCommunityTrust } from '../hooks/useCommunityTrust';
import { useT } from '../i18n';
import styles from './HomeView.module.scss';
import cs from './Container.module.scss';

// A normalised card the Home renders for a real initiative. communityId is
// always set (every card comes from useAllInitiatives, real communities
// only) — author/authorName/hostServer/hostAgent/createdAt stay optional
// since a given initiative's own data may legitimately be missing them.
interface HomeCard {
  id: string;
  title: string;
  description: string;
  communityName: string;
  communityId: string;
  authorName?: string;
  /** Author public key, used to resolve trust. */
  author?: string;
  hostServer?: string;
  hostAgent?: string;
  createdAt?: number;
}

// One Home initiative card. Its own component so it can resolve the author's
// trust in that card's community.
const HomeInitiativeCard: React.FC<{
  card: HomeCard;
  starred: boolean;
  interactionProps: Record<string, unknown>;
  onCommunityClick: (e: React.MouseEvent, communityId: string) => void;
}> = ({ card, starred, interactionProps, onCommunityClick }) => {
  const t = useT();
  const trust = useCommunityTrust(card.communityId);
  const profiles = useAppSelector((s) => s.communities.profiles);
  return (
    <div className={styles.card} {...interactionProps}>
      <div className={styles.cardMeta}>
        {starred && (
          <Star size={12} className={styles.starIcon} aria-label={t('home.starred', 'Starred community')} />
        )}
        <button type="button" className={styles.communityBadge} onClick={(e) => onCommunityClick(e, card.communityId)}>
          {card.communityName}
        </button>
        {card.authorName && card.author ? (
          <UserIdentity
            name={card.authorName}
            countryCode={profiles[card.author]?.country}
            trustState={trust.trustOf(card.author)}
            size="sm"
          />
        ) : card.authorName ? (
          <span className={styles.author}>{card.authorName}</span>
        ) : null}
        {card.createdAt ? <span className={styles.time}>{formatTimeAgo(t, card.createdAt)}</span> : null}
      </div>
      <h3 className={styles.cardTitle}>{card.title}</h3>
      {card.description && <p className={styles.cardDesc}>{card.description}</p>}
    </div>
  );
};

type ActiveStage = 'problem' | 'proposals' | 'vote';

const SECTIONS: {
  stage: ActiveStage;
  icon: React.ComponentType<{ size?: number }>;
  titleKey: string;
  titleFallback: string;
  limit: number;
}[] = [
  { stage: 'problem', icon: AlertCircle, titleKey: 'home.problems', titleFallback: 'Problems', limit: 3 },
  { stage: 'proposals', icon: Lightbulb, titleKey: 'home.proposals', titleFallback: 'Solutions', limit: 2 },
  { stage: 'vote', icon: Vote, titleKey: 'home.votes', titleFallback: 'Open votes', limit: 2 },
];

/**
 * The front door — a cross-community overview that mixes a few Problems,
 * Solutions and Votes drawn from across all of the user's communities (each
 * card labelled with its community), plus a slim "Recent decisions" strip for
 * mandates. Discussion-stage initiatives list under Problems (W3, §5 rule 10 —
 * mirrors the stage feed: a problem being discussed is still a problem).
 * Shows a genuine empty state when the user has no real initiatives anywhere
 * — never mockup content. The per-stage browse lives in the global
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
      // Discussion is a function, not a stage (W3): those items are problems
      // in the Problem→Solutions gap, so they list under Problems here.
      const bucket = i.stage === 'discussion' ? 'problem' : i.stage;
      (map[bucket] ||= []).push({
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

  // Empty-section handling: sections with nothing real in them just don't
  // render (the per-section `cards.length === 0` guard below) — no mockup
  // backfill. When there's NO real initiative anywhere, the whole page shows
  // one genuine empty state instead.
  const hasReal = Object.keys(realByStage).length > 0;
  const isEmpty = !isLoading && !hasReal;

  const source = realByStage;
  const mandates = (source.mandate || []).slice(0, 4);

  const openInitiative = (card: HomeCard) => {
    // The initiative roadmap lives inline on the community page now — link straight
    // there (auto-expands the card) instead of via the /…/roadmap redirect hop.
    navigate(`/community/${card.communityId}?initiative=${card.id}`);
  };

  const handleCommunityClick = (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    navigate(`/community/${communityId}/initiative`);
  };

  const cardInteractionProps = (card: HomeCard) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => openInitiative(card),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openInitiative(card);
      }
    },
  });

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
      <AppHeader
        title={t('home.title', 'Across your communities')}
        subtitle={t('home.subtitle', 'A live look at what people are working on — from problems to decisions.')}
      />

      <main id="main" tabIndex={-1} className={styles.home}>
        {isLoading ? (
          <div className={styles.feedLoading}>
            <div className="loading-spinner-small" />
            <p>{t('home.loading', 'Gathering activity from your communities…')}</p>
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={<Megaphone size={32} aria-hidden />}
            title={t('home.empty.title', 'No activity yet')}
            message={t('home.empty.body', 'Join or create a community to see problems, solutions, and votes here.')}
          />
        ) : (
          <>
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
                      <ArrowRight size={16} aria-hidden />
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
                    <ArrowRight size={16} aria-hidden />
                  </button>
                </div>
                <div className={styles.mandateStrip}>
                  {mandates.map((m) => (
                    <div key={m.id} className={styles.mandateCard} {...cardInteractionProps(m)}>
                      <span className={styles.mandateCommunity}>{m.communityName}</span>
                      <span className={styles.mandateTitle}>{m.title}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default HomeView;
