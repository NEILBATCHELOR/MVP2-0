**Role Management for Issuance Specification Summary**

**Purpose**: Enable issuers on the Chain Capital platform to manage user
roles, invitations, and cryptographic keys securely post-onboarding of
the initial Owner, ensuring proper access control, compliance, and
multi-signature approvals for token issuance and related operations.

**Key Functions**:

**User Invitation and Management**:

Allows Super Admins and Owners to invite users by entering Name, Email,
and selecting a Role (e.g., Super Admin, Owner, Compliance Manager,
Agent, Compliance Officer) via an ["]{dir="rtl"}Add User" button,
opening a modal.

Auto-generates temporary passwords (reset required on first login) and
cryptographic key pairs (RSA/ECDSA, Ed25519) for invited users, with
private keys distributed securely (e.g., via dashboard or encrypted
email) and public keys stored for verification.

Supports multiple invites (nested configuration), revoking or
re-inviting users as needed, with real-time status tracking (Pending,
Active, Suspended, Revoked).

**Role-Based Access Control (RBAC)**:

Assigns and manages roles with a clear hierarchy: Super Admin (full
control), Owner (token and issuance management, cannot remove Super
Admins), Compliance Manager (investor approvals, rule enforcement),
Agents (investor management, no contract modification), and Compliance
Officers (investor application approvals).

Enables multiple users per role, with add/remove functionality and role
reassignment via an ["]{dir="rtl"}Edit" action in the user table.

Enforces 2-of-3, 3-of-5, or higher multi-signature consensus for
critical actions (e.g., role changes, key rotations, token deployments)
involving Super Admin, Owner, and Compliance Manager.

**User Table and Interaction**:

Displays a user table in the ["]{dir="rtl"}Role Management" screen with
columns: Name, Email, Role, Status, and Actions (Revoke, Re-invite,
Remove, View Public Key).

Supports sorting, filtering, and searching (e.g., by Name, Email, Role,
Status) for efficient user management, with bulk actions (revoke,
reassign, suspend multiple users).

Includes visual indicators for status (e.g., green for Active, red for
Revoked) and real-time updates via DB subscriptions.

**Advanced Admin Panel (Super Admins/Owners Only)**:

Provides additional controls for Super Admins and Owners, including:

Policy Rules configuration for multi-signature (2-of-3) and automation
thresholds (e.g., auto-approve token transfers under \$100k).

Audit Logs to view/export historical actions (CSV/JSON) for compliance
tracking.

Key Management to revoke/reissue keys, enforce key rotation (e.g., every
6 months), and monitor key usage.

Real-time access monitoring to view active sessions, last activity, and
force logouts for compromised accounts.

Supports custom role creation and advanced permissions management for
enhanced security and flexibility.

**Security and Compliance**:

Ensures cryptographic key security with private keys never stored in
plaintext, revoked keys immediately invalidated, and digital signatures
stored on-chain for verification.

Tracks all role changes, key generations, approvals, and critical
actions in immutable audit logs, exportable for regulatory review.

Prevents role escalation (e.g., users cannot self-assign higher roles,
Super Admins require another Super Admin for deletion) and enforces
timeout-based auto-rejection for delayed approvals.

**Usability Enhancements**:

Offers a confirmation prompt for user removal or role reassignment to
prevent accidental actions.

Provides tooltips and in-app guidance (e.g., ["]{dir="rtl"}Require Key
Signing: Enables cryptographic signing for sensitive actions") to assist
users.

Supports pagination or infinite scrolling for large user lists to
maintain performance and usability.

Below is an elaborated breakdown of the **roles and responsibilities,
functions, and rights** for each user role in the Chain Capital
platform.

**1. Super Admin**

**Role and Responsibilities**:

- Acts as the highest authority in the Chain Capital platform,
  overseeing system-wide settings, security, and user management to
  ensure platform integrity and compliance.

- Manages critical governance actions, including role creation,
  modification, and deletion, and ensures robust security protocols for
  token issuance and operations.

- Collaborates with Legal/Compliance Agents and Guardian Policy
  Enforcement to enforce policies and maintain audit logs for regulatory
  adherence.

**Key Functions**:

- **System Configuration**: Configures platform settings, security
  protocols, and multi-signature policies (e.g., 2-of-3, 3-of-5
  consensus).

- **User Management**: Invites, assigns, modifies, suspends, or revokes
  roles for all users, including creating custom roles with specific
  permissions.

- **Key Management**: Generates, revokes, reissues, and enforces
  rotation of cryptographic keys (e.g., RSA, ECDSA, Ed25519) for all
  users, ensuring secure key distribution and storage.

- **Policy Automation**: Defines and manages policy-driven automation
  rules (e.g., auto-approve token transfers under \$500k) and
  multi-signature thresholds for sensitive actions.

- **Audit and Compliance**: Maintains and exports immutable audit logs
  (CSV/JSON) of all actions, tracks real-time access, and ensures
  compliance with financial regulations.

- **Security Monitoring**: Monitors active sessions, enforces force
  logouts for compromised accounts, and implements Threshold Signature
  Scheme (TSS) or Multi-Party Computation (MPC) for high-security
  actions (e.g., smart contract upgrades).

**Rights**:

- Full control over all platform settings, including security, RBAC, and
  cryptographic key management.

- Ability to create, delete, or modify any role, including Super Admins
  (requires another Super Admin[']{dir="rtl"}s approval for deletion).

- Access to advanced admin panels (e.g., Policy & Approval Rules, Key
  Management) and all audit logs.

- Exclusive access to configure multi-signature consensus structures
  (e.g., 2-of-3 to 3-of-5) and automation policies.

- Can override or escalate actions, but cannot self-assign higher roles
  or modify critical security settings without multi-signature approval.

- Requires 2-of-3 or higher multi-signature consensus for high-risk
  actions (e.g., smart contract upgrades, role reassignment elevating
  access).

**2. Owner (Issuer Representative)**

**Role and Responsibilities**:

- Represents the issuer (e.g., SPV, asset owner) and manages token
  settings, issuance configurations, user invitations, and allocation
  processes, ensuring alignment with issuance rules and compliance.

- Oversees investor qualification, wallet whitelisting, and token
  distribution, collaborating with Compliance Agents and Agents to
  prevent violations.

- Ensures issuance aligns with investor eligibility and transfer
  restrictions, using cryptographic signing for approvals.

**Key Functions**:

- **Token Management**: Designs and configures tokens within projects
  using Token Building Blocks, sets compliance parameters, and deploys
  smart contracts (with multi-signature approval).

- **User Management**: Invites users (e.g., Agents, Compliance
  Officers), assigns roles, and manages user access within RBAC, but
  cannot remove Super Admins or modify cryptographic security settings.

- **Issuance Oversight**: Allocates tokens to investors or SPVs, tracks
  subscriptions, fund movements, and compliance approvals, and updates
  cap tables in real-time.

- **Compliance Enforcement**: Monitors investor eligibility, enforces
  whitelist and jurisdiction restrictions, and ensures rule compliance
  via Guardian Policy Enforcement.

- **Approval Participation**: Participates in 2-of-3 multi-signature
  approvals for critical actions (e.g., token deployment, allocations,
  redemptions).

- **Reporting and Monitoring**: Generates position reports, accesses
  real-time cap table data, and reviews transaction history for
  compliance audits.

**Rights**:

- Full control over token settings, issuance workflows, and user
  invitations within their project scope.

- Can manage investor onboarding, token allocations, and cap table
  updates, but cannot alter system-wide security or Super Admin roles.

- Access to advanced admin panels (e.g., Role Management, Cap Table
  Management) for their projects, but limited to non-security critical
  functions.

- Requires 2-of-3 multi-signature consensus for high-risk actions (e.g.,
  token deployment, large transfers, fund redemptions).

- Cannot self-assign higher roles or delete Super Admins; limited to
  managing Agents and Compliance Officers under their authority.

**3. Compliance Manager**

**Role and Responsibilities**:

- Oversees regulatory approvals, compliance automation, and investor
  application validation to ensure adherence to financial regulations
  and platform policies.

- Manages KYC/AML checks, jurisdiction restrictions, and risk
  assessments, working with Guardian Policy Enforcement to enforce rules
  on-chain.

- Participates in multi-signature approvals for regulatory actions,
  ensuring token contracts enforce investor protections.

**Key Functions**:

- **Compliance Validation**: Reviews and approves investor KYC/AML data,
  jurisdictional compliance, and risk profiles, using third-party
  integrations or oracles.

- **Rule Management**: Configures and enforces compliance rules (e.g.,
  investor qualification, transaction limits, whitelist restrictions)
  via the Rule Management screen.

- **Approval Participation**: Joins 2-of-3 multi-signature consensus for
  regulatory actions (e.g., investor onboarding, token transfers, fund
  redemptions).

- **Policy Automation**: Sets policy-driven automation thresholds (e.g.,
  auto-approve verified investors) and monitors rule enforcement in
  real-time.

- **Audit and Reporting**: Accesses compliance-specific audit logs,
  generates reports for regulators, and ensures transaction monitoring
  for MLR obligations.

- **Investor Suspension**: Temporarily suspends investors for
  non-compliance, but cannot modify system-wide compliance settings.

**Rights**:

- Full control over investor compliance processes, including KYC/AML
  validation, sanctions checks, and jurisdiction enforcement.

- Can approve or reject investor applications, configure compliance
  rules, and participate in multi-signature approvals for regulatory
  actions.

- Access to compliance-specific logs and dashboards, but restricted from
  modifying token settings or system security.

- Requires 2-of-3 multi-signature consensus for high-risk regulatory
  actions (e.g., fund redemptions, smart contract upgrades).

- Cannot manage roles beyond Compliance Officers or modify cryptographic
  keys/system-wide settings.

**4. Agent (Investment Manager, Placement Agent, or Fund
Administrator)**

**Role and Responsibilities**:

- Supports issuers and investors by managing investor interactions,
  onboarding, token distribution, and post-issuance reporting, bridging
  traditional and tokenised issuance processes.

- Conducts initial due diligence, facilitates investor subscriptions,
  and assists with compliance checks, but cannot modify token contracts
  or system settings.

- Ensures transparency by providing real-time updates on investor
  actions and cap table changes to stakeholders.

**Key Functions**:

- **Investor Onboarding**: Assists investors in completing onboarding
  requirements, submitting KYC/AML documents, and connecting wallets via
  GuardianWallet.

- **Token Allocation Support**: Helps issuers distribute tokens (bulk or
  individual), tracks subscriptions, and ensures compliance rules are
  met.

- **Due Diligence**: Conducts initial investor checks, works with Owners
  and Compliance teams to finalise approvals, and supports subscription
  tracking.

- **Reporting and Monitoring**: Generates position reports, monitors
  investor transactions, and provides real-time updates to issuers and
  compliance agents.

- **Secondary Market Facilitation**: Supports investor transactions on
  secondary markets (e.g., OTC, CEX), ensuring compliance with transfer
  restrictions.

**Rights**:

- Limited to managing investor interactions, onboarding, and reporting;
  cannot modify token contracts, compliance rules, or system settings.

- Can view but not edit cap tables, transaction logs, or cryptographic
  keys.

- Access to investor-specific dashboards and basic reporting tools, but
  restricted from multi-signature approvals or role management.

- No requirement for multi-signature consensus, but actions are subject
  to Owner or Compliance Manager oversight and approval.

**5. Compliance Officer**

**Role and Responsibilities**:

- Focuses on approving or rejecting investor applications and ensuring
  compliance with specific regulatory requirements, working under the
  guidance of the Compliance Manager.

- Reviews KYC/AML data, investor disclosures, and transaction details to
  enforce platform policies, but cannot override system-wide compliance
  settings or modify token contracts.

- Participates in multi-signature flows for high-risk investor
  transactions, ensuring investor protections are maintained.

**Key Functions**:

- **Investor Approval**: Reviews and approves/rejects investor
  applications based on KYC/AML, accreditation, and risk profiles, using
  Guardian Policy Enforcement tools.

- **Compliance Checks**: Validates investor compliance status (e.g.,
  jurisdiction, whitelist) and monitors transaction activity for MLR
  obligations.

- **Reporting**: Generates compliance reports for audits and provides
  feedback to Compliance Managers on regulatory issues.

- **Approval Support**: Assists in multi-signature approvals for
  investor-related actions (e.g., onboarding, transfers), but cannot
  initiate critical system changes.

- **Transaction Monitoring**: Ensures transactions meet compliance
  rules, flagging violations for escalation to Compliance Managers.

**Rights**:

- Limited to approving/rejecting investor applications and monitoring
  compliance-specific transactions; cannot modify token settings, roles,
  or system security.

- Access to investor compliance dashboards and logs, but restricted from
  advanced admin panels or key management.

- No multi-signature initiation rights, but participates in approvals as
  needed under Compliance Manager oversight.

- Cannot access or modify cap tables, cryptographic keys, or broader
  issuance workflows beyond investor compliance.

**Additional Notes**

- **Multi-Signature Consensus**: All roles except Agents and Compliance
  Officers participate in 2-of-3 or higher multi-signature approvals for
  critical actions (e.g., token deployment, fund redemptions, smart
  contract upgrades), ensuring security and compliance.

- **RBAC (Role Based Access Control) and Automation**: Policy-driven
  automation (e.g., auto-approval for verified investors) reduces manual
  intervention, but high-risk actions always require human oversight via
  multi-signature.

- **Scalability and Security**: The platform uses cryptographic key
  management (e.g., TSS, MPC), immutable audit logs, and real-time
  monitoring to maintain integrity across roles, with Super Admins
  holding ultimate authority but requiring consensus for major changes.

Below is a function-based matrix that maps the key functions (Y-axis)
across all roles (X-axis) for the Chain Capital platform.

- **✓**: The role can perform this function.

- **(L)**: The role has limited or supervised access to this function
  (e.g., requires approval or oversight).

- ✕: The role cannot perform this function.

The functions are derived from the key functions listed for each role
(Super Admin, Owner, Compliance Manager, Agent, Compliance Officer),
ensuring alignment with the issuance workflows and RBAC system.

**Function-Based Matrix: Roles vs. Functions**

  --------------------------------- ------- ------- ------------ ------- ------------
         Functions (Y-Axis)          Super   Owner   Compliance   Agent   Compliance
                                     Admin            Manager              Officer

   System Configuration (Platform      ✓       ✕         ✕          ✕         ✕
         Settings, Security)                                             

  User Management (Invite, Assign,     ✓       ✓         ✕          ✕         ✕
      Modify, Suspend, Revoke)                                           

  Key Management (Generate, Revoke,    ✓       ✕         ✕          ✕         ✕
            Rotate Keys)                                                 

    Policy Automation (Configure       ✓       ✕         ✓          ✕         ✕
         Rules, Thresholds)                                              

     Audit and Compliance (Logs,       ✓       ✓         ✓        \(L\)       ✓
             Reporting)                                                  

   Security Monitoring (Sessions,      ✓       ✕         ✕          ✕         ✕
           Force Logouts)                                                

      Token Management (Design,        ✕       ✓         ✕          ✕         ✕
         Configure, Deploy)                                              

    Issuance Oversight (Allocate       ✕       ✓         ✕        \(L\)       ✕
     Tokens, Cap Table Updates)                                          

   Compliance Validation (KYC/AML,     ✕       ✕         ✓        \(L\)       ✓
            Jurisdiction)                                                

  Investor Onboarding Support (Due     ✕       ✓         ✓          ✓         ✓
      Diligence, Qualification)                                          

      Token Allocation Support         ✕       ✓         ✕          ✓         ✕
    (Distribution, Subscriptions)                                        

      Reporting and Monitoring         ✓       ✓         ✓          ✓         ✓
  (Position Reports, Transactions)                                       

    Secondary Market Facilitation      ✕       ✕         ✕          ✓         ✕
       (OTC, CEX Transactions)                                           

      Multi-Signature Approval         ✓       ✓         ✓          ✕       \(L\)
            Participation                                                
  --------------------------------- ------- ------- ------------ ------- ------------

**Explanation of the Matrix**

**Super Admin**:

Has full control over system-wide functions (configuration, user
management, keys, policies, security monitoring) but does not directly
manage tokens or investor allocations.

Participates in multi-signature approvals but focuses on governance and
security.

**Owner**:

Manages token design, issuance, and allocation, with full control over
project-specific operations but no access to system-wide security or
Super Admin functions.

Participates in multi-signature approvals and oversees investor
onboarding and cap table updates.

**Compliance Manager**:

Focuses on compliance validation, policy automation, and regulatory
reporting, with rights to configure rules and approve investor-related
actions.

Participates in multi-signature approvals for regulatory actions but
cannot manage tokens or system settings.

**Agent**:

Supports investor onboarding, token allocation, reporting, and secondary
market facilitation, with limited access (supervised by Owners or
Compliance Managers) to compliance and cap table functions.

No rights to modify tokens, system settings, or participate in
multi-signature approvals.

**Compliance Officer**:

Handles investor approval, compliance checks, and reporting, with
limited participation in multi-signature approvals (under Compliance
Manager oversight).

Restricted from token management, system settings, and broader issuance
functions.
