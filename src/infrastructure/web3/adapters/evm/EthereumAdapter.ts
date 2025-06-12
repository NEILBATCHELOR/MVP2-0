/**
 * Ethereum Adapter
 * 
 * Ethereum-specific implementation extending the base EVM adapter
 * Supports both mainnet and testnet (Sepolia)
 */

import { EVMAdapter } from './EVMAdapter';
import type { SupportedChain, NetworkType } from '../IBlockchainAdapter';

export class EthereumAdapter extends EVMAdapter {
  constructor(networkType: NetworkType = 'mainnet') {
    const configs = {
      mainnet: {
        chainId: '1',
        explorerUrl: 'https://etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      },
      testnet: {
        chainId: '11155111',
        explorerUrl: 'https://sepolia.etherscan.io',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 }
      }
    };

    const config = configs[networkType as keyof typeof configs];
    if (!config) {
      throw new Error(`Unsupported network type for Ethereum: ${networkType}`);
    }

    super(
      'ethereum' as SupportedChain,
      networkType,
      config.chainId,
      config.nativeCurrency,
      config.explorerUrl
    );
  }

  // Ethereum-specific methods can be added here
  async getEIP1559FeeData() {
    return await this.getFeeData();
  }

  // Override explorer URL for contract verification
  getContractExplorerUrl(contractAddress: string): string {
    const baseUrl = this.networkType === 'mainnet' 
      ? 'https://etherscan.io' 
      : 'https://sepolia.etherscan.io';
    return `${baseUrl}/address/${contractAddress}`;
  }
}
