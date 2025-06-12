**Investor Management Specification Summary**

Below is a concise summary of the **Investor Management Specification**
for the Chain Capital platform, focusing on the key functions outlined
in the document, \"Goal Investor Preparation to Issue Tokens.\" This
summary distills the core functionalities of the investor management
process, particularly for preparing investors to participate in token
issuance via CSV uploads and cap table generation.

**Purpose**: Facilitate the preparation of investors for token issuance
on the Chain Capital platform by enabling issuers to upload, manage, and
qualify investor data, ultimately generating a cap table for token
allocation.

**Key Functions**:

**Bulk Investor Upload**:

Allows issuers to upload a CSV file containing investor details (Name,
Email, Type, Status \[KYC-AML-Risk\], Wallet Address \[ETH address\]) to
create an investor table.

Provides a ["]{dir="rtl"}Download CSV Template" button for users to
obtain a sample file, ensuring correct formatting.

Validates data during import (e.g., email format, ETH address validity)
and offers feedback on errors (e.g., ["]{dir="rtl"}Invalid wallet
address in row 3").

**Investor Table Management**:

Displays an interactive table with columns: Checkbox, Name, Email, Type
(e.g., Individual, Institutional), Status (e.g., Verified, Pending,
Unverified), and Wallet Address.

Supports sorting, filtering, and searching across all columns (e.g.,
sort by Name, filter by Status, search for ["]{dir="rtl"}John").

Includes checkboxes for each row, ["]{dir="rtl"}Select All," and
["]{dir="rtl"}Deselect All" buttons to manage investor selection in the
current filtered view.

**KYC/AML Status Monitoring**:

Tracks investor compliance status, indicating if KYC/AML checks are
up-to-date (within 6 months), pending, or failed.

Shows a ["]{dir="rtl"}Screen Investor" button for investors with
outdated (over 6 months) or failed checks, triggering a third-party
integration to verify or fail the investor.

Displays visual cues (e.g., green checkmark for verified, red
exclamation for outdated/failed) for quick status assessment.

**Cap Table Generation**:

Enables issuers to select investors via checkboxes and click
["]{dir="rtl"}Generate" to create a capitalisation (cap) table based on
selected investors.

Includes a confirmation prompt (e.g., ["]{dir="rtl"}Generate cap table
for 100 selected investors?") to prevent accidental actions.

Populates the cap table with investor data for subsequent token
allocation (e.g., subscriptions, minting).

**Usability Enhancements**:

Offers pagination or infinite scrolling for large investor lists (e.g.,
100 investors per page) to improve performance.

Provides export functionality to download the current investor list
(filtered or unfiltered) as CSV or PDF for record-keeping or reporting.

Ensures accessibility with sortable/filterable columns, search bar, and
clear visual indicators.

**Additional Considerations**:

Recommends adding optional fields like Country/Jurisdiction, Unique
Identifier (Investor ID), Date Fields (e.g., KYC completion), and
Accreditation Status for enhanced compliance and tracking.

Clarifies that ["]{dir="rtl"}Select All" applies only to the current
filtered view, not all investors system-wide, and ["]{dir="rtl"}Screen
Investor" appears only for outdated/failed, not pending, statuses.

This summary encapsulates the investor management functions for
preparing investors for token issuance, ensuring scalability,
compliance, and user-friendliness within the Chain Capital platform.
