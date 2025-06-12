/**
 * Auth Components Index
 * 
 * Centralized exports for all authentication components
 */

export { default as LoginForm } from './LoginForm';
export { default as SignupForm } from './SignupForm';
export { default as MagicLinkForm } from './MagicLinkForm';
export { default as OtpForm } from './OtpForm';
export { default as PasswordResetForm } from './PasswordResetForm';
export { default as TOTPSetupForm } from './TOTPSetupForm';
export { default as TOTPVerificationForm } from './TOTPVerificationForm';
export { default as TOTPManagement } from './TOTPManagement';

// Re-export types for convenience
export type { SignInFormData, SignUpFormData, MagicLinkFormData, VerifyOtpFormData, ResetPasswordFormData, UpdatePasswordFormData } from '../validation/authValidation';
