# Foundry Smart Contract Integration

## Overview
This document provides a comprehensive guide to the Foundry-based smart contract system integrated with the existing token deployment infrastructure. The system provides modern, secure, and efficient smart contract deployment while maintaining backward compatibility with existing functionality.

## Architecture

### Smart Contract Layer (Foundry)
- **Location**: `/Users/neilbatchelor/Cursor/1/foundry-contracts/`
- **Contracts**: Clean, modular Solidity contracts using OpenZeppelin standards
- **Features**: Gas optimization, comprehensive testing, and standardized deployment

### TypeScript Integration Layer
- **Enhanced Interfaces**: New TypeScript interfaces for Foundry contract integration
- **Configuration Mappers**: Utilities to convert existing configurations to Foundry format
- **Deployment Services**: Enhanced deployment service with Foundry support and fallback

### Existing System Integration
- **Backward Compatibility**: Maintains full compatibility with existing token creation flows
- **Progressive Enhancement**: New deployments can use Foundry while existing tokens continue to work
- **Fallback Strategy**: Automatic fallback to legacy deployment if Foundry deployment fails

## Smart Contracts

### BaseERC20Token
**Location**: `foundry-contracts/src/BaseERC20Token.sol`

**Features**:
- Configurable decimals, supply caps, and initial distribution
- Optional minting, burning, and governance capabilities
- Pausable transfers for emergency situations
- EIP-2612 permit functionality for gasless approvals
- EIP-5805 voting extension for governance tokens

**Configuration Structure**:
```solidity
struct TokenConfig {
    string name;
    string symbol;
    uint8 decimals;
    uint256 initialSupply;
    uint256 maxSupply; // 0 means no cap
    bool transfersPaused;
    bool mintingEnabled;
    bool burningEnabled;
    bool votingEnabled;
    address initialOwner;
}
```

### BaseERC721Token
**Location**: `foundry-contracts/src/BaseERC721Token.sol`

**Features**:
- Configurable supply caps and mint pricing
- Public and restricted minting modes
- Burnable tokens with tracking
- Enumerable extension for token listing
- URI storage for flexible metadata management
- Revenue withdrawal for contract owner

### BaseERC1155Token
**Location**: `foundry-contracts/src/BaseERC1155Token.sol`

**Features**:
- Multiple token types within single contract
- Individual pricing and supply management per token type
- Batch operations for gas efficiency
- Flexible URI management per token type
- Manager role system for controlled access

### BaseERC4626Token
**Location**: `foundry-contracts/src/BaseERC4626Token.sol`

**Features**:
- EIP-4626 compliant tokenized vault
- Management and performance fee structures
- Deposit limits and minimum deposit requirements
- Emergency pause and withdrawal controls
- Manager role system for vault operations

### TokenFactory
**Location**: `foundry-contracts/src/TokenFactory.sol`

**Features**:
- Unified deployment interface for all token types
- Deterministic address prediction with CREATE2
- Event emission for deployment tracking
- Gas-optimized batch deployment capabilities

## TypeScript Integration

### Enhanced Interfaces
**Location**: `src/components/tokens/interfaces/TokenInterfaces.ts`

**Key Interfaces**:
- `FoundryERC20Config`: ERC20 token configuration
- `FoundryERC721Config`: ERC721 token configuration  
- `FoundryERC1155Config`: ERC1155 token configuration
- `FoundryERC4626Config`: ERC4626 vault configuration
- `FoundryDeploymentParams`: Deployment parameters
- `DeployedContract`: Deployed contract information

### Configuration Mapping
**Location**: `src/components/tokens/utils/foundryConfigMapper.ts`

**Functions**:
- `mapTokenToFoundryConfig()`: Convert legacy config to Foundry format
- `validateFoundryConfig()`: Validate Foundry configurations
- `createDefaultFoundryConfig`: Generate default configurations
- `extractDeploymentConfig()`: Extract config from form data

### Deployment Services
**Location**: `src/components/tokens/services/`

**Services**:
- `foundryDeploymentService.ts`: Core Foundry deployment logic
- `tokenDeploymentService.ts`: Enhanced service with Foundry integration
- Integration with existing rate limiting and security validation

## Deployment Flow

### 1. Configuration Validation
```typescript
// Validate existing token configuration
const validationResult = validateTokenConfiguration(tokenConfig, tokenStandard);

// Map to Foundry configuration
const foundryConfig = mapTokenToFoundryConfig(token, tokenStandard, ownerAddress);

// Validate Foundry configuration
const foundryValidation = validateFoundryConfig(foundryConfig, foundryType);
```

### 2. Deployment Strategy Selection
```typescript
// Determine if Foundry should be used
const shouldUseFoundry = shouldUseFoundryDeployment(tokenStandard);

// Deploy with appropriate strategy
if (shouldUseFoundry) {
    result = await deployWithFoundry(token, tokenStandard, blockchain, environment, userId);
} else {
    result = await deployWithLegacy(projectId, tokenId, blockchain, environment, userId);
}
```

### 3. Contract Deployment
```typescript
// Factory deployment (recommended)
const factory = new ethers.Contract(factoryAddress, TokenFactoryABI, wallet);
const tx = await factory.deployERC20Token(encodedConfig);

// Direct deployment (fallback)
const contractFactory = new ethers.ContractFactory(ABI, bytecode, wallet);
const contract = await contractFactory.deploy(constructorArgs);
```

### 4. Verification and Monitoring
```typescript
// Contract verification
const verificationResult = await foundryDeploymentService.verifyContract(
    contractAddress, blockchain, environment, tokenType
);

// Event monitoring setup
await setupTokenEventMonitoring(tokenAddress, tokenType, blockchain, environment, tokenId);
```

## Configuration Examples

### ERC20 Token
```typescript
const erc20Config: FoundryERC20Config = {
    name: "My Token",
    symbol: "MTK",
    decimals: 18,
    initialSupply: "1000000", // 1M tokens
    maxSupply: "10000000",   // 10M max supply
    transfersPaused: false,
    mintingEnabled: true,
    burningEnabled: true,
    votingEnabled: false,
    initialOwner: "0x742d35Cc6634C0532925a3b8D9e5a9C1c2b0c5e7"
};
```

### ERC721 NFT
```typescript
const erc721Config: FoundryERC721Config = {
    name: "My NFT Collection",
    symbol: "MNC",
    baseURI: "https://api.example.com/metadata/",
    maxSupply: 10000,
    mintPrice: "0.01", // 0.01 ETH
    transfersPaused: false,
    mintingEnabled: true,
    burningEnabled: true,
    publicMinting: true,
    initialOwner: "0x742d35Cc6634C0532925a3b8D9e5a9C1c2b0c5e7"
};
```

### ERC4626 Vault
```typescript
const erc4626Config: FoundryERC4626Config = {
    name: "My Vault Token",
    symbol: "MVT",
    decimals: 18,
    asset: "0xA0b86a33E6441dcA4e73C75CAA3e8F5B3a9F1234", // Underlying asset
    managementFee: 200,    // 2% annual
    performanceFee: 1000,  // 10% performance
    depositLimit: "1000000", // 1M asset limit
    minDeposit: "1",       // 1 asset minimum
    depositsEnabled: true,
    withdrawalsEnabled: true,
    transfersPaused: false,
    initialOwner: "0x742d35Cc6634C0532925a3b8D9e5a9C1c2b0c5e7"
};
```

## Testing

### Smart Contract Tests
**Location**: `foundry-contracts/test/`

**Commands**:
```bash
# Run all tests
forge test

# Run specific test file
forge test --match-contract BaseERC20TokenTest

# Run with verbose output
forge test -vvv

# Generate coverage report
forge coverage
```

### Integration Tests
**Location**: `src/components/tokens/services/__tests__/`

**Testing Strategy**:
- Unit tests for configuration mapping
- Integration tests for deployment flows
- Mock contract interactions for reliable testing
- End-to-end deployment simulation

## Deployment Guide

### 1. Development Environment Setup
```bash
# Navigate to foundry contracts
cd foundry-contracts

# Install dependencies (OpenZeppelin contracts)
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Build contracts
forge build

# Run tests
forge test
```

### 2. Testnet Deployment
```bash
# Set up environment variables
cp .env.example .env
# Edit .env with your private key and RPC URLs

# Deploy to Sepolia testnet
forge script script/DeployTokens.s.sol \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify
```

### 3. Factory Contract Deployment
```bash
# Deploy factory contract
forge create src/TokenFactory.sol:TokenFactory \
    --rpc-url $SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    --verify
```

### 4. Frontend Integration
```typescript
// Update factory address in deployment service
foundryDeploymentService.setFactoryAddress('ethereum', 'testnet', factoryAddress);

// Enable Foundry deployment for specific standards
enhancedTokenDeploymentService.configureDeploymentStrategy.setUseFoundry(true);
enhancedTokenDeploymentService.configureDeploymentStrategy.addSupportedFoundryStandard('ERC-20');
```

## Migration Strategy

### Phase 1: Parallel Operation
- Foundry contracts deployed alongside existing system
- New tokens can optionally use Foundry deployment
- Existing tokens continue to use legacy deployment
- Configuration mapping ensures compatibility

### Phase 2: Progressive Migration
- Default new deployments to Foundry contracts
- Maintain fallback to legacy system for reliability
- Monitor deployment success rates and gas usage
- Gradually expand supported token standards

### Phase 3: Full Migration
- All new deployments use Foundry contracts
- Legacy deployment maintained for backward compatibility
- Enhanced monitoring and analytics
- Optimized gas usage and security improvements

## Security Considerations

### Smart Contract Security
- **OpenZeppelin Standards**: All contracts use battle-tested OpenZeppelin base contracts
- **Custom Security**: Additional security validations in custom logic
- **Access Controls**: Comprehensive role-based access control
- **Emergency Stops**: Pausable functionality for emergency situations

### Deployment Security
- **Configuration Validation**: Multi-layer validation of all parameters
- **Rate Limiting**: Protection against deployment spam
- **Security Scanning**: Automatic security vulnerability detection
- **Verification**: Automatic contract verification on deployment

### Operational Security
- **Key Management**: Secure key vault integration
- **Transaction Monitoring**: Real-time monitoring of all deployments
- **Error Handling**: Comprehensive error handling and logging
- **Fallback Mechanisms**: Automatic fallback to legacy systems

## Monitoring and Analytics

### Deployment Tracking
- Real-time deployment status monitoring
- Gas usage analytics and optimization
- Success/failure rate tracking
- Performance comparison between Foundry and legacy deployments

### Contract Monitoring
- Event monitoring for deployed contracts
- Transaction volume and holder analytics
- Security alert system for unusual activity
- Integration with block explorers for verification status

### User Experience Metrics
- Deployment time improvements
- Gas cost reductions
- User satisfaction metrics
- Error rate reduction

## Future Enhancements

### Short-term (Next 3 months)
- [ ] Complete integration with TokenDashboardPage
- [ ] Enhanced configuration validation UI
- [ ] Automatic gas price optimization
- [ ] Multi-chain deployment support

### Medium-term (3-6 months)
- [ ] Advanced token features (staking, vesting)
- [ ] Cross-chain bridge compatibility
- [ ] Enhanced governance token features
- [ ] Automated security auditing

### Long-term (6+ months)
- [ ] Layer 2 deployment optimization
- [ ] Advanced DeFi protocol integration
- [ ] AI-powered configuration optimization
- [ ] Enterprise-grade deployment automation

## Troubleshooting

### Common Issues

**Compilation Errors**:
```bash
# Update remappings in foundry.toml
# Reinstall dependencies
forge install --force
```

**Deployment Failures**:
- Check gas limits and prices
- Verify network configuration
- Confirm wallet has sufficient balance
- Check contract size limits

**Verification Issues**:
- Ensure API keys are configured
- Check compiler version matches
- Verify constructor parameters
- Allow time for block confirmations

### Support Resources
- Foundry Documentation: https://book.getfoundry.sh/
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
- EIP Standards: https://eips.ethereum.org/

## Summary

The Foundry integration provides a modern, secure, and efficient smart contract deployment system while maintaining full backward compatibility with existing functionality. The system enables:

- **Enhanced Security**: Modern contract patterns with comprehensive testing
- **Gas Optimization**: Efficient contract bytecode and deployment strategies  
- **Developer Experience**: Streamlined development workflow with Foundry tooling
- **Flexibility**: Support for multiple token standards with configurable features
- **Reliability**: Fallback mechanisms and comprehensive error handling
- **Scalability**: Factory-based deployment and deterministic addresses

This integration positions the platform for future growth while ensuring existing users experience no disruption to their current workflows.
