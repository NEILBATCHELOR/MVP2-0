/**
 * MoonPay Network Fees Service
 * Handles real-time network fee information, gas estimation, and fee optimization
 */

export interface NetworkFee {
  currency: string;
  network: string;
  feeType: 'fixed' | 'percentage' | 'gas_based';
  standardFee: number;
  fastFee: number;
  priorityFee: number;
  unit: string;
  estimatedConfirmationTime: {
    standard: number; // minutes
    fast: number;
    priority: number;
  };
  congestionLevel: 'low' | 'medium' | 'high' | 'extreme';
  lastUpdated: string;
}

export interface GasEstimate {
  currency: string;
  network: string;
  operation: 'transfer' | 'contract_interaction' | 'token_transfer' | 'swap' | 'mint' | 'burn';
  gasLimit: number;
  gasPrice: {
    slow: number;
    standard: number;
    fast: number;
    instant: number;
  };
  totalCost: {
    slow: number;
    standard: number;
    fast: number;
    instant: number;
  };
  estimatedTime: {
    slow: number; // minutes
    standard: number;
    fast: number;
    instant: number;
  };
  baseFee?: number;
  priorityFee?: number;
  maxFee?: number;
}

export interface FeeOptimization {
  currency: string;
  network: string;
  currentFee: number;
  optimizedFee: number;
  savings: number;
  savingsPercentage: number;
  recommendedTiming: {
    optimal: string; // ISO timestamp
    acceptable: string[];
    avoid: string[];
  };
  factors: {
    networkCongestion: number;
    timeOfDay: number;
    dayOfWeek: number;
    seasonality: number;
  };
}

export interface NetworkCongestion {
  network: string;
  congestionLevel: 'low' | 'medium' | 'high' | 'extreme';
  congestionScore: number; // 0-100
  pendingTransactions: number;
  averageBlockTime: number;
  memoryPoolSize: number;
  networkUtilization: number;
  predictedTrend: 'increasing' | 'decreasing' | 'stable';
  nextOptimalWindow: string; // ISO timestamp
  historicalPattern: {
    hourlyAverages: number[];
    dailyAverages: number[];
    weeklyPattern: number[];
  };
}

export interface FeeComparison {
  networks: Array<{
    network: string;
    currency: string;
    fee: number;
    estimatedTime: number;
    reliability: number;
    supported: boolean;
  }>;
  cheapest: string;
  fastest: string;
  recommended: string;
  lastUpdated: string;
}

export interface FeeAlert {
  id: string;
  currency: string;
  network: string;
  alertType: 'fee_threshold' | 'congestion_level' | 'optimal_timing' | 'network_issue';
  condition: {
    operator: 'above' | 'below' | 'equals';
    value: number;
    unit: string;
  };
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
}

/**
 * Network Fees Service for MoonPay
 */
export class NetworkFeesService {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;
  private cache: Map<string, { data: any; expires: number }> = new Map();

  constructor(apiKey: string, secretKey: string, testMode: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.apiBaseUrl = testMode 
      ? "https://api.moonpay.com" 
      : "https://api.moonpay.com";
  }

  /**
   * Get network fees for specific currencies
   */
  async getNetworkFees(
    cryptoCurrencies?: string[],
    fiatCurrencies?: string[],
    includeEstimation: boolean = true
  ): Promise<NetworkFee[]> {
    try {
      const cacheKey = `network-fees-${cryptoCurrencies?.join(',')}-${fiatCurrencies?.join(',')}`;
      
      // Check cache first (cache for 30 seconds)
      const cached = this.getCachedData(cacheKey, 30000);
      if (cached) return cached;

      const params = new URLSearchParams();
      if (cryptoCurrencies) {
        params.append('cryptoCurrencies', cryptoCurrencies.join(','));
      }
      if (fiatCurrencies) {
        params.append('fiatCurrencies', fiatCurrencies.join(','));
      }
      params.append('includeEstimation', includeEstimation.toString());

      const response = await fetch(`${this.apiBaseUrl}/v3/currencies/network_fees?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Network fees API error: ${response.status}`);
      }

      const feesData = await response.json();
      const networkFees = this.mapNetworkFeesResponse(feesData);
      
      // Cache the result
      this.setCachedData(cacheKey, networkFees);
      
      return networkFees;
    } catch (error) {
      console.error('Error getting network fees:', error);
      throw new Error(`Failed to get network fees: ${error.message}`);
    }
  }

  /**
   * Get gas estimates for specific operations
   */
  async getGasEstimates(
    currency: string,
    operation: 'transfer' | 'contract_interaction' | 'token_transfer' | 'swap' | 'mint' | 'burn',
    contractAddress?: string,
    amount?: number
  ): Promise<GasEstimate> {
    try {
      const cacheKey = `gas-estimate-${currency}-${operation}-${contractAddress}`;
      
      // Check cache first (cache for 10 seconds)
      const cached = this.getCachedData(cacheKey, 10000);
      if (cached) return cached;

      const params = new URLSearchParams({
        currency,
        operation,
        ...(contractAddress && { contractAddress }),
        ...(amount && { amount: amount.toString() })
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/gas/estimate?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Gas estimation API error: ${response.status}`);
      }

      const gasData = await response.json();
      const gasEstimate = this.mapGasEstimateResponse(gasData, currency, operation);
      
      // Cache the result
      this.setCachedData(cacheKey, gasEstimate);
      
      return gasEstimate;
    } catch (error) {
      console.error('Error getting gas estimates:', error);
      throw new Error(`Failed to get gas estimates: ${error.message}`);
    }
  }

  /**
   * Get fee optimization suggestions
   */
  async getFeeOptimization(
    currency: string,
    network: string,
    currentFee: number,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<FeeOptimization> {
    try {
      const params = new URLSearchParams({
        currency,
        network,
        currentFee: currentFee.toString(),
        urgency
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/fees/optimize?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Fee optimization API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting fee optimization:', error);
      // Return default optimization if API fails
      return this.generateDefaultOptimization(currency, network, currentFee);
    }
  }

  /**
   * Get network congestion information
   */
  async getNetworkCongestion(networks?: string[]): Promise<NetworkCongestion[]> {
    try {
      const cacheKey = `network-congestion-${networks?.join(',')}`;
      
      // Check cache first (cache for 15 seconds)
      const cached = this.getCachedData(cacheKey, 15000);
      if (cached) return cached;

      const params = new URLSearchParams();
      if (networks) {
        params.append('networks', networks.join(','));
      }

      const response = await fetch(`${this.apiBaseUrl}/v3/networks/congestion?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Network congestion API error: ${response.status}`);
      }

      const congestionData = await response.json();
      const networkCongestion = this.mapCongestionResponse(congestionData);
      
      // Cache the result
      this.setCachedData(cacheKey, networkCongestion);
      
      return networkCongestion;
    } catch (error) {
      console.error('Error getting network congestion:', error);
      throw new Error(`Failed to get network congestion: ${error.message}`);
    }
  }

  /**
   * Compare fees across different networks
   */
  async compareFees(
    amount: number,
    operation: 'buy' | 'sell' | 'transfer' | 'swap',
    networks?: string[]
  ): Promise<FeeComparison> {
    try {
      const params = new URLSearchParams({
        amount: amount.toString(),
        operation,
        ...(networks && { networks: networks.join(',') })
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/fees/compare?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Fee comparison API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error comparing fees:', error);
      throw new Error(`Failed to compare fees: ${error.message}`);
    }
  }

  /**
   * Set up fee alerts
   */
  async createFeeAlert(alertData: Omit<FeeAlert, 'id' | 'triggerCount' | 'createdAt' | 'lastTriggered'>): Promise<FeeAlert> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/fees/alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alertData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create fee alert API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating fee alert:', error);
      throw new Error(`Failed to create fee alert: ${error.message}`);
    }
  }

  /**
   * Get fee alerts
   */
  async getFeeAlerts(currency?: string, network?: string): Promise<FeeAlert[]> {
    try {
      const params = new URLSearchParams();
      if (currency) params.append('currency', currency);
      if (network) params.append('network', network);

      const response = await fetch(`${this.apiBaseUrl}/v3/fees/alerts?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get fee alerts API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting fee alerts:', error);
      throw new Error(`Failed to get fee alerts: ${error.message}`);
    }
  }

  /**
   * Delete fee alert
   */
  async deleteFeeAlert(alertId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/fees/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Delete fee alert API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting fee alert:', error);
      throw new Error(`Failed to delete fee alert: ${error.message}`);
    }
  }

  /**
   * Get historical fee data for analysis
   */
  async getHistoricalFees(
    currency: string,
    network: string,
    period: '1h' | '24h' | '7d' | '30d' = '24h',
    granularity: '1m' | '5m' | '1h' | '1d' = '1h'
  ): Promise<Array<{ timestamp: string; fee: number; congestion: number }>> {
    try {
      const params = new URLSearchParams({
        currency,
        network,
        period,
        granularity
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/fees/historical?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Historical fees API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting historical fees:', error);
      throw new Error(`Failed to get historical fees: ${error.message}`);
    }
  }

  // Private helper methods

  private getCachedData(key: string, maxAge: number): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  private mapNetworkFeesResponse(feesData: any): NetworkFee[] {
    if (!feesData || !Array.isArray(feesData)) {
      return [];
    }

    return feesData.map(fee => ({
      currency: fee.currency || '',
      network: fee.network || '',
      feeType: fee.feeType || 'fixed',
      standardFee: fee.standardFee || 0,
      fastFee: fee.fastFee || 0,
      priorityFee: fee.priorityFee || 0,
      unit: fee.unit || 'gwei',
      estimatedConfirmationTime: {
        standard: fee.estimatedConfirmationTime?.standard || 10,
        fast: fee.estimatedConfirmationTime?.fast || 5,
        priority: fee.estimatedConfirmationTime?.priority || 2
      },
      congestionLevel: fee.congestionLevel || 'medium',
      lastUpdated: fee.lastUpdated || new Date().toISOString()
    }));
  }

  private mapGasEstimateResponse(gasData: any, currency: string, operation: string): GasEstimate {
    return {
      currency,
      network: gasData.network || 'ethereum',
      operation: operation as any,
      gasLimit: gasData.gasLimit || 21000,
      gasPrice: {
        slow: gasData.gasPrice?.slow || 10,
        standard: gasData.gasPrice?.standard || 20,
        fast: gasData.gasPrice?.fast || 40,
        instant: gasData.gasPrice?.instant || 60
      },
      totalCost: {
        slow: gasData.totalCost?.slow || 0.001,
        standard: gasData.totalCost?.standard || 0.002,
        fast: gasData.totalCost?.fast || 0.004,
        instant: gasData.totalCost?.instant || 0.006
      },
      estimatedTime: {
        slow: gasData.estimatedTime?.slow || 15,
        standard: gasData.estimatedTime?.standard || 5,
        fast: gasData.estimatedTime?.fast || 2,
        instant: gasData.estimatedTime?.instant || 1
      },
      baseFee: gasData.baseFee,
      priorityFee: gasData.priorityFee,
      maxFee: gasData.maxFee
    };
  }

  private mapCongestionResponse(congestionData: any): NetworkCongestion[] {
    if (!congestionData || !Array.isArray(congestionData)) {
      return [];
    }

    return congestionData.map(congestion => ({
      network: congestion.network || '',
      congestionLevel: congestion.congestionLevel || 'medium',
      congestionScore: congestion.congestionScore || 50,
      pendingTransactions: congestion.pendingTransactions || 0,
      averageBlockTime: congestion.averageBlockTime || 15,
      memoryPoolSize: congestion.memoryPoolSize || 0,
      networkUtilization: congestion.networkUtilization || 50,
      predictedTrend: congestion.predictedTrend || 'stable',
      nextOptimalWindow: congestion.nextOptimalWindow || new Date(Date.now() + 3600000).toISOString(),
      historicalPattern: {
        hourlyAverages: congestion.historicalPattern?.hourlyAverages || new Array(24).fill(50),
        dailyAverages: congestion.historicalPattern?.dailyAverages || new Array(30).fill(50),
        weeklyPattern: congestion.historicalPattern?.weeklyPattern || new Array(7).fill(50)
      }
    }));
  }

  private generateDefaultOptimization(currency: string, network: string, currentFee: number): FeeOptimization {
    const optimizedFee = currentFee * 0.85; // 15% savings
    return {
      currency,
      network,
      currentFee,
      optimizedFee,
      savings: currentFee - optimizedFee,
      savingsPercentage: 15,
      recommendedTiming: {
        optimal: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        acceptable: [
          new Date(Date.now() + 3600000).toISOString(),
          new Date(Date.now() + 10800000).toISOString()
        ],
        avoid: [
          new Date(Date.now() + 14400000).toISOString()
        ]
      },
      factors: {
        networkCongestion: 0.4,
        timeOfDay: 0.3,
        dayOfWeek: 0.2,
        seasonality: 0.1
      }
    };
  }
}

export const networkFeesService = new NetworkFeesService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
