# Shared Components

## Overview
The shared components folder contains reusable UI elements and utility components that are used across multiple parts of the application. These components provide consistent user experience patterns for common scenarios like loading states, error handling, and empty states.

## Components

### State Components
- **LoadingState.tsx**: Displays a loading spinner or animation with optional message when content is being fetched or processed.
- **EmptyState.tsx**: Provides a user-friendly UI when no data is available, typically with an illustration and call to action.
- **ErrorState/**: Directory containing components for displaying various error states and providing recovery options.

### Error Handling
- **ErrorBoundary/**: Directory containing React error boundary components to gracefully catch and handle JavaScript errors in child component trees.

### UI Utilities
- **DocumentChecklist.tsx**: Component for displaying document verification status and progress with interactive checklist functionality.
- **NoMockDataAlert.tsx**: Alert component displayed when mock data is unavailable during development or testing.
- **ConnectionTest.tsx**: Component for testing and displaying connection status to backend services or APIs.
- **CountrySelector.tsx**: Reusable dropdown component for selecting countries with flags and localized names.

## Configuration
The folder contains a `tsconfig.json` for TypeScript configuration specific to the shared components.

## Usage
These components should be used consistently throughout the application to provide a unified user experience. They handle common UI patterns so individual feature components can focus on their specific functionality.

## Dependencies
- React
- UI component library
- Icons and illustration assets