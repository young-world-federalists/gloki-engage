import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import EarthFlag from './shared/EarthFlag';
import NotificationsBell from './shared/NotificationsBell';
import styles from './PageHeader.module.scss';

export interface ActionButton {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  title?: string;
  variant?: 'default' | 'logout';
}

export interface PageHeaderProps {
  // Top row configuration
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonVariant?: 'default' | 'compact';
  onBackClick?: () => void;
  actionButtons?: ActionButton[];

  // Bottom row configuration
  title: string;
  subtitle?: string;
  rightLabel?: React.ReactNode;

  // Layout configuration
  layout?: 'two-row' | 'single-row' | 'homepage';

  // Homepage layout extras
  onMenuClick?: () => void;
  /** Whether the slide-out menu is currently open — drives the menu button's
   *  `aria-expanded`. Optional: callers that track menu state pass it through
   *  (see MASTER_TODO §10 for the IdentityView / StageFeedView wiring request). */
  menuOpen?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  showBackButton = false,
  backButtonText = 'Back',
  backButtonVariant = 'default',
  onBackClick,
  actionButtons = [],
  title,
  subtitle,
  rightLabel,
  layout = 'two-row',
  onMenuClick,
  menuOpen,
}) => {
  const navigate = useNavigate();

  if (layout === 'homepage') {
    return (
      <div className={`${styles.header} ${styles.homepageHeader}`}>
        <div className={styles.homepageRow}>
          <button className={styles.wordmark} onClick={() => navigate('/')}>
            <EarthFlag size={40} />
            Gloki
          </button>
          <div className={styles.homepageActions}>
            <NotificationsBell />
            {onMenuClick && (
              <button
                className={styles.menuButton}
                onClick={onMenuClick}
                aria-label="Open menu"
                aria-expanded={!!menuOpen}
              >
                <Menu size={22} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'single-row') {
    return (
      <div className={styles.header}>
        <div className={`${styles.headerLeft} ${styles.singleRowLayout}`}>
          {showBackButton && onBackClick && (
            <button onClick={onBackClick} className={styles.backButton}>
              <ArrowLeft size={16} />
              {backButtonText}
            </button>
          )}
          <div className={styles.info}>
            <div className={styles.titleRow}>
              <h1>{title}</h1>
              {rightLabel}
            </div>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className={styles.headerActions}>
            {actionButtons.map((button, index) => (
              <button
                key={index}
                className={`${styles.actionButton} ${button.variant === 'logout' ? styles.logoutButton : ''}`}
                onClick={button.onClick}
                title={button.title || button.label}
              >
                <button.icon size={18} />
                <span>{button.label}</span>
              </button>
            ))}
            <NotificationsBell />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        {showBackButton && onBackClick && (
          <button
            onClick={onBackClick}
            className={`${styles.backButton} ${backButtonVariant === 'compact' ? styles.backButtonCompact : ''}`}
          >
            <ArrowLeft size={backButtonVariant === 'compact' ? 18 : 16} />
            {backButtonVariant === 'default' && backButtonText}
          </button>
        )}
        <div className={styles.headerActions}>
          {actionButtons.map((button, index) => (
            <button
              key={index}
              className={`${styles.actionButton} ${button.variant === 'logout' ? styles.logoutButton : ''}`}
              onClick={button.onClick}
              title={button.title || button.label}
            >
              <button.icon size={18} />
              <span>{button.label}</span>
            </button>
          ))}
          <NotificationsBell />
        </div>
      </div>
      <div className={styles.headerBottom}>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h1>{title}</h1>
            {rightLabel}
          </div>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
