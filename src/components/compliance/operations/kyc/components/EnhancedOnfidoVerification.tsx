import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, UserRoundCog } from "lucide-react";
import { OnfidoVerification } from './OnfidoVerification';
import type { ComplianceCheck } from '../../types';

// Form schema using Zod
const formSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  consentToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
});

type FormValues = z.infer<typeof formSchema>;

interface EnhancedOnfidoVerificationProps {
  investorId: string;
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: string;
  };
}

export const EnhancedOnfidoVerification: React.FC<EnhancedOnfidoVerificationProps> = ({
  investorId,
  onComplete,
  onError,
  initialData,
}) => {
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [step, setStep] = useState<'form' | 'verification' | 'complete'>('form');
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      consentToTerms: false,
    },
  });

  const onSubmit = (values: FormValues) => {
    setFormData(values);
    setStep('verification');
  };

  const handleVerificationComplete = (result: ComplianceCheck) => {
    setStep('complete');
    onComplete(result);
  };

  const handleVerificationError = (err: Error) => {
    setError(err.message);
    onError(err);
  };

  const handleRetry = () => {
    setError(null);
    setStep('form');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>
          Please provide your information for identity verification
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {step === 'form' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth (YYYY-MM-DD)</FormLabel>
                    <FormControl>
                      <Input placeholder="YYYY-MM-DD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="consentToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I consent to the processing of my personal data for identity verification purposes
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="bg-red-50 p-4 rounded-md flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  Continue to Verification
                </Button>
              </div>
            </form>
          </Form>
        )}
        
        {step === 'verification' && formData && (
          <OnfidoVerification
            investorId={investorId}
            investorData={{
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              dateOfBirth: formData.dateOfBirth
            } as { firstName: string; lastName: string; email: string; dateOfBirth?: string }}
            onComplete={handleVerificationComplete}
            onError={handleVerificationError}
          />
        )}
        
        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Verification Complete</h3>
              <p className="text-muted-foreground">
                Your identity verification has been submitted successfully.
              </p>
            </div>
          </div>
        )}
        
        {error && step !== 'form' && (
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
    </Card>
  );
};