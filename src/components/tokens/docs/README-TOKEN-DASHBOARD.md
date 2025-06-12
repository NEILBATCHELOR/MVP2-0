# Token Dashboard

This README documents the implementation of the Token Dashboard, which provides a comprehensive interface for managing various ERC token standards, including ERC20, ERC721, ERC3525, ERC1155, ERC1400, and ERC4626.

## Overview

The Token Dashboard is designed to display token information in two formats:

1. **Card UI View**: A condensed, at-a-glance summary for quick identification and basic understanding of tokens
2. **Detail View**: A comprehensive display of all token properties organized into logical categories for in-depth management

## Components Structure

- **TokenDashboardPage.tsx**: Main dashboard page component
- **TokenCardView.tsx**: Card UI view component for displaying token summaries
- **TokenDetailView.tsx**: Detailed view component with tabs for different token aspects

## Token Standards Support

The dashboard supports the following token standards with appropriate fields for each:

### ERC20 Token

**Card UI View Fields:**
- Token Name
- Token Symbol
- Standard: "ERC20"
- Features: Displays key capabilities (Mintable, Burnable, Pausable)
- Supply: Total supply

**Detail View Fields:**
- **Basic Information**: Name, Symbol, Decimals, Description
- **Supply Management**: Initial Supply, Mintable, Burnable, Cap
- **Access Control**: Pausable, Access Control System
- **Advanced Features**: Allowance Management, Permit, Snapshot
- **Custom Extensions**: Fee on Transfer, Rebasing (if applicable)

### ERC721 Token (NFTs)

**Card UI View Fields:**
- Collection Name
- Collection Symbol
- Standard: "ERC721"
- Features: Key attributes (Enumerable, Royalties)
- Supply: Total NFTs minted

**Detail View Fields:**
- **Collection Details**: Name, Symbol, Description
- **Metadata**: Storage method, Base URI, Dynamic Metadata, Reveal Mechanism, Contract URI
- **Minting & Supply**: Maximum Supply, Reserved Tokens, Minting Method, Minting Price, Max Mints Per Transaction/Wallet
- **Features**: Enumeration, Pausable Transfers, Burnable Tokens, Safe Transfer, Royalties
- **Advanced Extensions**: Fractional Ownership

### ERC3525 Token (Semi-Fungible)

**Card UI View Fields:**
- Token Name
- Token Symbol
- Standard: "ERC3525"
- Features: Key aspects (Number of Slots, Transferable)
- Supply: Total Tokens

**Detail View Fields:**
- **Token Details**: Name, Symbol, Description, Value Decimals
- **Slots Configuration**: List of Slots with Name, Description, Custom Properties
- **Metadata**: Storage method, Base URI, Dynamic Metadata, Dynamic Attributes, Custom Slot Properties
- **Features & Extensions**: Enumeration, Burnable, Pausable, Fractional Transfers, Slot Transferability, Auto Unit Calculation, Transfer Restrictions, Access Control

### ERC1155 Token (Multi-Token)

**Card UI View Fields:**
- Collection Name
- Collection Symbol
- Standard: "ERC1155"
- Features: Key capabilities (Number of Token Types, Batch Operations)
- Supply: Total Token Types

**Detail View Fields:**
- **Collection Details**: Name, Symbol, Description
- **Token Types**: List with ID, Name, Initial Supply, Fungible (Yes/No), Maximum Supply, Token-Specific URI
- **Metadata**: Storage method, Base URI, Dynamic URIs, Updatable Metadata
- **Features**: Batch Minting, Batch Transfers, Supply Tracking, Minting Roles, Burning, Royalties
- **Advanced Settings**: Access Control, Pausable, Transfer Restrictions, Container Support

### ERC1400 Token (Security Tokens)

**Card UI View Fields:**
- Token Name
- Token Symbol
- Standard: "ERC1400"
- Features: Key aspects (Security Type, Multi-Class)
- Supply: Total Supply

**Detail View Fields:**
- **Security Token Details**: Name, Symbol, Decimals, Initial Supply, Maximum Supply Cap, Security Type
- **Partitions**: Enable Multi-Class, List of Partitions with Name, Initial Amount, Transferable
- **Controllers**: List of Controllers, Enforce KYC, Enable Forced Transfers, Enable Forced Redemption
- **Transfer Restrictions**: Enable Restrictions, Enable Whitelist, Investor Accreditation, Holding Period, Maximum Investor Count, Geographic Restrictions, Automatic Compliance, Manual Approvals
- **Document Management**: Legal Terms, Prospectus, Additional Documents
- **Advanced Features**: Issuable, Pausable, Granular Control, Dividend Distribution, Corporate Actions, External Compliance Module, Custom Features

### ERC4626 Token (Tokenized Vaults)

**Card UI View Fields:**
- Vault Name
- Vault Token Symbol
- Standard: "ERC4626"
- Features: Key aspects (Yield Strategy, Pausable)
- Supply: Total Shares

**Detail View Fields:**
- **Vault Details**: Name, Symbol, Description, Vault Share Decimals
- **Underlying Asset**: Asset Token Address, Asset Name, Asset Symbol, Asset Token Decimals
- **Yield Strategy**: Yield Strategy Type, Strategy Details, Expected APY, Protocol Integrations, Custom Integration Address
- **Parameters**: Fees (Management, Performance, Deposit, Withdrawal), Minimum/Maximum Deposit, Maximum Withdrawal, Maximum Redemption, Access Control Model, Enable Allowlist, Pausable
- **Advanced Features**: Preview Functions, Limit Functions, Custom Hooks, Automatic Reporting

## Features

1. **Token Filtering & Search**:
   - Status-based filtering (Draft, Under Review, Approved, etc.)
   - ERC Standard filtering
   - Blockchain filtering
   - Text search by name, symbol, or address

2. **Token Hierarchy**:
   - Organizes tokens into Primary, Secondary, and Tertiary tiers
   - Groups related tokens under their primary token

3. **Status Management**:
   - Visual status indicators
   - Status update functionality
   - Status-based action buttons

4. **Token Actions**:
   - Edit token (for non-deployed tokens)
   - Deploy token (for approved tokens)
   - View token details
   - Delete token
   - View on blockchain explorer (for deployed tokens)

5. **Responsive Design**:
   - Adapts to different screen sizes
   - Collapsible card sections
   - Modal-based detailed views

## Implementation Details

The Token Dashboard is implemented with:

- React for component structure
- TypeScript for type safety
- ShadCN UI components for consistent styling
- Lucide icons for visual elements

## Usage

The Token Dashboard is accessible at the route:
```
/projects/:projectId/tokens
```

It loads all tokens for the specified project and provides a comprehensive interface for managing them based on their respective ERC standards.

## Future Improvements

Potential future improvements for the Token Dashboard:

1. Add bulk token operations (batch deploy, batch status updates)
2. Implement token analytics and metrics visualizations
3. Add token relationship visualization diagram
4. Enhance filtering with saved filter presets
5. Add token comparison functionality
