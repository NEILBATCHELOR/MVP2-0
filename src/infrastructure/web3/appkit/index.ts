/**
 * Reown AppKit Exports
 * 
 * Centralized exports for selective AppKit usage throughout the application
 * Use useAppKit hook for component-level wallet integration instead of global wrapper
 */

// For selective use in specific components
export { default as useAppKit } from './useAppKit'

// Legacy providers (use sparingly, prefer useAppKit hook)
export { default as AppKitProvider } from './AppKitProvider'
export { default as ConditionalAppKitProvider } from './ConditionalAppKitProvider'

// Configuration exports
export { config, networks, projectId, wagmiAdapter } from './config'
