import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlokiMark from './shared/GlokiMark';
import NotificationsBell from './shared/NotificationsBell';
import HomepageMenu from './identity/HomepageMenu';
import { useT } from '../i18n';
import styles from './AppHeader.module.scss';

export interface AppHeaderProps {
  /** Show an icon-only back button at the start of the bar. */
  showBack?: boolean;
  /** Back handler. Defaults to `navigate(-1)`. */
  onBack?: () => void;
  /**
   * The page's single `<h1>` — the community name on community-scoped pages.
   * Omit on top-level pages (Home/Stage/Identity) and standalone artifact pages
   * (the published mandate), where an in-content heading is the `<h1>`.
   */
  title?: string;
  /** A small, quiet line above the title (e.g. a stage/section name). */
  eyebrow?: string;
}

/**
 * The single, global, light app header. One banner landmark per screen:
 * a constant brand anchor (the wordmark renders exactly once), an optional back
 * button + page title (the page's only `<h1>`), and the always-present
 * notifications bell + account menu. It supersedes the former dual-header setup.
 *
 * The menu (`HomepageMenu`), bell and brand are self-managed — callers never
 * pass them, and never render their own copy. There is deliberately no
 * page-CTA / action-button prop: primary actions live in content / the thumb
 * zone, never in the header.
 *
 * Also renders the app's "Skip to content" link (the first focusable element),
 * which targets the `<main id="main">` landmark each page wraps its content in.
 */
const AppHeader: React.FC<AppHeaderProps> = ({ showBack = false, onBack, title, eyebrow }) => {
  const navigate = useNavigate();
  const t = useT();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (path: string) => navigate(`/identity/${path}`);
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <a className={styles.skipLink} href="#main">
        {t('nav.skipToContent', 'Skip to content')}
      </a>

      <header className={styles.header}>
        <div className={styles.bar}>
          {showBack && (
            <button
              type="button"
              className={styles.backButton}
              onClick={onBack ?? (() => navigate(-1))}
              aria-label={t('common.back', 'Back')}
            >
              <ArrowLeft size={20} aria-hidden />
            </button>
          )}

          <button
            className={styles.brand}
            onClick={() => navigate('/')}
            aria-label={t('nav.home', 'Home')}
          >
            <GlokiMark size={28} />
            <span className={styles.wordmark}>Gloki</span>
          </button>

          <div className={styles.actions}>
            <NotificationsBell />
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMenuOpen(true)}
              aria-label={t('nav.openMenu', 'Open menu')}
              aria-expanded={menuOpen}
            >
              <Menu size={22} strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>

        {title && (
          <div className={styles.titleBlock}>
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
            <h1 className={styles.title}>{title}</h1>
          </div>
        )}
      </header>

      <HomepageMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    </>
  );
};

export default AppHeader;
