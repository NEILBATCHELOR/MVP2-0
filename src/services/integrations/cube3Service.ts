import { toast } from "@/components/ui/use-toast";

// API Types
export type Cube3Response<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown';

export type WalletRiskAssessment = {
  riskLevel: RiskLevel;
  riskScore: number;
  riskDetails: {
    suspiciousActivity?: boolean;
    darkWebExposure?: boolean;
    sanctioned?: boolean;
    fraudReports?: boolean;
    phishingAssociation?: boolean;
    moneyLaundering?: boolean;
    terrorismFinancing?: boolean;
    mixerUsage?: boolean;
    gambling?: boolean;
    malwareAssociation?: boolean;
    scamAssociation?: boolean;
    highRiskExchangeUsage?: boolean;
  };
  associatedAddresses?: {
    address: string;
    chainId: number;
    riskLevel: RiskLevel;
    relationship: string;
  }[];
  rawData?: any;
};

export type TransactionVerification = {
  safe: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
  details: {
    contractSecurity?: {
      verified: boolean;
      audited: boolean;
      openSource: boolean;
      rugPullRisk: boolean;
    };
    destinationAnalysis?: {
      riskLevel: RiskLevel;
      riskScore: number;
      flagged: boolean;
    };
    simulationResults?: {
      successful: boolean;
      gasEstimate: number;
      warnings: string[];
    };
  };
  rawData?: any;
};

// Control List Types
export type ControlListType = 'allowlist' | 'blocklist';

export type ControlListEntry = {
  address: string;
  chainId: number;
  reason?: string;
  expiration?: string; // ISO date string
  createdAt: string;
};

export type ControlList = {
  id: string;
  name: string;
  type: ControlListType;
  description?: string;
  entries: ControlListEntry[];
};

// Config
let API_KEY: string | null = null;
let API_URL = 'https://api.cube3.ai/v2';
let DEBUG_MODE = false;

// Initialize the service with API key
export function initCube3Service(apiKey: string, apiUrl?: string): boolean {
  if (!apiKey) {
    console.error('CUBE3 API key is required');
    return false;
  }

  API_KEY = apiKey;
  if (apiUrl) API_URL = apiUrl;
  
  if (DEBUG_MODE) {
    console.log('CUBE3 service initialized with:');
    console.log('- API URL:', API_URL);
    console.log('- API Key:', `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  }
  
  return true;
}

// Enable/disable debug logging
export function enableDebugLogging(enable: boolean): void {
  DEBUG_MODE = enable;
}

// Check if service is initialized
function isInitialized(): boolean {
  if (!API_KEY) {
    console.error('CUBE3 service not initialized. Call initCube3Service first.');
    return false;
  }
  return true;
}

// Wallet Risk Assessment
export async function checkWalletAddress(
  address: string,
  chainId: number = 1 // Default to Ethereum mainnet
): Promise<Cube3Response<any>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  if (!address) {
    return { success: false, error: 'Wallet address is required' };
  }

  try {
    if (DEBUG_MODE) console.log(`Checking wallet address ${address} on chain ${chainId}`);

    const response = await fetch(`${API_URL}/check/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        address,
        chainId: chainId.toString(),
        includeAssociatedAddresses: true,
        includeDetails: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to check wallet: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API wallet check result:', data);
    return { success: true, data };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during wallet check' 
    };
  }
}

// Check multiple addresses in batch
export async function checkMultipleAddresses(
  addresses: Array<{ address: string; chainId: number }>
): Promise<Array<{
  address: string;
  chainId: number;
  success: boolean;
  riskLevel?: RiskLevel;
  riskScore?: number;
  error?: string;
}>> {
  if (!isInitialized()) {
    return addresses.map(({ address, chainId }) => ({
      address,
      chainId,
      success: false,
      error: 'CUBE3 service not initialized',
    }));
  }

  const results = await Promise.all(
    addresses.map(async ({ address, chainId }) => {
      try {
        const result = await checkWalletAddress(address, chainId);
        if (result.success && result.data) {
          const assessment = assessWalletRisk(result.data);
          return {
            address,
            chainId,
            success: true,
            riskLevel: assessment.riskLevel,
            riskScore: assessment.riskScore,
          };
        } else {
          return {
            address,
            chainId,
            success: false,
            error: result.error || 'Failed to check wallet',
          };
        }
      } catch (error) {
        return {
          address,
          chainId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return results;
}

// Verify transaction safety
export async function verifyTransaction(
  txData: string,
  chainId: number = 1, // Default to Ethereum mainnet
  options?: {
    simulate?: boolean;
    checkDestination?: boolean;
    contractSecurity?: boolean;
  }
): Promise<Cube3Response<TransactionVerification>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  if (!txData) {
    return { success: false, error: 'Transaction data is required' };
  }

  try {
    if (DEBUG_MODE) console.log(`Verifying transaction on chain ${chainId}`);

    const response = await fetch(`${API_URL}/validate/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        txData,
        chainId: chainId.toString(),
        simulate: options?.simulate !== false,
        checkDestination: options?.checkDestination !== false,
        contractSecurity: options?.contractSecurity !== false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to verify transaction: ${response.statusText}`
      };
    }

    // Process and format response into our TransactionVerification type
    const verificationResult: TransactionVerification = {
      safe: data.safe || false,
      riskLevel: mapRiskLevel(data.riskLevel || data.risk?.level),
      riskScore: data.riskScore || data.risk?.score || 0,
      details: {
        contractSecurity: data.contractSecurity || {},
        destinationAnalysis: data.destinationAnalysis || {},
        simulationResults: data.simulation || {},
      },
      rawData: data,
    };

    if (DEBUG_MODE) console.log('CUBE3 API transaction verification result:', verificationResult);
    return { success: true, data: verificationResult };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during transaction verification' 
    };
  }
}

// Process API response into standardized risk assessment
export function assessWalletRisk(apiResponse: any): WalletRiskAssessment {
  if (!apiResponse) {
    return {
      riskLevel: 'unknown',
      riskScore: 0,
      riskDetails: {},
    };
  }

  // Extract risk level and score from different possible API response formats
  const riskLevel = mapRiskLevel(apiResponse.riskLevel || apiResponse.risk?.level);
  const riskScore = apiResponse.riskScore || apiResponse.risk?.score || 0;

  // Extract risk details from API response
  const riskDetails: WalletRiskAssessment['riskDetails'] = {};
  const flags = apiResponse.flags || apiResponse.riskFlags || {};
  
  if (flags.suspiciousActivity) riskDetails.suspiciousActivity = true;
  if (flags.darkWeb) riskDetails.darkWebExposure = true;
  if (flags.sanctioned) riskDetails.sanctioned = true;
  if (flags.fraudReports) riskDetails.fraudReports = true;
  if (flags.phishing) riskDetails.phishingAssociation = true;
  if (flags.moneyLaundering) riskDetails.moneyLaundering = true;
  if (flags.terrorism) riskDetails.terrorismFinancing = true;
  if (flags.mixer) riskDetails.mixerUsage = true;
  if (flags.gambling) riskDetails.gambling = true;
  if (flags.malware) riskDetails.malwareAssociation = true;
  if (flags.scam) riskDetails.scamAssociation = true;
  if (flags.highRiskExchange) riskDetails.highRiskExchangeUsage = true;

  // Extract associated addresses if available
  const associatedAddresses = apiResponse.associatedAddresses?.map((addr: any) => ({
    address: addr.address,
    chainId: addr.chainId || 1,
    riskLevel: mapRiskLevel(addr.riskLevel || addr.risk?.level),
    relationship: addr.relationship || 'associated',
  })) || [];

  return {
    riskLevel,
    riskScore,
    riskDetails,
    associatedAddresses,
    rawData: apiResponse,
  };
}

// Map risk level from API to our standardized format
function mapRiskLevel(level: string | undefined): RiskLevel {
  if (!level) return 'unknown';
  
  const normalized = level.toLowerCase();
  
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('medium') || normalized.includes('moderate')) return 'medium';
  if (normalized.includes('low')) return 'low';
  
  return 'unknown';
}

// Check if a wallet address is safe to interact with
export function isWalletSafe(assessment: WalletRiskAssessment): boolean {
  // If any severe risk flags are present, consider unsafe
  if (
    assessment.riskDetails.sanctioned ||
    assessment.riskDetails.scamAssociation ||
    assessment.riskDetails.malwareAssociation ||
    assessment.riskDetails.terrorismFinancing ||
    assessment.riskDetails.moneyLaundering
  ) {
    return false;
  }
  
  // Otherwise, base it on risk level
  return assessment.riskLevel === 'low' || assessment.riskLevel === 'unknown';
}

// Get a color based on risk level
export function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'high':
      return 'text-red-500';
    case 'medium':
      return 'text-amber-500';
    case 'low':
      return 'text-green-500';
    case 'unknown':
    default:
      return 'text-slate-400';
  }
}

// Get a description based on risk level
export function getRiskDescription(assessment: WalletRiskAssessment): string {
  const { riskLevel, riskDetails } = assessment;
  
  // Severe risks get specific messaging
  if (riskDetails.sanctioned) {
    return 'This address is on a sanctions list. Avoid interaction.';
  }
  if (riskDetails.scamAssociation) {
    return 'This address is associated with scam activities. Proceed with extreme caution.';
  }
  if (riskDetails.malwareAssociation) {
    return 'This address is linked to malware or ransomware. Avoid interaction.';
  }
  
  // General risk level descriptions
  switch (riskLevel) {
    case 'high':
      return 'High risk. Avoid interacting with this address.';
    case 'medium':
      return 'Medium risk. Exercise caution when interacting with this address.';
    case 'low':
      return 'Low risk. This address appears to be safe based on available data.';
    case 'unknown':
    default:
      return 'Risk unknown. Limited data available for this address.';
  }
}

// Monitor an address for changes (check periodically)
export function monitorAddress(
  address: string,
  chainId: number,
  callback: (assessment: WalletRiskAssessment) => void,
  interval: number = 3600000 // Default to hourly checks
): { stop: () => void } {
  let running = true;
  
  const check = async () => {
    if (!running) return;
    
    try {
      const result = await checkWalletAddress(address, chainId);
      if (result.success && result.data) {
        const assessment = assessWalletRisk(result.data);
        callback(assessment);
      }
    } catch (error) {
      console.error('Error monitoring address:', error);
    }
    
    if (running) {
      setTimeout(check, interval);
    }
  };
  
  // Start the first check
  check();
  
  // Return control object
  return {
    stop: () => {
      running = false;
    }
  };
}

// Validate a transaction before sending (combination of verification and UI)
export async function validateTransactionForUser(
  txData: string,
  chainId: number = 1
): Promise<boolean> {
  try {
    const result = await verifyTransaction(txData, chainId);
    
    if (!result.success) {
      toast({
        title: "Transaction check failed",
        description: result.error || "Unable to verify transaction safety. Proceed with caution.",
        variant: "destructive",
      });
      return false;
    }
    
    const verification = result.data;
    
    if (!verification.safe) {
      // Show detailed warning based on verification details
      let warningMessage = "This transaction may be unsafe.";
      
      if (verification.details.contractSecurity?.rugPullRisk) {
        warningMessage += " The contract has potential rug pull indicators.";
      }
      
      if (verification.details.destinationAnalysis?.flagged) {
        warningMessage += " The destination address has been flagged for suspicious activity.";
      }
      
      if (verification.details.simulationResults?.warnings?.length) {
        warningMessage += ` Simulation warnings: ${verification.details.simulationResults.warnings.join(', ')}`;
      }
      
      // Show toast with warning
      toast({
        title: `${verification.riskLevel.toUpperCase()} RISK DETECTED`,
        description: warningMessage,
        variant: "destructive",
      });
      
      // Could return false to block transaction or true to allow with warning
      return false;
    }
    
    // Transaction is safe
    toast({
      title: "Transaction verified",
      description: "This transaction appears to be safe.",
      variant: "default",
    });
    
    return true;
  } catch (error) {
    console.error('Transaction validation error:', error);
    toast({
      title: "Transaction verification error",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    return false;
  }
}

// Cache for risk assessments
const riskCache: Map<string, { assessment: WalletRiskAssessment; timestamp: number }> = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Check wallet with caching
export async function checkWalletAddressWithCache(
  address: string,
  chainId: number = 1
): Promise<Cube3Response<WalletRiskAssessment>> {
  const cacheKey = `${address.toLowerCase()}-${chainId}`;
  const cachedResult = riskCache.get(cacheKey);
  
  // Return cached result if valid
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
    if (DEBUG_MODE) console.log(`Using cached risk assessment for ${address}`);
    return { success: true, data: cachedResult.assessment };
  }
  
  // Otherwise perform new check
  const result = await checkWalletAddress(address, chainId);
  
  if (result.success && result.data) {
    const assessment = assessWalletRisk(result.data);
    
    // Cache the result
    riskCache.set(cacheKey, {
      assessment,
      timestamp: Date.now()
    });
    
    return { success: true, data: assessment };
  }
  
  return { success: false, error: result.error };
}

// Clear cache
export function clearRiskCache(): void {
  riskCache.clear();
  if (DEBUG_MODE) console.log('Risk assessment cache cleared');
}

// Control Lists API
export async function getControlLists(): Promise<Cube3Response<ControlList[]>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log('Fetching control lists');

    const response = await fetch(`${API_URL}/management/control-lists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to fetch control lists: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API control lists result:', data);
    return { success: true, data: data.lists || [] };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error fetching control lists' 
    };
  }
}

export async function createControlList(
  name: string,
  type: ControlListType,
  description?: string
): Promise<Cube3Response<ControlList>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log(`Creating control list: ${name} (${type})`);

    const response = await fetch(`${API_URL}/management/control-lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        name,
        type,
        description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to create control list: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API create control list result:', data);
    return { success: true, data: data.list };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error creating control list' 
    };
  }
}

export async function addAddressToControlList(
  listId: string,
  address: string,
  chainId: number,
  reason?: string,
  expiration?: string
): Promise<Cube3Response<ControlListEntry>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log(`Adding address ${address} to control list ${listId}`);

    const response = await fetch(`${API_URL}/management/control-lists/${listId}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        address,
        chainId: chainId.toString(),
        reason,
        expiration,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to add address to control list: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API add address result:', data);
    return { success: true, data: data.entry };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error adding address to control list' 
    };
  }
}

export async function removeAddressFromControlList(
  listId: string,
  entryId: string
): Promise<Cube3Response<boolean>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log(`Removing entry ${entryId} from control list ${listId}`);

    const response = await fetch(`${API_URL}/management/control-lists/${listId}/entries/${entryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to remove address from control list: ${response.statusText}`
      };
    }

    return { success: true, data: true };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error removing address from control list' 
    };
  }
}

// Monitor API - For setting up continuous monitoring
export type MonitorConfig = {
  monitorId: string;
  name: string;
  description?: string;
  addresses: {
    address: string;
    chainId: number;
    label?: string;
  }[];
  alertEndpoints?: string[];
  createdAt: string;
  updatedAt: string;
};

export async function createMonitor(
  name: string,
  addresses: Array<{ address: string; chainId: number; label?: string }>,
  alertEndpoints?: string[],
  description?: string
): Promise<Cube3Response<MonitorConfig>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log(`Creating monitor: ${name} with ${addresses.length} addresses`);

    const response = await fetch(`${API_URL}/management/monitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        name,
        description,
        addresses,
        alertEndpoints,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to create monitor: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API create monitor result:', data);
    return { success: true, data: data.monitor };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error creating monitor' 
    };
  }
}

export async function getMonitors(): Promise<Cube3Response<MonitorConfig[]>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log('Fetching monitors');

    const response = await fetch(`${API_URL}/management/monitors`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to fetch monitors: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API monitors result:', data);
    return { success: true, data: data.monitors || [] };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error fetching monitors' 
    };
  }
}

export async function addAddressesToMonitor(
  monitorId: string,
  addresses: Array<{ address: string; chainId: number; label?: string }>
): Promise<Cube3Response<MonitorConfig>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log(`Adding ${addresses.length} addresses to monitor ${monitorId}`);

    const response = await fetch(`${API_URL}/management/monitors/${monitorId}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ addresses }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to add addresses to monitor: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API add addresses result:', data);
    return { success: true, data: data.monitor };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error adding addresses to monitor' 
    };
  }
}

// Inspector API - Smart Contract Risk Analysis
export async function inspectContract(
  address: string,
  chainId: number = 1
): Promise<Cube3Response<any>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log(`Inspecting contract ${address} on chain ${chainId}`);

    const response = await fetch(`${API_URL}/inspect/contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        address,
        chainId: chainId.toString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to inspect contract: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API contract inspection result:', data);
    return { success: true, data };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during contract inspection' 
    };
  }
}

// Enhanced Transaction Validation - Simulates the transaction and checks for potential issues
export async function simulateTransaction(
  txData: string,
  chainId: number = 1
): Promise<Cube3Response<any>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log(`Simulating transaction on chain ${chainId}`);

    const response = await fetch(`${API_URL}/validate/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        txData,
        chainId: chainId.toString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to simulate transaction: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API transaction simulation result:', data);
    return { success: true, data };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during transaction simulation' 
    };
  }
}

// Get a list of supported blockchain networks
export async function getSupportedNetworks(): Promise<Cube3Response<Array<{ chainId: number; name: string; }>>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log('Fetching supported networks');

    const response = await fetch(`${API_URL}/networks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to fetch supported networks: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API supported networks result:', data);
    return { success: true, data: data.networks || [] };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error fetching supported networks' 
    };
  }
}

// Enhanced risk analysis for deep wallet inspection
export async function analyzeWalletRiskDetailed(
  address: string,
  chainId: number = 1,
  options?: {
    includeTransactionHistory?: boolean;
    includeTokenBalances?: boolean;
    lookbackDays?: number;
  }
): Promise<Cube3Response<any>> {
  if (!isInitialized()) {
    return { success: false, error: 'CUBE3 service not initialized' };
  }

  try {
    if (DEBUG_MODE) console.log(`Performing detailed wallet analysis for ${address} on chain ${chainId}`);

    const response = await fetch(`${API_URL}/analyze/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        address,
        chainId: chainId.toString(),
        includeTransactionHistory: options?.includeTransactionHistory,
        includeTokenBalances: options?.includeTokenBalances,
        lookbackDays: options?.lookbackDays,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (DEBUG_MODE) console.error('CUBE3 API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `Failed to analyze wallet: ${response.statusText}`
      };
    }

    if (DEBUG_MODE) console.log('CUBE3 API detailed wallet analysis result:', data);
    return { success: true, data };
  } catch (error) {
    if (DEBUG_MODE) console.error('CUBE3 API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during detailed wallet analysis' 
    };
  }
} 