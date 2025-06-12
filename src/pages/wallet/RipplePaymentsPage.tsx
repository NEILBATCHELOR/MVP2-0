import React from "react";
import { EnhancedWalletInterface } from "@/components/wallet/EnhancedWalletInterface";

/**
 * Ripple Payments Page
 * Dedicated page for cross-border payments via Ripple ODL
 */
const RipplePaymentsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedWalletInterface defaultTab="ripple" />
    </div>
  );
};

export default RipplePaymentsPage;
