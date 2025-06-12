Below is a detailed specification for the compliance rules and other
categories outlined in your query for a digital asset issuance module.
Each category includes sub-categories and rule types with
configurations, UI fields, rule behaviours, consensus approval settings,
error handling, and validation mechanisms. This structured approach
ensures clarity and actionability for UI/UX teams and backend engineers.

**1. Compliance Rules**

These rules ensure adherence to legal and regulatory standards.

**1a) Investor Qualification-Based Transfers**

These rules verify investor eligibility before allowing transfers.

**Sub-Category: KYC (Know Your Customer)**

**Rule Type**: Require KYC verification before transfers (e.g., identity
documents submitted).

**UI Fields**:

**Compliance Check Type Dropdown**: Options: \"KYC\", \"AML\",
\"Accredited Investor\", \"Risk Profile\".

**Document Upload Section**: File input for identity documents (e.g.,
passport, ID).

**Verification Method Toggle**: \"Automatic\" or \"Manual\".

**Save Button**: Disabled until document is uploaded and verification
method is selected.

**Rule Behaviour**:

Ensures KYC completion before transfers.

Triggered before any transfer attempt.

Blocks transfers if KYC is incomplete or failed.

**Consensus Approval Settings**:

Manual verification requires \"Compliance Officer\" approval (single
quorum).

Automatic verification auto-approves via third-party API (e.g., onFido).

**Error Handling**:

Creation: \"Missing document upload.\" -- Upload required documents.

Execution: \"KYC check failed.\" -- Transfers blocked.

Removal: \"Mandatory rule.\" -- Cannot remove.

**Validation Mechanisms**:

Real-time: Ensures document and verification method are set.

Back-end: Validates document authenticity.

**1b) Sub-Category: AML (Anti-Money Laundering)**

**Rule Type**: Block transfers if AML checks flag suspicious activity.

**UI Fields**:

**Compliance Check Type Dropdown**: Same as above.

**Risk Level Slider**: \"Low\" to \"High\".

**Suspicious Activity Flags**: Checkboxes (e.g., \"Large
transactions\").

**Save Button**: Disabled until risk level is set.

**Rule Behaviour**:

Monitors transactions and flags or blocks based on risk level.

Triggered on each transaction.

**Consensus Approval Settings**:

High-risk transactions require \"Compliance Officer\" and \"Security
Admin\" approval (2/3 quorum).

Low-risk transactions auto-flagged.

**Error Handling**:

Creation: \"Risk level not set.\" -- Set risk level.

Execution: \"AML check failed.\" -- Transaction blocked

**Validation Mechanisms**:

Real-time: Ensures risk level is set.

Back-end: Integrates with AML databases (e.g., World-Check).

**1c) Sub-Category: Accredited Investor Verification**

**Rule Type**: Restrict participation to accredited investors (e.g., net
worth \> \$1M USD).

**UI Fields**:

**Compliance Check Type Dropdown**: Same as above.

**Net Worth Input**: Numeric field (e.g., \"1000000\").

**Income Verification Toggle**: \"Required\" or \"Optional\".

**Save Button**: Disabled until net worth is set.

**Rule Behaviour**:

Blocks non-accredited investors.

Triggered on onboarding and transfers.

**Consensus Approval Settings**:

Manual verification requires \"Compliance Officer\" approval (single
quorum).

Auto-verifies with uploaded documents.

**Error Handling**:

Creation: \"Net worth not set.\" -- Set threshold.

Execution: \"Accreditation check failed.\" -- Participation blocked.

**Validation Mechanisms**:

Real-time: Ensures net worth \> 0.

Back-end: Verifies against regulatory standards.

**1d) Sub-Category: Risk Profile Verification**

**Rule Type**: Limit exposure based on risk tolerance (e.g., high-risk
assets for aggressive profiles).

**UI Fields**:

**Compliance Check Type Dropdown**: Same as above.

**Risk Tolerance Slider**: \"Conservative\" to \"Aggressive\".

**Asset Exposure Limits**: Numeric fields (e.g., \"20% high-risk\").

**Save Button**: Disabled until risk tolerance is set.

**Rule Behaviour**:

Blocks investments exceeding risk limits.

Triggered on each investment attempt.

**Consensus Approval Settings**:

High-exposure investments require \"Compliance Officer\" and \"Financial
Advisor\" approval (2/3 quorum).

Auto-approves within limits.

**Error Handling**:

Creation: \"Risk tolerance not set.\" -- Set tolerance.

Execution: \"Risk check failed.\" -- Investment blocked.

**Validation Mechanisms**:

Real-time: Ensures risk tolerance is set.

Back-end: Checks historical investment data.

**1e) Jurisdiction-Based Transfers**

These rules enforce geographic compliance.

**1ei) Sub-Category: Allowed/Blocked Jurisdictions**

**Rule Type**: Allow transfers only to/from specific countries (e.g.,
US, EU).

**UI Fields**:

**Jurisdiction Multi-Select Dropdown**: List of countries.

**Rule Type Toggle**: \"Allow\" or \"Block\".

**Save Button**: Disabled until jurisdictions are selected.

**Rule Behaviour**:

Restricts transfers based on jurisdiction.

Triggered on each transfer.

**Consensus Approval Settings**:

Changes require \"Compliance Officer\" approval (single quorum).

Auto-approves within safe lists.

**Error Handling**:

Creation: \"No jurisdictions selected.\" -- Select at least one.

Execution: \"Jurisdiction check failed.\" -- Transfer blocked.

**Validation Mechanisms**:

Real-time: Ensures jurisdiction selection.

Back-end: Verifies investor location.

**1eii) Sub-Category: Tax Residency Compliance**

**Rule Type**: Require tax residency proof for certain jurisdictions.

**UI Fields**:

**Tax Residency Proof Upload**: File input.

**Jurisdiction Dropdown**: List of countries.

**Save Button**: Disabled until proof and jurisdiction are set.

**Rule Behaviour**:

Blocks transfers without valid tax proof.

Triggered on onboarding and updates.

**Consensus Approval Settings**:

Manual review requires \"Compliance Officer\" approval (single quorum).

Auto-approves with valid documents.

**Error Handling**:

Creation: \"Missing proof.\" -- Upload documents.

Execution: \"Tax residency check failed.\" -- Transfers blocked.

**Validation Mechanisms**:

Real-time: Ensures proof and jurisdiction are set.

Back-end: Verifies tax documents.

**1eiii) Sub-Category: Sanctions List Checks**

**Rule Type**: Block transactions to sanctioned regions (e.g., OFAC
list).

**UI Fields**:

**Sanctions List Source Dropdown**: \"OFAC\", \"EU Sanctions\", etc.

**Check Frequency Slider**: \"Daily\" to \"Weekly\".

**Save Button**: Disabled until source and frequency are set.

**Rule Behaviour**:

Blocks transactions involving sanctioned entities.

Triggered on transactions and periodic checks.

**Consensus Approval Settings**:

High-risk cases require \"Security Admin\" and \"Compliance Officer\"
approval (2/3 quorum).

Auto-blocks known sanctions.

**Error Handling**:

Creation: \"Source not selected.\" -- Select a source.

Execution: \"Sanctions check failed.\" -- Transaction blocked.

**Validation Mechanisms**:

Real-time: Ensures source and frequency are set.

Back-end: Integrates with sanctions databases.

**2. Operational Rules**

These govern transaction mechanics and platform operations.

**2a. Transaction Rules**

**2ai) Sub-Category: Transaction Transfer Amount Limits**

**Rule Type**: Cap individual transactions (e.g., max \$10,000 USD).

**UI Fields**:

**Amount Limit Input**: Numeric field (e.g., \"10000\").

**Currency Dropdown**: \"USD\", \"ETH\", etc.

**Save Button**: Disabled until amount and currency are set.

**Rule Behaviour**:

Blocks transactions exceeding the cap.

Triggered on each transaction.

**Consensus Approval Settings**:

Changes require \"Platform Admin\" approval (single quorum).

**Error Handling**:

Creation: \"Amount not set.\" -- Set limit.

Execution: \"Amount limit exceeded.\" -- Transaction blocked.

**Validation Mechanisms**:

Real-time: Ensures amount \> 0.

Back-end: Converts currencies if needed.

**2aii) Sub-Category: Velocity Limits**

**Rule Type**: Limit total funds transferred over time (e.g.,
\$50,000/month).

**UI Fields**:

**Total Limit Input**: Numeric field (e.g., \"50000\").

**Time Period Dropdown**: \"Day\", \"Week\", \"Month\".

**Currency Dropdown**: Same as above.

**Rule Behaviour**:

Blocks transfers exceeding the time-based limit.

Triggered on each transaction.

**Consensus Approval Settings**:

Changes require \"Platform Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Velocity limit exceeded.\" -- Transaction blocked.

**Validation Mechanisms**:

Real-time: Ensures limit and period are set.

Back-end: Tracks cumulative transfers.

**2aiii) Sub-Category: Transaction Destination Restrictions**

**Rule Type**: Block transfers to specific addresses (e.g., known fraud
wallets).

**UI Fields**:

**Blocked Address Input**: Text input (e.g., \"0xAddress\").

**Save Button**: Disabled until address is entered.

**Rule Behaviour**:

Blocks transfers to listed addresses.

Triggered on each transaction.

**Consensus Approval Settings**:

Updates require \"Security Admin\" approval (single quorum).

**Error Handling**:

Creation: \"No address entered.\" -- Enter an address.

Execution: \"Destination blocked.\" -- Transfer blocked.

**Validation Mechanisms**:

Real-time: Validates address format.

Back-end: Checks against blacklist.

**2b) Time-Based Rules**

**2bi) Sub-Category: Lock-Up Periods**

**Rule Type**: Prevent transfers before a lock-up ends (e.g., 6 months).

**UI Fields**:

**Start Date Picker**: Sets lock-up start.

**End Date Picker**: Sets lock-up end.

**Save Button**: Disabled until dates are set.

**Rule Behaviour**:

Blocks transfers until lock-up ends.

Triggered on transfer attempts.

**Consensus Approval Settings**:

Changes require \"Issuer Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Lock-up period active.\" -- Transfer blocked.

**Validation Mechanisms**:

Real-time: Ensures end date \> start date.

Back-end: Tracks lock-up status.

**3. Asset-Specific Rules**

These rules are tailored to tokenised asset characteristics.

**3a) Asset Class-Based Transfers**

**3ai) Sub-Category: Debt Securities**

**Rule Type**: Restrict debt securities to accredited investors.

**UI Fields**:

**Asset Class Dropdown**: \"Debt Securities\", \"Stablecoins\", etc.

**Eligibility Textarea**: \"Must be accredited investor\".

**Rule Behaviour**:

Blocks non-accredited investors.

Triggered on transfers.

**Consensus Approval Settings**:

Changes require \"Issuer Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Not accredited.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Links to investor accreditation status.

**3aii) Sub-Category: Stablecoins**

**Rule Type**: Require minimum stablecoin holdings (e.g., 100 tokens).

**UI Fields**:

**Asset Class Dropdown**: Same as above.

**Minimum Holding Input**: Numeric field (e.g., \"100\").

**Rule Behaviour**:

Blocks transfers if holdings are below minimum.

Triggered on transfers.

**Consensus Approval Settings**:

Changes require \"Issuer Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Below minimum holdings.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Checks wallet balance.

**3aiii) Sub-Category: Tokenised Funds**

**Rule Type**: Limit tokenised fund transfers based on fund rules.

**UI Fields**:

**Asset Class Dropdown**: Same as above.

**Fund Rules Textarea**: \"Max 10% per investor\".

**Rule Behaviour**:

Enforces fund-specific limits.

Triggered on transfers.

**Consensus Approval Settings**:

Changes require \"Fund Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Fund rule violation.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Applies fund-specific logic.

**3b) Issuer-Imposed Restrictions**

**3bi) Sub-Category: Whitelist Transfers**

**Rule Type**: Restrict transfers to whitelisted addresses.

**UI Fields**:

**Whitelist Address Input**: Text input (e.g., \"0xAddress\").

**Rule Behaviour**:

Blocks transfers to non-whitelisted addresses.

Triggered on transfers.

**Consensus Approval Settings**:

Updates require \"Issuer Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Address not whitelisted.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Checks against whitelist.

**3bii) Sub-Category: Volume-Supply Limits**

**Rule Type**: Cap total token supply (e.g., 1M tokens).

**UI Fields**:

**Supply Cap Input**: Numeric field (e.g., \"1000000\").

**Rule Behaviour**:

Blocks issuance exceeding cap.

Triggered on issuance/transfer.

**Consensus Approval Settings**:

Changes require \"Issuer Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Supply cap exceeded.\" -- Action blocked.

**Validation Mechanisms**:

Back-end: Tracks total supply.

**Sub-Category: Investor Minimum Balance**

**Rule Type**: Require minimum balances (e.g., 50 tokens).

**UI Fields**:

**Minimum Balance Input**: Numeric field (e.g., \"50\").

**Rule Behaviour**:

Blocks transfers reducing balance below minimum.

**Consensus Approval Settings**:

Changes require \"Issuer Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Below minimum balance.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Checks wallet balance.

**3biii) Sub-Category: Investor Max Allocation**

**Rule Type**: Limit individual allocations (e.g., max 10% of supply).

**UI Fields**:

**Max Allocation Input**: Numeric field (e.g., \"10\").

**Enforcement Dropdown**: \"Fixed\", \"Dynamic\".

**Rule Behaviour**:

Blocks transfers exceeding allocation.

**Consensus Approval Settings**:

Changes require \"Issuer Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Allocation limit exceeded.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Calculates allocation percentage.

**4. Advanced Rules**

These enable complex, conditional, or automated behaviours.

**Conditional Approval Transfers**

**Sub-Category: Multi-Signature Approvals**

**Rule Type**: Require 2-of-3 signatures for transfers.

**UI Fields**:

**Toggle**: Enable multi-sig.

**Threshold Dropdown**: \"2-of-3\", \"3-of-5\", etc.

**Rule Behaviour**:

Blocks transfers without required signatures.

Triggered on transfers.

**Consensus Approval Settings**:

Requires specified signatories (e.g., \"Issuer Admin\", \"Compliance
Officer\").

**Error Handling**:

Execution: \"Insufficient signatures.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Verifies signatures.

**Sub-Category: Escrow Conditions**

**Rule Type**: Hold funds in escrow until conditions are met (e.g.,
delivery confirmation).

**UI Fields**:

**Escrow Type Dropdown**: \"Event-Based\", \"Manual\".

**Rule Behaviour**:

Holds funds until condition is satisfied.

**Consensus Approval Settings**:

Manual release requires \"Escrow Admin\" approval (single quorum).

**Error Handling**:

Execution: \"Escrow condition unmet.\" -- Funds held.

**Validation Mechanisms**:

Back-end: Monitors condition status.

**Smart Contract-Triggered Transfers**

Not required for MVP

**Collateralised Transfers**

**Sub-Category: Minimum Collateral Requirements**

Not required for MVP

**Sub-Category: Automatic Liquidation**

Not required for MVP

**Multi-Party Syndicated Approvals**

Not required for MVP

**Sub-Category: Stakeholder Sign-Off (Not required for MVP)**

**Rule Type**: Require 3 stakeholder approvals.

**UI Fields**:

**Stakeholder Count Dropdown**: \"2\", \"3\", etc.

**Rule Behaviour**:

Blocks transfers without approvals.

**Consensus Approval Settings**:

Requires specified stakeholders (e.g., \"Issuer Admin\", \"Agent\").

**Error Handling**:

Execution: \"Insufficient approvals.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Tracks approvals.

**Sub-Category: Syndicate Member Approvals**

**Rule Type**: Specify sequential or concurrent approval order.

**UI Fields**:

**Member Multi-Select**: List of syndicate members.

**Order Dropdown**: \"Sequential\", \"Concurrent\".

**Rule Behaviour**:

Enforces approval order and or minimum number of members to approve.

**Consensus Approval Settings**:

Requires specified members.

**Error Handling**:

Execution: \"Approval pending.\" -- Transfer blocked.

**Validation Mechanisms**:

Back-end: Manages approval workflow.
