# `/src/services/wallet/pools` — READMEnew.md

This folder contains services for fetching, caching, and managing liquidity pool data, primarily for Uniswap V2 pools. It enables token swap UIs and logic to efficiently access pool reserves, compute price impacts, and recommend slippage settings.

---

## Files

- **poolDataService.ts**
  - Implements the `PoolDataService` class for interacting with Uniswap V2 pools using ethers.js.
  - Provides methods to:
    - Fetch pair addresses and reserves for token pairs.
    - Cache pool and reserve data for performance (with TTL).
    - Calculate price impact and recommend slippage based on liquidity and volatility.
    - Clear all caches.
  - Exports a singleton instance (`poolDataService`) configured with the app's Ethereum RPC provider.

---

## Usage
- Use this service in swap UIs and token management flows to fetch pool data, compute price impacts, and recommend slippage.
- Extend with additional pool providers or custom logic for other DEXs as needed.

## Developer Notes
- All logic is TypeScript-typed and uses ethers.js for blockchain access.
- Designed for extensibility: add new DEX integrations or pool data sources as needed.
- Keep documentation (`READMEnew.md`) up to date as pool logic evolves.

---

### Download Link
- [Download /src/services/wallet/pools/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/services/wallet/pools/READMEnew.md)
