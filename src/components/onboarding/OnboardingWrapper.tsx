import React, { ReactNode } from "react";
import { OnboardingProvider } from "./OnboardingContext";

interface OnboardingWrapperProps {
  children: ReactNode;
}

const OnboardingWrapper = ({ children }: OnboardingWrapperProps) => {
  return <OnboardingProvider>{children}</OnboardingProvider>;
};

export default OnboardingWrapper;
