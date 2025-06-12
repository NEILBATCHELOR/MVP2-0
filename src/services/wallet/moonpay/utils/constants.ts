/**
 * MoonPay Constants
 * Centralized constants for MoonPay integration
 */

// API Endpoints
export const MOONPAY_API_BASE_URL = 'https://api.moonpay.com';
export const MOONPAY_SANDBOX_API_BASE_URL = 'https://api.moonpay.com';
export const MOONPAY_WIDGET_BASE_URL = 'https://buy.moonpay.com';
export const MOONPAY_SANDBOX_WIDGET_BASE_URL = 'https://buy-sandbox.moonpay.com';

// API Versions
export const API_VERSION_V1 = 'v1';
export const API_VERSION_V3 = 'v3';
export const API_VERSION_V0 = 'v0';

// Environment Types
export const ENVIRONMENT_SANDBOX = 'sandbox';
export const ENVIRONMENT_PRODUCTION = 'production';

// Currency Types
export const CURRENCY_TYPE_FIAT = 'fiat';
export const CURRENCY_TYPE_CRYPTO = 'crypto';

// Transaction Types
export const TRANSACTION_TYPE_BUY = 'buy';
export const TRANSACTION_TYPE_SELL = 'sell';
export const TRANSACTION_TYPE_SWAP = 'swap';

// Transaction Statuses
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  WAITING_PAYMENT: 'waitingPayment',
  WAITING_AUTHORIZATION: 'waitingAuthorization',
  WAITING_CAPTURE: 'waitingCapture',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_DEBIT_CARD: 'credit_debit_card',
  SEPA_BANK_TRANSFER: 'sepa_bank_transfer',
  GBP_BANK_TRANSFER: 'gbp_bank_transfer',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  BANK_TRANSFER: 'bank_transfer',
  SWIFT_TRANSFER: 'swift_transfer'
} as const;

// KYC Levels
export const KYC_LEVELS = {
  NONE: 'none',
  BASIC: 'basic',
  ENHANCED: 'enhanced',
  PREMIUM: 'premium'
} as const;

// Identity Verification Statuses
export const IDENTITY_VERIFICATION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

// Document Types
export const DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  DRIVERS_LICENSE: 'drivers_license',
  NATIONAL_ID: 'national_id',
  PROOF_OF_ADDRESS: 'proof_of_address'
} as const;

// Webhook Event Types
export const WEBHOOK_EVENTS = {
  TRANSACTION_COMPLETED: 'transaction.completed',
  TRANSACTION_FAILED: 'transaction.failed',
  TRANSACTION_PENDING: 'transaction.pending',
  TRANSACTION_WAITING_PAYMENT: 'transaction.waitingPayment',
  TRANSACTION_WAITING_AUTHORIZATION: 'transaction.waitingAuthorization',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_KYC_COMPLETED: 'customer.kyc_completed',
  CUSTOMER_KYC_FAILED: 'customer.kyc_failed',
  CUSTOMER_IDENTITY_VERIFIED: 'customer.identity_verified',
  SWAP_COMPLETED: 'swap.completed',
  SWAP_FAILED: 'swap.failed',
  NFT_MINTED: 'nft.minted',
  NFT_TRANSFERRED: 'nft.transferred',
  POLICY_VIOLATED: 'policy.violated',
  COMPLIANCE_ALERT: 'compliance.alert'
} as const;

// NFT Pass Statuses
export const NFT_PASS_STATUS = {
  PENDING: 'pending',
  MINTED: 'minted',
  TRANSFERRED: 'transferred',
  BURNED: 'burned'
} as const;

// Swap Statuses
export const SWAP_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired'
} as const;

// Policy Types
export const POLICY_TYPES = {
  KYC: 'kyc',
  TRANSACTION: 'transaction',
  COMPLIANCE: 'compliance',
  RISK: 'risk'
} as const;

// Policy Actions
export const POLICY_ACTIONS = {
  ALLOW: 'allow',
  DENY: 'deny',
  REVIEW: 'review'
} as const;

// Supported Cryptocurrencies
export const SUPPORTED_CRYPTO_CURRENCIES = [
  'btc', 'eth', 'ltc', 'bch', 'xrp', 'ada', 'sol', 'matic', 'bnb', 'avax',
  'doge', 'xlm', 'trx', 'usdc', 'usdt', 'dai', 'busd', 'link', 'dot', 'uni',
  'aave', 'comp', 'mkr', 'snx', 'yfi', 'crv', 'bal', 'ren', 'knc', 'zrx',
  'lrc', 'band', 'storj', 'grt', 'mana', 'sand', 'axs', 'chz', 'ens', 'ftm'
] as const;

// Supported Fiat Currencies
export const SUPPORTED_FIAT_CURRENCIES = [
  'usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'chf', 'nok', 'sek', 'dkk',
  'pln', 'czk', 'huf', 'ron', 'bgn', 'hrk', 'nzd', 'sgd', 'hkd', 'mxn',
  'brl', 'ars', 'clp', 'cop', 'pen', 'uyu', 'zar', 'try', 'rub', 'inr',
  'krw', 'thb', 'php', 'idr', 'myr', 'vnd', 'aed', 'sar', 'qar', 'bdt'
] as const;

// Country Codes (ISO 3166-1 alpha-2)
export const SUPPORTED_COUNTRIES = [
  'AD', 'AE', 'AG', 'AI', 'AL', 'AM', 'AO', 'AR', 'AS', 'AT', 'AU', 'AW',
  'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BM', 'BN',
  'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG',
  'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CV', 'CW', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG',
  'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ',
  'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
  'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT',
  'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML',
  'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX',
  'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR',
  'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN',
  'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA',
  'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN',
  'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH',
  'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA',
  'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
] as const;

// US States not allowed (example)
export const RESTRICTED_US_STATES = [
  'NY', 'WA', 'CT', 'HI', 'ID', 'LA', 'MS', 'NE', 'NM', 'NC', 'VT'
] as const;

// Network Types
export const NETWORK_TYPES = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  REGTEST: 'regtest'
} as const;

// Blockchain Networks
export const BLOCKCHAIN_NETWORKS = {
  BITCOIN: 'bitcoin',
  ETHEREUM: 'ethereum',
  LITECOIN: 'litecoin',
  BITCOIN_CASH: 'bitcoincash',
  RIPPLE: 'ripple',
  CARDANO: 'cardano',
  SOLANA: 'solana',
  POLYGON: 'polygon',
  BINANCE_SMART_CHAIN: 'bsc',
  AVALANCHE: 'avalanche',
  DOGECOIN: 'dogecoin',
  STELLAR: 'stellar',
  TRON: 'tron'
} as const;

// Blockchain Explorers
export const BLOCKCHAIN_EXPLORERS = {
  bitcoin: 'https://blockstream.info',
  ethereum: 'https://etherscan.io',
  polygon: 'https://polygonscan.com',
  bsc: 'https://bscscan.com',
  avalanche: 'https://snowtrace.io',
  solana: 'https://solscan.io',
  litecoin: 'https://blockexplorer.one/litecoin/mainnet',
  bitcoincash: 'https://blockexplorer.one/bitcoin-cash/mainnet',
  cardano: 'https://cardanoscan.io',
  dogecoin: 'https://dogechain.info',
  stellar: 'https://stellar.expert',
  tron: 'https://tronscan.org'
} as const;

// Fee Types
export const FEE_TYPES = {
  MOONPAY: 'moonpay',
  NETWORK: 'network',
  THIRD_PARTY: 'thirdParty'
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT_REQUESTS_PER_SECOND: 10,
  DEFAULT_BURST_SIZE: 50,
  DEFAULT_TIMEOUT_MS: 30000,
  RETRY_DELAY_MS: 1000,
  MAX_RETRIES: 3
} as const;

// Cache TTL (in milliseconds)
export const CACHE_TTL = {
  CURRENCIES: 5 * 60 * 1000, // 5 minutes
  QUOTES: 30 * 1000, // 30 seconds
  PAYMENT_METHODS: 5 * 60 * 1000, // 5 minutes
  CUSTOMER_DATA: 2 * 60 * 1000, // 2 minutes
  TRANSACTION_STATUS: 10 * 1000, // 10 seconds
  LIMITS: 5 * 60 * 1000, // 5 minutes
  HEALTH_STATUS: 1 * 60 * 1000, // 1 minute
  SWAP_PAIRS: 5 * 60 * 1000, // 5 minutes
  NFT_COLLECTIONS: 10 * 60 * 1000 // 10 minutes
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  UNSUPPORTED_CURRENCY: 'UNSUPPORTED_CURRENCY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;

// Service Names
export const SERVICE_NAMES = {
  ON_RAMP: 'onRamp',
  OFF_RAMP: 'offRamp',
  SWAP: 'swap',
  NFT: 'nft',
  CUSTOMER: 'customer',
  ACCOUNT: 'account',
  ANALYTICS: 'analytics',
  POLICY: 'policy',
  PARTNER: 'partner',
  NETWORK_FEES: 'networkFees',
  GEOLOCATION: 'geolocation',
  COMPLIANCE: 'compliance',
  WEBHOOKS: 'webhooks',
  HEALTH_MONITOR: 'healthMonitor'
} as const;

// Health Check Intervals
export const HEALTH_CHECK_INTERVALS = {
  DEVELOPMENT: 5 * 60 * 1000, // 5 minutes
  PRODUCTION: 1 * 60 * 1000, // 1 minute
  DEGRADED: 30 * 1000 // 30 seconds
} as const;

// Widget Languages
export const WIDGET_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'
] as const;

// Default Limits
export const DEFAULT_LIMITS = {
  DAILY: { min: 30, max: 2000 },
  WEEKLY: { min: 30, max: 10000 },
  MONTHLY: { min: 30, max: 50000 }
} as const;

// Currency Precision
export const CURRENCY_PRECISION = {
  // Cryptocurrencies
  btc: 8,
  eth: 18,
  ltc: 8,
  bch: 8,
  xrp: 6,
  ada: 6,
  sol: 9,
  matic: 18,
  bnb: 18,
  avax: 18,
  doge: 8,
  xlm: 7,
  trx: 6,
  usdc: 6,
  usdt: 6,
  dai: 18,
  
  // Fiat currencies
  usd: 2,
  eur: 2,
  gbp: 2,
  cad: 2,
  aud: 2,
  jpy: 0,
  chf: 2,
  nok: 2,
  sek: 2,
  dkk: 2
} as const;

// Minimum Amounts (in base currency)
export const MINIMUM_AMOUNTS = {
  BUY: {
    usd: 30,
    eur: 25,
    gbp: 20,
    cad: 35,
    aud: 40
  },
  SELL: {
    btc: 0.001,
    eth: 0.01,
    ltc: 0.1,
    bch: 0.01,
    xrp: 50,
    ada: 100,
    sol: 1,
    matic: 50,
    bnb: 0.1,
    avax: 1
  }
} as const;

// Maximum Amounts (in base currency)
export const MAXIMUM_AMOUNTS = {
  BUY: {
    usd: 50000,
    eur: 45000,
    gbp: 40000,
    cad: 65000,
    aud: 70000
  },
  SELL: {
    btc: 10,
    eth: 100,
    ltc: 1000,
    bch: 100,
    xrp: 100000,
    ada: 500000,
    sol: 5000,
    matic: 100000,
    bnb: 1000,
    avax: 5000
  }
} as const;

// Widget Color Schemes
export const WIDGET_COLORS = {
  LIGHT: '#ffffff',
  DARK: '#000000',
  PURPLE: '#7d00ff',
  BLUE: '#0066cc',
  GREEN: '#00cc66',
  ORANGE: '#ff6600',
  RED: '#cc0000'
} as const;

// Analytics Metrics
export const ANALYTICS_METRICS = {
  TRANSACTION_VOLUME: 'transaction_volume',
  TRANSACTION_COUNT: 'transaction_count',
  CONVERSION_RATE: 'conversion_rate',
  AVERAGE_TRANSACTION_SIZE: 'average_transaction_size',
  POPULAR_CURRENCIES: 'popular_currencies',
  PAYMENT_METHOD_USAGE: 'payment_method_usage',
  GEOGRAPHIC_DISTRIBUTION: 'geographic_distribution',
  CUSTOMER_SEGMENTS: 'customer_segments'
} as const;

// Report Types
export const REPORT_TYPES = {
  EXECUTIVE: 'executive',
  DETAILED: 'detailed',
  COMPLIANCE: 'compliance',
  FINANCIAL: 'financial',
  OPERATIONAL: 'operational'
} as const;

// Report Formats
export const REPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json'
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook',
  PUSH: 'push'
} as const;

// Compliance Risk Levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

// AML Check Types
export const AML_CHECK_TYPES = {
  SANCTIONS: 'sanctions',
  PEP: 'pep',
  ADVERSE_MEDIA: 'adverse_media',
  WATCHLIST: 'watchlist'
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+[1-9]\d{6,14}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  API_KEY: /^[a-zA-Z0-9-_]{20,}$/,
  WEBHOOK_SIGNATURE: /^[a-fA-F0-9]{64}$/,
  BTC_ADDRESS: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1([02-9ac-hj-np-z]){7,87}$/,
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  CURRENCY_CODE: /^[a-zA-Z0-9]{2,6}$/
} as const;

// Default Configuration
export const DEFAULT_CONFIG = {
  testMode: true,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 50
  },
  features: {
    realTimeUpdates: true,
    advancedAnalytics: true,
    complianceMonitoring: true,
    networkOptimization: true,
    arbitrageDetection: false,
    nftValuation: true,
    predictiveInsights: true,
    automatedReporting: true
  }
} as const;

// Export type definitions for TypeScript
export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export type KYCLevel = typeof KYC_LEVELS[keyof typeof KYC_LEVELS];
export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];
export type CurrencyType = typeof CURRENCY_TYPE_FIAT | typeof CURRENCY_TYPE_CRYPTO;
export type TransactionType = typeof TRANSACTION_TYPE_BUY | typeof TRANSACTION_TYPE_SELL | typeof TRANSACTION_TYPE_SWAP;
export type NetworkType = typeof NETWORK_TYPES[keyof typeof NETWORK_TYPES];
export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];
export type ServiceName = typeof SERVICE_NAMES[keyof typeof SERVICE_NAMES];
