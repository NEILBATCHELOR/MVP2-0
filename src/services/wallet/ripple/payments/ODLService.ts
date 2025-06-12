/**
 * Ripple ODL (On-Demand Liquidity) Service
 * Provides digital asset liquidity for cross-border payments
 */

import type {
  ODLPayment,
  ODLQuote,
  ServiceResult,
  MoneyAmount,
  PaymentCorridor,
  PaymentFilters
} from '../types';
import { RippleApiClient, createRippleApiClient } from '../utils/ApiClient';
import { RippleErrorHandler } from '../utils/ErrorHandler';
import { ODL_ENDPOINTS, buildFullEndpoint } from '../config';
import { 
  validate, 
  required, 
  stringLength, 
  amount as amountValidator, 
  currencyCode, 
  countryCode 
} from '../utils/Validators';

export interface ODLConfig {
  environment?: 'test' | 'production';
  tokenProvider?: () => Promise<any>;
  maxRetries?: number;
  timeout?: number;
}

export interface ODLProvider {
  id: string;
  name: string;
  type: 'exchange' | 'market_maker' | 'liquidity_pool';
  supportedCorridors: string[];
  supportedAssets: string[];
  minimumAmount: string;
  maximumAmount: string;
  averageSpread: string;
  isActive: boolean;
  reliability: number; // 0-1
  lastUpdated: string;
}

export interface LiquidityInfo {
  providerId: string;
  asset: string;
  availableLiquidity: string;
  bidPrice: string;
  askPrice: string;
  spread: string;
  lastUpdated: string;
  depth: LiquidityDepth[];
}

export interface LiquidityDepth {
  price: string;
  quantity: string;
  side: 'bid' | 'ask';
}

export interface ODLPaymentRequest {
  sourceAmount: MoneyAmount;
  destinationCurrency: string;
  sourceCountry?: string;
  destinationCountry?: string;
  preferredProvider?: string;
  maxSlippage?: string;
  originatorIdentityId: string;
  beneficiaryIdentityId: string;
  memo?: string;
  clientReference?: string;
}

export interface ODLRateInfo {
  sourceCurrency: string;
  destinationCurrency: string;
  bridgeAsset: string;
  sourceRate: string;
  destinationRate: string;
  totalRate: string;
  liquidityProvider: string;
  timestamp: string;
  validUntil: string;
}

export class ODLService {
  private apiClient: RippleApiClient;

  constructor(config: ODLConfig = {}) {
    this.apiClient = createRippleApiClient(
      {
        environment: config.environment,
        retries: config.maxRetries,
        timeout: config.timeout
      },
      config.tokenProvider
    );
  }

  /**
   * List available ODL providers
   */
  async getProviders(): Promise<ServiceResult<ODLProvider[]>> {
    try {
      return await this.apiClient.get<ODLProvider[]>(
        ODL_ENDPOINTS.LIST_PROVIDERS
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get specific ODL provider details
   */
  async getProvider(providerId: string): Promise<ServiceResult<ODLProvider>> {
    try {
      const validation = validate({ providerId }, {
        providerId: [
          (value) => required(value, 'providerId'),
          (value) => stringLength(value, 'providerId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        ODL_ENDPOINTS.GET_PROVIDER,
        { id: providerId }
      );

      return await this.apiClient.get<ODLProvider>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get liquidity information for a specific provider
   */
  async getLiquidity(providerId: string, asset?: string): Promise<ServiceResult<LiquidityInfo[]>> {
    try {
      const validation = validate({ providerId }, {
        providerId: [
          (value) => required(value, 'providerId'),
          (value) => stringLength(value, 'providerId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const queryParams: any = {};
      if (asset) {
        queryParams.asset = asset;
      }

      const endpoint = buildFullEndpoint(
        ODL_ENDPOINTS.GET_LIQUIDITY,
        { provider: providerId },
        queryParams
      );

      return await this.apiClient.get<LiquidityInfo[]>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Create an ODL payment
   */
  async createODLPayment(
    paymentRequest: ODLPaymentRequest
  ): Promise<ServiceResult<ODLPayment>> {
    try {
      // Validate payment request
      const validation = this.validateODLPaymentRequest(paymentRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<ODLPayment>(
        ODL_ENDPOINTS.CREATE_ODL_PAYMENT,
        paymentRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get ODL payment details
   */
  async getODLPayment(paymentId: string): Promise<ServiceResult<ODLPayment>> {
    try {
      const validation = validate({ paymentId }, {
        paymentId: [
          (value) => required(value, 'paymentId'),
          (value) => stringLength(value, 'paymentId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        ODL_ENDPOINTS.GET_ODL_PAYMENT,
        { id: paymentId }
      );

      return await this.apiClient.get<ODLPayment>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * List ODL payments with filtering
   */
  async listODLPayments(
    filters: PaymentFilters = {},
    page: number = 0,
    size: number = 20
  ): Promise<ServiceResult<{ payments: ODLPayment[]; totalCount: number; page: number; size: number }>> {
    try {
      const queryParams = {
        page,
        size,
        ...filters
      };

      const endpoint = buildFullEndpoint(
        ODL_ENDPOINTS.LIST_ODL_PAYMENTS,
        undefined,
        queryParams
      );

      return await this.apiClient.get(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get current ODL rates for currency pairs
   */
  async getODLRates(
    sourceCurrency?: string,
    destinationCurrency?: string
  ): Promise<ServiceResult<ODLRateInfo[]>> {
    try {
      const queryParams: any = {};
      
      if (sourceCurrency) {
        const validation = currencyCode(sourceCurrency, 'sourceCurrency');
        if (validation) {
          return RippleErrorHandler.createFailureResult(
            new Error(`Invalid source currency: ${validation.message}`)
          );
        }
        queryParams.sourceCurrency = sourceCurrency;
      }

      if (destinationCurrency) {
        const validation = currencyCode(destinationCurrency, 'destinationCurrency');
        if (validation) {
          return RippleErrorHandler.createFailureResult(
            new Error(`Invalid destination currency: ${validation.message}`)
          );
        }
        queryParams.destinationCurrency = destinationCurrency;
      }

      const endpoint = buildFullEndpoint(
        ODL_ENDPOINTS.GET_ODL_RATES,
        undefined,
        queryParams
      );

      return await this.apiClient.get<ODLRateInfo[]>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get an ODL quote for a specific amount and corridor
   */
  async getODLQuote(
    sourceAmount: MoneyAmount,
    destinationCurrency: string,
    sourceCountry?: string,
    destinationCountry?: string,
    preferredProvider?: string
  ): Promise<ServiceResult<ODLQuote>> {
    try {
      // Validate inputs
      const validation = validate(
        { sourceAmount, destinationCurrency },
        {
          sourceAmount: [
            (value) => required(value, 'sourceAmount'),
            (value) => {
              if (!value?.value || !value?.currency) {
                return {
                  field: 'sourceAmount',
                  code: 'invalid_format',
                  message: 'sourceAmount must have value and currency',
                  value
                };
              }
              // Validate the amount value
              const amountValidation = amountValidator(value.value, 'sourceAmount.value');
              if (amountValidation) return amountValidation;
              
              // Validate the currency code
              const currencyValidation = currencyCode(value.currency, 'sourceAmount.currency');
              if (currencyValidation) return currencyValidation;
              
              return null;
            }
          ],
          destinationCurrency: [
            (value) => required(value, 'destinationCurrency'),
            (value) => currencyCode(value, 'destinationCurrency')
          ]
        }
      );

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      // Additional validation for countries if provided
      if (sourceCountry) {
        const countryValidation = countryCode(sourceCountry, 'sourceCountry');
        if (countryValidation) {
          return RippleErrorHandler.createFailureResult(
            new Error(`Invalid source country: ${countryValidation.message}`)
          );
        }
      }

      if (destinationCountry) {
        const countryValidation = countryCode(destinationCountry, 'destinationCountry');
        if (countryValidation) {
          return RippleErrorHandler.createFailureResult(
            new Error(`Invalid destination country: ${countryValidation.message}`)
          );
        }
      }

      const requestBody = {
        sourceAmount,
        destinationCurrency,
        ...(sourceCountry && { sourceCountry }),
        ...(destinationCountry && { destinationCountry }),
        ...(preferredProvider && { preferredProvider })
      };

      // Use quote collection endpoint with ODL preference
      return await this.apiClient.post<ODLQuote>(
        '/quote_collections', // Will be enhanced to support ODL-specific quotes
        {
          ...requestBody,
          paymentMethod: 'odl'
        }
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get ODL corridor information
   */
  async getODLCorridors(): Promise<ServiceResult<PaymentCorridor[]>> {
    try {
      // Get all corridors and filter for ODL-supported ones
      const result = await this.apiClient.get<PaymentCorridor[]>('/corridors');
      
      if (result.success && result.data) {
        // Filter corridors that support ODL
        const odlCorridors = result.data.filter(corridor => 
          corridor.isActive && this.supportsODL(corridor)
        );
        
        return RippleErrorHandler.createSuccessResult(odlCorridors);
      }

      return result;
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get best ODL route for a payment
   */
  async getBestODLRoute(
    sourceAmount: MoneyAmount,
    destinationCurrency: string,
    sourceCountry?: string,
    destinationCountry?: string
  ): Promise<ServiceResult<{
    provider: ODLProvider;
    quote: ODLQuote;
    liquidityInfo: LiquidityInfo;
    estimatedSavings: string;
  }>> {
    try {
      // Get all providers
      const providersResult = await this.getProviders();
      if (!providersResult.success || !providersResult.data) {
        return providersResult as any;
      }

      const providers = providersResult.data;
      
      // Get quotes from multiple providers
      const quotePromises = providers
        .filter(provider => provider.isActive)
        .map(async (provider) => {
          try {
            const quote = await this.getODLQuote(
              sourceAmount,
              destinationCurrency,
              sourceCountry,
              destinationCountry,
              provider.id
            );
            
            if (quote.success && quote.data) {
              return {
                provider,
                quote: quote.data,
                cost: parseFloat(quote.data.fee.value)
              };
            }
            return null;
          } catch {
            return null;
          }
        });

      const results = await Promise.all(quotePromises);
      const validResults = results.filter(Boolean);

      if (validResults.length === 0) {
        return RippleErrorHandler.createFailureResult(
          new Error('No ODL providers available for this corridor')
        );
      }

      // Find the best route (lowest cost, highest reliability)
      const bestRoute = validResults.reduce((best, current) => {
        if (!best) return current;
        
        const bestScore = best.cost * (1 - best.provider.reliability);
        const currentScore = current!.cost * (1 - current!.provider.reliability);
        
        return currentScore < bestScore ? current : best;
      });

      if (!bestRoute) {
        return RippleErrorHandler.createFailureResult(
          new Error('Could not determine best ODL route')
        );
      }

      // Get liquidity info for the best provider
      const liquidityResult = await this.getLiquidity(
        bestRoute.provider.id,
        sourceAmount.currency
      );

      const liquidityInfo = liquidityResult.success && liquidityResult.data 
        ? liquidityResult.data[0] 
        : null;

      // Calculate estimated savings vs traditional banking
      const traditionalFee = parseFloat(sourceAmount.value) * 0.05; // Assume 5% traditional fee
      const odlFee = parseFloat(bestRoute.quote.fee.value);
      const estimatedSavings = Math.max(0, traditionalFee - odlFee).toString();

      return RippleErrorHandler.createSuccessResult({
        provider: bestRoute.provider,
        quote: bestRoute.quote,
        liquidityInfo: liquidityInfo!,
        estimatedSavings
      });
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  // Private helper methods

  private validateODLPaymentRequest(request: ODLPaymentRequest) {
    return validate(request, {
      sourceAmount: [
        (value) => required(value, 'sourceAmount'),
        (value) => {
          if (!value?.value || !value?.currency) {
            return {
              field: 'sourceAmount',
              code: 'invalid_format',
              message: 'sourceAmount must have value and currency',
              value
            };
          }
          // Validate the amount value
          const amountValidation = amountValidator(value.value, 'sourceAmount.value');
          if (amountValidation) return amountValidation;
          
          // Validate the currency code
          const currencyValidation = currencyCode(value.currency, 'sourceAmount.currency');
          if (currencyValidation) return currencyValidation;
          
          return null;
        }
      ],
      destinationCurrency: [
        (value) => required(value, 'destinationCurrency'),
        (value) => currencyCode(value, 'destinationCurrency')
      ],
      originatorIdentityId: [
        (value) => required(value, 'originatorIdentityId'),
        (value) => stringLength(value, 'originatorIdentityId', 1, 100)
      ],
      beneficiaryIdentityId: [
        (value) => required(value, 'beneficiaryIdentityId'),
        (value) => stringLength(value, 'beneficiaryIdentityId', 1, 100)
      ]
    });
  }

  private supportsODL(corridor: PaymentCorridor): boolean {
    // Logic to determine if a corridor supports ODL
    // This would be based on supported currencies, countries, etc.
    const odlSupportedCurrencies = ['USD', 'MXN', 'PHP', 'EUR', 'GBP', 'JPY', 'XRP'];
    
    return odlSupportedCurrencies.includes(corridor.sourceCurrency) &&
           odlSupportedCurrencies.includes(corridor.destinationCurrency);
  }

  /**
   * Update the token provider for authentication
   */
  setTokenProvider(provider: () => Promise<any>): void {
    this.apiClient.setTokenProvider(provider);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ODLConfig>): void {
    this.apiClient.updateConfig(config);
  }
}

// Factory function for creating ODL service
export const createODLService = (config?: ODLConfig): ODLService => {
  return new ODLService(config);
};
