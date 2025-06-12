**UI Wireframe Outline: Investor Onboarding Flow**

**Objective**

To create a structured **UI wireframe outline** for the **Investor
Onboarding Flow**, detailing the key screens, layout, and interactions
necessary to guide the development of a high-fidelity prototype. This
flow ensures compliance enforcement, risk management, and structured
governance approvals before investors gain access to investment
opportunities.

**Primary Users**

**Investor (Individual, Institutional, Corporate, Trust)** -- Registers,
provides documentation, and completes compliance requirements.

**Compliance Agent (Legal/Regulatory Officer, Guardian Policy
Enforcement)** -- Reviews and approves investor information and KYC/AML
documentation.

**Guardian Wallet (Custodial Role)** -- Manages investor wallet
creation, fund verification, and post-onboarding compliance checks.

**Multi-Signature Approvers (Legal Counsel, Compliance Officers,
Trustees, Fund Administrators)** -- Ensures structured governance and
risk assessment for investor onboarding.

**1. Investor Onboarding Flow - Wireframe Breakdown**

**Screen 1: Welcome & Account Registration**

**Purpose:** Provide a seamless entry point for investors to register
and begin onboarding.

**Components:**

- **Header:** Platform branding & navigation (Sign In, Support)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Register as an Investor"

  - **Input Fields:**

    - Full Name (Text Input)

    - Investor Type (Dropdown: Individual, Joint Account, Corporate,
      Trust, Institutional Fund)

    - Business Email (Email Input)

    - Password & Confirm Password (Password Input)

    - Country of Residence (Dropdown)

    - Checkbox: Accept Terms & Conditions

  - **Primary CTA Button:** ["]{dir="rtl"}Create Account"

  - **Link to Login Page:** ["]{dir="rtl"}Already have an account? Sign
    in"

**Interactions:**

**Validation Rules:** Error handling for required fields

**Password Strength Meter**

**Email Verification Trigger** (Redirects to next screen)

**Screen 2: Email Verification & Two-Factor Authentication (2FA)**

**Purpose:** Ensure that only legitimate investors proceed to onboarding
and enforce secure account access with identity verification.

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

**Auto-Proceed on Correct Entry**

**Require 2FA on Future Logins**

**Screen 3: Investor Profile & Qualification**

**Purpose:** Capture essential investor details for compliance and
eligibility checks.

- **Header:** Progress Tracker (Step 2 of 6)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Investor Profile & Qualification"

  - **Input Fields:**

    - Investor Type (Dropdown: Individual, Institutional)

    - Accreditation Status (Dropdown: Accredited, Non-Accredited)

    - Investment Experience (Dropdown: Beginner, Intermediate, Expert)

**Enhancements:**

- **New Input Fields:**

  - Investor Accreditation Type (Dropdown: High-Net-Worth,
    Institutional, Regulated Fund, Retail)

  - Investment Experience (Dropdown: Low, Medium, High)

  - Tax Residency Declaration (Dropdown & Form Input for Tax Compliance)

  - Guardian Compliance Pre-Check (Dynamic Message: Approved, Pending
    Review, Rejected)

- **New Feature:** **Auto-Sync with Guardian Compliance Checks**

  - Flags incomplete or high-risk profiles for **manual compliance
    review.**

**Primary CTA Button:** ["]{dir="rtl"}Continue"\
**Secondary Button:** ["]{dir="rtl"}Save & Exit"

**Interactions:**

**Auto-Save Feature**

**Screen 4: KYC & AML Verification**

**Purpose:** Capture regulatory compliance data before investor
approval.

**Components:**

- **Header:** Progress Tracker (Step 3 of 6)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}KYC & AML Verification"

  - **Document Submission Fields:**

    - Government-Issued ID (File Upload: Passport, National ID)

    - Proof of Address (File Upload: Utility Bill, Bank Statement)

    - Source of Wealth Statement (File Upload, Text Input)

**Enhancements:**

- **New UI Component:** **Investor Risk Scorecard (Auto-Generated)**

  - ✅ Low Risk: Auto-approved after compliance review

  - 🟡 Medium Risk: Requires additional compliance documentation

  - 🔴 High Risk: Multi-Signature Approval Required

- **New Input Fields:**

  - Source of Wealth Declaration (Dropdown & Text Input)

  - Regulatory Jurisdiction Selection (Dropdown)

  - UBO (Ultimate Beneficial Owner) Identification (Required for
    Corporate & Institutional Investors)

**Primary CTA Button:** ["]{dir="rtl"}Submit for Verification"\
**Secondary Button:** ["]{dir="rtl"}Save & Exit"

**Interactions:**

Real-time Compliance API Integration (Guardian Policy Enforcement)

Dynamic Field Visibility (Different documents based on investor type &
jurisdiction)

Status Notifications for Approval or Rejection

**Screen 5: Wallet Setup & Compliance Approval**

**Purpose:** Assign a dedicated investment wallet and enforce
compliance-based activation.

**Components:**

- **Header:** Progress Tracker (Step 4 of 6)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Set Up Your Investment Wallet"

  - **Options:**

    - Connect an Existing Wallet (MetaMask, Ledger, WalletConnect)

    - Create a New Guardian Wallet (Auto-generated address)

  - **Wallet Address Display (If Connected)**

**Enhancements:**

- **New UI Component:** **Wallet Activation Dependencies Panel**

  - Wallet status updates dynamically:

    - **Pending Activation** (Compliance Pending)

    - **Blocked -- Requires Review**

    - **Active -- Ready for Investment**

- **New UI Component:** **Multi-Signature Wallet Setup for Institutional
  Investors**

  - Assign additional signatories (Fund Managers, Trustees, Legal
    Representatives)

  - Dropdown for **Wallet Role Selection** (Primary Investor (Owner),
    Multi-Sig Operator (Approver Agent))

**Primary CTA Button:** ["]{dir="rtl"}Confirm & Proceed"

**Interactions:**

**Auto-Generate Wallet Address via API**

**Multi-Signature Wallet Option (Checkbox Enable)**

**Live Connection Status Indicator**

**Screen 6: Approval Pending Screen (Investor Dashboard View)**

**Purpose:** Provide transparency on compliance review and investment
readiness.

**Components:**

- **Header:** ["]{dir="rtl"}Investor Approval Dashboard"

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Pending Investor Applications"

  - **Investor Table View:**

    - Investor Name

    - Accreditation Status

    - KYC/AML Compliance Status

    - Investment Experience

    - Date Submitted

  - **Action Buttons for Each Investor:**

    - **Approve Investor** (Green Button) → Grants investment
      permissions

    - **Block Investor** (Yellow Button) → Restricts access, pending
      review

    - **Reject Investor** (Red Button) → Provides rejection reason and
      notifies investor

  - **Bulk Actions Dropdown:**

    - Approve Multiple Investors

    - Block Multiple Investors

    - Reject Multiple Investors (Requires Reason Input)

**Enhancements:**

**New UI Component:** **Approval Timeline Tracker**

Displays investor approval stages:

**Submitted**

**Under Review (Compliance Agent)**

**Automated (Guardian Policy Enforcement) Validation**

✅ **Fully Approved** OR ❌ **Rejected (With Reason & Re-Submit
Option)**

**Notification System** triggers investor updates on approval progress.

**New Feature:** **Role-Based Access Control for Approving Investors**

Only authorised issuer roles (Issuer Owner, Compliance Officer) can
**approve, EDD (Enhanced DD), or reject investors.**

**Action Panel Updates:**

Approve Investor (Green Button) → Grants investment permissions

Compliance Review Investor (Yellow Button) → Requires compliance review
before approval

Reject Investor (Red Button) → Requires reason input and investor
notification

**Interactions:**

**Dynamic Status Update:** Changes investor status in real-time

**Automated Notifications:** Investors receive an email upon status
change

**Issuer Role-Based Access Control:** Only authorised issuer roles can
take action

**New Investor Dashboard for Post-Onboarding Monitoring**

**Purpose:** Provide investors with compliance tracking and onboarding
status monitoring.

**New UI Component:** **Investor Dashboard**

**Onboarding Completion Progress (Bar Indicator)**

**Compliance Review Panel:** Guardian & Legal Approval Status

**Wallet Status:** Pending Setup, Ready, Activated

**Upcoming Tasks:** Required documentation, pending approvals,
compliance status

**Primary CTA:** ["]{dir="rtl"}Request Compliance Review" \|
["]{dir="rtl"}Proceed to Investment"
