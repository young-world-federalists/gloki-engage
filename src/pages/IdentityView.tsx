import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import Communities from '../components/identity/Communities';
import Profile from '../components/identity/Profile';
import JoinCommunity from '../components/identity/JoinCommunity';
import HomepageMenu from '../components/identity/HomepageMenu';
import AboutPage from '../components/identity/AboutPage';
import ContactPage from '../components/identity/ContactPage';
import styles from './Container.module.scss';

const IdentityView: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    navigate(`/identity/${path}`);
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Gloki"
        layout="homepage"
        onMenuClick={() => setMenuOpen(true)}
        menuOpen={menuOpen}
      />

      <HomepageMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <div className={styles.content}>
        <div className={styles.main}>
          <Routes>
            <Route index element={<Navigate to="/identity/communities" replace />} />
            <Route path="communities" element={<Communities />} />
            <Route path="profile" element={<Profile />} />
            <Route path="join" element={<JoinCommunity />} />
            <Route path="about" element={<AboutPage onBack={() => navigate('/stage/problem')} />} />
            <Route path="contact" element={<ContactPage onBack={() => navigate('/stage/problem')} />} />
            <Route path="hidden" element={<Communities showHidden />} />
            <Route path="*" element={<Navigate to="/identity/communities" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default IdentityView;
