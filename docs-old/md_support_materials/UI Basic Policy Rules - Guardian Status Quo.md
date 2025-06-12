**Overall Structure**

**Title**: \"New policy\" -- This indicates the user is in the process
of defining a new policy.

**Steps**: The left sidebar lists the stages of policy creation, with
\"Add details\" already completed (indicated by a green checkmark), and
the current step is \"Build rules.\" The next step, \"Set up approval,\"
is not yet selected.

**Policy Artefacts**: On the right side, there[']{dir="rtl"}s a section
labeled \"Policy Artefacts,\" listing available artefacts that can be
used to build rules, Velocity Limit, Tx Amount, and Tx Destination.

**Policy Rules Section (Left Side)**

This section allows the user to define specific conditions or rules for
the policy under \"Group #1: Combine two or more artefacts.\" The rules
are structured with logical operators (\"AND\" or \"OR\") to combine
different conditions.

**1. Tx Amount (Outgoing transaction limit)**

- **Description**: This rule sets a limit on the amount of an outgoing
  transaction.

- **Fields**:

  - **Condition**: A dropdown with \"Greater than\" selected (other
    options might include \"Less than,\" \"Equal to,\" etc.).

  - **Value**: A numeric field currently set to \"0.00\" (likely in USD,
    as indicated by the \"USD\" dropdown next to it).

  - **Currency**: A dropdown set to \"USD\" (other currencies might be
    available).

- **Purpose**: This rule would flag or restrict outgoing transactions
  exceeding the specified amount (e.g., greater than \$0.00).

- 

**2. Logical Operator**

**Field**: \"AND OR\" -- A dropdown allowing the user to choose whether
the next rule should be combined with the previous one using \"AND\" or
\"OR\" logic.

**Current Selection**: Not explicitly shown, but it[']{dir="rtl"}s a
placeholder for combining rules logically.

**3. Velocity Limit (Amount of funds sent in a time period)**

- **Description**: This rule monitors the total amount of funds sent
  over a specific time period.

- **Fields**:

  - **Value**: A numeric field set to \"0.00\" (likely in USD, as
    indicated by the \"USD\" dropdown).

  - **Currency**: A dropdown set to \"USD\" (other currencies might be
    available).

  - **Time Period**: A numeric field set to \"0.00\" and a dropdown for
    the time unit (e.g., minutes, hours, days), currently set to
    \"minutes.\"

- **Purpose**: This rule would flag or restrict transactions based on
  the total volume of funds sent within the specified time frame (e.g.,
  more than \$0.00 in 0 minutes).

**4. Logical Operator**

**Field**: Another \"AND OR\" dropdown, allowing the user to combine
this rule with the next one logically.

**5. Tx Destination (Recipient address restriction)**

- **Description**: This rule restricts transactions based on the
  recipient[']{dir="rtl"}s address, specifically using a blocklist.

- **Fields**:

  - **Condition**: A dropdown set to \"Blocklist\" (other options might
    include \"Allowlist\" or other restriction types).

  - **Address Input**: A field labeled \"0xAddress\" where users can
    input Ethereum addresses (or similar blockchain addresses) to block.

  - **Add Button**: A \"+\" button to add more addresses to the
    blocklist.

- **Blocked Addresses List**:

  - **Title**: \"BLOCKED ADDRESSES (3/500)\" -- Indicates there are 3
    addresses currently blocked, with a maximum capacity of 500.

  - **List**:

    - 0xB9dE6Daf942678254A47F02468068b28Ad4B87

    - 0xA9087FbC43856981Ae253948a70d85b3d7B

    - 0xfdB192C4F297F2383Cc3Bc5d412cd9283327Af

  - **Action**: Each address has a \"Remove\" button to delete it from
    the blocklist.

- **Purpose**: This rule prevents transactions to the specified
  blockchain addresses, enhancing security by blocking known risky or
  unauthorised recipients.

**Navigation Buttons**

**Back**: Returns to the previous step (\"Add details\").

**Next**: Proceeds to the next step (\"Set up approval\") after the
rules are defined.

**Policy Artefacts (Right Side)**

This section lists available artefacts that can be used to build or
expand the policy rules:

**Business Hours**: Likely restricts transactions to specific operating
hours.

**Velocity Limit**: Already used in the rules (as described above).

**Tx Amount**: Already used in the rules (as described above).

**Tx Destination**: Already used in the rules (as described above).
