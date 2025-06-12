/**
 * OTP Form Component
 * 
 * Handles OTP verification for phone and email authentication
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Smartphone, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useOtpAuth, useAuthError, useResendVerification } from '../hooks/useAuth';
import { verifyOtpSchema, type VerifyOtpFormData } from '../validation/authValidation';

interface OtpFormProps {
  type: 'email' | 'sms';
  email?: string;
  phone?: string;
  onSuccess?: () => void;
  onBack?: () => void;
  showHeader?: boolean;
}

export const OtpForm: React.FC<OtpFormProps> = ({
  type,
  email,
  phone,
  onSuccess,
  onBack,
  showHeader = true,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { verifyCode, loading } = useOtpAuth();
  const { error, clearError, getErrorMessage } = useAuthError();
  const { resend, loading: resendLoading, canResend } = useResendVerification();
  const navigate = useNavigate();
  const location = useLocation();

  // Get contact info from props or route state
  const contactInfo = email || phone || (location.state as any)?.email || (location.state as any)?.phone;
  const maskedContact = contactInfo ? 
    type === 'email' 
      ? contactInfo.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      : contactInfo.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1***$3$4')
    : '';

  const {
    formState: { isSubmitting },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
  });

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6);
      const newOtp = [...otp];
      
      for (let i = 0; i < pastedCode.length && i < 6; i++) {
        newOtp[i] = pastedCode[i];
      }
      
      setOtp(newOtp);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      
      return;
    }

    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    clearError();
    
    const code = otpCode || otp.join('');
    if (code.length !== 6) return;

    const success = await verifyCode({
      token: code,
      email: type === 'email' ? contactInfo : undefined,
      phone: type === 'sms' ? contactInfo : undefined,
      type: type === 'email' ? 'email' : 'sms',
    });

    if (success) {
      onSuccess?.();
      navigate('/dashboard');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !contactInfo) return;

    clearError();
    setOtp(['', '', '', '', '', '']);
    setTimeLeft(60);

    const success = await resend({
      type: type === 'email' ? 'signup' : 'sms',
      email: type === 'email' ? contactInfo : undefined,
      phone: type === 'sms' ? contactInfo : undefined,
    });

    if (success) {
      inputRefs.current[0]?.focus();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      {showHeader && (
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {type === 'email' ? (
              <Mail className="w-8 h-8 text-primary" />
            ) : (
              <Smartphone className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            Enter verification code
          </CardTitle>
          <CardDescription>
            We sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">{maskedContact}</span>
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {/* OTP Input */}
        <div className="space-y-2">
          <Label className="text-center block">Verification Code</Label>
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold"
                disabled={loading || isSubmitting}
              />
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Enter the 6-digit code sent to your {type === 'email' ? 'email' : 'phone'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        {/* Timer and Resend */}
        <div className="text-center space-y-4">
          {timeLeft > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{' '}
              <span className="font-medium text-foreground">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                variant="outline"
                onClick={handleResendOtp}
                disabled={!canResend || resendLoading}
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  `Resend code`
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => handleVerifyOtp()}
          disabled={otp.join('').length !== 6 || loading || isSubmitting}
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
              Verify Code
            </>
          )}
        </Button>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="w-full"
          disabled={loading || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Tips */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Having trouble?</p>
          <ul className="space-y-1">
            {type === 'email' ? (
              <>
                <li>• Check your spam or junk folder</li>
                <li>• Make sure your email address is correct</li>
                <li>• The code expires in 10 minutes</li>
              </>
            ) : (
              <>
                <li>• Check your SMS messages</li>
                <li>• Make sure your phone number is correct</li>
                <li>• The code expires in 10 minutes</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OtpForm;
