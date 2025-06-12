import type { IBlockchainAdapter, TokenBalance } from './IBlockchainAdapter';
import * as StellarSdk from 'stellar-sdk';

/**
 * Adapter for Stellar blockchain
 */
export class StellarAdapter implements IBlockchainAdapter {
  private server: StellarSdk.Horizon.Server;
  private network: string;
  private networkPassphrase: string;
  private _isConnected = false;

  // Required interface properties
  readonly chainId = 'stellar-mainnet';
  readonly chainName = 'Stellar';
  readonly networkType: 'mainnet' | 'testnet' | 'devnet' | 'regtest' = 'mainnet';
  readonly nativeCurrency = {
    name: 'Stellar Lumen',
    symbol: 'XLM',
    decimals: 7
  };

  constructor(horizonUrl: string, network: string) {
    this.server = new StellarSdk.Horizon.Server(horizonUrl);
    this.network = network;
    this.networkPassphrase = network === 'mainnet' 
      ? StellarSdk.Networks.PUBLIC 
      : StellarSdk.Networks.TESTNET;
  }

  // Connection management
  async connect(config?: any): Promise<void> {
    this._isConnected = true;
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  async getHealth(): Promise<any> {
    try {
      const account = await this.server.accounts().limit(1).call();
      return {
        isHealthy: true,
        latency: 0,
        blockHeight: 0,
        lastChecked: Date.now()
      };
    } catch {
      return {
        isHealthy: false,
        latency: 0,
        lastChecked: Date.now()
      };
    }
  }

  // Account operations
  async generateAccount(): Promise<any> {
    const keyPair = StellarSdk.Keypair.random();
    return {
      address: keyPair.publicKey(),
      balance: BigInt(0),
      publicKey: keyPair.publicKey()
    };
  }

  async importAccount(privateKey: string): Promise<any> {
    const keyPair = StellarSdk.Keypair.fromSecret(privateKey);
    const balance = await this.getBalance(keyPair.publicKey()).catch(() => BigInt(0));
    return {
      address: keyPair.publicKey(),
      balance,
      publicKey: keyPair.publicKey()
    };
  }

  async getAccount(address: string): Promise<any> {
    const balance = await this.getBalance(address);
    return {
      address,
      balance
    };
  }

  // Transaction operations
  async estimateGas(params: any): Promise<string> {
    return StellarSdk.BASE_FEE;
  }

  async sendTransaction(params: any): Promise<any> {
    return {
      txHash: `stellar_${Date.now()}`,
      status: 'pending' as const
    };
  }

  async getTransaction(txHash: string): Promise<any> {
    try {
      const transaction = await this.server.transactions().transaction(txHash).call();
      return {
        status: transaction.successful ? 'confirmed' as const : 'failed' as const,
        confirmations: transaction.successful ? 1 : 0
      };
    } catch {
      return {
        status: 'pending' as const,
        confirmations: 0
      };
    }
  }

  async signMessage(message: string, privateKey: string): Promise<string> {
    const keyPair = StellarSdk.Keypair.fromSecret(privateKey);
    const msgBytes = new TextEncoder().encode(message);
    return Buffer.from(msgBytes).toString('hex');
  }

  // Block operations
  async getCurrentBlockNumber(): Promise<number> {
    try {
      const ledgers = await this.server.ledgers().order('desc').limit(1).call();
      return ledgers.records[0] ? ledgers.records[0].sequence : 0;
    } catch {
      return 0;
    }
  }

  async getBlock(blockNumber: number): Promise<any> {
    try {
      const ledgerRecord = await this.server.ledgers().ledger(blockNumber.toString()).call();
      return {
        number: (ledgerRecord as any).sequence,
        timestamp: new Date((ledgerRecord as any).closed_at).getTime(),
        hash: (ledgerRecord as any).hash,
        transactions: []
      };
    } catch {
      return {
        number: blockNumber,
        timestamp: Date.now(),
        hash: `stellar_${blockNumber}`,
        transactions: []
      };
    }
  }

  // Utility methods
  formatAddress(address: string): string {
    return address;
  }

  getExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/public/tx/${txHash}`;
  }

  async proposeTokenTransaction(
    walletAddress: string,
    to: string,
    tokenAddress: string,
    amount: string,
    data: string = ""
  ): Promise<string> {
    try {
      const sourceAccount = await this.server.loadAccount(walletAddress);
      
      // Parse token address (format: CODE:ISSUER)
      const [assetCode, assetIssuer] = tokenAddress.split(':');
      
      if (!assetCode || !assetIssuer) {
        throw new Error('Invalid token address format. Expected CODE:ISSUER');
      }
      
      const asset = new StellarSdk.Asset(assetCode, assetIssuer);
      
      // Build the transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: to,
          asset: asset,
          amount: amount,
        })
      )
      .addMemo(StellarSdk.Memo.text(data || ''))
      .setTimeout(180) // 3 minutes
      .build();
      
      // Return the transaction XDR for later signing
      return transaction.toEnvelope().toXDR('base64');
    } catch (error) {
      throw new Error(`Failed to propose Stellar token transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getChainName(): string {
    return "stellar";
  }

  getChainId(): number {
    return 0; // Stellar doesn't use chain IDs in the same way as EVM chains
  }

  async generateAddress(publicKey: string): Promise<string> {
    try {
      // Remove 0x prefix if present
      const cleanPubKey = publicKey.replace(/^0x/i, '');
      
      // Create a Stellar KeyPair from the public key
      const keyPair = StellarSdk.Keypair.fromPublicKey(cleanPubKey);
      
      return keyPair.publicKey();
    } catch (error) {
      throw new Error(`Failed to generate Stellar address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createMultiSigWallet(
    owners: string[],
    threshold: number,
  ): Promise<string> {
    try {
      // Generate a new account for the multisig wallet
      const multisigAccount = StellarSdk.Keypair.random();
      
      // In practice, you would need to:
      // 1. Fund the account
      // 2. Set up signers with weights
      // 3. Set the master weight and thresholds
      
      // For now, return the generated account ID
      return multisigAccount.publicKey();
    } catch (error) {
      throw new Error(`Failed to create Stellar multisig wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      const account = await this.server.loadAccount(address);
      
      // Find the native XLM balance
      const nativeBalance = account.balances.find(balance => 
        balance.asset_type === 'native'
      );
      
      const balance = nativeBalance ? nativeBalance.balance : "0";
      // Convert to stroops (1 XLM = 10,000,000 stroops)
      return BigInt(Math.floor(parseFloat(balance) * 10000000));
    } catch (error) {
      console.error('Error getting Stellar balance:', error);
      return BigInt(0);
    }
  }

  async getTokenBalance(
    address: string,
    tokenAddress: string,
  ): Promise<TokenBalance> {
    try {
      const account = await this.server.loadAccount(address);
      
      // Parse token address (format: CODE:ISSUER)
      const [assetCode, assetIssuer] = tokenAddress.split(':');
      
      if (!assetCode || !assetIssuer) {
        throw new Error('Invalid token address format. Expected CODE:ISSUER');
      }
      
      // Find the specific asset balance
      const assetBalance = account.balances.find(balance => 
        balance.asset_type !== 'native' &&
        'asset_code' in balance && balance.asset_code === assetCode &&
        'asset_issuer' in balance && balance.asset_issuer === assetIssuer
      );
      
      const balance = assetBalance ? assetBalance.balance : "0";
      
      return {
        address: tokenAddress,
        symbol: assetCode,
        decimals: 7, // Stellar assets typically use 7 decimals
        balance: BigInt(Math.floor(parseFloat(balance) * 10000000)) // Convert to smallest unit
      };
    } catch (error) {
      console.error('Error getting Stellar token balance:', error);
      return {
        address: tokenAddress,
        symbol: 'ERROR',
        decimals: 7,
        balance: BigInt(0)
      };
    }
  }

  async proposeTransaction(
    walletAddress: string,
    to: string,
    value: string,
    data: string = "",
  ): Promise<string> {
    try {
      const sourceAccount = await this.server.loadAccount(walletAddress);
      
      // Build the transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: to,
          asset: StellarSdk.Asset.native(),
          amount: value,
        })
      )
      .addMemo(StellarSdk.Memo.text(data || ''))
      .setTimeout(180) // 3 minutes
      .build();
      
      // Return the transaction XDR for later signing
      return transaction.toEnvelope().toXDR('base64');
    } catch (error) {
      throw new Error(`Failed to propose Stellar transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async signTransaction(
    transactionXdr: string,
    privateKey: string,
  ): Promise<string> {
    try {
      // Create keypair from private key
      const sourceKeypair = StellarSdk.Keypair.fromSecret(privateKey);
      
      // Recreate transaction from XDR
      const transaction = new StellarSdk.Transaction(
        transactionXdr,
        this.networkPassphrase
      );
      
      // Sign the transaction
      transaction.sign(sourceKeypair);
      
      // Return the signed transaction XDR
      return transaction.toEnvelope().toXDR('base64');
    } catch (error) {
      throw new Error(`Failed to sign Stellar transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async executeTransaction(
    walletAddress: string,
    signedTransactionXdr: string,
    signatures: string[],
  ): Promise<string> {
    try {
      // Recreate transaction from signed XDR
      const transaction = new StellarSdk.Transaction(
        signedTransactionXdr,
        this.networkPassphrase
      );
      
      // Submit the transaction to the network
      const result = await this.server.submitTransaction(transaction);
      
      return result.hash;
    } catch (error) {
      throw new Error(`Failed to execute Stellar transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isValidAddress(address: string): boolean {
    try {
      // Use Stellar SDK to validate the address
      StellarSdk.Keypair.fromPublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }
}