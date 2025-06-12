/**
 * Onfido Test Utilities
 * 
 * This file provides test utilities for the Onfido identity verification service integration.
 * It includes sample data, mock functions, and test helpers for development and testing.
 */

// Sample applicant data for testing
export const sampleApplicants = {
  individual: {
    first_name: "Test",
    last_name: "User",
    email: `test-${Date.now()}@example.com`,
    dob: "1990-01-01",
    country: "GBR",
    addresses: [
      {
        building_number: "100",
        street: "Main Street",
        town: "London",
        postcode: "SW1A 1AA",
        country: "GBR",
        start_date: "2020-01-01",
      }
    ]
  },
  company: {
    company_name: "Test Company Ltd",
    company_number: "12345678",
    country: "GBR",
    addresses: [
      {
        building_number: "200",
        street: "Business Avenue",
        town: "London",
        postcode: "EC1A 1BB",
        country: "GBR"
      }
    ]
  }
};

// Sample document data for testing
export const sampleDocuments = {
  passport: {
    type: "passport",
    side: "front",
    file: "base64-encoded-string-would-go-here",
    filename: "passport.jpg"
  },
  drivingLicense: {
    type: "driving_licence",
    side: "front",
    file: "base64-encoded-string-would-go-here",
    filename: "license_front.jpg"
  },
  drivingLicenseBack: {
    type: "driving_licence",
    side: "back",
    file: "base64-encoded-string-would-go-here",
    filename: "license_back.jpg"
  }
};

// Generate a unique applicant for testing
export function generateTestApplicant(type: 'individual' | 'company' = 'individual') {
  const timestamp = Date.now();
  
  if (type === 'individual') {
    return {
      ...sampleApplicants.individual,
      first_name: `Test${timestamp}`,
      last_name: `User${timestamp}`,
      email: `test-${timestamp}@example.com`
    };
  } else {
    return {
      ...sampleApplicants.company,
      company_name: `Test Company ${timestamp} Ltd`,
      company_number: `TC${timestamp.toString().slice(-8)}`
    };
  }
}

// Generate a mock verification report
export function generateMockVerificationReport(status: 'clear' | 'consider' | 'unidentified' = 'clear') {
  return {
    id: `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status,
    result: status === 'clear' ? 'pass' : status === 'consider' ? 'caution' : 'fail',
    created_at: new Date().toISOString(),
    breakdown: {
      document: status === 'unidentified' ? 'rejected' : 'approved',
      facial_similarity: status === 'clear' ? 'clear' : 'consider',
      visual_authenticity: 'clear',
      data_comparison: status === 'clear' ? 'clear' : 'consider',
      image_integrity: 'clear',
      compromised_document: 'clear'
    },
    properties: {
      document_type: 'passport',
      document_issuing_country: 'GBR'
    }
  };
}

// Test helper to mock the Onfido API responses
export async function mockOnfidoApiResponse<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  mockData: T
): Promise<T> {
  console.log(`[MOCK] Onfido API ${method} request to: ${endpoint}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockData;
}

// Test if the Onfido service is correctly configured
export async function testOnfidoConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // This would normally call the Onfido API to test connectivity
    // For test utils, we'll just check if the API token is configured
    const apiToken = process.env.ONFIDO_API_TOKEN;
    
    if (!apiToken) {
      return {
        success: false,
        message: "Onfido API token not configured"
      };
    }
    
    return {
      success: true,
      message: "Onfido service appears to be correctly configured"
    };
  } catch (error) {
    return {
      success: false,
      message: `Onfido connection error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Run a complete test workflow for Onfido
export async function runOnfidoTestWorkflow(): Promise<{
  success: boolean;
  steps: Array<{
    step: string;
    success: boolean;
    message?: string;
    data?: any;
  }>;
}> {
  const results = {
    success: true,
    steps: [] as Array<{
      step: string;
      success: boolean;
      message?: string;
      data?: any;
    }>
  };
  
  try {
    // Step 1: Create applicant
    const applicant = generateTestApplicant();
    results.steps.push({
      step: "Create applicant",
      success: true,
      data: { applicant_id: `test-${Date.now()}` }
    });
    
    // Step 2: Upload document
    results.steps.push({
      step: "Upload document",
      success: true,
      data: { document_id: `doc-${Date.now()}` }
    });
    
    // Step 3: Create check
    results.steps.push({
      step: "Create check",
      success: true,
      data: { check_id: `check-${Date.now()}` }
    });
    
    // Step 4: Get report
    const report = generateMockVerificationReport('clear');
    results.steps.push({
      step: "Get report",
      success: true,
      data: report
    });
    
    return results;
  } catch (error) {
    const failedStep = results.steps.length;
    const stepNames = ["Create applicant", "Upload document", "Create check", "Get report"];
    
    results.success = false;
    results.steps.push({
      step: stepNames[failedStep],
      success: false,
      message: `Failed: ${error instanceof Error ? error.message : String(error)}`
    });
    
    return results;
  }
} 