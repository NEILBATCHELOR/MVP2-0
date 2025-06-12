# infrastructure/web3/identity/contracts — READMEnew.md

This folder provides ethers.js contract interfaces for ONCHAINID-related smart contracts, enabling type-safe, ABI-driven interactions in the application. These interfaces are used by identity adapters and managers to deploy, link, and manage identities and claims on-chain.

## Files

### ClaimIssuerInterface.ts
- **ClaimIssuerInterface** (ethers.utils.Interface):
  - Interface for the ONCHAINID Claim Issuer contract.
  - Exposes functions:
    - `isClaimValid(address, topic, data, signature)`: Checks if a claim is valid.
    - `revokeClaimBySignature(signature)`: Revokes a claim by its signature.
    - `revokedClaims(signature)`: Checks if a claim has been revoked.
  - Events:
    - `ClaimRevoked(signature)`: Emitted when a claim is revoked.

### FactoryInterface.ts
- **FactoryInterface** (ethers.utils.Interface):
  - Interface for the ONCHAINID Factory contract.
  - Exposes functions:
    - `implementationAuthority()`: Returns the address of the implementation authority.
    - `createIdentity(wallet, salt)`: Deploys a new identity contract for a wallet.
    - `getIdentity(wallet)`: Gets the identity contract address for a wallet.
    - `linkWallet(wallet)`, `unlinkWallet(wallet)`: Links or unlinks a wallet to/from an identity.
    - `getWallets(identity)`: Gets all wallets linked to an identity.
  - Events:
    - `Deployed(wallet, identity)`: Emitted when a new identity is deployed.
    - `WalletLinked(wallet, identity)`, `WalletUnlinked(wallet, identity)`: Emitted on wallet link/unlink actions.

## Usage
- Import these interfaces to interact with ONCHAINID contracts using ethers.js in adapters and managers.
- Use for encoding/decoding contract calls, event listening, and ABI-driven contract deployment.

## Developer Notes
- Interfaces are defined as ethers.js `Interface` objects for type safety and ABI management.
- Extend by adding new contract ABIs as needed for additional ONCHAINID functionality.
- Keep ABI definitions in sync with deployed contract versions.

---

### Download Link
- [Download /src/infrastructure/web3/identity/contracts/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/identity/contracts/READMEnew.md)
