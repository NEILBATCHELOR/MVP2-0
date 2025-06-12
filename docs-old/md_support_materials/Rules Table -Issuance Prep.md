**Rules Table Specification for AI UI Generation (Vite + React +
TypeScript + Supabase)**

**1. Table Overview**

**Location**: Displayed within the \"Rules\" tab of the Rule Management
dashboard.

**Purpose**: Show all rules configured in the \"Dashboard\" or \"New
policy\" tab, with options to view, edit, and delete rules, updating in
real-time and syncing with the Supabase database.

**Columns**:

**Rule Type**: e.g., \"Tx Amount\", \"Velocity Limit\".

**Rule Name**: e.g., \"High Value Outgoing Tx\".

**Rule Details**: e.g., \"Outgoing transactions \> \$1,000 USD\".

**Created By**: e.g., \"User123\".

**Date and Time**: e.g., \"02/22/2025, 14:30 UTC\".

**Actions**: \"View\", \"Edit\", \"Delete\" buttons.

**2. UI Design Specifications**

**Layout**:

Responsive table with a modern design (light grey background, blue
accents, rounded corners) consistent with the \"New policy\" screen.

Sortable column headers and a filter input above the table.

Pagination (10 rules per page) using antd.

**Visual Elements**:

**Rule Type**: Text or icon (e.g., \"\$\" for \"Tx Amount\").

**Rule Name**: Bold, clickable text.

**Rule Details**: Truncated with a tooltip for full view.

**Created By**: Linked user ID/name.

**Date and Time**: Formatted as \"MM/DD/YYYY, HH:MM UTC\".

**Actions**:

**View**: Magnifying glass icon, opens a modal.

**Edit**: Pencil icon, redirects to edit form.

**Delete**: Trash can icon, with confirmation dialog.

**Interactivity**:

Row hover effects (highlight or shadow).

Real-time updates via Supabase[']{dir="rtl"}s real-time subscriptions
(fallback to 5-second polling).

**3. Functional Requirements**

- **Data Source**: Fetch rules from a Supabase PostgreSQL database.

- **Rule Storage**:

  - **Table**: rules

  - **Fields**:

    - rule_id (UUID, primary key).

    - rule_type (text).

    - rule_name (text).

    - rule_details (jsonb for structured data).

    - created_by (text).

    - created_at (timestamp with timezone, default: now()).

    - updated_at (timestamp with timezone, optional).

> **Example SQL Schema**:\
> sql
>
> CREATE TABLE rules (
>
> rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> rule_type TEXT NOT NULL,
>
> rule_name TEXT NOT NULL,
>
> rule_details JSONB NOT NULL,
>
> created_by TEXT NOT NULL,
>
> created_at TIMESTAMPTZ DEFAULT NOW(),
>
> updated_at TIMESTAMPTZ
>
> );
>
> CREATE INDEX idx_rule_type ON rules (rule_type);
>
> CREATE INDEX idx_created_at ON rules (created_at);
>
> **Example Row**:\
> json
>
> {
>
> \"rule_id\": \"123e4567-e89b-12d3-a456-426614174000\",
>
> \"rule_type\": \"Tx Amount\",
>
> \"rule_name\": \"High Value Outgoing Tx\",
>
> \"rule_details\": { \"condition\": \"Greater than\", \"value\": 1000,
> \"currency\": \"USD\" },
>
> \"created_by\": \"User123\",
>
> \"created_at\": \"2025-02-22T14:30:00Z\"
>
> }

- **Real-Time Updates**: Use Supabase[']{dir="rtl"}s real-time
  subscriptions over WebSocket.

**4. Technical Instructions for AI UI Generation**

**Frontend (Vite + React + TypeScript)**

**Framework**: React with TypeScript, bundled via Vite.

**UI Library**: antd for table, buttons, and modals.

**Real-Time**: Use Supabase[']{dir="rtl"}s JavaScript client
(@supabase/supabase-js) for real-time subscriptions.

**Structure**: Create a RulesTable component.

> **Example Component (src/components/RulesTable.tsx)**:
>
> tsx**\
> **
>
> import React, { useState, useEffect } from \'react\';
>
> import { Table, Button, Modal } from \'antd\';
>
> import { EyeOutlined, EditOutlined, DeleteOutlined } from
> \'@ant-design/icons\';
>
> import { createClient } from \'@supabase/supabase-js\';
>
> *// Supabase client setup (use environment variables in production)*
>
> const supabase = createClient(import.meta.env.VITE_SUPABASE_URL,
> import.meta.env.VITE_SUPABASE_ANON_KEY);
>
> *// Define Rule interface*
>
> interface Rule {
>
> rule_id: string;
>
> rule_type: string;
>
> rule_name: string;
>
> rule_details: Record\<string, any\>;
>
> created_by: string;
>
> created_at: string;
>
> }
>
> const RulesTable: React.FC = () =\> {
>
> const \[rules, setRules\] = useState\<Rule\[\]\>(\[\]);
>
> const \[selectedRule, setSelectedRule\] = useState\<Rule \|
> null\>(null);
>
> useEffect(() =\> {
>
> fetchRules();
>
> *// Real-time subscription to \'rules\' table*
>
> const subscription = supabase
>
> .channel(\'rules_changes\')
>
> .on(\'postgres_changes\', { event: \'INSERT\', schema: \'public\',
> table: \'rules\' }, (payload) =\> {
>
> setRules((prev) =\> \[\...prev, payload.new as Rule\]);
>
> })
>
> .on(\'postgres_changes\', { event: \'UPDATE\', schema: \'public\',
> table: \'rules\' }, (payload) =\> {
>
> setRules((prev) =\>
>
> prev.map((r) =\> (r.rule_id === payload.new.rule_id ? (payload.new as
> Rule) : r))
>
> );
>
> })
>
> .on(\'postgres_changes\', { event: \'DELETE\', schema: \'public\',
> table: \'rules\' }, (payload) =\> {
>
> setRules((prev) =\> prev.filter((r) =\> r.rule_id !==
> payload.old.rule_id));
>
> })
>
> .subscribe();
>
> return () =\> {
>
> subscription.unsubscribe();
>
> };
>
> }, \[\]);
>
> const fetchRules = async () =\> {
>
> const { data, error } = await supabase
>
> .from(\'rules\')
>
> .select(\'\*\')
>
> .order(\'created_at\', { ascending: false });
>
> if (error) {
>
> console.error(\'Error fetching rules:\', error);
>
> } else {
>
> setRules(data \|\| \[\]);
>
> }
>
> };
>
> const viewRule = (rule: Rule) =\> setSelectedRule(rule);
>
> const editRule = (rule: Rule) =\> {
>
> window.location.href = \`/edit-rule/\${rule.rule_id}\`; *// Adjust
> routing*
>
> };
>
> const deleteRule = async (rule: Rule) =\> {
>
> Modal.confirm({
>
> title: \'Are you sure you want to delete this rule?\',
>
> onOk: async () =\> {
>
> const { error } = await
> supabase.from(\'rules\').delete().eq(\'rule_id\', rule.rule_id);
>
> if (error) console.error(\'Error deleting rule:\', error);
>
> },
>
> });
>
> };
>
> const columns = \[
>
> {
>
> title: \'Rule Type\',
>
> dataIndex: \'rule_type\',
>
> sorter: (a: Rule, b: Rule) =\> a.rule_type.localeCompare(b.rule_type),
>
> },
>
> {
>
> title: \'Rule Name\',
>
> dataIndex: \'rule_name\',
>
> sorter: (a: Rule, b: Rule) =\> a.rule_name.localeCompare(b.rule_name),
>
> render: (text: string) =\> \<strong\>{text}\</strong\>,
>
> },
>
> {
>
> title: \'Rule Details\',
>
> dataIndex: \'rule_details\',
>
> ellipsis: true,
>
> render: (details: Record\<string, any\>) =\> JSON.stringify(details),
>
> },
>
> {
>
> title: \'Created By\',
>
> dataIndex: \'created_by\',
>
> sorter: (a: Rule, b: Rule) =\>
> a.created_by.localeCompare(b.created_by),
>
> },
>
> {
>
> title: \'Date and Time\',
>
> dataIndex: \'created_at\',
>
> sorter: (a: Rule, b: Rule) =\> new Date(a.created_at).getTime() - new
> Date(b.created_at).getTime(),
>
> render: (text: string) =\> new Date(text).toLocaleString(\'en-US\', {
> timeZone: \'UTC\' }),
>
> },
>
> {
>
> title: \'Actions\',
>
> render: (\_: any, record: Rule) =\> (
>
> \<\>
>
> \<Button icon={\<EyeOutlined /\>} onClick={() =\> viewRule(record)}
> style={{ marginRight: 8 }} /\>
>
> \<Button icon={\<EditOutlined /\>} onClick={() =\> editRule(record)}
> style={{ marginRight: 8 }} /\>
>
> \<Button icon={\<DeleteOutlined /\>} onClick={() =\>
> deleteRule(record)} /\>
>
> \</\>
>
> ),
>
> },
>
> \];
>
> return (
>
> \<\>
>
> \<Table columns={columns} dataSource={rules} pagination={{ pageSize:
> 10 }} rowKey=\"rule_id\" /\>
>
> {selectedRule && (
>
> \<Modal
>
> title={selectedRule.rule_name}
>
> visible={!!selectedRule}
>
> onCancel={() =\> setSelectedRule(null)}
>
> footer={null}
>
> \>
>
> \<pre\>{JSON.stringify(selectedRule, null, 2)}\</pre\>
>
> \</Modal\>
>
> )}
>
> \</\>
>
> );
>
> };
>
> export default RulesTable;

**Backend (Node.js + Express + TypeScript + Supabase)**

- **Framework**: Node.js with Express and TypeScript (optional backend;
  Supabase can handle most CRUD directly).

- **Database**: Supabase[']{dir="rtl"}s PostgreSQL.

- **Real-Time**: Leverage Supabase[']{dir="rtl"}s built-in real-time
  subscriptions instead of a custom WebSocket server.

> **Optional Backend (server/index.ts)**: If you need a backend for
> additional logic (e.g., validation), here[']{dir="rtl"}s an example:\
> typescript
>
> import express, { Request, Response } from \'express\';
>
> import { createClient } from \'@supabase/supabase-js\';
>
> const app = express();
>
> app.use(express.json());
>
> const supabase = createClient(\'YOUR_SUPABASE_URL\',
> \'YOUR_SUPABASE_SERVICE_ROLE_KEY\'); *// Use service role key for
> server-side*
>
> app.get(\'/api/rules\', async (\_req: Request, res: Response) =\> {
>
> const { data, error } = await supabase
>
> .from(\'rules\')
>
> .select(\'\*\')
>
> .order(\'created_at\', { ascending: false });
>
> if (error) return res.status(500).json({ error: error.message });
>
> res.json(data);
>
> });
>
> app.post(\'/api/rules\', async (req: Request, res: Response) =\> {
>
> const { rule_type, rule_name, rule_details, created_by } = req.body;
>
> if (!rule_type \|\| !rule_details) return res.status(400).json({
> error: \'Missing fields\' });
>
> const { data, error } = await supabase.from(\'rules\').insert(\[
>
> {
>
> rule_type,
>
> rule_name,
>
> rule_details,
>
> created_by,
>
> },
>
> \]).select();
>
> if (error) return res.status(500).json({ error: error.message });
>
> res.status(201).json(data\[0\]);
>
> });
>
> app.delete(\'/api/rules/:id\', async (req: Request, res: Response) =\>
> {
>
> const { id } = req.params;
>
> const { error } = await
> supabase.from(\'rules\').delete().eq(\'rule_id\', id);
>
> if (error) return res.status(500).json({ error: error.message });
>
> res.status(204).end();
>
> });
>
> app.listen(3000, () =\> console.log(\'Server running on port 3000\'));

**5. Real-Time Update Mechanism**

- **Supabase Real-Time**: Use Supabase[']{dir="rtl"}s PostgreSQL change
  subscriptions (via WebSocket) as shown in the frontend code.

- **Polling Fallback**: Add if needed:

> tsx
>
> useEffect(() =\> {
>
> fetchRules()*;*
>
> const interval = setInterval(fetchRules, 5000)*;*
>
> return () =\> clearInterval(interval)*;*
>
> }, \[\])*;*

**6. Error Handling and Validation**

**Frontend**: Use antd notifications for errors:\
tsx

import { notification } from \'antd\';

if (error) notification.error({ message: \'Error\', description:
error.message });

- **Backend (if used)**: Validate inputs:\
  typescript

if (rule_type === \'Tx Amount\' && (!rule_details.value \|\|
rule_details.value \<= 0)) {

return res.status(400).json({ error: \'Invalid transaction amount\' });

}

- **Supabase**: Add row-level security (RLS) policies in Supabase to
  enforce validation.

**7. Accessibility and Usability**

- Add ARIA labels: \<Button aria-label=\"View rule\" icon={\<EyeOutlined
  /\>} /\>.

- Enable keyboard navigation in antd components.

**8. Integration with \"New Policy\" Tab**

- Trigger rule creation directly with Supabase:

tsx

const saveRule = async () =\> {

const ruleData = {

rule_type: \'Tx Amount\',

rule_name: \'High Value Outgoing\',

rule_details: { condition: \'Greater than\', value: 1000, currency:
\'USD\' },

created_by: \'User123\',

}*;*

const { error } = await supabase.from(\'rules\').insert(\[ruleData\])*;*

if (error) console.error(\'Error saving rule:\', error)*;*

}*;*

**9. Performance Optimization**

- Use Supabase[']{dir="rtl"}s pagination: .range(start, end) for large
  datasets.

- Index rule_type and created_at (already included in SQL schema).

- This document provides a full specification tailored for **Vite +
  React + TypeScript + Supabase**, ensuring real-time updates, type
  safety, and a modern UI with antd. All code examples are ready to use
  with minimal adjustments (e.g., Supabase credentials, routing). Let me
  know if you need additional details or modifications!
