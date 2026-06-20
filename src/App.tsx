
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import StageFooter from './components/shared/StageFooter';
import NotFound from './pages/NotFound';
import { useI18n } from './i18n';
import { tryHydrateFromHash } from './services/demo/demoUrlShare';
import { getAgent, getProgress } from './components/identity/agent/digitalAgentStore';

// ─────────────────────────────────────────────────────────────────────────────
// FROZEN ROUTE MAP — the Voices-for-the-Climate journey.
//
// Phase 0 pre-registers every top-level route a lane needs, each pointing at a
// lane-owned component. Every area uses a `/*` wildcard so a lane adds its own
// sub-routes INSIDE its owned component. THEREFORE: lanes must NOT edit App.tsx.
// Need a new top-level route? Record it in MASTER_TODO §10 for the next
// Foundation pass — do not add it here from a lane branch.
//
//   /                                         → first-run → /welcome, else cross-community Home
//   /welcome/*                                → Lane A   onboarding journey
//   /stage/:stageId                           → (shell)  stage feed mini-apps
//   /identity/*                               → Lane A   identity / profile / about
//   /create-community                         → (shell)  create-community onboarding
//   /community/:communityId/*                 → Lane G   community home + currency
//   /initiative/:host/:agent/:cid/:iid/*      → Lanes B/C/D/E via stage components
//   /mandate/:communityId/:mandateId/*        → Lane E   published mandate + adoption
//   /lab/presence                             → dev verification page for presence primitives
// ─────────────────────────────────────────────────────────────────────────────

// Get the base path from Vite's import.meta.env.BASE_URL
const getBasename = () => {
  const baseUrl = import.meta.env.BASE_URL;
  // Remove trailing slash and return the basename
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomeView = lazy(() => import('./pages/HomeView'));
const StageFeedView = lazy(() => import('./pages/StageFeedView'));
const IdentityView = lazy(() => import('./pages/IdentityView'));
const CommunityView = lazy(() => import('./pages/CommunityView'));
const InitiativeView = lazy(() => import('./pages/collaboration/InitiativeView'));
const CreateCommunityPage = lazy(() => import('./pages/CreateCommunityPage'));
// Lane placeholder areas — owning lane replaces the stub component (not this file).
const OnboardingFlow = lazy(() => import('./components/onboarding/OnboardingFlow'));
const MandatePage = lazy(() => import('./components/mandate/MandatePage'));
// Dev/lab route — durable verification page for the cross-cutting presence primitives (§10 [F→Foundation]).
const PresenceLabRoute = lazy(() => import('./components/shared/presence/PresenceLabRoute'));

// First-run heuristic: a newcomer hasn't created a Digital Agent or finished onboarding yet.
// Such users land on the guided /welcome flow; everyone else goes straight to the stage feed.
const isFirstRun = (): boolean => {
  try {
    // Read the agent store's canonical state — getProgress() reads `gloki.onboarding`,
    // the key onboarding actually writes. The old code checked `gloki.onboarding.completed`,
    // which nothing ever set, so every returning user was sent back to /welcome.
    return !getAgent() || !getProgress().completed;
  } catch {
    // localStorage blocked (private mode) — fall back to the returning-user path.
    return false;
  }
};

// Entry point for `/`: first-run users are guided to the /welcome journey;
// everyone else lands on the cross-community Home overview.
function RootRoute() {
  if (isFirstRun()) return <Navigate to="/welcome" replace />;
  return <HomeView />;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useI18n();
  const [hydratingDemo, setHydratingDemo] = useState(true);

  // Hydrate demo state from URL hash before rendering routes so a shared demo
  // link lands straight on populated content.
  useEffect(() => {
    tryHydrateFromHash().finally(() => setHydratingDemo(false));
  }, []);

  if (isLoading || hydratingDemo) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('app.validatingSession', 'Validating session…')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="loading-container"><div className="loading-spinner"></div><p>{t('common.loading', 'Loading…')}</p></div>}>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary locale={locale} fallbackMessage={t('errorBoundary.appMessage', 'Gloki encountered an unexpected error. Please refresh the page.')}>
      <Router basename={getBasename()}>
        <Suspense fallback={<div className="loading-container"><div className="loading-spinner"></div><p>{t('common.loading', 'Loading…')}</p></div>}>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/welcome/*" element={<OnboardingFlow />} />
            <Route path="/stage/:stageId" element={<StageFeedView />} />
            <Route path="/identity/*" element={<IdentityView />} />
            <Route path="/create-community" element={<CreateCommunityPage />} />
            <Route path="/community/:communityId/*" element={<CommunityView />} />
            <Route
              path="/initiative/:initiativeHostServer/:initiativeHostAgent/:communityId/:initiativeId/*"
              element={<InitiativeView />}
            />
            <Route path="/mandate/:communityId/:mandateId/*" element={<MandatePage />} />
            <Route path="/lab/presence" element={<PresenceLabRoute />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <StageFooter />
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
