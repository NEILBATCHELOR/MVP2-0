/**
 * TOTP Setup Page
 * 
 * Full page component for setting up two-factor authentication
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import { TOTPSetupForm } from '@/components/auth/components';

export const TOTPSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSetupSuccess = () => {
    toast({
      title: "Two-factor authentication enabled",
      description: "Your account is now protected with two-factor authentication.",
    });
    
    // Navigate to settings or dashboard
    navigate('/dashboard/settings/security', { replace: true });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Security Settings</h1>
          </div>
          
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="max-w-lg mx-auto">
          <TOTPSetupForm
            onSuccess={handleSetupSuccess}
            onCancel={handleCancel}
            showHeader={true}
          />
        </div>

        {/* Help Text */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">Why enable two-factor authentication?</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium">Enhanced Security</h4>
                <p className="text-muted-foreground">
                  Adds an extra layer of protection beyond just your password
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium">Prevent Unauthorized Access</h4>
                <p className="text-muted-foreground">
                  Even if someone gets your password, they can't access your account
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium">Industry Standard</h4>
                <p className="text-muted-foreground">
                  Used by banks, tech companies, and security-conscious organizations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TOTPSetupPage;
