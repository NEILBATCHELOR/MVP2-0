/**
 * MFA-Enabled Login Page
 * 
 * Enhanced login page that handles MFA challenges including TOTP verification
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { LoginForm, TOTPVerificationForm } from '@/components/auth/components';
import { useTOTPFactors, useMFAStatus } from '@/hooks/auth';

type LoginStep = 'credentials' | 'mfa' | 'success';

interface MFARequiredState {
  factorId: string;
  challengeId: string;
}

export const MFALoginPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<LoginStep>('credentials');
  const [mfaState, setMfaState] = useState<MFARequiredState | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const { factors } = useTOTPFactors();
  const { needsMFA } = useMFAStatus();

  // Get redirect path from location state
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleCredentialsSuccess = async () => {
    // Check if user has MFA enabled and needs to complete MFA challenge
    if (factors.length > 0 && needsMFA) {
      // Get the first verified factor for the challenge
      const verifiedFactor = factors.find(f => f.status === 'verified');
      
      if (verifiedFactor) {
        setMfaState({
          factorId: verifiedFactor.id,
          challengeId: '', // Will be created by the TOTP component
        });
        setCurrentStep('mfa');
        return;
      }
    }
    
    // No MFA required, proceed to dashboard
    setCurrentStep('success');
    navigate(from, { replace: true });
  };

  const handleMFASuccess = () => {
    setCurrentStep('success');
    navigate(from, { replace: true });
  };

  const handleMFABack = () => {
    setCurrentStep('credentials');
    setMfaState(null);
  };

  const handleBack = () => {
    if (currentStep === 'mfa') {
      handleMFABack();
    } else {
      navigate('/');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${
          currentStep === 'credentials' ? 'text-primary' : 
          currentStep === 'mfa' || currentStep === 'success' ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'credentials' ? 'bg-primary text-primary-foreground' :
            currentStep === 'mfa' || currentStep === 'success' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <span className="text-sm font-medium">Sign In</span>
        </div>
        
        <div className={`w-8 h-0.5 ${
          currentStep === 'mfa' || currentStep === 'success' ? 'bg-green-600' : 'bg-muted'
        }`} />
        
        <div className={`flex items-center space-x-2 ${
          currentStep === 'mfa' ? 'text-primary' : 
          currentStep === 'success' ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'mfa' ? 'bg-primary text-primary-foreground' :
            currentStep === 'success' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Verify</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Chain Capital</h1>
          </div>
          
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Step Indicator */}
        {currentStep === 'mfa' && renderStepIndicator()}

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          {currentStep === 'credentials' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your Chain Capital account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm
                  onSuccess={handleCredentialsSuccess}
                  showHeader={false}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'mfa' && mfaState && (
            <TOTPVerificationForm
              factorId={mfaState.factorId}
              onSuccess={handleMFASuccess}
              onBack={handleMFABack}
              showHeader={true}
              autoFocus={true}
            />
          )}

          {currentStep === 'success' && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Sign in successful</h3>
                    <p className="text-muted-foreground">
                      Redirecting to your dashboard...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Information */}
        {currentStep === 'credentials' && (
          <div className="max-w-md mx-auto mt-8">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Shield className="w-8 h-8 text-primary mx-auto" />
                  <div className="space-y-2">
                    <h4 className="font-medium">Secure Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with industry-standard security measures 
                      including two-factor authentication.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Text for MFA */}
        {currentStep === 'mfa' && (
          <div className="max-w-md mx-auto mt-8">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-sm space-y-3">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-muted-foreground">
                    Enter the 6-digit code from your authenticator app to complete sign in.
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>• Codes refresh every 30 seconds</p>
                    <p>• Make sure your device time is correct</p>
                    <p>• Contact support if you're having trouble</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFALoginPage;
