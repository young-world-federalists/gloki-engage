import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlokiMark from './shared/GlokiMark';
import HomepageMenu from './identity/HomepageMenu';
import { useT } from '../i18n';
import styles from './GlobalHeader.module.scss';

const GlobalHeader: React.FC = () => {
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
    <header className={styles.header}>
      <button
        className={styles.brand}
        onClick={() => navigate('/')}
        aria-label={t('nav.home', 'Home')}
      >
        <GlokiMark size={28} />
        <span className={styles.wordmark}>Gloki</span>
      </button>
      <button
        className={styles.menuButton}
        onClick={() => setMenuOpen(true)}
        aria-label={t('nav.openMenu', 'Open menu')}
        aria-expanded={menuOpen}
      >
        <Menu size={22} strokeWidth={2.5} aria-hidden />
      </button>
      <HomepageMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    </header>
  );
};

export default GlobalHeader;
