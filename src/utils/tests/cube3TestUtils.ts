import { 
  RiskLevel, 
  WalletRiskAssessment, 
  TransactionVerification,
  checkWalletAddress,
  verifyTransaction,
  inspectContract
} from '@/services/integrations/cube3Service';

// Sample test addresses with known risk profiles
export const testAddresses = {
  lowRisk: {
    address: '0x388c818ca8b9251b393131c08a736a67ccb19297', // Example: Binance hot wallet
    chainId: 1,
    description: 'Low risk exchange wallet'
  },
  mediumRisk: {
    address: '0x5a3ca5cd63807ce5e4d7841ab32ce6b6d9bbba2d', // Example
    chainId: 1,
    description: 'Medium risk wallet with mixer usage history'
  },
  highRisk: {
    address: '0x9a88eaa782891e628c3029a17575ee76d5a08f73', // Example: Phishing
    chainId: 1,
    description: 'High risk wallet with phishing association'
  },
  sanctioned: {
    address: '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c', // Example: Sanctioned
    chainId: 1,
    description: 'OFAC sanctioned wallet'
  }
};

// Sample test contracts with known security profiles
export const testContracts = {
  verified: {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    chainId: 1,
    description: 'Verified and audited stablecoin contract'
  },
  unverified: {
    address: '0x124c3c8fE71E3936bD650590E35B4585d5b5F52c', // Example
    chainId: 1,
    description: 'Unverified contract'
  },
  rugPullRisk: {
    address: '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b', // Example
    chainId: 1,
    description: 'Contract with potential rug pull mechanics'
  }
};

// Sample transaction data for testing
export const sampleTransactions = {
  safe: {
    data: '0xa9059cbb0000000000000000000000008576acc5c05d6ce88f4e49bf65bdf0c62f91353c00000000000000000000000000000000000000000000003635c9adc5dea00000', // Example ERC20 transfer
    description: 'Standard ERC20 token transfer'
  },
  risky: {
    data: '0x38ed1739000000000000000000000000000000000000000000000a968163f0a57b400000000000000000000000000000000000000000000000000046c3803997f6200000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000008576acc5c05d6ce88f4e49bf65bdf0c62f91353c000000000000000000000000000000000000000000000000000000006460d8f700000000000000000000000000000000000000000000000000000000000000020000000000000000000000007ceb23fd6bc0add59e62ac25578270cff1b9f61900000000000000000000000000000000000000000000000000000000000000', // Example swap to suspicious token
    description: 'Swap with suspicious token'
  }
};

// Generate sample mock risk assessment (for testing without API calls)
export function generateMockRiskAssessment(risk: RiskLevel): WalletRiskAssessment {
  const base: WalletRiskAssessment = {
    riskLevel: risk,
    riskScore: risk === 'low' ? 15 : risk === 'medium' ? 50 : 85,
    riskDetails: {},
  };
  
  // Add risk flags based on risk level
  if (risk === 'medium' || risk === 'high') {
    base.riskDetails.mixerUsage = true;
  }
  
  if (risk === 'high') {
    base.riskDetails.phishingAssociation = true;
    base.riskDetails.suspiciousActivity = true;
  }
  
  // Add some associated addresses
  base.associatedAddresses = [
    {
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      chainId: 1,
      riskLevel: risk,
      relationship: 'transfer_recipient'
    },
    {
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      chainId: 1,
      riskLevel: risk === 'high' ? 'high' : 'medium',
      relationship: 'transfer_sender'
    }
  ];
  
  return base;
}

// Generate mock transaction verification (for testing without API calls)
export function generateMockTransactionVerification(safe: boolean): TransactionVerification {
  return {
    safe,
    riskLevel: safe ? 'low' : 'high',
    riskScore: safe ? 10 : 90,
    details: {
      contractSecurity: {
        verified: safe,
        audited: safe,
        openSource: true,
        rugPullRisk: !safe
      },
      destinationAnalysis: {
        riskLevel: safe ? 'low' : 'high',
        riskScore: safe ? 5 : 85,
        flagged: !safe
      },
      simulationResults: {
        successful: true,
        gasEstimate: 150000,
        warnings: safe ? [] : ['Suspicious token transfer detected']
      }
    }
  };
}

// Check if API key is available and run a test call
export async function testCube3Connection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const testAddress = testAddresses.lowRisk.address;
    const response = await checkWalletAddress(testAddress, 1);
    
    if (response.success) {
      return {
        success: true,
        message: `CUBE3 connection successful. Wallet ${testAddress} has risk level: ${response.data.riskLevel || 'unknown'}`
      };
    } else {
      return {
        success: false,
        message: `CUBE3 connection failed: ${response.error}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `CUBE3 connection error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Run multiple test calls to validate full functionality
export async function runCube3TestSuite(): Promise<{
  success: boolean;
  results: {
    connection: boolean;
    walletCheck: boolean;
    contractCheck: boolean;
    transactionCheck: boolean;
  };
  details: string[];
}> {
  const results = {
    connection: false,
    walletCheck: false,
    contractCheck: false,
    transactionCheck: false
  };
  const details: string[] = [];
  
  try {
    // Test connection
    const connectionTest = await testCube3Connection();
    results.connection = connectionTest.success;
    details.push(`Connection test: ${connectionTest.message}`);
    
    // Test wallet check
    try {
      const walletTest = await checkWalletAddress(testAddresses.mediumRisk.address, 1);
      results.walletCheck = walletTest.success;
      details.push(`Wallet check: ${walletTest.success ? 'Success' : walletTest.error}`);
    } catch (error) {
      details.push(`Wallet check error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test contract check
    try {
      const contractTest = await inspectContract(testContracts.verified.address, 1);
      results.contractCheck = contractTest.success;
      details.push(`Contract check: ${contractTest.success ? 'Success' : contractTest.error}`);
    } catch (error) {
      details.push(`Contract check error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test transaction validation
    try {
      const txTest = await verifyTransaction(sampleTransactions.safe.data, 1);
      results.transactionCheck = txTest.success;
      details.push(`Transaction check: ${txTest.success ? 'Success' : txTest.error}`);
    } catch (error) {
      details.push(`Transaction check error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return {
      success: Object.values(results).every(Boolean),
      results,
      details
    };
  } catch (error) {
    return {
      success: false,
      results,
      details: [...details, `Test suite error: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
} 