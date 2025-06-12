import { GuardianApiClient } from './GuardianApiClient';

export interface PollingOptions {
  maxAttempts?: number;
  intervalMs?: number;
  timeoutMs?: number;
}

export interface OperationResult {
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'error';
  result?: any;
  error?: string;
  attempts: number;
  totalTime: number;
}

/**
 * Service for polling Guardian operation status until completion
 * Handles the asynchronous nature of Guardian wallet creation
 */
export class GuardianPollingService {
  private apiClient: GuardianApiClient;

  constructor() {
    this.apiClient = new GuardianApiClient();
  }

  /**
   * Poll operation status until completion or timeout
   * 
   * @param operationId - The Guardian operation ID to poll
   * @param options - Polling configuration options
   * @returns Promise that resolves when operation completes or times out
   */
  async pollOperationStatus(
    operationId: string, 
    options: PollingOptions = {}
  ): Promise<OperationResult> {
    const {
      maxAttempts = 20,      // Max 20 attempts
      intervalMs = 3000,     // Check every 3 seconds  
      timeoutMs = 60000      // 60 second total timeout
    } = options;

    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Check if we've exceeded timeout
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > timeoutMs) {
          return {
            status: 'error',
            error: `Timeout after ${elapsedTime}ms (${attempts} attempts)`,
            attempts,
            totalTime: elapsedTime
          };
        }

        console.log(`🔍 Polling attempt ${attempts}: Checking operation ${operationId.substring(0, 8)}...`);
        
        // Get operation status
        const operation = await this.apiClient.getOperation(operationId);
        const totalTime = Date.now() - startTime;

        console.log(`   📊 Status: ${operation.status}, Time: ${totalTime}ms`);

        // Check if operation is complete
        if (operation.status === 'processed') {
          console.log(`   ✅ Operation completed successfully!`);
          return {
            status: 'processed',
            result: operation.result,
            attempts,
            totalTime
          };
        }

        // Check if operation failed
        if (operation.status === 'failed' || operation.status === 'error') {
          console.log(`   ❌ Operation failed with status: ${operation.status}`);
          return {
            status: operation.status,
            error: operation.error || 'Operation failed',
            attempts,
            totalTime
          };
        }

        // Operation still in progress, wait before next attempt
        if (attempts < maxAttempts) {
          console.log(`   ⏳ Still ${operation.status}, waiting ${intervalMs}ms...`);
          await this.delay(intervalMs);
        }

      } catch (error) {
        const totalTime = Date.now() - startTime;
        console.log(`   ❌ Polling error: ${error.message}`);
        
        // If it's the last attempt, return the error
        if (attempts >= maxAttempts) {
          return {
            status: 'error',
            error: `Polling failed: ${error.message}`,
            attempts,
            totalTime
          };
        }
        
        // Otherwise, wait and try again
        await this.delay(intervalMs);
      }
    }

    // Max attempts reached
    const totalTime = Date.now() - startTime;
    return {
      status: 'error',
      error: `Max attempts (${maxAttempts}) reached without completion`,
      attempts,
      totalTime
    };
  }

  /**
   * Poll operation with progress callback
   */
  async pollOperationWithProgress(
    operationId: string,
    progressCallback: (attempt: number, status: string, elapsed: number) => void,
    options: PollingOptions = {}
  ): Promise<OperationResult> {
    const {
      maxAttempts = 20,
      intervalMs = 3000,
      timeoutMs = 60000
    } = options;

    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime > timeoutMs) {
        progressCallback(attempts, 'timeout', elapsedTime);
        return {
          status: 'error',
          error: `Timeout after ${elapsedTime}ms`,
          attempts,
          totalTime: elapsedTime
        };
      }

      try {
        const operation = await this.apiClient.getOperation(operationId);
        const totalTime = Date.now() - startTime;
        
        progressCallback(attempts, operation.status, totalTime);

        if (operation.status === 'processed') {
          return {
            status: 'processed',
            result: operation.result,
            attempts,
            totalTime
          };
        }

        if (operation.status === 'failed' || operation.status === 'error') {
          return {
            status: operation.status,
            error: operation.error || 'Operation failed',
            attempts,
            totalTime
          };
        }

        if (attempts < maxAttempts) {
          await this.delay(intervalMs);
        }

      } catch (error) {
        const totalTime = Date.now() - startTime;
        progressCallback(attempts, 'error', totalTime);
        
        if (attempts >= maxAttempts) {
          return {
            status: 'error',
            error: `Polling failed: ${error.message}`,
            attempts,
            totalTime
          };
        }
        
        await this.delay(intervalMs);
      }
    }

    const totalTime = Date.now() - startTime;
    return {
      status: 'error',
      error: `Max attempts reached`,
      attempts,
      totalTime
    };
  }

  /**
   * Convenience method: Create wallet and poll until completion
   */
  async createWalletAndWait(
    walletId?: string,
    options: PollingOptions = {}
  ): Promise<{ 
    walletId: string; 
    operationId: string; 
    operationResult: OperationResult; 
    walletDetails?: any 
  }> {
    // Generate wallet ID if not provided
    const finalWalletId = walletId || crypto.randomUUID();
    
    console.log(`🚀 Creating wallet ${finalWalletId.substring(0, 8)}...`);
    
    // Create wallet
    const createResult = await this.apiClient.createWallet({ id: finalWalletId });
    console.log(`✅ Wallet creation initiated, operation ID: ${createResult.operationId.substring(0, 8)}`);
    
    // Poll until completion
    const operationResult = await this.pollOperationStatus(createResult.operationId, options);
    
    let walletDetails;
    if (operationResult.status === 'processed' && operationResult.result?.id) {
      try {
        console.log(`🔍 Getting wallet details for ${operationResult.result.id.substring(0, 8)}...`);
        walletDetails = await this.apiClient.getWallet(operationResult.result.id);
        console.log(`✅ Wallet details retrieved`);
      } catch (error) {
        console.log(`⚠️ Could not get wallet details: ${error.message}`);
      }
    }

    return {
      walletId: finalWalletId,
      operationId: createResult.operationId,
      operationResult,
      walletDetails
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default GuardianPollingService;
