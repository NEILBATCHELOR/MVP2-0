import React from "react";
import { EnhancedWalletInterface } from "@/components/wallet/EnhancedWalletInterface";

/**
 * Enhanced Transfer Page
 * Dedicated page for blockchain transfers with real integration
 */
const EnhancedTransferPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedWalletInterface defaultTab="transfer" />
    </div>
  );
};

export default EnhancedTransferPage;
