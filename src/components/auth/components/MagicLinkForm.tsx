/**
 * Magic Link Form Component
 * 
 * Handles passwordless authentication via email magic links
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useOtpAuth, useAuthError, useResendVerification } from '../hooks/useAuth';
import { magicLinkSchema, type MagicLinkFormData } from '../validation/authValidation';

interface MagicLinkFormProps {
  onSuccess?: () => void;
  showHeader?: boolean;
  allowResend?: boolean;
}

export const MagicLinkForm: React.FC<MagicLinkFormProps> = ({
  onSuccess,
  showHeader = true,
  allowResend = true,
}) => {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  
  const { sendOtp, loading } = useOtpAuth();
  const { error, clearError, getErrorMessage } = useAuthError();
  const { resend, loading: resendLoading, canResend, lastSent } = useResendVerification();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSendMagicLink = async (data: MagicLinkFormData) => {
    clearError();

    const success = await sendOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (success) {
      setEmailSent(true);
      setSentEmail(data.email);
      onSuccess?.();
    }
  };

  const handleResendMagicLink = async () => {
    if (!canResend || !sentEmail) return;

    clearError();

    const success = await resend({
      type: 'signup',
      email: sentEmail,
    });

    if (success) {
      // Show success feedback
    }
  };

  const handleTryDifferentEmail = () => {
    setEmailSent(false);
    setSentEmail('');
    clearError();
  };

  if (emailSent) {
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
            We've sent a magic link to{' '}
            <span className="font-medium text-foreground">{sentEmail}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Click the link in your email to sign in. The link will expire in 60 minutes.
            </AlertDescription>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          )}

          {/* Resend Section */}
          {allowResend && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?
              </p>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleResendMagicLink}
                  disabled={!canResend || resendLoading}
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      {canResend ? 'Resend magic link' : `Resend in ${Math.ceil((60000 - (Date.now() - (lastSent?.getTime() || 0))) / 1000)}s`}
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleTryDifferentEmail}
                  className="w-full"
                >
                  Try a different email
                </Button>
              </div>
            </div>
          )}

          {/* Back to Login */}
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

          {/* Email Tips */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Not seeing the email?</p>
            <ul className="space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure {sentEmail} is correct</li>
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
            Sign in with Magic Link
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and we'll send you a secure link to sign in
          </CardDescription>
        </CardHeader>
      )}

      <CardContent>
        <form onSubmit={handleSubmit(handleSendMagicLink)} className="space-y-4">
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
                {...register('email')}
                disabled={loading || isSubmitting}
                autoFocus
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Info Alert */}
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              We'll send you a secure, one-time link that signs you in instantly. No password required!
            </AlertDescription>
          </Alert>

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
                Sending magic link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send magic link
              </>
            )}
          </Button>

          {/* Alternative Options */}
          <div className="space-y-3 pt-4">
            <p className="text-center text-sm text-muted-foreground">
              Or choose a different method
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/auth/login')}
                disabled={loading || isSubmitting}
              >
                Password
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/auth/phone')}
                disabled={loading || isSubmitting}
              >
                Phone OTP
              </Button>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground pt-4">
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
    </Card>
  );
};

export default MagicLinkForm;
