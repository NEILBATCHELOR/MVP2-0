import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react';
import { InvestorOnboardingState, InvestorData, ComplianceStatus, WalletStatus } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { OnboardingLayout } from '../components/OnboardingLayout';

type OnboardingAction =
  | { type: 'UPDATE_INVESTOR_DATA'; payload: Partial<InvestorData> }
  | { type: 'UPDATE_COMPLIANCE_STATUS'; payload: Partial<ComplianceStatus> }
  | { type: 'UPDATE_WALLET_STATUS'; payload: Partial<WalletStatus> }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'RESET_ONBOARDING' };

const initialState: InvestorOnboardingState = {
  currentStep: 1,
  steps: [
    {
      id: 'registration',
      title: 'Registration',
      description: 'Create your investor account',
      status: 'not_started',
      isRequired: true,
      component: React.lazy(() => import('../components/RegistrationForm')),
    },
    {
      id: 'profile',
      title: 'Investor Profile',
      description: 'Complete your investor profile',
      status: 'not_started',
      isRequired: true,
      component: React.lazy(() => import('../components/InvestorProfile')),
    },
    {
      id: 'kyc',
      title: 'Complete Tax Forms',
      description: 'Submit required tax documentation',
      status: 'not_started',
      isRequired: true,
      component: React.lazy(() => import('../components/KYCVerification')),
    },
    {
      id: 'wallet',
      title: 'Complete Documentation',
      description: 'Submit required documentation',
      status: 'not_started',
      isRequired: true,
      component: React.lazy(() => import('../components/WalletSetup')),
    },
  ],
  investorData: {
    fullName: '',
    businessEmail: '',
    investorType: '',
    countryOfResidence: '',
    accreditationType: '',
    investmentExperience: '',
    taxResidency: '',
    taxIdNumber: '',
    riskTolerance: '',
    investmentGoals: '',
    walletType: 'guardian',
    isMultiSigEnabled: false,
  },
  complianceStatus: {
    kycStatus: 'not_started',
    accreditationStatus: 'not_started',
    taxDocumentationStatus: 'not_started',
    walletVerificationStatus: 'not_started',
    overallProgress: 0,
  },
  walletStatus: {
    status: 'pending',
    guardianPolicyStatus: 'pending',
  },
};

interface OnboardingContextType {
  state: InvestorOnboardingState;
  formData: Record<string, any>;
  isDevelopmentMode: boolean;
  updateFormData: (data: Record<string, any>) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleDevelopmentMode: () => void;
  updateInvestorData: (data: Partial<InvestorData>) => void;
  updateComplianceStatus: (status: Partial<ComplianceStatus>) => void;
  updateWalletStatus: (status: Partial<WalletStatus>) => void;
  setCurrentStep: (step: number) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const onboardingReducer = (
  state: InvestorOnboardingState,
  action: OnboardingAction
): InvestorOnboardingState => {
  switch (action.type) {
    case 'UPDATE_INVESTOR_DATA':
      return {
        ...state,
        investorData: { ...state.investorData, ...action.payload },
      };
    case 'UPDATE_COMPLIANCE_STATUS':
      return {
        ...state,
        complianceStatus: { ...state.complianceStatus, ...action.payload },
      };
    case 'UPDATE_WALLET_STATUS':
      return {
        ...state,
        walletStatus: { ...state.walletStatus, ...action.payload },
      };
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'RESET_ONBOARDING':
      return initialState;
    default:
      return state;
  }
};

const STEP_ROUTES = {
  '/compliance/investor-onboarding/registration': 1,
  '/compliance/investor-onboarding/profile': 2,
  '/compliance/investor-onboarding/kyc': 3,
  '/compliance/investor-onboarding/wallet-setup': 4,
  '/compliance/investor-onboarding/dashboard': 5
} as const;

const STEP_TO_ROUTE = {
  1: '/compliance/investor-onboarding/registration',
  2: '/compliance/investor-onboarding/profile',
  3: '/compliance/investor-onboarding/kyc',
  4: '/compliance/investor-onboarding/wallet-setup',
  5: '/compliance/investor-onboarding/dashboard'
} as const;

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const location = useLocation();

  // Update current step based on URL
  useEffect(() => {
    const currentPathStep = STEP_ROUTES[location.pathname as keyof typeof STEP_ROUTES] || 1;
    if (currentPathStep !== state.currentStep) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: currentPathStep });
    }
  }, [location.pathname]);

  const updateInvestorData = useCallback((data: Partial<InvestorData>) => {
    dispatch({ type: 'UPDATE_INVESTOR_DATA', payload: data });
  }, []);

  const updateComplianceStatus = useCallback((status: Partial<ComplianceStatus>) => {
    dispatch({ type: 'UPDATE_COMPLIANCE_STATUS', payload: status });
  }, []);

  const updateWalletStatus = useCallback((status: Partial<WalletStatus>) => {
    dispatch({ type: 'UPDATE_WALLET_STATUS', payload: status });
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    const route = STEP_TO_ROUTE[step as keyof typeof STEP_TO_ROUTE];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  const nextStep = useCallback(() => {
    const currentPathStep = STEP_ROUTES[location.pathname as keyof typeof STEP_ROUTES] || 1;
    const nextStepNumber = currentPathStep + 1;
    const maxSteps = isDevelopmentMode ? 5 : 4;
    
    if (nextStepNumber <= maxSteps) {
      const nextRoute = STEP_TO_ROUTE[nextStepNumber as keyof typeof STEP_TO_ROUTE];
      if (nextRoute) {
        navigate(nextRoute);
      }
    }
  }, [navigate, location.pathname, isDevelopmentMode]);

  const prevStep = useCallback(() => {
    const currentPathStep = STEP_ROUTES[location.pathname as keyof typeof STEP_ROUTES] || 1;
    const prevStepNumber = Math.max(1, currentPathStep - 1);
    const prevRoute = STEP_TO_ROUTE[prevStepNumber as keyof typeof STEP_TO_ROUTE];
    if (prevRoute) {
      navigate(prevRoute);
    }
  }, [navigate, location.pathname]);

  const resetOnboarding = useCallback(() => {
    dispatch({ type: 'RESET_ONBOARDING' });
    navigate(STEP_TO_ROUTE[1]);
  }, [navigate]);

  const updateFormData = useCallback((data: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <OnboardingContext.Provider value={{
      state,
      formData,
      isDevelopmentMode,
      updateFormData,
      nextStep,
      prevStep,
      toggleDevelopmentMode: () => setIsDevelopmentMode(prev => !prev),
      updateInvestorData,
      updateComplianceStatus,
      updateWalletStatus,
      setCurrentStep,
      resetOnboarding,
    }}>
      <OnboardingLayout>
        {children}
      </OnboardingLayout>
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};