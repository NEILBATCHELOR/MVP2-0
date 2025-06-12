import { Wallet, keccak256, toUtf8Bytes, hashMessage, TypedDataEncoder, type Provider, Signature, getBytes } from "ethers";
import { recoverAddress } from 'ethers';

/**
 * Message signing types
 */
export enum MessageSigningType {
  ETH_SIGN = "eth_sign",
  PERSONAL_SIGN = "personal_sign",
  TYPED_DATA_V3 = "typed_data_v3",
  TYPED_DATA_V4 = "typed_data_v4"
}

/**
 * Message signature result
 */
export interface MessageSignature {
  messageHash: string;
  signature: string;
  r: string;
  s: string;
  v: number;
  signer: string;
}

/**
 * Typed data domain definition (EIP-712)
 */
export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

/**
 * Typed data types definition (EIP-712)
 */
export interface TypedDataTypes {
  [typeName: string]: Array<{ name: string; type: string }>;
}

/**
 * EIP-712 typed data
 */
export interface TypedData {
  domain: TypedDataDomain;
  types: TypedDataTypes;
  primaryType: string;
  message: Record<string, any>;
}

/**
 * Message signer interface for blockchain-specific message signing
 */
export interface MessageSigner {
  /**
   * Sign a message using the specified signing method
   */
  signMessage(
    message: string | Uint8Array,
    privateKey: string,
    type?: MessageSigningType
  ): Promise<MessageSignature>;
  
  /**
   * Sign typed data according to EIP-712
   */
  signTypedData(
    typedData: TypedData,
    privateKey: string,
    version?: "v3" | "v4"
  ): Promise<MessageSignature>;
  
  /**
   * Verify a message signature
   */
  verifyMessageSignature(
    message: string | Uint8Array,
    signature: string,
    expectedSigner?: string,
    type?: MessageSigningType
  ): Promise<{ isValid: boolean; recoveredAddress: string }>;
  
  /**
   * Verify a typed data signature
   */
  verifyTypedDataSignature(
    typedData: TypedData,
    signature: string,
    expectedSigner?: string,
    version?: "v3" | "v4"
  ): Promise<{ isValid: boolean; recoveredAddress: string }>;
}

/**
 * Ethereum message signer implementation
 */
export class EthereumMessageSigner implements MessageSigner {
  private provider:  Provider;
  
  constructor(provider:  Provider) {
    this.provider = provider;
  }
  
  /**
   * Sign a message using the specified signing method
   */
  async signMessage(
    message: string | Uint8Array,
    privateKey: string,
    type: MessageSigningType = MessageSigningType.PERSONAL_SIGN
  ): Promise<MessageSignature> {
    const wallet = new Wallet(privateKey, this.provider);
    let signature: string;
    let messageHash: string;
    
    switch (type) {
      case MessageSigningType.ETH_SIGN:
        // eth_sign: Sign raw bytes (hash first)
        messageHash =  keccak256(
          typeof message === "string"
            ?  toUtf8Bytes(message)
            : message
        );
        signature = await wallet.signMessage(getBytes(messageHash));
        break;
        
      case MessageSigningType.PERSONAL_SIGN:
      default:
        // personal_sign: Add the Ethereum signed message prefix
        signature = await wallet.signMessage(message);
        
        // Calculate the message hash (with prefix)
        if (typeof message === "string") {
          messageHash =  hashMessage(message);
        } else {
          messageHash =  hashMessage(message);
        }
        break;
    }
    
    // Split signature into r, s, v components
    const sig = Signature.from(signature);
    
    return {
      messageHash,
      signature,
      r: sig.r,
      s: sig.s,
      v: sig.v,
      signer: wallet.address
    };
  }
  
  /**
   * Sign typed data according to EIP-712
   */
  async signTypedData(
    typedData: TypedData,
    privateKey: string,
    version: "v3" | "v4" = "v4"
  ): Promise<MessageSignature> {
    const wallet = new Wallet(privateKey, this.provider);
    
    const domain = typedData.domain;
    const types = typedData.types;
    const primaryType = typedData.primaryType;
    const message = typedData.message;
    
    // Remove EIP712Domain from types for signing
    // It is included in the domain property already
    const typesForSigning = { ...types };
    delete typesForSigning.EIP712Domain;
    
    // Get the digest to sign
    let messageHash: string;
    
    // Use wallet.signTypedData for v4
    if (version === "v4") {
      const signature = await wallet.signTypedData(domain, typesForSigning, message);
      messageHash =  TypedDataEncoder.hash(domain, typesForSigning, message);
      
      // Split signature into r, s, v components
      const sig = Signature.from(signature);
      
      return {
        messageHash,
        signature,
        r: sig.r,
        s: sig.s,
        v: sig.v,
        signer: wallet.address
      };
    } else {
      // v3 - similar but with slight differences in encoding
      const signature = await wallet.signTypedData(domain, typesForSigning, message);
      messageHash =  TypedDataEncoder.hash(domain, typesForSigning, message);
      
      // Split signature into r, s, v components
      const sig = Signature.from(signature);
      
      return {
        messageHash,
        signature,
        r: sig.r,
        s: sig.s,
        v: sig.v,
        signer: wallet.address
      };
    }
  }
  
  /**
   * Verify a message signature
   */
  async verifyMessageSignature(
    message: string | Uint8Array,
    signature: string,
    expectedSigner?: string,
    type: MessageSigningType = MessageSigningType.PERSONAL_SIGN
  ): Promise<{ isValid: boolean; recoveredAddress: string }> {
    try {
      // Calculate the message hash based on signing type
      let messageHash: string;
      
      switch (type) {
        case MessageSigningType.ETH_SIGN:
          // eth_sign: Hash the raw message first
          messageHash =  keccak256(
            typeof message === "string"
              ?  toUtf8Bytes(message)
              : message
          );
          break;
          
        case MessageSigningType.PERSONAL_SIGN:
        default:
          // personal_sign: Hash with Ethereum signed message prefix
          if (typeof message === "string") {
            messageHash =  hashMessage(message);
          } else {
            messageHash =  hashMessage(message);
          }
          break;
      }
      
      // Recover the address from the signature
      const recoveredAddress = recoverAddress(getBytes(messageHash), signature);
      
      // Check if it matches the expected signer (if provided)
      const isValid = !expectedSigner || recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
      
      return { isValid, recoveredAddress };
    } catch (error) {
      console.error("Signature verification error:", error);
      return { isValid: false, recoveredAddress: "0x0000000000000000000000000000000000000000" };
    }
  }
  
  /**
   * Verify a typed data signature
   */
  async verifyTypedDataSignature(
    typedData: TypedData,
    signature: string,
    expectedSigner?: string,
    version: "v3" | "v4" = "v4"
  ): Promise<{ isValid: boolean; recoveredAddress: string }> {
    try {
      const domain = typedData.domain;
      const types = typedData.types;
      const primaryType = typedData.primaryType;
      const message = typedData.message;
      
      // Remove EIP712Domain from types for verification
      const typesForVerification = { ...types };
      delete typesForVerification.EIP712Domain;
      
      // Calculate the digest
      const messageHash =  TypedDataEncoder.hash(
        domain,
        typesForVerification,
        message
      );
      
      // Recover the address
      const recoveredAddress = recoverAddress(getBytes(messageHash), signature);
      
      // Check if it matches the expected signer (if provided)
      const isValid = !expectedSigner || recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
      
      return { isValid, recoveredAddress };
    } catch (error) {
      console.error("Typed data signature verification error:", error);
      return { isValid: false, recoveredAddress: "0x0000000000000000000000000000000000000000" };
    }
  }
}

/**
 * Factory for creating message signers for different blockchains
 */
export class MessageSignerFactory {
  private static signers: Record<string, MessageSigner> = {};
  
  /**
   * Get a message signer for a specific blockchain
   */
  static getSigner(blockchain: string, provider: any): MessageSigner {
    const key = `${blockchain}_${provider.connection?.url || "default"}`;
    
    if (!this.signers[key]) {
      this.signers[key] = this.createSigner(blockchain, provider);
    }
    
    return this.signers[key];
  }
  
  /**
   * Create a message signer for a specific blockchain
   */
  private static createSigner(blockchain: string, provider: any): MessageSigner {
    // Currently only supporting Ethereum chains
    if (this.isEVMChain(blockchain)) {
      return new EthereumMessageSigner(provider);
    }
    
    // Future implementations for other chains
    throw new Error(`Message signing for ${blockchain} is not supported yet`);
  }
  
  /**
   * Check if a blockchain is EVM-compatible
   */
  private static isEVMChain(blockchain: string): boolean {
    const evmChains = [
      "ethereum", "polygon", "avalanche", "optimism", "arbitrum",
      "base", "mantle", "zksync", "hedera"
    ];
    
    return evmChains.includes(blockchain.toLowerCase());
  }
}

/**
 * MultiSig message signing support
 */
export interface MultiSigMessageSignature {
  messageHash: string;
  signatures: MessageSignature[];
  isComplete: boolean;
  requiredSignatures: number;
}

/**
 * Class for handling multiple signatures for the same message
 */
export class MultiSigMessageHandler {
  private requiredSignatures: number;
  
  constructor(requiredSignatures: number = 1) {
    this.requiredSignatures = requiredSignatures;
  }
  
  /**
   * Add a signature to a multi-sig collection
   */
  addSignature(
    existingSignatures: MultiSigMessageSignature,
    newSignature: MessageSignature
  ): MultiSigMessageSignature {
    // Verify the signature matches the same message hash
    if (existingSignatures.messageHash !== newSignature.messageHash) {
      throw new Error("Signature is for a different message");
    }
    
    // Check if this signer has already signed
    const signerExists = existingSignatures.signatures.some(
      sig => sig.signer.toLowerCase() === newSignature.signer.toLowerCase()
    );
    
    if (signerExists) {
      throw new Error("This address has already signed the message");
    }
    
    // Add the new signature
    const updatedSignatures = {
      ...existingSignatures,
      signatures: [...existingSignatures.signatures, newSignature]
    };
    
    // Check if we've reached the required number of signatures
    updatedSignatures.isComplete = updatedSignatures.signatures.length >= this.requiredSignatures;
    
    return updatedSignatures;
  }
  
  /**
   * Create a new multi-sig signature collection
   */
  createMultiSigSignature(
    initialSignature: MessageSignature
  ): MultiSigMessageSignature {
    return {
      messageHash: initialSignature.messageHash,
      signatures: [initialSignature],
      isComplete: this.requiredSignatures <= 1,
      requiredSignatures: this.requiredSignatures
    };
  }
  
  /**
   * Verify all signatures in a multi-sig collection
   */
  async verifyAllSignatures(
    message: string | TypedData,
    multiSigSignature: MultiSigMessageSignature,
    isTypedData: boolean = false,
    blockchain: string = "ethereum",
    provider: any
  ): Promise<{ isValid: boolean; invalidSigners: string[] }> {
    const signer = MessageSignerFactory.getSigner(blockchain, provider);
    const invalidSigners: string[] = [];
    
    for (const signature of multiSigSignature.signatures) {
      let isValid: boolean;
      
      if (isTypedData && typeof message !== "string") {
        // Verify typed data signature
        const result = await signer.verifyTypedDataSignature(
          message,
          signature.signature,
          signature.signer
        );
        isValid = result.isValid;
      } else if (typeof message === "string") {
        // Verify regular message signature
        const result = await signer.verifyMessageSignature(
          message,
          signature.signature,
          signature.signer
        );
        isValid = result.isValid;
      } else {
        throw new Error("Invalid message format");
      }
      
      if (!isValid) {
        invalidSigners.push(signature.signer);
      }
    }
    
    return {
      isValid: invalidSigners.length === 0,
      invalidSigners
    };
  }
}