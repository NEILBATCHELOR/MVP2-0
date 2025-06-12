import React, { createContext, useContext, useState, ReactNode } from "react";

interface OnboardingState {
  // Registration data
  organizationName: string;
  country: string;
  email: string;

  // Organization details
  legalName: string;
  registrationNumber: string;
  businessType: string;
  regulatedStatus: string;
  entityStructure: string;

  // Compliance data
  jurisdiction: string;
  riskScore: "low" | "medium" | "high";
  owners: Array<{
    id: string;
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    documentType: string;
    documentUploaded: boolean;
  }>;

  // Wallet data
  blockchain: string;
  walletAddress: string;
  isMultiSig: boolean;
  signatories: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

interface OnboardingContextType {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  resetState: () => void;
}

const initialState: OnboardingState = {
  // Registration data
  organizationName: "",
  country: "",
  email: "",

  // Organization details
  legalName: "",
  registrationNumber: "",
  businessType: "",
  regulatedStatus: "",
  entityStructure: "",

  // Compliance data
  jurisdiction: "",
  riskScore: "medium",
  owners: [
    {
      id: "1",
      fullName: "John Smith",
      dateOfBirth: "1980-05-15",
      nationality: "United States",
      documentType: "passport",
      documentUploaded: true,
    },
  ],

  // Wallet data
  blockchain: "ethereum",
  walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  isMultiSig: false,
  signatories: [
    {
      id: "1",
      name: "Primary Issuer",
      email: "issuer@example.com",
      role: "primary",
    },
  ],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<OnboardingState>(initialState);

  const updateState = (updates: Partial<OnboardingState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const resetState = () => {
    setState(initialState);
  };

  return (
    <OnboardingContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
