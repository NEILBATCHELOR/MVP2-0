// Auth providers
import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export interface AuthProviderProps {
  children: ReactNode;
}

// This will be implemented with actual auth logic
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // TODO: Implement auth provider logic
  const contextValue: AuthContextType = {
    user: null,
    loading: false,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    resetPassword: async () => {},
  };

  return React.createElement(AuthContext.Provider, { value: contextValue }, children);
};
