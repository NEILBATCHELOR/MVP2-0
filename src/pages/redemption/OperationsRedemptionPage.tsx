'use client';

import React from 'react';
import { OperationsRedemptionForm } from '@/components/redemption';

const OperationsRedemptionPage: React.FC = () => {
  const handleSuccess = (redemption: any) => {
    console.log('Redemption request created:', redemption);
    // Could add a toast notification here
    alert('Redemption request created successfully!');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Operations: Create Redemption Request</h1>
          <p className="text-muted-foreground mt-2">
            Create redemption requests for any investor. No eligibility checks - all requests go directly to approval queue.
          </p>
        </div>
        
        <OperationsRedemptionForm 
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default OperationsRedemptionPage;