# `/src/services/wallet/v4` — READMEnew.md

This folder contains Uniswap V4 integration logic, including contract addresses, ABIs, hook registry, and a service for interacting with Uniswap V4 pools. It enables advanced swap, pool management, and custom hook workflows.

---

## Files

- **uniswapV4Contracts.ts**
  - Defines Uniswap V4 contract addresses (Pool Manager, Universal Router, WETH).
  - Exports minimal ABIs for Pool Manager and Universal Router contracts.
  - Provides a hook registry for supported pool hooks (e.g., dynamic fee, limit order).

- **uniswapV4Service.ts**
  - Implements the `UniswapV4Service` class for interacting with Uniswap V4 pools.
  - Provides methods to:
    - Fetch pool info, liquidity, and slot data.
    - List deployed pools and supported hooks.
    - Create new V4 pools with custom parameters and hooks.
  - Handles provider/signer management and transaction logic.
  - Exports a singleton instance (`uniswapV4Service`).

---

## Usage
- Use these modules for advanced Uniswap V4 pool management, swaps, and custom pool creation with hooks.
- Extend with additional hook support or new contract integrations as Uniswap V4 evolves.

## Developer Notes
- All logic is TypeScript-typed and uses ethers.js for blockchain access.
- Ensure ABIs and addresses are kept up to date with mainnet deployments.
- Keep documentation (`READMEnew.md`) up to date as V4 logic evolves.

---

### Download Link
- [Download /src/services/wallet/v4/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/services/wallet/v4/READMEnew.md)
