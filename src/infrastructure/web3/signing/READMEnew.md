# infrastructure/web3/signing — READMEnew.md

This folder provides cryptographic message signing and verification utilities for blockchain operations, supporting multiple signature standards and blockchains. It enables secure off-chain and on-chain message authentication, EIP-712 typed data signing, and signature validation.

## Files

### MessageSigner.ts
- **MessageType** (enum): Supported message signature types (`PERSONAL`, `TYPED_DATA`, `ETH_SIGN`).
- **TypedData** (interface): Structure for EIP-712 typed data (domain, types, message).
- **VerificationResult** (interface): Result structure for signature verification (validity, recovered address, error).
- **MessageSigner** (class):
  - Provides methods for signing and verifying messages using different Ethereum standards.
  - Methods:
    - `signPersonalMessage(message, privateKey)`: Signs a message using `personal_sign` (with Ethereum prefix).
    - `signMessage(message, privateKey)`: Signs a message using `eth_sign` (without prefix).
    - `signTypedData(typedData, privateKey)`: Signs EIP-712 typed data.
    - `verifySignature(message, signature, expectedAddress, messageType)`: Verifies signatures for all supported message types.
  - Uses ethers.js for cryptographic primitives and wallet management.
- **MessageSignerFactory** (class):
  - Provides singleton instances of `MessageSigner` per blockchain and provider.
  - Method: `getSigner(blockchain, provider)`.

## Usage
- Use `MessageSignerFactory.getSigner` to obtain a signer for a blockchain/provider.
- Use `MessageSigner` methods to sign or verify messages, typed data, or transactions.
- Integrate with wallet flows, authentication, and multi-sig logic for secure operations.

## Developer Notes
- Supports EIP-712 and legacy Ethereum message formats.
- Designed for extension to other blockchains or signature schemes.
- All methods are async and return Promises.
- Handles error reporting and address recovery for robust verification.

---

### Download Link
- [Download /src/infrastructure/web3/signing/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/signing/READMEnew.md)
