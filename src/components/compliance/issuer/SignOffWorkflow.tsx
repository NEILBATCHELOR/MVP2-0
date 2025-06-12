import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/hooks/shared/supabase/useSupabaseClient';
import type { SignOffWorkflow } from './types/documents';

interface SignOffWorkflowProps {
  documentId: string;
  onComplete?: () => void;
}

export const SignOffWorkflowComponent: React.FC<SignOffWorkflowProps> = ({
  documentId,
  onComplete,
}) => {
  const supabase = useSupabaseClient();
  const [workflow, setWorkflow] = useState<SignOffWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflow();
  }, [documentId]);

  const loadWorkflow = async () => {
    try {
      const { data, error } = await supabase
        .from('document_workflows')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error) throw error;
      setWorkflow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOff = async (userId: string) => {
    if (!workflow) return;

    try {
      const updatedSigners = [...workflow.completed_signers, userId];
      const isComplete = workflow.required_signers.every(signer => 
        updatedSigners.includes(signer)
      );

      const { error } = await supabase
        .from('document_workflows')
        .update({
          completed_signers: updatedSigners,
          status: isComplete ? 'completed' : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflow.id);

      if (error) throw error;

      if (isComplete && onComplete) {
        onComplete();
      }

      await loadWorkflow();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process sign-off');
    }
  };

  if (loading) return <div>Loading workflow...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!workflow) return <div>No workflow found</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Sign-off Workflow</h3>
      
      <div className="bg-white shadow rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status</span>
            <span className={`px-2 py-1 rounded text-sm ${
              workflow.status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : workflow.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
            </span>
          </div>

          {workflow.deadline && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Deadline</span>
              <span className="text-sm">
                {new Date(workflow.deadline).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Required Signers</h4>
            <div className="space-y-2">
              {workflow.required_signers.map((signer) => (
                <div 
                  key={signer}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm">{signer}</span>
                  {workflow.completed_signers.includes(signer) ? (
                    <span className="text-green-600">✓ Signed</span>
                  ) : (
                    <button
                      onClick={() => handleSignOff(signer)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Sign
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignOffWorkflowComponent;