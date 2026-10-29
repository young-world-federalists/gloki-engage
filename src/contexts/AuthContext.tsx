import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeUser, setCurrentUser, clearUser, fetchContracts } from '../store/slices/userSlice';
import type { AppDispatch, RootState } from '../store';
import { buildFlowContractsScope, hydrateContracts } from '../components/collaboration/flows/shared/flowContractsSlice';
import { setDigitalAgentScope } from '../components/identity/agent/digitalAgentStore';
import { buildNotificationsScope, hydrateNotifications } from '../store/slices/notificationsSlice';
import { eventStreamService } from '../services/eventStream';
import { clearOrganization } from '../services/organizationActor';
import { notifyOrganizationChanged } from '../hooks/useOrganization';
import { startNotificationRuntime } from '../services/notifications';
import { AuthContext, type AuthContextType } from './useAuth';

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

/** Connects the event stream, then loads the user's contracts. */
async function connectAndInitialize(dispatch: AppDispatch, publicKey: string, serverUrl: string) {
  // Connect to the SSE stream BEFORE initialization so we can catch deploy_contract events
  eventStreamService.connect(serverUrl, publicKey);
  await dispatch(initializeUser()).unwrap();
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

  // Refresh the contracts list whenever a contract is deployed (one listener
  // for the app's lifetime; the stream reconnects per sign-in).
  useEffect(() => {
    const refreshContracts = () => dispatch(fetchContracts());
    eventStreamService.addEventListener('deploy_contract', refreshContracts);
    return () => eventStreamService.removeEventListener('deploy_contract', refreshContracts);
  }, [dispatch]);

  // Restore the stored session once, on app load. If the server refuses it,
  // fall back to the login page, which shows why (its `loginError`).
  useEffect(() => {
    if (!storedUser || initializationRef.current) return;
    initializationRef.current = true;
    dispatch(setCurrentUser(storedUser));
    connectAndInitialize(dispatch, storedUser.publicKey, storedUser.serverUrl)
      .catch((err) => {
        localStorage.setItem('loginError', err instanceof Error ? err.message : String(err));
        dispatch(setCurrentUser(null));
        eventStreamService.disconnect();
      })
      .finally(() => setIsLoading(false));
  }, [dispatch, storedUser]);

  const login = async (publicKey: string, serverUrl: string) => {
    try {
      setIsLoading(true);
      
      // Set the current user in Redux state first
      dispatch(setCurrentUser({ publicKey, serverUrl }));
      await connectAndInitialize(dispatch, publicKey, serverUrl);

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify({ publicKey, serverUrl }));
    } catch (err) {
      // Registration/validation failed against the real server — undo the
      // optimistic setCurrentUser above so isAuthenticated goes back to
      // false and the app returns to LoginPage instead of stranding the
      // user in a signed-in-looking app with no contracts and no error.
      dispatch(setCurrentUser(null));
      eventStreamService.disconnect();
      throw new Error(String(err), { cause: err });
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

    // Clear user data from Redux
    dispatch(clearUser());

    // Disconnect from the SSE stream
    eventStreamService.disconnect();
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
