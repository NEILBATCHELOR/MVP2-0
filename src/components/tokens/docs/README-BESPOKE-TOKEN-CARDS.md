# Bespoke Token Card System

## Overview

The `BespokeTokenCardView` component provides enhanced, standard-specific token card visualizations for the Token Dashboard. Each token standard (ERC20, ERC721, ERC1155, etc.) features a unique visual design and specialized rendering of the most relevant properties for that standard.

## Features

### Visual Differentiation by Token Standard

- **ERC20** – Blue theme, currency-focused fields
- **ERC721** – Purple theme, NFT-specific metadata and properties
- **ERC1155** – Amber theme, multi-token display
- **ERC1400** – Green theme, security token focus with security_type information
- **ERC3525** – Pink theme, semi-fungible tokens with slot information
- **ERC4626** – Cyan theme, vault-based tokens with strategy parameters

### UX Enhancements

- **Status Indicators**: Left border color indicates token status (green for deployed, blue for approved, etc.)
- **Quick Action Buttons**: One-click access to "View Details", "Change Status", "Deploy", and "Delete" functionality
- **Tooltips**: Explains each token standard clearly
- **Improved Badges**: Visual differentiation for features (Mintable, Burnable, KYC Required, etc.)
- **Subtle Gradients**: Background styling for easy visual differentiation between standards

### Information Architecture

- **Standard-Specific Fields**: Shows the most relevant properties for each token standard
- **Quick View Summary**: High-level token information visible at a glance
- **Compact Mode**: Streamlined view for secondary and tertiary tokens

## Implementation

The component provides:

1. **Bespoke Layouts**: Tailored for each token standard
2. **Consistent Styling**: Uses a cohesive design system with standard-specific colors
3. **Responsive UI**: Works well on all screen sizes
4. **Accessible Design**: Follows best practices for accessibility

## Usage

```tsx
<BespokeTokenCardView
  token={token}
  isExpanded={isExpanded}
  onToggleExpanded={handleToggleExpanded}
  onSelect={handleSelectToken}
  onEdit={handleEditToken}
  onViewDetails={handleViewTokenDetails}
  onDeploy={handleDeployToken}
  onUpdateStatus={handleUpdateTokenStatus}
  onDelete={handleDeleteToken}
  formatDate={formatDate}
  getStandardBadge={getStandardBadge}
  getStatusBadge={getStatusBadge}
  getTokenTierBadge={getTokenTierBadge}
  getActionButtons={getActionButtons}
  compact={false} // Set to true for secondary/tertiary tokens
/>
```

## Standard-Specific Rendering

### ERC20 (Fungible Tokens)

Key properties emphasized:
- Initial Supply
- Decimals
- Mintable/Burnable status

### ERC721 (Non-Fungible Tokens)

Key properties emphasized:
- Max Supply
- Base URI
- Auto-increment IDs
- KYC Required status

### ERC1155 (Multi-Tokens)

Key properties emphasized:
- Metadata Storage
- URI
- Token Types
- KYC Required status

### ERC1400 (Security Tokens)

Key properties emphasized:
- Security Type
- Document URI
- Initial Supply
- KYC Required status

### ERC3525 (Semi-Fungible Tokens)

Key properties emphasized:
- Slot Decimals
- Value Decimals
- Base URI
- Slots Mapping

### ERC4626 (Tokenized Vaults)

Key properties emphasized:
- Asset Symbol
- Asset Address
- Yield Strategy
- Fee Structure 