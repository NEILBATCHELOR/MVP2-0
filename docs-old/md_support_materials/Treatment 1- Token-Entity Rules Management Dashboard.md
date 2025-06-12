**UI Design Brief: Token Management Rules Dashboard**

**Objective**

To design a **Token Management Dashboard** that enables users to
configure and manage token settings, ownership, and advanced rules such
as eligibility, jurisdiction, supply, and transfer policies. The UI
should be intuitive, secure, and user-friendly for financial
professionals managing tokenised assets.

**Target Audience**

Token issuers, operational focussed entities operating on behalf of
issuers, placement agents and administrators

Compliance officers managing token rules

Potentially digital asset custodians and other institutional service
providers

**Screen Layout Description**

**Overall Layout Structure**

The UI follows a structured, clean, and modern design with distinct
sections. The layout consists of:

**Vertical Icon-Only Navigation Bar (Leftmost Nav Bar Section)**

Positioned on the far-left side of the screen.

Displays a series of minimalistic icons representing key sections (e.g.,
Dashboard, Token, Investors, Markets).

Expands on hover or click to reveal labels and submenu items.

Uses a **dark navy blue highlight** to indicate the active section.

A collapsible/expandable feature to maintain a compact interface.

**Main Navigation Panel (Left Sidebar) - Expandable from Leftmost Nav
Bar**

Situated immediately to the right of the vertical icon bar.

Contains **text-based navigation options** for the selected category.

Hierarchical structure with expandable sections:

**Token** (Expandable with sub-options: Actions, Agents, Transactions,
Requests, Documents, Settings).

**Investors** (Expandable with subcategories) - (includes onboarding)

**Primary Market** (Expandable with subcategories) - (includes issuance
and servicing)

**Secondary Market**

Active menu items are visually emphasized in **bold text and a purple
background**.

**Primary Content Area (Central Panel)**

Dominates the majority of the screen space.

Displays the selected settings and token management options.

Organized into sections such as **Token Info, Token Ownership, and
Advanced Settings: Identity, Jurisdictions, Supply rules, Transfer rules
and Custom rules**.

Uses **cards and list elements** to neatly present different settings.

Each setting has a **toggle switch** or action button for easy
management.

**Details Panel (Right Section)**

Provides additional information and interactive elements.

In the current view, it shows **Token Ownership settings**, displaying
the **current owner wallet address** and a **\"Transfer Ownership\"
button**.

Inline descriptions clarify the purpose of each section.

**Core Features & Screens**

**1. Dashboard Navigation**

- Left nav sidebar menu with primary sections:

  - **Dashboard**

  - **Token Management** (Expandable with subcategories)

  - **Investors** (Expandable with subcategories) - (includes
    onboarding)

  - **Primary Market** (Expandable with subcategories) - (includes
    issuance and servicing)

  - **Secondary Market**

- Active section highlighted in **Dark Navy Blue**

**2. Token Settings Page**

- **Token Info:** Configure name, symbol, token type, description label,
  meta data, decimals, network, base currency, financial instrument type
  and logo

- **Token Types:** ERC-20, 721, 1155, 1400, 3525

- **Instrument Types:** Structured Product, Debt, Equity, Commodities,
  Funds, ETFs, ETPs, Bonds, Quantitative Investment Strategies, Private
  Equity, Private Debt, Real Estate, Energy, Infrastructure,
  Collectibles & all other assets

- **Token Ownership:** View and transfer token smart contract ownership
  (wallet address displayed with copy functionality)

- **Advanced Settings:**

  - **Identity Eligibility:** Toggle ON/OFF for investor compliance

  - **Jurisdictions:** Restrict token transfers to approved regions

  - **Supply Rules:** Set total supply limits and balance per investor

  - **Transfer Rules:** Configure limits per time interval and transfer
    approvals

  - **Custom Rules:** Additional regulatory or compliance constraints

**Expanded Features & Functionality**

**Dashboard Overview Panel**

- Displays **token metadata** (e.g., token address, status, valuation).

- **Key statistics such as:**

  - Circulating supply

  - Total unblocked tokens

  - Total blocked tokens

**Investor Analytics**

- **Investors by type**

- **Investors by country of residence** (displayed as progress bars and
  pie charts)

**Advanced Token Settings (Expanded Features)**

- **Identity Eligibility:** Investors must have specific **on-chain
  identity claims** (ONCHAINID) to receive tokens.

- **Jurisdictions:** Selection of allowed and restricted countries for
  token circulation.

**Supply Rules:**

- **Total supply limit** (max issuance constraint).

- **Investor balance limit** (maximum tokens an individual investor can
  hold).

**Transfer Rules:**

- **Time-based transfer limits** (daily, weekly, custom periods).

- **Conditional transfers** (approval-based token movements).

- **Transfer whitelisting** (limiting transactions to approved
  investors).

- **Transfer fees** (percentage-based deductions per transfer).

**Custom Rules:**

Allows users to add compliance-specific **smart contract modules**.

**Additional UI Considerations:**

- **Modular UI Components:**

  - Clearly separated sections for different rule configurations.

  - Each rule type has an interactive toggle to activate or deactivate
    it.

- **Action Confirmation UI:**

  - Confirmation dialogs before executing critical changes (ownership
    transfer, rule modifications).

- **Charts & Visual Aids:**

  - **Progress bars and pie charts** for investor distributions.

  - **Color-coded compliance indicators** (e.g., red for blocked tokens,
    green for active eligibility).

**User Experience & Interactions**

- **Toggle Switches:** Enable/disable settings with clear visual
  feedback

- **Button Controls:**

  - \"Transfer Ownership\" for wallet transfer

  - Clear indication of current wallet owner

**Design & Aesthetic Considerations**

- **Modern, Clean UI:** White and light gray background for clarity

- **Accent Color:** Purple used for highlighting active states and
  categories

- **Minimalist Icons:** Intuitive icons for each setting

- **Typography:** Sans-serif, high readability

**Security & Compliance Considerations**

- **Sensitive Information Protection:** Hide part of the wallet address
  for privacy

- **Action Confirmation:** Require authentication or confirmation for
  ownership transfer

- **Access Permissions:** Restrict editing to authorised users

**Visual Flow & User Interaction**

Users first interact with the icon-based navigation bar to select a
category.

The sidebar panel expands dynamically, revealing detailed menu options
for the selected category.

Once inside a section, users navigate through tabs and collapsible
settings to configure token properties.

Quick actions (buttons, toggles) allow for seamless interaction.

This layout ensures **efficiency, clarity, and accessibility**,
particularly for professionals managing digital assets.
