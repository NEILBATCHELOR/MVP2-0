/**
 * DFNS Authentication Component - Enhanced authentication UI for DFNS integration
 * 
 * This component provides a comprehensive authentication interface including:
 * - Service account authentication
 * - WebAuthn/Passkey authentication  
 * - Key credential authentication
 * - Personal Access Token authentication
 * - Credential management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  DfnsAuthenticator, 
  DfnsCredentialManager,
  DfnsServiceAccountManager,
  DfnsCredentialKind,
  DfnsSignatureType,
  type AuthCredentials,
  type ServiceAccountToken,
  type CredentialInfo,
  type ServiceAccountInfo
} from '@/infrastructure/dfns';
import { DEFAULT_CLIENT_CONFIG } from '@/infrastructure/dfns/config';
import { 
  Key, 
  Fingerprint, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Settings,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';

// ===== Types =====

export interface DfnsAuthenticationProps {
  onAuthSuccess?: (credentials: AuthCredentials) => void;
  onAuthError?: (error: Error) => void;
  onAuthLogout?: () => void;
  defaultTab?: 'service-account' | 'webauthn' | 'key' | 'pat';
  showCredentialManagement?: boolean;
  showServiceAccountManagement?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  currentCredentials: AuthCredentials | null;
  currentTab: string;
}

// ===== Main Component =====

export const DfnsAuthentication: React.FC<DfnsAuthenticationProps> = ({
  onAuthSuccess,
  onAuthError,
  onAuthLogout,
  defaultTab = 'webauthn',
  showCredentialManagement = true,
  showServiceAccountManagement = true
}) => {
  // ===== State Management =====
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    currentCredentials: null,
    currentTab: defaultTab
  });

  const [authenticator] = useState(() => new DfnsAuthenticator(DEFAULT_CLIENT_CONFIG));
  const [credentialManager] = useState(() => new DfnsCredentialManager(DEFAULT_CLIENT_CONFIG, authenticator));
  const [serviceAccountManager] = useState(() => new DfnsServiceAccountManager(DEFAULT_CLIENT_CONFIG, authenticator));

  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccountInfo[]>([]);

  // ===== Authentication Methods =====

  const handleServiceAccountAuth = useCallback(async (serviceAccountId: string, privateKey: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const token = await authenticator.authenticateServiceAccount(serviceAccountId, privateKey);
      const credentials = authenticator.getCredentials();
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        currentCredentials: credentials
      }));
      
      onAuthSuccess?.(credentials);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      onAuthError?.(error as Error);
    }
  }, [authenticator, onAuthSuccess, onAuthError]);

  const handleWebAuthnAuth = useCallback(async (username: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authenticator.authenticateDelegated(username, 'webauthn-credential', DfnsCredentialKind.Fido2);
      const credentials = authenticator.getCredentials();
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        currentCredentials: credentials
      }));
      
      onAuthSuccess?.(credentials);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      onAuthError?.(error as Error);
    }
  }, [authenticator, onAuthSuccess, onAuthError]);

  const handleKeyAuth = useCallback(async (credentialId: string, privateKey: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authenticator.authenticateDelegated(credentialId, credentialId, DfnsCredentialKind.Key);
      const credentials = authenticator.getCredentials();
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        currentCredentials: credentials
      }));
      
      onAuthSuccess?.(credentials);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      onAuthError?.(error as Error);
    }
  }, [authenticator, onAuthSuccess, onAuthError]);

  const handlePATAuth = useCallback(async (token: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authenticator.authenticateWithPAT(token);
      const credentials = authenticator.getCredentials();
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        currentCredentials: credentials
      }));
      
      onAuthSuccess?.(credentials);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      onAuthError?.(error as Error);
    }
  }, [authenticator, onAuthSuccess, onAuthError]);

  const handleLogout = useCallback(() => {
    authenticator.logout();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      currentCredentials: null,
      currentTab: defaultTab
    });
    onAuthLogout?.();
  }, [authenticator, defaultTab, onAuthLogout]);

  // ===== Load Data =====

  const loadCredentials = useCallback(async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const creds = await credentialManager.listCredentials();
      setCredentials(creds);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  }, [credentialManager, authState.isAuthenticated]);

  const loadServiceAccounts = useCallback(async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const accounts = await serviceAccountManager.listServiceAccounts();
      setServiceAccounts(accounts);
    } catch (error) {
      console.error('Failed to load service accounts:', error);
    }
  }, [serviceAccountManager, authState.isAuthenticated]);

  // ===== Effects =====

  useEffect(() => {
    // Check if already authenticated on component mount
    if (authenticator.isAuthenticated()) {
      const credentials = authenticator.getCredentials();
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentCredentials: credentials
      }));
    }
  }, [authenticator]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadCredentials();
      loadServiceAccounts();
    }
  }, [authState.isAuthenticated, loadCredentials, loadServiceAccounts]);

  // ===== Render Helpers =====

  const renderError = () => {
    if (!authState.error) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{authState.error}</AlertDescription>
      </Alert>
    );
  };

  const renderAuthenticatedState = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Authenticated with DFNS
          </CardTitle>
          <CardDescription>
            You are successfully authenticated and can access DFNS services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Credential Type</Label>
              <Badge variant="secondary" className="ml-2">
                {authState.currentCredentials?.credentialKind || 'Unknown'}
              </Badge>
            </div>
            
            {authState.currentCredentials?.credentialId && (
              <div>
                <Label className="text-sm font-medium">Credential ID</Label>
                <p className="text-sm text-gray-600 font-mono">
                  {authState.currentCredentials.credentialId}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
              <Button onClick={() => authenticator.refreshToken()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Token
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showCredentialManagement && (
        <CredentialManagementSection 
          credentials={credentials}
          credentialManager={credentialManager}
          onCredentialsChange={loadCredentials}
        />
      )}

      {showServiceAccountManagement && (
        <ServiceAccountManagementSection
          serviceAccounts={serviceAccounts}
          serviceAccountManager={serviceAccountManager}
          onServiceAccountsChange={loadServiceAccounts}
        />
      )}
    </div>
  );

  // ===== Main Render =====

  if (authState.isAuthenticated) {
    return renderAuthenticatedState();
  }

  return (
    <div className="space-y-6">
      {renderError()}
      
      <Card>
        <CardHeader>
          <CardTitle>DFNS Authentication</CardTitle>
          <CardDescription>
            Choose your preferred authentication method to access DFNS services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={authState.currentTab} 
            onValueChange={(value) => setAuthState(prev => ({ ...prev, currentTab: value }))}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="webauthn">
                <Fingerprint className="h-4 w-4 mr-2" />
                WebAuthn
              </TabsTrigger>
              <TabsTrigger value="service-account">
                <Shield className="h-4 w-4 mr-2" />
                Service Account
              </TabsTrigger>
              <TabsTrigger value="key">
                <Key className="h-4 w-4 mr-2" />
                Key Credential
              </TabsTrigger>
              <TabsTrigger value="pat">
                <User className="h-4 w-4 mr-2" />
                Access Token
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webauthn" className="space-y-4">
              <WebAuthnAuthForm 
                onAuth={handleWebAuthnAuth}
                isLoading={authState.isLoading}
              />
            </TabsContent>

            <TabsContent value="service-account" className="space-y-4">
              <ServiceAccountAuthForm 
                onAuth={handleServiceAccountAuth}
                isLoading={authState.isLoading}
              />
            </TabsContent>

            <TabsContent value="key" className="space-y-4">
              <KeyCredentialAuthForm 
                onAuth={handleKeyAuth}
                isLoading={authState.isLoading}
              />
            </TabsContent>

            <TabsContent value="pat" className="space-y-4">
              <PATAuthForm 
                onAuth={handlePATAuth}
                isLoading={authState.isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// ===== Authentication Form Components =====

interface AuthFormProps {
  onAuth: (...args: any[]) => Promise<void>;
  isLoading: boolean;
}

const WebAuthnAuthForm: React.FC<AuthFormProps> = ({ onAuth, isLoading }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onAuth(username.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="webauthn-username">Username</Label>
        <Input
          id="webauthn-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading || !username.trim()}>
        {isLoading ? 'Authenticating...' : 'Authenticate with WebAuthn'}
      </Button>
    </form>
  );
};

const ServiceAccountAuthForm: React.FC<AuthFormProps> = ({ onAuth, isLoading }) => {
  const [serviceAccountId, setServiceAccountId] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceAccountId.trim() && privateKey.trim()) {
      onAuth(serviceAccountId.trim(), privateKey.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="service-account-id">Service Account ID</Label>
        <Input
          id="service-account-id"
          type="text"
          value={serviceAccountId}
          onChange={(e) => setServiceAccountId(e.target.value)}
          placeholder="Enter service account ID"
          required
        />
      </div>
      <div>
        <Label htmlFor="private-key">Private Key</Label>
        <Input
          id="private-key"
          type="password"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="Enter private key"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading || !serviceAccountId.trim() || !privateKey.trim()}>
        {isLoading ? 'Authenticating...' : 'Authenticate Service Account'}
      </Button>
    </form>
  );
};

const KeyCredentialAuthForm: React.FC<AuthFormProps> = ({ onAuth, isLoading }) => {
  const [credentialId, setCredentialId] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentialId.trim() && privateKey.trim()) {
      onAuth(credentialId.trim(), privateKey.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="credential-id">Credential ID</Label>
        <Input
          id="credential-id"
          type="text"
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          placeholder="Enter credential ID"
          required
        />
      </div>
      <div>
        <Label htmlFor="key-private-key">Private Key</Label>
        <Input
          id="key-private-key"
          type="password"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="Enter private key"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading || !credentialId.trim() || !privateKey.trim()}>
        {isLoading ? 'Authenticating...' : 'Authenticate with Key'}
      </Button>
    </form>
  );
};

const PATAuthForm: React.FC<AuthFormProps> = ({ onAuth, isLoading }) => {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onAuth(token.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="access-token">Personal Access Token</Label>
        <Input
          id="access-token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your personal access token"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading || !token.trim()}>
        {isLoading ? 'Authenticating...' : 'Authenticate with Token'}
      </Button>
    </form>
  );
};

// ===== Management Section Components =====

interface CredentialManagementSectionProps {
  credentials: CredentialInfo[];
  credentialManager: DfnsCredentialManager;
  onCredentialsChange: () => void;
}

const CredentialManagementSection: React.FC<CredentialManagementSectionProps> = ({
  credentials,
  credentialManager,
  onCredentialsChange
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCredential = async (type: DfnsCredentialKind) => {
    setIsCreating(true);
    try {
      switch (type) {
        case DfnsCredentialKind.Fido2:
          await credentialManager.createFido2Credential(
            'New WebAuthn Credential',
            'user',
            'User'
          );
          break;
        case DfnsCredentialKind.Key:
          await credentialManager.createKeyCredential('New Key Credential');
          break;
        default:
          throw new Error(`Unsupported credential type: ${type}`);
      }
      onCredentialsChange();
    } catch (error) {
      console.error('Failed to create credential:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Credential Management
        </CardTitle>
        <CardDescription>
          Manage your DFNS authentication credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreateCredential(DfnsCredentialKind.Fido2)}
              disabled={isCreating}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add WebAuthn
            </Button>
            <Button
              onClick={() => handleCreateCredential(DfnsCredentialKind.Key)}
              disabled={isCreating}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Key
            </Button>
          </div>

          {credentials.length > 0 && (
            <div className="space-y-2">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{credential.name}</p>
                    <p className="text-sm text-gray-600">{credential.kind}</p>
                  </div>
                  <Badge variant={credential.status === 'Active' ? 'default' : 'secondary'}>
                    {credential.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ServiceAccountManagementSectionProps {
  serviceAccounts: ServiceAccountInfo[];
  serviceAccountManager: DfnsServiceAccountManager;
  onServiceAccountsChange: () => void;
}

const ServiceAccountManagementSection: React.FC<ServiceAccountManagementSectionProps> = ({
  serviceAccounts,
  serviceAccountManager,
  onServiceAccountsChange
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateServiceAccount = async () => {
    setIsCreating(true);
    try {
      await serviceAccountManager.createServiceAccount('New Service Account');
      onServiceAccountsChange();
    } catch (error) {
      console.error('Failed to create service account:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Service Account Management
        </CardTitle>
        <CardDescription>
          Manage DFNS service accounts for programmatic access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={handleCreateServiceAccount}
            disabled={isCreating}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Service Account
          </Button>

          {serviceAccounts.length > 0 && (
            <div className="space-y-2">
              {serviceAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-600 font-mono">{account.id}</p>
                  </div>
                  <Badge variant={account.status === 'Active' ? 'default' : 'secondary'}>
                    {account.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ===== Export =====

export default DfnsAuthentication;
