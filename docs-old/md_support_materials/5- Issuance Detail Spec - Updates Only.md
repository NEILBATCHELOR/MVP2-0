**High Level Functional Target for Issuance Module**

**Overview**

The Issuance Module within the Chain Capital platform provides a
comprehensive framework for tokenising assets, enabling issuers to
design, deploy, and manage digital securities with embedded compliance,
allocation automation, and real-time tracking. This module integrates
advanced Role-Based Access Control (RBAC), project-based token
structuring, and a robust Rule Management system to ensure regulatory
adherence and operational efficiency.

**Token Design and Smart Contract Deployment**

**Description**: The Token Design section enables issuers to configure
tokens within projects using repeatable Token Building Blocks, each with
customisable attributes and inter-block relationships, culminating in
smart contract deployment.

**Key Features**:

**Project Management**:

Add, remove, or select projects to organise token configurations.

Fields: Project Name, Description, Creation Date.

**Token Building Blocks**:

**Core Attributes**:

Token Name, Symbol, Decimals (0-18), Total Supply.

Token Standards: ERC-20 (fungible), ERC-721 (non-fungible), ERC-1155
(multi-token), ERC-1400 (security), ERC-3525 (semi-fungible).

Ownership: Assign initial token contract owner (defaults to
issuer[']{dir="rtl"}s address)

Ratios: Define relationships between blocks (e.g., 1:1, 1:1000) for
multi-token structures.

- **Metadata Configuration**:

  - Visual editor with standard-specific fields:

    - ERC-20: Basic token info (e.g., Name, Symbol, Description).

    - ERC-721: NFT attributes (e.g., Image URL, Rarity).

    - ERC-1155: Multi-token support (e.g., Type:
      Fungible/Semi-Fungible/Non-Fungible, Amount, URI).

    - ERC-1400: Security token rules (e.g., Jurisdiction,
      Issuance/Maturity Dates).

    - ERC-3525: Semi-fungible properties (e.g., Slot, Value, Interest
      Rate).

  - Real-time preview of formatted metadata.

- **Deployment**: Auto-generates and deploys smart contracts with
  embedded compliance rules.

<!-- -->

- **Flexibility**: Add/remove blocks dynamically, save project drafts,
  and preview smart contract code.

**Workflow**:

Issuer creates/selects a project.

Configures Token Building Blocks with attributes and relationships.

Reviews smart contract preview and submits for Rule Management
validation.

Deploys contracts upon multi-signature approval.

**Role-Based Access & Invitation Management**

**Description**: Replaces traditional back-office configuration with a
secure RBAC system to manage user roles, invitations, and cryptographic
keys post-onboarding of the initial Owner.

**Key Features**:

- **Role Hierarchy**:

  - **Super Admin**: Full control over system settings, role creation,
    and key management.

  - **Owner**: Manages token settings and user invitations; cannot
    remove Super Admins.

  - **Compliance Manager**: Oversees investor approvals and rule
    enforcement.

  - **Agents**: Manage investors without contract modification rights.

  - **Compliance Officers**: Approve/reject investor applications.

- **User Management**:

  - Invite users with Name, Email, and Role selection.

  - Auto-generates temporary passwords (reset on first login) and
    cryptographic key pairs (RSA/ECDSA).

  - Bulk actions: Revoke, reassign, suspend multiple users.

- 

- **Security & Key Controls**:

  - Multi-signature (2-of-3) consensus for critical actions (e.g., rule
    changes, deployments).

  - Key rotation enforcement and revocation options.

  - Private keys distributed securely; public keys stored for
    verification.

- **Monitoring**: Real-time activity logs, audit trails, and session
  management (force logout capability).

**Workflow**:

Super Admin/Owner invites users with role assignments.

Users accept invitations, reset passwords, and receive cryptographic
keys.

Admins manage roles, monitor activity, and enforce 2-of-3 approvals for
sensitive operations.

**Embedded Compliance Token Rules**

**Description**: Enforces compliance on-chain through a Rule Management
system with configurable conditional transfer rules, validated by
Guardian Policy Enforcement.

**Key Features**:

- **Rule Categories**:

  - **Investor Qualification**: Multi-select checks (KYC, Accredited
    Investor, Risk Profile).

  - **Jurisdiction-Based**: Allowed jurisdictions, tax residency,
    sanctions list integration.

  - **Asset Class-Based**: Restrictions by asset type (e.g.,
    stablecoins, debt securities).

  - **Issuer-Imposed**: Lock-up periods, whitelist transfers, supply
    limits, min/max allocations.

  - **Conditional Approval**: Multi-signature (2-of-3, 3-of-5) or
    escrow-based approvals.

  - **Time-Based**: Vesting schedules, expiry windows.

  - **Smart Contract-Triggered**: Oracle-driven conditions (e.g., price
    thresholds).

  - **Collateralised**: LTV thresholds, auto-liquidation rules.

  - 

  - **Multi-Party Syndicated**: Stakeholder approvals
    (sequential/concurrent).

  - **Transaction Amount Limit**: Limits outgoing transaction values
    (e.g., \> \$0.00 USD).

  - **Velocity Limit**: Caps funds sent over time (e.g., \$0.00 in 0
    minutes).

  - **Transaction Destination**: Blocklist/allowlist for recipient
    addresses (max 50).

- **Logical Operators**: AND/OR combinations between rules.

- **MLR Obligations**: Integrates KYC, sanctions checks, and transaction
  monitoring for Money Laundering Regulations compliance.

- **Automation**: Pre-configured policies auto-approve based on
  thresholds.

**Workflow**:

Issuer configures rules via Rule Management interface.

Rules validated by Guardian Policy Enforcement in real-time.

Smart contracts execute transfers based on rule conditions or
multi-signature approvals.

**Rule-Based Token Allocations**

**Description**: Manages token supply and distribution with smart
contract-enforced rules.

**Key Features**:

- **Token Actions**: Minting, burning, allocation, and redemption.

- **Allocation Rules**: Ensures only qualified investors receive tokens
  per compliance settings.

- **Methods**: Bulk allocation for multiple investors or individual
  assignments.

- **Real-Time Updates**: Syncs allocations with Guardian Wallet
  dashboards.

**Workflow**:

Issuer selects investors and allocation amounts.

Rules (e.g., max allocation, whitelist) validated.

Tokens distributed via smart contracts with approval confirmation.

**Cap Table Automation and Sync**

**Description**: Provides real-time, on-chain cap table management for
transparency and compliance.

**Key Features**:

- **Automation**: Updates cap table instantly post-allocation.

- **Tracking**: Monitors investor holdings and compliance status.

- **Reporting**: Generates position reports and historical snapshots
  (CSV/JSON export).

- **Integration**: Syncs with investor dashboards and regulatory
  records.

**Workflow**:

Tokens allocated and cap table updated.

Issuer views real-time holdings and generates reports.

Compliance agents access data for audits.

**Real-Time Updates**

**Description**: Ensures continuous monitoring and transparency across
the issuance process.

**Key Features**:

- **Transaction History**: Immutable logs for compliance and audit
  trails.

- **Investor Onboarding**: Tracks subscription status in real-time.

- **Market Activity**: Monitors primary/secondary market transactions.

- **Notifications**: Alerts issuers of rule violations, approvals, or
  deployment status.

- 

**Workflow**:

System logs all actions (e.g., deployments, transfers).

Updates reflected in user dashboards instantly.

Notifications sent for critical events.

**Key Features for Workflow Diagram (Issuance)**

**Token Smart Contract Deployment**:

Intuitive deployment of ERC-20, ERC-721, ERC-1155, ERC-1400, and
ERC-3525 tokens via projects.

Secure frameworks for tokenised assets with multi-signature approval.

**Key Deployment Features**:

Flexible Token Building Blocks with ratios and metadata.

Reusable compliance frameworks saved per project.

Project-based organisation for multiple issuances.

**Token Allocation**:

Efficient distribution via bulk or individual operations.

Digital identity integration (ONCHAINID).

Real-time Guardian Wallet updates.

**Cap Table Synchronisation**:

Instant updates for accurate stakeholder reporting.

**Key Topics for Value Proposition Diagram (Issuance)**

**Investors**:

**Seamless Experience**: 24/7 access to manage securities.

**Empowered Self-Service**: Automation reduces intermediary reliance.

**Real-Time Efficiency**: Instant updates for transactions and holdings.

**Issuers**:

**User-Friendly Technology**: Intuitive tools for token design and RBAC.

**Cost-Effective Operations**: Automated workflows lower costs.

**Streamlined Management**: Integrated platform for issuance and
compliance.

**Agents**:

**Digitised Workflows**: Bridges traditional and tokenised issuance.

**Transparent Updates**: Real-time visibility into investor actions.

**Ecosystem Integration**:

- Connects digital securities via compliance rules and oracles.

- Establishes a scalable, transparent lifecycle management system.

**Description of the Issuance Workflow**

**Token Design and Structuring**:

Create/select project, configure Token Building Blocks, and define
rules/metadata.

**Rule Management**:

Set conditional transfer rules with MLR Obligations and transaction
limits.

**Role Management**:

Invite users, assign roles, and enforce 2-of-3 approvals.

**Token Deployment**:

Deploy smart contracts with multi-signature confirmation.

**Token Allocation**:

Distribute tokens to compliant investors.

**Investor Notification**:

Update Guardian Wallet dashboards with allocation details.

**Cap Table Synchronisation**:

Reflect allocations in real-time cap table.

**Real-Time Updates**:

Monitor activity and compliance continuously.
