-- File: 20240615_02_helper_functions.sql
-- Basic helper functions for the activity tracking system
-- You can run this after the core function is created

-- Function to check if a column exists
DROP FUNCTION IF EXISTS column_exists(text, text, text);
CREATE FUNCTION column_exists(p_schema text, p_table text, p_column text) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = p_schema 
    AND table_name = p_table 
    AND column_name = p_column
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a table exists
DROP FUNCTION IF EXISTS table_exists(text, text);
CREATE FUNCTION table_exists(p_schema text, p_table text) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = p_schema 
    AND table_name = p_table
  );
END;
$$ LANGUAGE plpgsql;