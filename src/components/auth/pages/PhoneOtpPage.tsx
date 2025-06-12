/**
 * Phone OTP Page
 * 
 * Phone number authentication with SMS OTP
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { GuestGuard } from '@/components/auth/ProtectedRoute';
import { OtpForm } from '@/components/auth/components';
import { useOtpAuth, useAuthError } from '@/hooks/auth';
import { phoneOtpSchema, type PhoneOtpFormData } from '@/components/auth/validation/authValidation';

const PhoneOtpPage: React.FC = () => {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const { sendOtp, loading } = useOtpAuth();
  const { error, clearError, getErrorMessage } = useAuthError();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PhoneOtpFormData>({
    resolver: zodResolver(phoneOtpSchema),
    defaultValues: {
      phone: '',
    },
  });

  const handleSendOtp = async (data: PhoneOtpFormData) => {
    clearError();

    const success = await sendOtp({
      phone: data.phone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (success) {
      setPhoneNumber(data.phone);
      setStep('verify');
    }
  };

  const handleBack = () => {
    if (step === 'verify') {
      setStep('phone');
      setPhoneNumber('');
      clearError();
    } else {
      navigate('/auth/login');
    }
  };

  if (step === 'verify') {
    return (
      <GuestGuard>
        <Helmet>
          <title>Verify Phone - Chain Capital</title>
          <meta name="description" content="Enter the verification code sent to your phone" />
        </Helmet>
        
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-12">
          <div className="w-full max-w-md">
            <OtpForm
              type="sms"
              phone={phoneNumber}
              onBack={handleBack}
              showHeader={true}
            />
          </div>
        </div>
      </GuestGuard>
    );
  }

  return (
    <GuestGuard>
      <Helmet>
        <title>Phone Sign In - Chain Capital</title>
        <meta name="description" content="Sign in to Chain Capital with your phone number" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Sign in with Phone
              </CardTitle>
              <CardDescription className="text-center">
                Enter your phone number and we'll send you a verification code
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-4">
                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                      {...register('phone')}
                      disabled={loading || isSubmitting}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your phone number with country code (e.g., +1 for US)
                  </p>
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                {/* Info Alert */}
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    We'll send you a 6-digit verification code via SMS. Standard messaging rates may apply.
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
                      Sending code...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Send verification code
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
                      onClick={() => navigate('/auth/magic-link')}
                      disabled={loading || isSubmitting}
                    >
                      Magic Link
                    </Button>
                  </div>
                </div>

                {/* Back Button */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={loading || isSubmitting}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-muted-foreground pt-4">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth/signup')}
                    className="text-primary hover:underline font-medium"
                    disabled={loading || isSubmitting}
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </GuestGuard>
  );
};

export default PhoneOtpPage;
