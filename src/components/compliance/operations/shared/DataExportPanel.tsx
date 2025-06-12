import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet, FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '@/infrastructure/database/client';
import { 
  toCamelCase, 
  mapInvestorFromDatabase, 
  mapOrganizationFromDatabase 
} from '@/utils/shared/formatting/typeMappers';

interface DataExportPanelProps {
  entityType: 'investor' | 'issuer';
}

interface ExportField {
  id: string;
  label: string;
  checked: boolean;
  dbField: string;
}

export const DataExportPanel: React.FC<DataExportPanelProps> = ({ entityType }) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [fields, setFields] = useState<ExportField[]>(
    entityType === 'investor' 
      ? [
          { id: 'name', label: 'Name', checked: true, dbField: 'name' },
          { id: 'email', label: 'Email', checked: true, dbField: 'email' },
          { id: 'company', label: 'Company', checked: true, dbField: 'company' },
          { id: 'type', label: 'Type', checked: true, dbField: 'type' },
          { id: 'kycStatus', label: 'KYC Status', checked: true, dbField: 'kyc_status' },
          { id: 'accreditationStatus', label: 'Accreditation Status', checked: true, dbField: 'accreditation_status' },
          { id: 'accreditationType', label: 'Accreditation Type', checked: true, dbField: 'accreditation_type' },
          { id: 'walletAddress', label: 'Wallet Address', checked: false, dbField: 'wallet_address' },
          { id: 'taxResidency', label: 'Tax Residency', checked: false, dbField: 'tax_residency' },
          { id: 'taxIdNumber', label: 'Tax ID', checked: false, dbField: 'tax_id_number' },
          { id: 'investorStatus', label: 'Status', checked: true, dbField: 'investor_status' },
          { id: 'createdAt', label: 'Created Date', checked: true, dbField: 'created_at' },
        ]
      : [
          { id: 'name', label: 'Name', checked: true, dbField: 'name' },
          { id: 'legalName', label: 'Legal Name', checked: true, dbField: 'legal_name' },
          { id: 'registrationNumber', label: 'Registration Number', checked: true, dbField: 'registration_number' },
          { id: 'registrationDate', label: 'Registration Date', checked: true, dbField: 'registration_date' },
          { id: 'taxId', label: 'Tax ID', checked: true, dbField: 'tax_id' },
          { id: 'jurisdiction', label: 'Jurisdiction', checked: true, dbField: 'jurisdiction' },
          { id: 'businessType', label: 'Business Type', checked: true, dbField: 'business_type' },
          { id: 'status', label: 'Status', checked: true, dbField: 'status' },
          { id: 'contactEmail', label: 'Contact Email', checked: true, dbField: 'contact_email' },
          { id: 'contactPhone', label: 'Contact Phone', checked: false, dbField: 'contact_phone' },
          { id: 'website', label: 'Website', checked: false, dbField: 'website' },
          { id: 'complianceStatus', label: 'Compliance Status', checked: true, dbField: 'compliance_status' },
          { id: 'onboardingCompleted', label: 'Onboarding Completed', checked: true, dbField: 'onboarding_completed' },
          { id: 'createdAt', label: 'Created Date', checked: true, dbField: 'created_at' },
        ]
  );

  const toggleField = (id: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, checked: !field.checked } : field
    ));
  };

  const selectAllFields = () => {
    setFields(fields.map(field => ({ ...field, checked: true })));
  };

  const deselectAllFields = () => {
    setFields(fields.map(field => ({ ...field, checked: false })));
  };

  const fetchData = async () => {
    try {
      if (entityType === 'investor') {
        const { data, error } = await supabase
          .from('investors')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data.map(mapInvestorFromDatabase);
      } else {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data.map(mapOrganizationFromDatabase);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      throw new Error(`Failed to fetch ${entityType} data: ${error.message}`);
    }
  };

  const prepareExportData = (data: any[]) => {
    // Filter data to only include selected fields
    const selectedFields = fields.filter(f => f.checked);
    
    return data.map(item => {
      const exportItem: Record<string, any> = {};
      selectedFields.forEach(field => {
        exportItem[field.label] = item[field.id];
      });
      return exportItem;
    });
  };

  const exportToExcel = (data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, entityType === 'investor' ? 'Investors' : 'Issuers');
    XLSX.writeFile(wb, `${entityType}_data_export.xlsx`);
  };

  const exportToCsv = (data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${entityType}_data_export.csv`;
    link.click();
  };

  const exportToPdf = (data: any[]) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(
      entityType === 'investor' ? 'Investor Data Export' : 'Issuer Data Export', 
      14, 
      22
    );
    
    // Prepare table data
    const headers = Object.keys(data[0]);
    const rows = data.map(item => Object.values(item));
    
    // Add table
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 30 },
    });
    
    // Save PDF
    doc.save(`${entityType}_data_export.pdf`);
  };

  const handleExport = async () => {
    if (fields.filter(f => f.checked).length === 0) {
      setError('Please select at least one field to export');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const data = await fetchData();
      const exportData = prepareExportData(data);

      switch (exportFormat) {
        case 'excel':
          exportToExcel(exportData);
          break;
        case 'csv':
          exportToCsv(exportData);
          break;
        case 'pdf':
          exportToPdf(exportData);
          break;
      }
    } catch (error: any) {
      console.error('Export error:', error);
      setError(error.message || 'An error occurred during export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Export Format</h3>
          <RadioGroup 
            defaultValue="excel" 
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as 'csv' | 'excel' | 'pdf')}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel" className="flex items-center">
                <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                Excel
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="flex items-center">
                <FileText className="mr-1.5 h-4 w-4" />
                CSV
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center">
                <FileText className="mr-1.5 h-4 w-4" />
                PDF
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Select Fields to Export</h3>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={selectAllFields}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllFields}>
                Deselect All
              </Button>
            </div>
          </div>
          
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={field.id} 
                    checked={field.checked} 
                    onCheckedChange={() => toggleField(field.id)} 
                  />
                  <Label htmlFor={field.id}>{field.label}</Label>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleExport} 
        disabled={exporting}
        className="w-full"
      >
        {exporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export {entityType === 'investor' ? 'Investors' : 'Issuers'}
          </>
        )}
      </Button>
    </div>
  );
};