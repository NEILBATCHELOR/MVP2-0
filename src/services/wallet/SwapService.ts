import { 
  SwapFormValues, 
  Quote, 
  SwapTransaction, 
  SwapProvider, 
  Token,
  SwapRouteStep,
  GasOption,
  SwapRoute,
  PriceData,
  UniswapVersion
} from "@/components/wallet/components/swap/types";
import { parseUnits, formatUnits, formatEther } from 'ethers';
import { BrowserProvider } from 'ethers';
import { ZeroAddress } from 'ethers';
import { useWallet } from "@/services/wallet/WalletContext";
import { UniswapV4Service } from "./v4/uniswapV4Service";
import { supabase } from "@/infrastructure/database/client";
import { v4 as uuidv4 } from "uuid";
import { isMultiSigWallet } from "./MultiSigWalletService";

// Interfaces for DEX API responses
interface OneInchQuoteResponse {
  toAmount: string;
  fromToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  toToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  protocols: Array<any>;
  estimatedGas: number;
}

interface OneInchSwapResponse extends OneInchQuoteResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
  };
}

interface ZeroXQuoteResponse {
  price: string;
  guaranteedPrice: string;
  estimatedGas: string;
  gas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  buyAmount: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
}

interface ZeroXSwapResponse extends ZeroXQuoteResponse {
  data: string;
  to: string;
  value: string;
}

// Interface for route summary
export interface RouteSummary {
  exchangeRate: string;
  priceImpact: string;
  estimatedGas: string;
  route: string[];
}

// Interface for quote response data
export interface QuoteResponseData {
  fromTokenAmount: string;
  toTokenAmount: string;
  route: any;
  routeSummary: RouteSummary;
  slippage: string;
}

// Interface for swap parameters
export interface SwapParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage: string;
  route: any;
  isMultiSig?: boolean;
}

// Interface for swap result
export interface SwapResult {
  txHash: string;
  multiSigTxId?: string;
}

// Class to handle all swap-related functionality
export class SwapService {
  private apiKeys: Record<string, string>;
  private baseUrls: Record<string, string>;
  private provider:  BrowserProvider | null = null;
  private v4Service: UniswapV4Service | null = null;
  
  constructor() {
    this.apiKeys = {
      "0x": import.meta.env.VITE_ZEROX_API_KEY || "",
      "1inch": import.meta.env.VITE_ONEINCH_API_KEY || "",
      "paraswap": import.meta.env.VITE_PARASWAP_API_KEY || "",
      "coingecko": import.meta.env.VITE_COINGECKO_API_KEY || ""
    };

    this.baseUrls = {
      "0x": "https://api.0x.org",
      "1inch": "https://api.1inch.io/v5.0",
      "paraswap": "https://apiv5.paraswap.io",
      "coingecko": "https://api.coingecko.com/api/v3",
      "uniswap": "https://api.uniswap.org/v1"
    };
    
    // Initialize Ethereum provider if window.ethereum is available
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new  BrowserProvider(window.ethereum);
      this.v4Service = new UniswapV4Service(this.provider);
    }
  }
  
  // Initialize provider from external wallet connection
  initializeProvider(provider:  BrowserProvider) {
    this.provider = provider;
  }

  // Get token price data from CoinGecko or Uniswap
  async getTokenPrice(tokenId: string): Promise<number> {
    try {
      // First try CoinGecko
      const url = `${this.baseUrls.coingecko}/simple/price?ids=${tokenId.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`;
      const response = await fetch(url, {
        headers: {
          'X-CoinGecko-Api-Key': this.apiKeys.coingecko
        }
      });
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data[tokenId.toLowerCase()]?.usd) {
        return data[tokenId.toLowerCase()].usd;
      }
      
      // Fallback to Uniswap if CoinGecko doesn't have the token
      // This would require implementing Uniswap price query SDK
      throw new Error("Token not found in CoinGecko");
    } catch (error) {
      console.error("Error fetching token price:", error);
      throw new Error("Failed to fetch token price");
    }
  }

  // Get real-time token price data by addresses
  public async getTokenPriceData(fromTokenAddress: string, toTokenAddress: string): Promise<PriceData> {
    if (!fromTokenAddress || !toTokenAddress) {
      return {
        price: 0,
        priceChange24h: 0
      };
    }
    
    try {
      // Try CoinGecko for the from token
      const fromTokenUrl = `${this.baseUrls.coingecko}/simple/token_price/ethereum?contract_addresses=${fromTokenAddress}&vs_currencies=usd&include_24hr_change=true`;
      const fromTokenResponse = await fetch(fromTokenUrl, {
        headers: this.apiKeys.coingecko ? { 'x-cg-pro-api-key': this.apiKeys.coingecko } : {}
      });
      
      // Try CoinGecko for the to token
      const toTokenUrl = `${this.baseUrls.coingecko}/simple/token_price/ethereum?contract_addresses=${toTokenAddress}&vs_currencies=usd&include_24hr_change=true`;
      const toTokenResponse = await fetch(toTokenUrl, {
        headers: this.apiKeys.coingecko ? { 'x-cg-pro-api-key': this.apiKeys.coingecko } : {}
      });
      
      if (fromTokenResponse.ok && toTokenResponse.ok) {
        const fromTokenData = await fromTokenResponse.json();
        const toTokenData = await toTokenResponse.json();
        
        if (fromTokenData[fromTokenAddress.toLowerCase()] && toTokenData[toTokenAddress.toLowerCase()]) {
          // Get current gas price for calculation
          const gasPrice = await this.provider?.send('eth_gasPrice', []) || 0n;
          const estimatedGasCost = typeof gasPrice === 'bigint'
            ? formatEther(gasPrice * 100000n)
            : formatEther(BigInt(gasPrice.toString()) * 100000n);
          
          return {
            price: fromTokenData[fromTokenAddress.toLowerCase()].usd,
            priceChange24h: fromTokenData[fromTokenAddress.toLowerCase()].usd_24h_change || 0,
            fromTokenUsdPrice: fromTokenData[fromTokenAddress.toLowerCase()].usd,
            toTokenUsdPrice: toTokenData[toTokenAddress.toLowerCase()].usd,
            gasCostUsd: parseFloat(estimatedGasCost) * (fromTokenData[fromTokenAddress.toLowerCase()].usd || 0)
          };
        }
      }
      
      // Fallback to a DEX API or aggregator
      throw new Error("CoinGecko API failed");
    } catch (error) {
      console.error("Error fetching token price data:", error);
      // Return mock data if API fails
      return {
        price: 0,
        priceChange24h: 0,
        fromTokenUsdPrice: 0,
        toTokenUsdPrice: 0,
        gasCostUsd: 0
      };
    }
  }

  // Get a quote from the specified provider
  async getQuote(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number,
    provider: SwapProvider = "auto"
  ): Promise<Quote> {
    // If auto, decide the best provider based on the tokens
    if (provider === "auto") {
      provider = this.selectBestProvider(fromToken, toToken);
    }

    try {
      // Call the appropriate provider-specific method
      switch (provider) {
        case "0x":
          return await this.getZeroXQuote(fromToken, toToken, amount, slippage);
        case "1inch":
          return await this.getOneInchQuote(fromToken, toToken, amount, slippage);
        case "paraswap":
          // Implement ParaSwap integration
          throw new Error("ParaSwap integration not implemented yet");
        default:
          throw new Error(`Provider ${provider} not supported`);
      }
    } catch (error) {
      console.error(`Error getting quote from ${provider}:`, error);
      throw new Error(`Failed to get quote from ${provider}`);
    }
  }

  // Build and execute a swap transaction
  async executeSwap(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number,
    walletAddress: string,
    provider: SwapProvider = "auto",
    gasOption: GasOption = "medium"
  ): Promise<string> {
    if (!this.provider) {
      throw new Error("Wallet provider not initialized");
    }
    
    // Ensure we have permission to access the user's account
    await this.provider.send("eth_requestAccounts", []);
    const signer = await this.provider.getSigner();
    
    // If auto, decide the best provider based on the tokens
    if (provider === "auto") {
      provider = this.selectBestProvider(fromToken, toToken);
    }

    try {
      // Build transaction based on provider
      let txRequest;
      switch (provider) {
        case "0x":
          txRequest = await this.buildZeroXTransaction(fromToken, toToken, amount, slippage, walletAddress, gasOption);
          break;
        case "1inch":
          txRequest = await this.buildOneInchTransaction(fromToken, toToken, amount, slippage, walletAddress, gasOption);
          break;
        default:
          throw new Error(`Provider ${provider} not supported`);
      }
      
      if (!txRequest) {
        throw new Error("Failed to build transaction");
      }
      
      // Send transaction
      const tx = await signer.sendTransaction({
        to: txRequest.to,
        data: txRequest.data,
        value: BigInt(txRequest.value || "0"),
        gasLimit: BigInt(txRequest.gasLimit || "0"),
        gasPrice: BigInt(txRequest.gasPrice || "0"),
      });
      
      // Return transaction hash
      return tx.hash;
    } catch (error) {
      console.error(`Error executing swap with ${provider}:`, error);
      throw new Error(`Transaction failed: ${error.message || "Unknown error"}`);
    }
  }

  // Get transaction status
  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    if (!this.provider) {
      throw new Error("Wallet provider not initialized");
    }
    
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return 'pending';
      }
      
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return 'pending';
      }
      
      return receipt.status === 1 ? 'confirmed' : 'failed';
    } catch (error) {
      console.error("Error getting transaction status:", error);
      throw new Error("Failed to get transaction status");
    }
  }

  // Select the best provider based on token pair
  private selectBestProvider(fromToken: Token, toToken: Token): SwapProvider {
    // For ETH pairs, 0x often has better rates
    if (fromToken.symbol === "ETH" || toToken.symbol === "ETH" || 
        fromToken.symbol === "WETH" || toToken.symbol === "WETH") {
      return "0x";
    }
    
    // For stablecoin pairs, 1inch often has better rates
    if ((fromToken.symbol === "USDC" || fromToken.symbol === "USDT" || fromToken.symbol === "DAI") &&
        (toToken.symbol === "USDC" || toToken.symbol === "USDT" || toToken.symbol === "DAI")) {
      return "1inch";
    }
    
    // Default to 0x for all other pairs
    return "0x";
  }

  // Get quote from 0x API
  private async getZeroXQuote(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number
  ): Promise<Quote> {
    if (!this.apiKeys["0x"]) {
      throw new Error("0x API key not configured");
    }
    
    // Format amount to proper decimals
    const sellAmount =  parseUnits(amount, fromToken.decimals).toString();
    
    // Build URL for 0x API
    const params = new URLSearchParams({
      sellToken: fromToken.address,
      buyToken: toToken.address,
      sellAmount: sellAmount,
      slippagePercentage: (slippage / 100).toString(),
    });
    
    const url = `${this.baseUrls["0x"]}/swap/v1/quote?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          '0x-api-key': this.apiKeys["0x"]
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`0x API error: ${errorData.reason || response.status}`);
      }
      
      const data: ZeroXSwapResponse = await response.json();
      
      // Parse the route information from sources
      const route: SwapRouteStep[] = data.sources
        .filter(source => parseFloat(source.proportion) > 0)
        .map(source => ({
          protocol: source.name,
          tokenIn: {
            address: fromToken.address,
            symbol: fromToken.symbol,
            logoURI: fromToken.logoURI
          },
          tokenOut: {
            address: toToken.address,
            symbol: toToken.symbol,
            logoURI: toToken.logoURI
          },
          portion: parseFloat(source.proportion) * 100,
          fee: 0.3 // Default fee, 0x doesn't provide per-route fees
        }));
      
      // Calculate the exchange rate
      const fromDecimals = fromToken.decimals;
      const toDecimals = toToken.decimals;
      const fromAmount = BigInt(sellAmount);
      const toAmount = BigInt(data.buyAmount);
      const fromTokenWei =  formatUnits(fromAmount, fromDecimals);
      const toTokenWei =  formatUnits(toAmount, toDecimals);
      const exchangeRate = parseFloat(toTokenWei) / parseFloat(fromTokenWei);
      
      const minimumReceived = (parseFloat(toTokenWei) * (1 - slippage / 100)).toFixed(6);
      
      // Create swapRoute format required by Quote interface
      const swapRoute: SwapRoute = {
        name: "0x",
        portion: 100,
        hops: [
          {
            address: fromToken.address,
            symbol: fromToken.symbol,
            logoURI: fromToken.logoURI
          },
          {
            address: toToken.address,
            symbol: toToken.symbol,
            logoURI: toToken.logoURI
          }
        ]
      };

      return {
        fromToken: fromToken.address,
        toToken: toToken.address,
        fromAmount: amount,
        toAmount:  formatUnits(data.buyAmount, toToken.decimals),
        exchangeRate: exchangeRate.toString(),
        priceImpact: "0.5", // 0x doesn't provide price impact info directly
        minimumReceived: minimumReceived,
        routes: [swapRoute],
        gasCost: {
          eth:  formatEther(BigInt(data.gas) * BigInt(data.gasPrice)),
          usd: "3.50" // Placeholder, should be calculated based on current ETH price
        },
        slippage: slippage.toString(),
        route: route,
        estimatedGas: data.estimatedGas,
        provider: "0x",
        guaranteedPrice: data.guaranteedPrice,
        gasPrice: data.gasPrice,
        protocolFee: data.protocolFee
      };
    } catch (error) {
      console.error("Error fetching 0x quote:", error);
      throw new Error(`Failed to get quote from 0x: ${error.message}`);
    }
  }

  // Get quote from 1inch API
  private async getOneInchQuote(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number
  ): Promise<Quote> {
    if (!this.apiKeys["1inch"]) {
      throw new Error("1inch API key not configured");
    }
    
    // Set chainId for Ethereum mainnet
    const chainId = 1;
    
    // Format amount to proper decimals
    const fromAmount =  parseUnits(amount, fromToken.decimals).toString();
    
    // Build URL for 1inch API
    const params = new URLSearchParams({
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      amount: fromAmount,
      slippage: slippage.toString(),
      disableEstimate: "true",
    });
    
    const url = `${this.baseUrls["1inch"]}/${chainId}/quote?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys["1inch"]}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`1inch API error: ${errorData.description || response.status}`);
      }
      
      const data: OneInchQuoteResponse = await response.json();
      
      // Parse the route information
      const route: SwapRouteStep[] = data.protocols[0][0].map(protocol => ({
        protocol: protocol.name,
        tokenIn: fromToken.symbol,
        tokenOut: toToken.symbol,
        portion: 100 / data.protocols[0][0].length, // Divide evenly if multiple protocols
        fee: 0.3 // Default fee, 1inch doesn't provide per-route fees
      }));
      
      // Calculate the exchange rate
      const fromDecimals = fromToken.decimals;
      const toDecimals = toToken.decimals;
      const fromTokenWei =  formatUnits(BigInt(fromAmount), fromDecimals);
      const toTokenWei =  formatUnits(BigInt(data.toAmount), toDecimals);
      const exchangeRate = parseFloat(toTokenWei) / parseFloat(fromTokenWei);
      
      const minimumReceived = (parseFloat(toTokenWei) * (1 - slippage / 100)).toFixed(6);
      
      // Create swapRoute format required by Quote interface
      const swapRoute: SwapRoute = {
        name: "1inch",
        portion: 100,
        hops: [
          {
            address: fromToken.address,
            symbol: fromToken.symbol,
            logoURI: fromToken.logoURI
          },
          {
            address: toToken.address,
            symbol: toToken.symbol,
            logoURI: toToken.logoURI
          }
        ]
      };

      return {
        fromToken: fromToken.address,
        toToken: toToken.address,
        fromAmount: amount,
        toAmount:  formatUnits(data.toAmount, toToken.decimals),
        exchangeRate: exchangeRate.toString(),
        priceImpact: "0.6", // 1inch doesn't provide price impact directly
        minimumReceived: minimumReceived,
        routes: [swapRoute],
        gasCost: {
          eth:  formatEther(BigInt(data.estimatedGas.toString()) * 5000000000n), // Estimate using 5 gwei
          usd: "2.50" // Placeholder, should be calculated based on current ETH price
        },
        slippage: slippage.toString(),
        route: route,
        estimatedGas: data.estimatedGas.toString(),
        provider: "1inch"
      };
    } catch (error) {
      console.error("Error fetching 1inch quote:", error);
      throw new Error(`Failed to get quote from 1inch: ${error.message}`);
    }
  }

  // Build transaction from 0x API
  private async buildZeroXTransaction(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number,
    walletAddress: string,
    gasOption: GasOption
  ): Promise<any> {
    if (!this.apiKeys["0x"]) {
      throw new Error("0x API key not configured");
    }
    
    // Format amount to proper decimals
    const sellAmount =  parseUnits(amount, fromToken.decimals).toString();
    
    // Build URL for 0x API swap endpoint
    const params = new URLSearchParams({
      sellToken: fromToken.address,
      buyToken: toToken.address,
      sellAmount: sellAmount,
      slippagePercentage: (slippage / 100).toString(),
      takerAddress: walletAddress
    });
    
    const url = `${this.baseUrls["0x"]}/swap/v1/quote?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          '0x-api-key': this.apiKeys["0x"]
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`0x API error: ${errorData.reason || response.status}`);
      }
      
      const data: ZeroXSwapResponse = await response.json();
      
      // Calculate gas price based on option
      const gasPrice = await this.getAdjustedGasPrice(data.gasPrice, gasOption);
      
      return {
        to: data.to,
        data: data.data,
        value: data.value,
        gasPrice,
        gasLimit: (parseInt(data.gas) * 1.1).toString() // Add 10% buffer
      };
    } catch (error) {
      console.error("Error building 0x transaction:", error);
      throw new Error(`Failed to build 0x transaction: ${error.message}`);
    }
  }

  // Build transaction from 1inch API
  private async buildOneInchTransaction(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number,
    walletAddress: string,
    gasOption: GasOption
  ): Promise<any> {
    if (!this.apiKeys["1inch"]) {
      throw new Error("1inch API key not configured");
    }
    
    // Set chainId for Ethereum mainnet
    const chainId = 1;
    
    // Format amount to proper decimals
    const fromAmount =  parseUnits(amount, fromToken.decimals).toString();
    
    // Build URL for 1inch API swap endpoint
    const params = new URLSearchParams({
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      amount: fromAmount,
      slippage: slippage.toString(),
      fromAddress: walletAddress,
      disableEstimate: "true",
    });
    
    const url = `${this.baseUrls["1inch"]}/${chainId}/swap?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys["1inch"]}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`1inch API error: ${errorData.description || response.status}`);
      }
      
      const data: OneInchSwapResponse = await response.json();
      
      // Calculate gas price based on option
      const gasPrice = await this.getAdjustedGasPrice(data.tx.gasPrice, gasOption);
      
      return {
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value,
        gasPrice,
        gasLimit: (parseInt(data.estimatedGas.toString()) * 1.1).toString() // Add 10% buffer
      };
    } catch (error) {
      console.error("Error building 1inch transaction:", error);
      throw new Error(`Failed to build 1inch transaction: ${error.message}`);
    }
  }

  // Get adjusted gas price based on selected gas option
  private async getAdjustedGasPrice(baseGasPrice: string, gasOption: GasOption): Promise<string> {
    if (!this.provider) {
      return baseGasPrice;
    }
    
    try {
      const feeData = await this.provider.getFeeData();
      let multiplier: number;
      
      switch (gasOption) {
        case "low":
          multiplier = 0.9;
          break;
        case "high":
          multiplier = 1.5;
          break;
        case "medium":
        default:
          multiplier = 1.1;
          break;
      }
      
      // Base gas price
      const gasPrice = feeData.gasPrice ? BigInt(feeData.gasPrice.toString()) : BigInt(baseGasPrice.toString());
      
      // Apply multiplier and return
      return (gasPrice * BigInt(Math.floor(multiplier * 100)) / 100n).toString();
    } catch (error) {
      console.error("Error getting adjusted gas price:", error);
      return baseGasPrice;
    }
  }

  /**
   * Execute a swap with explicit version selection
   */
  async executeSwapWithVersion(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number,
    walletAddress: string,
    version: UniswapVersion = "auto",
    hookAddress: string = ZeroAddress,
    provider: SwapProvider = "auto",
    gasOption: GasOption = "medium"
  ): Promise<string> {
    // Auto-select optimal version if set to "auto"
    if (version === "auto") {
      version = await this.determineOptimalVersion(fromToken, toToken, amount);
    }
    
    if (version === "v4") {
      // Initialize V4 service if not already initialized
      if (!this.v4Service && this.provider) {
        this.v4Service = new UniswapV4Service(this.provider);
      }
      
      if (!this.v4Service) {
        throw new Error("V4 service not initialized. Provider missing.");
      }
      
      // Check if token is approved for V4
      const isApproved = await this.v4Service.checkTokenAllowance(
        fromToken.address,
        walletAddress
      );
      
      // If not approved, request approval first
      if (!isApproved) {
        const approvalTx = await this.v4Service.approveToken(fromToken.address);
        // Wait for approval to be mined
        if (this.provider) {
          await this.provider.waitForTransaction(approvalTx);
        }
      }
      
      // Execute the V4 swap
      return await this.v4Service.executeSwap(
        fromToken,
        toToken,
        amount,
        slippage,
        walletAddress,
        hookAddress,
        gasOption
      );
    } else {
      // Use existing V2/V3 implementation
      return this.executeSwap(
        fromToken,
        toToken,
        amount,
        slippage,
        walletAddress,
        provider,
        gasOption
      );
    }
  }

  /**
   * Get a quote with explicit version selection
   */
  async getQuoteWithVersion(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number,
    version: UniswapVersion = "auto",
    hookAddress: string = ZeroAddress,
    provider: SwapProvider = "auto"
  ): Promise<Quote> {
    // Auto-select optimal version if set to "auto"
    if (version === "auto") {
      version = await this.determineOptimalVersion(fromToken, toToken, amount);
    }
    
    if (version === "v4") {
      // Initialize V4 service if not already initialized
      if (!this.v4Service && this.provider) {
        this.v4Service = new UniswapV4Service(this.provider);
      }
      
      if (!this.v4Service) {
        throw new Error("V4 service not initialized. Provider missing.");
      }
      
      // Get V4 quote
      return await this.v4Service.getSwapQuote(
        fromToken,
        toToken,
        amount,
        slippage,
        hookAddress
      );
    } else {
      // Use existing implementation for V2/V3
      return this.getQuote(
        fromToken,
        toToken,
        amount,
        slippage,
        provider
      );
    }
  }

  /**
   * Compare quotes across versions to determine optimal version
   */
  async compareVersions(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number
  ): Promise<Record<UniswapVersion, Quote | null>> {
    const results: Record<UniswapVersion, Quote | null> = {
      auto: null,
      v2: null,
      v3: null,
      v4: null
    };
    
    try {
      // Try to get V2/V3 quote using existing provider
      results.v3 = await this.getQuote(
        fromToken,
        toToken,
        amount,
        slippage,
        "uniswap"
      );
    } catch (error) {
      console.warn("V2/V3 quote failed:", error);
    }
    
    try {
      // Try to get V4 quote
      if (!this.v4Service && this.provider) {
        this.v4Service = new UniswapV4Service(this.provider);
      }
      
      if (this.v4Service) {
        results.v4 = await this.v4Service.getSwapQuote(
          fromToken,
          toToken,
          amount,
          slippage
        );
      }
    } catch (error) {
      console.warn("V4 quote failed:", error);
    }
    
    return results;
  }

  /**
   * Determine the optimal Uniswap version for the swap
   */
  private async determineOptimalVersion(
    fromToken: Token,
    toToken: Token,
    amount: string
  ): Promise<UniswapVersion> {
    try {
      // Initialize V4 service if not already initialized
      if (!this.v4Service && this.provider) {
        this.v4Service = new UniswapV4Service(this.provider);
      }
      
      // Check if V4 pool exists
      let v4PoolExists = false;
      if (this.v4Service) {
        v4PoolExists = await this.v4Service.checkPoolExists(fromToken, toToken);
      }
      
      // If we're dealing with ETH, prefer V4 as it has native ETH support
      const isEthPair = 
        fromToken.symbol.toUpperCase() === "ETH" || 
        toToken.symbol.toUpperCase() === "ETH";
      
      if (isEthPair && v4PoolExists) {
        return "v4";
      }
      
      // If a V4 pool exists and the amount is significant (higher gas costs might be justified)
      // we could compare gas and output amounts to make a decision
      if (v4PoolExists) {
        // For larger amounts, the gas savings of V4 become more significant
        // This is a simplified heuristic - in a real implementation, you would
        // compare actual gas costs and output amounts
        const amountValue = parseFloat(amount) * (fromToken.price || 0);
        if (amountValue > 1000) { // If value > $1000, use V4 for better gas efficiency
          return "v4";
        }
      }
      
      // Default to V3 if we can't determine a better option
      return "v3";
    } catch (error) {
      console.error("Error determining optimal version:", error);
      // Default to V3 on error
      return "v3";
    }
  }
}

export const swapService = new SwapService();

// Get a quote for a token swap
export async function getSwapQuote({
  fromTokenAddress,
  toTokenAddress,
  amount,
  fromAddress,
}: {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
}): Promise<QuoteResponseData> {
  // In a real app, this would call an API like 1inch or 0x
  // For now, we'll return mock data
  
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  const mockResponse: QuoteResponseData = {
    fromTokenAmount: amount,
    toTokenAmount: calculateToAmount(fromTokenAddress, toTokenAddress, amount),
    route: {
      // Mock route data
      steps: [
        { protocol: "1INCH", fromToken: fromTokenAddress, toToken: toTokenAddress }
      ],
    },
    routeSummary: {
      exchangeRate: getExchangeRate(fromTokenAddress, toTokenAddress),
      priceImpact: getPriceImpact(),
      estimatedGas: getEstimatedGas(),
      route: getRoute(fromTokenAddress, toTokenAddress),
    },
    slippage: "0.5",
  };
  
  return mockResponse;
}

// Execute a token swap
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const {
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromAddress,
    slippage,
    route,
    isMultiSig,
  } = params;
  
  // Check if the wallet is a multi-signature wallet if isMultiSig is not provided
  let walletIsMultiSig = isMultiSig;
  if (walletIsMultiSig === undefined) {
    walletIsMultiSig = await isMultiSigWallet(fromAddress);
  }
  
  // Simulate transaction delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  // Generate a mock transaction hash
  const txHash = `0x${Array.from({ length: 64 })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("")}`;
  
  if (walletIsMultiSig) {
    // For multi-sig wallets, create a pending transaction that needs signatures
    const multiSigTxId = await createMultiSigTransaction({
      fromAddress,
      txHash,
      fromTokenAddress,
      toTokenAddress,
      amount,
    });
    
    return {
      txHash,
      multiSigTxId,
    };
  }
  
  return { txHash };
}

// Create a multi-signature transaction in the database
async function createMultiSigTransaction({
  fromAddress,
  txHash,
  fromTokenAddress,
  toTokenAddress,
  amount,
}: {
  fromAddress: string;
  txHash: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
}): Promise<string> {
  // Get the wallet ID from the address
  const { data: walletData, error: walletError } = await supabase
    .from("multi_sig_wallets")
    .select("id")
    .eq("address", fromAddress)
    .single();
  
  if (walletError || !walletData) {
    throw new Error("Failed to find wallet with the given address");
  }
  
  const transactionId = uuidv4();
  
  // Insert the transaction into the database
  const { data, error } = await supabase
    .from("multi_sig_transactions")
    .insert({
      id: transactionId,
      wallet_id: walletData.id,
      hash: txHash,
      description: `Swap ${getTokenSymbol(fromTokenAddress)} for ${getTokenSymbol(toTokenAddress)}`,
      executed: false,
      confirmations: 0,
      blockchain: "ethereum", // Default to Ethereum
      destination_wallet_address: toTokenAddress,
      to: toTokenAddress,
      data: JSON.stringify({
        fromToken: getTokenSymbol(fromTokenAddress),
        toToken: getTokenSymbol(toTokenAddress),
        fromAmount: amount,
        toAmount: calculateToAmount(fromTokenAddress, toTokenAddress, amount),
      }),
      value: amount,
      token_address: fromTokenAddress,
      token_symbol: getTokenSymbol(fromTokenAddress),
      nonce: Math.floor(Math.random() * 1000000), // For demo purposes
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating multi-sig transaction:", error);
    throw new Error("Failed to create multi-signature transaction");
  }
  
  return transactionId;
}

// Helper functions
function calculateToAmount(fromToken: string, toToken: string, amount: string): string {
  // Mock exchange rate calculation
  const fromTokenPrice = getTokenPrice(fromToken);
  const toTokenPrice = getTokenPrice(toToken);
  
  if (!fromTokenPrice || !toTokenPrice) return "0";
  
  const exchangeRate = fromTokenPrice / toTokenPrice;
  return (parseFloat(amount) * exchangeRate).toFixed(6);
}

function getTokenPrice(tokenAddress: string): number {
  // Mock token prices
  const prices: Record<string, number> = {
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": 3500.42, // ETH
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 1.0, // USDC
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": 61245.75, // WBTC
    "0x514910771af9ca656af840dff83e8264ecf986ca": 14.23, // LINK
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": 10.45, // UNI
    "0x6b175474e89094c44da98b954eedeac495271d0f": 1.0, // DAI
  };
  
  return prices[tokenAddress.toLowerCase()] || 0;
}

function getTokenSymbol(tokenAddress: string): string {
  // Mock token symbols
  const symbols: Record<string, string> = {
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH", 
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",
    "0x514910771af9ca656af840dff83e8264ecf986ca": "LINK",
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "UNI",
    "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  };
  
  return symbols[tokenAddress.toLowerCase()] || "UNKNOWN";
}

function getExchangeRate(fromToken: string, toToken: string): string {
  // Mock exchange rate
  const fromTokenPrice = getTokenPrice(fromToken);
  const toTokenPrice = getTokenPrice(toToken);
  
  if (!fromTokenPrice || !toTokenPrice) return "0";
  
  const rate = fromTokenPrice / toTokenPrice;
  return `1 ${getTokenSymbol(fromToken)} = ${rate.toFixed(6)} ${getTokenSymbol(toToken)}`;
}

function getPriceImpact(): string {
  // Mock price impact (usually a percentage)
  return (Math.random() * 0.5).toFixed(2) + "%";
}

function getEstimatedGas(): string {
  // Mock gas estimate
  return (Math.random() * 0.01).toFixed(5) + " ETH";
}

function getRoute(fromToken: string, toToken: string): string[] {
  // Mock route
  const fromSymbol = getTokenSymbol(fromToken);
  const toSymbol = getTokenSymbol(toToken);
  
  // Sometimes include intermediary tokens
  if (Math.random() > 0.5) {
    return [fromSymbol, toSymbol];
  } else {
    // Add an intermediary token
    const intermediaries = ["WETH", "USDT", "DAI"];
    const intermediary = intermediaries[Math.floor(Math.random() * intermediaries.length)];
    return [fromSymbol, intermediary, toSymbol];
  }
} 