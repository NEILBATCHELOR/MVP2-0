# Token System

## Recent Improvements

### Token Validation

We've implemented robust token validation functionality that ensures data integrity across all token standards:

- Added a reusable validation helper (`tokenValidationHelper.ts`) that can be used by both CreateTokenPage and TokenTestUtility
- Implemented proper validation before token submission to prevent invalid data from being sent to the server
- Added better error handling and user feedback for validation errors
- Fixed issues with form state changes after JSON upload
- Improved handling of transitions between different ERC standards

### JSON Upload Process

The JSON upload process has been improved with lessons learned from the TokenTestUtility:

- Better validation of uploaded JSON data
- Proper handling of standard transitions when uploading templates for different standards
- Improved error handling and user feedback
- Cleaner separation of concerns between different token standards

## Token File Browser

## Overview

The Token File Browser provides a simple interface for browsing and selecting JSON configuration files for different token standards. It allows users to navigate through the JSON_Products directory structure and select files for editing.

## Components

### ProductSelector

The `ProductSelector` component provides a file browser interface that:

- Displays a hierarchical view of the JSON_Products directory
- Allows expanding/collapsing directories
- Supports searching for files by name
- Loads JSON files when available or generates placeholder data

### File Structure

The component works with the following directory structure:

```
/components/tokens/JSON_Products/
├── JSON_Products_Primary_Final/
│   ├── Digital Tokenized Fund/
│   │   └── Primary/
│   │       ├── DigitalFund_ERC1400.json
│   │       ├── DigitalFund_ERC20.json
│   │       └── DigitalFund_ERC4626.json
│   ├── Carbon Credits/
│   │   └── Primary/
│   │       ├── CarbonCredits_ERC1155.json
│   │       ├── CarbonCredits_ERC20.json
│   │       └── CarbonCredits_ERC721.json
│   └── ...
└── JSON_Products_Alternative_Final/
    ├── Digital Tokenized Fund/
    │   └── Alternative/
    │       ├── DigitalFund_ERC1400_Alt.json
    │       ├── DigitalFund_ERC20_Alt.json
    │       └── DigitalFund_ERC4626_Alt.json
    └── ...
```

## Services

### fileLoader

The `fileLoader` service provides utilities for working with JSON files:

- `loadJsonFile`: Attempts to load actual JSON files, with fallback to generated placeholder data
- `createPlaceholderData`: Creates structured data for different token standards based on actual file formats
- `listAllFiles`: Placeholder function for listing all files
- `getAllJsonFiles`: Placeholder function for getting all JSON files
- `getSubdirectories`: Placeholder function for getting subdirectories
- `getFilesInDirectory`: Placeholder function for getting files in a directory

## Usage

```tsx
import { ProductSelector } from '@/components/tokens/components/ProductSelector';

function MyComponent() {
  const handleFileSelect = (result) => {
    console.log('Selected file content:', result.content);
    console.log('Token standard:', result.tokenStandard);
    console.log('Config mode:', result.configMode);
  };

  return (
    <ProductSelector onFileSelect={handleFileSelect} />
  );
}
```

## File Loading Process

The file loading process follows these steps:

1. First attempts to load the actual JSON file from the public directory
2. If the file exists, it's parsed and returned
3. If the file doesn't exist or can't be loaded, generates placeholder data based on:
   - The token standard (extracted from the filename)
   - The product category (extracted from the path)
   - Whether it's a primary or alternative version

## Placeholder Data

The placeholder data is structured to match the actual JSON files, with:

- Standard-specific fields for each token type (ERC-20, ERC-721, etc.)
- Product-specific customizations
- Configuration modes (min/max)
- Appropriate metadata and settings

This ensures that the application can function properly even when the actual JSON files are not available.