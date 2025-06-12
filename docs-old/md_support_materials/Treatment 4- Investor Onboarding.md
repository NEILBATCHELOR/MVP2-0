**UI Wireframe Outline: Investor Onboarding Flow**

**Objective**

To create a structured **UI wireframe outline** for the **Investor
Onboarding Flow**, detailing the key screens, layout, and interactions
necessary to guide the development of a high-fidelity prototype.

**Primary Users**

**Investor (Institutional or Individual)**

**Compliance Agent (Review & Approval Authority)**

**Guardian Policy Enforcement (Automated Compliance Checks)**

**1. Investor Onboarding Flow - Wireframe Breakdown**

**Screen 1: Welcome & Account Registration**

**Purpose:** Provide a **clear entry point** for investors to register
and begin the onboarding process.

**Components:**

- **Header:** Platform branding & navigation (Sign In, Support)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Register as an Investor"

  - **Input Fields:**

    - First Name & Last Name (Text Input)

    - Email Address (Email Input)

    - Password & Confirm Password (Password Input)

    - Country of Residence (Dropdown)

  - **Checkbox:** Accept Terms & Conditions

  - **Primary CTA Button:** ["]{dir="rtl"}Create Account"

  - **Link to Login Page:** ["]{dir="rtl"}Already have an account? Sign
    in"

**Interactions:**

**Validation Rules:** Error handling for required fields

**Password Strength Meter**

**Email Verification Trigger** (Redirects to next screen)

**Screen 2: Email Verification & Two-Factor Authentication (2FA)**

**Purpose:** Ensure that only legitimate investors proceed to onboarding
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

**Screen 3: Investor Profile & Qualification**

**Purpose:** Collect necessary investor details for qualification.

**Components:**

- **Header:** Progress Tracker (Step 2 of 6)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Investor Profile & Qualification"

  - **Input Fields:**

    - Investor Type (Dropdown: Individual, Institutional)

    - Accreditation Status (Dropdown: Accredited, Non-Accredited)

    - Investment Experience (Dropdown: Beginner, Intermediate, Expert)

  - **Primary CTA Button:** ["]{dir="rtl"}Continue"

  - **Secondary Button:** ["]{dir="rtl"}Save & Exit"

**Interactions:**

**Dynamic Fields Based on Investor Type**

**Accreditation Verification API Integration**

**Screen 4: KYC & AML Verification**

**Purpose:** Ensure regulatory compliance by verifying the identity of
investors.

**Components:**

- **Header:** Progress Tracker (Step 3 of 6)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}KYC & AML Verification"

  - **Document Submission Fields:**

    - Government-Issued ID (File Upload: Passport, National ID)

    - Proof of Address (File Upload: Utility Bill, Bank Statement)

    - Source of Wealth Statement (File Upload, Text Input)

  - **Primary CTA Button:** ["]{dir="rtl"}Submit for Verification"

  - **Secondary Button:** ["]{dir="rtl"}Save & Exit"

**Interactions:**

**Real-time Document Validation API**

**Auto-Generated Checklist Panel for Missing Docs**

**Status Notifications for Approval or Rejection**

**Screen 5: Wallet Setup & Compliance Approval**

**Purpose:** Establish a secure wallet connection for future
transactions.

**Components:**

- **Header:** Progress Tracker (Step 4 of 6)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Set Up Your Investment Wallet"

  - **Options:**

    - Connect an Existing Wallet (MetaMask, Ledger, WalletConnect)

    - Create a New Guardian Wallet (Auto-generated address)

  - **Wallet Address Display (If Connected)**

  - **Primary CTA Button:** ["]{dir="rtl"}Confirm & Proceed"

**Interactions:**

**Wallet Address Whitelisting API**

**Live Connection Status Indicator**

**Screen 6: Approval Pending Screen (Investor Dashboard View)**

**Purpose:** Enable the issuer owner or relevant issuer roles to
approve, block, or reject investors.

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

**Interactions:**

**Dynamic Status Update:** Changes investor status in real-time

**Automated Notifications:** Investors receive an email upon status
change

**Issuer Role-Based Access Control:** Only authorised issuer roles can
take action
