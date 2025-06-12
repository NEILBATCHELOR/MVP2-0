-- File: 20240615_05_views.sql
-- Create audit coverage view
-- Run this after triggers are created successfully

-- Create audit coverage view
DROP VIEW IF EXISTS audit_coverage;
CREATE VIEW audit_coverage AS
SELECT 
  tgt.tgname AS trigger_name,
  cls.relname AS table_name
FROM pg_trigger tgt
JOIN pg_class cls ON tgt.tgrelid = cls.oid
JOIN pg_proc p ON tgt.tgfoid = p.oid
WHERE p.proname = 'log_table_change'
ORDER BY table_name;