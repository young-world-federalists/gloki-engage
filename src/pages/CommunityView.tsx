import React, { useMemo, useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { Home, Users2, MessageSquare, Users, Coins, Share2, UserPlus, LogOut, PlusCircle, Shield, Link2, RotateCcw, Settings } from 'lucide-react';
import { SlideOutMenu, type SlideOutMenuItem } from '../components/shared';
import AppHeader from '../components/AppHeader';
import { useT } from '../i18n';
import { isDemoContract } from '../services/demo/demoRegistry';
import { resetDemoCommunity } from '../services/demo/seedDemoCommunity';
import { buildDemoShareLink } from '../services/demo/demoUrlShare';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import { fetchCommunityProperties, fetchCommunityMembers, fetchCollaborations, fetchCommunityActiveMembers } from '../store/slices/communitiesSlice';
import { recordActivity } from '../services/contracts/community';
import { seedTestDataIfNeeded } from '../utils/seedTestData';
import { eventStreamService } from '../services/eventStream';
import type { BlockchainEvent } from '../services/eventStream';
import styles from './CommunityView.module.scss';
import { useAlert } from '../components/shared/useAlert';

const CollabList = lazy(() => import('../components/community/CollabList'));
const Members = lazy(() => import('../components/community/Members'));
const Currency = lazy(() => import('../components/community/Currency'));
const ChatTopicList = lazy(() => import('../components/community/chat/ChatTopicList'));
const ChatTopic = lazy(() => import('../components/community/chat/ChatTopic'));
const CollaborationPage = lazy(() => import('./collaboration/CollaborationPage'));
const IdentityTrust = lazy(() => import('../components/community/IdentityTrust'));
const CreateInitiativePage = lazy(() => import('./CreateInitiativePage'));
const CommunitySettings = lazy(() => import('../components/community/CommunitySettings'));
import CommunityHome from '../components/community/CommunityHome';

// ─── Collab page wrapper ────────────────────
const CollabPage: React.FC<{ communityId: string }> = ({ communityId }) => {
  const navigate = useNavigate();
  const t = useT();
  const { collabId } = useParams<{ collabId: string }>();
  const { communityCollaborations } = useAppSelector((s) => s.communities);

  const collabsLoaded = Array.isArray(communityCollaborations[communityId]);
  const collabs = communityCollaborations[communityId] ?? [];
  const collab = collabs.find((c) => c.id === collabId);
  const title = collab?.title || t('collab.defaultTitle', 'Collab');

  if (!collabId) {
    return (
      <div className={styles.loadingState}>
        <p>{t('collab.missingId', 'Collab link is missing an id.')}</p>
        <button onClick={() => navigate(`/community/${communityId}/collab`)}>{t('collab.backToCollabs', 'Back to collabs')}</button>
      </div>
    );
  }

  if (collabsLoaded && !collab) {
    return (
      <div className={styles.loadingState}>
        <p>{t('collab.notInCommunity', "This collab isn't part of the community, or it hasn't synced yet.")}</p>
        <button onClick={() => navigate(`/community/${communityId}/collab`)}>{t('collab.backToCollabs', 'Back to collabs')}</button>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={styles.loadingState}><p>{t('collab.loading', 'Loading collab…')}</p></div>}>
      <CollaborationPage
        type="collab"
        title={title}
        collaborationId={collabId}
        communityId={communityId}
      />
    </Suspense>
  );
};

// ─── Main community view ─────────────────────
const CommunityView: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const t = useT();
  const { showAlert, showConfirm, alertElement } = useAlert();
  const { contracts, publicKey, serverUrl } = useAppSelector((state) => state.user);
  const { communityProperties = {}, communityMembers = {} } = useAppSelector((state) => state.communities);
  const [fetching, setFetching] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useAppDispatch();

  if (!communityId) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <h2>Invalid Community</h2>
          <p>No community ID provided.</p>
          <button onClick={() => navigate('/identity/communities')}>Back to Communities</button>
        </div>
      </div>
    );
  }

  const contract = useMemo(() => contracts.find((c) => c.id === communityId), [contracts, communityId]);
  const props = contract ? communityProperties[contract.id] || {} : null;

  const handleContractWrite = useCallback(
    (event: BlockchainEvent) => {
      if (event.contract === communityId && publicKey && serverUrl) {
        dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
        dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
      }
    },
    [communityId, publicKey, serverUrl, dispatch],
  );

  useEffect(() => {
    if (!communityId) return;

    if (!props || Object.keys(props).length === 0) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.serverUrl && user.publicKey) {
            setFetching(true);
            dispatch(
              fetchCommunityProperties({
                contractId: communityId,
                serverUrl: user.serverUrl,
                publicKey: user.publicKey,
              }),
            ).finally(() => setFetching(false));
          }
        } catch {
          // skip
        }
      }
    }

    if (publicKey && serverUrl && communityId && !communityMembers[communityId]) {
      dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    }

    eventStreamService.addEventListener('contract_write', handleContractWrite);
    return () => {
      eventStreamService.removeEventListener('contract_write', handleContractWrite);
    };
  }, [communityId, props, dispatch, publicKey, serverUrl, communityMembers, handleContractWrite]);

  // Record user activity + fetch active-member count on community entry.
  // Old communities lack `record_activity` / `get_active_members`; both fall back silently.
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    recordActivity(serverUrl, publicKey, communityId).catch(() => { /* old community — silent */ });
    dispatch(fetchCommunityActiveMembers({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, communityId, dispatch]);

  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    const name = communityProperties[communityId]?.name || '';
    if (name) {
      seedTestDataIfNeeded(serverUrl, publicKey, communityId, name);
    }
  }, [serverUrl, publicKey, communityId, communityProperties]);

  if (fetching) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  if (!contract || !props || !props.name) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <h2>Community Not Found</h2>
          <p>The community doesn&apos;t exist or hasn&apos;t loaded yet.</p>
          <button onClick={() => navigate('/identity/communities')}>Back to Communities</button>
        </div>
      </div>
    );
  }

  const isDemo = isDemoContract(communityId);

  const handleShareDemoLink = async () => {
    try {
      const link = await buildDemoShareLink();
      await navigator.clipboard.writeText(link);
      showAlert(
        t('community.demoLinkCopiedBody', 'Anyone who opens this link will land on this populated demo.'),
        { title: t('community.demoLinkCopiedTitle', 'Demo link copied') },
      );
    } catch (err) {
      console.error('[CommunityView] Failed to build demo share link:', err);
    }
    setShowMenu(false);
  };

  const handleResetDemo = async () => {
    if (!publicKey) return;
    const ok = await showConfirm(
      t('community.resetBody', 'This wipes all demo interactions and restores the seeded state.'),
      {
        title: t('community.resetTitle', 'Reset demo?'),
        confirmLabel: t('community.resetConfirm', 'Reset'),
        destructive: true,
      },
    );
    if (!ok) return;
    resetDemoCommunity(communityId, publicKey);
    setShowMenu(false);
    window.location.reload();
  };

  // Run an action, then close the menu. (The demo handlers close themselves.)
  const closeAfter = (fn: () => void) => () => {
    fn();
    setShowMenu(false);
  };

  const menuItems: SlideOutMenuItem[] = [
    { key: 'home', icon: Home, label: t('community.menu.home', 'Home'), onClick: closeAfter(() => navigate('/stage/problem')) },
    { key: 'create-initiative', icon: PlusCircle, label: t('initiative.start', 'Start an initiative'), onClick: closeAfter(() => navigate(`/community/${communityId}/create-initiative`)) },
    { key: 'collab', icon: Users2, label: t('community.menu.collab', 'Collab'), onClick: closeAfter(() => navigate(`/community/${communityId}/collab`)), dividerBefore: true },
    { key: 'chat', icon: MessageSquare, label: t('community.menu.chat', 'Chat'), onClick: closeAfter(() => navigate(`/community/${communityId}/chat`)) },
    { key: 'currency', icon: Coins, label: t('community.menu.currency', 'Currency'), onClick: closeAfter(() => navigate(`/community/${communityId}/currency`)) },
    { key: 'members', icon: Users, label: t('community.menu.members', 'Members'), onClick: closeAfter(() => navigate(`/community/${communityId}/members`)) },
    { key: 'identity', icon: Shield, label: t('community.menu.identity', 'Identity & Trust'), onClick: closeAfter(() => navigate(`/community/${communityId}/identity`)) },
    { key: 'settings', icon: Settings, label: t('community.menu.settings', 'Settings'), onClick: closeAfter(() => navigate(`/community/${communityId}/settings`)) },
    { key: 'share', icon: Share2, label: t('community.menu.share', 'Share Community Link'), onClick: closeAfter(() => { navigator.clipboard.writeText(window.location.href); }), dividerBefore: true },
    { key: 'invite', icon: UserPlus, label: t('community.menu.invite', 'Invite Members'), onClick: closeAfter(() => navigate(`/community/${communityId}/members`)) },
    ...(isDemo
      ? [
          { key: 'share-demo', icon: Link2, label: t('community.menu.shareDemo', 'Share Demo Link'), onClick: handleShareDemoLink, dividerBefore: true } as SlideOutMenuItem,
          { key: 'reset-demo', icon: RotateCcw, label: t('community.menu.resetDemo', 'Reset Demo'), onClick: handleResetDemo } as SlideOutMenuItem,
        ]
      : []),
    { key: 'leave', icon: LogOut, label: t('community.menu.leave', 'Leave Community'), onClick: closeAfter(() => navigate('/identity/communities')), variant: 'danger' },
  ];

  return (
    <div className={styles.page}>
      {/* Global app header — the community name is the page's single <h1>, kept for
          assistive tech but hidden on screen (the community card shows it visibly). */}
      <AppHeader title={props.name} titleVisuallyHidden />

      {/* Slide-out community menu — opens from the right via CommunityCard "Menu" button */}
      <SlideOutMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title={props.name}
        items={menuItems}
        side="right"
        closeLabel={t('community.menu.close', 'Close menu')}
      />

      {alertElement}

      {/* Main content */}
      <main id="main" tabIndex={-1} className={styles.body}>
        <Suspense fallback={<div className={styles.loadingState}>Loading...</div>}>
          <ErrorBoundary fallbackMessage="This section encountered an error.">
            <Routes>
              <Route path="activity" element={<Navigate to={`/community/${communityId}`} replace />} />
              <Route path="initiative" element={<Navigate to={`/community/${communityId}`} replace />} />
              <Route path="issues" element={<Navigate to={`/community/${communityId}`} replace />} />
              <Route path="collaborations" element={<Navigate to={`/community/${communityId}`} replace />} />
              <Route path="share" element={<Navigate to={`/community/${communityId}/members`} replace />} />
              <Route path="collab" element={<CollabList communityId={communityId!} />} />
              <Route
                path="collab/:collabId"
                element={
                  <ErrorBoundary fallbackMessage="Couldn't load this collab workspace. Try again or pick a different template.">
                    <CollabPage communityId={communityId!} />
                  </ErrorBoundary>
                }
              />
              <Route
                path="chat"
                element={
                  <ErrorBoundary fallbackMessage="Chat ran into an error. Try again in a moment.">
                    <ChatTopicList communityId={communityId!} />
                  </ErrorBoundary>
                }
              />
              <Route
                path="chat/:topicId"
                element={
                  <ErrorBoundary fallbackMessage="Chat ran into an error. Try again in a moment.">
                    <ChatTopic />
                  </ErrorBoundary>
                }
              />
              <Route path="members" element={<Members communityId={communityId!} />} />
              <Route path="currency" element={<Currency communityId={communityId!} />} />
              <Route path="identity" element={<IdentityTrust communityId={communityId!} />} />
              <Route path="settings" element={<CommunitySettings communityId={communityId!} />} />
              <Route path="create-initiative" element={<CreateInitiativePage />} />
              <Route path="*" element={<CommunityHome communityId={communityId!} onOpenMenu={() => setShowMenu(true)} isDemo={isDemo} />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </main>

    </div>
  );
};

export default CommunityView;
