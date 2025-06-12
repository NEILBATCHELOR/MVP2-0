import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Download, Upload, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/infrastructure/database/client';
import { 
  Investor, 
  InvestorEntityType, 
  KycStatus, 
  AccreditationStatus, 
  InvestorStatus 
} from '@/types/core/centralModels';
import { mapInvestorToDatabase } from '@/utils/shared/formatting/typeMappers';

interface InvestorTemplateRow {
  name: string;
  email: string;
  company?: string;
  type: string;
  kyc_status?: string;
  kyc_verified_at?: string;
  kyc_expiry_date?: string;
  accreditation_status?: string;
  accreditation_type?: string;
  accreditation_verified_at?: string;
  accreditation_expires_at?: string;
  wallet_address?: string;
  risk_score?: string;
  risk_factors?: string;
  investor_status?: string;
  onboarding_completed?: string;
  risk_assessment?: string;
  tax_residency?: string;
  tax_id_number?: string;
  investment_preferences?: string;
  profile_data?: string;
  last_compliance_check?: string;
  documents?: string;
  user_id?: string;
}

interface ValidationResult {
  valid: boolean;
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  success: number;
  failed: number;
  messages: Array<{ row: number; success: boolean; message: string }>;
}

export const InvestorBulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parseErrors, setParseErrors] = useState<ValidationResult[]>([]);
  const [result, setResult] = useState<UploadResult | null>(null);

  const downloadTemplate = () => {
    // Create template headers
    const template = [
      {
        name: '',
        email: '',
        company: '',
        type: 'individual, institutional, syndicate',
        kyc_status: 'approved, pending, failed, not_started, expired',
        kyc_verified_at: 'YYYY-MM-DD',
        kyc_expiry_date: 'YYYY-MM-DD',
        accreditation_status: 'approved, pending, rejected, not_started, expired',
        accreditation_type: '',
        accreditation_verified_at: 'YYYY-MM-DD',
        accreditation_expires_at: 'YYYY-MM-DD',
        wallet_address: '',
        risk_score: '0-100',
        risk_factors: 'JSON format: {"factor1": true, "factor2": false}',
        investor_status: 'pending, active, rejected, suspended',
        onboarding_completed: 'true/false',
        tax_residency: '',
        tax_id_number: '',
        risk_assessment: 'JSON format: {"score":0,"factors":[],"lastUpdated":"","recommendedAction":""}',
        investment_preferences: 'JSON format: {"preferredAssetClasses":[],"riskTolerance":"low/medium/high","investmentHorizon":"short/medium/long"}',
        profile_data: 'JSON format: any additional profile data',
        last_compliance_check: 'YYYY-MM-DD',
        documents: 'JSON format: [{"type":"passport","status":"verified"},{"type":"proof_of_address","status":"pending"}]',
        user_id: ''
      }
    ];

    // Convert to worksheet
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'InvestorTemplate');

    // Generate and download the file
    XLSX.writeFile(wb, 'investor_upload_template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setParseErrors([]);
    setResult(null);
  };

  const validateInvestorData = (data: InvestorTemplateRow[]): ValidationResult[] => {
    const errors: ValidationResult[] = [];

    data.forEach((row, index) => {
      // Required fields check
      if (!row.name) {
        errors.push({ valid: false, row: index + 2, field: 'name', message: 'Name is required' });
      }

      if (!row.email) {
        errors.push({ valid: false, row: index + 2, field: 'email', message: 'Email is required' });
      }

      if (!row.type) {
        errors.push({ valid: false, row: index + 2, field: 'type', message: 'Type is required' });
      } else if (!['individual', 'institutional', 'syndicate'].includes(row.type.toLowerCase())) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'type', 
          message: 'Type must be one of: individual, institutional, syndicate' 
        });
      }

      // KYC status validation
      if (
        row.kyc_status && 
        !['approved', 'pending', 'failed', 'not_started', 'expired'].includes(row.kyc_status.toLowerCase())
      ) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'kyc_status', 
          message: 'KYC status must be one of: approved, pending, failed, not_started, expired' 
        });
      }

      // Date format validations
      const dateFields = ['kyc_verified_at', 'kyc_expiry_date', 'accreditation_verified_at', 'accreditation_expires_at', 'last_compliance_check'];
      dateFields.forEach(field => {
        if (row[field as keyof InvestorTemplateRow] && !/^\d{4}-\d{2}-\d{2}$/.test(row[field as keyof InvestorTemplateRow] as string)) {
          errors.push({
            valid: false,
            row: index + 2,
            field,
            message: 'Date must be in YYYY-MM-DD format'
          });
        }
      });

      // Accreditation status validation
      if (
        row.accreditation_status && 
        !['approved', 'pending', 'rejected', 'not_started', 'expired'].includes(row.accreditation_status.toLowerCase())
      ) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'accreditation_status', 
          message: 'Accreditation status must be one of: approved, pending, rejected, not_started, expired' 
        });
      }

      // Investor status validation
      if (
        row.investor_status && 
        !['pending', 'active', 'rejected', 'suspended'].includes(row.investor_status.toLowerCase())
      ) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'investor_status', 
          message: 'Investor status must be one of: pending, active, rejected, suspended' 
        });
      }

      // Boolean field validation
      if (row.onboarding_completed && !['true', 'false'].includes(row.onboarding_completed.toLowerCase())) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'onboarding_completed', 
          message: 'Onboarding completed must be either true or false' 
        });
      }

      // JSON format checks
      const jsonFields = ['risk_factors', 'risk_assessment', 'investment_preferences', 'profile_data', 'documents'];
      jsonFields.forEach(field => {
        if (row[field as keyof InvestorTemplateRow]) {
          try {
            JSON.parse(row[field as keyof InvestorTemplateRow] as string);
          } catch (e) {
            errors.push({ 
              valid: false, 
              row: index + 2, 
              field, 
              message: `Invalid JSON format for ${field}` 
            });
          }
        }
      });

      // Risk score validation
      if (row.risk_score && (isNaN(Number(row.risk_score)) || Number(row.risk_score) < 0 || Number(row.risk_score) > 100)) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'risk_score', 
          message: 'Risk score must be a number between 0 and 100' 
        });
      }
    });

    return errors;
  };

  const preprocessInvestorRow = (row: InvestorTemplateRow): Partial<Investor> => {
    // Transform spreadsheet row to Investor format
    const investor: Partial<Investor> = {
      name: row.name,
      email: row.email,
      company: row.company,
      type: row.type.toLowerCase() as InvestorEntityType,
      kycStatus: (row.kyc_status?.toLowerCase() || 'not_started') as KycStatus,
      kycVerifiedAt: row.kyc_verified_at,
      kycExpiryDate: row.kyc_expiry_date,
      accreditationStatus: (row.accreditation_status?.toLowerCase() || 'not_started') as AccreditationStatus,
      accreditationType: row.accreditation_type,
      accreditationVerifiedAt: row.accreditation_verified_at,
      accreditationExpiresAt: row.accreditation_expires_at,
      walletAddress: row.wallet_address,
      taxResidency: row.tax_residency,
      taxIdNumber: row.tax_id_number,
      lastComplianceCheck: row.last_compliance_check,
      userId: row.user_id,
    };

    if (row.risk_score) {
      investor.riskScore = Number(row.risk_score);
    }

    // Parse boolean fields
    if (row.onboarding_completed) {
      investor.onboardingCompleted = row.onboarding_completed.toLowerCase() === 'true';
    } else {
      investor.onboardingCompleted = false;
    }

    // Parse JSON fields if present
    if (row.risk_factors) {
      try {
        investor.riskFactors = JSON.parse(row.risk_factors);
      } catch (e) {
        // Error already caught in validation
      }
    }

    if (row.risk_assessment) {
      try {
        investor.riskAssessment = JSON.parse(row.risk_assessment);
      } catch (e) {
        // Error already caught in validation
      }
    }

    if (row.investment_preferences) {
      try {
        investor.investmentPreferences = JSON.parse(row.investment_preferences);
      } catch (e) {
        // Error already caught in validation
      }
    }

    if (row.profile_data) {
      try {
        investor.profileData = JSON.parse(row.profile_data);
      } catch (e) {
        // Error already caught in validation
      }
    }

    // Set defaults if not provided
    if (!investor.investorStatus) {
      investor.investorStatus = InvestorStatus.PENDING;
    } else {
      investor.investorStatus = row.investor_status?.toLowerCase() as InvestorStatus;
    }

    return investor;
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      // Read file
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<InvestorTemplateRow>(ws);

      // Validate data
      const validationErrors = validateInvestorData(jsonData);
      if (validationErrors.length > 0) {
        setParseErrors(validationErrors);
        setUploading(false);
        return;
      }

      // Process uploads
      const uploadResults: UploadResult = {
        success: 0,
        failed: 0,
        messages: []
      };

      // Process each row
      for (let i = 0; i < jsonData.length; i++) {
        setProgress(Math.round(((i + 1) / jsonData.length) * 100));
        
        try {
          const investorData = preprocessInvestorRow(jsonData[i]);
          const dbData = mapInvestorToDatabase(investorData);
          
          // Make sure email is included as it's required by the database
          if (!dbData.email && investorData.email) {
            dbData.email = investorData.email;
          }

          // Only proceed if we have an email (required field)
          if (!dbData.email) {
            throw new Error('Email is required');
          }
          
          // Ensure all required fields are present
          if (!dbData.name) dbData.name = investorData.name || '';
          if (!dbData.type) dbData.type = investorData.type?.toLowerCase() || 'individual';
          if (!dbData.kyc_status) dbData.kyc_status = 'not_started';
          
          // Create a properly typed database object with required fields
          const investorRecord = {
            email: dbData.email,
            name: dbData.name,
            type: dbData.type,
            kyc_status: dbData.kyc_status,
            ...dbData
          };
          
          const { data, error } = await supabase
            .from('investors')
            .insert(investorRecord)
            .select();
          
          if (error) {
            // Check if it's a duplicate email error
            if (error.message?.includes('duplicate key') && error.message?.includes('email')) {
              // Try to update instead
              const { data: existingInvestor } = await supabase
                .from('investors')
                .select('investor_id')
                .eq('email', dbData.email)
                .single();
              
              if (existingInvestor) {
                const { data: updatedData, error: updateError } = await supabase
                  .from('investors')
                  .update(investorRecord)
                  .eq('investor_id', existingInvestor.investor_id)
                  .select();
                
                if (updateError) {
                  throw updateError;
                }
                
                uploadResults.success++;
                uploadResults.messages.push({
                  row: i + 2,
                  success: true,
                  message: `Updated existing investor: ${investorRecord.email}`
                });
                continue;
              }
            }
            
            throw error;
          }
          
          uploadResults.success++;
          uploadResults.messages.push({
            row: i + 2,
            success: true,
            message: `Successfully added investor: ${investorRecord.email}`
          });
        } catch (error: any) {
          uploadResults.failed++;
          uploadResults.messages.push({
            row: i + 2,
            success: false,
            message: `Failed to add investor at row ${i + 2}: ${error.message || error}`
          });
        }
      }

      setResult(uploadResults);
    } catch (error: any) {
      console.error('Upload error:', error);
      setParseErrors([{ 
        valid: false, 
        row: 0, 
        field: 'file', 
        message: `Error processing file: ${error.message || 'Unknown error'}` 
      }]);
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Upload Investor Data</h3>
          <p className="text-sm text-gray-500">
            Bulk upload investor information from a spreadsheet. 
            Download the template to see the required format.
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <label htmlFor="investor-file" className="text-sm font-medium">
            Upload Spreadsheet
          </label>
          <input
            id="investor-file"
            type="file"
            className="cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/80"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-xs text-gray-500">
            Supported formats: XLSX, XLS, CSV
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !file}
              className="gap-1"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Investors'}
            </Button>
            {uploading && (
              <div className="flex-1">
                <Progress value={progress} className="h-2" />
                <p className="mt-1 text-xs text-gray-500">{`${progress}% complete`}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {parseErrors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-base font-medium">Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc pl-5 space-y-2 max-h-[250px] overflow-y-auto border-t border-red-200 pt-2">
              {parseErrors.map((error, index) => (
                <li key={index} className="text-sm break-words">
                  Row {error.row}, {error.field}: {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          <Alert variant={result.failed === 0 ? "default" : "destructive"}>
            {result.failed === 0 ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>Upload Results</AlertTitle>
            <AlertDescription>
              Successfully uploaded {result.success} investors with {result.failed} failures.
            </AlertDescription>
          </Alert>

          {result.messages.length > 0 && (
            <div className="max-h-60 overflow-y-auto border rounded-md p-4">
              <h4 className="font-medium mb-2">Upload Log</h4>
              <ul className="space-y-2">
                {result.messages.map((msg, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    {msg.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <span>Row {msg.row}: {msg.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};