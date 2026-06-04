import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../../i18n';
import HowGlokiWorks from '../onboarding/HowGlokiWorks';
import styles from './InfoPage.module.scss';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const t = useT();
  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack} aria-label={t('common.back', 'Back')}>
        <ArrowLeft size={18} />
      </button>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('about.title', 'About Gloki')}</h1>
        <HowGlokiWorks variant="full" />
        <p className={`${styles.text} ${styles.afterBlock}`}>
          {t(
            'about.closing',
            'Built on transparent, blockchain-backed governance — every step, from a first problem to a shared mandate, stays open to the whole community. Every voice matters. Every vote counts.',
          )}
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
