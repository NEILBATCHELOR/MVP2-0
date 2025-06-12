/**
 * Ripple Payments Direct API v4 Service
 * Core payment functionality for cross-border and domestic payments
 */

import type {
  RipplePaymentV4,
  PaymentStatus,
  PaymentType,
  RippleQuoteV4,
  QuoteRequest,
  QuoteCollection,
  CreatePaymentRequest,
  CreateOrchestrationPaymentRequest,
  PaymentListResponse,
  PaymentResponse,
  PaymentFilters,
  PaymentSearchParams,
  ServiceResult,
  MoneyAmount,
  PaymentCorridor
} from '../types';
import { RippleApiClient, createRippleApiClient } from '../utils/ApiClient';
import { RippleErrorHandler } from '../utils/ErrorHandler';
import { PAYMENTS_ENDPOINTS, buildFullEndpoint } from '../config';
import { 
  validate, 
  required, 
  stringLength, 
  amount, 
  currencyCode, 
  uuid, 
  COMMON_SCHEMAS 
} from '../utils/Validators';

export interface PaymentsDirectConfig {
  environment?: 'test' | 'production';
  tokenProvider?: () => Promise<any>;
  maxRetries?: number;
  timeout?: number;
}

export class PaymentsDirectService {
  private apiClient: RippleApiClient;

  constructor(config: PaymentsDirectConfig = {}) {
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
   * List payments with filtering and pagination
   */
  async listPayments(
    params: PaymentSearchParams = {}
  ): Promise<ServiceResult<PaymentListResponse>> {
    try {
      const endpoint = buildFullEndpoint(
        PAYMENTS_ENDPOINTS.LIST_PAYMENTS,
        undefined,
        params
      );

      return await this.apiClient.get<PaymentListResponse>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get a specific payment by ID
   */
  async getPayment(paymentId: string): Promise<ServiceResult<RipplePaymentV4>> {
    try {
      // Validate input
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
        PAYMENTS_ENDPOINTS.GET_PAYMENT,
        { id: paymentId }
      );

      return await this.apiClient.get<RipplePaymentV4>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(
    paymentRequest: CreatePaymentRequest
  ): Promise<ServiceResult<RipplePaymentV4>> {
    try {
      // Validate payment request
      const validation = this.validateCreatePaymentRequest(paymentRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<RipplePaymentV4>(
        PAYMENTS_ENDPOINTS.CREATE_PAYMENT,
        paymentRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Create an orchestration payment (single API call for quote + payment)
   */
  async createOrchestrationPayment(
    paymentRequest: CreateOrchestrationPaymentRequest
  ): Promise<ServiceResult<RipplePaymentV4>> {
    try {
      // Validate orchestration payment request
      const validation = this.validateOrchestrationPaymentRequest(paymentRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<RipplePaymentV4>(
        PAYMENTS_ENDPOINTS.CREATE_ORCHESTRATION_PAYMENT,
        paymentRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get orchestration payment details
   */
  async getOrchestrationPayment(paymentId: string): Promise<ServiceResult<RipplePaymentV4>> {
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
        PAYMENTS_ENDPOINTS.GET_ORCHESTRATION_PAYMENT,
        { id: paymentId }
      );

      return await this.apiClient.get<RipplePaymentV4>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string): Promise<ServiceResult<RipplePaymentV4>> {
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
        PAYMENTS_ENDPOINTS.CANCEL_PAYMENT,
        { id: paymentId }
      );

      return await this.apiClient.post<RipplePaymentV4>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Create a quote collection for payment estimation
   */
  async createQuoteCollection(
    quoteRequest: QuoteRequest
  ): Promise<ServiceResult<QuoteCollection>> {
    try {
      // Validate quote request
      const validation = this.validateQuoteRequest(quoteRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<QuoteCollection>(
        PAYMENTS_ENDPOINTS.CREATE_QUOTE_COLLECTION,
        quoteRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get a quote collection by ID
   */
  async getQuoteCollection(quoteCollectionId: string): Promise<ServiceResult<QuoteCollection>> {
    try {
      const validation = validate({ quoteCollectionId }, {
        quoteCollectionId: [
          (value) => required(value, 'quoteCollectionId'),
          (value) => stringLength(value, 'quoteCollectionId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        PAYMENTS_ENDPOINTS.GET_QUOTE_COLLECTION,
        { id: quoteCollectionId }
      );

      return await this.apiClient.get<QuoteCollection>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Accept a quote and create payment
   */
  async acceptQuote(
    paymentId: string,
    quoteId: string
  ): Promise<ServiceResult<RipplePaymentV4>> {
    try {
      const validation = validate({ paymentId, quoteId }, {
        paymentId: [
          (value) => required(value, 'paymentId'),
          (value) => stringLength(value, 'paymentId', 1, 100)
        ],
        quoteId: [
          (value) => required(value, 'quoteId'),
          (value) => stringLength(value, 'quoteId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        PAYMENTS_ENDPOINTS.ACCEPT_QUOTE,
        { id: paymentId }
      );

      return await this.apiClient.post<RipplePaymentV4>(endpoint, { quoteId });
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get supported payment corridors
   */
  async getCorridors(): Promise<ServiceResult<PaymentCorridor[]>> {
    try {
      return await this.apiClient.get<PaymentCorridor[]>(
        PAYMENTS_ENDPOINTS.LIST_CORRIDORS
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get a specific corridor by ID
   */
  async getCorridor(corridorId: string): Promise<ServiceResult<PaymentCorridor>> {
    try {
      const validation = validate({ corridorId }, {
        corridorId: [
          (value) => required(value, 'corridorId'),
          (value) => stringLength(value, 'corridorId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        PAYMENTS_ENDPOINTS.GET_CORRIDOR,
        { id: corridorId }
      );

      return await this.apiClient.get<PaymentCorridor>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get current fees for different payment types
   */
  async getFees(): Promise<ServiceResult<any>> {
    try {
      return await this.apiClient.get(PAYMENTS_ENDPOINTS.GET_FEES);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get current exchange rates
   */
  async getExchangeRates(): Promise<ServiceResult<any>> {
    try {
      return await this.apiClient.get(PAYMENTS_ENDPOINTS.GET_EXCHANGE_RATES);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get orchestration notifications by status
   */
  async getOrchestrationNotifications(
    status?: PaymentStatus,
    size: number = 10
  ): Promise<ServiceResult<any>> {
    try {
      const queryParams: any = { size };
      if (status) {
        queryParams.status = status;
      }

      const endpoint = buildFullEndpoint(
        PAYMENTS_ENDPOINTS.LIST_ORCHESTRATION_NOTIFICATIONS,
        undefined,
        queryParams
      );

      return await this.apiClient.get(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  // Private validation methods

  private validateCreatePaymentRequest(request: CreatePaymentRequest) {
    return validate(request, {
      quoteId: [
        (value) => required(value, 'quoteId'),
        (value) => stringLength(value, 'quoteId', 1, 100)
      ],
      originatorIdentityId: [
        (value) => required(value, 'originatorIdentityId'),
        (value) => stringLength(value, 'originatorIdentityId', 1, 100)
      ],
      beneficiaryIdentityId: [
        (value) => required(value, 'beneficiaryIdentityId'),
        (value) => stringLength(value, 'beneficiaryIdentityId', 1, 100)
      ],
      sourceAmount: COMMON_SCHEMAS.moneyAmount('sourceAmount'),
      destinationAmount: COMMON_SCHEMAS.moneyAmount('destinationAmount')
    });
  }

  private validateOrchestrationPaymentRequest(request: CreateOrchestrationPaymentRequest) {
    return validate(request, {
      sourceAmount: COMMON_SCHEMAS.moneyAmount('sourceAmount'),
      destinationCurrency: [
        (value) => required(value, 'destinationCurrency'),
        (value) => currencyCode(value, 'destinationCurrency')
      ],
      originatorIdentity: COMMON_SCHEMAS.identity('originatorIdentity'),
      beneficiaryIdentity: COMMON_SCHEMAS.identity('beneficiaryIdentity')
    });
  }

  private validateQuoteRequest(request: QuoteRequest) {
    return validate(request, {
      sourceAmount: COMMON_SCHEMAS.moneyAmount('sourceAmount'),
      destinationCurrency: [
        (value) => required(value, 'destinationCurrency'),
        (value) => currencyCode(value, 'destinationCurrency')
      ]
    });
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
  updateConfig(config: Partial<PaymentsDirectConfig>): void {
    this.apiClient.updateConfig(config);
  }
}

// Factory function for creating payments service
export const createPaymentsDirectService = (
  config?: PaymentsDirectConfig
): PaymentsDirectService => {
  return new PaymentsDirectService(config);
};
