import React, { createContext, useContext, useState, ReactNode } from "react";

interface InvestorState {
  // Registration data
  fullName: string;
  investorType: string;
  email: string;
  country: string;

  // Profile data
  accreditationType: string;
  investmentExperience: string;
  taxResidency: string;
  taxId: string;
  riskTolerance: string;

  // KYC data
  documents: Array<{
    id: string;
    name: string;
    status: "pending" | "verified" | "rejected" | "not_uploaded";
    message?: string;
  }>;
  sourceOfWealth: string;
  sourceOfWealthDescription: string;
  riskScore: "low" | "medium" | "high";

  // Wallet data
  walletType: "create" | "connect";
  walletAddress: string;
  walletStatus: "pending" | "active" | "blocked";
  isMultiSig: boolean;
  signatories: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

interface InvestorContextType {
  state: InvestorState;
  updateState: (updates: Partial<InvestorState>) => void;
  resetState: () => void;
}

const initialState: InvestorState = {
  // Registration data
  fullName: "",
  investorType: "",
  email: "",
  country: "",

  // Profile data
  accreditationType: "",
  investmentExperience: "",
  taxResidency: "",
  taxId: "",
  riskTolerance: "",

  // KYC data
  documents: [
    {
      id: "id_document",
      name: "Government-Issued ID",
      status: "not_uploaded",
    },
    { id: "proof_address", name: "Proof of Address", status: "not_uploaded" },
    {
      id: "source_wealth",
      name: "Source of Wealth Statement",
      status: "not_uploaded",
    },
  ],
  sourceOfWealth: "",
  sourceOfWealthDescription: "",
  riskScore: "low",

  // Wallet data
  walletType: "create",
  walletAddress: "",
  walletStatus: "pending",
  isMultiSig: false,
  signatories: [],
};

const InvestorContext = createContext<InvestorContextType | undefined>(
  undefined,
);

export const InvestorProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<InvestorState>(initialState);

  const updateState = (updates: Partial<InvestorState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const resetState = () => {
    setState(initialState);
  };

  return (
    <InvestorContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </InvestorContext.Provider>
  );
};

export const useInvestor = () => {
  const context = useContext(InvestorContext);
  if (context === undefined) {
    throw new Error("useInvestor must be used within an InvestorProvider");
  }
  return context;
};
