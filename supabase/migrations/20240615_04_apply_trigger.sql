-- File: 20240615_04_apply_trigger.sql
-- Apply trigger to a single table
-- Run this for each table individually

-- Apply trigger to users table
SELECT create_audit_trigger('users', false);

-- Uncomment and run these individually as needed:
-- SELECT create_audit_trigger('projects', false);
-- SELECT create_audit_trigger('investor_profiles', false);
-- SELECT create_audit_trigger('bulk_operations', false);