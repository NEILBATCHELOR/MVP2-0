# Chain Capital - Technical Design & XRPL Integration

## System Overview

Chain Capital is a cutting-edge **blockchain-based financial infrastructure** designed to enable investment professionals to **securitize and tokenize traditional and alternative assets**. The platform leverages a multi-blockchain architecture to facilitate the creation, issuance, and lifecycle management of digital financial instruments across multiple blockchain networks including **XRP Ledger (XRPL)**.

## Architecture Overview

### High-Level System Architecture

---
config:
  look: handDrawn
  layout: dagre
  theme: base
---
flowchart TB
 subgraph subGraph0["Frontend Layer"]
        UI["React UI<br>Components"]
        Forms["Dynamic Forms<br>Engine"]
        Dash["Management<br>Dashboards"]
  end
 subgraph subGraph1["Application Layer"]
        Auth["Authentication<br>Service"]
        Comp["Compliance<br>Engine"]
        Token["Token<br>Management"]
        Multi["Multi-Sig<br>Wallets"]
  end
 subgraph OpsGroup["Operations"]
    direction LR
        Pause["Pause"]
        Block["Block"]
        Lock["Lock"]
        ForceTransfer["Force<br>Transfer"]
        Transfer["Transfer"]
        Burn["Burn"]
        Mint["Mint"]
  end
 subgraph subGraph2["Blockchain Abstraction Layer"]
        Factory["Blockchain<br>Factory"]
        Adapters["Blockchain<br>Adapters"]
        TxBuilders["Transaction<br>Builders"]
        Provider["Provider<br>Manager"]
        TokenEngine["Multi-Standard<br>Tokenization Engine"]
        Contract["Contract<br>Deployment"]
        ProductConfig["Product<br>Configuration"]
        OpsGroup
  end
 subgraph TradAssets["Traditional<br>Assets"]
        EquitiesGroup["Equities"]
        Eq["Equity"]
        SP["Structured<br>Products"]
        Comm["Commodities"]
        Funds["Funds,<br>ETFs, ETPs"]
        Bonds["Bonds"]
        QIS["Quantitative<br>Investment Strategies"]
  end
 subgraph AltAssets["Alternative<br>Assets"]
        RealWorld["Real World<br>Assets"]
        PD["Private<br>Debt"]
        RE["Real Estate"]
        PE["Private<br>Equity"]
        Energy["Energy"]
        Infra["Infrastructure"]
        Coll["Collectibles &amp;<br>Other Assets"]
        ABS["Asset-Backed /<br>Invoice Receivables"]
        Solar["Solar &amp; Wind<br>Climate Receivables"]
  end
 subgraph DigitalAssets["Digital<br>Assets"]
        DTF["Digital<br>Tokenised Fund"]
        Stablecoins["Stablecoins"]
  end
 subgraph subGraph3["Supported Blockchains"]
        ETH["Ethereum"]
        POLY["Polygon"]
        SOL["Solana"]
        XRP["XRP<br>Ledger"]
        NEAR["NEAR<br>Protocol"]
        STELLAR["Stellar"]
        BTC["Bitcoin"]
        APTOS["Aptos"]
        SUI["Sui"]
  end
 subgraph subGraph4["Data Layer"]
        SUPABASE[("Supabase<br>Database")]
        STORAGE["Document<br>Storage"]
        AUDIT["Audit Logs"]
  end
 subgraph subGraph5["External Services"]
        ONFIDO["Onfido<br>KYC"]
        GUARDIAN["Guardian Policy<br>Enforcement"]
        CUBE3["CUBE3<br>Risk"]
  end
    Factory --> TokenEngine & Contract & ETH & POLY & SOL & XRP & NEAR & STELLAR & BTC & APTOS & SUI
    TokenEngine -- Manages --> ProductConfig
    TokenEngine -- Executes --> OpsGroup
    Mint --> Burn
    Burn --> Transfer
    Transfer --> ForceTransfer
    ForceTransfer --> Lock
    Lock --> Block
    Block --> Pause
    ProductConfig --> TradAssets & AltAssets & DigitalAssets
    UI --> Auth
    Forms --> Token
    Dash --> Multi
    Auth --> Factory & SUPABASE & CUBE3
    Comp --> Adapters & ONFIDO & GUARDIAN
    Token --> TxBuilders & STORAGE
    Multi --> Provider & AUDIT
    Provider --> GuardianWallet["Guardian<br>Wallet"] & DFNS["DFNS"] & RippleDirect["Ripple Payments<br>Direct"] & RippleODL["Ripple Payments<br>ODL"] & RippleCustody["Ripple<br>Custody"] & RippleStablecoin["Ripple<br>Stablecoins"]
     TokenEngine:::tokenColor
     ProductConfig:::configColor
    classDef tokenColor fill:#e0f7fa,stroke:#00796b,stroke-width:1px
    classDef configColor fill:#fff9c4,stroke:#fbc02d,stroke-width:1px
    classDef opsColor fill:#ffe0b2,stroke:#fb8c00,stroke-width:1px
    classDef assetColor fill:#ede7f6,stroke:#5e35b1,stroke-width:1px


## Technology Stack

### Core Framework
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Shadcn/ui + Tailwind CSS
- **State Management**: React Query + Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Multi-Factor Authentication

### Blockchain Infrastructure
- **Ethereum & EVM**: ethers.js v6.13.7
- **XRP Ledger**: xrpl.js v4.2.5
- **Solana**: @solana/web3.js v1.98.2
- **NEAR Protocol**: near-api-js v5.1.1
- **Stellar**: stellar-sdk v13.3.0
- **Aptos**: @aptos-labs/ts-sdk v2.0.1
- **Bitcoin**: bitcoinjs-lib v6.1.7

### Key Libraries
- **Compliance**: Onfido SDK, Guardian Oracles
- **Security**: CUBE3 Risk Assessment
- **Forms**: React Hook Form + Zod validation
- **File Processing**: Tesseract.js, Sharp, PDF-lib
- **Cryptography**: @noble/curves, @noble/hashes

## Code Organization

### Directory Structure
```
src/
├── components/           # React components organized by domain
│   ├── auth/            # Authentication components
│   ├── compliance/      # KYC/AML compliance
│   ├── tokens/          # Token management interfaces
│   ├── wallet/          # Wallet and transaction UIs
│   └── dashboard/       # Management dashboards
├── infrastructure/      # Core infrastructure services
│   ├── web3/           # Blockchain integration layer
│   │   ├── adapters/   # Blockchain-specific adapters
│   │   ├── transactions/ # Transaction builders
│   │   ├── tokens/     # Token standard implementations
│   │   └── wallet/     # Wallet management
│   ├── auth/           # Authentication services
│   ├── compliance/     # Compliance and KYC services
│   └── database/       # Database utilities
├── types/              # TypeScript type definitions
│   ├── domain/         # Domain-specific types
│   ├── core/           # Core system types
│   └── web3/           # Blockchain types
└── pages/              # Application pages and routing
```

## XRPL Integration Architecture

### XRP Ledger Implementation

The XRPL integration follows the same adapter pattern as other blockchains, providing a unified interface for XRP operations.

#### RippleAdapter Implementation
```typescript
export class RippleAdapter implements IBlockchainAdapter {
  private client: xrpl.Client;
  private wallet: xrpl.Wallet;
  private network: string;

  readonly chainId = 'xrp-mainnet';
  readonly chainName = 'Ripple';
  readonly nativeCurrency = {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 6
  };

  // Core blockchain operations
  async connect(config?: any): Promise<void>
  async getBalance(address: string): Promise<bigint>
  async sendTransaction(params: any): Promise<any>
  async signTransaction(transactionJson: string, privateKey: string): Promise<string>
  
  // XRP-specific operations
  async proposePayment(from: string, to: string, value: string): Promise<string>
  async proposeTokenTransaction(from: string, to: string, tokenAddress: string, amount: string): Promise<string>
}
```

#### XRP Transaction Builder
```typescript
export class RippleTransactionBuilder extends BaseTransactionBuilder {
  async buildTransaction(from: string, to: string, value: string): Promise<Transaction>
  async estimateFee(transaction: Transaction): Promise<TransactionFeeEstimate>
  async signTransaction(transaction: Transaction, privateKey: string): Promise<SignedTransaction>
  async sendTransaction(transaction: SignedTransaction): Promise<string>
  async waitForTransaction(hash: string, confirmations?: number): Promise<TransactionReceipt>
}
```

### XRPL Features Supported

#### 1. Payment Transactions
- **XRP Transfers**: Native XRP payments between addresses
- **Token Transfers**: Custom token transfers using trust lines
- **Cross-Border Payments**: Multi-hop payments through the XRPL DEX
- **Conditional Payments**: Escrow and payment channels

#### 2. Address Management
- **Address Generation**: Create new XRPL addresses
- **Address Validation**: Validate classic and X-address formats
- **Multi-Signature**: Support for XRPL SignerList functionality
- **Key Management**: Secure private key storage and operations

#### 3. Token Operations
- **Trust Lines**: Manage token trust relationships
- **Token Issuance**: Create and issue custom tokens on XRPL
- **DEX Integration**: Automated market making and trading
- **Rippling**: Control token rippling behavior

#### 4. Advanced Features
- **Payment Channels**: Streaming payments and micropayments
- **Escrow**: Time-locked and condition-based payments
- **Checks**: Delayed payment authorization
- **NFTs**: Non-fungible token support on XRPL

### XRPL Network Configuration

#### Environment Variables
```bash
# XRPL Network Configuration
VITE_RIPPLE_RPC_URL_MAINNET=wss://xrplcluster.com
VITE_RIPPLE_RPC_URL_TESTNET=wss://s.altnet.rippletest.net:51233

# XRPL Service Configuration
VITE_RIPPLE_EXPLORER_URL=https://livenet.xrpl.org
VITE_RIPPLE_TESTNET_EXPLORER=https://testnet.xrpl.org

# Ripple Payments API (Optional)
VITE_RIPPLE_CLIENT_ID=your_client_id
VITE_RIPPLE_CLIENT_SECRET=your_client_secret
VITE_RIPPLE_TENANT_ID=your_tenant_id
```

#### Network Definitions
```typescript
const XRPL_NETWORKS = {
  mainnet: {
    rpcUrl: 'wss://xrplcluster.com',
    explorerUrl: 'https://livenet.xrpl.org',
    chainId: 'ripple-mainnet',
    nativeCurrency: { name: 'XRP', symbol: 'XRP', decimals: 6 }
  },
  testnet: {
    rpcUrl: 'wss://s.altnet.rippletest.net:51233',
    explorerUrl: 'https://testnet.xrpl.org',
    chainId: 'ripple-testnet',
    nativeCurrency: { name: 'Test XRP', symbol: 'XRP', decimals: 6 }
  }
};
```

## Multi-Chain Architecture

### Blockchain Factory Pattern

The system uses a factory pattern to create and manage blockchain adapters:

```typescript
export class BlockchainFactory {
  static async createAdapter(
    chain: SupportedChain, 
    networkType: NetworkType = 'mainnet'
  ): Promise<IBlockchainAdapter> {
    switch (chain) {
      case 'ethereum':
        return new EthereumAdapter(networkType);
      case 'ripple':
        return new RippleAdapter(networkType);
      case 'solana':
        return new SolanaAdapter(networkType);
      // ... other chains
    }
  }
}
```

### Supported Blockchain Networks

| Chain | Mainnet | Testnet | Standards Supported |
|-------|---------|---------|-------------------|
| Ethereum | ✅ | ✅ (Sepolia) | ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626 |
| Polygon | ✅ | ✅ (Amoy) | ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626 |
| **XRP Ledger** | ✅ | ✅ | Native XRP, Custom Tokens, NFTs |
| Solana | ✅ | ✅ (Devnet) | SPL Tokens, Metaplex NFTs |
| Bitcoin | ✅ | ✅ | Native BTC, Ordinals |
| NEAR Protocol | ✅ | ✅ | NEP-141, NEP-171 |
| Stellar | ✅ | ✅ | Stellar Assets |
| Aptos | ✅ | ✅ | Aptos Tokens |
| Sui | ✅ | ✅ | Sui Objects |

### Transaction Builder Architecture

Each blockchain has its own transaction builder implementing a common interface:

```typescript
interface TransactionBuilder {
  buildTransaction(from: string, to: string, value: string, data?: string): Promise<Transaction>
  estimateFee(transaction: Transaction): Promise<TransactionFeeEstimate>
  signTransaction(transaction: Transaction, privateKey: string): Promise<SignedTransaction>
  sendTransaction(transaction: SignedTransaction): Promise<string>
  waitForTransaction(hash: string, confirmations?: number): Promise<TransactionReceipt>
}
```

## Database Schema

### Multi-Blockchain Wallet Support

```sql
CREATE TABLE multi_sig_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  blockchain TEXT NOT NULL CHECK (blockchain IN (
    'ethereum', 'polygon', 'avalanche', 'optimism', 'solana', 
    'bitcoin', 'ripple', 'aptos', 'sui', 'mantle', 'stellar', 
    'hedera', 'base', 'zksync', 'arbitrum', 'near'
  )),
  address TEXT NOT NULL,
  owners TEXT[] NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

### Token Management Schema

```sql
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  standard TEXT NOT NULL, -- ERC-20, ERC-721, ERC-1155, etc.
  status TEXT NOT NULL DEFAULT 'DRAFT',
  decimals INTEGER,
  total_supply TEXT,
  blockchain TEXT NOT NULL, -- Target blockchain
  -- Feature flags for different token standards
  is_mintable BOOLEAN DEFAULT TRUE,
  is_burnable BOOLEAN DEFAULT FALSE,
  is_pausable BOOLEAN DEFAULT FALSE,
  is_snapshottable BOOLEAN DEFAULT FALSE,
  -- Metadata and configuration
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### XRP-Specific Tables

```sql
-- XRP payment tracking
CREATE TABLE ripple_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  sender_address VARCHAR(255) NOT NULL,
  recipient_address VARCHAR(255) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'XRP',
  destination_tag INTEGER,
  source_tag INTEGER,
  fee DECIMAL(20,8),
  status VARCHAR(50) NOT NULL,
  ledger_index INTEGER,
  transaction_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XRP trust lines for custom tokens
CREATE TABLE ripple_trust_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_address VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  issuer_address VARCHAR(255) NOT NULL,
  limit_amount DECIMAL(20,8),
  balance DECIMAL(20,8) DEFAULT 0,
  authorized BOOLEAN DEFAULT FALSE,
  frozen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_address, currency, issuer_address)
);
```

## Token Standards Implementation

### Supported ERC Standards

#### ERC-20 (Fungible Tokens)
- Basic transfer functionality
- Allowance mechanism
- Mintable/Burnable extensions
- Pausable functionality
- Snapshot capabilities

#### ERC-721 (Non-Fungible Tokens)
- Unique token ownership
- Transfer approvals
- Metadata URIs
- Enumerable extension
- URI storage extension

#### ERC-1155 (Multi-Token)
- Batch operations
- Multiple token types in single contract
- Efficient transfers
- Metadata per token type

#### ERC-1400 (Security Tokens)
- Regulatory compliance
- Forced transfers for compliance
- Document management
- Controller operations
- Partition-based balances

#### ERC-3525 (Semi-Fungible Tokens)
- Value-based NFTs
- Slot-based categorization
- Fractional ownership
- Advanced metadata

#### ERC-4626 (Tokenized Vaults)
- Yield-bearing tokens
- Share-based accounting
- Deposit/withdrawal mechanics
- Vault strategies

### XRP Ledger Token Implementation

#### Native XRP Operations
```typescript
// XRP payment
const payment: xrpl.Payment = {
  TransactionType: "Payment",
  Account: fromAddress,
  Amount: xrpl.xrpToDrops(amount),
  Destination: toAddress,
  DestinationTag: destinationTag
};
```

#### Custom Token Operations
```typescript
// Token payment using trust lines
const tokenPayment: xrpl.Payment = {
  TransactionType: "Payment",
  Account: fromAddress,
  Amount: {
    currency: tokenCurrency,
    issuer: tokenIssuer,
    value: amount
  },
  Destination: toAddress
};
```

## Security Features

### Multi-Signature Wallet Support

#### EVM Chains
- Safe (formerly Gnosis Safe) integration
- Custom multi-sig contracts
- Threshold-based approvals
- Time-locked transactions

#### XRP Ledger
- SignerList functionality
- Multi-signature transaction signing
- Weighted voting
- Master key disable

#### Bitcoin
- P2SH multi-signature
- Threshold signatures
- Hardware wallet integration

### Compliance & KYC Integration

#### Onfido Integration
```typescript
export class OnfidoService {
  async startVerification(investorData: InvestorData): Promise<VerificationResult>
  async getVerificationStatus(investorId: string): Promise<VerificationStatus>
  async handleWebhook(event: OnfidoEvent): Promise<void>
}
```

#### Guardian Compliance Oracles
- Real-time policy enforcement
- Automated compliance checks
- Identity verification
- Transaction monitoring

#### CUBE3 Risk Assessment
- Wallet risk scoring
- Transaction security analysis
- Address reputation checking
- Smart contract auditing

## API Integration Points

### XRPL-Specific Integrations

#### Direct XRPL Node Access
- WebSocket connections to XRPL nodes
- Real-time ledger subscription
- Transaction submission
- Account monitoring

#### Ripple Payments API
- OAuth2 authentication
- Payment orchestration
- Cross-border payments
- ODL (On-Demand Liquidity)
- Identity management
- Compliance reporting

### External Service APIs

#### KYC/AML Services
- Onfido document verification
- Identity validation workflows
- Risk assessment integration

#### Market Data
- CoinGecko price feeds
- Real-time market data
- Historical price data

#### Fiat On/Off Ramps
- MoonPay integration
- Ramp Network support
- Bank transfer processing

## Development Workflow

### Environment Configuration

#### Development Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Run blockchain services
npm run server:dev
```

#### Testing Strategy
```bash
# Unit tests
npm test

# Integration tests with blockchain testnets
npm run test:integration

# End-to-end testing
npm run test:e2e
```

### Deployment Pipeline

#### Build Process
```bash
# Build frontend and backend
npm run build:all

# Type checking
npm run types:validate

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## Performance Considerations

### Blockchain Optimization

#### Connection Management
- Connection pooling for RPC providers
- Failover mechanisms for node outages
- Load balancing across multiple providers

#### Transaction Optimization
- Batch transaction processing
- Gas optimization for EVM chains
- Fee estimation and management

#### Caching Strategy
- Provider connection caching
- Transaction status caching
- Account balance caching

### XRPL-Specific Optimizations

#### Efficient XRPL Operations
- WebSocket connection reuse
- Ledger subscription management
- Trust line optimization
- Payment path finding

#### XRP Transaction Features
- Payment channels for micropayments
- Escrow for conditional payments
- Checks for deferred payments

## Security Best Practices

### Private Key Management
- Hardware security module (HSM) integration
- Encrypted key storage
- Multi-party computation (MPC)
- Key rotation policies

### Smart Contract Security
- Comprehensive testing
- Security audits
- Formal verification
- Bug bounty programs

### Infrastructure Security
- API rate limiting
- DDoS protection
- Encryption at rest and in transit
- Regular security assessments

## Monitoring & Observability

### Application Monitoring
- Real-time error tracking
- Performance metrics
- User analytics
- Business metrics

### Blockchain Monitoring
- Transaction success rates
- Gas usage optimization
- Network health monitoring
- Smart contract events

### XRPL Monitoring
- Ledger close monitoring
- Payment success tracking
- Trust line management
- Network consensus health

## Future Enhancements

### Planned Features
- Advanced DeFi integrations
- Cross-chain bridging
- Institutional custody solutions
- Automated compliance reporting
- Enhanced tokenization features

### XRPL Roadmap
- Hooks smart contract integration
- Advanced DEX features
- Cross-border payment optimization
- Central Bank Digital Currency (CBDC) support

---

**Chain Capital** represents a comprehensive institutional-grade platform for blockchain-based financial services, with robust XRPL integration providing enterprises with the tools needed for digital asset management, compliance, and cross-border payments in the evolving financial landscape.