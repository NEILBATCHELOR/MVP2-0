import React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import RegistrationForm from "./RegistrationForm";
import VerificationSetup from "./VerificationSetup";
import OrganizationDetails from "./OrganizationDetails";
import ComplianceDueDiligence from "./ComplianceDueDiligence";
import WalletSetup from "./WalletSetup";
import FinalReview from "./FinalReview";

const OnboardingFlow = () => {
  // Get the current location to help with relative paths
  const location = useLocation();
  
  return (
    <div className="onboarding-flow-container">
      <Routes>
        <Route path="/" element={<Navigate to="registration" replace />} />
        <Route path="registration" element={<RegistrationForm />} />
        <Route path="verification" element={<VerificationSetup />} />
        <Route path="organization" element={<OrganizationDetails />} />
        <Route path="compliance" element={<ComplianceDueDiligence />} />
        <Route path="wallet-setup" element={<WalletSetup />} />
        <Route path="review" element={<FinalReview />} />
      </Routes>
    </div>
  );
};

export default OnboardingFlow;