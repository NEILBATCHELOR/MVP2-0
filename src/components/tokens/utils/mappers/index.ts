/**
 * Token Mappers
 * Export all token property mappers
 */

// ERC Standard Mappers - Explicit exports to avoid naming conflicts
export { ERC20PropertyMapper } from './erc20';
export type { 
  TokenERC20Properties,
  TokenERC20PropertiesDB,
  ERC20FormData
} from './erc20';

export { ERC721PropertyMapper, mapERC721FormToDatabase } from './erc721';
export type {
  TokenERC721Properties,
  TokenERC721PropertiesDB,
  ERC721FormData,
  TokenERC721Attribute,
  BridgeConfig as ERC721BridgeConfig,
  MintPhase
} from './erc721';

export { ERC1155PropertyMapper, mapERC1155FormToDatabase } from './erc1155';
export type {
  TokenERC1155Properties,
  TokenERC1155PropertiesDB,
  ERC1155FormData,
  ContainerConfig,
  TokenRecipe,
  BulkDiscountTier,
  VotingWeightPerToken,
  WrappedVersion
} from './erc1155';

export { ERC1400PropertyMapper } from './erc1400';
export type {
  TokenERC1400Properties,
  TokenERC1400PropertiesDB,
  ERC1400FormData
} from './erc1400';

export { ERC3525PropertyMapper } from './erc3525';
export type {
  TokenERC3525Properties,
  TokenERC3525PropertiesDB,
  ERC3525FormData
} from './erc3525';

export { ERC4626PropertyMapper } from './erc4626';
export type {
  TokenERC4626Properties,
  TokenERC4626PropertiesDB,
  ERC4626FormData
} from './erc4626';

// Shared Mappers and Configs
export * from './shared';
export * from './config';
export * from './database';
