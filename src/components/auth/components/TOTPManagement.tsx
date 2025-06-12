/**
 * TOTP Management Component
 * 
 * Displays and manages TOTP factors for the user
 * Allows viewing, removing, and adding new factors
 */

import React, { useState } from 'react';
import { Smartphone, Shield, Trash2, Plus, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

import { useTOTPFactors, useMFAStatus } from '../hooks/useAuth';
import type { TOTPFactor } from '../types/authTypes';

interface TOTPManagementProps {
  onSetupNew?: () => void;
  showAddButton?: boolean;
}

export const TOTPManagement: React.FC<TOTPManagementProps> = ({
  onSetupNew,
  showAddButton = true,
}) => {
  const [removingFactorId, setRemovingFactorId] = useState<string | null>(null);
  
  const { factors, loading, error, removeFactor, hasTOTP, verifiedFactors } = useTOTPFactors();
  const { assuranceLevel, needsMFA, hasMFA } = useMFAStatus();
  const { toast } = useToast();

  const handleRemoveFactor = async (factorId: string, friendlyName?: string) => {
    setRemovingFactorId(factorId);
    
    const success = await removeFactor(factorId);
    
    if (success) {
      toast({
        title: "Authenticator removed",
        description: `${friendlyName || 'Authenticator'} has been removed from your account.`,
      });
    } else {
      toast({
        title: "Failed to remove authenticator",
        description: "There was an error removing the authenticator. Please try again.",
        variant: "destructive",
      });
    }
    
    setRemovingFactorId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFactorCard = (factor: TOTPFactor) => (
    <Card key={factor.id} className="relative">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">
                  {factor.friendly_name || 'Authenticator App'}
                </h4>
                <Badge 
                  variant={factor.status === 'verified' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {factor.status === 'verified' ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Added on {formatDate(factor.created_at)}
              </p>
              {factor.updated_at !== factor.created_at && (
                <p className="text-xs text-muted-foreground">
                  Last used: {formatDate(factor.updated_at)}
                </p>
              )}
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                disabled={loading || removingFactorId === factor.id}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {removingFactorId === factor.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove authenticator</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove "{factor.friendly_name || 'this authenticator'}"? 
                  You will no longer be able to use it for two-factor authentication.
                  {verifiedFactors.length === 1 && (
                    <span className="block mt-2 text-orange-600 font-medium">
                      Warning: This is your only active authenticator. Removing it will disable 
                      two-factor authentication for your account.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleRemoveFactor(factor.id, factor.friendly_name)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && factors.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Loading your authenticators...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>
                {hasMFA 
                  ? 'Your account is protected with two-factor authentication'
                  : 'Add an extra layer of security to your account'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant={hasMFA ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                {hasMFA ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Disabled
                  </>
                )}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {verifiedFactors.length} active authenticator{verifiedFactors.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {showAddButton && (
              <Button onClick={onSetupNew} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Authenticator
              </Button>
            )}
          </div>

          {!hasTOTP && (
            <Alert className="mt-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is not enabled. We strongly recommend enabling it 
                to protect your account from unauthorized access.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Factors List */}
      {factors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Authenticators</h3>
          
          <div className="space-y-3">
            {factors.map((factor) => renderFactorCard(factor))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {factors.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No authenticators set up</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Set up an authenticator app to add an extra layer of security to your account. 
                  We recommend using apps like Google Authenticator or Authy.
                </p>
              </div>
              {showAddButton && onSetupNew && (
                <Button onClick={onSetupNew} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Set Up Authenticator
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium">About Two-Factor Authentication</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Two-factor authentication (2FA) adds an extra layer of security by requiring 
                a code from your authenticator app in addition to your password.
              </p>
              <p>
                Even if someone knows your password, they won't be able to access your account 
                without the code from your authenticator app.
              </p>
            </div>
            
            <Separator />
            
            <div className="text-sm">
              <h5 className="font-medium mb-2">Recommended authenticator apps:</h5>
              <ul className="text-muted-foreground space-y-1">
                <li>• Google Authenticator</li>
                <li>• Microsoft Authenticator</li>
                <li>• Authy</li>
                <li>• 1Password</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TOTPManagement;
