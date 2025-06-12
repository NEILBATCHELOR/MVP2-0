# Product Selector Component

## Overview

The Product Selector component allows users to browse and select token configuration files based on product categories and subcategories. It supports both primary and alternative product types, and handles various token standards including ERC20, ERC721, ERC1155, ERC1400, ERC3525, and ERC4626.

## Features

- Browse products organized by categories and subcategories
- Toggle between Primary and Alternative product variants
- Live file browser that reads folder contents in real-time
- Visual selection of JSON files from a scrollable list
- Dynamically generated product structure based on folder organization
- Mock data generation for consistent token templates
- Automatic selection of token standard and configuration mode based on the selected file
- Automatic refresh of JSON file contents when validation errors occur
- Manual refresh button to update the file list when new files are added
- Force refresh functionality to ensure the latest files are always displayed

## Recent Updates

### Live File Browser Added

**Update**: Replaced the dropdown selection with a live file browser that reads folder contents in real-time.

**Changes**:

1. **File Browser UI**:
   - Added a scrollable container that displays all JSON files in the selected folder
   - Files are displayed with icons and can be selected with a single click
   - Selected file is visually highlighted with a border and background color

2. **Real-time File Reading**:
   - Added `getFilesInFolder` function to read files from a specified folder path
   - Files are loaded when a subcategory is selected
   - Refresh button reloads the file list with the latest content

3. **Improved UX**:
   - Removed the extra "Load Selected JSON" button - files are loaded immediately on selection
   - Added loading indicators when files are being fetched
   - Empty state message when no files are found in a folder

4. **Auto-loading**:
   - Files are automatically loaded when clicked, eliminating the need for a separate load button
   - Improved error handling with automatic fallback to raw text when JSON parsing fails

### Fixed ERC20 Token Files Not Loading

**Issue**: Files with "_ERC20" in the name weren't loading properly due to inconsistencies between how file names were parsed and how token standards were mapped.

**Fixes Applied**:

1. **Enhanced Debugging in `extractTokenStandard`**:
   - Added logging to track file name parsing and token standard detection
   - Verified that `TokenStandard.ERC20` is correctly mapped to files with "_ERC20" in the name

2. **Improved Standard Detection in `fileLoader.ts`**:
   - Added logging for file loading and standard extraction
   - Implemented standardization of token standard names to ensure consistency
   - Added fallback mechanism when a standard isn't found in the mockJsonData

3. **Standard Name Normalization**:
   - Added handling for standard names with or without hyphens (e.g., "ERC-20" vs "ERC20")
   - Ensured consistency between how standards are stored in mockJsonData and how they're referenced

4. **Enhanced File Entry Generation**:
   - Added logging for generated file entries to track what files are being created
   - Ensured file naming conventions are consistent with how files are parsed

## How to Use

1. Select either "Primary Products" or "Alternative Products" tab
2. Choose a product category from the dropdown
3. Select a subcategory if available
4. Browse the file list and click on a JSON file to load it

## Refresh Functionality

The component includes a refresh button that forces a reload of the product structure and file list with cache busting to ensure the latest files are displayed. This is useful when new files are added or existing files are modified.

## Token Standard Detection

The component automatically detects the token standard from the file name using the following pattern:
- Files with "_ERC20" in the name are detected as ERC-20 tokens
- Files with "_ERC721" in the name are detected as ERC-721 tokens
- Files with "_ERC1155" in the name are detected as ERC-1155 tokens
- Files with "_ERC1400" in the name are detected as ERC-1400 tokens
- Files with "_ERC3525" in the name are detected as ERC-3525 tokens
- Files with "_ERC4626" in the name are detected as ERC-4626 tokens

If no token standard is detected in the file name, it defaults to ERC-1400.

## Error Handling

If a JSON file fails to load or parse, the component will attempt to reload it as raw text. This ensures that even files with syntax errors can be loaded and displayed for editing.

## Implementation Details

### Product Structure

The component uses a virtual file structure to organize token templates:

```
JSON_Products/
├── JSON_Products_Primary_Final/
│   ├── Digital Tokenized Fund/
│   │   └── Primary/
│   │       ├── DigitalFund_ERC4626.json
│   │       └── DigitalFund_ERC1400.json
│   ├── Structured Products/
│   │   └── Primary/
│   │       ├── StructuredProduct_ERC20.json
│   │       └── StructuredProduct_ERC1400.json
│   └── ...
└── JSON_Products_Alternative_Final/
    ├── Digital Tokenized Fund/
    │   └── Alternative/
    │       ├── DigitalFund_ERC4626_Alt.json
    │       └── DigitalFund_ERC1400_Alt.json
    └── ...
```

### File Browser Implementation

The file browser component:

1. **Reads folder contents**: When a subcategory is selected, the `getFilesInFolder` function is called to read all JSON files in that folder
2. **Displays files**: Files are displayed in a scrollable container with file icons
3. **Handles selection**: When a file is clicked, it's loaded immediately without requiring an additional button click
4. **Visual feedback**: The selected file is highlighted with a border and background color
5. **Loading states**: Shows loading indicators when files are being fetched
6. **Empty states**: Displays a message when no files are found in a folder

### Cache-Busting Mechanism

To ensure fresh content is always loaded:

1. Each file path includes a timestamp query parameter
2. The `getFilesInFolder` function accepts a `forceRefresh` parameter
3. The refresh button increments a `refreshKey` state variable to force React to re-render
4. Changing subcategories automatically refreshes the file list

### Mock Data Generation

Instead of loading physical JSON files, the component dynamically generates token templates based on:

1. **Base Templates**: Standard-specific templates for each token type (ERC20, ERC721, etc.)
2. **Product Customizations**: Specific modifications for each product category
3. **Variant Adjustments**: Differences between Primary and Alternative versions

This approach ensures consistent templates without requiring physical files to be present in the public directory.

## Extending the Product Selector

To add new product categories or token standards:

1. **Add new product category**:
   - Add the category name to the `productCategories` array in `fileLoader.ts`
   - Add appropriate token standards in the `tokenStandardMap` object

2. **Add product customizations**:
   - Extend the `productCustomizations` object with specific template modifications
   ```typescript
   "New Product Category": {
     "ERC1400": {
       name: "Custom Product Name",
       symbol: "CUSTOM",
       // Other customizations...
     }
   }
   ```

3. **Add new token standard**:
   - Add a new template to the `mockJsonData` object
   - Update the `tokenStandardMap` to include the new standard for relevant products
   - Add the standard to the `extractTokenStandard` function in ProductSelector

## Technical Implementation

The fileLoader service uses three key components:

1. **Base Templates**: Defined in `mockJsonData` with all required fields for each token standard
2. **Product Customizations**: Specific overrides for each product category in `productCustomizations`
3. **Template Generator**: The `generateTokenTemplate` function that combines base templates with customizations

When a user selects a file, the `loadJsonFile` function:
1. Extracts the product category, token standard, and variant from the file path
2. Generates a customized template based on these parameters
3. Returns the template as if it had been loaded from a physical file

## Troubleshooting

- **Missing token standards**: Ensure the product category has the appropriate standards defined in `tokenStandardMap`
- **Incorrect template fields**: Check the base templates in `mockJsonData` and product customizations
- **Console errors**: Look for error messages that might indicate issues with template generation
- **Token standard not detected**: Verify that the file naming follows the convention with "_ERC{number}" in the name

## Common Issues and Solutions

- **JSON files not appearing**: Ensure files follow the correct naming pattern and are in the correct subcategory structure.
- **JSON parsing errors**: Verify that the JSON file is valid and properly formatted.
- **Loading errors**: Check browser console for network errors that might indicate path issues.
- **Incorrect token standard**: Make sure file names include the standard in the format `_ERC{number}` (e.g., `_ERC20`, `_ERC1400`).
- **Wrong configuration mode**: Alternative products default to Advanced mode; check if the JSON has a `config_mode` property. 