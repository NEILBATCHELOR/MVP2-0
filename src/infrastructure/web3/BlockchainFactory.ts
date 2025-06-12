/**
 * BlockchainFactory Re-export
 * 
 * Compatibility re-export for adapter files that expect BlockchainFactory
 * to be at the web3 root level rather than in the factories subdirectory.
 */
export * from './factories/BlockchainFactory';
export { BlockchainFactory as default } from './factories/BlockchainFactory';
