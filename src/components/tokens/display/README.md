# Token Display Components - Unified Architecture

## 🎯 Overview

The unified token display architecture provides a streamlined, maintainable system for displaying all token standards with consistent UX patterns. This replaces 8 complex components (~3,250 lines) with a modular system (~1,000 lines) achieving 67% code reduction.

## 🚀 Quick Start

### Basic Usage

```typescript
import { UnifiedTokenCard, UnifiedTokenDetail } from '@/components/tokens/display';

// Card display
<UnifiedTokenCard 
  token={tokenData}
  onView={handleView}
  onEdit={handleEdit}
  onDeploy={handleDeploy}
  onDelete={handleDelete}
/>

// Detail display
<UnifiedTokenDetail 
  token={tokenData}
  onEdit={handleEdit}
  onDeploy={handleDeploy}
  onDelete={handleDelete}
/>
```

### Advanced Configuration

```typescript
<UnifiedTokenCard 
  token={tokenData}
  displayConfig={{
    layout: 'compact',           // 'compact' | 'full'
    showActions: true,           // Show action buttons
    showFeatures: true,          // Show feature badges
    showMetadata: true,          // Show creation/update info
    maxFeatures: 5,              // Limit feature badges
    actionsLayout: 'horizontal'  // 'horizontal' | 'vertical' | 'grid'
  }}
  onView={handleView}
  onEdit={handleEdit}
  onDeploy={handleDeploy}
  onDelete={handleDelete}
/>
```

## 🏗️ Architecture

### Core Components

#### **UnifiedTokenCard** - Universal Card Display
- Replaces: `BespokeTokenCardView.tsx` (800 lines) + `TokenCardView.tsx` (400 lines)
- Features: Dynamic standard detection, configurable layouts, responsive design
- Use Case: Token lists, dashboards, overview pages

#### **UnifiedTokenDetail** - Universal Detail View  
- Replaces: All 6 detail view components (2,250 lines total)
- Features: Unified single-view layout, comprehensive data display, no tabs
- Use Case: Token detail pages, full token information

### Shared Components

#### **TokenHeader** - Universal Header
- Status badges, standard indicators, token identity
- Consistent styling across all token types

#### **TokenFeatures** - Dynamic Feature Display
- Intelligent feature extraction from token properties
- Configurable badge limits and display options

#### **TokenActions** - Smart Action Buttons
- Permission-aware action buttons based on token status
- Configurable layouts and button sets

#### **TokenMetadata** - Creation & Update Info
- Timestamps, deployment info, configuration details
- Compact and extended display modes

### Data Section Components

Standard-specific data presentation:
- `ERC20DataSection` - Fee structures, rebasing, governance
- `ERC721DataSection` - Attributes, royalties, minting
- `ERC1155DataSection` - Token types, batch operations
- `ERC1400DataSection` - Compliance, partitions, controllers
- `ERC3525DataSection` - Slots, allocations, value transfers
- `ERC4626DataSection` - Strategy, fees, asset allocation

## 📋 Data Interface

### UnifiedTokenData

```typescript
interface UnifiedTokenData {
  // Core token info
  id: string;
  name: string;
  symbol: string;
  standard: string;
  status: TokenStatus | string;
  address?: string;
  blockchain?: string;
  created_at: string;
  updated_at: string;
  
  // Configuration
  config_mode?: 'min' | 'max' | 'basic' | 'advanced';
  tokenTier?: 'primary' | 'secondary' | 'tertiary';
  
  // Standard-specific properties
  erc20Properties?: any;
  erc721Properties?: any;
  erc1155Properties?: any;
  erc1400Properties?: any;
  erc3525Properties?: any;
  erc4626Properties?: any;
  
  // Array data for complex standards
  erc721Attributes?: any[];
  erc1155Types?: any[];
  erc1400Controllers?: any[];
  erc1400Partitions?: any[];
  erc3525Slots?: any[];
  erc4626AssetAllocations?: any[];
  
  // Additional metadata
  blocks?: Record<string, any>;
  metadata?: any;
}
```

### Display Configuration

```typescript
interface TokenDisplayConfig {
  mode: 'card' | 'detail';
  layout: 'compact' | 'full';
  showActions: boolean;
  showMetadata: boolean;
  showFeatures: boolean;
  maxFeatures?: number;
  actionsLayout?: 'horizontal' | 'vertical' | 'grid';
}
```

## 🎨 Styling & Theming

### Standard-Specific Themes

Each token standard has its own color scheme:
- **ERC-20**: Blue gradient (utility tokens)
- **ERC-721**: Purple gradient (NFTs)
- **ERC-1155**: Amber gradient (multi-tokens)
- **ERC-1400**: Green gradient (security tokens)
- **ERC-3525**: Pink gradient (semi-fungible)
- **ERC-4626**: Cyan gradient (vault tokens)

### Status Indicators

Status-based border colors and badges:
- `DRAFT`: Slate (in progress)
- `REVIEW`: Yellow (under review)
- `APPROVED`: Blue (ready to deploy)
- `DEPLOYED`: Green (on blockchain)
- `PAUSED`: Orange (temporarily halted)
- `REJECTED`: Red (needs revision)

### Unified Layout

The detail view uses a clean, single-scroll layout for all token standards:
- **Design**: Simple vertical layout displaying all sections sequentially
- **Structure**: Header → Data Section → Features → Metadata
- **Accessibility**: Easy navigation with standard scrolling
- **Responsive**: Adapts to different screen sizes
- **Universal**: Same layout pattern for all token standards (ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626)

## 🔧 Utility Functions

### Permission Checking
```typescript
import { canEditToken, canDeployToken, canDeleteToken } from '@/components/tokens/display';

const canEdit = canEditToken(token.status);
const canDeploy = canDeployToken(token.status);
const canDelete = canDeleteToken(token.status);
```

### Feature Extraction
```typescript
import { extractTokenFeatures } from '@/components/tokens/display';

const features = extractTokenFeatures(token);
// Returns: { isMintable: true, isPausable: true, hasRoyalty: false, ... }
```

### Standard Configuration
```typescript
import { getStandardConfig } from '@/components/tokens/display';

const config = getStandardConfig('ERC-20');
// Returns: { bgGradient, borderColor, iconColor, tooltip, ... }
```

## 📱 Responsive Design

### Breakpoint Behavior
- **Mobile** (`< 768px`): Single column layout, compact cards
- **Tablet** (`768px - 1024px`): Two column layout, full cards
- **Desktop** (`> 1024px`): Three+ column layout, full features

### Layout Adaptations
- **Card Mode**: Grid layout with responsive columns
- **Detail Mode**: Single column with collapsible sections
- **Compact Mode**: Reduced padding, smaller text, fewer features

## 🧪 Testing

### Test Component
```typescript
import TokenDisplayTest from '@/components/tokens/display/TokenDisplayTest';

// Comprehensive test page with all token standards
<TokenDisplayTest />
```

### Mock Data
```typescript
const mockToken: UnifiedTokenData = {
  id: 'test-token-id',
  name: 'Test Token',
  symbol: 'TEST',
  standard: 'ERC-20',
  status: 'DEPLOYED',
  // ... additional properties
};
```

## 🔄 Migration Guide

### From Old Components

#### Before (Old)
```typescript
import BespokeTokenCardView from '@/components/tokens/components/BespokeTokenCardView';
import ERC20DetailView from '@/components/tokens/components/ERC20DetailView';

<BespokeTokenCardView 
  token={token}
  onView={handleView}
  // ... many props
/>

<ERC20DetailView token={token} />
```

#### After (New)
```typescript
import { UnifiedTokenCard, UnifiedTokenDetail } from '@/components/tokens/display';

<UnifiedTokenCard 
  token={token}
  onView={handleView}
  onEdit={handleEdit}
  onDeploy={handleDeploy}
  onDelete={handleDelete}
/>

<UnifiedTokenDetail 
  token={token}
  onEdit={handleEdit}
  onDeploy={handleDeploy}
  onDelete={handleDelete}
/>
```

### Data Mapping
The new components expect `UnifiedTokenData`. If you have legacy token data:

```typescript
// Legacy token data mapping
const unifiedToken: UnifiedTokenData = {
  id: legacyToken.id,
  name: legacyToken.name,
  symbol: legacyToken.symbol,
  standard: legacyToken.standard,
  status: legacyToken.status,
  // ... map additional fields
  erc20Properties: legacyToken.properties, // for ERC-20
  blocks: legacyToken.blocks,
  // ... add array data as needed
};
```

## 🎯 Best Practices

### Performance
- Use `layout: 'compact'` for large lists
- Limit `maxFeatures` for better performance
- Consider virtualization for 100+ tokens

### Accessibility
- All components include proper ARIA labels
- Keyboard navigation supported
- Screen reader compatible

### TypeScript
- Always use `UnifiedTokenData` interface
- Type callback functions properly
- Use utility types for configuration

### Error Handling
```typescript
const handleError = (error: Error, token: UnifiedTokenData) => {
  console.error(`Error with token ${token.name}:`, error);
  // Show user-friendly error message
};
```

## 📚 Examples

### Token List Page
```typescript
import { UnifiedTokenCard } from '@/components/tokens/display';

const TokenListPage = ({ tokens }: { tokens: UnifiedTokenData[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {tokens.map(token => (
      <UnifiedTokenCard
        key={token.id}
        token={token}
        displayConfig={{ layout: 'compact', maxFeatures: 3 }}
        onView={handleView}
        onEdit={handleEdit}
        onDeploy={handleDeploy}
        onDelete={handleDelete}
      />
    ))}
  </div>
);
```

### Token Detail Page
```typescript
import { UnifiedTokenDetail } from '@/components/tokens/display';

const TokenDetailPage = ({ token }: { token: UnifiedTokenData }) => (
  <div className="max-w-6xl mx-auto p-6">
    <UnifiedTokenDetail
      token={token}
      displayConfig={{ 
        showActions: true, 
        showFeatures: true, 
        showMetadata: true 
      }}
      onEdit={handleEdit}
      onDeploy={handleDeploy}
      onDelete={handleDelete}
    />
  </div>
);
```

## 🔗 Related Documentation

- [Token Field Mapping Analysis](./Token%20CRUD%20Field%20Mapping%20Analysis.md)
- [Implementation Fixes Guide](./Token%20Field%20Mapping%20-%20Implementation%20Fixes.md)
- [Simplification Plan](./token-display-simplification-plan.md)
- [Current Architecture](./token-display-current-architecture.md)

---

**Architecture Version**: 2.1  
**Last Updated**: June 6, 2025  
**Major Changes**: Removed tabs, unified layout for all standards  
**Compatibility**: All token standards (ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626)