/**
 * useERC721 Hook
 * 
 * React hook specifically for ERC-721 (NFT) token operations and management.
 * Provides NFT-specific functionality including minting, burning, and metadata management.
 */

import { useState, useCallback } from 'react';
import { useToken } from './useToken';
import { UseTokenOptions } from './types';
import { 
  getERC721Properties,
  updateERC721Properties,
  getERC721Attributes
} from '../services/enhancedERC721Service';

interface UseERC721Options extends Omit<UseTokenOptions, 'standard'> {
  includeAttributes?: boolean;
  includeMetadata?: boolean;
}

interface ERC721HookResult {
  token: any;
  properties: any;
  attributes: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateProperties: (updates: any) => Promise<void>;
  mintNFT: (to: string, tokenURI?: string, metadata?: any) => Promise<void>;
  burnNFT: (tokenId: string) => Promise<void>;
  setTokenURI: (tokenId: string, tokenURI: string) => Promise<void>;
  updateMetadata: (tokenId: string, metadata: any) => Promise<void>;
  transferNFT: (from: string, to: string, tokenId: string) => Promise<void>;
}

export function useERC721(options: UseERC721Options): ERC721HookResult {
  const {
    tokenId,
    includeAttributes = true,
    includeMetadata = true,
    ...tokenOptions
  } = options;

  const [properties, setProperties] = useState<any>(null);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  // Use base token hook
  const {
    token,
    isLoading: isTokenLoading,
    error,
    refetch: refetchToken,
    update
  } = useToken({
    ...tokenOptions,
    tokenId
  });

  // Fetch ERC-721 specific properties
  const fetchProperties = useCallback(async () => {
    if (!tokenId) return;

    try {
      const [erc721Properties, tokenAttributes] = await Promise.all([
        getERC721Properties(tokenId, { includeMetadata }),
        includeAttributes ? getERC721Attributes(tokenId) : Promise.resolve([])
      ]);
      
      setProperties(erc721Properties);
      setAttributes(tokenAttributes);
    } catch (err) {
      console.error('Failed to fetch ERC-721 properties:', err);
    }
  }, [tokenId, includeMetadata, includeAttributes]);

  // Update ERC-721 properties
  const updateProperties = useCallback(async (updates: any) => {
    if (!tokenId) throw new Error('Token ID is required');

    setIsOperationLoading(true);
    try {
      const updatedProperties = await updateERC721Properties(tokenId, updates);
      setProperties(updatedProperties);
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, refetchToken]);

  // Mint NFT
  const mintNFT = useCallback(async (to: string, tokenURI?: string, metadata?: any) => {
    if (!tokenId) throw new Error('Token ID is required');
    if (!to) throw new Error('Recipient address is required');

    setIsOperationLoading(true);
    try {
      // Implementation would call blockchain or update database
      console.log('Minting NFT to', to, 'with URI:', tokenURI);
      
      // In a real implementation, this would:
      // 1. Generate next token ID
      // 2. Call smart contract mint function
      // 3. Upload metadata to IPFS if needed
      // 4. Update database records
      
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, refetchToken]);

  // Burn NFT
  const burnNFT = useCallback(async (nftTokenId: string) => {
    if (!tokenId) throw new Error('Contract token ID is required');
    if (!nftTokenId) throw new Error('NFT token ID is required');
    if (!token?.erc721Properties?.isBurnable) {
      throw new Error('Token is not burnable');
    }

    setIsOperationLoading(true);
    try {
      console.log('Burning NFT token ID:', nftTokenId);
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, token, refetchToken]);

  // Set token URI
  const setTokenURI = useCallback(async (nftTokenId: string, tokenURI: string) => {
    if (!tokenId) throw new Error('Contract token ID is required');
    if (!nftTokenId) throw new Error('NFT token ID is required');
    if (!tokenURI) throw new Error('Token URI is required');

    setIsOperationLoading(true);
    try {
      console.log('Setting token URI for NFT', nftTokenId, 'to:', tokenURI);
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, refetchToken]);

  // Update metadata
  const updateMetadata = useCallback(async (nftTokenId: string, metadata: any) => {
    if (!tokenId) throw new Error('Contract token ID is required');
    if (!nftTokenId) throw new Error('NFT token ID is required');

    setIsOperationLoading(true);
    try {
      console.log('Updating metadata for NFT', nftTokenId, 'with:', metadata);
      
      // In a real implementation:
      // 1. Upload new metadata to IPFS
      // 2. Update token URI if needed
      // 3. Update database records
      
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, refetchToken]);

  // Transfer NFT
  const transferNFT = useCallback(async (from: string, to: string, nftTokenId: string) => {
    if (!tokenId) throw new Error('Contract token ID is required');
    if (!from || !to || !nftTokenId) {
      throw new Error('From address, to address, and NFT token ID are required');
    }

    setIsOperationLoading(true);
    try {
      console.log('Transferring NFT', nftTokenId, 'from', from, 'to', to);
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, refetchToken]);

  // Combined refetch function
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchToken(),
      fetchProperties()
    ]);
  }, [refetchToken, fetchProperties]);

  return {
    token,
    properties,
    attributes,
    isLoading: isTokenLoading || isOperationLoading,
    error,
    refetch,
    updateProperties,
    mintNFT,
    burnNFT,
    setTokenURI,
    updateMetadata,
    transferNFT
  };
}
