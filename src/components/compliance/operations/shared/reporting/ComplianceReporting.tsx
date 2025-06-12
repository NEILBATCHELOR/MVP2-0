import React, { useState, useEffect } from 'react';
import type { ComplianceCheck, RiskLevel } from '../../types';

interface ReportMetrics {
  totalInvestors: number;
  totalIssuers: number;
  kycCompletionRate: number;
  kybCompletionRate: number;
  averageRiskLevel: number;
  pendingVerifications: number;
  documentVerificationRate: number;
  recentAlerts: number;
  complianceScore: number;
}

interface ComplianceReport {
  id: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
  startDate: Date;
  endDate: Date;
  metrics: ReportMetrics;
  generatedAt: Date;
  status: 'GENERATED' | 'PENDING' | 'FAILED';
  downloadUrl?: string;
}

interface ComplianceReportingProps {
  onGenerateReport: (type: ComplianceReport['type'], startDate: Date, endDate: Date) => Promise<void>;
  onDownloadReport: (reportId: string) => Promise<void>;
  onError: (error: Error) => void;
}

export const ComplianceReporting: React.FC<ComplianceReportingProps> = ({
  onGenerateReport,
  onDownloadReport,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        // TODO: Implement real metrics fetching
        // Mock data for now
        const mockMetrics: ReportMetrics = {
          totalInvestors: 150,
          totalIssuers: 25,
          kycCompletionRate: 0.85,
          kybCompletionRate: 0.92,
          averageRiskLevel: 2.3,
          pendingVerifications: 12,
          documentVerificationRate: 0.78,
          recentAlerts: 5,
          complianceScore: 0.88,
        };

        const mockReports: ComplianceReport[] = [
          {
            id: '1',
            type: 'MONTHLY',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            metrics: mockMetrics,
            generatedAt: new Date(),
            status: 'GENERATED',
            downloadUrl: '#',
          },
          {
            id: '2',
            type: 'WEEKLY',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            metrics: mockMetrics,
            generatedAt: new Date(),
            status: 'GENERATED',
            downloadUrl: '#',
          },
        ];

        setMetrics(mockMetrics);
        setReports(mockReports);
      } catch (error) {
        onError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleGenerateReport = async (type: ComplianceReport['type']) => {
    try {
      let startDate: Date;
      let endDate = new Date();

      switch (type) {
        case 'DAILY':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case 'WEEKLY':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'MONTHLY':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'QUARTERLY':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'ANNUAL':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'CUSTOM':
          startDate = customDateRange.startDate;
          endDate = customDateRange.endDate;
          break;
        default:
          throw new Error('Invalid report type');
      }

      await onGenerateReport(type, startDate, endDate);
    } catch (error) {
      onError(error as Error);
    }
  };

  const formatMetric = (value: number, isPercentage = false) => {
    if (isPercentage) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-800 bg-green-100';
    if (score >= 0.7) return 'text-yellow-800 bg-yellow-100';
    return 'text-red-800 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Compliance Reporting
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate and view compliance reports and key metrics.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {metrics && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Overall Compliance Score
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${getScoreColor(
                            metrics.complianceScore
                          )}`}
                        >
                          {formatMetric(metrics.complianceScore, true)}
                        </span>
                      </dd>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        KYC Completion Rate
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${getScoreColor(
                            metrics.kycCompletionRate
                          )}`}
                        >
                          {formatMetric(metrics.kycCompletionRate, true)}
                        </span>
                      </dd>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        KYB Completion Rate
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${getScoreColor(
                            metrics.kybCompletionRate
                          )}`}
                        >
                          {formatMetric(metrics.kybCompletionRate, true)}
                        </span>
                      </dd>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-base font-medium text-gray-900">
                    Generate Report
                  </h4>
                  <div className="mt-4 flex space-x-4">
                    {(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => handleGenerateReport(type)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Report Type
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Date Range
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Generated At
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {report.type}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {report.startDate.toLocaleDateString()} -{' '}
                          {report.endDate.toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {report.generatedAt.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              report.status === 'GENERATED'
                                ? 'bg-green-100 text-green-800'
                                : report.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {report.status === 'GENERATED' && (
                            <>
                              <button
                                onClick={() => setSelectedReport(report)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                View
                              </button>
                              <button
                                onClick={() => onDownloadReport(report.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Download
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">
                Report Details - {selectedReport.type}
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-4">
              <dl className="grid grid-cols-2 gap-4">
                {Object.entries(selectedReport.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      {key
                        .replace(/([A-Z])/g, ' $1')
                        .trim()
                        .replace(/^./, (str) => str.toUpperCase())}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {typeof value === 'number' && value <= 1
                        ? formatMetric(value, true)
                        : formatMetric(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => onDownloadReport(selectedReport.id)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download Report
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};