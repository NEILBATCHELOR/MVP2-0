# Onboarding Components

## Overview
The Onboarding components manage the user onboarding experience, guiding users through registration, verification, setup, and initial configuration. These components create a structured, step-by-step onboarding flow.

## Components

### Core Onboarding Components
- **OnboardingFlow.tsx**: Main component that orchestrates the entire onboarding process.
- **OnboardingSteps.tsx**: Displays the onboarding steps and current progress.
- **OnboardingProgressBar.tsx**: Visual indicator of onboarding progress.
- **OnboardingWrapper.tsx**: Wrapper component for consistent styling across onboarding screens.
- **OnboardingLayout.tsx**: Layout component specific to onboarding screens.
- **OnboardingHome.tsx**: Landing page for the onboarding process.
- **OnboardingDashboard.tsx**: Dashboard overview of onboarding status and next steps.

### Step-Specific Components
- **WelcomeScreen.tsx**: Initial welcome screen with onboarding introduction.
- **RegistrationForm.tsx**: User registration form with validation.
- **OrganizationDetails.tsx**: Form for collecting organization information.
- **WalletSetup.tsx**: Component for setting up cryptocurrency wallets.
- **VerificationSetup.tsx**: Component for identity verification setup.
- **ComplianceDueDiligence.tsx**: Component for compliance and regulatory checks.
- **FinalReview.tsx**: Final review and confirmation of onboarding information.

### State Management
- **OnboardingContext.tsx**: Context provider for managing onboarding state.
- **index.ts**: Exports for onboarding components.

## Usage
These components create a multi-step onboarding flow for new users, guiding them through the required setup and verification processes. The flow is typically initiated when a new user registers and continues until all required onboarding steps are completed.

## Dependencies
- React
- UI component library
- Form validation
- Context API for state management
- Identity verification services