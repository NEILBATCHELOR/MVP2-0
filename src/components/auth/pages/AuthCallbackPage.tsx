/**
 * Auth Callback Page
 * 
 * Handles authentication callbacks and redirects
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { authService } from '@/components/auth/services/authService';

type CallbackStatus = 'loading' | 'success' | 'error';

const AuthCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('loading');
        
        // Get URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const tokenType = searchParams.get('token_type');
        const expiresIn = searchParams.get('expires_in');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle errors from auth provider
        if (error) {
          throw new Error(errorDescription || error);
        }

        // If we have tokens, the user is authenticated
        if (accessToken) {
          setStatus('success');
          
          // Redirect after a short delay to show success message
          setTimeout(() => {
            const from = sessionStorage.getItem('auth_redirect') || '/dashboard';
            sessionStorage.removeItem('auth_redirect');
            navigate(from, { replace: true });
          }, 2000);
          
          return;
        }

        // Check for magic link verification
        const type = searchParams.get('type');
        if (type === 'signup' || type === 'email_change' || type === 'recovery') {
          // Get current session after email verification
          const sessionResponse = await authService.getSession();
          
          if (sessionResponse.success && sessionResponse.data) {
            setStatus('success');
            
            setTimeout(() => {
              const from = sessionStorage.getItem('auth_redirect') || '/dashboard';
              sessionStorage.removeItem('auth_redirect');
              navigate(from, { replace: true });
            }, 2000);
            
            return;
          }
        }

        // If we reach here, something went wrong
        throw new Error('Authentication failed. Please try again.');
        
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/auth/login', { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Authenticating... - Chain Capital</title>
        <meta name="description" content="Completing your authentication" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
                {status === 'loading' && (
                  <div className="bg-primary/10">
                    <Spinner className="w-8 h-8 text-primary" />
                  </div>
                )}
                {status === 'success' && (
                  <div className="bg-green-100">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                )}
                {status === 'error' && (
                  <div className="bg-destructive/10">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                )}
              </div>
              
              <CardTitle className="text-2xl font-bold">
                {status === 'loading' && 'Signing you in...'}
                {status === 'success' && 'Welcome back!'}
                {status === 'error' && 'Authentication failed'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {status === 'loading' && (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Please wait while we complete your authentication.
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Verifying credentials...</span>
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="text-center space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have been successfully signed in. Redirecting to your dashboard...
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={handleGoToDashboard} className="w-full">
                    Continue to Dashboard
                  </Button>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error || 'An unexpected error occurred during authentication.'}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Button onClick={handleRetry} className="w-full">
                      Try Again
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/auth/signup')}
                      className="w-full"
                    >
                      Create New Account
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Need help?{' '}
                    <button 
                      onClick={() => navigate('/contact')}
                      className="text-primary hover:underline"
                    >
                      Contact support
                    </button>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AuthCallbackPage;
