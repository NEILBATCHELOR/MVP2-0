---
# Chain Capital - Institutional Tokenization Platform

## Overview
Chain Capital is a cutting-edge **blockchain-based financial infrastructure** designed to enable investment professionals to **securitize and tokenize traditional and alternative assets**. By leveraging blockchain technology, Chain Capital facilitates the **creation, issuance, and lifecycle management** of digital financial instruments, including structured products, tokenized credit, and private debt instruments.

---

## 📌 Key Features

### 1. 🚀 **Investor & Issuer Onboarding**
- ✅ Streamlined **KYC/KYB and AML compliance** workflows.
- 🔐 Role-based access control (RBAC) for **multi-party approval mechanisms**.
- 🏦 Customizable onboarding flows for different investment structures.

### 2. 🏗 **Tokenization Engine**
- ⚙️ Supports **ERC-1400, ERC-1155, ERC-3525, ERC-4626**, and **other ERC standards**.
- 🔄 Native integration of **smart contracts** for compliance enforcement.
- 🔄 Mechanisms for **wrapping/swapping ERC-1400 into ERC-20** to enhance liquidity.

### 3. 🔄 **Asset Lifecycle Management**
- 📊 Automated **corporate actions, redemptions, and distributions**.
- 🛡 **Audit-ready activity logs** for complete transparency.
- ✅ Multi-party consensus-driven **policy enforcement**.

### 4. 🏛 **Compliance & Governance**
- 🛡 Integration of **Guardian Compliance Oracles**.
- ⚖️ Real-time **policy enforcement & conditional transfer mechanisms**.
- 🔏 Smart contract-driven **identity verification & investor restrictions**.

### 5. 💹 **Secondary Markets & Liquidity Solutions**
- 🔄 Tokenized **ABCP, CLN, AMCs, ETFs, and structured finance products**.
- 🏦 Automated **cap table management and redemption workflows**.
- 🤝 **Market maker & liquidity provisioning** tools.

---

## 🔧 Supported Use Cases
- 🏦 **Tokenizing Credit & Private Debt** *(e.g., securitization of Cliffwater ICF, TMMF, FRDIT)*
- 📜 **Issuance of Digital Securities** *(e.g., tokenized ETFs, fund share classes, structured products)*
- 🏡 **Alternative Asset Repackaging** *(e.g., real estate, infrastructure, receivables, loans)*
- ⚖️ **Institutional Compliance & Risk Mitigation** *(e.g., AML, KYC, investor eligibility enforcement)*

---

## 📈 Workflow Specifications
Chain Capital provides **detailed workflow designs** for:
- 📌 **Onboarding (Investor & Issuer)**
- 📌 **Issuance (Smart Contract Configuration, Compliance Settings, Token Minting)**
- 📌 **Servicing & Asset Lifecycle Management**
- 📌 **Secondary Trading & Redemption Mechanisms**

---

## 📅 Business Case Studies
Chain Capital has built structured finance solutions for:
- 🔹 **Tokenizing & Securitizing a Forest Road Digital Investment Fund (FRDIT)**
- 🔹 **Tokenizing a 3-Month Money Market Fund (TMMF) for Commerzbank Asset Management**
- 🔹 **Designing a Tokenized ABCP Deal for Medex**
- 🔹 **Structuring a Digital ETF for Invesco**

---

## 🚀 Next Steps
1. ⚙️ **Develop & Optimize Smart Contracts** for financial instrument tokenization.
2. 🔄 **Enhance Liquidity Mechanisms** via integrations with market makers & institutional investors.
3. 🛡 **Deploy Regulatory-Compliant Custody & Risk Controls** to secure institutional adoption.
4. 🌎 **Expand Use Cases to Traditional & Alternative Assets** to maximize real-world applications.

---

## 💡 Get Involved
- 💬 Join our **GitHub discussions** to contribute.
- 📖 Read our **technical documentation** *(coming soon).*
- 🔔 Follow us for **updates on tokenization advancements**.

---

### 🌎 Chain Capital - **Bringing Liquidity to Private Credit & Tokenized Finance** 🚀

# Identity & Wallet Verification Services

This project integrates two powerful verification services for comprehensive identity and wallet security:

1. **Onfido** for digital identity verification and KYC compliance
2. **CUBE3** for crypto wallet risk assessment and transaction security

## 📋 Table of Contents

- [Onfido Integration](#onfido-integration)
  - [Features](#onfido-features)
  - [Implementation](#onfido-implementation)
  - [Usage](#onfido-usage)
- [CUBE3 Integration](#cube3-integration)
  - [Features](#cube3-features)
  - [Implementation](#cube3-implementation)
  - [Usage](#cube3-usage)
- [Setup](#setup)
- [Environment Variables](#environment-variables)

## 🔐 Onfido Integration

The Onfido integration provides a complete digital identity verification solution, powered by Onfido's award-winning AI and document verification technology.

### Onfido Features

- **Document Verification**: Support for a wide range of identity documents (passports, driving licenses, ID cards)
- **Biometric Verification**: Facial similarity checks with liveness detection
- **Global Compliance**: KYC/AML compliance support across multiple jurisdictions
- **Workflow Management**: Complete identity verification workflows with Studio integration
- **Real-time Results**: Fast, fair, and accurate verification powered by Atlas™ AI

### Onfido Implementation

The integration is structured in `src/lib/services/onfidoService.ts` with the following components:

- **Applicant Management**: Create, retrieve, update, and delete applicant records
- **Document Handling**: Upload and manage identity documents
- **Verification Checks**: Create and manage identity verification checks
- **Reports**: Access detailed verification reports
- **Webhooks**: Process verification events asynchronously
- **SDK Integration**: Generate tokens for web/mobile SDK integration
- **Database Integration**: Store verification results in your Supabase database

### Onfido Usage

```typescript
import { startVerification } from "@/lib/services/onfidoService";

// Start a verification process
const verification = await startVerification({
  investorId: "investor-123",
  type: "individual",
  applicantData: {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    dob: "1990-01-01",
    country: "USA"
  }
});

// Check verification status
import { getVerificationStatus } from "@/lib/services/onfidoService";

const status = await getVerificationStatus("investor-123");
```

## 🛡️ CUBE3 Integration

The CUBE3 integration provides wallet risk assessment and transaction security, powered by CUBE3's advanced AI risk engine.

### CUBE3 Features

- **Wallet Risk Assessment**: Check any wallet address for risk indicators
- **Transaction Security**: Verify transaction safety before execution
- **Contract Analysis**: Analyze smart contracts for security vulnerabilities
- **Control Lists**: Maintain your own allowlists and blocklists for addresses
- **Continuous Monitoring**: Set up monitors for addresses of interest
- **Risk Scoring**: Comprehensive risk scores with detailed breakdown
- **Multiple Blockchains**: Support for various blockchain networks (Ethereum, Solana, etc.)
- **Batch Processing**: Check multiple addresses in a single API call
- **Visual Components**: Ready-to-use UI components for displaying risk assessments

### CUBE3 Implementation

The integration is structured across several files:

1. `src/lib/services/cube3Service.ts` - Core API service
   - Address risk checking
   - Transaction verification
   - Contract inspection
   - Control lists management
   - Continuous monitoring
   - Batch processing
   - Risk assessment utilities

2. `src/components/WalletRiskCheck.tsx` - Full-featured risk assessment component
   - Detailed risk display
   - Associated addresses
   - Loading states and error handling

3. `src/components/WalletRiskIndicator.tsx` - Lightweight indicator component
   - Small visual risk indicators
   - Tooltips with risk details
   - Multiple size options

4. `src/components/wallet/ContractRiskCheck.tsx` - Smart contract analysis component
   - Security risk analysis
   - Contract auditing status
   - Vulnerability detection

5. `src/lib/cube3Init.ts` - Initialization utilities
   - Environment-based setup
   - Custom configuration options
   - Debug mode toggle
   - Availability checks

6. `src/lib/utils/cube3TestUtils.ts` - Testing and debugging utilities
   - Sample test addresses

## 🆕 Recent Change: Unified Provider Management for All Blockchains

- The ProviderManager now supports Aptos, NEAR, and Stellar alongside EVM and other chains.
- All adapters receive their provider/client from ProviderManager via BlockchainFactory.
- Health checks and failover logic are now consistent for all supported chains.
- See the Blockchain Integration section for details.

## ⛓️ Blockchain Integration

This project includes adapters and transaction builders for multiple blockchains that enable seamless interaction with various blockchain networks:

### Supported Blockchains

- **Ethereum and EVM-compatible chains**: Polygon, Avalanche, Optimism, Arbitrum, Base, zkSync, Mantle
- **Solana**: For high-performance applications requiring fast transaction throughput
- **Ripple (XRP)**: For cross-border payment solutions and remittances
- **NEAR Protocol**: For user-friendly dApps with low transaction fees

### Installation

To install the required blockchain dependencies, run:

```bash
./install-blockchain-deps.sh
```

This will install the following packages:
- `ripple-lib`: For XRP (Ripple) blockchain integration
- `@solana/web3.js` and `@solana/spl-token`: For Solana blockchain integration
- `near-api-js` and `bn.js`: For NEAR Protocol integration
- `ethers`: For Ethereum and EVM-compatible chains

### Architecture

The blockchain integration is structured in a modular way:

1. **Blockchain Adapters** (`src/lib/web3/adapters/`):
   - Abstract blockchain-specific implementations behind a common interface
   - Provide core blockchain operations like address generation, balance checking, etc.
   - Enable easy addition of new blockchain support

2. **Transaction Builders** (`src/lib/web3/transactions/`):
   - Build, sign, and send transactions in a blockchain-agnostic way
   - Handle fee estimation, transaction simulation, and monitoring
   - Support for advanced operations like transaction cancellation (where supported)

3. **Crypto Utilities** (`src/lib/web3/CryptoUtils.ts`):
   - Generate keypairs for different blockchains
   - Sign and verify messages
   - Format and parse amounts based on blockchain-specific decimals

### Usage

#### Using Blockchain Adapters

```typescript
import { BlockchainFactory } from '@/lib/web3/BlockchainFactory';

// Create an adapter for a specific blockchain
const ethereumAdapter = BlockchainFactory.getAdapter('ethereum');
const solanaAdapter = BlockchainFactory.getAdapter('solana');
const rippleAdapter = BlockchainFactory.getAdapter('ripple');
const nearAdapter = BlockchainFactory.getAdapter('near');

// Common operations across blockchains
const address = await adapter.generateAddress(publicKey);
const balance = await adapter.getBalance(address);
const isValid = adapter.isValidAddress(address);
```

#### Using Transaction Builders

```typescript
import { BlockchainType, TransactionBuilderFactory } from '@/lib/web3/transactions/TransactionBuilderFactory';
import { TransactionPriority } from '@/lib/web3/transactions/TransactionBuilder';

// Create a transaction builder for a specific blockchain
const ethereumBuilder = TransactionBuilderFactory.createTransactionBuilder(
  BlockchainType.ETHEREUM,
  provider
);

// Build a transaction
const transaction = await ethereumBuilder.buildTransaction(
  fromAddress,
  toAddress,
  '1.0', // Amount
  '0x' // Data (optional)
);

// Estimate fee
const feeEstimate = await ethereumBuilder.estimateFee(transaction);
console.log(`Low fee: ${feeEstimate.low.fee}, time: ${feeEstimate.low.time}s`);
console.log(`Medium fee: ${feeEstimate.medium.fee}, time: ${feeEstimate.medium.time}s`);
console.log(`High fee: ${feeEstimate.high.fee}, time: ${feeEstimate.high.time}s`);

// Sign the transaction
const signedTransaction = await ethereumBuilder.signTransaction(transaction, privateKey);

// Send the transaction
const txHash = await ethereumBuilder.sendTransaction(signedTransaction);

// Wait for confirmation
const receipt = await ethereumBuilder.waitForTransaction(txHash);
```

### Multi-Chain Provider Management (Aptos, NEAR, Stellar)

The provider management system now supports **Aptos**, **NEAR**, and **Stellar** in addition to EVM and other chains. Key points:

- All provider configuration is centralized in `ProviderManager`.
- Adapters for each chain (e.g., `AptosAdapter`, `NEARAdapter`, `StellarAdapter`) are instantiated by `BlockchainFactory`, which extracts the correct provider/client and network from ProviderManager.
- Health checks and failover are handled by ProviderManager for all chains, including non-EVM.
- To add a new chain: add network config and provider logic to ProviderManager, create/update the adapter, and register it in BlockchainFactory.

**Environment Variables for New Chains:**
```
VITE_APTOS_RPC_URL_MAINNET_1=https://fullnode.mainnet.aptoslabs.com/v1
VITE_APTOS_RPC_URL_TESTNET_1=https://fullnode.testnet.aptoslabs.com/v1
VITE_STELLAR_RPC_URL_MAINNET_1=https://horizon.stellar.org
VITE_STELLAR_RPC_URL_TESTNET_1=https://horizon-testnet.stellar.org
VITE_NEAR_RPC_URL_MAINNET_1=https://rpc.mainnet.near.org
VITE_NEAR_RPC_URL_TESTNET_1=https://rpc.testnet.near.org
```

Adapters are in `src/infrastructure/web3/adapters/`.

## 🔧 Setup

1. Install required packages:
   ```bash
   npm install
   ```

2. Configure your environment variables (see below)

3. Initialize services in your app:
   ```typescript
   // In _app.tsx or similar
   import { initializeCube3 } from "@/lib/cube3Init";
   
   // Initialize services
   initializeCube3();
   ```

4. Add the Edge Functions for Onfido to your Supabase project

## 🔑 Environment Variables

Create a `.env.local` file with the following variables:

```
# Onfido API credentials
NEXT_PUBLIC_ONFIDO_API_URL=https://api.onfido.com/v3
ONFIDO_API_TOKEN=your_onfido_api_token

# CUBE3 API credentials
NEXT_PUBLIC_CUBE3_API_KEY=your_cube3_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📚 Documentation

- [Onfido Documentation](https://documentation.onfido.com/)
- [CUBE3 Documentation](https://docs.cube3.ai/)

## API Server

The application includes a REST API server built with Express. The API endpoints are organized under the `/api` route and include versioning.

### API Routes

- `/api/v1/policies` - CRUD operations for policies
- `/api/v1/templates` - Operations for policy templates
- `/api/health` - Health check endpoint

### Running the API Server

To run the API server in development mode:

```bash
npm run server:dev
```

To run both the frontend and API server together:

```bash
npm run dev:all
```

### Building for Production

To build both the frontend and API server:

```bash
npm run build:all
```

# Wallet & MultiSig Component Updates

This repository contains the implementation of improved wallet transaction UI and MultiSig operations for the Chain Capital platform.

## Implemented Features

### UI/UX Improvements

1. **Transaction Confirmation Component**
   - Created a reusable `TransactionConfirmation` component
   - Handles different transaction states (pending, confirmed, failed)
   - Shows detailed transaction information
   - Provides external explorer links
   - Implements copy-to-clipboard functionality

2. **Error Handling**
   - Added comprehensive `ErrorDisplay` component
   - User-friendly error messages for common blockchain issues
   - Provides suggestions for resolving common problems
   - Support for both compact and detailed error displays
   - Technical error details available but hidden by default

3. **MultiSig Confirmation Flow**
   - Implemented `MultiSigTransactionConfirmation` component
   - Displays signature collection progress
   - Shows all signers and their status
   - Provides functionality to sign and share transactions
   - Real-time updates of confirmation status

### Backend Enhancements

1. **MultiSigWalletManager Improvements**
   - Added `getTransaction` method to fetch specific transactions
   - Comprehensive test suite for MultiSigWalletManager
   - Support for multiple blockchain environments

2. **Transaction Monitoring**
   - Fixed and enhanced transaction monitoring services
   - Added proper type definitions for transactions and notifications
   - Implemented polling for transaction status updates

## Usage

### Transaction Confirmation

```tsx
import { TransactionConfirmation } from '@/components/wallet/components/TransactionConfirmation';

// In your component:
<TransactionConfirmation
  txHash="0x1234..."
  status="pending" // or 'confirmed', 'failed', 'none'
  title="Transfer in Progress"
  description="Your transfer is being processed on the blockchain"
  details={{
    from: "0xYourWallet",
    to: "0xRecipientWallet",
    amount: "1.5",
    asset: "ETH",
    fee: "0.005 ETH",
    timestamp: new Date().toISOString()
  }}
  onBack={() => navigate('/wallet')}
  onRetry={handleRetry}
/>
```

### Error Display

```tsx
import { ErrorDisplay, ERROR_CODES } from '@/components/wallet/components/ErrorDisplay';

// In your component:
<ErrorDisplay
  error={error}
  errorCode="INSUFFICIENT_FUNDS" // or any key from ERROR_CODES
  onRetry={handleRetry}
  onBack={handleGoBack}
  compact={false} // true for inline display
/>
```

### MultiSig Transaction Confirmation

```tsx
import { MultiSigTransactionConfirmation } from '@/components/wallet/components/multisig/MultiSigTransactionConfirmation';

// In your component:
<MultiSigTransactionConfirmation
  transactionId="tx-123"
  walletId="wallet-456"
  txHash="0x1234..."
  title="MultiSig Transfer"
  description="This transaction requires multiple signatures"
  threshold={2}
  owners={['0xowner1', '0xowner2', '0xowner3']}
  canSign={true}
  onSignTransaction={handleSign}
  onShareTransaction={handleShare}
  onBack={handleBack}
  details={{
    from: "0xMultiSigWallet",
    to: "0xRecipient",
    amount: "10",
    asset: "USDC"
  }}
/>
```

## Remaining Tasks

### UI/UX Completion

1. **SwapPage.tsx**
   - Integrate the new confirmation component
   - Implement error handling using the new ErrorDisplay
   - Add improved input validation

2. **TransferPage.tsx**
   - Integrate the new confirmation component
   - Implement error handling using the new ErrorDisplay
   - Add address book functionality

3. **General UI Polish**
   - Add loading state indicators
   - Improve responsive design for mobile
   - Add animation transitions between states

### MultiSig Implementation

1. **Complete UI Flows**
   - Implement signature collection page
   - Create transaction share functionality
   - Add multi-signer dashboard

2. **Testing and Validation**
   - Complete remaining test cases
   - Add integration tests for UI components
   - Test with different wallet providers

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Run tests:
```bash
npm test
```