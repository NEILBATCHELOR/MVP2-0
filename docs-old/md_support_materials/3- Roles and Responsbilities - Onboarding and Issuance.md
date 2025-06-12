**Roles & Responsibilities Breakdown**

**1) Onboarding Investor**

**Participant Role & Responsibilities**

**Investor**

Registers an account and submits KYC/AML documents.

Connects or creates a wallet via Guardian Wallet.

Selects investment projects and undergoes qualification checks.

Reviews and signs platform agreements.

**Chain Capital**

Manages investor onboarding workflow and dashboard access.

Ensures KYC/AML submissions are routed to compliance for validation.

Verifies investor eligibility based on jurisdictional & financial
criteria.

Implements **role-based access controls** (RBAC) for investor onboarding
management.

Enforces policy-driven automation for **investor qualification
approvals**.

**Guardian Policy Enforcement**

Enforces investor eligibility, identity verification, and compliance
rules.

Confirms wallet compliance & whitelisting before allowing fund
transfers.

Implements **2-of-3 consensus approvals** for high-risk investor
applications.

**Guardian Wallet**

Provides custody and transaction support for investors.

Ensures only compliant wallets interact with Chain Capital.

Whitelists wallets before allowing investor transactions.

**Owner (Issuer Representative)**

Monitors investor qualification and ensures investor eligibility aligns
with issuance rules.

Oversees whitelisting & allocation of investor wallets.

Collaborates with Legal/Compliance to prevent onboarding violations.

Has **policy-based automated approvals** for low-risk investor
applications.

**Agent (Investment Manager, Placement Agent, or Fund Administrator)**

Assists investors in completing onboarding requirements.

Conducts initial investor due diligence checks.

Works with Owner & Compliance teams to finalize investor approval.

**Legal/Compliance Agent (MLRO Officer, Legal Counsel)**

Ensures investor onboarding complies with financial regulations.

Reviews agreements, KYC data, and investor disclosures.

Participates in **multi-signature approval flows** for high-risk
transactions.

**2) Onboarding Issuer**

**Participant Role & Responsibilities**

**Issuer (Owner Role)**

Registers an issuer account and submits SPV details and documentation.

Selects token standards, issuance structure, and investor eligibility
rules.

Configures transfer restrictions, whitelist requirements, and compliance
settings.

Transfers issuance funds to the Guardian Wallet source wallet.

Monitors onboarding progress and compliance approvals.

Manages **role-based user access** for internal issuer team members.

**Chain Capital**

Manages issuer onboarding workflows and legal structuring.

Verifies issuer SPV documentation and risk disclosures.

Provides issuance structuring tools, investor qualification management,
and compliance integration.

Updates the cap table and allocation dashboard.

Enforces **policy-based automation for compliance checks**.

**Guardian Policy Enforcement**

Ensures issuer meets compliance requirements before activation.

Enforces transfer restrictions, whitelist controls, and issuer
obligations.

Blocks non-compliant issuers from launching tokenized securities.

Implements **2-of-3 consensus approvals** for issuer due diligence.

Maintains **audit logs and security tracking** for approvals.

**Guardian Wallet**

Generates dedicated issuance wallet per SPV/issuance.

Secures issuer funds and collateral before issuance.

Manages investor subscriptions and post-issuance settlements.

**Owner (Issuer Representative)**

Oversees issuer onboarding, documentation submission, and approvals.

Ensures issuance aligns with investor qualification and transfer
restrictions.

Monitors wallet setup and token allocation.

Has **approval authority within RBAC system**.

**Agent (Placement Agent, Investment Bank, or Administrator)**

Facilitates issuer due diligence and compliance checks.

Supports investor marketing, subscription tracking, and qualification
oversight.

Assists Owner in coordinating token allocation and reporting.

**Legal/Compliance Agent (Legal Advisor, MLRO Officer)**

Conducts SPV legal structuring and risk disclosures.

Ensures issuer onboarding meets jurisdictional and regulatory standards.

Works with Guardian Policy Enforcement to finalize compliance settings.

Participates in **multi-signature approvals for issuer acceptance**.

**3) Issuance**

**Participant Role & Responsibilities**

**Issuer (Owner Role)**

- Allocates tokens to investors or SPVs from the dedicated issuance
  wallet.

- Ensures only qualified investors receive token allocations.

- Tracks investor subscriptions, fund movements, and compliance
  approvals.

- **Uses cryptographic signing** for token distribution approvals.

**Chain Capital**

- Verifies issuance compliance before final activation.

- Ensures transfer restrictions, investor eligibility, and token
  settings are correct.

- Updates cap table and transaction records post-issuance.

- **Implements 2-of-3 multi-signature approvals** for high-value
  transactions.

**Guardian Policy Enforcement**

- Performs final validation before activating issuance.

- Ensures only whitelisted investors receive tokens.

- Blocks non-compliant transactions or unauthorized transfers.

- **Automates approvals based on risk-weighted policies**.

**Guardian Wallet**

Serves as the custodial source wallet for issued tokens.

Secures investor settlements and token transactions.

Manages OTC, exchange, and secondary market transactions.

**Agent (Broker-Dealer, Investment Manager, or Fund Administrator)**

Supports token distribution, investor onboarding, and post-issuance
monitoring.

Facilitates investor transactions on secondary markets.

Ensures investor cap table updates align with compliance policies.

**Legal/Compliance Agent (MLRO Officer, Counsel, Auditor)**

Verifies issuance compliance with financial regulations.

Ensures token contracts enforce investor protections.

Works with Guardian Policy Enforcement to monitor post-issuance
compliance.

Participates in **multi-signature security approvals**.

**4) Role-Based Access Control (RBAC) & Multi-Signature Approvals**

**User Roles & Permissions**

  --------------- --------------------------------------- ---------------
     **Role**                 **Permissions**               **Multi-Sig
                                                            Required?**

  **Super Admin** Full control over settings and security       Yes

     **Owner**      Manages token settings and issuance         Yes
                                 approvals                

   **Compliance      Oversees regulatory approvals and          Yes
     Manager**             compliance automation          

     **Agent**     Manages investor interactions and due        No
                                 diligence                

   **Compliance       Approves investor applications            No
     Officer**                                            
  --------------- --------------------------------------- ---------------

**Approval & Policy Automation**

  ------------------------- ------------------------ ---------------------
  Action                    Policy-Based Approval    Multi-Sig Required?

  Investor Approval         If KYC/AML verified      No

  Token Transfer            If within limits         No

  Fund Redemption           If compliance met        Yes

  Smart Contract Upgrade    Always                   Yes

  Role Reassignment         If elevating access      Yes
  ------------------------- ------------------------ ---------------------

**Consensus Mechanism (2-of-3 Signing)**

- **Two out of three required signers must approve** high-risk actions.

- **Signers include Super Admin, Owner, and Compliance Manager**.

- **Cryptographic key enforcement** ensures secure approvals.

- **Actions are blocked unless threshold is met**.

**Roles & Responsibilities Breakdown:**

1\) Onboarding Investor

+:-----------------------------:+:------------------------------------:+
| **Participant**               | **Role & Responsibilities**          |
+-------------------------------+--------------------------------------+
| Investor                      | \- Registers an account and submits  |
|                               | KYC/AML documents.                   |
|                               |                                      |
|                               | \- Connects or creates a wallet via  |
|                               | Guardian Wallet.                     |
|                               |                                      |
|                               | \- Selects investment projects and   |
|                               | undergoes qualification checks.      |
|                               |                                      |
|                               | \- Reviews and signs platform        |
|                               | agreements.                          |
|                               |                                      |
|                               | \- Monitors onboarding progress and  |
|                               | approval notifications.              |
+-------------------------------+--------------------------------------+
| Chain Capital                 | \- Manages investor onboarding       |
|                               | workflow and dashboard access.       |
|                               |                                      |
|                               | \- Ensures KYC/AML submissions are   |
|                               | routed to compliance for validation. |
|                               |                                      |
|                               | \- Verifies investor eligibility     |
|                               | based on jurisdictional & financial  |
|                               | criteria.                            |
|                               |                                      |
|                               | \- Updates cap table post-investor   |
|                               | qualification.                       |
|                               |                                      |
|                               | \- Facilitates real-time investor    |
|                               | tracking and compliance enforcement. |
+-------------------------------+--------------------------------------+
| Guardian Policy Enforcement   | \- Enforces investor eligibility,    |
|                               | identity verification, and           |
|                               | compliance rules.                    |
|                               |                                      |
|                               | \- Confirms wallet compliance &      |
|                               | whitelisting before allowing fund    |
|                               | transfers.                           |
|                               |                                      |
|                               | \- Approves investor qualification   |
|                               | based on regulatory conditions.      |
|                               |                                      |
|                               | \- Prevents non-compliant investors  |
|                               | from accessing tokenized securities. |
+-------------------------------+--------------------------------------+
| Guardian Wallet               | \- Provides custody and transaction  |
|                               | support for investors.               |
|                               |                                      |
|                               | \- Ensures only compliant wallets    |
|                               | interact with Chain Capital.         |
|                               |                                      |
|                               | \- Whitelists wallets before         |
|                               | allowing investor transactions.      |
|                               |                                      |
|                               | \- Secures transactions and fund     |
|                               | movements.                           |
+-------------------------------+--------------------------------------+
| Owner (Issuer Representative) | \- Monitors investor qualification   |
|                               | and ensures investor eligibility     |
|                               | aligns with issuance rules.          |
|                               |                                      |
|                               | \- Oversees whitelisting &           |
|                               | allocation of investor wallets.      |
|                               |                                      |
|                               | \- Collaborates with                 |
|                               | Legal/Compliance to prevent          |
|                               | regulatory violations.               |
+-------------------------------+--------------------------------------+
| Agent (Investment Manager,    | \- Assists investors in completing   |
| Placement Agent, or Fund      | onboarding requirements.             |
| Administrator)                |                                      |
|                               | \- Conducts initial investor due     |
|                               | diligence checks.                    |
|                               |                                      |
|                               | \- Works with Owner & Compliance     |
|                               | teams to approve or reject           |
|                               | investors.                           |
+-------------------------------+--------------------------------------+
| Legal/Compliance Agent (MLR   | \- Ensures investor onboarding       |
| Officer, Legal Counsel)       | complies with financial regulations. |
|                               |                                      |
|                               | \- Reviews agreements, KYC data, and |
|                               | investor disclosures.                |
|                               |                                      |
|                               | \- Works with Guardian Policy        |
|                               | Enforcement to enforce               |
|                               | jurisdictional rules.                |
+-------------------------------+--------------------------------------+

2\) Onboarding Issuer

+:------------------------:+:-----------------------------------------:+
| **Participant**          | **Role & Responsibilities**               |
+--------------------------+-------------------------------------------+
| Issuer (Owner Role)      | \- Registers an issuer account and        |
|                          | submits SPV details and documentation.    |
|                          |                                           |
|                          | \- Selects token standards, issuance      |
|                          | structure, and investor eligibility       |
|                          | rules.                                    |
|                          |                                           |
|                          | \- Configures transfer restrictions,      |
|                          | whitelist requirements, and compliance    |
|                          | settings.                                 |
|                          |                                           |
|                          | \- Transfers issuance funds to the        |
|                          | Guardian Wallet source wallet.            |
|                          |                                           |
|                          | \- Monitors onboarding progress and       |
|                          | compliance approvals.                     |
+--------------------------+-------------------------------------------+
| Chain Capital            | \- Manages issuer onboarding workflows    |
|                          | and legal structuring.                    |
|                          |                                           |
|                          | \- Verifies issuer SPV documentation and  |
|                          | risk disclosures.                         |
|                          |                                           |
|                          | \- Provides issuance structuring tools,   |
|                          | investor qualification management, and    |
|                          | compliance integration.                   |
|                          |                                           |
|                          | \- Updates the cap table and allocation   |
|                          | dashboard.                                |
+--------------------------+-------------------------------------------+
| Guardian Policy          | \- Ensures issuer meets compliance        |
| Enforcement              | requirements before activation.           |
|                          |                                           |
|                          | \- Enforces transfer restrictions,        |
|                          | whitelist controls, and issuer            |
|                          | obligations.                              |
|                          |                                           |
|                          | \- Blocks non-compliant issuers from      |
|                          | launching tokenized securities.           |
|                          |                                           |
|                          | \- Approves issuance before token         |
|                          | activation.                               |
+--------------------------+-------------------------------------------+
| Guardian Wallet          | \- Generates dedicated issuance wallet    |
|                          | per SPV/issuance.                         |
|                          |                                           |
|                          | \- Secures issuer funds and collateral    |
|                          | before issuance.                          |
|                          |                                           |
|                          | \- Manages investor subscriptions and     |
|                          | post-issuance settlements.                |
+--------------------------+-------------------------------------------+
| Owner (Issuer            | \- Oversees issuer onboarding,            |
| Representative)          | documentation submission, and approvals.  |
|                          |                                           |
|                          | \- Ensures issuance aligns with investor  |
|                          | qualification and transfer restrictions.  |
|                          |                                           |
|                          | \- Monitors wallet setup and token        |
|                          | allocation.                               |
+--------------------------+-------------------------------------------+
| Agent (Placement Agent,  | \- Facilitates issuer due diligence and   |
| Investment Bank, or      | compliance checks.                        |
| Administrator)           |                                           |
|                          | \- Supports investor marketing,           |
|                          | subscription tracking, and qualification  |
|                          | oversight.                                |
|                          |                                           |
|                          | \- Assists Owner in coordinating token    |
|                          | allocation and reporting.                 |
+--------------------------+-------------------------------------------+
| Legal/Compliance Agent   | \- Conducts SPV legal structuring and     |
| (Legal Advisor, MLR      | risk disclosures.                         |
| Officer)                 |                                           |
|                          | \- Ensures issuer onboarding meets        |
|                          | jurisdictional and regulatory standards.  |
|                          |                                           |
|                          | \- Works with Guardian Policy Enforcement |
|                          | to finalize compliance settings.          |
+--------------------------+-------------------------------------------+

3\) Issuance

+:------------------------------:+:-----------------------------------:+
| **Participant**                | **Role & Responsibilities**         |
+--------------------------------+-------------------------------------+
| Issuer (Owner Role)            | \- Allocates tokens to investors or |
|                                | SPVs from the dedicated issuance    |
|                                | wallet.                             |
|                                |                                     |
|                                | \- Ensures only qualified investors |
|                                | receive token allocations.          |
|                                |                                     |
|                                | \- Tracks investor subscriptions,   |
|                                | fund movements, and wallet          |
|                                | security.                           |
|                                |                                     |
|                                | \- Oversees ongoing regulatory      |
|                                | reporting and investor management.  |
+--------------------------------+-------------------------------------+
| Chain Capital                  | \- Verifies issuance compliance     |
|                                | before final activation.            |
|                                |                                     |
|                                | \- Ensures transfer restrictions,   |
|                                | investor eligibility, and token     |
|                                | settings are correct.               |
|                                |                                     |
|                                | \- Updates cap table and            |
|                                | transaction records post-issuance.  |
|                                |                                     |
|                                | \- Facilitates regulatory reporting |
|                                | and audits.                         |
+--------------------------------+-------------------------------------+
| Guardian Policy Enforcement    | \- Performs final validation before |
|                                | activating issuance.                |
|                                |                                     |
|                                | \- Ensures only whitelisted         |
|                                | investors receive tokens.           |
|                                |                                     |
|                                | \- Blocks non-compliant             |
|                                | transactions or unauthorized        |
|                                | transfers.                          |
|                                |                                     |
|                                | \- Maintains audit logs for         |
|                                | regulators and compliance teams.    |
|                                |                                     |
|                                | \- Approves secondary market        |
|                                | transfers post-issuance.            |
+--------------------------------+-------------------------------------+
| Guardian Wallet                | \- Serves as the custodial source   |
|                                | wallet for issued tokens.           |
|                                |                                     |
|                                | \- Secures investor settlements and |
|                                | token transactions.                 |
|                                |                                     |
|                                | \- Manages OTC, exchange, and       |
|                                | secondary market integrations.      |
|                                |                                     |
|                                | \- Supports post-issuance           |
|                                | redemptions, staking, and lifecycle |
|                                | events.                             |
+--------------------------------+-------------------------------------+
| Agent (Broker-Dealer,          | \- Supports token distribution,     |
| Investment Manager, or Fund    | investor onboarding, and            |
| Administrator)                 | post-issuance monitoring.           |
|                                |                                     |
|                                | \- Facilitates investor             |
|                                | transactions on secondary markets.  |
|                                |                                     |
|                                | \- Ensures investor cap table       |
|                                | updates align with regulatory       |
|                                | standards.                          |
+--------------------------------+-------------------------------------+
| Legal/Compliance Agent (MLR    | \- Verifies issuance compliance     |
| Officer, Counsel, Auditor)     | with financial regulations.         |
|                                |                                     |
|                                | \- Ensures token contracts enforce  |
|                                | investor protections.               |
|                                |                                     |
|                                | \- Works with Guardian Policy       |
|                                | Enforcement to monitor              |
|                                | post-issuance compliance.           |
|                                |                                     |
|                                | \- Conducts audits and reporting    |
|                                | for regulators.                     |
+--------------------------------+-------------------------------------+
