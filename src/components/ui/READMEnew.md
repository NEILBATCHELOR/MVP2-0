# `/src/components/ui` — READMEnew.md

This folder contains the atomic UI primitives and design system components for the entire application. All components here are built using Radix UI and shadcn/ui conventions, providing a consistent, accessible, and highly composable foundation for all application UIs.

---

## Files

- **accordion.tsx, alert-dialog.tsx, alert.tsx, aspect-ratio.tsx, avatar.tsx, badge.tsx, button.tsx, calendar.tsx, card.tsx, carousel.tsx, chart.tsx, checkbox.tsx, collapsible.tsx, command.tsx, context-menu.tsx, data-table.tsx, date-picker-with-range.tsx, date-picker.tsx, dialog.tsx, drawer.tsx, dropdown-menu.tsx, editable-cell.tsx, enhanced-data-table.tsx, filter-popover.tsx, form.tsx, hover-card.tsx, input.tsx, label.tsx, menubar.tsx, modal-portal.tsx, navigation-menu.tsx, notification.tsx, pagination.tsx, popover.tsx, progress.tsx, radio-group.tsx, refresh-link.tsx, resizable.tsx, scroll-area.tsx, select.tsx, separator.tsx, sheet.tsx, skeleton.tsx, slider.tsx, spinner.tsx, switch.tsx, table.tsx, tabs.tsx, textarea.tsx, toast.tsx, toaster.tsx, toggle.tsx, tooltip.tsx, use-toast.ts**
  - **Purpose:**  
    Each file exports a single atomic UI primitive or utility, e.g. Button, Input, Dialog, Table, Tab, Tooltip, Toast, etc.
  - **Features:**  
    - All components are accessible, themeable, and composable.
    - Used throughout the app for all forms, dialogs, navigation, data display, and feedback.
    - Many components wrap or extend Radix UI primitives with custom styles and behaviors.
    - Utilities like `use-toast.ts` provide hooks for notifications.
    - Data table and chart components support advanced data display and interaction.
  - **Usage:**  
    Import directly from `@/components/ui` for any page, feature, or atomic component.

---

## Developer Notes

- Do not place business logic or domain-specific code here.
- Extend or override styles using shadcn/ui conventions.
- All new UI primitives should be placed here for global reuse.
- Maintain strict typing and accessibility best practices.

---

### Download Link

- [Download /src/components/ui/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/ui/READMEnew.md)
- [Download /memory-bank/components/ui/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/ui/READMEnew.md)

