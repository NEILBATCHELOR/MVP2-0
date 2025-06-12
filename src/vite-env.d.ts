/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_ALCHEMY_API_KEY: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
  readonly SSR: boolean
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
