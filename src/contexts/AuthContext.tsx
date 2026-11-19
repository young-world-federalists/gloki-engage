import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeUser, setCurrentUser, clearUser, fetchContracts } from '../store/slices/userSlice';
import type { AppDispatch, RootState } from '../store';
import { buildFlowContractsScope, hydrateContracts } from '../components/collaboration/flows/shared/flowContractsSlice';
import { setDigitalAgentScope } from '../components/identity/agent/digitalAgentStore';
import { buildNotificationsScope, hydrateNotifications } from '../store/slices/notificationsSlice';
import { eventStreamService } from '../services/eventStream';
import { resume, signIn, signOut } from '../services/ibc';
import { clearOrganization } from '../services/organizationActor';
import { notifyOrganizationChanged } from '../hooks/useOrganization';
import { startNotificationRuntime } from '../services/notifications';
import { AuthContext, type AuthContextType } from './useAuth';
import { getStoredLocale, translate } from '../i18n';

/** The signed-in identity saved by `login`, or null (a broken entry is dropped). */
function readStoredUser(): { publicKey: string; serverUrl: string } | null {
  const stored = localStorage.getItem('user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [storedUser] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(storedUser !== null);
  const dispatch = useDispatch<AppDispatch>();
  const initializationRef = useRef(false);
  
  // Get user data from Redux
  const user = useSelector((state: RootState) => state.user);
  const isAuthenticated = !!(user.publicKey && user.serverUrl);

  useEffect(() => {
    const flowScopeKey = user.publicKey && user.serverUrl
      ? buildFlowContractsScope(user.serverUrl, user.publicKey)
      : null;
    const notificationsScopeKey = user.publicKey && user.serverUrl
      ? buildNotificationsScope(user.serverUrl, user.publicKey)
      : null;
    dispatch(hydrateContracts({ scopeKey: flowScopeKey }));
    // Same scope key for the Digital Agent trust-graph store — without this,
    // one identity's vouch data leaks into every other identity that logs in
    // on the same browser (these keys used to be global).
    setDigitalAgentScope(flowScopeKey);
    dispatch(hydrateNotifications({ scopeKey: notificationsScopeKey }));
    if (!user.publicKey || !user.serverUrl) return undefined;
    return startNotificationRuntime({ serverUrl: user.serverUrl, publicKey: user.publicKey });
  }, [dispatch, user.publicKey, user.serverUrl]);

  // Refresh the contracts list whenever the user deploys or joins a contract
  // (one listener for the app's lifetime).
  useEffect(() => {
    const refreshContracts = () => dispatch(fetchContracts());
    eventStreamService.addEventListener('deploy_contract', refreshContracts);
    eventStreamService.addEventListener('join_contract', refreshContracts);
    return () => {
      eventStreamService.removeEventListener('deploy_contract', refreshContracts);
      eventStreamService.removeEventListener('join_contract', refreshContracts);
    };
  }, [dispatch]);

  // Restore the stored session once, on app load: silently, if this
  // browser's app still acts for the stored agent on the stored node. If not,
  // fall back to the login page, which shows why (its `loginError`).
  useEffect(() => {
    if (!storedUser || initializationRef.current) return;
    initializationRef.current = true;
    resume(storedUser.serverUrl, storedUser.publicKey)
      .then(async (ok) => {
        if (!ok) throw new Error(translate(getStoredLocale(), 'login.error.signInAgain', 'Please sign in again with your node.'));
        dispatch(setCurrentUser(storedUser));
        await dispatch(initializeUser()).unwrap();
      })
      .catch((err) => {
        localStorage.removeItem('user');
        localStorage.setItem('loginError', err instanceof Error ? err.message : String(err));
        dispatch(setCurrentUser(null));
      })
      .finally(() => setIsLoading(false));
  }, [dispatch, storedUser]);

  // From a click: the user signs in on their node's page (a popup), which
  // creates their identity there if they are new.
  const login = async (serverUrl: string) => {
    try {
      setIsLoading(true);
      const publicKey = await signIn(serverUrl);
      dispatch(setCurrentUser({ publicKey, serverUrl }));
      await dispatch(initializeUser()).unwrap();
      localStorage.setItem('user', JSON.stringify({ publicKey, serverUrl }));
    } catch (err) {
      dispatch(setCurrentUser(null));
      throw err instanceof Error ? err : new Error(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');

    // S33: the organization record outlives `user` unless we drop it here —
    // the next person to sign in on this device would inherit the org session
    // and find every stage blocked.
    clearOrganization();
    notifyOrganizationChanged();

    dispatch(clearUser());
    void signOut();
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
