/**
 * Token Testing Page
 * 
 * A page component that wraps the token test utility
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TokenTestUtility from './TokenTestUtility';
import TokenPageLayout from '@/components/tokens/layout/TokenPageLayout';
import TokenNavigation from '@/components/tokens/components/TokenNavigation';

const TokenTestingPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  if (!projectId) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <h1 className="text-lg font-medium">Project ID Required</h1>
          <p>Please select a project to use the token testing utility.</p>
        </div>
      </div>
    );
  }
  
  const navigate = useNavigate();
  return (
    <TokenPageLayout
      title="Token JSON Editor"
      description="Create, update and remove tokens using our JSON editor"
    >
      <p className="text-gray-500 mb-8">
        This utility allows you to create, update and remove tokens using our JSON editor.
        Edit the JSON template and submit to perform operations.
      </p>
      <TokenTestUtility />
    </TokenPageLayout>
  );
};

export default TokenTestingPage;