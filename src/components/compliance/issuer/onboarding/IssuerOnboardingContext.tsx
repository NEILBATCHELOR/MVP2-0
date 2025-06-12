import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface Organization {
  name: string;
  countryOfRegistration: string;
  businessEmail: string;
  legalName: string;
  registrationNumber: string;
  businessType: string;
  regulatoryStatus: string;
  entityStructure: string;
  countryJurisdiction: string;
  issuerType: string;
  governanceModel: string;
  externalTrustees: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: "not_uploaded" | "uploaded" | "pending_review" | "verified";
  required: boolean;
  file?: File;
}

interface Compliance {
  uboVerification: boolean;
  riskClassification: "low" | "medium" | "high";
  jurisdiction: string;
  kycAmlStatus: string;
  riskDisclosureStatement: string;
}

interface WalletConfig {
  blockchain: string;
  walletAddress: string;
  multiSignatureEnabled: boolean;
  signatories: Array<{
    name: string;
    email: string;
    role: string;
  }>;
}

interface Signatory {
  name: string;
  address: string;
}

interface Wallet {
  address: string;
  isActivated: boolean;
  isMultiSig: boolean;
  signatories?: Signatory[];
  threshold?: number;
}

interface IssuerOnboardingState {
  organization: Organization;
  documents: Document[];
  compliance: Compliance;
  walletConfig: WalletConfig;
  wallet: Wallet;
  currentStep: number;
  contactPersonnel: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    isPrimaryContact: boolean;
  }>;
}

interface IssuerOnboardingContextType {
  state: IssuerOnboardingState;
  isDevelopmentMode: boolean;
  toggleDevelopmentMode: () => void;
  updateOrganization: (data: Partial<Organization>) => void;
  updateDocuments: (documents: Document[]) => void;
  uploadDocument: (documentId: string, file: File) => void;
  updateCompliance: (data: Partial<Compliance>) => void;
  updateWalletConfig: (data: Partial<WalletConfig>) => void;
  updateWallet: (data: Partial<Wallet>) => void;
  updateContactPersonnel: (contactPersonnel: IssuerOnboardingState['contactPersonnel']) => void;
  addSignatory: (signatory: { name: string; email: string; role: string }) => void;
  nextStep: () => void;
  prevStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
}

const initialState: IssuerOnboardingState = {
  organization: {
    name: "",
    countryOfRegistration: "",
    businessEmail: "",
    legalName: "",
    registrationNumber: "",
    businessType: "",
    regulatoryStatus: "",
    entityStructure: "",
    countryJurisdiction: "",
    issuerType: "",
    governanceModel: "",
    externalTrustees: "",
  },
  documents: [
    { id: "cert-incorp", name: "Certificate of Incorporation", type: "incorporation", status: "not_uploaded", required: true },
    { id: "articles", name: "Articles of Association", type: "association", status: "not_uploaded", required: true },
    { id: "directors", name: "List of Directors", type: "directors", status: "not_uploaded", required: true },
    { id: "shareholders", name: "Shareholder Register", type: "shareholders", status: "not_uploaded", required: true },
    { id: "financial", name: "Latest Financial Statements", type: "financial", status: "not_uploaded", required: false },
    { id: "regulatory", name: "Regulatory Status Documentation", type: "regulatory", status: "not_uploaded", required: false },
    { id: "risk-disclosure", name: "Risk Disclosure Statement", type: "risk-disclosure", status: "not_uploaded", required: true },
  ],
  compliance: {
    uboVerification: false,
    riskClassification: "medium",
    jurisdiction: "",
    kycAmlStatus: "",
    riskDisclosureStatement: "",
  },
  walletConfig: {
    blockchain: "Ethereum",
    walletAddress: "",
    multiSignatureEnabled: false,
    signatories: [],
  },
  wallet: {
    address: "",
    isActivated: false,
    isMultiSig: false,
    signatories: [],
    threshold: 1,
  },
  currentStep: 0,
  contactPersonnel: [],
};

const STEP_ROUTES = {
  "/compliance/issuer/onboarding/registration": 0,
  "/compliance/issuer/onboarding/organization-details": 1,
  "/compliance/issuer/onboarding/wallet-setup": 2,
  "/compliance/issuer/onboarding/review": 3,
} as const;

const STEP_TO_ROUTE = {
  0: "/compliance/issuer/onboarding/registration",
  1: "/compliance/issuer/onboarding/organization-details",
  2: "/compliance/issuer/onboarding/wallet-setup",
  3: "/compliance/issuer/onboarding/review",
} as const;

const IssuerOnboardingContext = createContext<IssuerOnboardingContextType | undefined>(undefined);

export const IssuerOnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<IssuerOnboardingState>(initialState);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Update current step based on URL
  useEffect(() => {
    const currentPath = location.pathname;
    const stepNumber = STEP_ROUTES[currentPath as keyof typeof STEP_ROUTES];
    
    if (stepNumber !== undefined && stepNumber !== state.currentStep) {
      setState(prev => ({ ...prev, currentStep: stepNumber }));
    }
  }, [location.pathname, state.currentStep]);

  const updateOrganization = (data: Partial<Organization>) => {
    setState((prev) => ({
      ...prev,
      organization: { ...prev.organization, ...data },
    }));
  };

  const updateDocuments = (documents: Document[]) => {
    setState((prev) => ({
      ...prev,
      documents,
    }));
  };

  const uploadDocument = (documentId: string, file: File) => {
    setState((prev) => {
      // Update documents array
      const updatedState: IssuerOnboardingState = {
        ...prev,
        documents: prev.documents.map((doc) =>
          doc.id === documentId
            ? { ...doc, file, status: "uploaded" as "not_uploaded" | "uploaded" | "pending_review" | "verified" }
            : doc
        ),
      };
      
      // If the document is a risk disclosure statement, update the compliance object as well
      if (documentId === "risk-disclosure") {
        updatedState.compliance = {
          ...updatedState.compliance,
          riskDisclosureStatement: file.name,
        };
      }
      
      return updatedState;
    });
  };

  const updateCompliance = (data: Partial<Compliance>) => {
    setState((prev) => ({
      ...prev,
      compliance: { ...prev.compliance, ...data },
    }));
  };

  const updateWalletConfig = (data: Partial<WalletConfig>) => {
    setState((prev) => ({
      ...prev,
      walletConfig: { ...prev.walletConfig, ...data },
    }));
  };

  const updateWallet = (data: Partial<Wallet>) => {
    setState((prev) => ({
      ...prev,
      wallet: { ...prev.wallet, ...data },
      // For backward compatibility, also update walletConfig
      walletConfig: {
        ...prev.walletConfig,
        walletAddress: data.address || prev.walletConfig.walletAddress,
        multiSignatureEnabled: data.isMultiSig !== undefined ? data.isMultiSig : prev.walletConfig.multiSignatureEnabled,
      }
    }));
  };

  const updateContactPersonnel = (contactPersonnel: IssuerOnboardingState['contactPersonnel']) => {
    setState((prev) => ({
      ...prev,
      contactPersonnel,
    }));
  };

  const addSignatory = (signatory: { name: string; email: string; role: string }) => {
    setState((prev) => ({
      ...prev,
      walletConfig: {
        ...prev.walletConfig,
        signatories: [...prev.walletConfig.signatories, signatory],
      },
    }));
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < Object.keys(STEP_TO_ROUTE).length) {
      const route = STEP_TO_ROUTE[step as keyof typeof STEP_TO_ROUTE];
      navigate(route);
    }
  };

  const nextStep = () => {
    const nextStepNumber = state.currentStep + 1;
    if (nextStepNumber < Object.keys(STEP_TO_ROUTE).length) {
      goToStep(nextStepNumber);
    }
  };

  const prevStep = () => {
    const prevStepNumber = Math.max(0, state.currentStep - 1);
    goToStep(prevStepNumber);
  };
  
  // Alias for prevStep to maintain compatibility with both naming conventions
  const previousStep = prevStep;

  const toggleDevelopmentMode = () => {
    setIsDevelopmentMode(prev => !prev);
  };

  return (
    <IssuerOnboardingContext.Provider
      value={{
        state,
        isDevelopmentMode,
        toggleDevelopmentMode,
        updateOrganization,
        updateDocuments,
        uploadDocument,
        updateCompliance,
        updateWalletConfig,
        updateWallet,
        updateContactPersonnel,
        addSignatory,
        nextStep,
        prevStep,
        previousStep,
        goToStep,
      }}
    >
      {children}
    </IssuerOnboardingContext.Provider>
  );
};

export const useIssuerOnboarding = () => {
  const context = useContext(IssuerOnboardingContext);
  if (context === undefined) {
    throw new Error("useIssuerOnboarding must be used within an IssuerOnboardingProvider");
  }
  return context;
};

export default IssuerOnboardingContext;