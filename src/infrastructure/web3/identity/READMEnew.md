# infrastructure/web3/identity — READMEnew.md

This folder contains adapters and contract interfaces for ONCHAINID decentralized identity management on EVM-compatible blockchains. It enables creation, lookup, and verification of identities and claims, integrating with both smart contracts and the application's Supabase database.

## Files

### OnChainIDAdapter.ts
- **OnChainIDAdapter** (class):
  - High-level adapter for ONCHAINID operations, following the web3 adapter pattern.
  - Delegates core logic to `OnChainIDManager`.
  - Methods:
    - `setSigner(signer)`, `setProvider(provider)`: Update signer/provider for contract interactions.
    - `createIdentity(userId, walletAddress, options)`: Deploys a new ONCHAINID identity contract for a user.
    - `getIdentityAddress(walletAddress)`: Retrieves the identity address for a given wallet.
    - `addClaim(identityAddress, claimData)`: Adds a claim to an identity contract and persists it in the database.
    - `verifyClaim(identityAddress, claimTopic)`: Verifies claims on-chain.
    - `getIdentityByUserId(userId)`: Looks up identity by user ID.
  - **Dependencies**: `OnChainIDManager`, ethers.js, Supabase, types from `@/types/onchainid`.

### OnChainIDManager.ts
- **OnChainIDManager** (class):
  - Singleton managing ONCHAINID contract interactions and database sync.
  - Handles contract deployment, wallet linking, claim management, and claim verification.
  - Persists identity and claim data in Supabase tables (`onchain_identities`, `onchain_claims`).

### contracts/
- **ClaimIssuerInterface.ts**: Ethers.js interface for ONCHAINID Claim Issuer contract (claim validation, revocation, events).
- **FactoryInterface.ts**: Ethers.js interface for ONCHAINID Factory contract (identity creation, wallet linking, events).

## Usage
- Use `OnChainIDAdapter` for all identity-related operations in the application.
- Use contract interfaces for low-level contract calls or extending contract functionality.
- All contract calls are network-configurable and support custom providers/signers.

## Developer Notes
- Extend by adding new contract interfaces or adapting for non-EVM chains.
- All methods are async and return Promises.
- Database sync is tightly coupled to Supabase schema; update if schema changes.
- Designed for modular import and integration with wallet/account flows.

---

### Download Link
- [Download /src/infrastructure/web3/identity/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/identity/READMEnew.md)
