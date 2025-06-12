import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Download, Upload, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/infrastructure/database/client';
import { Organization, OrganizationStatus, ComplianceStatusType } from '@/types/core/centralModels';
import { mapOrganizationToDatabase } from '@/utils/shared/formatting/typeMappers';

interface IssuerTemplateRow {
  name: string;
  legal_name?: string;
  registration_number?: string;
  registration_date?: string;
  tax_id?: string;
  jurisdiction?: string;
  business_type?: string;
  status?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  address?: string;
  legal_representatives?: string;
  compliance_status?: string;
  onboarding_completed?: string;
  documents?: string;
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

export const IssuerBulkUpload: React.FC = () => {
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
        legal_name: '',
        registration_number: '',
        registration_date: 'YYYY-MM-DD',
        tax_id: '',
        jurisdiction: '',
        business_type: '',
        status: 'pending, active, rejected, suspended',
        contact_email: '',
        contact_phone: '',
        website: '',
        address: 'JSON format: {"street":"","city":"","zipCode":"","country":""}',
        legal_representatives: 'JSON format: [{"name":"","role":"","email":"","phone":"","isPrimary":true}]',
        compliance_status: 'compliant, non_compliant, pending_review',
        onboarding_completed: 'true/false',
        documents: 'JSON format: [{"type":"registration","status":"verified"},{"type":"tax_certificate","status":"pending"}]'
      }
    ];

    // Convert to worksheet
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IssuerTemplate');

    // Generate and download the file
    XLSX.writeFile(wb, 'issuer_upload_template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setParseErrors([]);
    setResult(null);
  };

  const validateIssuerData = (data: IssuerTemplateRow[]): ValidationResult[] => {
    const errors: ValidationResult[] = [];

    data.forEach((row, index) => {
      // Required fields check
      if (!row.name) {
        errors.push({ valid: false, row: index + 2, field: 'name', message: 'Name is required' });
      }

      // Email format check
      if (row.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contact_email)) {
        errors.push({ valid: false, row: index + 2, field: 'contact_email', message: 'Invalid email format' });
      }

      // Date format check
      if (row.registration_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.registration_date)) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'registration_date', 
          message: 'Date must be in YYYY-MM-DD format' 
        });
      }

      // JSON format check for address
      if (row.address) {
        try {
          const addressObj = JSON.parse(row.address);
          if (!addressObj.street || !addressObj.city || !addressObj.country) {
            errors.push({ 
              valid: false, 
              row: index + 2, 
              field: 'address', 
              message: 'Address must have street, city, and country fields' 
            });
          }
        } catch (e) {
          errors.push({ 
            valid: false, 
            row: index + 2, 
            field: 'address', 
            message: 'Invalid JSON format for address' 
          });
        }
      }

      // JSON format check for legal_representatives
      if (row.legal_representatives) {
        try {
          const reps = JSON.parse(row.legal_representatives);
          if (!Array.isArray(reps)) {
            errors.push({ 
              valid: false, 
              row: index + 2, 
              field: 'legal_representatives', 
              message: 'Legal representatives must be an array' 
            });
          } else {
            reps.forEach((rep, repIndex) => {
              if (!rep.name || !rep.role || !rep.email) {
                errors.push({ 
                  valid: false, 
                  row: index + 2, 
                  field: 'legal_representatives', 
                  message: `Representative ${repIndex + 1} missing required fields` 
                });
              }
            });
          }
        } catch (e) {
          errors.push({ 
            valid: false, 
            row: index + 2, 
            field: 'legal_representatives', 
            message: 'Invalid JSON format for legal representatives' 
          });
        }
      }

      // Status validation
      if (
        row.status && 
        !['pending', 'active', 'rejected', 'suspended'].includes(row.status.toLowerCase())
      ) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'status', 
          message: 'Status must be one of: pending, active, rejected, suspended' 
        });
      }

      // Compliance status validation
      if (
        row.compliance_status && 
        !['compliant', 'non_compliant', 'pending_review'].includes(row.compliance_status.toLowerCase())
      ) {
        errors.push({ 
          valid: false, 
          row: index + 2, 
          field: 'compliance_status', 
          message: 'Compliance status must be one of: compliant, non_compliant, pending_review' 
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

      // JSON format check for documents
      if (row.documents) {
        try {
          const docs = JSON.parse(row.documents);
          if (!Array.isArray(docs)) {
            errors.push({ 
              valid: false, 
              row: index + 2, 
              field: 'documents', 
              message: 'Documents must be an array' 
            });
          }
        } catch (e) {
          errors.push({ 
            valid: false, 
            row: index + 2, 
            field: 'documents', 
            message: 'Invalid JSON format for documents' 
          });
        }
      }
    });

    return errors;
  };

  const preprocessIssuerRow = (row: IssuerTemplateRow): Partial<Organization> => {
    // Transform spreadsheet row to Organization format
    const organization: Partial<Organization> = {
      name: row.name,
      legalName: row.legal_name,
      registrationNumber: row.registration_number,
      registrationDate: row.registration_date,
      taxId: row.tax_id,
      jurisdiction: row.jurisdiction,
      businessType: row.business_type,
      status: row.status as OrganizationStatus,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      website: row.website,
      complianceStatus: row.compliance_status as ComplianceStatusType,
    };

    // Parse JSON fields if present
    if (row.address) {
      try {
        organization.address = JSON.parse(row.address);
      } catch (e) {
        // Error already caught in validation
      }
    }

    if (row.legal_representatives) {
      try {
        organization.legalRepresentatives = JSON.parse(row.legal_representatives);
      } catch (e) {
        // Error already caught in validation
      }
    }

    // Parse boolean fields
    if (row.onboarding_completed) {
      organization.onboardingCompleted = row.onboarding_completed.toLowerCase() === 'true';
    } else {
      organization.onboardingCompleted = false;
    }

    // Set defaults
    if (!organization.status) {
      organization.status = OrganizationStatus.PENDING;
    }
    
    if (!organization.complianceStatus) {
      organization.complianceStatus = ComplianceStatusType.PENDING_REVIEW;
    }

    return organization;
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
      const jsonData = XLSX.utils.sheet_to_json<IssuerTemplateRow>(ws);

      // Validate data
      const validationErrors = validateIssuerData(jsonData);
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
          const orgData = preprocessIssuerRow(jsonData[i]);
          const dbData = mapOrganizationToDatabase(orgData);
          
          // Ensure all required fields are present
          if (!dbData.name) dbData.name = orgData.name || '';
          
          // Create a properly typed database object with required fields that specifically includes the required 'name' field
          const issuerRecord: { name: string } & Partial<typeof dbData> = {
            name: dbData.name,
            ...dbData
          };
          
          const { data: existingIssuer } = await supabase
            .from('organizations')
            .select('id')
            .eq('name', issuerRecord.name)
            .single();
          
          if (existingIssuer) {
            // Update the existing organization with the new data
            const { data, error } = await supabase
              .from('organizations')
              .update(issuerRecord)
              .eq('id', existingIssuer.id)
              .select();
            
            if (error) {
              throw error;
            }
            
            uploadResults.success++;
            uploadResults.messages.push({
              row: i + 2,
              success: true,
              message: `Updated existing issuer: ${issuerRecord.name}`
            });
          } else {
            const { data, error } = await supabase
              .from('organizations')
              .insert(issuerRecord)
              .select();
            
            if (error) {
              throw error;
            }
            
            uploadResults.success++;
            uploadResults.messages.push({
              row: i + 2,
              success: true,
              message: `Successfully added issuer: ${issuerRecord.name}`
            });
          }
        } catch (error: any) {
          uploadResults.failed++;
          uploadResults.messages.push({
            row: i + 2,
            success: false,
            message: `Failed to add issuer at row ${i + 2}: ${error.message || error}`
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
          <h3 className="text-lg font-medium">Upload Issuer Data</h3>
          <p className="text-sm text-gray-500">
            Upload issuer information from a spreadsheet. 
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
          <label htmlFor="issuer-file" className="text-sm font-medium">
            Upload Spreadsheet
          </label>
          <input
            id="issuer-file"
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
              {uploading ? 'Uploading...' : 'Upload Issuers'}
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
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {parseErrors.map((error, index) => (
                <li key={index} className="text-sm">
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
              Successfully uploaded {result.success} issuers with {result.failed} failures.
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