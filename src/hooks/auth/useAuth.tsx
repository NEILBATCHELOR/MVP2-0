import { useState, useEffect } from 'react';
import { supabase } from '@/infrastructure/database/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Special login function with Super Admin recognition
 * 
 * @param email User email
 * @param password User password
 * @returns Session if login successful, error otherwise
 */
const loginWithSuperAdminCheck = async (email: string, password: string) => {
  try {
    // First, try normal login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    
    if (!data.session || !data.user) {
      throw new Error('No session or user returned from login');
    }
    
    // Set a special flag in local storage to recognize super admin users later
    // This will be checked if the normal role checks fail
    const userId = data.user.id;
    const knownSuperAdmins = [
      'f3aa3707-c54e-428d-b630-e15088d7b55d' // Super Admin ID
    ];
    
    if (knownSuperAdmins.includes(userId)) {
      localStorage.setItem('emergency_super_admin', userId);
      console.log('Emergency Super Admin recognition enabled');
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Login with Super Admin check failed:', err);
    return { data: null, error: err };
  }
};

/**
 * Hook for managing authentication state and user information
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting auth session:', error);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      // Use our enhanced login function for Super Admin support
      const { data, error } = await loginWithSuperAdminCheck(email, password);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  /**
   * Get the current user's role from the users table
   */
  const getUserRole = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error || !data) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data.role;
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    getUserRole,
    isAuthenticated: !!user,
  };
};