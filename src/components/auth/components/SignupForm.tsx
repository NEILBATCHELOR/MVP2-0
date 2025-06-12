/**
 * Signup Form Component
 * 
 * Handles user registration with email/password and profile information
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

import { useSignUp, useAuthError } from '../hooks/useAuth';
import { signUpSchema, type SignUpFormData } from '../validation/authValidation';

interface SignupFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showHeader?: boolean;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  redirectTo = '/auth/verify-email',
  showHeader = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, loading } = useSignUp();
  const { error, clearError, getErrorMessage } = useAuthError();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      acceptTerms: false,
    },
    mode: 'onChange',
  });

  const password = watch('password');
  const email = watch('email');

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

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength < 40) return 'Weak';
    if (strength < 80) return 'Medium';
    return 'Strong';
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 40) return 'bg-destructive';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSignUp = async (data: SignUpFormData) => {
    clearError();

    const success = await signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: `${data.firstName} ${data.lastName}`,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (success) {
      onSuccess?.();
      // Navigate to verification page with email for context
      navigate(redirectTo, { 
        state: { 
          email: data.email,
          message: 'Please check your email for a verification link.'
        }
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      {showHeader && (
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create your account
          </CardTitle>
          <CardDescription className="text-center">
            Join us today and get started
          </CardDescription>
        </CardHeader>
      )}

      <CardContent>
        <form onSubmit={handleSubmit(handleSignUp)} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  className="pl-10"
                  {...register('firstName')}
                  disabled={loading || isSubmitting}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                {...register('lastName')}
                disabled={loading || isSubmitting}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                className="pl-10"
                {...register('email')}
                disabled={loading || isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                className="pl-10 pr-10"
                {...register('password')}
                disabled={loading || isSubmitting}
                onChange={() => trigger('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
                disabled={loading || isSubmitting}
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
                    {getPasswordStrengthLabel(passwordStrength)}
                  </span>
                </div>
                <Progress 
                  value={passwordStrength} 
                  className="h-2"
                />
              </div>
            )}
            
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="pl-10 pr-10"
                {...register('confirmPassword')}
                disabled={loading || isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={toggleConfirmPasswordVisibility}
                disabled={loading || isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                {...register('acceptTerms')}
                disabled={loading || isSubmitting}
                className="mt-1"
              />
              <Label
                htmlFor="acceptTerms"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I agree to the{' '}
                <Link
                  to="/terms"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
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
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-primary hover:underline font-medium"
              tabIndex={loading || isSubmitting ? -1 : 0}
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
