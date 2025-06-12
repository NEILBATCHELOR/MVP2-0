**UI Wireframe Outline: Issuer Onboarding Flow**

**Objective**

To provide a structured UI wireframe outline for the **Issuer Onboarding
Flow**, ensuring robust compliance enforcement, governance oversight,
and structured approvals before issuers proceed to token issuance.

**Primary Users**

**Issuer (SPV, Asset Owner, Investment Manager, Fund Manager)** --
Registers, provides documentation, and completes compliance
requirements.

**Compliance Agent (Legal/Regulatory Officer, Guardian Policy
Enforcement)** -- Reviews and approves issuer information and legal
documents.

**Guardian Wallet (Custodial Role)** -- Manages issuance wallet
creation, investor subscriptions, and post-issuance settlements.

**Multi-Signature Approvers (Legal Counsel, Compliance Officers,
Trustees, External Administrators)** -- Ensures structured governance
and risk management for issuers before approval.

**1. Issuer Onboarding Flow - Wireframe Breakdown**

**Screen 1: Welcome & Account Registration**

**Purpose:** Provide a clear entry point for issuers to register and
begin onboarding.

**Components:**

- **Header:** Platform branding & navigation (Sign In, Support)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Register as an Issuer"

  - **Input Fields:**

    - Organization Name (Text Input)

    - Country of Registration (Dropdown)

    - Business Email (Email Input)

    - Password & Confirm Password (Password Input)

    - Checkbox: Accept Terms & Conditions

  - **Primary CTA Button:** ["]{dir="rtl"}Create Account"

  - **Link to Login Page:** ["]{dir="rtl"}Already have an account? Sign
    in"

**Interactions:**

**Validation Rules:** Error handling for required fields

**Password Strength Meter**

**Email Verification Trigger (Redirects to next screen)**

**Screen 2: Email Verification & Two-Factor Authentication (2FA)**

**Purpose:** Ensure secure issuer registration with identity
verification.

**Components:**

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Verify Your Email & Set Up 2FA"

  - **Step 1: Email Verification**

    - Instructional Text: ["]{dir="rtl"}Enter the 6-digit verification
      code sent to your email."

    - Input Field: OTP Code (6-digit numeric input)

    - Resend Code Button

  - **Step 2: Two-Factor Authentication Setup**

    - QR Code for Authenticator App Setup

    - Backup Code Display for Recovery

    - Input Field: ["]{dir="rtl"}Enter the code from your authenticator
      app"

  - **Primary CTA Button:** ["]{dir="rtl"}Verify & Continue"

**Interactions:**

**Invalid Code Message (If incorrect code is entered)**

**Require 2FA on Future Logins**

**Screen 3: Organization Details & Legal Setup**

**Purpose:** Collect essential issuer details and legal structuring for
compliance verification.

**Components:**

**Header:** Progress Tracker (Step 2 of 5)

**Main Panel:**

**Title:** ["]{dir="rtl"}Provide Your Organisation Details"

**Input Fields:**

Company Legal Name (Text Input)

Registration Number (Text Input)

Business Type (Dropdown: Fund, SPV, Asset Manager)

Upload Incorporation Documents (File Upload - PDF, JPG, PNG)

Regulated and license details or unregulated

Client onboarding documentation

Company documents:

Commercial register extract / Certificate of incorporation/formation

Memorandum / Articles of association

Regulatory status

List of directors

Passport copies + proof of address of directors

Shareholder register

Passport copies + proof of address of shareholder with more than 10%
ownership

Latest financial statements

Additional information if the company is not regulated:

Written summary of the qualification, experience, background in managing
the assets

Description of the business of the company

Organisational chart

CV of key people mentioned in org chart

Brief description of how the company ensures AML/KYC functions

**Auto-Generated Checklist Panel:**

As each document is uploaded, an automated system identifies the
document type and updates a right-side notification panel.

The panel provides real-time verification status, required corrections,
and missing documents.

Includes icons for successfully uploaded, pending, and rejected
documents.

Enables compliance agents to review and approve submissions efficiently.

**Enhancements:**

- **New Input Fields:**

  - Legal Entity Structure Type (Dropdown: Sole Proprietor, Partnership,
    Corporation, Trust, Fund)

  - Issuer Type (Checkbox: Traditional Financial Entity, Digital Asset
    Issuer, Hybrid)

  - Issuer Governance Model (Dropdown: Board-Managed, Trustee-Managed,
    Decentralised Governance)

  - Disclosure of External Trustees, Administrators, or Legal
    Representatives (Text Box)

  - Risk Classification (Dropdown: Low, Medium, High -- Auto-determined)

- **New Feature:** **Auto-Sync with Guardian Compliance Checks**

  - Auto-classifies uploaded documents and flags missing or incorrect
    items.

  - Real-time issuer risk classification based on jurisdiction and legal
    complexity.

**Primary CTA Button:** ["]{dir="rtl"}Continue"\
**Secondary Button:** ["]{dir="rtl"}Save & Exit"

**Interactions:**

**File Validation Rules (Max file size, accepted formats)**

**Auto-Save Feature**

**Screen 4: Compliance & Due Diligence Submission**

**Purpose:** Capture regulatory compliance data before issuer approval.

**Components:**

- **Header:** Progress Tracker (Step 3 of 5)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Compliance & Due Diligence"

  - **Input Fields:**

    - Business Owner(s) Information (Full Name, Date of Birth,
      Nationality)

    - UBO (Ultimate Beneficial Owner) Identification (Passport Upload)

    - AML/KYC Compliance Documents (File Upload)

**Enhancements:**

- **New UI Component:** **Issuer Risk Scorecard (Auto-Generated)**

  - ✅ Low Risk: Auto-approved after compliance review

  - 🟡 Medium Risk: Requires additional compliance documentation

  - 🔴 High Risk: Multi-Signature Approval Required

- **New Input Fields:**

  - SPV Risk Disclosure Statement (Text Area)

  - Regulatory Jurisdiction Selection (Dropdown)

**Primary CTA Button:** ["]{dir="rtl"}Submit for Review"\
**Secondary Button:** ["]{dir="rtl"}Save & Exit"

**Interactions:**

Real-time Compliance API Integration (Guardian Policy Enforcement)

Dynamic Field Visibility (Different documents based on country
selection)

**Screen 5: SPV Wallet & Smart Contract Setup**

**Purpose:** Assign a dedicated wallet address and configure smart
contract roles.

- **Header:** Progress Tracker (Step 4 of 5)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Set Up Your Issuance Wallet"

  - **Blockchain Selection:** (Dropdown: Ethereum, Polygon, Avalanche)

  - **Auto-Generated Wallet Address:** (Read-only, Copyable)

  - **Wallet Role Selection:** (Dropdown: Primary Issuer, Multi-Sig
    Operator)

**Enhancements:**

- **New Feature:** Compliance-Based Wallet Activation

  - SPV wallet is **created but remains inactive** until compliance is
    fully approved.

  - Wallet status updates dynamically:

    - **Pending Activation** (Compliance Pending)

    - **Blocked -- Requires Review**

    - **Active -- Ready for Issuance**

- **New UI Component:** **Multi-Signature Wallet Setup**

  - Assign additional signatories (Trustees, Legal Representatives, Fund
    Administrators)

  - Dropdown for **Wallet Role Selection** (Primary Issuer, Multi-Sig
    Operator (approver), Trustee)

**Primary CTA Button:** ["]{dir="rtl"}Confirm & Proceed"

**Interactions:**

**Auto-Generate Wallet Address via API**

**Multi-Signature Wallet Option (Checkbox Enable)**

Screen 5 Notes:

Screen 5: SPV Wallet & Smart Contract Setup (Improvements)

📌 Enhancement: Introduce Compliance-Based Wallet Activation

- Action: SPV wallet should be created but remain inactive until
  compliance approval is finalised.

- New UI Component: Wallet Activation Dependencies Panel

  - If compliance is pending, wallet status = ["]{dir="rtl"}Pending
    Activation"

  - If compliance is rejected, wallet status = ["]{dir="rtl"}Blocked --
    Requires Review"

  - If fully compliant, wallet status = ["]{dir="rtl"}Active -- Ready
    for Issuance"

📌 Enhancement: Multi-Signature Wallet Setup for Institutional Issuers

- If an institutional issuer is selected, prompt multi-signature setup.

- Add ["]{dir="rtl"}Assign Additional Signatories" button with
  predefined roles:

  - Primary Issuer

  - Fund Administrator

  - Trustee

  - External Legal Representative (if applicable)

**Screen 6: Final Review & Approval Submission**

**Purpose:** Allow issuers to review all entered data before submitting
for approval.

**Components:**

- **Header:** Progress Tracker (Step 5 of 5)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Final Review & Submission"

  - **Summary Sections:**

    - Organisation Details (Read-only Preview)

    - Compliance Submissions (Read-only Preview)

    - Wallet Setup Summary

  - **Checkbox:** ["]{dir="rtl"}I confirm all details are accurate"

**Enhancements:**

- **New UI Component:** **Approval Timeline Tracker**

  - Displays onboarding review stages:

    1.  **Submitted**

    2.  **Under Review (Compliance Agent)**

    3.  **Guardian Policy Enforcement Validation**

    4.  ✅ **Fully Approved** OR ❌ **Rejected (With Reason & Re-Submit
        Option)**

  - **Notification System** triggers issuer updates on approval
    progress.

**Primary CTA Button:** ["]{dir="rtl"}Submit for Approval"

**Interactions:**

Redirect to Approval Pending Screen (Issuer Dashboard View)

Notification Sent to Compliance Agent

Screen 6 Notes:

Screen 6: Final Review & Approval Submission (Improvements)

📌 Enhancement: Explicit Compliance Review & Approval Workflow

- New UI Component: Approval Timeline Tracker

  - Shows compliance review stages:

    1.  Submitted

    2.  Under Review (Compliance Agent)

    3.  Guardian Policy Enforcement Validation

    4.  ✅ Fully Approved OR ❌ Rejected (With Reason & Re-Submit
        Option)

  - Notification System triggers issuer updates on approval progress.

**Enhance Issuer Dashboard with Post-Onboarding Monitoring**

**Purpose:** Provide issuers with compliance tracking and onboarding
status monitoring.

**New UI Component:** **Issuer Dashboard**

**Onboarding Completion Progress (Bar Indicator)**

**Compliance Review Panel:** Guardian & Legal Approval Status

**SPV Wallet Status:** Pending Setup, Ready, Activated

**Upcoming Tasks:** Required documentation, pending approvals,
compliance status

**Primary CTA:** ["]{dir="rtl"}Request Compliance Review" \|
["]{dir="rtl"}Proceed to Issuance"
