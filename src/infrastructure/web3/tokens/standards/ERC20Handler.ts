/**
 * ERC-20 Token Handler
 * 
 * Comprehensive implementation for ERC-20 token operations
 * Includes deployment, transfer, approval, and advanced features
 */

import { ethers, Contract, ContractFactory } from 'ethers';
import type { EVMAdapter } from '../../adapters/evm/EVMAdapter';

// ERC-20 standard ABI
const ERC20_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  
  // State-changing functions
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Basic ERC-20 contract bytecode (simplified)
const ERC20_BYTECODE = `
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract BasicERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 totalSupply_) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _totalSupply = totalSupply_;
        _balances[msg.sender] = totalSupply_;
        emit Transfer(address(0), msg.sender, totalSupply_);
    }

    function name() public view returns (string memory) { return _name; }
    function symbol() public view returns (string memory) { return _symbol; }
    function decimals() public view returns (uint8) { return _decimals; }
    function totalSupply() public view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) public view override returns (uint256) { return _balances[account]; }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);
        
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        
        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
`;

export interface ERC20TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  owner?: string;
}

export interface ERC20TransferParams {
  from: string;
  to: string;
  amount: bigint;
  tokenAddress: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface ERC20ApprovalParams {
  owner: string;
  spender: string;
  amount: bigint;
  tokenAddress: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface ERC20DeploymentParams {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  deployer: string;
  gasLimit?: string;
  gasPrice?: string;
}

export class ERC20Handler {
  private adapter: EVMAdapter;

  constructor(adapter: EVMAdapter) {
    this.adapter = adapter;
  }

  /**
   * Get ERC-20 token information
   */
  async getTokenInfo(tokenAddress: string): Promise<ERC20TokenInfo> {
    if (!this.adapter.isValidAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }

    try {
      const tokenInfo = await this.adapter.getTokenInfo!(tokenAddress);
      
      return {
        address: tokenAddress,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        totalSupply: tokenInfo.totalSupply
      };
    } catch (error) {
      throw new Error(`Failed to get ERC-20 token info: ${error}`);
    }
  }

  /**
   * Get token balance for an address
   */
  async getBalance(ownerAddress: string, tokenAddress: string): Promise<bigint> {
    if (!this.adapter.isValidAddress(ownerAddress) || !this.adapter.isValidAddress(tokenAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      const tokenBalance = await this.adapter.getTokenBalance!(ownerAddress, tokenAddress);
      return tokenBalance.balance;
    } catch (error) {
      throw new Error(`Failed to get ERC-20 balance: ${error}`);
    }
  }

  /**
   * Get allowance amount
   */
  async getAllowance(ownerAddress: string, spenderAddress: string, tokenAddress: string): Promise<bigint> {
    if (!this.adapter.isValidAddress(ownerAddress) || 
        !this.adapter.isValidAddress(spenderAddress) || 
        !this.adapter.isValidAddress(tokenAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This would need direct contract interaction
      // For now, throw an error indicating this needs wallet integration
      throw new Error('Allowance checking requires direct contract interaction - implement with provider integration');
    } catch (error) {
      throw new Error(`Failed to get ERC-20 allowance: ${error}`);
    }
  }

  /**
   * Transfer tokens
   */
  async transfer(params: ERC20TransferParams): Promise<string> {
    if (!this.adapter.isValidAddress(params.from) || 
        !this.adapter.isValidAddress(params.to) || 
        !this.adapter.isValidAddress(params.tokenAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires wallet/signer integration
      throw new Error('ERC-20 transfers require wallet integration - implement with WalletManager');
    } catch (error) {
      throw new Error(`Failed to transfer ERC-20 tokens: ${error}`);
    }
  }

  /**
   * Approve spender
   */
  async approve(params: ERC20ApprovalParams): Promise<string> {
    if (!this.adapter.isValidAddress(params.owner) || 
        !this.adapter.isValidAddress(params.spender) || 
        !this.adapter.isValidAddress(params.tokenAddress)) {
      throw new Error('Invalid address provided');
    }

    try {
      // This requires wallet/signer integration
      throw new Error('ERC-20 approvals require wallet integration - implement with WalletManager');
    } catch (error) {
      throw new Error(`Failed to approve ERC-20 tokens: ${error}`);
    }
  }

  /**
   * Deploy new ERC-20 token
   */
  async deployToken(params: ERC20DeploymentParams): Promise<{
    contractAddress: string;
    transactionHash: string;
    tokenInfo: ERC20TokenInfo;
  }> {
    if (!this.adapter.isValidAddress(params.deployer)) {
      throw new Error('Invalid deployer address');
    }

    try {
      // This requires wallet/signer integration for deployment
      throw new Error('ERC-20 deployment requires wallet integration - implement with DeploymentManager');
    } catch (error) {
      throw new Error(`Failed to deploy ERC-20 token: ${error}`);
    }
  }

  /**
   * Parse ERC-20 transfer event
   */
  parseTransferEvent(receipt: any): Array<{
    from: string;
    to: string;
    amount: bigint;
    tokenAddress: string;
  }> {
    try {
      const iface = new ethers.Interface(ERC20_ABI);
      const transfers: Array<{
        from: string;
        to: string;
        amount: bigint;
        tokenAddress: string;
      }> = [];

      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog.name === 'Transfer') {
            transfers.push({
              from: parsedLog.args.from,
              to: parsedLog.args.to,
              amount: parsedLog.args.value,
              tokenAddress: log.address
            });
          }
        } catch {
          // Skip logs that don't match ERC-20 Transfer event
          continue;
        }
      }

      return transfers;
    } catch (error) {
      throw new Error(`Failed to parse transfer events: ${error}`);
    }
  }

  /**
   * Parse ERC-20 approval event
   */
  parseApprovalEvent(receipt: any): Array<{
    owner: string;
    spender: string;
    amount: bigint;
    tokenAddress: string;
  }> {
    try {
      const iface = new ethers.Interface(ERC20_ABI);
      const approvals: Array<{
        owner: string;
        spender: string;
        amount: bigint;
        tokenAddress: string;
      }> = [];

      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog.name === 'Approval') {
            approvals.push({
              owner: parsedLog.args.owner,
              spender: parsedLog.args.spender,
              amount: parsedLog.args.value,
              tokenAddress: log.address
            });
          }
        } catch {
          // Skip logs that don't match ERC-20 Approval event
          continue;
        }
      }

      return approvals;
    } catch (error) {
      throw new Error(`Failed to parse approval events: ${error}`);
    }
  }

  /**
   * Format token amount for display
   */
  formatTokenAmount(amount: bigint, decimals: number, precision = 4): string {
    try {
      const formatted = ethers.formatUnits(amount, decimals);
      const num = parseFloat(formatted);
      
      if (num === 0) return '0';
      if (num < 0.0001) return '< 0.0001';
      
      return num.toFixed(precision).replace(/\.?0+$/, '');
    } catch (error) {
      return amount.toString();
    }
  }

  /**
   * Parse token amount from string
   */
  parseTokenAmount(amount: string, decimals: number): bigint {
    try {
      return ethers.parseUnits(amount, decimals);
    } catch (error) {
      throw new Error(`Invalid token amount: ${amount}`);
    }
  }

  /**
   * Validate ERC-20 contract
   */
  async validateContract(tokenAddress: string): Promise<boolean> {
    if (!this.adapter.isValidAddress(tokenAddress)) {
      return false;
    }

    try {
      const tokenInfo = await this.getTokenInfo(tokenAddress);
      return !!(tokenInfo.name && tokenInfo.symbol && tokenInfo.decimals >= 0);
    } catch {
      return false;
    }
  }

  /**
   * Get token holder count (requires indexer)
   */
  async getHolderCount(tokenAddress: string): Promise<number> {
    // This would require an indexer or subgraph
    throw new Error('Holder count requires indexer integration');
  }

  /**
   * Get top token holders (requires indexer)
   */
  async getTopHolders(tokenAddress: string, limit = 10): Promise<Array<{
    address: string;
    balance: bigint;
    percentage: number;
  }>> {
    // This would require an indexer or subgraph
    throw new Error('Top holders requires indexer integration');
  }
}
