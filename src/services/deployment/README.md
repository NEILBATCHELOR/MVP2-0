# Token Deployment Services

This directory contains services for handling token deployments.

## DeploymentService

`DeploymentService` is the core implementation responsible for:

- Handling the token deployment workflow
- Managing deployment status
- Interacting with the blockchain
- Contract verification
- Event emission
- Transaction monitoring

It is implemented as a singleton and can be accessed via:

```typescript
import { deploymentService } from '@/infrastructure/web3/services/DeploymentService';
```

### Key Features

- Deploy tokens to the blockchain
- Track deployment status
- Verify deployed contracts
- Monitor deployment transactions
- Emit events for deployment status changes

### Usage

```typescript
import { deploymentService } from '@/infrastructure/web3/services/DeploymentService';
import { NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';

// Deploy a token
const result = await deploymentService.deployToken(
  projectId,
  tokenId,
  'ethereum',
  NetworkEnvironment.TESTNET,
  keyId
);

// Verify a deployed contract
await deploymentService.verifyContract(
  tokenId,
  contractAddress,
  'ethereum',
  NetworkEnvironment.TESTNET
);

// Get deployment status
const status = await deploymentService.getDeploymentStatus(tokenId);
```

## tokenDeploymentService

`tokenDeploymentService` in `src/components/tokens/services/tokenDeploymentService.ts` is a higher-level service that adds:

- Rate limiting
- Configuration validation
- Security validation
- User tracking
- Event logging

It wraps the core `DeploymentService` and adds business rules.

### Key Features

- Validate token configuration before deployment
- Apply rate limits to deployments
- Check for security vulnerabilities
- Track deployment attempts
- Log deployment events

### Usage

```typescript
import { tokenDeploymentService } from '@/components/tokens/services/tokenDeploymentService';

// Deploy a token with additional validations and rate limiting
const result = await tokenDeploymentService.deployToken(
  tokenId,
  userId,
  projectId
);

// Validate a token configuration for deployment
const validationResult = await tokenDeploymentService.validateTokenForDeployment(
  tokenId
);

// Verify a token contract
await tokenDeploymentService.verifyTokenContract(
  tokenId,
  contractAddress,
  userId
);
```

## Relationship Between Services

These services represent different layers in the architecture:

1. **DeploymentService**: Core implementation with blockchain interactions
2. **tokenDeploymentService**: Higher-level service with business rules

The relationship is hierarchical:
- `tokenDeploymentService` depends on `DeploymentService`
- `tokenDeploymentService` calls methods on `DeploymentService`
- Both services operate on the same token data

## Integration with Factories

Both services work with the token contract factories:

- `DeploymentService` uses `TokenContractBytecodeFactory` for bytecode generation
- `DeploymentService` relies on `TokenContractFactory` for deployment execution
- `tokenDeploymentService` doesn't directly interact with the factories, but relies on `DeploymentService` to do so

This layered architecture provides:
- Clear separation of concerns
- Reusable core functionality
- Business-specific validation and rules at the higher level 