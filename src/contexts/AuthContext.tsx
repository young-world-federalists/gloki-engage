import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeUser, setCurrentUser, clearUser, fetchContracts } from '../store/slices/userSlice';
import type { AppDispatch, RootState } from '../store';
import { buildFlowContractsScope, hydrateContracts } from '../components/collaboration/flows/shared/flowContractsSlice';
import { setDigitalAgentScope } from '../components/identity/agent/digitalAgentStore';
import { eventStreamService } from '../services/eventStream';
import { clearOrganization } from '../services/organizationActor';
import { notifyOrganizationChanged } from '../hooks/useOrganization';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (publicKey: string, serverUrl: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const initializationRef = useRef(false);
  
  // Get user data from Redux
  const user = useSelector((state: RootState) => state.user);
  const isAuthenticated = !!(user.publicKey && user.serverUrl);

  useEffect(() => {
    const scopeKey = user.publicKey && user.serverUrl
      ? buildFlowContractsScope(user.serverUrl, user.publicKey)
      : null;
    dispatch(hydrateContracts({ scopeKey }));
    // Same scope key for the onboarding Digital Agent store — without this,
    // one identity's completed onboarding leaks into every other identity
    // that logs in on the same browser (these keys used to be global).
    setDigitalAgentScope(scopeKey);
  }, [dispatch, user.publicKey, user.serverUrl]);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('user');
    if (storedUser && !initializationRef.current) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch(setCurrentUser(userData));
        // Validate stored credentials and load contracts
        validateStoredCredentials(userData.publicKey, userData.serverUrl);
        initializationRef.current = true;
      } catch (error) {
        localStorage.removeItem('user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [dispatch]);

  const validateStoredCredentials = async (publicKey: string, serverUrl: string) => {
    try {
      // Connect to the SSE stream BEFORE initialization so we can catch deploy_contract events
      eventStreamService.connect(serverUrl, publicKey);
      
      // Set up listener for contract deployment events to refresh contracts list
      const handleContractDeploy = () => {
        dispatch(fetchContracts());
      };
      eventStreamService.addEventListener('deploy_contract', handleContractDeploy);
      
      // Use the new initializeUser thunk which handles everything
      await dispatch(initializeUser()).unwrap();
      
      setIsLoading(false);
    } catch (err) {
      throw err;
    }
  };

  const login = async (publicKey: string, serverUrl: string) => {
    try {
      setIsLoading(true);
      
      // Set the current user in Redux state first
      dispatch(setCurrentUser({ publicKey, serverUrl }));
      
      // Connect to the SSE stream BEFORE initialization so we can catch deploy_contract events
      eventStreamService.connect(serverUrl, publicKey);
      
      // Set up listener for contract deployment events to refresh contracts list
      const handleContractDeploy = () => {
        dispatch(fetchContracts());
      };
      eventStreamService.addEventListener('deploy_contract', handleContractDeploy);
      
      // Use the new initializeUser thunk which handles everything
      await dispatch(initializeUser()).unwrap();

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify({ publicKey, serverUrl }));
    } catch (err) {
      // Registration/validation failed against the real server — undo the
      // optimistic setCurrentUser above so isAuthenticated goes back to
      // false and the app returns to LoginPage instead of stranding the
      // user in a signed-in-looking app with no contracts and no error.
      dispatch(setCurrentUser(null));
      eventStreamService.disconnect();
      throw new Error(String(err));
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
