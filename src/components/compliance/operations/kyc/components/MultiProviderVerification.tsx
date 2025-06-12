import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Shield, UserRoundCog } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OnfidoVerification } from './OnfidoVerification';
import { VerificationProviderFactory } from '../services/verificationProviderAdapter';
import type { ComplianceCheck } from '../../types';

// Define IdenfySDK interface
interface IdenfySDK {
  init: (settings: any) => void;
  startVerification: () => void;
}

// Add IdenfySDK to Window interface
declare global {
  interface Window {
    IdenfySDK?: IdenfySDK;
  }
}

// Simple Script component
const Script: React.FC<{
  src: string;
  onLoad?: () => void;
  strategy?: string;
}> = ({ src, onLoad }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    if (onLoad) {
      script.onload = onLoad;
    }
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [src, onLoad]);
  
  return null;
};

// Define the provider configurations
const providerConfigs = {
  onfido: {
    name: 'Onfido',
    description: 'Global identity verification with document and biometric checks',
    regions: ['us', 'eu', 'ca'],
    documentTypes: ['passport', 'driving_licence', 'national_identity_card', 'residence_permit'],
    verificationTypes: ['standard', 'advanced']
  },
  idenfy: {
    name: 'Idenfy',
    description: 'Automated identity verification and e-signature solution',
    regions: ['global'],
    documentTypes: ['passport', 'id_card', 'driver_license', 'residence_permit'],
    verificationTypes: ['basic', 'advanced']
  }
};

// Form schema for API configuration
const configSchema = z.object({
  provider: z.enum(['onfido', 'idenfy']),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().optional(),
  region: z.string().optional(),
  verificationType: z.string().optional()
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface MultiProviderVerificationProps {
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

export const MultiProviderVerification: React.FC<MultiProviderVerificationProps> = ({
  investorId,
  investorData,
  onComplete,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'error'>('not_started');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'onfido' | 'idenfy'>('onfido');
  const [idenfyToken, setIdenfyToken] = useState<string | null>(null);
  const [isIdenfyScriptLoaded, setIsIdenfyScriptLoaded] = useState(false);
  const [applicantId, setApplicantId] = useState<string | null>(null);

  // Form for API configuration
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      provider: 'onfido',
      apiKey: '',
      apiSecret: '',
      region: 'us',
      verificationType: 'standard'
    }
  });

  const watchProvider = form.watch('provider');
  
  // Update provider when form changes
  useEffect(() => {
    setProvider(watchProvider);
  }, [watchProvider]);

  // Handle form submission for API configuration
  const onSubmit = async (values: ConfigFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create appropriate configuration object based on provider
      let config;
      
      if (values.provider === 'onfido') {
        config = {
          apiToken: values.apiKey,
          region: values.region as 'us' | 'eu' | 'ca'
        };
      } else {
        config = {
          apiKey: values.apiKey,
          apiSecret: values.apiSecret || '',
          baseUrl: 'https://ivs.idenfy.com/api/v2'
        };
      }
      
      // Check if configuration is valid by creating an adapter
      VerificationProviderFactory.createProvider(values.provider, config as any);
      
      setIsConfigured(true);
    } catch (err) {
      console.error('Error configuring provider:', err);
      setError(err instanceof Error ? err.message : 'Failed to configure verification provider');
    } finally {
      setIsLoading(false);
    }
  };

  // Start verification with Idenfy
  const startIdenfyVerification = async () => {
    if (!investorData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const config = {
        apiKey: form.getValues('apiKey'),
        apiSecret: form.getValues('apiSecret') || '',
        baseUrl: 'https://ivs.idenfy.com/api/v2'
      };
      
      const adapter = VerificationProviderFactory.createProvider('idenfy', config as any);
      
      // Create an applicant
      const applicant = await adapter.createApplicant({
        firstName: investorData.firstName,
        lastName: investorData.lastName,
        email: investorData.email,
        dateOfBirth: investorData.dateOfBirth
      });
      
      setApplicantId(applicant.id);
      
      // Start verification
      const verification = await adapter.startVerification(applicant.id);
      
      setIdenfyToken(verification.token);
      setStatus('in_progress');
      setVerificationStarted(true);
      
    } catch (err) {
      console.error('Error starting Idenfy verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to start verification');
      setStatus('error');
      onError(err instanceof Error ? err : new Error('Failed to start verification'));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Idenfy SDK
  const initIdenfySdk = () => {
    if (!idenfyToken || !window.IdenfySDK) return;
    
    try {
      const idenfySettings = {
        idenfyToken: idenfyToken
      };
      
      window.IdenfySDK.init(idenfySettings);
      
      // Set up event listeners
      window.addEventListener('IDENFY_SUCCESS_EVENT', handleIdenfySuccess);
      window.addEventListener('IDENFY_FAILURE_EVENT', handleIdenfyFailure);
      window.addEventListener('IDENFY_USER_EXIT_EVENT', handleIdenfyExit);
      
      // Start verification
      window.IdenfySDK.startVerification();
    } catch (err) {
      console.error('Error initializing Idenfy SDK:', err);
      setError('Failed to initialize verification. Please refresh and try again.');
      setStatus('error');
      onError(err instanceof Error ? err : new Error('Failed to initialize Idenfy SDK'));
    }
  };

  // Handle Idenfy success
  const handleIdenfySuccess = (event: any) => {
    console.log('Idenfy verification succeeded:', event);
    setStatus('completed');
    
    try {
      if (applicantId) {
        // Create a ComplianceCheck object
        const complianceCheck = VerificationProviderFactory.createComplianceCheck(
          'idenfy',
          'KYC',
          {
            type: 'KYC',
            investorId: investorId,
            provider: 'idenfy',
            status: 'COMPLETED',
            applicantId: applicantId,
            id: `idenfy-${Date.now()}`,
            details: event.detail
          },
          investorId
        );
        
        onComplete(complianceCheck);
      }
    } catch (err) {
      console.error('Error creating check:', err);
      setError('Verification completed, but failed to create compliance record.');
      onError(err instanceof Error ? err : new Error('Failed to create compliance record'));
    }
  };

  // Handle Idenfy failure
  const handleIdenfyFailure = (event: any) => {
    console.error('Idenfy verification failed:', event);
    setError('Verification failed. Please try again.');
    setStatus('error');
    onError(new Error('Idenfy verification failed'));
  };

  // Handle Idenfy exit
  const handleIdenfyExit = () => {
    console.log('User exited Idenfy verification');
    setStatus('not_started');
    setVerificationStarted(false);
  };

  // Handle retry
  const handleRetry = () => {
    setStatus('not_started');
    setError(null);
    setVerificationStarted(false);
    setIdenfyToken(null);
    setApplicantId(null);
  };

  // Effect to init Idenfy SDK when token and script are ready
  useEffect(() => {
    if (idenfyToken && isIdenfyScriptLoaded) {
      initIdenfySdk();
    }
  }, [idenfyToken, isIdenfyScriptLoaded]);

  // Clean up event listeners
  useEffect(() => {
    return () => {
      window.removeEventListener('IDENFY_SUCCESS_EVENT', handleIdenfySuccess);
      window.removeEventListener('IDENFY_FAILURE_EVENT', handleIdenfyFailure);
      window.removeEventListener('IDENFY_USER_EXIT_EVENT', handleIdenfyExit);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Provider Identity Verification</CardTitle>
        <CardDescription>
          Complete the verification process using your preferred provider
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConfigured ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Provider</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a verification provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="onfido">Onfido</SelectItem>
                        <SelectItem value="idenfy">Idenfy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{provider === 'onfido' ? 'API Token' : 'API Key'}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your API key" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {provider === 'idenfy' && (
                <FormField
                  control={form.control}
                  name="apiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Secret</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your API secret" 
                          {...field} 
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {provider === 'onfido' && (
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="us">US</SelectItem>
                          <SelectItem value="eu">EU</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="verificationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select verification type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provider === 'onfido' ? (
                          <>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Configuring...
                  </>
                ) : (
                  'Configure Provider'
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <>
            {provider === 'onfido' && investorData ? (
              <OnfidoVerification
                investorId={investorId}
                investorData={investorData}
                onComplete={onComplete}
                onError={onError}
              />
            ) : (
              <>
                {/* Load Idenfy SDK script */}
                <Script
                  src="https://sdk.idenfy.com/sdk.js"
                  onLoad={() => setIsIdenfyScriptLoaded(true)}
                />
                
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
                            We use Idenfy, a secure identity verification service, to validate your identity.
                          </p>
                        </div>
                        <Button 
                          onClick={startIdenfyVerification}
                          disabled={!investorData || verificationStarted}
                        >
                          Start Verification
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {status === 'in_progress' && (
                  <div className="text-center py-8">
                    <Spinner size="lg" />
                    <p className="mt-4">Idenfy verification in progress...</p>
                  </div>
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
              </>
            )}
          </>
        )}
        
        {error && !verificationStarted && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiProviderVerification;