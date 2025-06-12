# `/src/services/wallet/contracts` — READMEnew.md

This folder contains contract ABIs, addresses, and utility functions for interacting with Uniswap (V2, V3), Sushiswap, and ERC20 token contracts. It provides factory and contract instance creators for use in wallet, swap, and pool logic.

---

## Files

- **uniswapContracts.ts**
  - Defines contract addresses for Uniswap V2, V3, and Sushiswap routers, and common tokens (WETH, USDC, DAI).
  - Exports ABIs for ERC20, Uniswap V2 Pair, and Uniswap V2 Factory contracts.
  - Provides functions to instantiate:
    - Uniswap V2 Router contracts
    - ERC20 token contracts (for approvals/allowance)
    - Uniswap V2 Pair contracts (for reserves/token info)
    - Uniswap V2 Factory contracts (for pair discovery)
  - Uses ethers.js for contract interaction.

---

## Usage
- Use these utilities to create contract instances for swaps, liquidity pool data, and token approvals.
- Extend with additional contract ABIs or addresses as new DEXs or tokens are integrated.

## Developer Notes
- All logic is TypeScript-typed and uses ethers.js for blockchain access.
- Contract addresses should be moved to environment variables for production.
- Keep documentation (`READMEnew.md`) up to date as contract logic evolves.

---

### Download Link
- [Download /src/services/wallet/contracts/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/services/wallet/contracts/READMEnew.md)
