**Detail Servicing and Asset Lifecycle Management Specification**

**Value Proposition**

**For Investors**

**Seamless Transferability**

Enable peer-to-peer transfers of digital securities directly between
qualified investors.

Eliminate the delays and inefficiencies of traditional processes
involving intermediaries and manual approvals.

**Fully Digitised Experience**

Empower investors to take full control of their securities, including
investing, transferring tokens, and requesting recoveries---all on a
single platform.

Say goodbye to reliance on emails, phone calls, or human intervention.

**Real-Time Transparency**

Access live updates on issuer actions, token status, and personalised
data via an intuitive dashboard.

Gain unparalleled visibility and confidence in investment portfolios.

**For Issuers**

**Cost Efficiency**

Automate compliance and data reconciliation, significantly reducing
operational overhead and saving time.

Streamline workflows to eliminate redundant and manual tasks.

**Enhanced Investor Management**

Scale investor management with automated workflows and centralised data
rooms.

Use permissioned systems to delegate responsibilities effectively while
maintaining control.

**Sustained Control and Enforcement of Ownership Rights**

Retain full oversight of securities and investor interactions, even on
decentralized or shared ledgers.

Support both platform-managed and self-custody options while ensuring
compliance and ownership rights enforcement.

**For Agents**

**Operational Scalability**

Utilise automated processes and bulk operations to manage increasing
customer bases efficiently.

Drive revenue growth by reducing time and effort on repetitive tasks.

**Real-Time Insights**

Access up-to-date data for faster and more informed decision-making.

Improve operational efficiency with transparent, real-time updates.

**Focus on Strategic Value**

Free up time from routine operations to focus on high-value activities,
enhancing client service and building stronger relationships.

Leverage centralised tools to optimise workflows and deliver superior
outcomes for stakeholders.

**High Level Features**

1.  **Corporate Actions with Guardian Wallet**

    - **Minting/Burning Tokens:** Create or reduce the supply of digital
      securities efficiently.

    - **Pausing Tokens:** Temporarily halt activities associated with
      specific tokens for compliance or operational needs.

    - **Blocking/Unblocking Tokens:** Restrict or enable individual
      investors or subsets of tokens.

    - **Force Transfers:** Execute token transfers between investors,
      immutably recorded on the blockchain.

    - **Conditional Transfers:** Implement jurisdiction-specific
      controls requiring issuer or agent approvals for transfers.

<!-- -->

2.  **Cap Table Management**

    - **Real-Time Updates:** Automatic updates to ownership records for
      every transaction.

    - **Investor Visibility:** Effortless tracking of investor details,
      wallet information, and transaction history.

    - **Exportable Reports:** Generate detailed cap table and position
      reports for issuers and auditors.

<!-- -->

3.  **Token Management and Operations**

    - **Lifecycle Controls:** Mint, burn, pause, block, or execute force
      transfers with ease.

    - **Bulk Operations:** Manage multiple investors or tokens
      simultaneously to enhance efficiency.

<!-- -->

4.  **Primary Market Management**

    - **Subscriptions:** Enable open-ended or periodic subscription
      management for onboarding and token allocation.

    - **Redemptions:** Execute seamless redemptions - interval
      (periodic) and on request, ensuring timely payouts to investors.

<!-- -->

5.  **Advanced Reporting Tools**

    - **Position Reports:** Export investor holdings, transaction
      history, and cap table updates with precision.

    - **Comprehensive Insights:** Provide auditors and issuers with
      real-time analytics and detailed transaction summaries.

**High Level Workflow for Servicing and Asset Lifecycle Management**

This workflow integrates servicing and asset lifecycle management with
Guardian[']{dir="rtl"}s policy enforcement, investor controls, and
role-based access. It also aligns with prior roles and responsibilities
while ensuring efficient, rule-based operations, compliance, and
automation.

**Capabilities for Servicing and Asset Lifecycle Management**

  ----------------- -----------------------------------------------------
     **Feature**                       **Description**

  Minting & Burning  Allows issuers to create new digital securities or
                            reduce supply through token burning.

  Pausing & Locking   Temporarily halt token activity for compliance or
       Tokens                     operational requirements.

     Blocking &      Restrict or enable investors or specific subsets of
     Unblocking            tokens based on compliance conditions.

   Force Transfers   Allow issuers or agents to execute token transfers
      including        between investors, immutably recorded on-chain.
     redemptions    

     Conditional        Implement jurisdictional or compliance-based
      Transfers     restrictions that require issuer or agent approvals.
      including       Redemptions on request from investors or periodic
     redemptions    redemptions - time based (the former requires auto or
                                      manual approval)

      Cap Table       Real-time updates to ownership records, investor
     Management      visibility, and exportable reports for compliance.

      Investor         Bulk operations, automated KYC/AML checks, and
     Management               lifecycle tracking for investors.

     Rule-Based      Automate token movement based on asset type, issuer
      Lifecycle          restrictions, and investor qualifications.
      Controls      

   Primary Market      Subscription and redemption processes, enabling
     Management               efficient onboarding and payouts.

     Reporting &     Position reports, transaction history tracking, and
      Analytics            real-time dashboards for stakeholders.
  ----------------- -----------------------------------------------------

**Roles & Responsibilities in Servicing & Asset Lifecycle Management**

  ---------------- ---------------------------------------------------------
  **Role**         **Responsibilities**

  Issuer (Owner    \- Requests mint, burn, pause, block, or force
  Role)            transfers.- Manages token supply and investor
                   interactions.- Implements role-based access and
                   rule-based lifecycle controls.- Oversees bulk operations
                   and compliance enforcement.- Ensures redemptions and
                   investor distributions align with regulatory policies.

  Agent (Placement \- Executes servicing and lifecycle operations as
  Agent,           delegated by the issuer.- Oversees investor onboarding,
  Administrator,   compliance approvals, and eligibility enforcement.-
  Fund Manager,    Manages secondary market interactions and liquidity
  Broker-Dealer)   management.- Ensures reporting, cap table
                   synchronization, and investor servicing.

  Legal &          \- Enforces KYC/AML, transfer restrictions, and investor
  Compliance       qualifications.- Ensures only compliant investors can
  (Regulatory      trade or receive redemptions.- Implements automated
  Officer,         rule-based controls for token servicing.- Approves or
  Counsel,         blocks non-compliant servicing operations.- Generates
  Guardian Policy  audit reports and compliance dashboards for regulators.
  Enforcement)     

  Guardian Policy  \- Implements conditional transfers, forced redemptions,
  Enforcement      and investor-specific rules.- Enforces token lifecycle
                   policies dynamically based on issuer-imposed
                   constraints.- Approves, denies, or flags rule-based
                   lifecycle actions for review.- Prevents non-compliant
                   transactions and investor misconduct.- Ensures role-based
                   access and permissions for servicing agents.

  Guardian Wallet  \- Custodial control over issuer source wallets, investor
                   redemptions, and servicing transactions.- Executes bulk
                   operations for investor transfers, settlements, and
                   reporting.- Ensures investor whitelisting and security
                   compliance in token servicing.- Facilitates real-time
                   tracking of investor positions and token lifecycle
                   events.

  Blockchain       \- Processes on-chain transactions for minting, burning,
                   redemptions, and lifecycle updates.- Records cap table
                   updates and investor transaction history immutably.-
                   Ensures auditability of servicing and asset lifecycle
                   events.- Supports real-time reporting for regulatory and
                   operational oversight.
  ---------------- ---------------------------------------------------------

**Step-by-Step Workflow for Servicing & Asset Lifecycle Management**

**Phase 1: Token Servicing Actions (Mint, Burn, Lock, Redeem, Force
Transfer)**

Issuer requests token servicing action (mint, burn, pause, lock, force
transfer, redemption).

Chain Capital validates request and forwards it to Guardian Policy
Enforcement.

Guardian Policy Enforcement enforces compliance checks (KYC, AML,
investor jurisdiction, issuer-imposed restrictions).

If approved, Guardian Wallet:

Mints or burns tokens in accordance with the request.

Pauses or locks investor wallets if necessary.

Executes force transfers between investors, ensuring immutability on the
blockchain.

Processes redemptions and subscription payouts automatically.

a.  Blockchain records servicing events, updating cap tables in
    real-time.

**1b. Key Token Servicing Workflows**

**1.1 Redemptions (Token Buyback & Asset Payout)**

Redemptions involve buying back tokens from investors for payouts or
capital returns. Tokens are typically burned post-redemption to reflect
settlement.

**Key Features:**

**Scheduled vs. On-Demand Redemptions:** Can be executed on predefined
dates (e.g., quarterly, semi-annually, annually) or upon investor
request.

**Interest vs. Principal Redemptions:** Ensures correct separation
between distributions and principal repayments.

**Prepayment Penalties & Tranche Prioritisation:** Applies waterfall
logic where senior tranches are redeemed first.

**Regulatory & Jurisdictional Compliance:** Some redemptions require
approvals before execution.

**Workflow:**

**Investor submits a redemption request via Chain Capital.**

**Validation & Compliance:**

Checks eligibility, jurisdiction compliance, and tranche prioritisation.

Guardian Policy Enforcement confirms fund availability and prepayment
penalties.

**Multi-Signature Approval:** Requires sign-off from independent
signatories.

**Guardian Wallet Execution:**

Settles funds in stablecoins or fiat.

Burns redeemed tokens and updates the cap table.

**Investor & Regulatory Notifications:** Ensures transparency.

**1.2 Minting & Burning Tokens**

**Minting:** Creates new digital securities.\
**Burning:** Reduces token supply when assets are redeemed or
liquidated.

**Key Features:**

**Credit Enhancement:** Issuers must provide sufficient
over-collateralisation before minting.

**Automated Capital Calls:** Minting is triggered only when conditions
are met.

**Waterfall Enforcement:** Maintains structured finance hierarchy.

**Workflow:**

**Issuer submits mint/burn request.**

**Validation & Compliance:**

Checks supply constraints and regulatory approvals.

Ensures adherence to capital structure constraints.

**Multi-Signature Approval:** Requires issuer and compliance agent
authorisation.

**Guardian Wallet Execution:**

Mints/burns tokens and updates tranche allocation.

**Blockchain Records & Notifications:** Updates investor records and cap
tables.

**1.3 Pausing & Locking Tokens**

Used to temporarily **pause** all transactions or **lock** specific
wallets.

**Key Features:**

**Event-Triggered Pauses:** Automatic enforcement in case of collateral
deterioration.

**Regulatory Freezes:** Legal authorities may mandate token locking.

**Multi-Signature Approvals:** Required before enforcement.

**Workflow:**

**Issuer requests a pause/lock action.**

**Validation & Compliance:** Chain Capital verifies triggers such as:

Market risk thresholds.

Regulatory orders.

Contractual obligations.

**Multi-Signature Approval:** Requires approval from independent
parties.

**Guardian Wallet Execution:** Enforces restrictions and updates
records.

**Investor Notifications:** Ensures transparency.

**1.4 Blocking & Unblocking Tokens**

Restricts investors from transacting due to regulatory, compliance, or
sanction-related reasons.

**Key Features:**

**AML & KYC Enforcement:** Investors failing regulatory checks are
blocked.

**Sanctions Compliance:** Aligns with global watchlists.

**Soft vs. Hard Blocks:** Allows restricted transactions in certain
cases.

**Workflow:**

**Issuer requests blocking/unblocking of an investor.**

**Validation & Compliance:** Chain Capital verifies regulatory screening
and watchlists.

**Multi-Signature Approval:** Compliance and risk teams sign off.

**Guardian Wallet Execution:** Blocks/unblocks the
investor[']{dir="rtl"}s ability to transact.

**Blockchain Records & Investor Notifications:** Ensures compliance
transparency.

**1.5 Force Transfers**

Transfers assets forcibly due to liquidation, disputes, or regulatory
enforcement.

**Key Features:**

**Regulatory Enforcement:** Ensures compliance with investor agreements
and structured finance obligations.

**Collateral Recovery:** Aligns with default procedures.

**Workflow:**

**Issuer submits a force transfer request.**

**Validation & Compliance:**

Checks investor agreements and legal obligations.

**Multi-Signature Approval:** Requires sign-off from compliance
officers.

**Guardian Wallet Execution:**

Transfers tokens and updates cap tables.

**Blockchain Records & Investor Notifications:** Ensures legal
auditability.

**1.6 Conditional Transfers**

Transfers occur only if pre-set conditions (e.g., KYC checks, tranche
restrictions, tax compliance) are met.

**Key Features:**

**Multi-Signature Approvals:** Requires consent from multiple parties.

**Investor Eligibility Enforcement:** Restricts transfers to qualified
investors.

**Workflow:**

**Investor initiates a transfer request.**

**Validation & Compliance:** Checks for tranche-specific rules, tax
clearance, and investor qualifications.

**Multi-Signature Approval:** Requires three-party sign-off.

**Guardian Wallet Execution:** Processes the transfer and updates cap
tables.

**Blockchain Records & Notifications:** Maintains auditability.

2.  **Rule-Based Lifecycle Controls**

    Issuer or Agent configures rule-based lifecycle controls for
    investor and asset types.

    Guardian Policy Enforcement enforces predefined rules, such as:

    Jurisdiction-based restrictions.

    Conditional transfers requiring agent or regulatory approval.

    Automated token burning upon maturity of assets.

    Guardian Wallet executes servicing functions dynamically, based on
    investor qualification or issuer-imposed constraints.

<!-- -->

3.  **Investor Management & Bulk Operations**

    Issuer or Agent initiates bulk operations (mass investor updates,
    batch redemptions, whitelist updates).

    Includes: KYC validation and investor whitelisting - 'green light'.

    Guardian Policy Enforcement validates bulk requests. Ensures
    investor qualification before transactions.

    Guardian Wallet executes:

    Investor onboarding approvals or restrictions.

    Large-scale subscription orders and payouts.

    Secondary market integrations (OTC, exchange-based transfers).

<!-- -->

4.  **Cap Table Management**

- **Real-Time Ownership Tracking:** Ensures investor records are
  accurate post-transaction, reflecting servicing events (e.g.,
  redemptions, force transfers, investor changes).

- **Blockchain-Based Transparency:** Maintains an immutable audit trail.

**Reporting & Compliance Tracking**

- **Issuer Reconciliation Reports:** Token supply, investor holdings,
  and transactions.

- **Regulatory Submissions:** Automated compliance tracking.

- **Analytics Dashboard:** Provides operational tracking for issuers

  Guardian Wallet generates automated reports for:

  Issuer reconciliation of token supply.

  Investor holdings and transfer records.

  Auditor & regulator submission.

**Key Token Servicing & Asset Lifecycle Management Functions**

**1) Redemptions (Token Redemption & Asset Payout)**

**Functional Details**

- Redemptions involve recalling tokens from investors, either for a
  payout (fixed income, structured credit) or as a capital return
  (equity).

- Tokens may be burned upon redemption to reflect asset settlement.

- Redemption eligibility is validated via Guardian Policy Enforcement
  before execution.

- Redemptions can a) occur on specified issue dates usually annual,
  semi-annually or quarterly according to a day count convention which
  is specified on issuance or b) on demand (investor or by the issuers
  or issuer agent.

**Workflow**

Investor submits redemption request through Chain Capital.

Chain Capital forwards request to Guardian Policy Enforcement for
validation.

Guardian verifies investor compliance, checking:

- Token / Investor eligibility for redemption (subject to asset class,
  timing).

- Investor qualification & jurisdictional restrictions.

  Guardian Wallet initiates fund settlement (stablecoin, fiat
  conversion).

  Blockchain burns redeemed tokens, updating the cap table in real-time.

  Investor receives settlement confirmation.

**Responsible Roles**

**Investor:** Requests redemption.

**Chain Capital:** Processes requests & updates cap table.

**Guardian Policy Enforcement:** Validates investor eligibility &
compliance.

**Guardian Wallet:** Settles funds & processes token burns.

**2) Minting & Burning Tokens**

**Functional Details**

**Minting:** Creates new digital securities for issuers or secondary
issuance.

**Burning:** Reduces token supply when assets are redeemed, liquidated,
or retired.

**Workflow**

Issuer submits mint/burn request.

Chain Capital verifies supply constraints & compliance.

Guardian Policy Enforcement approves/rejects request based on:

Issuer authorisation.

Transfer restrictions.

Guardian Wallet executes mint/burn transaction.

Blockchain updates the cap table, reflecting the new token supply.

**Responsible Roles**

**Issuer:** Requests minting/burning.

**Chain Capital:** Manages issuance workflows.

**Guardian Policy Enforcement:** Ensures compliance.

**Guardian Wallet:** Executes transactions.

**3) Pausing & Locking Tokens**

**Functional Details**

**Pausing:** Temporarily stops all token transactions.

**Locking:** Prevents specific investors or wallets from transferring
tokens.

**Workflow**

Issuer or Compliance Agent requests pause/lock action.

Chain Capital verifies action & forwards to Guardian Policy Enforcement.

Guardian Policy Enforcement applies restrictions:

Pausing stops all transfers.

Locking prevents specific wallets from interacting.

Guardian Wallet enforces new rules.

Blockchain records pause/lock event, notifying investors.

**Responsible Roles**

**Issuer:** Requests pausing/locking.

**Guardian Policy Enforcement:** Enforces compliance.

**Guardian Wallet:** Restricts transactions.

**4) Blocking & Unblocking Tokens**

**Functional Details**

Used to block investors from selling or receiving tokens due to
regulatory reasons.

Unblocking allows transactions again after compliance approval.

**Workflow**

1.  Issuer requests blocking/unblocking of an investor.

2.  Chain Capital verifies request & sends to Guardian Policy
    Enforcement.

3.  Guardian Policy Enforcement checks for compliance violations.

4.  Guardian Wallet executes block/unblock action, preventing/allowing
    transactions.

5.  Blockchain updates the whitelist & cap table**.**

**Responsible Roles**

**Issuer:** Requests blocking/unblocking.

**Guardian Policy Enforcement:** Ensures regulatory compliance.

**Guardian Wallet:** Enforces restrictions.

**5) Force Transfers**

**Functional Details**

- Used when tokens must be transferred as a manual override from an
  investor back to the issuer by an issuer or administrator.

- Applies in dispute resolution, liquidations, or regulatory-mandated
  actions.

**Workflow**

1.  Issuer or Compliance Agent requests a forced transfer.

<!-- -->

6.  Chain Capital validates request & checks regulatory obligations.

7.  Guardian Policy Enforcement confirms compliance (jurisdiction &
    investor rules).

8.  Guardian Wallet executes forced transfer between wallets.

9.  Blockchain records forced transfer, notifying investors.

**Responsible Roles**

**Issuer:** Requests forced transfers.

**Guardian Policy Enforcement:** Enforces compliance.

**Guardian Wallet:** Executes transfers.

**6) Conditional Transfers**

**Functional Details**

- Tokens can only be transferred when conditions are met (e.g., investor
  KYC, jurisdiction approval).

- Conditions are automated via smart contract rules.

**Workflow**

Investor initiates a token transfer.

Guardian Policy Enforcement verifies eligibility:

- Investor meets qualification rules.

- Jurisdiction allows transfer.

  If conditions are met, Guardian Wallet executes transfer.

  Blockchain records the transaction, updating investor records.

**Responsible Roles**

**Investor:** Initiates transfer.

**Guardian Policy Enforcement:** Approves/rejects based on rules.

**Guardian Wallet:** Executes transfers.

**7) Cap Table Management**

**Functional Details**

- Ensures real-time tracking of investor ownership.

- Automatically updates after each transaction.

**Workflow**

1.  Guardian Wallet tracks investor holdings in real-time.

<!-- -->

10. Transactions (buy/sell/redemptions) trigger cap table updates.

11. Cap table is stored on the blockchain for auditability.

12. Issuers & Agents can export reports anytime.

**Responsible Roles**

**Chain Capital:** Displays updated cap table.

**Guardian Wallet:** Updates investor positions.

**Blockchain:** Records immutable transactions.

**8) Investor Management**

**Functional Details**

- Onboards investors & assigns them eligibility claims.

- Enables bulk updates to investor permissions.

**Workflow**

1.  Investor submits KYC details.

<!-- -->

13. Guardian Policy Enforcement approves investor onboarding.

14. Guardian Wallet whitelists investor for permitted transactions.

15. Blockchain assigns the investor[']{dir="rtl"}s ownership.

16. Issuer can manage investor permissions dynamically.

**Responsible Roles**

**Investor:** Provides identity data.

**Guardian Policy Enforcement:** Approves onboarding.

**Guardian Wallet:** Manages permissions.

**9) Rule-Based Lifecycle Controls**

**Functional Details**

- Applies automated transaction rules based on asset type & investor
  qualification.

**Workflow**

1.  Issuer configures asset rules (e.g., only accredited investors can
    trade).

<!-- -->

17. Guardian Policy Enforcement monitors transactions.

18. If transfer violates the rule, it is blocked.

19. Blockchain executes only allowed transactions.

**Responsible Roles**

**Issuer:** Defines rules.

**Guardian Policy Enforcement:** Enforces them.

**Blockchain:** Executes compliant transactions.

**10) Primary Market Management**

**Functional Details**

- Manages subscriptions & redemptions.

- Ensures new investors meet eligibility before buying tokens.

**Workflow**

1.  Investor subscribes to a token issuance.

<!-- -->

20. Guardian Policy Enforcement verifies investor eligibility.

21. Guardian Wallet processes payment & allocates tokens.

22. Blockchain records the new investor[']{dir="rtl"}s ownership.

**Responsible Roles**

**Investor:** Subscribes to tokens.

**Guardian Policy Enforcement:** Approves transactions.

**Guardian Wallet:** Allocates assets.

**11) Reporting & Analytics**

**Functional Details**

- Provides real-time cap table updates, compliance reports, and investor
  activity logs.

**Workflow**

1.  Issuer requests investor position report.

<!-- -->

23. Guardian Wallet retrieves real-time data.

24. Blockchain ensures transparency & auditability.

25. Issuer exports reports for regulators & auditors.

**Responsible Roles**

**Issuer:** Generates reports.

**Guardian Wallet:** Provides real-time analytics.

**Blockchain:** Stores immutable transaction history.

\- Automated compliance with rule-based lifecycle management.\
- Real-time cap table updates, investor tracking, and analytics.\
- Guardian Policy Enforcement ensures compliance & regulatory approval.\
- Guardian Wallet secures servicing actions & investor transactions.

**Overview: Servicing and Asset Lifecycle Management Workflow**

Additional Sub workflows will be provided for each core initial function

The following focussed on the operation controls post 'token
actions'/'token servicing' i.e. from 2. on page 11.

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

participant Agent

participant Investor

participant ComplianceAuditor

%% Rule-Based Lifecycle Controls with Multi-Sig Approval

Issuer-\>\>+ChainCapital: Define rule-based lifecycle constraints

ChainCapital-\>\>+MultiSigApprovers: Request governance approval for
rules

MultiSigApprovers\--\>\>ChainCapital: Approval granted

ChainCapital-\>\>+GuardianPolicyEnforcement: Enforce compliance policies
dynamically

GuardianPolicyEnforcement-\>\>+GuardianWallet: Enforce restrictions &
approve automated transfers

GuardianWallet-\>\>+Blockchain: Execute transactions based on lifecycle
rules

Blockchain\--\>\>GuardianWallet: Confirm lifecycle enforcement

GuardianWallet\--\>\>Issuer: Confirm rule enforcement & notify
stakeholders

%% Investor Management & Bulk Operations with Enhanced Tracking

Agent-\>\>+ChainCapital: Initiate bulk operation (whitelist updates,
batch redemptions, subscription allocations)

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate investor
operations (KYC, jurisdiction checks, transfer limits)

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Multi-sig review for
high-value bulk operations

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement-\>\>+GuardianWallet: Execute bulk transaction
requests

GuardianWallet-\>\>+Blockchain: Process bulk updates (token allocations,
redemption fulfillment, forced transfers)

Blockchain\--\>\>GuardianWallet: Confirm bulk execution

GuardianWallet\--\>\>Agent: Provide real-time update on investor
positions & cap table adjustments

GuardianWallet\--\>\>Investor: Notify investors about updates & opt-out
options if applicable

%% Reporting & Compliance Tracking with Audit Mechanisms

Agent-\>\>+ChainCapital: Request compliance & investor transaction
report

ChainCapital-\>\>+GuardianWallet: Generate automated reporting data

GuardianWallet-\>\>+Blockchain: Retrieve transaction logs for audit &
reconciliation

Blockchain\--\>\>GuardianWallet: Confirm data retrieval

GuardianWallet\--\>\>Agent: Deliver cap table, investor positions, and
transaction reports

Agent\--\>\>Investor: Provide investor-specific compliance & transaction
reports

ComplianceAuditor-\>\>+Blockchain: Request immutable audit logs for
regulatory review

Blockchain\--\>\>ComplianceAuditor: Provide verifiable transaction
history & compliance validation

![Image](media/image1.png){width="10.118113517060367in"
height="4.263803587051618in"}

**Deeper Dive Token Servicing Workflows: Servicing & Asset Lifecycle
Management Functions**

This section outlines the detailed workflows for **Redemptions, Minting
& Burning, Pausing & Locking Tokens, Blocking & Unblocking Tokens, Force
Transfers, and Conditional Transfers** within the servicing and asset
lifecycle management framework.

**1) Redemptions (Token Buyback & Asset Payout)**

**Functional Enhancements:**

**Scheduled vs. On-Demand Redemptions:** Redemptions must align with
predefined schedules and priority-based repayment structures.

**Interest vs. Principal Redemptions:** Ensure accurate separation
between interest distributions and principal buybacks.

**Prepayment Penalties:** Early redemptions may trigger penalties or
require investor compensation.

**Investor Waterfall Prioritisation:** Senior tranches must be redeemed
first, ensuring risk mitigation.

**Regulatory Compliance Checks:** Some jurisdictions require approvals
before executing redemptions.

**Multi-Signature Approvals:** Ensure that redemption approvals require
at least 4-eyes approval (two independent signatories).

**Updated Workflow:**

**Investor** submits a redemption request via **ChainCapital**.

**ChainCapital** validates eligibility, checking:

Redemption schedule adherence.

Investor jurisdiction compliance.

Tranche prioritisation and cash flow waterfall rules.

**GuardianPolicyEnforcement** verifies the request, ensuring:

Investor qualifications.

Compliance with prepayment penalties and fund availability.

**Multi-Signature Approval:** Requires approval from at least two
independent signatories before proceeding.

**GuardianWallet** initiates settlement:

Determines whether funds are in stablecoins or fiat.

Executes token burn, reflecting the redemption.

**Blockchain** confirms execution and updates the cap table.

**Investor** receives payout confirmation.

**Regulatory & Investor Notifications** are sent, ensuring transparency.

**2) Minting & Burning Tokens**

**Functional Enhancements:**

**Credit Enhancement Mechanisms:** Ensure issuers provide sufficient
over-collateralisation before minting.

**Automated Capital Calls:** Minting should be triggered only when
required conditions are met.

**Pro-Rata Burning:** When burning tokens, maintain correct tranche
reductions.

**Waterfall Enforcement:** Ensure any minting aligns with the structured
finance hierarchy.

**Multi-Signature Approvals:** Require multiple parties to approve new
minting or burning operations.

**Updated Workflow:**

**Issuer** submits a minting/burning request to **ChainCapital**.

**ChainCapital** validates:

Credit enhancement levels.

Regulatory approvals for minting.

Waterfall priority rules.

**GuardianPolicyEnforcement** ensures:

Compliance with capital structure constraints.

Adherence to pre-defined triggers.

**Multi-Signature Approval:** Requires sign-off from compliance agents
and the issuer.

**GuardianWallet** executes the transaction:

Updates cap table and confirms tranche allocation.

Issues necessary notifications to investors.

**Blockchain** validates execution and permanently records transaction
history.

**Regulatory and investor notifications** are sent for transparency.

**3) Pausing & Locking Tokens**

**Functional Enhancements:**

**Event-Triggered Pauses:** Ensure automatic pauses in case of
collateral deterioration.

**Regulatory Freezes:** Legal requirements may mandate asset locking.

**Multiple Locking Levels:** Distinguish between transfer restrictions
and full freezes.

**Multi-Signature Approval:** Enforce 4-eyes approval for any freeze or
unlock action.

**Updated Workflow:**

**Issuer** requests a pause/lock action via **ChainCapital**.

**ChainCapital** evaluates triggers:

Market risk thresholds.

Regulatory orders.

Contractual obligations.

**GuardianPolicyEnforcement** verifies compliance and executes policy
enforcement.

**Multi-Signature Approval:** Two or more independent approvals are
required before proceeding.

**GuardianWallet** enforces restriction:

Updates blockchain records to reflect token status.

Notifies impacted investors and counterparties.

**Investor Notifications** ensure all stakeholders are informed.

**4) Blocking & Unblocking Tokens**

**Functional Enhancements:**

**AML & KYC Compliance:** Block investors who fail regulatory screening.

**Investor-Specific Restrictions:** Differentiate between hard blocks
(full lockout) and soft blocks (restricted transfers).

**Sanctions Compliance:** Ensure adherence to global watchlists.

**Multi-Signature Approval:** Required for blocking or unblocking
high-risk accounts.

**Updated Workflow:**

**Issuer** submits a block/unblock request to **ChainCapital**.

**ChainCapital** validates compliance:

Conducts AML/KYC checks.

Cross-references with regulatory watchlists.

**GuardianPolicyEnforcement** verifies legal enforceability.

**Multi-Signature Approval:** Compliance team and risk officers must
approve.

**GuardianWallet** executes action:

Updates investor whitelist and cap table.

Records compliance justification on-chain.

**Investor Notifications** ensure all impacted stakeholders are aware of
status changes.

**5) Force Transfers**

**Functional Enhancements:**

**Regulatory Enforcement:** Ensure force transfers comply with legal
requirements.

**Investor Consent Requirements:** Some transfers require approval from
affected investors.

**Collateral Recovery:** Ensure forced transfers align with default
procedures.

**Multi-Signature Approval:** Required for execution.

**Updated Workflow:**

**Issuer** submits a forced transfer request to **ChainCapital**.

**ChainCapital** validates legal and regulatory requirements.

**GuardianPolicyEnforcement** checks:

Investor agreements and governing rules.

Compliance with structured finance obligations.

**Multi-Signature Approval:** Requires approval from two or more
independent compliance officers.

**GuardianWallet** executes transfer:

Records transaction on blockchain.

Ensures legal transparency and compliance.

**Investor & Issuer Notifications** ensure stakeholders are informed.

**6) Conditional Transfers**

**Functional Enhancements:**

**Multi-Signature Approvals:** Require consent from multiple parties
before executing transactions.

**Tranche-Specific Transfers:** Restrict transfers to specific investor
classes.

**Tax Compliance Verification:** Ensure tax clearance before execution.

**Updated Workflow:**

**Investor** initiates a transfer request through **ChainCapital**.

**ChainCapital** validates:

Multi-party approval requirements.

Tranche-specific transfer conditions.

Compliance with collateralisation rules.

**GuardianPolicyEnforcement** verifies regulatory tax and jurisdictional
compliance.

**Multi-Signature Approval:** Requires at least three-party sign-off.

**GuardianWallet** executes transaction:

Ensures necessary sign-offs are recorded.

Updates cap table and transaction history.

**Blockchain** confirms execution, ensuring permanence and transparency.

**Investor Notifications** are sent to all stakeholders, maintaining
auditability.

**Workflow Diagrams (Updated)**

**1) Redemptions (Token Buyback & Asset Payout)**

sequenceDiagram

participant Investor

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

Investor-\>\>+ChainCapital: Submit redemption request

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate eligibility

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject redemption

GuardianPolicyEnforcement-\>\>+GuardianWallet: Initiate fund settlement

GuardianWallet-\>\>+Blockchain: Burn redeemed tokens, update cap table

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Investor: Confirm redemption & settlement

**2) Minting & Burning Tokens**

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

Issuer-\>\>+ChainCapital: Request minting/burning

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate request

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject mint/burn

GuardianPolicyEnforcement-\>\>+GuardianWallet: Execute mint/burn
transaction

GuardianWallet-\>\>+Blockchain: Record mint/burn event, update cap table

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Issuer: Notify mint/burn completion

**3) Pausing & Locking Tokens**

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

participant Investor

Issuer-\>\>+ChainCapital: Request pause/lock action

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate request

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject pause/lock

GuardianPolicyEnforcement-\>\>+GuardianWallet: Enforce restriction

GuardianWallet-\>\>+Blockchain: Record pause/lock event

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Issuer: Notify action completion

GuardianWallet\--\>\>Investor: Notify impacted investors of the
restriction

**4) Blocking & Unblocking Tokens**

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

participant Investor

Issuer-\>\>+ChainCapital: Request to block/unblock an investor

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate compliance
restrictions

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject
block/unblock

GuardianPolicyEnforcement-\>\>+GuardianWallet: Enforce block/unblock
action

GuardianWallet-\>\>+Blockchain: Update investor whitelist & cap table

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Issuer: Notify block/unblock completion

GuardianWallet\--\>\>Investor: Notify affected investor of status change

**5) Force Transfers**

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

participant Investor

Issuer-\>\>+ChainCapital: Request forced transfer

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate request for
compliance

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject forced
transfer

GuardianPolicyEnforcement-\>\>+GuardianWallet: Execute forced transfer

GuardianWallet-\>\>+Blockchain: Record forced transfer transaction

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Issuer: Notify forced transfer completion

GuardianWallet\--\>\>Investor: Notify affected investor of forced
transfer

**6) Conditional Transfers**

sequenceDiagram

participant Investor

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant Oracle

participant GuardianWallet

participant Blockchain

participant DestinationAddress-Party

Investor-\>\>+ChainCapital: Initiate token transfer

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate transfer
conditions

GuardianPolicyEnforcement-\>\>+Oracle: Request Oracle validation

Oracle\--\>\>GuardianPolicyEnforcement: Provide external condition data

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject transfer

GuardianPolicyEnforcement-\>\>+GuardianWallet: Execute conditional
transfer

GuardianWallet-\>\>+Blockchain: Record transfer event, update cap table

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Investor: Notify of transfer completion

GuardianWallet\--\>\>DestinationAddress-Party: Notify recipient of
incoming transfer

See relevant diagrams
