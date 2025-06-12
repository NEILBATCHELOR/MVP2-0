/**
 * Token ABI definitions and interfaces for Web3 operations
 * 
 * This file contains the standard ABIs for various token standards
 * that are used by the token adapter classes.
 */

// ERC20 Standard ABI
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ERC721 Standard ABI
export const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
];

// ERC1155 Standard ABI
export const ERC1155_ABI = [
  "function uri(uint256 id) view returns (string)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
  "event URI(string value, uint256 indexed id)"
];

// ERC1400 Security Token Standard ABI
export const ERC1400_ABI = [
  // ERC20 compatibility
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // ERC1400 specific functions
  "function getDocument(bytes32 name) view returns (string, bytes32, uint256)",
  "function setDocument(bytes32 name, string uri, bytes32 documentHash)",
  "function removeDocument(bytes32 name)",
  "function getAllDocuments() view returns (bytes32[])",
  "function isControllable() view returns (bool)",
  "function canTransfer(address to, uint256 value, bytes data) view returns (bytes1, bytes32)",
  "function canTransferFrom(address from, address to, uint256 value, bytes data) view returns (bytes1, bytes32)",
  "function canTransferByPartition(bytes32 partition, address to, uint256 value, bytes data) view returns (bytes1, bytes32, bytes32)",
  "function transferByPartition(bytes32 partition, address to, uint256 value, bytes data) returns (bytes32)",
  "function transferFromByPartition(bytes32 partition, address from, address to, uint256 value, bytes data, bytes operatorData) returns (bytes32)",
  "function partitionsOf(address tokenHolder) view returns (bytes32[])",
  "function balanceOfByPartition(bytes32 partition, address tokenHolder) view returns (uint256)",
  "function getDefaultPartitions() view returns (bytes32[])",
  "function setDefaultPartitions(bytes32[] partitions)",
  "function controllerTransfer(address from, address to, uint256 value, bytes data, bytes operatorData)",
  "function controllerRedeem(address tokenHolder, uint256 value, bytes data, bytes operatorData)",
  "function isIssuable() view returns (bool)",
  "function issue(address tokenHolder, uint256 value, bytes data)",
  "function issueByPartition(bytes32 partition, address tokenHolder, uint256 value, bytes data)",
  "function redeem(uint256 value, bytes data)",
  "function redeemFrom(address tokenHolder, uint256 value, bytes data)",
  "function redeemByPartition(bytes32 partition, uint256 value, bytes data)",
  "function operatorRedeemByPartition(bytes32 partition, address tokenHolder, uint256 value, bytes data, bytes operatorData)",
  
  // Events
  "event Document(bytes32 indexed name, string uri, bytes32 documentHash)",
  "event DocumentRemoved(bytes32 indexed name, string uri, bytes32 documentHash)",
  "event TransferByPartition(bytes32 indexed fromPartition, address operator, address indexed from, address indexed to, uint256 value, bytes data, bytes operatorData)",
  "event ChangedPartition(bytes32 indexed fromPartition, bytes32 indexed toPartition, uint256 value)",
  "event AuthorizedOperator(address indexed operator, address indexed tokenHolder)",
  "event RevokedOperator(address indexed operator, address indexed tokenHolder)",
  "event AuthorizedOperatorByPartition(bytes32 indexed partition, address indexed operator, address indexed tokenHolder)",
  "event RevokedOperatorByPartition(bytes32 indexed partition, address indexed operator, address indexed tokenHolder)",
  "event Issued(address indexed operator, address indexed to, uint256 value, bytes data)",
  "event Redeemed(address indexed operator, address indexed from, uint256 value, bytes data)",
  "event IssuedByPartition(bytes32 indexed partition, address indexed operator, address indexed to, uint256 value, bytes data)",
  "event RedeemedByPartition(bytes32 indexed partition, address indexed operator, address indexed from, uint256 value, bytes data, bytes operatorData)"
];

// ERC3525 Semi-Fungible Token Standard ABI
export const ERC3525_ABI = [
  // ERC165
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  
  // ERC721 compatibility
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  
  // ERC3525 specific functions
  "function valueDecimals() view returns (uint8)",
  "function valueOf(uint256 tokenId) view returns (uint256)",
  "function slotOf(uint256 tokenId) view returns (uint256)",
  "function approve(uint256 tokenId, address to, uint256 value)",
  "function allowance(uint256 tokenId, address operator) view returns (uint256)",
  "function transferFrom(uint256 fromTokenId, address to, uint256 value) returns (uint256)",
  "function transferFrom(uint256 fromTokenId, uint256 toTokenId, uint256 value)",
  "function contractURI() view returns (string)",
  "function slotURI(uint256 slot) view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event TransferValue(uint256 indexed fromTokenId, uint256 indexed toTokenId, uint256 value)",
  "event ApprovalValue(uint256 indexed tokenId, address indexed operator, uint256 value)",
  "event SlotChanged(uint256 indexed tokenId, uint256 indexed oldSlot, uint256 indexed newSlot)"
];

// ERC4626 Tokenized Vault Standard ABI
export const ERC4626_ABI = [
  // ERC20 compatibility
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // ERC4626 specific functions
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function maxDeposit(address receiver) view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function maxMint(address receiver) view returns (uint256)",
  "function previewMint(uint256 shares) view returns (uint256)",
  "function mint(uint256 shares, address receiver) returns (uint256)",
  "function maxWithdraw(address owner) view returns (uint256)",
  "function previewWithdraw(uint256 assets) view returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function maxRedeem(address owner) view returns (uint256)",
  "function previewRedeem(uint256 shares) view returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)",
  "event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)"
];

// Re-export interfaces from the main TokenInterfaces file for compatibility
export * from '@/components/tokens/interfaces/TokenInterfaces';
