import { createContext, useContext } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (publicKey: string, serverUrl: string) => Promise<void>;
  logout: () => void;
}

/** Provided by AuthProvider (AuthContext.tsx). */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
