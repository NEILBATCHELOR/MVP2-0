Below are detailed instructions for an AI specializing in UI design to
create a subscription management functionality for the Chain Capital
platform, based on the provided documentation. The design focuses on
enabling issuers to efficiently create, upload, edit, and confirm
investor subscriptions within the \"Cap Table Management\" tab, ensuring
usability, scalability, and compliance with the platform[']{dir="rtl"}s
workflow.

**Instructions for UI Design of Subscription Management Functionality**

**Objective**

Design a user-friendly, efficient, and scalable subscription management
interface within the \"Cap Table Management\" tab of the Chain Capital
platform. This functionality should allow issuers to:

> ●      Create new investor subscriptions manually.
>
> ●      Upload or edit existing subscriptions via CSV or in-table
> editing.
>
> ●      Confirm subscriptions individually or in bulk.
>
> ●      Provide clear visibility and feedback on subscription statuses
> and totals.

The design must integrate seamlessly with the platform[']{dir="rtl"}s
broader workflow (investor selection, token minting, allocation, and
distribution) and maintain real-time updates to the capitalization
table.

**1. Context and Layout**

The subscription management functionality resides in the **\"Cap Table
Management\" tab**, which is populated with investors selected from the
\"Investors\" tab via the \"Generate Cap Table\" button. The UI should
assume that:

> ●      Investors have already been selected and added to the cap
> table.
>
> ●      The cap table operates on a per-project basis (e.g., \"Current
> Project\"), with subscriptions tied to specific token types defined in
> the \"Token Design\" tab.

**Header:**

> ●      Display a clear title, e.g., **\"Cap Table for \[Project
> Name\]\"**, where \[Project Name\] is dynamically populated based on
> the current project context.

**Overall Layout:**

> ●      **Top Section:** Action buttons for managing subscriptions.
>
> ●      **Main Section:** An interactive table displaying subscription
> data.
>
> ●      **Bottom Section:** A summary of token totals based on
> confirmed subscriptions.

**2. Core UI Components**

**Action Buttons (Top Section)**

Place these buttons above the table for easy access:

> ●      **\"Add Subscription\"**: Opens a modal or form to manually
> create a new subscription.
>
> ●      **\"Upload Subscriptions\"**: Allows uploading a CSV file to
> add or update multiple subscriptions.
>
> ●      **\"Download Subscription Template\"**: Provides a sample CSV
> file with columns (e.g., Investor Name, Token Type, Subscribed Amount)
> to ensure correct formatting.
>
> ●      **\"Confirm Selected Subscriptions\"**: Confirms all
> subscriptions selected via checkboxes in the table.
>
> ●      **\"Delete Selected Subscriptions\"**: Removes selected
> subscriptions, with a confirmation prompt (e.g., \"Delete 3 selected
> subscriptions?\").
>
> ●      **\"Download Cap Table\"**: Exports the current cap table data
> as a CSV for record-keeping.

**Styling:**

> ●      Use a consistent button style (e.g., primary blue for actions
> like \"Add\" and \"Confirm,\" red outline for \"Delete\").
>
> ●      Disable buttons (e.g., \"Confirm Selected\") when no rows are
> selected, with tooltips explaining why (e.g., \"Select at least one
> subscription to confirm\").

**Interactive Table (Main Section)**

Design a flexible, interactive table to display and manage
subscriptions, with each row representing a unique **investor-token type
pair**. Initially, the table may be empty (e.g., showing \"No
subscriptions added yet\") until subscriptions are created or uploaded.

**Columns:**

  ------------ --------------------- --------------- --------------------------
   **Column**     **Description**     **Editable?**          **Notes**

    Checkbox   Allows selection for        No        Include \"Select All\" and
                bulk actions (e.g.,                   \"Deselect All\" options
                 confirm, delete).                      in the table header.

    Investor       Displays the            No         Populated from selected
      Name        investor's name                    investors; searchable and
               (e.g., \"John Doe\").                        filterable.

   Token Type   Specifies the token        No        Filterable; populated from
                    type (e.g.,                        available token types.
               \"ERC-1400\", \"Token                 
                 A\") from \"Token                   
                     Design\".                       

   Subscribed   Shows the number of        Yes       Editable field (numerical
     Amount      tokens subscribed                   input); updates real-time
                 (e.g., \"100\").                      with validation (e.g.,
                                                         positive numbers).

   Confirmed         Indicates             No        Display as a toggle switch
                confirmation status                   or checkbox; updates via
               (\"Yes\" or \"No\").                   \"Confirm Selected\" or
                                                         row-level action.

     Wallet    Shows the investor's        No        Truncated for readability
    Address     ETH wallet address                             (e.g.,
                      (e.g.,                         \"0x1234\...5678\"); hover
                 \"0x1234\...\").                       to see full address.
  ------------ --------------------- --------------- --------------------------

**Features:**

> ●      **Editable Fields:** Allow inline editing of \"Subscribed
> Amount\" with a save mechanism (e.g., press Enter to save, or a \"Save
> Changes\" button above the table).
>
> ●      **Sorting and Filtering:** Enable sorting (e.g., by Investor
> Name, Subscribed Amount) and filtering (e.g., by Token Type, Confirmed
> status) via column headers.
>
> ●      **Search Bar:** Include a search bar above the table to find
> subscriptions by Investor Name or Token Type.
>
> ●      **Row Actions:** Add an \"Edit\" icon (e.g., pencil) and
> \"Delete\" icon (e.g., trash) per row for quick modifications or
> removal, opening a modal for editing if preferred.
>
> ●      **Scalability:** Implement pagination (e.g., 50 rows per page)
> or infinite scrolling for large datasets, with a loading indicator.

**Visual Indicators:**

> ●      Use colors or icons in the \"Confirmed\" column (e.g., green
> check for \"Yes\", gray dash for \"No\") for at-a-glance status.
>
> ●      Highlight editable fields (e.g., \"Subscribed Amount\") with a
> light background or border when focused.

**Summary Section (Bottom Section)**

Display a dynamic summary below the table, grouped by token type, to
show totals based on confirmed subscriptions:

> ●      Example:
>
> ○      \"Token A: Total Subscribed: 300, Confirmed: 200\"
>
> ○      \"Token B: Total Subscribed: 150, Confirmed: 150\"
>
> ●      Update in real-time as subscriptions are added, edited, or
> confirmed.
>
> ●      Style as a compact card or list with bold totals for clarity.

**3. subscription Creation and Editing**

**Add Subscription Modal**

When clicking **\"Add Subscription\"**, open a modal with the following
fields:

> ●      **Select Investor:** Dropdown listing investors already in the
> cap table (e.g., \"John Doe\", \"Jane Smith\").
>
> ●      **Select Token Type:** Dropdown of available token types from
> the \"Token Design\" tab (e.g., \"ERC-1400\", \"Token A\").
>
> ●      **Subscribed Amount:** Numerical input with validation (e.g.,
> positive integers only).
>
> ●      **Buttons:** \"Save\" (adds the subscription as a new row) and
> \"Cancel\".

**Behavior:**

> ●      Prevent duplicate investor-token type pairs (e.g., alert:
> \"Subscription for John Doe - Token A already exists\").
>
> ●      Upon saving, add a new row to the table with \"Confirmed\" set
> to \"No\".

**Edit Subscription**

> ●      **Inline Editing:** Allow direct editing of \"Subscribed
> Amount\" in the table, with changes saved via Enter or a \"Save
> Changes\" button.
>
> ●      **Modal Editing:** Alternatively, clicking an \"Edit\" icon
> opens a modal pre-filled with the row[']{dir="rtl"}s data, allowing
> changes to \"Subscribed Amount\" (and potentially Token Type if
> reassignment is allowed).

**4. Bulk Subscription Upload**

When clicking **\"Upload Subscriptions\"**:

> ●      Prompt the user to select a CSV file.
>
> ●      Process the CSV, expecting columns like:
>
> ○      Investor Name
>
> ○      Token Type
>
> ○      Subscribed Amount
>
> ●      **Validation:**
>
> ○      Ensure Investor Name matches an existing investor in the cap
> table.
>
> ○      Verify Token Type exists in \"Token Design\".
>
> ○      Check Subscribed Amount is a valid positive number.
>
> ●      **Feedback:** Display a modal or toast notification:
>
> ○      Success: \"10 subscriptions uploaded successfully.\"
>
> ○      Errors: \"Errors in 2 rows: Invalid Token Type in row 3,
> Unknown investor in row 5.\"
>
> ●      Add valid subscriptions as new rows or update existing ones (if
> the investor-token type pair already exists).

**Template Download:**

> ●      The \"Download Subscription Template\" button provides a CSV
> with headers: Investor Name, Token Type, Subscribed Amount, and sample
> data (e.g., \"John Doe, Token A, 100\").

**5. Subscription Confirmation**

> ●      **Bulk Confirmation:** Select rows via checkboxes and click
> \"Confirm Selected Subscriptions\" to set \"Confirmed\" to \"Yes\" for
> all selected rows.
>
> ●      **Individual Confirmation:** Include a toggle switch or
> \"Confirm\" button per row for single confirmations.
>
> ●      **Prompt:** For bulk actions, show a confirmation dialog (e.g.,
> \"Confirm 5 subscriptions? This will update the token minting
> summary.\").
>
> ●      **Post-Confirmation:** Update the \"Confirmed\" column and
> recalculate the summary section instantly.

**6. Usability Enhancements**

> ●      **Real-Time Updates:** Ensure the table and summary reflect
> changes (additions, edits, confirmations) immediately.
>
> ●      **Undo Option:** Offer an \"Undo\" button or toast notification
> (e.g., \"Subscription deleted. Undo?\") for critical actions like
> deletions, expiring after a few seconds.
>
> ●      **Tooltips:** Add hover tooltips on buttons (e.g., \"Upload a
> CSV to add multiple subscriptions\") and columns (e.g., \"Amount of
> tokens subscribed by this investor\").
>
> ●      **Responsive Design:** Ensure the table collapses gracefully on
> smaller screens, with horizontal scrolling or a stacked layout for
> columns.

**7. Integration Points**

> ●      **Token Design Tab:** Subscription management relies on token
> types defined here. Disable the \"Add Subscription\" button if no
> tokens are available, with a message (e.g., \"Define token types in
> Token Design first\").
>
> ●      **Minting Process:** After confirming subscriptions, the
> summary feeds into the \"Mint Tokens\" action, linking to the \"Token
> Design\" tab to switch tokens to \"ready to mint\".
>
> ●      **Allocation and Distribution:** Confirmed subscriptions set
> the bespoke amounts for allocation, though a standard distribution
> option may override this later (handled separately).

** **

** **

** **

**8. Example Mockup**

**\"Cap Table Management\" Tab:**

 

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| Cap Table for Current Project                 \|

\| \[Add Subscription\] \[Upload Subscriptions\]     \|

\| \[Download Subscription Template\] \[Download Cap Table\] \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| Search: \[\_\_\_\_\_\_\_\_\_\]                           \|

\| Filter: \[Token Type ▼\] \[Confirmed ▼\]         \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| \[ \] \| Name       \| Token \| Subscribed \| Confirmed \|
Wallet         \|

\| \[ \] \| John Doe   \| Token A \| 100      \| No        \|
0x1234\...5678  \|

\| \[ \] \| John Doe   \| Token B \| 50       \| Yes       \|
0x1234\...5678  \|

\| \[ \] \| Jane Smith \| Token A \| 200      \| No        \|
0x5678\...1234  \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| \[Confirm Selected\] \[Delete Selected\]          \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| Token A: Total Subscribed: 300, Confirmed: 0  \|

\| Token B: Total Subscribed: 50, Confirmed: 50  \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

**Add Subscription Modal:**

 

Add New Subscription

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

Investor: \[John Doe ▼\]

Token Type: \[Token A ▼\]

Subscribed Amount: \[\_\_\_\_\]

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\[Cancel\] \[Save\]

**9. Additional Considerations**

> ●      **Compliance:** Ensure wallet addresses are displayed for
> verification, as they tie into distribution compliance (e.g., KYC/AML,
> whitelisting), though this is enforced later.
>
> ●      **Audit Trail:** While not UI-specific, log changes (e.g.,
> subscription edits, confirmations) in the backend for traceability.
>
> ●      **Error Handling:** Provide clear feedback for invalid actions
> (e.g., \"Cannot confirm: Token A is not ready to mint\").

**Final Notes**

This UI design balances efficiency (bulk uploads, inline editing) with
precision (manual additions, confirmations), supporting both small and
large-scale operations. Test the interface with sample data (e.g., 10
investors, multiple token types) to ensure scalability and
intuitiveness, refining based on issuer feedback.

 
