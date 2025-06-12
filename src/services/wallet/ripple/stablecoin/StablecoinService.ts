/**
 * Ripple Stablecoin (RLUSD) Service
 * Handles RLUSD operations across XRP Ledger and Ethereum networks
 */

import type {
  RLUSDToken,
  StablecoinNetwork,
  StablecoinBalance,
  StablecoinTransaction,
  StablecoinTransactionType,
  TransferRequest,
  BridgeRequest,
  BridgeTransaction,
  RedemptionRequest,
  XRPLTrustLine,
  CreateTrustLineRequest,
  ERC20Allowance,
  ApproveRequest,
  TransactionListResponse,
  BalanceResponse
} from '../types/stablecoin';
import type { ServiceResult } from '../types/common';
import { RippleApiClient, createRippleApiClient } from '../utils/ApiClient';
import { RippleErrorHandler } from '../utils/ErrorHandler';
import { STABLECOIN_ENDPOINTS, buildFullEndpoint } from '../config';
import { 
  validate, 
  required, 
  stringLength, 
  amount, 
  enumValue,
  xrpAddress,
  ethAddress 
} from '../utils/Validators';

export interface StablecoinConfig {
  environment?: 'test' | 'production';
  tokenProvider?: () => Promise<any>;
  maxRetries?: number;
  timeout?: number;
  defaultNetwork?: StablecoinNetwork;
}

export interface NetworkInfo {
  network: StablecoinNetwork;
  contractAddress?: string;
  issuerAddress?: string;
  rpcUrl: string;
  explorerUrl: string;
  isActive: boolean;
  confirmationsRequired: number;
}

export class StablecoinService {
  private apiClient: RippleApiClient;
  private config: Required<StablecoinConfig>;

  constructor(config: StablecoinConfig = {}) {
    this.config = {
      environment: config.environment || 'test',
      tokenProvider: config.tokenProvider,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      defaultNetwork: config.defaultNetwork || 'xrp_ledger'
    };

    this.apiClient = createRippleApiClient(
      {
        environment: this.config.environment,
        retries: this.config.maxRetries,
        timeout: this.config.timeout
      },
      this.config.tokenProvider
    );
  }

  /**
   * Get RLUSD balance for an address
   */
  async getBalance(
    address: string,
    network?: StablecoinNetwork
  ): Promise<ServiceResult<StablecoinBalance>> {
    try {
      const targetNetwork = network || this.config.defaultNetwork;
      
      // Validate address format based on network
      const validation = this.validateAddress(address, targetNetwork);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        STABLECOIN_ENDPOINTS.GET_BALANCE,
        { address }
      );

      const queryParams = { network: targetNetwork };
      const result = await this.apiClient.get<StablecoinBalance>(
        endpoint,
        queryParams
      );

      return result;
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get balances across all networks for an address
   */
  async getAllBalances(address: string): Promise<ServiceResult<BalanceResponse>> {
    try {
      const networks: StablecoinNetwork[] = ['xrp_ledger', 'ethereum'];
      const balancePromises = networks.map(network => 
        this.getBalance(address, network)
      );

      const results = await Promise.all(balancePromises);
      const balances: StablecoinBalance[] = [];
      let totalBalance = '0';

      for (const result of results) {
        if (result.success && result.data) {
          balances.push(result.data);
          totalBalance = (parseFloat(totalBalance) + parseFloat(result.data.balance)).toString();
        }
      }

      const response: BalanceResponse = {
        balances,
        totalBalance,
        networks: networks.filter((_, index) => results[index].success)
      };

      return RippleErrorHandler.createSuccessResult(response);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Transfer RLUSD tokens
   */
  async transfer(transferRequest: TransferRequest): Promise<ServiceResult<StablecoinTransaction>> {
    try {
      // Validate transfer request
      const validation = this.validateTransferRequest(transferRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      let endpoint: string;
      
      if (transferRequest.network === 'ethereum' || 
          transferRequest.network === 'polygon' || 
          transferRequest.network === 'bsc') {
        endpoint = STABLECOIN_ENDPOINTS.ETH_TRANSFER;
      } else {
        endpoint = STABLECOIN_ENDPOINTS.TRANSFER;
      }

      return await this.apiClient.post<StablecoinTransaction>(
        endpoint,
        transferRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Create trust line for RLUSD on XRP Ledger
   */
  async createTrustLine(
    trustLineRequest: CreateTrustLineRequest
  ): Promise<ServiceResult<StablecoinTransaction>> {
    try {
      // Validate trust line request
      const validation = this.validateTrustLineRequest(trustLineRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<StablecoinTransaction>(
        STABLECOIN_ENDPOINTS.CREATE_TRUSTLINE,
        trustLineRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get trust lines for an XRP Ledger address
   */
  async getTrustLines(address: string): Promise<ServiceResult<XRPLTrustLine[]>> {
    try {
      // Validate XRP address
      const validation = validate({ address }, {
        address: [
          (value) => required(value, 'address'),
          (value) => xrpAddress(value, 'address')
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        STABLECOIN_ENDPOINTS.GET_TRUSTLINES,
        { address }
      );

      return await this.apiClient.get<XRPLTrustLine[]>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get ERC20 allowance (Ethereum networks)
   */
  async getEthereumAllowance(
    owner: string,
    spender: string,
    network: 'ethereum' | 'polygon' | 'bsc' = 'ethereum'
  ): Promise<ServiceResult<ERC20Allowance>> {
    try {
      // Validate Ethereum addresses
      const validation = validate({ owner, spender }, {
        owner: [
          (value) => required(value, 'owner'),
          (value) => ethAddress(value, 'owner')
        ],
        spender: [
          (value) => required(value, 'spender'),
          (value) => ethAddress(value, 'spender')
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const queryParams = { owner, spender, network };
      
      return await this.apiClient.get<ERC20Allowance>(
        STABLECOIN_ENDPOINTS.GET_ETH_ALLOWANCE,
        queryParams
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Approve ERC20 token spending (Ethereum networks)
   */
  async approve(approveRequest: ApproveRequest): Promise<ServiceResult<StablecoinTransaction>> {
    try {
      // Validate approve request
      const validation = this.validateApproveRequest(approveRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<StablecoinTransaction>(
        STABLECOIN_ENDPOINTS.ETH_APPROVE,
        approveRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Bridge RLUSD between networks
   */
  async bridgeTokens(bridgeRequest: BridgeRequest): Promise<ServiceResult<BridgeTransaction>> {
    try {
      // Validate bridge request
      const validation = this.validateBridgeRequest(bridgeRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<BridgeTransaction>(
        STABLECOIN_ENDPOINTS.BRIDGE_TOKENS,
        bridgeRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get bridge transaction status
   */
  async getBridgeStatus(bridgeId: string): Promise<ServiceResult<BridgeTransaction>> {
    try {
      const validation = validate({ bridgeId }, {
        bridgeId: [
          (value) => required(value, 'bridgeId'),
          (value) => stringLength(value, 'bridgeId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        STABLECOIN_ENDPOINTS.GET_BRIDGE_STATUS,
        { id: bridgeId }
      );

      return await this.apiClient.get<BridgeTransaction>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Request RLUSD redemption to USD
   */
  async requestRedemption(
    redemptionRequest: Omit<RedemptionRequest, 'id' | 'status' | 'requestedAt'>
  ): Promise<ServiceResult<RedemptionRequest>> {
    try {
      // Validate redemption request
      const validation = this.validateRedemptionRequest(redemptionRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<RedemptionRequest>(
        STABLECOIN_ENDPOINTS.REQUEST_REDEMPTION,
        redemptionRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get redemption status
   */
  async getRedemptionStatus(redemptionId: string): Promise<ServiceResult<RedemptionRequest>> {
    try {
      const validation = validate({ redemptionId }, {
        redemptionId: [
          (value) => required(value, 'redemptionId'),
          (value) => stringLength(value, 'redemptionId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        STABLECOIN_ENDPOINTS.GET_REDEMPTION_STATUS,
        { id: redemptionId }
      );

      return await this.apiClient.get<RedemptionRequest>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    address: string,
    network?: StablecoinNetwork,
    page: number = 0,
    size: number = 20
  ): Promise<ServiceResult<TransactionListResponse>> {
    try {
      const queryParams: any = { address, page, size };
      
      if (network) {
        queryParams.network = network;
      }

      const endpoint = buildFullEndpoint(
        '/stablecoin/transactions', // This would be added to endpoints
        undefined,
        queryParams
      );

      return await this.apiClient.get<TransactionListResponse>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get supported networks and their configurations
   */
  async getSupportedNetworks(): Promise<ServiceResult<NetworkInfo[]>> {
    try {
      // This would typically come from an API endpoint
      const networks: NetworkInfo[] = [
        {
          network: 'xrp_ledger',
          issuerAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', // Example RLUSD issuer
          rpcUrl: 'wss://xrplcluster.com',
          explorerUrl: 'https://livenet.xrpl.org',
          isActive: true,
          confirmationsRequired: 1
        },
        {
          network: 'ethereum',
          contractAddress: '0x1234567890123456789012345678901234567890', // Example RLUSD contract
          rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
          explorerUrl: 'https://etherscan.io',
          isActive: true,
          confirmationsRequired: 12
        }
      ];

      return RippleErrorHandler.createSuccessResult(networks);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  // Private validation methods

  private validateAddress(address: string, network: StablecoinNetwork) {
    const addressValidators = {
      address: [
        (value: string) => required(value, 'address'),
        (value: string) => {
          switch (network) {
            case 'xrp_ledger':
              return xrpAddress(value, 'address');
            case 'ethereum':
            case 'polygon':
            case 'bsc':
              return ethAddress(value, 'address');
            default:
              return {
                field: 'address',
                code: 'invalid_network',
                message: 'Unsupported network for address validation',
                value
              };
          }
        }
      ]
    };

    return validate({ address }, addressValidators);
  }

  private validateTransferRequest(request: TransferRequest) {
    return validate(request, {
      network: [
        (value) => required(value, 'network'),
        (value) => enumValue(value, 'network', ['xrp_ledger', 'ethereum', 'polygon', 'bsc'])
      ],
      fromAddress: [
        (value) => required(value, 'fromAddress'),
        (value) => stringLength(value, 'fromAddress', 10, 100)
      ],
      toAddress: [
        (value) => required(value, 'toAddress'),
        (value) => stringLength(value, 'toAddress', 10, 100)
      ],
      amount: [
        (value) => required(value, 'amount'),
        (value) => amount(value, 'amount')
      ]
    });
  }

  private validateTrustLineRequest(request: CreateTrustLineRequest) {
    return validate(request, {
      account: [
        (value) => required(value, 'account'),
        (value) => xrpAddress(value, 'account')
      ],
      currency: [
        (value) => required(value, 'currency'),
        (value) => enumValue(value, 'currency', ['RLUSD'])
      ],
      issuer: [
        (value) => required(value, 'issuer'),
        (value) => xrpAddress(value, 'issuer')
      ],
      limit: [
        (value) => required(value, 'limit'),
        (value) => amount(value, 'limit')
      ]
    });
  }

  private validateApproveRequest(request: ApproveRequest) {
    return validate(request, {
      network: [
        (value) => required(value, 'network'),
        (value) => enumValue(value, 'network', ['ethereum', 'polygon', 'bsc'])
      ],
      ownerAddress: [
        (value) => required(value, 'ownerAddress'),
        (value) => ethAddress(value, 'ownerAddress')
      ],
      spenderAddress: [
        (value) => required(value, 'spenderAddress'),
        (value) => ethAddress(value, 'spenderAddress')
      ],
      amount: [
        (value) => required(value, 'amount'),
        (value) => amount(value, 'amount')
      ]
    });
  }

  private validateBridgeRequest(request: BridgeRequest) {
    return validate(request, {
      sourceNetwork: [
        (value) => required(value, 'sourceNetwork'),
        (value) => enumValue(value, 'sourceNetwork', ['xrp_ledger', 'ethereum', 'polygon', 'bsc'])
      ],
      destinationNetwork: [
        (value) => required(value, 'destinationNetwork'),
        (value) => enumValue(value, 'destinationNetwork', ['xrp_ledger', 'ethereum', 'polygon', 'bsc'])
      ],
      fromAddress: [
        (value) => required(value, 'fromAddress'),
        (value) => stringLength(value, 'fromAddress', 10, 100)
      ],
      toAddress: [
        (value) => required(value, 'toAddress'),
        (value) => stringLength(value, 'toAddress', 10, 100)
      ],
      amount: [
        (value) => required(value, 'amount'),
        (value) => amount(value, 'amount')
      ]
    });
  }

  private validateRedemptionRequest(request: Omit<RedemptionRequest, 'id' | 'status' | 'requestedAt'>) {
    return validate(request, {
      network: [
        (value) => required(value, 'network'),
        (value) => enumValue(value, 'network', ['xrp_ledger', 'ethereum', 'polygon', 'bsc'])
      ],
      fromAddress: [
        (value) => required(value, 'fromAddress'),
        (value) => stringLength(value, 'fromAddress', 10, 100)
      ],
      amount: [
        (value) => required(value, 'amount'),
        (value) => amount(value, 'amount')
      ],
      bankAccount: [
        (value) => required(value, 'bankAccount'),
        (value) => {
          if (!value?.accountName || !value?.accountNumber) {
            return {
              field: 'bankAccount',
              code: 'invalid_format',
              message: 'bankAccount must include accountName and accountNumber',
              value
            };
          }
          return null;
        }
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
  updateConfig(config: Partial<StablecoinConfig>): void {
    this.config = { ...this.config, ...config };
    this.apiClient.updateConfig(config);
  }
}

// Factory function for creating stablecoin service
export const createStablecoinService = (config?: StablecoinConfig): StablecoinService => {
  return new StablecoinService(config);
};
