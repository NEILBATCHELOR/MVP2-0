Below is a detailed breakdown of each rule type for designing a Rule
Management UI within a digital asset issuance module. The response is
structured to cover **UI Fields for Optimal UX**, **Rule Behaviour**,
**Consensus Approval Settings**, **Error Handling**, and **Validation
Mechanisms** for each specified rule type: *Investor Transaction and
Velocity Limits*, *Lock-Up Periods*, *Whitelist Transfers*,
*Volume/Supply Limits*, *Investor Minimum Balance Requirements*, and
*Investor Max Allocation Restrictions*. The structure is modular and
adaptable to additional rule categories, ensuring it is actionable for
UI/UX teams and backend engineers.

**Rule Type: Investor Transaction Limits**

**UI Fields for Optimal UX**

**Transaction Type Dropdown**:

Options: \"Subscribe\", \"Redeem\", "Both", Transfer

Tooltip: \"Select the type of transaction this limit applies to.\"

Inline Validation: Must select an option.

**Limit Amount Input**:

Type: Numeric text input

Placeholder: \"e.g., 1000\"

Validation: Must be \> 0

Error Message: \"Limit amount must be a positive number.\"

**Unit Dropdown**:

Options: \"Tokens\", \"USD\", \"EUR\"

Tooltip: \"Select the unit for the transaction limit.\"

Inline Validation: Must select a unit.

**Investor Tier Multi-Select** (Optional):

Options: \"Tier 1\", \"Tier 2\", \"Tier 3\"

Tooltip: \"Apply this limit to specific investor tiers (leave blank for
all).\"

**Save Button**:

Dynamic: Disabled until all required fields are valid.

**Rule Behaviour**

**Function**: Caps the amount an investor can transact in a single
Subscribe, Redeem, or both transaction types.

**Event Trigger**: Executes on each transaction attempt.

**Execution Logic**:

Compares transaction amount against the limit.

Blocks transaction if exceeded, notifying the investor (e.g.,
\"Transaction exceeds limit of 1000 USD\").

**Interactions**: May conflict with velocity limits if a single
transaction is allowed but cumulative amounts exceed periodic caps.

**Dynamic Updates**:

Adjusts limits if an investor[']{dir="rtl"}s tier changes via compliance
updates.

Rechecks if external currency conversion rates shift (e.g., USD value
changes).

**Consensus Approval Settings**

- **Workflow**: Requires approval from at least two parties.

- **Permissions**: Restricted to \"Owner\" role.

- **Quorum**: At least 2/3 approvers.

- **Automation**: Auto-approves if limit \< predefined threshold (e.g.,
  1000 USD).

**Error Handling**

**Creation**:

\"Limit amount must be greater than zero.\" -- Enter a valid amount.

\"Duplicate rule exists for this type and tier.\" -- Modify or delete
the existing rule.

**Amendment**:

\"Cannot amend during pending transactions.\" -- Wait until transactions
clear.

**Execution**:

\"Failed to fetch transaction data.\" -- Retry or contact support.

**Removal**:

\"Rule required for compliance.\" -- Consult regulatory team.

**Fallback**: Blocks transactions if rule check fails.

**Validation Mechanisms**

**Real-Time**:

Limit amount \> 0.

Transaction type and unit selected.

**Conditional Constraints**:

No duplicate rules for same type and tier.

**Back-End**:

User has \"Owner\" permission.

Limit aligns with regulatory caps (e.g., \< 1M USD).

**Rule Type: Velocity Limits**

**UI Fields for Optimal UX**

**Limit Amount Input**:

Type: Numeric text input

Validation: Must be \> 0

Error Message: \"Limit amount must be a positive number.\"

**Time Period Dropdown**:

Options: \"Per Day\", \"Per Week\", \"Per Month\"

Tooltip: \"Set the time frame for this limit.\"

**Transaction Type Dropdown**:

Options: \"Subscribe\", \"Redeem\", "Both", Transfer

**Investor Tier Multi-Select** (Optional):

Options: \"Tier 1\", \"Tier 2\", \"Tier 3\"

**Save Button**:

Disabled until all fields are valid.

**Rule Behaviour**

**Function**: Restricts total transaction volume within a time period.

**Event Trigger**: Runs on each transaction attempt.

**Execution Logic**:

Tracks cumulative amounts in the period.

Blocks if adding the transaction exceeds the limit; resets at period
end.

**Interactions**: May override transaction limits if cumulative cap is
stricter.

**Dynamic Updates**:

Adjusts for tier upgrades.

Recalculates if period resets early (e.g., compliance mandate).

**Consensus Approval Settings**

- **Workflow**: Needs compliance and operations approval.

- **Permissions**: \"Compliance Officer\" and \"Operations Manager\".

- **Quorum**: At least 2/3 approvers.

- **Automation**: Auto-approves minor tweaks (\<10% change).

**Error Handling**

**Creation**:

\"Time period required.\" -- Select a period.

**Amendment**:

\"Cannot amend mid-period.\" -- Wait for reset.

**Execution**:

\"Transaction history unavailable.\" -- Retry later.

**Removal**:

\"Mandatory rule.\" -- Cannot remove.

**Fallback**: Blocks transactions on failure.

**Validation Mechanisms**

**Real-Time**:

Amount \> 0, period selected.

**Conditional Constraints**:

No overlapping rules for same type and period.

**Back-End**:

Ensures compliance with periodic caps.

**Rule Type: Lock-Up Periods**

**UI Fields for Optimal UX**

**Start Date Picker**:

Type: Date picker

Validation: Must be future date

Error Message: \"Start date must be in the future.\"

**End Date Picker**:

Type: Date picker

Validation: Must be after start date

Error Message: \"End date must follow start date.\"

**Apply To Toggle**:

Options: \"All Investors\", \"Specific Groups\"

Dynamic: Shows multi-select for groups if \"Specific Groups\" is chosen.

**Save Button**:

Disabled until dates are valid.

**Rule Behaviour**

**Function**: Prohibits token transfers during the period.

**Event Trigger**: Checks on each transfer attempt.

**Execution Logic**:

Blocks transfers if date is within range.

Lifts restriction post-end date.

**Interactions**: May allow whitelist transfers if specified.

**Dynamic Updates**:

Extends if compliance requires longer lock-up.

Updates group applicability via investor actions.

**Consensus Approval Settings**

- **Workflow**: Requires compliance approval.

- **Permissions**: \"Compliance Officer\".

- **Quorum**: Single approval.

- **Automation**: Auto-approves extensions, not reductions.

**Error Handling**

**Creation**:

\"Past dates not allowed.\" -- Select future dates.

**Amendment**:

\"Cannot shorten post-issuance.\" -- Contact compliance.

**Execution**:

\"Date verification failed.\" -- Transfers blocked.

**Removal**:

\"Active lock-up cannot be removed.\" -- Wait until end.

**Fallback**: Blocks transfers on failure.

**Validation Mechanisms**

**Real-Time**:

Start date future, end date \> start.

**Conditional Constraints**:

No overlapping lock-ups for same group.

**Back-End**:

Aligns with issuance terms.

**Rule Type: Whitelist Transfers**

**UI Fields for Optimal UX**

**Whitelist Text Area**:

Type: Text area

Placeholder: \"Enter one address per line\"

Validation: Valid wallet format

Error Message: \"Invalid address format.\"

**Add Address Button**:

Dynamic: Adds single address to list.

**CSV Upload**:

Type: File input

Tooltip: \"Upload a list of addresses.\"

**Restrict Toggle**:

Options: On/Off

**Save Button**:

Disabled until one address is added.

**Rule Behaviour**

**Function**: Limits transfers to whitelisted addresses.

**Event Trigger**: Runs on each transfer.

**Execution Logic**:

Blocks if recipient not on list when restriction is on.

**Interactions**: May bypass lock-up restrictions.

**Dynamic Updates**:

Updates list live (e.g., KYC approvals).

Reflects compliance blacklist changes.

**Consensus Approval Settings**

- **Workflow**: Needs owner approval.

- **Permissions**: "Owner / Super Admin/Compliance Role".

- **Quorum**: At least 2/3 approvers.

- **Automation**: Auto-approves additions, not removals.

**Error Handling**

**Creation**:

\"Duplicate address.\" -- Remove duplicates.

**Amendment**:

\"Pending transfers block changes.\" -- Wait for clearance.

**Execution**:

\"Whitelist check failed.\" -- Transfer blocked.

**Removal**:

\"Mandatory rule.\" -- Cannot remove.

**Fallback**: Blocks transfers on failure.

**Validation Mechanisms**

**Real-Time**:

Validates address format, no duplicates.

**Conditional Constraints**:

List not empty if restricted.

**Back-End**:

Checks against blacklists. (Cube 3 future integration)

**Rule Type: Volume/Supply Limits**

**UI Fields for Optimal UX**

**Limit Type Dropdown**:

Options: \"Total Supply\", \"Volume per Period\"

**Limit Amount Input**:

Type: Numeric text input

Validation: Must be \> 0

**Time Period Dropdown** (If \"Volume per Period\"):

Options: \"Per Day\", \"Per Week\", \"Per Month\"

**Save Button**:

Disabled until valid.

**Rule Behaviour**

**Function**:

Total Supply: Caps total tokens issued.

Volume per Period: Limits transfer volume in period.

**Event Trigger**:

Supply: On issuance.

Volume: On transfers.

**Execution Logic**:

Blocks if limit exceeded.

**Interactions**: Affects transaction/velocity limits.

**Dynamic Updates**:

Adjusts with liquidity changes.

Resets volume on period end.

**Consensus Approval Settings**

- **Workflow**: Issuer and compliance approval.

- **Permissions**: \"Issuer\", \"Compliance Officer\".

- **Quorum**: Both approve.

- **Automation**: Auto-approves minor increases (\<5%).

**Error Handling**

**Creation**:

\"Supply \< current issuance.\" -- Increase limit.

**Amendment**:

\"Cannot decrease below issued.\" -- Adjust accordingly.

**Execution**:

\"Data fetch failed.\" -- Block action.

**Removal**:

\"Mandatory rule.\" -- Cannot remove.

**Fallback**: Blocks on failure.

**Validation Mechanisms**

**Real-Time**:

Amount \> 0, period if applicable.

**Conditional Constraints**:

Supply ≥ current issuance.

**Back-End**:

Regulatory compliance check.

**Rule Type: Investor Minimum Balance Requirements**

**UI Fields for Optimal UX**

**Minimum Balance Input**:

Type: Numeric text input

Validation: Must be \> 0

**Unit Dropdown**:

Options: \"Tokens\", \"USD\"

**Apply To Toggle**:

Options: \"All Investors\", \"Specific Groups\"

Dynamic: Multi-select for groups if \"Specific Groups\".

**Save Button**:

Disabled until valid.

**Rule Behaviour**

**Function**: Ensures minimum balance for actions (e.g., voting).

**Event Trigger**: Before specific actions.

**Execution Logic**:

Blocks if balance \< minimum.

**Interactions**: Must be ≤ max allocation.

**Dynamic Updates**:

Adjusts with balance changes.

Updates via compliance rules.

**Consensus Approval Settings**

- **Workflow**: Compliance and operations approval.

- **Permissions**: "Owner, Compliance Officer\", "Issuer Agent\".

- **Quorum**: At least 2/3 approvers.

- **Automation**: Auto-approves increases.

**Error Handling**

**Creation**:

\"Min \> max allocation.\" -- Adjust values.

**Amendment**:

\"Notification required.\" -- Notify investors.

**Execution**:

\"Balance fetch failed.\" -- Block action.

**Removal**:

\"Mandatory rule.\" -- Cannot remove.

**Fallback**: Blocks on failure.

**Validation Mechanisms**

**Real-Time**:

Amount \> 0, ≤ max allocation.

**Conditional Constraints**:

Not higher than current balances without notice.

**Back-End**:

Asset-specific compliance.

**Rule Type: Investor Max Allocation Restrictions**

**UI Fields for Optimal UX**

**Maximum Allocation Input**:

Type: Numeric text input

Validation: Must be \> 0

**Unit Dropdown**:

Options: \"Tokens\", \"USD\"

**Investor Tier Multi-Select** (Optional):

Options: \"Tier 1\", \"Tier 2\", \"Tier 3\"

**Save Button**:

Disabled until valid.

**Rule Behaviour**

**Function**: Caps total tokens an investor can hold.

**Event Trigger**: On acquisition attempts.

**Execution Logic**:

Limits or blocks if exceeds cap.

**Interactions**: Aligns with transaction/velocity limits.

**Dynamic Updates**:

Adjusts with tier changes.

Rechecks with liquidity shifts.

**Consensus Approval Settings**

- **Workflow**: Issuer and compliance approval.

- **Permissions**: "Issuer Owner, Agent", \"Compliance Officer\".

- **Quorum**: At least 2/3 approvers.

- **Automation**: Auto-approves increases.

**Error Handling**

**Creation**:

\"Max \< min balance.\" -- Adjust values.

**Amendment**:

\"Consent required.\" -- Notify investors.

**Execution**:

\"Holdings fetch failed.\" -- Block acquisition.

**Removal**:

\"Mandatory rule.\" -- Cannot remove.

**Fallback**: Blocks on failure.

**Validation Mechanisms**

**Real-Time**:

Amount \> 0, \> min balance.

**Conditional Constraints**:

Not below current holdings.

**Back-End**:

Regulatory alignment.

**Adaptability for Other Rule Categories**

This template adapts to other rules (e.g., tax compliance, geographic
restrictions) by:

- **UI Fields**: Tailor inputs (e.g., tax rate sliders, country
  drop-downs).

- **Behaviour**: Define specific logic (e.g., tax withholding, region
  checks).

- **Approval**: Adjust roles/quorum (e.g., tax officers).

- **Error/Validation**: Customise messages and constraints (e.g.,
  \"Invalid tax rate\").

This ensures a scalable, consistent UI for any rule type in the digital
asset issuance module.
