import React, { useMemo, useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate, useLocation, matchPath } from 'react-router-dom';
import { Home, Users2, MessageSquare, Users, Coins, Share2, UserPlus, LogOut, PlusCircle, Shield, Link2, RotateCcw, Settings, PenLine } from 'lucide-react';
import { SlideOutMenu, type SlideOutMenuItem } from '../components/shared';
import AppHeader from '../components/AppHeader';
import { useT } from '../i18n';
import { isDemoContract } from '../services/demo/demoRegistry';
import { isGlokiEngageCommunityContract } from '../services/contracts/glokiEngageCommunity';
import { resetDemoCommunity } from '../services/demo/seedDemoCommunity';
import { buildDemoShareLink } from '../services/demo/demoUrlShare';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import { fetchCommunityProperties, fetchGlokiEngageCommunityDetails, fetchCommunityMembers, fetchCollaborations, fetchCommunityActiveMembers } from '../store/slices/communitiesSlice';
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
const WriteTogetherPage = lazy(() => import('../components/community/writeTogether/WriteTogetherPage'));
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
        collaborationId={collabId}
        communityId={communityId}
      />
    </Suspense>
  );
};

// S23 — per-section header config. Each community mini-app renders its title +
// intro in the AppHeader title block (one box: eyebrow = community name, h1 =
// section title, subtitle = section intro) instead of an in-content header.
// [i18n key, English default] pairs; the copy is unchanged from the old headers.
const SECTION_HEADS: Record<string, { title: [string, string]; subtitle?: [string, string] }> = {
  collab: {
    title: ['collab.listTitle', 'Collabs'],
    subtitle: ['collab.listSubtitle', 'Template-based workspaces for teamwork'],
  },
  chat: {
    title: ['chat.title', 'Chat'],
    subtitle: ['chat.intro', 'Open conversations about anything in your community.'],
  },
  members: {
    title: ['members.title', 'Members'],
    subtitle: ['members.intro', 'People in this community. Members can propose initiatives, vote on decisions, and participate in governance.'],
  },
  currency: {
    title: ['funds.title', 'Community Funds'],
    subtitle: ['funds.subtitle', 'Manage shared funds and signal what matters'],
  },
  identity: {
    title: ['identityTrust.title', 'Identity & Trust'],
    subtitle: ['identityTrust.intro', "Gloki uses a web of trust to keep the community real people, not bots. By scanning each other's QR codes, members vouch that they know you're a real person — no ID papers, no face scan. The more vouches you have, the stronger your community's democratic foundation."],
  },
  settings: {
    title: ['settings.title', 'Community settings'],
    subtitle: ['settings.lead', 'Choose who can take part at each stage. Read-only viewing is always open.'],
  },
  'write-together': {
    title: ['writeTogether.title', 'Write together'],
    subtitle: ['writeTogether.subtitle', 'Co-author a problem or solution, then submit it to the feed.'],
  },
  'create-initiative': {
    title: ['initiative.start', 'Start an initiative'],
  },
};

// ─── Main community view ─────────────────────
const CommunityView: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const t = useT();
  const { showAlert, showConfirm, alertElement } = useAlert();
  const location = useLocation();
  const { contracts, publicKey, serverUrl } = useAppSelector((state) => state.user);
  const { communityProperties = {}, communityMembers = {}, communityCollaborations = {} } = useAppSelector((state) => state.communities);
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

    // Landing directly on this URL (refresh, or a shared link) — Redux state
    // is empty and nothing upstream (e.g. Communities.tsx's own list-page
    // prefetch) has populated communityProperties yet, so fetch it here.
    // Real gloki-engage communities have no `get_properties` method (only
    // Communities.tsx's fetchGlokiEngageCommunityDetails/`get_details` reads
    // them correctly) — calling the demo-era fetchCommunityProperties on one
    // fails silently and leaves this page stuck on "Community not found"
    // forever, even though the community and its contract are both real.
    if ((!props || Object.keys(props).length === 0) && publicKey && serverUrl) {
      setFetching(true);
      const fetchProperties = contract && isGlokiEngageCommunityContract(contract)
        ? dispatch(fetchGlokiEngageCommunityDetails({ contractId: communityId, serverUrl, publicKey }))
        : dispatch(fetchCommunityProperties({ contractId: communityId, serverUrl, publicKey }));
      fetchProperties.finally(() => setFetching(false));
    }

    if (publicKey && serverUrl && communityId && !communityMembers[communityId]) {
      dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    }

    eventStreamService.addEventListener('contract_write', handleContractWrite);
    return () => {
      eventStreamService.removeEventListener('contract_write', handleContractWrite);
    };
  }, [communityId, props, contract, dispatch, publicKey, serverUrl, communityMembers, handleContractWrite]);

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

  // Loading / not-found stay inside the page model: the AppHeader banner and
  // the `main#main` skip-link target render on EVERY branch (S16 audit: the
  // bare error card left the page with no banner, no main and no h1).
  if (fetching) {
    return (
      <div className={styles.page}>
        <AppHeader />
        <main id="main" tabIndex={-1}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>{t('community.loading', 'Loading community…')}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!contract || !props || !props.name) {
    return (
      <div className={styles.page}>
        <AppHeader />
        <main id="main" tabIndex={-1}>
          <div className={styles.errorState}>
            <h1>{t('community.notFound.title', 'Community not found')}</h1>
            <p>{t('community.notFound.body', "The community doesn't exist or hasn't loaded yet.")}</p>
            <button onClick={() => navigate('/identity/communities')}>
              {t('community.notFound.back', 'Back to Communities')}
            </button>
          </div>
        </main>
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
    // Close the menu BEFORE the confirm opens: both overlays sit on the modal
    // layer (z-index 1000), so never let them coexist — stacking would rest on
    // DOM order and one Escape press would dismiss both.
    setShowMenu(false);
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
    { key: 'write-together', icon: PenLine, label: t('community.menu.writeTogether', 'Write together'), onClick: closeAfter(() => navigate(`/community/${communityId}/write-together`)) },
    { key: 'collab', icon: Users2, label: t('community.menu.collab', 'Collab'), onClick: closeAfter(() => navigate(`/community/${communityId}/collab`)), dividerBefore: true },
    { key: 'chat', icon: MessageSquare, label: t('community.menu.chat', 'Chat'), onClick: closeAfter(() => navigate(`/community/${communityId}/chat`)) },
    { key: 'currency', icon: Coins, label: t('community.menu.funds', 'Community Funds'), onClick: closeAfter(() => navigate(`/community/${communityId}/currency`)) },
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

  // S23 — universal back for the community area: pop in-app history when it
  // exists (matches the hardware back), else fall back one level up the hierarchy.
  const backTo = (fallback: string) => () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(fallback);
  };

  // Derive the active section + deep views from the URL; the header renders
  // outside <Routes>, so it can't read route params directly.
  const section = matchPath({ path: '/community/:cid/:section', end: false }, location.pathname)?.params.section;
  const collabId = matchPath('/community/:cid/collab/:collabId', location.pathname)?.params.collabId;
  const inChatTopic = !!matchPath('/community/:cid/chat/:topicId', location.pathname);
  const sectionHead = section ? SECTION_HEADS[section] : undefined;
  const collabTitle = collabId
    ? communityCollaborations[communityId]?.find((c) => c.id === collabId)?.title || t('collab.defaultTitle', 'Collab')
    : undefined;

  const header = sectionHead ? (
    <AppHeader
      showBack
      onBack={backTo(
        collabId ? `/community/${communityId}/collab`
        : inChatTopic ? `/community/${communityId}/chat`
        : `/community/${communityId}`,
      )}
      eyebrow={props.name}
      title={collabTitle ?? t(...sectionHead.title)}
      // The intro line belongs to the section's list page, not its deep views.
      subtitle={collabId || inChatTopic || !sectionHead.subtitle ? undefined : t(...sectionHead.subtitle)}
    />
  ) : (
    // Community home — the community name is the page's single <h1>, kept for
    // assistive tech but hidden on screen (the community card shows it visibly).
    <AppHeader showBack onBack={backTo('/')} title={props.name} titleVisuallyHidden />
  );

  return (
    <div className={styles.page}>
      {header}

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
              <Route path="write-together" element={<WriteTogetherPage communityId={communityId!} />} />
              <Route path="*" element={<CommunityHome communityId={communityId!} onOpenMenu={() => setShowMenu(true)} isDemo={isDemo} />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </main>

    </div>
  );
};

export default CommunityView;
