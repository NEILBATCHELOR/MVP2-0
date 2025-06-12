# Activity Triggers Migration Guide

This directory contains the migration files for setting up activity tracking triggers on database tables. Since the migration was experiencing timeout issues, it has been split into multiple, smaller files that can be run individually.

## Migration Files

The migration is split into multiple files that should be executed in sequence:

1. `20240615_01_core_function.sql`: Creates the core trigger function for recording changes
2. `20240615_02_helper_functions.sql`: Creates utility functions for checking tables and columns
3. `20240615_03_trigger_function.sql`: Creates the function to apply triggers to tables
4. `20240615_04_apply_trigger.sql`: Applies trigger to a single table at a time
5. `20240615_05_views.sql`: Creates the audit coverage view

## Recommended Execution Strategy

Because of timeout issues, follow these best practices:

1. Execute each file independently
2. Wait for each file to complete before moving to the next
3. For `20240615_04_apply_trigger.sql`, uncomment only ONE table at a time
4. If a step fails, you can retry just that step

## Troubleshooting

If you encounter timeout issues:

1. Try running the migration during low-usage periods
2. Focus on applying triggers to the most critical tables first
3. Skip high-volume tables by setting the flag to false

The original combined migration file is still available at `20240615_activity_triggers.sql` but is not recommended for use unless timeout issues are resolved.