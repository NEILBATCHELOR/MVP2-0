# ERC Basic Configurations

Below is a detailed explanation of the tokenization engine's functionality, including the supported financial products and their minimal configurations based on the provided ERC standards and React components. This will help guide the implementation of the system.

---

## Tokenization Engine Functionality

The tokenization engine enables the creation, deployment, and management of tokenized financial products on Ethereum-compatible blockchains using various ERC standards. It supports both individual token creation and complex token templates that combine multiple standards to represent sophisticated financial instruments. The engine is designed to be flexible, allowing users to configure tokens via a user interface (React components) and deploy them to multiple blockchain networks.

### Supported ERC Standards and Financial Products

The engine supports the following ERC standards, each tailored to specific financial products:

| **ERC Standard** | **Supported Financial Products** | **Description** |
| --- | --- | --- |
| **ERC-20** | - Currencies (e.g., stablecoins)
- Utility tokens
- Simple shares or equity
- Commodities (e.g., tokenized gold) | Fungible tokens for standardized, interchangeable assets. |
| **ERC-721** | - Unique assets (e.g., art, collectibles)
- Real estate
- Intellectual property rights
- Unique financial instruments (e.g., bespoke bonds) | Non-fungible tokens (NFTs) for unique, indivisible assets. |
| **ERC-1155** | - Gaming items (fungible and non-fungible)
- Bundles of assets
- Semi-fungible tokens (e.g., event tickets)
- Financial products with multiple classes | Multi-token standard supporting both fungible and non-fungible tokens in a single contract. |
| **ERC-1400** | - Regulated securities
- Equity shares with compliance
- Debt instruments (e.g., bonds)
- Funds and investment vehicles | Security tokens with compliance features like transfer restrictions and partitions. |
| **ERC-3525** | - Financial derivatives
- Structured products
- Fractional ownership of assets
- Multi-class shares | Semi-fungible tokens combining uniqueness with fractionalization for complex financial structures. |
| **ERC-4626** | - Yield-generating vaults
- Funds and ETFs
- Staking pools
- Lending protocols | Tokenized vaults for yield-bearing assets with deposit/withdrawal mechanics. |

### Minimal Configurations

Each ERC standard requires a specific set of configurations, as defined in the React components (ERC20Config.tsx, ERC721Config.tsx, etc.). These configurations are used to generate smart contracts and deploy them to the blockchain.

### **1. ERC-20 (Fungible Tokens)**

- **Financial Products**: Currencies, utility tokens, shares, commodities.
- **Minimal Configuration**:
    - name: String (e.g., "My Token") - Token name.
    - symbol: String (e.g., "MTK") - Token symbol.
    - decimals: Number (default: 18) - Decimal places for precision.
    - initialSupply: String (e.g., "1000000") - Initial token supply.
    - isMintable: Boolean - Allow minting after deployment.
    - isBurnable: Boolean - Allow burning tokens.
    - isPausable: Boolean - Allow pausing transfers.
    - cap: String (optional) - Maximum supply limit.
    - description: String (optional) - Token description.

### **2. ERC-721 (Non-Fungible Tokens)**

- **Financial Products**: Unique assets, real estate, IP rights, unique instruments.
- **Minimal Configuration**:
    - name: String (e.g., "My NFT Collection") - Collection name.
    - symbol: String (e.g., "MNFT") - Collection symbol.
    - baseUri: String (e.g., "ipfs://...") - Base URI for metadata.
    - metadataStorage: String (e.g., "ipfs") - Storage method (IPFS, Arweave, etc.).
    - maxSupply: String (optional) - Maximum number of NFTs.
    - hasRoyalty: Boolean - Enable royalties (EIP-2981).
    - royaltyPercentage: String (e.g., "5.0") - Royalty percentage.
    - royaltyReceiver: String (e.g., "0x...") - Royalty recipient address.
    - description: String (optional) - Collection description.

### **3. ERC-1155 (Multi-Token Standard)**

- **Financial Products**: Gaming items, asset bundles, semi-fungible tokens, multi-class products.
- **Minimal Configuration**:
    - name: String (e.g., "My Multi-Token Collection") - Collection name.
    - symbol: String (e.g., "MMT") - Collection symbol.
    - baseUri: String (e.g., "ipfs://...") - Base URI for metadata.
    - metadataStorage: String (e.g., "ipfs") - Storage method.
    - batchMinting: Boolean - Allow batch minting.
    - hasRoyalty: Boolean - Enable royalties.
    - royaltyPercentage: String (e.g., "5.0") - Royalty percentage.
    - royaltyReceiver: String (e.g., "0x...") - Royalty recipient address.
    - tokenTypes: Array of objects:
        - id: String (e.g., "1") - Token ID.
        - name: String (e.g., "Gold Coin") - Token name.
        - supply: String (e.g., "1000") - Initial supply.
        - fungible: Boolean - Fungible or non-fungible.
    - description: String (optional) - Collection description.

### **4. ERC-1400 (Security Tokens)**

- **Financial Products**: Regulated securities, equity shares, debt instruments, funds.
- **Minimal Configuration**:
    - name: String (e.g., "My Security Token") - Token name.
    - symbol: String (e.g., "MST") - Token symbol.
    - decimals: Number (default: 18) - Decimal places.
    - initialSupply: String (e.g., "1000000") - Initial supply.
    - cap: String (optional) - Maximum supply limit.
    - partitions: Array of objects (for multi-class tokens):
        - name: String (e.g., "Class A Shares") - Partition name.
        - amount: String (e.g., "500000") - Initial amount.
    - controllers: Array of strings (e.g., ["0x..."]) - Compliance controller addresses.
    - isIssuable: Boolean - Allow minting after deployment.
    - isMultiClass: Boolean - Enable multiple partitions.
    - transferRestrictions: Boolean - Enable compliance restrictions.
    - trancheTransferability: Boolean - Allow transfers between partitions.
    - description: String (optional) - Token description.

### **5. ERC-3525 (Semi-Fungible Tokens)**

- **Financial Products**: Derivatives, structured products, fractional ownership, multi-class shares.
- **Minimal Configuration**:
    - name: String (e.g., "My Semi-Fungible Token") - Token name.
    - symbol: String (e.g., "MSFT") - Token symbol.
    - decimals: Number (default: 18) - Decimal places for fractional units.
    - baseUri: String (e.g., "ipfs://...") - Base URI for metadata.
    - metadataStorage: String (e.g., "ipfs") - Storage method.
    - slots: Array of objects:
        - id: String (e.g., "1") - Slot ID.
        - name: String (e.g., "Series A Bonds") - Slot name.
        - description: String (e.g., "First series bonds") - Slot description.
    - description: String (optional) - Token description.

### **6. ERC-4626 (Tokenized Vaults)**

- **Financial Products**: Yield vaults, funds, staking pools, lending protocols.
- **Minimal Configuration**:
    - name: String (e.g., "My Yield Vault") - Vault name.
    - symbol: String (e.g., "MYV") - Vault token symbol.
    - decimals: Number (default: 18) - Decimal places for vault shares.
    - assetAddress: String (e.g., "0x...") - Underlying ERC-20 token address.
    - assetDecimals: Number (default: 18) - Decimals of the underlying asset.
    - fee: Number or object (e.g., { enabled: true, managementFee: "0.5" }) - Fee structure.
    - minDeposit: String (e.g., "100") - Minimum deposit amount.
    - maxDeposit: String (e.g., "1000000") - Maximum deposit amount.
    - pausable: Boolean - Allow pausing deposits/withdrawals.
    - description: String (optional) - Vault description.

---

## Token Templates

Token templates allow combining multiple ERC standards to represent complex financial products. For example:

- **Tokenized Fund**: Combines ERC-4626 (vault) with ERC-1400 (compliant shares).
- **Real Estate Token**: Uses ERC-721 (property) with ERC-20 (fractional shares).

### Example Template Configuration

The blocks field in the token_templates table (stored as JSONB) defines the structure and relationships.

json

Copy

`{
  "tokens": [
    {
      "standard": "ERC-4626",
      "config": {
        "name": "My Fund Vault",
        "symbol": "MFV",
        "assetAddress": "0x...",
        "decimals": 18,
        "fee": { "enabled": true, "managementFee": "0.5" }
      }
    },
    {
      "standard": "ERC-1400",
      "config": {
        "name": "My Fund Shares",
        "symbol": "MFS",
        "decimals": 18,
        "initialSupply": "1000000",
        "transferRestrictions": true
      }
    }
  ],
  "relationships": {
    "ERC-4626": {
      "shareToken": "ERC-1400"
    }
  }
}`

- **Explanation**: The ERC-4626 vault manages assets, and the ERC-1400 token represents compliant shares tied to the vault.

---

## Implementation Details

### Key Components

1. **Token Creation**:
    - API: POST /projects/{project_id}/tokens
    - Input: ERC standard and configuration (e.g., from ERC20Config.tsx).
    - Stores token details in the database.
2. **Token Template Creation**:
    - API: POST /projects/{project_id}/token_templates
    - Input: JSON structure with multiple tokens and relationships.
    - Stores in token_templates table with blocks field.
3. **Deployment**:
    - API: POST /tokens/{token_id}/deploy or POST /token_templates/{template_id}/deploy
    - Process:
        - Generate smart contract code using templates (e.g., OpenZeppelin).
        - Deploy to specified blockchain (e.g., Ethereum, Polygon) using services like Infura or Alchemy.
        - Store contract addresses and transaction hashes.
4. **Operations**:
    - APIs: POST /tokens/{token_id}/mint, /burn, /pause, etc.
    - Calls corresponding smart contract functions (e.g., mint, burn).
5. **Project Management**:
    - APIs: CRUD operations for projects (GET /projects, POST /projects, etc.).
    - Organizes tokens and templates under projects.
6. **Compliance and Security**:
    - ERC-1400: Implements transfer restrictions and controller roles.
    - Role-based access control for API operations.

### Deployment Support

- **Networks**: Ethereum mainnet/testnets, Polygon, Optimism, Arbitrum, etc.
- **Tools**: Integrates with blockchain nodes or services (Infura, Alchemy) for deployment.

### Smart Contract Templates

- Use parameterized templates (e.g., OpenZeppelin contracts) for each ERC standard.
- Customize based on user configurations (e.g., mintable, pausable).

---

Below is an example API implementation for creating an ERC-20 token, which can be adapted for other standards.

## Conclusion

The tokenization engine supports a wide range of financial products through ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, and ERC-4626 standards. Each standard has a minimal configuration defined in the provided React components, enabling users to create tokens tailored to their needs. Token templates further enhance flexibility by combining standards for complex use cases. The implementation involves APIs for creation, deployment, and operations, integrated with blockchain networks and smart contract templates. This structure provides a robust foundation for building a scalable tokenization platform.