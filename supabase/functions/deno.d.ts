// Type definitions for Deno Edge Functions

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): Record<string, string>;
  }
  
  export const env: Env;
}

declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.7.1" {
  export interface SupabaseClient {
    from: (table: string) => any;
    auth: any;
    storage: any;
    rpc: any;
  }
  
  export function createClient(url: string, key: string, options?: any): SupabaseClient;
} 