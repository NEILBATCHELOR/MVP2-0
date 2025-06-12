/**
 * Auth Hooks Export Index
 * 
 * Central export point for all authentication hooks
 */

// Re-export main useAuth hook
export { useAuth } from '@/infrastructure/auth/AuthProvider';

// Re-export specialized auth hooks from components
export {
  useSignUp,
  useSignIn,
  useOtpAuth,
  usePasswordManagement,
  useSession,
  useUserProfile,
  useAuthStatus,
  useSignOut,
  useResendVerification,
  useAuthError,
  useTOTPSetup,
  useTOTPChallenge,
  useTOTPFactors,
  useMFAStatus
} from '@/components/auth/hooks/useAuth';

// Type exports
export type {
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
  TOTPFactor
} from '@/components/auth/types/authTypes';
