/**
 * Authentication Types
 * 
 * Comprehensive type definitions for Supabase authentication including TOTP/MFA
 */

import type { User, Session, AuthError } from '@supabase/supabase-js';

// Core Auth Types
export interface AuthUser extends User {
  id: string;
  email?: string;
  phone?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

export interface AuthSession extends Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

// Authentication Context State
export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Authentication Methods
export interface SignUpCredentials {
  email: string;
  password: string;
  options?: {
    data?: Record<string, any>;
    emailRedirectTo?: string;
  };
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignInWithOtpCredentials {
  email?: string;
  phone?: string;
  options?: {
    shouldCreateUser?: boolean;
    emailRedirectTo?: string;
  };
}

export interface VerifyOtpCredentials {
  email?: string;
  phone?: string;
  token: string;
  type: 'signup' | 'sms' | 'email' | 'recovery' | 'invite' | 'magiclink';
}

export interface ResetPasswordCredentials {
  email: string;
  options?: {
    redirectTo?: string;
  };
}

export interface UpdatePasswordCredentials {
  password: string;
}

export interface SignOutOptions {
  scope?: 'global' | 'local' | 'others';
}

// TOTP/MFA Types
export interface TOTPEnrollResponse {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export interface TOTPChallenge {
  id: string;
  type: 'totp';
  expires_at: number;
}

export interface TOTPFactor {
  id: string;
  type: 'totp';
  friendly_name?: string;
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
}

export interface EnrollTOTPCredentials {
  factorType: 'totp';
  friendlyName?: string;
}

export interface VerifyTOTPCredentials {
  factorId: string;
  challengeId: string;
  code: string;
}

export interface ChallengeTOTPCredentials {
  factorId: string;
}

export interface TOTPSetupData {
  qrCode: string;
  secret: string;
  uri: string;
  factorId: string;
  friendlyName?: string;
}

// Auth Action Types
export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_SESSION'; payload: AuthSession | null }
  | { type: 'SIGN_OUT' }
  | { type: 'RESET_STATE' }
  | { type: 'SET_MFA_FACTORS'; payload: TOTPFactor[] }
  | { type: 'SET_MFA_CHALLENGE'; payload: TOTPChallenge | null }
  | { type: 'SET_MFA_LOADING'; payload: boolean }
  | { type: 'SET_MFA_ERROR'; payload: string | null }
  | { type: 'CLEAR_MFA_STATE' };

// Auth Service Response Types
export interface AuthResponse<T = any> {
  data: T | null;
  error: AuthError | Error | null;
  success: boolean;
}

export interface SignUpResponse extends AuthResponse {
  data: {
    user: AuthUser | null;
    session: AuthSession | null;
  } | null;
}

export interface SignInResponse extends AuthResponse {
  data: {
    user: AuthUser;
    session: AuthSession;
  } | null;
}

export interface VerifyOtpResponse extends AuthResponse {
  data: {
    user: AuthUser;
    session: AuthSession;
  } | null;
}

// MFA Service Response Types
export interface EnrollTOTPResponse extends AuthResponse {
  data: TOTPEnrollResponse | null;
}

export interface ChallengeTOTPResponse extends AuthResponse {
  data: TOTPChallenge | null;
}

export interface VerifyTOTPResponse extends AuthResponse {
  data: {
    user: AuthUser;
    session: AuthSession;
  } | null;
}

export interface ListFactorsResponse extends AuthResponse {
  data: {
    all: TOTPFactor[];
    totp: TOTPFactor[];
  } | null;
}

// MFA State
export interface MFAState {
  factors: TOTPFactor[];
  hasTOTP: boolean;
  pendingChallenge: TOTPChallenge | null;
  loading: boolean;
  error: string | null;
}

// Extended Auth State with MFA
export interface AuthStateWithMFA extends AuthState {
  mfa: MFAState;
}

// Auth Status Enums
export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error',
  MFA_REQUIRED = 'mfa_required'
}

// Auth Event Types
export enum AuthEventType {
  SIGNED_IN = 'SIGNED_IN',
  SIGNED_OUT = 'SIGNED_OUT',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  USER_UPDATED = 'USER_UPDATED',
  PASSWORD_RECOVERY = 'PASSWORD_RECOVERY',
  MFA_CHALLENGE_VERIFIED = 'MFA_CHALLENGE_VERIFIED'
}

// User Metadata Types
export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role?: string;
  organization?: string;
}

// Auth Configuration
export interface AuthConfig {
  autoRefreshToken: boolean;
  persistSession: boolean;
  detectSessionInUrl: boolean;
  redirectTo?: string;
  storageKey?: string;
}

// Session Storage Types
export interface SessionStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Type Guards
export const isAuthUser = (user: any): user is AuthUser => {
  return user && typeof user === 'object' && 'id' in user && 'email' in user;
};

export const isAuthSession = (session: any): session is AuthSession => {
  return session && typeof session === 'object' && 'access_token' in session && 'user' in session;
};

export const isAuthError = (error: any): error is AuthError => {
  return error && typeof error === 'object' && 'message' in error;
};

export const isTOTPFactor = (factor: any): factor is TOTPFactor => {
  return factor && typeof factor === 'object' && factor.type === 'totp';
};

export const isTOTPChallenge = (challenge: any): challenge is TOTPChallenge => {
  return challenge && typeof challenge === 'object' && challenge.type === 'totp' && 'expires_at' in challenge;
};
