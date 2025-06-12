**UI Design Brief: Issuer & Investor Onboarding & Issuance Workflow**

**Objective**

To design an **Issuer & Investor Onboarding and Issuance Dashboard**
that enables users to configure, manage, and execute onboarding
workflows, investor qualification, SPV setup, compliance enforcement,
and issuance execution. The UI should be intuitive, secure, and tailored
to regulated financial professionals managing tokenised securities.

**Target Audience**

**Issuers** -- Asset owners, investment managers, structured finance
professionals.

**Investors** -- Institutional and accredited investors participating in
tokenised asset offerings.

**Compliance Agents** -- AML/KYC and regulatory specialists overseeing
qualification.

**Placement Agents & Administrators** -- Intermediaries managing
subscriptions and investor access.

**Screen Layout & Workflow Design**

**1. Role-Based Access & Dashboard Customisation**

- **Users:** Issuer, Investor, Compliance Agent, Agents (Placement
  Agents, Investment Managers).

- **Features:**

  - Custom role-based views for **Issuers, Investors, Agents**.

  - Issuer dashboard with:

    - **SPV Setup Progress**

    - **Token Compliance Status**

    - **Investor Qualification & Wallet Whitelisting**

    - **Pre-Issuance Reports & Compliance Readiness**

**2. Issuer Onboarding Expansion**

**a. SPV Registration & Legal Structuring**

- **Users:** Issuer, Legal/Compliance Agent.

- **Features:**

  - Upload SPV-related documents (legal formation, compliance docs).

  - Assign team roles (Admins, Operators, Compliance Officers).

  - Auto-generated legal structuring templates.

**b. Compliance & Investor Rules Configuration**

- **Users:** Issuer, Compliance Agent.

- **Features:**

  - Configure investor eligibility:

    - Accredited Investor?

    - Jurisdiction Whitelist/Blacklist?

    - Institutional/Individual Classification?

  - Set compliance-based restrictions (e.g., lock-up periods, transfer
    limits).

  - Assign **Guardian Policy Enforcement** controls.

**c. SPV Wallet Setup & Source Wallet Configuration**

- **Users:** Issuer, Guardian Wallet.

- **Features:**

  - Create **source wallet(s) per issuance**.

  - Define **multi-signature approval layers**.

  - Assign **transaction & custody permissions**.

**3. Token Design & Configuration**

**a. Token Smart Contract Setup**

- **Users:** Issuer.

- **Features:**

  - Define token name, symbol, supply, and decimals.

  - Select **token standard** (ERC-20, ERC-1400, ERC-721, ERC-3525).

  - Configure **transfer rules, whitelist management, and smart
    compliance modules**.

  - Preview contract before deployment.

**b. Compliance Enforcement for Token Issuance**

- **Users:** Issuer, Guardian Policy Enforcement.

- **Features:**

  - Enforce **jurisdictional transfer restrictions**.

  - Set **investor identity claims** (CHAINID-based compliance).

  - Configure **time-based transfer restrictions, whitelisting, and cap
    rules**.

  - Enable **automated risk scoring & AML validation**.

**4. Investor Management & Qualification**

**a. Investor Whitelisting & Verification**

- **Users:** Issuer, Compliance Agent.

- **Features:**

  - Assign **approval-based investor qualification**.

  - View **whitelisted wallets & cap table data**.

  - Monitor **KYC/AML validation statuses**.

  - **Approve/Reject investors** in real time.

**b. Real-Time Cap Table & Investor Management**

- **Users:** Issuer, Guardian Wallet.

- **Features:**

  - View **investor positions & historical cap table snapshots**.

  - Export **cap table compliance reports**.

  - Monitor **investor subscription orders & pending approvals**.

**5. Token Allocation & Distribution**

**a. Issuer Allocates Tokens to Investors**

- **Users:** Issuer, Guardian Wallet API.

- **Features:**

  - **Bulk allocate or distribute tokens** per investor class.

  - **Pre-allocate tokens** before wallet whitelisting approval.

  - Monitor **pending distributions & transfer compliance**.

**b. Guardian Wallet Integration & Token Transfers**

- **Users:** Investor, Issuer, Guardian Wallet.

- **Features:**

  - **Real-time wallet tracking of allocated tokens**.

  - **Investor receipt confirmation & transaction history**.

  - **Enforce on-chain compliance before finalising distribution**.

**6. Pre-Issuance & Compliance Finalisation**

**a. Pre-Issuance Readiness Check**

- **Users:** Issuer, Compliance Agent.

- **Features:**

  - Generate **pre-issuance reports** for compliance.

  - Assess **investor participation & token lock-up status**.

  - Final **Guardian Policy Enforcement validation**.

**b. Issuance Activation & Market Readiness**

- **Users:** Issuer, Guardian Wallet API.

- **Features:**

  - Final **confirmation & smart contract activation**.

  - Monitor **secondary market readiness**.

  - Configure **OTC, Exchange, and Liquidity Restrictions**.

**7. Secondary Market Trading & Investor Access**

**a. Investor Dashboard (Post-Issuance)**

- **Users:** Investor.

- **Features:**

  - View **token holdings & restrictions**.

  - Initiate **secondary market trades**.

  - Access **cap table & token history reports**.

**b. Issuer Dashboard (Post-Issuance)**

- **Users:** Issuer, Agents, Compliance Officer.

- **Features:**

  - Monitor **token movements & cap table updates**.

  - Enforce **secondary market restrictions**.

  - Generate **regulatory compliance reports**.

**Security & Compliance Considerations**

**Multi-signature approval layers** to ensure secure fund movements.

**Smart contract-based compliance enforcement** for jurisdictional &
investor eligibility.

**Automated audit trails & reporting** to meet regulatory requirements.

**Transaction verification & validation** before allowing token
transfers.
