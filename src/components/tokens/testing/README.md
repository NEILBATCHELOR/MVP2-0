# Token Testing Utility

This directory contains a comprehensive testing utility for token CRUD operations. The utility provides a user-friendly interface for testing token creation, reading, updating, and deletion through a JSON editor.

## Features

- **Full CRUD Support**: Create, read, update, and delete tokens
- **JSON Editor Interface**: Edit token data directly in JSON format
- **All Token Standards**: Supports ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, and ERC-4626
- **Configuration Modes**: Choose between basic and advanced configuration modes
- **Template Generation**: Pre-populated templates for each token standard and mode
- **Validation**: Real-time validation of token data before submission
- **Response Viewer**: View operation results in a formatted JSON viewer

## Components

- **TokenTestUtility**: The main utility component with JSON editor and response viewer
- **TokenTestingPage**: A page component that wraps the test utility
- **JsonViewer**: A component for displaying formatted JSON with syntax highlighting
- **tokenTemplates**: Template data for different token standards and configuration modes

## Usage

### Add to Your Routes

Add the testing page to your routes:

```tsx
import { TokenTestingPage } from "@/components/tokens/testing";

// In your router configuration
<Route path="/projects/:projectId/tokens/test" element={<TokenTestingPage />} />
```

### Standalone Usage

You can also use the utility as a standalone component:

```tsx
import { TokenTestUtility } from "@/components/tokens/testing";

// In your component
<TokenTestUtility />
```

## Workflow

1. **Select Operation**: Choose from Create, Read, Update, or Delete
2. **Select Token Standard**: Choose which token standard to work with
3. **Select Configuration Mode**: Choose between Basic and Advanced modes
4. **Edit JSON Data**: Modify the template data in the JSON editor
5. **Execute Operation**: Click the Execute button to perform the operation
6. **View Response**: See the operation results in the response viewer

## JSON Templates

The utility provides template data for all token standards in both basic and advanced modes:

- **Basic Templates**: Include only the essential fields for each token standard
- **Advanced Templates**: Include all available fields and options for each token standard

Templates are automatically loaded when you select a token standard and configuration mode.

## Testing Complex Data

### Array Data

The utility fully supports array data structures for all token standards:

- **ERC-721**: Token attributes
- **ERC-1155**: Token types
- **ERC-1400**: Partitions, controllers
- **ERC-3525**: Slots
- **ERC-4626**: Strategy parameters, asset allocations

### Nested Objects

The utility also supports deeply nested objects:

- **Fee Structures**: Complex fee configurations
- **Transfer Restrictions**: Rules for token transfers
- **Metadata**: Custom metadata with any structure

## Field Coverage

The utility covers all fields for each token standard:

- **Common Fields**: name, symbol, standard, description
- **Standard-Specific Fields**: All fields specific to each token standard
- **Custom Properties**: Support for additional custom properties
- **Metadata**: Support for arbitrary metadata structures

## Validation

The utility uses the token validation service to validate JSON data before submission:

- **Schema Validation**: Ensures data conforms to the expected schema
- **Business Logic Validation**: Ensures data makes sense semantically
- **Error Reporting**: Detailed error messages for invalid data

## Extending

### Adding New Templates

To add new templates, modify the `tokenTemplates.ts` file:

```typescript
// Add a new template
const myCustomTemplate = {
  name: "Custom Token",
  // ... other fields
};

// Add it to the getTemplateForStandard function
export function getTemplateForStandard(standard: TokenStandard, mode: ConfigMode = 'basic') {
  // ... existing code
  
  // Add your custom template
  if (standard === TokenStandard.ERC20 && mode === 'custom') {
    return myCustomTemplate;
  }
}
```

### Adding New Configuration Modes

To add new configuration modes, modify the TokenTestUtility component:

```typescript
// Add a new mode type
type ConfigMode = 'basic' | 'advanced' | 'custom';

// Add the new mode to the select component
<SelectContent>
  <SelectItem value="basic">Basic</SelectItem>
  <SelectItem value="advanced">Advanced</SelectItem>
  <SelectItem value="custom">Custom</SelectItem>
</SelectContent>
```