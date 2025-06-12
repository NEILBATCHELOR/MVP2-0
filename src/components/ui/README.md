# UI Components

## Overview
The UI components folder contains foundational user interface elements that form the design system of the application. These components provide consistent styling, behavior, and accessibility across the entire application.

## Component Categories

### Form Elements
- **input.tsx**: Text input field component with consistent styling and behavior.
- **textarea.tsx**: Multi-line text input component.
- **select.tsx**: Dropdown selection component with custom styling.
- **checkbox.tsx**: Checkbox input component with customizable states.
- **radio-group.tsx**: Radio button group for mutually exclusive selections.
- **switch.tsx**: Toggle switch component for boolean settings.
- **slider.tsx**: Range slider component for numeric input within a range.
- **form.tsx**: Form wrapper component with validation integration.

### Layout Components
- **card.tsx**: Card container with consistent styling and optional header/footer.
- **table.tsx**: Data table component with consistent styling.
- **tabs.tsx**: Tabbed interface component for organizing content.
- **separator.tsx**: Horizontal or vertical divider line.
- **collapsible.tsx**: Expandable/collapsible content section.
- **resizable.tsx**: Resizable panel component.
- **aspect-ratio.tsx**: Component to maintain consistent aspect ratios for content.

### Navigation Components
- **navigation-menu.tsx**: Primary navigation menu component.
- **pagination.tsx**: Pagination control for multi-page content.
- **menubar.tsx**: Horizontal menubar component.
- **dropdown-menu.tsx**: Dropdown menu for additional options.
- **command.tsx**: Command palette interface component.

### Feedback & Notifications
- **toast.tsx**: Toast notification component.
- **toaster.tsx**: Manager component for displaying toast notifications.
- **use-toast.ts**: Hook for programmatically showing toast notifications.
- **alert.tsx**: Alert component for important messages.
- **alert-dialog.tsx**: Modal dialog for critical alerts requiring user action.
- **notification.tsx**: Notification component for system messages.
- **progress.tsx**: Progress indicator component.

### Overlay Components
- **dialog.tsx**: Modal dialog component.
- **drawer.tsx**: Side drawer component.
- **popover.tsx**: Popover component for contextual information.
- **tooltip.tsx**: Tooltip component for providing additional context.
- **hover-card.tsx**: Card that appears on hover for rich previews.
- **sheet.tsx**: Slide-in panel component.
- **context-menu.tsx**: Right-click context menu component.

### Display Components
- **avatar.tsx**: User avatar component with fallback.
- **badge.tsx**: Badge component for status or count indicators.
- **carousel.tsx**: Slideshow component for cycling through content.
- **skeleton.tsx**: Loading skeleton placeholder component.
- **calendar.tsx**: Date picker calendar component.
- **date-picker.tsx**: Date selection component.
- **date-picker-with-range.tsx**: Date range selection component.

### Interactive Components
- **button.tsx**: Button component with various styles and states.
- **accordion.tsx**: Expandable accordion component.
- **scroll-area.tsx**: Custom scrollable area component.

## Usage
These UI components should be used consistently throughout the application instead of directly using HTML elements or creating custom one-off components. They ensure a consistent look and feel, proper accessibility, and reduce development time.

## Dependencies
- React
- Tailwind CSS for styling
- Various utility libraries for specific component functionality