import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: null;
  session: null;
  isAuthenticated: false;
  login: () => Promise<{ success: boolean }>;
  signUp: () => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  loading: false;
}

const MinimalAuthContext = createContext<AuthContextType | null>(null);

export const useMinimalAuth = () => {
  const context = useContext(MinimalAuthContext);
  if (!context) {
    throw new Error('useMinimalAuth must be used within MinimalAuthProvider');
  }
  return context;
};

interface MinimalAuthProviderProps {
  children: ReactNode;
}

export const MinimalAuthProvider = ({ children }: MinimalAuthProviderProps) => {
  const value: AuthContextType = {
    user: null,
    session: null,
    isAuthenticated: false,
    login: async () => ({ success: true }),
    signUp: async () => ({ success: true }),
    logout: async () => {},
    loading: false
  };

  return (
    <MinimalAuthContext.Provider value={value}>
      {children}
    </MinimalAuthContext.Provider>
  );
};