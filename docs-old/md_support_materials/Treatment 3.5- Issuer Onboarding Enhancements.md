**Enhancements for Issuer Onboarding Flow Based on Attached Roles &
Responsibilities Document**

After reviewing the Issuer Onboarding Flow from the document, the
following enhancements are recommended to improve the completeness,
compliance enforcement, and structured governance approval before
issuance:

**1. Key Enhancements Based on Roles & Responsibilities**

**A. Strengthened Compliance & Role-Based Approvals**

🔹 Guardian Policy Enforcement & Compliance Agent Verification Before
Issuer Approval

Enhancement: Introduce explicit review steps before issuers can proceed
past the Compliance & Due Diligence Submission stage.

Action: Compliance Agents & Guardian Policy Enforcement should approve
or reject the issuer[']{dir="rtl"}s submissions with a feedback
mechanism.

**New UI Component: Compliance Review Panel**

Displays current compliance status: ✅ Approved \| ❌ Rejected \| ⏳
Pending

Shows missing documentation or flagged issues

Issuer receives notifications for pending compliance actions

🔹 **Multi-Signature Approval for High-Risk Issuers & Structured
Governance for Compliance Review**

Enhancement: Require multi-signature approval for high-risk issuer
registrations (e.g., complex SPV structures, cross-jurisdictional
assets, unregulated issuers).

New UI Component: Multi-Sig Approval Panel (Legal Counsel + Compliance
Agent + Guardian)

Statuses: ✅ Fully Approved \| 🟡 Requires Additional Documentation \|
❌ Rejected

**B. Enhancements to UI Screens in Issuer Onboarding Flow**

**Screen 3: Organisation Details & Legal Setup (Improvements)**

📌 Enhancement: More Granular Data Entry for Issuer Structuring &
Compliance

New Input Fields:

Legal Entity Structure Type (Dropdown: Sole Proprietor, Partnership,
Corporation, Trust, Fund)

Issuer Type (Checkbox: Traditional Financial Entity, Digital Asset
Issuer, Hybrid)

Issuer Governance Model (Dropdown: Board-Managed, Trustee-Managed,
Decentralised Governance)

Disclosure of External Trustees, Administrators, or Legal
Representatives (Text Box)

Optional AML & Risk Classification (Dropdown: Low, Medium, High) --
Auto-determined based on compliance data.

**Screen 4: Compliance & Due Diligence Submission (Improvements)**

📌 **Enhancement: Introduce an Automated Risk Scoring System**

- New UI Component: Issuer Risk Scorecard (Auto-Generated)

  - Generates a compliance risk level based on:

    - Document completeness

    - Jurisdiction

    - UBO & ownership structure complexity

    - Financial statements (if applicable)

  - Scoring Model:

    - ✅ Low Risk: Auto-approved after compliance review

    - 🟡 Medium Risk: Requires additional compliance documentation

    - 🔴 High Risk: Multi-Signature Approval Required

**Screen 5: SPV Wallet & Smart Contract Setup (Improvements)**

📌 **Enhancement: Introduce Compliance-Based Wallet Activation**

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

If an institutional issuer is selected, prompt multi-signature setup.

Add ["]{dir="rtl"}Assign Additional Signatories" button with predefined
roles:

Primary Issuer

Fund Administrator

Trustee

External Legal Representative (if applicable)

**Screen 6: Final Review & Approval Submission (Improvements)**

📌 **Enhancement: Explicit Compliance Review & Approval Workflow**

New UI Component: Approval Timeline Tracker

Shows compliance review stages:

Submitted

Under Review (Compliance Agent)

Guardian Policy Enforcement Validation

✅ Fully Approved OR ❌ Rejected (With Reason & Re-Submit Option)

Notification System triggers issuer updates on approval progress.

**2. New Issuer Dashboard for Post-Onboarding Monitoring**

📌 **Enhancement: A Dedicated Issuer Dashboard Post-Onboarding to Track
Onboarding Progress & Compliance**

New Screen: Issuer Dashboard

Displays Onboarding Completion Progress (Bar Indicator)

Compliance Review Panel: Guardian & Legal Approval Status

SPV Wallet Status: Pending Setup, Ready, Activated

Upcoming Tasks: Required documentation, pending approvals, compliance
status

Primary CTA: ["]{dir="rtl"}Request Compliance Review" \|
["]{dir="rtl"}Proceed to Issuance"
