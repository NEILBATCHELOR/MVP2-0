import React from "react";
import { EnhancedWalletInterface } from "@/components/wallet/EnhancedWalletInterface";

/**
 * Enhanced Swap Page
 * Dedicated page for Uniswap V4 swaps with hooks and MEV protection
 */
const EnhancedSwapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedWalletInterface defaultTab="swap" />
    </div>
  );
};

export default EnhancedSwapPage;
