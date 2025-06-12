/**
 * Shim for node:stream/web
 * This file is used as an alias for the node:stream/web module
 * that's required by fetch-blob and other packages.
 */

// Re-export everything from our web streams polyfill
export * from './webStreamsShim'; 