**Enhancements for Investor Onboarding UI Wireframe Outline Based on
Roles & Responsibilities Document**

After reviewing Treatment 4: Investor Onboarding and the Roles &
Responsibilities for Investor Onboarding, the following enhancements are
required to align investor onboarding with compliance, risk management,
and structured governance approvals.

**1. Key Enhancements Based on Roles & Responsibilities**

**A. Strengthened Compliance & Role-Based Approvals**

🔹 **Guardian Policy Enforcement & Compliance Agent Verification Before
Investor Approval**

Enhancement: Introduce explicit compliance verification before investors
proceed past the KYC & AML Verification stage.

Action: Investors must pass Guardian Policy Enforcement checks before
account activation.

**New UI Component: Compliance Review Panel**

Displays KYC/AML compliance status: Approved \| Rejected \| Pending

Shows missing documentation or flagged issues

Investors receive real-time notifications on required compliance actions

🔹 **Multi-Signature Approval for High-Risk Investors & Structured
Governance for Compliance Review**

- **Enhancement: Require multi-signature approval for high-risk
  investors (e.g., offshore entities, politically exposed persons,
  complex investment structures).**

- **New UI Component: Multi-Sig Approval Panel (Legal Counsel +
  Compliance Agent + Guardian)**

  - Statuses: Fully Approved \| Requires Additional Documentation \|
    Rejected

**B. Enhancements to UI Screens in Investor Onboarding Flow**

**Screen 3: Investor Profile & Qualification (Improvements)**

📌 **Enhancement: More Granular Data Entry for Investor Structuring &
Compliance**

New Input Fields:

Investor Legal Structure (Dropdown: Individual, Joint Account,
Corporate, Trust, Institutional Fund)

Investor Accreditation Type (Dropdown: High-Net-Worth, Institutional,
Regulated Fund, Retail)

Investment Experience (Dropdown: Low, Medium, High)

Tax Residency Declaration (Dropdown & Form Input for Tax Compliance)

Guardian Compliance Pre-Check (Dynamic Message: Approved, Pending
Review, Rejected)

**New Feature: Auto-Sync with Guardian Compliance Checks**

Auto-classifies investor risk level based on submitted profile data.

Flags incomplete or high-risk profiles for manual compliance review.

**Screen 4: KYC & AML Verification (Improvements)**

📌 **Enhancement: Introduce an Automated Risk Scoring System**

- New UI Component: Investor Risk Scorecard (Auto-Generated)

  - ✅ Low Risk: Auto-approved after compliance review

  - 🟡 Medium Risk: Requires additional compliance documentation

  - 🔴 High Risk: Multi-Signature Approval Required

- New Input Fields:

  - Source of Wealth Declaration (Dropdown & Text Input)

  - Regulatory Jurisdiction Selection (Dropdown)

  - UBO (Ultimate Beneficial Owner) Identification (Required for
    Corporate & Institutional Investors)

Primary CTA Button: ["]{dir="rtl"}Submit for Verification"\
Secondary Button: ["]{dir="rtl"}Save & Exit"

**Interactions:**

- Real-time Compliance API Integration (Guardian Policy Enforcement)

- Dynamic Field Visibility (Different documents based on investor type &
  jurisdiction)

**Screen 5: Wallet Setup & Compliance Approval (Improvements)**

📌 **Enhancement: Introduce Compliance-Based Wallet Activation**

Action: Investment wallet should be created but remain inactive until
compliance approval is finalised.

New UI Component: Wallet Activation Dependencies Panel

If compliance is pending, wallet status = ["]{dir="rtl"}Pending
Activation"

If compliance is rejected, wallet status = ["]{dir="rtl"}Blocked --
Requires Review"

If fully compliant, wallet status = ["]{dir="rtl"}Active -- Ready for
Investment"

📌 **Enhancement: Multi-Signature Wallet Setup for Institutional
Investors**

- If an institutional investor is selected, prompt multi-signature
  setup.

- Add ["]{dir="rtl"}Assign Additional Signatories" button with
  predefined roles:

  - Primary Investor

  - Fund Manager

  - External Legal Representative (if applicable)

**Screen 6: Approval Pending Screen (Investor Dashboard View)**

📌 **Enhancement: Explicit Compliance Review & Approval Workflow**

New UI Component: Approval Timeline Tracker

Displays investor approval stages:

Submitted

Under Review (Compliance Agent)

Guardian Policy Enforcement Validation

✅ Fully Approved OR ❌ Rejected (With Reason & Re-Submit Option)

Notification System triggers investor updates on approval progress.

**New Feature: Role-Based Access Control for Approving Investors**

Only authorised issuer roles (Issuer Owner, Compliance Officer) can
approve, block, or reject investors.

Action Panel Updates:

Approve Investor (Green Button) → Grants investment permissions

EDD (Enhanced DD) Investor (Yellow Button) → Requires compliance review
before approval

Reject Investor (Red Button) → Requires reason input and investor
notification

**2. New Investor Dashboard for Post-Onboarding Monitoring**

📌 **Enhancement: A Dedicated Investor Dashboard Post-Onboarding to
Track Onboarding Progress & Compliance**

- New Screen: Investor Dashboard

  - Displays Onboarding Completion Progress (Bar Indicator)

  - Compliance Review Panel: Guardian & Legal Approval Status

  - Wallet Status: Pending Setup, Ready, Activated

  - Upcoming Tasks: Required documentation, pending approvals,
    compliance status

  - Primary CTA: ["]{dir="rtl"}Request Compliance Review" \|
    ["]{dir="rtl"}Proceed to Investment"
