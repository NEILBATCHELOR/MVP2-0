**Prerequisites Cap Table Management Initial Workflow**

- Creation on an investor table in the investors table from a CSV
  upload. Once investors are selected from such a table, there is a
  generate cap table button.

- On click table update the cap table in the next tab

- Cap table management core functions:

- Create new investor subscriptions

- Confirm investor subscriptions.

- Based on this confirmation of subscriptions per investor

- Bulk distribute either

- a\) a standard definable amount of tokens to investors, i.e. 100 x
  ERC-1400 per investor, this can be one or more types of tokens or

- b\) a bespoke definable amount of tokens per investor (different for
  each investor).

- Cap table management needs to summarise the tokens that are ready to
  be minted, as designed in the token design tab (in draft mode).

- Switch status of the tokens designed prior from draft to ready to
  mint.

- Then enable mint of these token amounts and types,

- Once the mint has been confirmed into the issuers address,

- Tokens are minted ready to allocate.

- Confirm Allocations

- Distribute

**Overview of the Cap Table Management Initial Workflow**

To provide context for the data needed, here[']{dir="rtl"}s how the
system operates based on your description:

**Investor Selection**: An investor table is created from a CSV upload
in a separate tab: Investors. Investors are selected from this Investors
table, and clicking the \"Generate Cap Table\" button populates the cap
table in the \"Cap Table Management\" tab with the selected investors.

**Subscription Management**: Within the \"Cap Table Management\" tab.
One can upload and confirm investor subscriptions or create new ones.

**Token Minting Preparation**: The cap table summaries the total tokens
to be minted, based on subscriptions and token designs from the \"Token
Design\" tab (initially in draft mode). These tokens must be switched to
\"ready to mint\" before minting.

**Minting and Allocation**: After confirming subscriptions, tokens are
minted to the issuer[']{dir="rtl"}s address. Allocations are then set
up, confirmed, and distributed to investors, either as a standard amount
(e.g., 100 tokens per investor of one or more types) or bespoke amounts
per investor.

**Data**

The cap table in the \"Cap Table Management\" tab needs to display and
manage information to support this workflow. Here[']{dir="rtl"}s the
data that should be featured:

**1. Investor Information**

**Purpose**: Identifies the investors selected from the investor table.

**Fields**:

**Investor Name/ID**: A unique identifier (e.g., name, email, or wallet
address) to distinguish each investor.

**Source**: Populated from the CSV upload via the \"Generate Cap Table\"
button.

**2. Subscription Details**

**Purpose**: Tracks the project each investor is subscribed to, allowing
for uploads, edits, and creation of new subscriptions.

**Fields**:

**Project Type**: Current Project

**Token Type**: Within the project specific types of token (e.g.,
ERC-1400, ERC20---based tokens defined in the \"Token Design\" tab).
Since multiple token types are possible, each subscription should
specify the token type. It's possible for 1 investor to be allocated
multiple token types.

**Subscribed Amount**: The number of tokens the investor is subscribing
to for each token type (e.g., 100 Token A, 50 Token B).

**Functionality**:

Add the token types and the amounts: with an option a) a standard
definable amount of tokens to investors, i.e. 100 x ERC-1400 per
investor, this can be one or more types of tokens or b) a bespoke
definable amount of tokens per investor (different for each investor).

Download the investors added to the cap table

Upload subscription data (e.g., via CSV) for existing investors.

Interface to manually add or edit subscriptions for each investor,
specifying token types and amounts.

**3. Subscription Status**

**Purpose**: Indicates whether a subscription is confirmed, a
prerequisite for minting and distribution.

**Fields**:

**Confirmed**: A status indicator (e.g., Yes/No or a checkbox) to mark
subscriptions as confirmed.

**Functionality**:

A mechanism (e.g., button or toggle) to confirm individual or bulk
subscriptions.

**4. Token Minting Summary**

**Purpose**: Aggregates the total tokens to be minted per token type,
based on confirmed subscriptions, uses the max supply rules and token
ration as configured in the \"Token Design\" tab.

**Fields**:

**Total Tokens to Mint (per Token Type)**: A summary showing the sum of
confirmed subscribed amounts for each token type (e.g., 300 Token A, 150
Token B across all investors).

**Minting Status**: Indicates whether the tokens for a given type have
been minted (e.g., Not Minted, Minted).

**Functionality**:

Displays only token types with confirmed subscriptions.

Links to the \"Token Design\" tab, where token designs must be switched
from \"draft\" to \"ready to mint\" before minting can proceed.

A \"Mint Tokens\" action to mint the total amounts to the
issuer[']{dir="rtl"}s address once tokens are \"ready to mint."

**5. Allocation and Distribution Details**

- **Purpose**: Manages the allocation and distribution process after
  minting, supporting both standard and bespoke amounts with a
  confirmation step.

- **Fields**:

  - **Allocated Amount**: The number of tokens allocated to each
    investor per token type (typically matches the subscribed amount but
    can be adjusted for standard distributions).

  - **Allocation Confirmed**: A status (e.g., Yes/No) to indicate if the
    allocation has been reviewed and confirmed.

  - **Distributed**: A status (e.g., Yes/No) to show if the tokens have
    been transferred to the investor[']{dir="rtl"}s address.

- **Functionality**:

  - Post-minting, allocations are automatically set to match confirmed
    subscribed amounts (for bespoke distribution) or can be set to a
    standard amount (e.g., 100 tokens per investor).

  - A \"Confirm Allocations\" step to review and approve allocations
    before distribution.

  - A \"Distribute Tokens\" action to execute the bulk transfer of
    tokens from the issuer[']{dir="rtl"}s address to investors,
    supporting:

    - **Standard Distribution**: A definable amount (e.g., 100 tokens of
      one or more types) to all selected investors.

    - **Bespoke Distribution**: Custom amounts per investor as per their
      confirmed subscriptions.

**Suggested Cap Table Structure**

To accommodate multiple token types per investor and ensure usability, a
flexible table structure is ideal. Here[']{dir="rtl"}s a proposed
layout:

  ------------ --------- -------------- --------------- ------------- -------------- ----------------- --------------------------------------------
   **Investor   **Token   **Subscribed   **Confirmed**   **Allocated   **Allocation   **Distributed**               **Wallet Address**
     Name**     Type**      Amount**                      Amount**     Confirmed**                     

   Investor 1   Token A       100             Yes            100           Yes              No          0x1234567890abcdef1234567890abcdef12345678

   Investor 1   Token B        50             Yes            50            Yes              No          0x1234567890abcdef1234567890abcdef12345678

   Investor 2   Token A       200             Yes            200           Yes              No          0x1234567890abcdef1234567890abcdef12345679
  ------------ --------- -------------- --------------- ------------- -------------- ----------------- --------------------------------------------

**Rows**: Each row represents an investor-token type pair, allowing
multiple subscriptions per investor.

**Columns**: Cover all stages from subscription to distribution.

**Additional Features**:

**Editable Fields**: \"Subscribed Amount\" can be edited or added for
new subscriptions.

**Bulk Actions**: Buttons for confirming subscriptions, minting,
confirming allocations, and distributing tokens.

**Summary Section**: Below the table, a summary per token type (e.g.,
\"Token A: 300 to mint, Minted: Yes; Token B: 150 to mint, Minted: No").

**Supporting the Full Process**

- **Generate Cap Table**: Clicking the button populates the table with
  selected investors from the CSV, initially with no subscription data
  unless included in the CSV.

- **Subscription Management**: Add/edit subscriptions manually or upload
  them, then confirm them.

- **Minting Integration**: Summarise tokens to mint, ensure token
  designs are \"ready to mint\" in the \"Token Design\" tab, and mint to
  the issuer[']{dir="rtl"}s address.

- **Distribution**: After minting, set up and confirm allocations, then
  distribute tokens either as a standard amount or bespoke amounts based
  on subscriptions.

**Additional Considerations**

- **Scalability**: If many token types exist, consider filters or tabs
  per token type for clarity.

- **Standard Distribution Option**: Include a separate interface (e.g.,
  a modal) to select investors and define a standard amount for bulk
  distribution, distinct from subscription-based bespoke distribution.

The MVP cap table in the \"Cap Table Management\" tab should feature:

- **Investor Information**: Name or ID of selected investors.

- **Subscription Details**: Token type and subscribed amount per
  investor, with the ability to upload, edit, or create new
  subscriptions.

- **Subscription Status**: Confirmation status (e.g., Confirmed:
  Yes/No).

- **Token Minting Summary**: Total tokens to mint per token type based
  on confirmed subscriptions, with minting status.

- **Allocation and Distribution Details**: Allocated amount, allocation
  confirmation status, and distribution status per investor-token type
  pair.

This structure ensures the cap table supports confirming subscriptions,
summarising tokens for minting, and enabling bulk distribution with
allocation confirmation, as per your requirements.
