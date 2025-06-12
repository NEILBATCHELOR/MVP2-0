/**
 * Web Streams API Polyfill
 * Provides compatibility for browsers that don't fully support the Streams API
 */

// Check if ReadableStream is available globally
if (typeof globalThis.ReadableStream === 'undefined') {
  console.warn('ReadableStream not available, providing minimal polyfill');
  
  // Minimal ReadableStream implementation for compatibility
  globalThis.ReadableStream = class ReadableStream {
    constructor(source: any = {}) {
      // Minimal implementation for compatibility
    }
    
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {},
        cancel: () => Promise.resolve()
      };
    }
    
    cancel() {
      return Promise.resolve();
    }
    
    pipeTo() {
      return Promise.resolve();
    }
    
    pipeThrough() {
      return this;
    }
  } as any;
}

if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = class WritableStream {
    constructor(sink: any = {}) {}
    
    getWriter() {
      return {
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
        abort: () => Promise.resolve(),
        releaseLock: () => {}
      };
    }
  } as any;
}

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = class TransformStream {
    constructor(transformer: any = {}) {}
    
    get readable() {
      return new globalThis.ReadableStream();
    }
    
    get writable() {
      return new globalThis.WritableStream();
    }
  } as any;
}

// Ensure TextDecoder and TextEncoder are available
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = class TextDecoder {
    decode(input?: BufferSource): string {
      if (!input) return '';
      
      // Convert ArrayBuffer/TypedArray to string
      let bytes: Uint8Array;
      if (input instanceof ArrayBuffer) {
        bytes = new Uint8Array(input);
      } else {
        // Handle ArrayBufferView types (TypedArrays)
        bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      }
      
      let result = '';
      for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i]);
      }
      return result;
    }
  } as any;
}

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = class TextEncoder {
    encode(input: string = ''): Uint8Array {
      const result = new Uint8Array(input.length);
      for (let i = 0; i < input.length; i++) {
        result[i] = input.charCodeAt(i);
      }
      return result;
    }
  } as any;
}

// Add ByteLengthQueuingStrategy if missing
if (typeof globalThis.ByteLengthQueuingStrategy === 'undefined') {
  globalThis.ByteLengthQueuingStrategy = class ByteLengthQueuingStrategy {
    constructor(options: { highWaterMark: number }) {
      this.highWaterMark = options.highWaterMark;
    }
    
    highWaterMark: number;
    
    size(chunk: any) {
      return chunk?.byteLength || 0;
    }
  } as any;
}

export {};
