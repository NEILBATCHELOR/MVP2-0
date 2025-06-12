/**
 * Authentication Utilities
 * 
 * Helper functions for authentication operations and user management
 */

import type { AuthUser, AuthSession } from '../types/authTypes';

/**
 * Format user display name from user metadata
 */
export const formatUserDisplayName = (user: AuthUser | null): string => {
  if (!user) return 'Guest';
  
  const { user_metadata, app_metadata } = user;
  
  // Try to get display name from metadata
  if (user_metadata?.displayName) return user_metadata.displayName;
  if (user_metadata?.firstName && user_metadata?.lastName) {
    return `${user_metadata.firstName} ${user_metadata.lastName}`;
  }
  if (user_metadata?.firstName) return user_metadata.firstName;
  if (app_metadata?.displayName) return app_metadata.displayName;
  
  // Fallback to email username
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'User';
};

/**
 * Get user initials for avatar display
 */
export const getUserInitials = (user: AuthUser | null): string => {
  if (!user) return '?';
  
  const { user_metadata } = user;
  
  if (user_metadata?.firstName && user_metadata?.lastName) {
    return `${user_metadata.firstName[0]}${user_metadata.lastName[0]}`.toUpperCase();
  }
  
  if (user_metadata?.firstName) {
    return user_metadata.firstName[0].toUpperCase();
  }
  
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return 'U';
};

/**
 * Check if user has completed email verification
 */
export const isEmailVerified = (user: AuthUser | null): boolean => {
  return !!user?.email_confirmed_at;
};

/**
 * Check if user has completed phone verification
 */
export const isPhoneVerified = (user: AuthUser | null): boolean => {
  return !!user?.phone_confirmed_at;
};

/**
 * Check if session is valid and not expired
 */
export const isSessionValid = (session: AuthSession | null): boolean => {
  if (!session) return false;
  
  const { expires_at } = session;
  if (!expires_at) return true; // No expiry means valid
  
  return expires_at * 1000 > Date.now();
};

/**
 * Get time until session expires (in minutes)
 */
export const getSessionTimeRemaining = (session: AuthSession | null): number => {
  if (!session?.expires_at) return Infinity;
  
  const remainingMs = (session.expires_at * 1000) - Date.now();
  return Math.max(0, Math.floor(remainingMs / (1000 * 60)));
};

/**
 * Check if user has specific role
 */
export const hasRole = (user: AuthUser | null, role: string): boolean => {
  if (!user) return false;
  
  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  return userRole === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: AuthUser | null, roles: string[]): boolean => {
  if (!user || roles.length === 0) return false;
  
  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  return roles.includes(userRole);
};

/**
 * Get user role with fallback
 */
export const getUserRole = (user: AuthUser | null, fallback = 'user'): string => {
  if (!user) return fallback;
  
  return user.user_metadata?.role || user.app_metadata?.role || fallback;
};

/**
 * Format last sign in time
 */
export const formatLastSignIn = (user: AuthUser | null): string => {
  if (!user?.last_sign_in_at) return 'Never';
  
  const lastSignIn = new Date(user.last_sign_in_at);
  const now = new Date();
  const diffMs = now.getTime() - lastSignIn.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return lastSignIn.toLocaleDateString();
};

/**
 * Create secure redirect URL for auth callbacks
 */
export const createSecureRedirectUrl = (path = '/dashboard'): string => {
  const baseUrl = window.location.origin;
  const redirectPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
};

/**
 * Store redirect URL for post-auth navigation
 */
export const storeRedirectUrl = (url: string): void => {
  try {
    sessionStorage.setItem('auth_redirect', url);
  } catch (error) {
    console.warn('Failed to store redirect URL:', error);
  }
};

/**
 * Get and clear stored redirect URL
 */
export const getAndClearRedirectUrl = (fallback = '/dashboard'): string => {
  try {
    const stored = sessionStorage.getItem('auth_redirect');
    if (stored) {
      sessionStorage.removeItem('auth_redirect');
      return stored;
    }
  } catch (error) {
    console.warn('Failed to get redirect URL:', error);
  }
  return fallback;
};

/**
 * Generate avatar URL from user data
 */
export const getAvatarUrl = (user: AuthUser | null): string | null => {
  if (!user) return null;
  
  // Check if user has uploaded avatar
  if (user.user_metadata?.avatar) {
    return user.user_metadata.avatar;
  }
  
  // Generate Gravatar URL if available
  if (user.email) {
    const email = user.email.toLowerCase().trim();
    // This is a placeholder - you would implement actual Gravatar logic
    return `https://www.gravatar.com/avatar/${btoa(email)}?d=identicon&s=150`;
  }
  
  return null;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (international)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

/**
 * Mask email for display (e.g., j***@example.com)
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  
  const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask phone number for display (e.g., +1***567890)
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  
  const countryCode = phone.slice(0, 2);
  const lastFour = phone.slice(-4);
  const middle = '*'.repeat(Math.max(0, phone.length - 6));
  
  return `${countryCode}${middle}${lastFour}`;
};

/**
 * Calculate account age in days
 */
export const getAccountAge = (user: AuthUser | null): number => {
  if (!user?.created_at) return 0;
  
  const created = new Date(user.created_at);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Check if account is new (less than 7 days old)
 */
export const isNewAccount = (user: AuthUser | null): boolean => {
  return getAccountAge(user) < 7;
};

/**
 * Format error message for display
 */
export const formatAuthError = (error: string | null): string => {
  if (!error) return '';
  
  // Common Supabase error mappings
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'The email or password you entered is incorrect.',
    'Email not confirmed': 'Please verify your email address before signing in.',
    'User already registered': 'An account with this email already exists.',
    'Signup requires email confirmation': 'Please check your email for a verification link.',
    'Token has expired or is invalid': 'This link has expired. Please request a new one.',
    'Phone number not confirmed': 'Please verify your phone number.',
    'Too many requests': 'Too many attempts. Please wait before trying again.',
    'User not found': 'No account found with this email address.',
  };
  
  return errorMap[error] || error;
};

/**
 * Generate secure random string for nonces
 */
export const generateNonce = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Check if running in secure context (HTTPS)
 */
export const isSecureContext = (): boolean => {
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
};
