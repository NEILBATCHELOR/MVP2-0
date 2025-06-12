# `/src/services/workflow` — READMEnew.md

This folder contains workflow orchestration logic and services, enabling the application to manage multi-stage business processes, track progress, and enforce stage requirements. It provides interfaces and functions for workflow status, stage management, and requirement completion/failure.

---

## Files

- **workflowService.ts**
  - Defines `WorkflowStage`, `WorkflowStatus`, and `StageRequirement` interfaces.
  - Provides functions to:
    - Fetch workflow status and stages for an organization (`getWorkflowStatus`).
    - Retrieve requirements for a workflow stage (`getStageRequirements`).
    - Mark requirements as completed or failed, updating stage and workflow progress accordingly (`completeRequirement`, `failRequirement`).
  - Integrates with Supabase for persistent workflow and requirement data.
  - Calculates overall workflow progress and tracks current stage.

---

## Usage
- Use these services to orchestrate multi-stage workflows, enforce requirements, and track progress in onboarding, compliance, or other business processes.
- Extend with new workflow types or custom requirements as needed.

## Developer Notes
- All types are TypeScript-typed for safety and maintainability.
- Keep business logic in services; keep UI focused on orchestration and display.
- Keep documentation (`READMEnew.md`) up to date as workflow logic evolves.

---

### Download Link
- [Download /src/services/workflow/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/services/workflow/READMEnew.md)
