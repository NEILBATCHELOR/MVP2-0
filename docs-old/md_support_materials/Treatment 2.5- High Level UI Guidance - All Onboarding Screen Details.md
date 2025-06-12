**UI Design Brief: Issuer & Investor Onboarding Workflow**

**Objective**

To design an **Issuer & Investor Onboarding Dashboard** that enables
users to configure, manage, and execute onboarding workflows, investor
qualification, SPV setup, and compliance enforcement. The UI should be
intuitive, secure, and tailored to regulated financial professionals
managing tokenised securities.

**Target Audience**

**Issuers** -- Asset owners, investment managers, structured finance
professionals.

**Investors** -- Institutional and accredited investors participating in
tokenised asset offerings.

**Compliance Agents** -- AML/KYC and regulatory specialists overseeing
qualification.

**Placement Agents & Administrators** -- Intermediaries managing
subscriptions and investor access.

**Additional UI Details for Each Section**

**1. Role-Based Access & Dashboard Customisation**

**UI Considerations**

- **Primary Color Palette**: Dark navy blue, white, and silver
  highlights.

- **Navigation**: Left-side vertical navigation bar with expandable menu
  items.

- **Dashboard Layout**:

  - **Header Section**: User profile, notifications, search, and
    settings.

  - **Main Panel**: Dynamic content display based on user role.

  - **Sidebar Widgets**: Quick action items (e.g., pending approvals,
    active compliance alerts).

**2. Issuer Onboarding Workflow**

**a. Initial Onboarding & Account Setup**

- **Fields & Inputs:**

  - Company Name (Text Input)

  - Organisation Type (Dropdown: SPV, Investment Firm, Fund)

  - Country of Registration (Dropdown)

  - Email & Password (Input + Password Strength Meter)

  - Role Assignment (Multi-select: Owner, Compliance Officer, Agent)

  - **Legal Agreement Checkbox** (User must accept before proceeding)

  - **Submit Button** (Triggers email verification)

**b. Asset Preparation & Due Diligence**

- **Fields & Inputs:**

  - Asset Type (Dropdown: Loan Portfolio, Real Estate, Equity)

  - Asset Valuation (Numerical Input)

  - Supporting Documents (File Upload: PDF, CSV)

  - **Status Indicator** (Pending Verification / Approved / Rejected)

  - **Submit for Review** Button (Triggers compliance check)

**c. SPV Structuring & Legal Setup**

- **Fields & Inputs:**

  - SPV Name (Text Input)

  - SPV Address (Text Input)

  - Governance Model (Dropdown: Single Entity, Multi-Signature)

  - Compliance Docs Upload (File Upload)

  - Legal Agreement Signing (e-Signature Integration)

  - **Submit & Notify Legal Advisor** Button

**d. Source Wallet Setup**

- **Fields & Inputs:**

  - Blockchain Network Selection (Dropdown: Ethereum, Polygon,
    Avalanche)

  - Wallet Name (Text Input)

  - Wallet Role Assignment (Dropdown: Issuer, Investor, Compliance)

  - **Generate New Wallet** Button (Auto-creates on Guardian Wallet)

  - **Whitelist Address** (Multi-select wallet addresses for later
    approval)

  - **Enable Multi-Signature Approval** Toggle

**e. Investor Readiness & Compliance Verification**

- **Fields & Inputs:**

  - Qualification Criteria (Multi-select: Accredited Investor,
    Institutional)

  - Investor Compliance Status (Badge: Pending, Approved, Rejected)

  - **Generate Pre-Issuance Report** Button

**3. Investor Onboarding Workflow**

**a. Registration & Verification**

- **Fields & Inputs:**

  - First Name & Last Name (Text Input)

  - Email Address (Input + Verification Code Field)

  - Password (Input + Strength Indicator)

  - Country of Residence (Dropdown)

  - **Create Account** Button

**b. Project Selection & Investment Qualification**

- **Fields & Inputs:**

  - Available Projects (Card Layout Display with Filters: Real Estate,
    Private Equity)

  - **Project Details Modal** (Displays key investment terms, risk
    profile, expected returns)

  - **Get Qualified & Invest** Button (Triggers KYC Verification)

**c. Wallet Setup & Compliance Approval**

- **Fields & Inputs:**

  - Select Wallet Type (Dropdown: Guardian Wallet, MetaMask, Ledger)

  - Wallet Address Input (Text)

  - Compliance Status (Badge: Verified, Pending)

  - **Submit for Approval** Button

**d. Document Upload & Final Submission**

- **Fields & Inputs:**

  - Identity Document (File Upload: Passport, National ID)

  - Proof of Address (File Upload: Utility Bill, Bank Statement)

  - Investor Accreditation (Dropdown: Self-Certified, Verified by Third
    Party)

  - **Upload & Submit** Button

**e. ONCHAINID Creation & Investment Readiness**

- **Fields & Inputs:**

  - ONCHAINID Verification Status (Read-Only)

  - Compliance Attributes (Checkmarks: Accredited, Whitelisted, KYC
    Verified)

  - **Finalize Investor Readiness** Button

**4. Compliance & Verification Screens**

**a. Compliance Agent Dashboard**

- **Panels & Actions:**

  - Pending Applications Table (Sortable: Investor Name, Status, KYC
    Level)

  - Compliance Alerts (Red Badges for Urgent Reviews)

  - **Approve / Reject Buttons** (With Reason for Rejection)

**b. Issuer Compliance Management**

- **Panels & Actions:**

  - Compliance Status Overview (Pie Chart: Approved vs. Pending)

  - Investor Compliance Readiness (Card Display: % Approved)

  - **Export Compliance Report** Button

**c. Investor Qualification Tracker**

- **Panels & Actions:**

  - Investor Table (Searchable by Name, Status)

  - Pending Document Reviews (Expandable Panel for Reviewing Docs)

  - **Send Notification to Investor** Button

**Security & Compliance Considerations**

**UI Consistency**: Minimalistic, high-contrast UI for accessibility.

**Secure Fields**: Password & sensitive input fields should use **masked
entry**.

**Multi-Step Confirmation**: Major actions (wallet setup, qualification)
require **two-step confirmations**.

**Audit Logs**: All key actions should have **time-stamped logs** for
compliance tracking.
