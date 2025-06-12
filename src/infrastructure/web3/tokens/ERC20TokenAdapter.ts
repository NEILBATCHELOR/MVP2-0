import { Contract, Interface, parseUnits, formatUnits, Wallet, type Provider } from "ethers";
import { BaseTokenAdapter } from "./TokenAdapter";
import { Token } from "@/components/wallet/components/swap/types";

/**
 * Adapter for ERC-20 tokens
 */
export class ERC20TokenAdapter extends BaseTokenAdapter {
  private readonly ERC20_INTERFACE = new Interface([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
  ]);

  constructor(provider: Provider) {
    super(provider);
  }

  async getTokenMetadata(tokenAddress: string): Promise<Token> {
    try {
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, this.provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        address: tokenAddress,
        logoURI: '', // Would need external service for logo
        chainId: Number((await this.provider.getNetwork()).chainId),
      };
    } catch (error) {
      throw new Error(`Failed to get ERC20 token metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getBalance(tokenAddress: string, ownerAddress: string): Promise<string> {
    try {
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, this.provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(ownerAddress),
        contract.decimals(),
      ]);
      
      return formatUnits(balance, decimals);
    } catch (error) {
      throw new Error(`Failed to get ERC20 balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async transfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string
  ): Promise<string> {
    try {
      const wallet = new Wallet(privateKey, this.provider);
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, wallet);
      
      const decimals = await contract.decimals();
      const parsedAmount = parseUnits(amount, decimals);
      
      const tx = await contract.transfer(toAddress, parsedAmount);
      return tx.hash;
    } catch (error) {
      throw new Error(`Failed to transfer ERC20 tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async estimateTransferGas(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<string> {
    try {
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, this.provider);
      const decimals = await contract.decimals();
      const parsedAmount = parseUnits(amount, decimals);
      
      const gasEstimate = await contract.transfer.estimateGas(toAddress, parsedAmount, {
        from: fromAddress,
      });
      
      return gasEstimate.toString();
    } catch (error) {
      throw new Error(`Failed to estimate ERC20 transfer gas: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<string> {
    try {
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, this.provider);
      const [allowance, decimals] = await Promise.all([
        contract.allowance(ownerAddress, spenderAddress),
        contract.decimals(),
      ]);
      
      return formatUnits(allowance, decimals);
    } catch (error) {
      throw new Error(`Failed to get ERC20 allowance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async approve(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string,
    amount: string,
    privateKey: string
  ): Promise<string> {
    try {
      const wallet = new Wallet(privateKey, this.provider);
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, wallet);
      
      const decimals = await contract.decimals();
      const parsedAmount = parseUnits(amount, decimals);
      
      const tx = await contract.approve(spenderAddress, parsedAmount);
      return tx.hash;
    } catch (error) {
      throw new Error(`Failed to approve ERC20 tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async supportsInterface(tokenAddress: string, interfaceId: string): Promise<boolean> {
    try {
      // ERC20 tokens don't typically implement ERC165, so we check for standard methods
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, this.provider);
      
      // Try to call basic ERC20 methods to verify support
      await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  getSupportedStandards(): string[] {
    return ["ERC20"];
  }

  /**
   * Check if the contract implements ERC20 standard
   */
  async isERC20(tokenAddress: string): Promise<boolean> {
    try {
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, this.provider);
      
      // Check for essential ERC20 methods
      await Promise.all([
        contract.totalSupply(),
        contract.balanceOf("0x0000000000000000000000000000000000000000"),
      ]);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get token transfer events for an address
   */
  async getTransferEvents(
    tokenAddress: string,
    address: string,
    fromBlock: number = 0,
    toBlock: number | string = "latest"
  ): Promise<any[]> {
    try {
      const contract = new Contract(tokenAddress, this.ERC20_INTERFACE, this.provider);
      
      const transferFilter = contract.filters.Transfer(null, null, null);
      const events = await contract.queryFilter(transferFilter, fromBlock, toBlock);
      
      // Filter events where address is sender or receiver
      return events.filter(event => {
        // Check if it's an EventLog (has args property)
        if ('args' in event && event.args) {
          return (
            event.args[0].toLowerCase() === address.toLowerCase() || 
            event.args[1].toLowerCase() === address.toLowerCase()
          );
        }
        return false;
      });
    } catch (error) {
      throw new Error(`Failed to get transfer events: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
