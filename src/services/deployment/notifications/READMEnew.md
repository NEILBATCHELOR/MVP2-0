# infrastructure/web3/notifications — READMEnew.md

This folder provides services for real-time blockchain transaction notification and status tracking. It enables the application to monitor transaction lifecycle events, emit updates, and integrate with UI or workflow logic for user feedback.

## Files

### TransactionNotifier.ts
- **TransactionStatus** (enum): Transaction state values (`PENDING`, `CONFIRMED`, `FAILED`).
- **TransactionEvent** (enum): Notification event types (`STATUS_CHANGE`, `CONFIRMATION`, `RECEIPT`, `ERROR`).
- **TransactionDetails** (interface): Structure for tracked transaction metadata (hash, from, to, value, status, confirmations, receipt, etc.).
- **TransactionNotifier** (class, extends `EventEmitter`):
  - Monitors transactions by polling their status and emitting events on lifecycle changes.
  - Methods:
    - `trackTransaction(hash, from, to, value)`: Begins monitoring a transaction and emits events as status changes.
    - `stopTracking(hash)`: Stops monitoring a transaction.
    - `getTransaction(hash)`: Retrieves details for a tracked transaction.
    - Static: `getNotifier(blockchain, provider, requiredConfirmations?, pollingInterval?)`: Returns a singleton notifier per blockchain/provider.
  - Emits events for status changes, confirmations, receipts, and errors.
  - Configurable polling interval and required confirmations per chain.

## Usage
- Use `TransactionNotifier.getNotifier` to obtain a notifier for a blockchain/provider.
- Call `trackTransaction` to begin monitoring a transaction; listen for events to update UI or trigger workflows.
- Integrate with wallet and transaction flows to provide real-time feedback to users.

## Developer Notes
- Designed for extensibility: add more event types or customize polling logic as needed.
- Uses ethers.js for provider interaction and EventEmitter for event handling.
- Default confirmation counts are chain-specific but can be overridden.
- All methods are async and event-driven.

---

### Download Link
- [Download /src/infrastructure/web3/notifications/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/notifications/READMEnew.md)
