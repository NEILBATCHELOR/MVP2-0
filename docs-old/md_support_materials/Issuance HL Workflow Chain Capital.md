**Granular sequence diagram** focused solely on the **issuance
functionality**:

sequenceDiagram

participant Issuer

participant ComplianceAgent

participant ChainPlatform

participant GuardianWallet

participant Investor

Issuer-\>\>+ChainPlatform: Deploy token smart contracts

ChainPlatform\--\>\>Issuer: Confirm deployment

Issuer-\>\>+ChainPlatform: Configure compliance rules

ChainPlatform\--\>\>Issuer: Apply eligibility, whitelist, and compliance
parameters

Issuer-\>\>+ComplianceAgent: Review compliance rules and whitelist

ComplianceAgent\--\>\>ChainPlatform: Approve/Update compliance settings

ChainPlatform\--\>\>Issuer: Compliance rules finalized

Issuer-\>\>+ChainPlatform: Allocate tokens to investors

ChainPlatform-\>\>+GuardianWallet: Transfer tokens to investor wallets

GuardianWallet\--\>\>Investor: Notify investor of token allocation

GuardianWallet\--\>\>Issuer: Confirm allocation

Issuer-\>\>+ChainPlatform: Update cap table with allocation details

ChainPlatform\--\>\>Issuer: Real-time cap table synchronization

ChainPlatform\--\>\>Investor: Update investor\'s dashboard with token
details

**Written Description of the Issuance Workflow**

**Step 1: Token Deployment**

The **issuer** accesses the Chain Capital platform to deploy token smart
contracts.

Tokens are created using compatible standards like ERC20, ERC721,
ERC1155, etc.

The platform confirms successful token deployment.

**Step 2: Compliance Configuration**

- The issuer configures compliance rules, including:

  - Eligibility criteria for investors.

  - Whitelisting specific participants.

  - Regulatory parameters such as maximum investor volumes.

- The platform applies the configured compliance settings.

**Step 3: Compliance Review**

The **compliance agent** reviews and approves the compliance
configurations.

Updates or modifications are sent back to the platform if necessary.

Finalized compliance rules are applied to the tokens.

**Step 4: Token Allocation**

- The **issuer** allocates tokens to investors using the
  platform[']{dir="rtl"}s tools.

- Features include:

  - Bulk allocation for multiple investors.

  - Individualized allocation for specific cases.

- The platform facilitates the transfer of tokens to investors\' wallets
  via the Guardian Wallet.

**Step 5: Investor Notification**

Investors receive notifications from the Guardian Wallet about their
token allocation.

Their dashboards on the platform are updated with real-time token
details.

**Step 6: Cap Table Synchronization**

The **issuer** requests updates to the cap table to reflect token
allocations.

The platform synchronizes the cap table in real-time, ensuring
transparency for all stakeholders.

Investors and compliance agents can view updated ownership records.
