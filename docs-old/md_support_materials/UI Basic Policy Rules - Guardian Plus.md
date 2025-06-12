Below is a UI and functional specification for **Investor
Qualification-Based Transfers**, **Jurisdiction-Based Transfers**, and
**Asset Class-Based Transfers**, designed for a **Vite + React +
TypeScript** framework using a **Supabase database**. This specification
outlines the UI components, workflows, React component structures, and
Supabase database schemas for each rule category, providing a clear and
modular approach to implementation.

**Functional Specification for Rule Categories**

**1. Investor Qualification-Based Transfers**

**Overview**

Investor Qualification-Based Transfers ensure that transfers are
permitted only if the investor meets specific qualification criteria,
such as KYC (Know Your Customer), AML (Anti-Money Laundering),
Accredited Investor status, or Risk Profile Verification.

**UI Components**

**UI Fields**:

**Dropdown**: Select compliance checks (e.g., KYC, AML, Accredited
Investor, Risk Profile Verification).

**Input Field**: Specify threshold values (e.g., minimum net worth, risk
tolerance level).

**Toggle**: Enable automatic verification or require manual review.

**Workflow**: Investor → Guardian Policy Enforcement → Transfer
Execution or Blocked.

**React Component: InvestorQualificationRuleConfig**

Here[']{dir="rtl"}s the implementation in React with TypeScript:

tsx

import React, { useState } from \'react\';

import { supabase } from \'../supabaseClient\';

const complianceChecks = \[\'KYC\', \'AML\', \'Accredited Investor\',
\'Risk Profile Verification\'\];

const InvestorQualificationRuleConfig = () =\> {

const \[complianceCheck, setComplianceCheck\] =
useState(complianceChecks\[0\]);

const \[thresholdValue, setThresholdValue\] = useState(\'\');

const \[autoVerify, setAutoVerify\] = useState(true);

const saveRule = async () =\> {

const { data, error } = await supabase.from(\'rules\').insert(\[

{

type: \'investor_qualification\',

compliance_check: complianceCheck,

threshold_value: parseFloat(thresholdValue),

auto_verify: autoVerify,

},

\]);

if (error) console.error(\'Error saving rule:\', error);

else console.log(\'Rule saved:\', data);

};

return (

\<div\>

\<h2\>Investor Qualification Rule\</h2\>

\<div\>

\<label\>Compliance Check:\</label\>

\<select value={complianceCheck} onChange={(e) =\>
setComplianceCheck(e.target.value)}\>

{complianceChecks.map((check) =\> (

\<option key={check} value={check}\>

{check}

\</option\>

))}

\</select\>

\</div\>

\<div\>

\<label\>Threshold Value (if applicable):\</label\>

\<input

type=\"number\"

value={thresholdValue}

onChange={(e) =\> setThresholdValue(e.target.value)}

placeholder=\"e.g., 1000000 for net worth\"

/\>

\</div\>

\<label\>

\<input type=\"checkbox\" checked={autoVerify} onChange={() =\>
setAutoVerify(!autoVerify)} /\>

Automatic Verification

\</label\>

\<button onClick={saveRule}\>Save Rule\</button\>

\</div\>

);

};

export default InvestorQualificationRuleConfig;

**Supabase Schema**

- **type**: String (\'investor_qualification\')

- **compliance_check**: String (e.g., \'KYC\', \'AML\', \'Accredited
  Investor\', \'Risk Profile\')

- **threshold_value**: Number (e.g., for net worth or risk tolerance)

- **auto_verify**: Boolean (true for automatic, false for manual)

**2. Jurisdiction-Based Transfers**

**Overview**

Jurisdiction-Based Transfers restrict transfers based on the
investor[']{dir="rtl"}s jurisdiction, ensuring compliance with local
laws, tax residency rules, and sanctions lists.

**UI Components**

**UI Fields**:

**Multi-Select Dropdown**: Choose allowed jurisdictions (e.g., US, EU,
UK).

**Toggle**: Enable/disable tax residency compliance.

**Toggle**: Enable/disable sanctions list checks (e.g., restricted
regions).

**Workflow**: Investor → Check Jurisdiction → Approve/Reject Transfer.

**React Component: JurisdictionRuleConfig**

Here[']{dir="rtl"}s the implementation:

tsx

import React, { useState } from \'react\';

import { supabase } from \'../supabaseClient\';

const jurisdictions = \[\'US\', \'EU\', \'UK\', \'CA\', \'JP\'\]; *//
Example jurisdictions*

const JurisdictionRuleConfig = () =\> {

const \[allowedJurisdictions, setAllowedJurisdictions\] =
useState\<string\[\]\>(\[\]);

const \[taxResidencyCompliance, setTaxResidencyCompliance\] =
useState(false);

const \[sanctionsCheck, setSanctionsCheck\] = useState(false);

const saveRule = async () =\> {

const { data, error } = await supabase.from(\'rules\').insert(\[

{

type: \'jurisdiction\',

allowed_jurisdictions: JSON.stringify(allowedJurisdictions),

tax_residency_compliance: taxResidencyCompliance,

sanctions_check: sanctionsCheck,

},

\]);

if (error) console.error(\'Error saving rule:\', error);

else console.log(\'Rule saved:\', data);

};

return (

\<div\>

\<h2\>Jurisdiction-Based Rule\</h2\>

\<div\>

\<label\>Allowed Jurisdictions:\</label\>

\<select

multiple

value={allowedJurisdictions}

onChange={(e) =\>

setAllowedJurisdictions(Array.from(e.target.selectedOptions, (option)
=\> option.value))

}

\>

{jurisdictions.map((jur) =\> (

\<option key={jur} value={jur}\>

{jur}

\</option\>

))}

\</select\>

\</div\>

\<label\>

\<input

type=\"checkbox\"

checked={taxResidencyCompliance}

onChange={() =\> setTaxResidencyCompliance(!taxResidencyCompliance)}

/\>

Tax Residency Compliance

\</label\>

\<label\>

\<input

type=\"checkbox\"

checked={sanctionsCheck}

onChange={() =\> setSanctionsCheck(!sanctionsCheck)}

/\>

Sanctions List Check

\</label\>

\<button onClick={saveRule}\>Save Rule\</button\>

\</div\>

);

};

export default JurisdictionRuleConfig;

**Supabase Schema**

- **type**: String (\'jurisdiction\')

- **allowed_jurisdictions**: String (JSON-stringified array, e.g.,
  \[\"US\", \"EU\"\])

- **tax_residency_compliance**: Boolean

- **sanctions_check**: Boolean

**3. Asset Class-Based Transfers**

**Overview**

Asset Class-Based Transfers restrict transfers based on the type of
asset being transferred (e.g., debt securities, stablecoins), ensuring
eligibility and compliance with asset-specific rules.

**UI Components**

**UI Fields**:

**Dropdown**: Select asset class restrictions (e.g., Debt Securities,
Stablecoins, Tokenised Funds).

**Textarea**: Define issuer-specific eligibility rules (e.g., \"Must
hold at least 100 tokens\").

**Toggle**: Enable/disable automatic enforcement.

**Workflow**: Investor → Verify Asset Holding Eligibility →
Approve/Reject Transfer.

**React Component: AssetClassRuleConfig**

Here[']{dir="rtl"}s the implementation:

tsx

import React, { useState } from \'react\';

import { supabase } from \'../supabaseClient\';

const assetClasses = \[\'Debt Securities\', \'Stablecoins\', \'Tokenized
Funds\'\];

const AssetClassRuleConfig = () =\> {

const \[assetClass, setAssetClass\] = useState(assetClasses\[0\]);

const \[eligibilityRules, setEligibilityRules\] = useState(\'\');

const \[autoEnforce, setAutoEnforce\] = useState(true);

const saveRule = async () =\> {

const { data, error } = await supabase.from(\'rules\').insert(\[

{

type: \'asset_class\',

asset_class: assetClass,

eligibility_rules: eligibilityRules,

auto_enforce: autoEnforce,

},

\]);

if (error) console.error(\'Error saving rule:\', error);

else console.log(\'Rule saved:\', data);

};

return (

\<div\>

\<h2\>Asset Class-Based Rule\</h2\>

\<div\>

\<label\>Asset Class:\</label\>

\<select value={assetClass} onChange={(e) =\>
setAssetClass(e.target.value)}\>

{assetClasses.map((cls) =\> (

\<option key={cls} value={cls}\>

{cls}

\</option\>

))}

\</select\>

\</div\>

\<div\>

\<label\>Eligibility Rules:\</label\>

\<textarea

value={eligibilityRules}

onChange={(e) =\> setEligibilityRules(e.target.value)}

placeholder=\"e.g., Must hold at least 100 tokens\"

/\>

\</div\>

\<label\>

\<input type=\"checkbox\" checked={autoEnforce} onChange={() =\>
setAutoEnforce(!autoEnforce)} /\>

Automatic Enforcement

\</label\>

\<button onClick={saveRule}\>Save Rule\</button\>

\</div\>

);

};

export default AssetClassRuleConfig;

**Supabase Schema**

- **type**: String (\'asset_class\')

- **asset_class**: String (e.g., \'Debt Securities\', \'Stablecoins\',
  \'Tokenized Funds\')

- **eligibility_rules**: String (e.g., \"Must hold at least 100
  tokens\")

- **auto_enforce**: Boolean

**General Notes**

- **Supabase Integration**: Each component assumes a supabaseClient.ts
  file exports a configured Supabase client (supabase).

- **Error Handling**: Basic console logging is included; for production,
  enhance with user-facing notifications.

- **Dynamic Data**: Options like compliance checks, jurisdictions, and
  asset classes are hardcoded here for simplicity. In practice, fetch
  these from Supabase or an API.

- **Validation**: Add client-side validation (e.g., numeric constraints,
  required fields) as needed.

- **UI Enhancements**: Use libraries like react-select for multi-select
  dropdowns or react-hook-form for form management to improve usability.

This specification provides a complete, modular framework for
implementing these rule categories in a **Vite + React + TypeScript**
application with **Supabase**, ready to be integrated into a broader
rule management system. Each component is self-contained and includes
both UI and database interaction logic.
