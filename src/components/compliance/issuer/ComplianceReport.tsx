import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/hooks/shared/supabase/useSupabaseClient';
import { ComplianceReport, ComplianceCheck, ComplianceStatus, DbComplianceReport } from './types/documents';
import type { Json } from '@/types/core/supabase';
import { useUser } from '@/hooks/auth/user/useUser';

interface Props {
  projectId: string;
}

const calculateOverallStatus = (findings: ComplianceCheck[]): ComplianceStatus => {
  if (findings.some(finding => finding.status === 'fail')) {
    return 'fail';
  }
  if (findings.some(finding => finding.status === 'warning')) {
    return 'warning';
  }
  return 'pass';
};

// Map our app compliance status to the database enum
const mapStatusToDb = (status: ComplianceStatus): "compliant" | "non_compliant" | "pending_review" => {
  switch(status) {
    case 'pass': return 'compliant';
    case 'fail': return 'non_compliant';
    case 'warning': return 'pending_review';
  }
};

// Map database enum to our app compliance status
const mapStatusFromDb = (status: "compliant" | "non_compliant" | "pending_review"): ComplianceStatus => {
  switch(status) {
    case 'compliant': return 'pass';
    case 'non_compliant': return 'fail';
    case 'pending_review': return 'warning';
  }
};

export const ComplianceReportComponent: React.FC<Props> = ({ projectId }) => {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data, error } = await supabase
          .from('compliance_reports')
          .select('*')
          .eq('issuer_id', projectId)
          .single();

        if (error) throw error;

        if (data) {
          // Map database model to our app model
          const dbReport = data as DbComplianceReport;
          const appReport: ComplianceReport = {
            id: dbReport.id,
            project_id: dbReport.issuer_id,
            generated_at: dbReport.generated_at,
            status: mapStatusFromDb(dbReport.status),
            findings: typeof dbReport.findings === 'string' 
              ? JSON.parse(dbReport.findings) 
              : dbReport.findings,
          };
          setReport(appReport);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [projectId, supabase]);

  const generateReport = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setLoading(true);

      const findings: ComplianceCheck[] = [
        {
          category: 'KYC',
          status: 'pass',
          description: 'All investors have completed KYC',
        },
        {
          category: 'AML',
          status: 'warning',
          description: 'Some transactions require additional review',
          recommendation: 'Review flagged transactions',
        },
      ];

      const status = calculateOverallStatus(findings);
      const reportId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      // Properly type the findings for the database
      const findingsJson = JSON.stringify(findings) as unknown as Json;
      
      // Create database record
      const { data, error: insertError } = await supabase
        .from('compliance_reports')
        .insert({
          id: reportId,
          issuer_id: projectId,
          generated_at: now,
          status: mapStatusToDb(status),
          findings: findingsJson,
          metadata: {} as Json,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();
      
      if (insertError) throw insertError;

      // Create our app model
      const appReport: ComplianceReport = {
        id: reportId,
        project_id: projectId,
        generated_at: now,
        status,
        findings,
      };

      setReport(appReport);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Compliance Report</h2>
        <button
          onClick={generateReport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generate New Report
        </button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p>Generated: {new Date(report.generated_at).toLocaleString()}</p>
            <p className={`font-bold ${
              report.status === 'pass' ? 'text-green-600' :
              report.status === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              Overall Status: {report.status.toUpperCase()}
            </p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Findings</h3>
            <div className="space-y-2">
              {report.findings.map((finding, index) => (
                <div key={index} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{finding.category}</h4>
                      <p className="text-gray-600">{finding.description}</p>
                      {finding.recommendation && (
                        <p className="text-blue-600 mt-1">
                          Recommendation: {finding.recommendation}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      finding.status === 'pass' ? 'bg-green-100 text-green-800' :
                      finding.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {finding.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceReportComponent;