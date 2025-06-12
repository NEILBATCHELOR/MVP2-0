**Token Allocation**

**Objective**

Design a user-friendly, efficient, and scalable token allocation
management interface within the \"Cap Table Management\" tab of the
Chain Capital platform. This functionality should allow issuers to:

Create, upload, edit, and confirm investor subscriptions manually or in
bulk to the token_allocations table before specifying allocations

Allocate tokens to investors with a subscription record, linking
subscription records and token allocations to a specific project
identified by a unique Project ID.

SQL used:

DROP TABLE IF EXISTS public.token_allocations CASCADE;

CREATE TABLE public.token_allocations (

id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(), \-- Unique
identifier for each allocation

investor_id UUID NOT NULL, \-- Links to investor by ID

subscription_id UUID NOT NULL, \-- A subscription can have multiple
allocations

project_id UUID NULL, \-- Optional project association

token_type TEXT NOT NULL,

token_amount NUMERIC NOT NULL CHECK (token_amount \> 0),

distributed BOOLEAN NOT NULL DEFAULT FALSE,

distribution_date TIMESTAMP WITH TIME ZONE NULL,

distribution_tx_hash TEXT NULL,

notes TEXT NULL,

allocation_date TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),

created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),

\-- Primary Key

CONSTRAINT token_allocations_pkey PRIMARY KEY (id),

\-- Foreign Keys

CONSTRAINT token_allocations_investor_fkey

FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON
DELETE CASCADE,

CONSTRAINT token_allocations_subscription_fkey

FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON
DELETE CASCADE,

CONSTRAINT token_allocations_project_fkey

FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET
NULL,

\-- Token Type Validation

CONSTRAINT token_allocations_token_type_check CHECK (

token_type = ANY (

ARRAY\[

\'ERC-20\'::TEXT,

\'ERC-721\'::TEXT,

\'ERC-1155\'::TEXT,

\'ERC-1400\'::TEXT,

\'ERC-3525\'::TEXT,

\'ERC-4626\'::TEXT

\]

)

)

) TABLESPACE pg_default;

Provide clear visibility and feedback on subscription statuses, token
allocations, and totals, ensuring readiness for smart contract
deployment. The design must integrate seamlessly with the
platform[']{dir="rtl"}s broader workflow (investor selection, token
design, allocation, minting, and distribution) and maintain real-time
updates to the capitalisation table and token allocation records.

**1. Context and Layout**

The token allocation functionality resides in the \"Cap Table
Management\" module, which is populated with investors selected from the
\"Investors\" tab via the \"Generate Cap Table\" button. The UI should
assume that:

Each project has a unique Project ID, dynamically linking subscription
records and token allocation records.

Create, upload, edit, and confirm investor subscriptions manually or in
bulk to the token_allocations table before specifying allocations

Allocations are tied to specific token types defined in the \"Token
Design\" tab for the project. However I list them here: ERC-20, ERC-721,
ERC-1155, ERC-1400, ERC-3525, ERC-4626.

A single subscription id, amount and currency can have more than one
token allocation type and amount

Token allocations occur pre-issuance, preparing subscriber amounts for
minting, deployment and distribution.

**Header:**

Display a clear title, e.g., \"Cap Table for \[Project Name\] (Project
ID: \[Unique ID\])\", where \[Project Name\] and \[Unique ID\] are
dynamically populated based on the current project context (e.g., \"Cap
Table for Project Alpha (Project ID: PRJ-001)\").

**Overall Layout:**

- **Top Section:** Action buttons for managing subscriptions and
  allocations.

- **Main Section:** An interactive table displaying subscription and
  allocation data.

- **Bottom Section:** A summary of token subscriptions and allocations
  based on confirmed records.

**2. Core UI Components**

**Action Buttons (Top Section)**

Place these buttons above the table for easy access:

- **\"Add Subscription\":** Opens a modal or form to manually create a
  new subscription tied to the project.

- **\"Upload Subscriptions\":** Allows uploading a CSV file to add or
  update multiple subscriptions for the project.

- **\"Download Subscription Template\":** Provides a sample CSV file
  with columns (e.g., Project ID, Investor Name, Token Type, Subscribed
  Amount) to ensure correct formatting.

- **\"Allocate Tokens\":** Opens a modal or inline tool to assign token
  amounts to confirmed subscriptions pre-issuance, linked to the Project
  ID.

- **\"Confirm Selected Subscriptions\":** Confirms all subscriptions
  selected via checkboxes in the table.

- **\"Delete Selected Subscriptions\":** Removes selected subscriptions,
  with a confirmation prompt (e.g., \"Delete 3 selected
  subscriptions?\").

- **\"Download Cap Table\":** Exports the current cap table data,
  including subscriptions and allocations, as a CSV for record-keeping,
  tagged with the Project ID.

**Styling:**

Use a consistent button style (e.g., primary blue for \"Add,\"
\"Allocate,\" and \"Confirm,\" red outline for \"Delete\").

Disable buttons (e.g., \"Allocate Tokens\") when no confirmed
subscriptions exist, with tooltips (e.g., \"Confirm subscriptions before
allocating tokens\").

**Interactive Table (Main Section)**

Design a flexible, interactive table to display and manage subscriptions
and pre-issuance token allocations, with each row representing a unique
investor-token type pair tied to the Project ID. Initially, the table
may be empty (e.g., \"No subscriptions added yet for Project ID:
\[Unique ID\]\").

**Columns:**

  ------------ ----------------------- --------------- --------------------------------
   **Column**      **Description**      **Editable?**             **Notes**

    Checkbox    Allows selection for         No           Include \"Select All\" and
                    bulk actions.                      \"Deselect All\" options in the
                                                                   header.

    Investor   Displays the investor's       No            Populated from selected
      Name       name (e.g., \"John                       investors; searchable and
                       Doe\").                                   filterable.

   Token Type    Specifies the token         No        Filterable; tied to the project
                  type from \"Token                      (e.g., \"ERC-1400\", \"Token
                      Design\".                                     A\").

   Subscribed     Number of tokens           Yes           Editable field; updates
     Amount       subscribed (e.g.,                       real-time with validation
                      \"100\").                              (positive numbers).

   Confirmed   Indicates confirmation        No           Toggle switch or checkbox;
                       status                           updates via bulk or row-level
                  (\"Yes\"/\"No\").                                action.

   Allocated      Tokens allocated           Yes         Editable post-confirmation;
     Amount      pre-issuance (e.g.,                    defaults to 0 until allocated.
                      \"90\").                         

     Wallet     Investor's ETH wallet        No          Truncated; hover to see full
    Address        address (e.g.,                                  address.
                   \"0x1234\...\")                     
  ------------ ----------------------- --------------- --------------------------------

**Features:**

- **Editable Fields:** Allow inline editing of \"Subscribed Amount\" and
  \"Allocated Amount\" (post-confirmation) with a save mechanism (e.g.,
  Enter or \"Save Changes\" button).

- **Sorting and Filtering:** Enable sorting (e.g., by Subscribed Amount,
  Allocated Amount) and filtering (e.g., by Token Type, Confirmed
  status).

- **Search Bar:** Include a search bar to find subscriptions by Investor
  Name, Token Type, or Project ID.

- **Row Actions:** Add \"Edit\" (pencil) and \"Delete\" (trash) icons
  per row; \"Allocate\" icon appears post-confirmation.

- **Scalability:** Use pagination or infinite scrolling for large
  datasets, with a loading indicator.

**Visual Indicators:**

\"Confirmed\": Green check (\"Yes\"), gray dash (\"No\").

\"Allocated Amount\": Highlight in yellow if less than Subscribed
Amount; green if equal.

**Summary Section (Bottom Section)**

Display a dynamic summary below the table, grouped by token type,
showing totals for subscriptions and allocations:

- Example:

  - \"Token A (Project ID: PRJ-001): Total Subscribed: 300, Confirmed:
    200, Allocated: 180\"

  - \"Token B (Project ID: PRJ-001): Total Subscribed: 150, Confirmed:
    150, Allocated: 150\"

- Update in real-time as subscriptions are confirmed or tokens
  allocated.

- Style as a compact card with bold totals.

**3. Subscription Creation, Editing, and Allocation**

**Add Subscription Modal**

- **Fields:**

  - **Project ID:** Pre-filled, read-only (e.g., \"PRJ-001\").

  - **Select Investor:** Dropdown of investors in the cap table.

  - **Select Token Type:** Dropdown of token types from \"Token Design\"
    for the project.

  - **Subscribed Amount:** Numerical input with validation.

- **Buttons:** \"Save\" (adds row with \"Confirmed\" = \"No\",
  \"Allocated Amount\" = 0) and \"Cancel\".

- **Behavior:** Prevent duplicate investor-token type pairs per Project
  ID.

**Edit Subscription**

- **Inline Editing:** Edit \"Subscribed Amount\" directly; \"Allocated
  Amount\" editable only if \"Confirmed\" = \"Yes\".

- **Modal Editing:** \"Edit\" icon opens a modal with pre-filled data,
  restricting \"Allocated Amount\" edits pre-confirmation.

**Allocate Tokens Modal**

- Triggered by \"Allocate Tokens\" button or row-level \"Allocate\"
  icon.

- **Fields:**

  - **Project ID:** Pre-filled, read-only.

  - **Investor Name:** Pre-filled from selected row(s).

  - **Token Type:** Pre-filled.

  - **Subscribed Amount:** Read-only, showing confirmed amount.

  - **Allocated Amount:** Numerical input (default = Subscribed Amount;
    max = Subscribed Amount).

- **Buttons:** \"Save Allocation\" and \"Cancel\".

- **Validation:** Ensure Allocated Amount ≤ Subscribed Amount; alert if
  exceeded.

**4. Bulk Allocation Upload**

- **Upload Subscriptions:**

  - CSV columns:

  - Project Name (match to corresponding project_id)

  - Investor Name (match to corresponding Investor_id)

  - Token Type,

  - Token Amount,

  - Status

  - Validation: Match Project ID, Subscription ID Investor ID, to
    existing records.

  - Feedback: \"10 allocations uploaded for Project ID: PRJ-001.\"

- **Bulk Allocation:**

  - Select confirmed rows, click \"Allocate Tokens,\" and set a uniform
    allocation (e.g., \"Allocate 100% of Subscribed Amount\") or custom
    amounts via modal.

**5. Subscription Confirmation and Allocation Workflow**

- **Bulk Confirmation:** Select rows, click \"Confirm Selected
  Subscriptions,\" setting \"Confirmed\" = \"Yes.\"

- **Individual Confirmation:** Toggle per row.

- **Post-Confirmation:** Enable \"Allocated Amount\" editing/allocation;
  prompt: \"Confirm 5 subscriptions? Allocation can now be set.\"

- **Pre-Issuance Allocation:** After allocation, records are ready for
  minting, linked to the Project ID for smart contract generation.

**6. Usability Enhancements**

- **Real-Time Updates:** Reflect changes in subscriptions,
  confirmations, and allocations instantly.

- **Undo Option:** For deletions or allocation changes (e.g.,
  \"Allocation updated. Undo?\").

- **Tooltips:** \"Allocate Tokens: Assign tokens pre-issuance for
  confirmed subscriptions.\"

- **Responsive Design:** Ensure table usability on smaller screens.

**7. Integration Points**

- **Token Design Tab:** Token types and Project ID link
  subscriptions/allocations to smart contracts.

- **Minting Process:** Confirmed and allocated amounts feed into \"Mint
  Tokens,\" tagged with Project ID.

- **Compliance:** Wallet addresses and allocations tie into distribution
  rules (e.g., whitelisting).

**8. Example Mockup**

text

\"Cap Table Management\" Tab:

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| Cap Table for Project Alpha (Project ID: PRJ-001) \|

\| \[Add Subscription\] \[Upload Subscriptions\] \|

\| \[Allocate Tokens\] \[Download Cap Table\] \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| Search: \[\_\_\_\_\_\_\_\_\_\] \|

\| Filter: \[Token Type ▼\] \[Confirmed ▼\] \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| \[ \] \| Name \| Token \| Subscribed \| Confirmed \| Allocated \|
Wallet \|

\| \[ \] \| John Doe \| Token A \| 100 \| Yes \| 90 \| 0x1234\...5678 \|

\| \[ \] \| Jane Smith \| Token A \| 200 \| No \| 0 \| 0x5678\...1234 \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| \[Confirm Selected\] \[Delete Selected\] \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

\| Token A: Total Subscribed: 300, Confirmed: 100, Allocated: 90 \|

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

**9. Additional Considerations**

- **Compliance:** Allocations pre-issuance must respect Token Design
  rules (e.g., Total Supply).

- **Audit Trail:** Log subscription and allocation changes with Project
  ID for traceability.
