import { ethers } from 'ethers';
import { Interface } from 'ethers';

/**
 * Interface for interacting with ONCHAINID Factory contract
 */
export const FactoryInterface = new  Interface([
  // Factory functions
  'function implementationAuthority() external view returns (address)',
  'function createIdentity(address _wallet, bytes32 _salt) external returns (address)',
  'function getIdentity(address _wallet) external view returns (address)',
  'function linkWallet(address _wallet) external returns (bool)',
  'function unlinkWallet(address _wallet) external returns (bool)',
  'function getWallets(address _identity) external view returns (address[])',
  
  // Events
  'event Deployed(address indexed wallet, address indexed identity)',
  'event WalletLinked(address indexed wallet, address indexed identity)',
  'event WalletUnlinked(address indexed wallet, address indexed identity)'
]); 