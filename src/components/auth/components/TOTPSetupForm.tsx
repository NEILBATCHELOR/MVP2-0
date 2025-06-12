/**
 * TOTP Setup Form Component
 * 
 * Handles the setup and enrollment of TOTP authenticator
 * Displays QR code and provides manual entry option
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QrCode, Key, Copy, CheckCircle2, Smartphone, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

import { useTOTPSetup, useAuthError } from '../hooks/useAuth';
import { verifyTOTPSchema, type VerifyTOTPFormData } from '../validation/authValidation';

interface TOTPSetupFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  friendlyName?: string;
  showHeader?: boolean;
}

export const TOTPSetupForm: React.FC<TOTPSetupFormProps> = ({
  onSuccess,
  onCancel,
  friendlyName = 'My Authenticator',
  showHeader = true,
}) => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'verify'>('setup');
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'manual'>('qr');
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();
  const { enrollTOTP, verifyTOTP, clearSetup, setupData, loading, error, isSetupComplete } = useTOTPSetup();
  const { getErrorMessage } = useAuthError();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<VerifyTOTPFormData>({
    resolver: zodResolver(verifyTOTPSchema),
  });

  const totpCode = watch('code');

  // Start enrollment when component mounts
  useEffect(() => {
    const startEnrollment = async () => {
      await enrollTOTP(friendlyName);
    };
    
    if (!setupData && !loading) {
      startEnrollment();
    }
  }, [enrollTOTP, friendlyName, setupData, loading]);

  // Auto-advance to verification step when setup is complete
  useEffect(() => {
    if (isSetupComplete && currentStep === 'setup') {
      setCurrentStep('verify');
    }
  }, [isSetupComplete, currentStep]);

  const handleCopySecret = async () => {
    if (!setupData?.secret) return;

    try {
      await navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      toast({
        title: "Secret copied",
        description: "The secret key has been copied to your clipboard.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy secret. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyCode = async (data: VerifyTOTPFormData) => {
    const success = await verifyTOTP(data.code);
    
    if (success) {
      toast({
        title: "Two-factor authentication enabled",
        description: "Your authenticator has been successfully set up.",
      });
      onSuccess?.();
    }
  };

  const handleCancel = () => {
    clearSetup();
    reset();
    onCancel?.();
  };

  const handleRetry = () => {
    clearSetup();
    reset();
    setCurrentStep('setup');
    enrollTOTP(friendlyName);
  };

  if (loading && !setupData) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Setting up your authenticator...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !setupData) {
    return (
      <Card className="w-full max-w-lg mx-auto">
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
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      {showHeader && (
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Set up two-factor authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with an authenticator app
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {currentStep === 'setup' && setupData && (
          <>
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6">
              <Badge variant="secondary" className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Scan QR Code
              </Badge>
              <div className="flex-1 h-px bg-muted mx-3" />
              <Badge variant="outline" className="flex items-center gap-2">
                <span className="w-5 h-5 border rounded-full flex items-center justify-center text-xs">2</span>
                Verify Code
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan the QR code below with your authenticator app or enter the secret manually.
              </p>

              <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'qr' | 'manual')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="qr" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="qr" className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg border">
                      <img 
                        src={setupData.qrCode} 
                        alt="TOTP QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Use apps like Google Authenticator, Authy, or 1Password
                  </p>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Secret Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={setupData.secret} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleCopySecret}
                        className="shrink-0"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter this secret in your authenticator app manually
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Account Name</Label>
                      <p className="font-medium">Chain Capital</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Issuer</Label>
                      <p className="font-medium">Chain Capital</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended apps:</strong> Google Authenticator, Microsoft Authenticator, 
                Authy, or 1Password. Make sure to save your backup codes after setup.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep('verify')} className="flex-1">
                Continue to Verification
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {currentStep === 'verify' && (
          <>
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6">
              <Badge variant="outline" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                QR Code Scanned
              </Badge>
              <div className="flex-1 h-px bg-muted mx-3" />
              <Badge variant="secondary" className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Verify Code
              </Badge>
            </div>

            <form onSubmit={handleSubmit(handleVerifyCode)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Enter verification code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-lg font-mono tracking-widest"
                  {...register('code')}
                  disabled={loading || isSubmitting}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{getErrorMessage(error)}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={!totpCode || totpCode.length !== 6 || loading || isSubmitting}
                  className="flex-1"
                >
                  {loading || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Enable 2FA
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('setup')}
                  disabled={loading || isSubmitting}
                >
                  Back
                </Button>
              </div>
            </form>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure your device's time is synchronized. TOTP codes are time-sensitive 
                and expire every 30 seconds.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TOTPSetupForm;
