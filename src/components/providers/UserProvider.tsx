import React, { createContext, useContext, ReactNode } from 'react';
import { useUser as useUserHook } from '@/hooks/auth/user/useUser';
import type { User } from '@/types/shared/models';

// Create the context with appropriate typings
interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const userState = useUserHook();

  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the context
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 