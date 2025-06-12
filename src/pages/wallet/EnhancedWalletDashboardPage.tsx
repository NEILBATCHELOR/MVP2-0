import React from "react";
import { EnhancedWalletInterface } from "@/components/wallet/EnhancedWalletInterface";

/**
 * Enhanced Wallet Dashboard Page
 * Uses the real EnhancedWalletInterface with blockchain integration
 * Replaces the old mock data dashboard
 */
const EnhancedWalletDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedWalletInterface defaultTab="transfer" />
    </div>
  );
};

export default EnhancedWalletDashboardPage;
