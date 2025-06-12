import React, { useState, useEffect } from 'react';
import type { ComplianceAuditLog } from '../../types';

interface AuditTrailProps {
  entityId?: string;
  entityType?: 'INVESTOR' | 'ISSUER';
  startDate?: Date;
  endDate?: Date;
  onError: (error: Error) => void;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  entityId,
  entityType,
  startDate,
  endDate,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [filters, setFilters] = useState({
    entityId,
    entityType,
    startDate,
    endDate,
  });

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        // TODO: Implement actual audit log fetching
        // Mock data for now
        const logs: ComplianceAuditLog[] = [
          {
            id: '1',
            entityType: 'INVESTOR',
            entityId: 'inv_123',
            action: 'KYC_VERIFICATION_COMPLETED',
            details: {
              result: 'PASS',
              provider: 'Onfido',
            },
            performedBy: 'system',
            timestamp: new Date(),
          },
          {
            id: '2',
            entityType: 'INVESTOR',
            entityId: 'inv_123',
            action: 'DOCUMENT_VERIFIED',
            details: {
              documentType: 'PASSPORT',
              status: 'VERIFIED',
            },
            performedBy: 'compliance_officer_1',
            timestamp: new Date(Date.now() - 3600000),
          },
        ];

        setAuditLogs(logs);
      } catch (error) {
        onError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [filters]);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const getActionColor = (action: string) => {
    if (action.includes('COMPLETED') || action.includes('VERIFIED')) {
      return 'text-green-800 bg-green-100';
    }
    if (action.includes('FAILED') || action.includes('REJECTED')) {
      return 'text-red-800 bg-red-100';
    }
    if (action.includes('PENDING') || action.includes('IN_PROGRESS')) {
      return 'text-yellow-800 bg-yellow-100';
    }
    return 'text-blue-800 bg-blue-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Audit Trail
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete history of compliance-related actions and events.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement export functionality
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Export Logs
              </button>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Timestamp
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Entity
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Action
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Performed By
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {log.entityType}
                          </span>
                          <span className="ml-2">{log.entityId}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {log.performedBy}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};