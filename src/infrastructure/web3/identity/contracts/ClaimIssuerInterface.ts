import { Interface } from 'ethers';

/**
 * Interface for interacting with ONCHAINID Claim Issuer contract
 */
export const ClaimIssuerInterface = new Interface([
  // Claim Issuer functions
  'function isClaimValid(address _identity, uint256 _topic, bytes _data, bytes _signature) external view returns (bool)',
  'function revokeClaimBySignature(bytes _signature) external returns (bool)',
  'function revokedClaims(bytes32 _signature) external view returns (bool)',
  
  // Events
  'event ClaimRevoked(bytes32 indexed signature)'
]); 