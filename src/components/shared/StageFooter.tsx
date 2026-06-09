import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import { useT } from '../../i18n';
import styles from './StageFooter.module.scss';

const STAGES = [
  { id: 'problem', labelKey: 'nav.problem', fallback: 'Problem', icon: AlertCircle, path: '/stage/problem' },
  { id: 'discussion', labelKey: 'nav.discussion', fallback: 'Discuss', icon: MessageCircle, path: '/stage/discussion' },
  { id: 'proposals', labelKey: 'nav.proposals', fallback: 'Proposals', icon: Lightbulb, path: '/stage/proposals' },
  { id: 'vote', labelKey: 'nav.vote', fallback: 'Vote', icon: Vote, path: '/stage/vote' },
  { id: 'mandate', labelKey: 'nav.mandate', fallback: 'Mandate', icon: ScrollText, path: '/stage/mandate' },
] as const;

const StageFooter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  // Hide on the first-run onboarding flow — its stepper frames the journey on its own.
  if (location.pathname.startsWith('/welcome')) return null;
  // Hide on community pages (they have their own footer)
  if (location.pathname.startsWith('/community/')) return null;

  const activeStage = STAGES.find((s) => location.pathname.startsWith(s.path))?.id ?? null;

  return (
    <nav className={styles.footer} aria-label={t('nav.stagesLabel', 'Pipeline stages')}>
      {STAGES.map((stage) => {
        const isActive = stage.id === activeStage;
        return (
          <button
            key={stage.id}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => navigate(stage.path)}
            aria-current={isActive ? 'page' : undefined}
          >
            <stage.icon size={22} />
            <span>{t(stage.labelKey, stage.fallback)}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default StageFooter;
