**Types of Conditional Transfers in Digital Securities**

Conditional transfers are rule-based transactions that only execute when
specific pre-defined criteria are met. These conditions ensure
compliance, security, and regulatory alignment in tokenised asset
transactions.

**1) Investor Qualification-Based Transfers**

Ensures that only eligible, verified investors can receive or send
tokens.

Examples:

Accredited Investor Transfers: Tokens can only be sent to accredited
investors based on KYC verification.

AML Compliance Transfers: Transfers require the receiver to be
whitelisted and pass Anti-Money Laundering (AML) checks.

Investor Suitability-Based Transfers: Tokens can only be transferred if
the investor meets specific financial criteria (e.g., net worth
thresholds, risk tolerance).

Workflow:

Investor initiates a transfer.

Guardian Policy Enforcement verifies the recipient[']{dir="rtl"}s
accreditation status.

If verified, Guardian Wallet executes the transfer.

If rejected, the transaction is blocked, and the sender is notified.

**2) Jurisdiction-Based Transfers**

Enforces geographical restrictions based on regulatory requirements.

Examples:

Cross-Border Restrictions: A token can only be a) issued in or b)
transferred to investors in approved jurisdictions.

Tax Residency Constraints: Tokens are blocked from being sent to
jurisdictions with higher tax implications.

Market Access Rules: Transfers between investors in restricted markets
(e.g., U.S. vs. EU) require prior authorisation. Includes sanctions.

Workflow:

Investor submits a transfer request.

Guardian Policy Enforcement checks sender and recipient jurisdiction.

If within compliant regions, the transfer is approved.

If outside an allowed region, the transfer is blocked.

**3) Asset Class-Type-Based Transfers**

Certain tokens may have unique restrictions based on their underlying
asset class.

Examples:

Debt Securities Transfers: Some private credit or structured debt
instruments only allow transfers to institutions.

Stablecoin-Backed Token Transfers: Tokens that are backed by fiat
reserves may have liquidity controls limiting transfers.

Tokenised Fund Shares: Fund shares can only be transferred to
pre-approved participants in the fund.

Workflow:

Investor attempts to transfer a security token.

Guardian Policy Enforcement checks if the recipient is eligible to hold
that asset type.

If eligible, the transfer proceeds; otherwise, it is blocked.

**4) Issuer-Imposed Restrictions**

The issuer of the token defines transfer conditions at issuance.

Examples:

Lock-Up Periods: Transfers cannot occur before a certain date (e.g.,
6-month lock-up after issuance).

Transfer Volume Limits: Investors can only transfer up to X% of their
holdings within a specified period.

Whitelist Transfers: Tokens can only be transferred to pre-approved
counterparties.

Term-sheet imposted / configured - qualifier, event, tranche or time
based considerations

Workflow:

Investor requests a transfer.

Guardian Policy Enforcement checks issuer-imposed conditions.

If conditions are met, the transfer proceeds.

If not, the investor receives a rejection notification.

**5) Conditional Approval Transfers**

Transfers require additional approval steps before execution.

Examples:

Multi-Signature Transfers: Requires two or more parties to approve the
transaction.

Escrow-Based Transfers: Tokens are held in escrow until a certain event
occurs.

Board/Agent Approval: Transfers need manual approval from an
administrator or compliance agent.

Workflow:

Investor requests a transfer.

Guardian Policy Enforcement identifies that additional approvals are
required.

Transaction is sent to the required approvers (e.g., issuer, fund
manager, compliance officer).

Once approved, Guardian Wallet executes the transfer.

If denied, the investor is notified.

**6) Time-Based Transfers**

Enforces time-sensitive restrictions on transfers.

Examples:

Scheduled Transfers: Tokens can only be moved or redeemed after a
specified vesting or periodic settlement schedule.

Cliff Vesting: Employees or investors must wait X months/years before
transferring their security tokens.

Expiry-Based Transfers: Tokens are only transferable within a defined
time period before becoming non-transferable.

Workflow:

Investor submits a transfer request.

Guardian Policy Enforcement verifies the time-based conditions.

If the condition is met, the transfer is executed.

If the transfer is premature, it is rejected.

**7) Smart Contract-Triggered Transfers**

Transfers are automated based on external data inputs.

Examples:

Oracle-Based Compliance: Tokens can only transfer when external market
conditions are met (e.g., interest rate triggers).

Revenue-Linked Transfers: Transfers occur only when an underlying asset
reaches a financial milestone.

Insurance Payout-Based Transfers: If an insured event occurs, the smart
contract releases tokenised claims.

Workflow:

Smart contract listens for external event triggers.

Once triggered, Guardian Policy Enforcement confirms eligibility.

If met, Guardian Wallet executes the transfer.

Blockchain records the transaction.

**8) Collateralised Transfers**

Transfers are only approved if collateral conditions are met.

Examples:

Margin Trading Transfers: Tokens can only be moved if sufficient
collateral is maintained in an investor[']{dir="rtl"}s account.

Automatic Collateral Transfers: Threshold based: Exposure, LTV trigger,
IM or VM trigger or valuations thereof.

Loan-Backed Transfers: Tokens are locked until loan obligations are
fulfilled.

Credit-Linked Transfers: Transfers are allowed only if the counterparty
meets creditworthiness criteria.

Workflow:

Investor attempts to transfer a collateralised asset.

Guardian Policy Enforcement checks collateralisation requirements.

If collateral is sufficient, the transfer proceeds.

If collateral falls below the threshold, the transfer is blocked.

**9) Multi-Party Approvals for Syndicated Transactions**

- For structured finance products, a syndicate of stakeholders (e.g.,
  trustees, collateral agents, servicers) may need to approve transfers
  before they occur.

**10) Collateral-Based Conditional Transfers**

- Some tokenised assets (e.g., securitised loans, CLOs) may require
  verification of collateral sufficiency before allowing a transfer.

- If collateral levels drop below a certain threshold, transfers may be
  restricted.
