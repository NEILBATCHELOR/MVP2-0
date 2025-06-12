/**
 * TOTP Verification Form Component
 * 
 * Handles TOTP code verification during sign-in (MFA challenge)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useTOTPChallenge, useAuthError } from '../hooks/useAuth';
import { verifyTOTPSchema, type VerifyTOTPFormData } from '../validation/authValidation';

interface TOTPVerificationFormProps {
  factorId: string;
  onSuccess?: () => void;
  onBack?: () => void;
  showHeader?: boolean;
  autoFocus?: boolean;
}

export const TOTPVerificationForm: React.FC<TOTPVerificationFormProps> = ({
  factorId,
  onSuccess,
  onBack,
  showHeader = true,
  autoFocus = true,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { createChallenge, verifyChallenge, clearChallenge, challenge, loading, error, hasActiveChallenge } = useTOTPChallenge();
  const { getErrorMessage } = useAuthError();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<VerifyTOTPFormData>({
    resolver: zodResolver(verifyTOTPSchema),
  });

  const formCode = watch('code');

  // Create challenge when component mounts
  useEffect(() => {
    if (!hasActiveChallenge && factorId) {
      createChallenge(factorId);
    }
  }, [createChallenge, factorId, hasActiveChallenge]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearChallenge();
    };
  }, [clearChallenge]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6);
      const newCode = [...code];
      
      for (let i = 0; i < pastedCode.length && i < 6; i++) {
        newCode[i] = pastedCode[i];
      }
      
      setCode(newCode);
      setValue('code', newCode.join(''));
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      
      // Auto-submit when all 6 digits are entered
      if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
        handleVerifyCode({ code: newCode.join('') });
      }
      
      return;
    }

    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setValue('code', newCode.join(''));

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode({ code: newCode.join('') });
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (data: VerifyTOTPFormData) => {
    if (!hasActiveChallenge) {
      // Try to create a new challenge
      const challengeCreated = await createChallenge(factorId);
      if (!challengeCreated) return;
    }

    const success = await verifyChallenge(factorId, data.code);
    
    if (success) {
      onSuccess?.();
    } else {
      // Clear the code on error
      setCode(['', '', '', '', '', '']);
      setValue('code', '');
      inputRefs.current[0]?.focus();
    }
  };

  const handleRetry = () => {
    setCode(['', '', '', '', '', '']);
    setValue('code', '');
    createChallenge(factorId);
    inputRefs.current[0]?.focus();
  };

  if (loading && !hasActiveChallenge) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Preparing verification...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !hasActiveChallenge) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={handleRetry} className="flex-1">
              Try Again
            </Button>
            {onBack && (
              <Button variant="outline" onClick={onBack} className="flex-1">
                Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      {showHeader && (
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Two-factor authentication
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(handleVerifyCode)} className="space-y-6">
          {/* Code Input */}
          <div className="space-y-2">
            <Label className="text-center block">Authentication Code</Label>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  disabled={loading || isSubmitting}
                />
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Hidden form input for validation */}
          <input type="hidden" {...register('code')} />
          {errors.code && (
            <Alert variant="destructive">
              <AlertDescription>{errors.code.message}</AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={formCode?.length !== 6 || loading || isSubmitting}
            className="w-full"
          >
            {loading || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify & Continue
              </>
            )}
          </Button>

          {/* Back Button */}
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full"
              disabled={loading || isSubmitting}
            >
              Back to Sign In
            </Button>
          )}
        </form>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Having trouble?</p>
          <ul className="space-y-1">
            <li>• Make sure your device's time is correct</li>
            <li>• Codes expire every 30 seconds</li>
            <li>• Try generating a new code</li>
            <li>• Check if your authenticator app is working</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TOTPVerificationForm;
