/**
 * MoonPay Integration Validation Test
 * 
 * This file validates that the MoonPay integration is properly configured
 * and all services are accessible.
 */

import { 
  moonPayServices, 
  createMoonPayServices, 
  checkMoonPayServicesHealth,
  MoonPayUtils,
  type MoonPayConfig,
  type MoonPayServices
} from '@/services/wallet/moonpay';

/**
 * Validate MoonPay Integration Setup
 */
export async function validateMoonPayIntegration(): Promise<{
  success: boolean;
  errors: string[];
  details: Record<string, any>;
}> {
  const errors: string[] = [];
  const details: Record<string, any> = {};

  try {
    console.log('🚀 Starting MoonPay Integration Validation...');

    // 1. Check environment variables
    console.log('📋 Checking environment variables...');
    const hasApiKey = !!import.meta.env.VITE_MOONPAY_API_KEY;
    const hasSecretKey = !!import.meta.env.VITE_MOONPAY_SECRET_KEY;
    
    details.environment = {
      hasApiKey,
      hasSecretKey,
      testMode: import.meta.env.VITE_MOONPAY_TEST_MODE !== 'false'
    };

    if (!hasApiKey) errors.push('Missing VITE_MOONPAY_API_KEY environment variable');
    if (!hasSecretKey) errors.push('Missing VITE_MOONPAY_SECRET_KEY environment variable');

    // 2. Check service manager availability
    console.log('🔧 Checking service manager...');
    const hasServiceManager = !!moonPayServices;
    details.serviceManager = { available: hasServiceManager };

    if (!hasServiceManager) {
      errors.push('MoonPay service manager not available');
      return { success: false, errors, details };
    }

    // 3. Check individual services
    console.log('🏗️ Checking individual services...');
    const serviceChecks = {
      onRamp: !!moonPayServices.onRamp,
      offRamp: !!moonPayServices.offRamp,
      swap: !!moonPayServices.swap,
      nft: !!moonPayServices.nft,
      webhook: !!moonPayServices.webhook,
      customer: !!moonPayServices.customer,
      account: !!moonPayServices.account,
      analytics: !!moonPayServices.analytics,
      policy: !!moonPayServices.policy,
      partner: !!moonPayServices.partner,
      networkFees: !!moonPayServices.networkFees,
      geolocation: !!moonPayServices.geolocation,
      compliance: !!moonPayServices.compliance,
      healthMonitor: !!moonPayServices.healthMonitor
    };

    details.services = serviceChecks;
    
    const missingServices = Object.entries(serviceChecks)
      .filter(([_, available]) => !available)
      .map(([name]) => name);

    if (missingServices.length > 0) {
      errors.push(`Missing services: ${missingServices.join(', ')}`);
    }

    // 4. Test service creation
    console.log('🔨 Testing service creation...');
    try {
      const config: MoonPayConfig = {
        apiKey: 'test_key',
        secretKey: 'test_secret',
        testMode: true
      };
      
      const testServices = createMoonPayServices(config);
      details.serviceCreation = { success: !!testServices };
    } catch (error) {
      errors.push(`Service creation failed: ${error.message}`);
      details.serviceCreation = { success: false, error: error.message };
    }

    // 5. Test utility functions
    console.log('🛠️ Testing utility functions...');
    try {
      const formatted = MoonPayUtils.formatCurrencyAmount(100, 'USD');
      const cryptoFormatted = MoonPayUtils.formatCryptoAmount(0.5, 'BTC');
      const explorerUrl = MoonPayUtils.getExplorerUrl('0x123', 'ethereum');
      const estimatedTime = MoonPayUtils.estimateCompletionTime('credit_debit_card');

      details.utilities = {
        formatCurrency: formatted === '$100.00',
        formatCrypto: cryptoFormatted === '0.50000000 BTC',
        explorerUrl: explorerUrl.includes('etherscan.io'),
        estimateTime: estimatedTime === '5-15 minutes'
      };
    } catch (error) {
      errors.push(`Utility functions test failed: ${error.message}`);
      details.utilities = { error: error.message };
    }

    // 6. Test health check function
    console.log('🏥 Testing health check...');
    try {
      const healthCheck = await checkMoonPayServicesHealth();
      details.healthCheck = {
        status: healthCheck.status,
        serviceCount: Object.keys(healthCheck.services).length
      };
    } catch (error) {
      errors.push(`Health check failed: ${error.message}`);
      details.healthCheck = { error: error.message };
    }

    console.log('✅ MoonPay Integration Validation Complete');
    
    return {
      success: errors.length === 0,
      errors,
      details
    };

  } catch (error) {
    console.error('❌ MoonPay Integration Validation Failed:', error);
    return {
      success: false,
      errors: [`Validation failed: ${error.message}`],
      details
    };
  }
}

/**
 * Simple integration test examples
 */
export const integrationExamples = {
  // Basic service usage
  async testOnRampService() {
    try {
      console.log('Testing OnRamp service...');
      const currencies = await moonPayServices.onRamp.getSupportedCurrencies();
      console.log(`✅ OnRamp: Found ${currencies.length} supported currencies`);
      return true;
    } catch (error) {
      console.error('❌ OnRamp test failed:', error.message);
      return false;
    }
  },

  async testSwapService() {
    try {
      console.log('Testing Swap service...');
      const pairs = await moonPayServices.swap.getSwapPairs();
      console.log(`✅ Swap: Found ${pairs.length} trading pairs`);
      return true;
    } catch (error) {
      console.error('❌ Swap test failed:', error.message);
      return false;
    }
  },

  async testCustomerService() {
    try {
      console.log('Testing Customer service...');
      const badges = await moonPayServices.customer.getCustomerBadges('0x742d35cc6671c0532925a3b8d6931d9e6b1d4e8e');
      console.log(`✅ Customer: Retrieved customer badges`);
      return true;
    } catch (error) {
      console.error('❌ Customer test failed:', error.message);
      return false;
    }
  },

  async testAnalyticsService() {
    try {
      console.log('Testing Analytics service...');
      const metrics = await moonPayServices.analytics.getAnalyticsMetrics('week');
      console.log(`✅ Analytics: Retrieved weekly metrics`);
      return true;
    } catch (error) {
      console.error('❌ Analytics test failed:', error.message);
      return false;
    }
  },

  async runAllTests() {
    console.log('🧪 Running all MoonPay integration tests...');
    
    const results = await Promise.allSettled([
      this.testOnRampService(),
      this.testSwapService(), 
      this.testCustomerService(),
      this.testAnalyticsService()
    ]);

    const passed = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const total = results.length;

    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    return {
      passed,
      total,
      success: passed === total,
      results
    };
  }
};

/**
 * Integration status report
 */
export function generateIntegrationReport(): {
  status: 'ready' | 'partial' | 'not_configured';
  services: number;
  features: string[];
  nextSteps: string[];
} {
  const hasCredentials = !!(import.meta.env.VITE_MOONPAY_API_KEY && import.meta.env.VITE_MOONPAY_SECRET_KEY);
  const serviceCount = Object.keys(moonPayServices).length;
  
  const features = [
    'Fiat On-Ramp (Buy Crypto)',
    'Fiat Off-Ramp (Sell Crypto)', 
    'Crypto-to-Crypto Swaps',
    'NFT Marketplace Integration',
    'Customer Management & KYC',
    'Account Management',
    'Analytics & Reporting',
    'Policy & Compliance Management',
    'Partner Management',
    'Webhook Event Processing',
    'Network Fee Optimization',
    'Geolocation Compliance',
    'AML & Regulatory Compliance',
    'Health Monitoring'
  ];

  const nextSteps = [];
  
  if (!hasCredentials) {
    nextSteps.push('Configure MoonPay API credentials (VITE_MOONPAY_API_KEY, VITE_MOONPAY_SECRET_KEY)');
  }
  
  nextSteps.push('Set up webhook endpoints for real-time event processing');
  nextSteps.push('Configure compliance rules and policies');
  nextSteps.push('Set up monitoring and alerting');
  nextSteps.push('Test integration with MoonPay sandbox environment');

  return {
    status: hasCredentials ? 'ready' : serviceCount > 0 ? 'partial' : 'not_configured',
    services: serviceCount,
    features,
    nextSteps
  };
}

// Export validation function for easy testing
export default validateMoonPayIntegration;
