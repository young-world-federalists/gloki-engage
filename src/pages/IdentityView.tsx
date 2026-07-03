import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Communities from '../components/identity/Communities';
import Profile from '../components/identity/Profile';
import JoinCommunity from '../components/identity/JoinCommunity';
import AboutPage from '../components/identity/AboutPage';
import ContactPage from '../components/identity/ContactPage';
import { useT } from '../i18n';
import styles from './Container.module.scss';

const IdentityView: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const t = useT();

  // D3 page-title standard: the sub-route's title renders in the AppHeader's
  // title block (the page's single <h1>), not as an in-content heading.
  const accountEyebrow = t('identity.eyebrow', 'Account');
  const titles: Record<string, { title: string; eyebrow?: string }> = {
    communities: { title: t('communities.title', 'Your Communities'), eyebrow: accountEyebrow },
    hidden: { title: t('communities.hiddenTitle', 'Hidden Communities'), eyebrow: accountEyebrow },
    profile: { title: t('profile.title', 'Profile'), eyebrow: accountEyebrow },
    join: { title: t('join.title', 'Join a community'), eyebrow: accountEyebrow },
    about: { title: t('about.title', 'About Gloki') },
    contact: { title: t('contact.title', 'Contact Gloki') },
  };
  const sub = pathname.split('/')[2] || 'communities';
  const head = titles[sub] ?? titles.communities;

  return (
    <div className={styles.container}>
      <AppHeader title={head.title} eyebrow={head.eyebrow} />

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
