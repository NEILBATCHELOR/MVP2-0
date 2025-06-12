import { useEffect, useState } from "react";
import { supabase } from "@/infrastructure/database/client";
import type { User } from "@/types/shared/models";
import type { Tables } from "@/types/core/database";

type UserHookReturn = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
};

/**
 * Hook for accessing the current authenticated user
 */
export function useUser(): UserHookReturn {
  const client = supabase;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        // Get the authenticated user from Supabase auth
        const { data: { user: authUser } } = await client.auth.getUser();
        
        if (!authUser) {
          setUser(null);
          return;
        }
        
        // Get additional user data from our database
        const { data, error } = await client
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        // Map database user to application user model
        const dbUser = data as Tables<'users'>;
        const userModel: User = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          status: dbUser.status as "active" | "revoked" | "suspended",
          role: dbUser.status || 'user', // Using status as role for now
          publicKey: dbUser.public_key || undefined,
          encryptedPrivateKey: dbUser.encrypted_private_key || undefined,
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at
        };
        
        setUser(userModel);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await client.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        return;
      }
      
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (error) {
        throw error;
      }
      
      // Map database user to application user model
      const dbUser = data as Tables<'users'>;
      const userModel: User = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        status: dbUser.status as "active" | "revoked" | "suspended",
        role: dbUser.status || 'user', // Using status as role for now
        publicKey: dbUser.public_key || undefined,
        encryptedPrivateKey: dbUser.encrypted_private_key || undefined,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      };
      
      setUser(userModel);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, refreshUser };
}