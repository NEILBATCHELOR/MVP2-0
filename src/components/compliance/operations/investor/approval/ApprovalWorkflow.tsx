import React, { useState, useEffect } from 'react';
import type { ApprovalWorkflow as ApprovalWorkflowType } from '../../types';

interface ApprovalWorkflowProps {
  investorId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  onApprovalComplete: (workflow: ApprovalWorkflowType) => void;
  onError: (error: Error) => void;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  investorId,
  riskLevel,
  onApprovalComplete,
  onError,
}) => {
  const [workflow, setWorkflow] = useState<ApprovalWorkflowType | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const initializeWorkflow = async () => {
      try {
        // Determine required approvals based on risk level
        const requiredApprovals = riskLevel === 'HIGH' ? 2 : 1;

        const newWorkflow: ApprovalWorkflowType = {
          id: crypto.randomUUID(),
          entityId: investorId,
          entityType: 'INVESTOR',
          status: 'PENDING',
          requiredApprovals,
          currentApprovals: 0,
          approvers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          riskLevel: riskLevel,
        };

        setWorkflow(newWorkflow);
      } catch (error) {
        onError(error as Error);
      }
    };

    initializeWorkflow();
  }, [investorId, riskLevel]);

  const handleApproval = async (approved: boolean) => {
    if (!workflow) return;

    try {
      const updatedWorkflow: ApprovalWorkflowType = {
        ...workflow,
        approvers: [
          ...workflow.approvers,
          {
            userId: 'current-user', // TODO: Get from auth context
            status: approved ? 'APPROVED' : 'REJECTED',
            timestamp: new Date(),
            comments: comment,
          },
        ],
        currentApprovals: approved
          ? workflow.currentApprovals + 1
          : workflow.currentApprovals,
        status:
          approved && workflow.currentApprovals + 1 >= workflow.requiredApprovals
            ? 'APPROVED'
            : !approved
            ? 'REJECTED'
            : 'IN_PROGRESS',
        updatedAt: new Date(),
      };

      setWorkflow(updatedWorkflow);
      onApprovalComplete(updatedWorkflow);
    } catch (error) {
      onError(error as Error);
    }
  };

  if (!workflow) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Approval Workflow
        </h3>
        
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                workflow.status === 'APPROVED'
                  ? 'bg-green-100 text-green-800'
                  : workflow.status === 'REJECTED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {workflow.status}
            </span>
          </div>

          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Required Approvals: {workflow.requiredApprovals}
            </span>
          </div>

          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Current Approvals: {workflow.currentApprovals}
            </span>
          </div>
        </div>

        {workflow.approvers.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900">Approval History</h4>
            <div className="mt-2 space-y-4">
              {workflow.approvers.map((approver, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-gray-50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {approver.userId}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        approver.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {approver.status}
                    </span>
                  </div>
                  {approver.comments && (
                    <p className="text-sm text-gray-500">{approver.comments}</p>
                  )}
                  {approver.timestamp && (
                    <p className="text-xs text-gray-400">
                      {approver.timestamp.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {workflow.status === 'PENDING' || workflow.status === 'IN_PROGRESS' ? (
          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700"
              >
                Comments
              </label>
              <textarea
                id="comment"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleApproval(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleApproval(false)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reject
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};