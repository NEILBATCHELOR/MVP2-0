// Declaration file for bs58
declare module 'bs58' {
  export function encode(source: Uint8Array | Buffer): string;
  export function decode(string: string): Uint8Array;
  export function decodeUnsafe(string: string): Uint8Array | undefined;
}
