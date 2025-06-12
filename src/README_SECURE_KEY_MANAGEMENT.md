# Secure Key Management System Documentation

## Overview

The Secure Key Management System provides a robust solution for managing cryptographic keys for blockchain transactions within the Chain Capital platform. This system enhances security by keeping private keys securely stored on the server-side and never exposing them to the client.

## Key Features

- **Project-Based Credentials**: Generate and manage keys linked to specific projects
- **Multiple Authentication Methods**: Support for MetaMask, WalletConnect, and project credentials
- **Secure Key Storage**: Private keys stored securely using HSM-backed storage (AWS KMS/Azure Key Vault)
- **Audit Logging**: Comprehensive tracking of all key usage for security and compliance
- **Key Rotation**: Support for key rotation and revocation

## Components

The system consists of the following components:

### 1. Database Tables

- `project_credentials`: Stores project-associated public keys and references to private keys
- `credential_usage_logs`: Audit logs for all credential usage
- `secure_keys`: Development-only table for encrypted keys (in production, keys are stored in HSM)

### 2. Backend Services

- `keyVaultClient`: Interfaces with secure key storage services
- `projectCredentialsService`: Manages project credentials and signing operations

### 3. Frontend Components

- `ProjectCredentialsPanel`: UI for managing project credentials
- `SecureDeploymentPanel`: Enhanced deployment panel with secure key usage
- `WalletConnect`: Components for wallet connections with MetaMask and WalletConnect

## Usage Guide

### Managing Project Credentials

1. Navigate to a project's settings page
2. Open the "Credentials" tab
3. Generate a new key pair for the project
4. View and manage existing credentials

### Deploying Tokens with Project Credentials

1. In the Token Deployment Wizard, complete the token configuration
2. Choose "Use Project Credentials" as the deployment method
3. Select a project credential to use for deployment
4. The deployment will be signed server-side with the private key

### Using Personal Wallets

1. In the Token Deployment Wizard, complete the token configuration
2. Choose "Connect Personal Wallet" as the deployment method
3. Connect with MetaMask or WalletConnect
4. Sign the deployment transaction with your personal wallet

## Security Considerations

- Private keys are never exposed to the client
- All signing operations happen server-side
- All key usage is logged for audit purposes
- Keys can be revoked if compromised
- Multiple authentication methods provide flexibility without compromising security

## API Reference

### ProjectCredentialsService

```typescript
// Get credentials for a project
getCredentialsForProject(projectId: string): Promise<ProjectCredential[]>

// Generate new credentials for a project
generateCredentialsForProject(projectId: string, userId?: string): Promise<ProjectCredential>

// Revoke a credential
revokeCredential(credentialId: string, userId?: string): Promise<ProjectCredential>

// Delete a credential
deleteCredential(credentialId: string, userId?: string): Promise<{ success: boolean }>

// Sign data using a project's credentials
signWithProjectCredentials(projectId: string, data: string, userId?: string, context?: Record<string, any>): Promise<{ signature: string, credentialId: string }>

// Verify a signature
verifySignature(publicKey: string, data: string, signature: string): Promise<boolean>

// Get usage logs for a credential
getCredentialUsageLogs(credentialId: string): Promise<CredentialUsageLog[]>
```

### KeyVaultClient

```typescript
// Generate a new key pair
generateKeyPair(): Promise<{ keyId: string, publicKey: string }>

// Sign data using a key in the vault
signData(keyId: string, data: string): Promise<string>

// Delete a key from the vault
deleteKey(keyId: string): Promise<{ success: boolean }>

// Verify a signature
verifySignature(publicKey: string, data: string, signature: string): Promise<boolean>
```

## Technical Implementation Details

### Key Generation and Storage

Keys are generated using a secure random number generator and immediately stored in encrypted form. In production, keys should be generated and stored in a Hardware Security Module (HSM) through services like AWS KMS or Azure Key Vault.

In the development environment:
- Private keys are encrypted before storage using standard encryption methods
- The encrypted keys are stored in the `secure_keys` table
- Row-level security policies limit access to system administrators

In the production environment:
- Keys are generated and stored in an HSM
- Private keys never leave the HSM
- All signing operations occur within the HSM
- Only public keys and key references are stored in the database

### Signing Process

1. When a signing operation is requested, the system locates the appropriate credential for the project
2. The credential references the private key in the key vault
3. The signing request is forwarded to the key vault/HSM
4. The signature is returned and used for the blockchain transaction
5. The operation is logged for audit purposes

### Wallet Connections

Wallet connections are implemented using the following libraries:
- Wagmi: React hooks for Ethereum
- ethers.js: Ethereum JavaScript library
- WalletConnect: For mobile wallet connections

## Deployment Guide

To deploy the Secure Key Management System:

1. Run the database migrations in the `migrations` folder
2. Configure environment variables for key storage services
3. Set up the appropriate infrastructure for secure key storage (AWS KMS, Azure Key Vault, etc.)
4. Deploy the backend services
5. Configure the frontend to use the appropriate authentication methods

## Environment Variables

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id
KEY_VAULT_SERVICE_URL=your_key_vault_service_url
KEY_VAULT_API_KEY=your_key_vault_api_key
```

## Security Best Practices

1. **Principle of Least Privilege**: Grant minimal access to key operations
2. **Key Rotation**: Regularly rotate keys to minimize risk
3. **Audit Logging**: Log all key operations for security review
4. **HSM Storage**: Use hardware security modules for key storage when possible
5. **Encryption in Transit**: Ensure all communications with key storage are encrypted
6. **Access Controls**: Implement strict access controls for key operations
7. **Compliance**: Ensure all key management complies with relevant regulations