**High Level Functional Target for Issuance Module:**

**TOKEN DESIGN AND SMART CONTRACT DEPLOYMENT**

The **Token Configuration** section details the process of setting up a
token, including:

**Modifying basic token information** (name, symbol, decimals, supply
limits).

**Deploying compliance rules** embedded in smart contracts.

**Ownership transfer functionality** to another wallet if required
(token from wallet address A to B).

**Token standards selection** (ERC-20, ERC-721, ERC-1155, ERC-1400,
ERC-3525, etc.).

**ISSUER AND AGENTS CONFIGURE TERMS**

- The **Back-Office Configuration** section allows issuers to:

  - Assign **roles** (Owner, Agent, Compliance Officer).

  - Define **compliance rules** (jurisdiction limits, transfer
    restrictions).

  - Configure **primary and secondary market access**.

  - Monitor **subscription orders** and investor onboarding.

**EMBEDDED COMPLIANCE TOKEN RULES**

Compliance is enforced **on-chain through smart contracts**:

**Whitelist-based access** requiring investors to have specific claims
(e.g., KYC/AML).

**Jurisdictional enforcement** restricting investors from non-compliant
countries.

**Secondary market transfer restrictions** (time-based transfer limits,
conditional transfers, whitelisting, etc.).

**Smart Compliance Modules** for additional compliance needs (AML
scoring, on-chain governance).

**RULE-BASED TOKEN ALLOCATIONS**

The **Token Supply Management** section includes:

Token actions such as **minting, burning, allocation, and redemption**.

Smart contract-based **rule enforcement** for allocations.

**Investor-based supply allocation**, ensuring only qualified investors
receive tokens.

**CAP TABLE AUTOMATION AND SYNC**

The **Cap Table Management** section enables:

**On-chain, real-time cap table updates**.

**Automated tracking of investor holdings**.

**Seamless reporting** to auditors, regulators, and investors.

**Position reports and historical snapshots** to ensure compliance.

**REAL-TIME UPDATES**

The system provides **continuous monitoring and reporting**, including:

**Transaction history logs** for compliance and transparency.

**Investor onboarding status tracking**.

**Primary and secondary market activity monitoring**.

**Real-time notifications and compliance updates** for issuers.

**Key Features for Workflow Diagram (Issuance)**

**Token Smart Contract Deployment**

- Intuitive deployment of ERC20, ERC721, ERC1155, ERC1400, and ERC3525
  token smart contracts through the CC platform.

- Enables secure and efficient servicing frameworks for tokenised
  assets.

  **Key Deployment Features**

- **Flexible Configuration:** Define token details, ownership wallet
  addresses, eligibility rules, and compliance parameters like investor
  volume limits.

- **Reusable Compliance Frameworks:** Save and reuse compliance rules
  and identity storage configurations for additional asset tokenisation.

- **Whitelist Management:** Maintain identity storage (whitelist) to
  restrict token interactions to approved participants.

  **Token Allocation**

- Efficient token distribution to investors via bulk operations or
  individual allocations.

- **Digital Identity Integration:** Automatically generates digital
  identities for investors without an existing one, supporting ONCHAINID
  integration or RedBelly\'s preferred system.

- **Real-Time Guardian Wallet Updates:** Tokens sent to
  investors[']{dir="rtl"} wallets are reflected in real-time on their
  dashboards.

  **Cap Table Synchronisation**

- Instantaneous updates to issuers[']{dir="rtl"} cap tables for accurate
  and transparent stakeholder reporting.

**Key Topics for Value Proposition Diagram (Issuance)**

**Investors**

**Seamless Experience**

24/7 access to a platform for purchasing and managing securities with
ease and convenience.

**Empowered Self-Service**

Automation enables administration without reliance on intermediaries.

**Real-Time Efficiency**

Instant updates and synchronised operations for accurate transactions
and information.

**Issuers**

**User-Friendly Technology**

Intuitive tools and APIs eliminate the need every party in the process
to build their own tokenisation facility prior to issuance .

**Cost-Effective Operations**

Automated workflows reduce manual effort and lower operational costs.

**Streamlined Management**

Integrated onboarding and management tools in a native platform.

**Agents**

**Digitised Workflows**

Connect traditional securities issuance with tokenised issuance.

**Transparent Real-Time Updates**

Stakeholders receive real-time updates on investor statuses and actions.

**Ecosystem Integration**

- Connects digital and tokenised securities through compliance rules and
  third party data oracles.

- Establishes a scalable, efficient, and transparent lifecycle
  management system for tokenised assets.

**Description of the Issuance Workflow**

**Step 1: Token Design and Structuring - Flexible Configuration**

- Define token information, ownership wallet addresses, eligibility
  criteria, and compliance parameters (e.g., maximum investor volume).

- Enable scalable and reusable frameworks for compliance and identity
  storage.

**Step 2: Token Deployment**

- The issuer accesses the Chain Capital platform to deploy token smart
  contracts.

- Tokens are created using compatible standards like ERC20, ERC721,
  ERC1155, etc.

- The platform confirms successful token deployment.

**Step 3: Compliance Configuration**

- The issuer configures compliance rules, including:

  - Eligibility criteria for investors.

  - Whitelisting specific participants.

  - Regulatory parameters such as maximum investor volumes.

- The platform enforces the configured compliance policies.

**Step 4: Compliance Review**

- The compliance oracle reviews and approves the compliance
  configurations.

- Updates or modifications are sent back to the platform if necessary.

- Finalised compliance rules are applied to the tokens.

**Step 5: Token Allocation**

- The issuer allocates tokens to investors using the
  platform[']{dir="rtl"}s tools.

- Features include:

  - Bulk allocation for multiple investors.

  - Individual allocation for specific cases.

- The platform facilitates the transfer of tokens to investors\' wallets
  via the Guardian Wallet.

**Step 6: Investor Notification**

- Investors receive notifications from the Guardian Wallet about their
  token allocation.

- Their dashboards on the platform are updated with real-time token
  details.

**Step 7: Cap Table Synchronisation**

- The issuer requests updates to the cap table to reflect token
  allocations.

- The platform synchronises the cap table in real-time, ensuring
  transparency for all stakeholders.

- Investors and compliance agents can view updated ownership records.

- Facilitates seamless reporting and stakeholder alignment.

**Step 8: Real-Time Guardian Wallet Updates**

- Immediate updates reflecting token balances in investors[']{dir="rtl"}
  wallets.

- Dashboard synchronisation for enhanced user experience.

**Token Design and Back-Office Configuration Workflow for Issuance on
Chain Capital[']{dir="rtl"}s Platform**

Below is a structured workflow that details the **Token Configuration**
and **Back-Office Configuration** process as part of the issuance
workflow.

**1. Token Configuration**

1.  **Access Token Settings**

    - Navigate to the **Token Settings** tab from the dashboard.

2.  **Modify Basic Token Information**

    - Update the token name, symbol, decimals, and description.

    - Set compliance parameters (e.g., maximum investors, lock-up
      periods).

3.  **Ownership Transfer**

    - If required, transfer the ownership of the token smart contract to
      another wallet address.

<!-- -->

4.  **Define Investor Qualification Requirements**

    - Specify the **claims** that investors need on their **ONCHAINID**
      to be eligible for receiving tokens.

    - Examples of claims:

      - KYC/AML verification.

      - Accredited investor status.

      - Country restrictions.

<!-- -->

5.  **Jurisdiction Configuration**

    - Select **allowed jurisdictions** where tokens can legally
      circulate.

    - Restrict participation from blacklisted or high-risk
      jurisdictions.

<!-- -->

6.  **Supply Limits and Token Economics**

    - Define the **maximum supply** and issuance caps.

    - Configure supply mechanisms, including minting and burning rules.

<!-- -->

7.  **Secondary Market Transfer Rules**

    - Establish **automated transfer restrictions** enforced through
      smart contracts.

    - Examples:

      - **Time-based transfer limits** (e.g., investors cannot sell
        within 6 months).

      - **Conditional transfers** (e.g., approval from a compliance
        agent required).

      - **Transfer whitelisting** (e.g., only pre-approved investors can
        receive tokens).

      - **Investor jurisdiction-based restrictions** (e.g., EU investors
        cannot sell to US investors).

      - **Transfer fees** (e.g., applying a small fee to discourage
        rapid trading).

<!-- -->

8.  **Smart Compliance Modules**

    - Add additional **modular compliance** contracts for customized
      rules.

    - Examples:

      - **AML risk scoring modules**.

      - **Capital reserve validation**.

      - **On-chain governance mechanisms**.

<!-- -->

9.  **Token Activation**

    - Ensure the token is **unpaused** before enabling transactions.

**2. Back-Office Configuration**

10. **Role-Based Access Control**

    - Assign roles within the **back-office system**:

      - **Owner** (Full control over token and issuance settings).

      - **Agents** (Can manage investors but not modify the contract).

      - **Compliance Officers** (Can approve or reject investor
        applications).

<!-- -->

11. **Token Supply Management**

    - Navigate to **Token Actions** to manage supply.

    - Select investors for **allocation, redemption, or burn** actions.

<!-- -->

12. **Transaction History & Compliance Audits**

    - View **real-time transaction logs** in the **Transactions** tab.

    - Ensure records are **immutable and auditable**.

<!-- -->

13. **Cap Table Management**

    - Access the **Investor List** tab for an **on-chain, real-time cap
      table**.

    - View investor details such as:

      - Wallet addresses. (whitelisting)

      - Token holdings.

      - Compliance status.

<!-- -->

14. **Managing Shareholders & New Investors**

    - Add known shareholders manually by uploading their details.

    - Access investor profiles to view **Personally Identifiable
      Information (PII)**.

<!-- -->

15. **Investor Tracking & Candidate Qualification**

    - In the **Candidates** tab, track new investor applications.

    - Perform **due diligence** and approve/reject investor onboarding.

<!-- -->

16. **Position Reports & Historical Data**

    - Generate **cap table position reports** at any historical date.

    - Download and store compliance reports for audits.

**3. Primary & Secondary Market Configuration** (noted here but
considered further in servicing (module 3) in more detail

17. **Subscription Order Management**

    - Access the **Primary Market** tab to manage:

      - Investor allocations.

      - Pending purchases.

      - Issuer confirmations.

<!-- -->

18. **Secondary Market & Liquidity Options**

    - Navigate to the **Secondary Market** tab to configure:

      - **OTC trading** options.

      - **Centralised exchange integration**.

      - **Trade pre-approval settings** (if required before execution).

**4. Final Review & Go-Live**

**Final Review & Validation**

Verify that all configurations are correct.

Ensure compliance modules are correctly linked.

**Enable Token Transactions**

Unlock or create the token.

Monitor initial trades and investor onboarding.

**Continuous Monitoring & Reporting**

Maintain compliance checks via Chain Capital[']{dir="rtl"}s integrated
reporting tools.

Adjust settings dynamically based on market conditions or regulatory
updates.

**Key Features**

**Modular & Scalable Token Design:**

Modifying basic token details, setting compliance parameters, and
transfer rules.

Modular & Scalable Token Design: Ability to modify transfer rules,
compliance settings, and supply limits after issuance.

**Smart Contract Rule Enforcement and Automation**:

Deploying token settings and rules on the blockchain for compliance
enforcement.

**Investor Management**:

Qualifying investors, viewing PII, and managing shareholder information.

**Real-Time Cap Table and Reporting**:

- Accessing cap ![Image](media/image1.png){width="4.993011811023622in"
  height="10.118113517060367in"}tables, bulk distribution of tokens to
  selected qualifying investors generating position reports, and
  managing investor transactions.

- Instant updates to **cap tables** for issuers, investors, and
  regulators.

  **Automated Compliance Enforcement**

  Smart contract-based compliance ensures regulatory adherence **without
  manual intervention**.

  **Seamless Approvals for Primary & Secondary Market Access**

  Future: Issuers can **define liquidity / venue options**, integrating
  and enabling access to markets **OTC, CEX, and decentralised venues**.

sequenceDiagram

participant Issuer

participant ChainCapital

participant Guardian

participant Blockchain

participant GuardianPolicyEnforcement

%% Step 1: Token Configuration Access

Issuer-\>\>+ChainCapital: Navigate to Token Settings

ChainCapital\--\>\>Issuer: Display Token Settings page

%% Step 2: Modify Token Information

Issuer-\>\>+ChainCapital: Modify basic token information (name, symbol,
metadata)

Issuer-\>\>+ChainCapital: Define token type, quantity, and metadata

ChainCapital\--\>\>Issuer: Confirm token information updates

%% Step 3: Ownership Transfer

Issuer-\>\>+ChainCapital: Transfer token contract ownership (if
necessary)

ChainCapital-\>\>+Blockchain: Update ownership details on-chain

Blockchain\--\>\>ChainCapital: Confirm ownership transfer

ChainCapital\--\>\>Issuer: Notify of successful ownership transfer

%% Step 4: Investor Claims and Jurisdictions

Issuer-\>\>+ChainCapital: Define investor claims required on CHAINID

ChainCapital-\>\>+Guardian: Link claims for eligibility checks

Guardian\--\>\>GuardianPolicyEnforcement: Validate investor claims

GuardianPolicyEnforcement\--\>\>Guardian: Confirm claim enforcement

Guardian\--\>\>ChainCapital: Confirm eligibility checks

Issuer-\>\>+Guardian: Select allowed countries for token circulation

Guardian\--\>\>ChainCapital: Enforce jurisdiction restrictions

ChainCapital\--\>\>Issuer: Confirm jurisdiction settings

%% Step 5: Supply Limits and Transfer Rules

Issuer-\>\>+ChainCapital: Define token supply limits

ChainCapital\--\>\>Issuer: Confirm supply limits

Issuer-\>\>+ChainCapital: Configure secondary market transfer rules

ChainCapital-\>\>+Guardian: Implement transfer rules (time-based limits,
approvals, venues)

Guardian\--\>\>GuardianPolicyEnforcement: Enforce rules

GuardianPolicyEnforcement\--\>\>Guardian: Confirm enforcement

Guardian\--\>\>ChainCapital: Notify of rule enforcement

ChainCapital\--\>\>Issuer: Confirm transfer rule setup

%% Step 6: Smart Compliance Module Linking (optional)

Issuer-\>\>+ChainCapital: Add additional compliance modules (e.g., risk
scoring)

ChainCapital-\>\>+Guardian: Integrate compliance policies and rule
enforcement

Guardian-\>\>+Blockchain: Deploy smart compliance module contracts

Blockchain\--\>\>Guardian: Confirm deployment

Guardian\--\>\>ChainCapital: Notify of successful compliance module
addition

%% Step 7: Finalise Token Configuration

ChainCapital-\>\>+Guardian: Deploy configured token settings

Guardian-\>\>+Blockchain: Deploy token on-chain

Blockchain\--\>\>Guardian: Confirm deployment

Guardian\--\>\>ChainCapital: Confirm token configuration

ChainCapital\--\>\>Issuer: Notify issuer of successful token
configuration

%% Step 8: Manage Agents and Token Actions

Issuer-\>\>+ChainCapital: Add agents for token and investor management

ChainCapital\--\>\>Issuer: Confirm agent assignment

Issuer-\>\>+ChainCapital: Navigate to Token Actions to manage supply

Issuer-\>\>+ChainCapital: Select investors and perform token actions
(mint, distribute)

ChainCapital-\>\>+Guardian: Execute token actions

Guardian-\>\>+Blockchain: Process minting and bulk distribution

Blockchain\--\>\>Guardian: Confirm transaction execution

Guardian\--\>\>ChainCapital: Notify of successful minting and transfer

ChainCapital\--\>\>Issuer: Confirm token allocation to investors

%% Step 9: Transaction History and Cap Table Management

Issuer-\>\>+ChainCapital: Access Transaction tab for token history

ChainCapital\--\>\>Issuer: Display transaction history

Issuer-\>\>+ChainCapital: Access Investor List for real-time cap table

ChainCapital\--\>\>Issuer: Display cap table with investor details

Issuer-\>\>+ChainCapital: Review shareholder PII and transaction details

%% Step 10: Shareholder and Candidate Management

Issuer-\>\>+ChainCapital: Access Candidates tab for new shareholder
applications

Issuer-\>\>+Guardian: Perform due diligence and qualify investors

Guardian-\>\>+GuardianPolicyEnforcement: Verify investor compliance

GuardianPolicyEnforcement\--\>\>Guardian: Confirm compliance status

Guardian\--\>\>ChainCapital: Approve qualified investors

ChainCapital\--\>\>Issuer: Confirm investor qualifications

%% Step 11: Position Reports and Market Management

Issuer-\>\>+ChainCapital: Create position report for cap table

Issuer-\>\>+ChainCapital: Name the report and choose date/time

ChainCapital\--\>\>Issuer: Provide downloadable position report

%% Step 12: New Shareholder Management

Issuer-\>\>+ChainCapital: Upload known shareholder information

ChainCapital\--\>\>Guardian: Validate shareholder information

Guardian\--\>\>ChainCapital: Qualify shareholders and update cap table

ChainCapital\--\>\>Issuer: Display shareholder updates

%% Step 13: Primary and Secondary Market Configuration

Issuer-\>\>+ChainCapital: Access Primary Market tab for subscriptions

ChainCapital\--\>\>Issuer: Display subscription orders

Issuer-\>\>+Guardian: Manage investor purchases via the Primary Market

Guardian-\>\>+ChainCapital: Confirm subscription orders

Issuer-\>\>+ChainCapital: Configure liquidity options in the Secondary
Market (OTC/CEX)

ChainCapital-\>\>+Guardian: Enforce secondary market compliance rules

Guardian\--\>\>GuardianPolicyEnforcement: Validate trades before
execution

GuardianPolicyEnforcement\--\>\>Guardian: Confirm execution compliance

Guardian\--\>\>ChainCapital: Confirm liquidity settings

ChainCapital\--\>\>Issuer: Notify issuer of finalised market
configuration
