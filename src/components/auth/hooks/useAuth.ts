/**
 * Authentication Hooks
 * 
 * Custom hooks for handling authentication logic and state
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthProvider';
import { authService } from '../services/authService';
import type {
  SignUpCredentials,
  SignInCredentials,
  SignInWithOtpCredentials,
  VerifyOtpCredentials,
  ResetPasswordCredentials,
  UpdatePasswordCredentials,
  AuthUser,
  AuthSession,
  TOTPSetupData,
  TOTPChallenge,
  TOTPFactor,
} from '../types/authTypes';

// Hook for sign up functionality
export const useSignUp = () => {
  const { signUp, loading, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = useCallback(async (credentials: SignUpCredentials) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      const success = await signUp(credentials);
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }, [signUp, clearError]);

  return {
    signUp: handleSignUp,
    loading: loading || isSubmitting,
    error,
    clearError,
  };
};

// Hook for sign in functionality
export const useSignIn = () => {
  const { signIn, loading, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = useCallback(async (credentials: SignInCredentials) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      const success = await signIn(credentials.email, credentials.password);
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }, [signIn, clearError]);

  return {
    signIn: handleSignIn,
    loading: loading || isSubmitting,
    error,
    clearError,
  };
};

// Hook for OTP authentication
export const useOtpAuth = () => {
  const { signInWithOtp, verifyOtp, loading, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = useCallback(async (credentials: SignInWithOtpCredentials) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      const success = await signInWithOtp(credentials);
      if (success) {
        setOtpSent(true);
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }, [signInWithOtp, clearError]);

  const verifyCode = useCallback(async (credentials: VerifyOtpCredentials) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      const success = await verifyOtp(credentials);
      if (success) {
        setOtpSent(false);
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }, [verifyOtp, clearError]);

  const resetOtp = useCallback(() => {
    setOtpSent(false);
    clearError();
  }, [clearError]);

  return {
    sendOtp,
    verifyCode,
    resetOtp,
    otpSent,
    loading: loading || isSubmitting,
    error,
    clearError,
  };
};

// Hook for password management
export const usePasswordManagement = () => {
  const { resetPassword, updatePassword, loading, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = useCallback(async (credentials: ResetPasswordCredentials) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      const success = await resetPassword(credentials);
      if (success) {
        setResetSent(true);
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }, [resetPassword, clearError]);

  const handleUpdatePassword = useCallback(async (credentials: UpdatePasswordCredentials) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      const success = await updatePassword(credentials);
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }, [updatePassword, clearError]);

  const resetState = useCallback(() => {
    setResetSent(false);
    clearError();
  }, [clearError]);

  return {
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    resetState,
    resetSent,
    loading: loading || isSubmitting,
    error,
    clearError,
  };
};

// Hook for session management
export const useSession = () => {
  const { session, user, isAuthenticated, refreshSession, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshSession = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const success = await refreshSession();
      return success;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSession]);

  // Auto-refresh session before expiry
  useEffect(() => {
    if (!session) return;

    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    // Refresh 5 minutes before expiry
    const refreshTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      const timeout = setTimeout(() => {
        handleRefreshSession();
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  }, [session, handleRefreshSession]);

  return {
    session,
    user,
    isAuthenticated,
    refreshSession: handleRefreshSession,
    loading: loading || isRefreshing,
    isValid: session && session.expires_at ? session.expires_at * 1000 > Date.now() : false,
  };
};

// Hook for user profile management
export const useUserProfile = () => {
  const { user, updateUser, loading, error, clearError } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = useCallback(async (attributes: {
    email?: string;
    data?: Record<string, any>;
  }) => {
    setIsUpdating(true);
    clearError();
    
    try {
      const success = await updateUser(attributes);
      return success;
    } finally {
      setIsUpdating(false);
    }
  }, [updateUser, clearError]);

  return {
    user,
    updateProfile: handleUpdateProfile,
    loading: loading || isUpdating,
    error,
    clearError,
  };
};

// Hook for auth status checking
export const useAuthStatus = () => {
  const { isAuthenticated, loading, user, session } = useAuth();

  return {
    isAuthenticated,
    isLoading: loading,
    isGuest: !isAuthenticated && !loading,
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email,
    userId: user?.id,
  };
};

// Hook for logout functionality
export const useSignOut = () => {
  const { signOut, loading, error, clearError } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    clearError();
    
    try {
      await signOut();
      return true;
    } finally {
      setIsSigningOut(false);
    }
  }, [signOut, clearError]);

  return {
    signOut: handleSignOut,
    loading: loading || isSigningOut,
    error,
    clearError,
  };
};

// Hook for resending verification emails/SMS
export const useResendVerification = () => {
  const { resend, loading, error, clearError } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [lastSent, setLastSent] = useState<Date | null>(null);

  const handleResend = useCallback(async (options: {
    type: 'signup' | 'email_change' | 'sms';
    email?: string;
    phone?: string;
  }) => {
    setIsResending(true);
    clearError();
    
    try {
      const success = await resend(options);
      if (success) {
        setLastSent(new Date());
      }
      return success;
    } finally {
      setIsResending(false);
    }
  }, [resend, clearError]);

  // Calculate cooldown time (60 seconds)
  const canResend = lastSent ? Date.now() - lastSent.getTime() > 60000 : true;
  const nextResendTime = lastSent ? new Date(lastSent.getTime() + 60000) : null;

  return {
    resend: handleResend,
    loading: loading || isResending,
    error,
    clearError,
    canResend,
    lastSent,
    nextResendTime,
  };
};

// Hook for auth error handling
export const useAuthError = () => {
  const { error, clearError } = useAuth();

  const getErrorMessage = useCallback((error: string | null): string => {
    if (!error) return '';

    // Map common Supabase errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password. Please try again.',
      'Email not confirmed': 'Please check your email and click the confirmation link.',
      'User already registered': 'An account with this email already exists.',
      'Signup requires email confirmation': 'Please check your email for a confirmation link.',
      'Token has expired or is invalid': 'The verification code has expired. Please request a new one.',
      'Phone number not confirmed': 'Please verify your phone number with the code sent via SMS.',
      'Invalid TOTP code': 'Invalid verification code. Please try again.',
      'TOTP factor not found': 'Two-factor authentication is not set up for this account.',
      'Challenge expired': 'The verification request has expired. Please try again.',
    };

    return errorMap[error] || error;
  }, []);

  return {
    error,
    clearError,
    getErrorMessage,
    hasError: !!error,
  };
};

// TOTP/MFA Hooks

/**
 * Hook for TOTP enrollment and setup
 */
export const useTOTPSetup = () => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [setupData, setSetupData] = useState<TOTPSetupData | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrollTOTP = useCallback(async (friendlyName?: string) => {
    setIsEnrolling(true);
    setError(null);
    
    try {
      const response = await authService.enrollTOTP({
        factorType: 'totp',
        friendlyName,
      });
      
      if (response.success && response.data) {
        const { id, totp } = response.data;
        setFactorId(id);
        setSetupData({
          qrCode: totp.qr_code,
          secret: totp.secret,
          uri: totp.uri,
          factorId: id,
          friendlyName,
        });
        return true;
      } else {
        setError(response.error?.message || 'Failed to enroll TOTP');
        return false;
      }
    } catch (err) {
      setError('Failed to enroll TOTP');
      return false;
    } finally {
      setIsEnrolling(false);
    }
  }, []);

  const verifyTOTP = useCallback(async (code: string) => {
    if (!factorId || !challengeId) {
      setError('Missing factor or challenge ID');
      return false;
    }

    setIsEnrolling(true);
    setError(null);
    
    try {
      const response = await authService.verifyTOTPEnrollment({
        factorId,
        challengeId,
        code,
      });
      
      if (response.success) {
        return true;
      } else {
        setError(response.error?.message || 'Invalid verification code');
        return false;
      }
    } catch (err) {
      setError('Failed to verify TOTP');
      return false;
    } finally {
      setIsEnrolling(false);
    }
  }, [factorId, challengeId]);

  const clearSetup = useCallback(() => {
    setSetupData(null);
    setFactorId(null);
    setChallengeId(null);
    setError(null);
  }, []);

  // Auto-generate challenge ID when factor ID is set
  useEffect(() => {
    if (factorId && !challengeId) {
      // The enrollment process automatically creates a challenge
      // In a real implementation, you might need to call challenge endpoint
      setChallengeId(`challenge_${factorId}`);
    }
  }, [factorId, challengeId]);

  return {
    enrollTOTP,
    verifyTOTP,
    clearSetup,
    setupData,
    loading: isEnrolling,
    error,
    isSetupComplete: !!setupData,
  };
};

/**
 * Hook for TOTP challenge during sign-in
 */
export const useTOTPChallenge = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [challenge, setChallenge] = useState<TOTPChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createChallenge = useCallback(async (factorId: string) => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await authService.challengeTOTP({ factorId });
      
      if (response.success && response.data) {
        setChallenge(response.data);
        return true;
      } else {
        setError(response.error?.message || 'Failed to create challenge');
        return false;
      }
    } catch (err) {
      setError('Failed to create challenge');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const verifyChallenge = useCallback(async (factorId: string, code: string) => {
    if (!challenge) {
      setError('No active challenge');
      return false;
    }

    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await authService.verifyTOTPChallenge({
        factorId,
        challengeId: challenge.id,
        code,
      });
      
      if (response.success) {
        setChallenge(null);
        return true;
      } else {
        setError(response.error?.message || 'Invalid verification code');
        return false;
      }
    } catch (err) {
      setError('Failed to verify code');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [challenge]);

  const clearChallenge = useCallback(() => {
    setChallenge(null);
    setError(null);
  }, []);

  return {
    createChallenge,
    verifyChallenge,
    clearChallenge,
    challenge,
    loading: isVerifying,
    error,
    hasActiveChallenge: !!challenge,
  };
};

/**
 * Hook for managing TOTP factors
 */
export const useTOTPFactors = () => {
  const [factors, setFactors] = useState<TOTPFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFactors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.listFactors();
      
      if (response.success && response.data) {
        setFactors(response.data.totp);
      } else {
        setError(response.error?.message || 'Failed to load factors');
      }
    } catch (err) {
      setError('Failed to load factors');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFactor = useCallback(async (factorId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.unenrollTOTP(factorId);
      
      if (response.success) {
        await loadFactors(); // Reload factors
        return true;
      } else {
        setError(response.error?.message || 'Failed to remove factor');
        return false;
      }
    } catch (err) {
      setError('Failed to remove factor');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadFactors]);

  // Load factors on mount
  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  return {
    factors,
    loading,
    error,
    loadFactors,
    removeFactor,
    hasTOTP: factors.length > 0,
    verifiedFactors: factors.filter(f => f.status === 'verified'),
  };
};

/**
 * Hook for checking MFA status and requirements
 */
export const useMFAStatus = () => {
  const { user } = useAuth();
  const [assuranceLevel, setAssuranceLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkAssuranceLevel = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const response = await authService.getAuthenticatorAssuranceLevel();
      
      if (response.success && response.data) {
        setAssuranceLevel(response.data);
      }
    } catch (err) {
      console.error('Failed to check assurance level:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAssuranceLevel();
  }, [checkAssuranceLevel]);

  return {
    assuranceLevel,
    loading,
    checkAssuranceLevel,
    needsMFA: assuranceLevel === 'aal1', // Needs step up to aal2
    hasMFA: assuranceLevel === 'aal2',
  };
};
