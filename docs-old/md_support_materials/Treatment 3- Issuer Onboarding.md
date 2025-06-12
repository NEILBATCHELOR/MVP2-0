**UI Wireframe Outline: Issuer Onboarding Flow**

**Objective**

To create a structured **UI wireframe outline** for the **Issuer
Onboarding Flow**, detailing the key screens, layout, and interactions
necessary to guide the development of a high-fidelity prototype.

**Primary Users**

**Issuer (SPV, Asset Owner, Investment Manager)**

**Compliance Agent (Review & Approval Authority)**

**Guardian Policy Enforcement (Automated Compliance Checks)**

**1. Issuer Onboarding Flow - Wireframe Breakdown**

**Screen 1: Welcome & Account Registration**

**Purpose:** Provide a **clear entry point** for issuers to register and
begin the onboarding process.

**Components:**

- **Header:** Platform branding & navigation (Sign In, Support)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Register as an Issuer"

  - **Input Fields:**

    - Organization Name (Text Input)

    - Country of Registration (Dropdown)

    - Business Email (Email Input)

    - Password & Confirm Password (Password Input)

  - **Checkbox:** Accept Terms & Conditions

  - **Primary CTA Button:** ["]{dir="rtl"}Create Account"

  - **Link to Login Page:** ["]{dir="rtl"}Already have an account? Sign
    in"

**Interactions:**

**Validation Rules:** Error handling for required fields

**Password Strength Meter**

**Email Verification Trigger** (Redirects to next screen)

**Screen 2: Email Verification & Two-Factor Authentication (2FA)**

**Purpose:** Ensure that only legitimate issuers proceed to onboarding
and enforce secure account access.

**Components:**

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Verify Your Email & Set Up 2FA"

  - **Step 1: Email Verification**

    - **Instructional Text:** ["]{dir="rtl"}Enter the 6-digit
      verification code sent to your email."

    - **Input Field:** OTP Code (6-digit numeric input)

    - **Resend Code Button**

  - **Step 2: Two-Factor Authentication Setup**

    - **Instructional Text:** ["]{dir="rtl"}Scan the QR code with your
      authentication app or enter the provided key manually."

    - **QR Code for Authenticator App Setup**

    - **Backup Code Display for Recovery**

    - **Input Field:** ["]{dir="rtl"}Enter the code from your
      authenticator app"

  - **Primary CTA Button:** ["]{dir="rtl"}Verify & Continue"

**Interactions:**

**Invalid Code Message** (If incorrect code is entered)

**Auto-Proceed on Correct Entry**

**Require 2FA on Future Logins**

**Screen 3: Organisation Details & Legal Setup**

**Purpose:** Collect essential SPV/issuer details for compliance
verification.

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

**Primary CTA Button:** ["]{dir="rtl"}Continue"

**Secondary Button:** ["]{dir="rtl"}Save & Exit"

**Interactions:**

**File Validation Rules** (Max file size, accepted formats)

**Auto-Save Feature** (In case of page refresh)

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

  - **Primary CTA Button:** ["]{dir="rtl"}Submit for Review"

  - **Secondary Button:** ["]{dir="rtl"}Save & Exit"

**Interactions:**

**Real-time Compliance API Integration** (Guardian Policy Enforcement)

**Dynamic Field Visibility** (Different documents based on country
selection)

**Screen 5: SPV Wallet & Smart Contract Setup**

**Purpose:** Assign a dedicated **wallet address** and configure smart
contract interactions.

**Components:**

- **Header:** Progress Tracker (Step 4 of 5)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Set Up Your Issuance Wallet"

  - **Blockchain Selection:** (Dropdown: Ethereum, Polygon, Avalanche)

  - **Auto-Generated Wallet Address:** (Read-only, Copyable)

  - **Wallet Role Selection:** (Dropdown: Primary Issuer, Multi-Sig
    Operator)

  - **Primary CTA Button:** ["]{dir="rtl"}Confirm & Proceed"

**Interactions:**

**Auto-Generate Wallet Address via API**

**Multi-Signature Wallet Option (Checkbox Enable)**

**Screen 6: Final Review & Approval Submission**

**Purpose:** Allow issuers to **review all entered data** before
submitting for approval.

**Components:**

- **Header:** Progress Tracker (Step 5 of 5)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Final Review & Submission"

  - **Summary Sections:**

    - Organisation Details (Read-only Preview)

    - Compliance Submissions (Read-only Preview)

    - Wallet Setup Summary

  - **Checkbox:** ["]{dir="rtl"}I confirm all details are accurate"

  - **Primary CTA Button:** ["]{dir="rtl"}Submit for Approval"

**Interactions:**

**Redirect to Approval Pending Screen** (Issuer Dashboard View)

**Notification Sent to Compliance Agent**
