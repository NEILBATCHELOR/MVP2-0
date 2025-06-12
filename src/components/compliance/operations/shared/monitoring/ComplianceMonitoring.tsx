import React, { useState, useEffect } from 'react';
import type { ComplianceCheck, RiskLevel } from '../../types';

interface MonitoringAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'KYC' | 'AML' | 'DOCUMENT' | 'RISK' | 'ASSET' | 'WALLET';
  entityType: 'INVESTOR' | 'ISSUER';
  entityId: string;
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignedTo?: string;
}

interface ComplianceMonitoringProps {
  onAlertStatusChange: (alertId: string, status: MonitoringAlert['status']) => Promise<void>;
  onError: (error: Error) => void;
}

export const ComplianceMonitoring: React.FC<ComplianceMonitoringProps> = ({
  onAlertStatusChange,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<MonitoringAlert | null>(null);
  const [filters, setFilters] = useState({
    severity: [] as MonitoringAlert['severity'][],
    type: [] as MonitoringAlert['type'][],
    status: [] as MonitoringAlert['status'][],
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        // TODO: Implement real-time alert fetching
        // Mock data for now
        const mockAlerts: MonitoringAlert[] = [
          {
            id: '1',
            severity: 'HIGH',
            type: 'KYC',
            entityType: 'INVESTOR',
            entityId: 'inv_123',
            message: 'Suspicious activity detected in KYC verification',
            details: {
              reason: 'Multiple verification attempts from different locations',
              attempts: 3,
              locations: ['US', 'UK', 'JP'],
            },
            timestamp: new Date(),
            status: 'NEW',
          },
          {
            id: '2',
            severity: 'MEDIUM',
            type: 'WALLET',
            entityType: 'INVESTOR',
            entityId: 'inv_456',
            message: 'Unusual wallet activity detected',
            details: {
              transactionVolume: '50000 USD',
              timeFrame: '1 hour',
              previousAverage: '5000 USD',
            },
            timestamp: new Date(Date.now() - 1800000),
            status: 'ACKNOWLEDGED',
            assignedTo: 'compliance_officer_1',
          },
        ];

        setAlerts(mockAlerts);
      } catch (error) {
        onError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    // Set up real-time updates
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const getSeverityColor = (severity: MonitoringAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-800 bg-red-100';
      case 'HIGH':
        return 'text-orange-800 bg-orange-100';
      case 'MEDIUM':
        return 'text-yellow-800 bg-yellow-100';
      case 'LOW':
        return 'text-green-800 bg-green-100';
    }
  };

  const getStatusColor = (status: MonitoringAlert['status']) => {
    switch (status) {
      case 'NEW':
        return 'text-red-800 bg-red-100';
      case 'ACKNOWLEDGED':
        return 'text-yellow-800 bg-yellow-100';
      case 'RESOLVED':
        return 'text-green-800 bg-green-100';
    }
  };

  const handleStatusChange = async (
    alert: MonitoringAlert,
    newStatus: MonitoringAlert['status']
  ) => {
    try {
      await onAlertStatusChange(alert.id, newStatus);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id ? { ...a, status: newStatus } : a
        )
      );
    } catch (error) {
      onError(error as Error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Real-Time Monitoring
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Active monitoring of compliance-related activities and alerts.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(
                    alerts.reduce((acc, alert) => {
                      const key = alert.status;
                      acc[key] = (acc[key] || 0) + 1;
                      return acc;
                    }, {} as Record<MonitoringAlert['status'], number>)
                  ).map(([status, count]) => (
                    <div
                      key={status}
                      className="bg-white overflow-hidden shadow rounded-lg"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {status} Alerts
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {count}
                        </dd>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          Severity
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Type
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
                          Message
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
                      {alerts.map((alert) => (
                        <tr
                          key={alert.id}
                          className={
                            alert.status === 'NEW'
                              ? 'bg-red-50'
                              : undefined
                          }
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {alert.type}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {alert.entityType}
                            </span>
                            <span className="ml-2">{alert.entityId}</span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {alert.message}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                alert.status
                              )}`}
                            >
                              {alert.status}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => setSelectedAlert(alert)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </button>
                            {alert.status === 'NEW' && (
                              <button
                                onClick={() =>
                                  handleStatusChange(alert, 'ACKNOWLEDGED')
                                }
                                className="ml-4 text-yellow-600 hover:text-yellow-900"
                              >
                                Acknowledge
                              </button>
                            )}
                            {alert.status === 'ACKNOWLEDGED' && (
                              <button
                                onClick={() =>
                                  handleStatusChange(alert, 'RESOLVED')
                                }
                                className="ml-4 text-green-600 hover:text-green-900"
                              >
                                Resolve
                              </button>
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
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">Alert Details</h3>
              <button
                onClick={() => setSelectedAlert(null)}
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
              <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
                {JSON.stringify(selectedAlert.details, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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