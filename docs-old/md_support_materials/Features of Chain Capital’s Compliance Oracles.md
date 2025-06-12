**Features of Chain Capital's Compliance Oracles**

**1. Integration of Off-Chain Compliance Rules**

**Functionality**:

The compliance oracle integrates legal and regulatory rules (e.g.,
KYC/AML requirements, investor eligibility, geographic restrictions)
into blockchain transactions.

Acts as a validator to ensure that every transaction meets the
predefined compliance parameters.

**Example**:

Before a token transfer occurs, the oracle checks whether both parties
are accredited investors and whether the transfer complies with
jurisdictional laws.

**2. Whitelisting and Blacklisting**

**Functionality**:

Maintains a whitelist of approved participants (e.g., wallets of
accredited investors) and blocks interactions from blacklisted entities
(e.g., sanctioned individuals or wallets).

Ensures only qualified and approved investors can hold or trade
tokenised assets.

**Example**:

Wallets that fail KYC/AML checks are blacklisted, preventing them from
interacting with the token.

**3. Real-Time Compliance Checks**

**Functionality**:

Executes compliance checks in real-time during critical actions such as
token transfers, trades, or allocations.

Verifies parameters like maximum holding limits, transfer restrictions,
or jurisdictional compliance before approving a transaction.

**Example**:

For ERC-1400 tokens, the oracle validates if the buyer meets the
eligibility criteria and whether the transfer aligns with regulatory
limits.

**4. Token Metadata Validation**

**Functionality**:

Validates and updates compliance-related metadata embedded in tokens.

Metadata includes details like eligibility criteria, jurisdictional
constraints, or investor accreditation status.

**Example**:

Updates an ERC-721 NFT[']{dir="rtl"}s metadata to reflect changes in
compliance rules for its associated claim.

**5. Automated Reporting and Audit Trails**

**Functionality**:

Generates immutable records of compliance checks and approvals for
regulatory reporting.

Provides a transparent audit trail of all compliance-related activities
on the blockchain.

**Example**:

Produces reports showing which wallet interacted with tokens, the
compliance rules validated, and the outcomes of those validations.

**6. Cross-Platform Interoperability**

**Functionality**:

Integrates with multiple blockchains and external systems (e.g.,
third-party KYC/AML providers or government databases).

Ensures compliance checks are consistent across different trading
platforms and jurisdictions.

**Example**:

Works with exchanges like SIX or SDX to enforce compliance for trades
involving tokenised assets.

**7. Enforcement of Compliance Rules in Smart Contracts**

**Functionality**:

Embeds compliance rules directly into smart contracts governing
tokenised securities.

Ensures these rules are executed automatically without manual
intervention.

**Example**:

A smart contract may reject a token transfer if the compliance oracle
signals that the recipient[']{dir="rtl"}s wallet is unverified.
