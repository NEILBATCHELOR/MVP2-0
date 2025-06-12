# infrastructure/web3/transactions — READMEnew.md

This folder provides a modular framework for building, signing, sending, and monitoring blockchain transactions across multiple chains. It includes builders, handlers, monitors, and factories for Ethereum, Solana, NEAR, Ripple, Bitcoin, and EVM-compatible networks.

## Files

### TransactionBuilder.ts
- **BaseTransactionBuilder** (abstract class): Common base for all transaction builders.
- **TransactionBuilder** (interface): Unified interface for transaction construction, signing, and sending.
- **Transaction**, **TransactionFeeEstimate**, **SignedTransaction**, **TransactionStatus**, etc.: Types and interfaces for transaction flows.

### EthereumTransactionBuilder.ts, SolanaTransactionBuilder.ts, NEARTransactionBuilder.ts, RippleTransactionBuilder.ts
- **[Chain]TransactionBuilder** (classes): Chain-specific implementations for building, simulating, signing, and sending transactions.

### TransactionBuilderFactory.ts
- **TransactionBuilderFactory** (class): Factory for instantiating the correct builder per blockchain.

### TransactionHandler.ts
- **TransactionHandler** (interface): Unified interface for transaction handling (build, sign, send, status, fee estimate).

### TransactionMonitor.ts
- **TransactionMonitor** (class): Monitors transaction status and confirmations, emits events, and manages listeners.
- **DefaultTransactionListener**: No-op implementation of transaction event hooks.

### handlers/
- **BitcoinTransactionHandler.ts, EVMTransactionHandler.ts, SolanaTransactionHandler.ts**: Handlers for chain-specific transaction logic and status.

### index.ts
- Barrel export for transaction modules.

## Usage
- Use `TransactionBuilderFactory` to obtain the correct builder for a blockchain.
- Use builders and handlers to construct, sign, send, and monitor transactions in a unified, chain-agnostic way.
- Integrate `TransactionMonitor` for event-driven status updates in UI or workflows.

## Developer Notes
- All builders and handlers are async and use relevant SDKs (ethers.js, Solana SDK, etc.).
- Placeholder implementations exist for some builders/handlers; extend for production logic.
- Designed for extensibility to support additional blockchains and transaction types.
- Types and interfaces are unified for easier cross-chain integration.

---

### Download Link
- [Download /src/infrastructure/web3/transactions/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/transactions/READMEnew.md)
