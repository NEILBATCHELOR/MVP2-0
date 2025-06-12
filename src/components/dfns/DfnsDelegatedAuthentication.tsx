/**
 * DFNS Delegated Authentication Component - WebAuthn credential management
 * 
 * This component provides a user interface for managing delegated signing credentials
 * including WebAuthn registration, passkey setup, and session management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Fingerprint, 
  Shield, 
  Key, 
  Smartphone, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Settings,
  Info
} from 'lucide-react';

import { 
  DfnsDelegatedSigningManager,
  DelegatedCredential,
  DelegatedSession,
  DelegatedCredentialType,
  DelegatedCredentialStatus,
  RecoveryType,
  RecoveryProcess
} from '@/infrastructure/dfns/delegated-signing-manager';
import { useDfns } from '@/hooks/useDfns';

// ===== Component Types =====

export interface DfnsDelegatedAuthProps {
  onCredentialRegistered?: (credential: DelegatedCredential) => void;
  onSessionCreated?: (session: DelegatedSession) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface CredentialRegistrationForm {
  username: string;
  displayName: string;
  credentialName: string;
  credentialType: DelegatedCredentialType;
}

interface RecoveryInitiationForm {
  username: string;
  recoveryType: RecoveryType;
  verificationData?: string;
}

// ===== Main Component =====

export function DfnsDelegatedAuthentication({
  onCredentialRegistered,
  onSessionCreated,
  onError,
  className
}: DfnsDelegatedAuthProps) {
  // State management
  const [credentials, setCredentials] = useState<DelegatedCredential[]>([]);
  const [activeSessions, setActiveSessions] = useState<DelegatedSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registrationForm, setRegistrationForm] = useState<CredentialRegistrationForm>({
    username: '',
    displayName: '',
    credentialName: '',
    credentialType: DelegatedCredentialType.WebAuthn
  });
  const [recoveryForm, setRecoveryForm] = useState<RecoveryInitiationForm>({
    username: '',
    recoveryType: RecoveryType.KYC,
    verificationData: ''
  });
  const [selectedCredential, setSelectedCredential] = useState<DelegatedCredential | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [registrationProgress, setRegistrationProgress] = useState(0);

  // Hooks
  const { client } = useDfns();
  const [delegatedManager, setDelegatedManager] = useState<DfnsDelegatedSigningManager | null>(null);

  // Initialize delegated signing manager
  useEffect(() => {
    if (client) {
      const manager = new DfnsDelegatedSigningManager(client.getConfig());
      setDelegatedManager(manager);
    }
  }, [client]);

  // Load user credentials and sessions
  const loadUserData = useCallback(async () => {
    if (!delegatedManager) return;

    setIsLoading(true);
    try {
      // In a real implementation, these would fetch from DFNS API
      // For now, we'll simulate with empty arrays
      setCredentials([]);
      setActiveSessions([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [delegatedManager, onError]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ===== Event Handlers =====

  const handleCredentialRegistration = async (type: DelegatedCredentialType) => {
    if (!delegatedManager) {
      setError('Delegated signing manager not initialized');
      return;
    }

    setIsLoading(true);
    setRegistrationProgress(0);
    setError(null);

    try {
      setRegistrationProgress(25);

      let credential: DelegatedCredential;
      
      if (type === DelegatedCredentialType.WebAuthn) {
        setRegistrationProgress(50);
        credential = await delegatedManager.registerWebAuthnCredential(
          registrationForm.username,
          registrationForm.displayName,
          registrationForm.credentialName
        );
      } else if (type === DelegatedCredentialType.Passkey) {
        setRegistrationProgress(50);
        credential = await delegatedManager.registerPasskey(
          registrationForm.username,
          registrationForm.displayName
        );
      } else {
        throw new Error(`Unsupported credential type: ${type}`);
      }

      setRegistrationProgress(100);
      setCredentials(prev => [...prev, credential]);
      setSuccess(`${type} credential registered successfully!`);
      setShowRegistration(false);
      setRegistrationForm({
        username: '',
        displayName: '',
        credentialName: '',
        credentialType: DelegatedCredentialType.WebAuthn
      });
      
      onCredentialRegistered?.(credential);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      setRegistrationProgress(0);
    }
  };

  const handleAuthentication = async (credentialId?: string) => {
    if (!delegatedManager) {
      setError('Delegated signing manager not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await delegatedManager.authenticateWithDelegatedCredential(credentialId);
      setActiveSessions(prev => [...prev, session]);
      setSuccess('Authentication successful!');
      onSessionCreated?.(session);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialRevocation = async (credentialId: string) => {
    if (!delegatedManager) return;

    setIsLoading(true);
    try {
      await delegatedManager.revokeDelegatedCredential(credentialId);
      setCredentials(prev => prev.filter(cred => cred.id !== credentialId));
      setSuccess('Credential revoked successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke credential';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryInitiation = async () => {
    if (!delegatedManager) return;

    setIsLoading(true);
    setError(null);

    try {
      const recovery = await delegatedManager.initiateRecovery(
        recoveryForm.username,
        recoveryForm.recoveryType,
        recoveryForm.verificationData
      );
      setSuccess('Recovery process initiated. Check your email for next steps.');
      setShowRecovery(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate recovery';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Utility Functions =====

  const getCredentialIcon = (type: DelegatedCredentialType) => {
    switch (type) {
      case DelegatedCredentialType.WebAuthn:
        return <Shield className="h-4 w-4" />;
      case DelegatedCredentialType.Passkey:
        return <Fingerprint className="h-4 w-4" />;
      case DelegatedCredentialType.BiometricKey:
        return <Fingerprint className="h-4 w-4" />;
      case DelegatedCredentialType.DeviceKey:
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  const getCredentialStatusBadge = (status: DelegatedCredentialStatus) => {
    const variants = {
      [DelegatedCredentialStatus.Active]: 'default',
      [DelegatedCredentialStatus.Inactive]: 'secondary',
      [DelegatedCredentialStatus.Revoked]: 'destructive',
      [DelegatedCredentialStatus.Expired]: 'outline',
      [DelegatedCredentialStatus.Compromised]: 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const isWebAuthnSupported = () => {
    return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
  };

  // ===== Render =====

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Delegated Authentication</h2>
          <p className="text-muted-foreground">
            Manage your biometric credentials and secure sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRegistration(true)}
            disabled={!isWebAuthnSupported() || isLoading}
          >
            <Fingerprint className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRecovery(true)}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Account Recovery
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {!isWebAuthnSupported() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            WebAuthn is not supported in this browser. Please use a modern browser with biometric authentication support.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="credentials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-4">
          {credentials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Fingerprint className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Credentials Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add a biometric credential to enable secure, passwordless authentication
                </p>
                <Button onClick={() => setShowRegistration(true)} disabled={!isWebAuthnSupported()}>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Add Your First Credential
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {credentials.map((credential) => (
                <Card key={credential.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCredentialIcon(credential.type)}
                        <CardTitle className="text-base">{credential.metadata.name}</CardTitle>
                      </div>
                      {getCredentialStatusBadge(credential.status)}
                    </div>
                    <CardDescription>
                      {credential.type} • {credential.deviceInfo.platform}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Created {new Date(credential.createdAt).toLocaleDateString()}
                    </div>
                    {credential.lastUsedAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        Last used {new Date(credential.lastUsedAt).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAuthentication(credential.id)}
                        disabled={isLoading || credential.status !== DelegatedCredentialStatus.Active}
                      >
                        Authenticate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCredential(credential)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCredentialRevocation(credential.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
                <p className="text-muted-foreground text-center">
                  Authenticate with a credential to create a secure session
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Active Session</span>
                      </div>
                      <Badge>Session ID: {session.id.slice(-8)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{new Date(session.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p>{new Date(session.expiresAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Activity</p>
                        <p>{new Date(session.lastActivityAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capabilities</p>
                        <p>{session.capabilities.length} operations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Preferences</CardTitle>
              <CardDescription>
                Configure your delegated authentication security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require biometric verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Always require biometric verification for sensitive operations
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically end sessions after period of inactivity
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recovery options</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable account recovery through identity verification
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Registration Dialog */}
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Credential</DialogTitle>
            <DialogDescription>
              Register a new biometric credential for secure authentication
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {registrationProgress > 0 && (
              <div className="space-y-2">
                <Label>Registration Progress</Label>
                <Progress value={registrationProgress} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={registrationForm.username}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={registrationForm.displayName}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter display name"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credentialName">Credential Name</Label>
              <Input
                id="credentialName"
                value={registrationForm.credentialName}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, credentialName: e.target.value }))}
                placeholder="e.g., My MacBook Pro"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleCredentialRegistration(DelegatedCredentialType.WebAuthn)}
                disabled={isLoading || !registrationForm.username || !registrationForm.displayName}
                className="flex-1"
              >
                <Shield className="h-4 w-4 mr-2" />
                WebAuthn
              </Button>
              <Button
                onClick={() => handleCredentialRegistration(DelegatedCredentialType.Passkey)}
                disabled={isLoading || !registrationForm.username || !registrationForm.displayName}
                className="flex-1"
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Passkey
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recovery Dialog */}
      <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Recovery</DialogTitle>
            <DialogDescription>
              Initiate account recovery if you've lost access to your credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recoveryUsername">Username</Label>
              <Input
                id="recoveryUsername"
                value={recoveryForm.username}
                onChange={(e) => setRecoveryForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Recovery Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={recoveryForm.recoveryType === RecoveryType.KYC ? 'default' : 'outline'}
                  onClick={() => setRecoveryForm(prev => ({ ...prev, recoveryType: RecoveryType.KYC }))}
                  disabled={isLoading}
                  size="sm"
                >
                  Identity Verification
                </Button>
                <Button
                  variant={recoveryForm.recoveryType === RecoveryType.RecoveryKey ? 'default' : 'outline'}
                  onClick={() => setRecoveryForm(prev => ({ ...prev, recoveryType: RecoveryType.RecoveryKey }))}
                  disabled={isLoading}
                  size="sm"
                >
                  Recovery Key
                </Button>
              </div>
            </div>
            <Button
              onClick={handleRecoveryInitiation}
              disabled={isLoading || !recoveryForm.username}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Initiate Recovery
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DfnsDelegatedAuthentication;
