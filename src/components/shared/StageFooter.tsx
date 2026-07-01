import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import { useT } from '../../i18n';
import styles from './StageFooter.module.scss';

// Discussion is no longer a browse stage — it's reached per-post via "Discuss
// this", so the footer carries the four browseable stages only (Unit 5).
const STAGES = [
  { id: 'problem', labelKey: 'nav.problem', fallback: 'Problem', icon: AlertCircle, path: '/stage/problem' },
  { id: 'proposals', labelKey: 'nav.proposals', fallback: 'Solutions', icon: Lightbulb, path: '/stage/proposals' },
  { id: 'vote', labelKey: 'nav.vote', fallback: 'Vote', icon: Vote, path: '/stage/vote' },
  { id: 'mandate', labelKey: 'nav.mandate', fallback: 'Mandate', icon: ScrollText, path: '/stage/mandate' },
] as const;

const StageFooter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  // Hide on the first-run onboarding flow — its stepper frames the journey on its own.
  if (location.pathname.startsWith('/welcome')) return null;

  const activeStage = STAGES.find((s) => location.pathname.startsWith(s.path))?.id ?? null;

  return (
    <nav className={styles.footer} aria-label={t('nav.browseByStage', 'Browse by stage')}>
      {/* A discovery shelf — browse initiatives across communities by stage. NOT
          the next step for the initiative you're in (that's the per-initiative
          stage strip). The caption + lighter weight keep the two distinct. */}
      <span className={styles.caption} aria-hidden>
        {t('nav.browseByStage', 'Browse by stage')}
      </span>
      <div className={styles.tabs}>
        {STAGES.map((stage) => {
          const isActive = stage.id === activeStage;
          return (
            <button
              key={stage.id}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              onClick={() => navigate(stage.path)}
              aria-current={isActive ? 'page' : undefined}
            >
              <stage.icon size={20} />
              <span>{t(stage.labelKey, stage.fallback)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default StageFooter;
