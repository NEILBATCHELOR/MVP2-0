**MVP Issuance Plus Specification**

Below is a detailed **MVP Issuance Plus Specification** for the Chain
Capital platform, designed to outline the minimum viable features and
processes required for token issuance. This specification leverages all
the provided documents, sequence diagrams, and flowcharts, ensuring
alignment with the platform[']{dir="rtl"}s requirements for token
design, deployment, allocation, compliance, and cap table management. It
focuses on delivering a functional, secure, and compliant issuance
process as a foundation for future enhancements.

The Chain Capital platform facilitates blockchain-based token issuance,
management, and redemption for issuers and investors. The MVP aims to
deliver a secure, compliant, and user-friendly system supporting core
workflows:

- Token issuance and deployment

- Investor onboarding and qualification (prior, screening option-pre
  issuance

- Token minting and burning

- Redemption processes

- Real-time cap table updates

**1. Introduction and Overview**

The MVP Issuance Specification defines the essential features and
workflows for issuing tokenised assets on the Chain Capital platform.
The primary objectives are to:

Enable issuers to design, deploy, and issue digital securities
efficiently.

Ensure **compliance** with regulatory requirements (e.g., KYC/AML,
counterparty, transfer and jurisdictional restrictions).

Maintain **security** through multi-signature approvals, role-based
access control (RBAC), and cryptographic key management.

Provide **real-time transparency** with investor management, cap table
automation, audit logs, and notifications.

This specification builds on the onboarding processes (Investor and
Issuer) and integrates key components such as token design, rule
management, and market configuration, focusing on a minimal yet
functional implementation for the initial launch.

**2. User Roles and Responsibilities**

The issuance process involves multiple roles, each with distinct
responsibilities:

- **Issuer (Owner Role)**: Designs tokens, configures compliance rules,
  allocates tokens, manages cap tables, and oversees issuance workflows.

- **ChainCapital**: Manages the issuance platform, validates token
  designs, enforces compliance, and facilitates blockchain interactions.

- **GuardianPolicyEnforcement**: Ensures compliance rules are enforced,
  validates investor eligibility, and manages multi-signature approvals.

- **GuardianWallet**: Provides custodial services for token issuance,
  manages investor wallets, and secures transactions.

- **MultiSigApprovers**: Includes Super Admin, Owner, and Compliance
  Manager, requiring 2-of-3 consensus for critical actions (e.g., token
  deployment, large allocations or transfers).

- **Blockchain**: Handles token deployment, minting, burning, and cap
  table updates on-chain.

- **Agent**: Assists issuer with investor management, token
  distribution, and reporting.

- **Compliance Agent**: Validates compliance rules, reviews investor
  qualifications, and ensures regulatory adherence.

- **Investor**: Indicates interest - Subscribes - receives token
  allocations, submits redemption requests, and manages holdings via the
  GuardianWallet.

**3. Issuance Process**

The issuance process is a structured workflow that enables issuers to
tokenise assets, allocate tokens, and manage compliance and cap tables.
Below are the detailed steps:

**3.1 Token Design and Structuring**

- **Description**: Issuers configure tokens within projects using
  flexible Token Building Blocks, defining attributes and compliance
  rules.

- Each new issue is a project. A project remains in draft form until it
  is approved, changes state to ready to mint, mint and then issued.

- **Actions**:

  - Issuer navigates to the \"Token Design\" tab and selects or creates
    a project (e.g., Project Name, Description).

  - Configures Token Building Blocks with attributes:

    - Token Name, Symbol, Decimals (0-18), Total Supply.

    - Token Standard (e.g., ERC-20, ERC-721, ERC-1155, ERC-1400,
      ERC-3525, ERC-4626 with 7540 - least important).

    - Ownership Wallet (defaults to issuer[']{dir="rtl"}s address).

    - Ratios for multi-token structures (e.g., 1:1, 1:1000).

  - Edits metadata via a visual editor (e.g., Name, Description, Image
    URL for ERC-721).

  - Saves project as a draft for review.

  - Previews smart contract code before finalisation.

**3.2 Rule Management**

- **Description**: Issuers define compliance rules to enforce transfer
  restrictions and eligibility criteria.

- **Actions**:

  - Issuer navigates to the \"Rule Management\" tab and configures
    rules:

    - **Transaction Amount Limit**: Outgoing limits (e.g., \> \$0.00
      USD).

    - **Velocity Limit**: Funds sent over time (e.g., \$0.00 in 0
      minutes).

    - **Transaction Destination**: Blocklist/allowlist for addresses via
      CSV upload or bulk selection.

    - **Investor Qualification**: KYC/AML checks, accredited status,
      risk profiles.

    - **Jurisdiction-Based**: Allowed jurisdictions, tax residency,
      sanctions checks (e.g., block Cuba, Iran et al).

    - **Asset Class-Based**: Restrictions by asset type (e.g., debt
      equity, commodities, stablecoins).

    - **Issuer-Imposed**: Lock-up periods, supply limits, min/max
      allocations.

    - **Conditional Transfers**: Auto-approval, multi-signature (2-of-3)
      or escrow-based approvals. i.e. funds deposited in Wallet A
      therefore permit allocation.

    - **Redemption-Time-Based**: For interval-based, time window based
      redemptions

    - **Smart Contract-Triggered**: Oracle-driven conditions (e.g.,
      price thresholds).

    - **Collateralised**: Minimum collateral, auto-liquidation rules.

    - **Multi-Party Syndicated**: Requires external stakeholder
      approvals (sequential/concurrent).

  - Uses logical operators (AND/OR) to combine rules.

  - Rules are validated by GuardianPolicyEnforcement in real-time

**3.3 Role-Based Access and Invitation Management**

- **Description**: Manages user access and cryptographic keys after the
  initial Owner onboarded.

- **Actions**:

  - Issuer (Super Admin/Owner) navigates to \"Role-Based Access &
    Invitation Management\" tab.

  - Invites users by entering Name, Email, and Role (e.g., Owner, Agent,
    Compliance Manager).

  - System auto-generates temporary passwords and cryptographic key
    pairs (RSA/ECDSA).

  - Users accept invitations, reset passwords, and receive private keys
    to sign within Guardian securely.

  - Admins manage users: view public keys, revoke/re-invite, reassign
    roles, suspend accounts, or force logouts.

  - Enforces 2-of-3, 3-of-4/5, 4-of-5 multi-signature approvals for
    critical actions (e.g., rule and role changes, transfers,
    deployments).

**3.4 Token Deployment**

- **Description**: Deploys token smart contracts on the blockchain with
  multi-signature approval.

- **Actions** (as per sequence diagram):

  - Issuer requests token deployment via ChainCapital.

  - ChainCapital validates the request and forwards to
    GuardianPolicyEnforcement.

  - GuardianPolicyEnforcement requests 2-of-3 multi-signature approval
    from MultiSigApprovers (Super Admin, Owner, Compliance Manager).

  - Upon approval, GuardianWallet executes the mint/burn transaction on
    the Blockchain.

  - Blockchain records the mint/burn event, updates the cap table, and
    confirms execution.

  - ChainCapital notifies the Issuer of completion.

**3.5 Token Allocation and Cap Table Management**

- **Description**: Distributes tokens to investors and maintains a
  real-time cap table.

- **Actions**:

  - Issuer uploads a CSV of investors (Name, Email, Type, Status, Wallet
    Address) (or wallet address can be generated as part of the cap
    table generation and therefore a cap table is generated via the
    \"Generate Cap Table\" button.

  - Manages subscriptions: Creates new subscriptions, Confirms existing
    subscriptions.

  - Subscriptions can be consistent across all i.e. 100 tokens of token
    type A and B for all investors (standard) or bespoke per investor.

  - In the final cap table, the token types and amounts need to be
    'pre-allocated' to each address / investor in the table.

  - Summarises tokens to mint (per token type) based on confirmed
    subscriptions, switching token status from \"draft\" to \"ready to
    mint\" in the Token Design tab, when the above is complete.

  - Mints tokens to the issuer[']{dir="rtl"}s address via
    GuardianWallet, requiring multi-signature confirmation.

  - Allocates tokens to investors via bulk or individual distribution,
    ensuring compliance rules (e.g., whitelist, max allocation, KYC/AML
    status).

  - Confirms allocations, then distributes tokens to investor wallets,
    updating the cap table to actual holdings in real-time.

  - Generates position reports and historical snapshots (CSV export) for
    compliance and audits.

**3.6 Investor Redemption**

- **Description**: Allows investors to redeem tokens, updating cap
  tables and balances.

- **Actions** (as per sequence diagram):

  - Investor submits a redemption request to ChainCapital.

  - ChainCapital validates eligibility via GuardianPolicyEnforcement.

  - GuardianPolicyEnforcement requests 2-of-3 multi-signature approval
    from MultiSigApprovers.

  - Upon approval, GuardianWallet initiates fund settlement and burns
    redeemed tokens on the Blockchain.

  - Blockchain updates the cap table, confirming execution.

  - ChainCapital notifies the investor of redemption settlement.

**3.6.5 Repurchasing for Interval Funds - Specific Required Use Case**

Here\'s how the repurchase mechanism for a tokenised interval fund might
work through smart contract programming, focusing on managing the
process during open intervals and using an oracle for NAV:

**Programming the Smart Contract for Repurchase:**

**a. Defining Repurchase Periods**

- The smart contract would be coded to recognise specific time periods =
  intervals when repurchases are allowed (e.g., quarterly, date
  specific), based on the fund\'s rules.

- These periods can be updated via governance if the contract allows for
  such changes.

**b. Repurchase Request Submission**

- **Function for Requests:** Users interact with a function in the smart
  contract to submit repurchase requests. This function would record:

- The amount of tokens they wish to redeem.

- The account address of the requester.

- A timestamp or block number to ensure requests are only processed
  during open intervals.

- **Locking Tokens:** Upon submission, the tokens might be locked
  (transfer restrictions applied) to prevent trading until the
  repurchase is processed or canceled.

**c. Oracle Integration for NAV**

- **Oracle Data Feed:** An oracle service would be used to fetch the
  latest Net Asset Value (NAV) of the fund. Oracles are external
  services that provide smart contracts with real-world data. The oracle
  would:

- Retrieve current fund performance data from off-chain sources or
  directly from the fund\'s valuation team.

- Push this data to the smart contract, which in turn uses it to
  calculate the redemption value of tokens.

- **Update NAV:** The smart contract would have a function or event that
  triggers when new NAV data is available, updating the internal state
  of the contract to reflect the current value of the fund\'s assets.

**d. Processing Repurchases**

- **Batch Processing:** During the open repurchase window, the smart
  contract processes all valid repurchase requests. This might involve:

- Calculating how much of the fund\'s assets need to be liquidated or
  allocated for redemption based on the NAV and the number of tokens
  requested for repurchase.

- If the fund holds enough liquidity, directly transferring funds or
  tokens representing cash to the requesters\' accounts.

- **Pro-rata Distribution:** If there are more requests than can be
  fulfilled due to liquidity constraints, the smart contract might
  distribute available funds pro-rata among all requesters. **However
  often funds and returns are retained by the issuer to fulfill the
  maximum redemption amount in any given period.**

**e. Burn or Return Tokens**

Once funds are transferred to token holders, the corresponding tokens
are usually \"burned\" (destroyed) to reduce the total supply,
reflecting the decrease in fund ownership. This is done to prevent
double-spending or misrepresentation of ownership.

**f. Handling Over-subscription**

\- If the fund cannot fulfill all redemption requests due to liquidity
or volume constraints, the contract might:

\- Queue unprocessed requests for the next available window.

\- Or, inform users that their requests were partially or fully
unfulfilled, giving them the option to cancel or retry in the next
period.

**g, Security and Compliance**

\- The smart contract must include measures for security (like
reentrancy guards) and compliance with financial regulations,
restricting certain functions to admin or compliance roles.

**Example Flow:**

1.  Repurchase Window Opens: Smart contract checks the current block
    time against its schedule.

2.  Users Submit Requests: Tokens are locked for redemption.

3.  Oracle Updates NAV: Before processing, the smart contract gets
    updated with the latest NAV.

4.  Repurchases Processed: Using the new NAV, the contract calculates
    payouts, transfers funds, and burns tokens.

5.  Window Closes: No more requests can be made until the next interval.

(can provide in more detail if necessary)

This mechanism leverages smart contract automation to manage what would
otherwise be a complex, manual settlement process, ensuring fairness,
transparency, and adherence to the fund\'s interval terms/policy.

**3.7 Real-Time Audit, Updates and Notifications**

- **Description**: Provides continuous monitoring and transparency.

- **Actions**:

  - Logs all issuance activities (e.g., token deployment, allocations)
    in an audit log, capturing Log ID, Timestamp, User/Actor, Role,
    Action Type, Module, Status, and more.

  - Updates investor and issuer dashboards instantly via GuardianWallet
    and ChainCapital.

  - Sends real-time notifications (email, in-app) for critical events
    (e.g., mint, transfer, redeem, rule violations, approvals,
    deployment status).

**4. UI Requirements**

The user interface must be intuitive and aligned with the issuance
workflows. Key screens include:

**4.1 Issuer Screens**

**Token Design Screen**: Project selector, Token Building Blocks with
input fields, metadata editor, \"Save Draft\" and \"Deploy\" buttons.

**Advanced Token Management Screens** (Placeholders): Forms for
pausing/locking, blocking/unblocking, force transfers, and conditional
transfers.

**Rule Management Screen**: Rule categories (e.g., Investor
Qualification, Jurisdiction-Based), logical operator selectors, \"Save
Rule\" button, and rule status dashboard.

**Role Management Screen**: User table (Name, Email, Role, Status,
Actions), \"Add User\" modal, and Advanced Admin Panel for Super
Admins/Owners.

**Investor Management Screen:** Investor table (Name, Email, Type,
Status, Wallet Address), \"Download CSV Template\" and \"Upload CSV\"
buttons, \"Screen Investor\" button for KYC/AML checks,
sortable/filterable columns, and export options (CSV/PDF).

**Cap Table Management Screen**: Investor table (Name, Token Type,
Subscribed Amount, Status), \"Generate Cap Table,\" \"Mint Tokens,\"
\"Confirm Allocations against Subscriptions or adhoc,\" and \"Distribute
Tokens\" buttons.

**Audit Log Screen**: Table with sortable/filterable logs (Log ID,
Timestamp, Action, Description, User/Actor, etc.), export functionality,
and drill-down details.

**Dashboard**: Project list, token holdings, redemption status, wallet
balances.

**Redemption Management Screen**: Request submission, status tracking,
eligibility validation, fund settlement confirmation, interval fund
repurchase options.

**Wallet Management Screen**: Wallet connection/setup, balance view.

**4.2 Investor Screens**

**Dashboard**: Displays token allocations, redemption status, and wallet
balances.

**Redemption Request Screen**: Form to submit redemption requests,
status updates.

**4.3 Common Elements**

**Notifications**: Real-time alerts for actions (e.g., \"Token
Deployed,\" \"Allocation Confirmed\").

**Branding**: Customisable for issuers (logos, colours).

**Accessibility**: Support for screen readers, high-contrast modes, and
keyboard navigation.

**5. Compliance and Security Measures**

**KYC/AML**: Validates investor eligibility via
GuardianPolicyEnforcement and third-party integrations.

**Multi-Signature Approvals**: Requires 2-of-3 consensus for critical
actions (e.g., token deployment, large allocations).

**Cryptographic Keys**: Uses RSA/ECDSA for secure key generation and
distribution, with only public keys stored.

**Rule Enforcement**: Smart contracts enforce compliance rules on-chain
(e.g., whitelists, jurisdiction restrictions).

**Audit Logs**: Immutable, blockchain-verified logs for all actions,
exported for compliance.

**6. System Interactions and Integrations**

**CSV Upload**: Supports investor data imports for cap table generation
(Name, Email, Type, Status, Wallet Address).

**DB**: Stores rules, user data, and logs with real-time updates via
WebSocket subscriptions.

**GuardianWallet**: Manages token custody, transactions, and wallet
generation and updates.

**Blockchain**: Deploys smart contracts, mints/burns tokens, and updates
cap tables (e.g., Ethereum-compatible networks).

**Notification System**: Sends real-time updates via email or in-app
messages.

**Third-Party Oracles**: Validates compliance data (e.g., KYC/AML, risk
assessment scoring, NAV feeds).

**7. Testing and Validation**

**Test Cases**: Create scenarios for token design, rule enforcement,
multi-signature approvals, and cap table updates (e.g., successful
deployment, failed allocation due to compliance).

**Compliance Checks**: Validate KYC/AML, jurisdiction rules, and
whitelist enforcement.

**Usability Testing**: Conduct UAT with sample issuers and investors to
ensure intuitive workflows.

**Workflows Sequence Syntax, see diagrams in relevant folder**

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
