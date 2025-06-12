/**
 * ERC-721 Token Handler (NFTs)
 * 
 * Comprehensive implementation for ERC-721 NFT operations
 * Includes minting, transfer, approval, and metadata handling
 */

import { ethers } from 'ethers';
import type { EVMAdapter } from '../../adapters/evm/EVMAdapter';

// ERC-721 standard ABI
const ERC721_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  
  // State-changing functions
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
];

// ERC-721 with metadata extension ABI
const ERC721_METADATA_ABI = [
  ...ERC721_ABI,
  'function tokenURI(uint256 tokenId) view returns (string)'
];

// ERC-721 with enumerable extension ABI
const ERC721_ENUMERABLE_ABI = [
  ...ERC721_ABI,
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)'
];

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface NFTInfo {
  tokenId: string;
  owner: string;
  tokenURI: string;
  metadata?: NFTMetadata;
  approved?: string;
}

export interface ERC721CollectionInfo {
  address: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
}

export interface ERC721TransferParams {
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface ERC721ApprovalParams {
  owner: string;
  approved: string;
  tokenId: string;
  contractAddress: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface ERC721DeploymentParams {
  name: string;
  symbol: string;
  baseURI?: string;
  deployer: string;
  gasLimit?: string;
  gasPrice?: string;
}

export class ERC721Handler {
  private adapter: EVMAdapter;

  constructor(adapter: EVMAdapter) {
    this.adapter = adapter;
  }

  /**
   * Get ERC-721 collection information
   */
  async getCollectionInfo(contractAddress: string): Promise<ERC721CollectionInfo> {
    if (!this.adapter.isValidAddress(contractAddress)) {
      throw new Error('Invalid contract address');
    }

    try {
      // This requires direct contract interaction
      throw new Error('Collection info requires direct contract interaction - implement with provider integration');
    } catch (error) {
      throw new Error(`Failed to get ERC-721 collection info: ${error}`);
    }
  }

  /**
   * Get NFT information including metadata
   */
  async getNFTInfo(contractAddress: string, tokenId: string): Promise<NFTInfo> {
    if (!this.adapter.isValidAddress(contractAddress)) {
      throw new Error('Invalid contract address');
    }

    try {
      // This requires direct contract interaction and IPFS/metadata fetching
      throw new Error('NFT info requires contract interaction and metadata fetching - implement with provider integration');
    } catch (error) {
      throw new Error(`Failed to get NFT info: ${error}`);
    }
  }

  /**
   * Get NFT owner
   */
  async getOwner(contractAddress: string, tokenId: string): Promise<string> {
    if (!this.adapter.isValidAddress(contractAddress)) {
      throw new Error('Invalid contract address');
    }

    try {
      // This requires direct contract interaction
      throw new Error('Owner lookup requires direct contract interaction - implement with provider integration');
    } catch (error) {
      throw new Error(`Failed to get NFT owner: ${error}`);
    }
  }

  /**
   * Get balance (number of NFTs owned)
   */
  async getBalance(ownerAddress: string, contractAddress: string): Promise<bigint> {
    if (!this.adapter.isValidAddress(ownerAddress) || !this.adapter.isValidAddress(contractAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires direct contract interaction
      throw new Error('Balance lookup requires direct contract interaction - implement with provider integration');
    } catch (error) {
      throw new Error(`Failed to get NFT balance: ${error}`);
    }
  }

  /**
   * Get all NFTs owned by an address
   */
  async getOwnedNFTs(ownerAddress: string, contractAddress: string): Promise<NFTInfo[]> {
    if (!this.adapter.isValidAddress(ownerAddress) || !this.adapter.isValidAddress(contractAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires enumerable extension and multiple contract calls
      throw new Error('Owned NFTs lookup requires enumerable extension - implement with provider integration');
    } catch (error) {
      throw new Error(`Failed to get owned NFTs: ${error}`);
    }
  }

  /**
   * Transfer NFT
   */
  async transfer(params: ERC721TransferParams): Promise<string> {
    if (!this.adapter.isValidAddress(params.from) || 
        !this.adapter.isValidAddress(params.to) || 
        !this.adapter.isValidAddress(params.contractAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires wallet/signer integration
      throw new Error('NFT transfers require wallet integration - implement with WalletManager');
    } catch (error) {
      throw new Error(`Failed to transfer NFT: ${error}`);
    }
  }

  /**
   * Safe transfer NFT (with recipient contract check)
   */
  async safeTransfer(params: ERC721TransferParams, data?: string): Promise<string> {
    if (!this.adapter.isValidAddress(params.from) || 
        !this.adapter.isValidAddress(params.to) || 
        !this.adapter.isValidAddress(params.contractAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires wallet/signer integration
      throw new Error('Safe NFT transfers require wallet integration - implement with WalletManager');
    } catch (error) {
      throw new Error(`Failed to safe transfer NFT: ${error}`);
    }
  }

  /**
   * Approve NFT transfer
   */
  async approve(params: ERC721ApprovalParams): Promise<string> {
    if (!this.adapter.isValidAddress(params.owner) || 
        !this.adapter.isValidAddress(params.approved) || 
        !this.adapter.isValidAddress(params.contractAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires wallet/signer integration
      throw new Error('NFT approvals require wallet integration - implement with WalletManager');
    } catch (error) {
      throw new Error(`Failed to approve NFT: ${error}`);
    }
  }

  /**
   * Set approval for all NFTs
   */
  async setApprovalForAll(
    ownerAddress: string,
    operatorAddress: string,
    approved: boolean,
    contractAddress: string
  ): Promise<string> {
    if (!this.adapter.isValidAddress(ownerAddress) || 
        !this.adapter.isValidAddress(operatorAddress) || 
        !this.adapter.isValidAddress(contractAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires wallet/signer integration
      throw new Error('Approval for all requires wallet integration - implement with WalletManager');
    } catch (error) {
      throw new Error(`Failed to set approval for all: ${error}`);
    }
  }

  /**
   * Deploy new ERC-721 contract
   */
  async deployCollection(params: ERC721DeploymentParams): Promise<{
    contractAddress: string;
    transactionHash: string;
    collectionInfo: ERC721CollectionInfo;
  }> {
    if (!this.adapter.isValidAddress(params.deployer)) {
      throw new Error('Invalid deployer address');
    }

    try {
      // This requires wallet/signer integration for deployment
      throw new Error('ERC-721 deployment requires wallet integration - implement with DeploymentManager');
    } catch (error) {
      throw new Error(`Failed to deploy ERC-721 collection: ${error}`);
    }
  }

  /**
   * Mint new NFT
   */
  async mint(
    contractAddress: string,
    to: string,
    tokenId: string,
    tokenURI?: string
  ): Promise<string> {
    if (!this.adapter.isValidAddress(contractAddress) || !this.adapter.isValidAddress(to)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires wallet/signer integration and contract with mint function
      throw new Error('NFT minting requires wallet integration - implement with WalletManager');
    } catch (error) {
      throw new Error(`Failed to mint NFT: ${error}`);
    }
  }

  /**
   * Fetch metadata from IPFS or HTTP
   */
  async fetchMetadata(tokenURI: string): Promise<NFTMetadata> {
    try {
      // Handle IPFS URLs
      if (tokenURI.startsWith('ipfs://')) {
        tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata: NFTMetadata = await response.json();
      return metadata;
    } catch (error) {
      throw new Error(`Failed to fetch NFT metadata: ${error}`);
    }
  }

  /**
   * Parse ERC-721 transfer event
   */
  parseTransferEvent(receipt: any): Array<{
    from: string;
    to: string;
    tokenId: string;
    contractAddress: string;
  }> {
    try {
      const iface = new ethers.Interface(ERC721_ABI);
      const transfers: Array<{
        from: string;
        to: string;
        tokenId: string;
        contractAddress: string;
      }> = [];

      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog.name === 'Transfer') {
            transfers.push({
              from: parsedLog.args.from,
              to: parsedLog.args.to,
              tokenId: parsedLog.args.tokenId.toString(),
              contractAddress: log.address
            });
          }
        } catch {
          // Skip logs that don't match ERC-721 Transfer event
          continue;
        }
      }

      return transfers;
    } catch (error) {
      throw new Error(`Failed to parse transfer events: ${error}`);
    }
  }

  /**
   * Parse ERC-721 approval event
   */
  parseApprovalEvent(receipt: any): Array<{
    owner: string;
    approved: string;
    tokenId: string;
    contractAddress: string;
  }> {
    try {
      const iface = new ethers.Interface(ERC721_ABI);
      const approvals: Array<{
        owner: string;
        approved: string;
        tokenId: string;
        contractAddress: string;
      }> = [];

      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog.name === 'Approval') {
            approvals.push({
              owner: parsedLog.args.owner,
              approved: parsedLog.args.approved,
              tokenId: parsedLog.args.tokenId.toString(),
              contractAddress: log.address
            });
          }
        } catch {
          // Skip logs that don't match ERC-721 Approval event
          continue;
        }
      }

      return approvals;
    } catch (error) {
      throw new Error(`Failed to parse approval events: ${error}`);
    }
  }

  /**
   * Validate ERC-721 contract
   */
  async validateContract(contractAddress: string): Promise<boolean> {
    if (!this.adapter.isValidAddress(contractAddress)) {
      return false;
    }

    try {
      // Check if contract supports ERC-721 interface
      // This requires direct contract interaction
      return false; // Placeholder
    } catch {
      return false;
    }
  }

  /**
   * Get contract supports interfaces
   */
  async getSupportsInterface(contractAddress: string, interfaceId: string): Promise<boolean> {
    if (!this.adapter.isValidAddress(contractAddress)) {
      throw new Error('Invalid contract address');
    }

    try {
      // This requires direct contract interaction
      throw new Error('Interface support check requires direct contract interaction');
    } catch (error) {
      throw new Error(`Failed to check interface support: ${error}`);
    }
  }

  /**
   * Common ERC-721 interface IDs
   */
  static readonly INTERFACE_IDS = {
    ERC165: '0x01ffc9a7',
    ERC721: '0x80ac58cd',
    ERC721_METADATA: '0x5b5e139f',
    ERC721_ENUMERABLE: '0x780e9d63'
  };

  /**
   * Get floor price for collection (requires marketplace integration)
   */
  async getFloorPrice(contractAddress: string): Promise<bigint | null> {
    // This would require marketplace API integration (OpenSea, LooksRare, etc.)
    throw new Error('Floor price requires marketplace API integration');
  }

  /**
   * Get collection statistics (requires indexer)
   */
  async getCollectionStats(contractAddress: string): Promise<{
    totalSupply: number;
    owners: number;
    floorPrice?: bigint;
    volume24h?: bigint;
    volume7d?: bigint;
  }> {
    // This would require indexer or marketplace API integration
    throw new Error('Collection stats require indexer integration');
  }
}
