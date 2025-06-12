**Step-by-Step Workflow for Chain Capital[']{dir="rtl"}s Multi-User
Platform (Issuance Functionality)**

**Step-by-Step Workflow for a Mermaid Diagram**

mermaid

CopyEdit

graph TD

A\[Investor Onboarding\] \--\> B\[KYC-KYB Verification\]

B \--\> C\[Investor Qualification\]

C \--\> D\[Digital Document Signing\]

D \--\> E\[Tokenized Payment Processing\]

E \--\> F\[Token Deployment by Issuer\]

F \--\> G\[Compliance Configuration\]

G \--\> H\[Whitelist Management\]

H \--\> I\[Token Allocation to Investors\]

I \--\> J\[Cap Table Synchronization\]

J \--\> K\[Primary Market Operations\]

K \--\> L\[Secondary Market Readiness\]

L \--\> M\[Reporting & Analytics\]

**Written Description of the Workflow**

**1. Investor Onboarding**

**Purpose:** Initiates the process for investors to join the platform.

**Functionality:** Investors access the platform and begin registration,
submitting their details for identity verification.

**2. KYC-KYB Verification**

**Purpose:** Ensures compliance with regulatory requirements.

**Functionality:** Investors complete an institutional-grade KYC-KYB
process, submitting documents and undergoing real-time verification.

**3. Investor Qualification**

**Purpose:** Evaluate investors based on issuer-defined criteria.

**Functionality:** Issuers or compliance agents review applications to
ensure that only qualified investors gain access.

**4. Digital Document Signing**

**Purpose:** Streamlines legal agreements.

**Functionality:** Qualified investors sign subscription agreements
digitally through Guardian[']{dir="rtl"}s cryptographic signature tool,
ensuring legal enforceability.

**5. Tokenized Payment Processing**

**Purpose:** Facilitate secure and efficient payments.

**Functionality:** Investors complete payments using tokenized cash
(future support for fiat payments), with instant confirmations recorded
on the issuer[']{dir="rtl"}s wallet.

**6. Token Deployment by Issuer**

**Purpose:** Launch the digital securities.

**Functionality:** Issuers deploy ERC20, ERC721, ERC1155, ERC1400, or
ERC3525 tokens via the platform\'s intuitive interface.

**7. Compliance Configuration**

**Purpose:** Embed regulatory rules into the tokens.

**Functionality:** Issuers define eligibility rules, compliance
parameters, and wallet permissions, ensuring tokens carry compliance
natively.

**8. Whitelist Management**

**Purpose:** Ensure secure token interactions.

**Functionality:** Identity storage maintains an updated whitelist,
restricting token transfers to approved participants.

**9. Token Allocation to Investors**

**Purpose:** Distribute tokens efficiently.

**Functionality:** Issuers or custodians allocate tokens to investors,
with support for bulk operations and real-time Guardian Wallet updates.

**10. Cap Table Synchronization**

**Purpose:** Maintain accurate ownership records.

**Functionality:** Automatic updates to the issuer\'s cap table after
every transaction, ensuring transparency.

**11. Primary Market Operations**

**Purpose:** Manage subscription and redemption processes.

**Functionality:** Issuers handle open-ended or periodic subscriptions
and facilitate redemptions seamlessly.

**12. Secondary Market Readiness**

**Purpose:** Enable liquidity and broader participation.

**Functionality:** Tokens are made tradable on secondary platforms, with
compliance and valuation data embedded.

**13. Reporting & Analytics**

**Purpose:** Provide actionable insights.

**Functionality:** Issuers and agents access detailed reports on token
holdings, transaction history, and cap table updates for operational and
auditing purposes.

sequenceDiagram

participant Investor

participant Issuer

participant ComplianceAgent

participant ChainPlatform

participant GuardianWallet

Investor-\>\>+ChainPlatform: Begin onboarding process

ChainPlatform\--\>\>Investor: Submit KYC/KYB documents

Investor-\>\>+ChainPlatform: Complete KYC/KYB process

ChainPlatform-\>\>+ComplianceAgent: Verify investor identity and
documents

ComplianceAgent\--\>\>-ChainPlatform: Approve/Reject investor

ChainPlatform\--\>\>Investor: Notify investor of qualification status

Investor-\>\>+ChainPlatform: Digitally sign subscription agreement

ChainPlatform\--\>\>Investor: Confirmation of subscription

Investor-\>\>+GuardianWallet: Make tokenized payment

GuardianWallet\--\>\>ChainPlatform: Payment confirmation

ChainPlatform\--\>\>Issuer: Investor payment complete

Issuer-\>\>+ChainPlatform: Deploy token smart contracts

ChainPlatform\--\>\>Issuer: Confirm token deployment

Issuer-\>\>+ChainPlatform: Configure compliance rules (e.g., whitelist,
eligibility)

ChainPlatform\--\>\>Issuer: Compliance settings applied

Issuer-\>\>+ChainPlatform: Allocate tokens to investors

ChainPlatform\--\>\>GuardianWallet: Update investor wallet balances

GuardianWallet\--\>\>Investor: Notify of token receipt

ChainPlatform-\>\>Issuer: Update cap table in real-time

Issuer\--\>\>ComplianceAgent: Real-time cap table synchronization

Issuer-\>\>+ChainPlatform: Manage primary market operations
(subscriptions/redemptions)

ChainPlatform\--\>\>Issuer: Updates on token lifecycle and transactions

ChainPlatform-\>\>Issuer: Enable tokens for secondary market trading

Issuer\--\>\>Investor: Notify of secondary market readiness

Investor-\>\>+ChainPlatform: Request reports and analytics

ChainPlatform\--\>\>Investor: Provide transaction history and cap table
updates

**Written Description of the Sequence**

**Step 1: Onboarding**

- The investor begins the onboarding process on the Chain Capital
  platform.

- The platform requests KYC/KYB documents and verifies them with the
  compliance agent.

**Step 2: Qualification**

- Compliance agents review the investor\'s documents.

- Upon approval, the platform notifies the investor of their
  qualification.

**Step 3: Subscription Agreement**

- The investor digitally signs the subscription agreement through the
  platform.

- The platform confirms the agreement and prepares for the payment
  stage.

**Step 4: Payment Processing**

- The investor makes a tokenized payment to the Guardian Wallet.

- The wallet confirms the payment, and the platform notifies the issuer
  of completion.

**Step 5: Token Deployment**

- The issuer deploys token smart contracts through the Chain Capital
  platform.

- The platform confirms the deployment and allows the issuer to set
  compliance rules.

**Step 6: Compliance Configuration**

- The issuer configures compliance rules, including whitelists and
  eligibility criteria.

**Step 7: Token Allocation**

- The issuer allocates tokens to investors, and Guardian Wallet updates
  their balances.

- Investors are notified of their token receipt.

**Step 8: Cap Table Management**

- The platform updates the issuer\'s cap table in real-time, ensuring
  transparency.

- Compliance agents also have access to synchronized cap tables.

**Step 9: Primary Market Management**

- Issuers handle subscriptions and redemptions, with the platform
  providing updates on token lifecycle events.

**Step 10: Secondary Market Enablement**

- The issuer enables tokens for trading on secondary markets.

- Investors are notified that they can trade tokens on supported venues.

**Step 11: Reporting and Analytics**

- Investors request transaction and cap table reports.

- The platform provides detailed analytics and updates.
