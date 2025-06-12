// Guardian API Testing Types
// Generated for new Guardian test database tables

export interface GuardianApiTest {
  id: string;
  
  // Test identification
  test_name: string;
  test_type: 'create_wallet' | 'get_wallet' | 'get_operation' | 'list_wallets' | 'list_operations' | 'complete_flow';
  
  // API request details
  endpoint: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  request_payload?: any;
  request_headers?: any;
  
  // API response details
  response_status?: number;
  response_payload?: any;
  response_headers?: any;
  
  // Guardian-specific data
  guardian_wallet_id?: string;
  guardian_operation_id?: string;
  guardian_wallet_address?: string;
  
  // Execution details
  execution_time_ms?: number;
  success: boolean;
  error_message?: string;
  
  // Metadata
  created_at: string;
  created_by?: string;
  notes?: string;
}

export interface GuardianWallet {
  id: string;
  
  // Guardian identifiers
  guardian_wallet_id: string; // UUID we sent to Guardian
  guardian_operation_id?: string; // Operation ID from creation
  guardian_internal_id?: string; // Guardian's internal wallet ID
  
  // Wallet details from Guardian
  wallet_name?: string;
  wallet_status?: 'pending' | 'active' | 'failed' | 'processing';
  wallet_addresses?: Array<{
    type: string;
    address: string;
    network: string;
  }>;
  wallet_metadata?: any;
  
  // Creation tracking
  creation_request_id?: string;
  operation_check_request_id?: string;
  wallet_details_request_id?: string;
  
  // Timeline
  requested_at: string;
  operation_completed_at?: string;
  wallet_retrieved_at?: string;
  
  // Our metadata
  test_notes?: string;
  created_by?: string;
  updated_at: string;
}

export interface GuardianOperation {
  id: string;
  
  // Operation details
  operation_id: string;
  operation_type: 'wallet_creation' | string;
  operation_status?: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Related entities
  guardian_wallet_id?: string;
  related_test_id?: string;
  
  // Guardian response data
  operation_result?: any;
  operation_error?: any;
  
  // Timeline tracking
  created_at: string;
  last_checked_at: string;
  completed_at?: string;
  
  // Tracking metadata
  check_count?: number;
  notes?: string;
}

// Insert types for database operations
export interface GuardianApiTestInsert {
  test_name: string;
  test_type: GuardianApiTest['test_type'];
  endpoint: string;
  http_method: GuardianApiTest['http_method'];
  request_payload?: any;
  request_headers?: any;
  response_status?: number;
  response_payload?: any;
  response_headers?: any;
  guardian_wallet_id?: string;
  guardian_operation_id?: string;
  guardian_wallet_address?: string;
  execution_time_ms?: number;
  success: boolean;
  error_message?: string;
  created_by?: string;
  notes?: string;
}

export interface GuardianWalletInsert {
  guardian_wallet_id: string;
  guardian_operation_id?: string;
  guardian_internal_id?: string;
  wallet_name?: string;
  wallet_status?: GuardianWallet['wallet_status'];
  wallet_addresses?: GuardianWallet['wallet_addresses'];
  wallet_metadata?: any;
  creation_request_id?: string;
  operation_check_request_id?: string;
  wallet_details_request_id?: string;
  operation_completed_at?: string;
  wallet_retrieved_at?: string;
  test_notes?: string;
  created_by?: string;
}

export interface GuardianOperationInsert {
  operation_id: string;
  operation_type: string;
  operation_status?: GuardianOperation['operation_status'];
  guardian_wallet_id?: string;
  related_test_id?: string;
  operation_result?: any;
  operation_error?: any;
  completed_at?: string;
  notes?: string;
}

// Update types
export interface GuardianApiTestUpdate extends Partial<GuardianApiTestInsert> {}
export interface GuardianWalletUpdate extends Partial<GuardianWalletInsert> {
  updated_at?: string;
}
export interface GuardianOperationUpdate extends Partial<GuardianOperationInsert> {
  last_checked_at?: string;
  check_count?: number;
}

// Response types for API operations
export interface GuardianTestResult {
  success: boolean;
  data?: any;
  error?: string;
  execution_time_ms: number;
  test_record_id: string;
}

export interface GuardianWalletCreationFlow {
  wallet_id: string;
  creation_test: GuardianApiTest;
  operation_test?: GuardianApiTest;
  wallet_details_test?: GuardianApiTest;
  wallet_record: GuardianWallet;
  operation_record?: GuardianOperation;
  complete: boolean;
}
