# Enhanced DEX Integration

This implementation adds robust DEX integration features to the swap service, enabling direct interaction with smart contracts, optimal routing, liquidity pool data fetching, and improved price impact calculations.

## Features Added

### 1. Direct DEX Smart Contract Integration

- Added contract interfaces for Uniswap V2 Router and Pairs
- Implemented direct swap execution through smart contracts
- Added token approval management
- Integrated with wallet providers through ethers.js

### 2. Advanced Routing Implementation

- Created route optimizer service for finding optimal trade paths
- Added support for multi-hop routing (e.g., Token A → Token B → Token C)
- Implemented split routes to minimize price impact for large trades
- Dynamically selected the best DEX for each trade

### 3. Liquidity Pool Data Management

- Built pool data service for fetching and caching pool information
- Implemented methods to retrieve pool reserves, fees, and liquidity
- Created types to represent pool data across different DEXes

### 4. Price Impact and Slippage Protection

- Added accurate price impact calculations based on actual pool reserves
- Implemented functions to determine optimal trade size
- Added dynamic slippage recommendations based on liquidity
- Included safety checks for high-impact trades

## Architecture

```
src/services/wallet/
├── abi/                       # Contract ABIs
│   └── uniswapV2Router.json   # Uniswap V2 Router ABI
├── contracts/                 # Contract interfaces
│   └── uniswapContracts.ts    # Contract factories and utilities
├── pools/                     # Liquidity pool services
│   └── poolDataService.ts     # Pool data fetching and management
├── routing/                   # Routing services
│   └── routeOptimizer.ts      # Finding optimal swap routes
└── SwapService.ts             # Main service with enhanced methods
```

## Usage Examples

### Fetching Pool Data

```typescript
const poolData = await swapService.getPoolData(fromToken, toToken);
console.log(`Liquidity: ${poolData.liquidity}`);
console.log(`Fee: ${poolData.fee * 100}%`);
```

### Finding Optimal Routes

```typescript
const route = await swapService.findOptimalRoutes(
  fromToken, 
  toToken, 
  "1.5", // Amount
  1.0    // Max slippage percentage
);

console.log(`Expected output: ${route.expectedOutput}`);
console.log(`Price impact: ${route.priceImpact}%`);
```

### Executing an Optimized Swap

```typescript
const txHash = await swapService.executeOptimizedSwap(
  fromToken,
  toToken,
  "1.5",  // Amount
  1.0,    // Slippage percentage
  20,     // Deadline (minutes)
  "medium" // Gas option
);

console.log(`Transaction hash: ${txHash}`);
```

### Getting Recommended Slippage

```typescript
const slippage = await swapService.getRecommendedSlippage(fromToken, toToken);
console.log(`Recommended slippage: ${slippage}%`);
```

## Future Enhancements

1. Add support for Uniswap V3 concentrated liquidity positions
2. Implement gas cost optimization for complex routes
3. Add support for more DEXes (Balancer, Curve, etc.)
4. Integrate with TheGraph for historical liquidity data
5. Implement cross-chain bridge integration for multi-chain swaps

# Wallet Services

This directory contains wallet-related services for managing cryptocurrency wallets, transactions, and swaps.

## Multi-Signature Wallet Support

The wallet services include comprehensive support for multi-signature wallets, which require multiple approvals before executing transactions. This is essential for institutional-grade security.

### Schema

The multi-signature wallet system uses the following database tables:

- `multi_sig_wallets`: Stores wallet details including threshold, owners, and blockchain information
- `multi_sig_transactions`: Stores transaction details for multi-sig wallets
- `multi_sig_confirmations`: Stores signatures/confirmations from wallet owners

### Services

#### MultiSigWalletService

The `MultiSigWalletService` provides functions for managing multi-signature wallets:

- `isMultiSigWallet`: Check if a given address is a multi-signature wallet
- `getMultiSigWalletDetails`: Get detailed information about a multi-signature wallet
- `getPendingTransactions`: Get all pending transactions for a wallet
- `signTransaction`: Sign a multi-signature transaction
- `executeTransaction`: Execute a transaction that has reached its threshold of signatures
- `getTransactionById`: Get details about a specific transaction
- `getWalletOwners`: Get all owners of a multi-signature wallet

#### SwapService

The `SwapService` handles token swaps with support for multi-signature wallets:

- Detects if the source wallet is a multi-signature wallet
- Creates a multi-signature transaction proposal when swapping from a multi-sig wallet
- Returns the multi-signature transaction ID in the response
- Supports multiple DEX aggregators (0x, 1inch)
- Provides price quotes, gas estimates, and slippage calculations

### Usage Example

```typescript
// Check if a wallet is multi-signature
const isMultiSig = await isMultiSigWallet("0x123...abc");

// Perform a swap
const result = await executeSwap({
  fromTokenAddress: "0xabc...123",
  toTokenAddress: "0xdef...456",
  amount: "100",
  fromAddress: "0x123...abc",
  slippage: "0.5",
  route: [...],
  // isMultiSig is optional - if not provided, it will be detected automatically
});

// For regular wallets, result will just have a transaction hash
console.log(result.txHash);

// For multi-signature wallets, it will also have a multiSigTxId
if (result.multiSigTxId) {
  // This transaction needs signatures from the wallet owners
  console.log(`Multi-sig transaction ID: ${result.multiSigTxId}`);
  
  // Getting pending transactions for the wallet
  const wallet = await getMultiSigWalletDetails("0x123...abc");
  const pendingTxs = await getPendingTransactions(wallet.id);
  
  // Signing the transaction (by each owner)
  await signTransaction(
    result.multiSigTxId,
    "0xowner1...address",
    "0xsignature..."
  );
  
  // Once enough signatures are collected, execute the transaction
  const txHash = await executeTransaction(result.multiSigTxId);
}
```

### Integration with Other Components

The multi-signature wallet functionality integrates with:

1. The wallet management UI, which shows pending transactions that need signatures
2. The transaction history UI, which shows the status of multi-signature transactions
3. The DEX aggregator service, which finds the best swap routes
4. The blockchain service, which submits transactions to the network

### Security Considerations

- Threshold security: Requires a minimum number of signatures to execute transactions
- On-chain verification: All signatures are verified on the blockchain before execution
- Ownership verification: Only registered owners can sign transactions
- Separation of duties: Different owners can have different roles (proposer, reviewer, etc.)

## EVM Multi-Sig Test Harness

We provided three test harness scripts in this folder to validate the EVM adapter flows:

- `testEvmMultiSig.cjs` — CommonJS script using ts-node register.
- `testEvmMultiSig.mts` — ESM script requiring the `.mts` extension.
- `testEvmMultiSig.ts` — ESM script for ts-node execution.

Each script performs:
1. Connection to Sepolia via `VITE_SEPOLIA_RPC_URL`.
2. Deployment of a multi-sig wallet with two random owners (threshold = 2).
3. Proposal and execution of a transaction on-chain.
4. Logging of addresses, transaction IDs, and on-chain transaction hashes.

### Usage Examples

**CommonJS (Node.js):**
```bash
node src/services/wallet/testEvmMultiSig.cjs
```

**ESM (.mts):**
```bash
node --loader ts-node/esm -r dotenv/config src/services/wallet/testEvmMultiSig.mts
```

**ESM (.ts) via ts-node:**
```bash
npx ts-node -r dotenv/config src/services/wallet/testEvmMultiSig.ts
```

Make sure the following env vars are defined in your `.env`:
- `VITE_SEPOLIA_RPC_URL`
- `VITE_GOERLI_FACTORY_ADDRESS`
