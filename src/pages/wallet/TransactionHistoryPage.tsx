import React from "react";
import { EnhancedWalletInterface } from "@/components/wallet/EnhancedWalletInterface";

/**
 * Transaction History Page
 * Dedicated page for viewing transaction history
 */
const TransactionHistoryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedWalletInterface defaultTab="history" />
    </div>
  );
};

export default TransactionHistoryPage;
