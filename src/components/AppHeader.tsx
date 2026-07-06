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
   * The page's single `<h1>`, rendered in the title block below the bar (D3).
   * Omit only on pages whose content owns the h1: the published mandate
   * document, the login/404 heroes, and the onboarding step heroes.
   */
  title?: string;
  /** A small, quiet line above the title (e.g. a stage/section name). */
  eyebrow?: string;
  /**
   * The page's intro line, rendered inside the title block directly under the
   * h1 — one box, tight spacing. Page intros live HERE, never as a floating
   * paragraph at the top of the content (S23).
   */
  subtitle?: string;
  /**
   * Keep `title` as the page's programmatic `<h1>` but hide it visually — for
   * pages whose content already shows the name (e.g. the community card), so the
   * name isn't duplicated on screen while one h1 per page is preserved.
   */
  titleVisuallyHidden?: boolean;
}

/**
 * The single, global, light app header. One banner landmark per screen:
 * a constant brand anchor (the wordmark renders exactly once), an optional back
 * button, and the always-present notifications bell + account menu. The page
 * title (the page's only `<h1>`, with its quiet eyebrow) renders as a separate
 * block below the bar — divided from it by the bar's full-width rule and
 * scrolling away with content while the bar stays sticky (D3, S19).
 *
 * The menu (`HomepageMenu`), bell and brand are self-managed — callers never
 * pass them, and never render their own copy. There is deliberately no
 * page-CTA / action-button prop: primary actions live in content / the thumb
 * zone, never in the header.
 *
 * Also renders the app's "Skip to content" link (the first focusable element),
 * which targets the `<main id="main">` landmark each page wraps its content in.
 */
const AppHeader: React.FC<AppHeaderProps> = ({ showBack = false, onBack, title, eyebrow, subtitle, titleVisuallyHidden }) => {
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
              aria-haspopup="dialog"
            >
              <Menu size={22} strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>

      </header>

      {/* Page-title block (D3 standard): below the sticky bar, separated from it
          by the header's full-width rule, scrolling away with content — only the
          brand bar stays pinned. Still the page's single <h1>. */}
      {title && (
        <div className={`${styles.titleBlock} ${titleVisuallyHidden ? styles.titleHidden : ''}`}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}

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
