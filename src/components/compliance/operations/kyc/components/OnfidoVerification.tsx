import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle, UserRoundCog } from "lucide-react";
import { OnfidoService } from '../services/onfidoService';
import type { ComplianceCheck } from '@/types/domain/compliance/compliance';
import type { OnfidoSDKOptions, OnfidoComplete, OnfidoError, OnfidoApplicant } from '@/types/domain/identity/onfido';

// Add Onfido SDK type definitions
declare global {
  interface Window {
    Onfido: {
      init: (options: OnfidoSDKOptions) => {
        tearDown: () => void;
      };
    };
  }
}

interface OnfidoVerificationProps {
  investorId: string;
  investorData?: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: string; // YYYY-MM-DD
  };
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
}

export const OnfidoVerification: React.FC<OnfidoVerificationProps> = ({
  investorId,
  investorData,
  onComplete,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkToken, setSdkToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'error'>('not_started');
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<OnfidoComplete | null>(null);
  const [isOndidoScriptLoaded, setIsOnfidoScriptLoaded] = useState(false);

  // Load Onfido SDK script
  useEffect(() => {
    const loadOnfidoScript = () => {
      const script = document.createElement('script');
      script.src = 'https://assets.onfido.com/web-sdk-releases/latest/onfido.min.js';
      script.async = true;
      script.onload = () => setIsOnfidoScriptLoaded(true);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    loadOnfidoScript();
  }, []);

  // Initialize the Onfido SDK when the applicant is created and the script is loaded
  useEffect(() => {
    if (sdkToken && isOndidoScriptLoaded) {
      initOnfidoSdk();
    }
  }, [sdkToken, isOndidoScriptLoaded]);

  // Create an applicant when the component mounts
  useEffect(() => {
    if (investorData && status === 'not_started') {
      createApplicant();
    }
  }, [investorData, status]);

  // Create a new applicant with the provided investor data
  const createApplicant = async () => {
    if (!investorData) return;

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, you would get this from your environment
      const onfidoService = OnfidoService.getInstance();
      
      // Create an applicant
      const applicant = await onfidoService.createApplicant({
        firstName: investorData.firstName,
        lastName: investorData.lastName,
        email: investorData.email,
        dob: investorData.dateOfBirth
      });
      
      setApplicantId(applicant.id);
      
      // Get an SDK token
      const token = await onfidoService.createSdkToken(
        applicant.id, 
        window.location.origin // referrer
      );
      
      setSdkToken(token.token);
      setStatus('in_progress');
      
      // Store mapping between investor and applicant
      await storeApplicantMapping(investorId, applicant.id);
      
    } catch (err) {
      console.error('Error creating applicant:', err);
      setError('Failed to create verification session. Please try again.');
      setStatus('error');
      onError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Store a mapping between investor ID and Onfido applicant ID
  const storeApplicantMapping = async (investorId: string, applicantId: string) => {
    try {
      // Use your Supabase client here
      const { data, error } = await fetch('/api/compliance/identity-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          investorId,
          provider: 'onfido',
          providerId: applicantId
        }),
      }).then(res => res.json());

      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      console.error('Error storing applicant mapping:', err);
      // Continue despite error - this is not critical for the flow
    }
  };

  // Initialize the Onfido SDK
  const initOnfidoSdk = () => {
    if (!sdkToken || !window.Onfido) return;
    
    try {
      const container = document.getElementById('onfido-mount');
      if (!container) return;
      
      const onfido = window.Onfido.init({
        token: sdkToken,
        containerId: 'onfido-mount',
        onComplete: handleOnfidoComplete,
        onError: handleOnfidoError,
        steps: {
          welcome: true,
          document: {
            enabled: true,
            documentTypes: {
              passport: true,
              driving_licence: true,
              national_identity_card: true
            },
            countryCodes: ['USA']
          },
          face: {
            type: 'photo'
          }
        }
      });
      
      // Store the teardown function
      return () => {
        onfido.tearDown();
      };
    } catch (err) {
      console.error('Error initializing Onfido SDK:', err);
      setError('Failed to initialize verification. Please refresh and try again.');
      setStatus('error');
      onError(err as Error);
    }
  };

  // Handle Onfido verification completion
  const handleOnfidoComplete = async (data: OnfidoComplete) => {
    console.log('Onfido verification completed:', data);
    setVerificationResult(data);
    setStatus('completed');
    
    try {
      if (applicantId) {
        // In a real implementation, you would get this from your environment
        const onfidoService = OnfidoService.getInstance();
        
        // Create a check
        const check = await onfidoService.createCheck(applicantId);
        
        // Create a ComplianceCheck object
        const complianceCheck: ComplianceCheck = {
          id: crypto.randomUUID(),
          type: 'KYC',
          status: 'IN_PROGRESS',
          details: {
            provider: 'onfido',
            checkId: check.id,
            applicantId: applicantId,
            documentCapture: data.document,
            selfieCapture: data.face
          },
          createdAt: new Date(),
        };
        
        onComplete(complianceCheck);
      }
    } catch (err) {
      console.error('Error creating check:', err);
      setError('Verification documents submitted, but failed to start background checks.');
      onError(err as Error);
    }
  };

  // Handle Onfido errors
  const handleOnfidoError = (err: OnfidoError) => {
    console.error('Onfido error:', err);
    setError('An error occurred during verification. Please try again.');
    setStatus('error');
    onError(err as unknown as Error);
  };

  // Retry verification
  const handleRetry = () => {
    setStatus('not_started');
    setError(null);
    setVerificationResult(null);
    setSdkToken(null);
    setApplicantId(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
          <CardDescription>
            Complete the verification process to comply with regulatory requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'not_started' && (
            <div className="text-center py-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Spinner size="lg" />
                  <p>Setting up verification process...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <UserRoundCog className="h-16 w-16 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Verify Your Identity</h3>
                    <p className="text-muted-foreground">
                      We use Onfido, a secure identity verification service, to validate your identity.
                    </p>
                  </div>
                  <Button 
                    onClick={createApplicant}
                    disabled={!investorData}
                  >
                    Start Verification
                  </Button>
                </div>
              )}
            </div>
          )}

          {status === 'in_progress' && (
            <div id="onfido-mount" className="min-h-[500px]"></div>
          )}

          {status === 'completed' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Verification Submitted</h3>
                <p className="text-muted-foreground">
                  Thank you for submitting your verification documents. We will review your information 
                  and update your compliance status.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Verification Error</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" onClick={handleRetry}>Try Again</Button>
            </div>
          )}
        </CardContent>
        {status === 'completed' && (
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Your documents are being processed. This typically takes 1-2 business days.
            </p>
          </CardFooter>
        )}
      </Card>
    </>
  );
};

export default OnfidoVerification; 