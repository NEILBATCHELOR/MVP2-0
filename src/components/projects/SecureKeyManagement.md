# Secure Key Management Proposal

## Current Issues

The current approach to private key handling in the token deployment system has several security concerns:

1. **Direct Private Key Input**: Asking users to input private keys directly into the UI is a security risk
2. **No Key Storage Strategy**: There's no strategy for securely generating or storing keys within projects
3. **Manual RPC Input**: Requiring manual RPC input is cumbersome and error-prone

## Proposed Solution

We propose implementing a secure key management system integrated with projects that would:

1. Generate project-specific key pairs
2. Never expose or transmit private keys to the frontend
3. Utilize hardware security modules (HSMs) for secure key storage
4. Leverage modern wallet standards like MetaMask and WalletConnect

## Implementation Plan

### 1. Project-Based Key Management Service

Create a secure backend service that:

- Generates public/private key pairs per project
- Stores private keys securely in an HSM or equivalent secure storage
- Associates public keys with projects in the database
- Provides signing capabilities without exposing private keys

### 2. Frontend Integration

Update the project management UI to:

- Display public keys associated with a project
- Allow generating new key pairs through a secure API
- Avoid any direct handling of private keys

### 3. Deployment Flow Redesign

Modify the token deployment flow to:

1. Use project-associated credentials rather than user-provided keys
2. Support multiple authentication methods:
   - **Wallet Integration**: MetaMask, WalletConnect
   - **Project Credentials**: Using project-associated keys (serverside signing)
   - **Key Management API**: For backend services

## Technical Architecture

### Backend Components

1. **Key Vault Service**
   - Generates key pairs
   - Securely stores private keys
   - Provides signing capabilities
   - Uses AWS KMS, Azure Key Vault, or similar

2. **Project Credentials API**
   - Associates credentials with projects
   - Manages permissions for project-associated keys 
   - Handles credential rotation

### Frontend Components

1. **Project Key Management Panel**
   - Displays public keys
   - Allows generation of new keys
   - Shows key usage history

2. **Enhanced Deployment Panel**
   - Uses project credentials by default
   - Offers wallet connection as alternative
   - Removes direct private key input

## Code Example for Project Management UI

```tsx
// ProjectCredentialsPanel.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectCredentialsService } from "@/services/projectCredentials";

interface ProjectCredentialsPanelProps {
  projectId: string;
}

const ProjectCredentialsPanel: React.FC<ProjectCredentialsPanelProps> = ({ projectId }) => {
  const [credentials, setCredentials] = useState<Array<{id: string, publicKey: string, createdAt: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCredentials();
  }, [projectId]);

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const creds = await projectCredentialsService.getCredentialsForProject(projectId);
      setCredentials(creds);
    } catch (error) {
      console.error("Error loading credentials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewKeyPair = async () => {
    try {
      await projectCredentialsService.generateCredentialsForProject(projectId);
      await loadCredentials();
    } catch (error) {
      console.error("Error generating credentials:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Credentials</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={generateNewKeyPair}>
              Generate New Key Pair
            </Button>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Public Key</th>
                  <th className="p-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {credentials.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-gray-500">
                      No credentials found. Generate a key pair to get started.
                    </td>
                  </tr>
                ) : (
                  credentials.map(cred => (
                    <tr key={cred.id} className="border-b">
                      <td className="p-2 font-mono text-xs break-all">
                        {cred.publicKey}
                      </td>
                      <td className="p-2">
                        {new Date(cred.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-muted p-4 rounded-md">
            <h4 className="text-sm font-medium mb-2">Security Note</h4>
            <p className="text-xs text-muted-foreground">
              Private keys are securely stored in our key management system and are never exposed or transmitted to the browser. 
              All signing operations happen server-side with strict access controls.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCredentialsPanel;
```

## Backend Service Example

```typescript
// projectCredentialsService.ts
import { supabase } from "@/infrastructure/supabase";
import { keyVaultClient } from "@/infrastructure/keyVault";

export const projectCredentialsService = {
  /**
   * Get credentials for a project
   */
  async getCredentialsForProject(projectId: string) {
    const { data, error } = await supabase
      .from('project_credentials')
      .select('id, public_key, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(cred => ({
      id: cred.id,
      publicKey: cred.public_key,
      createdAt: cred.created_at
    }));
  },
  
  /**
   * Generate new credentials for a project
   */
  async generateCredentialsForProject(projectId: string) {
    // Generate key pair in the secure vault
    const { keyId, publicKey } = await keyVaultClient.generateKeyPair();
    
    // Store the public key and reference in the database
    const { data, error } = await supabase
      .from('project_credentials')
      .insert({
        project_id: projectId,
        public_key: publicKey,
        key_vault_id: keyId,
        created_at: new Date().toISOString()
      })
      .select('id');
      
    if (error) {
      // If there's an error, delete the key from the vault
      await keyVaultClient.deleteKey(keyId);
      throw error;
    }
    
    return {
      id: data[0].id,
      publicKey: publicKey
    };
  },
  
  /**
   * Sign data using a project's credentials
   */
  async signWithProjectCredentials(projectId: string, data: string) {
    // Find the most recent project credential
    const { data: credentials, error } = await supabase
      .from('project_credentials')
      .select('id, key_vault_id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    if (!credentials.length) throw new Error('No credentials found for project');
    
    // Use the key vault to sign the data
    const signature = await keyVaultClient.signData(
      credentials[0].key_vault_id, 
      data
    );
    
    return {
      signature,
      keyId: credentials[0].id
    };
  }
};
```

## Database Schema

```sql
-- Project credentials table
CREATE TABLE project_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  key_vault_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for faster lookups
CREATE INDEX idx_project_credentials_project_id ON project_credentials(project_id);
```

## Deployment Integration

The modified deployment panel would:

1. Check for project-associated credentials first
2. Offer wallet connection methods (MetaMask, WalletConnect)
3. Perform signing operations server-side when using project credentials
4. Log all deployment activities securely

## Security Considerations

1. **Key Rotation**: Regular rotation of keys to limit exposure
2. **Access Control**: Strict permissions for who can use project keys
3. **Audit Logging**: Comprehensive logging of all key usage
4. **Separation of Duties**: Requiring multiple approvals for sensitive operations
5. **HSM Protection**: Hardware security for private key operations

This approach significantly enhances security by removing direct private key handling from the frontend while making the deployment experience more streamlined for users.