/**
 * Authentication Service
 * 
 * Centralized service for handling all Supabase authentication operations
 * Provides methods for signup, signin, logout, password management, and session handling
 */

import { supabase } from '@/infrastructure/database/client';
import type {
  SignUpCredentials,
  SignInCredentials,
  SignInWithOtpCredentials,
  VerifyOtpCredentials,
  ResetPasswordCredentials,
  UpdatePasswordCredentials,
  SignOutOptions,
  SignUpResponse,
  SignInResponse,
  VerifyOtpResponse,
  AuthResponse,
  AuthUser,
  AuthSession,
  // TOTP Types
  EnrollTOTPCredentials,
  VerifyTOTPCredentials,
  ChallengeTOTPCredentials,
  TOTPEnrollResponse,
  EnrollTOTPResponse,
  ChallengeTOTPResponse,
  VerifyTOTPResponse,
  ListFactorsResponse,
  TOTPFactor,
  TOTPChallenge,
} from '../types/authTypes';

/**
 * Authentication Service Class
 * Handles all authentication operations with Supabase
 */
export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign up a new user with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<SignUpResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: credentials.options,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: {
          user: data.user as AuthUser,
          session: data.session as AuthSession,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(email: string, password: string): Promise<SignInResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: {
          user: data.user as AuthUser,
          session: data.session as AuthSession,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Sign in with OTP (Magic Link or SMS)
   */
  async signInWithOtp(credentials: SignInWithOtpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: credentials.email,
        phone: credentials.phone,
        options: credentials.options,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(credentials: VerifyOtpCredentials): Promise<VerifyOtpResponse> {
    try {
      let verifyParams: any;
      
      // Handle different OTP types correctly based on Supabase API requirements
      if (credentials.type === 'sms' && credentials.phone) {
        verifyParams = {
          phone: credentials.phone,
          token: credentials.token,
          type: credentials.type,
        };
      } else if (credentials.email) {
        verifyParams = {
          email: credentials.email,
          token: credentials.token,
          type: credentials.type,
        };
      } else {
        throw new Error('Either email or phone must be provided for OTP verification');
      }

      const { data, error } = await supabase.auth.verifyOtp(verifyParams);

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: {
          user: data.user as AuthUser,
          session: data.session as AuthSession,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: null,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(credentials: ResetPasswordCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        credentials.email,
        credentials.options
      );

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(credentials: UpdatePasswordCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: credentials.password,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthResponse<AuthSession>> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: data.session as AuthSession,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<AuthResponse<AuthUser>> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: data.user as AuthUser,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<AuthResponse<AuthSession>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: data.session as AuthSession,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Update user metadata
   */
  async updateUser(userId: string, attributes: {
    email?: string;
    password?: string;
    data?: Record<string, any>;
    status?: string;
  }): Promise<AuthResponse<AuthUser>> {
    try {
      // For updating current user
      const { data, error } = await supabase.auth.updateUser(attributes);

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: data.user as AuthUser,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Resend verification email or SMS
   */
  async resend(options: {
    type: 'signup' | 'email_change' | 'sms';
    email?: string;
    phone?: string;
  }): Promise<AuthResponse> {
    try {
      let resendParams: any;
      
      // Handle different resend types correctly based on Supabase API requirements
      if (options.type === 'sms' && options.phone) {
        resendParams = {
          type: options.type,
          phone: options.phone,
        };
      } else if (options.email) {
        resendParams = {
          type: options.type,
          email: options.email,
        };
      } else {
        throw new Error('Either email or phone must be provided for resend');
      }

      const { data, error } = await supabase.auth.resend(resendParams);

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Set up auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session as AuthSession | null);
    });
  }

  // TOTP/MFA Methods

  /**
   * Enroll a new TOTP factor
   */
  async enrollTOTP(credentials: EnrollTOTPCredentials): Promise<EnrollTOTPResponse> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: credentials.factorType,
        friendlyName: credentials.friendlyName,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: data as TOTPEnrollResponse,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Verify TOTP enrollment
   */
  async verifyTOTPEnrollment(credentials: VerifyTOTPCredentials): Promise<VerifyTOTPResponse> {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: credentials.factorId,
        challengeId: credentials.challengeId,
        code: credentials.code,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      // After MFA verification, get the current session
      const sessionResponse = await this.getSession();
      
      return {
        data: {
          user: data.user as AuthUser,
          session: sessionResponse.data as AuthSession,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Challenge a TOTP factor (for sign-in)
   */
  async challengeTOTP(credentials: ChallengeTOTPCredentials): Promise<ChallengeTOTPResponse> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: credentials.factorId,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: data as TOTPChallenge,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Verify TOTP challenge (complete sign-in)
   */
  async verifyTOTPChallenge(credentials: VerifyTOTPCredentials): Promise<VerifyTOTPResponse> {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: credentials.factorId,
        challengeId: credentials.challengeId,
        code: credentials.code,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      // After MFA verification, get the current session
      const sessionResponse = await this.getSession();

      return {
        data: {
          user: data.user as AuthUser,
          session: sessionResponse.data as AuthSession,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * List all MFA factors for the current user
   */
  async listFactors(): Promise<ListFactorsResponse> {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      // Properly filter and type the factors
      const totpFactors = (data.all || [])
        .filter((factor: any) => factor.type === 'totp')
        .map((factor: any) => ({
          id: factor.id,
          type: 'totp' as const,
          friendly_name: factor.friendly_name,
          status: factor.status,
          created_at: factor.created_at,
          updated_at: factor.updated_at,
        } as TOTPFactor));

      return {
        data: {
          all: totpFactors,
          totp: totpFactors,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Unenroll (remove) a TOTP factor
   */
  async unenrollTOTP(factorId: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Get the authenticator assurance level
   */
  async getAuthenticatorAssuranceLevel(): Promise<AuthResponse<string>> {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) {
        return {
          data: null,
          error,
          success: false,
        };
      }

      return {
        data: data.currentLevel,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false,
      };
    }
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // Query user permissions from database view
      const { data, error } = await supabase
        .from('user_permissions_view')
        .select('permission_name')
        .eq('user_id', userId)
        .eq('permission_name', permissionName)
        .single();

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}

// User Status enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

// Export singleton instance
export const authService = AuthService.getInstance();
