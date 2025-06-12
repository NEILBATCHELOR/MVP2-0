# `/src/services/wallet/abi` — READMEnew.md

This folder contains contract ABI (Application Binary Interface) definitions in JSON format for use with ethers.js and other Ethereum libraries. These ABIs enable the application to interact with smart contracts such as Uniswap V2 routers and related DeFi protocols.

---

## Files

- **uniswapV2Router.json**
  - ABI for the Uniswap V2 Router contract, supporting token swaps, liquidity management, and price queries.
  - Used by service and contract utility modules to encode/decode contract calls and events.

---

## Usage
- Import these ABIs when creating ethers.js `Contract` instances for interacting with Uniswap V2 or similar protocols.
- Extend this folder with additional ABIs as more protocols or contract versions are integrated.

## Developer Notes
- ABIs should be kept up to date with deployed contract versions.
- Store only canonical, production-ready ABIs; avoid test or mock ABIs unless clearly marked.
- Keep documentation (`READMEnew.md`) up to date as new ABIs are added.

---

### Download Link
- [Download /src/services/wallet/abi/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/services/wallet/abi/READMEnew.md)
