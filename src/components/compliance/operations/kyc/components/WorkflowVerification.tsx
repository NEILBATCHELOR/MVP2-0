import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle } from "lucide-react";
import { OnfidoService } from '../services/onfidoService';
import type { ComplianceCheck } from '@/types/domain/compliance/compliance';
import type { OnfidoComplete, OnfidoError, OnfidoSDKOptions } from '@/types/domain/identity/onfido';

// Custom type for the Script component props
interface ScriptProps {
  src: string;
  onLoad?: () => void;
}

// Simple Script component that adds a script to the document
const ScriptComponent: React.FC<ScriptProps> = ({ src, onLoad }) => {
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

// Extend the Window interface to include the Onfido SDK
declare global {
  interface Window {
    Onfido: {
      init: (options: OnfidoSDKOptions) => { tearDown: () => void };
    };
  }
}

interface WorkflowVerificationProps {
  investorId: string;
  applicantId: string;
  workflowId: string;
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
}

// Extend OnfidoSDKOptions to support workflow-specific properties
interface WorkflowSDKOptions extends Omit<OnfidoSDKOptions, 'workflowRunId'> {
  workflowRunId: string;
}

export const WorkflowVerification: React.FC<WorkflowVerificationProps> = ({
  investorId,
  applicantId,
  workflowId,
  onComplete,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkToken, setSdkToken] = useState<string | null>(null);
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'error'>('not_started');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isScriptLoaded && sdkToken && workflowRunId) {
      initWorkflowSdk();
    }
  }, [isScriptLoaded, sdkToken, workflowRunId]);

  const startWorkflow = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const onfidoService = OnfidoService.getInstance();
      
      // Start the workflow
      const workflowResult = await onfidoService.startWorkflow(applicantId, workflowId);
      setWorkflowRunId(workflowResult.id);
      
      // Generate a token
      const tokenResult = await onfidoService.createSdkToken(
        applicantId,
        window.location.origin
      );
      
      setSdkToken(tokenResult.token);
      setStatus('in_progress');
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
      setStatus('error');
      onError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const initWorkflowSdk = () => {
    if (!window.Onfido || !sdkToken || !workflowRunId) return;
    
    try {
      const container = document.getElementById('workflow-mount');
      if (!container) return;
      
      // Create a combined options object with all required properties
      const options: WorkflowSDKOptions = {
        token: sdkToken,
        containerId: 'workflow-mount',
        onComplete: handleWorkflowComplete,
        onError: handleWorkflowError,
        workflowRunId: workflowRunId
      };
      
      // Initialize the Onfido SDK with the workflow options
      const onfido = window.Onfido.init(options as unknown as OnfidoSDKOptions);
      
      return () => {
        if (onfido && typeof onfido.tearDown === 'function') {
          onfido.tearDown();
        }
      };
    } catch (err) {
      console.error('Error initializing workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize workflow');
      setStatus('error');
      onError(err as Error);
    }
  };

  const handleWorkflowComplete = async (data: OnfidoComplete) => {
    console.log('Workflow verification completed:', data);
    setStatus('completed');
    
    try {
      if (!applicantId) return;
      
      // Create a ComplianceCheck object
      const complianceCheck: ComplianceCheck = {
        id: crypto.randomUUID(),
        type: 'KYC',
        status: 'IN_PROGRESS',
        details: {
          provider: 'onfido',
          applicantId: applicantId,
          workflowId: workflowId,
          workflowRunId: workflowRunId,
          documentCapture: data.document,
          selfieCapture: data.face
        },
        createdAt: new Date(),
      };
      
      onComplete(complianceCheck);
    } catch (err) {
      console.error('Error creating compliance check:', err);
      setError(err instanceof Error ? err.message : 'Failed to create compliance check');
      onError(err as Error);
    }
  };

  const handleWorkflowError = (err: OnfidoError) => {
    console.error('Workflow error:', err);
    setError(`Verification error: ${err.message}`);
    setStatus('error');
    onError(err as unknown as Error);
  };

  const handleRetry = () => {
    setStatus('not_started');
    setError(null);
    setSdkToken(null);
    setWorkflowRunId(null);
  };

  return (
    <>
      {!isScriptLoaded && (
        <ScriptComponent
          src="https://assets.onfido.com/web-sdk-releases/latest/onfido.min.js"
          onLoad={() => setIsScriptLoaded(true)}
        />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Workflow Verification</CardTitle>
          <CardDescription>
            Complete your advanced identity verification process
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'not_started' && (
            <div className="text-center py-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Spinner size="lg" />
                  <p>Setting up verification workflow...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <p className="text-muted-foreground">
                    This workflow will guide you through advanced identity verification steps
                  </p>
                  <Button onClick={startWorkflow}>Start Verification</Button>
                </div>
              )}
            </div>
          )}

          {status === 'in_progress' && (
            <div className="min-h-[400px]">
              <div id="workflow-mount" className="h-full"></div>
            </div>
          )}

          {status === 'completed' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold">Verification Complete</h3>
              <p className="text-center text-muted-foreground">
                Your identity verification has been successfully completed. The results are being processed.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold">Verification Error</h3>
              <p className="text-center text-muted-foreground">
                {error || 'There was a problem with the verification process. Please try again.'}
              </p>
              <Button onClick={handleRetry}>Try Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};