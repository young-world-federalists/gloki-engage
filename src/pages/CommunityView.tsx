import React, { useMemo, useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Home, Menu, X, Users2, MessageSquare, Users, Coins, Share2, UserPlus, LogOut, PlusCircle, Shield, Link2, RotateCcw, MoreHorizontal } from 'lucide-react';
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

const CollabList = lazy(() => import('../components/community/CollabList'));
const Members = lazy(() => import('../components/community/Members'));
const Currency = lazy(() => import('../components/community/Currency'));
const ChatTopicList = lazy(() => import('../components/community/chat/ChatTopicList'));
const ChatTopic = lazy(() => import('../components/community/chat/ChatTopic'));
const CollaborationPage = lazy(() => import('./collaboration/CollaborationPage'));
const IdentityTrust = lazy(() => import('../components/community/IdentityTrust'));
const CreateInitiativePage = lazy(() => import('./CreateInitiativePage'));
import CommunityHome from '../components/community/CommunityHome';

// ─── Collab page wrapper ────────────────────
const CollabPage: React.FC<{ communityId: string }> = ({ communityId }) => {
  const navigate = useNavigate();
  const { collabId } = useParams<{ collabId: string }>();
  const { communityCollaborations } = useAppSelector((s) => s.communities);

  const collabsLoaded = Array.isArray(communityCollaborations[communityId]);
  const collabs = communityCollaborations[communityId] ?? [];
  const collab = collabs.find((c) => c.id === collabId);
  const title = collab?.title || 'Collab';

  if (!collabId) {
    return (
      <div className={styles.loadingState}>
        <p>Collab link is missing an id.</p>
        <button onClick={() => navigate(`/community/${communityId}/collab`)}>Back to collabs</button>
      </div>
    );
  }

  if (collabsLoaded && !collab) {
    return (
      <div className={styles.loadingState}>
        <p>This collab isn&apos;t part of the community, or it hasn&apos;t synced yet.</p>
        <button onClick={() => navigate(`/community/${communityId}/collab`)}>Back to collabs</button>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className={styles.loadingState}><p>Loading collab…</p></div>}>
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
  const location = useLocation();
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

  const memberCount = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId].length : 0;
  const isDemo = isDemoContract(communityId);

  const handleShareDemoLink = async () => {
    try {
      const link = await buildDemoShareLink();
      await navigator.clipboard.writeText(link);
      // eslint-disable-next-line no-alert
      alert('Demo link copied to clipboard. Anyone who opens it will land on this populated demo.');
    } catch (err) {
      console.error('[CommunityView] Failed to build demo share link:', err);
    }
    setShowMenu(false);
  };

  const handleResetDemo = () => {
    if (!publicKey) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Reset this demo to its seeded state? All demo interactions will be wiped.')) return;
    resetDemoCommunity(communityId, publicKey);
    setShowMenu(false);
    window.location.reload();
  };

  return (
    <div className={styles.page}>
      {/* Dark header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <button
            className={styles.menuButton}
            onClick={() => setShowMenu(true)}
            aria-label="Open community menu"
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>
          <h1 className={styles.communityName}>{props.name}</h1>
          {isDemo && <span className={styles.demoPill}>DEMO</span>}
        </div>
        {props.description && <p className={styles.communityDesc}>{props.description}</p>}
        <span className={styles.memberCount}>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Slide-out community menu */}
      {showMenu && (
        <div className={styles.menuOverlay} onClick={() => setShowMenu(false)}>
          <div className={styles.menuPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.menuHeader}>
              <span className={styles.menuTitle}>{props.name}</span>
              <button className={styles.menuClose} onClick={() => setShowMenu(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.menuList}>
              <button className={styles.menuItem} onClick={() => { navigate('/stage/problem'); setShowMenu(false); }}>
                <Home size={20} />
                <span>Home</span>
              </button>
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/create-initiative`); setShowMenu(false); }}>
                <PlusCircle size={20} />
                <span>Create Initiative</span>
              </button>

              <div className={styles.menuDivider} />

              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/collab`); setShowMenu(false); }}>
                <Users2 size={20} />
                <span>Collab</span>
              </button>
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/chat`); setShowMenu(false); }}>
                <MessageSquare size={20} />
                <span>Chat</span>
              </button>
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/currency`); setShowMenu(false); }}>
                <Coins size={20} />
                <span>Currency</span>
              </button>
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/members`); setShowMenu(false); }}>
                <Users size={20} />
                <span>Members</span>
              </button>
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/identity`); setShowMenu(false); }}>
                <Shield size={20} />
                <span>Identity & Trust</span>
              </button>

              <div className={styles.menuDivider} />

              <button className={styles.menuItem} onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShowMenu(false);
              }}>
                <Share2 size={20} />
                <span>Share Community Link</span>
              </button>
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/members`); setShowMenu(false); }}>
                <UserPlus size={20} />
                <span>Invite Members</span>
              </button>

              {isDemo && (
                <>
                  <div className={styles.menuDivider} />
                  <button className={styles.menuItem} onClick={handleShareDemoLink}>
                    <Link2 size={20} />
                    <span>Share Demo Link</span>
                  </button>
                  <button className={styles.menuItem} onClick={handleResetDemo}>
                    <RotateCcw size={20} />
                    <span>Reset Demo</span>
                  </button>
                </>
              )}

              <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { navigate('/identity/communities'); setShowMenu(false); }}>
                <LogOut size={20} />
                <span>Leave Community</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline community nav tab bar */}
      <nav className={styles.tabBar} aria-label="Community navigation">
        <button
          className={`${styles.tabItem} ${!location.pathname.match(/\/(collab|chat|currency|members|identity|create-initiative)/) ? styles.tabItemActive : ''}`}
          onClick={() => navigate(`/community/${communityId}`)}
        >
          <Home size={18} />
          <span>Home</span>
        </button>
        <button
          className={`${styles.tabItem} ${location.pathname.includes('/collab') ? styles.tabItemActive : ''}`}
          onClick={() => navigate(`/community/${communityId}/collab`)}
        >
          <Users2 size={18} />
          <span>Collab</span>
        </button>
        <button
          className={`${styles.tabItem} ${location.pathname.includes('/chat') ? styles.tabItemActive : ''}`}
          onClick={() => navigate(`/community/${communityId}/chat`)}
        >
          <MessageSquare size={18} />
          <span>Chat</span>
        </button>
        <button
          className={`${styles.tabItem} ${location.pathname.includes('/currency') ? styles.tabItemActive : ''}`}
          onClick={() => navigate(`/community/${communityId}/currency`)}
        >
          <Coins size={18} />
          <span>Currency</span>
        </button>
        <button
          className={`${styles.tabItem} ${location.pathname.includes('/members') ? styles.tabItemActive : ''}`}
          onClick={() => navigate(`/community/${communityId}/members`)}
        >
          <Users size={18} />
          <span>Members</span>
        </button>
        <button
          className={styles.tabItem}
          onClick={() => setShowMenu(true)}
          aria-label="More options"
        >
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </nav>

      {/* Main content */}
      <div className={styles.body}>
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
              <Route path="create-initiative" element={<CreateInitiativePage />} />
              <Route path="*" element={<CommunityHome communityId={communityId!} />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </div>

    </div>
  );
};

export default CommunityView;
