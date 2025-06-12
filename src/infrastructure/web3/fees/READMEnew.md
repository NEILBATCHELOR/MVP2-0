# infrastructure/web3/fees — READMEnew.md

This folder contains logic for estimating transaction fees across supported blockchains, with a primary focus on EVM-compatible chains. It provides abstractions for fee estimation, network congestion analysis, and a factory for obtaining the correct estimator per chain.

## Files

### FeeEstimator.ts
- **FeePriority** (enum): Priority levels for fee estimation (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- **NetworkCongestion** (enum): Levels of network congestion (`LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH`).
- **FeeSuggestion** (interface): Structure for a fee suggestion, including gas details, priority, congestion, and estimated confirmation time.
- **FeeEstimationOptions** (interface): Options for customizing fee estimation (priority, max wait time).
- **FeeEstimator** (abstract class):
  - Base class for chain-specific fee estimators.
  - Requires implementation of `estimateFee()` and `getNetworkCongestion()`.
  - Maintains a cache of historical fee data for analysis.
- **EVMFeeEstimator** (class):
  - Implements fee estimation for EVM-compatible chains using ethers.js.
  - Analyzes recent blocks for base/priority fees, estimates network congestion, and suggests fees for different priorities.
  - Provides estimated confirmation times based on priority and congestion.
- **FeeEstimatorFactory** (class):
  - Static factory for obtaining the correct fee estimator for a blockchain and provider.
  - Currently returns `EVMFeeEstimator` for all chains, but designed for extension.

## Usage
- Use `FeeEstimatorFactory.getEstimator(blockchain, provider)` to obtain a fee estimator for a chain.
- Call `estimateFee()` to get a fee suggestion with network-aware values.
- Use enums for consistent priority and congestion handling in UI and transaction flows.

## Developer Notes
- Extend by adding new chain-specific estimators and updating the factory logic.
- All estimators are async and return Promises.
- Designed to support advanced fee markets (EIP-1559, dynamic gas, etc.).
- Caches historical fee data for improved accuracy and analytics.

---

### Download Link
- [Download /src/infrastructure/web3/fees/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/fees/READMEnew.md)
