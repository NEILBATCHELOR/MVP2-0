**UI Wireframe Outline: Issuance Flow**

**Objective**

To create a structured **UI wireframe outline** for the **Issuance
Flow**, detailing the key screens, layout, and interactions necessary to
guide the development of a high-fidelity prototype. This flow follows
the onboarding process and enables issuers to **design tokens, enforce
compliance, allocate tokens, manage cap tables, and configure
primary/secondary market settings.**

**Primary Users**

**Issuer (SPV, Asset Owner, Investment Manager, Fund Manager)** --
Oversees onboarding, token structuring, investor qualification, and
issuance approvals.

**Compliance Agent (Legal/Regulatory Officer, Guardian Policy
Enforcement)** -- Ensures compliance validation before final activation.

**Guardian Wallet ('Custodial' Role)** -- Manages issuance wallet
creation, investor subscriptions, and post-issuance settlements.

**Investors (Receiving Allocations & Managing Holdings)** -- Participate
in subscription, receive allocated tokens, and manage secondary
transactions.

**Agents (Placement Agents, Investment Banks, Fund Administrators)** --
Support investor onboarding, compliance approvals, token allocation, and
post-issuance reporting.

**1. Issuance Flow - Wireframe Breakdown**

**Screen 1: Token Design & Structuring - Flexible Configuration**

**Purpose:** Allows issuers to define the basic attributes of their
token before deployment.

**Status Options:**

- **Draft:** Token details are being configured but not yet submitted.

- **Pending Review:** Awaiting validation before deployment.

- **Approved:** Token has passed compliance checks and is ready for
  deployment.

- **Paused:** Token issuance has been temporarily halted for review or
  additional verification.

**Components:**

- **Header:** Platform branding & navigation (Back to Dashboard, Help
  Center)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Design Your Token"

  - **Input Fields:**

    - Token Name (Text Input)

    - Token Symbol (Text Input)

    - **Dropdown:** Select Token Standard (ERC-20, ERC-721, ERC-1155,
      ERC-1400, ERC-3525)

    - Decimals (Dropdown: 0-18)

    - Total Supply (Numerical Input)

    - Metadata which can related to its purpose on but an example for
      3525 is: {

> \"name\": \"Structured Yield Token\",
>
> \"symbol\": \"SYT\",
>
> \"description\": \"An ERC-3525 structured yield token representing a
> staked position with dynamic yield attributes.\",
>
> \"decimals\": 18,
>
> \"properties\": {
>
> \"tokenId\": \"123456\",
>
> \"slot\": \"42\",
>
> \"value\": \"1000000000000000000\",
>
> \"attributes\": {
>
> \"interestRate\": \"8.5\",
>
> \"lockupPeriod\": \"365 days\",
>
> \"issuer\": \"Chain Capital\",
>
> \"collateralType\": \"USDC\",
>
> \"redemptionSchedule\": \"Quarterly\",
>
> \"stakingMechanism\": \"LST-based yield accrual\",
>
> \"riskRating\": \"A\"
>
> }
>
> },
>
> \"image\": \"https://example.com/token-image.png\",
>
> \"external_url\": \"https://chaincapital.com/token/123456\"
>
> }

- **Ownership Wallet Input:** Assign initial token contract owner as the
  issuers address

- **Token Labeling & Multi-Tranche Support:**

  - Label each token or tranche (Text Input)

  - Enable issuers to add multiple tokens or create token tranches using
    a (+) button for additional configurations. If tranches are selected
    instead of separate tokens, issuers must allocate a percentage-based
    distribution ensuring the total equals 100%. This functionality
    allows for structured financing where different tranches can
    represent varying levels of risk, yield, or investor eligibility.

  - Define ratio relationships between ERC-20 and other ERC token types

- **Eligibility Criteria & Compliance Parameters:**

  - Maximum Investor Volume (Numerical Input)

  - Compliance and Identity Storage (Toggle Options)

- **Jurisdiction Configuration:**

  - Select allowed jurisdictions

  - Restrict participation from blacklisted or high-risk jurisdictions

- **Supply Limits and Token Economics:**

  - Define maximum supply and issuance caps

  - Configure supply mechanisms (minting and burning rules)

- **Secondary Market Transfer Rules:**

  - Time-based transfer limits (e.g., investors cannot sell within 6
    months)

  - Investor jurisdiction-based restrictions

  - Transfer whitelisting enforcement

  - Smart compliance modules (AML risk scoring, governance, etc.)

- **Primary CTA Button:** ["]{dir="rtl"}Continue to Compliance"

**Interactions:**

- **Validation Rules:** Check for unique token name & symbol

- **Auto-Generate Smart Contract Code for Review**

- **Issuer, Compliance Agent, and Agent can collaboratively review token
  parameters**

- **Dynamically add, label, and configure multiple tokens/tranches
  within a single issuance**

**Step 2: Compliance Configuration & Review**

**Purpose:** Ensures tokens are only distributed to compliant investors.

**Status Options:**

- **Draft:** Compliance rules are being configured.

- **Submitted for Review:** Compliance rules are awaiting validation.

- **Approved:** Compliance rules have been confirmed.

- **Paused:** Compliance enforcement has been temporarily halted for
  legal review.

- **Rejected:** Compliance rules require modification.

**Components:**

- **Header:** Progress Tracker (Step 2 of 8)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Set Compliance Rules"

  - **Input Fields:**

    - Investor Eligibility Criteria (Dropdown: KYC, AML, Accredited
      Investor, Residency)

    - Whitelisting Specific Participants (Table: Name, Wallet Address,
      Compliance Status)

    - Regulatory Parameters (Numerical Input: Maximum Investor Volumes)

  - **Guardian-Linked Investor Claims:**

    - Guardian Policy Enforcement ensures KYC/AML checks

    - ChainID-linked investor qualification requirements

  - **Multi-Signature Approval Panel:** Compliance & Legal teams approve
    before enforcement

  - **Primary CTA Button:** ["]{dir="rtl"}Submit for Compliance Review"

**Interactions:**

- **Real-Time Policy Validation with Guardian Policy Enforcement**

- **Cap Table Sync with Investor Qualification Rules**

- **Multi-Sig Approval required before compliance settings are
  finalised**

**Enhancements:**

- **Expanded Multi-Signature Governance Approval:**

  - Issuer cannot proceed without Guardian Policy Enforcement &
    Compliance Agent validation.

  - Legal teams & compliance officers must review regulatory adherence
    before approval.

- **New UI Component:** **Compliance Review Panel**

  - Displays **Guardian Policy Enforcement Review Status** (Approved,
    Rejected, Pending)

  - Provides **real-time compliance flagging & required modifications**

- **New Feature:** **Regulatory Risk Assessment**

  - Automatically evaluates investor jurisdictions & whitelisting
    restrictions

**Screen 3: Token Deployment**

**Purpose:** The issuer accesses the Chain Capital platform to deploy
token smart contracts.

**Status Options:**

- **Pending Deployment:** Token contract has been created but not yet
  deployed.

- **Deployed:** Token contract has been successfully deployed on-chain.

- **Failed:** Deployment encountered an error and requires re-attempt.

- **Paused:** Token deployment has been temporarily halted due to
  compliance review.

**Components:**

- **Header:** Progress Tracker (Step 3 of 8)

- **Main Panel:**

  - **Title:** ["]{dir="rtl"}Deploy Your Token"

  - **Token Configuration Preview**

  - **Token Standards Supported:** ERC-20, ERC-721, ERC-1155

  - **Deployment Confirmation Panel**

  - **Multi-Signature Approval Panel** -- Ensures compliance and
    security before deployment

  - **Primary CTA Button:** ["]{dir="rtl"}Deploy Token"

**Interactions:**

- **Smart Contract Deployment Execution on Blockchain**

- **Platform Confirms Successful Deployment**

- **Issuer, Compliance Agent, and Guardian Wallet must approve
  deployment via Multi-Sig Governance**

**Enhancements:**

- **New UI Component:** **Investor Subscription Tracking & Compliance
  Panel**

  - Tracks **investor onboarding completion before allocation.**

  - Displays **Guardian Policy Enforcement verification results.**

- **New Feature:** **Market Transparency & Cap Table Synchronisation**

  - Automates investor allocation records post-issuance.

  - Ensures real-time investor eligibility tracking.

  - Regulatory transparency: Compliance agents can generate regulatory
    reports post-issuance.

**Screen 4: Token Allocation & Market Configuration**

**Purpose:** The issuer allocates tokens and configures primary &
secondary market settings.

**Status Options:**

**Pending Allocation:** Tokens are ready for assignment.

**Allocated:** Tokens have been successfully distributed to investors.

**Failed:** Allocation was unsuccessful due to compliance or technical
issues.

**Paused:** Allocation has been halted due to investor compliance
review.

**Components:**

- **Header:** ["]{dir="rtl"}Token Allocation & Market Configuration"

- **Investor Table:**

  - **Columns:** Investor Name, Wallet Address, Compliance Status,
    Allocation Amount

  - **Bulk Allocation Button** (Distribute to multiple investors at
    once)

  - **Individual Allocation Button** (Manually assign tokens per
    investor)

  - **Market Liquidity Settings:**

    - Configure Primary Market (Subscription Order Management)

    - Configure Secondary Market (OTC Trading, CEX/DEX Integrations)

  - **Primary CTA Button:** ["]{dir="rtl"}Confirm & Finalize"

**Enhancements:**

- **Expanded Multi-Signature Governance Approval:**

  - Allocations must adhere to whitelist and eligibility checks

  - Allocations must adhere to any other asset or investor based
    conditional rules configured policy as part of token and investor
    rule management.

**Interactions:**

**Real-Time Guardian Wallet Sync for Investor Updates**

**Compliance Rule Enforcement on Each Allocation**

**Multi-Sig Approval required before final allocation**
