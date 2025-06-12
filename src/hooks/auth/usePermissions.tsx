import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { authService } from '@/components/auth/services/authService';
import { useAuth } from '@/infrastructure/auth/AuthProvider';

export interface UsePermissionsReturn {
  hasPermission: (permissionName: string) => Promise<boolean>;
  isChecking: boolean;
  cachedPermissions: Record<string, boolean>;
}

interface PermissionsContextType extends UsePermissionsReturn {}

const PermissionsContext = createContext<PermissionsContextType>({
  hasPermission: async () => false,
  isChecking: false,
  cachedPermissions: {},
});

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const permissions = usePermissions();
  
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  return useContext(PermissionsContext);
};

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const [cachedPermissions, setCachedPermissions] = useState<Record<string, boolean>>({});
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const hasPermission = useCallback(
    async (permissionName: string): Promise<boolean> => {
      // If no user is logged in, they have no permissions
      if (!user) return false;

      // If we've already checked this permission, return the cached result
      if (permissionName in cachedPermissions) {
        return cachedPermissions[permissionName];
      }

      setIsChecking(true);
      try {
        const hasPermission = await authService.hasPermission(user.id, permissionName);
        
        // Cache the result
        setCachedPermissions(prev => ({
          ...prev,
          [permissionName]: hasPermission
        }));
        
        return hasPermission;
      } catch (error) {
        console.error(`Error checking permission ${permissionName}:`, error);
        return false;
      } finally {
        setIsChecking(false);
      }
    },
    [user, cachedPermissions]
  );

  return {
    hasPermission,
    isChecking,
    cachedPermissions
  };
} 