import {
  type WalletClient,
  createWalletClient,
  custom,
  formatEther,
  parseEther,
  parseUnits,
  type Address,
  type Hash,
  type Transport,
  type Chain,
  type Account,
  createPublicClient,
  http,
  getContract as viemGetContract,
  PublicClient,
  type Client,
} from 'viem';
import { JsonRpcProvider, Wallet, Contract, JsonRpcSigner } from "ethers";
import { supabase } from "@/infrastructure/database/client";
import { logActivity } from "@/infrastructure/activityLogger";
import MultiSigWalletService from "./MultiSigWalletService";
import { TokenType } from '@/types/core/centralModels';
import { providerManager, NetworkEnvironment } from "@/infrastructure/web3/ProviderManager";
import type { SupportedChain } from '@/infrastructure/web3/adapters/IBlockchainAdapter';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

// Mock key vault client - replace with actual implementation
const keyVaultClient = {
  getKey: async (keyId: string) => {
    // Mock implementation - in production would get from secure key vault
    return process.env.VITE_DEPLOYER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
  }
};

// Wallet types
export enum WalletType {
  EOA = "EOA", // Externally Owned Account
  MULTISIG = "MULTISIG", // Multi-signature wallet
  SMART = "SMART", // Smart contract wallet
}

// Wallet interface
export interface WalletEntity {
  id?: string;
  address: string;
  type: WalletType;
  name: string;
  chainId: number;
  isDefault?: boolean;
  createdAt?: string;
  userId?: string;
  contractAddress?: string;
  signers?: string[];
  requiredConfirmations?: number;
  blockchain?: string;
  encryptedPrivateKey?: string;
}

// Transaction interface
export interface Transaction {
  id?: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
  chainId: number;
  hash?: string;
  status?: "pending" | "confirmed" | "failed";
  timestamp?: string;
  blockNumber?: number;
  description?: string;
  blockchain?: string;
}

// Helper type to avoid infinite type recursion
type SafeWalletClient = {
  account: Account;
  sendTransaction: (args: any) => Promise<`0x${string}`>;
  signMessage: (args: any) => Promise<`0x${string}`>;
  signTransaction: (args: any) => Promise<`0x${string}`>;
  getChainId: () => Promise<number>;
};

// Wallet Manager class to handle wallet operations
export class WalletManager {
  private provider: SafeWalletClient | null = null;
  private publicClient: any = null;
  private userId: string | null = null;
  private userEmail: string | null = null;
  private chainId: number | null = null;
  private currentBlockchain: string = "ethereum"; // Default blockchain
  private currentEnvironment: NetworkEnvironment = NetworkEnvironment.TESTNET; // Default environment
  private account: string | null = null;
  private static instance: WalletManager;

  constructor() {
    // Note: ProviderManager doesn't have onEnvironmentChange method
    // Environment changes will be handled differently
  }

  // Get singleton instance of WalletManager
  public static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  // Initialize the wallet manager
  async initialize(config: { chainId?: string }): Promise<void> {
    try {
      const privateKey = await keyVaultClient.getKey('wallet');
      
      if (!privateKey) {
        throw new Error("No private key found in key vault");
      }
      
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      
      // Set the current environment (default to testnet)
      this.currentEnvironment = NetworkEnvironment.TESTNET;
      
      // Get network configuration from provider manager
      const networkConfig = providerManager.getNetworkConfig(this.currentBlockchain as SupportedChain, this.currentEnvironment);
      
      // Get provider from provider manager
      const ethProvider = providerManager.getProvider(this.currentBlockchain as SupportedChain);
      
      // Use provider manager's provider for public client
      this.publicClient = createPublicClient({
        chain: {
          id: networkConfig.chainId,
          name: networkConfig.name,
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: {
            default: { http: ["https://mainnet.infura.io/v3/"] },
            public: { http: ["https://mainnet.infura.io/v3/"] }
          }
        },
        transport: http("https://mainnet.infura.io/v3/"),
      }) as any;
      
      // Create wallet client with account from private key
      const walletClient = createWalletClient({
        account,
        chain: {
          id: networkConfig.chainId,
          name: networkConfig.name,
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: {
            default: { http: ["https://mainnet.infura.io/v3/"] },
            public: { http: ["https://mainnet.infura.io/v3/"] }
          }
        },
        transport: custom(window.ethereum || {}),
      });
      
      // Create simplified client to avoid type recursion
      this.provider = {
        account,
        sendTransaction: (args) => walletClient.sendTransaction(args),
        signMessage: (args) => walletClient.signMessage(args),
        signTransaction: (args) => walletClient.signTransaction(args),
        getChainId: () => Promise.resolve(networkConfig.chainId),
      };
      
      this.account = account.address;
      this.chainId = config.chainId ? parseInt(config.chainId) : networkConfig.chainId;
      
      // Initialize dependent managers
      await this.initializeManagers();
    } catch (error) {
      console.error("Failed to initialize wallet manager:", error);
    }
  }

  private async initializeManagers(): Promise<void> {
    if (this.provider && this.account) {
      // Get provider from provider manager
      const ethProvider = providerManager.getProvider(this.currentBlockchain as SupportedChain);
      const providerUrl = "https://mainnet.infura.io/v3/";
      
      // Initialize dependent managers would go here if we had tokenManager
      console.log("Wallet manager initialized with provider:", providerUrl);
    }
  }

  // Handle environment changes from ProviderManager
  private async handleEnvironmentChange(environment: NetworkEnvironment): Promise<void> {
    this.currentEnvironment = environment;
    
    try {
      // Get network configuration for the new blockchain in the new environment
      const networkConfig = providerManager.getNetworkConfig(this.currentBlockchain as SupportedChain, environment);
      
      // Get provider from provider manager
      const ethProvider = providerManager.getProvider(this.currentBlockchain as SupportedChain);
      
      // Update public client with the new provider
      this.publicClient = createPublicClient({
        chain: {
          id: networkConfig.chainId,
          name: networkConfig.name,
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: {
            default: { http: ["https://mainnet.infura.io/v3/"] },
            public: { http: ["https://mainnet.infura.io/v3/"] }
          }
        },
        transport: http("https://mainnet.infura.io/v3/"),
      }) as any;
      
      // For wallet client, update with the new chain info but keep using window.ethereum
      if (this.provider && this.provider.account) {
        const walletClient = createWalletClient({
          account: this.provider.account,
          chain: {
            id: networkConfig.chainId,
            name: networkConfig.name,
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: {
              default: { http: ["https://mainnet.infura.io/v3/"] },
              public: { http: ["https://mainnet.infura.io/v3/"] }
            }
          },
          transport: custom(window.ethereum || {}),
        });
        
        // Update with simplified interface
        this.provider = {
          account: this.provider.account,
          sendTransaction: (args) => walletClient.sendTransaction(args),
          signMessage: (args) => walletClient.signMessage(args),
          signTransaction: (args) => walletClient.signTransaction(args),
          getChainId: () => Promise.resolve(networkConfig.chainId),
        };
      }
      
      // Update chain ID
      this.chainId = networkConfig.chainId;
      
      // Initialize managers with provider URL
      await this.initializeManagers();
      
      await this.logWalletAction("environment_changed", {
        blockchain: this.currentBlockchain,
        environment: environment,
        chainId: this.chainId,
      });
    } catch (error: any) {
      console.error("Failed to handle environment change:", error);
      await this.logWalletAction("environment_change_failed", {
        error: error.message,
      });
    }
  }

  // Switch blockchain network
  async switchBlockchain(blockchain: string): Promise<boolean> {
    try {
      if (this.currentBlockchain === blockchain) {
        return true;
      }

      this.currentBlockchain = blockchain;
      
      // Get network configuration for the new blockchain
      const networkConfig = providerManager.getNetworkConfig(blockchain as SupportedChain, this.currentEnvironment);
      
      // Get provider from provider manager
      const provider = providerManager.getProvider(blockchain as SupportedChain);
      
      // Update public client with the new provider
      this.publicClient = createPublicClient({
        chain: {
          id: networkConfig.chainId,
          name: networkConfig.name,
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: {
            default: { http: ["https://mainnet.infura.io/v3/"] },
            public: { http: ["https://mainnet.infura.io/v3/"] }
          }
        },
        transport: http("https://mainnet.infura.io/v3/"),
      }) as any;
      
      // For wallet client, update with the new chain info but keep using window.ethereum
      if (this.provider && this.provider.account) {
        const walletClient = createWalletClient({
          account: this.provider.account,
          chain: {
            id: networkConfig.chainId,
            name: networkConfig.name,
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: {
              default: { http: ["https://mainnet.infura.io/v3/"] },
              public: { http: ["https://mainnet.infura.io/v3/"] }
            }
          },
          transport: custom(window.ethereum || {}),
        });
        
        // Update with simplified interface
        this.provider = {
          account: this.provider.account,
          sendTransaction: (args) => walletClient.sendTransaction(args),
          signMessage: (args) => walletClient.signMessage(args),
          signTransaction: (args) => walletClient.signTransaction(args),
          getChainId: () => Promise.resolve(networkConfig.chainId),
        };
      }
      
      // Update chain ID
      this.chainId = networkConfig.chainId;
      
      // Initialize managers with provider
      await this.initializeManagers();

      await this.logWalletAction("blockchain_switched", {
        blockchain: blockchain,
        environment: this.currentEnvironment,
        chainId: this.chainId,
      });

      return true;
    } catch (error: any) {
      console.error(`Failed to switch to blockchain ${blockchain}:`, error);
      await this.logWalletAction("blockchain_switch_failed", {
        blockchain: blockchain,
        error: error.message,
      });
      return false;
    }
  }

  // Get current blockchain
  getCurrentBlockchain(): string {
    return this.currentBlockchain;
  }

  // Get current environment
  getCurrentEnvironment(): NetworkEnvironment {
    return this.currentEnvironment;
  }

  // Switch environment (mainnet/testnet)
  async switchEnvironment(environment: NetworkEnvironment): Promise<boolean> {
    try {
      if (this.currentEnvironment === environment) {
        return true; // Already in this environment
      }

      // Update the current environment
      this.currentEnvironment = environment;
      
      // Handle the environment change directly
      await this.handleEnvironmentChange(environment);
      
      return true;
    } catch (error: any) {
      console.error(`Failed to switch to environment ${environment}:`, error);
      await this.logWalletAction("environment_switch_failed", {
        environment: environment,
        error: error.message,
      });
      return false;
    }
  }

  // Get wallet balance using publicClient instead of provider
  async getWalletBalance(walletAddress: string): Promise<{
    balance: string;
    formattedBalance: string;
  }> {
    try {
      if (!this.publicClient) {
        throw new Error("Wallet manager not initialized");
      }

      // Get ETH balance using the public client
      const balance = await this.publicClient.getBalance({
        address: walletAddress as `0x${string}`,
      });

      const formattedBalance = formatEther(balance);

      return {
        balance: balance.toString(),
        formattedBalance,
      };
    } catch (error: any) {
      console.error(`Failed to get balance for ${walletAddress}:`, error);
      return {
        balance: "0",
        formattedBalance: "0",
      };
    }
  }

  // Send transaction handling both EOA and MultiSig wallets
  async sendTransaction(
    fromWalletId: string,
    to: string,
    valueEther: string,
    txData: string = "0x",
    password?: string,
    description?: string,
  ): Promise<Transaction | null> {
    try {
      if (!this.provider || !this.chainId || !this.account) {
        throw new Error("Wallet manager not initialized");
      }

      // Get wallet
      const wallet = await this.getWalletById(fromWalletId);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      let hash: string;

      if (wallet.type === WalletType.EOA) {
        // Send transaction using wallet client
        try {
          hash = await this.provider.sendTransaction({
            to: to as `0x${string}`,
            value: parseEther(valueEther),
            data: txData as `0x${string}`,
          });
        } catch (error: any) {
          console.error("Failed to send transaction:", error);
          throw new Error(`Transaction failed: ${error.message}`);
        }
      } else if (wallet.type === WalletType.MULTISIG) {
        // For MultiSig wallet, submit a transaction proposal
        if (!wallet.contractAddress) {
          throw new Error("Contract address not found for MultiSig wallet");
        }

        // Get provider from provider manager
        const ethProvider = providerManager.getProvider(this.currentBlockchain as SupportedChain);
        const providerUrl = "https://mainnet.infura.io/v3/";
        
        // Submit transaction using MultiSigWalletService
        const transactionId = await MultiSigWalletService.proposeTransaction(
          wallet.id || "",
          to,
          valueEther,
          txData
        );

        if (!transactionId) {
          throw new Error("Failed to submit transaction to MultiSig wallet");
        }

        // Return a placeholder transaction for MultiSig
        return {
          id: transactionId,
          from: wallet.address,
          to,
          value: valueEther,
          data: txData,
          chainId: this.chainId,
          status: "pending",
          timestamp: new Date().toISOString(),
          description: description || "Transaction from wallet manager",
          blockchain: this.currentBlockchain,
        };
      } else {
        throw new Error(`Unsupported wallet type: ${wallet.type}`);
      }

      // Create transaction object
      const transaction: Transaction = {
        from: wallet.address,
        to,
        value: valueEther,
        data: txData,
        chainId: this.chainId,
        hash,
        status: "pending",
        timestamp: new Date().toISOString(),
        description: description || "Transaction from wallet manager",
        blockchain: this.currentBlockchain,
      };

      // Save to database
      const { data, error } = await supabase
        .from("wallet_transactions")
        .insert({
          from_address: transaction.from,
          to_address: transaction.to,
          value: parseFloat(transaction.value),
          data: transaction.data ? JSON.stringify({ txData: transaction.data }) : null,
          chain_id: this.chainId.toString(),
          hash: transaction.hash,
          status: transaction.status,
          created_at: transaction.timestamp,
        })
        .select()
        .single();

      if (error) throw error;

      // Log transaction
      await this.logWalletAction("transaction_sent", {
        transactionId: data.id,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        hash: transaction.hash,
        status: transaction.status,
        blockchain: transaction.blockchain,
      });

      return {
        id: data.id,
        ...transaction,
      };
    } catch (error: any) {
      console.error("Failed to send transaction:", error);
      await this.logWalletAction("transaction_failed", {
        from: fromWalletId,
        to,
        value: valueEther,
        error: error.message,
        blockchain: this.currentBlockchain,
      });
      return null;
    }
  }

  // Transfer tokens
  async transferTokens(
    walletId: string,
    tokenAddress: string,
    tokenType: TokenType,
    to: string,
    amount: string,
    password: string,
    tokenId?: string,
    partition?: string,
  ): Promise<string | null> {
    try {
      // Get wallet
      const wallet = await this.getWalletById(walletId);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (!this.provider || !this.publicClient) {
        throw new Error("Wallet manager not initialized");
      }

      // Token transfer should be handled by a token service
      if (wallet.type === WalletType.EOA) {
        // For EOA wallet, direct transfer - would need token manager implementation
        throw new Error("Token transfers for EOA wallets not yet implemented");
      } else if (wallet.type === WalletType.MULTISIG) {
        // For MultiSig wallet, submit transfer through MultiSig
        if (!wallet.contractAddress) {
          throw new Error("Contract address not found for MultiSig wallet");
        }

        // Get provider from provider manager
        const ethProvider = providerManager.getProvider(this.currentBlockchain as SupportedChain);
        const providerUrl = "https://mainnet.infura.io/v3/";
        
        // Create data for token transfer
        let data: string;
        
        // We'll construct the data manually since we don't have access to encodeTokenTransferData
        if (tokenType === TokenType.ERC20) {
          // ERC20 transfer function signature + parameters
          const functionSignature = "0xa9059cbb"; // transfer(address,uint256)
          const paddedAddress = to.slice(2).padStart(64, '0');
          const paddedAmount = BigInt(parseFloat(amount) * 10**18).toString(16).padStart(64, '0');
          data = `${functionSignature}${paddedAddress}${paddedAmount}`;
        } else if (tokenType === TokenType.ERC721 && tokenId) {
          // ERC721 transferFrom function signature + parameters
          const functionSignature = "0x23b872dd"; // transferFrom(address,address,uint256)
          const paddedFromAddress = wallet.address.slice(2).padStart(64, '0');
          const paddedToAddress = to.slice(2).padStart(64, '0');
          const paddedTokenId = BigInt(tokenId).toString(16).padStart(64, '0');
          data = `${functionSignature}${paddedFromAddress}${paddedToAddress}${paddedTokenId}`;
        } else {
          throw new Error(`Unsupported token type: ${tokenType}`);
        }

        const description = `Transfer ${amount} ${tokenType} tokens to ${to}`;
        
        // Submit transaction using MultiSigWalletService
        const transactionId = await MultiSigWalletService.proposeTransaction(
          wallet.id || "",
          tokenAddress,
          "0",
          data
        );

        return transactionId;
      } else {
        throw new Error(`Unsupported wallet type: ${wallet.type}`);
      }
    } catch (error: any) {
      console.error("Failed to transfer tokens:", error);
      await this.logWalletAction("token_transfer_failed", {
        walletId,
        tokenAddress,
        tokenType,
        to,
        amount,
        error: error.message,
      });
      return null;
    }
  }

  // Get wallet by ID
  async getWalletById(walletId: string): Promise<WalletEntity | null> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(walletId)) {
        console.error(`Invalid wallet ID format: ${walletId}`);
        return null;
      }

      // Get wallet from database
      const { data, error } = await supabase
        .from("multi_sig_wallets")
        .select("*")
        .eq("id", walletId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Transform data to match our interface
      return {
        id: data.id,
        address: data.address,
        type: WalletType.MULTISIG, // Default to MULTISIG type
        name: data.name,
        chainId: 1, // Default to Ethereum mainnet
        isDefault: false, // Default value
        createdAt: data.created_at,
        userId: data.created_by,
        signers: data.owners,
        requiredConfirmations: data.owners?.length > 0 ? Math.ceil(data.owners.length / 2) : 1, // Use majority as fallback
        blockchain: data.blockchain,
        encryptedPrivateKey: 'encrypted_private_key' in data ? (data.encrypted_private_key as string) : undefined,
      };
    } catch (error: any) {
      console.error(`Failed to get wallet ${walletId}:`, error);
      return null;
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('Wallet not initialized');
    }
    
    // Find the blockchain that corresponds to this chainId
    const blockchain = this.getBlockchainFromChainId(chainId);
    
    // If we found a blockchain, switch to it
    if (blockchain) {
      await this.switchBlockchain(blockchain);
    } else {
      // If no blockchain matches, try to switch directly using window.ethereum
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      this.chainId = chainId;
    }
  }

  // Get connected address
  public async getConnectedAddress(): Promise<string | null> {
    return this.account;
  }

  // Disconnect method
  public async disconnect(): Promise<void> {
    this.provider = null;
    this.publicClient = null;
    this.account = null;
    this.chainId = null;
    await this.logWalletAction("wallet_disconnected", {});
  }

  // Check if wallet is connected
  public isConnected(blockchain?: string): boolean {
    // If blockchain is specified, check if we're connected to that specific blockchain
    if (blockchain && this.currentBlockchain !== blockchain) {
      return false;
    }
    
    // Otherwise just check if we have a provider and account
    return !!this.provider && !!this.account;
  }

  // Add disconnectInjectedWallet method to match references in components
  public async disconnectInjectedWallet(): Promise<boolean> {
    try {
      await this.disconnect();
      return true;
    } catch (error: any) {
      console.error("Failed to disconnect injected wallet:", error);
      await this.logWalletAction("wallet_disconnect_failed", { error: error.message });
      return false;
    }
  }

  async getWalletInfo(): Promise<{
    address: string;
    chainId: number;
    blockchain?: string;
  }> {
    if (!this.provider || !this.account) {
      throw new Error('Wallet not initialized');
    }

    return {
      address: this.account,
      chainId: this.chainId || 1,
      blockchain: this.currentBlockchain,
    };
  }

  async getProvider(): Promise<WalletClient> {
    if (!this.provider) {
      throw new Error('Wallet not initialized');
    }
    // Return the provider as any to bypass type checking
    return this.provider as any;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not initialized');
    }
    return this.provider.signMessage({ message });
  }

  async signTransaction(transaction: any): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not initialized');
    }
    return this.provider.signTransaction(transaction);
  }

  private getBlockchainFromChainId(chainId: number): string | null {
    switch (chainId) {
      case 1:
        return 'ethereum';
      case 137:
        return 'polygon';
      case 10:
        return 'optimism';
      case 42161:
        return 'arbitrum';
      case 8453:
        return 'base';
      default:
        return null;
    }
  }

  // Log wallet actions to activity logger
  private async logWalletAction(action: string, details: any): Promise<void> {
    try {
      if (!this.userId) return;
      
      await logActivity({
        action: action,
        entity_type: "wallet",
        entity_id: details.walletId || details.address || "unknown",
        details: {
          ...details,
          user_id: this.userId,
          user_email: this.userEmail
        },
        status: details.status || "success"
      });
    } catch (error) {
      console.error("Failed to log wallet action:", error);
    }
  }

  // Update connectInjectedWallet to use viem with providerManager
  public async connectInjectedWallet(): Promise<boolean> {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        throw new Error("No injected web3 provider found");
      }

      const privateKey = await keyVaultClient.getKey('wallet');
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      
      // Get network configuration from provider manager
      const networkConfig = providerManager.getNetworkConfig(this.currentBlockchain as SupportedChain, this.currentEnvironment);
      
      // Get provider from provider manager
      const ethProvider = providerManager.getProvider(this.currentBlockchain as SupportedChain);
      
      const walletClient = createWalletClient({
        account,
        chain: {
          id: networkConfig.chainId,
          name: networkConfig.name,
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: {
            default: { http: ["https://mainnet.infura.io/v3/"] },
            public: { http: ["https://mainnet.infura.io/v3/"] }
          }
        },
        transport: custom(ethereum)
      });
      
      // Create simplified interface
      this.provider = {
        account,
        sendTransaction: (args) => walletClient.sendTransaction(args),
        signMessage: (args) => walletClient.signMessage(args),
        signTransaction: (args) => walletClient.signTransaction(args),
        getChainId: () => Promise.resolve(networkConfig.chainId)
      };

      // Update public client with the provider
      this.publicClient = createPublicClient({
        chain: {
          id: networkConfig.chainId,
          name: networkConfig.name,
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: {
            default: { http: ["https://mainnet.infura.io/v3/"] },
            public: { http: ["https://mainnet.infura.io/v3/"] }
          }
        },
        transport: http("https://mainnet.infura.io/v3/"),
      }) as any;

      this.chainId = networkConfig.chainId;
      this.account = account.address;
      
      await this.logWalletAction("wallet_connected", { 
        chainId: this.chainId, 
        address: this.account 
      });
      
      return true;
    } catch (error: any) {
      console.error("Failed to connect injected wallet:", error);
      await this.logWalletAction("wallet_connect_failed", { error: error.message });
      return false;
    }
  }
}

// Create and export a singleton instance
export const walletManager = new WalletManager();
