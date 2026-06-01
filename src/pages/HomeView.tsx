import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppSelector } from '../store/hooks';
import { useAllInitiatives } from '../hooks/useAllInitiatives';
import { SAMPLE_INITIATIVES } from './StageFeedView';
import PageHeader from '../components/PageHeader';
import HomepageMenu from '../components/identity/HomepageMenu';
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
  hostServer?: string;
  hostAgent?: string;
}

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
  { stage: 'proposals', icon: Lightbulb, titleKey: 'home.proposals', titleFallback: 'Proposals', limit: 2 },
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
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { initiatives, isLoading } = useAllInitiatives();

  // Group real initiatives by their resolved stage (unresolved ones excluded).
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
        hostServer: i.hostServer,
        hostAgent: i.hostAgent,
      });
    }
    return map;
  }, [initiatives]);

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
    const hostServer = card.hostServer || serverUrl || 'local';
    const hostAgent = card.hostAgent || publicKey || 'local';
    navigate(
      `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${card.communityId}/${card.id}/roadmap`,
    );
  };

  const handleCommunityClick = (e: React.MouseEvent, communityId?: string) => {
    e.stopPropagation();
    if (communityId) navigate(`/community/${communityId}/initiative`);
  };

  const handleMenuNavigate = (path: string) => navigate(`/identity/${path}`);
  const handleLogout = () => {
    logout();
    navigate('/');
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

  const renderCard = (card: HomeCard) => {
    const clickable = Boolean(card.communityId);
    return (
      <div
        key={card.id}
        className={`${styles.card} ${clickable ? '' : styles.cardStatic}`}
        {...cardInteractionProps(card)}
      >
        <div className={styles.cardMeta}>
          {clickable ? (
            <button
              type="button"
              className={styles.communityBadge}
              onClick={(e) => handleCommunityClick(e, card.communityId)}
            >
              {card.communityName}
            </button>
          ) : (
            <span className={`${styles.communityBadge} ${styles.communityBadgeStatic}`}>{card.communityName}</span>
          )}
          {card.authorName && <span className={styles.author}>{card.authorName}</span>}
        </div>
        <h3 className={styles.cardTitle}>{card.title}</h3>
        {card.description && <p className={styles.cardDesc}>{card.description}</p>}
      </div>
    );
  };

  return (
    <div className={cs.container}>
      <PageHeader
        title="Gloki"
        layout="homepage"
        onMenuClick={() => setMenuOpen(true)}
        menuOpen={menuOpen}
      />

      <HomepageMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleMenuNavigate}
        onLogout={handleLogout}
      />

      <div className={styles.home}>
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
      </div>
    </div>
  );
};

export default HomeView;
