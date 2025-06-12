import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/infrastructure/database/client";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  
  // Additional methods required by hooks
  signUp: (credentials: any) => Promise<boolean>;
  signInWithOtp: (credentials: any) => Promise<boolean>;
  verifyOtp: (credentials: any) => Promise<boolean>;
  resetPassword: (credentials: any) => Promise<boolean>;
  updatePassword: (credentials: any) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  updateUser: (attributes: any) => Promise<boolean>;
  resend: (options: any) => Promise<boolean>;
  
  // State properties
  error: string | null;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signIn: async () => ({ error: new Error("Not implemented") }),
  signOut: async () => {},
  loading: true,
  
  // Additional methods
  signUp: async () => false,
  signInWithOtp: async () => false,
  verifyOtp: async () => false,
  resetPassword: async () => false,
  updatePassword: async () => false,
  refreshSession: async () => false,
  updateUser: async () => false,
  resend: async () => false,
  
  // State properties
  error: null,
  clearError: () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);
  const isAuthenticated = !!user;

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(`Auth state changed: ${event}`);
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error("Error signing in:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Additional auth methods (simplified implementations)
  const signUp = async (credentials: any) => {
    try {
      const { error } = await supabase.auth.signUp(credentials);
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("Sign up failed");
      return false;
    }
  };

  const signInWithOtp = async (credentials: any) => {
    try {
      const { error } = await supabase.auth.signInWithOtp(credentials);
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("OTP sign in failed");
      return false;
    }
  };

  const verifyOtp = async (credentials: any) => {
    try {
      const { error } = await supabase.auth.verifyOtp(credentials);
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("OTP verification failed");
      return false;
    }
  };

  const resetPassword = async (credentials: any) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(credentials.email);
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("Password reset failed");
      return false;
    }
  };

  const updatePassword = async (credentials: any) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: credentials.password });
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("Password update failed");
      return false;
    }
  };

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("Session refresh failed");
      return false;
    }
  };

  const updateUser = async (attributes: any) => {
    try {
      const { error } = await supabase.auth.updateUser(attributes);
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("User update failed");
      return false;
    }
  };

  const resend = async (options: any) => {
    try {
      const { error } = await supabase.auth.resend(options);
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError("Resend failed");
      return false;
    }
  };

  const value = {
    session,
    user,
    signIn,
    signOut,
    loading,
    
    // Additional methods
    signUp,
    signInWithOtp,
    verifyOtp,
    resetPassword,
    updatePassword,
    refreshSession,
    updateUser,
    resend,
    
    // State properties
    error,
    clearError,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Get the current user ID from the session
 * This is a server-side utility function
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }
    
    return session.user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}; 