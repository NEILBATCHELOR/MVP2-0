# Two-Way Sorting Enhancement for Factoring Module

This update adds enhanced two-way sorting capabilities to all data tables in the Factoring module, leveraging the improved `EnhancedDataTable` component.

## Changes Made

1. Modified the `EnhancedDataTable` component to support two-way sorting with the following improvements:
   - Added clear visual indicators for sort direction (ascending, descending, or unsorted)
   - Created a dropdown menu for sort operations (ascending, descending, clear sorting, hide column)
   - Implemented a reusable `SortableColumnHeader` component for consistent sorting UI

2. Updated all key components in the Factoring module to use the enhanced data table:
   - `PoolManager.tsx`
   - `TokenizationManager.tsx`
   - `TokenDistributionManager.tsx`

3. Added `EditableCell` component integration to all relevant tables to ensure consistent editing experience.

4. The sort control now displays different icons based on the current sort state:
   - Arrow Up (↑) for ascending sort
   - Arrow Down (↓) for descending sort
   - Double Arrows (⇅) for unsorted columns

## Benefits

- Improved user experience with clearer visual indicators for sorting direction
- More flexibility with direct sort control options through dropdown menus
- Consistent sorting behavior across all tables in the Factoring module
- Standardized cell editing experience across all tables
- Better alignment with the shadcn/ui design system

## Technical Implementation

The implementation leverages TanStack Table's sorting capabilities and enhances them with a more user-friendly interface. The key technical improvements include:

1. Added a `SortableColumnHeader` component that renders a dropdown menu with sorting options
2. Configured column definitions to use the new sorting UI
3. Created appropriate render functions for each table to standardize implementation
4. Ensured proper alignment of numeric columns (right-aligned)
5. Added type-safe event handling for row selection and sorting events

These changes provide users with more intuitive control over table data organization without requiring any changes to existing table usage patterns.