/**
 * Web Streams API polyfill shim
 * This file provides a polyfill for the Web Streams API in environments
 * where it's not natively supported.
 */

import * as WebStreamsPolyfill from 'web-streams-polyfill/dist/ponyfill.js';

// Export all stream classes for direct import
export const {
  ReadableStream,
  WritableStream,
  TransformStream,
  ByteLengthQueuingStrategy,
  CountQueuingStrategy
} = WebStreamsPolyfill;

// Apply polyfills to window if running in browser context
if (typeof window !== 'undefined') {
  if (!window.ReadableStream) window.ReadableStream = WebStreamsPolyfill.ReadableStream;
  if (!window.WritableStream) window.WritableStream = WebStreamsPolyfill.WritableStream;
  if (!window.TransformStream) window.TransformStream = WebStreamsPolyfill.TransformStream;
  if (!window.ByteLengthQueuingStrategy) window.ByteLengthQueuingStrategy = WebStreamsPolyfill.ByteLengthQueuingStrategy;
  if (!window.CountQueuingStrategy) window.CountQueuingStrategy = WebStreamsPolyfill.CountQueuingStrategy;
}

// Export default for cases where the entire module is imported
export default WebStreamsPolyfill; 