/**
 * Authentication Validation Schemas
 * 
 * Zod schemas for validating authentication forms
 */

import { z } from 'zod';

// Common validation patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code');

const otpSchema = z
  .string()
  .min(6, 'OTP must be 6 digits')
  .max(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers');

// Sign Up Schema
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Sign In Schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Magic Link Schema
export const magicLinkSchema = z.object({
  email: emailSchema,
});

// Phone OTP Schema
export const phoneOtpSchema = z.object({
  phone: phoneSchema,
});

// Verify OTP Schema
export const verifyOtpSchema = z.object({
  otp: otpSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Update Password Schema
export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Change Password Schema (with current password)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// Update Profile Schema
export const updateProfileSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  displayName: z.string().optional(),
  avatar: z.string().url('Please enter a valid URL').optional(),
});

// TOTP/MFA Schemas
export const totpCodeSchema = z
  .string()
  .min(6, 'TOTP code must be 6 digits')
  .max(6, 'TOTP code must be 6 digits')
  .regex(/^\d{6}$/, 'TOTP code must contain only numbers');

export const setupTOTPSchema = z.object({
  friendlyName: z.string().min(1, 'Device name is required').max(50, 'Device name must be less than 50 characters'),
});

export const verifyTOTPSchema = z.object({
  code: totpCodeSchema,
});

export const totpChallengeSchema = z.object({
  code: totpCodeSchema,
});

// Type exports for form data
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;
export type PhoneOtpFormData = z.infer<typeof phoneOtpSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type SetupTOTPFormData = z.infer<typeof setupTOTPSchema>;
export type VerifyTOTPFormData = z.infer<typeof verifyTOTPSchema>;
export type TOTPChallengeFormData = z.infer<typeof totpChallengeSchema>;

// Helper functions for validation
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const validateOtp = (otp: string): boolean => {
  return otpSchema.safeParse(otp).success;
};

// Error message helpers
export const getFieldError = (
  errors: Record<string, any>,
  fieldName: string
): string | undefined => {
  return errors[fieldName]?.message;
};

export const hasFieldError = (
  errors: Record<string, any>,
  fieldName: string
): boolean => {
  return !!errors[fieldName];
};
