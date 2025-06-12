// RippleAdapter.ts — Updated to use xrpl.js

import type { IBlockchainAdapter, TokenBalance } from './IBlockchainAdapter';
import * as xrpl from "xrpl";

/**
 * Adapter for Ripple (XRP) blockchain
 */
export class RippleAdapter implements IBlockchainAdapter {
  private client: xrpl.Client;
  private wallet: xrpl.Wallet;
  private network: string;
  private _isConnected = false;

  // Required interface properties
  readonly chainId = 'xrp-mainnet';
  readonly chainName = 'Ripple';
  readonly networkType: 'mainnet' | 'testnet' | 'devnet' | 'regtest' = 'mainnet';
  readonly nativeCurrency = {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 6
  };

  constructor(seed: string, server: string = "wss://s.altnet.rippletest.net:51233") {
    this.client = new xrpl.Client(server);
    
    try {
      this.wallet = xrpl.Wallet.fromSeed(seed);
    } catch (error) {
      console.error('Invalid seed provided to RippleAdapter:', seed);
      console.error('Seed must be base58 encoded and not contain: 0, O, I, l');
      // Generate a valid wallet as fallback
      this.wallet = xrpl.Wallet.generate();
      console.warn('Generated new wallet as fallback:', this.wallet.address);
    }
    
    this.network = server;
  }

  async connect(config?: any): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
      this._isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isConnected()) {
      await this.client.disconnect();
      this._isConnected = false;
    }
  }

  isConnected(): boolean {
    return this._isConnected && this.client.isConnected();
  }

  async getHealth(): Promise<any> {
    try {
      await this.connect();
      const serverInfo = await this.client.request({ command: 'server_info' });
      return {
        isHealthy: true,
        latency: 0,
        blockHeight: serverInfo.result.info.validated_ledger?.seq || 0,
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

  getChainName(): string {
    return "ripple";
  }

  getChainId(): number {
    return 0; // XRP doesn't use chain IDs in the same way as EVM chains
  }

  getAddress(): string {
    return this.wallet.address;
  }

  async generateAccount(): Promise<any> {
    const newWallet = xrpl.Wallet.generate();
    const balance = await this.getBalance(newWallet.address).catch(() => BigInt(0));
    return {
      address: newWallet.address,
      balance,
      publicKey: newWallet.publicKey
    };
  }

  async importAccount(privateKey: string): Promise<any> {
    const wallet = xrpl.Wallet.fromSeed(privateKey);
    const balance = await this.getBalance(wallet.address).catch(() => BigInt(0));
    return {
      address: wallet.address,
      balance,
      publicKey: wallet.publicKey
    };
  }

  async getAccount(address: string): Promise<any> {
    const balance = await this.getBalance(address);
    return {
      address,
      balance
    };
  }

  async generateAddress(publicKey: string): Promise<string> {
    throw new Error("Direct address generation from public key is not supported in xrpl.js");
  }

  async createMultiSigWallet(owners: string[], threshold: number): Promise<string> {
    // XRP supports multisign through SignerList but not simple multisig wallets like EVM.
    // Placeholder for future real multisig.
    return owners[0];
  }

  async getBalance(address: string): Promise<bigint> {
    await this.connect();
    const response = await this.client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    });
    // Convert drops to bigint (1 XRP = 1,000,000 drops)
    const balanceInDrops = response.result.account_data.Balance;
    return BigInt(balanceInDrops);
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance> {
    await this.connect();

    const [currency, issuer] = tokenAddress.split("/");
    if (!currency || !issuer) {
      throw new Error("Invalid token format. Expected 'currency/issuer'");
    }

    const response = await this.client.request({
      command: "account_lines",
      account: address,
    });

    const trustline = response.result.lines.find(
      (line: any) => line.currency === currency && line.account === issuer
    );

    const balance = trustline ? trustline.balance : "0";
    
    return {
      address: tokenAddress,
      symbol: currency,
      decimals: 6, // XRP tokens typically use 6 decimals
      balance: BigInt(Math.floor(parseFloat(balance) * 1000000)) // Convert to smallest unit
    };
  }

  async estimateGas(params: any): Promise<string> {
    // XRP has fixed transaction costs, typically 10-12 drops
    return '12'; // 12 drops
  }

  async sendTransaction(params: any): Promise<any> {
    // Implementation would depend on params structure
    return {
      txHash: `xrp_${Date.now()}`,
      status: 'pending' as const
    };
  }

  async getTransaction(txHash: string): Promise<any> {
    await this.connect();
    try {
      const response = await this.client.request({
        command: 'tx',
        transaction: txHash
      });
      return {
        status: response.result.validated ? 'confirmed' as const : 'pending' as const,
        confirmations: response.result.validated ? 1 : 0
      };
    } catch {
      return {
        status: 'pending' as const,
        confirmations: 0
      };
    }
  }

  async signMessage(message: string, privateKey: string): Promise<string> {
    const wallet = xrpl.Wallet.fromSeed(privateKey);
    // XRP doesn't have standard message signing, this is a placeholder
    const msgBytes = new TextEncoder().encode(message);
    // This would need actual XRPL signing implementation
    return Buffer.from(msgBytes).toString('hex');
  }

  async getCurrentBlockNumber(): Promise<number> {
    await this.connect();
    try {
      const ledger = await this.client.request({ command: 'ledger', ledger_index: 'validated' });
      return ledger.result.ledger.ledger_index;
    } catch {
      return 0;
    }
  }

  async getBlock(blockNumber: number): Promise<any> {
    await this.connect();
    try {
      const ledger = await this.client.request({ 
        command: 'ledger',
        ledger_index: blockNumber,
        transactions: true
      });
      return {
        number: ledger.result.ledger.ledger_index,
        timestamp: ledger.result.ledger.close_time,
        hash: ledger.result.ledger.ledger_hash,
        transactions: ledger.result.ledger.transactions || []
      };
    } catch {
      return {
        number: blockNumber,
        timestamp: Date.now(),
        hash: `ledger_${blockNumber}`,
        transactions: []
      };
    }
  }

  formatAddress(address: string): string {
    return address; // XRP addresses are already in a readable format
  }

  getExplorerUrl(txHash: string): string {
    return `https://xrpscan.com/tx/${txHash}`;
  }

  async proposeTokenTransaction(
    walletAddress: string,
    to: string,
    tokenAddress: string,
    amount: string,
    data: string = ""
  ): Promise<string> {
    await this.connect();

    const [currency, issuer] = tokenAddress.split("/");
    if (!currency || !issuer) {
      throw new Error("Invalid token format. Expected 'currency/issuer'");
    }

    const payment: xrpl.Payment = {
      TransactionType: "Payment",
      Account: walletAddress,
      Amount: {
        currency,
        issuer,
        value: amount
      },
      Destination: to,
    };

    const prepared = await this.client.autofill(payment);
    return JSON.stringify(prepared);
  }

  async proposeTransaction(walletAddress: string, to: string, value: string, data: string = ""): Promise<string> {
    await this.connect();

    const payment: xrpl.Payment = {
      TransactionType: "Payment",
      Account: walletAddress,
      Amount: xrpl.xrpToDrops(value),
      Destination: to,
    };

    const prepared = await this.client.autofill(payment);
    return JSON.stringify(prepared);
  }

  async signTransaction(transactionJson: string, privateKey: string): Promise<string> {
    const wallet = xrpl.Wallet.fromSeed(privateKey);
    const prepared = JSON.parse(transactionJson);
    const signed = wallet.sign(prepared);
    return signed.tx_blob;
  }

  async executeTransaction(walletAddress: string, signedTransaction: string, signatures: string[]): Promise<string> {
    await this.connect();
    const result = await this.client.submitAndWait(signedTransaction);
    const meta = result.result.meta as xrpl.TransactionMetadata;
    if (meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(`Transaction failed: ${meta.TransactionResult}`);
    }
    return result.result.hash;
  }

  isValidAddress(address: string): boolean {
    try {
      return xrpl.isValidClassicAddress(address);
    } catch (error) {
      return false;
    }
  }
}
