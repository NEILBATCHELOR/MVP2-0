/**
 * Password Reset Form Component
 * 
 * Handles password reset request and password update functionality
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { usePasswordManagement, useAuthError } from '../hooks/useAuth';
import { 
  resetPasswordSchema, 
  updatePasswordSchema,
  type ResetPasswordFormData,
  type UpdatePasswordFormData
} from '../validation/authValidation';

interface PasswordResetFormProps {
  mode?: 'request' | 'update';
  onSuccess?: () => void;
  showHeader?: boolean;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  mode: propMode,
  onSuccess,
  showHeader = true,
}) => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Determine mode based on URL parameters or prop
  const hasTokenInUrl = searchParams.get('token') || searchParams.get('access_token');
  const mode = propMode || (hasTokenInUrl ? 'update' : 'request');
  
  const { resetPassword, updatePassword, loading, resetSent } = usePasswordManagement();
  const { error, clearError, getErrorMessage } = useAuthError();
  const navigate = useNavigate();

  // Request reset form
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Update password form
  const updateForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const password = updateForm.watch('password');

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 20;
    if (/[a-z]/.test(pwd)) strength += 20;
    if (/[A-Z]/.test(pwd)) strength += 20;
    if (/\d/.test(pwd)) strength += 20;
    if (/[@$!%*?&]/.test(pwd)) strength += 20;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(password || '');

  const handleRequestReset = async (data: ResetPasswordFormData) => {
    clearError();

    const success = await resetPassword({
      email: data.email,
      options: {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      },
    });

    if (success) {
      onSuccess?.();
    }
  };

  const handleUpdatePassword = async (data: UpdatePasswordFormData) => {
    clearError();

    const success = await updatePassword({
      password: data.password,
    });

    if (success) {
      onSuccess?.();
      navigate('/auth/login', {
        state: { message: 'Your password has been updated successfully. Please sign in with your new password.' }
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Reset request mode
  if (mode === 'request') {
    if (resetSent) {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Check your email
            </CardTitle>
            <CardDescription>
              We've sent password reset instructions to your email address
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Click the link in your email to reset your password. The link will expire in 60 minutes.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?
              </p>
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try again
              </Button>
            </div>

            <div className="text-center pt-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth/login')}
                className="text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Not seeing the email?</p>
              <ul className="space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Add us to your contacts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-md mx-auto">
        {showHeader && (
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Reset your password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
        )}

        <CardContent>
          <form onSubmit={resetForm.handleSubmit(handleRequestReset)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-10"
                  {...resetForm.register('email')}
                  disabled={loading || resetForm.formState.isSubmitting}
                  autoFocus
                />
              </div>
              {resetForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {resetForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{getErrorMessage(error)}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || resetForm.formState.isSubmitting}
            >
              {loading || resetForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send reset link
                </>
              )}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/auth/login')}
                disabled={loading || resetForm.formState.isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Password update mode
  return (
    <Card className="w-full max-w-md mx-auto">
      {showHeader && (
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Set new password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
      )}

      <CardContent>
        <form onSubmit={updateForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                className="pl-10 pr-10"
                {...updateForm.register('password')}
                disabled={loading || updateForm.formState.isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
                disabled={loading || updateForm.formState.isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password strength:</span>
                  <span className={`font-medium ${
                    passwordStrength < 40 ? 'text-destructive' :
                    passwordStrength < 80 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {passwordStrength < 40 ? 'Weak' : passwordStrength < 80 ? 'Medium' : 'Strong'}
                  </span>
                </div>
                <Progress value={passwordStrength} className="h-2" />
              </div>
            )}
            
            {updateForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {updateForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                className="pl-10 pr-10"
                {...updateForm.register('confirmPassword')}
                disabled={loading || updateForm.formState.isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={toggleConfirmPasswordVisibility}
                disabled={loading || updateForm.formState.isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {updateForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {updateForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || updateForm.formState.isSubmitting}
          >
            {loading || updateForm.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Update password
              </>
            )}
          </Button>

          {/* Cancel Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/auth/login')}
            disabled={loading || updateForm.formState.isSubmitting}
            className="w-full"
          >
            Cancel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PasswordResetForm;
