#!/usr/bin/env node
/**
 * Migration Application Script for Supabase
 * 
 * This script helps apply database migrations to Supabase.
 * It reads a migration file and applies it using the Supabase JS client.
 * 
 * Usage:
 *   node apply-migration.js [migration-file]
 * 
 * Example:
 *   node apply-migration.js token_erc3525_properties_fix.sql
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Validate arguments
if (process.argv.length < 3) {
  console.error('Error: Missing migration file argument');
  console.log('Usage: node apply-migration.js [migration-file]');
  process.exit(1);
}

const migrationFile = process.argv[2];
const migrationPath = path.join(__dirname, migrationFile);

// Check if file exists
if (!fs.existsSync(migrationPath)) {
  console.error(`Error: Migration file not found: ${migrationPath}`);
  process.exit(1);
}

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Service key needed for database operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.log('Please set these environment variables before running this script');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sql = fs.readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  console.log(`Applying migration: ${migrationFile}`);
  console.log('Migration SQL:');
  console.log('----------------------------------------');
  console.log(sql);
  console.log('----------------------------------------');
  
  try {
    // Execute the SQL query
    const { data, error } = await supabase.rpc('pg_execute', { query_text: sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('Migration applied successfully!');
    console.log('Result:', data);
  } catch (err) {
    console.error('Error executing migration:', err.message);
    process.exit(1);
  }
}

applyMigration();