import React from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Communities from '../components/identity/Communities';
import Profile from '../components/identity/Profile';
import JoinCommunity from '../components/identity/JoinCommunity';
import AboutPage from '../components/identity/AboutPage';
import ContactPage from '../components/identity/ContactPage';
import styles from './Container.module.scss';

const IdentityView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <AppHeader />

      <main id="main" tabIndex={-1} className={styles.content}>
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
      </main>
    </div>
  );
};

export default IdentityView;
