import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { Button } from '../components/shared';
import { useT } from '../i18n';
import styles from './NotFound.module.scss';

/**
 * Catch-all 404 for unknown URLs (App.tsx `path="*"`). Minimal, kit-styled and
 * i18n'd: the global AppHeader (skip-link + brand + menu), a single in-content
 * <h1>, and one primary action back to Home. The global StageFooter still
 * renders beneath it.
 */
const NotFound: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();

  return (
    <>
      <AppHeader />
      <main id="main" className={styles.main}>
        <div className={styles.content}>
          <Compass className={styles.icon} size={48} aria-hidden />
          <h1 className={styles.title}>{t('notFound.title', 'Page not found')}</h1>
          <p className={styles.body}>
            {t(
              'notFound.body',
              'We couldn’t find that page. It may have moved, or the link may be wrong.',
            )}
          </p>
          <div className={styles.action}>
            <Button size="lg" onClick={() => navigate('/')}>
              {t('notFound.home', 'Back to home')}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default NotFound;
