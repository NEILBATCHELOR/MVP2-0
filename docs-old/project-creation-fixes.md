# Project Creation and Editing Fixes

This document explains the fixes implemented to resolve errors occurring during project creation and editing.

## Issues Fixed

1. **404 Error on RPC Function**: The application was trying to call a non-existent function `create_project_with_cap_table` in Supabase.

2. **Type Error**: When falling back to manual project creation, there was an error `invalid input syntax for type integer: ""` because empty string values were not being properly handled before insertion into the database.

3. **Schema Mismatch**: The original SQL function definition didn't match the actual database schema for the projects table.

4. **Enum Handling Error**: The application was failing with `invalid input value for enum project_duration: ""` because empty strings for enum types need special handling.

5. **Timestamp Error**: The error `invalid input syntax for type timestamp with time zone: ""` occurred because empty strings in date fields were not being properly handled.

6. **Project Editing Error**: Similar issues were occurring in the project editing functionality with empty string values for enum fields and timestamp fields.

## Implemented Solutions

1. **Fixed Empty String Handling**: Updated both the `handleAddProject` and `handleEditProject` functions to convert empty strings to `null` for numeric fields, enum fields, and timestamp fields.

2. **Created Database Function**: Added an SQL migration file `20240822_create_project_with_cap_table.sql` that creates the missing `create_project_with_cap_table` stored procedure in the database.

3. **Improved Error Handling**: Enhanced error handling in the project creation and editing flows with proper try/catch blocks and better fallback logic, including specific error messages for enum validation and timestamp format issues.

4. **Schema Alignment**: Updated the SQL function to match the actual projects table schema, including correct column names and data types.

5. **Enum Type Handling**: Added special handling for the `duration` field in both client-side code and in the SQL function to properly handle empty strings for enum types.

6. **Timestamp Handling**: Implemented proper handling of timestamp fields with CASE statements in the SQL function to convert empty strings to NULL values before type casting.

7. **User-Friendly Error Messages**: Added specific error messages for different types of validation errors (duration, timestamp, numeric) to help users identify and fix issues.

## How to Deploy

1. Run the migration to create the `create_project_with_cap_table` function in your Supabase database:

```bash
npx supabase db push
```

2. The application code changes for handling numeric fields, enum types, and timestamp fields have already been applied to the codebase.

## Technical Details

### Database Function

The new `create_project_with_cap_table` function creates both a project and its associated cap table in a single transaction, ensuring data consistency. It handles all field types properly by explicitly casting values to the appropriate types.

The function now:
- Uses the correct column names from the projects table
- Applies appropriate type casts for each column
- Uses COALESCE to provide default values where appropriate
- Handles timestamps with time zone properly using CASE statements
- Properly handles enum types like `project_duration` with special CASE logic
- Stores intermediate values in variables for better readability and control

### Error Handling

The client-side code now has more robust error handling:

1. It first attempts to use the RPC function.
2. If that fails, it falls back to direct table insertions.
3. Empty string values for all field types are converted to `null` to avoid type errors.
4. Specific error messages are displayed based on the error type:
   - Duration/enum errors show a specific message about duration
   - Timestamp errors show a message about invalid date formats
   - Numeric field errors show a message about invalid number formats
   - Other errors show a generic error message

## Project Editing Updates

The `handleEditProject` function has been updated with the same improvements:

1. Empty string handling for all field types
2. Improved error categorization and user feedback
3. Specific error messages for different validation failures
4. Enhanced field processing to match the project creation flow

## Future Improvements

1. Add validation in the front-end form to prevent empty strings from being submitted for numeric fields, enum fields, and date fields.
2. Consider adding default values for fields in the database schema where appropriate.
3. Add more detailed error feedback to the user when fields have invalid values, including the specific field names that caused the error.
4. Implement client-side validation for all field types to provide immediate feedback before submission. 