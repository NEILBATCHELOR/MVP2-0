/**
 * Email Verification Page
 * 
 * Shows verification status and provides resend functionality
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import GuestGuard from '@/components/auth/ProtectedRoute';
import { useResendVerification, useAuthError } from '@/components/auth/hooks/useAuth';

const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email and message from navigation state
  const email = (location.state as any)?.email || '';
  const message = (location.state as any)?.message || 'Please check your email for a verification link.';
  
  const { resend, loading: resendLoading, canResend, lastSent } = useResendVerification();
  const { error, clearError, getErrorMessage } = useAuthError();

  const handleResendEmail = async () => {
    if (!canResend || !email) return;

    clearError();

    const success = await resend({
      type: 'signup',
      email: email,
    });

    if (success) {
      // Show success feedback
    }
  };

  const handleBackToLogin = () => {
    navigate('/auth/login');
  };

  const handleTryDifferentEmail = () => {
    navigate('/auth/signup');
  };

  return (
    <GuestGuard>
      <Helmet>
        <title>Verify Email - Chain Capital</title>
        <meta name="description" content="Verify your email address to complete registration" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Check your email
              </CardTitle>
              <CardDescription>
                {email ? (
                  <>
                    We've sent a verification link to{' '}
                    <span className="font-medium text-foreground">{email}</span>
                  </>
                ) : (
                  "We've sent you a verification link"
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status Message */}
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>

              {/* Instructions */}
              <div className="text-center space-y-3">
                <h3 className="font-medium">What's next?</h3>
                <ol className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-primary/10 text-primary text-xs rounded-full mr-2 mt-0.5">
                      1
                    </span>
                    Check your email inbox
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-primary/10 text-primary text-xs rounded-full mr-2 mt-0.5">
                      2
                    </span>
                    Click the verification link
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-primary/10 text-primary text-xs rounded-full mr-2 mt-0.5">
                      3
                    </span>
                    You'll be automatically signed in
                  </li>
                </ol>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{getErrorMessage(error)}</AlertDescription>
                </Alert>
              )}

              {/* Resend Section */}
              {email && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email?
                  </p>
                  
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={handleResendEmail}
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
                          {canResend ? 'Resend verification email' : `Resend in ${Math.ceil((60000 - (Date.now() - (lastSent?.getTime() || 0))) / 1000)}s`}
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={handleTryDifferentEmail}
                      className="w-full"
                    >
                      Use a different email
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  onClick={handleBackToLogin}
                  className="w-full"
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
                  <li>• Make sure the email address is correct</li>
                  <li>• Add our email to your contacts</li>
                  <li>• The verification link expires in 24 hours</li>
                </ul>
              </div>

              {/* Support */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Still having trouble?{' '}
                  <button 
                    onClick={() => navigate('/contact')}
                    className="text-primary hover:underline"
                  >
                    Contact support
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </GuestGuard>
  );
};

export default EmailVerificationPage;
