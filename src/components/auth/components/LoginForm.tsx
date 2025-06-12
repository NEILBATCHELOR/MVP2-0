/**
 * Login Form Component
 * 
 * Handles user login with email/password and provides options for other auth methods
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, Settings } from 'lucide-react';

import AdminUtilityModal from '@/components/admin/AdminUtilityModal';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

import { useSignIn, useAuthError } from '../hooks/useAuth';
import { signInSchema, type SignInFormData } from '../validation/authValidation';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showHeader?: boolean;
  showAlternativeAuth?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo,
  showHeader = true,
  showAlternativeAuth = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const { signIn, loading } = useSignIn();
  const { error, clearError, getErrorMessage } = useAuthError();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect URL from router state or prop
  const from = (location.state as any)?.from || redirectTo || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleSignIn = async (data: SignInFormData) => {
    clearError();

    const success = await signIn({
      email: data.email,
      password: data.password,
    });

    if (success) {
      onSuccess?.();
      navigate(from, { replace: true });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      {showHeader && (
        <CardHeader className="space-y-1 relative">
          {/* Admin Settings Icon */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-50 hover:opacity-100 transition-opacity"
            onClick={() => setShowAdminModal(true)}
            disabled={loading || isSubmitting}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Admin settings</span>
          </Button>
          
          <CardTitle className="text-2xl font-bold text-center">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
      )}

      <CardContent>
        <form onSubmit={handleSubmit(handleSignIn)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                autoComplete="email"
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
                placeholder="Enter your password"
                className="pl-10 pr-10"
                autoComplete="current-password"
                {...register('password')}
                disabled={loading || isSubmitting}
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
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                {...register('rememberMe')}
                disabled={loading || isSubmitting}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer"
              >
                Remember me
              </Label>
            </div>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
              tabIndex={loading || isSubmitting ? -1 : 0}
            >
              Forgot password?
            </Link>
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {showAlternativeAuth && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Alternative Auth Methods */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || isSubmitting}
                  onClick={() => navigate('/auth/magic-link')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Magic Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || isSubmitting}
                  onClick={() => navigate('/auth/phone')}
                >
                  <span className="mr-2">📱</span>
                  Phone OTP
                </Button>
              </div>
            </>
          )}

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/auth/signup"
              className="text-primary hover:underline font-medium"
              tabIndex={loading || isSubmitting ? -1 : 0}
            >
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
      
      {/* Admin Utility Modal */}
      <AdminUtilityModal 
        open={showAdminModal} 
        onOpenChange={setShowAdminModal} 
      />
    </Card>
  );
};

export default LoginForm;
