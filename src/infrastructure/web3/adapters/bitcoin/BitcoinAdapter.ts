/**
 * Bitcoin Adapter Implementation
 * 
 * Bitcoin-specific adapter implementing UTXO model
 * Supports mainnet, testnet, and regtest networks
 */

import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
// Use bitcoin.js's built-in ecc instead of external secp256k1 library
import { BigNumberish, parseUnits, formatUnits } from 'ethers';
import * as ecc from 'tiny-secp256k1';
import type {
  IBlockchainAdapter,
  NetworkType,
  TransactionParams,
  TransactionResult,
  TransactionStatus,
  AccountInfo,
  ConnectionConfig,
  HealthStatus
} from '../IBlockchainAdapter';
import { BaseBlockchainAdapter } from '../IBlockchainAdapter';

// Initialize ECPair with tiny-secp256k1 (imported as ESM module)
const ECPair = ECPairFactory(ecc);

// Bitcoin network configurations - use bitcoin.networks directly
const BITCOIN_NETWORKS: Record<string, any> = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet,
  regtest: bitcoin.networks.regtest
};

// UTXO interface for Bitcoin transactions
interface UTXO {
  txid: string;
  vout: number;
  value: number; // satoshis
  scriptPubKey: string;
  height?: number;
}

interface BitcoinTransaction {
  txid: string;
  confirmations: number;
  size: number;
  fee: number;
  inputs: Array<{
    txid: string;
    vout: number;
    value: number;
  }>;
  outputs: Array<{
    address: string;
    value: number;
  }>;
}

export class BitcoinAdapter extends BaseBlockchainAdapter {
  private apiUrl?: string;
  private network: any; // Use any instead of bitcoin.Network to avoid import issues

  readonly chainId: string;
  readonly chainName = 'bitcoin';
  readonly networkType: NetworkType;
  readonly nativeCurrency = {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8
  };

  constructor(networkType: NetworkType = 'mainnet') {
    super();
    this.networkType = networkType;
    this.network = BITCOIN_NETWORKS[networkType];
    
    if (!this.network) {
      throw new Error(`Unsupported Bitcoin network: ${networkType}`);
    }

    this.chainId = `bitcoin-${networkType}`;
  }

  // Connection management
  async connect(config: ConnectionConfig): Promise<void> {
    try {
      this.config = config;
      this.apiUrl = config.rpcUrl;

      // Test connection by getting latest block
      await this.getCurrentBlockNumber();
      
      this._isConnected = true;
      console.log(`Connected to Bitcoin ${this.networkType}`);
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Failed to connect to Bitcoin: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.apiUrl = undefined;
    this._isConnected = false;
    console.log('Disconnected from Bitcoin');
  }

  async getHealth(): Promise<HealthStatus> {
    if (!this.apiUrl) {
      return {
        isHealthy: false,
        latency: -1,
        lastChecked: Date.now()
      };
    }

    const startTime = Date.now();
    try {
      const blockHeight = await this.getCurrentBlockNumber();
      const latency = Date.now() - startTime;
      
      return {
        isHealthy: true,
        latency,
        blockHeight,
        lastChecked: Date.now()
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        lastChecked: Date.now()
      };
    }
  }

  // Account operations
  async generateAccount(): Promise<AccountInfo> {
    this.validateConnection();
    
    const keyPair = ECPair.makeRandom({ network: this.network });
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: this.network 
    });

    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }

    const balance = await this.getBalance(address);
    
    return {
      address,
      balance,
      publicKey: keyPair.publicKey.toString('hex')
    };
  }

  async importAccount(privateKey: string): Promise<AccountInfo> {
    this.validateConnection();
    
    try {
      const keyPair = ECPair.fromWIF(privateKey, this.network);
      const { address } = bitcoin.payments.p2pkh({ 
        pubkey: keyPair.publicKey, 
        network: this.network 
      });

      if (!address) {
        throw new Error('Failed to derive address from private key');
      }

      const balance = await this.getBalance(address);
      
      return {
        address,
        balance,
        publicKey: keyPair.publicKey.toString('hex')
      };
    } catch (error) {
      throw new Error(`Invalid Bitcoin private key: ${error}`);
    }
  }

  async getAccount(address: string): Promise<AccountInfo> {
    this.validateConnection();
    
    if (!this.isValidAddress(address)) {
      throw new Error(`Invalid Bitcoin address: ${address}`);
    }

    const balance = await this.getBalance(address);
    
    return {
      address,
      balance
    };
  }

  async getBalance(address: string): Promise<bigint> {
    this.validateConnection();
    
    if (!this.isValidAddress(address)) {
      throw new Error(`Invalid Bitcoin address: ${address}`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/address/${address}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance');
      }

      // Balance is returned in satoshis, convert to bigint
      const balanceInSatoshis = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      return BigInt(balanceInSatoshis);
    } catch (error) {
      throw new Error(`Failed to get Bitcoin balance: ${error}`);
    }
  }

  // Transaction operations
  async estimateGas(params: TransactionParams): Promise<string> {
    this.validateConnection();
    
    // Bitcoin uses fees per byte, not gas
    // This is a simplified estimation
    const estimatedSize = 250; // Average transaction size in bytes
    const feeRate = await this.getFeeRate();
    const estimatedFee = estimatedSize * feeRate;
    
    return estimatedFee.toString();
  }

  async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    this.validateConnection();
    
    // Note: This is a simplified implementation
    // In production, you'd need proper UTXO selection and signing
    throw new Error('Bitcoin transaction sending requires UTXO management - implement with BitcoinWalletManager');
  }

  async getTransaction(txHash: string): Promise<TransactionStatus> {
    this.validateConnection();
    
    try {
      const response = await fetch(`${this.apiUrl}/tx/${txHash}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Transaction not found');
      }

      const currentBlock = await this.getCurrentBlockNumber();
      const confirmations = data.status.confirmed 
        ? currentBlock - data.status.block_height + 1 
        : 0;

      return {
        status: data.status.confirmed ? 'confirmed' : 'pending',
        confirmations,
        blockNumber: data.status.block_height,
        timestamp: data.status.block_time
      };
    } catch (error) {
      throw new Error(`Failed to get Bitcoin transaction: ${error}`);
    }
  }

  async signMessage(message: string, privateKey: string): Promise<string> {
    try {
      const keyPair = ECPair.fromWIF(privateKey, this.network);
      const signature = keyPair.sign(Buffer.from(message, 'utf8'));
      return signature.toString('hex');
    } catch (error) {
      throw new Error(`Bitcoin message signing failed: ${error}`);
    }
  }

  // Block operations
  async getCurrentBlockNumber(): Promise<number> {
    this.validateConnection();
    
    try {
      const response = await fetch(`${this.apiUrl}/blocks/tip/height`);
      const height = await response.text();
      
      if (!response.ok) {
        throw new Error('Failed to get block height');
      }

      return parseInt(height, 10);
    } catch (error) {
      throw new Error(`Failed to get Bitcoin block height: ${error}`);
    }
  }

  async getBlock(blockNumber: number): Promise<{
    number: number;
    timestamp: number;
    hash: string;
    transactions: string[];
  }> {
    this.validateConnection();
    
    try {
      // Get block hash first
      const hashResponse = await fetch(`${this.apiUrl}/block-height/${blockNumber}`);
      const blockHash = await hashResponse.text();
      
      if (!hashResponse.ok) {
        throw new Error('Block not found');
      }

      // Get block details
      const response = await fetch(`${this.apiUrl}/block/${blockHash}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get block');
      }

      return {
        number: blockNumber,
        timestamp: data.timestamp,
        hash: blockHash,
        transactions: data.tx || []
      };
    } catch (error) {
      throw new Error(`Failed to get Bitcoin block: ${error}`);
    }
  }

  // Utility methods
  isValidAddress(address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address, this.network);
      return true;
    } catch {
      return false;
    }
  }

  formatAddress(address: string): string {
    // Bitcoin addresses are already in their canonical format
    return address;
  }

  getExplorerUrl(txHash: string): string {
    const baseUrls = {
      mainnet: 'https://blockstream.info',
      testnet: 'https://blockstream.info/testnet',
      regtest: 'http://localhost:3000' // Local explorer for regtest
    };

    const baseUrl = baseUrls[this.networkType as keyof typeof baseUrls];
    return `${baseUrl}/tx/${txHash}`;
  }

  // Bitcoin-specific methods
  async getUTXOs(address: string): Promise<UTXO[]> {
    this.validateConnection();
    
    try {
      const response = await fetch(`${this.apiUrl}/address/${address}/utxo`);
      const utxos = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to get UTXOs');
      }

      return utxos.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: utxo.scriptpubkey,
        height: utxo.status.block_height
      }));
    } catch (error) {
      throw new Error(`Failed to get UTXOs: ${error}`);
    }
  }

  async getFeeRate(): Promise<number> {
    this.validateConnection();
    
    try {
      const response = await fetch(`${this.apiUrl}/fee-estimates`);
      const feeData = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to get fee estimates');
      }

      // Return fee rate for 6 block confirmation (sat/vB)
      return feeData['6'] || 10; // fallback to 10 sat/vB
    } catch (error) {
      console.warn('Failed to get fee rate, using default:', error);
      return 10; // Default fee rate
    }
  }

  async broadcastTransaction(rawTx: string): Promise<string> {
    this.validateConnection();
    
    try {
      const response = await fetch(`${this.apiUrl}/tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: rawTx
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.text(); // Returns transaction ID
    } catch (error) {
      throw new Error(`Failed to broadcast Bitcoin transaction: ${error}`);
    }
  }

  // Create a simple Bitcoin transaction
  async createTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number, // in satoshis
    privateKey: string,
    feeRate?: number
  ): Promise<string> {
    this.validateConnection();

    if (!this.isValidAddress(fromAddress) || !this.isValidAddress(toAddress)) {
      throw new Error('Invalid Bitcoin address');
    }

    try {
      const utxos = await this.getUTXOs(fromAddress);
      const fee = feeRate || await this.getFeeRate();
      
      // Simple UTXO selection (first-fit)
      let totalInput = 0;
      const selectedUtxos: UTXO[] = [];
      const estimatedSize = 250; // bytes
      const totalNeeded = amount + (estimatedSize * fee);

      for (const utxo of utxos) {
        selectedUtxos.push(utxo);
        totalInput += utxo.value;
        if (totalInput >= totalNeeded) break;
      }

      if (totalInput < totalNeeded) {
        throw new Error('Insufficient funds');
      }

      // Create transaction
      const keyPair = ECPair.fromWIF(privateKey, this.network);
      const tx = new bitcoin.Transaction();

      // Add inputs
      for (const utxo of selectedUtxos) {
        tx.addInput(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout);
      }

      // Add outputs
      tx.addOutput(bitcoin.address.toOutputScript(toAddress, this.network), amount);

      // Add change output if needed
      const change = totalInput - amount - (estimatedSize * fee);
      if (change > 546) { // Dust threshold
        tx.addOutput(bitcoin.address.toOutputScript(fromAddress, this.network), change);
      }

      // Sign inputs
      for (let i = 0; i < selectedUtxos.length; i++) {
        tx.sign(i, keyPair);
      }

      return tx.toHex();
    } catch (error) {
      throw new Error(`Failed to create Bitcoin transaction: ${error}`);
    }
  }
}
