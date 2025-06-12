# ONCHAINID Integration

This document outlines the implementation of ONCHAINID digital identity in our application. ONCHAINID is a decentralized identity protocol that enables secure management of digital identities, claims, and compliance on blockchain networks.

## Overview

The ONCHAINID integration provides the following features:

1. Creation and management of blockchain identities for users
2. Storage and verification of claims (KYC, AML, investor status, etc.)
3. Integration with token operations for compliance checks
4. Support for multiple blockchain networks

## Architecture

The implementation follows our standard adapter pattern with the following components:

### Core Classes

- `IdentityService`: Public API for working with ONCHAINID identities
- `OnChainIDManager`: Singleton that manages the core ONCHAINID operations
- `OnChainIDAdapter`: Adapter that connects with our blockchain adapter system

### Database Schema

We've added the following tables to store ONCHAINID data:

- `onchain_identities`: Links users to their ONCHAINID addresses
- `onchain_issuers`: Stores trusted claim issuers
- `onchain_claims`: Caches verified claims
- `onchain_verification_history`: Tracks verification attempts

### Contract Interfaces

We've defined TypeScript interfaces for the ONCHAINID smart contracts:

- `IdentityInterface`: For ERC734/ERC735-based identity contracts
- `FactoryInterface`: For the ONCHAINID Factory contract
- `ClaimIssuerInterface`: For claim issuer contracts
- `GatewayInterface`: For the ONCHAINID Gateway
- `VerifierInterface`: For claim verification contracts

## Setup and Configuration

### Required Dependencies

```bash
npm install @onchain-id/identity-sdk ethers
```

### Environment Variables

Set the following environment variables for each supported network:

```
# Ethereum Mainnet
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-key
MAINNET_FACTORY_ADDRESS=0x...
MAINNET_IMPLEMENTATION_AUTHORITY_ADDRESS=0x...
MAINNET_GATEWAY_ADDRESS=0x...

# Polygon Mainnet
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_FACTORY_ADDRESS=0x...
POLYGON_IMPLEMENTATION_AUTHORITY_ADDRESS=0x...
POLYGON_GATEWAY_ADDRESS=0x...
```

## Usage Examples

### Creating an Identity

```typescript
import { IdentityService } from '@/lib/onchainid/IdentityService';

// Get the service instance
const identityService = IdentityService.getInstance();

// Create an identity for a user
const result = await identityService.createIdentity(
  'user-123',             // User ID in our system
  '0x123...789',          // User's wallet address
  { salt: '0x456...abc' } // Optional: deployment options
);

console.log(`Identity deployed at: ${result.address}`);
```

### Verifying KYC Status

```typescript
import { IdentityService } from '@/lib/onchainid/IdentityService';
import { ClaimTopic } from '@/types/onchainid';

// Get the service instance
const identityService = IdentityService.getInstance();

// Check if a user has valid KYC
const hasValidKYC = await identityService.hasValidKYC('user-123');

if (hasValidKYC) {
  console.log('User has valid KYC');
} else {
  console.log('User does not have valid KYC');
}
```

### Getting Claims

```typescript
import { IdentityService } from '@/lib/onchainid/IdentityService';
import { ClaimTopic } from '@/types/onchainid';

// Get the service instance
const identityService = IdentityService.getInstance();

// Get identity address for user
const identityAddress = await identityService.getIdentityByUserId('user-123');

if (!identityAddress) {
  console.log('User does not have an identity');
  return;
}

// Get all KYC claims for the identity
const kycClaims = await identityService.getClaims(identityAddress, ClaimTopic.KYC);
console.log('KYC claims:', kycClaims);
```

## Token Compliance Integration

To integrate ONCHAINID with token operations (e.g., transfers, minting), you can use the compliance verification methods in the `IdentityService`.

```typescript
import { IdentityService } from '@/lib/onchainid/IdentityService';

async function canTransferToken(userId: string): Promise<boolean> {
  const identityService = IdentityService.getInstance();
  
  // Check if the user is eligible for investment
  // This verifies KYC, AML, and investor status claims
  return await identityService.isEligibleForInvestment(userId);
}
```

## Deployment Process

When deploying the ONCHAINID integration to production:

1. Deploy the necessary database migrations
2. Configure environment variables with contract addresses
3. Update the identity service with the appropriate network
4. Test the integration with real wallets and claims

## Resources

- [ONCHAINID Documentation](https://docs.onchainid.com/)
- [ONCHAINID SDK](https://github.com/onchain-id/identity-sdk)
- [ONCHAINID Contracts](https://github.com/onchain-id/solidity) 