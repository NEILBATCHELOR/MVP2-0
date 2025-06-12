**MVP Onboarding Specification**

Below is a detailed MVP Onboarding Specification for the Chain Capital
platform, designed to outline the minimum viable features and processes
required for onboarding investors and issuers. This specification is
informed by the provided image attachment descriptions of two detailed
flowcharts: one illustrating the investor onboarding process and another
detailing the issuer onboarding and issuance workflow. The spec ensures
compliance, security, and a user-friendly experience, forming a
foundation for future enhancements.

**1. Introduction and Overview**

The MVP Onboarding Specification defines the essential features and
workflows for onboarding investors and issuers onto the Chain Capital
platform, a blockchain-based financial system. The primary objectives
are to:

Ensure **compliance** with regulatory requirements (e.g., KYC/AML).

Maintain **security** through identity verification, wallet compliance,
and policy enforcement.

Provide a **user-friendly experience** for all participants.

The onboarding process is divided into two main workflows:

**Investor Onboarding**: Enables investors to register, complete
compliance checks, set up wallets, and qualify to invest in tokenised
projects.

**Issuer Onboarding**: Allows issuers to register, complete compliance
checks, configure compliance rules, and prepare for token issuance.

This specification is based on detailed process diagrams, ensuring
alignment with the platform[']{dir="rtl"}s requirements and stakeholder
interactions.

**2. User Roles and Responsibilities**

The onboarding process involves multiple roles, each with distinct
responsibilities:

**Investor**: Registers an account, submits KYC/AML details, uploads
documents, sets up a wallet, and completes qualification to invest.

**Issuer**: Registers an organisation, provides asset details and
documentation, initiates SPV setup, configures investor qualification
workflows, and confirms go-live readiness.

**ChainCapital Platform**: Manages onboarding workflows, validates
submissions, integrates third-party services, and facilitates blockchain
interactions.

**Compliance Agent**: Validates KYC/AML details, performs document
compliance checks, and approves asset and investor profiles.

**Legal Advisor**: Confirms the legal framework for SPV structuring and
issuance compliance.

**Guardian**: Oversees policy enforcement and ensures wallet and
compliance integration (includes subsystems like
GuardianPolicyEnforcement and GuardianWallet).

**Inc. Notification System**: Sends real-time updates to users about
onboarding progress.

**Guardian/Blockchain**: Provides the infrastructure for wallet
creation, ONCHAINID deployment and verification

**3. Investor Onboarding Process**

The investor onboarding process is a sequential workflow ensuring
compliance and readiness to invest. Below are the detailed steps:

**3.1 Registration**

- **Description**: The investor begins by creating an account.

- **Actions**:

  - Investor enters email and password on the registration page.

  - AUTH confirms account creation and sends a 6-digit verification code
    to the email.

  - Investor verifies email by entering the code, completing
    registration.

**3.2 Login and Dashboard Access**

- **Description**: The investor logs in and accesses a personalised
  dashboard.

- **Actions**:

  - Investor logs in with email and password.

  - Issuer verifies login with the 6-digit code sent during registration
    (optional 2FA setup could be added later).

  - AUTH confirms email verification and provides dashboard access,
    displaying an \"Invest\" tab with a project list.

**3.3 Project Selection**

- **Description**: The investor selects a project to invest in.

- **Actions**:

  - Investor views the \"Invest\" tab and project list.

  - Investor selects a project and clicks \"Get Qualified and Invest\"
    to view the project overview and proceed.

**3.4 KYC/AML**

- **Description**: The investor completes identity verification.

- **Actions**:

  - Investor selects investor type (Individual/Institution) and country
    of residency.

  - Investor reviews and accepts disclaimers and agreements configured
    by the Issuer.

  - Investor submits KYC/AML details (e.g., name, address, nationality).

  - ChainCapital validates details via GuardianPolicyEnforcement.

  - ComplianceAgent and Issuer return KYC/AML status.

  - NotificationSystem informs the investor of the result (approved or
    additional info required).

**3.5 Wallet Setup**

- **Description**: The investor configures a blockchain wallet.

- **Actions**:

  - Investor chooses to connect an existing wallet or create an
    integrated wallet.

  - ChainCapital confirms wallet setup and submits details to
    GuardianWallet.

  - GuardianWallet enforces compliance and whitelist configuration.

  - NotificationSystem notifies the investor of wallet verification.

**3.6 Document Upload**

- **Description**: The investor submits required documents.

- **Actions**:

  - Investor uploads mandatory documents (e.g., ID, proof of address).

  - ChainCapital validates documents and shares them with
    ComplianceAgent and Issuer.

  - ComplianceAgent performs document compliance checks and returns
    results.

  - NotificationSystem notifies the investor of document approval or
    rejection.

**3.7 Submission and Verification**

- **Description**: The investor submits their profile for review.

- **Actions**:

  - Investor submits their completed investor profile.

  - ChainCapital shares the profile with Issuer for review.

  - Issuer performs final qualification, supported by
    GuardianPolicyEnforcement.

  - NotificationSystem notifies the investor of approval or rejection.

**3.8 Approval and Qualification**

- **Description**: The investor receives a blockchain-based identity.

- **Actions**:

  - 'ChainCapital' initiates ONCHAINID creation for the investor.

  - Blockchain deploys the ONCHAINID, confirming qualification.

  - NotificationSystem informs the investor of qualification completion.

**3.9 Ready to Invest**

- **Description**: The investor is enabled to participate in a project.

- **Actions**:

  - Investor returns to the project and clicks \"Invest.\"

  - ChainCapital confirms eligibility and enforces investment policies.

  - Investor participation in the tokenised project is enabled.

**4. Issuer Onboarding Process**

The issuer onboarding process prepares an issuer to launch a tokenised
asset. Below are the steps:

**4.1 Initial Onboarding and Account Setup**

- **Description**: The issuer registers and sets up their account.

- **Actions**:

  - Issuer registers account and inputs organisation details.

  - ChainCapital confirms account creation.

  - Issuer reviews and signs platform agreements.

  - ChainCapital provides dashboard access.

**4.2 Asset Preparation and Due Diligence**

(for a list of the document see detailed spec)

- **Description**: The issuer submits asset details for validation.

- **Actions**:

  - ChainCapital submits details for selected assets (e.g., valuations,
    ownership).

  - Issuer uploads required documentation .

  - ComplianceAgent validates asset details and documentation.

  - ChainCapital notifies Issuer of validation results (approved or
    additional verification needed).

**4.3 SPV Structuring and Legal Framework**

- **Description**: Chain Capital sets up a Special Purpose Vehicle
  (SPV/PCC) for issuer off-platform.

- **Actions**:

  - Issuer initiates SPV setup (off-platform).

  - Issuer submits documentation: (for a list of the document see
    detailed spec)

  - ChainCapital generates SPV agreements and disclosures.

  - LegalAdvisor confirms the legal framework.

  - ChainCapital notifies Issuer of SPV completion / readiness.

**4.4 Wallet Creation**

- **Description**: A dedicated wallet is created for issuance one per
  token type per project.

- **Actions**:

  - Issuer requests source wallet(s) creation per issuance.

  - ChainCapital generates wallet address(es) via GuardianWallet
    (supports multiple chains based on current Guardian capability).

  - Issuer confirms source wallet setup.

**4.5 Compliance Configuration**

- **Description**: The issuer configures compliance rules.

- **Actions**:

  - ChainCapital configures whitelists from source addresses.

  - ComplianceAgent auto-approves or requests whitelist approval.

  - ChainCapital confirms whitelist approval.

**4.6 Investor Qualification Workflow**

- **Description**: The issuer defines investor onboarding rules.

- **Actions**:

  - Issuer defines investor qualification workflows (these will be
    standard for HNWIs and Institutional only).

  - Guardian and ComplianceAgent integrate KYC/AML checks.

  - ChainCapital confirms investor qualification integration.

**4.7 Pre-Issuance Readiness**

- **Description**: The issuer prepares for token issuance.

- **Actions**:

  - ChainCapital confirms go-live readiness or missing prerequisite
    documents

**5. UI Requirements**

The user interface must be intuitive and aligned with the onboarding
workflows. Key screens include:

**5.1 Investor Screens**

**Registration Screen**: Email, password fields, terms checkbox,
\"Create Account\" button.

**Email Verification Screen**: 6-digit code input, \"Verify\" button.

**KYC/AML Form**: Dropdowns for investor type and country, document
upload fields, \"Submit\" button.

**Wallet Setup Interface**: Options to connect or create a wallet,
\"Confirm\" button.

**Dashboard**: Displays \"Invest\" tab, project list, and onboarding
progress.

**5.2 Issuer Screens**

**Account Setup Screen**: Fields for organisation details, agreement
checkbox, \"Register\" button.

**Asset Submission Screen**: Input fields for asset details, document
upload, \"Submit\" button.

**Wallet Configuration Screen**: Displays wallet address(es), whitelist
options.

**Dashboard**: Shows asset status, compliance reports, and investor
qualification settings.

**5.3 Common Elements**

**Notifications**: Real-time updates (e.g., \"KYC Approved,\" \"Wallet
Verified\").

**Branding**: Issuers can customise basic logos and colours.

**6. Compliance and Security Measures**

**KYC/AML**: Integrates with third-party services (e.g., Synaps) or
internal workflows for identity verification.

**Wallet Compliance**: GuardianWallet enforces whitelisting and
compliance checks.

**Data Security**: Encrypts sensitive data (e.g., KYC details) and uses
secure storage.

**Policy Enforcement**: GuardianPolicyEnforcement ensures regulatory
compliance.

**7. System Interactions and Integrations**

**Email Verification**: Uses an email service to send 6-digit codes.

**KYC/AML**: Integrates with compliance providers for validation.

**Wallet Management**: Supports GuardianWallet and external wallet
connections.

**Blockchain**: Deploys ONCHAINID and token contracts via blockchain
APIs.

**Notifications**: NotificationSystem sends real-time updates via email
or in-app messages.

**8. Testing and Validation**

**Test Cases**: Create scenarios for each onboarding step (e.g.,
successful KYC, wallet rejection).

**Compliance Checks**: Validate KYC/AML and wallet compliance
functionality.

**Usability Testing**: Conduct user acceptance testing with sample
investors and issuers.

**11. Omissions**

Document signing

Consistent on-chain identity standard expect for issuing an ONCHAINID
for compliant investors and issuers.

**10. Workflows**

**Investor**

sequenceDiagram

participant Investor

participant ChainCapital

participant Issuer

participant ComplianceAgent

participant Guardian

participant GuardianPolicyEnforcement

participant GuardianWallet

participant NotificationSystem

participant Blockchain

%% Step 1: Welcome and Registration

Investor-\>\>+ChainCapital: Enter email and password

ChainCapital\--\>\>Investor: Confirm account creation

Investor-\>\>+NotificationSystem: Verify email with 6-digit code

NotificationSystem\--\>\>Investor: Email verified

%% Step 2: Log In and Dashboard Access

Investor-\>\>+ChainCapital: Log in with email and password

ChainCapital\--\>\>Investor: Access personalised dashboard

Investor-\>\>+ChainCapital: View \"Invest\" tab and project list

%% Step 3: Project Overview

Investor-\>\>+ChainCapital: Select a project for details

ChainCapital\--\>\>Investor: Display project overview

Investor-\>\>+ChainCapital: Click \"Get Qualified and Invest\"

%% Step 4: Qualification Process

Investor-\>\>+ChainCapital: Select investor type
(Individual/Institution)

Investor-\>\>+ChainCapital: Select country of residency

Investor-\>\>+ChainCapital: Review and accept disclaimers and agreements

Investor-\>\>+ChainCapital: Submit KYC/AML details

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate investor details
and enforce compliance policies

GuardianPolicyEnforcement\--\>\>ChainCapital: Return KYC/AML status

ChainCapital\--\>\>Investor: Notify KYC result

%% Step 5: Wallet Setup

Investor-\>\>+ChainCapital: Proceed to wallet setup

Investor-\>\>+GuardianWallet: Connect existing wallet or create
integrated wallet

GuardianWallet\--\>\>Investor: Confirm wallet setup

Investor-\>\>+ChainCapital: Submit wallet details

ChainCapital-\>\>+GuardianPolicyEnforcement: Enforce wallet compliance
and whitelist configuration

GuardianPolicyEnforcement\--\>\>ChainCapital: Confirm wallet
verification

ChainCapital\--\>\>Investor: Notify wallet verification

%% Step 6: Document Upload

Investor-\>\>+ChainCapital: Upload mandatory documents (ID, proof of
address)

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate uploaded documents

GuardianPolicyEnforcement-\>\>+ComplianceAgent: Perform document
compliance checks

ComplianceAgent\--\>\>GuardianPolicyEnforcement: Approve or reject
documents

GuardianPolicyEnforcement\--\>\>ChainCapital: Return document
verification result

ChainCapital\--\>\>Investor: Notify document approval

%% Step 7: Submission and Verification

Investor-\>\>+ChainCapital: Submit investor profile

ChainCapital-\>\>+Issuer: Share profile for review

Issuer-\>\>+GuardianPolicyEnforcement: Perform final investor
qualification

GuardianPolicyEnforcement\--\>\>Issuer: Confirm investor qualification

Issuer\--\>\>ChainCapital: Approve investor qualification

ChainCapital-\>\>+NotificationSystem: Notify investor of approval

%% Step 8: Qualification and ONCHAINID Creation

ChainCapital-\>\>+GuardianPolicyEnforcement: Initiate ONCHAINID creation
for investor

GuardianPolicyEnforcement-\>\>+Blockchain: Deploy ONCHAINID for investor

Blockchain\--\>\>GuardianPolicyEnforcement: Confirm ONCHAINID creation

GuardianPolicyEnforcement\--\>\>ChainCapital: Confirm ONCHAINID
deployment

ChainCapital\--\>\>Investor: Notify investor of qualification completion

%% Step 9: Ready to Invest

Investor-\>\>+ChainCapital: Return to project and click \"Invest\"

ChainCapital-\>\>+GuardianPolicyEnforcement: Confirm investor\'s
eligibility and enforce investment policies

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve investor
participation

ChainCapital\--\>\>Investor: Enable participation in tokenised project

**Issuer**

sequenceDiagram

participant Issuer

participant ChainCapital

participant ComplianceAgent

participant LegalAdvisor

participant Guardian

participant GuardianPolicyEnforcement

participant GuardianWallet

participant Blockchain

%% Step 1: Initial Onboarding and Account Setup

Issuer-\>\>+ChainCapital: Register account and input organisation
details

ChainCapital\--\>\>Issuer: Confirm account creation

Issuer-\>\>+ChainCapital: Review and sign platform agreements

ChainCapital\--\>\>Issuer: Provide dashboard access

%% Step 2: Asset Preparation and Due Diligence

ComplianceAgent-\>\>+ChainCapital: Submit details for selected assets

ComplianceAgent-\>\>+ChainCapital: Upload required documentation (e.g.,
valuations, ownership)

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate asset details and
documentation

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve or request
additional verification

ChainCapital\--\>\>ComplianceAgent: Notify asset validation results

%% Step 3: SPV Structuring and Legal Framework (off-platform)

Issuer-\>\>+ChainCapital: Initiate SPV setup and configure structure

ChainCapital-\>\>+LegalAdvisor: Generate SPV agreements and disclosures

LegalAdvisor\--\>\>ChainCapital: Confirm legal framework

ChainCapital\--\>\>Issuer: Notify SPV setup completion

%% Step 4: Source Wallet Setup per Issuance

Issuer-\>\>+ChainCapital: Request source wallet creation per issuance

ChainCapital-\>\>+GuardianWallet: Generate dedicated source wallet per
issuance

GuardianWallet\--\>\>ChainCapital: Provide issuance wallet address(es)
potential multiple chains

ChainCapital\--\>\>Issuer: Confirm source wallet(s) are set up

ChainCapital-\>\>+GuardianWallet: Configure whitelists from source(s)
address(es)

Issuer\--\>\>GuardianPolicyEnforcement: Auto-Approve or request
whitelist approval

GuardianPolicyEnforcement\--\>\>ChainCapital: Confirm whitelist approval

%% Step 5: Investor Readiness and Compliance Verification

Issuer-\>\>+ChainCapital: Define investor qualification workflows
(criteria)

ChainCapital-\>\>+GuardianPolicyEnforcement: Integrate KYC/AML checks
for investors

GuardianPolicyEnforcement\--\>\>ChainCapital: Confirm investor
qualification integration

Issuer-\>\>+ChainCapital: Generate pre-issuance readiness report

ChainCapital\--\>\>Issuer: Deliver compliance and allocation report

Issuer-\>\>+ChainCapital: Confirm go-live readiness

Issuer-\>\>+GuardianWallet: Configure allowed secondary market
whitelists - allow investor transfers to markets

GuardianWallet\--\>\>Issuer: Confirm secondary market readiness

**Investor**![Image](media/image1.png){width="9.688042432195976in"
height="7.8750645231846015in"}

**Iss**![Image](media/image2.png){width="9.688042432195976in"
height="6.864261811023622in"}**uer**

**Screenshots Typical
App**![Image](media/image3.png){width="6.6929757217847765in"
height="6.485487751531059in"}

**Investor
Screenshots**![Image](media/image4.png){width="6.6929757217847765in"
height="5.045037182852144in"}![Image](media/image5.png){width="6.6929757217847765in"
height="3.9127832458442695in"}

**Issuer Scree**![Image](media/image6.png){width="6.6929757217847765in"
height="5.131210629921259in"}**nshots**![Image](media/image7.png){width="6.6929757217847765in"
height="5.774127296587927in"}

![Image](media/image8.png){width="6.6929757217847765in"
height="5.774127296587927in"}

![Image](media/image9.png){width="6.6929757217847765in"
height="3.503498468941382in"}**\
\
**

![Image](media/image10.png){width="6.6929757217847765in"
height="5.498055555555555in"}**\
**

![Image](media/image5.png){width="6.6929757217847765in"
height="4.084309930008749in"}**\
**

![Image](media/image11.png){width="6.6929757217847765in"
height="5.149955161854768in"}![Image](media/image12.png){width="6.6929757217847765in"
height="5.774127296587927in"}**\
**

![Image](media/image13.png){width="6.6929757217847765in"
height="5.142358923884514in"}![Image](media/image14.png){width="6.6929757217847765in"
height="4.221100174978128in"}
