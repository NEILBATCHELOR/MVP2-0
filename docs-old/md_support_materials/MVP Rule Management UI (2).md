Below is a detailed specification for the compliance rules and other
categories outlined in your query for a digital asset issuance module.
Each category includes sub-categories and rule types with
configurations, UI fields, rule behaviours, consensus approval settings,
error handling, and validation mechanisms. This structured approach
ensures clarity and actionability for UI/UX teams and backend engineers.

**Compliance Rules**

These rules ensure adherence to legal and regulatory standards.

**Investor Qualification-Based Transfers**

These rules verify investor eligibility before allowing transfers.

**KYC (Know Your Customer)**

**Rule Type:** Require KYC verification before transfers (e.g., identity
documents submitted).

**UI Fields:**

**Compliance Check Type Dropdown:** Options: \"KYC\", \"AML\",
\"Accredited Investor\", \"Risk Profile\".

**Document Upload Section:** File input for identity documents (e.g.,
passport, ID).

**Verification Method Toggle:** \"Automatic\" or \"Manual\".

**Save Button:** Disabled until document is uploaded and verification
method is selected.

**Rule Behaviour:**

- Ensures KYC completion before transfers.

- Triggered before any transfer attempt.

- Blocks transfers if KYC is incomplete or failed.

**Consensus Approval Settings:**

- Manual verification requires \"Compliance Officer\" approval (single
  quorum).

- Automatic verification auto-approves via third-party API (e.g.,
  onFido).

**Error Handling:**

**Creation:** \"Missing document upload.\" -- Upload required documents.

**Execution:** \"KYC check failed.\" -- Transfers blocked.

**Removal:** \"Mandatory rule.\" -- Cannot remove.

**Validation Mechanisms:**

**Real-time:** Ensures document and verification method are set.

**Back-end:** Validates document authenticity.

**AML (Anti-Money Laundering)**

**Rule Type:** Block transfers if AML checks flag suspicious activity.

**UI Fields:**

**Compliance Check Type Dropdown:** Same as above.

**Risk Level Slider:** \"Low\" to \"High\".

**Suspicious Activity Flags:** Checkboxes (e.g., \"Large
transactions\").

**Save Button:** Disabled until risk level is set.

**Rule Behaviour:**

- Monitors transactions and flags or blocks based on risk level.

- Triggered on each transaction.

**Consensus Approval Settings:**

- High-risk transactions require \"Compliance Officer\" and \"Security
  Admin\" approval (2/3 quorum).

- Low-risk transactions auto-flagged.

**Error Handling:**

**Creation:** \"Risk level not set.\" -- Set risk level.

**Execution:** \"AML check failed.\" -- Transaction blocked.

**Validation Mechanisms:**

**Real-time:** Ensures risk level is set.

**Back-end:** Integrates with AML databases (e.g., World-Check).

**Jurisdiction-Based Transfers**

These rules enforce geographic compliance.

**Allowed/Blocked Jurisdictions**

**Rule Type:** Allow entities (role-users) subscriptions, transfers and
redemptions only to/from specific countries (e.g., US, EU).

**UI Fields:**

**Jurisdiction Multi-Select Dropdown:** List of countries.

**Rule Type Toggle:** \"Allow\" or \"Block\".

**Save Button:** Disabled until jurisdictions are selected.

**Rule Behaviour:**

- Restricts transfers based on jurisdiction.

- Triggered on each transfer.

**Consensus Approval Settings:**

- Changes require \"Compliance Officer\" approval (single quorum).

- Auto-approves within safe lists.

**Error Handling:**

**Creation:** \"No jurisdictions selected.\" -- Select at least one.

**Execution:** \"Jurisdiction check failed.\" -- Transfer blocked.

**Validation Mechanisms:**

**Real-time:** Ensures jurisdiction selection.

**Back-end:** Verifies investor location.

**Operational Rules**

These govern transaction mechanics and platform operations.

**Transaction Rules**

**Transaction Amount Limits**

**Rule Type:** Cap individual transactions (e.g., max \$10,000 USD).

**UI Fields:**

**Amount Limit Input:** Numeric field (e.g., \"10000\").

**Currency Dropdown:** \"USD\", \"ETH\", etc.

**Save Button:** Disabled until amount and currency are set.

**Rule Behaviour:**

- Blocks transactions exceeding the cap.

- Triggered on each transaction.

**Consensus Approval Settings:**

- Changes require \"Platform Admin\" approval (single quorum).

**Error Handling:**

**Creation:** \"Amount not set.\" -- Set limit.

**Execution:** \"Amount limit exceeded.\" -- Transaction blocked.

**Validation Mechanisms:**

**Real-time:** Ensures amount \> 0.

**Back-end:** Converts currencies if needed.

**Time-Based Rules**

**Lock-Up Periods**

**Rule Type:** Prevent transfers before a lock-up ends (e.g., 6 months).

**UI Fields:**

**Start Date Picker:** Sets lock-up start.

**End Date Picker:** Sets lock-up end.

**Save Button:** Disabled until dates are set.

**Rule Behaviour:**

- Blocks transfers until lock-up ends.

- Triggered on transfer attempts.

**Consensus Approval Settings:**

- Changes require \"Issuer Admin\" approval (single quorum).

**Error Handling:**

**Execution:** \"Lock-up period active.\" -- Transfer blocked.

**Validation Mechanisms:**

**Real-time:** Ensures end date \> start date.

**Back-end:** Tracks lock-up status.

**Asset-Specific Rules**

These rules are tailored to tokenised asset characteristics.

**Debt Securities**

**Rule Type:** Restrict debt securities to accredited investors.

**UI Fields:**

**Asset Class Dropdown:** \"Debt Securities\", \"Stablecoins\", etc.

**Eligibility Text-area:** \"Must be accredited investor\".

**Rule Behaviour:**

- Blocks non-accredited investors.

- Triggered on transfers.

**Consensus Approval Settings:**

- Changes require \"Issuer Admin\" approval (single quorum).

**Error Handling:**

**Execution:** \"Not accredited.\" -- Transfer blocked.

**Validation Mechanisms:**

**Back-end:** Links to investor accreditation status.

**Advanced Rules**

These enable complex, conditional, or automated behaviours.

**Multi-Party Syndicated Approvals**

**Stakeholder Sign-Off**

**Rule Type:** Require 3 stakeholder approvals.

**UI Fields:**

**Stakeholder Count Dropdown:** \"2\", \"3\", etc.

**Rule Behaviour:**

- Blocks transfers without approvals.

**Consensus Approval Settings:**

- Requires specified stakeholders (e.g., \"Issuer Admin\", \"Investor
  Rep\").

**Error Handling:**

**Execution:** \"Insufficient approvals.\" -- Transfer blocked.

**Validation Mechanisms:**

**Back-end:** Tracks approvals.
