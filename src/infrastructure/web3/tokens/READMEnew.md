# infrastructure/web3/tokens — READMEnew.md

This folder provides adapters and factories for interacting with on-chain tokens using various Ethereum token standards. It enables unified querying, metadata retrieval, and operations for ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, and ERC-4626 tokens.

## Files

### ERC1155TokenAdapter.ts
- **ERC1155TokenAdapter** (class): Adapter for ERC-1155 multi-token standard (NFTs and fungible tokens).
  - Methods for metadata, balance, and approval checks.
  - Uses caching for NFT metadata.

### ERC1400TokenAdapter.ts
- **ERC1400TokenAdapter** (class): Adapter for ERC-1400 security tokens (partitioned/regulated tokens).
  - Methods for compliance, partition management, and transfer checks.

### ERC3525TokenAdapter.ts
- **ERC3525TokenAdapter** (class): Adapter for ERC-3525 semi-fungible tokens.
  - Methods for slot-based token logic and metadata.

### ERC4626TokenAdapter.ts
- **ERC4626TokenAdapter** (class): Adapter for ERC-4626 vault standard (tokenized yield vaults).
  - Methods for deposit, withdraw, and vault metadata.

### ERC721TokenAdapter.ts
- **ERC721TokenAdapter** (class): Adapter for ERC-721 NFTs.
  - Methods for NFT metadata, ownership, and approval.

### TokenAdapter.ts
- **BaseTokenAdapter** (abstract class): Common base for all token adapters.
  - Implements provider logic and shared methods.
- **TokenAdapter** (interface): Unified interface for all token adapters.

### TokenAdapterFactory.ts
- **TokenAdapterFactory** (class):
  - Registers and instantiates token adapters for detected standards.
  - Methods for detecting token standard, registering adapters, and instantiating by standard or address.
  - `tokenAdapterFactory`: Singleton instance for use across the application.

## Usage
- Use `TokenAdapterFactory` to detect token standards and instantiate the correct adapter for a token address.
- Use token adapters to query balances, metadata, and perform token-specific operations in a unified way.
- Extend by implementing new adapters for additional standards.

## Developer Notes
- Adapters are async and use ethers.js for contract calls.
- Designed for extensibility and modularity across token types.
- All adapters share a unified interface for easier integration with wallet and DeFi logic.
- ERC-20 adapter is referenced but not implemented in this folder.

---

### Download Link
- [Download /src/infrastructure/web3/tokens/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/tokens/READMEnew.md)
