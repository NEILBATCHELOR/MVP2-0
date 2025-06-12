# `/src/infrastructure/web3/transactions/handlers` — READMEnew.md

This folder contains chain-specific transaction handler classes for Bitcoin, EVM-compatible chains, and Solana. Each handler implements the `TransactionHandler` interface, providing methods to build, sign, send, and check the status of transactions for its blockchain.

---

## Files

- **BitcoinTransactionHandler.ts**
  - Implements transaction building, signing, and sending for Bitcoin.
  - Placeholder logic; real implementation would use `bitcoinjs-lib`.
  - Throws for unsupported operations (e.g., token transfers).

- **EVMTransactionHandler.ts**
  - Handles EVM-compatible transactions (Ethereum, Polygon, etc.).
  - Implements logic for building, signing, sending, and status tracking of native and token transfers.
  - Uses ethers.js for contract and transaction calls.

- **SolanaTransactionHandler.ts**
  - Handles Solana-native and SPL token transactions.
  - Placeholder logic; real implementation would use the Solana SDK.
  - Implements transaction construction, signing, sending, and status/finality checks.

---

## Usage
- Use these handlers via the transaction manager/factory to abstract blockchain-specific transaction logic.
- Extend or replace placeholder logic with full SDK integrations for production use.
- Integrate with transaction monitoring/event systems for real-time status updates.

## Developer Notes
- All handlers implement the `TransactionHandler` interface for consistency.
- Designed for extensibility: add new handlers for additional blockchains as needed.
- Placeholder implementations should be replaced with production-ready SDK logic before deployment.
- Keep documentation (`READMEnew.md`) up to date as handlers are added or updated.

---

### Download Link
- [Download /src/infrastructure/web3/transactions/handlers/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/transactions/handlers/READMEnew.md)
