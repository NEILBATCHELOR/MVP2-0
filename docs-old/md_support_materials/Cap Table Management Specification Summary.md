**Cap Table Management Specification Summary**

Below is a concise summary of the **Cap Table Management Specification**
for the Chain Capital platform, focusing on the key functions outlined
in the document, \"Prerequisites Cap Table Management Initial
Workflow.\" This summary distills the core functionalities of the cap
table management process, particularly for preparing and managing token
allocations for issuance.

**Purpose**: Enable issuers on the Chain Capital platform to manage
token allocations efficiently by creating and maintaining a real-time
capitalisation (cap) table, facilitating token minting, subscription
confirmation, and distribution to investors.

**Key Functions**:

**Investor Table Creation and Selection**:

Allows issuers to create an investor table by uploading a CSV file
(containing Name, Email, Type, Status \[KYC-AML-Risk\], Wallet Address
\[ETH address\]) in a separate \"Investors\" tab.

Enables selection of investors from the table using checkboxes, with
["]{dir="rtl"}Select All" and ["]{dir="rtl"}Deselect All" options for
the current filtered view.

Supports generating a cap table by clicking the ["]{dir="rtl"}Generate
Cap Table" button, populating the ["]{dir="rtl"}Cap Table Management"
tab with selected investors.

**Subscription Management**:

Permits issuers to create new investor subscriptions or upload/edit
existing ones (via CSV or manually) within the ["]{dir="rtl"}Cap Table
Management" tab.

Tracks subscription details per investor, including Project Type, Token
Type (e.g., ERC-1400, ERC-20), and Subscribed Amount (e.g., 100 tokens
of Token A, 50 tokens of Token B).

Offers options for standard (e.g., 100 tokens per investor across one or
more token types) or bespoke (custom amounts per investor)
subscriptions.

Includes a mechanism (e.g., button or toggle) to confirm subscriptions
individually or in bulk.

**Token Minting Preparation**:

Summarises the total tokens to mint per token type based on confirmed
subscriptions, linking to the ["]{dir="rtl"}Token Design" tab where
token designs (initially in ["]{dir="rtl"}draft" mode) must be switched
to ["]{dir="rtl"}ready to mint."

Displays only token types with confirmed subscriptions in the cap table.

Provides a ["]{dir="rtl"}Mint Tokens" action to mint the total amounts
to the issuer[']{dir="rtl"}s address once tokens are ["]{dir="rtl"}ready
to mint," requiring multi-signature approval.

**Allocation and Distribution**:

Manages token allocation post-minting, setting allocated amounts to
match confirmed subscriptions (bespoke) or a standard amount (e.g., 100
tokens per investor).

Includes a ["]{dir="rtl"}Confirm Allocations" step to review and approve
allocations before distribution.

Allocate caters for Removing selected Allocations.

Supports bulk distribution of tokens from the issuer[']{dir="rtl"}s
address to investor wallets via a ["]{dir="rtl"}Distribute Tokens"
action, ensuring compliance rules (e.g., whitelist, KYC/AML).

Tracks distribution status (e.g., Yes/No) and updates the cap table in
real-time.

**Cap Table Structure and Usability**:

Displays a flexible table structure with columns: Investor Name, Token
Type, Subscribed Amount, Confirmed, Allocated Amount, Allocation
Confirmed, Distributed, and Wallet Address.

Allows multiple token types per investor, with rows representing
investor-token type pairs.

Offers bulk actions (e.g., confirm subscriptions, mint tokens,
distribute) and editable fields (e.g., Subscribed Amount).

Includes a summary section per token type (e.g., ["]{dir="rtl"}Token A:
300 to mint, Minted: Yes").

**Reporting and Scalability**:

Enables issuers to download the cap table data (investors added) for
record-keeping.

Supports scalability with filters or tabs for multiple token types if
needed.

Provides a modal or interface for defining standard distribution
amounts, distinct from bespoke subscriptions.

**Additional Considerations**:

- Ensures real-time synchronisation with blockchain events for accurate
  token ownership tracking.

- Recommends a confirmation prompt for cap table generation to prevent
  accidental actions.

- Suggests pagination or infinite scrolling for large investor lists to
  maintain performance.

This summary encapsulates the cap table management functions for
preparing and executing token allocations in the Chain Capital platform,
ensuring efficiency, compliance, and scalability for issuance workflows.
