# MoonPay Services - Complete API Integration

A comprehensive cryptocurrency infrastructure integration providing the full range of MoonPay API services for fiat-to-crypto onramps, NFT marketplace, DeFi swaps, compliance monitoring, analytics, and business intelligence.

## 🚀 Quick Start

### Installation & Setup

1. **Environment Variables**
```bash
# Required
VITE_MOONPAY_API_KEY=your_api_key
VITE_MOONPAY_SECRET_KEY=your_secret_key
VITE_MOONPAY_WEBHOOK_SECRET=your_webhook_secret

# Optional
VITE_MOONPAY_TEST_MODE=true
VITE_MOONPAY_PARTNER_ID=your_partner_id
```

2. **Basic Usage**
```typescript
import { moonPayServices } from '@/services/wallet/moonpay';

// Get buy quote
const quote = await moonPayServices.onRamp.getBuyQuote('usd', 'eth', 100);

// Get supported currencies
const currencies = await moonPayServices.onRamp.getSupportedCurrencies();

// Check service health
const health = await moonPayServices.healthMonitor.getHealthStatus();
```

## 📊 Complete API Coverage

This integration covers **95+ MoonPay API endpoints** across 13 specialized services:

| Service | Endpoints | Description |
|---------|-----------|-------------|
| **OnRampService** | 8 | Fiat-to-crypto purchases |
| **OffRampService** | 6 | Crypto-to-fiat sales |
| **EnhancedSwapService** | 10 | Advanced crypto swapping |
| **EnhancedNFTService** | 12 | NFT marketplace integration |
| **CustomerService** | 8 | KYC & customer management |
| **AccountService** | 6 | Account management |
| **AnalyticsService** | 6 | Business intelligence |
| **PolicyService** | 6 | Compliance policies |
| **PartnerService** | 7 | Partner management |
| **WebhookHandler** | 8 | Event processing |
| **NetworkFeesService** | 4 | Fee optimization |
| **GeolocationService** | 5 | Geo-compliance |
| **ComplianceService** | 9 | AML & regulatory |

## 🏗️ Service Architecture

```
src/services/wallet/moonpay/
├── index.ts                    # Unified service manager
├── validation.ts               # Integration validation
├── types/
│   └── index.ts               # Type definitions
├── core/                      # Core MoonPay services
│   ├── OnRampService.ts       # Fiat → Crypto
│   ├── OffRampService.ts      # Crypto → Fiat
│   ├── SwapService.ts         # Basic swaps
│   ├── NFTService.ts          # Basic NFT ops
│   ├── EnhancedSwapService.ts # Advanced trading
│   ├── EnhancedNFTService.ts  # Advanced NFT
│   └── WebhookHandler.ts      # Event processing
├── management/                # Business services
│   ├── CustomerService.ts     # KYC & verification
│   ├── AccountService.ts      # Account management
│   ├── PolicyService.ts       # Compliance rules
│   ├── AnalyticsService.ts    # Business intelligence
│   └── PartnerService.ts      # Partner management
├── infrastructure/            # Technical services
│   ├── NetworkFeesService.ts  # Fee optimization
│   ├── GeolocationService.ts  # Geo-compliance
│   ├── ComplianceService.ts   # AML & regulatory
│   └── HealthMonitor.ts       # Service monitoring
└── utils/                     # Shared utilities
    ├── validators.ts
    ├── mappers.ts
    └── constants.ts
```

## 📖 Usage Examples

### Core Services

```typescript
import { moonPayServices } from '@/services/wallet/moonpay';

// On-Ramp (Buy Crypto)
const buyQuote = await moonPayServices.onRamp.getBuyQuote('usd', 'eth', 100);
const buyTransaction = await moonPayServices.onRamp.createBuyTransaction({
  baseCurrency: 'usd',
  quoteCurrency: 'eth',
  baseAmount: 100,
  walletAddress: '0x...',
  returnUrl: 'https://yoursite.com/success'
});

// Off-Ramp (Sell Crypto)
const sellQuote = await moonPayServices.offRamp.getSellQuote('eth', 'usd', 0.5);
const sellTransaction = await moonPayServices.offRamp.createSellTransaction({
  baseCurrency: 'eth',
  quoteCurrency: 'usd',
  baseAmount: 0.5,
  walletAddress: '0x...'
});

// Enhanced Swapping
const swapRoute = await moonPayServices.swap.getSwapRoute('eth', 'usdc', 1.0);
const limitOrder = await moonPayServices.swap.createLimitOrder({
  fromToken: 'eth',
  toToken: 'usdc',
  fromAmount: 1.0,
  targetRate: 3000
});

// NFT Operations
const collections = await moonPayServices.nft.getCollections();
const nftPortfolio = await moonPayServices.nft.getUserPortfolio('0x...');
```

### Management Services

```typescript
// Customer Management
const customer = await moonPayServices.customer.getCustomerProfile('customer_id');
const badges = await moonPayServices.customer.getCustomerBadges('0x...');
const verification = await moonPayServices.customer.initiateIdentityVerification('customer_id');

// Analytics & Reporting
const analytics = await moonPayServices.analytics.getAnalyticsMetrics('month');
const report = await moonPayServices.analytics.generateReport({
  name: 'Monthly Performance',
  type: 'executive',
  dateRange: { start: '2024-01-01', end: '2024-01-31' }
});

// Policy Management
const policies = await moonPayServices.policy.getPolicies();
const policy = await moonPayServices.policy.createPolicy({
  name: 'High Value Transaction Rule',
  type: 'transaction_limit',
  rules: [{ field: 'amount', operator: 'greater_than', value: 10000 }]
});
```

### Infrastructure Services

```typescript
// Network Fees
const fees = await moonPayServices.networkFees.getNetworkFees(['eth'], ['usd']);
const gasEstimate = await moonPayServices.networkFees.getGasEstimates('eth', 'transfer');

// Compliance & AML
const amlResults = await moonPayServices.compliance.performAMLScreening('customer_id');
const alerts = await moonPayServices.compliance.getTransactionAlerts('high');

// Geolocation
const ipInfo = await moonPayServices.geolocation.checkIPAddress();
const compliance = await moonPayServices.geolocation.checkGeolocationCompliance('US');

// Health Monitoring
const health = await moonPayServices.healthMonitor.getHealthStatus();
const metrics = await moonPayServices.healthMonitor.getPerformanceMetrics();
```

### Webhook Handling

```typescript
// Set up webhook handlers
moonPayServices.webhook.on('transaction.completed', (event) => {
  console.log('Transaction completed:', event.data.object);
});

moonPayServices.webhook.on('customer.kyc_completed', (event) => {
  console.log('KYC completed for customer:', event.data.object.id);
});

// Process incoming webhook (in your API endpoint)
app.post('/webhooks/moonpay', async (req, res) => {
  const signature = req.headers['moonpay-signature'];
  const payload = JSON.stringify(req.body);
  
  const result = await moonPayServices.webhook.processWebhookEvent(
    payload, 
    signature, 
    req.headers
  );
  
  res.status(result.processed ? 200 : 400).json(result);
});
```

## 🔧 Configuration

### Service Configuration

```typescript
import { createMoonPayServices, createEnhancedMoonpayConfig } from '@/services/wallet/moonpay';

const config = createEnhancedMoonpayConfig({
  apiKey: process.env.VITE_MOONPAY_API_KEY,
  secretKey: process.env.VITE_MOONPAY_SECRET_KEY,
  environment: 'production',
  services: {
    onRamp: true,
    offRamp: true,
    swap: true,
    nft: true,
    customer: true,
    account: true,
    analytics: true,
    policy: true,
    partner: true,
    networkFees: true,
    geolocation: true,
    compliance: true,
    webhooks: true,
    healthMonitor: true
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
});

const services = createMoonPayServices(config);
```

## 🧪 Testing & Validation

### Integration Validation

```typescript
import { validateMoonPayIntegration, integrationExamples } from './validation';

// Validate complete integration
const validation = await validateMoonPayIntegration();
console.log('Integration valid:', validation.success);

// Run service tests
const testResults = await integrationExamples.runAllTests();
console.log(`Tests passed: ${testResults.passed}/${testResults.total}`);
```

### Health Checking

```typescript
import { checkMoonPayServicesHealth } from '@/services/wallet/moonpay';

const health = await checkMoonPayServicesHealth();
console.log('Overall status:', health.status);
console.log('Service statuses:', health.services);
```

## 🛡️ Security & Compliance

### Built-in Security Features
- ✅ HMAC signature verification for webhooks
- ✅ API key rotation support
- ✅ Rate limiting and request throttling
- ✅ TLS 1.3 encryption for all communications

### Compliance Suite
- ✅ AML screening with sanctions checking
- ✅ Transaction monitoring and alerting
- ✅ SAR reporting automation
- ✅ Audit logging for all operations
- ✅ GDPR compliance with data export/deletion

### Risk Management
- ✅ Automated customer risk scoring
- ✅ Dynamic transaction limits
- ✅ Geolocation compliance checking
- ✅ Customizable policy engine

## 📈 Analytics & Business Intelligence

### Available Metrics
- Transaction volumes and conversion rates
- Customer segmentation and behavior analysis
- Revenue and fee analysis
- Geographic distribution
- Payment method preferences
- Risk and compliance metrics

### Reporting Features
- Automated report generation
- Custom report templates
- Scheduled delivery
- Export to multiple formats (PDF, CSV, Excel)
- Real-time dashboards

## 🔗 UI Components

Use the provided UI components for quick integration:

```typescript
import { 
  EnhancedMoonpayDashboard,
  MoonpayIntegration,
  AnalyticsDashboard,
  CustomerManagement 
} from '@/components/wallet/components/moonpay';

// Main dashboard with all features
<EnhancedMoonpayDashboard 
  onServiceError={(service, error) => handleError(service, error)}
  enableRealTime={true}
/>

// Basic integration component
<MoonpayIntegration 
  onTransactionComplete={(tx) => handleTransaction(tx)}
/>
```

## 🚨 Error Handling

### Error Types

```typescript
import { 
  EnhancedMoonpayError,
  MoonpayNetworkError,
  MoonpayValidationError,
  MoonpayComplianceError 
} from '@/services/wallet/moonpay';

try {
  await moonPayServices.onRamp.getBuyQuote('usd', 'eth', 100);
} catch (error) {
  if (error instanceof MoonpayNetworkError) {
    console.error('Network error:', error.statusCode, error.message);
  } else if (error instanceof MoonpayValidationError) {
    console.error('Validation error:', error.field, error.message);
  } else if (error instanceof MoonpayComplianceError) {
    console.error('Compliance error:', error.riskLevel, error.actions);
  }
}
```

## 📋 Environment Setup Checklist

- [ ] Set `VITE_MOONPAY_API_KEY` environment variable
- [ ] Set `VITE_MOONPAY_SECRET_KEY` environment variable  
- [ ] Set `VITE_MOONPAY_WEBHOOK_SECRET` environment variable (optional)
- [ ] Configure `VITE_MOONPAY_TEST_MODE` (default: true)
- [ ] Set up webhook endpoints for real-time events
- [ ] Configure compliance rules and policies
- [ ] Set up monitoring and alerting
- [ ] Test with MoonPay sandbox environment

## 🆘 Troubleshooting

### Common Issues

**Invalid API Key**
- Verify `VITE_MOONPAY_API_KEY` is set correctly
- Check if key is for correct environment (sandbox vs production)

**Webhook Signature Verification Failed**
- Ensure `VITE_MOONPAY_WEBHOOK_SECRET` matches MoonPay dashboard
- Verify payload is not modified before verification

**Service Unavailable**
- Check network connectivity
- Verify MoonPay API status
- Use health monitor to diagnose issues

**Rate Limit Exceeded**
- Implement exponential backoff
- Consider upgrading API limits
- Use caching to reduce API calls

### Debug Mode

```typescript
// Enable debug logging
const config = createEnhancedMoonpayConfig({
  features: {
    debugMode: true,
    logLevel: 'debug'
  }
});
```

## 📚 Additional Resources

- [MoonPay Developer Documentation](https://dev.moonpay.com/docs)
- [Integration Completion Summary](../../docs/moonpay-integration-completion-summary.md)
- [API Reference Documentation](https://dev.moonpay.com/reference)
- [Webhook Event Reference](https://dev.moonpay.com/reference/reference-webhooks-overview)

## 🤝 Support

For technical support or integration assistance:
- Check the troubleshooting guide above
- Review the comprehensive documentation
- Use the built-in validation tools
- Check service health monitoring

---

**🎉 The MoonPay integration is now complete and production-ready!**

*This integration provides enterprise-grade cryptocurrency infrastructure with comprehensive API coverage, security features, compliance tools, and business intelligence capabilities.*
