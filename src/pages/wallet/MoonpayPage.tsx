import React from "react";
import { EnhancedWalletInterface } from "@/components/wallet/EnhancedWalletInterface";

/**
 * Moonpay Integration Page
 * Dedicated page for fiat on/off ramp via Moonpay
 */
const MoonpayPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedWalletInterface defaultTab="moonpay" />
    </div>
  );
};

export default MoonpayPage;
