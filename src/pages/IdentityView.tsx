import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Communities from '../components/identity/Communities';
import Profile from '../components/identity/Profile';
import JoinCommunity from '../components/identity/JoinCommunity';
import AboutPage from '../components/identity/AboutPage';
import ContactPage from '../components/identity/ContactPage';
import VerificationHub from '../components/identity/verification/VerificationHub';
import { useT } from '../i18n';
import styles from './Container.module.scss';

const IdentityView: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const t = useT();

  // D3 page-title standard: the sub-route's title renders in the AppHeader's
  // title block (the page's single <h1>), not as an in-content heading.
  const accountEyebrow = t('identity.eyebrow', 'Account');
  const verificationEyebrow = t('verification.eyebrow', 'Verification');
  const titles: Record<string, { title: string; eyebrow?: string }> = {
    communities: { title: t('communities.title', 'Your Communities'), eyebrow: accountEyebrow },
    hidden: { title: t('communities.hiddenTitle', 'Hidden Communities'), eyebrow: accountEyebrow },
    profile: { title: t('profile.title', 'Profile'), eyebrow: accountEyebrow },
    join: { title: t('join.title', 'Join a community'), eyebrow: accountEyebrow },
    about: { title: t('about.title', 'About Gloki') },
    contact: { title: t('contact.title', 'Contact Gloki') },
    verification: { title: t('verification.title', 'Get verified'), eyebrow: verificationEyebrow },
  };
  // S36 — verification sub-pages (D9: nested here, no new top-level route).
  const verificationTitles: Record<string, { title: string; eyebrow?: string }> = {
    request: { title: t('verification.request.title', 'Ask a member to vouch'), eyebrow: verificationEyebrow },
    approve: { title: t('verification.approve.title', 'Requests to vouch'), eyebrow: verificationEyebrow },
    invite: { title: t('verification.invite.title', 'Invitations'), eyebrow: verificationEyebrow },
  };
  const [, , sub = 'communities', leaf] = pathname.split('/');
  const isVerification = sub === 'verification';
  const head = (isVerification && leaf && verificationTitles[leaf]) || titles[sub] || titles.communities;

  return (
    <div className={styles.container}>
      <AppHeader
        title={head.title}
        eyebrow={head.eyebrow}
        showBack={isVerification}
        onBack={isVerification && leaf ? () => navigate('/identity/verification') : undefined}
      />

      <main id="main" tabIndex={-1} className={styles.content}>
        <div className={styles.main}>
          <Routes>
            <Route index element={<Navigate to="/identity/communities" replace />} />
            <Route path="communities" element={<Communities />} />
            <Route path="profile" element={<Profile />} />
            <Route path="join" element={<JoinCommunity />} />
            <Route path="about" element={<AboutPage onBack={() => navigate('/stage/problem')} />} />
            <Route path="contact" element={<ContactPage onBack={() => navigate('/stage/problem')} />} />
            <Route path="verification" element={<VerificationHub />} />
            <Route path="hidden" element={<Communities showHidden />} />
            <Route path="*" element={<Navigate to="/identity/communities" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default IdentityView;
