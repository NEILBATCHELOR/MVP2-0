# `/src/components/rules` — READMEnew.md

This folder contains all rule and policy management components, including compliance rules, approval workflows, dashboards, and supporting dialogs. It is designed for building, editing, and enforcing compliance policies such as AML, KYC, investor eligibility, redemption, and transaction limits. Intended for developers implementing or extending compliance, approval, and rule management UIs.

---

## File-by-File Breakdown

### Core Rule Components
- **AMLSanctionsRule.tsx**
  - UI for configuring and enforcing AML sanctions checks.
  - Supports sanctions list selection, check frequency, and validation.
- **AccreditedInvestorRule.tsx**
  - Component for defining accredited investor eligibility criteria.
- **ApprovalDashboard.tsx**
  - Dashboard for managing rule approval requests and statuses.
- **ApprovalNotifications.tsx**
  - Real-time notifications for rule and policy approval events.
- **ApprovalWorkflow.tsx**
  - Orchestrates multi-step approval flows for new/updated policies.
- **ApproverSelection.tsx**
  - UI for selecting approvers for rules or policies.
- **DashboardHeader.tsx**
  - Header for rule/policy dashboards, with navigation and status.
- **DeletePolicyDialog.tsx**, **DeleteRuleDialog.tsx**, **DeleteTemplateDialog.tsx**
  - Dialogs for confirming deletion of policies, rules, or templates.
- **DuplicatePolicyDialog.tsx**
  - Dialog for duplicating existing policies.
- **EnhancedApprovalDashboard.tsx**
  - Advanced dashboard for approval analytics and multi-policy management.
- **IntervalFundRedemptionRule.tsx**
  - Rule for interval-based fund redemptions.
- **InvestorPositionLimitRule.tsx**
  - Rule for limiting investor positions.
- **InvestorTransactionLimitRule.tsx**
  - Rule for limiting investor transaction frequency/amount.
- **KYCVerificationRule.tsx**
  - UI for configuring KYC verification requirements.
- **LockUpPeriodRule.tsx**
  - Rule for enforcing lock-up periods on assets.
- **PolicyAnalytics.tsx**
  - Analytics and reporting for policy effectiveness and compliance.
- **PolicyCard.tsx**
  - Card UI for displaying policy/rule summaries.
- **PolicyCreationModal.tsx**
  - Modal for creating new policies with multi-tabbed input and validation.

### Additional Components
- **PolicyDetailsPanel.tsx**: Detailed view for a policy, including history and status.
- **PolicyExportDialog.tsx**: Dialog for exporting policy configurations.
- **PolicyList.tsx**: List/table of all policies.
- **PolicyTemplateDashboard.tsx**: Dashboard for managing policy templates.
- **PolicyTemplateDialog.tsx**, **PolicyTemplateEditModal.tsx**, **PolicyTemplateList.tsx**, **PolicyTemplateVersionDialog.tsx**, **PolicyTemplateVersionList.tsx**, **PolicyTemplateVersionManagement.tsx**: Components for managing, editing, and versioning policy templates.
- **PolicyTemplatesTab.tsx**: Tabbed UI for template navigation.
- **PolicyVersionComparison.tsx**, **PolicyVersionHistory.tsx**: Tools for comparing and viewing policy version histories.
- **RedemptionRule.tsx**: Rule for redemption eligibility and limits.
- **RiskProfileRule.tsx**: Rule for risk profiling investors or assets.
- **RuleBuilder.tsx**: UI for building custom rules with logic combiners.
- **RuleConflictDetector.tsx**: Detects and displays rule conflicts.
- **RuleEditModal.tsx**: Modal for editing rules.
- **RuleLogicCombiner.tsx**: Logic combinator for complex rule expressions.
- **RuleManagementDashboard.tsx**: Main dashboard for managing all rules.
- **StandardRedemptionRule.tsx**: Standard redemption enforcement.
- **TokenizedFundRule.tsx**: Rule for tokenized funds.
- **TransferLimitRule.tsx**: Rule for limiting transfers.
- **VelocityLimitRule.tsx**: Rule for velocity (rate) limits.
- **VolumeSupplyLimitRule.tsx**: Rule for supply/volume limits.
- **WhitelistTransferRule.tsx**: Rule for whitelisted transfers.
- **index.ts**: Barrel file for exports.

### Documentation
- **README.md**: Legacy documentation (superseded by this READMEnew.md).
- **Changes to DB for policy fixes.md**: Notes on database changes for policy enforcement.

---

## Usage
- Use these components to build compliance, approval, and rule management workflows.
- Integrate with dashboards, analytics, and notification systems as needed.
- Extend rule logic, templates, and analytics for new compliance requirements.

## Developer Notes
- All UI follows Radix UI/shadcn/ui conventions for accessibility and consistency.
- Rule logic should be modular, DRY, and easily extendable.
- Approval flows support multi-step, multi-approver logic.
- Document any new rules, templates, or analytics modules added here.

---

### Download Link
- [Download /src/components/rules/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/rules/READMEnew.md)
