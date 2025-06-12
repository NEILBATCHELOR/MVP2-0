import { Wallet, isAddress, formatEther, formatUnits, parseEther, parseUnits, verifyMessage } from "ethers";
import * as ed from "@noble/ed25519";

// Define supported curves and signing algorithms
export enum CurveType {
  SECP256K1 = "secp256k1",
  ED25519 = "ed25519",
}

export enum SigningAlgorithm {
  ECDSA = "ecdsa",
  EDDSA = "eddsa",
}

// Map blockchains to their curve and signing algorithm
export const blockchainCryptoConfig: Record<
  string,
  { curve: CurveType; algorithm: SigningAlgorithm }
> = {
  ethereum: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  polygon: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  avalanche: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  optimism: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  bitcoin: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  mantle: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  base: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  zksync: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  arbitrum: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  ripple: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  hedera: { curve: CurveType.SECP256K1, algorithm: SigningAlgorithm.ECDSA },
  solana: { curve: CurveType.ED25519, algorithm: SigningAlgorithm.EDDSA },
  aptos: { curve: CurveType.ED25519, algorithm: SigningAlgorithm.EDDSA },
  sui: { curve: CurveType.ED25519, algorithm: SigningAlgorithm.EDDSA },
  stellar: { curve: CurveType.ED25519, algorithm: SigningAlgorithm.EDDSA },
  near: { curve: CurveType.ED25519, algorithm: SigningAlgorithm.EDDSA },
};

// Generate a keypair for a specific blockchain
export const generateKeypair = async (blockchain: string) => {
  const config = blockchainCryptoConfig[blockchain];
  if (!config) {
    throw new Error(`Unsupported blockchain: ${blockchain}`);
  }

  if (config.curve === CurveType.SECP256K1) {
    // For EVM chains and Bitcoin, we use secp256k1
    const wallet = Wallet.createRandom();
    return {
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      address: wallet.address,
    };
  } else if (config.curve === CurveType.ED25519) {
    // ED25519 keypair generation
    const privArray = ed.utils.randomPrivateKey();
    const pubArray = await ed.getPublicKey(privArray);
    const privateKeyHex = `0x${Buffer.from(privArray).toString("hex")}`;
    const publicKeyHex = `0x${Buffer.from(pubArray).toString("hex")}`;
    return {
      privateKey: privateKeyHex,
      publicKey: publicKeyHex,
      address: publicKeyHex,
    };
  }

  throw new Error(`Unsupported curve type for ${blockchain}`);
};

// Sign a message using the appropriate algorithm for the blockchain
export const signMessage = async (
  blockchain: string,
  message: string,
  privateKey: string,
): Promise<string> => {
  const config = blockchainCryptoConfig[blockchain];
  if (!config) {
    throw new Error(`Unsupported blockchain: ${blockchain}`);
  }

  if (
    config.curve === CurveType.SECP256K1 &&
    config.algorithm === SigningAlgorithm.ECDSA
  ) {
    // For EVM chains, we use ethers.js
    const wallet = new Wallet(privateKey);
    const signature = await wallet.signMessage(message);
    return signature;
  } else if (
    config.curve === CurveType.ED25519 &&
    config.algorithm === SigningAlgorithm.EDDSA
  ) {
    // ED25519 signing
    const privHex = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
    const privBytes = Uint8Array.from(Buffer.from(privHex, "hex"));
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = await ed.sign(msgBytes, privBytes);
    return `0x${Buffer.from(sigBytes).toString("hex")}`;
  }

  throw new Error(`Unsupported curve/algorithm combination for ${blockchain}`);
};

// Verify a signature using the appropriate algorithm for the blockchain
export const verifySignature = async (
  blockchain: string,
  message: string,
  signature: string,
  publicKeyOrAddress: string,
): Promise<boolean> => {
  const config = blockchainCryptoConfig[blockchain];
  if (!config) {
    throw new Error(`Unsupported blockchain: ${blockchain}`);
  }

  if (
    config.curve === CurveType.SECP256K1 &&
    config.algorithm === SigningAlgorithm.ECDSA
  ) {
    // For EVM chains, we use ethers.js
    try {
      const recoveredAddress =  verifyMessage(message, signature);
      return (
        recoveredAddress.toLowerCase() === publicKeyOrAddress.toLowerCase()
      );
    } catch (error) {
      console.error("Error verifying signature:", error);
      return false;
    }
  } else if (
    config.curve === CurveType.ED25519 &&
    config.algorithm === SigningAlgorithm.EDDSA
  ) {
    // ED25519 verification
    const sigHex = signature.startsWith("0x") ? signature.slice(2) : signature;
    const sigBytes = Uint8Array.from(Buffer.from(sigHex, "hex"));
    const msgBytes = new TextEncoder().encode(message);
    const pubHex = publicKeyOrAddress.startsWith("0x")
      ? publicKeyOrAddress.slice(2)
      : publicKeyOrAddress;
    const pubBytes = Uint8Array.from(Buffer.from(pubHex, "hex"));
    return await ed.verify(sigBytes, msgBytes, pubBytes);
  }

  throw new Error(`Unsupported curve/algorithm combination for ${blockchain}`);
};

// Format an amount based on the blockchain's native token decimals
export const formatAmount = (blockchain: string, amount: string): string => {
  switch (blockchain) {
    case "ethereum":
    case "polygon":
    case "avalanche":
    case "optimism":
    case "base":
    case "zksync":
    case "arbitrum":
    case "mantle":
    case "hedera":
      // EVM chains use 18 decimals
      return  formatEther(amount);
    case "bitcoin":
      // Bitcoin uses 8 decimals
      return  formatUnits(amount, 8);
    case "ripple":
      // XRP uses 6 decimals
      return  formatUnits(amount, 6);
    case "solana":
      // Solana uses 9 decimals
      return  formatUnits(amount, 9);
    case "stellar":
      // Stellar uses 7 decimals
      return  formatUnits(amount, 7);
    case "near":
      // NEAR uses 24 decimals
      return  formatUnits(amount, 24);
    case "aptos":
      // Aptos uses 8 decimals
      return  formatUnits(amount, 8);
    case "sui":
      // Sui uses 9 decimals
      return  formatUnits(amount, 9);
    default:
      // Default to 18 decimals
      return  formatEther(amount);
  }
};

// Parse an amount based on the blockchain's native token decimals
export const parseAmount = (blockchain: string, amount: string): string => {
  switch (blockchain) {
    case "ethereum":
    case "polygon":
    case "avalanche":
    case "optimism":
    case "base":
    case "zksync":
    case "arbitrum":
    case "mantle":
    case "hedera":
      // EVM chains use 18 decimals
      return  parseEther(amount).toString();
    case "bitcoin":
      // Bitcoin uses 8 decimals
      return  parseUnits(amount, 8).toString();
    case "ripple":
      // XRP uses 6 decimals
      return  parseUnits(amount, 6).toString();
    case "solana":
      // Solana uses 9 decimals
      return  parseUnits(amount, 9).toString();
    case "stellar":
      // Stellar uses 7 decimals
      return  parseUnits(amount, 7).toString();
    case "near":
      // NEAR uses 24 decimals
      return  parseUnits(amount, 24).toString();
    case "aptos":
      // Aptos uses 8 decimals
      return  parseUnits(amount, 8).toString();
    case "sui":
      // Sui uses 9 decimals
      return  parseUnits(amount, 9).toString();
    default:
      // Default to 18 decimals
      return  parseEther(amount).toString();
  }
};
