import { supabase } from '@/infrastructure/database/client';
import type {
  GuardianApiTest,
  GuardianWallet,
  GuardianOperation,
  GuardianApiTestInsert,
  GuardianWalletInsert,
  GuardianOperationInsert,
  GuardianApiTestUpdate,
  GuardianWalletUpdate,
  GuardianOperationUpdate,
  GuardianTestResult,
  GuardianWalletCreationFlow
} from '@/types/guardian/guardianTesting';

export class GuardianTestDatabaseService {
  
  // =============================================
  // API Test Records
  // =============================================
  
  /**
   * Record a Guardian API test result
   */
  static async recordApiTest(test: GuardianApiTestInsert): Promise<GuardianApiTest> {
    // Validate required fields before inserting
    if (!test.test_name) {
      throw new Error('test_name is required for API test record');
    }
    if (!test.test_type) {
      throw new Error('test_type is required for API test record');
    }
    if (!test.endpoint) {
      throw new Error('endpoint is required for API test record');
    }
    if (!test.http_method) {
      throw new Error('http_method is required for API test record');
    }
    if (test.success === null || test.success === undefined) {
      throw new Error('success field is required for API test record');
    }

    const { data, error } = await supabase
      .from('guardian_api_tests')
      .insert(test)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to record API test: ${error.message}`);
    return data as GuardianApiTest;
  }

  /**
   * Get recent API test results
   */
  static async getApiTests(limit: number = 20): Promise<GuardianApiTest[]> {
    const { data, error } = await supabase
      .from('guardian_api_tests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to get API tests: ${error.message}`);
    return (data || []) as GuardianApiTest[];
  }

  /**
   * Get API tests by type
   */
  static async getApiTestsByType(testType: GuardianApiTest['test_type'], limit: number = 10): Promise<GuardianApiTest[]> {
    const { data, error } = await supabase
      .from('guardian_api_tests')
      .select('*')
      .eq('test_type', testType)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to get API tests by type: ${error.message}`);
    return (data || []) as GuardianApiTest[];
  }

  /**
   * Get API tests for a specific Guardian wallet ID
   */
  static async getApiTestsForWallet(guardianWalletId: string): Promise<GuardianApiTest[]> {
    const { data, error } = await supabase
      .from('guardian_api_tests')
      .select('*')
      .eq('guardian_wallet_id', guardianWalletId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to get API tests for wallet: ${error.message}`);
    return (data || []) as GuardianApiTest[];
  }

  // =============================================
  // Guardian Wallets
  // =============================================

  /**
   * Record a Guardian wallet
   */
  static async recordGuardianWallet(wallet: GuardianWalletInsert): Promise<GuardianWallet> {
    const { data, error } = await supabase
      .from('guardian_wallets')
      .insert(wallet)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to record Guardian wallet: ${error.message}`);
    return data as GuardianWallet;
  }

  /**
   * Update Guardian wallet
   */
  static async updateGuardianWallet(guardianWalletId: string, updates: GuardianWalletUpdate): Promise<GuardianWallet> {
    const { data, error } = await supabase
      .from('guardian_wallets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('guardian_wallet_id', guardianWalletId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update Guardian wallet: ${error.message}`);
    return data as GuardianWallet;
  }

  /**
   * Get Guardian wallets
   */
  static async getGuardianWallets(limit: number = 20): Promise<GuardianWallet[]> {
    const { data, error } = await supabase
      .from('guardian_wallets')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to get Guardian wallets: ${error.message}`);
    return (data || []) as GuardianWallet[];
  }

  /**
   * Get Guardian wallet by ID
   */
  static async getGuardianWallet(guardianWalletId: string): Promise<GuardianWallet | null> {
    const { data, error } = await supabase
      .from('guardian_wallets')
      .select('*')
      .eq('guardian_wallet_id', guardianWalletId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get Guardian wallet: ${error.message}`);
    }
    return data as GuardianWallet | null;
  }

  // =============================================
  // Guardian Operations
  // =============================================

  /**
   * Record a Guardian operation
   */
  static async recordGuardianOperation(operation: GuardianOperationInsert): Promise<GuardianOperation> {
    // Validate required fields before inserting
    if (!operation.operation_id) {
      throw new Error('operation_id is required for Guardian operation record');
    }
    if (!operation.operation_type) {
      throw new Error('operation_type is required for Guardian operation record');
    }

    const { data, error } = await supabase
      .from('guardian_operations')
      .insert(operation)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to record Guardian operation: ${error.message}`);
    return data as GuardianOperation;
  }

  /**
   * Update Guardian operation
   */
  static async updateGuardianOperation(operationId: string, updates: GuardianOperationUpdate): Promise<GuardianOperation> {
    const updateData = {
      ...updates,
      last_checked_at: new Date().toISOString()
    };

    // Increment check count if not provided
    if (updates.check_count === undefined) {
      const { data: current } = await supabase
        .from('guardian_operations')
        .select('check_count')
        .eq('operation_id', operationId)
        .single();
      
      updateData.check_count = (current?.check_count || 0) + 1;
    }

    const { data, error } = await supabase
      .from('guardian_operations')
      .update(updateData)
      .eq('operation_id', operationId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update Guardian operation: ${error.message}`);
    return data as GuardianOperation;
  }

  /**
   * Get Guardian operations
   */
  static async getGuardianOperations(limit: number = 20): Promise<GuardianOperation[]> {
    const { data, error } = await supabase
      .from('guardian_operations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to get Guardian operations: ${error.message}`);
    return (data || []) as GuardianOperation[];
  }

  /**
   * Get Guardian operation by ID
   */
  static async getGuardianOperation(operationId: string): Promise<GuardianOperation | null> {
    const { data, error } = await supabase
      .from('guardian_operations')
      .select('*')
      .eq('operation_id', operationId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get Guardian operation: ${error.message}`);
    }
    return data as GuardianOperation | null;
  }

  // =============================================
  // Complete Flow Tracking
  // =============================================

  /**
   * Record a complete Guardian wallet creation flow
   */
  static async recordCompleteFlow(
    walletId: string,
    creationResponse: any,
    operationResponse?: any,
    walletDetailsResponse?: any
  ): Promise<GuardianWalletCreationFlow> {
    const startTime = Date.now();
    
    try {
      // 1. Record wallet creation test
      const creationTest = await this.recordApiTest({
        test_name: `Complete Flow - Create Wallet ${walletId.substring(0, 8)}`,
        test_type: 'create_wallet',
        endpoint: '/api/v1/wallets/create',
        http_method: 'POST',
        request_payload: { id: walletId },
        response_status: 200,
        response_payload: creationResponse,
        guardian_wallet_id: walletId,
        guardian_operation_id: creationResponse.operationId,
        success: true,
        execution_time_ms: Date.now() - startTime,
        created_by: 'guardian_test_page'
      });

      // 2. Record wallet in guardian_wallets table
      const walletRecord = await this.recordGuardianWallet({
        guardian_wallet_id: walletId,
        guardian_operation_id: creationResponse.operationId,
        wallet_name: `Test Wallet ${walletId.substring(0, 8)}`,
        wallet_status: 'pending',
        creation_request_id: creationTest.id,
        created_by: 'guardian_test_page'
      });

      // 3. Record operation in guardian_operations table
      const operationRecord = await this.recordGuardianOperation({
        operation_id: creationResponse.operationId,
        operation_type: 'wallet_creation',
        operation_status: 'pending',
        guardian_wallet_id: walletId,
        related_test_id: creationTest.id
      });

      let operationTest: GuardianApiTest | undefined;
      let walletDetailsTest: GuardianApiTest | undefined;

      // 4. If operation response provided, record it
      if (operationResponse) {
        operationTest = await this.recordApiTest({
          test_name: `Complete Flow - Check Operation ${creationResponse.operationId.substring(0, 8)}`,
          test_type: 'get_operation',
          endpoint: `/api/v1/operations/${creationResponse.operationId}`,
          http_method: 'GET',
          response_status: 200,
          response_payload: operationResponse,
          guardian_wallet_id: walletId,
          guardian_operation_id: creationResponse.operationId,
          success: true,
          execution_time_ms: Date.now() - startTime,
          created_by: 'guardian_test_page'
        });

        // Update operation record
        await this.updateGuardianOperation(creationResponse.operationId, {
          operation_status: operationResponse.status,
          operation_result: operationResponse
        });

        // Update wallet record
        await this.updateGuardianWallet(walletId, {
          wallet_status: operationResponse.status,
          operation_check_request_id: operationTest.id,
          operation_completed_at: operationResponse.status === 'completed' ? new Date().toISOString() : undefined
        });
      }

      // 5. If wallet details response provided, record it
      if (walletDetailsResponse) {
        walletDetailsTest = await this.recordApiTest({
          test_name: `Complete Flow - Get Wallet Details ${walletId.substring(0, 8)}`,
          test_type: 'get_wallet',
          endpoint: `/api/v1/wallets/${walletDetailsResponse.id || walletId}`,
          http_method: 'GET',
          response_status: 200,
          response_payload: walletDetailsResponse,
          guardian_wallet_id: walletId,
          guardian_operation_id: creationResponse.operationId,
          guardian_wallet_address: walletDetailsResponse.accounts?.[0]?.address,
          success: true,
          execution_time_ms: Date.now() - startTime,
          created_by: 'guardian_test_page'
        });

        // Update wallet record with details
        await this.updateGuardianWallet(walletId, {
          guardian_internal_id: walletDetailsResponse.id,
          wallet_addresses: walletDetailsResponse.accounts,
          wallet_metadata: walletDetailsResponse,
          wallet_details_request_id: walletDetailsTest.id,
          wallet_retrieved_at: new Date().toISOString()
        });
      }

      return {
        wallet_id: walletId,
        creation_test: creationTest,
        operation_test: operationTest,
        wallet_details_test: walletDetailsTest,
        wallet_record: walletRecord,
        operation_record: operationRecord,
        complete: !!(operationResponse && walletDetailsResponse)
      };

    } catch (error) {
      throw new Error(`Failed to record complete flow: ${error.message}`);
    }
  }

  // =============================================
  // Analytics & Reporting
  // =============================================

  /**
   * Get test statistics
   */
  static async getTestStats(): Promise<{
    total_tests: number;
    successful_tests: number;
    failed_tests: number;
    total_wallets: number;
    active_wallets: number;
    pending_operations: number;
  }> {
    const [testsResult, walletsResult, operationsResult] = await Promise.all([
      supabase.from('guardian_api_tests').select('success'),
      supabase.from('guardian_wallets').select('wallet_status'),
      supabase.from('guardian_operations').select('operation_status')
    ]);

    const tests = testsResult.data || [];
    const wallets = walletsResult.data || [];
    const operations = operationsResult.data || [];

    return {
      total_tests: tests.length,
      successful_tests: tests.filter(t => t.success).length,
      failed_tests: tests.filter(t => !t.success).length,
      total_wallets: wallets.length,
      active_wallets: wallets.filter(w => w.wallet_status === 'active').length,
      pending_operations: operations.filter(o => ['pending', 'processing'].includes(o.operation_status)).length
    };
  }

  /**
   * Check if database is writable
   */
  static async isDatabaseWritable(): Promise<boolean> {
    try {
      const testRecord = {
        test_name: 'Database Write Test',
        test_type: 'create_wallet' as const,
        endpoint: '/test',
        http_method: 'POST' as const,
        success: true,
        created_by: 'write_test'
      };

      const { data, error } = await supabase
        .from('guardian_api_tests')
        .insert(testRecord)
        .select()
        .single();

      if (error) {
        console.warn('Database write test failed:', error.message);
        return false;
      }

      // Clean up test record
      if (data) {
        await supabase.from('guardian_api_tests').delete().eq('id', data.id);
      }

      return true;
    } catch (error) {
      console.warn('Database write test error:', error);
      return false;
    }
  }

  // =============================================
  // Backward Compatibility Aliases
  // =============================================

  /**
   * Alias for recordApiTest - backward compatibility
   */
  static async recordTestResult(testData: {
    operation: string;
    endpoint: string;
    method: string;
    requestData: any;
    responseData: any;
    status: string;
    timestamp: string;
    executionTime: number;
    walletId?: string;
    operationId?: string;
    flowType?: string;
    errorMessage?: string;
  }): Promise<string> {
    const apiTest = await this.recordApiTest({
      test_name: testData.operation,
      test_type: testData.flowType || 'single_operation' as any,
      endpoint: testData.endpoint,
      http_method: testData.method as any,
      request_payload: testData.requestData,
      response_status: testData.status === 'success' ? 200 : 500,
      response_payload: testData.responseData,
      guardian_wallet_id: testData.walletId,
      guardian_operation_id: testData.operationId,
      success: testData.status === 'success',
      execution_time_ms: testData.executionTime,
      error_message: testData.errorMessage,
      created_by: 'guardian_test_page'
    });
    return apiTest.id;
  }

  /**
   * Alias for getApiTests - backward compatibility
   */
  static async getTestResults(limit: number = 20): Promise<any[]> {
    return this.getApiTests(limit);
  }

  /**
   * Alias for recordGuardianWallet - backward compatibility
   */
  static async recordWalletData(walletData: {
    guardianWalletId: string;
    externalId?: string;
    name: string;
    status: string;
    accounts: any[];
    createdAt: string;
    operationId?: string;
  }): Promise<string> {
    const wallet = await this.recordGuardianWallet({
      guardian_wallet_id: walletData.guardianWalletId,
      guardian_operation_id: walletData.operationId,
      wallet_name: walletData.name,
      wallet_status: walletData.status as 'pending' | 'failed' | 'active' | 'processing',
      wallet_addresses: walletData.accounts,
      created_by: 'guardian_test_page'
    });
    return wallet.id;
  }

  /**
   * Updated recordCompleteFlow method for backward compatibility
   */
  static async recordCompleteFlowLegacy(flowData: {
    walletCreation: { operationId: string };
    operationTracking: any;
    walletDetails: any;
    flowType: string;
    startTime: string;
    endTime: string;
  }): Promise<string> {
    const walletId = crypto.randomUUID();
    const result = await this.recordCompleteFlow(
      walletId,
      { operationId: flowData.walletCreation.operationId },
      flowData.operationTracking,
      flowData.walletDetails
    );
    return result.wallet_id;
  }
}
