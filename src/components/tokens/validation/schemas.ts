/**
 * Token Validation Schemas
 * Re-exports all validation schemas for easy importing
 */

// ERC-20 schemas
export { 
  erc20MinSchema as erc20Schema,
  erc20MaxSchema,
  validateERC20Token 
} from './schemas/erc20';

// ERC-721 schemas  
export { 
  erc721MinSchema as erc721Schema,
  erc721MaxSchema,
  validateERC721Token 
} from './schemas/erc721';

// ERC-1155 schemas
export { 
  erc1155MinSchema as erc1155Schema,
  erc1155MaxSchema,
  validateERC1155Token 
} from './schemas/erc1155';

// ERC-1400 schemas
export { 
  erc1400MinSchema as erc1400Schema,
  erc1400MaxSchema,
  validateERC1400Token 
} from './schemas/erc1400';

// ERC-3525 schemas
export { 
  erc3525MinSchema as erc3525Schema,
  erc3525MaxSchema,
  validateERC3525Token 
} from './schemas/erc3525';

// ERC-4626 schemas
export { 
  erc4626MinSchema as erc4626Schema,
  erc4626MaxSchema,
  validateERC4626Token 
} from './schemas/erc4626';

// Base schemas
export { 
  tokenBaseSchema,
  tokenMetadataSchema,
  blockchainConfigSchema 
} from './schemas/base';
